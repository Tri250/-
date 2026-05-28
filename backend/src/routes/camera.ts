import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middleware';
import { validateBody } from '../middleware/validation.middleware';

const router = Router();

router.use(authenticateToken);

// 核心设备白名单品牌列表（硬编码官方品牌
const OFFICIAL_BRANDS = ['pawsync', 'pawsync_pro', 'pawsync_petcam'];

// 辅助函数：检查设备是否在官方白名单
const validateOfficialDevice = async (brand: string, model: string, serialNumber: string) => {
  // 首先检查硬编码的品牌列表
  if (!OFFICIAL_BRANDS.includes(brand)) {
    return { 
      error: '本平台仅支持官方指定型号摄像头，暂不兼容其他品牌设备',
      status: 403
    };
  }

  // 检查数据库中的白名单
  const whitelistItem = await prisma.officialCameraWhitelist.findFirst({
    where: { brand, model, isActive: true },
  });

  if (!whitelistItem) {
    return {
      error: '本平台仅支持官方指定型号摄像头，暂不兼容其他品牌设备',
      status: 403
    };
  }

  // 检查序列号前缀（如果有的话
  if (whitelistItem.serialPrefix) {
    if (!serialNumber.startsWith(whitelistItem.serialPrefix)) {
      return {
        error: '设备序列号无效，请确认后重试',
        status: 400
      };
    }
  }

  return { whitelistItem };
};

// 辅助函数：检查摄像头所有权
const validateCameraOwnership = async (cameraId: string, userId: string) => {
  const camera = await prisma.cameraDevice.findUnique({
    where: { id: cameraId },
  });
  
  if (!camera) return { error: '摄像头不存在', status: 404 };
  if (camera.userId !== userId) return { error: '无权限操作该摄像头', status: 403 };
  if (camera.isDeleted) return { error: '摄像头已被删除', status: 404 };
  return { camera };
};

// 序列化摄像头数据
const serializeCamera = (camera: any) => ({
  ...camera,
  capabilities: camera.capabilities ? JSON.parse(camera.capabilities) : [],
  settings: camera.settings ? JSON.parse(camera.settings) : {},
});

// 验证模式
const bindCameraSchema = z.object({
  name: z.string().min(1, '摄像头名称不能为空'),
  brand: z.string().min(1, '品牌不能为空'),
  model: z.string().min(1, '型号不能为空'),
  serialNumber: z.string().min(1, '设备序列号不能为空'),
  petId: z.string().optional(),
  location: z.string().optional(),
  thumbnailUrl: z.string().optional(),
});

const updateCameraSchema = z.object({
  name: z.string().optional(),
  petId: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(['online', 'offline', 'error', 'updating']).optional(),
  thumbnailUrl: z.string().optional(),
  settings: z.record(z.any()).optional(),
});

const createAlertSchema = z.object({
  cameraId: z.string(),
  petId: z.string().optional(),
  type: z.enum(['motion', 'sound', 'pet_detected', 'person_detected', 'intrusion', 'pet_in_trouble']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string(),
  thumbnailUrl: z.string().optional(),
  videoUrl: z.string().optional(),
});

// ==================== 官方设备白名单（内部接口（初始化使用 ====================
// 预填充白名单数据（初始化
router.post('/seed-whitelist', async (req: Request, res: Response) => {
  try {
    const whitelistData = [
      {
        brand: 'pawsync', model: 'PetCam V1', serialPrefix: 'PSV1', description: 'Pawsync 宠物监控摄像头 V1', supportedFeatures: JSON.stringify(['ptz', 'audio', 'night_vision', 'motion_detect']) },
        { brand: 'pawsync_pro', model: 'PetCam Pro', serialPrefix: 'PSP', description: 'Pawsync 专业版摄像头', supportedFeatures: JSON.stringify(['ptz', 'audio', 'night_vision', 'motion_detect', 'ai_pet_detection']) },
        { brand: 'pawsync_petcam', model: 'PetCam Mini', serialPrefix: 'PSM', description: 'Pawsync 迷你版摄像头', supportedFeatures: JSON.stringify(['audio', 'night_vision', 'motion_detect']) },
      ];

      for (const item of whitelistData) {
        const existing = await prisma.officialCameraWhitelist.findFirst({
          where: { brand: item.brand, model: item.model },
        });

        if (!existing) {
          await prisma.officialCameraWhitelist.create({ data: item });
        }
      }

    res.json({ code: 200, msg: '白名单初始化完成' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 500, error: '初始化白名单失败' });
  }
});

// ==================== 摄像头设备管理 ====================

// 获取摄像头列表
router.get('/cameras', async (req: Request, res: Response) => {
  try {
    const cameras = await prisma.cameraDevice.findMany({
      where: { userId: req.userId, isDeleted: false },
      include: {
        pet: true,
        motionAlerts: {
          take: 3,
          orderBy: { createdAt: 'desc' }
        },
        recordings: { take: 3, orderBy: { createdAt: 'desc' }
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      code: 200,
      data: cameras.map(serializeCamera),
      msg: 'success'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 500, error: '获取摄像头列表失败' });
  }
});

// 绑定摄像头
router.post('/cameras', validateBody(bindCameraSchema), async (req: Request, res: Response) => {
  try {
    const { brand, model, serialNumber, petId, ...rest } = req.body;

    // 第一步：验证是否为官方设备
    const deviceValidation = await validateOfficialDevice(brand, model, serialNumber);
    if (deviceValidation.error) {
      return res.status(deviceValidation.status).json({
        code: deviceValidation.status,
        error: deviceValidation.error
      });
    }

    // 检查设备是否已被绑定
    const existingCamera = await prisma.cameraDevice.findFirst({
      where: { serialNumber, isDeleted: false },
    });

    if (existingCamera) {
      if (existingCamera.userId === req.userId) {
        return res.status(400).json({
          code: 400, error: '该摄像头已绑定至您的账号'
        });
      }
      return res.status(400).json({
        code: 400, error: '该设备已被其他账号绑定'
      });
    }

    // 如果提供了宠物ID，验证用户是否拥有该宠物
    if (petId) {
      const pet = await prisma.pet.findFirst({
        where: { id: petId, userId: req.userId },
      });
      if (!pet) {
        return res.status(400).json({
          code: 400, error: '无效的宠物ID'
        });
      }
    }

    const camera = await prisma.cameraDevice.create({
      data: {
        userId: req.userId!,
        brand,
        model,
        serialNumber,
        petId,
        status: 'offline',
        capabilities: deviceValidation.whitelistItem?.supportedFeatures || JSON.stringify([]),
        settings: JSON.stringify({}),
        ...rest,
      },
    });

    res.status(201).json({
      code: 201,
      data: serializeCamera(camera),
      msg: '摄像头绑定成功'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      code: 500, error: '绑定摄像头失败'
    });
  }
});

// 获取单个摄像头详情
router.get('/cameras/:id', async (req: Request, res: Response) => {
  try {
    const validation = await validateCameraOwnership(req.params.id, req.userId!);
    if (validation.error) {
      return res.status(validation.status).json({
        code: validation.status,
        error: validation.error
      });
    }

    const camera = await prisma.cameraDevice.findUnique({
      where: { id: req.params.id },
      include: {
        pet: true,
        motionAlerts: {
          orderBy: { createdAt: 'desc' }
        },
        recordings: {
          orderBy: { createdAt: 'desc' }
        },
        petDetections: {
          take: 20,
          orderBy: { timestamp: 'desc' }
        },
      },
    });

    res.json({
      code: 200,
      data: serializeCamera(camera),
      msg: 'success'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      code: 500,
      error: '获取摄像头信息失败'
    });
  }
});

// 更新摄像头信息
router.put('/cameras/:id', validateBody(updateCameraSchema), async (req: Request, res: Response) => {
  try {
    const validation = await validateCameraOwnership(req.params.id, req.userId!);
    if (validation.error) {
      return res.status(validation.status).json({
        code: validation.status,
        error: validation.error
      });
    }

    // 验证宠物所有权（如果有变更）
    if (req.body.petId) {
      const pet = await prisma.pet.findFirst({
        where: { id: req.body.petId, userId: req.userId },
      });
      if (!pet) {
        return res.status(400).json({
          code: 400,
          error: '无效的宠物ID'
        });
      }
    }

    const { settings, ...restData } = req.body;
    const updateData: any = { ...restData };
    
    if (settings) {
      updateData.settings = JSON.stringify(settings);
    }

    const camera = await prisma.cameraDevice.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json({
      code: 200,
      data: serializeCamera(camera),
      msg: '更新成功'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      code: 500,
      error: '更新摄像头信息失败'
    });
  }
});

// 删除/解绑摄像头
router.delete('/cameras/:id', async (req: Request, res: Response) => {
  try {
    const validation = await validateCameraOwnership(req.params.id, req.userId!);
    if (validation.error) {
      return res.status(validation.status).json({
        code: validation.status,
        error: validation.error
      });
    }

    await prisma.cameraDevice.update({
      where: { id: req.params.id },
      data: { isDeleted: true },
    });

    res.json({ code: 200, msg: '解绑成功' });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      code: 500,
      error: '解绑摄像头失败'
    });
  }
});

// ==================== 告警管理 ====================

// 获取告警列表
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const alerts = await prisma.motionAlert.findMany({
      where: { userId: req.userId },
      include: { camera: true, pet: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ code: 200, data: alerts, msg: 'success' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 500, error: '获取告警列表失败' });
  }
});

// 创建告警
router.post('/alerts', validateBody(createAlertSchema), async (req: Request, res: Response) => {
  try {
    // 验证摄像头所有权
    const cameraValidation = await validateCameraOwnership(req.body.cameraId, req.userId!);
    if (cameraValidation.error) {
      return res.status(cameraValidation.status).json({
        code: cameraValidation.status,
        error: cameraValidation.error
      });
    }

    const alert = await prisma.motionAlert.create({
      data: {
        userId: req.userId!,
        ...req.body,
      },
    });

    // 高危告警创建提醒
    if (['high', 'critical'].includes(req.body.severity)) {
      const camera = await prisma.cameraDevice.findUnique({ where: { id: req.body.cameraId } });
      await prisma.reminder.create({
        data: {
          petId: req.body.petId || camera?.petId || '',
          type: 'CUSTOM',
          title: `监控告警: ${req.body.type === 'pet_in_trouble' ? '宠物异常' : '异常检测'}`,
          notes: req.body.description,
          date: new Date(),
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          repeat: 'ONCE',
        },
      });
    }

    res.status(201).json({ code: 201, data: alert, msg: '告警创建成功' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 500, error: '创建告警失败' });
  }
});

// 标记告警已处理
router.put('/alerts/:id/acknowledge', async (req: Request, res: Response) => {
  try {
    const alert = await prisma.motionAlert.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!alert) {
      return res.status(404).json({
        code: 404,
        error: '告警不存在'
      });
    }

    const updatedAlert = await prisma.motionAlert.update({
      where: { id: req.params.id },
      data: { isAcknowledged: true, acknowledgedAt: new Date() },
    });

    res.json({
      code: 200, data: updatedAlert, msg: '标记成功'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      code: 500,
      error: '标记告警失败'
    });
  }
});

// ==================== 录像管理 ====================

// 获取录像列表
router.get('/recordings', async (req: Request, res: Response) => {
  try {
    const recordings = await prisma.cameraRecording.findMany({
      where: { userId: req.userId, isDeleted: false },
      include: {
        camera: true,
        pet: true
      },
      orderBy: { createdAt: 'desc'
    });

    res.json({ code: 200, data: recordings, msg: 'success' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ code: 500, error: '获取录像列表失败' });
  }
});

// 删除录像
router.delete('/recordings/:id', async (req: Request, res: Response) => {
  try {
    const recording = await prisma.cameraRecording.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });

    if (!recording) {
      return res.status(404).json({
        code: 404,
        error: '录像不存在'
      });
    }

    await prisma.cameraRecording.update({
      where: { id: req.params.id },
      data: { isDeleted: true },
    });

    res.json({ code: 200, msg: '删除成功' });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      code: 500,
      error: '删除录像失败'
    });
  }
});

// ==================== 统计数据 ====================

// 获取统计数据
router.get('/statistics/cameras/:id/statistics', async (req: Request, res: Response) => {
  try {
    const validation = await validateCameraOwnership(req.params.id, req.userId!);
    if (validation.error) {
      return res.status(validation.status).json({
        code: validation.status,
        error: validation.error
      });
    }

    // 获取今日日期
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // 查询或创建今日统计
    let stats = await prisma.cameraStatistics.findFirst({
      where: {
        cameraId: req.params.id,
        date: todayStr,
      },
    });

    if (!stats) {
      stats = await prisma.cameraStatistics.create({
        data: {
          cameraId: req.params.id,
          date: todayStr,
          totalRecordingTime: 0,
          motionEvents: 0,
          petDetections: 0,
          averageLatency: 0,
          storageUsed: 0,
          bandwidthUsed: 0,
        },
      });
    }

    res.json({ code: 200, data: stats, msg: 'success' });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      code: 500,
      error: '获取统计数据失败'
    });
  }
});

// ==================== 跨模块联动 ====================

// 从告警创建健康记录
router.post('/alerts/:alertId/create-health-record', async (req: Request, res: Response) => {
  try {
    const alert = await prisma.motionAlert.findFirst({
      where: { id: req.params.alertId, userId: req.userId },
      include: { camera: true, pet: true },
    });

    if (!alert) {
      return res.status(404).json({
        code: 404,
        error: '告警不存在'
      });
    }

    // 使用告警关联的宠物，或者摄像头关联的宠物
    let petId = alert.petId || alert.camera.petId;

    if (!petId) {
      return res.status(400).json({
        code: 400,
        error: '未找到关联的宠物，请先关联宠物'
      });
    }

    const { title, content } = req.body;

    const healthRecord = await prisma.healthRecord.create({
      data: {
        userId: req.userId!,
        petId,
        type: 'TEXT',
        title: title || `监控告警记录: ${alert.type}`,
        content: content || alert.description,
        tags: JSON.stringify(['监控', alert.type]),
        attachments: JSON.stringify(alert.thumbnailUrl ? [alert.thumbnailUrl] : []),
        recordDate: new Date(),
      },
    });

    // 创建关联
    await prisma.alertHealthRecordLink.create({
      data: {
        alertId: alert.id,
        healthRecordId: healthRecord.id,
      },
    });

    res.status(201).json({
      code: 201,
      data: healthRecord,
      msg: '健康记录创建成功'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      code: 500,
      error: '创建健康记录失败'
    });
  }
});

export default router;
