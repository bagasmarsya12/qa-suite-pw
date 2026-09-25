import { test, expect } from '../../fixtures/monitoring';
import { env } from '../../config/environments';
import { completeBuildingManagementRoutes } from '../../config/route-matrix';

type ApiCall = {
  host: string;
  path: string;
  queryKeys: string[];
  method: string;
  status: number;
  resourceType: string;
};

test('inventories frontend API calls across the complete Building Management route matrix', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  const calls = new Map<string, ApiCall>();
  const expectedOrigin = new URL(env.baseUrl).origin;

  page.on('response', (response) => {
    const resourceType = response.request().resourceType();
    if (!['xhr', 'fetch'].includes(resourceType)) return;
    const url = new URL(response.url());
    const queryKeys = [...new Set([...url.searchParams.keys()])].sort();
    const call: ApiCall = {
      host: url.origin === expectedOrigin ? 'same-origin' : url.host,
      path: url.pathname,
      queryKeys,
      method: response.request().method(),
      status: response.status(),
      resourceType,
    };
    calls.set(`${call.method} ${call.host}${call.path} ${queryKeys.join('&')}`, call);
  });

  for (const route of completeBuildingManagementRoutes) {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    expect(response?.status(), `${route} response`).toBeLessThan(400);
    await expect(page.locator('body')).not.toBeEmpty();
    // A continuously polling dashboard may never become network-idle. The short settling window
    // still captures async XHR/fetch calls without making the inventory suite hang.
    await page.waitForTimeout(750);
  }

  const inventory = [...calls.values()].sort((left, right) => `${left.method}${left.path}`.localeCompare(`${right.method}${right.path}`));
  const apiFailures = inventory.filter((call) => call.status >= 400);
  await testInfo.attach('api-inventory.json', {
    body: JSON.stringify({ generatedFrom: completeBuildingManagementRoutes, calls: inventory }, null, 2),
    contentType: 'application/json',
  });

  expect(inventory.length, 'Expected at least one browser API call to be captured').toBeGreaterThan(0);
  expect(apiFailures, JSON.stringify({ apiFailures }, null, 2)).toEqual([]);
});
