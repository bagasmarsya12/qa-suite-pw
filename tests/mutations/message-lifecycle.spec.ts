import { test, expect } from '../../fixtures/monitoring';
import { assertProductionReadOnly, env } from '../../config/environments';

const mutationEnabled = process.env.MYCONDO_ALLOW_MUTATIONS === 'true';

test.describe('staging message mutation lifecycle', () => {
  test('send, verify, and delete an isolated QA message', async ({ page }) => {
    test.skip(!mutationEnabled, 'Enable MYCONDO_ALLOW_MUTATIONS=true for the staging mutation suite.');
    assertProductionReadOnly('message send/delete');
    expect(env.targetEnv).toBe('staging');

    const subject = `QA_E2E_MESSAGE_${Date.now()}`;
    const body = `QA_E2E automated lifecycle probe ${Date.now()}.`;
    let sent = false;

    try {
      await page.goto('/dashboard/message/create');
      await page.getByText('Add Recipient', { exact: true }).click();

      const modal = page.locator('#listTenantModal');
      await expect(modal).toBeVisible();
      const recipient = modal.locator('input[type="checkbox"]').first();
      await expect(recipient).toBeVisible();
      await recipient.check();
      await modal.getByRole('button', { name: 'Next', exact: true }).click();

      await page.getByPlaceholder('Enter topic here...').fill(subject);
      await page.getByPlaceholder('Write a message...').fill(body);
      const send = page.getByRole('button', { name: 'Send', exact: true });
      await expect(send).toBeEnabled();
      await send.click();
      sent = true;

      await expect(page).toHaveURL(/\/dashboard\/message/);
      await expect(page.getByText(subject, { exact: true }).first()).toBeVisible();
    } finally {
      if (!sent) return;

      await page.goto('/dashboard/message/sent');
      const row = page.getByText(subject, { exact: true }).first()
        .locator('xpath=ancestor::*[self::tr or @role="row"][1]');
      await expect(row).toBeVisible();

      const deleteButton = row.getByRole('button', { name: /delete/i }).or(row.getByTitle(/delete/i)).first();
      await expect(deleteButton).toBeVisible();
      await deleteButton.click();

      const confirmation = page.getByRole('dialog').last();
      await expect(confirmation).toBeVisible();
      await confirmation.getByRole('button', { name: /delete|confirm/i }).last().click();
      await expect(page.getByText(subject, { exact: true })).toHaveCount(0);

      await page.goto('/dashboard/message/bin');
      await expect(page.getByText(subject, { exact: true }).first()).toBeVisible();
    }
  });
});
