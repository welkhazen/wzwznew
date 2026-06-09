import { defineConfig, devices } from "@playwright/test";

// Smoke-test scaffold for production-critical user flows. CI runs against a
// preview deploy URL (set via E2E_BASE_URL); local runs default to localhost.
//
// Run: `E2E_BASE_URL=https://<preview>.vercel.app npx playwright test`
// Or:  `npx playwright test` (uses Vite dev server)
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:8080",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:8080",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
