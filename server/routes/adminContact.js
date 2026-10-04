import { Router } from 'express';
import mongoose from 'mongoose';
import ContactMessage from '../models/ContactMessage.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.get('/', async (req, res, next) => {
  try {
    const status = ['open', 'resolved'].includes(req.query.status) ? req.query.status : 'all';
    const page = Math.max(1, Math.min(100000, Number.parseInt(req.query.page, 10) || 1));
    const pageSize = 25;
    const search = String(req.query.search || '').trim().slice(0, 100);
    const baseFilter = {};
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      baseFilter.$or = [{ name: new RegExp(escaped, 'i') }, { email: new RegExp(escaped, 'i') }, { message: new RegExp(escaped, 'i') }];
    }
    const filter = status === 'all' ? baseFilter : { ...baseFilter, status };
    const [messages, total, openCount, resolvedCount] = await Promise.all([
      ContactMessage.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
      ContactMessage.countDocuments(filter),
      ContactMessage.countDocuments({ ...baseFilter, status: 'open' }),
      ContactMessage.countDocuments({ ...baseFilter, status: 'resolved' }),
    ]);
    return res.json({ messages, pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)), openCount, resolvedCount } });
  } catch (error) { return next(error); }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid message ID.' });
    if (!['open', 'resolved'].includes(req.body.status)) return res.status(400).json({ message: 'Choose a valid message status.' });
    const message = await ContactMessage.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true }).lean();
    if (!message) return res.status(404).json({ message: 'Contact message not found.' });
    return res.json({ message });
  } catch (error) { return next(error); }
});

export default router;
