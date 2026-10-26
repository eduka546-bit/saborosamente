import { expect, test, type Page } from "@playwright/test";

const productDetail = /^Abrir detalhes de /;

async function dismissInterruptions(page: Page) {
  const raffle = page.getByRole("button", { name: "Fechar convite do sorteio" });
  if (await raffle.isVisible({ timeout: 1_500 }).catch(() => false)) await raffle.click();

  const welcome = page.getByRole("button", { name: "Fechar", exact: true });
  if (await welcome.isVisible({ timeout: 700 }).catch(() => false)) await welcome.click();
}

async function openHome(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("saborosamente.welcome_popup_dismissed", "true");
    localStorage.removeItem("saborosamente.cart.v1");
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await dismissInterruptions(page);
  await expect(page.getByRole("button", { name: "Abrir carrinho" })).toBeVisible();
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "A tela mobile não pode exigir rolagem horizontal").toBeLessThanOrEqual(2);
}

test("mobile: home, resumos e retorno dos modais", async ({ page }) => {
  await openHome(page);
  await expectNoHorizontalOverflow(page);

  const summary = page.getByRole("button", { name: "Ver resumo", exact: true }).first();
  await summary.click();
  await expect(page.getByText("Clique aqui para mais detalhes").first()).toBeVisible();

  await page.getByText("Áreas de Entrega", { exact: true }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expectNoHorizontalOverflow(page);
});

test("mobile: escolhas de pedido abrem e fecham sem sair da página", async ({ page }) => {
  await openHome(page);

  await page.getByRole("button", { name: "Ver Combos", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Combos Prontos" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Combos Prontos" })).toBeHidden();

  await page.getByRole("button", { name: "Montar Combo", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Monte seu Combo" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Monte seu Combo" })).toBeHidden();
  await expect(page).toHaveURL(/\/$/);
  await expectNoHorizontalOverflow(page);
});

test("mobile: detalhe do produto mantém controles acessíveis e fecha por Escape", async ({ page }) => {
  await openHome(page);
  const details = page.getByRole("button", { name: productDetail }).first();
  await expect(details).toBeVisible({ timeout: 20_000 });
  await details.click();

  await expect(page.getByRole("button", { name: "Fechar detalhes e voltar ao catálogo" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Escolha o tamanho da marmita" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Adicionar ao (Carrinho|pedido)/i })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Fechar detalhes e voltar ao catálogo" })).toBeHidden();
  await expectNoHorizontalOverflow(page);
});
