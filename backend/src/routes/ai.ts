import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middleware';

const router = Router();

router.use(authenticateToken);

router.post('/chat', [body('petId').isString(), body('message').isString()], async (req: Request, res: Response) => {
  try {
    const { petId, message } = req.body;

    const pet = await prisma.pet.findFirst({
      where: { id: petId, userId: req.userId },
    });

    if (!pet) {
      return res.status(404).json({ error: '宠物不存在' });
    }

    let conversation = await prisma.aIConversation.findFirst({
      where: { petId, userId: req.userId },
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

    const previousMessages: unknown[] = conversation
      ? safeJsonParse(conversation.messages)
      : [];

    const messages = JSON.stringify([...previousMessages, userMessage, aiResponse]);

    if (conversation) {
      conversation = await prisma.aIConversation.update({
        where: { id: conversation.id },
        data: { messages },
      });
    } else {
      conversation = await prisma.aIConversation.create({
        data: {
          petId,
          userId: req.userId!,
          messages,
        },
      });
    }

    res.json({ conversation, response: aiResponse });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '对话失败' });
  }
});

function safeJsonParse(value: string): unknown[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

router.get('/conversations/:petId', async (req: Request, res: Response) => {
  try {
    const conversation = await prisma.aIConversation.findFirst({
      where: {
        petId: req.params.petId,
        userId: req.userId,
      },
    });

    res.json({ conversation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '获取对话失败' });
  }
});

router.post('/generate-report', [body('petId').isString()], async (req: Request, res: Response) => {
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
      return res.status(404).json({ error: '宠物不存在' });
    }

    const report = generateMockHealthReport(pet);
    res.json({ report });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '生成报告失败' });
  }
});

function generateMockAIResponse(pet: any, message: string) {
  const responses = [
    `作为${pet.name}的AI健康顾问，我很高兴为您服务。关于您的问题"${message}"，我建议您...`,
    `感谢您的咨询！针对您提到的问题，我建议您观察${pet.name}的...`,
    `${pet.name}的情况我已经了解了。根据描述，我建议您...`,
    `这是一个很好的问题！对于${pet.name}的健康，我建议您...`,
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

function generateMockHealthReport(pet: any) {
  return {
    petName: pet.name,
    generatedAt: new Date().toISOString(),
    healthStatus: pet.healthStatus,
    summary: `${pet.name}的整体健康状况良好。建议继续保持当前的护理习惯。`,
    weight: pet.weight ? `${pet.weight} kg` : '未记录',
    recommendations: [
      '定期进行健康检查',
      '保持均衡饮食',
      '确保充足的运动',
      '定期进行疫苗接种',
    ],
    lastCheckup: pet.checkups[0]?.date || '无记录',
    nextVaccine: pet.vaccines[0]?.nextDate || '无计划',
  };
}

export default router;
