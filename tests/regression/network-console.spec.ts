import { test, expect } from '../../fixtures/monitoring';
import { criticalPaths } from '../../config/routes';
import { formatMonitor } from '../../utils/monitoring';

test('critical read-only pages have no severe browser or HTTP failures', async ({ page, monitor }) => {
  test.setTimeout(150_000); // 11 routes x (navigation + bounded settling window)
  for (const route of criticalPaths) {
    const response = await page.goto(route.path);
    expect(response?.status(), `${route.path} response`).toBeLessThan(400);
    // Dashboards may poll continuously, so network-idle is not a reliable completion signal.
    // Keep a bounded settling window while monitoring remains active throughout the page lifetime.
    await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined);
  }

  expect(monitor.pageErrors, formatMonitor(monitor)).toEqual([]);
  expect(monitor.consoleErrors, formatMonitor(monitor)).toEqual([]);
  expect(monitor.failedRequests, formatMonitor(monitor)).toEqual([]);
  expect(monitor.unexpectedResponses, formatMonitor(monitor)).toEqual([]);
});
