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

      const petInfo = formatPetInfo(pet);

      const aiResponse = await petHealthAI.chat(message, petInfo, conversationHistory);

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

      const reportContent = await petHealthAI.generateReport(petInfo, {
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
  let info = `名字: ${pet.name || '未知'}\n`;
  info += `类型: ${pet.type || '未知'}\n`;
  info += `品种: ${pet.breed || '未知'}\n`;
  info += `性别: ${pet.gender || '未知'}\n`;
  if (pet.birthday) info += `生日: ${pet.birthday}\n`;
  if (pet.weight) info += `体重: ${pet.weight} kg\n`;
  if (pet.color) info += `毛色: ${pet.color}\n`;
  if (pet.characteristics) info += `特点: ${pet.characteristics}\n`;
  if (pet.healthStatus) info += `健康状态: ${pet.healthStatus}\n`;
  return info;
}

export default router;
