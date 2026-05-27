import { test, expect } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

test.describe("Auth flow", () => {
  const email = `test+${Date.now()}@flowforge.test`;
  const password = "Passw0rd!FlowForge";

  test("sign up → lands on dashboard", async ({ page }) => {
    await page.goto(`${BASE}/signup`);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /create account/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/welcome/i)).toBeVisible();
  });

  test("log out → redirected to login", async ({ page }) => {
    await page.goto(`${BASE}/dashboard`);
    // Should redirect to login when not authenticated
    await expect(page).toHaveURL(/\/login/);
  });

  test("log in with valid credentials", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("log in with invalid credentials shows error", async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.getByLabel("Email").fill("nobody@nowhere.invalid");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("reset password page renders", async ({ page }) => {
    await page.goto(`${BASE}/reset`);
    await expect(page.getByRole("heading", { name: /reset/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });
});
