import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('错误详情:', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      code: err.statusCode,
      error: err.message,
      errorCode: err.code,
    });
  }

  if (err.name === 'PrismaClientInitializationError') {
    return res.status(500).json({
      code: 500,
      error: '数据库连接错误',
      errorCode: 'DATABASE_ERROR',
    });
  }

  if (err.name === 'PrismaClientValidationError') {
    return res.status(400).json({
      code: 400,
      error: '数据验证错误',
      errorCode: 'VALIDATION_ERROR',
    });
  }

  const statusCode = 500;
  const message = process.env.NODE_ENV === 'production'
    ? '服务器内部错误'
    : err.message;

  res.status(statusCode).json({
    code: statusCode,
    error: message,
    errorCode: 'INTERNAL_ERROR',
  });
}

export function notFoundHandler(
  req: Request,
  res: Response
) {
  res.status(404).json({
    code: 404,
    error: '接口不存在',
  });
}
