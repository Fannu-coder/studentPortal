import { Router } from 'express';
import PaymentRecord from '../models/PaymentRecord.js';
import Subscription from '../models/Subscription.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.get('/', async (_req, res, next) => {
  try {
    const [payments, subscriptions] = await Promise.all([
      PaymentRecord.find().populate('student', 'name email').populate('enteredBy', 'name').sort({ paidAt: -1 }).lean(),
      Subscription.find().populate('student', 'name email').populate('enteredBy', 'name').sort({ startDate: -1 }).lean(),
    ]);
    const now = new Date();
    const currentSubscriptions = subscriptions.map((subscription) => ({
      ...subscription,
      status: new Date(subscription.startDate) > now ? 'scheduled' : new Date(subscription.endDate) >= now ? 'active' : 'expired',
    }));
    return res.json({ payments, subscriptions: currentSubscriptions });
  } catch (error) { return next(error); }
});

export default router;
