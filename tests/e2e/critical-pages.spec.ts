import { test, expect } from '../../fixtures/monitoring';
import { expectNoHorizontalOverflow } from '../../utils/ui';

const readOnlyPages = [
  ['/dashboard/category', 'Overview'],
  ['/dashboard/category/draft', 'All Drafts'],
  ['/dashboard/category/bin', 'Bin'],
  ['/dashboard/tenant', 'Tenant Management'],
  ['/dashboard/tenant/draft', 'All Drafts'],
  ['/dashboard/tenant/bin', 'Bin'],
  ['/dashboard/message', 'Messages'],
  ['/dashboard/message/sent', 'Sent Messages'],
  ['/dashboard/message/draft', 'All Drafts'],
  ['/dashboard/message/bin', 'Bin'],
  ['/dashboard/damage-report', 'Damage Reports'],
  ['/dashboard/damage-report/draft', 'All Drafts'],
  ['/dashboard/damage-report/bin', 'Bin'],
  ['/dashboard/folder-document', 'Documents'],
  ['/dashboard/folder-document/draft', 'All Drafts'],
  ['/dashboard/folder-document/bin', 'Bin'],
  ['/dashboard/service-provider', 'Service Providers'],
  ['/dashboard/service-provider/draft', 'All Drafts'],
  ['/dashboard/service-provider/bin', 'Bin'],
  ['/dashboard/data', 'Data'],
  ['/dashboard/setting', 'Settings'],
  ['/dashboard/setting/account', 'Account'],
  ['/dashboard/setting/user', 'Administrator & Users'],
  ['/dashboard/setting/password', 'Password & Security'],
  ['/dashboard/setting/notification', 'Notifications'],
  ['/dashboard/setting/language', 'Languages'],
  ['/dashboard/setting/restore-factory', 'Restore Factory Settings'],
  ['/dashboard/setting/about', 'About HausBuddy'],
  ['/dashboard/setting/imprint', 'Imprint'],
  ['/dashboard/setting/data-protection', 'Data Protection'],
  ['/dashboard/setting/general-terms-and-condition', 'Terms & Conditions'],
] as const;

for (const [path, expectedText] of readOnlyPages) {
  test(`read-only page renders: ${path}`, async ({ page, monitor }) => {
    const response = await page.goto(path);
    expect(response?.status(), `${path} response`).toBeLessThan(400);
    await expect(page.getByText(expectedText, { exact: true }).first()).toBeVisible({ timeout: 15_000 });
    await expectNoHorizontalOverflow(page);
    expect(monitor.pageErrors, JSON.stringify(monitor.pageErrors, null, 2)).toEqual([]);
  });
}
