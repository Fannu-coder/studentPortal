import { Router } from 'express';
import CareerField from '../models/CareerField.js';
import Project from '../models/Project.js';
import Competition from '../models/Competition.js';
import Enrollment from '../models/Enrollment.js';
import PaymentRecord from '../models/PaymentRecord.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import ContactMessage from '../models/ContactMessage.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.get('/', async (_req, res, next) => {
  try {
    const [mentors, students, careers, projects, competitions, pendingEnrollments, pendingContactMessages, payments, subscriptions, recentRequests] = await Promise.all([
      User.countDocuments({ role: 'mentor', active: true }),
      User.countDocuments({ role: 'student', active: true }),
      CareerField.countDocuments({ active: true }),
      Project.countDocuments({ active: true }),
      Competition.countDocuments({ active: true }),
      Enrollment.countDocuments({ status: 'pending' }),
      ContactMessage.countDocuments({ status: 'open' }),
      PaymentRecord.countDocuments(),
      Subscription.countDocuments(),
      Enrollment.find({ status: 'pending' }).populate('student', 'name email').sort({ createdAt: -1 }).limit(5).lean(),
    ]);
    return res.json({ stats: { mentors, students, careers, projects, competitions, pendingEnrollments, pendingContactMessages, payments, subscriptions }, recentRequests });
  } catch (error) { return next(error); }
});

export default router;
