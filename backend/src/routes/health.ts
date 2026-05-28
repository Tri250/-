import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { config } from '../config';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: ServiceStatus;
    ai: ServiceStatus;
  };
  environment: string;
}

interface ServiceStatus {
  status: 'up' | 'down' | 'degraded';
  latency?: number;
  message?: string;
}

let serverStartTime = Date.now();

router.get('/', async (req: Request, res: Response) => {
  try {
    const services: { database: ServiceStatus; ai: ServiceStatus } = {
      database: { status: 'down' },
      ai: { status: 'down' },
    };

    // 检查数据库连接
    const dbStart = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      services.database = {
        status: 'up',
        latency: Date.now() - dbStart,
      };
    } catch (error) {
      services.database = {
        status: 'down',
        message: '数据库连接失败',
      };
    }

    // 检查AI服务状态
    if (process.env.DEEPSEEK_API_KEY || process.env.GOOGLE_AI_API_KEY) {
      services.ai = {
        status: 'up',
        message: 'AI服务已配置',
      };
    } else {
      services.ai = {
        status: 'degraded',
        message: 'AI服务未配置，使用规则引擎兜底',
      };
    }

    // 计算整体状态
    const allUp = Object.values(services).every(s => s.status === 'up');
    const anyDown = Object.values(services).some(s => s.status === 'down');
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (anyDown) {
      overallStatus = 'unhealthy';
    } else if (Object.values(services).some(s => s.status === 'degraded')) {
      overallStatus = 'degraded';
    }

    const uptime = Math.floor((Date.now() - serverStartTime) / 1000);

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime,
      version: '1.0.0',
      services,
      environment: process.env.NODE_ENV || 'development',
    };

    const httpStatus = overallStatus === 'unhealthy' ? 503 : 200;
    res.status(httpStatus).json(healthStatus);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: '健康检查失败',
    });
  }
});

// 详细的健康检查
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const checks: Record<string, any> = {};

    // 1. 数据库检查
    const dbStart = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = {
        status: 'healthy',
        latency: Date.now() - dbStart,
        message: '数据库连接正常',
      };
    } catch (error: any) {
      checks.database = {
        status: 'unhealthy',
        message: error.message,
      };
    }

    // 2. 数据表检查
    try {
      const tableCount = await prisma.$queryRaw`
        SELECT name FROM sqlite_master WHERE type='table'
      `;
      checks.tables = {
        status: 'healthy',
        count: (tableCount as any[]).length,
        message: `数据库包含${(tableCount as any[]).length}个表`,
      };
    } catch (error: any) {
      checks.tables = {
        status: 'unhealthy',
        message: error.message,
      };
    }

    // 3. AI服务检查
    if (process.env.DEEPSEEK_API_KEY) {
      checks.aiServices = {
        status: 'healthy',
        configured: ['DeepSeek'],
        message: 'AI服务已配置',
      };
    } else if (process.env.GOOGLE_AI_API_KEY) {
      checks.aiServices = {
        status: 'healthy',
        configured: ['Google Gemini'],
        message: 'AI服务已配置',
      };
    } else {
      checks.aiServices = {
        status: 'degraded',
        configured: [],
        message: 'AI服务未配置，使用规则引擎兜底',
      };
    }

    // 4. 环境变量检查
    const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
    const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
    checks.environment = {
      status: missingEnvVars.length === 0 ? 'healthy' : 'unhealthy',
      missing: missingEnvVars,
      message: missingEnvVars.length === 0 
        ? '所有必需环境变量已配置' 
        : `缺少环境变量: ${missingEnvVars.join(', ')}`,
    };

    // 5. 内存使用情况
    const memUsage = process.memoryUsage();
    checks.memory = {
      status: memUsage.heapUsed / memUsage.heapTotal < 0.9 ? 'healthy' : 'warning',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      usage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100) + '%',
    };

    // 6. 系统信息
    checks.system = {
      status: 'healthy',
      platform: process.platform,
      nodeVersion: process.version,
      uptime: Math.floor(process.uptime()) + 's',
    };

    const allHealthy = Object.values(checks).every((c: any) => c.status === 'healthy');
    const anyUnhealthy = Object.values(checks).some((c: any) => c.status === 'unhealthy');

    res.json({
      status: anyUnhealthy ? 'unhealthy' : allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - serverStartTime) / 1000),
      checks,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// 就绪检查
router.get('/ready', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      ready: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      ready: false,
      timestamp: new Date().toISOString(),
    });
  }
});

// 存活检查
router.get('/live', (req: Request, res: Response) => {
  res.json({
    alive: true,
    timestamp: new Date().toISOString(),
  });
});

export default router;
