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
