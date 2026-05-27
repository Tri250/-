import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middleware';

const router = Router();

router.use(authenticateToken);

const BEHAVIOR_TYPES = [
  'eating', 'drinking', 'sleeping', 'playing', 'grooming', 'walking', 
  'running', 'jumping', 'scratching', 'digging', 'barking', 'meowing',
  'purring', 'hissing', 'coughing', 'vomiting', 'limping', 'resting',
  'exploring', 'hiding', 'begging', 'marking', 'chasing', 'fighting'
];

router.post(
  '/record',
  [
    body('petId').isString().withMessage('宠物ID不能为空'),
    body('behaviorType').isIn(BEHAVIOR_TYPES).withMessage('无效的行为类型'),
    body('confidence').isFloat({ min: 0, max: 1 }).withMessage('置信度必须在0-1之间'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        code: 400,
        message: '请求验证失败',
        errors: errors.array().map((err: any) => ({
          field: 'path' in err ? err.path : 'unknown',
          message: err.msg
        })),
        timestamp: new Date().toISOString()
      });
    }

    try {
      const { petId, behaviorType, confidence, duration, metadata } = req.body;

      const pet = await prisma.pet.findFirst({
        where: { id: petId, userId: req.userId },
      });

      if (!pet) {
        return res.status(404).json({ 
          code: 404,
          message: '宠物不存在',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      const behaviorEvent = await prisma.behaviorEvent.create({
        data: {
          petId,
          behaviorType,
          confidence,
          timestamp: new Date(),
          duration,
          metadata: JSON.stringify(metadata || {}),
        },
      });

      await analyzeBehaviorAndGenerateAlerts(petId, behaviorType, confidence);

      res.json({ 
        code: 200,
        message: '行为记录成功',
        data: { behaviorEvent },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ 
        code: 500,
        message: '记录行为失败',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
  }
);

router.post(
  '/analyze-emotion',
  [
    body('petId').isString().withMessage('宠物ID不能为空'),
    body('source').isIn(['video', 'audio', 'image']).withMessage('无效的数据源'),
    body('emotionType').isIn(['happy', 'anxious', 'angry', 'needs', 'neutral', 'pain', 'excited']).withMessage('无效的情绪类型'),
    body('confidence').isFloat({ min: 0, max: 1 }).withMessage('置信度必须在0-1之间'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        code: 400,
        message: '请求验证失败',
        errors: errors.array().map((err: any) => ({
          field: 'path' in err ? err.path : 'unknown',
          message: err.msg
        })),
        timestamp: new Date().toISOString()
      });
    }

    try {
      const { petId, source, emotionType, confidence, imageUrl, voiceUrl, behaviorEventId } = req.body;

      const pet = await prisma.pet.findFirst({
        where: { id: petId, userId: req.userId },
      });

      if (!pet) {
        return res.status(404).json({ 
          code: 404,
          message: '宠物不存在',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      const emotionRecord = await prisma.emotionRecord.create({
        data: {
          petId,
          emotionType,
          source,
          confidence,
          timestamp: new Date(),
          imageUrl,
          voiceUrl,
          behaviorEventId,
        },
      });

      await prisma.pet.update({
        where: { id: petId },
        data: { healthStatus: mapEmotionToHealthStatus(emotionType) },
      });

      res.json({ 
        code: 200,
        message: '情绪分析成功',
        data: { emotionRecord },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ 
        code: 500,
        message: '情绪分析失败',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
  }
);

router.post(
  '/multimodal-analyze',
  [
    body('petId').isString().withMessage('宠物ID不能为空'),
  ],
  async (req: Request, res: Response) => {
    try {
      const { petId, behaviorData, voiceData, imageData } = req.body;

      const pet = await prisma.pet.findFirst({
        where: { id: petId, userId: req.userId },
      });

      if (!pet) {
        return res.status(404).json({ 
          code: 404,
          message: '宠物不存在',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      const fusionResult = performMultimodalFusion(behaviorData, voiceData, imageData, pet);

      if (fusionResult.shouldAlert) {
        await prisma.healthAlert.create({
          data: {
            petId,
            type: fusionResult.alertType,
            severity: fusionResult.severity,
            message: fusionResult.message,
            recommendation: fusionResult.recommendation,
            timestamp: new Date(),
          },
        });
      }

      res.json({ 
        code: 200,
        message: '三模融合分析成功',
        data: fusionResult,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ 
        code: 500,
        message: '三模融合分析失败',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
  }
);

router.get('/events/:petId', async (req: Request, res: Response) => {
  try {
    const pet = await prisma.pet.findFirst({
      where: { id: req.params.petId, userId: req.userId },
    });

    if (!pet) {
      return res.status(404).json({ 
        code: 404,
        message: '宠物不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const events = await prisma.behaviorEvent.findMany({
      where: { petId: req.params.petId },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    res.json({ 
      code: 200,
      message: '获取行为事件成功',
      data: { events },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '获取行为事件失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/emotions/:petId', async (req: Request, res: Response) => {
  try {
    const pet = await prisma.pet.findFirst({
      where: { id: req.params.petId, userId: req.userId },
    });

    if (!pet) {
      return res.status(404).json({ 
        code: 404,
        message: '宠物不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const emotions = await prisma.emotionRecord.findMany({
      where: { petId: req.params.petId },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    res.json({ 
      code: 200,
      message: '获取情绪记录成功',
      data: { emotions },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '获取情绪记录失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

async function analyzeBehaviorAndGenerateAlerts(petId: string, behaviorType: string, confidence: number) {
  const alertConditions = [
    { behavior: 'coughing', minConfidence: 0.85, severity: 'high', message: '检测到频繁咳嗽', recommendation: '建议观察咳嗽频率，如有持续请就医' },
    { behavior: 'vomiting', minConfidence: 0.8, severity: 'high', message: '检测到呕吐行为', recommendation: '请检查饮食，如持续呕吐请立即就医' },
    { behavior: 'limping', minConfidence: 0.8, severity: 'medium', message: '检测到跛行行为', recommendation: '检查宠物腿部是否受伤，必要时就医' },
    { behavior: 'hiding', minConfidence: 0.9, severity: 'medium', message: '宠物长时间躲藏', recommendation: '检查环境是否有变化，关注宠物情绪' },
    { behavior: 'scratching', minConfidence: 0.95, severity: 'medium', message: '过度抓挠行为', recommendation: '检查皮肤是否有寄生虫或过敏' },
  ];

  const condition = alertConditions.find(c => c.behavior === behaviorType && confidence >= c.minConfidence);
  
  if (condition) {
    await prisma.healthAlert.create({
      data: {
        petId,
        type: behaviorType,
        severity: condition.severity,
        message: condition.message,
        recommendation: condition.recommendation,
        timestamp: new Date(),
      },
    });
  }
}

function mapEmotionToHealthStatus(emotion: string): string {
  const emotionMap: Record<string, string> = {
    happy: 'EXCELLENT',
    excited: 'EXCELLENT',
    neutral: 'GOOD',
    needs: 'FAIR',
    anxious: 'FAIR',
    angry: 'CONCERN',
    pain: 'CONCERN',
  };
  return emotionMap[emotion] || 'GOOD';
}

function performMultimodalFusion(behaviorData: any, voiceData: any, imageData: any, pet: any) {
  const behaviors = behaviorData?.behaviors || [];
  const voiceEmotion = voiceData?.emotion;
  const facialExpression = imageData?.expression;

  const coughing = behaviors.find((b: any) => b.type === 'coughing' && b.confidence > 0.8);
  const scratching = behaviors.find((b: any) => b.type === 'scratching' && b.confidence > 0.9);
  const abnormalPupils = facialExpression === 'wide_pupils';

  if (coughing && voiceEmotion === 'pain' && abnormalPupils) {
    return {
      overallEmotion: 'pain',
      confidence: 0.92,
      shouldAlert: true,
      alertType: 'respiratory_concern',
      severity: 'high',
      message: '多模态检测显示宠物可能处于疼痛状态并伴有呼吸问题',
      recommendation: '请立即联系兽医进行检查',
    };
  }

  if (scratching && voiceEmotion === 'anxious') {
    return {
      overallEmotion: 'anxious',
      confidence: 0.88,
      shouldAlert: true,
      alertType: 'skin_issue',
      severity: 'medium',
      message: '检测到过度抓挠行为，可能存在皮肤问题',
      recommendation: '检查宠物皮肤，考虑驱虫或过敏测试',
    };
  }

  return {
    overallEmotion: 'neutral',
    confidence: 0.75,
    shouldAlert: false,
    alertType: null,
    severity: null,
    message: '宠物状态正常',
    recommendation: null,
  };
}

export default router;
