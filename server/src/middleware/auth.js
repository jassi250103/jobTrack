import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

export function authenticate(req, res, next) {
  const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null;
  if (!token) return next(new AppError(401, 'Authentication is required.'));
  try { req.user = jwt.verify(token, env.jwtSecret); next(); }
  catch { next(new AppError(401, 'Invalid or expired authentication token.')); }
}

