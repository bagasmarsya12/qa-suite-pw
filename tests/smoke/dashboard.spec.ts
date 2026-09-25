import { test, expect } from '../../fixtures/monitoring';
import { Navigation } from '../../pages/Navigation';

test('authenticated dashboard loads with primary navigation', async ({ page, monitor }) => {
  const response = await page.goto('/dashboard/category');
  expect(response?.status()).toBeLessThan(400);
  await new Navigation(page).expectVisible();
  await expect(page.getByRole('link', { name: /Overview/i }).first()).toBeVisible();
  await expect(page.getByText('Unallocated Buildings', { exact: true })).toBeVisible();
  expect(monitor.pageErrors, JSON.stringify(monitor.pageErrors, null, 2)).toEqual([]);
});
