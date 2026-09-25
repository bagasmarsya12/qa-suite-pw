import { test, expect } from '../../fixtures/monitoring';

test.describe('module-level read-only audits', () => {
  test('damage reports expose list, detail, drafts, and bin surfaces', async ({ page }) => {
    await page.goto('/dashboard/damage-report');
    await expect(page.getByText(/Damage Reports/).first()).toBeVisible();
    await expect(page.locator('[role="grid"], [role="treegrid"], [role="table"], .ag-root').first()).toBeVisible();
    await expect(page.getByText(/Items per page/)).toBeVisible();

    const detailHref = await page.locator('a').evaluateAll((anchors) =>
      anchors.map((anchor) => anchor.getAttribute('href')).find((href) => href !== null && /^\/dashboard\/damage-report\/\d+$/.test(href)),
    );
    expect(detailHref).toBeTruthy();
    const detail = page.locator(`a[href="${detailHref}"]`).first();
    await expect(detail).toBeVisible();
    await detail.click();
    await expect(page).toHaveURL(/\/dashboard\/damage-report\/\d+/);
    await expect(page.locator('input[name="title"]')).toBeVisible({ timeout: 20_000 });

    await page.goto('/dashboard/damage-report/draft');
    await expect(page.getByText('All Drafts', { exact: true }).first()).toBeVisible();
    await expect(page.locator('[role="grid"], [role="treegrid"], [role="table"], .ag-root').first()).toBeVisible();
    await page.goto('/dashboard/damage-report/bin');
    await expect(page.getByText('Bin', { exact: true }).first()).toBeVisible();
  });

  test('documents expose folder creation popup and list states', async ({ page }) => {
    await page.goto('/dashboard/folder-document');
    await expect(page.getByText('Documents', { exact: true }).last()).toBeVisible();
    await expect(page.getByText('Rental Contracts', { exact: true }).last()).toBeVisible();
    await expect(page.getByText('Service Providers', { exact: true }).last()).toBeVisible();

    await page.goto('/dashboard/folder-document/create');
    await expect(page.getByPlaceholder('e.g. Utilities')).toBeVisible();
    // NOTE: the app renders this trigger as a bare <div> without role/label, so a
    // class selector is the only stable handle (tracked as a known a11y finding).
    await page.locator('.button-add-icon').click();
    const iconModal = page.locator('#modalIconFolder');
    await expect(iconModal).toBeVisible();
    await expect(iconModal.getByText('Select Icon', { exact: true })).toBeVisible();
    await iconModal.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.goto('/dashboard/folder-document/draft');
    await expect(page.getByText('All Drafts', { exact: true }).first()).toBeVisible();
    await page.goto('/dashboard/folder-document/bin');
    await expect(page.getByText('Bin', { exact: true }).first()).toBeVisible();
  });

  test('service providers expose list, composer fields, drafts, and bin', async ({ page }) => {
    await page.goto('/dashboard/service-provider');
    await expect(page.getByText('Service Providers', { exact: true }).last()).toBeVisible();
    await expect(page.locator('[role="grid"], [role="treegrid"], [role="table"], .ag-root').first()).toBeVisible();

    await page.goto('/dashboard/service-provider/create');
    for (const placeholder of ['Company name', 'Phone number', 'Email', 'Website', 'Add New']) {
      await expect(page.getByPlaceholder(placeholder)).toBeVisible();
    }
    await expect(page.getByRole('button', { name: 'Choose File', exact: true })).toBeVisible();

    await page.goto('/dashboard/service-provider/draft');
    await expect(page.getByText('All Drafts', { exact: true }).first()).toBeVisible();
    await page.goto('/dashboard/service-provider/bin');
    await expect(page.getByText('Bin', { exact: true }).first()).toBeVisible();
  });

  test('data page exposes expandable HausBuddy and Service Providers views', async ({ page }) => {
    await page.goto('/dashboard/data');
    await expect(page.getByText('HausBuddy', { exact: true })).toBeVisible();
    await expect(page.getByText('Service Providers', { exact: true }).last()).toBeVisible();

    const expanders = page.getByRole('button', { name: '▶' });
    await expect(expanders.first()).toBeVisible();
    await expanders.first().click();
    await expect(page.getByRole('button', { name: '▼' }).first()).toBeVisible();

    await page.getByText('Service Providers', { exact: true }).last().click();
    await expect(page.getByRole('heading', { name: 'Service Providers' })).toBeVisible();
    await expect(page.locator('[role="grid"], [role="treegrid"], [role="table"], .ag-root').first()).toBeVisible();
  });
});
