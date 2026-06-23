import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middleware';

const router = Router();

router.use(authenticateToken);

// 获取用户所有 IoT 设备
router.get('/', async (req: Request, res: Response) => {
  try {
    const devices = await prisma.smartFeeder.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ devices });
  } catch (error) {
    console.error('Get IoT devices error:', error);
    res.status(500).json({ error: '获取设备列表失败' });
  }
});

// 添加 IoT 设备
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, deviceType, macAddress, bluetoothId, settings } = req.body;
    const device = await prisma.smartFeeder.create({
      data: {
        userId: req.userId!,
        name,
        deviceType: deviceType || 'FEEDER',
        macAddress,
        bluetoothId,
        settings: settings || {},
        status: 'OFFLINE',
      },
    });
    res.status(201).json({ device });
  } catch (error) {
    console.error('Add IoT device error:', error);
    res.status(500).json({ error: '添加设备失败' });
  }
});

// 更新设备设置
router.put('/:id/settings', async (req: Request, res: Response) => {
  try {
    const device = await prisma.smartFeeder.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!device) {
      return res.status(404).json({ error: '设备不存在' });
    }
    const updated = await prisma.smartFeeder.update({
      where: { id: req.params.id },
      data: { settings: req.body },
    });
    res.json({ device: updated });
  } catch (error) {
    console.error('Update device settings error:', error);
    res.status(500).json({ error: '更新设置失败' });
  }
});

// 控制设备（喂食、出水、激光）
router.post('/:id/control', async (req: Request, res: Response) => {
  try {
    const { action, params } = req.body;
    const device = await prisma.smartFeeder.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!device) {
      return res.status(404).json({ error: '设备不存在' });
    }

    // 通过蓝牙/BLE 发送控制指令
    // 实际集成需引入蓝牙协议栈
    res.json({
      success: true,
      deviceId: device.id,
      action,
      params,
      message: `已发送 ${action} 指令`,
    });
  } catch (error) {
    console.error('Control device error:', error);
    res.status(500).json({ error: '控制设备失败' });
  }
});

// 删除设备
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const device = await prisma.smartFeeder.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!device) {
      return res.status(404).json({ error: '设备不存在' });
    }
    await prisma.smartFeeder.delete({ where: { id: req.params.id } });
    res.json({ message: '已删除' });
  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({ error: '删除设备失败' });
  }
});

export default router;