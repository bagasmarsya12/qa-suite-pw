import { Page } from '@playwright/test';
import { env } from '../config/environments';
import { germanInformalPatterns } from '../config/german';
import { fallbackPatterns, forbiddenEnglishTerms, germanUiTerms, translationKeyPatterns } from '../config/language';

export type LanguageFinding = { kind: string; value: string };

export async function visiblePageText(page: Page): Promise<string> {
  return (await page.locator('body').innerText()).replace(/\s+/g, ' ').trim();
}

export async function findUnexpectedEnglish(page: Page): Promise<LanguageFinding[]> {
  if (env.expectedLanguage !== 'de') return [];
  const text = await visiblePageText(page);
  return forbiddenEnglishTerms
    .filter((term) => new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i').test(text))
    .map((value) => ({ kind: 'unexpected-English', value }));
}

export async function findUnexpectedGerman(page: Page): Promise<LanguageFinding[]> {
  if (env.expectedLanguage !== 'en') return [];
  const text = await visiblePageText(page);
  return germanUiTerms
    .filter((term) => new RegExp(`(?:^|\\s)${escapeRegExp(term)}(?:$|\\s|[,.!?])`, 'i').test(text))
    .map((value) => ({ kind: 'unexpected-German', value }));
}

export async function findGermanInformalAddress(page: Page): Promise<LanguageFinding[]> {
  if (env.expectedLanguage !== 'de') return [];
  const text = await visiblePageText(page);
  return germanInformalPatterns
    .filter((pattern) => pattern.test(text))
    .map((pattern) => ({ kind: 'informal-German-address', value: pattern.source }));
}

export async function findTranslationKeys(page: Page): Promise<LanguageFinding[]> {
  const text = await visiblePageText(page);
  return translationKeyPatterns.flatMap((pattern) => [...text.matchAll(pattern)].map((match) => ({
    kind: 'raw-translation-key',
    value: match[0],
  })));
}

export async function findFallbackText(page: Page): Promise<LanguageFinding[]> {
  const text = await visiblePageText(page);
  return fallbackPatterns.flatMap((pattern) => [...text.matchAll(pattern)].map((match) => ({
    kind: 'fallback-text',
    value: match[0],
  })));
}

export async function findProtectedCopyMismatches(page: Page): Promise<LanguageFinding[]> {
  const text = await visiblePageText(page);
  return env.protectedCopy
    .filter((copy) => !text.includes(copy))
    .map((value) => ({ kind: 'missing-protected-copy', value }));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
