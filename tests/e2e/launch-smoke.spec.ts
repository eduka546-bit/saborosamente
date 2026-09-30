import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const BASE_URL = process.env.E2E_BASE_URL || "https://saborosamente.vercel.app";
const PRODUCT = "TD24 - Espaguete à Carbonara com Ovos Mexidos e Bacon";

function observe(page: Page) {
  const problems: string[] = [];
  page.on("pageerror", (err) => problems.push(`pageerror: ${err.message}`));
  page.on("response", (res) => {
    if (res.status() >= 500) problems.push(`HTTP ${res.status()} ${res.url()}`);
  });
  return problems;
}


async function goToCheckoutThroughCart(page: Page) {
  const cartButton = page
    .getByRole("banner")
    .getByRole("button", { name: "Abrir carrinho" });
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

async function addMarmitaUnits(page: Page, units: number) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await dismissWelcome(page);
  await expect(page.getByText(PRODUCT, { exact: true })).toBeVisible({ timeout: 20000 });
  await page.getByText(PRODUCT, { exact: true }).click();
  const addButton = page.getByRole("button", { name: /Adicionar ao (Carrinho|pedido)/i });
  await expect(addButton).toBeEnabled();
  await addButton.click();

  if (units <= 1) return;
  const card = page
    .getByText(PRODUCT, { exact: true })
    .locator("xpath=ancestor::article[1]");
  const plus = card.getByRole("button", { name: "Aumentar quantidade" });
  await expect(plus).toBeVisible({ timeout: 10000 });
  for (let i = 1; i < units; i++) {
    await plus.click();
  }
}

async function chooseFirstNeighborhood(page: Page) {
  const bairro = page.getByLabel("Bairro");
  await expect(bairro).toBeEnabled();
  const values = await bairro.locator("option").evaluateAll((els) =>
    els.map((e) => (e as HTMLOptionElement).value).filter(Boolean),
  );
  expect(values.length).toBeGreaterThan(0);
  await bairro.selectOption(values[0]);
}


test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("saborosamente.welcome_popup_dismissed", "true");
    localStorage.removeItem("saborosamente.cart.v1");
  });
});

test("desktop: produto -> opções -> checkout -> frete -> login", async ({ page }) => {
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
    page.locator("aside").getByText(/Pronta para consumo.*R\$.*Garfo e faca.*R\$/i).first(),
  ).toBeVisible({ timeout: 15000 });

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

  expect(problems, problems.join("\n")).toEqual([]);
});

test("desktop: montar combo adiciona item ao carrinho", async ({ page }) => {
  const problems = observe(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await dismissWelcome(page);

  await page.getByRole("button", { name: /Montar Combo/i }).first().click();
  await expect(page.locator("h2").filter({ hasText: "Monte seu Combo" })).toBeVisible({ timeout: 10000 });

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
  await expect(mobileSummary).toContainText(/item.*pedido/i);
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


test("rotas administrativas expostas estão registradas e protegidas", async ({ page }) => {
  const problems = observe(page);
  const routes = [
    "/admin",
    "/admin/pedidos",
    "/admin/pedidos/carrinhos-abandonados",
    "/admin/clientes",
    "/admin/avaliacoes",
    "/admin/pontuacao",
    "/admin/produtos",
    "/admin/categorias",
    "/admin/bebidas",
    "/admin/relatorios/estoque",
    "/admin/config/alerta-estoque",
    "/admin/cupons",
    "/admin/campanhas",
    "/admin/financeiro",
    "/admin/financeiro/transacoes",
    "/admin/custos",
    "/admin/config/site",
    "/admin/relatorios/kpi",
    "/admin/relatorios/faturamento",
    "/admin/relatorios/vendas",
    "/admin/relatorios/sabores",
    "/admin/relatorios/fechamento-diario",
    "/admin/relatorios/clientes",
    "/admin/relatorios/comunicacao",
    "/admin/relatorios/inteligencia",
    "/admin/config/faq",
    "/admin/config/cashback-config",
    "/admin/agente",
    "/admin/config/respostas",
    "/admin/config/importar-clientes",
    "/admin/automacoes",
    "/admin/config/unidades",
    "/admin/config/horarios",
    "/admin/config/taxas",
    "/admin/config/informativo",
    "/admin/config/entregador",
    "/admin/config/parametros",
    "/admin/config/impressao",
    // Legadas: não podem voltar a quebrar mesmo que alguém tenha o link salvo.
    "/admin/financeiro/lancamentos",
    "/admin/config/excecoes",
    "/admin/config/mesas",
    "/admin/storage-cleanup",
  ];

  for (const route of routes) {
    const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded" });
    expect(response?.status(), route).toBeLessThan(500);
    await page.waitForURL(/\/admin-login(?:\?|$)/, { timeout: 10000 });
    await expect(page.getByRole("heading", { name: /admin|acesso|login/i }).first()).toBeVisible({
      timeout: 10000,
    }).catch(async () => {
      await expect(page.locator("body")).not.toBeEmpty();
    });
  }

  expect(problems, problems.join("\n")).toEqual([]);
});


test("admin autenticado: percorre rotas principais quando credenciais E2E estão configuradas", async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;

  test.skip(!email || !password, "Credenciais E2E de admin não configuradas.");

  const problems = observe(page);

  await page.goto(`${BASE_URL}/admin-login`, { waitUntil: "domcontentloaded" });
  await page.locator("#email").fill(email!);
  await page.getByLabel("Senha").fill(password!);
  await page.getByRole("button", { name: /Entrar no Painel/i }).click();
  await page.waitForURL(/\/admin(?:\/|\?|$)/, { timeout: 15000 });

  const routes = [
    "/admin",
    "/admin/pedidos",
    "/admin/clientes",
    "/admin/produtos",
    "/admin/categorias",
    "/admin/bebidas",
    "/admin/cupons",
    "/admin/campanhas",
    "/admin/financeiro",
    "/admin/custos",
    "/admin/relatorios/kpi",
    "/admin/relatorios/faturamento",
    "/admin/relatorios/vendas",
    "/admin/relatorios/estoque",
    "/admin/config/site",
    "/admin/config/faq",
    "/admin/config/cashback-config",
    "/admin/agente",
    "/admin/config/respostas",
    "/admin/automacoes",
    "/admin/config/unidades",
    "/admin/config/horarios",
    "/admin/config/taxas",
    "/admin/config/informativo",
    "/admin/config/entregador",
    "/admin/config/parametros",
    "/admin/config/impressao",
  ];

  for (const route of routes) {
    const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded" });
    expect(response?.status(), route).toBeLessThan(500);
    await expect(page).not.toHaveURL(/\/admin-login(?:\?|$)/);
    await expect(page.locator("body")).not.toBeEmpty();
  }

  expect(problems, problems.join("\n")).toEqual([]);
});


async function loginE2EAdmin(page: Page) {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  test.skip(!email || !password, "Credenciais E2E de admin não configuradas.");

  await page.goto(`${BASE_URL}/admin-login`, { waitUntil: "domcontentloaded" });
  await page.locator("#email").fill(email!);
  await page.getByLabel("Senha").fill(password!);
  await page.getByRole("button", { name: /Entrar no Painel/i }).click();
  await page.waitForURL(/\/admin(?:\/|\?|$)/, { timeout: 15000 });
}

test("segurança HTTP e SEO básico de produção", async ({ page, request }) => {
  const response = await request.get(BASE_URL);
  expect(response.status()).toBeLessThan(500);
  const headers = response.headers();

  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("SAMEORIGIN");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["strict-transport-security"]).toContain("max-age=");

  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://www.saborosamente.com/",
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /index,\s*follow/i);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /Saborosamente/i);

  const structuredData = await page.locator('script[type="application/ld+json"]').allTextContents();
  const joined = structuredData.join(" ");
  for (const city of ["São Bento do Sul", "Rio Negrinho", "Campo Alegre", "Corupá", "Mafra", "Rio Negro", "Piên"]) {
    expect(joined).toContain(city);
  }

  for (const route of ["/admin-login", "/cozinha-login", "/acesso", "/auth", "/carrinho", "/checkout", "/meus-pedidos"]) {
    await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded" });
    const robots = page.locator('meta[name="robots"]').last();
    await expect(robots, route).toHaveAttribute("content", /noindex/i);
  }
});

test("acessibilidade: home sem violações críticas ou sérias", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await dismissWelcome(page);

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const blocking = results.violations
    .filter((v) => v.impact === "critical" || v.impact === "serious")
    .map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      targets: v.nodes.slice(0, 5).map((n) => n.target),
    }));

  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
});

test("admin autenticado: CRUD temporário de cupom", async ({ page }) => {
  await loginE2EAdmin(page);
  const code = `E2E${Date.now().toString().slice(-9)}`;
  const description = "Auditoria E2E temporária";
  let created = false;

  try {
    await page.goto(`${BASE_URL}/admin/cupons`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: /Novo Cupom/i })).toBeVisible();
    await page.getByRole("button", { name: /Novo Cupom/i }).click();

    const newHeading = page.getByRole("heading", { name: "Novo Cupom" });
    await expect(newHeading).toBeVisible();
    const newForm = newHeading.locator("xpath=following-sibling::form[1]");
    await newForm.getByPlaceholder("EX: SABOR20").fill(code);
    await newForm.locator("select").selectOption("Percentual");
    await newForm.locator('input[type="number"][placeholder="0"]').fill("1");
    await newForm.getByPlaceholder("EX: Mínimo R$ 100").fill(description);
    await newForm.getByPlaceholder("Deixe vazio para sem limite").fill("1");
    await newForm.getByRole("button", { name: "Salvar Cupom" }).click();

    await expect(page.getByText(code, { exact: true })).toBeVisible({ timeout: 10000 });
    created = true;

    const codeText = page.getByText(code, { exact: true });
    const card = codeText.locator("xpath=ancestor::div[contains(@class,'relative')][1]");
    const actionButtons = card.locator("button");
    await expect(actionButtons).toHaveCount(3);

    await actionButtons.nth(0).click();
    const editHeading = page.getByRole("heading", { name: "Editar Cupom" });
    await expect(editHeading).toBeVisible();
    const editForm = editHeading.locator("xpath=following-sibling::form[1]");
    await editForm.getByPlaceholder("EX: Mínimo R$ 100").fill(`${description} editada`);
    await editForm.getByRole("button", { name: "Salvar Cupom" }).click();
    await expect(page.getByText(`${description} editada`, { exact: true })).toBeVisible({
      timeout: 10000,
    });

    const editedCard = page
      .getByText(code, { exact: true })
      .locator("xpath=ancestor::div[contains(@class,'relative')][1]");
    await editedCard.locator("button").nth(2).click();
    await expect(page.getByText(code, { exact: true })).toHaveCount(0, { timeout: 10000 });
    created = false;
  } finally {
    if (created) {
      await page.goto(`${BASE_URL}/admin/cupons`, { waitUntil: "domcontentloaded" }).catch(() => {});
      const leftover = page.getByText(code, { exact: true });
      if (await leftover.count()) {
        const card = leftover.locator("xpath=ancestor::div[contains(@class,'relative')][1]");
        const buttons = card.locator("button");
        if ((await buttons.count()) >= 3) await buttons.nth(2).click().catch(() => {});
      }
    }
  }
});


test("checkout: cupons de lançamento e primeira compra exibem regras corretas", async ({ page }) => {
  const problems = observe(page);
  await addMarmitaUnits(page, 1);
  await goToCheckoutThroughCart(page);

  const input = page.getByPlaceholder("Digite seu cupom");
  await input.fill("NOVOSITE");
  await page.getByRole("button", { name: "Aplicar", exact: true }).click();
  await expect(page.getByText(/Cupom.*NOVOSITE.*aplicado/i)).toBeVisible({ timeout: 10000 });
  await expect(page.getByText(/substitui o desconto progressivo/i)).toBeVisible();
  await expect(page.getByText(/Combos Prontos não participam/i)).toBeVisible();

  await page.getByRole("button", { name: "Remover", exact: true }).click();
  await expect(input).toBeEnabled();

  await input.fill("PRIMEIRACOMPRA");
  await page.getByRole("button", { name: "Aplicar", exact: true }).click();
  await expect(page.getByText(/Cupom.*PRIMEIRACOMPRA.*aplicado/i)).toBeVisible({ timeout: 10000 });
  await expect(page.getByText(/Exclusivo para primeira compra.*1 uso por cliente/i)).toBeVisible();

  expect(problems, problems.join("\n")).toEqual([]);
});

test("checkout: rotas regionais exibem os dias e horários comerciais corretos", async ({ page }) => {
  const problems = observe(page);
  await addMarmitaUnits(page, 5);
  await goToCheckoutThroughCart(page);
  await page.getByRole("button", { name: "Entrega", exact: true }).click();

  const cidade = page.getByLabel("Cidade");

  await cidade.selectOption({ label: "Corupá" });
  await chooseFirstNeighborhood(page);
  const datasCorupa = await page.getByLabel(/Data de entrega/i).locator("option").allTextContents();
  const opcoesCorupa = datasCorupa.filter((x) => /\d{2}\/\d{2}\/\d{4}/.test(x));
  expect(opcoesCorupa.length).toBeGreaterThan(0);
  expect(opcoesCorupa.every((x) => /Terça-feira/.test(x))).toBe(true);

  for (const cidadeSexta of ["Mafra", "Rio Negro", "Rio Negrinho", "Campo Alegre", "Piên"]) {
    await cidade.selectOption({ label: cidadeSexta });
    await chooseFirstNeighborhood(page);
    const dataRegional = page.getByLabel(/Data de entrega/i);
    const datas = await dataRegional.locator("option").allTextContents();
    const opcoes = datas.filter((x) => /\d{2}\/\d{2}\/\d{4}/.test(x));
    expect(opcoes.length, cidadeSexta).toBeGreaterThan(0);
    expect(opcoes.every((x) => /Sexta-feira/.test(x)), cidadeSexta).toBe(true);

    const valoresData = await dataRegional.locator("option").evaluateAll((els) =>
      els.map((e) => (e as HTMLOptionElement).value).filter(Boolean),
    );
    await dataRegional.selectOption(valoresData[0]);
    const horarios = await page.getByLabel(/Horário de entrega/i).locator("option").allTextContents();
    const opcoesHorario = horarios.filter((x) => /\d{2}:\d{2}/.test(x));
    expect(opcoesHorario.length, cidadeSexta).toBeGreaterThan(0);
    expect(
      opcoesHorario.every((x) => /^(13:30|14:30|15:30|16:30|17:30)/.test(x)),
      cidadeSexta,
    ).toBe(true);
  }

  expect(problems, problems.join("\n")).toEqual([]);
});

test("checkout: São Bento do Sul cobra R$ 5 de frete com 5 marmitas", async ({ page }) => {
  const problems = observe(page);
  await addMarmitaUnits(page, 5);
  await goToCheckoutThroughCart(page);
  await page.getByRole("button", { name: "Entrega", exact: true }).click();

  const cidade = page.getByLabel("Cidade");
  await cidade.selectOption({ label: "São Bento do Sul" });
  await chooseFirstNeighborhood(page);

  const resumoDesktop = page.locator("aside:visible").first();
  await expect(resumoDesktop.getByText("Entrega", { exact: true })).toBeVisible();
  await expect(resumoDesktop.getByText(/R\$\s*5,00/, { exact: true })).toBeVisible({
    timeout: 10000,
  });

  expect(problems, problems.join("\n")).toEqual([]);
});

test("cozinha autenticada: percorre todos os módulos principais", async ({ page }) => {
  const problems = observe(page);
  await loginE2EAdmin(page);
  await page.goto(`${BASE_URL}/cozinha`, { waitUntil: "domcontentloaded" });
  await expect(page).not.toHaveURL(/\/cozinha-login/);
  await expect(page.getByText("Produção e fichas técnicas")).toBeVisible({ timeout: 15000 });

  const tabs = [
    "Produção",
    "Demanda",
    "Separar hoje",
    "Lista de compras",
    "Gestão operacional",
    "Ingredientes",
    "Marmitas",
    "Cardápio Completo",
    "Estoque",
    "Embalagens",
    "Relatórios",
    "Etiquetas",
  ];
  for (const label of tabs) {
    const button = page.getByRole("button", { name: label, exact: true }).first();
    await expect(button, label).toBeVisible({ timeout: 10000 });
    await button.click();
    await page.waitForTimeout(100);
    await expect(page.getByText("Não foi possível carregar esta página")).toHaveCount(0);
  }

  const axe = await new AxeBuilder({ page }).analyze();
  const critical = axe.violations
    .filter((v) => v.impact === "critical")
    .map((v) => ({ id: v.id, help: v.help, targets: v.nodes.slice(0, 5).map((n) => n.target) }));
  expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
  expect(problems, problems.join("\n")).toEqual([]);
});

test("home: links internos e imagens próprias não estão quebrados", async ({ page, request }) => {
  const problems = observe(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await dismissWelcome(page);

  await page.evaluate(async () => {
    const step = Math.max(500, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);

  const ownImages = await page.locator("img").evaluateAll((imgs) =>
    Array.from(
      new Set(
        imgs
          .map((img) => (img as HTMLImageElement).currentSrc || (img as HTMLImageElement).src || "")
          .filter((src) =>
            src.startsWith(location.origin) ||
            src.includes("lxcgbrovdmpjatywweiv.supabase.co"),
          ),
      ),
    ),
  );
  const brokenImages: string[] = [];
  for (const src of ownImages) {
    const res = await request.get(src);
    if (res.status() >= 400) brokenImages.push(`${res.status()} ${src}`);
  }
  expect(brokenImages, brokenImages.join("\n")).toEqual([]);

  const internalLinks = await page.locator('a[href]').evaluateAll((links) => {
    const origin = location.origin;
    return Array.from(
      new Set(
        links
          .map((a) => (a as HTMLAnchorElement).href)
          .filter(Boolean)
          .filter((href) => {
            try {
              const u = new URL(href);
              return u.origin === origin && !u.hash;
            } catch {
              return false;
            }
          }),
      ),
    ).slice(0, 40);
  });

  const brokenLinks: string[] = [];
  for (const href of internalLinks) {
    const res = await request.get(href);
    if (res.status() >= 400) brokenLinks.push(`${res.status()} ${href}`);
  }
  expect(brokenLinks, brokenLinks.join("\n")).toEqual([]);
  expect(problems, problems.join("\n")).toEqual([]);
});

test("home: orçamento básico de desempenho não regrediu", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE_URL, { waitUntil: "load" });
  await dismissWelcome(page);

  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    const appResources = resources
      .filter((r) => /\.(js|css)(\?|$)/.test(r.name))
      .map((r) => ({ name: r.name, transferSize: r.transferSize, duration: r.duration }));
    return {
      domContentLoaded: nav?.domContentLoadedEventEnd ?? 0,
      load: nav?.loadEventEnd ?? 0,
      maxAssetBytes: Math.max(0, ...appResources.map((r) => r.transferSize || 0)),
      assets: appResources.length,
    };
  });

  console.log("AUDIT_PERFORMANCE", metrics);
  expect(metrics.domContentLoaded).toBeLessThan(10_000);
  expect(metrics.load).toBeLessThan(15_000);
  expect(metrics.maxAssetBytes).toBeLessThan(5_000_000);
});


test("cobertura total: rotas administrativas secundárias e perfil autenticado", async ({ page }) => {
  const problems = observe(page);
  await loginE2EAdmin(page);

  const routes = [
    "/admin/acompanhamentos",
    "/admin/cashback",
    "/admin/combos",
    "/admin/combos-prontos",
    "/admin/complementos",
    "/admin/config",
    "/admin/config/area",
    "/admin/config/bairros",
    "/admin/config/cashback",
    "/admin/config/marmita-personalizada",
    "/admin/config/mensagens",
    "/admin/config/origem",
    "/admin/cupons/novo",
    "/admin/embalagens",
    "/admin/ouvidoria",
    "/admin/pdv",
    "/admin/pedidos/acompanhamentos",
    "/admin/pedidos/complementos",
    "/admin/pedidos/itens",
    "/admin/registrar-p10",
    "/admin/relatorios",
    "/perfil",
  ];

  for (const route of routes) {
    const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded" });
    expect(response?.status(), route).toBeLessThan(500);
    await expect(page.locator("body")).not.toBeEmpty();
    if (route.startsWith("/admin")) {
      await expect(page).not.toHaveURL(/\/admin-login(?:\?|$)/);
    }
  }

  expect(problems, problems.join("\n")).toEqual([]);
});

test("cobertura total: rota pública de produto gerada pelo sitemap", async ({ page, request }) => {
  const sitemap = await request.get(`${BASE_URL}/sitemap.xml`);
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  const match = xml.match(/https:\/\/www\.saborosamente\.com\/produto\/([0-9a-f-]{36})/i);
  expect(match?.[1], "Sitemap precisa conter ao menos um produto público").toBeTruthy();

  const response = await page.goto(`${BASE_URL}/produto/${match![1]}`, {
    waitUntil: "domcontentloaded",
  });
  expect(response?.status()).toBeLessThan(500);
  await expect(page.locator("body")).not.toBeEmpty();
  await expect(page.getByText(/Página não encontrada/i)).toHaveCount(0);
});
