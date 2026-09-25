import { test, expect } from '../../fixtures/monitoring';
import { visibleBox } from '../../utils/ui';

test.describe('secondary management flows', () => {
  test('message list and recipient selector are readable and cancel-safe', async ({ page }) => {
    await page.goto('/dashboard/message');
    await expect(page.locator('a[href="/dashboard/message/create"]')).toBeVisible();
    await page.locator('a[href="/dashboard/message/create"]').click();
    await expect(page.getByText('New Message', { exact: true }).first()).toBeVisible();
    await expect(page.getByPlaceholder('Enter topic here...')).toBeVisible();
    await expect(page.getByPlaceholder('Write a message...')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send', exact: true })).toHaveClass(/disabled/);

    await page.getByText('Add Recipient', { exact: true }).click();
    const modal = page.locator('#listTenantModal');
    await expect(modal).toBeVisible();
    await expect(modal.getByText('Select Tenants', { exact: true })).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Next', exact: true })).toBeVisible();
    await expect.poll(async () => visibleBox(modal.locator('.modal-content'))).toEqual({ width: 1140, height: 826 });
    await modal.getByRole('button', { name: 'Cancel', exact: true }).click();
  });

  test('damage report composer validates its first step without saving', async ({ page }) => {
    await page.goto('/dashboard/damage-report/create');
    await expect(page.getByPlaceholder('Add Title..')).toBeVisible();
    await expect(page.locator('input[type="file"]')).toBeAttached();
    await expect(page.getByRole('button', { name: 'Save Draft', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
    await expect(page.getByText('Don\'t forget to fill the title :)', { exact: true })).toBeVisible();
    await page.getByPlaceholder('Add Title..').fill('QA probe - do not save');
    await expect(page.getByRole('button', { name: 'Save Draft', exact: true })).toBeVisible();
  });

  test('service provider composer exposes required company-name validation', async ({ page }) => {
    await page.goto('/dashboard/service-provider/create');
    const company = page.getByPlaceholder('Company name');
    await expect(company).toBeVisible();
    await expect(page.getByPlaceholder('Phone number')).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Website')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save Draft', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
    await company.fill('QA probe - do not save');
    await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
  });
});
