import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import os from "os";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

test.describe("Knowledge bases", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test("knowledge page renders", async ({ page }) => {
    await page.goto(`${BASE}/knowledge`);
    await expect(page.getByRole("heading", { name: /knowledge/i })).toBeVisible();
  });

  test("create knowledge base", async ({ page }) => {
    await page.goto(`${BASE}/knowledge`);
    await page.getByRole("button", { name: /new knowledge base/i }).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(/name/i).fill("E2E Test KB");
    await dialog.getByRole("button", { name: /create/i }).click();

    await expect(page.getByText("E2E Test KB")).toBeVisible({ timeout: 5000 });
  });

  test("upload document to knowledge base", async ({ page }) => {
    // Create a small temp text file
    const tmpFile = path.join(os.tmpdir(), "flowforge-e2e-test.txt");
    fs.writeFileSync(tmpFile, "FlowForge is a visual workflow automation platform.");

    await page.goto(`${BASE}/knowledge`);

    // Open first KB or skip if none
    const kbCards = page.locator("[data-testid='knowledge-base-card']");
    const count = await kbCards.count();
    if (count === 0) {
      test.skip();
      return;
    }
    await kbCards.first().click();

    // Upload file
    const uploadInput = page.locator('input[type="file"]');
    await uploadInput.setInputFiles(tmpFile);

    // Wait for processing
    await expect(page.getByText(/processing|indexed/i)).toBeVisible({ timeout: 30000 });

    fs.unlinkSync(tmpFile);
  });

  test("test retrieval returns results", async ({ page }) => {
    await page.goto(`${BASE}/knowledge`);

    const kbCards = page.locator("[data-testid='knowledge-base-card']");
    const count = await kbCards.count();
    if (count === 0) {
      test.skip();
      return;
    }
    await kbCards.first().click();

    // Use retrieval test input
    const testInput = page.getByPlaceholder(/test retrieval|search/i);
    if (!(await testInput.isVisible())) {
      test.skip();
      return;
    }

    await testInput.fill("What is FlowForge?");
    await page.getByRole("button", { name: /test/i }).click();

    await expect(page.locator("[data-testid='retrieval-results']")).toBeVisible({
      timeout: 15000,
    });
  });
});
