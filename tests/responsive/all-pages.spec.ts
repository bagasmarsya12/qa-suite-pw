import { test, expect } from '../../fixtures/monitoring';
import { completeBuildingManagementRoutes } from '../../config/route-matrix';
import { expectNoHorizontalOverflow } from '../../utils/ui';

for (const path of completeBuildingManagementRoutes) {
  test(`mobile layout has no horizontal overflow: ${path}`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status(), `${path} response`).toBeLessThan(400);
    await expect(page.locator('body')).not.toBeEmpty();
    await expectNoHorizontalOverflow(page);
  });
}
