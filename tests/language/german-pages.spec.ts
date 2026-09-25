import { test, expect } from '../../fixtures/monitoring';
import type { Page } from '@playwright/test';
import { germanPageExpectations } from '../../config/german';
import { expectNoHorizontalOverflow } from '../../utils/ui';

test.describe('German read-only page coverage', () => {
  test.skip(process.env.MYCONDO_RUN_GERMAN_E2E !== 'true', 'Enable only after the account language is set to German.');
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('languageChoosed', 'de'));
  });

  async function expectVisibleText(page: Page, value: string) {
    const matches = page.getByText(value, { exact: true });
    await expect.poll(async () => {
      for (let index = 0; index < await matches.count(); index += 1) {
        if (await matches.nth(index).isVisible()) return true;
      }
      return false;
    }, { timeout: 15_000 }).toBe(true);
  }

  for (const [path, expectedText] of germanPageExpectations) {
    test(`German page renders: ${path}`, async ({ page, monitor }) => {
      const response = await page.goto(path);
      expect(response?.status(), `${path} response`).toBeLessThan(400);
      await expectVisibleText(page, expectedText);
      await expectNoHorizontalOverflow(page);
      expect(monitor.pageErrors, JSON.stringify(monitor.pageErrors, null, 2)).toEqual([]);
    });
  }
});
