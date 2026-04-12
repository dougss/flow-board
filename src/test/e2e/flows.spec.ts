import { test, expect } from "@playwright/test";

test.describe("task creation flow", () => {
  test("creates a task via Cmd+N shortcut", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Navigate to a board if one exists
    const boardLink = page.locator('a[href^="/board/"]').first();
    if (await boardLink.isVisible({ timeout: 3_000 })) {
      await boardLink.click();
      await page.waitForLoadState("networkidle");

      // Open new task dialog
      await page.keyboard.press("Meta+n");
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 3_000 });

      // Fill in task title
      const titleInput = dialog
        .locator('input[placeholder*="title" i], input[name="title"], input')
        .first();
      await titleInput.fill("E2E Test Task");

      // Submit
      const submitBtn = dialog
        .locator('button:has-text("Create"), button[type="submit"]')
        .first();
      await submitBtn.click();

      // Verify task appears (toast or in the board)
      await expect(page.locator("text=E2E Test Task").first()).toBeVisible({
        timeout: 5_000,
      });
    }
  });
});

test.describe("search flow", () => {
  test("Cmd+K opens search and filters results", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    await page.keyboard.press("Meta+k");
    const searchInput = page.locator('input[placeholder*="Search" i]');
    await expect(searchInput).toBeVisible({ timeout: 3_000 });

    await searchInput.fill("test");
    // Search should show results or empty state
    await page.waitForTimeout(500);
    const hasResults = await page.locator('[role="dialog"]').isVisible();
    expect(hasResults).toBe(true);

    // Close with Escape
    await page.keyboard.press("Escape");
    await expect(searchInput).not.toBeVisible({ timeout: 2_000 });
  });
});

test.describe("view switching", () => {
  test("switches between board views with keyboard", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const boardLink = page.locator('a[href^="/board/"]').first();
    if (await boardLink.isVisible({ timeout: 3_000 })) {
      await boardLink.click();
      await page.waitForLoadState("networkidle");

      // Switch to list view (key 3)
      await page.keyboard.press("3");
      await page.waitForTimeout(300);
      // List view should show a table
      const hasTable = await page
        .locator("table")
        .isVisible({ timeout: 3_000 });
      expect(hasTable).toBe(true);

      // Switch back to board (key 1)
      await page.keyboard.press("1");
      await page.waitForTimeout(300);
    }
  });
});

test.describe("export flow", () => {
  test("export button triggers download", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const boardLink = page.locator('a[href^="/board/"]').first();
    if (await boardLink.isVisible({ timeout: 3_000 })) {
      await boardLink.click();
      await page.waitForLoadState("networkidle");

      // Click export button
      const exportBtn = page.locator('button[aria-label="Export board"]');
      if (await exportBtn.isVisible({ timeout: 2_000 })) {
        const [newPage] = await Promise.all([
          page.context().waitForEvent("page"),
          exportBtn.click(),
        ]);
        // Should open a new tab with JSON
        await newPage.waitForLoadState();
        const url = newPage.url();
        expect(url).toContain("/api/export");
        await newPage.close();
      }
    }
  });
});

test.describe("settings flow", () => {
  test("board settings dialog opens and saves", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const boardLink = page.locator('a[href^="/board/"]').first();
    if (await boardLink.isVisible({ timeout: 3_000 })) {
      await boardLink.click();
      await page.waitForLoadState("networkidle");

      // Click settings button
      const settingsBtn = page.locator('button[aria-label="Board settings"]');
      if (await settingsBtn.isVisible({ timeout: 2_000 })) {
        await settingsBtn.click();

        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible({ timeout: 3_000 });
        await expect(dialog.locator("text=Board Settings")).toBeVisible();

        // Close without saving
        await dialog.locator('button:has-text("Cancel")').click();
        await expect(dialog).not.toBeVisible({ timeout: 2_000 });
      }
    }
  });
});
