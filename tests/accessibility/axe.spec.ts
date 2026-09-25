import { test, expect } from '../../fixtures/monitoring';
import AxeBuilder from '@axe-core/playwright';
import { completeBuildingManagementRoutes } from '../../config/route-matrix';
import { isKnownA11yViolation } from '../../config/a11y-baseline';

type AxeResults = Awaited<ReturnType<InstanceType<typeof AxeBuilder>['analyze']>>;
type AxeViolation = AxeResults['violations'][number];

/**
 * Split axe violations into KNOWN (matches config/a11y-baseline.ts - never fails)
 * and FRESH (anything else - fails the suite). Known findings stay visible via
 * test annotations and the attached JSON artifact.
 */
function partitionFindings(violations: AxeViolation[], route: string): {
  known: Array<{ id: string; impact: string | null; nodeCount: number }>;
  fresh: AxeViolation[];
} {
  const known: Array<{ id: string; impact: string | null; nodeCount: number }> = [];
  const fresh: AxeViolation[] = [];
  for (const violation of violations) {
    const freshNodes = violation.nodes.filter((node) => !isKnownA11yViolation(route, violation.id, node.target));
    if (freshNodes.length > 0) {
      fresh.push({ ...violation, nodes: freshNodes });
    } else {
      known.push({ id: violation.id, impact: violation.impact ?? null, nodeCount: violation.nodes.length });
    }
  }
  return { known, fresh };
}

test.describe('axe accessibility audit (baseline tripwire)', () => {
  for (const route of completeBuildingManagementRoutes) {
    test(`no unbaselined WCAG violations: ${route}`, async ({ page }, testInfo) => {
      await page.goto(route);
      await expect(page.locator('body')).not.toBeEmpty();
      // Wait for the dashboard shell to hydrate before sampling: axe run against a
      // half-rendered sidebar produces unstable selectors (class-list variance).
      await expect(page.locator('#sidebarMenu')).toBeVisible({ timeout: 15_000 });
      await page.waitForTimeout(500);
      const results = await new AxeBuilder({ page }).analyze();
      const { known, fresh } = partitionFindings(results.violations, route);

      await testInfo.attach('axe-findings.json', {
        body: JSON.stringify({ route, fresh, known, all: results.violations }, null, 2),
        contentType: 'application/json',
      });

      if (known.length > 0) {
        testInfo.annotations.push({
          type: 'known-issue',
          description: `${known.length} baselined violation(s): ${known.map((entry) => entry.id).join(', ')}`,
        });
      }

      expect(fresh, JSON.stringify({ route, fresh }, null, 2)).toEqual([]);
    });
  }
});
