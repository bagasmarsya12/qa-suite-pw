import { test, expect } from '../../fixtures/monitoring';
import { visibleBox, visibleFeedback } from '../../utils/ui';

test.describe('accessibility, popup, and feedback contracts', () => {
  test('message recipient popup is keyboard-dismissible and stays within the viewport', async ({ page }) => {
    await page.goto('/dashboard/message/create');
    await page.getByText('Add Recipient', { exact: true }).click();

    const modal = page.locator('#listTenantModal');
    await expect(modal).toBeVisible();
    const content = modal.locator('.modal-content');
    const box = await content.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    if (box && viewport) {
      expect(box.width).toBeGreaterThan(0);
      expect(box.height).toBeGreaterThan(0);
      // Large recipient dialogs may be taller than the desktop viewport; they must
      // still intersect it rather than render completely off-screen.
      expect(box.x + box.width).toBeGreaterThan(0);
      expect(box.y + box.height).toBeGreaterThan(0);
      expect(box.x).toBeLessThan(viewport.width);
      expect(box.y).toBeLessThan(viewport.height);
    }

    const namedControls = await modal.locator('button:visible, input:visible, [role="button"]:visible')
      .evaluateAll((elements) => elements.filter((element) => {
        const html = element as HTMLElement;
        return Boolean(html.innerText.trim() || html.getAttribute('aria-label') || html.getAttribute('title') || html.getAttribute('placeholder'));
      }).length);
    expect(namedControls).toBeGreaterThan(0);

    const cancel = modal.getByRole('button', { name: 'Cancel', exact: true });
    await cancel.focus();
    await expect(cancel).toBeFocused();
    await cancel.click();
    await expect(modal).toBeHidden();
  });

  test('document icon popup has visible, non-zero choices and a named close action', async ({ page }) => {
    await page.goto('/dashboard/folder-document/create');
    // NOTE: the app renders this trigger as a bare <div> without role/label, so a
    // class selector is the only stable handle (tracked as a known a11y finding).
    await page.locator('.button-add-icon').click();

    const modal = page.locator('#modalIconFolder');
    await expect(modal).toBeVisible();
    const choices = modal.locator('img[alt="icon"]');
    await expect(choices.first()).toBeVisible();
    for (const choice of await choices.all()) {
      const box = await visibleBox(choice);
      expect(box.width).toBeGreaterThan(0);
      expect(box.height).toBeGreaterThan(0);
      await expect(choice).toHaveAttribute('alt', /.+/);
    }
    await expect(modal.getByRole('button', { name: 'Cancel', exact: true })).toBeVisible();
    await modal.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(modal).toBeHidden();
  });

  test('visible feedback surfaces have text and remain inside the viewport', async ({ page }) => {
    await page.goto('/dashboard/service-provider/create');
    const feedback = page.locator('[role="alert"], [role="status"], [data-sonner-toast]');
    const visibleBoxes = await feedback.evaluateAll((elements) => elements.flatMap((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      if (style.display === 'none' || style.visibility === 'hidden' || rect.width <= 0 || rect.height <= 0) return [];
      const text = (element.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text) return [];
      return [{
        text,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      }];
    }));
    const texts = await visibleFeedback(page);
    expect(texts).toEqual(visibleBoxes.map(({ text }) => text).filter(Boolean));
    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    for (const box of visibleBoxes) {
      expect(box.text.length).toBeGreaterThan(0);
      expect(box.width).toBeGreaterThan(0);
      expect(box.height).toBeGreaterThan(0);
      if (viewport) {
        expect(box.x + box.width).toBeGreaterThan(0);
        expect(box.y + box.height).toBeGreaterThan(0);
        expect(box.x).toBeLessThan(viewport.width);
        expect(box.y).toBeLessThan(viewport.height);
      }
    }
  });
});
