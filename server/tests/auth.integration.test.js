import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { createApp } from "../src/app.js";
import { readConfig } from "../src/config/env.js";
import { connectDatabase, disconnectDatabase } from "../src/config/database.js";
import { User } from "../src/modules/auth/user.model.js";
import { Resource } from "../src/modules/resources/resource.model.js";
import { seedData, validateSeed } from "../src/scripts/seed-data.js";
let mongo, app, config;
const extraStores = [];
const password = " Synthetic Password 123 ";
const origin = "http://127.0.0.1:5173";
before(async () => {
  mongo = await MongoMemoryServer.create({
    instance: { dbName: "labaccess_test_auth" },
  });
  config = readConfig({
    NODE_ENV: "test",
    MONGODB_URI: mongo.getUri("labaccess_test_auth"),
    SESSION_SECRET: "test-secret-with-at-least-thirty-two-characters",
    APP_ORIGIN: origin,
  });
  await connectDatabase(config);
  await seedData(config, password);
  app = createApp({ config });
});
after(async () => {
  for (const store of extraStores) await store.close();
  await app?.locals.sessionStore.close();
  await disconnectDatabase();
  await mongo?.stop();
});
beforeEach(async () => {
  await User.deleteMany({
    email: {
      $nin: [
        "learner@labaccess.test",
        "learner2@labaccess.test",
        "reviewer@labaccess.test",
      ],
    },
  });
});
async function client() {
  const agent = request.agent(app);
  const response = await agent.get("/api/auth/csrf").expect(200);
  return {
    agent,
    token: response.body.data.csrfToken,
    cookie: response.headers["set-cookie"][0].split(";")[0],
  };
}
const post = (client, path, body) =>
  client.agent
    .post(`/api/auth/${path}`)
    .set("Origin", origin)
    .set("X-CSRF-Token", client.token)
    .send(body);
async function signIn(email = "learner@labaccess.test") {
  const c = await client();
  const login = await post(c, "login", { email, password }).expect(200);
  c.loginCookie = login.headers["set-cookie"][0].split(";")[0];
  c.token = (
    await c.agent.get("/api/auth/csrf").expect(200)
  ).body.data.csrfToken;
  return c;
}
test("registration rejects role assignment without creating a reviewer", async () => {
  const c = await client();
  await post(c, "register", {
    name: "New User",
    email: "role@labaccess.test",
    password,
    role: "reviewer",
  }).expect(400);
  assert.equal(await User.countDocuments({ email: "role@labaccess.test" }), 0);
});
test("registration normalizes email, preserves password, hashes it and rejects duplicates", async () => {
  const c = await client();
  const account = {
    name: "  New User  ",
    email: " NEW@LabAccess.test ",
    password,
  };
  const created = await post(c, "register", account).expect(201);
  assert.deepEqual(
    { ...created.body.data, id: undefined },
    {
      id: undefined,
      name: "New User",
      email: "new@labaccess.test",
      role: "learner",
    },
  );
  await post(c, "register", { ...account, email: "new@labaccess.test" }).expect(
    409,
  );
  assert.equal(await User.countDocuments({ email: "new@labaccess.test" }), 1);
  assert.match(
    (
      await User.findOne({ email: "new@labaccess.test" }).select(
        "+passwordHash",
      )
    ).passwordHash,
    /^\$argon2id\$/,
  );
  await post(c, "login", { email: "new@labaccess.test", password }).expect(200);
});
test("anonymous reads and incorrect credentials are rejected", async () => {
  await request(app).get("/api/auth/me").expect(401);
  await request(app).get("/api/resources").expect(401);
  const c = await client();
  const failed = await post(c, "login", {
    email: "learner@labaccess.test",
    password: "incorrect-password",
  }).expect(401);
  assert.equal(failed.body.error.code, "INVALID_CREDENTIALS");
});
test("login rotates session and token; logout invalidates replayed cookie", async () => {
  const c = await signIn();
  assert.notEqual(c.cookie, c.loginCookie);
  await request(app).get("/api/auth/me").set("Cookie", c.cookie).expect(401);
  const me = await c.agent.get("/api/auth/me").expect(200);
  assert.equal(me.body.data.role, "learner");
  const stored = await mongoose.connection.db
    .collection("sessions")
    .findOne({ session: { $regex: me.body.data.id } });
  assert.deepEqual(Object.keys(JSON.parse(stored.session)).sort(), [
    "cookie",
    "csrfToken",
    "userId",
  ]);
  const logout = await post(c, "logout", {}).expect(200);
  assert.match(
    logout.headers["set-cookie"][0],
    /labaccess.sid=;.*HttpOnly.*SameSite=Lax/,
  );
  await request(app)
    .get("/api/auth/me")
    .set("Cookie", c.loginCookie)
    .expect(401);
});
test("cross-site, missing origin/token, and stale token mutations are rejected", async () => {
  const c = await client();
  const body = { email: "learner@labaccess.test", password };
  await c.agent
    .post("/api/auth/login")
    .set("Origin", "https://evil.test")
    .set("X-CSRF-Token", c.token)
    .send(body)
    .expect(403);
  await c.agent
    .post("/api/auth/login")
    .set("X-CSRF-Token", c.token)
    .send(body)
    .expect(403);
  await c.agent
    .post("/api/auth/login")
    .set("Origin", origin)
    .send(body)
    .expect(403);
  const oldToken = c.token;
  await post(c, "login", body).expect(200);
  await c.agent
    .post("/api/auth/logout")
    .set("Origin", origin)
    .set("X-CSRF-Token", oldToken)
    .send({})
    .expect(403);
});
test("trusted current account role controls reviewer guard", async () => {
  const c = await signIn();
  await c.agent.get("/api/review/requests").expect(403);
  const reviewer = await signIn("reviewer@labaccess.test");
  // Phase 3 now supplies the reviewer list behind the same trusted-role gate.
  await reviewer.agent.get("/api/review/requests").expect(200);
  await User.updateOne(
    { email: "reviewer@labaccess.test" },
    { role: "learner" },
  );
  try {
    await reviewer.agent.get("/api/review/requests").expect(403);
  } finally {
    await User.updateOne(
      { email: "reviewer@labaccess.test" },
      { role: "reviewer" },
    );
  }
});
test("seed is repeatable, preserves records, and refuses unsafe destinations", async () => {
  const before = await User.find()
    .select("+passwordHash")
    .sort({ email: 1 })
    .lean();
  const resourcesBefore = await Resource.find().sort({ slug: 1 }).lean();
  await seedData(config, "Changed synthetic password!");
  assert.deepEqual(
    await User.find().select("+passwordHash").sort({ email: 1 }).lean(),
    before,
  );
  assert.deepEqual(
    await Resource.find().sort({ slug: 1 }).lean(),
    resourcesBefore,
  );
  assert.equal(await User.countDocuments(), 3);
  assert.equal(await Resource.countDocuments(), 6);
  assert.throws(
    () => validateSeed({ ...config, nodeEnv: "production" }, password),
    /forbidden/,
  );
  assert.throws(
    () =>
      validateSeed(
        { ...config, mongodbUri: "mongodb://127.0.0.1/real_accounts" },
        password,
      ),
    /requires a database/,
  );
});
test("resources are real active records with stable pagination and strict query validation", async () => {
  const c = await signIn();
  const first = await c.agent.get("/api/resources?pageSize=2").expect(200);
  assert.deepEqual(first.body.pagination, {
    page: 1,
    pageSize: 2,
    total: 6,
    totalPages: 3,
  });
  assert.match(first.body.data[0].id, /^[a-f0-9]{24}$/);
  await c.agent.get("/api/resources?page=-1").expect(400);
  await c.agent.get("/api/resources?page=1&page=2").expect(400);
  await c.agent.get("/api/resources?role=reviewer").expect(400);
  const target = await Resource.findOne({ slug: "mern" });
  await Resource.updateOne({ _id: target.id }, { isActive: false });
  try {
    assert.equal(
      (await c.agent.get("/api/resources").expect(200)).body.pagination.total,
      5,
    );
  } finally {
    await Resource.updateOne({ _id: target.id }, { isActive: true });
  }
});
test("simultaneous normalized registrations produce one account and one conflict", async () => {
  const first = await client(),
    second = await client();
  const account = {
    name: "Concurrent Learner",
    email: "race@labaccess.test",
    password,
  };
  const results = await Promise.all([
    post(first, "register", account),
    post(second, "register", { ...account, email: " RACE@LabAccess.test " }),
  ]);
  assert.deepEqual(results.map((result) => result.status).sort(), [201, 409]);
  assert.equal(await User.countDocuments({ email: "race@labaccess.test" }), 1);
});

test("expired MongoDB session fails even when its cookie is replayed", async () => {
  const c = await signIn();
  const me = await c.agent.get("/api/auth/me").expect(200);
  await mongoose.connection.db
    .collection("sessions")
    .updateMany(
      { session: { $regex: me.body.data.id } },
      { $set: { expires: new Date(0) } },
    );
  await c.agent.get("/api/auth/me").expect(401);
});

test("development cookies and store expiry match the configured lifetime", async () => {
  const c = await client();
  const response = await post(c, "login", {
    email: "learner2@labaccess.test",
    password,
  }).expect(200);
  const cookie = response.headers["set-cookie"][0];
  assert.match(cookie, /Path=\/; Expires=.*HttpOnly; SameSite=Lax/);
  const record = await mongoose.connection.db
    .collection("sessions")
    .findOne({ session: { $regex: response.body.data.id } });
  const stored = JSON.parse(record.session);
  assert.equal(stored.cookie.originalMaxAge, config.sessionMaxAgeMs);
  assert.equal(record.expires.toISOString(), stored.cookie.expires);
  const indexes = await mongoose.connection.db.collection("sessions").indexes();
  assert.ok(
    indexes.some(
      (index) => index.expireAfterSeconds === 0 && index.key.expires === 1,
    ),
  );
});

test("authentication attempts are bounded and return retry guidance", async () => {
  // Isolated limiter, avoiding contamination from other authentication tests.
  const limited = createApp({ config });
  try {
    const agent = request.agent(limited);
    const token = (await agent.get("/api/auth/csrf")).body.data.csrfToken;
    for (let attempt = 0; attempt < 20; attempt++)
      await agent
        .post("/api/auth/login")
        .set("Origin", origin)
        .set("X-CSRF-Token", token)
        .send({})
        .expect(400);
    const response = await agent
      .post("/api/auth/login")
      .set("Origin", origin)
      .set("X-CSRF-Token", token)
      .send({})
      .expect(429);
    assert.ok(Number(response.headers["retry-after"]) > 0);
  } finally {
    extraStores.push(limited.locals.sessionStore);
  }
});

test("production cookies require an explicitly trusted loopback TLS proxy", async () => {
  const productionConfig = readConfig({
    NODE_ENV: "production",
    APP_ORIGIN: "https://labaccess.test",
    SESSION_SECRET: config.sessionSecret,
    TRUST_PROXY: "loopback",
  });
  const proxied = createApp({ config: productionConfig });
  try {
    const forwarded = await request(proxied)
      .get("/api/auth/csrf")
      .set("X-Forwarded-Proto", "https")
      .expect(200);
    assert.match(forwarded.headers["set-cookie"]?.[0] ?? "", /; Secure;/);
    assert.match(
      forwarded.headers["set-cookie"][0],
      /HttpOnly; Secure; SameSite=Lax/,
    );
    const plain = await request(proxied).get("/api/auth/csrf").expect(200);
    assert.equal(plain.headers["set-cookie"], undefined);
    assert.equal(proxied.get("trust proxy fn")("203.0.113.9", 0), false);
  } finally {
    extraStores.push(proxied.locals.sessionStore);
  }
  const untrusted = createApp({
    config: { ...productionConfig, trustProxy: false },
  });
  try {
    const response = await request(untrusted)
      .get("/api/auth/csrf")
      .set("X-Forwarded-Proto", "https")
      .expect(200);
    assert.equal(response.headers["set-cookie"], undefined);
  } finally {
    extraStores.push(untrusted.locals.sessionStore);
  }
});
