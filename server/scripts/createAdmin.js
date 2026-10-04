import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';

const { MONGODB_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

if (!MONGODB_URI) throw new Error('MONGODB_URI is required.');
if (!ADMIN_NAME?.trim() || !ADMIN_EMAIL?.trim() || !ADMIN_PASSWORD) {
  throw new Error('Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD in your private .env file before creating the admin account.');
}
if (ADMIN_PASSWORD.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters long.');

try {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const email = ADMIN_EMAIL.trim().toLowerCase();
  if (await User.exists({ email })) throw new Error(`An account already exists for ${email}. No changes were made.`);
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const admin = await User.create({ name: ADMIN_NAME.trim(), email, passwordHash, role: 'admin', active: true, mustChangePassword: false });
  console.log(`Created active admin account ${admin.email}. The password was read from .env and was not printed.`);
} finally {
  await mongoose.disconnect();
}
