import { test, expect } from '../../fixtures/monitoring';

test.describe('settings flow probes', () => {
  test('account settings keep Save disabled without an edit', async ({ page }) => {
    await page.goto('/dashboard/setting/account');
    await expect(page.getByRole('heading', { name: 'Account', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeDisabled();
    await expect(page.getByRole('link', { name: 'Delete Account', exact: true })).toBeVisible();
  });

  test('password settings expose all validation fields with Next disabled', async ({ page }) => {
    await page.goto('/dashboard/setting/password');
    await expect(page.getByPlaceholder('Old Password')).toBeVisible();
    await expect(page.locator('input[placeholder="New password"]').first()).toBeVisible();
    await expect(page.getByPlaceholder('Confirm new password')).toBeVisible();
    await expect(page.getByText(/Strong passwords contain at least 12 characters and/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
  });

  test('notification settings expose five independent notification switches', async ({ page }) => {
    await page.goto('/dashboard/setting/notification');
    await expect(page.getByText('Set to default', { exact: true })).toBeVisible();
    await expect(page.locator('input[type="checkbox"]')).toHaveCount(5);
    await expect(page.getByText('Homepage', { exact: true })).toBeVisible();
    await expect(page.locator('.setting-item').filter({ hasText: 'Tenant Management' })).toBeVisible();
    await expect(page.locator('.setting-item').filter({ hasText: 'Messages' })).toBeVisible();
    await expect(page.locator('.setting-item').filter({ hasText: 'Damage Reports' })).toBeVisible();
    await expect(page.locator('.setting-item').filter({ hasText: 'Documents' })).toBeVisible();
  });

  test('language settings expose English and German choices', async ({ page }) => {
    await page.goto('/dashboard/setting/language');
    await expect(page.getByText('English', { exact: true })).toBeVisible();
    await expect(page.getByText('German', { exact: true })).toBeVisible();
  });

  test('new administrator flow requires password verification before opening the form', async ({ page }) => {
    await page.goto('/dashboard/setting/user');
    await page.getByText('New User', { exact: true }).click();
    const modal = page.locator('#passwordFormModal');
    await expect(modal).toBeVisible();
    await expect(modal.getByText('Confirm new password', { exact: true })).toBeVisible();
    await expect(modal.getByPlaceholder('Password')).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
    await modal.getByRole('button', { name: 'Cancel', exact: true }).click();
  });
});
