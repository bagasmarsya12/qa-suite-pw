import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test('direct dashboard access without a session redirects to login', async ({ page }) => {
  await page.goto('/dashboard/category');
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
});

test('direct settings access without a session redirects to login', async ({ page }) => {
  await page.goto('/dashboard/setting/account');
  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
});
