import { readConfig } from '../config/env.js';

try {
  const config = readConfig();
  if (config.nodeEnv === 'production') throw new Error('Seed is forbidden in production.');
  throw new Error('Seed data is not implemented yet. Phase 2 will add guarded, repeatable synthetic accounts and resources. No database changes were made.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
