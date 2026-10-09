import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { spawnSync } from "node:child_process";
import express from "express";
import { createApp } from "../src/app.js";
import { readConfig } from "../src/config/env.js";
import { connectDatabase, disconnectDatabase } from "../src/config/database.js";
import request from "supertest";
import { cookieOptions } from "../src/config/session.js";

async function withServer(ready, run) {
  const listener = createApp({ isDatabaseReady: () => ready }).listen(
    0,
    "127.0.0.1",
  );
  await once(listener, "listening");
  try {
    await run(`http://127.0.0.1:${listener.address().port}`);
  } finally {
    await new Promise((resolve) => listener.close(resolve));
  }
}

test("readiness returns 503 until persistence is available, then 200", async () => {
  for (const ready of [false, true]) {
    await withServer(ready, async (url) => {
      const response = await fetch(`${url}/api/health`);
      assert.equal(response.status, ready ? 200 : 503);
      const body = await response.json();
      assert.equal(
        ready ? body.data.database : body.error.code,
        ready ? "connected" : "DATABASE_UNAVAILABLE",
      );
      assert.equal(response.headers.get("cache-control"), "no-store");
    });
  }
});

test("unknown API routes and malformed JSON return controlled errors", async () => {
  await withServer(false, async (url) => {
    const missing = await fetch(`${url}/api/unknown`);
    assert.equal(missing.status, 404);
    assert.equal((await missing.json()).error.code, "NOT_FOUND");
    const malformed = await fetch(`${url}/api/unknown`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });
    assert.equal(malformed.status, 400);
    assert.deepEqual(await malformed.json(), {
      error: {
        code: "INVALID_JSON",
        message: "Request body must be valid JSON.",
      },
    });
  });
});

test("configured auth fails closed with a controlled 503 when MongoDB is unavailable", async () => {
  const app = createApp({
    config: readConfig({
      SESSION_SECRET: "test-only-secret-at-least-thirty-two-characters",
    }),
    isDatabaseReady: () => false,
  });
  const response = await request(app).get("/api/auth/me").expect(503);
  assert.equal(response.body.error.code, "DATABASE_UNAVAILABLE");
});

test("production requires HTTPS origin and explicitly secure cookies", () => {
  assert.throws(
    () =>
      readConfig({
        NODE_ENV: "production",
        APP_ORIGIN: "http://labaccess.test",
      }),
    /APP_ORIGIN/,
  );
  const config = readConfig({
    NODE_ENV: "production",
    APP_ORIGIN: "https://labaccess.test",
  });
  assert.deepEqual(cookieOptions(config), {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
  });
  assert.throws(
    () => readConfig({ SESSION_MAX_AGE_MS: "1" }),
    /SESSION_MAX_AGE_MS/,
  );
});

test("configuration rejects invalid port and connection timeout", () => {
  assert.throws(() => readConfig({ PORT: "-1" }), /PORT/);
  assert.throws(
    () => readConfig({ DB_CONNECT_TIMEOUT_MS: "infinite" }),
    /DB_CONNECT_TIMEOUT_MS/,
  );
});

test("proxy trust defaults off and only permits explicit supported topologies", () => {
  assert.equal(readConfig({}).trustProxy, false);
  assert.equal(readConfig({ TRUST_PROXY: "false" }).trustProxy, false);
  assert.equal(readConfig({ TRUST_PROXY: "loopback" }).trustProxy, "loopback");
  for (const value of ["true", "1", "uniquelocal", "0.0.0.0/0"])
    assert.throws(() => readConfig({ TRUST_PROXY: value }), /TRUST_PROXY/);
});

test("Render binds publicly and trusts only its nearest ingress proxy when opted in", () => {
  assert.equal(readConfig({}).host, "127.0.0.1");
  const config = readConfig({
    RENDER: "true", TRUST_PROXY: "render", PORT: "10000",
  });
  assert.equal(config.host, "0.0.0.0");
  assert.equal(config.port, 10000);
  assert.equal(config.trustProxy, 1);
  const app = createApp({ config, isDatabaseReady: () => false });
  assert.equal(app.get("trust proxy fn")("10.0.0.1", 0), true);
  assert.equal(app.get("trust proxy fn")("203.0.113.9", 1), false);
  assert.equal(readConfig({ RENDER: "true" }).trustProxy, false);
  assert.throws(() => readConfig({ TRUST_PROXY: "render" }), /RENDER=true/);
  assert.throws(() => readConfig({ HOST: "untrusted.example" }), /HOST/);
});

test("startup names invalid configuration without logging secret values", () => {
  for (const overrides of [
    { APP_ORIGIN: "http://invalid.test", SESSION_SECRET: "synthetic-private-value" },
    { APP_ORIGIN: "https://labaccess.test", SESSION_SECRET: "synthetic-private-value" },
  ]) {
    const result = spawnSync(process.execPath, ["src/server.js"], {
      encoding: "utf8",
      env: { ...process.env, NODE_ENV: "production", TRUST_PROXY: "false", ...overrides },
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Configuration error: (APP_ORIGIN|SESSION_SECRET)/);
    assert.doesNotMatch(result.stderr, /synthetic-private-value|http:\/\/invalid.test/);
  }
});

test("missing and unreachable MongoDB produce clear errors without exposing URI", async () => {
  await assert.rejects(
    connectDatabase(readConfig({})),
    /MONGODB_URI is required/,
  );
  try {
    await assert.rejects(
      connectDatabase(
        readConfig({
          MONGODB_URI: "mongodb://127.0.0.1:1/labaccess_test",
          DB_CONNECT_TIMEOUT_MS: "100",
        }),
      ),
      {
        message:
          "Database connection failed. Check MongoDB availability and MONGODB_URI.",
      },
    );
  } finally {
    await disconnectDatabase();
  }
});

test("oversized JSON body returns 413 PAYLOAD_TOO_LARGE without stack traces or internals", async () => {
  // Build a valid JSON object whose serialised form exceeds the 16 KiB limit.
  // 16 KiB = 16 384 bytes; padding to 17 000 bytes guarantees we cross the
  // boundary regardless of minor framing differences.
  const padding = "x".repeat(17_000);
  const oversizedBody = JSON.stringify({ padding });
  assert.ok(
    Buffer.byteLength(oversizedBody) > 16_384,
    "test body must exceed the 16 KiB limit",
  );

  await withServer(false, async (url) => {
    const response = await fetch(`${url}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: oversizedBody,
    });

    // ── status ───────────────────────────────────────────────────────────────
    assert.equal(response.status, 413);

    const body = await response.json();

    // ── controlled error envelope ─────────────────────────────────────────────
    assert.deepEqual(body, {
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "Request body is too large.",
      },
    });

    // ── no internal leakage ───────────────────────────────────────────────────
    const raw = JSON.stringify(body);
    assert.doesNotMatch(raw, /stack|at Object|at Function|at Module|\.js:\d/i,
      "response must not expose a stack trace");
    assert.doesNotMatch(raw, /mongodb|mongoose|entity\.too\.large|limit|chunk/i,
      "response must not expose internal implementation details");
  });
});

test("seed refuses production and missing demo configuration", () => {
  for (const nodeEnv of ["production", "development"]) {
    const result = spawnSync(process.execPath, ["src/scripts/seed.js"], {
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: nodeEnv,
        APP_ORIGIN:
          nodeEnv === "production"
            ? "https://labaccess.test"
            : "http://127.0.0.1:5173",
        MONGODB_URI: "mongodb://127.0.0.1:27017/labaccess_dev",
        SEED_DEMO_PASSWORD: "",
      },
    });
    assert.equal(result.status, 1);
    assert.match(
      result.stderr,
      nodeEnv === "production"
        ? /forbidden in production/
        : /SEED_DEMO_PASSWORD is required/,
    );
  }
});

// ── Render trust-proxy regression ────────────────────────────────────────────
//
// Guarantee: when Express is configured with `trust proxy = 1` (the value
// produced by TRUST_PROXY=render), it resolves req.ip from the rightmost
// entry of X-Forwarded-For — the address written by the nearest proxy (the
// Render ingress) — and never from leftmost entries, which any client can
// forge by including additional addresses before the one the real proxy adds.
//
// How Express `trust proxy = 1` works at runtime:
//   - The TCP socket peer (in production: Render's ingress; in this test:
//     supertest's loopback connection) is treated as 1 trusted hop.
//   - Express peels that hop and takes the *rightmost* X-Forwarded-For entry
//     as req.ip — the address that trusted hop itself received and forwarded.
//   - Any further-left entries in the header are *not* trusted and are never
//     promoted into req.ip, regardless of how many there are.
//
// Deployment assumption: exactly one proxy (the Render public ingress) sits
// between the internet and this process. If the hop count ever changes, the
// TRUST_PROXY value in env.js must be updated to match.

test("forged leftmost X-Forwarded-For address is never the trusted client IP under Render proxy trust", async () => {
  // Stand up a minimal isolated test app — not a product app, not createApp.
  // This avoids adding any diagnostic endpoint to production code.
  const probe = express();
  probe.set("trust proxy", 1); // mirrors readConfig({ TRUST_PROXY: "render" }).trustProxy

  // Single test-only route that echoes req.ip so assertions can read it.
  probe.get("/reflect", (req, res) => res.json({ ip: req.ip }));

  // ── scenario: attacker prepends a forged address to X-Forwarded-For ──────
  // The header "1.2.3.4, 10.0.0.2" simulates:
  //   - "1.2.3.4"  → forged by the attacker (leftmost, prepended before the
  //                   legitimate hop; this is the classic IP-spoofing attempt)
  //   - "10.0.0.2" → appended by the legitimate Render ingress (nearest hop)
  //
  // With trust proxy = 1 the TCP socket peer (supertest loopback) is the one
  // trusted hop. Express uses the *rightmost* XFF entry — "10.0.0.2" — as
  // req.ip. The forged "1.2.3.4" stays in req.ips but never becomes req.ip.
  const forgedResponse = await request(probe)
    .get("/reflect")
    .set("X-Forwarded-For", "1.2.3.4, 10.0.0.2")
    .expect(200);

  assert.equal(
    forgedResponse.body.ip,
    "10.0.0.2",
    "req.ip must be the nearest proxy hop (rightmost XFF entry), not the attacker-forged leftmost address",
  );
  assert.notEqual(
    forgedResponse.body.ip,
    "1.2.3.4",
    "forged leftmost X-Forwarded-For address must not become the trusted client IP",
  );

  // ── confirm the guarantee holds for longer forged chains ─────────────────
  // "5.5.5.5, 6.6.6.6, 10.0.0.2": the attacker now prepends *two* forged
  // addresses before the legitimate ingress entry. The result is still
  // "10.0.0.2" — the rightmost entry — because trust proxy = 1 always uses
  // exactly the rightmost XFF entry regardless of chain length.
  const longerForgeResponse = await request(probe)
    .get("/reflect")
    .set("X-Forwarded-For", "5.5.5.5, 6.6.6.6, 10.0.0.2")
    .expect(200);

  assert.equal(
    longerForgeResponse.body.ip,
    "10.0.0.2",
    "req.ip must still be the rightmost XFF entry even when the attacker forges multiple leftmost addresses",
  );
  assert.notEqual(longerForgeResponse.body.ip, "5.5.5.5");
  assert.notEqual(longerForgeResponse.body.ip, "6.6.6.6");

  // ── baseline: no XFF header → req.ip is the socket address ───────────────
  // When no X-Forwarded-For is present there is nothing to strip; the socket
  // peer's address (127.0.0.1 from supertest) is the only address Express sees.
  const noHeaderResponse = await request(probe)
    .get("/reflect")
    .expect(200);

  assert.ok(
    noHeaderResponse.body.ip === "127.0.0.1" ||
      noHeaderResponse.body.ip === "::ffff:127.0.0.1",
    `with no XFF header, req.ip must be the supertest loopback address (got ${noHeaderResponse.body.ip})`,
  );

  // ── confirm readConfig produces trustProxy = 1 for TRUST_PROXY=render ────
  const renderConfig = readConfig({
    RENDER: "true",
    TRUST_PROXY: "render",
    APP_ORIGIN: "https://labaccess.test",
    SESSION_SECRET: "test-only-secret-at-least-thirty-two-characters",
    NODE_ENV: "production",
  });
  assert.equal(
    renderConfig.trustProxy,
    1,
    "TRUST_PROXY=render must produce trustProxy=1 (nearest hop only, not 'true')",
  );

  // Verify createApp applies that value: the trust-proxy function must return
  // true for hop index 0 (the socket peer) and false for index 1 (any further
  // address in the chain), proving the Render app is not broadening trust.
  const renderApp = createApp({
    config: renderConfig,
    isDatabaseReady: () => false,
  });
  const trustFn = renderApp.get("trust proxy fn");
  assert.equal(
    trustFn("10.0.0.1", 0),
    true,
    "hop 0 (socket peer / Render ingress) must be trusted",
  );
  assert.equal(
    trustFn("203.0.113.9", 1),
    false,
    "hop 1 and beyond must not be trusted — broadening trust would allow IP forgery",
  );
});

test("production rejects MongoDB URI without explicit database name", () => {
  // Case 1: URI with no database segment — must throw naming MONGODB_URI.
  // Uses a synthetic host; real credentials and hostnames must never appear in tests.
  const noDbUri = "mongodb+srv://synthetic-host.mongodb.net/?appName=Cluster0";
  assert.throws(
    () =>
      readConfig({
        NODE_ENV: "production",
        APP_ORIGIN: "https://example.test",
        SESSION_SECRET: "a".repeat(32),
        MONGODB_URI: noDbUri,
      }),
    (err) => {
      // Error must mention MONGODB_URI as the config key.
      assert.match(err.message, /MONGODB_URI/);
      // Error must not leak any part of the supplied URI.
      assert.doesNotMatch(err.message, /synthetic-host\.mongodb\.net/);
      assert.doesNotMatch(err.message, /appName/);
      assert.doesNotMatch(err.message, /Cluster0/);
      return true;
    },
  );

  // Case 2: URI with an explicit database name — must NOT throw for the URI check.
  // (Other missing-field errors like SESSION_SECRET length are acceptable.)
  const withDbUri = "mongodb+srv://synthetic-host.mongodb.net/labaccess_prod";
  let caughtMessage = null;
  try {
    readConfig({
      NODE_ENV: "production",
      APP_ORIGIN: "https://example.test",
      SESSION_SECRET: "a".repeat(32),
      MONGODB_URI: withDbUri,
    });
  } catch (err) {
    caughtMessage = err.message;
  }
  if (caughtMessage !== null) {
    assert.doesNotMatch(
      caughtMessage,
      /MONGODB_URI/,
      `URI with explicit database name must not trigger MONGODB_URI error; got: ${caughtMessage}`,
    );
  }

  // Case 3: Development mode — no-database URI must be allowed (safeguard is off).
  // Does NOT throw for a MONGODB_URI missing-database-name error in dev.
  let devCaughtMessage = null;
  try {
    readConfig({
      NODE_ENV: "development",
      MONGODB_URI: "mongodb://127.0.0.1:27017/",
    });
  } catch (err) {
    devCaughtMessage = err.message;
  }
  if (devCaughtMessage !== null) {
    assert.doesNotMatch(
      devCaughtMessage,
      /MONGODB_URI/,
      `Development mode must not enforce database-name check; got: ${devCaughtMessage}`,
    );
  }
});
