import { Router } from 'express';
import Project from '../models/Project.js';
import Competition from '../models/Competition.js';

const router = Router();

router.get('/projects', async (req, res, next) => {
  try {
    const query = { active: true };
    if (req.query.category) query.category = String(req.query.category).trim();
    const projects = await Project.find(query).sort({ category: 1, title: 1 }).lean();
    return res.json({ projects });
  } catch (error) { return next(error); }
});

router.get('/competitions', async (_req, res, next) => {
  try {
    const competitions = await Competition.find({ active: true }).sort({ deadline: 1, title: 1 }).lean();
    return res.json({ competitions });
  } catch (error) { return next(error); }
});

export default router;
