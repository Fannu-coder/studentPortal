import { createHmac } from 'node:crypto';
import RateLimitCounter from '../models/RateLimitCounter.js';

export function createRateLimit({ windowMs, max, message }) {
  return async function rateLimit(req, res, next) {
    const now = Date.now();
    const windowId = Math.floor(now / windowMs);
    const resetAt = (windowId + 1) * windowMs;
    const clientAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(503).json({ message: 'Request protection is not configured.' });
    const key = createHmac('sha256', secret).update(`${req.baseUrl}${req.path}\0${clientAddress}`).digest('hex');
    const query = { key, windowId };
    const update = { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(resetAt + windowMs) } };
    let counter;
    try {
      counter = await RateLimitCounter.findOneAndUpdate(query, update, { new: true, upsert: true }).lean();
    } catch (error) {
      // Concurrent first requests can race to create this unique IP/window row.
      if (error.code !== 11000) return next(error);
      try { counter = await RateLimitCounter.findOneAndUpdate(query, { $inc: { count: 1 } }, { new: true }).lean(); }
      catch (retryError) { return next(retryError); }
    }
    res.set('RateLimit-Limit', String(max));
    res.set('RateLimit-Remaining', String(Math.max(0, max - counter.count)));
    res.set('RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
    if (counter.count > max) {
      res.set('Retry-After', String(Math.max(1, Math.ceil((resetAt - now) / 1000))));
      return res.status(429).json({ message });
    }
    return next();
  };
}

export const loginRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many sign-in attempts from this network. Please wait 15 minutes and try again.',
});

export const contactRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  message: 'Too many messages from this network. Please wait before sending another.',
});
