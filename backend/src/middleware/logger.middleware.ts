import { Request, Response, NextFunction } from 'express';

interface RequestLog {
  timestamp: string;
  method: string;
  url: string;
  params: any;
  query: any;
  body: any;
  userId?: string;
  ip: string;
  userAgent: string;
}

interface ResponseLog {
  statusCode: number;
  responseTime: number;
  contentLength?: number;
}

class APILogger {
  private logs: RequestLog[] = [];
  private maxLogs = 1000;

  log(req: Request, res: Response, duration: number) {
    const log: RequestLog & ResponseLog = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      params: req.params,
      query: req.query,
      body: this.sanitizeBody(req.body),
      userId: req.userId,
      ip: req.ip || req.socket.remoteAddress || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
      statusCode: res.statusCode,
      responseTime: Math.round(duration),
      contentLength: parseInt(res.get('content-length') || '0'),
    };

    this.logs.unshift(log);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    this.printLog(log);
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'credential'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***HIDDEN***';
      }
    }
    
    return sanitized;
  }

  private printLog(log: RequestLog & ResponseLog) {
    const timestamp = new Date(log.timestamp).toLocaleString('zh-CN');
    const method = log.method.padEnd(6);
    const url = log.url.substring(0, 60).padEnd(60);
    const status = log.statusCode;
    const responseTime = log.responseTime;
    const userId = log.userId || '-';
    const ip = log.ip;

    const statusColor = status >= 500 ? '\x1b[31m' : 
                       status >= 400 ? '\x1b[33m' : 
                       status >= 300 ? '\x1b[36m' : 
                       '\x1b[32m';
    const reset = '\x1b[0m';

    console.log(
      `${timestamp} | ${statusColor}${status}${reset} | ${method} | ${responseTime}ms | ${userId.padEnd(10)} | ${ip.padEnd(15)} | ${url}`
    );
  }

  getLogs(filter?: {
    method?: string;
    statusCode?: number;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    let filtered = [...this.logs];

    if (filter?.method) {
      filtered = filtered.filter(log => log.method === filter.method);
    }
    if (filter?.statusCode) {
      filtered = filtered.filter(log => log.statusCode === filter.statusCode);
    }
    if (filter?.userId) {
      filtered = filtered.filter(log => log.userId === filter.userId);
    }
    if (filter?.startDate) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= filter.startDate!);
    }
    if (filter?.endDate) {
      filtered = filtered.filter(log => new Date(log.timestamp) <= filter.endDate!);
    }

    return filtered;
  }

  getStatistics() {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const recentLogs = this.logs.filter(log => 
      new Date(log.timestamp).getTime() > oneHourAgo
    );

    const todayLogs = this.logs.filter(log => 
      new Date(log.timestamp).getTime() > oneDayAgo
    );

    const statusCounts = this.logs.reduce((acc, log) => {
      const statusGroup = Math.floor(log.statusCode / 100) + 'xx';
      acc[statusGroup] = (acc[statusGroup] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgResponseTime = this.logs.length > 0
      ? Math.round(this.logs.reduce((sum, log) => sum + log.responseTime, 0) / this.logs.length)
      : 0;

    const slowRequests = this.logs.filter(log => log.responseTime > 3000).length;
    const errorRequests = this.logs.filter(log => log.statusCode >= 400).length;

    return {
      totalRequests: this.logs.length,
      lastHourRequests: recentLogs.length,
      todayRequests: todayLogs.length,
      avgResponseTime,
      slowRequests,
      errorRequests,
      errorRate: this.logs.length > 0 
        ? ((errorRequests / this.logs.length) * 100).toFixed(2) + '%'
        : '0%',
      statusCounts,
    };
  }

  clear() {
    this.logs = [];
    console.log('API 日志已清空');
  }
}

export const apiLogger = new APILogger();

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    apiLogger.log(req, res, duration);
  });

  next();
}

export function getAPILogs(filter?: any) {
  return apiLogger.getLogs(filter);
}

export function getAPIStatistics() {
  return apiLogger.getStatistics();
}

export function clearAPILogs() {
  apiLogger.clear();
}
