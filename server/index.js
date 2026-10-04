import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';
import { connectDatabase, validateRuntimeConfig } from './database.js';

const port = process.env.PORT || 5000;

async function startServer() {
  try { validateRuntimeConfig(); }
  catch (error) { throw new Error(`${error.message} Update the values in .env before starting the API.`); }
  await connectDatabase();
  console.log(`MongoDB connected to database "${mongoose.connection.name}"`);
  const server = app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
  const shutdown = async () => {
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

startServer().catch((error) => {
  console.error(`API startup failed: ${error.message}`);
  process.exitCode = 1;
});
