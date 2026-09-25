import { test, expect } from '../../fixtures/monitoring';
import { navigationItems } from '../../config/routes';

for (const route of navigationItems) {
  test(`read-only navigation opens ${route.label}`, async ({ page, monitor }) => {
    const response = await page.goto(route.path);
    expect(response?.status(), `${route.path} response`).toBeLessThan(400);
    await expect(page).toHaveURL(new RegExp(`${route.path.replaceAll('/', '\\/')}$`));
    await expect(page.getByText(route.expectedText, { exact: true }).first()).toBeVisible();
    expect(monitor.pageErrors, JSON.stringify(monitor.pageErrors, null, 2)).toEqual([]);
  });
}
