import { test, expect } from '../../fixtures/monitoring';
import { expectNoHorizontalOverflow } from '../../utils/ui';

test('building folder exposes announcement composer controls without publishing', async ({ page, monitor }) => {
  await page.goto('/dashboard/category/building/121/folder');
  await page.getByText('Add', { exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\/category\/building\/121\/folder\/141\/create$/);
  await expect(page.getByText('New Announcements', { exact: true }).last()).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('input[type="file"][name="media"]')).toBeVisible();
  await expect(page.getByText('Broadcast', { exact: true })).toBeVisible();
  await expect(page.getByText('Description', { exact: true })).toBeVisible();
  await expect(page.getByText('Link', { exact: true })).toBeVisible();
  await expect(page.getByText('Price', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Publish|Schedule publication/i })).toBeDisabled();
  await expectNoHorizontalOverflow(page);
  expect(monitor.pageErrors, JSON.stringify(monitor.pageErrors, null, 2)).toEqual([]);
});
