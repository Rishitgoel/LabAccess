# Verification

## Phase 0 — October 8, 2026

Environment: Windows, Node 24.14.1, npm 11.11.0. One npm workspace lockfile. Dependency versions checked against the npm registry; installed exact versions are recorded in package-lock.json.

| Check | Result | Evidence / limit |
|---|---|---|
| Dependency installation | Passed | npm install; 135 packages audited |
| Dependency advisories | Passed after fix | install reports zero vulnerabilities with shell-quote 1.12.0 override; no full security-audit claim |
| Foundation tests | Passed | npm test: 5/5; health 200/503 branches, invalid JSON/404, environment validation, missing/unreachable DB, seed refusals |
| React production build | Passed | npm run build: Vite 8.3.3, 15 modules; no workflow implemented |
| Live Vite → Express proxy | Passed | npm run dev launched both processes; / returned 200; /api/health through port 5173 returned controlled 503; rendered React screen and retry checked in browser |
| Production same-origin / SPA fallback | Passed locally | npm start with NODE_ENV=production, PORT=3002; root/deep paths 200 with same HTML, unknown API JSON 404, readiness 503 |
| Database failure handling | Passed | bounded connection to unreachable localhost test port; URI not exposed |
| Real MongoDB connection | Not verified | no database configured in this run; Phase 0 allows controlled failure |
| Named Code0/Kiro task | Pending | user will create account; prompt prepared in ai-usage.md |
| Assessment tool identity | Pending | original Kiro email domain differs from official IDE domain |
| Git / staged secrets review | Passed | reviewed initial staged file list and credential patterns; only .env.example, no actual env/dependencies/build output; local initial commit |

The first sandboxed HTTP test run hit EACCES connecting to its own localhost listeners. Re-running the unchanged suite with permitted network access passed all five tests. npm audit initially reported two critical entries through concurrently → shell-quote; npm audit fix retained the vulnerable pinned dependency, so the project overrides shell-quote to patched 1.12.0. Development launch verification must exercise that override.

The setup screen is diagnostic, not a completed Phase 1 UI. No database-backed workflow, auth/session, concurrency, hosted demo, fresh clone, or full responsive/keyboard acceptance has been verified. Keep their later-phase gates open.

Actual rendered diagnostic screenshot: [phase0-setup.png](screenshots/phase0-setup.png). Warm theme and visible failure/retry checked; this is not a catalog visual comparison or a full breakpoint acceptance claim.

## GitHub setup — October 8, 2026

User explicitly requested GitHub setup and push. Created public [Rishitgoel/LabAccess](https://github.com/Rishitgoel/LabAccess), set local branch to main, configured origin over HTTPS, and pushed the Phase 0 foundation commit 7adc9e9 with upstream tracking. GitHub reports isPrivate=false and default branch main. Reviewed the complete initial tracked file list and credential-pattern scan before publishing; actual env files, dependencies, and build output are excluded. This publishes an in-progress project, not a completed assessment or email submission.

## Phase 1 — design foundation, October 8, 2026

Opened catalog and request-dialog references before implementation. Implemented shared semantic palette, locally bundled Inter/DM Serif Display fonts, Tailwind 4, shadcn/Radix primitives, horizontal role-aware header/profile menu, CatalogHero, pure ResourceCard/ResourceGrid, StatusBadge, request dialog, and loading/empty/error previews. Six resources and four status examples come from one fixture module. No HTTP requests or browser storage occur in the cards; submission changes React memory only.

| Check | Result | Evidence / limit |
|---|---|---|
| Desktop 1440px | Passed | three columns; [catalog](screenshots/phase1-catalog-desktop.png), [dialog](screenshots/phase1-dialog-desktop.png) |
| Tablet 768px | Passed | two columns; [catalog](screenshots/phase1-catalog-tablet.png), [dialog](screenshots/phase1-dialog-tablet.png) |
| Mobile 375px | Passed | one column, artwork hidden; document scrollWidth 360 <= viewport 375, open dialog scrollWidth 375, dialog width 343; [catalog](screenshots/phase1-catalog-mobile.png), [dialog](screenshots/phase1-dialog-mobile.png) |
| Keyboard/dialog behavior | Passed in browser | Enter opens; textarea receives focus; Shift+Tab wraps to Close, Tab wraps to textarea; Escape/Cancel restore opening control; background excluded from accessible tree |
| Fixture submission | Passed in browser | pending state appears after temporary callback; repeated action disabled while saving; explicit not-saved confirmation; refresh resets state |
| Failed submission | Passed in browser | simulated failure retains exact 74-character reason, reports error; deliberate retry succeeds; no API write |
| Validation | Passed in browser | empty reason rejected with associated alert and aria-invalid; code-point count uses trimmed reason; stale error clears on editing |
| Feedback previews | Passed in browser | [loading](screenshots/phase1-loading.png), [empty](screenshots/phase1-empty.png), [error](screenshots/phase1-error.png); retry returns to catalog |
| Reviewer variant | Passed in browser | Review queue navigation present; zero Request access buttons; resource controls read-only; role is a fixture toggle only |
| Token contrast | Passed calculations | muted 5.86:1, olive on beige 5.84:1, status pairs 5.98–8.70:1; no whole-app WCAG certification claim |
| Production build/runtime | Passed | final npm run build; fresh browser session on production Express port 3002 renders catalog, simulates failure, retries successfully; zero console errors |
| Reduced-motion device behavior | Passed for Phase 1 | device preference reports reduce=true; card transition 0.00001 seconds, entrance transform none; dialog keyboard/focus behavior still passes |
| Extra narrow width | Passed | 320px viewport, document scrollWidth 305; no overflow |
| Dependency install/audit | Passed | final install/uninstall reports 235 audited packages, zero vulnerabilities |
| Foundation regression | Passed | npm test, 5/5; no database/workflow test coverage claim |

Reference comparison: retained warm palette, horizontal header, editorial hero, beige sculpture, rounded cards, icon tiles, and bottom actions. Exact font sizes follow DESIGN.md rather than the generated image's oversized titles. Search/category chips were intentionally omitted. Eligibility guidance, rejected/cancelled examples, and a small fixture notice were added as required. Artwork uses the clean asset with its own composition instead of screenshot pixels; bounded sizing and a soft mask avoid a harsh opaque edge. At mobile the header uses two compact horizontal rows, artwork disappears, and dialog actions stack. Request summaries/navigation are read-only fixture dialogs, not Phase 4 request pages. No material palette/navigation/action-placement drift remains; full persisted role/state comparisons and OS reduced-motion walkthrough remain later-phase work.

CSS disables animation/travel on reduced-motion preference; Motion card entrance removes travel/stagger under that preference. The current browser device already has reduced motion enabled; verified that preference and the computed transition/entrance behavior without changing operating-system settings. Normal-motion device smoothness and Phase 6's whole-app accessibility/motion acceptance remain open. Phase 0's Kiro identity and genuine-task gates also remain open.

During dependency changes, Vite's existing tab logged invalid hook calls referencing different dependency optimizer hashes. npm ls shows React/react-dom 19.3.0 deduplicated. Reloading after optimization recovered the development page; a separate fresh production tab reproduced no hook errors and passed dialog/failure/retry interactions. The transient development-session errors are recorded rather than treated as a release workflow test.
