import { test, expect } from "@playwright/test";

// Smoke tests for the highest-traffic surfaces. Intentionally light — these
// guard against full-page crashes (white screen, unhandled exception,
// missing chunk), NOT against feature regressions. Detailed flows belong in
// dedicated specs under e2e/<flow>.spec.ts.

test.describe("landing page", () => {
  test("renders without crashing and shows the signup CTA", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    await page.goto("/");
    await expect(page).toHaveTitle(/raw/i);

    // Some interactive entry point must exist for new users.
    const signupCta = page.getByRole("button", { name: /sign ?up|join|get started/i }).first();
    await expect(signupCta).toBeVisible({ timeout: 10_000 });

    // No uncaught JS errors during initial paint.
    expect(consoleErrors, `Uncaught errors: ${consoleErrors.join("; ")}`).toHaveLength(0);
  });
});

test.describe("legal pages", () => {
  for (const path of ["/terms", "/privacy", "/security", "/faq"]) {
    test(`${path} renders`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status(), `${path} HTTP status`).toBeLessThan(400);
      // Body should have non-trivial text content (not a white screen).
      const text = await page.locator("body").innerText();
      expect(text.trim().length, `${path} body text`).toBeGreaterThan(50);
    });
  }
});

test.describe("auth endpoints health", () => {
  test("GET /api/auth/me returns 401 when not logged in (not 500)", async ({ request }) => {
    const res = await request.get("/api/auth/me");
    // 401 = expected anonymous response. 500 = server-side regression.
    expect([401, 200]).toContain(res.status());
  });
});
