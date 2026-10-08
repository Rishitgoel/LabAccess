import mongoose from 'mongoose';

mongoose.set('bufferCommands', false);

export async function connectDatabase(config) {
  if (!config.mongodbUri) throw new Error('MONGODB_URI is required. Copy .env.example to .env and configure MongoDB.');
  try {
    await mongoose.connect(config.mongodbUri, { serverSelectionTimeoutMS: config.dbConnectTimeoutMs });
  } catch {
    throw new Error('Database connection failed. Check MongoDB availability and MONGODB_URI.');
  }
}

export function databaseReady() {
  return mongoose.connection.readyState === 1;
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
