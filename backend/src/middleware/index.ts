import { Request, Response, NextFunction } from 'express';

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }

  try {
    const { verifyToken } = require('../lib/auth');
    const payload = verifyToken(token);
    req.userId = payload.userId;
    next();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    return res.status(403).json({ error: 'Token无效' });
  }
}

// ==================== 速率限制 ====================

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1分钟窗口
const RATE_LIMIT_MAX = 60; // 每分钟最多60次请求

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const key = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();

  const entry = rateLimitStore.get(key as string);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key as string, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    return res.status(429).json({
      error: '请求过于频繁，请稍后再试',
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    });
  }

  next();
}

// 定期清理过期条目
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

// ==================== 请求日志 ====================

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { method, url } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const level = statusCode >= 400 ? 'warn' : 'info';
    console[level](
      `[${new Date().toISOString()}] ${method} ${url} ${statusCode} ${duration}ms`
    );
  });

  next();
}

// ==================== 错误处理 ====================

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(`[ERROR] ${req.method} ${req.url}:`, err.message);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? '服务器内部错误'
      : err.message,
  });
}

export function notFoundHandler(
  req: Request,
  res: Response
) {
  res.status(404).json({ error: '接口不存在' });
}
