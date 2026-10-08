import test from "node:test";
import assert from "node:assert/strict";
import {
  availablePage,
  readListQuery,
} from "../src/features/requests/list-query.js";
import {
  requestApi,
  matchesLearnerTransition,
  saveAndReconcile,
} from "../src/features/requests/requests.api.js";
import { api, clearCsrf } from "../src/lib/api.js";

for (const authenticated of [false, true]) {
  test(`invalid CSRF checks session without replaying a mutation (${authenticated ? "active" : "expired"})`, async () => {
    const originalFetch = globalThis.fetch,
      originalWindow = globalThis.window;
    const calls = [],
      events = [];
    clearCsrf();
    globalThis.window = { dispatchEvent: (event) => events.push(event.type) };
    globalThis.fetch = async (path, options) => {
      calls.push([path, options.method]);
      if (path === "/api/auth/csrf")
        return new Response(
          JSON.stringify({ data: { csrfToken: "synthetic-token" } }),
        );
      if (path === "/api/auth/me")
        return new Response(
          JSON.stringify(
            authenticated
              ? { data: { id: "owner" } }
              : { error: { code: "UNAUTHENTICATED" } },
          ),
          { status: authenticated ? 200 : 401 },
        );
      return new Response(JSON.stringify({ error: { code: "CSRF_INVALID" } }), {
        status: 403,
      });
    };
    try {
      await assert.rejects(
        api("/requests/example/cancel", {
          method: "POST",
          body: { revision: 0 },
        }),
        { status: 403 },
      );
      assert.deepEqual(calls, [
        ["/api/auth/csrf", "GET"],
        ["/api/requests/example/cancel", "POST"],
        ["/api/auth/me", "GET"],
      ]);
      assert.deepEqual(events, authenticated ? [] : ["session-expired"]);
    } finally {
      globalThis.fetch = originalFetch;
      globalThis.window = originalWindow;
      clearCsrf();
    }
  });
}

test("list defaults and malformed URL values preserve role defaults and safe pages", () => {
  assert.deepEqual(readListQuery(new URLSearchParams(), true), {
    page: 1,
    status: "pending",
  });
  assert.deepEqual(readListQuery(new URLSearchParams(), false), {
    page: 1,
    status: "all",
  });
  for (const value of ["0", "-1", "1.5", "Infinity", "9007199254740992"]) {
    assert.deepEqual(
      readListQuery(
        new URLSearchParams({ page: value, status: "untrusted" }),
        false,
      ),
      { page: 1, status: "all" },
    );
  }
  assert.deepEqual(
    readListQuery(new URLSearchParams("page=2&status=cancelled"), false),
    { page: 2, status: "cancelled" },
  );
});
test("an emptied last page moves to a remaining page or page one for no results", () => {
  assert.equal(availablePage(3, 2), 2);
  assert.equal(availablePage(2, 0), 1);
  assert.equal(availablePage(1, 5), 1);
});
test("filtered list API sends the selected page and status for both role routes", async () => {
  const original = globalThis.fetch,
    paths = [];
  globalThis.fetch = async (path) => {
    paths.push(path);
    return new Response(JSON.stringify({ data: [] }));
  };
  try {
    await requestApi.list(false, 2, "cancelled");
    await requestApi.list(true, 3, "all");
    await requestApi.list(true);
    assert.deepEqual(paths, [
      "/api/requests/mine?page=2&status=cancelled",
      "/api/review/requests?page=3&status=all",
      "/api/review/requests?page=1&status=pending",
    ]);
  } finally {
    globalThis.fetch = original;
  }
});
test("cancellation reconciliation needs the next revision and matching owner event", () => {
  const attempt = { action: "cancel", revision: 4 };
  const saved = {
    revision: 5,
    status: "cancelled",
    history: [{ action: "cancel", actorId: "owner" }],
  };
  assert.equal(matchesLearnerTransition(saved, attempt, "owner"), true);
  assert.equal(matchesLearnerTransition(saved, attempt, "other"), false);
  assert.equal(
    matchesLearnerTransition({ ...saved, revision: 6 }, attempt, "owner"),
    false,
  );
  assert.equal(
    matchesLearnerTransition(
      { ...saved, status: "approved" },
      attempt,
      "owner",
    ),
    false,
  );
});
test("resubmission recovery verifies updated reason, cleared decision, and retained old events", async () => {
  const attempt = {
    action: "resubmit",
    revision: 3,
    reason: "New project context",
  };
  const saved = {
    revision: 4,
    status: "pending",
    reason: attempt.reason,
    decisionReason: null,
    history: [
      { action: "reject", reason: "Old feedback" },
      { action: "resubmit", actorId: "owner", reason: attempt.reason },
    ],
  };
  let writes = 0;
  const result = await saveAndReconcile(
    async () => {
      writes++;
      throw Object.assign(new Error("Lost response"), { status: 0 });
    },
    async () => saved,
    (value) => matchesLearnerTransition(value, attempt, "owner"),
  );
  assert.equal(writes, 1);
  assert.equal(result.reconciled, true);
  assert.equal(result.record.history[0].reason, "Old feedback");
  assert.equal(
    matchesLearnerTransition(
      { ...saved, reason: "Old request" },
      attempt,
      "owner",
    ),
    false,
  );
  assert.equal(
    matchesLearnerTransition(
      { ...saved, decisionReason: "Old feedback" },
      attempt,
      "owner",
    ),
    false,
  );
});
