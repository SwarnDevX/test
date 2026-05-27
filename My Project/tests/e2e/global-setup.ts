import { test as setup, expect } from "@playwright/test";
import path from "path";

const AUTH_FILE = path.join(__dirname, "../.auth/user.json");
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const E2E_EMAIL = process.env.E2E_EMAIL ?? "e2e@flowforge.test";
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? "Passw0rd!FlowForge";

setup("authenticate", async ({ page }) => {
  await page.goto(`${BASE}/signup`);

  // Try to sign up; if already exists, fall through to login
  await page.getByLabel("Email").fill(E2E_EMAIL);
  await page.getByLabel("Password").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: /create account/i }).click();

  // Wait for redirect — either dashboard (new user) or error (existing)
  await page.waitForURL(/\/(dashboard|signup)/, { timeout: 15_000 });

  if (page.url().includes("signup")) {
    // Account already exists — log in instead
    await page.goto(`${BASE}/login`);
    await page.getByLabel("Email").fill(E2E_EMAIL);
    await page.getByLabel("Password").fill(E2E_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  }

  // Save the browser auth state (cookies + localStorage)
  await page.context().storageState({ path: AUTH_FILE });
});
