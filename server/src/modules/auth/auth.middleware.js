import jwt from 'jsonwebtoken';
import { sendError } from '../../utils/response.js';

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Not authenticated', 'UNAUTHENTICATED', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (error) {
    return sendError(res, 'Invalid or expired token', 'UNAUTHENTICATED', 401);
  }
};
