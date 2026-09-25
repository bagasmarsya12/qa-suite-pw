import { test, expect } from '../../fixtures/monitoring';
import { expectNoHorizontalOverflow } from '../../utils/ui';

const formRoutes = [
  ['/dashboard/category/building/create', 'Next'],
  ['/dashboard/damage-report/create', 'Save Draft'],
  ['/dashboard/folder-document/create', 'Save Draft'],
  ['/dashboard/service-provider/create', 'Save Draft'],
] as const;

for (const [path, action] of formRoutes) {
  test(`form placement remains within viewport: ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('main, [role="main"], body').first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    const actionButton = page.getByRole('button', { name: action, exact: true }).last();
    await expect(actionButton).toBeVisible();
    const buttonBox = await actionButton.boundingBox();
    expect(buttonBox).not.toBeNull();
    if (viewport && buttonBox) {
      expect(buttonBox.x).toBeGreaterThanOrEqual(0);
      expect(buttonBox.x + buttonBox.width).toBeLessThanOrEqual(viewport.width + 1);
    }
  });
}
