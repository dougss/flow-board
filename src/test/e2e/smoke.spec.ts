import { test, expect } from "@playwright/test";

test.describe("smoke tests", () => {
  test("home page loads and redirects or shows welcome", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const url = page.url();
    const hasBoard = url.includes("/board/");
    const hasWelcome = await page
      .locator("text=Welcome to FlowBoard")
      .isVisible();
    expect(hasBoard || hasWelcome).toBe(true);
  });

  test("dashboard page loads with stats", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
    await expect(page.locator("text=Total Tasks")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("import page loads", async ({ page }) => {
    await page.goto("/import");
    await expect(page.locator("text=Import from Obsidian")).toBeVisible();
    await expect(page.locator("text=Vault Path")).toBeVisible();
  });

  test("Cmd+K opens search dialog", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.keyboard.press("Meta+k");
    await expect(
      page.locator('input[placeholder="Search tasks…"]'),
    ).toBeVisible({ timeout: 3_000 });
  });
});
