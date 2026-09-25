import { test, expect } from '../../fixtures/monitoring';
import { completeBuildingManagementRoutes } from '../../config/route-matrix';
import { expectNoHorizontalOverflow } from '../../utils/ui';

test.describe('complete route status and shell matrix', () => {
  for (const route of completeBuildingManagementRoutes) {
    test(`route returns a usable shell: ${route}`, async ({ page, monitor }) => {
      const response = await page.goto(route);
      expect(response?.status(), `${route} response`).toBeLessThan(400);
      await expect(page.locator('body')).not.toBeEmpty();
      await expect(page.locator('#sidebarMenu, nav, [role="navigation"]').first()).toBeVisible();
      await expectNoHorizontalOverflow(page);
      expect(monitor.pageErrors, JSON.stringify({ route, pageErrors: monitor.pageErrors }, null, 2)).toEqual([]);
    });
  }
});
