import { test, expect } from '../../fixtures/monitoring';
import { expectNoHorizontalOverflow } from '../../utils/ui';

const representativeRoutes = [
  '/dashboard/category',
  '/dashboard/tenant',
  '/dashboard/message',
  '/dashboard/damage-report',
  '/dashboard/folder-document',
  '/dashboard/service-provider',
  '/dashboard/data',
  '/dashboard/setting',
] as const;

test.describe('navigation and state resilience', () => {
  for (const route of representativeRoutes) {
    test(`deep-link survives reload without horizontal overflow: ${route}`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status(), `${route} response`).toBeLessThan(400);
      await expect(page.locator('body')).not.toBeEmpty();
      await page.reload();
      await expect(page.locator('body')).not.toBeEmpty();
      await expectNoHorizontalOverflow(page);
    });
  }

  test('back and forward navigation preserve module destinations', async ({ page }) => {
    await page.goto('/dashboard/category');
    await page.goto('/dashboard/tenant');
    await expect(page).toHaveURL(/\/dashboard\/tenant$/);

    await page.goBack();
    await expect(page).toHaveURL(/\/dashboard\/category$/);
    await expect(page.getByText('Unallocated Buildings', { exact: true })).toBeVisible();

    await page.goForward();
    await expect(page).toHaveURL(/\/dashboard\/tenant$/);
    await expect(page.locator('input[placeholder="Search"]:visible')).toBeVisible();
  });

  test('multi-step building form keeps the current step after a safe reload', async ({ page }) => {
    await page.goto('/dashboard/category/building/create');
    const title = page.locator('input[placeholder="e.g. Building 1"]');
    await title.fill('QA_RESILIENCE_BUILDING');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByText('2 of 2 steps', { exact: true })).toBeVisible();

    await page.reload();
    await expect(page.locator('body')).not.toBeEmpty();
    await expectNoHorizontalOverflow(page);
  });
});
