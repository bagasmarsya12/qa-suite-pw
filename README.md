# MyCondo external QA

Start with the [QA Runbook](RUNBOOK.md) for setup and execution commands.

Black-box browser QA for MyCondo using Playwright and TypeScript. This project interacts with the deployed application only through the browser and does not require GitLab or MyCondo source-code access.

## What it covers

- Login and logout using configured QA credentials.
- Read-only dashboard and navigation availability.
- Read-only end-to-end probes for observed building-management pages, draft/bin states, settings screens, building creation steps, folder validation, floating-action categories, category assignment, and the building announcement composer.
- Deeper tenant-management probes for building selection, search, pagination, row-action surfaces, data upload gating, and column editing.
- Secondary flow probes for message recipients, damage-report creation, service-provider creation, password validation, notification switches, language choices, and administrator verification.
- Mutation-boundary probes that confirm send/delete controls are present while keeping final side effects out of the default run.
- Separate opt-in QA mutation lifecycle for an isolated `QA_E2E_` message, including verification and cleanup.
- Documents draft mutation coverage now reaches the contextual New Folder flow and records a known expected failure: after title/icon selection, `Save Draft` does not materialize the new draft in All Drafts and the wizard remains on step one. No orphan draft was left behind.
- Service Provider draft mutation coverage records the same class of issue: after the visible company/contact/service fields are filled, `Save Draft` does not materialize the new provider in All Drafts. No orphan provider was left behind.
- Broken images, failed asset requests, HTTP 4xx/5xx responses, page errors, and severe console errors.
- Obvious English fallback wording in German UI areas.
- Raw translation keys and placeholder values.
- Responsive horizontal-overflow sanity checks.
- Full English/German route matrices, including create forms and Settings legal pages.
- A single shared Building Management route matrix now drives route status, responsive, accessibility, and localization coverage, including the building-create page.
- Icon accessibility/geometry, popup viewport placement, form action placement, and mobile layout checks across the route matrix.
- Keyboard-focus, popup dismissal, named-control, and visible feedback geometry contracts.
- Form boundary contracts for whitespace-only values, required-step gating, message send gating, and contact-field input types.
- Navigation resilience for deep links, reloads, back/forward history, and safe multi-step form reloads.
- Axe-core accessibility audits across the full shared route matrix (36 routes) as a baseline tripwire: known findings are tracked in `config/a11y-baseline.ts` and surfaced as report annotations; unbaselined violations fail the run. Invalid-login/session-boundary checks and file upload boundary checks for Damage Reports, Tenants, and Service Providers.
- Performance baselines for response status, DOMContentLoaded/load timing, cumulative layout shift, and long-task count across critical pages.
- Protected-route checks without a session, unusual-input fuzzing, and delayed-network shell resilience.
- Browser API inventory across the complete route matrix, recording sanitized method/host/path/query-key/status metadata as a Playwright attachment without storing payloads or credentials.
- Discovery-based route checks that crawl same-origin dashboard links exposed by the live UI, including dynamic building/folder routes not safe to hard-code.
- A GitLab-independent local watchdog command for critical smoke, route, and network checks, plus a repeat-run stability command for intermittent failures.
- Passive staging security checks for baseline response headers, HTTPS transport protection, mixed content, and session-cookie flags; known staging header findings are tracked in `config/security-baseline.ts` with the same tripwire semantics as the a11y baseline.
- Browser-language matrix for `de-DE`, `en-US`, `en-GB`, and `id-ID` browsers: the UI defaults to German for fresh users regardless of browser language, and an explicit stored language choice wins over the browser locale.
- Cancelled image loads (`_next/image` aborts caused by navigation) are classified as non-actionable in the request monitor; genuinely failed requests still fail the network audit.
- Opt-in Firefox and WebKit projects for cross-browser smoke, regression, language, and E2E coverage.
- Playwright visual baselines for the dashboard navigation and header.

It does not prove that MyCondo is bug-free, perform subjective grammar review, or run destructive production workflows.

## Local setup

Prerequisites: Node.js 22+, npm, and a QA account.

```bash
npm install
npx playwright install chromium
cp .env.example .env
```

Fill `.env` locally. Never commit it. For the building-management account, set `QA_ROLE=admin` plus the matching `QA_ADMIN_EMAIL` and `QA_ADMIN_PASSWORD`.

```bash
npm run test:smoke
npm run test:e2e
npx playwright test tests/e2e/tenant-management.spec.ts tests/e2e/secondary-flows.spec.ts tests/e2e/settings-flows.spec.ts tests/e2e/mutation-guards.spec.ts
npm run test:regression
npm run test:api-inventory
npm run test:watchdog
npm run test:security
npm run test:visual
npm test
npm run report
```

The mutation lifecycle suite is isolated from the default run. It requires staging, the opt-in flag, and a fresh action-time confirmation before executing external send/delete operations:

```bash
TARGET_ENV=staging QA_ROLE=admin MYCONDO_ALLOW_MUTATIONS=true npm run test:mutations
```

Run the cross-browser suite after installing the additional Playwright browsers:

```bash
npx playwright install firefox webkit
TARGET_ENV=staging QA_ROLE=admin MYCONDO_EXPECTED_LANGUAGE=en MYCONDO_CROSS_BROWSER=true npx playwright test --project=firefox --project=webkit
```

Run the German route and flow audit only after setting the account language to German:

```bash
TARGET_ENV=staging QA_ROLE=admin MYCONDO_EXPECTED_LANGUAGE=de MYCONDO_RUN_GERMAN_E2E=true npx playwright test tests/language --project=chromium
```

The first visual run needs approved baselines:

```bash
npm run test:update-snapshots
```

Review visual changes before committing them.

## Environment and safety

`TARGET_ENV=production` selects `MYCONDO_BASE_URL`; `TARGET_ENV=staging` selects `MYCONDO_STAGING_URL`. The current suite is read-only apart from authentication and logout. Mutation-boundary tests inspect final controls but do not click final save, delete, upload, publish, or send actions. Any future mutation run must explicitly require staging and a separate opt-in flag, and still pause immediately before the external side effect for human confirmation.

The deep probes intentionally preserve observed failures as evidence. One tenant pagination test is marked as an expected failure because the visible page-2 control is currently intercepted by another layer instead of advancing the table; review the Playwright report for the screenshot and trace.

The expanded German audit checks every read-only route plus create forms and all Settings legal pages. It intentionally fails when the app returns English `Overview` on the dashboard, English navigation on the announcement composer, or missing German body labels on Bin, Restore Factory, and About routes. These are application findings, not test exclusions.

GitHub Actions accepts a manual `workflow_dispatch` environment choice. Configure URLs and credentials as GitHub Secrets. Secrets are never printed or stored in the repository.

## Extending the suite

Add observed routes to `config/routes.ts`, approved German wording to `MYCONDO_PROTECTED_COPY`, and known English regressions to `config/language.ts` or `MYCONDO_FORBIDDEN_ENGLISH_TERMS`. Use accessible roles, labels, placeholders, and observed text before CSS fallbacks. Add a page object only when it removes repeated interaction logic. WCAG and security findings live in `config/a11y-baseline.ts` and `config/security-baseline.ts`: remove a baseline rule once the app fixes the underlying issue (stale rules are harmless), and refresh the a11y baseline only with a reviewed collection run using `scripts/gen-a11y-baseline.py` and `scripts/fix-a11y-footer.py`.

To add a role, add its email/password variables in `config/environments.ts`, create a role-specific auth state, and add a permissions test that only performs read-only checks on production.

## Interpreting failures

Open the HTML report first. Each failure should include the URL, expected assertion, screenshot, trace, and relevant monitoring details. Asset and language failures intentionally expose the current observed application state; do not silence them by adding broad exclusions.

## Latest staging evidence

Verified 25 September 2026 (hardening pass with the building-management QA account):

- Full suite: 246 passed, 38 skipped, 0 flaky, 5 failed — the 5 are exactly the documented application findings at the end of this block; there are no unexplained reds.
- Accessibility is now a baseline tripwire: `config/a11y-baseline.ts` (15 rules) annotates known findings (`known-issue` + JSON attachment) and fails only on findings outside the baseline. Six systemic families (contrast tokens, landmarks, headings, region, unnamed icon controls/links) are tracked as family-level rules with explicit removal notes; the rest are node-level. Matching is canonical (class-order-safe, `nth-child`-insensitive) and every pattern is validated as canonical, so patterns cannot silently stop matching.
- Security: `config/security-baseline.ts` tracks the missing response headers (24 findings across 8 audited routes) as annotations; `curl -I` independently re-confirmed staging serves no `X-Content-Type-Options`, `Referrer-Policy`, or HSTS.
- Watchdog fully green: navigation-cancelled `_next/image` aborts are classified as non-actionable (strictly image + `_next/image` + `ERR_ABORTED`), and the 11-route network-console sweep got a proportional 150s budget. The previously documented `right-arrow.png` intentional failure is resolved.
- Language sampling is deterministic: checks wait for the client-side locale switch before sampling (SSR is English by design). A timeline probe confirms the dashboard `Overview` English leak persists across 4s+, so it is a real finding, not a transition artifact. The EN/DE browser-language matrix passes 7/7; the German route matrix reliably flags the English-copy findings.
- Stability: local `retries: 1`, `navigationTimeout` 30s, implementation-tolerant disabled-state assertion (`expectControlDisabled`), probe specs removed.
- Tooling: CI runs `typecheck` before the suite; baseline maintenance scripts live in `scripts/` (`gen-a11y-baseline.py`, `fix-a11y-footer.py`, `collect-a11y-findings.spec.ts`).

Expected red set on current staging (intentionally unsuppressed application findings, each reproducible):
- Zero-dimension dashboard images (assets audit).
- Service Provider `Email` input rendered as `type="text"` instead of `type="email"` (form-boundaries audit).
- Unnamed profile-photo file input and icon-only `Add service` button on Service Provider create (DOM integrity audit).
- English copy in the German UI: dashboard `Overview` and list-page navigation terms (language matrix).

Verified 19 September 2026 with the building-management QA account:

- Typecheck passed.
- The added popup/accessibility/feedback contract suite passed 4/4 on Chromium. It checks modal intersection with the viewport, keyboard focus on modal actions, non-zero icon choices, named controls, and visible feedback geometry/text.
- The added form-boundary suite passed 4/5: it found that the Service Provider `Email` field is rendered as `type="text"` instead of `type="email"`; the other whitespace, step-gating, phone/URL, and message-send checks passed.
- The navigation-resilience suite passed 11/11 on Chromium across representative modules, reloads, history navigation, and the building wizard.
- Opt-in Firefox/WebKit run completed with 161 passed, 68 skipped, and 4 failures. Two failures reproduce the Service Provider email input-type finding; two WebKit failures are `NS_BINDING_ABORTED` while navigating to Bin routes and need a browser-specific navigation investigation.
- The opt-in mutation lifecycle passed 2/2 including setup: it sent one uniquely named `QA_E2E_` message, verified it in Sent, deleted it, verified it disappeared from Sent and appeared in Bin, and did not use Empty Bin. The default run remains mutation-free.
- The expanded mutation run completed with 3 expected results: setup passed, message send/delete passed with Bin verification, and the Documents draft regression remained an expected failure with no created record to clean up.
- The latest mutation run also exercised the Service Provider draft path; it is now an expected regression for the missing draft materialization, while the message lifecycle still passes with cleanup.
- The mutation matrix now includes Damage Reports as well: the visible title alone does not materialize a draft, so that path is also an expected regression. Latest run: 5 expected results, with setup and message send/delete passing and Documents, Service Providers, and Damage Reports reporting their known draft-save regressions without orphan records.
- The first axe-core run covered 16 routes and found recurring accessibility issues: insufficient contrast in sidebar/breadcrumb/cookie-banner text, missing `<main>` landmarks, missing level-one headings, and content outside landmarks. These are intentionally unsuppressed findings.
- The complete route-status matrix is now shared across the suite and passed 41/41 in the fresh English run including setup and language checks; the route-status portion covers 36 Building Management routes including building-create with no horizontal overflow or page errors.
- The API inventory passed 2/2 including setup and captured the complete route matrix in 44.6 seconds; no captured XHR/fetch response returned HTTP 4xx/5xx, and the report attachment stores only sanitized endpoint metadata.
- The discovery-based dashboard-link audit passed 2/2 including setup after checking all same-origin dashboard links exposed by the live UI.
- The first passive security run completed its checks and intentionally failed on a staging configuration finding: the HTML responses did not expose `X-Content-Type-Options`, `Referrer-Policy`, or `Strict-Transport-Security` on the audited routes. No mixed-content or weak session-cookie finding was reported in that run.
- The local watchdog completed with 38 passed and 1 intentional failure: the existing `right-arrow.png` image requests still abort with `net::ERR_ABORTED`; the watchdog no longer hangs on continuously polling pages because its network-idle wait is bounded.
- The stability command repeated the smoke dashboard and complete route matrix twice: 75/75 passed, showing no intermittent route-shell failure in that sample.
- The DOM-integrity audit passed 8/9 representative routes. The remaining Service Provider create-page finding is actionable: the visible profile-photo file input and the icon-only `Add service` button do not expose an accessible name.
- Auth and file-boundary additions passed 6/6: invalid credentials stay on login with feedback, required login fields are present, invalid upload extensions are rejected, and incomplete forms remain gated.
- Performance baseline passed 9/9 including setup. The eight critical pages stayed below the configured timing, layout-shift, and long-task thresholds in this staging run.
- Session-boundary, fuzz-input, and delayed-network additions passed 12/12. The fuzz set includes whitespace, emoji, Unicode/RTL, markup-like text, long text, tabs, and newlines.
- English/full matrix baseline before the latest resilience additions: 149 tests, 113 passed, 34 skipped, and 2 failures. The two actionable failures are zero-dimension image elements on the dashboard and aborted `right-arrow.png` image requests during the network-console audit. Visual baselines passed, the icon/form checks passed (7/7), and the mobile route matrix passed (32/32). The tenant count assertion is now data-driven because the controlled QA tenant changed the live staging total from 111 to 112; page 2 still does not advance the table and remains an expected failure.
- Expanded German matrix: 31 passed and 7 failures. Findings include English `Overview` on the dashboard, English navigation on the building announcement composer, missing `Papierkorb` on two Bin routes in that run, and missing expected German body labels on Restore Factory and About. The complete German fallback matrix also correctly flags the dashboard `Overview` regression.
- The stricter German run now checks the shared route matrix for English leakage, raw keys, fallback values, and informal `du/dein/dir` address. Fresh result: 33 passed, 3 failures, and 1 skip; the remaining failures are the dashboard `Overview` fallback plus missing German body labels on Restore Factory and About.
- Tenant pagination remains an expected failure: the visible page-2 control does not advance the table.
- Manual staging probes created building `QA_E2E_BUILDING_20260918` (record 126), folder `QA_E2E_FOLDER_20260918` (record 147), and one announcement draft. Account profile data was also updated successfully. Account deletion was not attempted.
- Damage-report and service-provider draft submissions were blocked by the application's `Complete the required field` validation after the visible fields were filled. Tenant draft creation was then exercised with the missing phone field supplied: draft record 167 was created successfully and appears in All Drafts, but not in active Tenant Management, so Messages `Add Recipient` remains disabled.
- Tenant draft edit links are malformed (`...?id=null?draft=167`). A corrected `?draft=167` URL initially loaded only part of the saved data; after completing the required city/province fields, the second-step `Done` flow opened the `Invitation to HausBuddy` modal and the confirmed invitation was sent successfully (`Invitation sent!`). Active Tenant Management now shows the QA tenant as 1 entry with Owner status and the saved contact/address data.
- On initial load, both building-specific and global Messages composers can show a greyed-out-looking `Add Recipient` control and a click may produce no modal until the page finishes hydrating. After hydration, the global composer exposes the tenant selector and selectable Tenant-role recipients.
- Messages Bin is readable and showed `23 Deleted Files` before the controlled delete; the `Empty Bin now` action was not used. Direct navigation to Drafts and Sent intermittently renders only a blank content panel with a partial sidebar, so those list/detail states remain a UI regression to investigate.
- After the recipient selector loaded correctly, a controlled message was sent to dummy Tenant `Halte Wait`: `QA E2E Message Test` with body `QA E2E automated message test. Please ignore.` The app redirected to Messages and the new message appeared as the newest row in Sent at 19 September 2026, 11:27 AM. After explicit confirmation, only that message was deleted: Sent decreased from 172 to 171, the UI showed `Success`, and the message was verified in Bin as 1 of the now 24 deleted files. Permanent purge was not attempted.
- Read-only module audit completed for Damage Reports: All Items showed 41 records across 3 pages, All Drafts showed 11 records, and Bin showed 8 deleted records. The create form exposes category, status, title, TinyMCE description, HausBuddy/email notification channels, urgency, file upload, Save Draft, and a three-step flow; the existing detail route eventually populated after delayed loading and exposed thumbnails plus a disabled Update action until changes are made.
- Read-only module audit completed for Documents: the root page showed 9 folder categories and a New Folder flow. The icon-picker popup initially opened empty and populated with icon choices after a short delay; the title field placeholder is `e.g. Utilities`. Documents All Drafts showed 4 records and Bin showed 2 deleted records. Selecting a Bin row exposes Restore and Delete actions; no restore, delete, or Empty Bin action was executed.
- Read-only module audit completed for Service Providers: All Providers showed 16 entries, All Drafts showed 2 records, and Bin showed 2 deleted providers. The create flow exposes profile photo upload, company name, phone, email, website, services, and a two-step wizard. Several list rows use a separate `More options` row in the accessibility tree, which should be checked against the visible row action affordance.
- Read-only Data audit completed: the HausBuddy tab exposes an expandable hierarchy with tenant/message/damage-report/document counts, and the Service Providers tab loads a 16-row provider table after delayed rendering. The first Data read briefly exposed `No Data Available` in the accessibility tree while the visual table was already present, so loading-state synchronization should be reviewed.
- Read-only Settings audit completed: Account exposes name, phone country selector, phone, email, website, Save, and a Delete Account link (the delete route/action was not opened); Administrator & Users lists `Audit` and `instantopic`, and clicking New User opens a password-confirmation modal. Password & Security exposes old/new/confirmation fields and explicit 12-character, mixed-case/number/special-character validation. Notifications exposes switches for Homepage, Tenant Management, Messages, Damage Reports, and Documents. Languages exposes English and German. Restore Factory Settings, Imprint, Data Protection, and Terms & Conditions rendered only breadcrumbs/no body content during the audit, which is an actionable content/rendering finding.
