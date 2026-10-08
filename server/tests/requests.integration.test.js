import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../src/app.js";
import { readConfig } from "../src/config/env.js";
import { connectDatabase, disconnectDatabase } from "../src/config/database.js";
import { seedData } from "../src/scripts/seed-data.js";
import { Resource } from "../src/modules/resources/resource.model.js";
import { AccessRequest } from "../src/modules/requests/request.model.js";
let mongo, app, learner, other, reviewer, resources;
const origin = "http://127.0.0.1:5173";
const password = "Workflow synthetic password!";
const reason = "I need this resource for a guided learning project.";
const decisionReason = "Approved for your course project.";
const documents = () => mongoose.connection.db.collection("accessrequests");
before(async () => {
  mongo = await MongoMemoryServer.create({
    instance: { dbName: "labaccess_test_workflow" },
  });
  const config = readConfig({
    NODE_ENV: "test",
    MONGODB_URI: mongo.getUri("labaccess_test_workflow"),
    SESSION_SECRET: "workflow-test-secret-with-at-least-32-characters",
    APP_ORIGIN: origin,
  });
  await connectDatabase(config);
  await AccessRequest.createIndexes();
  await seedData(config, password);
  app = createApp({ config });
  // Indexes are built against genuine mongod before the factory serves requests.
  const accounts = await Promise.all(
    [
      "learner@labaccess.test",
      "learner2@labaccess.test",
      "reviewer@labaccess.test",
    ].map(async (email) => {
      const agent = request.agent(app);
      const csrf = (await agent.get("/api/auth/csrf").expect(200)).body.data
        .csrfToken;
      const user = (
        await agent
          .post("/api/auth/login")
          .set("Origin", origin)
          .set("X-CSRF-Token", csrf)
          .send({ email, password })
          .expect(200)
      ).body.data;
      const token = (await agent.get("/api/auth/csrf").expect(200)).body.data
        .csrfToken;
      return { agent, token, user };
    }),
  );
  [learner, other, reviewer] = accounts;
  resources = await Resource.find().sort({ slug: 1 }).lean();
});
beforeEach(async () => {
  await documents().deleteMany({});
  await Resource.updateMany({}, { isActive: true });
});
after(async () => {
  await app?.locals.sessionStore?.close();
  await disconnectDatabase();
  await mongo?.stop();
});
const post = (account, path, body) =>
  account.agent
    .post(`/api${path}`)
    .set("Origin", origin)
    .set("X-CSRF-Token", account.token)
    .send(body);
const submit = (account = learner, resource = resources[0], text = reason) =>
  post(account, "/requests", {
    resourceId: String(resource._id),
    reason: text,
  });
const cancel = (id, revision = 0, account = learner) =>
  post(account, `/requests/${id}/cancel`, { revision });
const resubmit = (
  id,
  revision,
  text = "An updated reason for the next learning project.",
  account = learner,
) => post(account, `/requests/${id}/resubmit`, { revision, reason: text });
const decide = (id, status = "approved", revision = 0, account = reviewer) =>
  post(account, `/review/requests/${id}/decision`, {
    revision,
    status,
    reason: decisionReason,
  });
const saved = (id) =>
  documents().findOne({ _id: new mongoose.Types.ObjectId(id) });
async function created(account = learner, resource = resources[0]) {
  return (await submit(account, resource).expect(201)).body.data;
}

test("real unique and stable list indexes exist before concurrent operations", async () => {
  const indexes = await documents().indexes();
  assert.ok(
    indexes.some(
      (index) =>
        index.unique && index.key.learnerId === 1 && index.key.resourceId === 1,
    ),
  );
  assert.ok(
    indexes.some(
      (index) =>
        index.key.status === 1 &&
        index.key.submittedAt === 1 &&
        index.key._id === 1,
    ),
  );
  assert.ok(
    indexes.some(
      (index) =>
        index.key.learnerId === 1 &&
        index.key.submittedAt === -1 &&
        index.key._id === -1,
    ),
  );
});
test("creation derives owner, trims reason, and records only server history", async () => {
  const response = await submit(learner, resources[0], `  ${reason}  `).expect(
    201,
  );
  const data = response.body.data,
    doc = await saved(data.id);
  assert.equal(data.learnerId, learner.user.id);
  assert.equal(data.reason, reason);
  assert.equal(data.revision, 0);
  assert.deepEqual(data.history, [
    {
      action: "submit",
      fromStatus: null,
      toStatus: "pending",
      actorId: learner.user.id,
      actorName: learner.user.name,
      reason,
      at: data.submittedAt,
    },
  ]);
  assert.equal(doc.history.length, 1);
  assert.equal(doc.status, "pending");
  assert.equal(doc.submittedAt.toISOString(), data.submittedAt);
});
test("parallel submissions yield one persistent document and one controlled conflict", async () => {
  const responses = await Promise.all([submit(), submit()]);
  assert.deepEqual(
    responses.map((response) => response.status).sort(),
    [201, 409],
  );
  assert.equal(
    responses.find((response) => response.status === 409).body.error.code,
    "REQUEST_EXISTS",
  );
  const records = await documents().find().toArray();
  assert.equal(records.length, 1);
  assert.equal(records[0].history.length, 1);
});
test("another learner cannot read, cancel, or resubmit a request and gains no ownership details", async () => {
  const item = await created();
  const before = await saved(item.id);
  const read = await other.agent.get(`/api/requests/${item.id}`).expect(404);
  await cancel(item.id, 0, other).expect(404);
  await resubmit(item.id, 0, reason, other).expect(404);
  assert.equal(read.body.error.code, "NOT_FOUND");
  assert.deepEqual(await saved(item.id), before);
});
test("roles are enforced on submit, owner lists/actions, and reviewer decisions", async () => {
  const item = await created();
  await submit(reviewer).expect(403);
  await reviewer.agent.get("/api/requests/mine").expect(403);
  await cancel(item.id, 0, reviewer).expect(403);
  await resubmit(item.id, 0, reason, reviewer).expect(403);
  await decide(item.id, "approved", 0, learner).expect(403);
  await learner.agent.get("/api/review/requests").expect(403);
  assert.equal((await saved(item.id)).history.length, 1);
});
test("anonymous workflow calls are denied and mutations require CSRF", async () => {
  await request(app).get("/api/requests/mine").expect(401);
  await request(app).get("/api/review/requests").expect(401);
  await learner.agent
    .post("/api/requests")
    .set("Origin", origin)
    .send({ resourceId: String(resources[0]._id), reason })
    .expect(403);
  await learner.agent
    .post("/api/requests")
    .set("Origin", "https://evil.test")
    .set("X-CSRF-Token", learner.token)
    .send({ resourceId: String(resources[0]._id), reason })
    .expect(403);
  assert.equal(await documents().countDocuments(), 0);
});
test("missing and inactive resources cannot receive new submissions", async () => {
  await post(learner, "/requests", {
    resourceId: "000000000000000000000001",
    reason,
  }).expect(404);
  await Resource.updateOne({ _id: resources[0]._id }, { isActive: false });
  await submit().expect(404);
  assert.equal(await documents().countDocuments(), 0);
});
test("approved is terminal; every forbidden repeat leaves the document unchanged", async () => {
  const item = await created();
  await decide(item.id).expect(200);
  const before = await saved(item.id);
  await cancel(item.id, 1).expect(409);
  await resubmit(item.id, 1).expect(409);
  await decide(item.id, "rejected", 1).expect(409);
  await submit().expect(409);
  assert.deepEqual(await saved(item.id), before);
});
test("parallel approve/reject commits exactly one decision and its matching event", async () => {
  const item = await created();
  const results = await Promise.all([
    decide(item.id, "approved"),
    decide(item.id, "rejected"),
  ]);
  assert.deepEqual(
    results.map((response) => response.status).sort(),
    [200, 409],
  );
  const doc = await saved(item.id);
  assert.equal(doc.revision, 1);
  assert.equal(doc.history.length, 2);
  assert.equal(
    doc.status,
    results.find((response) => response.status === 200).body.data.status,
  );
  assert.equal(doc.history[1].toStatus, doc.status);
  assert.equal(String(doc.history[1].actorId), reviewer.user.id);
  assert.equal(doc.history[1].reason, doc.decisionReason);
});
test("parallel approve/cancel commits exactly one transition and matching actor", async () => {
  const item = await created();
  const results = await Promise.all([decide(item.id), cancel(item.id)]);
  assert.deepEqual(
    results.map((response) => response.status).sort(),
    [200, 409],
  );
  const doc = await saved(item.id);
  assert.equal(doc.revision, 1);
  assert.equal(doc.history.length, 2);
  assert.equal(doc.history[1].toStatus, doc.status);
  assert.equal(
    String(doc.history[1].actorId),
    doc.status === "approved" ? reviewer.user.id : learner.user.id,
  );
});
test("old pending revision remains stale after cancel and resubmit return to pending", async () => {
  const item = await created();
  await cancel(item.id).expect(200);
  await resubmit(item.id, 1).expect(200);
  const before = await saved(item.id);
  await decide(item.id, "approved", 0).expect(409);
  await cancel(item.id, 0).expect(409);
  assert.deepEqual(await saved(item.id), before);
  await decide(item.id, "approved", 2).expect(200);
});
test("reject/resubmit/cancel/resubmit preserves old reasons and one document", async () => {
  const item = await created();
  const rejected = await decide(item.id, "rejected").expect(200);
  const firstReason = "An updated plan for my guided learning project.";
  const secondReason = "Another learning plan after the previous cancellation.";
  await resubmit(item.id, 1, firstReason).expect(200);
  await cancel(item.id, 2).expect(200);
  const last = (await resubmit(item.id, 3, secondReason).expect(200)).body.data;
  assert.equal(last.id, item.id);
  assert.equal(last.status, "pending");
  assert.equal(last.decisionReason, null);
  assert.equal(last.revision, 4);
  assert.equal(last.reason, secondReason);
  assert.deepEqual(
    last.history.map((event) => event.reason),
    [
      reason,
      rejected.body.data.decisionReason,
      firstReason,
      firstReason,
      secondReason,
    ],
  );
  assert.deepEqual(
    last.history.map((event) => event.action),
    ["submit", "reject", "resubmit", "cancel", "resubmit"],
  );
  assert.equal(await documents().countDocuments(), 1);
  assert.equal(
    (await saved(item.id)).submittedAt.toISOString(),
    last.submittedAt,
  );
});
test("resubmission rechecks resource availability and preserves state on failure", async () => {
  const item = await created();
  await cancel(item.id).expect(200);
  const before = await saved(item.id);
  await Resource.updateOne({ _id: resources[0]._id }, { isActive: false });
  await resubmit(item.id, 1).expect(404);
  assert.deepEqual(await saved(item.id), before);
});
test("parallel resubmissions append a single event", async () => {
  const item = await created();
  await cancel(item.id).expect(200);
  const results = await Promise.all([
    resubmit(item.id, 1),
    resubmit(item.id, 1),
  ]);
  assert.deepEqual(
    results.map((response) => response.status).sort(),
    [200, 409],
  );
  const doc = await saved(item.id);
  assert.equal(doc.history.length, 3);
  assert.equal(doc.revision, 2);
});
test("owner lists isolate accounts and support status filters and stable paging", async () => {
  const first = await created(learner, resources[0]),
    second = await created(learner, resources[1]);
  await created(other, resources[0]);
  const fixed = new Date("2026-10-08T00:00:00Z");
  await documents().updateMany({}, { $set: { submittedAt: fixed } });
  const page1 = (
    await learner.agent.get("/api/requests/mine?pageSize=1").expect(200)
  ).body;
  const page2 = (
    await learner.agent.get("/api/requests/mine?pageSize=1&page=2").expect(200)
  ).body;
  assert.equal(page1.pagination.total, 2);
  assert.deepEqual(
    [page1.data[0].id, page2.data[0].id],
    [first.id, second.id].sort().reverse(),
  );
  await cancel(first.id).expect(200);
  const filtered = (
    await learner.agent.get("/api/requests/mine?status=cancelled").expect(200)
  ).body;
  assert.deepEqual(
    filtered.data.map((item) => item.id),
    [first.id],
  );
  assert.equal(filtered.pagination.total, 1);
  const empty = (
    await learner.agent.get("/api/requests/mine?status=approved").expect(200)
  ).body;
  assert.deepEqual(empty.pagination, {
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
});
test("reviewer default is pending oldest-first, with safe learner/resource summaries", async () => {
  const first = await created(learner, resources[0]),
    second = await created(other, resources[1]);
  await documents().updateMany(
    {},
    { $set: { submittedAt: new Date("2026-10-08T00:00:00Z") } },
  );
  const queue = (await reviewer.agent.get("/api/review/requests").expect(200))
    .body;
  assert.deepEqual(
    queue.data.map((item) => item.id),
    [first.id, second.id].sort(),
  );
  assert.equal(queue.data[0].learner.email, "learner@labaccess.test");
  assert.deepEqual(Object.keys(queue.data[0].learner).sort(), [
    "email",
    "id",
    "name",
    "role",
  ]);
  assert.deepEqual(Object.keys(queue.data[0].resource).sort(), [
    "category",
    "description",
    "eligibility",
    "id",
    "isActive",
    "name",
  ]);
  assert.doesNotMatch(
    JSON.stringify(queue),
    /passwordHash|csrfToken|labaccess.sid|sessions/,
  );
  await decide(first.id).expect(200);
  assert.equal(
    (await reviewer.agent.get("/api/review/requests").expect(200)).body
      .pagination.total,
    1,
  );
  assert.equal(
    (await reviewer.agent.get("/api/review/requests?status=all").expect(200))
      .body.pagination.total,
    2,
  );
  await reviewer.agent.get(`/api/requests/${first.id}`).expect(200);
});
test("invalid IDs, bodies, lengths, revision and query fields fail without writes", async () => {
  const item = await created();
  const before = await saved(item.id);
  await learner.agent.get("/api/requests/not-an-id").expect(400);
  await learner.agent.get("/api/requests/000000000000000000000001").expect(404);
  await post(learner, "/requests", {
    resourceId: String(resources[1]._id),
    reason,
    learnerId: other.user.id,
  }).expect(400);
  await post(learner, "/requests", {
    resourceId: String(resources[1]._id),
    reason,
    status: "approved",
    history: [],
  }).expect(400);
  await submit(learner, resources[1], " ".repeat(30)).expect(400);
  await submit(learner, resources[1], "x".repeat(1001)).expect(400);
  await cancel(item.id, -1).expect(400);
  await cancel(item.id, "0").expect(400);
  await post(learner, `/requests/${item.id}/cancel`, {}).expect(400);
  await post(reviewer, `/review/requests/${item.id}/decision`, {
    revision: 0,
    status: "pending",
    reason: decisionReason,
  }).expect(400);
  await post(reviewer, `/review/requests/${item.id}/decision`, {
    revision: 0,
    status: "approved",
    reason: "short",
  }).expect(400);
  await learner.agent.get("/api/requests/mine?status=unknown").expect(400);
  await learner.agent.get("/api/requests/mine?page=1&page=2").expect(400);
  await learner.agent.get("/api/requests/mine?page=1.5").expect(400);
  await reviewer.agent
    .get("/api/review/requests?learnerId=someone")
    .expect(400);
  await learner.agent
    .get(`/api/requests/${item.id}?include=passwordHash`)
    .expect(400);
  assert.deepEqual(await saved(item.id), before);
  assert.equal(await documents().countDocuments(), 1);
});
test("Unicode reason bounds count code points rather than UTF-16 units", async () => {
  await submit(learner, resources[0], "😀".repeat(19)).expect(400);
  const item = (
    await submit(learner, resources[0], "😀".repeat(1000)).expect(201)
  ).body.data;
  await post(reviewer, `/review/requests/${item.id}/decision`, {
    revision: 0,
    status: "approved",
    reason: "😀".repeat(500),
  }).expect(200);
  assert.equal((await saved(item.id)).history.length, 2);
});
