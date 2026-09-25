import { test, expect } from '../../fixtures/monitoring';
import { env } from '../../config/environments';
import { completeBuildingManagementRoutes } from '../../config/route-matrix';
import {
  findFallbackText,
  findGermanInformalAddress,
  findProtectedCopyMismatches,
  findTranslationKeys,
  findUnexpectedGerman,
  findUnexpectedEnglish,
} from '../../utils/language';
import type { Page } from '@playwright/test';

/**
 * SSR renders the base locale first and the German UI is applied client-side
 * after hydration, so language checks must sample post-hydration to be
 * meaningful; sampling too early flagged the by-design pre-hydration state and
 * made the route matrix flaky under parallel load.
 */
async function settleLanguage(page: Page) {
  await page.locator('#sidebarMenu').waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  await page.waitForTimeout(400);
}

test.beforeEach(async ({ page }) => {
  if (env.expectedLanguage === 'de') {
    await page.addInitScript(() => window.localStorage.setItem('languageChoosed', 'de'));
  }
});

test('configured language has no obvious English fallback wording', async ({ page }) => {
  await page.goto('/dashboard/category');
  await settleLanguage(page);
  if (env.expectedLanguage !== 'de') {
    await expect(page.getByText('Overview', { exact: true }).first()).toBeVisible();
    const findings = await findUnexpectedGerman(page);
    expect(findings, JSON.stringify(findings, null, 2)).toEqual([]);
    return;
  }
  const findings = await findUnexpectedEnglish(page);
  expect(findings, JSON.stringify(findings, null, 2)).toEqual([]);
});

test('dashboard has no raw translation keys or fallback values', async ({ page }) => {
  await page.goto('/dashboard/category');
  await settleLanguage(page);
  const findings = [...await findTranslationKeys(page), ...await findFallbackText(page)];
  expect(findings, JSON.stringify(findings, null, 2)).toEqual([]);
});

test('configured protected wording is present', async ({ page }) => {
  await page.goto('/dashboard/category');
  await settleLanguage(page);
  const findings = await findProtectedCopyMismatches(page);
  expect(findings, JSON.stringify(findings, null, 2)).toEqual([]);
});

test('configured German language has no fallback across the complete route matrix', async ({ page }) => {
  test.skip(env.expectedLanguage !== 'de', 'Run the complete fallback matrix with MYCONDO_EXPECTED_LANGUAGE=de.');
  const findings = [] as Array<{ route: string; kind: string; value: string }>;

  for (const route of completeBuildingManagementRoutes) {
    await page.goto(route);
    await settleLanguage(page);
    for (const finding of [
      ...await findUnexpectedEnglish(page),
      ...await findGermanInformalAddress(page),
      ...await findTranslationKeys(page),
      ...await findFallbackText(page),
    ]) {
      findings.push({ route, ...finding });
    }
  }

  expect(findings, JSON.stringify(findings, null, 2)).toEqual([]);
});

test('configured English has no German UI terms across the complete route matrix', async ({ page }) => {
  test.skip(env.expectedLanguage !== 'en', 'Run the English cross-locale matrix with MYCONDO_EXPECTED_LANGUAGE=en.');
  const findings = [] as Array<{ route: string; kind: string; value: string }>;

  for (const route of completeBuildingManagementRoutes) {
    await page.goto(route);
    await settleLanguage(page);
    for (const finding of await findUnexpectedGerman(page)) findings.push({ route, ...finding });
  }

  expect(findings, JSON.stringify(findings, null, 2)).toEqual([]);
});
