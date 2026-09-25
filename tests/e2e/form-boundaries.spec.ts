import { test, expect } from '../../fixtures/monitoring';
import { expectControlDisabled } from '../../utils/ui';

test.describe('form boundary contracts', () => {
  test('building creation rejects whitespace-only title before step two', async ({ page }) => {
    await page.goto('/dashboard/category/building/create');
    const title = page.locator('input[placeholder="e.g. Building 1"]');
    const next = page.getByRole('button', { name: 'Next', exact: true });
    await expect(title).toBeVisible();
    await title.fill('   ');
    await expect(next).toBeDisabled();
    await title.fill('QA_BOUNDARY_BUILDING');
    await expect(next).toBeEnabled();
  });

  test('damage report title whitespace does not unlock the next step', async ({ page }) => {
    await page.goto('/dashboard/damage-report/create');
    const title = page.getByPlaceholder('Add Title..');
    const next = page.getByRole('button', { name: 'Next', exact: true });
    await title.fill('   ');
    await expect(next).toBeDisabled();
    await title.fill('QA_BOUNDARY_DAMAGE_REPORT');
    await expect(next).toBeDisabled();
  });

  test('service-provider contact fields expose appropriate HTML input contracts', async ({ page }) => {
    await page.goto('/dashboard/service-provider/create');
    await expect(page.getByPlaceholder('Email')).toHaveAttribute('type', 'email');
    await expect(page.getByPlaceholder('Website')).toHaveAttribute('type', 'url');
    await expect(page.getByPlaceholder('Phone number')).toHaveAttribute('type', 'tel');
    await expect(page.getByPlaceholder('Email')).toHaveAttribute('autocomplete', /email/i);
  });

  test('message composer keeps Send unavailable without recipients and content', async ({ page }) => {
    await page.goto('/dashboard/message/create');
    const send = page.getByRole('button', { name: 'Send', exact: true });
    await expectControlDisabled(send);
    await expect(page.getByText('Add Recipient', { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder('Enter topic here...')).toBeVisible();
    await expect(page.getByPlaceholder('Write a message...')).toBeVisible();
  });
});
