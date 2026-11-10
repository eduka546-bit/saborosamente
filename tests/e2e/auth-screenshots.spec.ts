import { test, expect } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL || "https://saborosamente.com";

async function capture(page: import("@playwright/test").Page, name: string) {
  const card = page.locator("main .w-full.max-w-md").first();
  await expect(card).toBeVisible({ timeout: 20000 });
  await card.screenshot({ path: `test-results/${name}.png`, animations: "disabled" });
}

test("capturas reais: login, aviso de conta antiga e recuperação em desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/auth`, { waitUntil: "domcontentloaded" });
  await capture(page, "01-login-sem-email-desktop");
  await page.getByLabel("E-mail").fill("cliente-exemplo@exemplo.com");
  await expect(page.getByText("Já tinha cadastro no site antigo?")).toBeVisible({ timeout: 15000 });
  await capture(page, "02-passo-a-passo-recuperacao-desktop");
  await page.getByRole("button", { name: "Cadastre-se clicando aqui" }).click();
  await expect(page.getByRole("heading", { name: "Criar nova conta" })).toBeVisible();
  await capture(page, "03-cadastro-aviso-conta-antiga-desktop");
});

test("capturas reais: recuperação em mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE_URL}/auth`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("E-mail").fill("cliente-exemplo@exemplo.com");
  await expect(page.getByText("Já tinha cadastro no site antigo?")).toBeVisible({ timeout: 15000 });
  await capture(page, "04-passo-a-passo-recuperacao-mobile");
});
