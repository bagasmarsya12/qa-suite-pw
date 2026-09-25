import { expect, test as setup } from '@playwright/test';
import path from 'node:path';
import { LoginPage } from '../../pages/LoginPage';
import { requireCredentials } from '../../config/environments';

const authFile = path.resolve('playwright/.auth/tenant.json');

setup('authenticate QA role', async ({ page }) => {
  const credentials = requireCredentials();
  const login = new LoginPage(page);
  await login.open();
  await login.expectLoaded();
  await login.signInAs(credentials.email, credentials.password);
  await expect(page.getByRole('navigation')).toBeVisible();
  await page.context().storageState({ path: authFile });
});
