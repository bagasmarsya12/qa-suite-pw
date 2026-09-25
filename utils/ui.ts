import { expect, Locator, Page } from '@playwright/test';

export type Box = { width: number; height: number };

export async function visibleBox(locator: Locator): Promise<Box> {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  if (!box) throw new Error('Expected a visible element with a bounding box.');
  return { width: Math.round(box.width), height: Math.round(box.height) };
}

export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow, `horizontal overflow at ${page.url()}`).toBe(false);
}

export async function visibleFeedback(page: Page): Promise<string[]> {
  return page.locator('[role="alert"], [role="status"], [role="dialog"], [role="alertdialog"], [data-sonner-toast]')
    .evaluateAll((elements) => elements
      .filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      })
      .map((element) => (element.textContent || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean));
}

/**
 * Pass when a control is presented as disabled through ANY mechanism the app
 * may use: native `disabled`, `aria-disabled="true"`, or a `disabled` class.
 * MyCondo currently gates several buttons with a CSS class; this assertion
 * stays meaningful if the implementation migrates to native semantics.
 */
export async function expectControlDisabled(locator: Locator): Promise<void> {
  await expect(locator).toBeVisible();
  const state = await locator.evaluate((element) => {
    const html = element as HTMLElement;
    return {
      native: html.hasAttribute('disabled') || html.getAttribute('aria-disabled') === 'true',
      cls: html.classList.contains('disabled'),
    };
  });
  expect(
    state.native || state.cls,
    'control should be presented as disabled (native disabled / aria-disabled / disabled class)',
  ).toBe(true);
}
