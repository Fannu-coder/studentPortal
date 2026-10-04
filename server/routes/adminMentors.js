import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

const validName = (name) => typeof name === 'string' && name.trim().length >= 2 && name.trim().length <= 100;
const validEmail = (email) => typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

router.get('/', async (_req, res, next) => {
  try {
    const mentors = await User.find({ role: 'mentor' }).select('name email active createdAt updatedAt').sort({ name: 1 }).lean();
    const counts = await User.aggregate([
      { $match: { role: 'student', createdBy: { $in: mentors.map((mentor) => mentor._id) } } },
      { $group: { _id: '$createdBy', count: { $sum: 1 } } },
    ]);
    const countById = new Map(counts.map((row) => [String(row._id), row.count]));
    return res.json({ mentors: mentors.map((mentor) => ({ ...mentor, studentCount: countById.get(String(mentor._id)) || 0 })) });
  } catch (error) { return next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!validName(name)) return res.status(400).json({ message: 'Enter a name between 2 and 100 characters.' });
    if (!validEmail(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
    const temporaryPassword = randomBytes(12).toString('base64url');
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);
    const mentor = await User.create({ name, email, passwordHash, role: 'mentor', active: true, createdBy: req.user.sub, mustChangePassword: true });
    return res.status(201).json({ mentor: { id: mentor.id, name: mentor.name, email: mentor.email, active: mentor.active }, temporaryPassword });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'An account with that email address already exists.' });
    return next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid mentor ID.' });
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!validName(name)) return res.status(400).json({ message: 'Enter a name between 2 and 100 characters.' });
    if (!validEmail(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
    const mentor = await User.findOneAndUpdate({ _id: req.params.id, role: 'mentor' }, { name, email }, { new: true, runValidators: true }).select('name email active createdAt updatedAt');
    if (!mentor) return res.status(404).json({ message: 'Mentor not found.' });
    return res.json({ mentor });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'An account with that email address already exists.' });
    return next(error);
  }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid mentor ID.' });
    if (typeof req.body.active !== 'boolean') return res.status(400).json({ message: 'Choose whether the mentor account should be active.' });
    if (String(req.params.id) === req.user.sub && req.body.active === false) return res.status(400).json({ message: 'You cannot deactivate your own admin account here.' });
    const mentor = await User.findOneAndUpdate({ _id: req.params.id, role: 'mentor' }, { active: req.body.active }, { new: true }).select('name email active');
    if (!mentor) return res.status(404).json({ message: 'Mentor not found.' });
    return res.json({ mentor });
  } catch (error) { return next(error); }
});

export default router;
