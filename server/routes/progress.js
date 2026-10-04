import { Router } from 'express';
import mongoose from 'mongoose';
import CareerField from '../models/CareerField.js';
import LearningProgress from '../models/LearningProgress.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('student'));

router.get('/mine', async (req, res, next) => {
  try {
    const [careers, progressRows] = await Promise.all([
      CareerField.find({ active: true }).select('slug name description color estimatedWeeks phases').sort({ name: 1 }).lean(),
      LearningProgress.find({ student: req.user.sub }).select('career completedResources updatedAt').lean(),
    ]);
    const progressByCareer = new Map(progressRows.map((row) => [String(row.career), row]));
    const learningPaths = careers.map((career) => {
      const saved = progressByCareer.get(String(career._id));
      const totalLessons = career.phases.reduce((total, phase) => total + phase.resources.length, 0);
      const completedLessons = (saved?.completedResources || []).filter((resourceId) => career.phases.some((phase) => phase.resources.some((resource) => String(resource._id) === String(resourceId)))).length;
      return { slug: career.slug, name: career.name, description: career.description, color: career.color, estimatedWeeks: career.estimatedWeeks, totalLessons, completedLessons, updatedAt: saved?.updatedAt || null };
    });
    return res.json({ learningPaths });
  } catch (error) { return next(error); }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const career = await CareerField.findOne({ slug: req.params.slug, active: true }).select('_id').lean();
    if (!career) return res.status(404).json({ message: 'That learning path could not be found.' });
    const progress = await LearningProgress.findOne({ student: req.user.sub, career: career._id }).select('completedResources').lean();
    return res.json({ completedResources: (progress?.completedResources || []).map(String) });
  } catch (error) { return next(error); }
});

router.put('/:slug/:resourceId', async (req, res, next) => {
  try {
    const { slug, resourceId } = req.params;
    if (!mongoose.isValidObjectId(resourceId) || typeof req.body.completed !== 'boolean') {
      return res.status(400).json({ message: 'A valid resource and completion status are required.' });
    }
    const career = await CareerField.findOne({ slug, active: true }).select('phases.resources._id').lean();
    if (!career) return res.status(404).json({ message: 'That learning path could not be found.' });
    const resourceExists = career.phases.some((phase) => phase.resources.some((resource) => String(resource._id) === resourceId));
    if (!resourceExists) return res.status(404).json({ message: 'That lesson could not be found in this learning path.' });
    const update = req.body.completed
      ? { $addToSet: { completedResources: resourceId } }
      : { $pull: { completedResources: resourceId } };
    const progress = await LearningProgress.findOneAndUpdate(
      { student: req.user.sub, career: career._id },
      { ...update, $setOnInsert: { student: req.user.sub, career: career._id } },
      { new: true, upsert: true, runValidators: true },
    ).select('completedResources').lean();
    return res.json({ completedResources: progress.completedResources.map(String) });
  } catch (error) { return next(error); }
});

export default router;
