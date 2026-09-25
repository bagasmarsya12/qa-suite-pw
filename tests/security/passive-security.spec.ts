import { test, expect } from '../../fixtures/monitoring';
import { partitionSecurityFindings, type SecurityFinding } from '../../config/security-baseline';

const securityRoutes = [
  '/dashboard/category',
  '/dashboard/tenant',
  '/dashboard/message',
  '/dashboard/damage-report',
  '/dashboard/folder-document',
  '/dashboard/service-provider',
  '/dashboard/data',
  '/dashboard/setting/account',
] as const;

test('staging exposes baseline browser security protections on key routes', async ({ page, context }, testInfo) => {
  const findings: SecurityFinding[] = [];

  for (const route of securityRoutes) {
    const response = await page.goto(route);
    const headers = response?.headers() ?? {};
    const requiredHeaders = [
      ['x-content-type-options', 'nosniff'],
      ['referrer-policy', 'strict-origin-when-cross-origin'],
    ] as const;

    for (const [name, expected] of requiredHeaders) {
      if (headers[name]?.toLowerCase() !== expected) {
        findings.push({ route, kind: 'missing-or-weak-header', value: `${name}=${headers[name] ?? '<missing>'}` });
      }
    }

    if (new URL(page.url()).protocol === 'https:' && !headers['strict-transport-security']) {
      findings.push({ route, kind: 'missing-https-header', value: 'strict-transport-security' });
    }

    const mixedContent = await page.locator('img[src^="http:"], script[src^="http:"], link[href^="http:"]').count();
    if (mixedContent > 0) findings.push({ route, kind: 'mixed-content', value: String(mixedContent) });
  }

  const cookies = await context.cookies();
  for (const cookie of cookies.filter((item) => /session|auth|token|jwt/i.test(item.name))) {
    if (!cookie.secure) findings.push({ route: '<cookie>', kind: 'insecure-session-cookie', value: cookie.name });
    if (!cookie.httpOnly) findings.push({ route: '<cookie>', kind: 'script-readable-session-cookie', value: cookie.name });
    if (cookie.sameSite === 'None' && !cookie.secure) findings.push({ route: '<cookie>', kind: 'invalid-samesite-cookie', value: cookie.name });
  }

  const { known, fresh } = partitionSecurityFindings(findings);

  await testInfo.attach('security-findings.json', {
    body: JSON.stringify({ known, fresh, all: findings }, null, 2),
    contentType: 'application/json',
  });

  if (known.length > 0) {
    testInfo.annotations.push({
      type: 'known-issue',
      description: `${known.length} baselined security finding(s) - missing/weak headers tracked for dev fix`,
    });
  }

  expect(fresh, JSON.stringify({ fresh }, null, 2)).toEqual([]);
});
