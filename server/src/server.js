import { createApp } from "./app.js";
import { readConfig } from "./config/env.js";
import {
  connectDatabase,
  disconnectDatabase,
  databaseReady,
} from "./config/database.js";
import { User } from "./modules/auth/user.model.js";
import { Resource } from "./modules/resources/resource.model.js";
import { AccessRequest } from "./modules/requests/request.model.js";

async function start() {
  let config;
  try {
    config = readConfig();
    if (!config.sessionSecret || config.sessionSecret.length < 32)
      throw new Error("SESSION_SECRET must contain at least 32 characters.");
  } catch (error) {
    // Config validators use fixed messages, never supplied values or credentials.
    console.error(`Configuration error: ${error.message}`);
    throw error;
  }
  let connected = false;
  try {
    await connectDatabase(config);
    await Promise.all([
      User.createIndexes(),
      Resource.createIndexes(),
      AccessRequest.createIndexes(),
    ]);
    connected = true;
    console.log("Database connected.");
  } catch (error) {
    console.error(error.message);
    console.error(
      "API will report 503 readiness until the database is connected.",
    );
  }
  const app = createApp({
    production:
      config.nodeEnv === "production" ||
      process.argv.includes("--serve-client"),
    config,
    isDatabaseReady: () => connected && databaseReady(),
  });
  const listener = app.listen(config.port, config.host, () =>
    console.log(`LabAccess API listening on http://${config.host}:${config.port}`),
  );
  listener.on("error", async () => {
    console.error(
      "API listener failed. Check PORT and whether another process is using it.",
    );
    await disconnectDatabase();
    process.exitCode = 1;
  });
  async function stop() {
    listener.close();
    await app.locals.sessionStore?.close();
    await disconnectDatabase();
  }
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
}

start().catch(() => {
  console.error(
    "Startup failed. Check environment configuration and client build.",
  );
  process.exitCode = 1;
});
