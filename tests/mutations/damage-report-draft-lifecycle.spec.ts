import { test, expect } from '../../fixtures/monitoring';
import type { Page } from '@playwright/test';
import { assertProductionReadOnly, env } from '../../config/environments';

const mutationEnabled = process.env.MYCONDO_ALLOW_MUTATIONS === 'true';

async function removeDraftIfPresent(page: Page, title: string): Promise<void> {
  await page.goto('/dashboard/damage-report/draft');
  const item = page.getByText(title, { exact: true }).first();
  if (await item.count() === 0) return;

  const row = item.locator('xpath=ancestor::*[self::tr or @role="row" or contains(@class,"card")][1]');
  const more = row.getByRole('button', { name: /more options/i }).first();
  if (await more.count() > 0) {
    await more.click();
    await page.getByText('Delete', { exact: true }).last().click();
  } else {
    const directDelete = row.getByRole('button', { name: /delete/i }).or(row.getByTitle(/delete/i)).first();
    await directDelete.click();
  }

  const dialog = page.getByRole('dialog').last();
  if (await dialog.count() > 0 && await dialog.isVisible().catch(() => false)) {
    const confirm = dialog.getByRole('button', { name: /delete|confirm/i }).last();
    if (await confirm.count() > 0) await confirm.click();
  }
}

test.describe('staging damage-report draft mutation lifecycle', () => {
  test('create, verify, delete, and bin an isolated damage-report draft', async ({ page }) => {
    test.skip(!mutationEnabled, 'Enable MYCONDO_ALLOW_MUTATIONS=true for the staging mutation suite.');
    test.fail(true, 'Known staging issue: Save Draft after the visible Damage Report title does not materialize the new draft in All Drafts.');
    assertProductionReadOnly('damage-report draft create/delete');
    expect(env.targetEnv).toBe('staging');

    const title = `QA_E2E_DAMAGE_${Date.now()}`;
    let saved = false;

    try {
      await page.goto('/dashboard/damage-report/create');
      await page.getByPlaceholder('Add Title..').fill(title);
      await page.getByRole('button', { name: 'Save Draft', exact: true }).click();
      saved = true;
      await page.goto('/dashboard/damage-report/draft');
      await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
    } finally {
      if (!saved) return;
      await removeDraftIfPresent(page, title);
    }

    await page.goto('/dashboard/damage-report/bin');
    await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
  });
});
