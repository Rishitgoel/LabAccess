# Architecture

LabAccess is one React client and one Express application with one MongoDB database. JavaScript ES modules throughout; npm workspaces share one committed lockfile. Runtime baseline is Node 24.14.1 / npm 11.11.0. React 19, Vite 8, Express 5, and Mongoose 9 are installed; design libraries will be added when their responsibilities exist.

## Boundaries

Auth owns users, credentials, sessions, and role guards. Resources owns definitions, availability, and catalog reads. Requests owns submissions, transitions, learner lists, reviewer queue, and history. Review is a view of requests, never a second workflow backend.

Pages compose components and feature hooks. Presentational components receive data/callbacks. Hooks coordinate reads/writes and feedback through a shared HTTP client. Controllers parse HTTP input and translate service results. Services enforce permissions/transitions. Models define schemas/indexes; database access stays within its owning module. Shared UI does not import features or own permissions. Create these modules as features are implemented; no empty scaffolding directories.

## Persistence and trust

MongoDB stores users, resources, requests, and server sessions. Opaque HttpOnly session cookies identify server-managed sessions; protected calls re-read trusted roles. The browser cannot assign ownership, roles, status, or audit events. Synchronizer CSRF tokens plus origin checks protect mutations. See [API contract](api-contract.md) for exact limits, envelopes, session behavior, and revision rules. Authentication/session middleware is intentionally scheduled for Phase 2, not implemented in Phase 0.

Embed request history so each transition and matching event can be written in one conditional document update. A unique learner/resource index prevents duplicates; status plus integer revision checks prevent racing decisions and old pending actions after resubmission. No cross-document transaction is needed for a request transition. Account/password/session internals are never populated into public responses.

## Runtime

Vite serves localhost:5173 and proxies `/api` to localhost:3001. Production Express serves `client/dist` and API from one origin with SPA fallbacks, while unknown `/api` routes remain JSON 404s. Phase 0 listens on loopback; externally hosted binding/proxy policy belongs to the hosting phase.

The app factory is independent of listening/database startup for testing. Database buffering is disabled. Initial database connection failure logs a sanitized message and permits a diagnostic API with 503 readiness. Configure MongoDB then restart after an initial connection failure. After a previously established connection, health follows Mongoose's current connection state. No health success is returned just because HTTP works.

## Design continuity

Preserve warm white/beige/charcoal/olive and horizontal navigation. [DESIGN.md](../DESIGN.md) and [page mapping](UI_REFERENCE_GUIDE.md) stay available to the chosen AI tool. The Phase 0 screen is a setup diagnostic, not a finished catalog or screenshot acceptance claim. Phase 1 builds the shared design primitives, resource catalog, and fixture dialog.
