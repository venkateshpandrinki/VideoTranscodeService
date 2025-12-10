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
    // @ts-expect-error: NEXTAUTH_SECRET may be undefined at type level, but is checked at runtime
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!);
    // @ts-expect-error: Express Request type does not include 'user', but we attach it dynamically
    req.user = decoded;
    next();
  } catch (error) {
    logger.error({ err: error }, 'Invalid Token');
    return res.status(401).json({ error: 'Invalid token' });
  }
}
