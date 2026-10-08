import { createApp } from './app.js';
import { readConfig } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

async function start() {
  const config = readConfig();
  const app = createApp({ production: config.nodeEnv === 'production' });
  try {
    await connectDatabase(config);
    console.log('Database connected.');
  } catch (error) {
    console.error(error.message);
    console.error('API will report 503 readiness until the database is connected.');
  }
  const listener = app.listen(config.port, '127.0.0.1', () => console.log(`LabAccess API listening on http://127.0.0.1:${config.port}`));
  listener.on('error', async () => {
    console.error('API listener failed. Check PORT and whether another process is using it.');
    await disconnectDatabase();
    process.exitCode = 1;
  });
  async function stop() {
    listener.close();
    await disconnectDatabase();
  }
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
}

start().catch(() => {
  console.error('Startup failed. Check environment configuration and client build.');
  process.exitCode = 1;
});
