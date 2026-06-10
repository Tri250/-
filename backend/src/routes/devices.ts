/**
 * 设备路由
 * 处理 IoT 设备管理相关的 API 请求
 */

import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { devicesService, DeviceType, DeviceStatus, CommandStatus } from '../services/devicesService';
import { authenticateToken } from '../middleware';
import prisma from '../lib/prisma';

const router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

/**
 * GET /api/devices/types
 * 获取支持的设备类型列表
 */
router.get('/types', async (req: Request, res: Response) => {
  try {
    const types = devicesService.getSupportedDeviceTypes();
    res.json({ types });
  } catch (error) {
    console.error('获取设备类型失败:', error);
    res.status(500).json({ error: '获取设备类型失败' });
  }
});

/**
 * GET /api/devices/:userId
 * 获取设备列表
 */
router.get('/:userId', [
  query('deviceType').optional().isIn(['FEEDER', 'WATER_DISPENSER', 'CAMERA', 'TOY', 'TRACKER', 'LITTER_BOX', 'DOOR', 'OTHER']),
  query('status').optional().isIn(['ONLINE', 'OFFLINE', 'MAINTENANCE', 'ERROR']),
], async (req: Request, res: Response) => {
  // 验证请求参数
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { userId } = req.params;
    const { deviceType, status } = req.query;

    // 验证用户身份
    if (userId !== req.userId) {
      return res.status(403).json({ error: '无权访问其他用户的设备' });
    }

    // 获取设备列表
    const devices = await devicesService.getDevicesByUserId(userId, {
      deviceType: deviceType as DeviceType | undefined,
      status: status as DeviceStatus | undefined,
    });

    res.json({ devices });
  } catch (error) {
    console.error('获取设备列表失败:', error);
    res.status(500).json({ error: '获取设备列表失败' });
  }
});

/**
 * GET /api/devices/detail/:deviceId
 * 获取单个设备详情
 */
router.get('/detail/:deviceId', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;

    const device = await devicesService.getDeviceById(deviceId);

    if (!device) {
      return res.status(404).json({ error: '设备不存在' });
    }

    // 验证设备归属
    if (device.userId !== req.userId) {
      return res.status(403).json({ error: '无权访问该设备' });
    }

    // 获取设备类型配置
    const typeConfig = devicesService.getDeviceTypeConfig(device.deviceType);

    res.json({
      device,
      typeConfig,
    });
  } catch (error) {
    console.error('获取设备详情失败:', error);
    res.status(500).json({ error: '获取设备详情失败' });
  }
});

/**
 * POST /api/devices/register
 * 注册新设备
 */
router.post('/register', [
  body('name').isLength({ min: 1, max: 50 }).withMessage('设备名称长度应在1-50字符之间'),
  body('deviceType').isIn(['FEEDER', 'WATER_DISPENSER', 'CAMERA', 'TOY', 'TRACKER', 'LITTER_BOX', 'DOOR', 'OTHER']).withMessage('设备类型无效'),
  body('deviceId').isLength({ min: 1, max: 100 }).withMessage('设备ID不能为空'),
  body('firmwareVersion').optional().isLength({ max: 50 }).withMessage('固件版本长度不能超过50字符'),
], async (req: Request, res: Response) => {
  // 验证请求参数
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, deviceType, deviceId, firmwareVersion, config } = req.body;

    // 注册设备
    const device = await devicesService.registerDevice({
      userId: req.userId!,
      name,
      deviceType: deviceType as DeviceType,
      deviceId,
      firmwareVersion,
      config,
    });

    res.status(201).json({
      message: '设备注册成功',
      device,
    });
  } catch (error) {
    console.error('注册设备失败:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : '注册设备失败' });
  }
});

/**
 * POST /api/devices/:deviceId/command
 * 发送设备指令
 */
router.post('/:deviceId/command', [
  body('command').isLength({ min: 1 }).withMessage('指令不能为空'),
  body('params').optional().isObject().withMessage('参数应为对象'),
], async (req: Request, res: Response) => {
  // 验证请求参数
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { deviceId } = req.params;
    const { command, params } = req.body;

    // 获取设备并验证归属
    const device = await devicesService.getDeviceById(deviceId);

    if (!device) {
      return res.status(404).json({ error: '设备不存在' });
    }

    if (device.userId !== req.userId) {
      return res.status(403).json({ error: '无权操作该设备' });
    }

    // 发送指令
    const commandRecord = await devicesService.sendCommand(deviceId, {
      command,
      params,
    });

    res.json({
      message: '指令已发送',
      command: commandRecord,
    });
  } catch (error) {
    console.error('发送设备指令失败:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : '发送设备指令失败' });
  }
});

/**
 * GET /api/devices/:deviceId/commands
 * 获取设备指令历史
 */
router.get('/:deviceId/commands', [
  query('status').optional().isIn(['PENDING', 'EXECUTING', 'SUCCESS', 'FAILED', 'TIMEOUT']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
], async (req: Request, res: Response) => {
  // 验证请求参数
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { deviceId } = req.params;
    const { status, limit, offset } = req.query;

    // 获取设备并验证归属
    const device = await devicesService.getDeviceById(deviceId);

    if (!device) {
      return res.status(404).json({ error: '设备不存在' });
    }

    if (device.userId !== req.userId) {
      return res.status(403).json({ error: '无权访问该设备' });
    }

    // 获取指令历史
    const result = await devicesService.getCommandHistory(deviceId, {
      status: status as CommandStatus | undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json({
      commands: result.commands,
      total: result.total,
      limit: limit ? parseInt(limit as string) : 20,
      offset: offset ? parseInt(offset as string) : 0,
    });
  } catch (error) {
    console.error('获取指令历史失败:', error);
    res.status(500).json({ error: '获取指令历史失败' });
  }
});

/**
 * PUT /api/devices/:deviceId/status
 * 更新设备状态
 */
router.put('/:deviceId/status', [
  body('status').optional().isIn(['ONLINE', 'OFFLINE', 'MAINTENANCE', 'ERROR']).withMessage('设备状态无效'),
  body('batteryLevel').optional().isInt({ min: 0, max: 100 }).withMessage('电池电量应在0-100之间'),
  body('firmwareVersion').optional().isLength({ max: 50 }).withMessage('固件版本长度不能超过50字符'),
  body('config').optional().isObject().withMessage('配置应为对象'),
], async (req: Request, res: Response) => {
  // 验证请求参数
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { deviceId } = req.params;
    const { status, batteryLevel, firmwareVersion, config } = req.body;

    // 获取设备并验证归属
    const device = await devicesService.getDeviceById(deviceId);

    if (!device) {
      return res.status(404).json({ error: '设备不存在' });
    }

    if (device.userId !== req.userId) {
      return res.status(403).json({ error: '无权修改该设备状态' });
    }

    // 更新设备状态
    const updatedDevice = await devicesService.updateDeviceStatus(deviceId, {
      status: status as DeviceStatus | undefined,
      batteryLevel,
      firmwareVersion,
      config,
    });

    res.json({
      message: '设备状态更新成功',
      device: updatedDevice,
    });
  } catch (error) {
    console.error('更新设备状态失败:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : '更新设备状态失败' });
  }
});

/**
 * DELETE /api/devices/:deviceId
 * 删除设备
 */
router.delete('/:deviceId', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;

    // 获取设备并验证归属
    const device = await devicesService.getDeviceById(deviceId);

    if (!device) {
      return res.status(404).json({ error: '设备不存在' });
    }

    if (device.userId !== req.userId) {
      return res.status(403).json({ error: '无权删除该设备' });
    }

    // 删除设备
    const success = await devicesService.deleteDevice(deviceId);

    if (success) {
      res.json({ message: '设备删除成功' });
    } else {
      res.status(500).json({ error: '删除设备失败' });
    }
  } catch (error) {
    console.error('删除设备失败:', error);
    res.status(500).json({ error: '删除设备失败' });
  }
});

/**
 * POST /api/devices/heartbeat
 * 设备心跳接口（供设备调用）
 */
router.post('/heartbeat', [
  body('deviceId').isLength({ min: 1 }).withMessage('设备ID不能为空'),
  body('batteryLevel').optional().isInt({ min: 0, max: 100 }).withMessage('电池电量应在0-100之间'),
  body('firmwareVersion').optional().isLength({ max: 50 }).withMessage('固件版本长度不能超过50字符'),
  body('status').optional().isIn(['ONLINE', 'OFFLINE', 'MAINTENANCE', 'ERROR']).withMessage('设备状态无效'),
], async (req: Request, res: Response) => {
  // 验证请求参数
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { deviceId, batteryLevel, firmwareVersion, status } = req.body;

    // 处理心跳
    const device = await devicesService.handleHeartbeat(deviceId, {
      batteryLevel,
      firmwareVersion,
      status: status as DeviceStatus | undefined,
    });

    res.json({
      message: '心跳处理成功',
      device,
    });
  } catch (error) {
    console.error('处理心跳失败:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : '处理心跳失败' });
  }
});

export default router;