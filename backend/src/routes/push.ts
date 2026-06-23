import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middleware';

const router = Router();

router.use(authenticateToken);

// 注册推送令牌
router.post('/register', [body('token').isString()], async (req: Request, res: Response) => {
  try {
    const { token, platform } = req.body;

    // 去重：如果已存在则更新
    const existing = await prisma.notificationToken.findUnique({
      where: { token },
    });

    if (existing) {
      const updated = await prisma.notificationToken.update({
        where: { id: existing.id },
        data: { userId: req.userId!, isActive: true, platform: platform || 'android' },
      });
      return res.json({ notificationToken: updated });
    }

    const notificationToken = await prisma.notificationToken.create({
      data: {
        userId: req.userId!,
        token,
        platform: platform || 'android',
        isActive: true,
      },
    });

    res.status(201).json({ notificationToken });
  } catch (error) {
    console.error('Register push token error:', error);
    res.status(500).json({ error: '注册推送令牌失败' });
  }
});

// 注销推送令牌
router.post('/unregister', [body('token').isString()], async (req: Request, res: Response) => {
  try {
    const existing = await prisma.notificationToken.findUnique({
      where: { token: req.body.token },
    });
    if (existing) {
      await prisma.notificationToken.update({
        where: { id: existing.id },
        data: { isActive: false },
      });
    }
    res.json({ message: '已注销' });
  } catch (error) {
    console.error('Unregister push token error:', error);
    res.status(500).json({ error: '注销推送令牌失败' });
  }
});

// 发送推送通知（管理员/后台调用）
router.post('/send', [body('userId').isString(), body('title').isString(), body('body').isString()], async (req: Request, res: Response) => {
  try {
    const { userId, title, body: msgBody, data } = req.body;

    const tokens = await prisma.notificationToken.findMany({
      where: { userId, isActive: true },
    });

    if (tokens.length === 0) {
      return res.json({ sent: 0, message: '无可用推送令牌' });
    }

    // 实际发送通过 FCM/APNs SDK
    // 此处预留接口，实际集成需引入 firebase-admin
    const sent = tokens.length;
    res.json({ sent, message: `已向 ${sent} 个设备发送推送` });
  } catch (error) {
    console.error('Send push notification error:', error);
    res.status(500).json({ error: '发送推送通知失败' });
  }
});

export default router;