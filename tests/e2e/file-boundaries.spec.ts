import { test, expect } from '../../fixtures/monitoring';

test.describe('file upload boundary contracts', () => {
  test('damage-report upload control rejects invalid extensions and keeps submission incomplete', async ({ page }) => {
    await page.goto('/dashboard/damage-report/create');
    const file = page.locator('input[type="file"]').first();
    await expect(file).toBeAttached();
    await expect(file).toHaveAttribute('accept', /\.png/);
    await file.setInputFiles({ name: 'qa-invalid.txt', mimeType: 'text/plain', buffer: Buffer.from('not media') });
    await expect(file).toHaveJSProperty('files.length', 0);
    await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
  });

  test('tenant upload keeps Save disabled until the upload modal has a valid selection', async ({ page }) => {
    await page.goto('/dashboard/tenant');
    await page.locator('.nav-data').click();
    const modal = page.locator('#modalUploadDataTenant');
    await expect(modal).toBeVisible();
    const file = modal.locator('input[name="media"]');
    await expect(file).toBeAttached();
    await expect(modal.getByRole('button', { name: 'Save', exact: true })).toBeDisabled();
    await file.setInputFiles({ name: 'qa-invalid.txt', mimeType: 'text/plain', buffer: Buffer.from('not a spreadsheet') });
    await expect(file).toHaveJSProperty('files.length', 1);
    await modal.getByRole('button', { name: 'Cancel', exact: true }).click();
  });

  test('service-provider profile upload accepts images and rejects text files', async ({ page }) => {
    await page.goto('/dashboard/service-provider/create');
    const file = page.locator('input[type="file"]').first();
    await expect(file).toBeAttached();
    await expect(file).toHaveAttribute('accept', 'image/*');
    const validPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
    await file.setInputFiles({ name: 'qa-profile.png', mimeType: 'image/png', buffer: validPng });
    await expect(file).toHaveJSProperty('files.length', 1);
    await file.setInputFiles({ name: 'qa-profile.txt', mimeType: 'text/plain', buffer: Buffer.from('not an image') });
    await expect(file).toHaveJSProperty('files.length', 0);
    await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
  });
});
