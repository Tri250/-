import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middleware';

const router = Router();

router.use(authenticateToken);

// 获取用户订阅
router.get('/', async (req: Request, res: Response) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { userId: req.userId },
    });
    if (!subscription) {
      // 创建默认免费订阅
      const newSub = await prisma.subscription.create({
        data: {
          userId: req.userId!,
          plan: 'FREE',
          status: 'ACTIVE',
        },
      });
      return res.json({ subscription: newSub });
    }
    res.json({ subscription });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: '获取订阅信息失败' });
  }
});

// 升级订阅
router.post('/upgrade', async (req: Request, res: Response) => {
  try {
    const { plan } = req.body;
    if (!['PRO', 'PREMIUM'].includes(plan)) {
      return res.status(400).json({ error: '无效的订阅计划' });
    }

    const subscription = await prisma.subscription.upsert({
      where: { id: req.body.subscriptionId || '' },
      create: {
        userId: req.userId!,
        plan,
        status: 'ACTIVE',
        startDate: new Date(),
        autoRenew: true,
      },
      update: {
        plan,
        status: 'ACTIVE',
        startDate: new Date(),
        autoRenew: true,
      },
    });

    res.json({ subscription });
  } catch (error) {
    console.error('Upgrade subscription error:', error);
    res.status(500).json({ error: '升级订阅失败' });
  }
});

// 取消订阅
router.post('/cancel', async (req: Request, res: Response) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { userId: req.userId },
    });
    if (!subscription) {
      return res.status(404).json({ error: '订阅不存在' });
    }

    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'CANCELLED', autoRenew: false },
    });

    res.json({ subscription: updated });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: '取消订阅失败' });
  }
});

export default router;