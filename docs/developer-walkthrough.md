# Developer walkthrough

This is a source-backed explanation and practice guide. It does not certify that a developer has independently explained the application; that Phase 8 acceptance item requires the human walkthrough.

## Trace one request

1. `client/src/lib/api.js` sends same-origin credentialed requests and obtains a CSRF token before a mutation. A SessionProvider session read resolves before protected routes display private content.
2. `server/src/config/session.js` uses MongoDB-backed sessions. The cookie is an opaque session ID, not a role/ownership payload. Login regenerates the session and token; logout destroys it.
3. `server/src/middleware/auth.js` loads the current account and applies server role guards. A caller-supplied learner ID cannot establish ownership. `csrf.js` checks origin and the synchronizer token.
4. `server/src/modules/requests/request.controller.js` validates fields, reason code-point bounds, IDs, revisions and paging. Unknown fields are rejected. It delegates business rules to `request.service.js`.
5. Creation derives the learner from the authenticated actor and checks resource availability. A unique `(learnerId, resourceId)` index permits one persistent document, including after rejection or cancellation. Parallel submissions leave one saved record and a controlled conflict.
6. A transition first checks visibility, role, current state and displayed revision. Its `findOneAndUpdate` also conditions the write on identity, previous status and revision. It sets the new status, increments revision and appends history together. A race loser returns 409; a stale revision cannot become valid merely because resubmission returned the status to pending.
7. Read projections fetch safe resource/user summaries. They omit hashes and session internals; another learner's detail lookup is scoped by ownership and returns a neutral 404.
8. Feature hooks update the UI from saved server data. `client/src/lib/api.js` does not automatically replay a mutation. The workflow reconciliation helper reads saved state after an uncertain result. Matching next revision/status/reason/event confirms persistence; unavailable reconciliation blocks another action until Check saved state.

## Explain the choices

| Topic | Explanation to demonstrate |
|---|---|
| Sessions | Why the server stores identity and reads the current role; what login rotation, expiry and logout invalidate |
| CSRF | Why an HttpOnly cookie alone does not prevent CSRF; how token and exact Origin/Referer checks work together |
| Ownership | Why route guards and filtered database queries are both needed; why another learner gets a neutral 404 |
| Transitions | Pending can be cancelled/approved/rejected; rejected/cancelled can be resubmitted; approved is terminal |
| Atomic history | Status, revision and event change in one document update; retained reasons/events survive resubmission |
| Indexes | Unique learner/resource and normalized email enforce integrity; owner/status/submittedAt/ID indexes support stable paging |
| Revisions | Two actions at revision 0 can both read pending, but only one conditional write wins; the other must refresh |
| UI recovery | Unknown save outcome is not an invitation to retry; read first, verify matching state, then allow deliberate action |
| Production | Secure cookies need HTTPS; explicit loopback proxy trust requires rewritten forwarded headers and an isolated backend |
| Readiness | Startup connection/index failure produces 503; fixing the initial outage requires restart; later established connections can reconnect |

## Source and verification map

- [Session implementation](../server/src/config/session.js), [authentication middleware](../server/src/middleware/auth.js), [CSRF middleware](../server/src/middleware/csrf.js).
- [Request service](../server/src/modules/requests/request.service.js), [request schema/indexes](../server/src/modules/requests/request.model.js), [validation](../server/src/middleware/validation.js).
- [Client HTTP boundary](../client/src/lib/api.js), [architecture](architecture.md), [API contract](api-contract.md), [verification](verification.md).

Practice using the README's synthetic accounts and six-event lifecycle. Explain a unique-index race, a stale approve/reject race, and an uncertain response using the actual tests and screenshots. Describe the limits honestly: decisions do not provision external access; there is no offline queue, shared multi-instance limiter, notifications or hosted workflow acceptance. Record human explanation acceptance only after it occurs.
