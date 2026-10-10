# LabAccess API contract

Updated October 8, 2026: all routes listed below are implemented through Phase 3, including request creation, owner lists/details, cancellation, resubmission, review lists, and decisions. Phase 4 will connect their browser interfaces. JSON bodies are limited to 16 KiB. Production serves the React build and `/api` from the same origin; development uses Vite's `/api` proxy.

## Envelopes and errors

Success: `{ "data": ... }`. List success: `{ "data": [], "pagination": { "page": 1, "pageSize": 20, "total": 0, "totalPages": 0 } }`. Errors: `{ "error": { "code": "VALIDATION_ERROR", "message": "Check the highlighted fields.", "fields": { "reason": "Enter 20–1,000 characters." } } }`. `fields` is optional. No stack traces, connection strings, password hashes, or session internals cross the boundary. The client must inspect HTTP status, not infer success from JSON alone.

| Status | Meaning / stable code examples |
|---|---|
| 200 | Reads, login, logout, transitions |
| 201 | Registration and initial request creation |
| 400 | `VALIDATION_ERROR`, `INVALID_ID`, `INVALID_JSON` |
| 401 | `UNAUTHENTICATED`, `INVALID_CREDENTIALS` |
| 403 | `FORBIDDEN`, `CSRF_INVALID` |
| 404 | `NOT_FOUND` (also another learner's request) |
| 409 | `EMAIL_EXISTS`, `REQUEST_EXISTS`, `REQUEST_CONFLICT` |
| 413 | `PAYLOAD_TOO_LARGE` |
| 429 | `RATE_LIMITED`; provide Retry-After |
| 500 | `INTERNAL_ERROR` |
| 503 | `DATABASE_UNAVAILABLE` |

`GET /api/health` returns `{ "data": { "status": "ready", "database": "connected" } }` only after connection and required index initialization, otherwise a 503 error. All API responses use `Cache-Control: no-store` in the configured application.

## Validation

- HTTP IDs are 24-character hexadecimal MongoDB ObjectId strings. Malformed IDs return 400 before a database query; well-formed unavailable IDs return 404.
- Count text lengths as Unicode code points. Trim names/reasons before checks. Name: 2–80 characters. Email: trim, lowercase, validate, maximum 254 characters; unique normalized index.
- Password: 12–128 characters, preserved exactly, including spaces. Never trim, lowercase, echo, or log passwords. Phase 2 uses Argon2id via an established implementation, avoiding bcrypt's silent byte truncation.
- Request reason: 20–1,000 trimmed characters. Decision reason: 10–500. Reject empty/non-string values. Client validation supplements server validation.
- Reject unknown body/query fields. Server supplies actor, owner, status, timestamps, history, and role; registration accepts only name/email/password. Reject role assignment with 400.
- Revision is a required non-negative safe integer for each transition. Creation starts at revision 0. Each successful transition increments it once.

## Routes and bodies

All routes are prefixed `/api`. Only health and CSRF bootstrap are public reads. Registration/login require the CSRF bootstrap; remaining feature routes require authentication, with role/ownership checks in services.

| Method / route | Body / query | Result |
|---|---|---|
| GET `/auth/csrf` | none | `{data:{csrfToken}}`; anonymous session allowed |
| POST `/auth/register` | `{name,email,password}` | 201 public learner profile; does not automatically log in |
| POST `/auth/login` | `{email,password}` | 200 profile; regenerated session |
| POST `/auth/demo` | `{role:"requester"\|"approver"}` | Opt-in shared synthetic account login; 200 profile, regenerated session. Requires `DEMO_LOGIN_ENABLED=true`; otherwise 403. Same Origin/CSRF and rate-limit checks as login. |
| POST `/auth/logout` | `{}` | `{data:{loggedOut:true}}`; invalidate session/cookie |
| GET `/auth/me` | none | `{data:{id,name,email,role}}` |
| GET `/resources` | `page,pageSize` | paginated active resources |
| POST `/requests` | `{resourceId,reason}` | 201 request with initial history |
| GET `/requests/mine` | `status,page,pageSize` | owner-only list; default all |
| GET `/requests/:id` | none | owner or reviewer detail |
| POST `/requests/:id/cancel` | `{revision}` | owner pending → cancelled |
| POST `/requests/:id/resubmit` | `{revision,reason}` | owner rejected/cancelled → pending |
| GET `/review/requests` | `status,page,pageSize` | reviewer list; default pending |
| POST `/review/requests/:id/decision` | `{revision,status,reason}` | reviewer pending → approved/rejected |

Resource fields: `id,name,description,category,eligibility,isActive`. Request fields: `id,resourceId,learnerId,reason,status,submittedAt,decisionReason,revision,history,createdAt,updatedAt`, with explicit safe resource/learner projections as needed by the view. No populated password/session fields. History events contain `action,fromStatus,toStatus,actorId,reason,at` and the additive DTO field `actorName`; initial fromStatus is null. `actorName` resolves the current public account name, or null for a removed account; it is not an immutable historical name snapshot. Stored actor IDs/events remain unchanged. Dates are ISO 8601 UTC strings. UI formats them consistently in Asia/Kolkata as `08 Oct 2026, 5:30 pm IST` using a shared formatter.

## Pagination and ordering

`page` defaults to 1, `pageSize` to 20. Accept positive decimal integers only; reject negative, zero, fractional, unsafe, repeated, or malformed values. Cap valid pageSize at 50. `status` accepts all/pending/approved/rejected/cancelled only. Filters apply before counting and paging. Out-of-range pages return an empty list with the correct totals; zero results means totalPages 0.

Learner requests order by submittedAt descending, then id descending. Pending reviewer requests order by submittedAt ascending, then id ascending; other reviewer filters use descending order. Resources use name ascending then id ascending. Catalog status mapping must read all owner request pages rather than only the visible page.

## Sessions and CSRF (implemented Phase 2)

Use express-session with a MongoDB-backed store, opaque cookie `labaccess.sid`, HttpOnly, SameSite=Lax, Path=/, no Domain, and Secure in production HTTPS. Default idle lifetime: 8 hours via SESSION_MAX_AGE_MS; use rolling expiry with matching store lifetime. SESSION_SECRET is required before implementing auth. The session stores user ID only; load the trusted user/role on each protected request. Regenerate on login and rotate the CSRF token. Logout destroys the server session and clears the matching cookie. Do not persist login data in localStorage.

Use a synchronizer CSRF token stored in the session. Bootstrap via GET `/auth/csrf`; send `X-CSRF-Token` on every unsafe request, including registration/login/logout. Fetch with credentials included. Additionally validate Origin against APP_ORIGIN (or same-origin Referer when Origin is absent); reject requests with no verifiable origin for browser mutations. Do not enable permissive credentialed CORS. SameSite supplements this policy. Refresh the token after login; no automatic mutation retries. Production trust-proxy configuration will be explicit and limited to the actual hosting topology.

## Workflow integrity and recovery

One unique learner/resource document. Creation derives owner from the session and rejects inactive/missing resources. Updates condition on ID, owner where relevant, allowed current status, and expected revision; modify state, append history, and increment revision in one MongoDB operation. Resubmission updates submittedAt and reason, clears current decisionReason, preserves old event reasons, and rechecks resource availability. Approved is terminal.

Check visibility before classifying a failed conditional update: 404 for a hidden/missing request; 409 for a visible stale/conflicting request. Failed writes never append events. On 409 the Phase 4 UI must refresh and require another deliberate action. On an uncertain write response, read saved state before permitting a repeat. Approval records a decision only; it does not provision external access.

The Phase 5 browser sends status/page on list queries and preserves them during detail/back navigation. Empty/out-of-range results keep the API totals; the client moves an out-of-range page to the last available page. Cancellation and resubmission use their existing revision-aware routes, never creation of a second request. After protected `CSRF_INVALID`, the browser clears the token and checks GET `/auth/me`; a 401 ends the client session without replaying the mutation.

Implemented history actions are `submit`, `cancel`, `resubmit`, `approve`, and `reject`. Submission records its request reason; cancellation records the current request reason; resubmission records its new reason; decisions record their decision reason. Event `at` matches the transition's server-generated `updatedAt`; resubmission also sets `submittedAt` to that time. All prior events remain. Current `decisionReason` is null until a decision and becomes null again on resubmission.

Request DTOs contain only the fields above, plus `resource` with the six public resource fields and `learner` with `id,name,email,role`. These summaries are explicit projections fetched through their owning feature services; password hashes and session fields cannot be populated accidentally. A removed related record yields a null summary while preserving stored IDs/history. Detail/transition/create endpoints accept no query fields. Learner `/requests/mine` defaults to all statuses; `/review/requests` defaults to pending.
