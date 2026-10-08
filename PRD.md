# LabAccess — Product Requirements Document

**Version:** 1.0  
**Project type:** MERN internship assessment  
**Delivery window:** 72 hours  
**Primary deliverable:** Public GitHub repository with a working application, setup instructions, and documented Code0 or Kiro usage

## 1. Product overview

LabAccess lets learners request access to learning resources and lets reviewers approve or reject those requests. Learners browse resources, explain why they need access, and track decisions. Reviewers process requests through a dedicated queue. Both can inspect request history.

Approval records a decision inside LabAccess. It does not provision accounts, issue credentials, or grant access in an external system.

The project connects EduFlow's education workflows with the developer's TruSave Fintech backend access-management experience. Its distinguishing feature is a complete, reliable approval workflow with clear permissions and useful history.

## 2. Problem statement

Learning-resource access requests often happen through messages or spreadsheets. Requests can be duplicated, decisions can lack context, and learners may not know whether a request is still pending.

LabAccess provides one place to discover resources, submit requests, process decisions, inspect history, and prevent unauthorized access or conflicting decisions.

## 3. Goals and success criteria

### Product goals

1. Make requesting access straightforward.
2. Help reviewers identify and process pending requests.
3. Preserve a readable history of every request.
4. Enforce permissions and workflow rules on the server.
5. Deliver a polished application a reviewer can run independently.

### Assessment goals

Demonstrate React components, forms, routing, and asynchronous state; Express API design and validation; MongoDB persistence, relationships, indexes, and conditional updates; maintainable Node.js structure; effective Code0 or Kiro use; independent debugging; and meaningful documentation and Git history.

### Release success criteria

- Every must-have requirement works.
- The complete workflow persists across refreshes.
- Authorization and concurrency tests pass.
- A fresh clone runs using only the README.
- The public repository contains no credentials or employer code.
- The README documents 3–5 genuine AI-assisted tasks.
- The developer can explain implementation choices and tradeoffs.

These are acceptance requirements, not claims of completed verification.

## 4. Users and permissions

| Capability | Learner | Reviewer |
|---|---|---|
| Browse resources | Yes | Yes |
| Submit access request | Yes | No |
| View own requests and history | Yes | — |
| View all requests and history | No | Yes |
| Cancel own pending request | Yes | No |
| Resubmit own rejected/cancelled request | Yes | No |
| Approve/reject pending request | No | Yes |
| Assign/change roles | No | No |

Public registration creates learner accounts only. Reviewer accounts are created through a development seed command. There is no role-management interface in the MVP.

## 5. Scope

### Must have

- Registration, login, logout, and session restoration.
- Learner and reviewer roles.
- Seeded resource catalog.
- Request creation, cancellation, and resubmission.
- Reviewer approval and rejection.
- Request history.
- Status filters and basic pagination.
- Responsive UI with loading, empty, error, and success states.
- Automated tests for critical backend behavior.
- README, repeatable demo seed data, and AI usage evidence.

### Optional after core validation

- Hosted demo.
- Resource search and category filtering.
- Request-count summaries.
- Short demonstration recording.

The visual concept includes search and category chips. These remain optional enhancements; remove or disable them clearly if they are not implemented.

### Outside the 72-hour scope

Payments, subscriptions, OTP, email notifications, password reset, external provisioning, uploads, real-time updates, multiple organizations, resource-editing UI, advanced analytics, and AI functionality inside the product.

## 6. User journeys

### Learner requests access

1. Register or log in.
2. Browse the resource catalog.
3. Read resource details and eligibility guidance.
4. Enter a request reason and submit.
5. Receive confirmation after server persistence.
6. Open My requests to inspect status and history.

### Reviewer makes a decision

1. Log in with a seeded reviewer account.
2. Open the queue, defaulting to pending requests.
3. Inspect learner identity, resource, reason, and history.
4. Select approve or reject.
5. Enter a decision reason and confirm.
6. See the persisted status and history.

### Learner follows up

1. Open an existing request and read its decision.
2. Cancel if still pending.
3. If rejected/cancelled, enter an updated reason and resubmit.
4. See pending status without losing earlier history.

## 7. Functional requirements

### FR-01 — Authentication

- Registration requires name, email, and password.
- Normalize email before lookup/storage; reject duplicate email with a useful error.
- Hash passwords and never return hashes through APIs.
- Login establishes a server-managed session.
- Page refresh restores the authenticated user.
- Logout invalidates the session.
- Protected endpoints return `401` when unauthenticated.
- Rate-limit login attempts.

**Acceptance:** register, login, refresh, and logout work; an invalidated session cannot access protected endpoints.

### FR-02 — Permissions

- Determine roles from the authenticated account on the backend.
- Ignore/reject role assignment in public registration.
- Learners cannot call reviewer endpoints.
- Learners can read/change only their own requests.

**Acceptance:** direct API calls cannot bypass UI restrictions.

### FR-03 — Resources

- Seed 5–8 resources with names, descriptions, categories, eligibility guidance, and active flags.
- Show active resources in the catalog.
- Reject requests for missing or inactive resources.
- Do not store/display privileged credentials.

**Acceptance:** learners can browse resources and request an active resource.

### FR-04 — Request submission

- Require resource ID and reason of 20–1,000 trimmed characters.
- Derive learner ID from the session, never client input.
- Successful creation starts in `pending` and records a history event.
- A database uniqueness rule allows one document per learner–resource pair.
- Duplicate creation returns `409`.
- Resubmit rejected/cancelled requests through the existing document.

**Acceptance:** double-clicks and parallel calls create only one document.

### FR-05 — My requests

- Show resource, status, submission time, and latest decision reason when available.
- Filters: all, pending, approved, rejected, cancelled.
- Sort by most recent submission/resubmission.
- Default page size 20; maximum 50.
- History remains available for every status.

**Acceptance:** users see only their requests, with correct filtered results after refresh.

### FR-06 — Cancellation/resubmission

- Only the owner can cancel a pending request.
- Only rejected/cancelled requests can be resubmitted.
- Require a new valid reason on resubmission.
- Append history for every action.
- Preserve previous request/decision reasons in history.

**Acceptance:** resubmission changes the existing request to pending without erasing events.

### FR-07 — Reviewer queue

- Reviewers list/inspect all requests.
- Default filter: pending; pending requests ordered oldest first.
- Details include learner name/email, resource, current reason, and history.
- Approval/rejection requires a reason of 10–500 trimmed characters.

**Acceptance:** reviewer decisions persist and are visible to the learner after refresh.

### FR-08 — Workflow integrity

| Current state | Action | Result | Actor |
|---|---|---|---|
| No request | Submit | Pending | Learner |
| Pending | Approve | Approved | Reviewer |
| Pending | Reject | Rejected | Reviewer |
| Pending | Cancel | Cancelled | Owner |
| Rejected | Resubmit | Pending | Owner |
| Cancelled | Resubmit | Pending | Owner |

Approved is terminal in the MVP. Every transition checks permission and current status in the database update condition, changes status and appends history atomically, and uses a server timestamp. Stale/conflicting transitions return `409`.

**Acceptance:** concurrent approve/reject/cancel calls yield exactly one successful transition with one matching event.

### FR-09 — Feedback and recovery

- Disable action controls during writes.
- Preserve form input on failed submission.
- Display success only after server confirmation.
- Offer retry for recoverable read failures.
- Explain stale decisions and refresh the request.
- After an uncertain write/network failure, read persisted state before allowing a repeat; do not blindly retry mutations.

## 8. Screens

| Screen | Required content |
|---|---|
| Login/registration | Labelled fields, validation, submit state, authentication error |
| Resources | Resource cards, descriptions, request actions, existing request status |
| Request dialog | Resource summary, reason, validation, submit/cancel |
| My requests | Filters, rows/cards, pagination, empty state |
| Review queue | Pending requests, filters, learner/resource summaries |
| Request details | Status, reasons, history, permitted actions |
| Access denied/not found | Explanation and navigation back |

Follow [DESIGN.md](DESIGN.md) for the selected warm white/beige theme and React component direction. The earlier indigo/sidebar mockups are superseded.

## 9. Data model

### User

`id`, `name`, normalized unique `email`, `passwordHash`, `role` (learner/reviewer), `createdAt`, `updatedAt`.

### Resource

`id`, `name`, `description`, `category`, `eligibility`, `isActive`, `createdAt`, `updatedAt`.

### AccessRequest

`id`, `learnerId`, `resourceId`, `reason`, `status`, `submittedAt`, current `decisionReason` if applicable, embedded `history`, `createdAt`, `updatedAt`.

Set `submittedAt` on initial submission and resubmission. Clear current `decisionReason` on resubmission while retaining it in history.

History events contain action, previous/resulting status, actor ID, relevant reason, and server timestamp. Clients cannot supply or overwrite history.

### Indexes

- Unique normalized user email.
- Unique `(learnerId, resourceId)`.
- `(status, submittedAt)` for reviewer queue.
- `(learnerId, submittedAt)` for personal lists.

Embed history so a transition and event can be written in one conditional document update. Long-term archival is outside scope.

## 10. API contract

All routes are under `/api`; validate bodies server-side.

| Method | Route | Purpose |
|---|---|---|
| POST | `/auth/register` | Create learner |
| POST | `/auth/login` | Establish session |
| POST | `/auth/logout` | Invalidate session |
| GET | `/auth/me` | Read authenticated user |
| GET | `/resources` | List active resources |
| POST | `/requests` | Create request |
| GET | `/requests/mine` | List own requests |
| GET | `/requests/:id` | Read authorized request |
| POST | `/requests/:id/cancel` | Cancel pending request |
| POST | `/requests/:id/resubmit` | Resubmit rejected/cancelled request |
| GET | `/review/requests` | Reviewer queue |
| POST | `/review/requests/:id/decision` | Approve/reject |
| GET | `/health` | Service readiness |

Error shape: stable code, readable message, optional field errors. Never expose stack traces or database details.

| Status | Meaning |
|---|---|
| 400 | Invalid input/malformed ID |
| 401 | Unauthenticated |
| 403 | Role does not permit action |
| 404 | Missing resource or request unavailable to learner |
| 409 | Duplicate or invalid current state |
| 500 | Unexpected internal error |

## 11. Technical design and security

- React frontend with familiar tooling and routing.
- Node.js/Express REST API.
- MongoDB with a consistent modeling layer.
- Server-side sessions stored in MongoDB.
- Prefer same-origin production hosting for the React build and API.
- Organize into `client/`, `server/`, `docs/`.
- Separate routes, validation, business rules, and persistence clearly.
- Use explicit allowlisted updates, never pass arbitrary request bodies into database updates.
- Limit dependencies and commit lockfiles.
- Use HTTP-only session cookies and secure cookies under production HTTPS.
- Protect state-changing endpoints against cross-site requests.
- Keep secrets in environment configuration; commit `.env.example` only.
- Bound request sizes and pagination.
- Do not log passwords, tokens, or sensitive request bodies.
- Seed synthetic data only; exclude employer code and private records.

## 12. Validation plan

Test high-risk behavior before UI polish.

| Priority | Test | Expected result |
|---|---|---|
| P0 | Learner reads another learner's request | Unavailable |
| P0 | Learner calls reviewer endpoint | Forbidden |
| P0 | Registration includes reviewer role | Reviewer not created |
| P0 | Concurrent duplicate submission | One document |
| P0 | Concurrent approve/reject | One decision |
| P0 | Concurrent cancellation/approval | One transition |
| P0 | Status/history persistence | Both saved together |
| P0 | Protected request after logout | Unauthenticated |
| P1 | Invalid IDs/reasons/status/resource | Controlled errors |
| P1 | Refresh after actions | Persisted state correct |
| P1 | Network failure during write | No false success |
| P1 | Resubmission | Earlier history retained |
| P1 | Fresh clone | README setup works |
| P2 | Mobile/keyboard/loading/empty/error | Usable and clear |

Use API integration tests with a test MongoDB database for indexes, persistence, and concurrency. Walk through the browser using two learners and one reviewer. Validate any hosted demo separately from local tests.

## 13. AI development evidence

Use Code0 or Kiro for actual development tasks. Installing alone is insufficient. The email's Kiro link differs from the official domain previously verified; confirm the intended tool if necessary.

Target 3–5 completed tasks: schema/validation drafting, API scaffolding, React queue/form development, test suggestions, and actual bug investigation.

Record in `docs/ai-usage.md`: tool, prompt summary, files affected, accepted suggestions, rejected/corrected suggestions, verification, and commit links. Explain genuine AI-generated issues through symptom, reproduction, cause, correction, and regression check. Do not invent bugs or claim planned work as completed.

The developer must understand and explain every accepted change. Other AI assistance alone does not replace the named-tool requirement.

## 14. README and repository deliverables

README sections: name/description; features; technologies; prerequisites; installation; environment variables; database/seed setup; run/test/build commands; demo instructions; explicit Code0/Kiro identification; AI Development Experience with 3–5 completed tasks; screenshots/walkthrough; architecture; tradeoffs; limitations.

Commit source, lockfiles, `.env.example`, tests, seed instructions, sanitized screenshots, and AI evidence. Make meaningful commits throughout development. Seed commands must target development/test and must not silently reset production data.

## 15. Execution milestones

| Elapsed time | Milestone |
|---|---|
| 0–4 hours | Scope, repository, AI setup, contract, database connectivity |
| 4–16 | Authentication, authorization, request rules, critical tests |
| 16–24 | Complete learner-to-reviewer flow |
| 24–40 | Remaining MVP and interface polish |
| 40–54 | Integration/browser validation and fixes |
| 54–64 | README, evidence, screenshots, fresh-clone check |
| 64–66 | Public repository review and submission |
| 66–72 | Recovery buffer |

These are elapsed windows including sleep/breaks. Freeze new features at hour 40. Remove optional hosting/search/summaries/video before reducing authorization, workflow integrity, documentation, or validation.

Source email received October 8, 2026, approximately 1:21 PM IST. Conservative deadline: **October 11, 2026, 1:21 PM IST**. Target submission: **October 11, 7:21 AM IST**.

Source: [StartupMeu email](https://mail.google.com/mail/u/?authuser=rishitgoel259%40gmail.com#all/1a11a7ebf3f49166).

## 16. Final acceptance checklist

- [ ] All four MERN technologies genuinely used.
- [ ] Registration creates learners only.
- [ ] Session restoration/logout verified.
- [ ] Learner data isolation verified.
- [ ] Reviewer actions protected.
- [ ] Duplicates/conflicting decisions tested.
- [ ] Status/history consistent.
- [ ] Promised screens include failure/empty states.
- [ ] Critical integration tests pass.
- [ ] Fresh-clone setup succeeds.
- [ ] README includes all requested sections.
- [ ] AI evidence covers 3–5 actual tasks.
- [ ] No credentials/private/employer code committed.
- [ ] Public repository accessible while logged out.
- [ ] Repository link submitted before deadline.
