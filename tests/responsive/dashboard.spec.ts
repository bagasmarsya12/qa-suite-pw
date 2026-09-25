import { test, expect } from '../../fixtures/monitoring';

test('dashboard remains usable without horizontal overflow', async ({ page }) => {
  await page.goto('/dashboard/category');
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(page.getByText('Unallocated Buildings', { exact: true })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow, 'dashboard has horizontal overflow').toBeFalsy();
});
