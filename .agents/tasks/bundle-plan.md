# Implementation Plan — Reduce Main JS Bundle Below 500 KB

**Goal:** Split the ~556 KB main JS chunk by (a) lazy-loading the four heavy route-page components and (b) extracting heavy vendor libs into separate named chunks via `manualChunks`. No new dependencies, no raised `chunkSizeWarningLimit`.

---

## Context

- **Router file:** `client/src/app/main.jsx`
- **Vite config:** `client/vite.config.js`
- **Test runner:** `node --test tests/*.test.js` (pure Node.js unit tests, no DOM)
- **Build command:** `npm run build` (from `client/`)
- **Baseline main chunk:** ~556 KB (reported by Vite at build time)

Currently `main.jsx` has four **eager** static imports that pull every page's dependency tree into the single entry chunk:
```js
import AuthPage         from "@/features/auth/AuthPage";
import CatalogPage      from "@/features/resources/CatalogPage";
import RequestListPage  from "@/features/requests/RequestListPage";
import RequestDetailPage from "@/features/requests/RequestDetailPage";
```
`PreviewCatalog` is already `React.lazy` — leave it unchanged.

`Guard` and `SessionProvider` are small utilities that must remain in the main bundle (they are needed on every navigation before any page chunk loads).

---

## Step 1 — Lazy-load the four route-page components in `main.jsx`

**What to do:**

Replace the four eager `import` statements with `React.lazy` dynamic imports, then wrap the entire `<Routes>` block in a single `<Suspense>` whose fallback matches the existing Guard loading-state markup exactly.

**Exact diff for `client/src/app/main.jsx`:**

Remove these four lines:
```js
import AuthPage from "@/features/auth/AuthPage";
import CatalogPage from "@/features/resources/CatalogPage";
import RequestListPage from "@/features/requests/RequestListPage";
import RequestDetailPage from "@/features/requests/RequestDetailPage";
```

Replace with:
```js
const AuthPage         = React.lazy(() => import("@/features/auth/AuthPage"));
const CatalogPage      = React.lazy(() => import("@/features/resources/CatalogPage"));
const RequestListPage  = React.lazy(() => import("@/features/requests/RequestListPage"));
const RequestDetailPage = React.lazy(() => import("@/features/requests/RequestDetailPage"));
```

In the `App` function, wrap the `<Routes>` block in a `<Suspense>` fallback. Replace:
```jsx
<Routes>
  ...
</Routes>
```
with:
```jsx
<React.Suspense
  fallback={
    <main
      id="main-content"
      tabIndex={-1}
      className="session-state"
      role="status"
    >
      Loading…
    </main>
  }
>
  <Routes>
    ...
  </Routes>
</React.Suspense>
```

**Rationale:** A single `<Suspense>` boundary around `<Routes>` is the simplest correct placement. It shows the fallback only while a route chunk is being fetched (a one-time event per chunk). The Guard's own session-check loading state is rendered *inside* the already-loaded chunk, so there is no conflict. The fallback markup (`id="main-content"`, `tabIndex={-1}`, `className="session-state"`, `role="status"`) exactly matches the existing Guard loading state so the visual change is imperceptible.

**Files to modify:** `client/src/app/main.jsx`

**Verify:**
```
cd "d:\Side project\LabAccess\client"
npm test
```
Expected: all tests pass (they are pure Node.js unit tests that do not import `main.jsx`).

---

## Step 2 — Add `manualChunks` vendor splitting in `vite.config.js`

**What to do:**

Add a `build.rollupOptions.output.manualChunks` object to separate the largest vendor libraries — `react`/`react-dom`/`react-router-dom`, `motion`, and `radix-ui` — into named chunks so they are excluded from the main entry chunk.

**Exact addition to `client/vite.config.js`** (add inside `defineConfig({...})`):
```js
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        "vendor-react":  ["react", "react-dom", "react-router-dom"],
        "vendor-motion": ["motion"],
        "vendor-radix":  ["radix-ui"],
      },
    },
  },
},
```

**Rationale:** `motion` and `radix-ui` are large, stable, and version-locked; isolating them prevents every app change from invalidating browser-cached copies of those libs. `react`/`react-dom`/`react-router-dom` are always co-loaded so grouping them is safe and reduces chunk-count overhead.

**Files to modify:** `client/vite.config.js`

**Verify:**
```
cd "d:\Side project\LabAccess\client"
npm run build
```
Expected: Vite output lists separate chunks for `vendor-react`, `vendor-motion`, `vendor-radix`, and the main entry chunk. The main entry chunk **must be below 500 KB** (no `(!) Some chunks are larger than 500 kB` warning for the main chunk).

---

## Step 3 — Post-build analysis and fallback splitting (conditional)

**What to do:**

After the build in Step 2, inspect the Vite chunk size output. If the main entry chunk is **still ≥ 500 KB**, identify which module(s) account for the remaining size and add them to `manualChunks`.

The most likely candidate if further splitting is needed:

- `lucide-react` — icon library, can be large. Add to `manualChunks` as:
  ```js
  "vendor-icons": ["lucide-react"],
  ```

Other candidates (check the build output):
- `@fontsource/*` — font packages (usually CSS only, may not appear as JS chunks)
- `class-variance-authority` / `cn` — small, unlikely to be the issue

**Condition:** Only apply this step if the main chunk after Step 2 is ≥ 500 KB.

**Files to modify:** `client/vite.config.js` (same `manualChunks` object)

**Verify:**
```
cd "d:\Side project\LabAccess\client"
npm run build
```
Expected: No `(!) Some chunks are larger than 500 kB` warning on the main entry chunk.

---

## Step 4 — Final verification pass

**What to do:**

Run both verification commands in sequence and record the results.

```
cd "d:\Side project\LabAccess\client"
npm test
npm run build
```

Capture:
1. `npm test` — pass/fail and number of tests
2. `npm run build` — full chunk size table. Record the size of every chunk named `index-*.js` (the main entry) and compare it to the ~556 KB baseline.

**Expected final state:**
- `npm test` passes with the same results as before this change.
- The main entry chunk (`index-[hash].js`) is **below 500 KB**.
- No `(!) Some chunks are larger than 500 kB` warning appears for the main chunk (vendor chunks may exceed 500 KB individually — that is acceptable since they are cached separately and version-stable).
- `PreviewCatalog` lazy chunk is unchanged.
- Application behavior is identical: Guard session-check, role guards, error recovery, and direct-link deep reloads all work as before because `Guard`, `SessionProvider`, `RouteFocus`, and `RouteState` remain in the main bundle.

---

## Summary of files changed

| File | Change |
|---|---|
| `client/src/app/main.jsx` | Replace 4 eager imports with `React.lazy`; add `<Suspense>` around `<Routes>` |
| `client/vite.config.js` | Add `build.rollupOptions.output.manualChunks` for react, motion, radix-ui (and optionally lucide-react) |

No other files need to be modified. No new npm packages. No changes to `chunkSizeWarningLimit`.
