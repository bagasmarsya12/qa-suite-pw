import { test, expect } from '../../fixtures/monitoring';
import { LoginPage } from '../../pages/LoginPage';
import { requireCredentials } from '../../config/environments';

test.use({ storageState: { cookies: [], origins: [] } });

test('login page is reachable', async ({ page, monitor }) => {
  const response = await page.goto('/login');
  expect(response?.status(), JSON.stringify(monitor)).toBeLessThan(400);
  await new LoginPage(page).expectLoaded();
});

test('valid QA login succeeds', async ({ page, monitor }) => {
  const login = new LoginPage(page);
  await login.open();
  await login.signInAs(requireCredentials().email, requireCredentials().password);
  expect(page.url()).toContain('/dashboard');
  expect(monitor.pageErrors, JSON.stringify(monitor.pageErrors, null, 2)).toEqual([]);
});

test('logout returns the user to the login page', async ({ page }) => {
  const login = new LoginPage(page);
  await login.open();
  await login.signInAs(requireCredentials().email, requireCredentials().password);
  await page.goto('/dashboard/setting');
  await page.getByRole('button', { name: 'Logout', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
});
