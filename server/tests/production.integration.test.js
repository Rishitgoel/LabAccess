import test from "node:test";
import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join, resolve, sep } from "node:path";
import request from "supertest";

// Use a real hidden checkout path: an absolute sendFile path otherwise rejects
// the hidden ancestor even though index.html itself is a public build artifact.
test("built SPA deep links work beneath a hidden checkout and API 404 stays JSON", async () => {
  const scratchRoot = fileURLToPath(new URL("../../.local/", import.meta.url));
  await mkdir(scratchRoot, { recursive: true });
  const checkout = await mkdtemp(join(scratchRoot, "production-spa-"));
  try {
    await cp(
      fileURLToPath(new URL("../src/", import.meta.url)),
      join(checkout, "server/src"),
      { recursive: true },
    );
    const dist = join(checkout, "client/dist");
    await mkdir(join(dist, "assets"), { recursive: true });
    const html =
      '<!doctype html><div id="root">Synthetic built-client fixture</div>';
    await writeFile(join(dist, "index.html"), html);
    await writeFile(
      join(dist, "assets/fixture.js"),
      "console.log('synthetic asset');",
    );
    const { createApp } = await import(
      pathToFileURL(join(checkout, "server/src/app.js"))
    );
    const app = createApp({ production: true, isDatabaseReady: () => false });
    for (const path of [
      "/",
      "/login",
      "/requests/example",
      "/review?status=pending",
    ])
      assert.equal((await request(app).get(path).expect(200)).text, html);
    await request(app).get("/assets/fixture.js").expect(200);
    const api = await request(app).get("/api/unknown").expect(404);
    assert.equal(api.body.error.code, "NOT_FOUND");
  } finally {
    const target = resolve(checkout);
    if (!target.startsWith(resolve(scratchRoot) + sep))
      throw new Error("Unsafe fixture cleanup path.");
    await rm(target, { recursive: true, force: true });
  }
});
