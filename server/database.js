import mongoose from 'mongoose';
import RateLimitCounter from './models/RateLimitCounter.js';

let connectionPromise;

export function validateRuntimeConfig() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing. Configure the database connection.');
  const jwtSecret = process.env.JWT_SECRET?.trim();
  if (!jwtSecret || jwtSecret.length < 32 || jwtSecret === 'replace-this-with-a-long-random-secret') {
    throw new Error('JWT_SECRET must be a private random value with at least 32 characters.');
  }
}

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing. Configure the database connection.');
  if (mongoose.connection.readyState === 0) connectionPromise = undefined;
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 5,
      minPoolSize: 0,
      maxIdleTimeMS: 30000,
    }).then(async () => {
      await RateLimitCounter.init();
      return mongoose.connection;
    }).catch((error) => {
      connectionPromise = undefined;
      throw error;
    });
  }
  return connectionPromise;
}
