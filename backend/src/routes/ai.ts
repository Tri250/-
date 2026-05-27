import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middleware';

const router = Router();

router.use(authenticateToken);

const MALICIOUS_PATTERNS = [
  /hack/i,
  /bypass/i,
  /exploit/i,
  /injection/i,
  /sudo/i,
  /rm -rf/i,
  /drop table/i,
  /system\(/i,
  /exec\(/i,
  /eval\(/i,
];

const MAX_MESSAGE_LENGTH = 5000;

function containsMaliciousContent(message: string): boolean {
  return MALICIOUS_PATTERNS.some(pattern => pattern.test(message));
}

router.post('/chat', [
  body('petId').isString().withMessage('宠物ID不能为空'),
  body('message').isString().isLength({ min: 1 }).withMessage('消息内容不能为空'),
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
    const { petId, message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ 
        code: 400,
        message: '消息内容不能为空',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ 
        code: 400,
        message: `消息内容不能超过${MAX_MESSAGE_LENGTH}个字符`,
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    if (containsMaliciousContent(message)) {
      return res.status(400).json({ 
        code: 400,
        message: '消息内容包含不当信息，请重新输入',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

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

    let conversation = await prisma.aIConversation.findFirst({
      where: { petId, userId: req.userId },
      orderBy: { updatedAt: 'desc' },
    });

    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    const aiResponse = {
      role: 'assistant',
      content: generateMockAIResponse(pet, message),
      timestamp: new Date().toISOString(),
    };

    const messages = conversation 
      ? [...JSON.parse(conversation.messages), userMessage, aiResponse]
      : [userMessage, aiResponse];

    if (conversation) {
      conversation = await prisma.aIConversation.update({
        where: { id: conversation.id },
        data: { messages: JSON.stringify(messages) },
      });
    } else {
      conversation = await prisma.aIConversation.create({
        data: {
          petId,
          userId: req.userId!,
          messages: JSON.stringify(messages),
        },
      });
    }

    res.json({ 
      code: 200,
      message: '对话成功',
      data: { 
        conversation: { ...conversation, messages }, 
        response: aiResponse 
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '对话失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/conversations/:petId', async (req: Request, res: Response) => {
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

    const conversations = await prisma.aIConversation.findMany({
      where: {
        petId: req.params.petId,
        userId: req.userId,
      },
      orderBy: { updatedAt: 'desc' },
    });

    const parsedConversations = conversations.map(conversation => ({
      ...conversation,
      messages: JSON.parse(conversation.messages),
    }));

    res.json({ 
      code: 200,
      message: '获取对话历史成功',
      data: { conversations: parsedConversations },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '获取对话失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/generate-report', [
  body('petId').isString().withMessage('宠物ID不能为空'),
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
    const { petId } = req.body;

    const pet = await prisma.pet.findFirst({
      where: { id: petId, userId: req.userId },
      include: {
        healthRecords: true,
        vaccines: true,
        checkups: true,
        growthRecords: true,
      },
    });

    if (!pet) {
      return res.status(404).json({ 
        code: 404,
        message: '宠物不存在',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    if (pet.healthRecords.length < 1) {
      return res.status(400).json({ 
        code: 400,
        message: '数据不足，建议积累更多记录后再生成报告',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const report = generateMockHealthReport(pet);
    res.json({ 
      code: 200,
      message: '生成健康报告成功',
      data: { report },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      code: 500,
      message: '生成报告失败',
      data: null,
      timestamp: new Date().toISOString()
    });
  }
});

function generateMockAIResponse(pet: any, message: string) {
  const urgentKeywords = ['中毒', '严重', '大量流血', '呼吸困难', '昏迷'];
  const isUrgent = urgentKeywords.some(keyword => message.includes(keyword));

  if (isUrgent) {
    return `我注意到您描述的情况可能比较紧急。${pet.name}可能需要立即就医。请尽快联系最近的宠物医院或兽医。如果情况危急，请拨打宠物急救电话。`;
  }

  const responses = [
    `作为${pet.name}的AI健康顾问，我很高兴为您服务。关于您的问题，我建议您...`,
    `感谢您的咨询！针对您提到的问题，我建议您观察${pet.name}的...`,
    `${pet.name}的情况我已经了解了。根据描述，我建议您...`,
    `这是一个很好的问题！对于${pet.name}的健康，我建议您...`,
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

function generateMockHealthReport(pet: any) {
  const healthScore = calculateHealthScore(pet);
  
  return {
    petName: pet.name,
    generatedAt: new Date().toISOString(),
    healthStatus: pet.healthStatus,
    healthScore,
    summary: `${pet.name}的整体健康状况评估得分为${healthScore}分。建议继续保持当前的护理习惯。`,
    weight: pet.weight ? `${pet.weight} kg` : '未记录',
    recommendations: [
      '定期进行健康检查',
      '保持均衡饮食',
      '确保充足的运动',
      '定期进行疫苗接种',
    ],
    lastCheckup: pet.checkups[0]?.date || '无记录',
    nextVaccine: pet.vaccines[0]?.nextDate || '无计划',
    keyFindings: [
      `当前体重: ${pet.weight || '未记录'}`,
      `疫苗接种: ${pet.vaccines.length}次`,
      `体检记录: ${pet.checkups.length}次`,
      `健康记录: ${pet.healthRecords.length}条`,
    ],
  };
}

function calculateHealthScore(pet: any): number {
  let score = 70;
  
  if (pet.weight && pet.weight > 0) {
    score += 10;
  }
  
  if (pet.vaccines.length > 0) {
    score += 5;
  }
  
  if (pet.checkups.length > 0) {
    score += 5;
  }
  
  if (pet.healthRecords.length > 10) {
    score += 10;
  }
  
  return Math.min(score, 100);
}

export default router;
