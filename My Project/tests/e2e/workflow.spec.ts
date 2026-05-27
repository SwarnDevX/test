import { test, expect, Page } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

async function loginAs(page: Page, email: string, password: string) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("Workflow editor", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test("create new workflow → editor opens", async ({ page }) => {
    await page.goto(`${BASE}/workflows`);
    await page.getByRole("button", { name: /new workflow/i }).click();

    await expect(page).toHaveURL(/\/workflows\/.+/);
    await expect(page.locator(".react-flow")).toBeVisible();
  });

  test("drag node from library to canvas", async ({ page }) => {
    await page.goto(`${BASE}/workflows`);
    await page.getByRole("button", { name: /new workflow/i }).click();
    await expect(page.locator(".react-flow")).toBeVisible();

    // Open node library panel
    const nodeLibrary = page.locator("[data-testid='node-library-panel']");
    await expect(nodeLibrary).toBeVisible();

    // Find a trigger node and drag it
    const triggerNode = nodeLibrary.getByText("Manual Trigger").first();
    const canvas = page.locator(".react-flow__pane");

    const canvasBounds = await canvas.boundingBox();
    if (!canvasBounds) throw new Error("canvas not found");

    await triggerNode.dragTo(canvas, {
      targetPosition: {
        x: canvasBounds.width / 2,
        y: canvasBounds.height / 2,
      },
    });

    // A node should now appear on canvas
    await expect(page.locator(".react-flow__node")).toHaveCount(1);
  });

  test("connect two nodes", async ({ page }) => {
    await page.goto(`${BASE}/workflows`);
    await page.getByRole("button", { name: /new workflow/i }).click();
    await expect(page.locator(".react-flow")).toBeVisible();

    // Add two nodes via click-to-add in library
    const library = page.locator("[data-testid='node-library-panel']");
    await library.getByText("Manual Trigger").first().click();
    await library.getByText("If / Else").first().click();

    await expect(page.locator(".react-flow__node")).toHaveCount(2);

    // Connect output handle of first to input of second
    const handles = page.locator(".react-flow__handle");
    const source = handles.first();
    const target = handles.last();

    const sourceBounds = await source.boundingBox();
    const targetBounds = await target.boundingBox();
    if (!sourceBounds || !targetBounds) throw new Error("handles not found");

    await page.mouse.move(
      sourceBounds.x + sourceBounds.width / 2,
      sourceBounds.y + sourceBounds.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      targetBounds.x + targetBounds.width / 2,
      targetBounds.y + targetBounds.height / 2,
    );
    await page.mouse.up();

    await expect(page.locator(".react-flow__edge")).toHaveCount(1);
  });

  test("save workflow", async ({ page }) => {
    await page.goto(`${BASE}/workflows`);
    await page.getByRole("button", { name: /new workflow/i }).click();

    // Add a node
    const library = page.locator("[data-testid='node-library-panel']");
    await library.getByText("Manual Trigger").first().click();

    // Click save
    await page.getByRole("button", { name: /save/i }).click();
    await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 5000 });
  });

  test("undo / redo nodes", async ({ page }) => {
    await page.goto(`${BASE}/workflows`);
    await page.getByRole("button", { name: /new workflow/i }).click();

    const library = page.locator("[data-testid='node-library-panel']");
    await library.getByText("Manual Trigger").first().click();
    await expect(page.locator(".react-flow__node")).toHaveCount(1);

    // Undo
    await page.keyboard.press("Meta+z");
    await expect(page.locator(".react-flow__node")).toHaveCount(0);

    // Redo
    await page.keyboard.press("Meta+Shift+z");
    await expect(page.locator(".react-flow__node")).toHaveCount(1);
  });

  test("workflow list shows created workflow", async ({ page }) => {
    await page.goto(`${BASE}/workflows`);
    const count = await page.locator("[data-testid='workflow-card']").count();

    await page.getByRole("button", { name: /new workflow/i }).click();
    await page.getByRole("button", { name: /save/i }).click();
    await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 5000 });

    await page.goto(`${BASE}/workflows`);
    await expect(page.locator("[data-testid='workflow-card']")).toHaveCount(count + 1);
  });
});
