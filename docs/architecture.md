# Architecture

LabAccess is one React client and one Express application with one MongoDB database. JavaScript ES modules throughout; npm workspaces share one committed lockfile. Runtime baseline is Node 24.14.1 / npm 11.11.0. React 19, Vite 8, Express 5, and Mongoose 9 are installed; Tailwind, shadcn/Radix, Motion, and React Router support the client.

## Boundaries

Auth owns users, credentials, sessions, and role guards. Resources owns definitions, availability, and catalog reads. Requests owns submissions, transitions, learner lists, reviewer queue, and history. Review is a view of requests, never a second workflow backend.

Pages compose components and feature hooks. Presentational components receive data/callbacks. Hooks coordinate reads/writes and feedback through a shared HTTP client. Controllers parse HTTP input and translate service results. Services enforce permissions/transitions. Models define schemas/indexes; database access stays within its owning module. Shared UI does not import features or own permissions. Create these modules as features are implemented; no empty scaffolding directories.

## Persistence and trust

MongoDB stores users, resources, requests, and server sessions. Opaque HttpOnly session cookies identify server-managed sessions; protected calls re-read trusted roles. The browser cannot assign ownership, roles, status, or audit events. Synchronizer CSRF tokens plus origin checks protect mutations. See [API contract](api-contract.md) for exact limits, envelopes, session behavior, and revision rules. Phase 2 implements authentication with express-session/connect-mongo, Argon2id, and a per-process authentication limiter. Models initialize unique indexes explicitly after connection, with buffering and eager model initialization disabled.

Embed request history so each transition and matching event can be written in one conditional document update. A unique learner/resource index prevents duplicates; status plus integer revision checks prevent racing decisions and old pending actions after resubmission. No cross-document transaction is needed for a request transition. Account/password/session internals are never populated into public responses.

## Runtime

Vite serves localhost:5173 and proxies `/api` to localhost:3001. Production Express serves `client/dist` and API from one origin with SPA fallbacks, while unknown `/api` routes remain JSON 404s. Phase 0 listens on loopback; externally hosted binding/proxy policy belongs to the hosting phase.

The app factory is independent of listening/database startup for testing. Database buffering is disabled. Initial database connection failure logs a sanitized message and permits a diagnostic API with 503 readiness. Configure MongoDB then restart after an initial connection failure. After a previously established connection, health follows Mongoose's current connection state. No health success is returned just because HTTP works.

## Design continuity

Preserve warm white/beige/charcoal/olive and horizontal navigation. [DESIGN.md](../DESIGN.md) and [page mapping](UI_REFERENCE_GUIDE.md) stay available to the chosen AI tool. Phase 1 replaces the setup screen with the fixture catalog and request dialog; API readiness remains `/api/health`. Local React state coordinates fixtures. ResourceCard receives data/callbacks only, with no fetching/storage access. The preview role toggle is a design-review control, never authentication or authorization. Read-only summaries and preview controls are isolated in app/PreviewDialog.jsx for replacement in later phases.

Shared shadcn primitives were generated with CLI 4.21.4 (new-york style, Radix). Tailwind 4 uses semantic CSS variables. Local cn utilities re-export the current shadcn cn package; no duplicate class-merging stack. Hero artwork is copied unchanged into client/public/assets; all text/actions are React elements. Fonts are bundled locally. Motion handles card entrance; CSS handles hover, with reduced-motion support verified on the current device. Whole-app acceptance remains in Phase 6.

## Phase 2 client and seed

SessionProvider resolves GET /auth/me before protected/public route redirects. Auth pages share AuthLayout; labelled field errors receive focus after disabled fields become available. The API client supplies credentials and CSRF tokens, clears tokens after session changes, and never retries mutations automatically. Resource hooks own HTTP reads; cards remain pure. The normal route renders authenticated MongoDB records; the lazily loaded /preview route preserves isolated, explicitly unsaved fixtures. The reviewer page is a protected placeholder until Phase 4, and the review API namespace is guarded but has no Phase 3 workflow routes yet.

Seed validation precedes connection, accepts only labaccess_dev/labaccess_test[_suffix], and refuses production. Insert-only upserts preserve existing accounts/resources. A development-only MongoDB helper runs real mongod with persistent ignored workspace data; integration tests use a separate ephemeral real mongod database. This helper is not a hosting configuration. TLS/proxy/public deployment verification remains open.
## Phase 3 request backend

Requests now own an AccessRequest schema, controllers, routes, and one transition service. The immutable learner/resource pair has a unique compound index. Owner and owner/status lists use submittedAt/ID indexes; reviewer pending queues use status/submittedAt/ID. Startup builds indexes before reporting readiness. Query/body validation is explicit, with a shared pagination parser used by resources and requests.

The transition table defines cancel/resubmit for the owning learner and approve/reject for reviewers. A read establishes visibility and the allowed previous state; the write still conditions on ID, ownership where applicable, status, and the submitted revision. A single MongoDB update sets the new state, increments revision, and appends its event. Resubmission clears the current decision reason, updates reason/submittedAt, and preserves previous events. Approved is terminal. Requests read public user/resource summaries through small owning-module service exports rather than querying other feature models or using unrestricted population.

The API workflow is verified, including a real startup subprocess against disposable mongod. The React request dialog, queue, lists, details/history, conflict recovery, and uncertain-write reconciliation remain Phase 4/5 work. The Phase 2 live catalog and explicit fixture preview are unchanged.
