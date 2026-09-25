import { test, expect } from '../../fixtures/monitoring';

const performanceRoutes = [
  '/dashboard/category',
  '/dashboard/tenant',
  '/dashboard/message',
  '/dashboard/damage-report',
  '/dashboard/folder-document',
  '/dashboard/service-provider',
  '/dashboard/data',
  '/dashboard/setting',
] as const;

test.describe('critical-page performance baseline', () => {
  for (const route of performanceRoutes) {
    test(`loads within baseline and exposes navigation timing: ${route}`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(response?.status(), `${route} response`).toBeLessThan(400);
      await expect(page.locator('body')).not.toBeEmpty();

      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
        const layoutShifts = performance.getEntriesByType('layout-shift') as Array<PerformanceEntry & { value?: number; hadRecentInput?: boolean }>;
        const longTasks = performance.getEntriesByType('longtask');
        return {
          domContentLoaded: navigation?.domContentLoadedEventEnd ?? 0,
          loadEvent: navigation?.loadEventEnd ?? 0,
          transferSize: navigation?.transferSize ?? 0,
          cumulativeLayoutShift: layoutShifts
            .filter((entry) => !entry.hadRecentInput)
            .reduce((total, entry) => total + (entry.value || 0), 0),
          longTaskCount: longTasks.length,
        };
      });

      expect(metrics.domContentLoaded, `${route} DOMContentLoaded`).toBeGreaterThan(0);
      expect(metrics.domContentLoaded, `${route} DOMContentLoaded`).toBeLessThan(15_000);
      expect(metrics.loadEvent, `${route} load event`).toBeLessThan(20_000);
      expect(metrics.cumulativeLayoutShift, `${route} cumulative layout shift`).toBeLessThan(0.35);
      expect(metrics.longTaskCount, `${route} long tasks`).toBeLessThan(25);
    });
  }
});
