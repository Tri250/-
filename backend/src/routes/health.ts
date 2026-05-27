import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middleware';

const router = Router();

router.use(authenticateToken);

router.get('/alerts/:petId', async (req: Request, res: Response) => {
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

    const alerts = await prisma.healthAlert.findMany({
      where: { petId: req.params.petId },
      orderBy: { timestamp: 'desc' },
    });

    res.json({ 
      code: 200,
      message: '获取健康预警成功',
      data: { alerts },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '获取健康预警失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/alerts/:id/resolve', async (req: Request, res: Response) => {
  try {
    const alert = await prisma.healthAlert.findUnique({
      where: { id: req.params.id },
      include: { pet: true },
    });

    if (!alert) {
      return res.status(404).json({ 
        code: 404,
        message: '预警不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    if (alert.pet.userId !== req.userId) {
      return res.status(403).json({ 
        code: 403,
        message: '无权访问该预警',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const updatedAlert = await prisma.healthAlert.update({
      where: { id: req.params.id },
      data: { isResolved: true, resolvedAt: new Date() },
    });

    res.json({ 
      code: 200,
      message: '预警已处理',
      data: { alert: updatedAlert },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '处理预警失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/diagnose', [
  body('petId').isString().withMessage('宠物ID不能为空'),
  body('symptoms').isArray().withMessage('症状必须是数组'),
], async (req: Request, res: Response) => {
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
    const { petId, symptoms, age, weight, breed } = req.body;

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

    const diagnosis = mockAIDiagnosis(symptoms, breed || pet.breed);

    res.json({ 
      code: 200,
      message: 'AI诊断完成',
      data: diagnosis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: 'AI诊断失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/journal/:petId', async (req: Request, res: Response) => {
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

    const journals = await prisma.dailyJournal.findMany({
      where: { petId: req.params.petId },
      orderBy: { date: 'desc' },
      take: 30,
    });

    res.json({ 
      code: 200,
      message: '获取宠物日记成功',
      data: { journals },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '获取宠物日记失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/journal/generate/:petId', async (req: Request, res: Response) => {
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingJournal = await prisma.dailyJournal.findFirst({
      where: { petId: req.params.petId, date: today },
    });

    if (existingJournal) {
      return res.status(409).json({ 
        code: 409,
        message: '今日日记已生成',
        data: { journal: existingJournal },
        timestamp: new Date().toISOString()
      });
    }

    const journal = await generateDailyJournal(req.params.petId, pet);

    res.json({ 
      code: 200,
      message: '日记生成成功',
      data: { journal },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '生成日记失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

async function generateDailyJournal(petId: string, pet: any) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const behaviorEvents = await prisma.behaviorEvent.findMany({
    where: { 
      petId,
      timestamp: { gte: today },
    },
  });

  const emotionRecords = await prisma.emotionRecord.findMany({
    where: { 
      petId,
      timestamp: { gte: today },
    },
  });

  const behaviorCounts: Record<string, number> = {};
  behaviorEvents.forEach(event => {
    behaviorCounts[event.behaviorType] = (behaviorCounts[event.behaviorType] || 0) + 1;
  });

  const emotionCounts: Record<string, number> = {};
  emotionRecords.forEach(record => {
    emotionCounts[record.emotionType] = (emotionCounts[record.emotionType] || 0) + 1;
  });

  const healthScore = Math.floor(Math.random() * 15) + 80;
  const activityScore = Object.keys(behaviorCounts).length * 15 + Math.floor(Math.random() * 20);
  const emotionScore = calculateEmotionScore(emotionCounts);

  const highlights = [];
  if (behaviorCounts['playing'] && behaviorCounts['playing'] > 2) {
    highlights.push(`${pet.name}今天玩得很开心！`);
  }
  if (behaviorCounts['eating'] && behaviorCounts['eating'] >= 2) {
    highlights.push(`${pet.name}食欲不错，进食${behaviorCounts['eating']}次`);
  }
  if (emotionCounts['happy'] && emotionCounts['happy'] > emotionCounts['anxious']) {
    highlights.push(`${pet.name}今天心情很好`);
  }

  const summary = generateSummary(pet.name, behaviorCounts, emotionCounts, healthScore);

  return prisma.dailyJournal.create({
    data: {
      petId,
      date: today,
      summary,
      highlights: JSON.stringify(highlights),
      healthScore,
      activityScore: Math.min(activityScore, 100),
      emotionScore,
      events: JSON.stringify(behaviorEvents.slice(0, 10)),
    },
  });
}

function calculateEmotionScore(emotionCounts: Record<string, number>): number {
  const weights: Record<string, number> = {
    happy: 2,
    excited: 2,
    neutral: 1,
    needs: 0,
    anxious: -1,
    angry: -2,
    pain: -3,
  };

  let score = 50;
  Object.entries(emotionCounts).forEach(([emotion, count]) => {
    score += (weights[emotion] || 0) * count * 5;
  });

  return Math.max(0, Math.min(100, score));
}

function generateSummary(name: string, behaviors: Record<string, number>, emotions: Record<string, number>, healthScore: number): string {
  const summaries = [
    `${name}今天状态很好，健康评分${healthScore}分。`,
    `${name}今天表现不错，各项指标正常。`,
    `${name}今天活动量充足，心情愉悦。`,
    `${name}今天整体状态良好，继续保持。`,
    `${name}今天的健康评分是${healthScore}分，身体状况稳定。`,
  ];

  if (behaviors['sleeping'] && behaviors['sleeping'] > 3) {
    return `${name}今天睡了不少时间，看起来很放松。健康评分${healthScore}分。`;
  }

  if (behaviors['playing'] && behaviors['playing'] > behaviors['resting']) {
    return `${name}今天活力充沛，玩得很开心！健康评分${healthScore}分。`;
  }

  return summaries[Math.floor(Math.random() * summaries.length)];
}

function mockAIDiagnosis(symptoms: string[], breed?: string): any {
  const symptomMap: Record<string, { conditions: string[], recommendations: string[] }> = {
    '呕吐': {
      conditions: ['饮食不当', '肠胃不适', '毛球症', '传染病'],
      recommendations: ['暂时禁食2-4小时', '少量多次饮水', '观察呕吐频率', '如有血便立即就医'],
    },
    '腹泻': {
      conditions: ['食物过敏', '寄生虫', '细菌感染', '应激反应'],
      recommendations: ['补充水分防脱水', '清淡饮食', '观察粪便颜色', '持续2天以上建议就医'],
    },
    '咳嗽': {
      conditions: ['呼吸道感染', '支气管炎', '过敏', '心丝虫'],
      recommendations: ['保持环境湿润', '避免烟雾刺激', '观察咳嗽频率', '持续一周建议就医'],
    },
    '脱毛': {
      conditions: ['季节性换毛', '皮肤寄生虫', '食物过敏', '甲状腺问题'],
      recommendations: ['定期梳毛', '检查皮肤是否红肿', '注意饮食', '严重时就医检查'],
    },
    '食欲不振': {
      conditions: ['口腔问题', '肠胃问题', '发热', '应激'],
      recommendations: ['检查口腔', '尝试不同食物', '测体温', '超过24小时不进食建议就医'],
    },
    '精神萎靡': {
      conditions: ['发热', '疼痛', '贫血', '感染'],
      recommendations: ['测体温', '观察其他症状', '保持温暖舒适', '持续24小时建议就医'],
    },
  };

  const primarySymptom = symptoms[0];
  const info = symptomMap[primarySymptom] || {
    conditions: ['需要更多信息'],
    recommendations: ['观察症状变化', '记录相关信息', '必要时就医'],
  };

  const breedRisks: Record<string, string[]> = {
    '折耳猫': ['软骨发育不良'],
    '柯基': ['椎间盘突出'],
    '法斗': ['呼吸道问题', '皮肤问题'],
    '金毛': ['髋关节发育不良'],
    '泰迪': ['牙齿问题'],
  };

  const breedRisk = breed ? breedRisks[breed] || [] : [];

  return {
    symptoms,
    breed,
    possibleConditions: [...info.conditions, ...breedRisk],
    recommendations: info.recommendations,
    confidence: Math.random() * 0.2 + 0.75,
    shouldSeeVet: Math.random() > 0.7,
    urgency: Math.random() > 0.8 ? 'high' : 'medium',
  };
}

export default router;
