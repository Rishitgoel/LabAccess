# AI usage evidence

## Named-tool gate

October 8, 2026: user asked for the best suited tool offering free credits and will create an account. Recommendation: Kiro IDE on its Free tier. [Official pricing](https://kiro.dev/pricing/) currently lists $0/month and 50 monthly credits; [official download](https://kiro.dev/downloads/). Account access and a real development task are pending. Free credits do not establish assessment compliance.

The original assessment email was read on October 8 and explicitly links Kiro to `https://app.kiro.de/`, while the official IDE is `https://kiro.dev/`. The email names Code0 using the extension ID `frigga.code0`; it must not be confused with other similarly named services. No employer clarification or verified redirect resolves the Kiro mismatch yet. Do not represent official Kiro as employer-confirmed, or installation as actual use. No clarification email has been sent.

## Actual assistance so far

- Tool: Codex (not a substitute for Code0/Kiro).
- Task: Phase 0 foundation, contracts, and readiness verification.
- Affected files: client/server foundations, package manifests/lockfile, environment examples, README, architecture/API/evidence documents, implementation tracker.
- Accepted: small diagnostic React page; separate Express app factory/startup; sanitized bounded database failures; same-origin build serving; documented validation and revision rules.
- Corrected: initial dependency range selected concurrently with a vulnerable pinned shell-quote dependency. npm audit fix alone could not resolve it; an explicit patched shell-quote override was added and verified. Local HTTP tests initially failed because the sandbox denied loopback connections; the same tests passed with permitted localhost access.
- Verification: see [verification ledger](verification.md). Commit: initial Phase 0 commit in local Git history.

## First Kiro task (prepared, not executed)

Open this repository in the signed-in Kiro IDE and run this bounded prompt:

```text
Read PRD.md, DESIGN.md, IMPLEMENTATION_PLAN.md Phase 0,
docs/UI_REFERENCE_GUIDE.md and docs/api-contract.md.
Inspect server/src/app.js and server/tests/foundation.test.js.
Add one integration test proving an oversized JSON body returns controlled
413 PAYLOAD_TOO_LARGE without exposing internals. Change only the test file
unless a reproduced failure requires a small app fix. Run npm test, explain
the result, and report the diff. Do not implement later-phase features.
```

Retain the actual prompt/output, accepted diff, command result, and commit; then fill the entry below. Until that happens, there are zero verified Code0/Kiro tasks.

```text
Task/date:
Tool and version:
Prompt summary:
Affected files:
Accepted suggestions:
Rejected or corrected suggestions:
Observed issue and reproduction, if any:
Verification and outcome:
Commit:
```

## Phase 1 actual assistance — Codex

Task/date: October 8, 2026, resource catalog and shared UI. Tool: Codex, plus official shadcn CLI 4.21.4 for component source generation (not named assessment-tool evidence). Accepted: warm tokens, locally bundled fonts/artwork, pure resource cards, four fixture statuses, Radix focus management, trimmed code-point reason validation, and temporary submission feedback. Corrected after browser review: intrinsic artwork sizing made the hero too tall; switched to a bounded decorative image. Added explicit focus restoration for dialogs opened from the profile menu and retained textarea focus while saving. Cleared stale validation errors when editing. Replaced the redundant clsx/tailwind-merge helper with the generated components' current cn helper.

Verified: keyboard opening/Escape/focus trap, 375px dialog, failed submission retains input, deliberate retry, fixture-only confirmation, loading/empty/error previews, reviewer read-only controls, three/two/one-column screenshots, device reduced motion, final production runtime, build and existing foundation tests. Investigated transient hook errors while Vite re-optimized dependencies: dependency tree has one React version, reloaded development page recovered, and a fresh production browser had zero errors through failure/retry. See the Phase 1 ledger. Named Code0/Kiro usage is still zero verified tasks; do not count Codex work toward that requirement.

## Five completed Codex task examples — not Code0/Kiro compliance

All task requests below were phase requests from the user on October 8, 2026. The summaries describe accepted work; they are not fabricated verbatim transcripts of another tool. Code0/Kiro completed-task count remains **zero** until genuine evidence is supplied.

| Task / request summary | Affected files and accepted work | Corrections / limits | Verification and commit |
|---|---|---|---|
| Phase 2: connect accounts and real catalog data | `server/src/modules/auth`, session/CSRF/auth middleware, resource module; client session provider, auth pages and resource hooks. Accepted MongoDB sessions, Argon2id, learner-only registration, trusted role lookup and safe projections | Seed is insert-only; no role picker or password-reset feature. No undocumented Kiro output is attributed | Auth/resource MongoDB tests, seed preservation and browser sign-in/role checks; [d064dbe](https://github.com/Rishitgoel/LabAccess/commit/d064dbe) |
| Phase 3: enforce request workflow integrity | Request model/routes/controller/service and integration tests. Accepted unique learner/resource index, embedded history and conditional status/revision update | Avoided a separate reviewer backend and multi-document workflow transaction. No specific AI bug is claimed without recorded evidence | Owner/role isolation, simultaneous creation/decisions/resubmissions, terminal approval, Unicode bounds and real startup; [77f7faf](https://github.com/Rishitgoel/LabAccess/commit/77f7faf) |
| Phases 4–5: connect learner/reviewer actions and recovery | Request dialog, lists/details, feature APIs/hooks, reconciliation, client API recovery tests. Accepted confirmation, cancel/resubmit, status/page URLs and saved-state reconciliation | Unchanged pending state was initially classified as conflict; corrected to preserve reason for deliberate retry. Expired CSRF initially failed to open sign-in; added session read without mutation replay | Live six-event workflow, lost/uncertain responses, 21-row paging/last-row recovery and two expired/active-CSRF regressions; [780f52a](https://github.com/Rishitgoel/LabAccess/commit/780f52a), [09cf3c4](https://github.com/Rishitgoel/LabAccess/commit/09cf3c4) |
| Phase 6: responsive/accessibility/motion finish | Shared tokens/primitives, page layouts, motion presets and refresh focus handling. Accepted reduced-motion behavior, retained content and safe action disabling | Audit/browser review found inline-link/name issues and focus loss when controls disappeared; fixed and checked again. Kept optional search out. Full-motion visual smoothness remains unverified | All twelve reference screens at 375/768/1440, accessibility scores 100, keyboard/focus and five-second refresh checks; [43081be](https://github.com/Rishitgoel/LabAccess/commit/43081be) |
| Phase 7: final integrated checks and production cookie repair | `server/src/config/env.js`, app factory, auth/foundation tests, `.env.example` and docs. Accepted proxy trust off by default, explicit loopback opt-in and rejection of broad trust | Regression reproduced missing Secure cookie behind TLS termination; repaired trusted-proxy handling. Test stores shared a Mongo client, so cleanup moved after all related tests. CLI inactive-resource fixture used the wrong field; corrected to `isActive`, not a product workaround | 56 passing tests, build, zero audit vulnerabilities; actual local production TLS API, two-learner/reviewer browser recovery, independent history and unavailable-startup checks; [efc276e](https://github.com/Rishitgoel/LabAccess/commit/efc276e) |

## Genuine issues and fixes

**Expired CSRF recovery:** a logout in another tab left the first tab with a stale token. A learner action returned CSRF failure without opening sign-in. The API client now checks `/auth/me` and dispatches session-ended feedback when it gets 401, without repeating the write. Tests distinguish expired and still-authenticated sessions; the browser verified no extra event.

**Focus after refresh:** controls disappeared or became disabled after a successful action, leaving focus on the document body. Shared focus restoration now falls back to main content when the original opener cannot receive focus. The browser verified dialog dismissal and slow catalog/detail refresh. Motion completion is not a prerequisite for focus.

**Secure cookie behind a TLS proxy:** the proxy-to-Express hop is HTTP. With proxy trust off, express-session did not issue the production Secure cookie despite external HTTPS. A failing regression established the symptom. Explicit `TRUST_PROXY=loopback` fixes the intended same-host proxy topology, while false/default trust and non-loopback addresses remain untrusted. Actual verified TLS API checks confirm cookies, rotation, CSRF and persistence; public deployment/browser HTTPS are not claimed.

These are recorded Codex-developed issues and corrections. They are not attributed to Kiro. The evidence ledger preserves the actual limits, including fixture/setup errors and the existing non-failing build-size advisory.

## Remaining named-tool work

Use the prepared bounded Kiro test task above only after confirming the intended assessment tool and signing in. Then choose two to four additional **real** tasks with reviewable outputs, for example a targeted readiness-test review, an ownership/revision-test review, or a documentation-vs-source audit. These are proposed tasks, not completed evidence. Do not add unnecessary product features to create task counts.

For every executed task keep the real prompt/output, tool/version/date, affected files, accepted/rejected suggestions, actual command results and commit. Avoid secrets or account identifiers in captured transcripts. An account, installation, tool recommendation, prepared prompt or Codex commit does not establish use of the named assessment tool.

## Phase 8 reproducibility issue — Codex

A new GitHub clone beneath `.local/phase8-clean` served the built homepage but returned controlled 500 for deep routes. The SPA fallback passed an absolute filename to Express `sendFile`; its hidden ancestor triggered dotfile rejection. The fix supplies `index.html` relative to the explicit build root, preserving default dotfile protection rather than enabling dotfiles. A regression copies the actual server source into an isolated hidden checkout with synthetic build assets and checks homepage, login, request/review fallbacks, static asset and JSON API 404. It failed with 500 before the repair and passed afterward. The real clean-clone built server is rechecked separately. This is another actual Codex correction, not Kiro task evidence.
