import { readConfig } from "../config/env.js";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { seedData, validateSeed } from "./seed-data.js";

try {
  const config = readConfig();
  validateSeed(config, process.env.SEED_DEMO_PASSWORD);
  await connectDatabase(config);
  await seedData(config, process.env.SEED_DEMO_PASSWORD);
  console.log(
    "Synthetic seed complete: six resources and three demo accounts. Existing records were preserved.",
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
