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

Preserve warm white/beige/charcoal/olive and horizontal navigation. [DESIGN.md](../DESIGN.md) and [page mapping](UI_REFERENCE_GUIDE.md) stay available to the chosen AI tool. Phase 1 replaces the setup screen with the fixture catalog and request dialog; API readiness remains `/api/health`. Local React state coordinates fixtures. ResourceCard receives data/callbacks only, with no fetching/storage access. The preview role toggle is a design-review control, never authentication or authorization. Read-only summaries and preview controls are isolated in app/PreviewDialog.jsx for replacement in later phases.

Shared shadcn primitives were generated with CLI 4.21.4 (new-york style, Radix). Tailwind 4 uses semantic CSS variables. Local cn utilities re-export the current shadcn cn package; no duplicate class-merging stack. Hero artwork is copied unchanged into client/public/assets; all text/actions are React elements. Fonts are bundled locally. Motion handles card entrance; CSS handles hover, with reduced-motion support verified on the current device. Whole-app acceptance remains in Phase 6.
