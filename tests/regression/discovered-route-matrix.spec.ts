import { test, expect } from '../../fixtures/monitoring';
import { expectNoHorizontalOverflow } from '../../utils/ui';

const discoverySeeds = [
  '/dashboard/category',
  '/dashboard/tenant',
  '/dashboard/message',
  '/dashboard/damage-report',
  '/dashboard/folder-document',
  '/dashboard/service-provider',
  '/dashboard/data',
  '/dashboard/setting',
] as const;

test('all same-origin dashboard links exposed by the UI return a usable page', async ({ page }) => {
  test.setTimeout(180_000);
  const discovered = new Set<string>();
  const pageErrors: string[] = [];
  const badResponses: Array<{ route: string; status: number; url: string }> = [];

  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400) badResponses.push({ route: new URL(page.url()).pathname, status: response.status(), url: response.url() });
  });

  for (const seed of discoverySeeds) {
    await page.goto(seed, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);
    const links = await page.locator('a[href]').evaluateAll((anchors) => anchors
      .map((anchor) => (anchor as HTMLAnchorElement).href)
      .filter(Boolean));
    const origin = new URL(page.url()).origin;
    for (const href of links) {
      const url = new URL(href);
      if (url.origin !== origin || !url.pathname.startsWith('/dashboard')) continue;
      discovered.add(`${url.pathname}${url.search}`);
    }
  }

  const routes = [...discovered].sort();
  expect(routes.length, 'Expected dashboard navigation to expose discoverable routes').toBeGreaterThan(20);

  for (const route of routes) {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    expect(response?.status(), `${route} response`).toBeLessThan(400);
    await expect(page.locator('body')).not.toBeEmpty();
    await expect(page.locator('#sidebarMenu, nav, [role="navigation"]').first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }

  expect(pageErrors, JSON.stringify({ pageErrors }, null, 2)).toEqual([]);
  expect(badResponses, JSON.stringify({ badResponses }, null, 2)).toEqual([]);
});
