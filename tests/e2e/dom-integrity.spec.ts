import { test, expect } from '../../fixtures/monitoring';

const domRoutes = [
  '/dashboard/category',
  '/dashboard/tenant',
  '/dashboard/message/create',
  '/dashboard/damage-report/create',
  '/dashboard/folder-document/create',
  '/dashboard/service-provider/create',
  '/dashboard/setting/account',
  '/dashboard/setting/password',
] as const;

test.describe('DOM integrity contracts', () => {
  for (const route of domRoutes) {
    test(`visible controls and images have usable DOM metadata: ${route}`, async ({ page }) => {
      await page.goto(route);
      const unnamed = await page.locator('button:visible, a:visible, input:visible, textarea:visible, select:visible').evaluateAll((elements) => elements.flatMap((element) => {
        const html = element as HTMLElement;
        const descendantImageAlt = html.querySelector('img[alt]')?.getAttribute('alt') || '';
        const name = html.innerText.trim() || html.getAttribute('aria-label') || html.getAttribute('title') || html.getAttribute('placeholder') || html.getAttribute('alt') || descendantImageAlt;
        return name ? [] : [{ tag: element.tagName, outerHTML: element.outerHTML.slice(0, 240) }];
      }));
      expect(unnamed, JSON.stringify({ route, unnamed }, null, 2)).toEqual([]);

      const badImages = await page.locator('img:visible').evaluateAll((images) => images.flatMap((image) => {
        const rect = image.getBoundingClientRect();
        return !image.getAttribute('alt') || rect.width <= 0 || rect.height <= 0
          ? [{ alt: image.getAttribute('alt'), width: rect.width, height: rect.height, src: image.getAttribute('src') }]
          : [];
      }));
      expect(badImages, JSON.stringify({ route, badImages }, null, 2)).toEqual([]);
    });
  }
});
