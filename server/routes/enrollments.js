import { Router } from 'express';
import mongoose from 'mongoose';
import Enrollment from '../models/Enrollment.js';
import Project from '../models/Project.js';
import Competition from '../models/Competition.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/mine', requireRole('student'), async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user.sub }).sort({ createdAt: -1 }).lean();
    return res.json({ enrollments });
  } catch (error) { return next(error); }
});

router.post('/', requireRole('student'), async (req, res, next) => {
  try {
    const { targetType, targetId } = req.body;
    const motivation = String(req.body.motivation || '').trim();
    const skills = String(req.body.skills || '').trim();
    const contactEmail = String(req.body.contactEmail || '').trim().toLowerCase();
    if (!['project', 'competition'].includes(targetType)) return res.status(400).json({ message: 'Choose a valid project or competition.' });
    if (!mongoose.isValidObjectId(targetId)) return res.status(400).json({ message: 'That opportunity could not be found.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) return res.status(400).json({ message: 'Enter a valid contact email.' });
    if (motivation.length < 20 || motivation.length > 1200) return res.status(400).json({ message: 'Tell us a little more about why you want to join (20–1200 characters).' });
    if (skills.length > 500) return res.status(400).json({ message: 'Keep your skills list under 500 characters.' });

    const Model = targetType === 'project' ? Project : Competition;
    const target = await Model.findOne({ _id: targetId, active: true }).select('title deadline').lean();
    if (!target) return res.status(404).json({ message: 'This opportunity is no longer open for enrollment.' });
    if (targetType === 'competition' && target.deadline && target.deadline < new Date()) {
      return res.status(400).json({ message: 'The registration deadline for this competition has passed.' });
    }
    const enrollment = await Enrollment.create({ student: req.user.sub, targetType, target: target._id, targetTitle: target.title, contactEmail, skills, motivation });
    return res.status(201).json({ enrollment });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'You have already sent an enrollment request for this opportunity.' });
    return next(error);
  }
});

export default router;
