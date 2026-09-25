import { test, expect } from '../../fixtures/monitoring';

for (const route of ['/dashboard/category', '/dashboard/tenant', '/dashboard/message'] as const) {
  test(`critical shell renders under delayed network: ${route}`, async ({ page }) => {
    await page.route('**/*', async (requestRoute) => {
      await new Promise((resolve) => setTimeout(resolve, 150));
      await requestRoute.continue();
    });
    const response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    expect(response?.status(), `${route} response`).toBeLessThan(400);
    await expect(page.locator('body')).not.toBeEmpty({ timeout: 20_000 });
    await expect(page.locator('#sidebarMenu')).toBeVisible({ timeout: 20_000 });
  });
}
