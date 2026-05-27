import { test, expect } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

test.describe("Deployments", () => {
  test.use({ storageState: "tests/.auth/user.json" });

  test("deployments page renders", async ({ page }) => {
    await page.goto(`${BASE}/deployments`);
    await expect(page.getByRole("heading", { name: /deployments/i })).toBeVisible();
  });

  test("create chatbot deployment from workflow", async ({ page }) => {
    // First create a workflow
    await page.goto(`${BASE}/workflows`);
    await page.getByRole("button", { name: /new workflow/i }).click();
    await expect(page.locator(".react-flow")).toBeVisible();

    const library = page.locator("[data-testid='node-library-panel']");
    await library.getByText("Chat Message").first().click();
    await page.getByRole("button", { name: /save/i }).click();
    await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 5000 });

    // Deploy as chatbot
    await page.getByRole("button", { name: /deploy/i }).click();
    const deployDialog = page.getByRole("dialog");
    await expect(deployDialog).toBeVisible();
    await deployDialog.getByRole("option", { name: /chatbot/i }).click();
    await deployDialog.getByRole("button", { name: /create deployment/i }).click();

    // Redirected to deployments
    await expect(page).toHaveURL(/\/deployments\/.+/);
    await expect(page.getByText(/embed/i)).toBeVisible({ timeout: 10000 });
  });

  test("deployment embed snippet is shown", async ({ page }) => {
    await page.goto(`${BASE}/deployments`);
    const deploymentCards = page.locator("[data-testid='deployment-card']");
    const count = await deploymentCards.count();

    if (count === 0) {
      test.skip();
      return;
    }

    await deploymentCards.first().click();
    await expect(page.getByText(/<script/i)).toBeVisible();
  });
});
