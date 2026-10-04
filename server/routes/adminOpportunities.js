import { Router } from 'express';
import mongoose from 'mongoose';
import Project from '../models/Project.js';
import Competition from '../models/Competition.js';
import Enrollment from '../models/Enrollment.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));
const slugify = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function validateProject(body) {
  const title = String(body.title || '').trim();
  const slug = slugify(body.slug || title);
  const category = String(body.category || '').trim();
  const description = String(body.description || '').trim();
  if (!title || !category || !description) return { error: 'Title, category, and description are required.' };
  if (!slug || slug.length > 80) return { error: 'Use a title that can form a valid URL slug.' };
  if (description.length > 1200) return { error: 'Keep the description under 1,200 characters.' };
  if (category.length > 80) return { error: 'Keep the category under 80 characters.' };
  const skills = Array.isArray(body.skills) ? body.skills : [];
  const normalizedSkills = [...new Set(skills.map((skill) => String(skill).trim()).filter(Boolean))];
  if (normalizedSkills.length > 12 || normalizedSkills.some((skill) => skill.length > 40)) return { error: 'Add up to 12 skills, each under 40 characters.' };
  const opportunities = String(body.opportunities || '').trim();
  if (opportunities.length > 240) return { error: 'Keep contribution roles under 240 characters.' };
  return { value: { title, slug, category, description, skills: normalizedSkills, opportunities, active: body.active !== false } };
}

function validateCompetition(body) {
  const title = String(body.title || '').trim();
  const slug = slugify(body.slug || title);
  const description = String(body.description || '').trim();
  const eligibility = String(body.eligibility || '').trim();
  const registrationDetails = String(body.registrationDetails || '').trim();
  const deadlineInput = String(body.deadline || '').trim();
  const deadline = deadlineInput ? new Date(deadlineInput) : null;
  if (!title || !description || !eligibility) return { error: 'Title, description, and eligibility are required.' };
  if (!slug || slug.length > 80) return { error: 'Use a title that can form a valid URL slug.' };
  if (description.length > 1200 || eligibility.length > 300 || registrationDetails.length > 500) return { error: 'One or more competition fields exceed their character limit.' };
  if (deadlineInput && Number.isNaN(deadline.getTime())) return { error: 'Enter a valid registration deadline.' };
  return { value: { title, slug, description, eligibility, registrationDetails, deadline, active: body.active !== false } };
}

function routesFor(Model, type, validate) {
  const base = `/${type}`;
  router.route(base).get(async (_req, res, next) => {
    try {
      const [documents, counts] = await Promise.all([
        Model.find().sort({ updatedAt: -1, title: 1 }).lean(),
        Enrollment.aggregate([
          { $match: { targetType: type.slice(0, -1) } },
          { $group: { _id: '$target', count: { $sum: 1 } } },
        ]),
      ]);
      const countById = new Map(counts.map((entry) => [String(entry._id), entry.count]));
      const items = documents.map((item) => ({ ...item, enrollmentCount: countById.get(String(item._id)) || 0 }));
      return res.json({ items });
    }
    catch (error) { return next(error); }
  }).post(async (req, res, next) => {
    try {
      const { error, value } = validate(req.body);
      if (error) return res.status(400).json({ message: error });
      const item = await Model.create(value);
      return res.status(201).json({ item });
    } catch (error) {
      if (error.code === 11000) return res.status(409).json({ message: `A ${type.slice(0, -1)} with that URL slug already exists.` });
      if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
      return next(error);
    }
  });

  router.put(`${base}/:id`, async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: `Invalid ${type.slice(0, -1)} ID.` });
      const { error, value } = validate(req.body);
      if (error) return res.status(400).json({ message: error });
      const item = await Model.findByIdAndUpdate(req.params.id, value, { new: true, runValidators: true });
      if (!item) return res.status(404).json({ message: `${type.slice(0, -1)} not found.` });
      return res.json({ item });
    } catch (error) {
      if (error.code === 11000) return res.status(409).json({ message: `A ${type.slice(0, -1)} with that URL slug already exists.` });
      if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
      return next(error);
    }
  });

  router.patch(`${base}/:id/status`, async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: `Invalid ${type.slice(0, -1)} ID.` });
      if (typeof req.body.active !== 'boolean') return res.status(400).json({ message: 'Choose whether this listing should be active.' });
      const item = await Model.findByIdAndUpdate(req.params.id, { active: req.body.active }, { new: true });
      if (!item) return res.status(404).json({ message: `${type.slice(0, -1)} not found.` });
      return res.json({ item });
    } catch (error) { return next(error); }
  });

  router.delete(`${base}/:id`, async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: `Invalid ${type.slice(0, -1)} ID.` });
      const item = await Model.findByIdAndDelete(req.params.id);
      if (!item) return res.status(404).json({ message: `${type.slice(0, -1)} not found.` });
      return res.json({ message: `${type.slice(0, -1)} deleted.` });
    } catch (error) { return next(error); }
  });
}

routesFor(Project, 'projects', validateProject);
routesFor(Competition, 'competitions', validateCompetition);

export default router;
