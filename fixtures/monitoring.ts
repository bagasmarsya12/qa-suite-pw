import { test as base, expect } from '@playwright/test';
import { attachPageMonitoring, PageMonitor } from '../utils/monitoring';

export const test = base.extend<{ monitor: PageMonitor }>({
  monitor: async ({ page }, use) => {
    await use(attachPageMonitoring(page));
  },
});

export { expect };
