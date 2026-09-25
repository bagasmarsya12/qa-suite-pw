import { test, expect } from '../../fixtures/monitoring';
import { assertProductionReadOnly, env } from '../../config/environments';
import { expectControlDisabled } from '../../utils/ui';

const mutationOptIn = process.env.MYCONDO_ALLOW_MUTATIONS === 'true';

test.describe('mutation boundary checks', () => {
  test('message send is present but remains guarded', async ({ page }) => {
    test.skip(mutationOptIn, 'Mutation execution is intentionally not automated in this suite.');
    await page.goto('/dashboard/message/create');
    const send = page.getByRole('button', { name: 'Send', exact: true });
    await expectControlDisabled(send);
  });

  test('destructive tenant action is not executed by the default suite', async ({ page }) => {
    test.skip(mutationOptIn, 'Deletion requires an immediate human confirmation at action time.');
    assertProductionReadOnly('tenant delete');
    await page.goto('/dashboard/tenant');
    const deleteAction = page.getByTitle(/Delete the member from HausBuddy/).first();
    await expect(deleteAction).toBeVisible();
    expect(env.targetEnv).toBe('staging');
  });
});
