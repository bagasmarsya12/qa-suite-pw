# MyCondo QA Runbook

This runbook explains how to run the external Playwright QA suite against the MyCondo staging environment.

## 1. Prerequisites

- Node.js 22 or newer.
- npm.
- A Building Management QA account.
- Access to the staging URL.
- Playwright Chromium installed locally.

The suite is black-box: it interacts with the deployed website through the browser and does not require MyCondo source-code or database access.

## 2. Configure the environment

From the project directory:

```bash
cp .env.example .env
```

Set these values in `.env`:

```dotenv
TARGET_ENV=staging
QA_ROLE=admin
MYCONDO_STAGING_URL=https://mycondofe.kuningan.de
QA_ADMIN_EMAIL=your-qa-email
QA_ADMIN_PASSWORD=your-qa-password
MYCONDO_EXPECTED_LANGUAGE=en
MYCONDO_ALLOW_MUTATIONS=false
```

Never commit `.env`, paste credentials into test output, or use a production URL for mutation tests.

Install dependencies and Chromium:

```bash
npm ci
npx playwright install chromium
```

## 3. Recommended execution order

### Quick read-only watchdog

Use this before or after a staging deployment:

```bash
npm run test:watchdog
```

It checks login setup, dashboard smoke, the complete Building Management route shell matrix, and severe browser/network failures.

### Full default suite

```bash
npm test
```

This runs the configured Chromium, visual, mobile, accessibility, performance, and read-only E2E projects. Mutation lifecycle tests remain guarded and do not perform final side effects unless explicitly enabled.

### English audit

```bash
MYCONDO_EXPECTED_LANGUAGE=en npm run test:regression
```

### German audit

The German checks enforce German-only UI copy, formal address, no raw translation keys, no fallback values, and no English leakage:

```bash
MYCONDO_EXPECTED_LANGUAGE=de MYCONDO_RUN_GERMAN_E2E=true npm run test:regression
```

The suite uses the German language state in the browser. If the account has a server-side language preference, set it to German before the run.

## 4. Focused quality checks

```bash
npm run typecheck
npm run test:api-inventory
npm run test:a11y
npm run test:performance
npm run test:security
npm run test:stability
```

What they check:

- `typecheck`: TypeScript compilation.
- `test:api-inventory`: sanitized browser API method/path/status inventory across the complete route matrix. It does not store response payloads.
- `test:a11y`: axe-core WCAG checks across the shared route matrix, compared against `config/a11y-baseline.ts` (known findings annotate; unbaselined findings fail).
- `test:performance`: browser timing, layout shift, and long-task thresholds.
- `test:security`: passive HTTPS, security-header, mixed-content, and session-cookie checks, compared against `config/security-baseline.ts`.
- `test:stability`: repeats the smoke and route matrix to expose intermittent failures.
- `test:language`: browser-language matrix (de/en/id locales, fresh vs stored preference) against the live product behavior.

### Managing the baseline tripwires

`tests/accessibility/axe.spec.ts` and `tests/security/passive-security.spec.ts` fail only on findings that are NOT in their baseline files:

- Known findings appear as `known-issue` test annotations plus a JSON attachment in the HTML report.
- When the app fixes an issue, delete its rule from the baseline; stale rules are harmless but should be pruned.
- To refresh the a11y baseline after a reviewed app change: copy `scripts/collect-a11y-findings.spec.ts` into `tests/accessibility/`, run it with `--project=accessibility --workers=1`, remove the copy afterwards, then regenerate:
  `python3 scripts/gen-a11y-baseline.py config/a11y-baseline.ts && python3 scripts/fix-a11y-footer.py config/a11y-baseline.ts`
- The generator applies reviewed overrides (route widening for widget-level findings, extra targets observed between passes); regenerating it is the only supported way to update the baseline.
- Never regenerate blindly: review the baseline diff so new findings are either fixed or explicitly accepted.

## 5. Cross-browser run

Install the additional browsers once:

```bash
npx playwright install firefox webkit
```

Run the opt-in matrix:

```bash
MYCONDO_CROSS_BROWSER=true MYCONDO_EXPECTED_LANGUAGE=en npx playwright test --project=firefox --project=webkit
```

Known browser-specific findings remain visible in the report; do not hide them with broad exclusions.

## 6. Mutation lifecycle tests

Mutation tests are isolated from the default run. They are allowed only against staging and use unique `QA_E2E_` data.

```bash
TARGET_ENV=staging QA_ROLE=admin MYCONDO_ALLOW_MUTATIONS=true npm run test:mutations
```

These tests may send/delete one controlled message and probe draft-save flows. They must not be run against production. They do not use account deletion or permanent Bin purge.

## 7. Visual snapshots

Run the existing visual checks:

```bash
npm run test:visual
```

Only update snapshots after reviewing the visual change:

```bash
npm run test:update-snapshots
```

## 8. Reports and artifacts

After a run, open the HTML report:

```bash
npm run report
```

For failures, inspect in this order:

1. Assertion message and route.
2. Screenshot.
3. Trace.
4. Video.
5. Console, page-error, failed-request, and HTTP-response details.
6. API inventory attachment, when the API inventory test was run.

An exit code of zero means the selected test command passed. It does not mean the application is bug-free; known application findings are intentionally allowed to fail and are documented in `README.md`.

## 9. Local scheduling without GitLab

The suite can run from a local Mac or QA machine because it only needs Node.js, the project, `.env`, and staging access. Use the watchdog command for a lightweight scheduled check and retain the generated `playwright-report/` and `test-results/` directories for investigation.

Keep the machine awake while scheduled checks run. Use a dedicated QA account and never schedule mutation tests by accident.

## 10. Safety rules

- Use `TARGET_ENV=staging` for all state-changing tests.
- Keep `MYCONDO_ALLOW_MUTATIONS=false` for normal runs.
- Use unique `QA_E2E_` prefixes for created test data.
- Do not run account deletion, Empty Bin, or permanent delete in the automated suite.
- Do not commit `.env`, authentication state, screenshots containing sensitive data, or trace files with secrets.

## 11. Operations notes

- Run ONE Playwright process at a time in this folder. `test-results/` and `.playwright-artifacts-*` are shared; concurrent runs collide (spurious `ENOENT` trace errors, mixed artifacts) and produce misleading failures.
- Local runs use `retries: 1`; a retried pass is listed as flaky in the report. Treat flaky results as a signal (staging slowness or a genuine intermittent issue), not as noise to ignore.
- `navigationTimeout` is 30s. When staging responds slowly, re-run the affected spec rather than widening timeouts; the watchdog and network-console specs already use bounded network-idle waits because dashboards poll continuously.
- The Playwright HTML report plus `test-results/` are the review artifacts; keep them from scheduled runs for investigation.
