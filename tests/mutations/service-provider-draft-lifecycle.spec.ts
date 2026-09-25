import { test, expect } from '../../fixtures/monitoring';
import type { Page } from '@playwright/test';
import { assertProductionReadOnly, env } from '../../config/environments';

const mutationEnabled = process.env.MYCONDO_ALLOW_MUTATIONS === 'true';

async function removeProviderDraftIfPresent(page: Page, company: string): Promise<void> {
  await page.goto('/dashboard/service-provider/draft');
  const item = page.getByText(company, { exact: true }).first();
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

test.describe('staging service-provider draft mutation lifecycle', () => {
  test('create, verify, delete, and bin an isolated service-provider draft', async ({ page }) => {
    test.skip(!mutationEnabled, 'Enable MYCONDO_ALLOW_MUTATIONS=true for the staging mutation suite.');
    test.fail(true, 'Known staging issue: Save Draft after filling the visible Service Provider fields does not materialize the new draft in All Drafts.');
    assertProductionReadOnly('service-provider draft create/delete');
    expect(env.targetEnv).toBe('staging');

    const company = `QA_E2E_PROVIDER_${Date.now()}`;
    let saved = false;

    try {
      await page.goto('/dashboard/service-provider/create');
      await page.getByPlaceholder('Company name').fill(company);
      await page.getByPlaceholder('Phone number').fill('+491234567890');
      await page.getByPlaceholder('Email').fill(`qa-${Date.now()}@example.com`);
      await page.getByPlaceholder('Website').fill('https://example.com');
      const service = page.getByPlaceholder('Add New');
      await service.fill('QA Cleaning');
      await service.press('Enter');

      await page.getByRole('button', { name: 'Save Draft', exact: true }).click();
      saved = true;
      await page.goto('/dashboard/service-provider/draft');
      await expect(page.getByText(company, { exact: true }).first()).toBeVisible();
    } finally {
      if (!saved) return;
      await removeProviderDraftIfPresent(page, company);
    }

    await page.goto('/dashboard/service-provider/bin');
    await expect(page.getByText(company, { exact: true }).first()).toBeVisible();
  });
});
