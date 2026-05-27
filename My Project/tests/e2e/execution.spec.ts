import { test, expect, Page } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

test.describe("Workflow execution", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  async function openWorkflowWithTrigger(page: Page) {
    await page.goto(`${BASE}/workflows`);
    await page.getByRole("button", { name: /new workflow/i }).click();
    await expect(page.locator(".react-flow")).toBeVisible();

    const library = page.locator("[data-testid='node-library-panel']");
    await library.getByText("Manual Trigger").first().click();
    await page.getByRole("button", { name: /save/i }).click();
    await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 5000 });
  }

  test("run button triggers execution and shows logs drawer", async ({ page }) => {
    await openWorkflowWithTrigger(page);

    await page.getByRole("button", { name: /run/i }).click();

    // Execution logs drawer should appear
    await expect(page.locator("[data-testid='execution-logs-drawer']")).toBeVisible({
      timeout: 10000,
    });
  });

  test("node status ring changes to success after run", async ({ page }) => {
    await openWorkflowWithTrigger(page);

    await page.getByRole("button", { name: /run/i }).click();

    // Wait for execution to complete
    await expect(page.locator("[data-testid='execution-status-success']")).toBeVisible({
      timeout: 30000,
    });
  });

  test("executions list page shows history", async ({ page }) => {
    await page.goto(`${BASE}/executions`);
    await expect(page.getByRole("heading", { name: /executions/i })).toBeVisible();
    // Table should render even if empty
    await expect(page.locator("table, [data-testid='empty-state']")).toBeVisible();
  });

  test("failed node shows error in logs", async ({ page }) => {
    await page.goto(`${BASE}/workflows`);
    await page.getByRole("button", { name: /new workflow/i }).click();
    await expect(page.locator(".react-flow")).toBeVisible();

    // Add HTTP Request with invalid URL to force failure
    const library = page.locator("[data-testid='node-library-panel']");
    await library.getByText("Manual Trigger").first().click();
    await library.getByText("HTTP Request").first().click();

    // Configure HTTP node with bad URL
    await page.locator(".react-flow__node").last().click();
    const inspector = page.locator("[data-testid='inspector-panel']");
    await inspector.getByLabel(/url/i).fill("http://this.domain.does.not.exist.invalid/404");

    // Connect manual trigger → HTTP request
    const handles = page.locator(".react-flow__handle");
    const source = handles.first();
    const target = handles.nth(2);
    const sb = await source.boundingBox();
    const tb = await target.boundingBox();
    if (sb && tb) {
      await page.mouse.move(sb.x + sb.width / 2, sb.y + sb.height / 2);
      await page.mouse.down();
      await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2);
      await page.mouse.up();
    }

    await page.getByRole("button", { name: /save/i }).click();
    await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: /run/i }).click();

    // Eventually some error indication appears
    await expect(
      page.locator("[data-testid='execution-logs-drawer']").getByText(/error/i),
    ).toBeVisible({ timeout: 30000 });
  });
});
