/**
 * v2 AI 检测路由
 * 提供宠物检测、行为分析、声音检测、环境监控和事件聚合接口
 */

import { Router, Request, Response } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { body, param, query, validationResult } from 'express-validator';
import { detectionService } from '../../services/detectionService';
import { authenticateToken } from '../../middleware';
import {
  PetDetectionRequest,
  BehaviorAnalysisRequest,
  SoundDetectionRequest,
  EnvironmentMonitorRequest,
  EventAggregateRequest,
  ErrorCode,
  BehaviorType,
  SoundType,
} from '../../types/v2-streaming';

const router = Router();

// ==================== Multer 配置 ====================

// 内存存储配置
const storage = multer.memoryStorage();

// 图像文件过滤器
const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/webp') {
    cb(null, true);
  } else {
    cb(new Error('不支持的图像格式，仅支持 jpeg/png/webp'));
  }
};

// 音频文件过滤器
const audioFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype === 'audio/webm' || file.mimetype === 'audio/wav' || file.mimetype === 'audio/mp3' || file.mimetype === 'audio/mpeg') {
    cb(null, true);
  } else {
    cb(new Error('不支持的音频格式，仅支持 webm/wav/mp3'));
  }
};

// 视频帧上传配置（最大 5MB）
const frameUpload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// 多帧上传配置（最大 50MB）
const multiFrameUpload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

// 音频上传配置（最大 10MB）
const audioUpload = multer({
  storage,
  fileFilter: audioFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ==================== 验证中间件 ====================

/**
 * 验证错误处理中间件
 */
const handleValidationErrors = (req: Request, res: Response, next: Function) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: '请求参数验证失败',
      code: ErrorCode.INVALID_REQUEST,
      details: errors.array(),
    });
  }
  next();
};

// ==================== 宠物检测路由 ====================

/**
 * POST /api/v2/detection/pet
 * 宠物检测（接收视频帧）
 * 
 * 请求：
 * - frame: 视频帧文件 (image/jpeg/png/webp)
 * - deviceId: 设备ID
 * - timestamp: 时间戳（可选）
 * 
 * 响应：
 * - detected: 是否检测到宠物
 * - confidence: 置信度
 * - boundingBox: 边界框
 * - class: 宠物类别
 * - breed: 品种
 * - breedConfidence: 品种置信度
 * - trackingId: 追踪ID
 * - attributes: 宠物属性
 * - processingTime: 处理时间
 * - timestamp: 时间戳
 */
router.post(
  '/pet',
  authenticateToken,
  frameUpload.single('frame'),
  [
    body('deviceId').isString().notEmpty().withMessage('deviceId 不能为空'),
    body('timestamp').optional().isString().withMessage('timestamp 必须是字符串'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    
    try {
      // 检查文件上传
      if (!req.file) {
        return res.status(400).json({
          error: '请上传视频帧文件',
          code: ErrorCode.INVALID_REQUEST,
        });
      }

      const request: PetDetectionRequest = {
        deviceId: req.body.deviceId,
        timestamp: req.body.timestamp || new Date().toISOString(),
      };

      // 调用检测服务进行宠物检测
      const result = await detectionService.detectPet(req.file.buffer, request);

      // 确保处理时间不超过目标延迟
      result.processingTime = Date.now() - startTime;

      console.log(`[Pet Detection] deviceId=${request.deviceId}, detected=${result.detected}, confidence=${result.confidence}, time=${result.processingTime}ms`);

      res.json(result);
    } catch (error) {
      console.error('宠物检测错误:', error);
      res.status(500).json({
        error: '宠物检测服务暂时不可用',
        code: ErrorCode.AI_SERVICE_ERROR,
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  }
);

// ==================== 行为分析路由 ====================

/**
 * POST /api/v2/detection/behavior
 * 行为分析（接收视频帧序列）
 * 
 * 请求：
 * - frames: 视频帧文件数组 (image/jpeg/png/webp)
 * - deviceId: 设备ID
 * - frameCount: 帧数量
 * - timeRange: 时间范围（可选，秒）
 * 
 * 响应：
 * - eventId: 事件ID
 * - behaviorType: 行为类型
 * - confidence: 置信度
 * - startTime: 开始时间
 * - endTime: 结束时间
 * - duration: 持续时间
 * - severity: 严重程度
 * - description: 描述
 * - suggestions: 建议
 * - relatedFrames: 相关帧ID
 */
router.post(
  '/behavior',
  authenticateToken,
  multiFrameUpload.array('frames', 30),  // 最多 30 帧
  [
    body('deviceId').isString().notEmpty().withMessage('deviceId 不能为空'),
    body('frameCount').optional().isInt({ min: 1, max: 30 }).withMessage('frameCount 必须是 1-30 的整数'),
    body('timeRange').optional().isInt({ min: 1, max: 60 }).withMessage('timeRange 必须是 1-60 的整数'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    
    try {
      // 检查文件上传
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({
          error: '请上传视频帧序列',
          code: ErrorCode.INVALID_REQUEST,
        });
      }

      const request: BehaviorAnalysisRequest = {
        deviceId: req.body.deviceId,
        frameCount: parseInt(req.body.frameCount || req.files.length, 10),
        timeRange: parseInt(req.body.timeRange || '10', 10),
      };

      // 获取帧数据
      const frameBuffers = req.files.map(file => file.buffer);

      // 调用检测服务进行行为分析
      const result = await detectionService.analyzeBehavior(frameBuffers, request);

      const processingTime = Date.now() - startTime;

      console.log(`[Behavior Analysis] deviceId=${request.deviceId}, events=${result.length}, time=${processingTime}ms`);

      res.json({
        events: result,
        processingTime,
        deviceId: request.deviceId,
      });
    } catch (error) {
      console.error('行为分析错误:', error);
      res.status(500).json({
        error: '行为分析服务暂时不可用',
        code: ErrorCode.AI_SERVICE_ERROR,
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  }
);

// ==================== 声音检测路由 ====================

/**
 * POST /api/v2/detection/sound
 * 声音检测（接收音频数据）
 * 
 * 请求：
 * - audio: 音频文件 (audio/webm/wav/mp3)
 * - deviceId: 设备ID
 * - duration: 音频时长（可选，秒）
 * 
 * 响应：
 * - eventId: 事件ID
 * - soundType: 声音类型
 * - confidence: 置信度
 * - timestamp: 时间戳
 * - duration: 持续时间
 * - intensity: 强度
 * - frequency: 主频率
 * - description: 描述
 * - alert: 是否需要告警
 * - suggestions: 建议
 */
router.post(
  '/sound',
  authenticateToken,
  audioUpload.single('audio'),
  [
    body('deviceId').isString().notEmpty().withMessage('deviceId 不能为空'),
    body('duration').optional().isInt({ min: 1, max: 60 }).withMessage('duration 必须是 1-60 的整数'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    
    try {
      // 检查文件上传
      if (!req.file) {
        return res.status(400).json({
          error: '请上传音频文件',
          code: ErrorCode.INVALID_REQUEST,
        });
      }

      const request: SoundDetectionRequest = {
        deviceId: req.body.deviceId,
        duration: parseInt(req.body.duration || '5', 10),
      };

      // 调用检测服务进行声音检测
      const result = await detectionService.detectSound(req.file.buffer, request);

      const processingTime = Date.now() - startTime;

      console.log(`[Sound Detection] deviceId=${request.deviceId}, events=${result.length}, time=${processingTime}ms`);

      res.json({
        events: result,
        processingTime,
        deviceId: request.deviceId,
      });
    } catch (error) {
      console.error('声音检测错误:', error);
      res.status(500).json({
        error: '声音检测服务暂时不可用',
        code: ErrorCode.AI_SERVICE_ERROR,
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  }
);

// ==================== 环境监控路由 ====================

/**
 * POST /api/v2/detection/environment
 * 环境监控
 * 
 * 请求：
 * - deviceId: 设备ID
 * - metrics: 监控指标数组（可选）
 * 
 * 响应：
 * - deviceId: 设备ID
 * - timestamp: 时间戳
 * - metrics: 环境指标数据
 * - alerts: 环境告警
 * - recommendations: 建议
 */
router.post(
  '/environment',
  authenticateToken,
  [
    body('deviceId').isString().notEmpty().withMessage('deviceId 不能为空'),
    body('metrics').optional().isArray().withMessage('metrics 必须是数组'),
    body('metrics.*').optional().isIn(['temperature', 'humidity', 'light', 'noise', 'air_quality']).withMessage('metrics 元素必须是有效的环境指标'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const request: EnvironmentMonitorRequest = {
        deviceId: req.body.deviceId,
        metrics: req.body.metrics,
      };

      // 调用检测服务进行环境监控
      const result = await detectionService.monitorEnvironment(request);

      console.log(`[Environment Monitor] deviceId=${request.deviceId}, alerts=${result.alerts.length}`);

      res.json(result);
    } catch (error) {
      console.error('环境监控错误:', error);
      res.status(500).json({
        error: '环境监控服务暂时不可用',
        code: ErrorCode.AI_SERVICE_ERROR,
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  }
);

// ==================== 事件聚合路由 ====================

/**
 * POST /api/v2/detection/aggregate
 * 事件聚合和 LLM 解读
 * 
 * 请求：
 * - deviceId: 设备ID
 * - timeRange: 时间范围（秒）
 * - eventTypes: 事件类型过滤（可选）
 * 
 * 响应：
 * - deviceId: 设备ID
 * - timeRange: 时间范围
 * - summary: 事件摘要
 * - timeline: 聚合事件时间线
 * - llmInterpretation: LLM 解读结果
 * - recommendations: 建议
 * - generatedAt: 生成时间
 */
router.post(
  '/aggregate',
  authenticateToken,
  [
    body('deviceId').isString().notEmpty().withMessage('deviceId 不能为空'),
    body('timeRange').isInt({ min: 10, max: 3600 }).withMessage('timeRange 必须是 10-3600 的整数'),
    body('eventTypes').optional().isArray().withMessage('eventTypes 必须是数组'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    
    try {
      const request: EventAggregateRequest = {
        deviceId: req.body.deviceId,
        timeRange: parseInt(req.body.timeRange, 10),
        eventTypes: req.body.eventTypes,
      };

      // 调用检测服务进行事件聚合
      const result = await detectionService.aggregateEvents(request);

      const processingTime = Date.now() - startTime;

      console.log(`[Event Aggregate] deviceId=${request.deviceId}, timeRange=${request.timeRange}s, totalEvents=${result.summary.totalEvents}, time=${processingTime}ms`);

      res.json({
        ...result,
        processingTime,
      });
    } catch (error) {
      console.error('事件聚合错误:', error);
      res.status(500).json({
        error: '事件聚合服务暂时不可用',
        code: ErrorCode.AI_SERVICE_ERROR,
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  }
);

// ==================== 批量检测路由 ====================

/**
 * POST /api/v2/detection/batch/pet
 * 批量宠物检测
 * 
 * 请求：
 * - frames: 视频帧文件数组 (image/jpeg/png/webp)
 * - deviceId: 设备ID
 * 
 * 响应：
 * - results: 检测结果数组
 * - processingTime: 总处理时间
 */
router.post(
  '/batch/pet',
  authenticateToken,
  multiFrameUpload.array('frames', 10),  // 最多 10 帧
  [
    body('deviceId').isString().notEmpty().withMessage('deviceId 不能为空'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    
    try {
      // 检查文件上传
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({
          error: '请上传视频帧文件',
          code: ErrorCode.INVALID_REQUEST,
        });
      }

      const deviceId = req.body.deviceId;

      // 批量处理
      const results = [];
      for (const file of req.files) {
        const request: PetDetectionRequest = {
          deviceId,
          timestamp: new Date().toISOString(),
        };
        const result = await detectionService.detectPet(file.buffer, request);
        results.push(result);
      }

      const processingTime = Date.now() - startTime;

      console.log(`[Batch Pet Detection] deviceId=${deviceId}, count=${results.length}, time=${processingTime}ms`);

      res.json({
        results,
        processingTime,
        deviceId,
        count: results.length,
      });
    } catch (error) {
      console.error('批量宠物检测错误:', error);
      res.status(500).json({
        error: '批量宠物检测服务暂时不可用',
        code: ErrorCode.AI_SERVICE_ERROR,
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  }
);

// ==================== 检测历史路由 ====================

/**
 * GET /api/v2/detection/history/:deviceId
 * 获取检测历史
 * 
 * 参数：
 * - deviceId: 设备ID
 * - type: 检测类型（可选：pet/behavior/sound）
 * - limit: 返回数量限制（可选）
 * 
 * 响应：
 * - deviceId: 设备ID
 * - type: 检测类型
 * - items: 检测结果数组
 */
router.get(
  '/history/:deviceId',
  authenticateToken,
  [
    param('deviceId').isString().notEmpty().withMessage('deviceId 不能为空'),
    query('type').optional().isIn(['pet', 'behavior', 'sound']).withMessage('type 必须是 pet、behavior 或 sound'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit 必须是 1-100 的整数'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { deviceId } = req.params;
      const type = req.query.type as string | undefined;
      const limit = parseInt(req.query.limit as string || '20', 10);

      // 获取历史数据（从服务中获取）
      // 这里返回模拟的历史数据结构
      const history = {
        deviceId,
        type: type || 'all',
        items: [],
        total: 0,
        limit,
      };

      console.log(`[Detection History] deviceId=${deviceId}, type=${type || 'all'}, limit=${limit}`);

      res.json(history);
    } catch (error) {
      console.error('获取检测历史错误:', error);
      res.status(500).json({
        error: '获取检测历史失败',
        code: ErrorCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  }
);

export default router;