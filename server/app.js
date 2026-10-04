import 'dotenv/config';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { connectDatabase, validateRuntimeConfig } from './database.js';
import authRoutes from './routes/auth.js';
import careerRoutes from './routes/careers.js';
import adminCareerRoutes from './routes/adminCareers.js';
import opportunityRoutes from './routes/opportunities.js';
import enrollmentRoutes from './routes/enrollments.js';
import adminEnrollmentRoutes from './routes/adminEnrollments.js';
import mentorRoutes from './routes/mentor.js';
import adminMentorRecordRoutes from './routes/adminMentorRecords.js';
import adminOpportunityRoutes from './routes/adminOpportunities.js';
import adminMentorRoutes from './routes/adminMentors.js';
import adminDashboardRoutes from './routes/adminDashboard.js';
import progressRoutes from './routes/progress.js';
import adminStudentRoutes from './routes/adminStudents.js';
import contactRoutes from './routes/contact.js';
import adminContactRoutes from './routes/adminContact.js';

const app = express();
const currentDirectory = dirname(fileURLToPath(import.meta.url));
const publicDirectory = resolve(currentDirectory, '../public');
const trustProxyHops = Number.parseInt(process.env.TRUST_PROXY_HOPS || '0', 10);

if (Number.isInteger(trustProxyHops) && trustProxyHops > 0) app.set('trust proxy', trustProxyHops);
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
// Serve the Vite output without requiring a database connection for static assets.
app.use(express.static(publicDirectory));
app.use(async (_req, _res, next) => {
  try { validateRuntimeConfig(); await connectDatabase(); return next(); }
  catch (error) { return next(error); }
});
app.get('/api/health', (_req, res) => res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));
app.use('/api/auth', authRoutes);
app.use('/api/careers', careerRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin/careers', adminCareerRoutes);
app.use('/api', opportunityRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/admin/enrollments', adminEnrollmentRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/admin/mentor-records', adminMentorRecordRoutes);
app.use('/api/admin/opportunities', adminOpportunityRoutes);
app.use('/api/admin/mentors', adminMentorRoutes);
app.use('/api/admin/students', adminStudentRoutes);
app.use('/api/admin/contact', adminContactRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api', (_req, res) => res.status(404).json({ message: 'API route not found.' }));
app.get('*', (_req, res, next) => res.sendFile(resolve(publicDirectory, 'index.html'), (error) => error && next(error)));
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

export default app;
