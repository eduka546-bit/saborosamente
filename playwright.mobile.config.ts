import { defineConfig, devices } from "@playwright/test";

// Auditoria visual e funcional repetível de telas móveis. O uso de perfis
// distintos evita validar apenas uma largura de viewport.
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  expect: { timeout: 12_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL || "https://saborosamente.com",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  reporter: [["list"], ["html", { outputFolder: "playwright-report/mobile", open: "never" }]],
  projects: [
    { name: "android-chrome", use: { ...devices["Pixel 7"] } },
    { name: "iphone-webkit", use: { ...devices["iPhone 13"] } },
  ],
});
