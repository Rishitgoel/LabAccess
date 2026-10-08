import { MongoMemoryServer } from "mongodb-memory-server";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
// A genuine standalone mongod with persistent workspace data; development only.
if (process.env.NODE_ENV === "production")
  throw new Error("Local MongoDB helper is forbidden in production.");
const dbPath = fileURLToPath(
  new URL("../../../.local/mongodb/", import.meta.url),
);
await mkdir(dbPath, { recursive: true });
const mongo = await MongoMemoryServer.create({
  instance: {
    ip: "127.0.0.1",
    port: 27017,
    dbPath,
    dbName: "labaccess_dev",
    storageEngine: "wiredTiger",
  },
});
console.log(
  "Development MongoDB listening on 127.0.0.1:27017. Workspace data is preserved in .local/mongodb.",
);
const stop = async () => {
  await mongo.stop({ doCleanup: false });
  process.exit(0);
};
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
