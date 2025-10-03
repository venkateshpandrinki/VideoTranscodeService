import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Same secret you used in NEXTAUTH_SECRET
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!);
    // Attach decoded user to request for later use
    req.user = decoded;
    next();
  } catch (error) {
    logger.error({ err: error }, 'Invalid Token');
    return res.status(401).json({ error: 'Invalid token' });
  }
}
