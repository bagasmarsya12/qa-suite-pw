import { test, expect } from '../../fixtures/monitoring';

test('dashboard navigation visual baseline', async ({ page }) => {
  await page.goto('/dashboard/category');
  await expect(page.getByRole('navigation')).toHaveScreenshot('dashboard-navigation.png', {
    animations: 'disabled',
  });
});

test('dashboard header visual baseline', async ({ page }) => {
  await page.goto('/dashboard/category');
  await expect(page.getByRole('banner')).toHaveScreenshot('dashboard-header.png', {
    animations: 'disabled',
  });
});
