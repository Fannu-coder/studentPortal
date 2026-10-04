import { Router } from 'express';
import mongoose from 'mongoose';
import CareerField from '../models/CareerField.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
const colors = ['lilac', 'peach', 'mint', 'blue'];
const resourceTypes = ['video', 'guide', 'project', 'code', 'other'];
const slugify = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function validateCareer(body) {
  const name = String(body.name || '').trim();
  const slug = slugify(body.slug || name);
  const description = String(body.description || '').trim();
  const category = String(body.category || '').trim();
  const estimatedWeeks = Number(body.estimatedWeeks);
  if (!name || !description || !category) return { error: 'Name, description, and category are required.' };
  if (!slug || slug.length > 80) return { error: 'Use a name that can form a valid URL slug.' };
  if (description.length > 500) return { error: 'Keep the description under 500 characters.' };
  if (!Number.isInteger(estimatedWeeks) || estimatedWeeks < 1 || estimatedWeeks > 104) return { error: 'Estimated weeks must be a whole number from 1 to 104.' };
  if (body.color && !colors.includes(body.color)) return { error: 'Choose one of the available card colors.' };
  if (!Array.isArray(body.phases)) return { error: 'Roadmap phases must be provided as a list.' };

  const phases = [];
  for (const [index, phase] of body.phases.entries()) {
    const title = String(phase.title || '').trim();
    if (!title) return { error: `Add a title for phase ${index + 1}.` };
    if (!Array.isArray(phase.resources)) return { error: `Resources for phase ${index + 1} must be a list.` };
    const resources = [];
    for (const resource of phase.resources) {
      const resourceTitle = String(resource.title || '').trim();
      const type = String(resource.type || 'other');
      const url = String(resource.url || '').trim();
      if (!resourceTitle) return { error: `Every resource in phase ${index + 1} needs a title.` };
      if (!resourceTypes.includes(type)) return { error: 'Choose a valid resource type.' };
      if (url && !/^https?:\/\//i.test(url)) return { error: 'Resource links must start with http:// or https://.' };
      resources.push({
        title: resourceTitle,
        type,
        description: String(resource.description || '').trim(),
        duration: String(resource.duration || '').trim(),
        url,
      });
    }
    phases.push({ title, duration: String(phase.duration || '').trim(), order: index + 1, resources });
  }

  return { value: {
    slug,
    name,
    description,
    category,
    tag: String(body.tag || 'LEARNING PATH').trim().slice(0, 32),
    icon: String(body.icon || '✳').trim().slice(0, 8),
    color: body.color || 'lilac',
    estimatedWeeks,
    active: body.active !== false,
    phases,
  } };
}

router.use(requireAuth, requireRole('admin'));

router.get('/', async (_req, res, next) => {
  try {
    const careers = await CareerField.find().sort({ updatedAt: -1, name: 1 }).lean();
    return res.json({ careers });
  } catch (error) { return next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const { error, value } = validateCareer(req.body);
    if (error) return res.status(400).json({ message: error });
    const career = await CareerField.create(value);
    return res.status(201).json({ career });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'A learning path with that URL slug already exists.' });
    if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
    return next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid learning path ID.' });
    const { error, value } = validateCareer(req.body);
    if (error) return res.status(400).json({ message: error });
    const career = await CareerField.findByIdAndUpdate(req.params.id, value, { new: true, runValidators: true });
    if (!career) return res.status(404).json({ message: 'That learning path could not be found.' });
    return res.json({ career });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'A learning path with that URL slug already exists.' });
    if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
    return next(error);
  }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid learning path ID.' });
    if (typeof req.body.active !== 'boolean') return res.status(400).json({ message: 'Choose whether the learning path should be active.' });
    const career = await CareerField.findByIdAndUpdate(req.params.id, { active: req.body.active }, { new: true });
    if (!career) return res.status(404).json({ message: 'That learning path could not be found.' });
    return res.json({ career });
  } catch (error) { return next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid learning path ID.' });
    const career = await CareerField.findByIdAndDelete(req.params.id);
    if (!career) return res.status(404).json({ message: 'That learning path could not be found.' });
    return res.json({ message: 'Learning path deleted.' });
  } catch (error) { return next(error); }
});

export default router;
