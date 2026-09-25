import { test, expect, type Page } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL || "https://saborosamente.vercel.app";
const PRODUCT = "TD24 - Espaguete à Carbonara com Ovos Mexidos e Bacon";
const SAFE_COUPON = "VOLTA84D7C9";

function observe(page: Page) {
  const problems: string[] = [];
  page.on("pageerror", (err) => problems.push(`pageerror: ${err.message}`));
  page.on("response", (res) => {
    if (res.status() >= 500) problems.push(`HTTP ${res.status()} ${res.url()}`);
  });
  return problems;
}


async function goToCheckoutThroughCart(page: Page) {
  const cartButton = page.getByRole("button", { name: "Abrir carrinho" });
  await expect(cartButton).toBeVisible();
  await cartButton.click();
  await expect(page.getByRole("heading", { name: "Seu Carrinho" })).toBeVisible();
  await expect(page.getByText(PRODUCT, { exact: false }).first()).toBeVisible();
  await page.getByRole("link", { name: "Finalizar compra" }).click();
  await page.waitForURL(/\/checkout(?:\?|$)/);
}

async function dismissWelcome(page: Page) {
  const close = page.getByRole("button", { name: "Fechar" });
  if (await close.isVisible({ timeout: 1200 }).catch(() => false)) {
    await close.click();
  }
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("saborosamente.welcome_popup_dismissed", "true");
    localStorage.removeItem("saborosamente.cart.v1");
  });
});

test("desktop: produto -> opções -> checkout -> frete -> cupom -> login", async ({ page }) => {
  const problems = observe(page);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await dismissWelcome(page);

  await expect(page).toHaveTitle(/Saborosamente/i);
  await expect(page.getByText(PRODUCT, { exact: true })).toBeVisible({ timeout: 20000 });
  await page.screenshot({ path: "test-results/01-home-desktop.png", fullPage: true });

  await page.getByText(PRODUCT, { exact: true }).click();
  await expect(page.getByRole("button", { name: "Congelada", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Pronta para consumo/i })).toBeVisible();

  await page.getByRole("button", { name: /Pronta para consumo/i }).click();
  const cutlery = page.getByLabel(/Quero garfo e faca/i);
  await expect(cutlery).toBeVisible();
  await cutlery.check();

  const addButton = page.getByRole("button", { name: /Adicionar ao (Carrinho|pedido)/i });
  await expect(addButton).toBeEnabled();
  await page.screenshot({ path: "test-results/02-produto-opcoes.png", fullPage: true });
  await addButton.click();

  await goToCheckoutThroughCart(page);
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
  await expect(
    page.locator("aside").getByText(/Pronta para consumo.*Garfo e faca/i).first(),
  ).toBeVisible();

  const entrega = page.getByRole("button", { name: "Entrega", exact: true });
  await entrega.click();

  await page.getByLabel("Nome completo").fill("Teste SaborosaMente");
  await page.getByLabel("E-mail").fill("teste-e2e@saborosamente.invalid");
  await page.getByLabel("Telefone / WhatsApp").fill("47999999999");

  const cidade = page.getByLabel("Cidade");
  const cityOptions = await cidade.locator("option").allTextContents();
  const sbs = cityOptions.find((v) => /São Bento do Sul/i.test(v));
  expect(sbs, `Cidades disponíveis: ${cityOptions.join(", ")}`).toBeTruthy();
  await cidade.selectOption({ label: sbs! });

  const bairro = page.getByLabel("Bairro");
  await expect(bairro).toBeEnabled();
  const bairroValues = await bairro.locator("option").evaluateAll((els) =>
    els.map((e) => (e as HTMLOptionElement).value).filter(Boolean),
  );
  expect(bairroValues.length).toBeGreaterThan(0);
  await bairro.selectOption(bairroValues[0]);

  await page.getByLabel(/Endereço/i).fill("Rua de Teste, 123");
  const cep = page.getByLabel(/CEP/i);
  if (await cep.isVisible().catch(() => false)) await cep.fill("89280000");

  const dataEntrega = page.getByLabel(/Data de entrega/i);
  const dataValues = await dataEntrega.locator("option").evaluateAll((els) =>
    els.map((e) => (e as HTMLOptionElement).value).filter(Boolean),
  );
  expect(dataValues.length).toBeGreaterThan(0);
  await dataEntrega.selectOption(dataValues[0]);

  const horario = page.getByLabel(/Horário de entrega/i);
  const horarioValues = await horario.locator("option").evaluateAll((els) =>
    els.map((e) => (e as HTMLOptionElement).value).filter(Boolean),
  );
  expect(horarioValues.length).toBeGreaterThan(0);
  await horario.selectOption(horarioValues[0]);

  const pix = page.getByRole("button", { name: /PIX/i }).first();
  await expect(pix).toBeVisible();

  const cupom = page.getByPlaceholder("Digite seu cupom");
  await cupom.fill(SAFE_COUPON);
  await page.getByRole("button", { name: "Aplicar", exact: true }).click();
  await expect(page.getByText(new RegExp(`Cupom.*${SAFE_COUPON}.*aplicado`, "i"))).toBeVisible({ timeout: 10000 });

  await page.screenshot({ path: "test-results/03-checkout-pre-login.png", fullPage: true });

  const submit = page.getByRole("button", { name: /Entrar para confirmar/i });
  await expect(submit).toBeEnabled();
  await submit.click();
  await page.waitForURL(/\/auth(?:\?|$)/, { timeout: 10000 });
  expect(page.url()).toContain("redirect");

  // O preenchimento deve sobreviver ao desvio para login.
  await page.goBack();
  await page.waitForURL(/\/checkout(?:\?|$)/, { timeout: 10000 });
  await expect(page.getByLabel("Nome completo")).toHaveValue("Teste SaborosaMente");
  await expect(page.getByLabel("E-mail")).toHaveValue("teste-e2e@saborosamente.invalid");
  await expect(page.getByPlaceholder("Digite seu cupom")).toHaveValue(SAFE_COUPON);
  await expect(page.getByText(new RegExp(`Cupom.*${SAFE_COUPON}.*aplicado`, "i"))).toBeVisible({ timeout: 10000 });

  expect(problems, problems.join("\n")).toEqual([]);
});

test("desktop: montar combo adiciona item ao carrinho", async ({ page }) => {
  const problems = observe(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await dismissWelcome(page);

  await page.getByRole("button", { name: /Montar Combo/i }).first().click();
  await expect(page.getByRole("heading", { name: "Monte seu Combo" })).toBeVisible({ timeout: 10000 });

  const busca = page.getByPlaceholder("Buscar marmita...");
  await busca.fill("TD24");
  const productRow = page.locator("div.rounded-2xl").filter({ hasText: PRODUCT }).first();
  await expect(productRow).toBeVisible();

  const buttons = productRow.locator("button");
  const count = await buttons.count();
  expect(count).toBeGreaterThan(0);
  await buttons.nth(count - 1).click();

  const addCombo = page.getByRole("button", { name: /Adicionar ao carrinho/i }).last();
  await expect(addCombo).toBeEnabled();
  await page.screenshot({ path: "test-results/04-combo.png", fullPage: true });
  await addCombo.click();

  await goToCheckoutThroughCart(page);
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();

  expect(problems, problems.join("\n")).toEqual([]);
});

test("mobile: catálogo, modal e checkout sem overflow horizontal", async ({ page }) => {
  const problems = observe(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await dismissWelcome(page);

  await expect(page.getByText(PRODUCT, { exact: true })).toBeVisible({ timeout: 20000 });
  let overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(2);

  await page.getByText(PRODUCT, { exact: true }).click();
  await expect(page.getByRole("button", { name: "Congelada", exact: true })).toBeVisible();
  overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await page.screenshot({ path: "test-results/05-mobile-modal.png", fullPage: true });

  await page.getByRole("button", { name: /Adicionar ao (Carrinho|pedido)/i }).click();
  await goToCheckoutThroughCart(page);
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
  const mobileSummary = page.locator("summary").filter({ hasText: "Resumo do pedido" });
  await expect(mobileSummary).toBeVisible();
  await mobileSummary.click();
  await expect(page.getByText(PRODUCT, { exact: false }).first()).toBeVisible();
  overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await page.screenshot({ path: "test-results/06-mobile-checkout.png", fullPage: true });

  expect(problems, problems.join("\n")).toEqual([]);
});

test("rotas públicas essenciais respondem sem 5xx", async ({ page }) => {
  const problems = observe(page);
  const routes = ["/", "/fale-conosco", "/indicar", "/privacidade", "/meus-pedidos", "/auth", "/carrinho"];
  for (const route of routes) {
    const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded" });
    expect(response?.status(), route).toBeLessThan(500);
    await expect(page.locator("body")).not.toBeEmpty();
  }
  expect(problems, problems.join("\n")).toEqual([]);
});
