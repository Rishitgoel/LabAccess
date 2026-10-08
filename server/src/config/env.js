function integer(value, fallback, min, max, name) {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}.`);
  }
  return parsed;
}

export function readConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV ?? 'development';
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be development, test, or production.');
  }
  return {
    nodeEnv,
    port: integer(env.PORT, 3001, 1, 65535, 'PORT'),
    mongodbUri: env.MONGODB_URI,
    dbConnectTimeoutMs: integer(env.DB_CONNECT_TIMEOUT_MS, 5000, 100, 30000, 'DB_CONNECT_TIMEOUT_MS'),
  };
}
