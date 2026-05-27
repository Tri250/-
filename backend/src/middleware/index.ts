import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/auth';
import jwt from 'jsonwebtoken';

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
      message: '未提供认证令牌',
      data: null,
      timestamp: new Date().toISOString()
    });
  }

  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        code: 401,
        message: 'Token已过期，请重新登录',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        code: 401,
        message: '无效的认证令牌',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
    
    return res.status(401).json({ 
      code: 401,
      message: '认证失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(err.stack);
  
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(500).json({
      code: 500,
      message: err.message,
      data: null,
      timestamp: new Date().toISOString()
    });
  }
}

export function notFoundHandler(
  req: Request,
  res: Response
) {
  res.status(404).json({ 
    code: 404,
    message: '接口不存在',
    data: null,
    timestamp: new Date().toISOString()
  });
}
