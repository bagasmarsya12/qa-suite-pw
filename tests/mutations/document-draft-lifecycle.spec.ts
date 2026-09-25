import { test, expect } from '../../fixtures/monitoring';
import type { Page } from '@playwright/test';
import { assertProductionReadOnly, env } from '../../config/environments';

const mutationEnabled = process.env.MYCONDO_ALLOW_MUTATIONS === 'true';

async function removeDraftIfPresent(page: Page, title: string): Promise<void> {
  await page.goto('/dashboard/folder-document/draft');
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

test.describe('staging document draft mutation lifecycle', () => {
  test('create, verify, delete, and bin an isolated document draft', async ({ page }) => {
    test.skip(!mutationEnabled, 'Enable MYCONDO_ALLOW_MUTATIONS=true for the staging mutation suite.');
    test.fail(true, 'Known staging issue: Save Draft from the Documents wizard does not materialize the new draft in All Drafts.');
    assertProductionReadOnly('document draft create/delete');
    expect(env.targetEnv).toBe('staging');

    const title = `QA_E2E_DOCUMENT_${Date.now()}`;
    let saved = false;

    try {
      await page.goto('/dashboard/folder-document');
      await page.getByText('Rental Contracts', { exact: true }).last().click();
      await expect(page.getByText('New Folder', { exact: true })).toBeVisible();
      await page.getByText('New Folder', { exact: true }).click();
      await page.locator('input[placeholder="e.g. Utilities"]').fill(title);
      await page.locator('.button-add-icon').click();
      const iconModal = page.locator('#modalIconFolder');
      await expect(iconModal).toBeVisible();
      await expect.poll(async () => iconModal.locator('.icon-folder-div img').count(), { timeout: 15_000 }).toBeGreaterThan(0);
      await iconModal.locator('.icon-folder-div img').first().click();
      await iconModal.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(iconModal).toBeHidden();

      await page.getByRole('button', { name: 'Save Draft', exact: true }).click();
      saved = true;
      await page.goto('/dashboard/folder-document/draft');
      await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
    } finally {
      if (!saved) return;
      await removeDraftIfPresent(page, title);
    }

    await page.goto('/dashboard/folder-document/bin');
    await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
  });
});
