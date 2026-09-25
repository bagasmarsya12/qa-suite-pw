import { test, expect } from '../../fixtures/monitoring';
import { visibleBox } from '../../utils/ui';

test('floating action menu exposes equal category controls without navigating', async ({ page }) => {
  await page.goto('/dashboard/category');
  const plus = page.locator('button:has(svg.lucide-plus)').last();
  await expect(plus).toBeVisible();
  await plus.click();

  const categories = page.locator('button[title="Building"], button[title=" Folder"], button[title="Subfolder"]');
  await expect(categories).toHaveCount(3);
  for (const category of await categories.all()) {
    await expect(category).toBeVisible();
    await expect.poll(async () => visibleBox(category)).toEqual({ width: 52, height: 52 });
  }
  // The button has an inline 64px size but is rotated, so its visual bounding box is ~91px.
  await expect.poll(async () => visibleBox(page.locator('button:has(svg.lucide-plus)').last()))
    .toEqual({ width: 91, height: 91 });
});

test('subfolder flow opens the category-assignment modal and keeps Next disabled until selection', async ({ page }) => {
  await page.goto('/dashboard/category');
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Unallocated Buildings', { exact: true })).toBeVisible();
  await page.locator('button:has(svg.lucide-plus)').last().click();
  const subfolder = page.locator('button[title="Subfolder"]');
  await expect(subfolder).toBeVisible();
  await subfolder.click();

  const modal = page.locator('#modalSelectCategory');
  await expect(modal).toBeVisible();
  const content = modal.locator('.modal-content');
  await expect.poll(async () => visibleBox(content)).toEqual({ width: 500, height: 484 });
  await expect(modal.getByText('Assign a property to a category', { exact: true })).toBeVisible();
  await expect(modal.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
  await modal.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(modal).toBeHidden();
});

test('building create flow validates step one and exposes step two without saving', async ({ page }) => {
  await page.goto('/dashboard/category/building/create');
  const title = page.locator('input[placeholder="e.g. Building 1"]');
  const next = page.getByRole('button', { name: 'Next', exact: true });
  await expect(title).toBeVisible();
  await expect(next).toBeDisabled();

  await title.fill('QA_FLOW_PROBE_BUILDING');
  await expect(next).toBeEnabled();
  await next.click();
  await expect(page.getByText('2 of 2 steps', { exact: true })).toBeVisible();
  for (const field of ['street', 'house_number', 'postcode', 'city', 'province', 'country']) {
    await expect(page.locator(`label[for="${field}"]`)).toBeVisible();
  }
  await expect(page.getByRole('button', { name: 'Done', exact: true })).toBeVisible();
});

test('document folder create flow exposes title and safe validation state without saving', async ({ page }) => {
  await page.goto('/dashboard/folder-document/create');
  const title = page.locator('input[placeholder="e.g. Utilities"]');
  const next = page.getByRole('button', { name: 'Next', exact: true });
  await expect(title).toBeVisible({ timeout: 15_000 });
  await expect(next).toBeDisabled();
  await title.fill('QA_FLOW_PROBE_FOLDER');
  await expect(next).toBeDisabled();
  await expect(page.getByText(/Step 1 of\s*3/, { exact: false })).toBeVisible();
});
