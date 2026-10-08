import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { spawnSync } from "node:child_process";
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
