/**
 * v2 翻译器路由
 * 高精度 AI 分析接口
 */

import { Router, Request, Response } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { body, param, query, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { aiService } from '../../services/aiService';
import { authenticateToken } from '../../middleware';
import prisma from '../../lib/prisma';
import {
  VoiceAnalyzeResponse,
  ImageAnalyzeResponse,
  MultimodalAnalyzeResponse,
  FeedbackRequest,
  FeedbackResponse,
  TrendAnalyzeResponse,
  ErrorCode,
  TrendPeriod,
} from '../../types/v2';

const router = Router();

// ==================== Multer 配置 ====================

// 内存存储配置
const storage = multer.memoryStorage();

// 文件过滤器
const audioFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype === 'audio/webm' || file.mimetype === 'audio/wav' || file.mimetype === 'audio/mp3') {
    cb(null, true);
  } else {
    cb(new Error('不支持的音频格式，仅支持 webm/wav/mp3'));
  }
};

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

// 音频上传配置（最大 10MB）
const audioUpload = multer({
  storage,
  fileFilter: audioFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// 图像上传配置（最大 5MB）
const imageUpload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// 多模态上传配置
const multimodalUpload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
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

// ==================== 反馈存储（模拟） ====================

// 在实际项目中应该存储到数据库
interface FeedbackRecord {
  id: string;
  analysisId: string;
  rating: number;
  correctedEmotion?: string;
  comment?: string;
  createdAt: Date;
}

const feedbackStore: Map<string, FeedbackRecord> = new Map();

// ==================== 路由定义 ====================

/**
 * POST /api/v2/translator/analyze-voice
 * 语音分析接口
 * 
 * 请求：
 * - audio: 音频文件 (audio/webm)
 * - petId: 宠物ID
 * - context: 上下文信息（可选）
 * 
 * 响应：
 * - emotion: 情绪类型
 * - confidence: 置信度
 * - translation: 翻译文本
 * - details: 分析详情
 * - suggestion: 建议
 * 
 * 目标延迟：< 500ms
 */
router.post(
  '/analyze-voice',
  authenticateToken,
  audioUpload.single('audio'),
  [
    body('petId').isString().notEmpty().withMessage('petId 不能为空'),
    body('context').optional().isString(),
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

      const { petId, context } = req.body;

      // 验证宠物归属
      const pet = await prisma.pet.findFirst({
        where: { id: petId, userId: req.userId },
      });

      if (!pet) {
        return res.status(404).json({
          error: '宠物不存在或无权访问',
          code: ErrorCode.PET_NOT_FOUND,
        });
      }

      // 调用 AI 服务分析语音
      const result: VoiceAnalyzeResponse = await aiService.analyzeVoice(
        req.file.buffer,
        petId,
        context
      );

      // 确保处理时间不超过目标延迟
      result.processingTime = Date.now() - startTime;

      // 记录分析结果（可选：存储到数据库）
      console.log(`[Voice Analysis] petId=${petId}, emotion=${result.emotion}, confidence=${result.confidence}, time=${result.processingTime}ms`);

      res.json(result);
    } catch (error) {
      console.error('语音分析错误:', error);
      res.status(500).json({
        error: '语音分析服务暂时不可用',
        code: ErrorCode.AI_SERVICE_ERROR,
      });
    }
  }
);

/**
 * POST /api/v2/translator/analyze-image
 * 图像分析接口
 * 
 * 请求：
 * - image: 图像文件 (image/jpeg)
 * - petId: 宠物ID
 * - context: 上下文信息（可选）
 * 
 * 响应：
 * - animalDetected: 是否检测到动物
 * - breed: 品种
 * - emotion: 情绪类型
 * - confidence: 置信度
 * - translation: 翻译文本
 * 
 * 目标延迟：< 800ms
 */
router.post(
  '/analyze-image',
  authenticateToken,
  imageUpload.single('image'),
  [
    body('petId').isString().notEmpty().withMessage('petId 不能为空'),
    body('context').optional().isString(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    
    try {
      // 检查文件上传
      if (!req.file) {
        return res.status(400).json({
          error: '请上传图像文件',
          code: ErrorCode.INVALID_REQUEST,
        });
      }

      const { petId, context } = req.body;

      // 验证宠物归属
      const pet = await prisma.pet.findFirst({
        where: { id: petId, userId: req.userId },
      });

      if (!pet) {
        return res.status(404).json({
          error: '宠物不存在或无权访问',
          code: ErrorCode.PET_NOT_FOUND,
        });
      }

      // 调用 AI 服务分析图像
      const result: ImageAnalyzeResponse = await aiService.analyzeImage(
        req.file.buffer,
        petId,
        context
      );

      // 确保处理时间不超过目标延迟
      result.processingTime = Date.now() - startTime;

      // 记录分析结果
      console.log(`[Image Analysis] petId=${petId}, emotion=${result.emotion}, confidence=${result.confidence}, time=${result.processingTime}ms`);

      res.json(result);
    } catch (error) {
      console.error('图像分析错误:', error);
      res.status(500).json({
        error: '图像分析服务暂时不可用',
        code: ErrorCode.AI_SERVICE_ERROR,
      });
    }
  }
);

/**
 * POST /api/v2/translator/analyze-multimodal
 * 多模态分析接口
 * 
 * 请求：
 * - audio: 音频文件（可选）
 * - image: 图像文件（可选）
 * - petId: 宠物ID
 * - context: 上下文信息（可选）
 * 
 * 响应：
 * - fusionResult: 融合结果
 * - singleModalResults: 单模态结果
 * - conflictAnalysis: 冲突分析
 * 
 * 目标延迟：< 1200ms
 */
router.post(
  '/analyze-multimodal',
  authenticateToken,
  multimodalUpload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'image', maxCount: 1 },
  ]),
  [
    body('petId').isString().notEmpty().withMessage('petId 不能为空'),
    body('context').optional().isString(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    
    try {
      const files = req.files as { audio?: Express.Multer.File[]; image?: Express.Multer.File[] };
      const { petId, context } = req.body;

      // 检查是否至少有一个文件
      if (!files?.audio?.[0] && !files?.image?.[0]) {
        return res.status(400).json({
          error: '请至少上传音频或图像文件',
          code: ErrorCode.INVALID_REQUEST,
        });
      }

      // 验证宠物归属
      const pet = await prisma.pet.findFirst({
        where: { id: petId, userId: req.userId },
      });

      if (!pet) {
        return res.status(404).json({
          error: '宠物不存在或无权访问',
          code: ErrorCode.PET_NOT_FOUND,
        });
      }

      // 调用 AI 服务进行多模态分析
      const result: MultimodalAnalyzeResponse = await aiService.analyzeMultimodal(
        files.audio?.[0]?.buffer || null,
        files.image?.[0]?.buffer || null,
        petId,
        context
      );

      // 确保处理时间不超过目标延迟
      result.processingTime = Date.now() - startTime;

      // 记录分析结果
      console.log(`[Multimodal Analysis] petId=${petId}, emotion=${result.fusionResult.emotion}, confidence=${result.fusionResult.confidence}, time=${result.processingTime}ms`);

      res.json(result);
    } catch (error) {
      console.error('多模态分析错误:', error);
      res.status(500).json({
        error: '多模态分析服务暂时不可用',
        code: ErrorCode.AI_SERVICE_ERROR,
      });
    }
  }
);

/**
 * POST /api/v2/translator/feedback
 * 提交分析反馈
 * 
 * 请求：
 * - analysisId: 分析ID
 * - rating: 评分 (1-5)
 * - correctedEmotion: 修正的情绪（可选）
 * - comment: 评论（可选）
 * 
 * 响应：
 * - success: 是否成功
 * - message: 消息
 * - feedbackId: 反馈ID
 */
router.post(
  '/feedback',
  authenticateToken,
  [
    body('analysisId').isString().notEmpty().withMessage('analysisId 不能为空'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('rating 必须是 1-5 的整数'),
    body('correctedEmotion').optional().isString(),
    body('comment').optional().isString(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { analysisId, rating, correctedEmotion, comment } = req.body as FeedbackRequest;

      // 创建反馈记录
      const feedbackId = uuidv4();
      const feedback: FeedbackRecord = {
        id: feedbackId,
        analysisId,
        rating,
        correctedEmotion,
        comment,
        createdAt: new Date(),
      };

      // 存储反馈（实际项目中应存储到数据库）
      feedbackStore.set(feedbackId, feedback);

      // 记录反馈
      console.log(`[Feedback] analysisId=${analysisId}, rating=${rating}, correctedEmotion=${correctedEmotion || 'N/A'}`);

      const response: FeedbackResponse = {
        success: true,
        message: '反馈提交成功，感谢您的反馈！',
        feedbackId,
      };

      res.json(response);
    } catch (error) {
      console.error('反馈提交错误:', error);
      res.status(500).json({
        error: '反馈提交失败',
        code: ErrorCode.INTERNAL_ERROR,
      });
    }
  }
);

/**
 * GET /api/v2/translator/trend/:petId
 * 获取情绪趋势分析
 * 
 * 参数：
 * - petId: 宠物ID
 * - period: 时间周期 (7d|30d|90d)
 * 
 * 响应：
 * - timeline: 时间线数据
 * - dominantEmotion: 主要情绪
 * - stability: 情绪稳定性
 * - prediction: 情绪预测
 */
router.get(
  '/trend/:petId',
  authenticateToken,
  [
    param('petId').isString().notEmpty().withMessage('petId 不能为空'),
    query('period').isIn(['7d', '30d', '90d']).withMessage('period 必须是 7d、30d 或 90d'),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { petId } = req.params;
      const period = (req.query.period as TrendPeriod) || '7d';

      // 验证宠物归属
      const pet = await prisma.pet.findFirst({
        where: { id: petId, userId: req.userId },
      });

      if (!pet) {
        return res.status(404).json({
          error: '宠物不存在或无权访问',
          code: ErrorCode.PET_NOT_FOUND,
        });
      }

      // 获取趋势分析
      const result: TrendAnalyzeResponse = await aiService.getEmotionTrend(petId, period);

      res.json(result);
    } catch (error) {
      console.error('趋势分析错误:', error);
      res.status(500).json({
        error: '趋势分析服务暂时不可用',
        code: ErrorCode.AI_SERVICE_ERROR,
      });
    }
  }
);

export default router;