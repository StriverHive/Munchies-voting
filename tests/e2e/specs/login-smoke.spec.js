const { test, expect } = require("@playwright/test");

test.describe("Public auth shell (E2E smoke)", () => {
  test("login route loads branded experience", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/Munchies Voting/i);
    await expect(
      page.getByText(/sign in to access your voting dashboard/i)
    ).toBeVisible({ timeout: 60000 });
  });

  test("register route loads", async ({ page }) => {
    await page.goto("/register");
    // Heading is unique; getByText would also match the bottom "Create Account" button
    await expect(
      page.getByRole("heading", { name: /create account/i })
    ).toBeVisible({ timeout: 60000 });
  });
});
