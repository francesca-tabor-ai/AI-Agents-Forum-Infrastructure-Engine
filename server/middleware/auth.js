import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'ai-agents-forum-dev-secret-change-in-production';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function adminMiddleware(req, res, next) {
  if (req.userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

export async function attachUser(req, res, next) {
  if (!req.userId) return next();
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, role: true, organizationId: true },
    });
    req.user = user;
  } catch (err) {
    // Ignore
  }
  next();
}

/** Optional auth - sets req.userId if valid token present, does not fail if absent */
export function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
  } catch (err) {
    // Invalid/expired - continue without auth
  }
  next();
}
