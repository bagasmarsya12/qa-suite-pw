import { test, expect, type Page } from '@playwright/test';
import * as fs from 'fs';

/**
 * Language default behavior: browser language vs stored preference.
 *
 * Perilaku terverifikasi (diagnosa 21 Sep 2026 terhadap staging):
 * 1. User BARU → UI selalu JERMAN setelah hydration, TERLEPAS dari browser
 *    language (de-DE/en-US/en-GB/id-ID sama). Jerman adalah default hardcoded.
 *    (SSR HTML ber-lang="en", lalu dioverride client-side.)
 * 2. Preferensi eksplisit user (`localStorage.languageChoosed`) MENANG atas
 *    semuanya — tidak di-override oleh browser language.
 *
 * Test ini menjaga dua aturan itu. Kalau suatu hari app ditambahi deteksi
 * geo-IP/Accept-Language yang benar, test "fresh en-US" akan gagal → sinyal
 * review bahwa behavior berubah, bukan bug test.
 */

const DE_LOGIN_TEXT = 'Willkommen in der Zukunft';
const DE_DASHBOARD_MARKER = 'Übersicht';
const EN_DASHBOARD_MARKER = 'Tenant Management';

/** Cookies auth TANPA localStorage — simulasi user baru yang sudah login. */
const cookiesOnly = (() => {
  const state = JSON.parse(fs.readFileSync('playwright/.auth/tenant.json', 'utf8'));
  return { cookies: state.cookies, origins: [] };
})();

async function bodyText(page: Page): Promise<string> {
  // Normalisasi whitespace: innerText memecah baris, marker teks kita lintas-elemen.
  return page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
}

test.describe('Fresh user: default UI is German regardless of browser language', () => {
  for (const locale of ['de-DE', 'en-US']) {
    test(`login page, browser ${locale} → German`, async ({ browser }) => {
      const ctx = await browser.newContext({ locale, timezoneId: 'Europe/Berlin' });
      const page = await ctx.newPage();
      await page.goto('/login', { waitUntil: 'domcontentloaded' });
      // Catatan: heading login terpecah dua elemen ("Willkommen in" / "der Zukunft"),
      // jadi assertion pakai innerText (whitespace-normalized), bukan getByText.
      await expect
        .poll(async () => bodyText(page), { timeout: 15000 })
        .toContain(DE_LOGIN_TEXT);
      await ctx.close();
    });

    test(`dashboard, browser ${locale} → German`, async ({ browser }) => {
      const ctx = await browser.newContext({
        locale,
        timezoneId: 'Europe/Berlin',
        storageState: cookiesOnly as any,
      });
      const page = await ctx.newPage();
      await page.goto('/dashboard/category', { waitUntil: 'domcontentloaded' });
      await expect(page.getByText(DE_DASHBOARD_MARKER).first()).toBeVisible({ timeout: 15000 });
      const text = await bodyText(page);
      expect(text).not.toContain(EN_DASHBOARD_MARKER);
      await ctx.close();
    });
  }
});

test.describe('Explicit stored preference wins over browser language', () => {
  test('German browser + user chose EN → English dashboard', async ({ browser }) => {
    const ctx = await browser.newContext({
      locale: 'de-DE',
      timezoneId: 'Europe/Berlin',
      storageState: 'playwright/.auth/tenant.json',
    });
    await ctx.addInitScript(() => localStorage.setItem('languageChoosed', 'en'));
    const page = await ctx.newPage();
    await page.goto('/dashboard/category', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(EN_DASHBOARD_MARKER).first()).toBeVisible({ timeout: 15000 });
    const text = await bodyText(page);
    expect(text).not.toContain(DE_DASHBOARD_MARKER);
    await ctx.close();
  });

  test('English browser + user chose DE → German dashboard', async ({ browser }) => {
    const ctx = await browser.newContext({
      locale: 'en-US',
      timezoneId: 'Europe/Berlin',
      storageState: 'playwright/.auth/tenant.json',
    });
    await ctx.addInitScript(() => localStorage.setItem('languageChoosed', 'de'));
    const page = await ctx.newPage();
    await page.goto('/dashboard/category', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(DE_DASHBOARD_MARKER).first()).toBeVisible({ timeout: 15000 });
    const text = await bodyText(page);
    expect(text).not.toContain(EN_DASHBOARD_MARKER);
    await ctx.close();
  });
});
