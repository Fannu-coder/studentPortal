import { Router } from 'express';
import ContactMessage from '../models/ContactMessage.js';
import { contactRateLimit } from '../middleware/rateLimit.js';

const router = Router();

router.post('/', contactRateLimit, async (req, res, next) => {
  try {
    // Quietly accept likely bot submissions without storing them.
    if (String(req.body.website || '').trim()) return res.status(201).json({ message: 'Thanks for reaching out. Your message has been received.' });
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const topic = String(req.body.topic || 'general');
    const message = String(req.body.message || '').trim();
    if (name.length < 2 || name.length > 100) return res.status(400).json({ message: 'Enter a name between 2 and 100 characters.' });
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (!['general', 'learning', 'opportunity', 'technical', 'other'].includes(topic)) return res.status(400).json({ message: 'Choose a valid message topic.' });
    if (message.length < 10 || message.length > 3000) return res.status(400).json({ message: 'Write a message between 10 and 3000 characters.' });
    await ContactMessage.create({ name, email, topic, message });
    return res.status(201).json({ message: 'Thanks for reaching out. Your message has been received.' });
  } catch (error) { return next(error); }
});

export default router;
