import { Router } from 'express';
import mongoose from 'mongoose';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.get('/', async (req, res, next) => {
  try {
    const search = String(req.query.search || '').trim().slice(0, 100);
    const filter = { role: 'student' };
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [{ name: new RegExp(escaped, 'i') }, { email: new RegExp(escaped, 'i') }];
    }
    const students = await User.find(filter).select('name email active createdAt createdBy').populate('createdBy', 'name email').sort({ createdAt: -1 }).limit(100).lean();
    return res.json({ students });
  } catch (error) { return next(error); }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid student ID.' });
    if (typeof req.body.active !== 'boolean') return res.status(400).json({ message: 'Choose whether the student account should be active.' });
    const student = await User.findOneAndUpdate({ _id: req.params.id, role: 'student' }, { active: req.body.active }, { new: true }).select('name email active');
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    return res.json({ student });
  } catch (error) { return next(error); }
});

router.post('/:id/password-reset', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid student ID.' });
    const temporaryPassword = randomBytes(12).toString('base64url');
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);
    const student = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'student' },
      { passwordHash, mustChangePassword: true },
      { new: true },
    ).select('name email');
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    return res.json({ student: { name: student.name, email: student.email }, temporaryPassword });
  } catch (error) { return next(error); }
});

export default router;
