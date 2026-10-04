import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function requireAuth(req, res, next) {
  if (!process.env.JWT_SECRET) return res.status(503).json({ message: 'Authentication is not configured on the server.' });
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });
  try {
    const claims = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(claims.sub).select('name email role active mustChangePassword');
    if (!user || !user.active || user.role !== claims.role) {
      return res.status(401).json({ message: 'This account is no longer active. Please sign in again.' });
    }
    req.user = { sub: user.id, role: user.role, name: user.name, mustChangePassword: user.mustChangePassword };
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
    }
    return next(error);
  }
}

export const requireRole = (...roles) => (req, res, next) => {
  if (req.user?.mustChangePassword) return res.status(403).json({ message: 'Change your temporary password before continuing.' });
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'You do not have access to this area.' });
  }
  return next();
};
