const { test, expect } = require("@playwright/test");

test.describe("Public vote page (E2E smoke)", () => {
  test("vote route renders portal shell", async ({ page }) => {
    await page.goto("/vote/000000000000000000000000");
    await expect(
      page.getByRole("heading", { name: /employee voting portal/i })
    ).toBeVisible({ timeout: 60000 });
    await expect(page.getByLabel(/employee id/i)).toBeVisible();
  });
});
