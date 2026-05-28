import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middleware';
import { validatePetOwnership, validatePetOwnershipFromBody } from '../middleware/permission.middleware';
import { validateBody } from '../middleware/validation.middleware';
import petHealthAI from '../lib/ai-service';

const router = Router();

const chatSchema = z.object({
  petId: z.string().min(1, 'petId 为必填参数'),
  message: z.string().min(1, '消息不能为空').max(2000, '消息不能超过 2000 字符'),
});

const generateReportSchema = z.object({
  petId: z.string().min(1, 'petId 为必填参数'),
  period: z.enum(['7d', '30d', '90d']).optional().default('30d'),
});

router.use(authenticateToken);

router.post(
  '/chat',
  validateBody(chatSchema),
  validatePetOwnershipFromBody,
  async (req: Request, res: Response) => {
    try {
      const { petId, message } = req.body;
      const userId = req.userId!;
      const pet = req.pet;

      // 获取对话历史
      let conversation = await prisma.aIConversation.findFirst({
        where: { petId, userId },
        include: {
          messages: {
            orderBy: { timestamp: 'asc' },
            take: -10,
          },
        },
      });

      const conversationHistory = conversation?.messages.map(m => ({
        role: m.role,
        content: m.content,
      })) || [];

      // 自动拉取宠物完整健康数据
      const [healthRecords, vaccines, checkups, growthRecords] = await Promise.all([
        prisma.healthRecord.findMany({
          where: { petId, deletedAt: null },
          orderBy: { recordDate: 'desc' },
          take: 10,
        }),
        prisma.petVaccine.findMany({
          where: { petId },
          orderBy: { date: 'desc' },
        }),
        prisma.petCheckup.findMany({
          where: { petId },
          orderBy: { date: 'desc' },
          take: 5,
        }),
        prisma.petGrowth.findMany({
          where: { petId },
          orderBy: { date: 'desc' },
          take: 10,
        }),
      ]);

      // 构建完整上下文
      const petInfo = formatPetInfo(pet);
      const healthContext = buildHealthContext({ healthRecords, vaccines, checkups, growthRecords });
      const fullContext = petInfo + '\n\n' + healthContext;

      const aiResponse = await petHealthAI.chat(message, fullContext, conversationHistory);

      // 创建或更新对话记录
      if (!conversation) {
        conversation = await prisma.aIConversation.create({
          data: {
            petId,
            userId,
          },
        });
      }

      await prisma.$transaction([
        prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: 'user',
            content: message,
          },
        }),
        prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: 'assistant',
            content: aiResponse.reply,
          },
        }),
      ]);

      res.json({
        code: 200,
        data: {
          reply: aiResponse.reply,
          messageId: aiResponse.messageId,
          timestamp: aiResponse.timestamp,
          source: aiResponse.source,
        },
      });
    } catch (error) {
      console.error('聊天接口错误:', error);
      res.status(500).json({
        code: 500,
        error: '对话失败，请稍后再试',
      });
    }
  }
);

router.get(
  '/conversations/:petId',
  validatePetOwnership,
  async (req: Request, res: Response) => {
    try {
      const { petId } = req.params;
      const userId = req.userId!;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const skip = (page - 1) * pageSize;

      const conversation = await prisma.aIConversation.findFirst({
        where: { petId, userId },
      });

      if (!conversation) {
        return res.json({
          code: 200,
          data: [],
          pagination: {
            page,
            pageSize,
            total: 0,
            totalPages: 0,
          },
        });
      }

      const [messages, total] = await Promise.all([
        prisma.message.findMany({
          where: { conversationId: conversation.id },
          orderBy: { timestamp: 'desc' },
          skip,
          take: pageSize,
        }),
        prisma.message.count({
          where: { conversationId: conversation.id },
        }),
      ]);

      res.json({
        code: 200,
        data: messages.reverse(),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      console.error('获取对话历史错误:', error);
      res.status(500).json({
        code: 500,
        error: '获取对话历史失败',
      });
    }
  }
);

router.post(
  '/generate-report',
  validateBody(generateReportSchema),
  validatePetOwnershipFromBody,
  async (req: Request, res: Response) => {
    try {
      const { petId } = req.body;
      const userId = req.userId!;
      const pet = req.pet;

      const [healthRecords, vaccines, checkups, growthRecords] = await Promise.all([
        prisma.healthRecord.findMany({
          where: { petId, deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
        prisma.petVaccine.findMany({
          where: { petId },
          orderBy: { date: 'desc' },
          take: 20,
        }),
        prisma.petCheckup.findMany({
          where: { petId },
          orderBy: { date: 'desc' },
          take: 20,
        }),
        prisma.petGrowth.findMany({
          where: { petId },
          orderBy: { date: 'desc' },
          take: 30,
        }),
      ]);

      const petInfo = formatPetInfo(pet);
      const healthContext = buildHealthContext({ healthRecords, vaccines, checkups, growthRecords });
      const fullContext = petInfo + '\n\n' + healthContext;

      const reportContent = await petHealthAI.generateReport(fullContext, {
        healthRecords,
        vaccines,
        checkups,
        growthRecords,
      });

      const report = await prisma.healthReport.create({
        data: {
          userId,
          petId,
          content: reportContent,
        },
      });

      res.json({
        code: 200,
        data: {
          reportId: report.id,
          content: reportContent,
          createdAt: report.createdAt,
        },
      });
    } catch (error) {
      console.error('生成报告错误:', error);
      res.status(500).json({
        code: 500,
        error: '生成报告失败',
      });
    }
  }
);

router.get(
  '/reports/:petId',
  validatePetOwnership,
  async (req: Request, res: Response) => {
    try {
      const { petId } = req.params;
      const userId = req.userId!;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const skip = (page - 1) * pageSize;

      const [reports, total] = await Promise.all([
        prisma.healthReport.findMany({
          where: { petId, userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
        }),
        prisma.healthReport.count({
          where: { petId, userId },
        }),
      ]);

      res.json({
        code: 200,
        data: reports,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      console.error('获取报告列表错误:', error);
      res.status(500).json({
        code: 500,
        error: '获取报告列表失败',
      });
    }
  }
);

router.get(
  '/reports/detail/:reportId',
  async (req: Request, res: Response) => {
    try {
      const { reportId } = req.params;
      const userId = req.userId!;

      const report = await prisma.healthReport.findFirst({
        where: { id: reportId, userId },
      });

      if (!report) {
        return res.status(404).json({
          code: 404,
          error: '报告不存在',
        });
      }

      res.json({
        code: 200,
        data: report,
      });
    } catch (error) {
      console.error('获取报告详情错误:', error);
      res.status(500).json({
        code: 500,
        error: '获取报告详情失败',
      });
    }
  }
);

function formatPetInfo(pet: any): string {
  let info = `【宠物基础信息】\n`;
  info += `名字: ${pet.name || '未知'}\n`;
  info += `类型: ${pet.type || '未知'}\n`;
  info += `品种: ${pet.breed || '未知'}\n`;
  info += `性别: ${pet.gender || '未知'}\n`;
  if (pet.birthday) {
    const age = calculateAge(pet.birthday);
    info += `年龄: ${age}\n`;
  }
  if (pet.weight) info += `体重: ${pet.weight} kg\n`;
  if (pet.color) info += `毛色: ${pet.color}\n`;
  if (pet.healthStatus) info += `健康状态: ${pet.healthStatus}\n`;
  if (pet.characteristics) info += `特点: ${pet.characteristics}\n`;
  return info;
}

function calculateAge(birthday: string): string {
  const birth = new Date(birthday);
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  
  if (years > 0) {
    return `${years}岁${months > 0 ? months + '个月' : ''}`;
  } else if (months > 0) {
    return `${months}个月`;
  } else {
    const days = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
    return `${days}天`;
  }
}

function buildHealthContext(data: {
  healthRecords: any[];
  vaccines: any[];
  checkups: any[];
  growthRecords: any[];
}): string {
  const { healthRecords, vaccines, checkups, growthRecords } = data;
  
  let context = '\n【健康记录】（最近10条）\n';
  if (healthRecords.length > 0) {
    healthRecords.forEach((record, index) => {
      context += `${index + 1}. [${record.type}] ${record.title} - ${new Date(record.recordDate).toLocaleDateString()}\n`;
      if (record.content) {
        context += `   内容: ${record.content.substring(0, 200)}\n`;
      }
    });
  } else {
    context += '暂无健康记录\n';
  }
  
  context += '\n【疫苗记录】\n';
  if (vaccines.length > 0) {
    vaccines.forEach((vaccine, index) => {
      const nextDate = vaccine.nextDate 
        ? `\n   下次接种: ${new Date(vaccine.nextDate).toLocaleDateString()}`
        : '';
      context += `${index + 1}. ${vaccine.name} - ${new Date(vaccine.date).toLocaleDateString()}${nextDate}\n`;
    });
  } else {
    context += '暂无疫苗记录\n';
  }
  
  context += '\n【体检记录】（最近5条）\n';
  if (checkups.length > 0) {
    checkups.forEach((checkup, index) => {
      let info = `${index + 1}. ${new Date(checkup.date).toLocaleDateString()}`;
      if (checkup.weight) info += ` - 体重: ${checkup.weight}kg`;
      if (checkup.vet) info += ` - 兽医: ${checkup.vet}`;
      context += info + '\n';
      if (checkup.notes) {
        context += `   备注: ${checkup.notes.substring(0, 150)}\n`;
      }
    });
  } else {
    context += '暂无体检记录\n';
  }
  
  context += '\n【成长记录】（最近10条体重数据）\n';
  if (growthRecords.length > 0) {
    const weightRecords = growthRecords.filter(g => g.weight);
    if (weightRecords.length > 0) {
      weightRecords.forEach((record, index) => {
        context += `${index + 1}. ${new Date(record.date).toLocaleDateString()} - 体重: ${record.weight}kg`;
        if (record.height) context += `, 身高: ${record.height}cm`;
        context += '\n';
      });
      
      // 添加体重变化趋势分析
      if (weightRecords.length >= 2) {
        const latestWeight = weightRecords[0].weight;
        const previousWeight = weightRecords[1].weight;
        const change = ((latestWeight - previousWeight) / previousWeight * 100).toFixed(1);
        const changeType = parseFloat(change) > 0 ? '增加' : '减少';
        context += `\n【体重变化趋势】近期体重${changeType}了 ${Math.abs(parseFloat(change))}%\n`;
      }
    } else {
      context += '暂无体重记录\n';
    }
  } else {
    context += '暂无成长记录\n';
  }
  
  return context;
}

export default router;
