#!/usr/bin/env node
/**
 * CI gate for the MyCondo QA suite.
 *
 * Runs the full Playwright suite and exits non-zero ONLY when something failed
 * outside the documented application findings that this suite intentionally
 * keeps red (see README: "Expected red set"). A red pipeline therefore always
 * means "new breakage", never "the known findings are still present".
 *
 * Raw reporters stay active (list for the log, html for the artifact); the
 * JSON report goes to ci-results.json for the allowlist check.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

/** [spec file suffix, title snippet] pairs for the documented findings. */
const EXPECTED_FAILURES = [
  ['dom-integrity.spec.ts', 'usable DOM metadata: /dashboard/service-provider/create'],
  ['form-boundaries.spec.ts', 'service-provider contact fields expose appropriate HTML input contracts'],
  ['language.spec.ts', 'configured language has no obvious English fallback wording'],
  ['language.spec.ts', 'no fallback across the complete route matrix'],
  ['assets.spec.ts', 'dashboard has no broken images or asset responses'],
];

const reportPath = process.env.CI_GATE_JSON ?? 'ci-results.json';
const run = process.env.CI_GATE_JSON ? { status: 0 } : spawnSync('npx', ['playwright', 'test', '--reporter=json,list,html'], {
  stdio: ['ignore', 'inherit', 'inherit'],
  env: {
    ...process.env,
    PLAYWRIGHT_JSON_OUTPUT_NAME: reportPath,
    PLAYWRIGHT_HTML_OPEN: 'never',
  },
});

if (!existsSync(reportPath)) {
  console.error(`\n[ci-gate] no JSON report produced (runner exit ${String(run.status)}); treating as failure`);
  process.exit(run.status || 1);
}

const report = JSON.parse(readFileSync(reportPath, 'utf8'));

const failures = [];
const walk = (suite, parentFile) => {
  const file = suite.file ?? parentFile ?? '';
  for (const spec of suite.specs ?? []) {
    if (spec.ok === false) failures.push({ file, title: spec.title });
  }
  for (const child of suite.suites ?? []) walk(child, file);
};
for (const suite of report.suites ?? []) walk(suite, '');

const isExpected = (failure) =>
  EXPECTED_FAILURES.some(([suffix, snippet]) => failure.file.endsWith(suffix) && failure.title.includes(snippet));

const matched = failures.filter(isExpected);
const unmatched = failures.filter((failure) => !isExpected(failure));

console.log(`\n[ci-gate] failures: ${failures.length} | documented: ${matched.length} | unexpected: ${unmatched.length}`);

if (unmatched.length > 0) {
  console.error('[ci-gate] FAIL - failures outside the documented set:');
  for (const failure of unmatched) console.error(`  - ${failure.file} :: ${failure.title}`);
  process.exit(1);
}

console.log('[ci-gate] OK - only documented application findings failed:');
for (const failure of matched) console.log(`  - ${failure.file} :: ${failure.title}`);
