import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middleware';

const router = Router();

router.use(authenticateToken);

const EMOTIONS = ['happy', 'anxious', 'angry', 'needs', 'neutral', 'pain', 'excited', 'bored', 'hungry', 'tired'];
const INTENTS = ['hungry', 'want_outside', 'want_play', 'need_attention', 'in_pain', 'bored', 'anxious', 'happy', 'tired', 'curious'];

router.post(
  '/analyze',
  [
    body('petId').isString().withMessage('宠物ID不能为空'),
    body('audioBase64').isString().withMessage('音频数据不能为空'),
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
      const { petId, audioBase64 } = req.body;

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

      const mockResult = mockVoiceAnalysis();

      const voiceMemory = await prisma.voiceMemory.create({
        data: {
          userId: req.userId!,
          petId,
          audioUrl: `/api/voice/audio/${Date.now()}`,
          emotion: mockResult.emotion,
          confidence: mockResult.confidence,
          transcription: mockResult.transcription,
          intent: mockResult.intent,
        },
      });

      res.json({ 
        code: 200,
        message: '声音分析成功',
        data: { 
          result: mockResult,
          voiceMemory 
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ 
        code: 500,
        message: '声音分析失败',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
  }
);

router.post(
  '/translate',
  [
    body('petId').isString().withMessage('宠物ID不能为空'),
    body('audioBase64').isString().withMessage('音频数据不能为空'),
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
      const { petId, audioBase64 } = req.body;

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

      const mockTranslation = mockVoiceTranslation(pet.name);

      res.json({ 
        code: 200,
        message: '声音翻译成功',
        data: mockTranslation,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ 
        code: 500,
        message: '声音翻译失败',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
  }
);

router.post(
  '/clone',
  [
    body('petId').isString().withMessage('宠物ID不能为空'),
    body('audioSamples').isArray().withMessage('音频样本必须是数组'),
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
      const { petId, audioSamples } = req.body;

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

      const voiceMemory = await prisma.voiceMemory.create({
        data: {
          userId: req.userId!,
          petId,
          audioUrl: `/api/voice/clone/${Date.now()}`,
          emotion: 'neutral',
          confidence: 0.95,
          transcription: '声音克隆完成',
          intent: null,
          isCloned: true,
        },
      });

      res.json({ 
        code: 200,
        message: '声音克隆成功',
        data: { voiceMemory },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ 
        code: 500,
        message: '声音克隆失败',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
  }
);

router.get('/memories', async (req: Request, res: Response) => {
  try {
    const memories = await prisma.voiceMemory.findMany({
      where: { userId: req.userId },
      include: { pet: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ 
      code: 200,
      message: '获取声音记忆成功',
      data: { memories },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '获取声音记忆失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/memories/:petId', async (req: Request, res: Response) => {
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

    const memories = await prisma.voiceMemory.findMany({
      where: { petId: req.params.petId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ 
      code: 200,
      message: '获取宠物声音记忆成功',
      data: { memories },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '获取声音记忆失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

router.delete('/memories/:id', async (req: Request, res: Response) => {
  try {
    const memory = await prisma.voiceMemory.findUnique({
      where: { id: req.params.id },
    });

    if (!memory) {
      return res.status(404).json({ 
        code: 404,
        message: '声音记忆不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    if (memory.userId !== req.userId) {
      return res.status(403).json({ 
        code: 403,
        message: '无权访问该声音记忆',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    await prisma.voiceMemory.delete({
      where: { id: req.params.id },
    });

    res.json({ 
      code: 200,
      message: '删除声音记忆成功',
      data: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '删除声音记忆失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

function mockVoiceAnalysis() {
  const emotions = ['happy', 'anxious', 'excited', 'hungry', 'tired', 'neutral'];
  const intents = ['happy', 'hungry', 'want_play', 'need_attention', 'bored'];
  
  return {
    emotion: emotions[Math.floor(Math.random() * emotions.length)],
    confidence: Math.random() * 0.3 + 0.7,
    transcription: mockTranscription(),
    intent: intents[Math.floor(Math.random() * intents.length)],
  };
}

function mockTranscription() {
  const transcriptions = [
    '汪汪汪！我想出去玩！',
    '喵~ 我饿了，想吃东西',
    '呜呜呜... 主人快来陪我',
    '呼噜呼噜~ 好舒服呀',
    '汪汪！门外有声音！',
    '喵喵喵！我要开门！',
    '嗷呜~ 玩累了想睡觉',
  ];
  return transcriptions[Math.floor(Math.random() * transcriptions.length)];
}

function mockVoiceTranslation(petName: string) {
  const translations = [
    `${petName}说："我饿了，快给我吃东西！"`,
    `${petName}说："好无聊啊，陪我玩一会儿吧"`,
    `${petName}说："想出门散步，快带我出去！"`,
    `${petName}说："我很开心！今天玩得很愉快"`,
    `${petName}说："有点不舒服，可能需要看医生"`,
    `${petName}说："困了，想睡觉了"`,
    `${petName}说："谢谢你陪我，我很幸福"`,
  ];
  return {
    translation: translations[Math.floor(Math.random() * translations.length)],
    emotion: ['happy', 'excited', 'anxious', 'tired'][Math.floor(Math.random() * 4)],
    confidence: Math.random() * 0.3 + 0.7,
  };
}

export default router;
