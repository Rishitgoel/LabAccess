import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:net";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../src/config/database.js";
import { readConfig } from "../src/config/env.js";
import { seedData } from "../src/scripts/seed-data.js";

test("real server startup builds workflow indexes and serves a persisted learner/reviewer API journey", async () => {
  const mongo = await MongoMemoryServer.create({
    instance: { dbName: "labaccess_test_startup" },
  });
  let child;
  try {
    const socket = createServer().listen(0, "127.0.0.1");
    await once(socket, "listening");
    const port = socket.address().port;
    await new Promise((resolve) => socket.close(resolve));
    const origin = `http://127.0.0.1:${port}`;
    const password = "Startup synthetic password!";
    const env = {
      ...process.env,
      NODE_ENV: "test",
      PORT: String(port),
      HOST: "0.0.0.0",
      APP_ORIGIN: origin,
      SESSION_SECRET: "startup-test-secret-at-least-thirty-two-characters",
      MONGODB_URI: mongo.getUri("labaccess_test_startup"),
    };
    const config = readConfig(env);
    await connectDatabase(config);
    await seedData(config, password);
    // No request model/index initialization in this process: server.js owns it.
    child = spawn(process.execPath, ["src/server.js"], {
      cwd: fileURLToPath(new URL("../", import.meta.url)),
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    await new Promise((resolve, reject) => {
      let output = "";
      const timeout = setTimeout(
        () => reject(new Error("Server startup timed out.")),
        15000,
      );
      child.stdout.on("data", (chunk) => {
        output += chunk;
        if (output.includes("LabAccess API listening")) {
          clearTimeout(timeout);
          assert.match(output, /listening on http:\/\/0\.0\.0\.0:/);
          resolve();
        }
      });
      child.once("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      child.once("exit", () => {
        clearTimeout(timeout);
        reject(new Error("Server exited before becoming ready."));
      });
    });
    const health = await fetch(`${origin}/api/health`);
    assert.equal(health.status, 200);
    const indexes = await mongoose.connection.db
      .collection("accessrequests")
      .indexes();
    assert.ok(
      indexes.some(
        (index) =>
          index.unique &&
          index.key.learnerId === 1 &&
          index.key.resourceId === 1,
      ),
    );

    async function signIn(email) {
      let cookie, csrf;
      async function call(path, body) {
        const response = await fetch(`${origin}/api${path}`, {
          method: body ? "POST" : "GET",
          headers: {
            ...(cookie && { Cookie: cookie }),
            ...(body && {
              Origin: origin,
              "Content-Type": "application/json",
              "X-CSRF-Token": csrf,
            }),
          },
          ...(body && { body: JSON.stringify(body) }),
        });
        const setCookie = response.headers.getSetCookie()[0];
        if (setCookie) cookie = setCookie.split(";")[0];
        return { status: response.status, ...(await response.json()) };
      }
      csrf = (await call("/auth/csrf")).data.csrfToken;
      assert.equal(
        (await call("/auth/login", { email, password })).status,
        200,
      );
      csrf = (await call("/auth/csrf")).data.csrfToken;
      return call;
    }
    const learner = await signIn("learner@labaccess.test");
    const reviewer = await signIn("reviewer@labaccess.test");
    const resource = (await learner("/resources")).data[0];
    const created = await learner("/requests", {
      resourceId: resource.id,
      reason: "A genuine local API smoke test learning request.",
    });
    assert.equal(created.status, 201);
    assert.equal(
      (await reviewer("/review/requests")).data[0].id,
      created.data.id,
    );
    const approved = await reviewer(
      `/review/requests/${created.data.id}/decision`,
      {
        status: "approved",
        revision: 0,
        reason: "Approved for the local API smoke test.",
      },
    );
    assert.equal(approved.status, 200);
    const detail = await learner(`/requests/${created.data.id}`);
    assert.equal(detail.data.status, "approved");
    assert.equal(detail.data.history.length, 2);
    assert.equal(detail.data.revision, 1);
    assert.equal(
      await mongoose.connection.db
        .collection("accessrequests")
        .countDocuments(),
      1,
    );
  } finally {
    if (child && child.exitCode === null) {
      const exited = once(child, "exit");
      child.kill();
      await exited;
    }
    await disconnectDatabase();
    await mongo.stop();
  }
});
