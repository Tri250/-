import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/auth';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      code: 401,
      error: '未登录，请先登录',
    });
  }

  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    next();
  } catch (error) {
    return res.status(401).json({
      code: 401,
      error: 'Token 无效或已过期',
    });
  }
}
