// Security baseline - known staging findings tracked for the dev team.
// Baseline collected 2026-09-25: staging serves no X-Content-Type-Options,
// no Referrer-Policy, and no HSTS header on any audited route.
// Semantics: findings matching a rule are KNOWN (annotation + report attachment,
// does not fail). Anything else FAILS - the suite stays a tripwire for NEW issues.
// Delete a rule once the underlying header/cookie issue is fixed.

export type SecurityFinding = { route: string; kind: string; value: string };

export type SecurityBaselineRule = {
  kind: string;
  value: string; // exact match against the finding value
  routes: string[]; // ['*'] matches every route (including '<cookie>' entries)
  reason: string;
};

export const securityBaseline: SecurityBaselineRule[] = [
  {
    kind: 'missing-or-weak-header',
    value: 'x-content-type-options=<missing>',
    routes: ['*'],
    reason: 'Staging responses lack X-Content-Type-Options: nosniff - tracked for dev fix at the Next.js / nginx layer.',
  },
  {
    kind: 'missing-or-weak-header',
    value: 'referrer-policy=<missing>',
    routes: ['*'],
    reason: 'Staging responses lack Referrer-Policy: strict-origin-when-cross-origin - tracked for dev fix.',
  },
  {
    kind: 'missing-https-header',
    value: 'strict-transport-security',
    routes: ['*'],
    reason: 'HSTS is not sent yet - must be enabled on the production domain before launch.',
  },
];

export function partitionSecurityFindings(findings: SecurityFinding[]): {
  known: SecurityFinding[];
  fresh: SecurityFinding[];
} {
  const known: SecurityFinding[] = [];
  const fresh: SecurityFinding[] = [];
  for (const finding of findings) {
    const matches = securityBaseline.some((rule) =>
      rule.kind === finding.kind
      && rule.value === finding.value
      && (rule.routes.includes('*') || rule.routes.includes(finding.route)),
    );
    (matches ? known : fresh).push(finding);
  }
  return { known, fresh };
}
