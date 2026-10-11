import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { fixtureUrl } from "./fixture-data";

export default defineConfig({
  testDir: fileURLToPath(new URL(".", import.meta.url)),
  testMatch: "**/*.pw.ts",
  outputDir: "../test-results",
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  reporter: "list",
  expect: { timeout: 10_000 },
  use: {
    baseURL: fixtureUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "bun e2e/fixture-server.ts",
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    url: `${fixtureUrl}/api/estado`,
    reuseExistingServer: false,
    gracefulShutdown: { signal: "SIGTERM", timeout: 5_000 },
    timeout: 20_000,
  },
});
