import { mongo } from "mongoose";

function integer(value, fallback, min, max, name) {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}.`);
  }
  return parsed;
}

export function readConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV ?? "development";
  if (!["development", "test", "production"].includes(nodeEnv)) {
    throw new Error("NODE_ENV must be development, test, or production.");
  }
  if (![undefined, "", "false", "loopback", "render"].includes(env.TRUST_PROXY)) {
    throw new Error("TRUST_PROXY must be false, loopback, or render.");
  }
  if (env.TRUST_PROXY === "render" && env.RENDER !== "true")
    throw new Error("TRUST_PROXY=render requires Render's RENDER=true environment.");
  const host =
    env.HOST ?? (env.RENDER === "true" ? "0.0.0.0" : "127.0.0.1");
  if (!["127.0.0.1", "0.0.0.0"].includes(host))
    throw new Error("HOST must be 127.0.0.1 or 0.0.0.0.");
  let appOrigin;
  try {
    const url = new URL(env.APP_ORIGIN ?? "http://127.0.0.1:5173");
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      throw new Error();
    if (nodeEnv === "production" && url.protocol !== "https:")
      throw new Error();
    appOrigin = url.origin;
  } catch {
    throw new Error("APP_ORIGIN must be an origin URL (HTTPS in production).");
  }
  // Production safeguard: reject URIs that omit an explicit database name.
  // A URI like mongodb+srv://host/?appName=X has pathname "/" → slice(1) = "",
  // which silently uses the MongoDB default database instead of the intended one.
  const rawUri = env.MONGODB_URI;
  if (rawUri && nodeEnv === "production") {
    let dbName;
    try {
      // Use the driver's parser: WHATWG URL rejects valid multi-host URIs.
      // Constructing a client parses configuration without opening a connection.
      const client = new mongo.MongoClient(rawUri);
      const explicitPath = rawUri.match(
        /^mongodb(?:\+srv)?:\/\/[^/?]+\/([^?]*)/,
      )?.[1];
      dbName = explicitPath && client.options.dbName?.trim();
    } catch {
      throw new Error("MONGODB_URI is not a valid connection string.");
    }
    if (!dbName) {
      throw new Error(
        "MONGODB_URI must include an explicit database name " +
          "(e.g. /mydb before any query string). " +
          "A URI ending with '/' or '?' connects to the default database.",
      );
    }
  }
  return {
    nodeEnv,
    // Render's public ingress terminates TLS; trust only the nearest proxy hop.
    // Do not expose this listener through a bypass or an untrusted private service.
    trustProxy:
      env.TRUST_PROXY === "render"
        ? 1
        : env.TRUST_PROXY === "loopback"
          ? "loopback"
          : false,
    host,
    port: integer(env.PORT, 3001, 1, 65535, "PORT"),
    mongodbUri: env.MONGODB_URI,
    appOrigin,
    sessionSecret: env.SESSION_SECRET,
    sessionMaxAgeMs: integer(
      env.SESSION_MAX_AGE_MS,
      28800000,
      60000,
      604800000,
      "SESSION_MAX_AGE_MS",
    ),
    dbConnectTimeoutMs: integer(
      env.DB_CONNECT_TIMEOUT_MS,
      5000,
      100,
      30000,
      "DB_CONNECT_TIMEOUT_MS",
    ),
  };
}
