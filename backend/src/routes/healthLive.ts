import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middleware';

const router = Router();

router.use(authenticateToken);

// 获取实时健康数据
router.get('/live', async (req: Request, res: Response) => {
  try {
    const petId = req.query.petId as string;
    if (!petId) {
      return res.status(400).json({ error: '缺少petId参数' });
    }

    const pet = await prisma.pet.findFirst({
      where: { id: petId, userId: req.userId },
    });
    if (!pet) {
      return res.status(404).json({ error: '宠物不存在' });
    }

    // 获取最新的健康指标
    const latestMetrics = await prisma.healthMetricsData.findMany({
      where: { petId },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    // 去重，每个type只保留最新一条
    const metricMap = new Map<string, typeof latestMetrics[0]>();
    for (const m of latestMetrics) {
      if (!metricMap.has(m.type)) {
        metricMap.set(m.type, m);
      }
    }

    const metrics = Array.from(metricMap.values()).map(m => ({
      type: m.type,
      value: m.value,
      unit: m.unit,
      timestamp: m.timestamp.toISOString(),
    }));

    // 获取今日时间线数据
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const timelineData = await prisma.healthMetricsData.findMany({
      where: {
        petId,
        timestamp: { gte: today },
        type: { in: ['心率', '活动量'] },
      },
      orderBy: { timestamp: 'asc' },
      take: 24,
    });

    const timeline: Array<{ time: string; heartRate: number; activity: number }> = [];
    for (const d of timelineData) {
      const time = new Date(d.timestamp).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const existing = timeline.find(t => t.time === time);
      if (existing) {
        if (d.type === '心率') existing.heartRate = Number(d.value);
        if (d.type === '活动量') existing.activity = Number(d.value);
      } else {
        timeline.push({
          time,
          heartRate: d.type === '心率' ? Number(d.value) : 0,
          activity: d.type === '活动量' ? Number(d.value) : 0,
        });
      }
    }

    res.json({ metrics, timeline });
  } catch (error) {
    console.error('Get live health data error:', error);
    res.status(500).json({ error: '获取健康数据失败' });
  }
});

// 上报健康数据（从 IoT 设备）
router.post('/report', async (req: Request, res: Response) => {
  try {
    const { petId, type, value, unit, source } = req.body;
    if (!petId || !type || value === undefined) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const pet = await prisma.pet.findFirst({
      where: { id: petId, userId: req.userId },
    });
    if (!pet) {
      return res.status(404).json({ error: '宠物不存在' });
    }

    const metric = await prisma.healthMetricsData.create({
      data: {
        petId,
        type,
        value: String(value),
        unit: unit || '',
        source: source || 'manual',
      },
    });

    res.status(201).json({ metric });
  } catch (error) {
    console.error('Report health data error:', error);
    res.status(500).json({ error: '上报健康数据失败' });
  }
});

export default router;