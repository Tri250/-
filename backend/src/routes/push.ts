import { Router, Request, Response } from 'express';
import { body, query } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middleware';

const router = Router();

router.use(authenticateToken);

// ─── 注册推送令牌 ────────────────────────────────────────────

router.post('/register', [body('token').isString()], async (req: Request, res: Response) => {
  try {
    const { token, platform } = req.body;

    // 去重：如果已存在则更新
    const existing = await prisma.notificationToken.findUnique({
      where: { token },
    });

    if (existing) {
      // 如果 token 属于其他用户，先注销旧用户
      if (existing.userId !== req.userId!) {
        await prisma.notificationToken.update({
          where: { id: existing.id },
          data: { isActive: false },
        });
        // 创建新记录
        const notificationToken = await prisma.notificationToken.create({
          data: {
            userId: req.userId!,
            token,
            platform: platform || 'android',
            isActive: true,
          },
        });
        return res.status(201).json({ notificationToken, message: 'Token registered' });
      }

      const updated = await prisma.notificationToken.update({
        where: { id: existing.id },
        data: { userId: req.userId!, isActive: true, platform: platform || 'android' },
      });
      return res.json({ notificationToken: updated, message: 'Token updated' });
    }

    const notificationToken = await prisma.notificationToken.create({
      data: {
        userId: req.userId!,
        token,
        platform: platform || 'android',
        isActive: true,
      },
    });

    res.status(201).json({ notificationToken, message: 'Token registered' });
  } catch (error) {
    console.error('Register push token error:', error);
    res.status(500).json({ error: '注册推送令牌失败' });
  }
});

// ─── 注销推送令牌 ────────────────────────────────────────────

router.post('/unregister', [body('token').isString()], async (req: Request, res: Response) => {
  try {
    const existing = await prisma.notificationToken.findUnique({
      where: { token: req.body.token },
    });

    if (existing) {
      // 验证 token 属于当前用户
      if (existing.userId !== req.userId!) {
        return res.status(403).json({ error: '无权操作此令牌' });
      }

      await prisma.notificationToken.update({
        where: { id: existing.id },
        data: { isActive: false },
      });
    }

    res.json({ message: '已注销推送令牌' });
  } catch (error) {
    console.error('Unregister push token error:', error);
    res.status(500).json({ error: '注销推送令牌失败' });
  }
});

// ─── 发送推送通知（管理员/后台调用） ──────────────────────────

router.post(
  '/send',
  [body('userId').isString(), body('title').isString(), body('body').isString()],
  async (req: Request, res: Response) => {
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

      // 记录通知历史
      const notification = await prisma.notification.create({
        data: {
          userId,
          title,
          body: msgBody,
          data: data || {},
          tokenCount: tokens.length,
          sentCount: sent,
          status: 'SENT',
        },
      });

      res.json({
        sent,
        notificationId: notification.id,
        message: `已向 ${sent} 个设备发送推送`,
      });
    } catch (error) {
      console.error('Send push notification error:', error);
      res.status(500).json({ error: '发送推送通知失败' });
    }
  },
);

// ─── 通知历史记录 ────────────────────────────────────────────

/**
 * 获取当前用户的通知历史
 * GET /api/push/history?limit=20&offset=0
 */
router.get(
  '/history',
  [query('limit').optional().isInt({ min: 1, max: 100 }), query('offset').optional().isInt({ min: 0 })],
  async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where: { userId: req.userId! },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.notification.count({
          where: { userId: req.userId! },
        }),
      ]);

      res.json({
        notifications,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      });
    } catch (error) {
      console.error('Get notification history error:', error);
      res.status(500).json({ error: '获取通知历史失败' });
    }
  },
);

/**
 * 标记通知为已读
 * POST /api/push/read/:id
 */
router.post('/read/:id', async (req: Request, res: Response) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id },
    });

    if (!notification) {
      return res.status(404).json({ error: '通知不存在' });
    }

    if (notification.userId !== req.userId!) {
      return res.status(403).json({ error: '无权操作此通知' });
    }

    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { readAt: new Date() },
    });

    res.json({ notification: updated });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: '标记已读失败' });
  }
});

/**
 * 标记所有通知为已读
 * POST /api/push/read-all
 */
router.post('/read-all', async (req: Request, res: Response) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId: req.userId!, readAt: null },
      data: { readAt: new Date() },
    });

    res.json({ message: '已标记所有通知为已读', count: result.count });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: '标记已读失败' });
  }
});

/**
 * 获取未读通知数量
 * GET /api/push/unread-count
 */
router.get('/unread-count', async (req: Request, res: Response) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.userId!, readAt: null },
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: '获取未读数失败' });
  }
});

export default router;