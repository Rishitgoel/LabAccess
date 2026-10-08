import { User } from "../modules/auth/user.model.js";
import { Resource } from "../modules/resources/resource.model.js";
import {
  hashPassword,
  validateCredentials,
} from "../modules/auth/auth.service.js";
export const demoAccounts = [
  { name: "Demo Learner", email: "learner@labaccess.test", role: "learner" },
  { name: "Second Learner", email: "learner2@labaccess.test", role: "learner" },
  { name: "Demo Reviewer", email: "reviewer@labaccess.test", role: "reviewer" },
];
const resources = [
  [
    "mern",
    "MERN Practice Lab",
    "Development",
    "Build full-stack projects in a guided sandbox.",
    "Available to all learners",
  ],
  [
    "react",
    "React Component Library",
    "Development",
    "Reusable components for your next project.",
    "Basic React knowledge recommended",
  ],
  [
    "mongo",
    "MongoDB Learning Cluster",
    "Data",
    "Practice queries with sample datasets.",
    "Available to all learners",
  ],
  [
    "design",
    "UI Design Kit",
    "Design",
    "Templates for accessible interfaces.",
    "Available to all learners",
  ],
  [
    "api",
    "API Testing Workspace",
    "Development",
    "Test and document REST endpoints.",
    "Basic HTTP knowledge recommended",
  ],
  [
    "data",
    "Data Analysis Sandbox",
    "Data",
    "Explore curated datasets.",
    "Available to all learners",
  ],
];
export function validateSeed(config, password) {
  if (config.nodeEnv === "production")
    throw new Error("Seed is forbidden in production.");
  let database;
  try {
    database = new URL(config.mongodbUri).pathname.slice(1);
  } catch {
    throw new Error("Set MONGODB_URI to a dedicated demo database.");
  }
  if (!/^labaccess_(dev|test(?:_[a-zA-Z0-9_]+)?)$/.test(database))
    throw new Error(
      "Seed requires a database named labaccess_dev or labaccess_test[_suffix]. No changes were made.",
    );
  if (!password)
    throw new Error(
      "SEED_DEMO_PASSWORD is required. Use a synthetic 12–128 character password.",
    );
  validateCredentials({ email: demoAccounts[0].email, password });
}
export async function seedData(config, password) {
  validateSeed(config, password);
  await Promise.all([User.createIndexes(), Resource.createIndexes()]);
  const passwordHash = await hashPassword(password);
  const insertedAt = new Date();
  for (const account of demoAccounts)
    await User.updateOne(
      { email: account.email },
      {
        $setOnInsert: {
          ...account,
          passwordHash,
          createdAt: insertedAt,
          updatedAt: insertedAt,
        },
      },
      { upsert: true, timestamps: false },
    );
  for (const [slug, name, category, description, eligibility] of resources)
    await Resource.updateOne(
      { slug },
      {
        $setOnInsert: {
          slug,
          name,
          category,
          description,
          eligibility,
          isActive: true,
          createdAt: insertedAt,
          updatedAt: insertedAt,
        },
      },
      { upsert: true, timestamps: false },
    );
}
