# Investigation: MongoDB URI Database-Name Safeguard

## Summary Answer

`env.js` passes `MONGODB_URI` through to `database.js` without any validation of its structure. There is **no check that the URI contains an explicit database name**. A URI like `mongodb+srv://user:pass@cluster.mongodb.net/?appName=Cluster0` will silently connect to the MongoDB default database (`test`), which is exactly the deployment mistake described.

The safeguard must be added in **`server/src/config/env.js`** inside `readConfig()`, using the WHATWG `URL` API (already imported nowhere — needs a plain `new URL()` call, which is available globally in Node.js). The check should be production-only (or at minimum warn/reject in production). It should extract the pathname segment, which holds the database name in both `mongodb://` and `mongodb+srv://` URI forms, and reject any URI where that name is absent or empty.

---

## Evidence

### 1. `server/src/config/env.js`

Full content read verbatim.  
Key observations:

- `readConfig(env = process.env)` reads every env var and validates them individually.
- `mongodbUri: env.MONGODB_URI` on ~line 50 — the value is stored **as-is, no structural validation whatsoever**.
- The function already uses `new URL(...)` for `APP_ORIGIN` validation (lines 21–42), so the same pattern can be applied for MONGODB_URI.
- There is an explicit check for `sessionSecret` length in `server.js`, not in `env.js` — so some validations live outside `readConfig`.

### 2. `server/src/config/database.js`

Full content read verbatim.  
Key observations:

- `connectDatabase(config)` checks only that `config.mongodbUri` is truthy (not undefined/empty); throws: _"MONGODB_URI is required."_
- It does not parse the URI or check for a database name segment at all.
- Error messages already follow the sanitization policy: no URI, no credentials are printed.

### 3. `server/src/server.js` — startup flow

Startup sequence:
1. `readConfig()` — if it throws, logs `Configuration error: ${error.message}` (never the raw value) and exits.
2. `connectDatabase(config)` — if it throws, logs `error.message` and continues (API serves 503).
3. `createApp(...)` — Express app is created and starts listening.

The `Configuration error:` prefix is used in `server.js` when `readConfig()` throws. The existing test _"startup names invalid configuration without logging secret values"_ asserts:
- exit code 1
- `stderr` matches `/Configuration error: (APP_ORIGIN|SESSION_SECRET)/`
- `stderr` does NOT match the actual supplied value

This means **any new validation added inside `readConfig()` will automatically be covered by the existing "no secret values" test pattern**, provided the error message names the config key (e.g. `MONGODB_URI`) but not the URI content.

### 4. `server/tests/foundation.test.js` — existing relevant tests

Two tests are directly relevant:

**`"missing and unreachable MongoDB produce clear errors without exposing URI"`** (lines ~157–178):
```js
await assert.rejects(
  connectDatabase(readConfig({})),
  /MONGODB_URI is required/,
);
// ... also tests an unreachable host
```
This test uses `readConfig({})` (no URI at all) and `readConfig({ MONGODB_URI: "mongodb://127.0.0.1:1/labaccess_test" })` (has an explicit database name `/labaccess_test`).  
It does **not** test a URI without a database name segment — that is the gap to fill.

**`"seed is repeatable, preserves records, and refuses unsafe destinations"`** (in `auth.integration.test.js`):
```js
assert.throws(
  () => validateSeed({ ...config, mongodbUri: "mongodb://127.0.0.1/real_accounts" }, password),
  /requires a database/,
);
```
This tests the seed script's own `validateSeed()` guard in `seed-data.js`, which checks the database name via `new URL(config.mongodbUri).pathname.slice(1)` and a regex. That guard is seed-only; it does not protect the production server path.

**`"startup names invalid configuration without logging secret values"`** (lines ~175–191):
Uses `spawnSync` on `server.js` with production env vars. Currently only tests `APP_ORIGIN` and `SESSION_SECRET`. Adding a URI-less production test case here would cover the new check end-to-end.

### 5. `server/src/scripts/seed-data.js` — existing seed safeguard

`validateSeed()` already:
1. Rejects production env.
2. Parses the URI with `new URL()` and extracts the database name via `.pathname.slice(1)`.
3. Rejects any name not matching `/^labaccess_(dev|test(?:_[a-zA-Z0-9_]+)?)$/`.
4. Does not print the URI or the database name in error messages.

This is the **proven pattern** for URI database-name extraction in this codebase. The new production safeguard should use the same `new URL(uri).pathname.slice(1)` approach.

### 6. URI parsing — how the database name is encoded

Both `mongodb://` and `mongodb+srv://` URIs encode the database name in the **URL path segment**:
- `mongodb://host:27017/mydb` → `pathname = "/mydb"` → `.slice(1)` = `"mydb"`
- `mongodb+srv://user:pass@cluster.mongodb.net/mydb?retryWrites=true` → `pathname = "/mydb"` → `.slice(1)` = `"mydb"`
- `mongodb+srv://user:pass@cluster.mongodb.net/?appName=Cluster0` → `pathname = "/"` → `.slice(1)` = `""` ← **the bug**
- `mongodb+srv://user:pass@cluster.mongodb.net?appName=Cluster0` → `pathname = ""` → `.slice(1)` = `""` ← also missing

The WHATWG `URL` parser handles `mongodb+srv://` correctly as a valid URL scheme for this purpose. The check `new URL(uri).pathname.slice(1)` is the right extraction method — already proven by `seed-data.js`.

### 7. Pre-existing test failures (not related to this task)

Running `node --test tests/foundation.test.js` currently shows **2 pre-existing failures**:
- `"forged leftmost X-Forwarded-For address is never the trusted client IP under Render proxy trust"` — Express `trust proxy = 1` IP resolution discrepancy.
- `"Render proxy trust preserves production secure-cookie behavior: HTTPS forwarding sets Secure, plain HTTP does not"` — related 503 issue.

Both are unrelated to URI validation. The new feature must not disturb the 11 currently-passing tests.

---

## Exact Lines to Change

### `server/src/config/env.js`

**Where**: inside `readConfig()`, after the `mongodbUri` assignment (currently ~line 50), or better — replace the plain assignment with a validated one, adding a production-only (or environment-conditional) check.

**What to add** (pseudocode — do not implement here):

```js
// After extracting nodeEnv but within readConfig():
const rawUri = env.MONGODB_URI;
if (rawUri && nodeEnv === "production") {
  let dbName;
  try {
    dbName = new URL(rawUri).pathname.slice(1);
  } catch {
    throw new Error("MONGODB_URI is not a valid connection string.");
  }
  if (!dbName) {
    throw new Error(
      "MONGODB_URI must include an explicit database name (e.g. /mydb before any query string). " +
      "A URI ending with .mongodb.net/ or .mongodb.net/? uses the default database."
    );
  }
}
```

Key design decisions still to make (noted as recommendations below):
1. **Production-only vs always**: The task says "keep development behavior compatible" but also "reject URIs without a database name." A production-only guard is the minimal safe change. Alternatively, warn in development and reject in production.
2. **Where to put it**: `readConfig()` in `env.js` is the right place — consistent with all other validation, and the `Configuration error:` startup banner will carry the message automatically.
3. **Error message wording**: Must name `MONGODB_URI` as the config key. Must NOT print `rawUri` or any part of it (credentials, host, database name).

### `server/tests/foundation.test.js`

**Extend `"missing and unreachable MongoDB produce clear errors without exposing URI"`**:
Add two `assert.throws` / `assert.rejects` cases inside the existing test:
1. A URI without a database name, production env → should throw with message matching `/MONGODB_URI/` and not containing the URI.
2. A URI with an explicit database name, production env → should **not** throw.

Or add a new dedicated test: `"production rejects MongoDB URI without explicit database name"`.

---

## Conclusions and Recommendations

### Recommended fix

1. **In `env.js` → `readConfig()`**: After parsing `nodeEnv`, parse `MONGODB_URI` with `new URL()` when it is set and `nodeEnv === "production"`. If `.pathname.slice(1)` is empty (or just whitespace), throw:  
   `"MONGODB_URI must include an explicit database name. A URI ending with '/' or '?' connects to the default database."`  
   Do not include the URI, hostname, username, password, or database name in the message.

2. **In `foundation.test.js`**: Add two cases to the existing `"missing and unreachable MongoDB produce clear errors without exposing URI"` test (or a new dedicated test):
   - `readConfig({ NODE_ENV: "production", APP_ORIGIN: "https://labaccess.test", MONGODB_URI: "mongodb+srv://synthetic-host.mongodb.net/?appName=Cluster0" })` → throws matching `/MONGODB_URI/`
   - Verify the error does NOT match the URI string.
   - `readConfig({ NODE_ENV: "production", APP_ORIGIN: "https://labaccess.test", MONGODB_URI: "mongodb+srv://synthetic-host.mongodb.net/labaccess_prod" })` → does NOT throw for the URI check.

3. **Development compatibility**: In `development` and `test` modes, allow URIs without a database name (since mongodb-memory-server injects the name via `mongo.getUri("dbname")` directly). No change to dev/test behavior.

4. **Do not change `database.js`**: The check belongs in `readConfig()` (configuration layer), not in `connectDatabase()` (connection layer). Consistent with the existing architecture.

5. **Do not hardcode allowed database names**: The check is purely structural (is there a name?) not semantic (is it the right name?). `seed-data.js` already handles the semantic allowlist for seeding; the production server should not know about specific database names.

### Files to modify

| File | Change |
|------|--------|
| `server/src/config/env.js` | Add URI database-name validation inside `readConfig()`, production-only |
| `server/tests/foundation.test.js` | Add regression tests for missing and explicit database names |

### Files NOT to modify

| File | Reason |
|------|--------|
| `server/src/config/database.js` | Validation belongs in config layer, not connection layer |
| `server/src/scripts/seed-data.js` | Existing seed safeguard is correct and sufficient; do not duplicate |
| `server/src/server.js` | No change needed; `Configuration error:` banner already covers `readConfig()` throws |

### Compatibility note

MongoDB Memory Server (used in all integration tests) provides URIs like `mongo.getUri("labaccess_test_auth")` which produce `mongodb://127.0.0.1:PORT/labaccess_test_auth` — these have an explicit database name and will pass the new check even if we apply it to all environments. However, keeping it production-only is the safer minimal change and matches the task's "keep development behavior compatible" requirement.

---

## Appendix: Current test runner state

Test runner: `node --test` (Node.js built-in test runner)  
Test command: `node --test tests/*.test.js` (from `package.json` scripts.test)  
Individual file: `node --test tests/foundation.test.js`

Pre-existing failures (2, unrelated to this task):
- `forged leftmost X-Forwarded-For address is never the trusted client IP under Render proxy trust`
- `Render proxy trust preserves production secure-cookie behavior: HTTPS forwarding sets Secure, plain HTTP does not`

All other 11 tests in `foundation.test.js` pass. The new feature must preserve these 11 passing tests.
