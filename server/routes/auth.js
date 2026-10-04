import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { loginRateLimit } from '../middleware/rateLimit.js';

const router = Router();

router.post('/login', loginRateLimit, async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(503).json({ message: 'Sign-in is not configured yet. Set JWT_SECRET on the server.' });
    }
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const role = String(req.body.role || 'student');
    if (!email || !password || !['student', 'mentor', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Enter your email and password, then choose a portal.' });
    }
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !user.active || user.role !== role || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Those sign-in details do not match an active account.' });
    }
    const token = jwt.sign({ sub: user.id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, mustChangePassword: user.mustChangePassword } });
  } catch (error) { return next(error); }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user || !user.active) return res.status(401).json({ message: 'This account is unavailable.' });
    return res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, mustChangePassword: user.mustChangePassword } });
  } catch (error) { return next(error); }
});

router.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    const currentPassword = String(req.body.currentPassword || '');
    const newPassword = String(req.body.newPassword || '');
    if (newPassword.length < 12 || newPassword.length > 128) return res.status(400).json({ message: 'Choose a new password between 12 and 128 characters.' });
    const user = await User.findById(req.user.sub).select('+passwordHash');
    if (!user || !user.active) return res.status(401).json({ message: 'This account is unavailable.' });
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) return res.status(400).json({ message: 'Your current password is incorrect.' });
    if (await bcrypt.compare(newPassword, user.passwordHash)) return res.status(400).json({ message: 'Choose a password you have not used before.' });
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.mustChangePassword = false;
    await user.save();
    return res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, mustChangePassword: false } });
  } catch (error) { return next(error); }
});

export default router;
