import { test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as fs from 'fs';
import { completeBuildingManagementRoutes } from '../../config/route-matrix';

// TEMPORARY baseline collector: 3 independent passes under the SAME conditions
// as tests/accessibility/axe.spec.ts (sidebar visible + 500ms; no networkidle).
// Each pass is written to /tmp/a11y-pass{N}.json; progress to /tmp/a11y-progress.txt.
test('collect a11y findings (3 passes, spec conditions)', async ({ page }) => {
  test.setTimeout(1_200_000);
  fs.writeFileSync('/tmp/a11y-progress.txt', 'start\n');

  for (let pass = 1; pass <= 3; pass++) {
    const out: Record<string, unknown[]> = {};
    for (const route of completeBuildingManagementRoutes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#sidebarMenu', { timeout: 15_000 });
      await page.waitForTimeout(500);
      const results = await new AxeBuilder({ page }).analyze();
      out[route] = results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({ target: n.target })),
      }));
      fs.appendFileSync('/tmp/a11y-progress.txt', `pass${pass} ${route}\n`);
    }
    fs.writeFileSync(`/tmp/a11y-pass${pass}.json`, JSON.stringify(out, null, 2));
  }
  console.log('WROTE /tmp/a11y-pass1..3.json');
});
