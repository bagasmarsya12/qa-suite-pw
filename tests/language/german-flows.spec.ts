import { test, expect } from '../../fixtures/monitoring';
import { findFallbackText, findUnexpectedEnglish } from '../../utils/language';
import { visibleBox } from '../../utils/ui';

test.describe('German building-management flow', () => {
  test.skip(process.env.MYCONDO_RUN_GERMAN_E2E !== 'true', 'Enable only after the account language is set to German.');
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('languageChoosed', 'de'));
  });

  test('German dashboard and popup labels are translated and dimensionally stable', async ({ page }) => {
    await page.goto('/dashboard/category');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Übersicht', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Nicht zugewiesene Immobilien', { exact: true })).toBeVisible();

    await page.locator('button:has(svg.lucide-plus)').last().click();
    for (const title of ['Immobilie', ' Ordner', 'Unterordner']) {
      await expect(page.locator(`button[title="${title}"]`)).toBeVisible();
      await expect.poll(async () => visibleBox(page.locator(`button[title="${title}"]`)))
        .toEqual({ width: 52, height: 52 });
    }

    await page.locator('button[title="Unterordner"]').click();
    const modal = page.locator('#modalSelectCategory');
    await expect(modal).toBeVisible();
    await expect(modal.getByText('Ordner auswählen', { exact: true })).toBeVisible();
    await expect.poll(async () => visibleBox(modal.locator('.modal-content')))
      .toEqual({ width: 500, height: 484 });
    await modal.getByRole('button', { name: 'Abbrechen', exact: true }).click();
  });

  test('German building announcement composer contains no English fallback copy', async ({ page }) => {
    await page.goto('/dashboard/category/building/121/folder');
    // This route currently exposes the action as the untranslated label "Add".
    // Keep the English selector so the following audit can report the fallback copy.
    await page.getByText('Add', { exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard\/category\/building\/121\/folder\/141\/create$/);
    const findings = [...await findUnexpectedEnglish(page), ...await findFallbackText(page)];
    expect(findings, JSON.stringify(findings, null, 2)).toEqual([]);
  });
});
