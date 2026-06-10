/**
 * 声音路由
 * 处理声音记录和情绪分析相关的 API 请求
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { body, query, validationResult } from 'express-validator';
import { voicesService, EmotionType } from '../services/voicesService';
import { authenticateToken } from '../middleware';
import prisma from '../lib/prisma';

const router = Router();

// 配置 Multer 文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/temp/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// 文件过滤器
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedAudioTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/webm',
    'audio/ogg',
    'audio/aac',
    'audio/m4a',
  ];

  if (allowedAudioTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的音频格式'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
});

// 所有路由都需要认证
router.use(authenticateToken);

/**
 * GET /api/voices/:petId
 * 获取声音记忆列表
 */
router.get('/:petId', [
  query('isAnalyzed').optional().isBoolean(),
  query('emotion').optional().isIn(['HAPPY', 'SAD', 'ANGRY', 'FEARFUL', 'ANXIOUS', 'EXCITED', 'CALM', 'CONFUSED', 'PLAYFUL', 'AFFECTIONATE']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
], async (req: Request, res: Response) => {
  // 验证请求参数
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { petId } = req.params;
    const { isAnalyzed, emotion, limit, offset } = req.query;

    // 验证宠物归属
    const pet = await prisma.pet.findFirst({
      where: {
        id: petId,
        userId: req.userId,
      },
    });

    if (!pet) {
      return res.status(404).json({ error: '宠物不存在或无权访问' });
    }

    // 获取声音记录列表
    const result = await voicesService.getVoiceRecordsByPetId(petId, {
      isAnalyzed: isAnalyzed === 'true' ? true : isAnalyzed === 'false' ? false : undefined,
      emotion: emotion as EmotionType | undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json({
      records: result.records,
      total: result.total,
      limit: limit ? parseInt(limit as string) : 20,
      offset: offset ? parseInt(offset as string) : 0,
    });
  } catch (error) {
    console.error('获取声音记录列表失败:', error);
    res.status(500).json({ error: '获取声音记录列表失败' });
  }
});

/**
 * GET /api/voices/:petId/stats
 * 获取情绪统计信息
 */
router.get('/:petId/stats', async (req: Request, res: Response) => {
  try {
    const { petId } = req.params;

    // 验证宠物归属
    const pet = await prisma.pet.findFirst({
      where: {
        id: petId,
        userId: req.userId,
      },
    });

    if (!pet) {
      return res.status(404).json({ error: '宠物不存在或无权访问' });
    }

    const stats = await voicesService.getEmotionStats(petId);

    res.json({ stats });
  } catch (error) {
    console.error('获取情绪统计失败:', error);
    res.status(500).json({ error: '获取情绪统计失败' });
  }
});

/**
 * POST /api/voices/upload
 * 上传声音录音
 */
router.post('/upload', upload.single('audio'), [
  body('petId').isUUID().withMessage('宠物ID格式错误'),
  body('duration').isInt({ min: 1 }).withMessage('时长应为正整数'),
], async (req: Request, res: Response) => {
  // 验证请求参数
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { petId, duration } = req.body;

    // 检查文件是否上传
    if (!req.file) {
      return res.status(400).json({ error: '请上传音频文件' });
    }

    // 验证宠物归属
    const pet = await prisma.pet.findFirst({
      where: {
        id: petId,
        userId: req.userId,
      },
    });

    if (!pet) {
      return res.status(404).json({ error: '宠物不存在或无权访问' });
    }

    // 创建声音记录
    const voiceRecord = await voicesService.createVoiceRecord(
      {
        petId,
        duration: parseInt(duration),
      },
      req.file
    );

    res.status(201).json({
      message: '声音录音上传成功',
      record: voiceRecord,
    });
  } catch (error) {
    console.error('上传声音录音失败:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : '上传声音录音失败' });
  }
});

/**
 * GET /api/voices/detail/:id
 * 获取单个声音记录详情
 */
router.get('/detail/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const voiceRecord = await voicesService.getVoiceRecordById(id);

    if (!voiceRecord) {
      return res.status(404).json({ error: '声音记录不存在' });
    }

    // 验证宠物归属
    const pet = await prisma.pet.findFirst({
      where: {
        id: voiceRecord.petId,
        userId: req.userId,
      },
    });

    if (!pet) {
      return res.status(403).json({ error: '无权访问该声音记录' });
    }

    res.json({ record: voiceRecord });
  } catch (error) {
    console.error('获取声音记录详情失败:', error);
    res.status(500).json({ error: '获取声音记录详情失败' });
  }
});

/**
 * POST /api/voices/analyze/:id
 * 分析声音情绪
 */
router.post('/analyze/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 获取声音记录并验证归属
    const voiceRecord = await voicesService.getVoiceRecordById(id);

    if (!voiceRecord) {
      return res.status(404).json({ error: '声音记录不存在' });
    }

    const pet = await prisma.pet.findFirst({
      where: {
        id: voiceRecord.petId,
        userId: req.userId,
      },
    });

    if (!pet) {
      return res.status(403).json({ error: '无权分析该声音记录' });
    }

    // 分析声音情绪
    const analysisResult = await voicesService.analyzeVoice(id);

    res.json({
      message: '声音情绪分析完成',
      analysis: analysisResult,
    });
  } catch (error) {
    console.error('分析声音情绪失败:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : '分析声音情绪失败' });
  }
});

/**
 * POST /api/voices/analyze-batch/:petId
 * 批量分析未分析的声音记录
 */
router.post('/analyze-batch/:petId', async (req: Request, res: Response) => {
  try {
    const { petId } = req.params;

    // 验证宠物归属
    const pet = await prisma.pet.findFirst({
      where: {
        id: petId,
        userId: req.userId,
      },
    });

    if (!pet) {
      return res.status(404).json({ error: '宠物不存在或无权访问' });
    }

    // 批量分析
    const count = await voicesService.analyzePendingRecords(petId);

    res.json({
      message: `成功分析了 ${count} 条声音记录`,
      count,
    });
  } catch (error) {
    console.error('批量分析声音失败:', error);
    res.status(500).json({ error: '批量分析声音失败' });
  }
});

/**
 * DELETE /api/voices/:id
 * 删除声音记录
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 获取声音记录并验证归属
    const voiceRecord = await voicesService.getVoiceRecordById(id);

    if (!voiceRecord) {
      return res.status(404).json({ error: '声音记录不存在' });
    }

    const pet = await prisma.pet.findFirst({
      where: {
        id: voiceRecord.petId,
        userId: req.userId,
      },
    });

    if (!pet) {
      return res.status(403).json({ error: '无权删除该声音记录' });
    }

    // 删除声音记录
    const success = await voicesService.deleteVoiceRecord(id);

    if (success) {
      res.json({ message: '声音记录删除成功' });
    } else {
      res.status(500).json({ error: '删除声音记录失败' });
    }
  } catch (error) {
    console.error('删除声音记录失败:', error);
    res.status(500).json({ error: '删除声音记录失败' });
  }
});

export default router;