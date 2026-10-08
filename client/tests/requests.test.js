import test from "node:test";
import assert from "node:assert/strict";
import {
  loadAllMine,
  saveAndReconcile,
} from "../src/features/requests/requests.api.js";
const fail = (status) => Object.assign(new Error("Save failed."), { status });
test("catalog status reads include every owner page beyond the first fifty records", async () => {
  const pages = [];
  const result = await loadAllMine(async (path) => {
    const page = Number(
      new URL(path, "http://test.local").searchParams.get("page"),
    );
    pages.push(page);
    return {
      data: [
        {
          id: String(page),
          resourceId: `resource-${page}`,
          status: "approved",
        },
      ],
      pagination: { totalPages: 3 },
    };
  });
  assert.deepEqual(pages, [1, 2, 3]);
  assert.equal(result[2].resourceId, "resource-3");
});
test("confirmed persistence is returned without an unnecessary reconciliation read", async () => {
  const result = await saveAndReconcile(
    async () => ({ data: { id: "saved" } }),
    () => assert.fail("Unexpected read."),
    () => false,
  );
  assert.deepEqual(result, { record: { id: "saved" }, reconciled: false });
});
test("lost save response reads saved state and never repeats the mutation", async () => {
  let writes = 0,
    reads = 0;
  const result = await saveAndReconcile(
    async () => {
      writes++;
      throw fail(0);
    },
    async () => {
      reads++;
      return { id: "saved", reason: "grounded" };
    },
    (saved) => saved.reason === "grounded",
  );
  assert.equal(writes, 1);
  assert.equal(reads, 1);
  assert.equal(result.reconciled, true);
});
test("failed reconciliation leaves a save unconfirmed rather than allowing blind retry", async () => {
  await assert.rejects(
    saveAndReconcile(
      async () => {
        throw fail(500);
      },
      async () => {
        throw fail(0);
      },
      () => true,
    ),
    (error) => error.unconfirmed === true,
  );
});
test("verified absent creation returns failure without retrying the write", async () => {
  let writes = 0;
  await assert.rejects(
    saveAndReconcile(
      async () => {
        writes++;
        throw fail(0);
      },
      async () => undefined,
      () => true,
    ),
    { status: 0 },
  );
  assert.equal(writes, 1);
});
test("a different saved transition becomes a conflict requiring deliberate review", async () => {
  await assert.rejects(
    saveAndReconcile(
      async () => {
        throw fail(0);
      },
      async () => ({ revision: 2, status: "rejected" }),
      (saved) => saved.status === "approved",
    ),
    { status: 409 },
  );
});
test("an unchanged pending request after a failed decision preserves failure for deliberate retry", async () => {
  await assert.rejects(
    saveAndReconcile(
      async () => {
        throw fail(503);
      },
      async () => ({ revision: 0, status: "pending" }),
      (saved) => saved.status === "approved",
      (saved) => saved.revision === 0 && saved.status === "pending",
    ),
    { status: 503 },
  );
});
test("known validation and conflict responses are not automatically replayed", async () => {
  await assert.rejects(
    saveAndReconcile(
      async () => {
        throw fail(409);
      },
      () => assert.fail("Unexpected read."),
      () => true,
    ),
    { status: 409 },
  );
});
test("an unreadable successful write response is reconciled using its uncertainty flag", async () => {
  const result = await saveAndReconcile(
    async () => {
      throw Object.assign(fail(200), { uncertain: true });
    },
    async () => ({ status: "approved", revision: 1 }),
    (saved) => saved.status === "approved",
  );
  assert.equal(result.record.revision, 1);
});
