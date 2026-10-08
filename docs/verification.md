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

## Phase 2 — authentication and real data, October 8, 2026

Implemented MongoDB User/Resource schemas and unique normalized-email/resource-slug indexes; Argon2id password hashing; express-session/connect-mongo; rolling HttpOnly SameSite=Lax cookies with Secure production policy; current-account auth/role guards; synchronizer CSRF plus exact origin/referer checks; register/login/logout/me/csrf; and paginated authenticated resource reads. Identity and CSRF token are the only session payload fields beyond middleware cookie metadata. No passwords, hashes, connection strings, or session internals are returned. Registration rejects role assignment. Login replaces the session and token. Logout destroys the stored session and clears the matching cookie.

The normal client now waits for session bootstrap and renders MongoDB data through a resource hook/API client. Login and registration share the warm AuthLayout/artwork, with labelled errors, focus recovery, show/hide password, busy states, and preserved inputs on failure. Existing fixtures remain only at /preview with explicit unsaved labels. Request buttons and queue navigation are omitted from the live catalog until their workflow is implemented. /review is a role-protected placeholder; /api/review is guarded but its workflow routes still return 404 for authorized reviewers.

| Check | Result | Evidence / limit |
|---|---|---|
| Automated tests | Passed, 19/19 | Native Node test runner + supertest + genuine isolated mongod. Includes parallel normalized-email creation (201/409), trusted account role change, no reviewer signup, wrong credentials, anonymous denial, old-session replay after regeneration/logout, stored-session expiry, CSRF/origin/stale-token rejection, configured cookie/store TTL, strict resource queries, inactive records, rate limit/Retry-After, seed guards, and unavailable DB 503 |
| Build / dependency audit | Passed / zero vulnerabilities | Production Vite build; separate /preview chunk. Main chunk remains about 521 kB and produces a non-failing size advisory; no full performance acceptance claimed |
| Development proxy | Passed live | Browser registration → explicit login → MongoDB cards; learner and second learner login; reviewer identity/route; login survives reload; logout survives reload |
| Real data / persistence | Passed live | Six string ObjectId resources from MongoDB; synthetic browser learner account created. Stopped mongod: session bootstrap hid private content and showed controlled failure. Restarted same persisted database: retry recovered existing session/cards |
| Seed | Passed | npm run seed populated six resources/two learners/one reviewer from configured synthetic password. Integration repeat kept counts/IDs; insert-only upserts preserve existing data and passwords. Production/non-demo database/missing password refused before connection; no reset mode |
| Auth desktop/tablet/mobile | Passed locally | Opened login and registration reference images. Screenshot comparisons at 1440×1000, 768×1024, 375×812. Shared split panel/artwork and warm theme; headings follow DESIGN sizes rather than oversized reference text. Mobile stacks a short decorative panel over form; tablet retains two panels |
| Catalog desktop/tablet/mobile | Passed locally | Real data, three/two/one columns; 375px document scrollWidth=375; 768px auth scrollWidth=768. No horizontal overflow |
| Keyboard/errors | Passed live | Enter submits login; profile-menu Enter signs out. Confirm mismatch focuses confirm; duplicate normalized email focuses email after inputs re-enable, aria-invalid/associated error shown. Incorrect credentials preserve fields. Busy controls observed disabled |
| Built same-origin app | Passed locally | npm start on loopback port 3002 with development cookie/origin settings, built client and API together: login, refresh, logout, zero console errors/warnings. This is not production HTTPS verification |
| Cookie production boundary | Policy verified, public transport pending | Tests verify Secure/HttpOnly/Lax/path and require HTTPS APP_ORIGIN. Current loopback server trusts no proxy. Hosted TLS/proxy verification remains Phase 9 |
| Named AI tool | Pending | Codex work does not close Phase 0's Kiro identity/use gates |

Screenshots: [desktop login](screenshots/phase2-login-desktop.png), [tablet login](screenshots/phase2-login-tablet.png), [mobile login](screenshots/phase2-login-mobile.png), [desktop registration](screenshots/phase2-registration-desktop.png), [tablet registration](screenshots/phase2-registration-tablet.png), [mobile registration](screenshots/phase2-registration-mobile.png), [registration conflict](screenshots/phase2-registration-error.png), [desktop catalog](screenshots/phase2-catalog-desktop.png), [tablet catalog](screenshots/phase2-catalog-tablet.png), [mobile catalog](screenshots/phase2-catalog-mobile.png), [database failure](screenshots/phase2-database-error.png).

Verification found and fixed eager Mongoose model initialization before connection while buffering was disabled; unique indexes now initialize explicitly after connection. Browser testing found that focusing an async field error while the input was still disabled did not move focus; focus now follows re-enablement and was rechecked. Entry-module edits produced development-only duplicate createRoot warnings during HMR; the root now persists in Vite's hot-module data. A separate fresh built-client tab had no console errors or warnings. These findings are not hidden behind screenshots.

Docker's engine was unavailable, so development/testing used a genuine local MongoDB binary through mongodb-memory-server. Development data resides in ignored .local/mongodb; tests use a distinct disposable database. No MongoDB system service was installed. Actual .env and database files remain ignored. Phase 2 is verified locally; request state transitions, workflow ownership/concurrency, full browser request/review/history, public hosting, and assessment submission remain unimplemented later-phase gates.

A final seed regression check compared entire pre-existing documents while changing SEED_DEMO_PASSWORD. It exposed Mongoose's automatic updatedAt modification on repeat upserts. Seed now disables update timestamps and supplies timestamps only on insertion; the regression passes and repeat seeding preserves complete documents, including password hashes and timestamps. The final suite remains 19/19.

## Phase 3 — workflow backend, October 8, 2026

Implemented AccessRequest with immutable owner/resource references, status, reason, submittedAt, decisionReason, revision, timestamps, and embedded history. Added controller validation, owner/request routes, reviewer routes, and one explicit transition table/service. Startup creates the unique learner/resource index and stable list indexes before readiness succeeds. Specific /requests/mine is registered before /requests/:id. Resource/auth services export small safe summary interfaces; request responses explicitly project all fields.

| Check | Result | Evidence / limit |
|---|---|---|
| Automated suite | Passed, 38/38 | npm test; 19 existing foundation/auth checks plus 18 workflow cases and one actual-server startup/API journey |
| Real indexes / duplicates | Passed | Isolated mongod with built unique pair and list indexes. Two parallel submissions returned 201/409; final collection had one document and one submit event. Duplicate creation still conflicts after approval |
| Ownership / roles | Passed | Other learner read/cancel/resubmit returned 404 and left the complete document unchanged. Reviewer learner-only actions and learner reviewer actions returned 403. Anonymous reads returned 401. Existing signup/current-role tests remain green |
| Terminal and allowed transitions | Passed | Approved cannot cancel/resubmit/decide again. Reject → resubmit → cancel → resubmit stays on one document with revision 4 and all five reasons/events retained |
| Concurrency | Passed | Parallel approve/reject and approve/cancel returned one 200 and one 409. Final revision=1, history length=2, persisted status/event/actor match the winner. Parallel resubmissions added one event/revision only |
| Stale pending actions | Passed | Old revision 0 failed after cancel/resubmit restored pending at revision 2; complete stored document unchanged. A current revision 2 decision then succeeded |
| Resource availability | Passed | Missing/inactive resource creation failed; inactive resource resubmission failed without changing state/history |
| Validation / CSRF | Passed | Controlled invalid ID/body/query/revision/status/length errors; owner/status/history injection refused, repeated pagination rejected. Unicode reason bounds count code points. Missing/cross-site tokens rejected; no invalid operations appended history |
| Lists / projections | Passed | Owner isolation, filters, empty metadata, stable tie-breaking and pagination; reviewer defaults pending oldest-first and all filter includes decisions. Learner/resource summary keys explicitly checked; no credential/session fields in responses |
| Actual server startup | Passed | Dedicated MongoDB + child node src/server.js with synthetic test configuration and ephemeral port. Health ready after real workflow index creation. Seeded learner login → resource → request → reviewer queue/approval → owner approved detail with revision 1/two events; one persisted document |
| Client build / audit | Passed / zero vulnerabilities | npm run build and npm audit --json. Existing roughly 521 kB main-chunk advisory remains non-failing; no UI changes or new performance acceptance claimed |
| Data isolation | Passed | Each suite launched its own labaccess_test_* database through genuine mongod (8.2.6). Cleanup targets only those self-created disposable databases. No development database cleanup or real user data used |
| Browser workflow | Pending, Phase 4 | Phase 3 verifies real HTTP APIs and persistence; live request dialog/queue/history integration has not been claimed |
| Named tool / hosting | Pending | Phase 0's genuine Kiro identity/use and public HTTPS hosting gates remain open |

The initial new parallel-submission acceptance test failed with 404/404 before implementation, confirming the old app did not serve workflow routes. After implementation it passed with 201/409 and final-document assertions. The previous auth test's expected reviewer-route 404 was updated to 200 because the real queue now exists behind the same trusted-role guard.

All mutations derive the actor from the authenticated account. Creation supplies initial state/history on the server. Every transition checks visibility/role and conditions its single state/history/revision update on the previous status and expected revision (plus owner for learner actions). Server timestamps are shared by event and update; resubmission updates submittedAt and clears only the current decisionReason. Errors distinguish hidden/missing 404 from visible stale/conflicting 409. Resource activity is checked immediately before creation/resubmission; resource-editing transactions/UI are outside this MVP. On an uncertain write response, the Phase 4 client must read saved state before offering another mutation.

Phase 3 is verified locally. The full browser request/reviewer/history journey, remaining learner UI behavior, integrated accessibility/motion, fresh-clone acceptance, public hosting, and assessment submission remain later-phase work. Phase 0 remains in progress for genuine named-tool evidence.
