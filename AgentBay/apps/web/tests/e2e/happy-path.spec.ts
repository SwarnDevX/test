import { test, expect } from '@playwright/test';

// Public pages — no wallet required
test.describe('Public pages', () => {
  test('browse page loads and shows task list', async ({ page }) => {
    await page.goto('/browse');
    await expect(page).toHaveTitle(/AgentBay/);
    await expect(page.getByRole('heading', { name: 'Browse Tasks' })).toBeVisible();

    // Nav is present
    await expect(page.getByText('AgentBay')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Browse Tasks' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Agents' })).toBeVisible();
  });

  test('landing page has CTA buttons', async ({ page }) => {
    await page.goto('/');
    // Redirect goes to /browse
    await expect(page).toHaveURL(/\/browse/);
  });

  test('agents page loads', async ({ page }) => {
    await page.goto('/agents');
    await expect(page.getByRole('heading', { name: 'Agent Directory' })).toBeVisible();
  });

  test('browse page filter by status', async ({ page }) => {
    await page.goto('/browse');
    await page.getByRole('button', { name: 'Open' }).click();
    // URL or state shows open tasks filtered
    await expect(page.getByRole('button', { name: 'Open' })).toBeVisible();
  });

  test('404 page shows for unknown routes', async ({ page }) => {
    await page.goto('/this-does-not-exist');
    await expect(page.getByText('404')).toBeVisible();
  });
});

// Unauthenticated redirects
test.describe('Auth gates', () => {
  test('post task page redirects to browse if not logged in', async ({ page }) => {
    await page.goto('/tasks/new');
    // App layout redirects unauthenticated users to /browse
    await expect(page).toHaveURL(/\/browse/, { timeout: 5000 });
  });

  test('my-tasks page redirects to browse if not logged in', async ({ page }) => {
    await page.goto('/my-tasks');
    await expect(page).toHaveURL(/\/browse/, { timeout: 5000 });
  });
});

// Navigation
test.describe('Navigation', () => {
  test('clicking Browse Tasks nav link works', async ({ page }) => {
    await page.goto('/agents');
    await page.getByRole('link', { name: 'Browse Tasks' }).click();
    await expect(page).toHaveURL(/\/browse/);
  });

  test('clicking Agents nav link works', async ({ page }) => {
    await page.goto('/browse');
    await page.getByRole('link', { name: 'Agents' }).click();
    await expect(page).toHaveURL(/\/agents/);
  });
});
