import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import PaymentRecord from '../models/PaymentRecord.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('mentor'));

async function getOwnedStudent(studentId, mentorId) {
  if (!mongoose.isValidObjectId(studentId)) return null;
  return User.findOne({ _id: studentId, role: 'student', createdBy: mentorId, active: true }).select('name email createdAt');
}

function paymentPayload(body) {
  const amount = Number(body.amount);
  const currency = String(body.currency || '').trim().toUpperCase();
  const method = String(body.method || '').trim();
  const paidAt = new Date(body.paidAt);
  if (!Number.isFinite(amount) || amount < 0 || amount > 1000000000) return { error: 'Enter a valid payment amount.' };
  if (!/^[A-Z]{3}$/.test(currency)) return { error: 'Enter a three-letter currency code (for example, PKR or USD).' };
  if (!method || method.length > 50) return { error: 'Enter a payment method.' };
  if (Number.isNaN(paidAt.getTime())) return { error: 'Enter a valid payment date.' };
  const notes = String(body.notes || '').trim();
  const reference = String(body.reference || '').trim();
  if (notes.length > 500 || reference.length > 100) return { error: 'The reference or notes are too long.' };
  return { value: { amount, currency, method, paidAt, notes, reference } };
}

router.get('/students', async (req, res, next) => {
  try {
    const students = await User.find({ role: 'student', createdBy: req.user.sub }).select('name email active createdAt').sort({ name: 1 }).lean();
    const ids = students.map((student) => student._id);
    const [subscriptions, payments] = await Promise.all([
      Subscription.find({ student: { $in: ids } }).sort({ startDate: -1 }).lean(),
      PaymentRecord.find({ student: { $in: ids } }).sort({ paidAt: -1 }).lean(),
    ]);
    const byStudent = (rows) => rows.reduce((result, row) => {
      const key = String(row.student);
      (result[key] ||= []).push(row);
      return result;
    }, {});
    const subscriptionMap = byStudent(subscriptions);
    const paymentMap = byStudent(payments);
    const now = new Date();
    return res.json({ students: students.map((student) => ({
      ...student,
      subscriptions: (subscriptionMap[String(student._id)] || []).map((subscription) => ({
        ...subscription,
        status: new Date(subscription.startDate) > now ? 'scheduled' : new Date(subscription.endDate) >= now ? 'active' : 'expired',
      })),
      payments: paymentMap[String(student._id)] || [],
    })) });
  } catch (error) { return next(error); }
});

router.post('/students', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    if (name.length < 2 || name.length > 100) return res.status(400).json({ message: 'Enter a name between 2 and 100 characters.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Enter a valid student email address.' });
    const temporaryPassword = randomBytes(12).toString('base64url');
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);
    const student = await User.create({ name, email, passwordHash, role: 'student', createdBy: req.user.sub, mustChangePassword: true });
    return res.status(201).json({ student: { id: student.id, name: student.name, email: student.email }, temporaryPassword });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'An account with that email address already exists.' });
    return next(error);
  }
});

router.post('/students/:studentId/payments', async (req, res, next) => {
  try {
    const student = await getOwnedStudent(req.params.studentId, req.user.sub);
    if (!student) return res.status(404).json({ message: 'Student not found in your roster.' });
    const { error, value } = paymentPayload(req.body);
    if (error) return res.status(400).json({ message: error });
    const payment = await PaymentRecord.create({ ...value, student: student.id, enteredBy: req.user.sub });
    return res.status(201).json({ payment });
  } catch (error) { return next(error); }
});

router.put('/students/:studentId/payments/:paymentId', async (req, res, next) => {
  try {
    const student = await getOwnedStudent(req.params.studentId, req.user.sub);
    if (!student) return res.status(404).json({ message: 'Student not found in your roster.' });
    if (!mongoose.isValidObjectId(req.params.paymentId)) return res.status(400).json({ message: 'Invalid payment record ID.' });
    const { error, value } = paymentPayload(req.body);
    if (error) return res.status(400).json({ message: error });
    const payment = await PaymentRecord.findOneAndUpdate({ _id: req.params.paymentId, student: student.id, enteredBy: req.user.sub }, value, { new: true, runValidators: true });
    if (!payment) return res.status(404).json({ message: 'Payment record not found.' });
    return res.json({ payment });
  } catch (error) { return next(error); }
});

router.post('/students/:studentId/subscriptions/renew', async (req, res, next) => {
  try {
    const student = await getOwnedStudent(req.params.studentId, req.user.sub);
    if (!student) return res.status(404).json({ message: 'Student not found in your roster.' });
    const planName = String(req.body.planName || '').trim();
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);
    if (!planName || planName.length > 80) return res.status(400).json({ message: 'Enter a subscription plan name.' });
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
      return res.status(400).json({ message: 'Enter valid subscription dates with an end date after the start date.' });
    }
    const now = new Date();
    const status = startDate > now ? 'scheduled' : endDate >= now ? 'active' : 'expired';
    const subscription = await Subscription.create({ student: student.id, planName, startDate, endDate, status, enteredBy: req.user.sub });
    return res.status(201).json({ subscription });
  } catch (error) { return next(error); }
});

export default router;
