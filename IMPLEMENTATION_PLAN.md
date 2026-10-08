# LabAccess — Phase-by-Phase Implementation Plan

**Version:** 1.1  
**Planning date:** October 8, 2026  
**Status:** Phases 1–5 and Phase 7 verified locally; Phase 6 implementation and reduced-motion checks verified. Full-motion visual acceptance, genuine Kiro evidence, human explanation, and hosting/submission remain open.
**Requirements:** [PRD.md](PRD.md)  
**Visual specification:** [DESIGN.md](DESIGN.md)  
**Selected reference:** [sample-ui.png](sample-ui.png)  
**Clean artwork asset:** [assets/labaccess-hero.png](assets/labaccess-hero.png)  
**Page-by-page image guidance:** [docs/UI_REFERENCE_GUIDE.md](docs/UI_REFERENCE_GUIDE.md)

## 1. Outcome and delivery rules

Deliver a small MERN application in which a learner requests a resource, a reviewer decides, and the learner sees the persisted result and full history. Support cancellation and resubmission without weakening ownership, role checks, duplicate prevention, or concurrency handling.

Match the selected warm white/beige design using reusable React components and restrained Motion animations. Use Code0 or Kiro on actual development tasks and document 3–5 concrete examples.

- Conservative deadline: **October 11, 2026, 1:21 PM IST**.
- Target submission: **October 11, 2026, 7:21 AM IST**.
- Hours below are elapsed from receipt, include sleep/breaks, and do not represent 72 working hours.
- If starting late, keep the submission target and shorten optional work. Do not restart a fresh 72-hour clock.
- Freeze feature additions at elapsed hour 40.
- Complete means implementation plus its stated verification evidence. Do not mark a phase complete on screenshots, scaffolding, or successful installation alone.
- This plan authorizes development preparation; publishing and emailing are deliberate submission actions, not implied by finishing a phase.

## 2. Architecture and modularity contract

Use a single Express application with feature modules and one MongoDB database. Use a React frontend organized around the same business features. No microservices, event bus, generic repository framework, or duplicate reviewer backend.

### Ownership

| Area | Owns | Does not own |
|---|---|---|
| Auth | Users, sessions, credentials, role guards | Request transitions |
| Resources | Resource definitions, availability, catalog queries | Learner decisions |
| Requests | Submission, transitions, history, learner lists, reviewer queue | Password/session internals |
| Shared UI | Primitives, layout, typography, reusable feedback | API calls or permissions |
| API client | Credentials, HTTP/CSRF handling, normalized errors | JSX or database rules |

Review is a role-specific view of the requests feature. Avoid two copies of decision/history logic.

### Dependency rules

1. Pages compose components and call feature hooks.
2. Presentational components receive data and callbacks; they do not fetch or inspect browser storage.
3. Feature hooks coordinate server reads, mutations, and loading/error state.
4. Controllers parse HTTP input and map service results to responses.
5. Services enforce ownership, valid transitions, and persistence rules.
6. Models define data shape and indexes. Database calls stay inside their owning module.
7. Shared code must not import feature pages. Avoid circular feature imports; use a small exported module interface when necessary.
8. Extract shared components after genuine reuse appears. Do not add abstractions only to reduce a few similar lines.

### Suggested structure

```text
LabAccess/
  PRD.md
  DESIGN.md
  IMPLEMENTATION_PLAN.md
  sample-ui.png
  assets/
    labaccess-hero.png      # Clean hero/auth artwork, not a UI screenshot
    README.md              # Runtime placement, sizing, generation prompt
  README.md
  package.json
  client/
    src/
      app/                 # Routes, providers, application entry
      components/
        ui/                # Customized shadcn primitives
        layout/            # Header, navigation, page container
        feedback/          # Loading, empty, error states
      features/
        auth/              # Pages, API calls, session hook
        resources/         # Catalog page, cards, resource hook/API
        requests/          # Dialog, lists, queue, details, history
      lib/                 # HTTP client, error helpers, motion presets
      styles/              # Tokens and global typography
  server/
    src/
      config/              # Environment, database, session configuration
      middleware/          # Authentication, validation, error mapping
      modules/
        auth/              # Routes, controller, service, user model
        resources/         # Routes, controller, service, resource model
        requests/          # Routes, controller, service, request model
      scripts/             # Guarded seed command
      app.js               # Testable Express app composition
      server.js            # Connect database and start listener
    tests/
      integration/         # API, indexes, permissions, concurrency
      unit/                # Only meaningful isolated domain behavior
  docs/
    UI_REFERENCE_GUIDE.md   # Page gallery, role/state guidance, review gate
    UI_REFERENCE_PROMPTS.md # Exact image-generation prompts
    ui-references/         # Twelve approved-theme visual references
    architecture.md
    api-contract.md
    ai-usage.md
    verification.md
    screenshots/
```

Use TypeScript if already comfortable; otherwise use consistent JavaScript with clear validation and types documented where useful. Create files when their responsibility exists, not as empty placeholders.

## 3. Phase map

| Phase | Elapsed checkpoint | Deliverable |
|---|---|---|
| 0 — Scope and setup | 0–2h | Runnable foundations, contracts, AI tool verified |
| 1 — Design foundation | 2–4h | Resource page with reusable components and fixtures |
| 2 — Data and authentication | 4–9h | MongoDB, sessions, protected routes, seed |
| 3 — Workflow backend | 9–16h | Request APIs, atomic transitions, critical tests |
| 4 — Learner-to-reviewer integration | 16–24h | Complete persisted browser journey |
| 5 — Complete core behavior | 24–32h | Cancellation, resubmission, filters, pagination |
| 6 — Design and motion finish | 32–40h | Responsive warm UI and restrained motion |
| 7 — Integration validation | 40–54h | Release-critical failures resolved |
| 8 — Documentation and reproducibility | 54–62h | Fresh-clone setup, README, evidence |
| 9 — Optional hosting and submission | 62–66h | Reviewed public repository and submitted link |
| 10 — Recovery buffer | 66–72h | Critical repairs only |

Phase 9 hosting is optional. Do not postpone the required repository submission while waiting for hosting.

### Page reference contract for every UI phase

Open the relevant image before implementation and compare a browser screenshot after implementation. Preserve the selected warm white/beige/charcoal/olive palette, horizontal navigation, typography roles, rounded cards, and action placement. Reuse the same React primitives across every reference.

| Page/state | Reference image | Main phases |
|---|---|---|
| Resources | [01-resources.png](docs/ui-references/01-resources.png) | 1, 4 |
| Login | [02-login.png](docs/ui-references/02-login.png) | 2 |
| Registration | [03-registration.png](docs/ui-references/03-registration.png) | 2 |
| Request dialog | [04-request-dialog.png](docs/ui-references/04-request-dialog.png) | 1, 4 |
| My requests | [05-my-requests.png](docs/ui-references/05-my-requests.png) | 4, 5 |
| Learner pending details | [06-learner-pending.png](docs/ui-references/06-learner-pending.png) | 4, 5 |
| Rejected request/resubmit | [07-learner-resubmit.png](docs/ui-references/07-learner-resubmit.png) | 5 |
| Reviewer queue | [08-review-queue.png](docs/ui-references/08-review-queue.png) | 4, 5 |
| Reviewer decision | [09-reviewer-decision.png](docs/ui-references/09-reviewer-decision.png) | 4 |
| Learner approved details | [10-learner-approved.png](docs/ui-references/10-learner-approved.png) | 4, 5 |
| Access denied | [11-access-denied.png](docs/ui-references/11-access-denied.png) | 4, 7 |
| Not found | [12-not-found.png](docs/ui-references/12-not-found.png) | 4, 7 |

Images define visual direction, not new business requirements. PRD.md governs behavior; DESIGN.md governs exact tokens, accessible typography, responsiveness, and motion. Sample names, dates, display IDs, character counters, and overly large headings must be replaced with real data and shared styles. Search/category controls remain optional. Read the guide's role/state notes before copying a layout.

**UI completion gate:** record a screenshot comparison at desktop/tablet/mobile widths, verify the correct role/actions and error/loading/empty variants, and resolve material visual drift before marking the UI phase complete. A screenshot cannot validate animations; interact with the built application.

## 4. Phase 0 — Scope, tool setup, and contracts

**Goal:** remove setup uncertainty before developing features.

### Tasks

- [x] Read PRD.md and DESIGN.md; preserve the latest white/beige theme and horizontal navigation.
- [x] Read docs/UI_REFERENCE_GUIDE.md and keep the page image mapping available to Code0/Kiro during implementation.
- [ ] Confirm access to Code0 or Kiro and complete one genuine small development task. Log the tool and output.
- [ ] If Kiro is chosen, resolve the email's domain mismatch before representing a different product as the required tool.
- [x] Initialize a local Git repository if none exists; preserve existing work if present.
- [x] Record the chosen Node/npm versions. Use compatible supported dependency versions; commit lockfiles.
- [x] Set up React/Vite and Express with root commands for development, tests, build, and seed. Validate commands as they are introduced. Seed currently refuses clearly; real synthetic data arrives in Phase 2.
- [x] Commit .gitignore and .env.example; ignore actual .env files, dependencies, and build output.
- [x] Configure a Vite /api proxy in development. Prefer same-origin frontend/API production hosting.
- [x] Specify success/error envelopes, status codes, pagination, and session behavior in docs/api-contract.md.
- [x] Specify registration name/password limits in addition to the PRD's reason limits; never trim passwords.
- [x] Write a short architecture note explaining feature ownership, server sessions, and embedded history.

### Contract decisions

- IDs cross the HTTP boundary as strings; reject malformed IDs with controlled 400 responses.
- Reason text is trimmed before length checks. Request: 20–1,000 characters; decision: 10–500.
- Server creates actor identity, status, history, and timestamps; clients cannot overwrite them.
- Lists return data plus page, pageSize, total, and totalPages. Reject invalid filters/negative pages and cap page size at 50.
- Use a secondary ID sort for stable order when timestamps match.
- Add an integer workflow revision to each request. Mutation bodies send the revision displayed to the user. Conditional writes check status and revision and increment the revision on success. This prevents an old action from applying to a request that was cancelled and resubmitted into pending again.

### Exit gate

- [x] React starts and reaches an Express endpoint through /api.
- [x] Database connection succeeds or reports a clear controlled failure.
- [ ] The required AI tool has been used, not merely installed.
- [x] No secrets are staged; initial project commit is reviewable.

October 8 evidence: [verification ledger](docs/verification.md). Foundations pass; Phase 0 remains in progress pending the real named-tool task and Kiro domain clarification. User will create an account; official Kiro Free is recommended, not yet verified as assessment-approved.

**Suggested commit:** `chore: initialize LabAccess and document contracts`.

## 5. Phase 1 — Design system and first resource page

**Open before implementation:** [resource catalog](docs/ui-references/01-resources.png) and [request dialog](docs/ui-references/04-request-dialog.png). Match these compositions using shared components; do not invent another theme or navigation layout.

**Goal:** establish the visual language through one realistic page, without building all screens at once.

### Tasks

- [x] Define semantic color tokens from DESIGN.md: background, surface, border, text, muted text, olive, and status colors.
- [x] Configure heading/body typography, spacing, radii, focus styles, and a centered content container.
- [x] Customize shadcn Button, Card, Badge, Input, Textarea, Dialog, and Skeleton only as needed.
- [x] Build AppHeader with learner/reviewer navigation variants and a compact profile menu.
- [x] Build CatalogHero, ResourceCard, ResourceGrid, StatusBadge, EmptyState, and ErrorState.
- [x] Render the six sample resources through one fixture module. Include pending, approved, rejected, and cancelled examples.
- [x] Keep ResourceCard pure: receive resource, status, and action callbacks; no HTTP calls inside it.
- [x] Implement a labelled request dialog with a controlled reason field and a clearly temporary fixture callback.
- [x] Match the sample at desktop/tablet/mobile widths. Use three/two/one columns.
- [x] Use [assets/labaccess-hero.png](assets/labaccess-hero.png) for CatalogHero; follow [asset usage notes](assets/README.md) when placing it in the React runtime. Keep text/buttons as real components and never use the screenshot as the UI background.
- [x] Omit search/category controls until they work; they are optional under the PRD.

### Exit gate

- [x] The catalog clearly matches the warm modern reference.
- [x] Cards and dialogs work by keyboard; focus returns to the opening control.
- [x] No horizontal overflow at 375px width.
- [x] Loading, empty, and error states can be previewed.
- [x] Fixture-mode submission is not represented as persisted functionality.
- [x] Compare the catalog/dialog against their images and record desktop/mobile differences.

**Suggested commit:** `feat: build warm resource catalog and shared UI`.

## 6. Phase 2 — MongoDB, sessions, and role protection

**UI guidance:** [login](docs/ui-references/02-login.png) and [registration](docs/ui-references/03-registration.png). Use one public AuthLayout, without a role picker or unimplemented social/password-reset controls.

**Goal:** provide trusted identities and real data before request mutations.

### Tasks

- [x] Implement User and Resource models with unique normalized email and required fields.
- [x] Implement server-side sessions using established session middleware and a MongoDB session store.
- [x] Regenerate the session on login; store only the necessary identity; derive current role from a trusted server-side account.
- [x] Destroy the session and clear the matching cookie on logout.
- [x] Configure HTTP-only cookies, explicit SameSite policy, secure production cookies, and environment-driven expiry.
- [x] Add bounded login rate limiting and password hashing with an established library. Never log passwords.
- [x] Implement POST register/login/logout and GET me. Registration cannot assign reviewer role.
- [x] Protect mutation endpoints against cross-site requests; document the chosen CSRF mechanism and ensure the API client uses it. SameSite alone is not the entire policy.
- [x] Add requireAuth and requireRole middleware; route protection on the client is only presentation.
- [x] Add a guarded development/test seed for six resources, two learners, and one reviewer. Obtain demo passwords from documented setup/configuration; no real credentials.
- [x] Ensure seed is repeatable and refuses production/destructive resets by default.
- [x] Implement GET resources and health readiness. Health must reflect database readiness rather than always returning success.
- [x] Build auth pages/session bootstrap. Reuse [the clean artwork](assets/labaccess-hero.png) in the decorative AuthLayout panel. Wait for session resolution before role redirects to avoid UI flashes.

### Tests and exit gate

- [x] Signup with reviewer role cannot create a reviewer.
- [x] Duplicate normalized emails return controlled conflict.
- [x] Wrong credentials, unauthenticated calls, and learner reviewer-route calls fail appropriately.
- [x] Login/refresh works through the development proxy.
- [x] The old session fails after logout.
- [x] Cross-site mutation attempts are rejected under the chosen mechanism.
- [x] Resource cards load real MongoDB records; fixtures no longer back the normal app.

October 8 evidence: [verification ledger](docs/verification.md#phase-2--authentication-and-real-data-october-8-2026). All Phase 2 gates passed locally against real MongoDB and the browser proxy. Request/review workflow and public HTTPS hosting remain later-phase work.

**Suggested commit:** `feat: add database-backed authentication and resource catalog`.

## 7. Phase 3 — Request backend and critical correctness tests

**Goal:** establish workflow correctness before connecting all interfaces.

### Tasks

- [x] Implement AccessRequest with owner/resource references, reason, status, submission time, decision reason, revision, and embedded history.
- [x] Create the unique learner/resource compound index and list indexes. Ensure indexes exist before concurrency tests run; a model declaration alone is insufficient.
- [x] Implement create, own-list, authorized detail, cancellation, resubmission, reviewer-list, and decision routes from PRD.md.
- [x] Register specific routes such as /requests/mine before parameter routes.
- [x] Validate IDs, enums, lengths, revisions, pagination, and allowlisted fields.
- [x] Derive learner ID on creation; reject or ignore attempts to set actor/status/history.
- [x] Reject missing/inactive resource requests. Recheck resource availability on resubmission.
- [x] Translate database duplicate-key errors into the public 409 error format.
- [x] Use one transition service with explicit allowed transitions. Enforce role/owner rules for every action.
- [x] Perform conditional updates using ID, permitted status, expected revision, and owner where required. Update status/reason and append history in the same operation.
- [x] On resubmit update submittedAt, clear current decisionReason, retain earlier events, and increment revision.
- [x] Return 404 for another learner's request; 409 for a valid visible request with stale state/revision. Do not leak ownership details.
- [x] Project response fields so password hashes/session internals never appear through populated learner data.

### Required tests before exit

- [x] Two parallel submissions for the same pair yield one request and one conflict.
- [x] Learner A cannot read/cancel/resubmit learner B's request.
- [x] Learners cannot approve/reject or change their role.
- [x] Approved requests cannot be cancelled/resubmitted/decided again.
- [x] Parallel approve/reject yields one success, one conflict, one new event.
- [x] Parallel approve/cancel yields one success and one matching event.
- [x] An action based on an old revision fails even after cancellation/resubmission returns status to pending.
- [x] Failed transitions do not append history.
- [x] Rejected/cancelled resubmission preserves old reasons/history.
- [x] Invalid IDs/body/query values cause controlled errors.

Run these against an isolated test MongoDB database using real indexes, not only mocked persistence. Verify final documents as well as HTTP responses. Never point destructive test cleanup at development/production data.

October 8 evidence: [verification ledger](docs/verification.md#phase-3--workflow-backend-october-8-2026). All Phase 3 gates passed with real indexes and final-document checks. The actual server startup and persisted API journey also passed. Browser request/review integration remains Phase 4.

**Suggested commit:** `feat: implement request workflow and verify authorization and races`.

## 8. Phase 4 — Complete learner-to-reviewer browser journey

**Open before implementation:** [My requests](docs/ui-references/05-my-requests.png), [learner pending details](docs/ui-references/06-learner-pending.png), [reviewer queue](docs/ui-references/08-review-queue.png), and [reviewer decision](docs/ui-references/09-reviewer-decision.png). Also use the [request dialog](docs/ui-references/04-request-dialog.png), [access denied](docs/ui-references/11-access-denied.png), and [not found](docs/ui-references/12-not-found.png) references. Share shell/list/detail primitives while keeping role actions distinct.

**Goal:** one genuine persisted end-to-end flow by elapsed hour 24.

### Tasks

- [x] Implement a shared fetch client with credentials, CSRF behavior, readable normalized errors, and no automatic mutation retries.
- [x] Add feature APIs/hooks for resources, requests, session, and decisions. Use one consistent server-state approach; avoid mixing multiple caches.
- [x] Build catalog status mapping by resource ID from the learner's requests. The catalog must not infer status solely from the current visible list page.
- [x] For the small seeded catalog, load statuses across all learner request pages or add a documented bounded summary query if genuinely needed.
- [x] Connect the request dialog; prevent repeated submit while saving and preserve reason on failure.
- [x] Build My requests, Request details, RequestTimeline, and Review queue using the shared shell and statuses.
- [x] Connect reviewer DecisionPanel with reason validation, confirmation, pending state, and revision-aware mutations.
- [x] Refresh affected catalog/list/detail views after success. Do not show success or approved badges before persistence.
- [x] On 409 show that the request changed, refresh state, and require a new deliberate decision.
- [x] On uncertain write failures read the saved request/state first; distinguish a failed write from a successful write whose response was lost.
- [x] Provide role-aware routes and a useful not-found page. No persistent login data in localStorage.

### Exit gate

- [x] Learner logs in, requests MongoDB Learning Cluster, sees pending after refresh.
- [x] Reviewer logs in, sees the request, approves with a reason.
- [x] Learner sees approved state and matching history after refresh.
- [x] Two accounts cannot view each other's learner details.
- [x] The same behavior works with direct-page navigation, not only navigation from the catalog.

October 8 evidence: [verification ledger](docs/verification.md#phase-4--browser-workflow-october-8-2026). The persisted browser journey, owner isolation, stale decisions, and uncertain-write recovery passed locally. Phase 5 learner actions and genuine Kiro evidence remain open.

**Suggested commit:** `feat: connect learner requests and reviewer decisions end to end`.

## 9. Phase 5 — Finish core workflow and list behavior

**State guidance:** [pending](docs/ui-references/06-learner-pending.png), [rejected/resubmit](docs/ui-references/07-learner-resubmit.png), and [approved](docs/ui-references/10-learner-approved.png). Cancelled uses the rejected/resubmit layout with a Cancelled badge and cancellation context; do not invent reviewer feedback. Approved is read-only. These are variants of one request-details implementation.

### Tasks

- [x] Add pending cancellation with confirmation.
- [x] Add rejected/cancelled resubmission with an updated reason and preserved history.
- [x] Add all required status filters and pagination, including empty filtered results.
- [x] Reset the page appropriately when filters change or a mutation removes the last row.
- [x] Keep latest-first ordering for learner requests and oldest-first ordering for pending reviews.
- [x] Distinguish approved, pending, rejected, and cancelled catalog states.
- [x] Include eligibility guidance; show read-only resource controls to reviewers.
- [x] Show dates in one explicit, documented format/timezone consistently across lists/history.
- [x] Ensure inaccessible/missing requests, expired sessions, and server errors each have useful feedback.
- [x] Preserve filters during details/back navigation where practical.

### Exit gate

- [x] Cancel → resubmit → reject → resubmit → approve works on one document with a complete history.
- [x] Status filters/pagination do not expose other learners or lose request rows.
- [x] Terminal approved state is respected by UI and API.
- [x] Every advertised must-have is implemented before optional functionality.

October 8 evidence: [verification ledger](docs/verification.md#phase-5--complete-core-workflow-october-8-2026). The full six-event browser lifecycle, 21-row pagination, both-role last-row recovery, owner isolation, and lost-response/session recovery passed locally. Functional core gates are complete; genuine Kiro evidence and release acceptance remain open.

**Suggested commit:** `feat: complete cancellation resubmission and request filtering`.

## 10. Phase 6 — Responsive design, accessibility, and motion

**Visual review target:** compare every implemented page against [the complete reference gallery](docs/UI_REFERENCE_GUIDE.md#reference-gallery). Keep DESIGN.md authoritative for sizes/motion; use images for grouping and hierarchy. Reuse the theme source for reviewer catalog variants without learner-only controls.

**Goal:** polish existing behavior; freeze scope at hour 40.

### Tasks

- [x] Apply shared tokens throughout auth, catalog, lists, queue, and details. Remove accidental indigo/sidebar styles.
- [x] Keep the decorative hero on the catalog only; transactional pages should prioritize content.
- [x] Convert tables to readable cards on small screens and stack detail/action columns.
- [x] Finish profile/logout menus, active navigation, focus rings, status icon/text, and concise labels.
- [x] Verify heading order, labels, validation associations, keyboard interactions, dialog focus, and accessible announcements.
- [x] Check text/background contrast; adjust tokens if necessary.
- [x] Add Motion presets: entrance 350ms/12px, cards stagger 60ms, hover lift 4px/180ms, press 100ms, filter 220ms, dialog 180–220ms.
- [x] Cap cumulative stagger delays. Use opacity/transforms and avoid expensive looping artwork.
- [x] Respect reduced motion and maintain focus independently of transitions.
- [x] Keep skeleton dimensions stable; avoid unnecessary spinner/full-page replacement on every refresh.
- [x] If time remains, implement search/category filtering completely; otherwise omit the reference's optional controls.

### Exit gate

- [x] Review screenshots at approximately 375px, 768px, and 1440px.
- [x] No horizontal overflow or hidden primary actions.
- [x] Keyboard/reduced-motion walkthrough passes.
- [ ] Motion feels smooth on the tested device and never blocks interaction.
- [x] Every visible control has real behavior.
- [x] Record per-page screenshot comparisons in docs/verification.md and resolve material differences in palette, navigation, hierarchy, spacing, and action placement.

October 8 evidence: [verification ledger](docs/verification.md#phase-6--responsive-accessibility-and-motion-october-8-2026). All 12 references compared at 375/768/1440; extra workflow checks at 320/1280. Lighthouse accessibility scores are 100, all 54 tests pass, and slow reads retain content with safe action/focus handling. Optional search/category controls omitted. **Full-motion visual smoothness remains unverified:** the browser/device reports reduced motion enabled. Preset implementation and reduced-motion interaction are verified separately; this phase is not marked fully accepted.

**Suggested commit:** `feat: finish responsive warm UI and accessible motion`.

## 11. Phase 7 — Integrated validation and repair

**Recovery UI guidance:** [access denied](docs/ui-references/11-access-denied.png) and [not found](docs/ui-references/12-not-found.png), plus the guide's loading/empty/error-state table. Another learner's request must use neutral not-found behavior rather than revealing identity or ownership.

**Goal:** demonstrate the final combined application works, not just individual modules.

### Tasks

- [x] Run the critical tests after final frontend/backend integration.
- [x] Exercise browser journeys with two learners and one reviewer; include logout/refresh and direct URLs.
- [x] Test field boundaries, invalid resource IDs, expired sessions, inactive resources, empty filters, and pagination.
- [x] Test slow/failed reads and uncertain writes; ensure stale decisions never silently overwrite new state.
- [x] Test database-unavailable startup/readiness behavior; no success response when persistence fails.
- [x] Build the production React application and run it through the intended production server topology.
- [x] Verify cookie/CSRF settings under that topology; account for trusted proxies only when configured and needed.
- [x] Check unexpected errors for stack traces/secrets and check tracked files for committed credentials.
- [x] Resolve meaningful dependency/security findings relevant to the installed versions; record unresolved limits honestly.
- [x] Record actual command outcomes, environment, and evidence in docs/verification.md.

### Verification ledger

| Check | Result | Evidence | Open issue |
|---|---|---|---|
| Real-Mongo API integration | Passed | 40 backend checks; independent stored history reads | Isolated local MongoDB |
| Authorization and session tests | Passed | Roles, ownership, CSRF, expiry, production Secure cookie regression | Public HTTPS browser pending |
| Concurrent transition tests | Passed | Final suite and TLS decision race: 200/409, one event | — |
| Learner/reviewer browser flow | Passed locally | Two learners, reviewer; six events, 22-row pagination, stale/fault recovery | — |
| Mobile/keyboard/reduced motion | Passed within scope | Final 1440/375 captures, keyboard confirmations; Phase 6 matrix retained | Full-motion walkthrough open |
| Production build/run | Passed locally | Build; actual production HTTPS proxy/API and assets/deep links | Hosted browser flow open |
| Fresh clone | Passed in Phase 8 | Fresh GitHub clone, install/seed/test/build/run and deep-link repair | Named-tool/human gates separate |
| Hosted workflow, if provided | Not attempted | — | Optional |

Evidence and limitations: [docs/verification.md](docs/verification.md#phase-7--final-integration-and-release-correctness-october-8-2026). Phase 7 exit gate passes locally; earlier full-motion/Kiro and later fresh-clone/hosting gates remain open.

Do not translate local success into hosted success. Re-run only checks affected by repairs or unresolved concerns.

**Exit gate:** all required correctness checks pass, with no known authorization/data-integrity blocker and documented practical limitations.

**Suggested commit:** `fix: resolve integration issues and record verification`.

## 12. Phase 8 — README, evidence, and fresh-clone validation

### Tasks

- [x] Complete README project description, features, actual technologies, and current screenshots.
- [x] List exact supported prerequisites and commands as implemented, not placeholder scripts.
- [x] Document .env values, session/CSRF behavior, local MongoDB or Atlas setup, seed, and demo accounts.
- [x] Include install, development, test, seed, build, and production-run instructions.
- [x] Explain role restrictions, duplicate prevention, embedded history, revision checks, and approval's limited meaning.
- [ ] Identify Code0 or Kiro explicitly. Describe 3–5 real tasks and link evidence/commits.
- [x] Document genuine AI mistakes and fixes if encountered. Do not fabricate one to satisfy the assessment.
- [x] List known omissions and limitations; distinguish optional hosted demo from required local reproducibility.
- [x] Commit current screenshots, never static concept images presented as working app screenshots.
- [x] Keep docs/ui-references labelled as design references; store actual application screenshots separately in docs/screenshots.
- [x] From a separate clean checkout, follow the README literally: install, configure, seed, test, build, and run.
- [x] Correct any undocumented command/environment dependency and repeat only the affected checks.

### Exit gate

- [x] Fresh clone works without copying hidden local files.
- [ ] README covers all eight requested categories from the email.
- [x] AI evidence is truthful and specific.
- [ ] Developer can explain sessions, ownership, transitions, indexes, revisions, and UI data flow independently.

October 8 result: documentation and fresh-clone setup verified; full Phase 8 acceptance remains open for 3–5 genuine named-tool tasks and the human explanation walkthrough. Five of eight email content categories are complete; the three AI-use categories honestly report the missing evidence. See [verification](docs/verification.md#phase-8--documentation-and-fresh-clone-october-8-2026) and [developer walkthrough](docs/developer-walkthrough.md).

**Suggested commit:** `docs: finalize setup AI evidence and reproducibility`.

## 13. Phase 9 — Optional hosting, repository review, and submission

### Optional hosting

- [ ] Attempt only if required local gates already pass and time permits.
- [ ] Configure production environment/session secrets and database access outside Git.
- [ ] Verify HTTPS cookies, cross-site protections, readiness, SPA deep links, and actual browser workflow.
- [ ] Use synthetic isolated demo data. Treat any public demo credentials as intentionally public, never reused private credentials.
- [ ] If hosting fails, submit the working public repository with accurate local setup; do not spend the recovery buffer choosing platforms.

### Required submission preparation

- [x] Create/publish the repository publicly as a deliberate user submission action.
- [x] Review repository while logged out: files, README, images, links, clone instructions.
- [x] Confirm the submitted branch contains the tested final commit and both frontend/backend.
- [x] Check history, not only current files, for credentials/private content before publishing.
- [x] Ensure no placeholder badges, broken demo links, or exaggerated verification claims.
- [ ] Share the public repository URL in the original email thread when ready to submit; record actual submission time.

October 8: repository review/preparation verified; [local submission draft](docs/submission-preparation.md) and [evidence](docs/phase9-checks.json). Hosting not attempted while required Kiro/human gates remain open. Main contains the tested source; recheck it after Kiro changes. No email sent, so Phase 9 exit gate remains open.

**Exit gate:** public access confirmed and the repository link actually submitted. A prepared draft alone is not submission.

## 14. Phase 10 — Recovery buffer

Fix only failures that affect setup, core flow, authorization, data integrity, or submission. Reverify affected behavior and update the README/ledger if the final state changes. No new libraries, dashboards, integrations, or optional feature expansion.

## 15. AI usage workflow throughout the phases

Use small tasks with explicit file ownership and acceptance criteria. Review the diff, understand the output, and verify before committing.

| Candidate task | Best phase | Evidence to retain |
|---|---|---|
| Draft schema and validation | 2–3 | Prompt, corrected fields, index test |
| Scaffold request controller/service | 3 | Ownership/transition review, tests |
| Build React card/queue/dialog | 1 or 4 | Component diff, visual/keyboard check |
| Suggest concurrency/permission cases | 3 or 7 | Real test outcomes and corrections |
| Investigate actual failure | Whenever encountered | Reproduction, root cause, fix, regression |

Log template in docs/ai-usage.md:

```text
Task/date:
Tool:
Prompt summary:
Affected files:
Accepted suggestions:
Rejected or corrected suggestions:
Observed issue and reproduction, if any:
Verification and outcome:
Commit:
```

Do not mark all five rows used merely because they were planned. Three well-documented genuine tasks satisfy the lower bound.

## 16. Phase handoff prompt template

Give Code0 or Kiro the following, replacing the bracketed fields with one phase only:

```text
Read PRD.md, DESIGN.md, and IMPLEMENTATION_PLAN.md.
Read docs/UI_REFERENCE_GUIDE.md and open the image(s) linked from this phase.
Implement Phase [number]: [title].
Inspect existing code before editing; preserve completed behavior.
Keep feature boundaries, shared tokens, and server-owned permissions.
Limit changes to files needed for this phase; do not add optional features.
Implement the listed acceptance criteria and run relevant verification.
Explain meaningful decisions and any AI-generated issue you corrected.
Report changed files, actual checks, and open blockers.
Update the evidence ledger; do not mark unverified work complete.
For UI changes, compare the implemented page with the linked image and report visual differences. Preserve the selected theme and shared components.
```

## 17. Daily progress tracking

Keep one short tracker, rather than duplicating status across documents:

| Phase | State | Commit/evidence | Next action |
|---|---|---|---|
| 0 | In progress | Phase 0 foundation commit; docs/verification.md | Kiro account, identity clarification, one genuine task |
| 1 | Verified complete | Phase 1 UI commit; docs/verification.md | Preserved at /preview |
| 2 | Verified complete | Phase 2 auth/data commit; docs/verification.md | Auth retained and regression-tested |
| 3 | Verified complete | Phase 3 workflow commit; docs/verification.md | Backend retained and regression-tested |
| 4 | Verified complete | Phase 4 browser workflow commit; docs/verification.md | Browser flow retained and regression-tested |
| 5 | Verified complete | Phase 5 core workflow commit; docs/verification.md | Core workflow retained and regression-tested |
| 6 | Implemented but unverified in full | 43081be; responsive/a11y/reduced-motion evidence | Full-motion subjective walkthrough remains open |
| 7 | Verified complete locally | docs/verification.md and phase7 checks/screenshots | Phase 8 documentation/fresh clone |
| 8 | In progress | README, phase8-checks.json, clean-clone screenshot; 8d7cd1b setup repair | Genuine Code0/Kiro tasks and human explanation |
| 9 | In progress | Public logged-out review, phase9-checks.json, submission-preparation.md | Finish Kiro/human gates; review final commit and deliberately submit |
| 10 | Reserved | — | Critical recovery only |

States: Not started, In progress, Implemented but unverified, Verified complete, or Blocked with a concrete reason.

## 18. Scope recovery decisions

| If time runs short | Keep | Cut first |
|---|---|---|
| During initial UI | Shared tokens, catalog/cards, usable form | Elaborate artwork |
| During backend | Sessions, ownership, atomic transitions, indexes | Optional resource search |
| During integration | Complete request/decision/history journey | Count summaries and extra filters outside PRD |
| During polish | Responsive controls, feedback, reduced motion | Decorative animation |
| During submission | Fresh clone, README, AI evidence, public URL | Hosting and demo recording |

Never cut an advertised core feature silently. Record an unavoidable limitation clearly and preserve required authorization and data-integrity protections.
