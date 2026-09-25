import { test, expect } from '../../fixtures/monitoring';
import type { Page } from '@playwright/test';

/**
 * The dashboard shell loads sidebar icons and avatar imagery progressively and
 * swaps in late fonts; wait until the navigation's images are decoded (bounded)
 * plus a short settle, so the element box stops moving before the snapshot
 * comparison instead of failing with "waiting for element to be stable".
 */
async function waitForShellAssets(page: Page) {
  await page
    .waitForFunction(
      () => {
        const nav = document.getElementById('sidebarMenu');
        if (!nav) return false;
        const images = Array.from(nav.querySelectorAll('img'));
        return images.every((image) => image.complete);
      },
      undefined,
      { timeout: 15_000 },
    )
    .catch(() => undefined);
  await page.waitForTimeout(600);
}

test('dashboard navigation visual baseline', async ({ page }) => {
  await page.goto('/dashboard/category');
  await waitForShellAssets(page);
  await expect(page.getByRole('navigation')).toHaveScreenshot('dashboard-navigation.png', {
    animations: 'disabled',
    timeout: 20_000,
  });
});

test('dashboard header visual baseline', async ({ page }) => {
  await page.goto('/dashboard/category');
  await waitForShellAssets(page);
  await expect(page.getByRole('banner')).toHaveScreenshot('dashboard-header.png', {
    animations: 'disabled',
    timeout: 20_000,
  });
});
