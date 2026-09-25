import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { env } from './config/environments';

const authFile = path.resolve('playwright/.auth/tenant.json');

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  timeout: 45_000,
  // Visual baselines are per-platform ({platform}: darwin locally, linux on CI
  // runners) because font rendering differs between macOS and Linux.
  snapshotPathTemplate: '{testDir}/../screenshots/{testFilePath}/{arg}-{platform}{ext}',
  expect: {
    timeout: 10_000,
    // Absorbs sub-pixel anti-aliasing jitter between otherwise identical
    // environments; real UI changes are far above 1% of pixels.
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },
  forbidOnly: Boolean(process.env.CI),
  // CI: one retry extra (2) to survive staging hiccups; locally 1 retry keeps
  // flake visible in the HTML report while avoiding one-off staging slowness.
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: env.baseUrl,
    storageState: authFile,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: 30_000,
    actionTimeout: 10_000,
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: { cookies: [], origins: [] } },
    },
    {
      name: 'login',
      testMatch: /.*(?:login|login-boundaries|session-boundaries)\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: { cookies: [], origins: [] } },
    },
    {
      name: 'chromium',
      dependencies: ['setup'],
      testMatch: /.*(?:tests\/smoke\/dashboard|tests\/regression\/(?:navigation|assets|network-console|route-status-matrix|api-inventory|discovered-route-matrix)|tests\/language\/.*|tests\/e2e\/.*)\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: authFile },
    },
    {
      name: 'visual',
      dependencies: ['setup'],
      testMatch: /.*visual.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: authFile },
    },
    {
      name: 'mobile',
      dependencies: ['setup'],
      testMatch: /.*responsive.*\.spec\.ts/,
      use: { ...devices['iPhone 13'], browserName: 'chromium', storageState: authFile },
    },
    {
      name: 'mutations',
      dependencies: ['setup'],
      testMatch: /.*tests\/mutations\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: authFile },
    },
    {
      name: 'accessibility',
      dependencies: ['setup'],
      testMatch: /.*tests\/accessibility\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: authFile },
    },
    {
      name: 'performance',
      dependencies: ['setup'],
      testMatch: /.*tests\/performance\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: authFile },
    },
    {
      name: 'security',
      dependencies: ['setup'],
      testMatch: /.*tests\/security\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: authFile },
    },
    ...(process.env.MYCONDO_CROSS_BROWSER === 'true'
      ? [
          {
            name: 'firefox',
            dependencies: ['setup'],
            testMatch: /.*(?:tests\/smoke\/dashboard|tests\/regression\/(?:navigation|route-status-matrix|discovered-route-matrix)|tests\/language\/.*|tests\/e2e\/.*)\.spec\.ts/,
            use: { ...devices['Desktop Firefox'], browserName: 'firefox' as const, storageState: authFile },
          },
          {
            name: 'webkit',
            dependencies: ['setup'],
            testMatch: /.*(?:tests\/smoke\/dashboard|tests\/regression\/(?:navigation|route-status-matrix|discovered-route-matrix)|tests\/language\/.*|tests\/e2e\/.*)\.spec\.ts/,
            use: { ...devices['Desktop Safari'], browserName: 'webkit' as const, storageState: authFile },
          },
        ]
      : []),
  ],
});
