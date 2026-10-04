import { Router } from 'express';
import mongoose from 'mongoose';
import Enrollment from '../models/Enrollment.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (['pending', 'selected', 'declined'].includes(req.query.status)) filter.status = req.query.status;
    if (['project', 'competition'].includes(req.query.targetType)) filter.targetType = req.query.targetType;
    const enrollments = await Enrollment.find(filter)
      .populate('student', 'name email')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ enrollments });
  } catch (error) { return next(error); }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid enrollment ID.' });
    if (!['selected', 'declined'].includes(req.body.status)) return res.status(400).json({ message: 'Choose select or decline for this applicant.' });
    const enrollment = await Enrollment.findByIdAndUpdate(req.params.id, {
      status: req.body.status,
      reviewedBy: req.user.sub,
      reviewedAt: new Date(),
    }, { new: true }).populate('student', 'name email').populate('reviewedBy', 'name').lean();
    if (!enrollment) return res.status(404).json({ message: 'That enrollment request could not be found.' });
    return res.json({ enrollment });
  } catch (error) { return next(error); }
});

export default router;
