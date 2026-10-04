import { Router } from 'express';
import CareerField from '../models/CareerField.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const documents = await CareerField.find({ active: true })
      .select('slug name description category tag icon color estimatedWeeks phases')
      .sort({ category: 1, name: 1 })
      .lean();
    const careers = documents.map((career) => ({
      ...career,
      lessonCount: career.phases.reduce((total, phase) => total + phase.resources.length, 0),
    }));
    return res.json({ careers });
  } catch (error) { return next(error); }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const career = await CareerField.findOne({ slug: req.params.slug, active: true }).lean();
    if (!career) return res.status(404).json({ message: 'That learning path could not be found.' });
    return res.json({ career });
  } catch (error) { return next(error); }
});

export default router;
