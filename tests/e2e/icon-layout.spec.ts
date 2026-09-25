import { test, expect } from '../../fixtures/monitoring';
import { visibleBox } from '../../utils/ui';

test.describe('icon and placement audits', () => {
  test('dashboard navigation icons have visible boxes and non-empty alternative text', async ({ page }) => {
    await page.goto('/dashboard/category');
    const icons = page.locator('#sidebarMenu img');
    await expect(icons.first()).toBeVisible();
    const results = await icons.evaluateAll((elements) => elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        alt: element.getAttribute('alt') || '',
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    }));
    expect(results.length).toBeGreaterThan(0);
    expect(results.filter(({ alt, width, height }) => !alt || width <= 0 || height <= 0)).toEqual([]);
  });

  test('document icon picker keeps icons inside the modal viewport', async ({ page }) => {
    await page.goto('/dashboard/folder-document/create');
    await page.locator('.button-add-icon').click();
    const modal = page.locator('#modalIconFolder');
    await expect(modal).toBeVisible();
    const content = modal.locator('.modal-content');
    const box = await content.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    if (box && viewport) {
      expect(box.width).toBeGreaterThan(0);
      expect(box.height).toBeGreaterThan(0);
      // Validate that the modal intersects the viewport and does not sit entirely off-screen.
      expect(box.x + box.width).toBeGreaterThan(0);
      expect(box.y + box.height).toBeGreaterThan(0);
      expect(box.x).toBeLessThan(viewport.width);
      expect(box.y).toBeLessThan(viewport.height);
    }
    const choices = modal.locator('img[alt="icon"]');
    await expect(choices.first()).toBeVisible();
    for (const choice of await choices.all()) {
      await expect(choice).toBeVisible();
      const choiceBox = await visibleBox(choice);
      expect(choiceBox.width).toBeGreaterThan(0);
      expect(choiceBox.height).toBeGreaterThan(0);
    }
    await modal.getByRole('button', { name: 'Cancel', exact: true }).click();
  });
});
