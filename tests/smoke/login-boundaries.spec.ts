import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test('invalid credentials remain on login and expose feedback', async ({ page }) => {
  await page.goto('/login');
  const email = page.locator('input[type="email"]');
  const password = page.locator('input[type="password"]');
  await email.fill('qa-invalid-user@example.invalid');
  await password.fill('DefinitelyWrong!123');
  await page.getByRole('button', { name: /^Sign In$/i }).click();

  await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
  const feedback = page.locator('[role="alert"], [role="status"], [data-sonner-toast]').filter({ visible: true });
  await expect(feedback.first()).toBeVisible();
  await expect(feedback.first()).not.toBeEmpty();
});

test('login controls expose browser validation for empty credentials', async ({ page }) => {
  await page.goto('/login');
  const email = page.locator('input[type="email"]');
  const password = page.locator('input[type="password"]');
  await expect(email).toHaveAttribute('required', '');
  await expect(password).toHaveAttribute('required', '');
  await expect(page.getByRole('button', { name: /^Sign In$/i })).toBeVisible();
});
