import { test, expect } from '../../fixtures/monitoring';
import { collectBrokenImages } from '../../utils/assets';
import { formatMonitor } from '../../utils/monitoring';

test('dashboard has no broken images or asset responses', async ({ page, monitor }) => {
  await page.goto('/dashboard/category');
  await page.waitForLoadState('networkidle');
  const brokenImages = await collectBrokenImages(page);
  expect(brokenImages, JSON.stringify(brokenImages, null, 2)).toEqual([]);
  expect(monitor.failedRequests, formatMonitor(monitor)).toEqual([]);
  expect(monitor.unexpectedResponses, formatMonitor(monitor)).toEqual([]);
});
