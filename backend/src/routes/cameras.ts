import { Router, Request, Response } from 'express';
import { body, param } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middleware';

const router = Router();

router.use(authenticateToken);

// 获取用户所有摄像头
router.get('/', async (req: Request, res: Response) => {
  try {
    const devices = await prisma.cameraDevice.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ devices });
  } catch (error) {
    console.error('Get cameras error:', error);
    res.status(500).json({ error: '获取摄像头列表失败' });
  }
});

// 添加摄像头
router.post(
  '/',
  [body('name').isString(), body('model').isString(), body('protocol').optional().isString()],
  async (req: Request, res: Response) => {
    try {
      const { name, model, manufacturer, protocol, rtspUrl, location, capabilities } = req.body;
      const device = await prisma.cameraDevice.create({
        data: {
          userId: req.userId!,
          name,
          model,
          manufacturer,
          protocol: protocol || 'RTSP',
          rtspUrl,
          location,
          capabilities: capabilities || [],
          status: 'OFFLINE',
        },
      });
      res.status(201).json({ device });
    } catch (error) {
      console.error('Add camera error:', error);
      res.status(500).json({ error: '添加摄像头失败' });
    }
  },
);

// 连接摄像头（WebRTC/RTSP信令）
router.post(
  '/connect',
  [body('deviceId').isString(), body('protocol').optional().isString()],
  async (req: Request, res: Response) => {
    try {
      const { deviceId, protocol } = req.body;
      const device = await prisma.cameraDevice.findFirst({
        where: { id: deviceId, userId: req.userId },
      });

      if (!device) {
        return res.status(404).json({ error: '摄像头不存在' });
      }

      // 生成流媒体 URL（由流媒体服务生成）
      const streamUrl = device.rtspUrl || '';
      const sessionId = `${deviceId}-${Date.now()}`;

      // 更新设备状态
      await prisma.cameraDevice.update({
        where: { id: deviceId },
        data: { status: 'ONLINE', lastOnline: new Date() },
      });

      res.json({ streamUrl, sessionId, protocol: protocol || device.protocol });
    } catch (error) {
      console.error('Connect camera error:', error);
      res.status(500).json({ error: '连接摄像头失败' });
    }
  },
);

// PTZ 控制
router.post(
  '/ptz',
  [body('deviceId').isString(), body('direction').isIn(['up', 'down', 'left', 'right'])],
  async (req: Request, res: Response) => {
    try {
      const { deviceId, direction } = req.body;
      const device = await prisma.cameraDevice.findFirst({
        where: { id: deviceId, userId: req.userId },
      });
      if (!device) {
        return res.status(404).json({ error: '摄像头不存在' });
      }
      // PTZ 指令通过设备适配器转发
      res.json({ success: true, direction });
    } catch (error) {
      console.error('PTZ error:', error);
      res.status(500).json({ error: 'PTZ控制失败' });
    }
  },
);

// 更新摄像头设置
router.put('/:id/settings', async (req: Request, res: Response) => {
  try {
    const device = await prisma.cameraDevice.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!device) {
      return res.status(404).json({ error: '摄像头不存在' });
    }
    const updated = await prisma.cameraDevice.update({
      where: { id: req.params.id },
      data: { settings: req.body },
    });
    res.json({ device: updated });
  } catch (error) {
    console.error('Update camera settings error:', error);
    res.status(500).json({ error: '更新设置失败' });
  }
});

// 删除摄像头
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const device = await prisma.cameraDevice.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!device) {
      return res.status(404).json({ error: '摄像头不存在' });
    }
    await prisma.cameraDevice.delete({ where: { id: req.params.id } });
    res.json({ message: '已删除' });
  } catch (error) {
    console.error('Delete camera error:', error);
    res.status(500).json({ error: '删除摄像头失败' });
  }
});

export default router;