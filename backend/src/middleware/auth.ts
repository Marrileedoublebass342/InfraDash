import { Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { AuthRequest } from '../types/index.js';
import logger from '../utils/logger.js';

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'No token provided',
    });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    logger.warn('Invalid token attempt');
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = verifyToken(token);
      req.user = decoded;
    } catch {
      // Token invalid, but that's okay for optional auth
    }
  }

  next();
}
