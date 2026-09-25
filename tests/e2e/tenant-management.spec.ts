import { test, expect } from '../../fixtures/monitoring';
import { visibleBox } from '../../utils/ui';

test.describe('tenant management end-to-end probes', () => {
  test('add tenant flow exposes building selection and its empty-state guard', async ({ page }) => {
    await page.goto('/dashboard/tenant');
    const add = page.locator('.btn-multi .fbtn').first();
    await expect(add).toBeVisible();
    await add.click();

    const modal = page.locator('#modalSelectBuildingDocument');
    await expect(modal).toBeVisible();
    await expect(modal.getByText('Select 1 building', { exact: true })).toBeVisible();
    await expect(modal.getByPlaceholder('Search')).toBeVisible();
    await expect(modal.getByText('You must add a building first', { exact: true })).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Confirm', exact: true })).toBeDisabled();
    await expect.poll(async () => visibleBox(modal.locator('.modal-content'))).toEqual({ width: 500, height: 636 });
    await modal.getByRole('button', { name: 'Cancel', exact: true }).click();
  });

  test('tenant table exposes search, row actions, page size, and pagination', async ({ page }) => {
    await page.goto('/dashboard/tenant');
    await expect(page.getByText('Tenant Management', { exact: true }).last()).toBeVisible();
    const entriesLabel = page.locator('a.card-navigation-subtitle').filter({ hasText: /\d+ Entries/ }).last();
    await expect(entriesLabel).toBeVisible();
    await expect.poll(async () => Number((await entriesLabel.innerText()).match(/(\d+)\s+Entries/)?.[1])).toBeGreaterThan(0);
    const totalEntries = Number((await entriesLabel.innerText()).match(/(\d+)\s+Entries/)?.[1]);
    expect(totalEntries).toBeGreaterThan(0);
    await expect(page.getByText('Items per page', { exact: true })).toBeVisible();
    await expect(page.getByText(new RegExp(`1\\s*-\\s*20 of ${totalEntries} records`))).toBeVisible();
    await expect(page.getByTitle(/Delete the member from HausBuddy/).first()).toBeVisible();

    const search = page.locator('input[placeholder="Search"]:visible');
    await search.fill('Halte');
    await expect(page.getByText(/Showing search results for “Halte”/)).toBeVisible();
    await expect(page.getByText(/8 Entries/)).toBeVisible();
    await search.press('Backspace');
    await search.press('Backspace');
    await search.press('Backspace');
    await search.press('Backspace');
    await search.press('Backspace');
    await expect(page.getByText(/Showing search results for/)).toHaveCount(0);

    await page.locator('a[href="/dashboard/tenant"]').first().click();
    await expect(page.getByText(new RegExp(`1\\s*-\\s*20 of ${totalEntries} records`))).toBeVisible();
  });

  test.fail('tenant pagination button 2 should advance the table', async ({ page }) => {
    await page.goto('/dashboard/tenant');
    const entriesLabel = page.locator('a.card-navigation-subtitle').filter({ hasText: /\d+ Entries/ }).last();
    await expect(entriesLabel).toBeVisible();
    await expect.poll(async () => Number((await entriesLabel.innerText()).match(/(\d+)\s+Entries/)?.[1])).toBeGreaterThan(0);
    const totalEntries = Number((await entriesLabel.innerText()).match(/(\d+)\s+Entries/)?.[1]);
    await expect(page.getByText(new RegExp(`1\\s*-\\s*20 of ${totalEntries} records`))).toBeVisible();
    const pageTwo = page.locator('button.w-7.h-7').filter({ hasText: '2' });
    await expect(pageTwo).toBeVisible();
    await pageTwo.click({ force: true });
    await expect(page.getByText(new RegExp(`21\\s*-\\s*40 of ${totalEntries} records`))).toBeVisible();
  });

  test('tenant data upload modal is gated by file selection', async ({ page }) => {
    await page.goto('/dashboard/tenant');
    await page.locator('.nav-data').click();
    const modal = page.locator('#modalUploadDataTenant');
    await expect(modal).toBeVisible();
    await expect(modal.getByText('Tenants', { exact: true })).toBeVisible();
    await expect(modal.getByText(/XLSX, or CSV file size no more than 10MB/)).toBeVisible();
    await expect(modal.locator('input[name="media"]')).toBeAttached();
    await expect(modal.getByRole('button', { name: 'Save', exact: true })).toBeDisabled();
    await modal.getByRole('button', { name: 'Cancel', exact: true }).click();
  });

  test('tenant column editor opens with cancel-safe controls', async ({ page }) => {
    await page.goto('/dashboard/tenant');
    await page.locator('.nav-table').click();
    const modal = page.locator('#ModalEditHeader.show').last();
    await expect(modal).toBeVisible();
    await expect(modal.getByText('First name', { exact: true })).toBeVisible();
    await expect(modal.getByText('Province', { exact: true })).toBeVisible();
    await expect(modal.locator('.modal-content')).toHaveCSS('width', '500px');
    await expect(modal.locator('.upload-button-skip')).toHaveText('Cancel');
    await expect(modal.locator('.upload-button-next')).toHaveText('Save');
    await modal.locator('.upload-button-skip').click();
  });
});
