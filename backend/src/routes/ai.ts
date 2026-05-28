import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middleware';
import { validatePetOwnership, validatePetOwnershipFromBody } from '../middleware/permission.middleware';
import { validateBody } from '../middleware/validation.middleware';
import petHealthAI from '../lib/ai-service';
import { HealthAnalyzer, formatHealthAnalysisReport } from '../lib/health-analyzer';
import { exoticPetKnowledge } from '../lib/exotic-pet-knowledge';

const router = Router();

const chatSchema = z.object({
  petId: z.string().min(1, 'petId 为必填参数'),
  message: z.string().min(1, '消息不能为空').max(2000, '消息不能超过 2000 字符'),
});

const emotionTranslateSchema = z.object({
  petId: z.string().min(1, 'petId 为必填参数'),
  sourceType: z.enum(['voice', 'behavior', 'combined']).default('behavior'),
  inputContent: z.string().min(1, '输入内容不能为空').max(2000, '输入不能超过 2000 字符'),
  audioUrl: z.string().optional(),
  audioDuration: z.number().int().positive().max(30).optional(),
});

const generateReportSchema = z.object({
  petId: z.string().min(1, 'petId 为必填参数'),
  period: z.enum(['7d', '30d', '90d']).optional().default('30d'),
});

const translationHistoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  hasHealthAlert: z.enum(['true', 'false']).optional(),
});

const deleteTranslationSchema = z.object({
  ids: z.array(z.string()).min(1, '至少选择一个要删除的记录'),
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
      
      // 检索异宠专业知识（如果是异宠）
      let exoticKnowledgeContext = '';
      if (['仓鼠', '兔子', '鸟', '鹦鹉', '蜥蜴', '龟', '鱼', 'OTHER'].includes(pet.type)) {
        const exoticKnowledge = exoticPetKnowledge.search(message, pet.type);
        if (exoticKnowledge.length > 0) {
          exoticKnowledgeContext = '\n\n【异宠专业知识参考】\n' + exoticPetKnowledge.formatAsContext(exoticKnowledge);
        }
      }
      
      const fullContext = petInfo + '\n\n' + healthContext + exoticKnowledgeContext;

      const aiResponse = await petHealthAI.chat(message, fullContext, conversationHistory);

      let conversationId = conversation?.id;
      
      if (!conversation) {
        const newConversation = await prisma.aIConversation.create({
          data: {
            petId,
            userId,
          },
        });
        conversationId = newConversation.id;
      }

      await prisma.$transaction([
        prisma.message.create({
          data: {
            conversationId: conversationId!,
            role: 'user',
            content: message,
          },
        }),
        prisma.message.create({
          data: {
            conversationId: conversationId!,
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

      const [healthRecords, vaccines, checkups, growthRecords, emotionTranslations] = await Promise.all([
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
        prisma.emotionTranslation.findMany({
          where: { petId, userId },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
      ]);

      const emotionTrend = analyzeEmotionTrend(emotionTranslations);
      
      const healthAnalyzer = new HealthAnalyzer(pet.type, pet.breed);
      const healthAnalysis = healthAnalyzer.analyze(
        healthRecords.map(r => ({
          ...r,
          recordDate: new Date(r.recordDate),
        })),
        vaccines.map(v => ({
          ...v,
          date: new Date(v.date),
          nextDate: v.nextDate ? new Date(v.nextDate) : undefined,
          vet: v.vet || undefined,
          notes: v.notes || undefined,
        })),
        checkups.map(c => ({
          ...c,
          date: new Date(c.date),
          vet: c.vet || undefined,
          notes: c.notes || undefined,
          weight: c.weight || undefined,
        })),
        growthRecords.map(g => ({
          ...g,
          date: new Date(g.date),
          notes: g.notes || undefined,
          weight: g.weight || undefined,
          height: g.height || undefined,
        }))
      );

      const healthAnalysisReport = formatHealthAnalysisReport(healthAnalysis);

      const petInfo = formatPetInfo(pet);
      const healthContext = buildHealthContext({ healthRecords, vaccines, checkups, growthRecords });
      const emotionContext = buildEmotionContext(emotionTranslations, emotionTrend);
      const fullContext = petInfo + '\n\n' + healthContext + emotionContext + healthAnalysisReport;

      const reportContent = await petHealthAI.generateReport(fullContext, {
        healthRecords,
        vaccines: vaccines.map(v => ({
          ...v,
          vet: v.vet || undefined,
          notes: v.notes || undefined,
        })),
        checkups: checkups.map(c => ({
          ...c,
          vet: c.vet || undefined,
          notes: c.notes || undefined,
          weight: c.weight || undefined,
        })),
        growthRecords: growthRecords.map(g => ({
          ...g,
          notes: g.notes || undefined,
          weight: g.weight || undefined,
          height: g.height || undefined,
        })),
      } as any);

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
          analysis: healthAnalysis,
          emotionTrend,
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

function analyzeEmotionTrend(translations: any[]) {
  if (translations.length === 0) {
    return {
      dominantEmotion: 'neutral',
      emotionDistribution: {},
      alertCount: 0,
      totalTranslations: 0,
      averageConfidence: 0,
      trend: 'stable' as const,
    };
  }

  const emotionCount: Record<string, number> = {};
  let totalConfidence = 0;
  let alertCount = 0;

  translations.forEach(t => {
    emotionCount[t.emotion] = (emotionCount[t.emotion] || 0) + 1;
    totalConfidence += t.confidence;
    if (t.healthAlert) alertCount++;
  });

  const dominantEmotion = Object.entries(emotionCount)
    .sort((a, b) => b[1] - a[1])[0][0];

  const recentAlerts = translations.slice(0, 5).filter(t => t.healthAlert).length;
  const olderAlerts = translations.slice(5, 10).filter(t => t.healthAlert).length;
  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (recentAlerts < olderAlerts) trend = 'improving';
  else if (recentAlerts > olderAlerts) trend = 'declining';

  return {
    dominantEmotion,
    emotionDistribution: emotionCount,
    alertCount,
    totalTranslations: translations.length,
    averageConfidence: Math.round(totalConfidence / translations.length),
    trend,
  };
}

function buildEmotionContext(translations: any[], trend: any): string {
  if (translations.length === 0) {
    return '\n\n【情感翻译记录】暂无情感翻译记录\n';
  }

  let context = '\n\n【情感翻译记录分析】\n';
  context += `总翻译次数: ${trend.totalTranslations}次\n`;
  context += `主导情绪: ${trend.dominantEmotion}\n`;
  context += `情绪稳定性: ${trend.trend === 'stable' ? '稳定' : trend.trend === 'improving' ? '改善中' : '需关注'}\n`;
  context += `健康预警次数: ${trend.alertCount}次\n`;
  context += `平均置信度: ${trend.averageConfidence}%\n`;

  context += '\n情绪分布:\n';
  for (const [emotion, count] of Object.entries(trend.emotionDistribution)) {
    const emotionLabels: Record<string, string> = {
      happy: '开心',
      affectionate: '撒娇',
      anxious: '焦虑',
      fearful: '害怕',
      alert: '警惕',
      excited: '兴奋',
      curious: '好奇',
      bored: '无聊',
      content: '满足',
      pain: '疼痛',
      discomfort: '不适',
      digestive: '消化问题',
      nausea: '恶心',
      distress: '痛苦',
      neutral: '平静',
    };
    context += `- ${emotionLabels[emotion] || emotion}: ${count}次\n`;
  }

  if (trend.alertCount > 0) {
    context += '\n【⚠️ 情绪健康预警】\n';
    const recentAlerts = translations.filter(t => t.healthAlert).slice(0, 3);
    recentAlerts.forEach((alert, i) => {
      context += `${i + 1}. ${new Date(alert.createdAt).toLocaleDateString()}: ${alert.alertMessage || alert.emotion}\n`;
    });
    context += '建议: 关注宠物情绪变化，如有持续异常请咨询兽医。\n';
  }

  return context;
}

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

const EMOTION_KEYWORDS: Record<string, { emotion: string; healthAlert: boolean; alertMessage?: string }> = {
  '疼痛': { emotion: 'pain', healthAlert: true, alertMessage: '宠物可能正在经历疼痛，建议密切观察并在必要时就医' },
  '不舒服': { emotion: 'discomfort', healthAlert: true, alertMessage: '宠物表现出不适，建议观察饮食和精神状态' },
  '蜷缩': { emotion: 'pain', healthAlert: true, alertMessage: '宠物蜷缩可能表示疼痛或不适，请关注' },
  '不让碰': { emotion: 'distress', healthAlert: true, alertMessage: '宠物不愿被触碰可能表示疼痛或不适' },
  '呕吐': { emotion: 'nausea', healthAlert: true, alertMessage: '呕吐需要关注，如持续请就医' },
  '拉稀': { emotion: 'digestive', healthAlert: true, alertMessage: '腹泻需要关注，请观察饮食并咨询兽医' },
  '喘气': { emotion: 'anxious', healthAlert: false },
  '开心': { emotion: 'happy', healthAlert: false },
  '撒娇': { emotion: 'affectionate', healthAlert: false },
  '警惕': { emotion: 'alert', healthAlert: false },
  '害怕': { emotion: 'fearful', healthAlert: false },
  '兴奋': { emotion: 'excited', healthAlert: false },
  '满足': { emotion: 'content', healthAlert: false },
  '好奇': { emotion: 'curious', healthAlert: false },
  '无聊': { emotion: 'bored', healthAlert: false },
  '蹭': { emotion: 'affectionate', healthAlert: false },
  '翘尾巴': { emotion: 'affectionate', healthAlert: false },
  '打滚': { emotion: 'happy', healthAlert: false },
  '低吼': { emotion: 'alert', healthAlert: false },
  '炸毛': { emotion: 'fearful', healthAlert: false },
  '躲': { emotion: 'fearful', healthAlert: false },
  '摇尾巴': { emotion: 'happy', healthAlert: false },
  '呼噜': { emotion: 'content', healthAlert: false },
  '喵喵': { emotion: 'curious', healthAlert: false },
  '汪汪': { emotion: 'excited', healthAlert: false },
};

function analyzeEmotionFromText(input: string): { emotion: string; confidence: number; healthAlert: boolean; alertMessage?: string } {
  const lowerInput = input.toLowerCase();
  
  let matchedEmotion = 'neutral';
  let matchedHealthAlert = false;
  let matchedAlertMessage: string | undefined;
  let matchCount = 0;
  
  for (const [keyword, result] of Object.entries(EMOTION_KEYWORDS)) {
    if (lowerInput.includes(keyword)) {
      matchedEmotion = result.emotion;
      if (result.healthAlert) {
        matchedHealthAlert = true;
        matchedAlertMessage = result.alertMessage;
      }
      matchCount++;
    }
  }
  
  const baseConfidence = Math.min(95, 60 + matchCount * 10);
  const confidence = input.length < 10 ? Math.min(baseConfidence, 65) : baseConfidence;
  
  return {
    emotion: matchedEmotion,
    confidence,
    healthAlert: matchedHealthAlert,
    alertMessage: matchedAlertMessage,
  };
}

function generateTranslation(emotion: string, pet: any, input: string): string {
  const petName = pet.name || '宠物';
  const breed = pet.breed || '';
  const type = pet.type || '';
  
  const translations: Record<string, string[]> = {
    happy: [
      `${petName}现在心情非常好！${breed ? `${breed}表现出明显的愉悦和满足。` : ''}它可能在期待主人的陪伴或刚刚完成了喜欢的活动。`,
      `汪汪/喵喵的声音充满了欢快！${petName}现在处于积极正面的情绪状态，${type === 'CAT' ? '可能在蹭腿撒娇' : '可能在想出去玩或讨零食'}。`,
    ],
    affectionate: [
      `${petName}正在向您撒娇！${type === 'CAT' ? '猫咪蹭腿是标记领地和表达信任的行为' : '狗狗摇尾巴表示它非常想和您互动'}。`,
      `这个叫声带有明显的亲昵感。${petName}希望得到您的关注和抚摸，${type === 'CAT' ? '可以轻轻挠挠它的下巴' : '可以给它一个拥抱'}。`,
    ],
    anxious: [
      `${petName}现在有点紧张或焦虑。${input.includes('喘气') ? '喘气可能是由于紧张、炎热或运动引起。' : ''}建议检查环境是否有让它不安的因素。`,
      `从${input.includes('躲') ? '躲藏行为' : '叫声特征'}判断，${petName}可能感到不安全或受到了惊吓。提供安静舒适的环境会有帮助。`,
    ],
    fearful: [
      `${petName}表现出恐惧或害怕的情绪。${input.includes('低吼') ? '低吼是防御性的警告信号，请保持距离并排查恐惧源。' : '请检查周围是否有让它害怕的事物。'}`,
      `${petName}现在处于警戒状态。${type === 'CAT' ? '猫咪在感到威胁时会炸毛、弓背' : '狗狗可能因陌生环境或声音而恐惧'}。`,
    ],
    alert: [
      `${petName}正在保持警惕。${input.includes('门口') || input.includes('窗') ? '它可能发现了什么动静。' : '请注意观察是什么引起了它的注意。'}`,
      `${petName}表现出了守护行为。${type === 'DOG' ? '这是狗狗的本能，如果过度吠叫可以适当训练' : '猫咪会本能地巡视领地'}。`,
    ],
    excited: [
      `${petName}非常兴奋！${type === 'DOG' ? '尾巴摇得飞快，迫不及待想和您玩' : '猫咪兴奋时会快速跑动、瞳孔放大'}。`,
      `从叫声和动作判断，${petName}正处于兴奋状态，${type === 'DOG' ? '可能想出门散步或吃饭' : '可能发现了有趣的猎物或玩具'}。`,
    ],
    pain: [
      `⚠️ ${petName}可能正在经历疼痛或不适。${input.includes('蜷缩') ? '蜷缩是宠物疼痛时的典型表现。' : ''}建议密切观察，如症状持续请及时就医。`,
      `⚠️ 从${petName}的行为判断，它可能感到疼痛。${input.includes('不让碰') ? '不愿被触碰是强烈的不适信号。' : ''}请检查是否有外伤或观察其他异常症状。`,
    ],
    discomfort: [
      `⚠️ ${petName}表现出不适的迹象。请观察是否有其他症状，如食欲变化、排泄异常等。`,
      `⚠️ ${petName}需要额外关注。请确保它有充足的清水和安静舒适的休息环境。`,
    ],
    digestive: [
      `⚠️ ${petName}的消化系统可能有问题。建议${type === 'CAT' ? '观察是否吐毛球' : '检查饮食是否合适'}，如持续请咨询兽医。`,
      `⚠️ 消化问题需要关注。请记录症状发展，若超过24小时或出现血便请立即就医。`,
    ],
    nausea: [
      `⚠️ ${petName}可能有呕吐的倾向。请观察并${type === 'CAT' ? '检查是否需要化毛膏' : '检查最近的食物'}。`,
      `⚠️ ${petName}表现出恶心的迹象。请让它保持安静，避免剧烈运动。`,
    ],
    distress: [
      `⚠️ ${petName}正处于痛苦或极度不适的状态。${input.includes('不让碰') ? '拒绝触碰是强烈的不适信号。' : ''}建议尽快就医检查。`,
      `⚠️ ${petName}表现出明显的痛苦信号。请仔细检查身体是否有异常，如持续请立即就医。`,
    ],
    curious: [
      `${petName}对周围环境充满好奇！${type === 'CAT' ? '猫咪会用胡须探测新事物' : '狗狗会用鼻子嗅闻探索'}。这是健康积极的表现。`,
      `从${petName}的行为来看，它正处于好奇探索的状态。${type === 'CAT' ? '给它提供新的玩具或猫爬架可以满足它的探索欲' : '带它去新的地方散步会有益健康'}。`,
    ],
    bored: [
      `${petName}看起来有点无聊。${type === 'DOG' ? '可以陪它玩扔球或拔河游戏' : '提供新玩具或猫爬架可以缓解无聊'}。`,
      `${petName}需要更多互动！${type === 'CAT' ? '激光笔或逗猫棒是不错的选择' : '增加散步时间或训练课程会有帮助'}。`,
    ],
    content: [
      `${petName}现在非常满足和放松！${type === 'CAT' ? '发出呼噜声是满足的标志' : '安静的躺卧表示它很舒适'}。`,
      `${petName}正处于平和满足的状态。这是宠物健康快乐的好信号！`,
    ],
    neutral: [
      `${petName}现在情绪平稳。${input.length < 15 ? '需要更多行为信息才能做出更准确的判断' : '请结合其他症状综合判断'}。`,
      `${petName}处于正常状态。如果有任何担忧，建议持续观察。`,
    ],
  };
  
  const emotionTranslations = translations[emotion] || translations.neutral;
  return emotionTranslations[Math.floor(Math.random() * emotionTranslations.length)];
}

router.post(
  '/emotion-translate',
  validateBody(emotionTranslateSchema),
  validatePetOwnershipFromBody,
  async (req: Request, res: Response) => {
    try {
      const { petId, sourceType, inputContent, audioUrl, audioDuration } = req.body;
      const userId = req.userId!;
      const pet = req.pet;

      if (sourceType === 'voice' && audioDuration && audioDuration < 2) {
        return res.status(400).json({
          code: 400,
          error: '录音时长至少需要2秒，请重新录制',
        });
      }

      if (sourceType === 'voice' && audioDuration && audioDuration > 30) {
        return res.status(400).json({
          code: 400,
          error: '录音时长不能超过30秒',
        });
      }

      const emotionAnalysis = analyzeEmotionFromText(inputContent);
      
      let translation = generateTranslation(emotionAnalysis.emotion, pet, inputContent);
      
      if (emotionAnalysis.healthAlert && emotionAnalysis.alertMessage) {
        translation += `\n\n🚨 **健康预警**: ${emotionAnalysis.alertMessage}`;
      }

      translation += '\n\n⚠️ **免责声明**: 本翻译结果仅供参考，不能替代专业兽医诊断。如有健康疑虑，请及时咨询兽医。';

      const emotionTranslation = await prisma.emotionTranslation.create({
        data: {
          userId,
          petId,
          sourceType,
          inputContent,
          audioUrl: audioUrl || null,
          audioDuration: audioDuration || null,
          emotion: emotionAnalysis.emotion,
          confidence: emotionAnalysis.confidence,
          translation,
          healthAlert: emotionAnalysis.healthAlert,
          alertMessage: emotionAnalysis.alertMessage || null,
          needsAttention: emotionAnalysis.healthAlert,
        },
      });

      if (emotionAnalysis.healthAlert) {
        const existingReminder = await prisma.reminder.findFirst({
          where: {
            petId,
            title: { contains: '宠物状态异常' },
            isCompleted: false,
            date: { gte: new Date() },
          },
        });

        if (!existingReminder) {
          await prisma.reminder.create({
            data: {
              petId,
              type: 'CUSTOM',
              title: `🐾 ${pet.name}状态异常提醒`,
              notes: `AI情感翻译检测到: ${emotionAnalysis.emotion}\n预警信息: ${emotionAnalysis.alertMessage}`,
              date: new Date(),
              time: new Date().toTimeString().slice(0, 5),
              repeat: 'ONCE',
              isCompleted: false,
            },
          });
        }
      }

      res.json({
        code: 200,
        data: {
          id: emotionTranslation.id,
          emotion: emotionTranslation.emotion,
          confidence: emotionTranslation.confidence,
          translation: emotionTranslation.translation,
          healthAlert: emotionTranslation.healthAlert,
          alertMessage: emotionTranslation.alertMessage,
          needsAttention: emotionTranslation.needsAttention,
          createdAt: emotionTranslation.createdAt,
        },
      });
    } catch (error) {
      console.error('情感翻译错误:', error);
      res.status(500).json({
        code: 500,
        error: '情感翻译失败，请稍后再试',
      });
    }
  }
);

router.get(
  '/translation-history/:petId',
  validatePetOwnership,
  async (req: Request, res: Response) => {
    try {
      const { petId } = req.params;
      const userId = req.userId!;
      
      const queryParse = translationHistoryQuerySchema.safeParse(req.query);
      if (!queryParse.success) {
        return res.status(400).json({
          code: 400,
          error: '查询参数格式错误',
          details: queryParse.error.errors,
        });
      }
      
      const { page, pageSize, startDate, endDate, hasHealthAlert } = queryParse.data;
      const skip = (page - 1) * pageSize;

      const whereClause: any = { petId, userId };
      
      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) {
          whereClause.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          whereClause.createdAt.lte = new Date(endDate);
        }
      }
      
      if (hasHealthAlert === 'true') {
        whereClause.healthAlert = true;
      } else if (hasHealthAlert === 'false') {
        whereClause.healthAlert = false;
      }

      const [translations, total] = await Promise.all([
        prisma.emotionTranslation.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
        }),
        prisma.emotionTranslation.count({
          where: whereClause,
        }),
      ]);

      if (translations.length === 0) {
        return res.json({
          code: 200,
          data: [],
          pagination: {
            page,
            pageSize,
            total,
            totalPages: 0,
          },
          message: '暂无翻译记录，开始第一次翻译吧',
        });
      }

      res.json({
        code: 200,
        data: translations,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      console.error('获取翻译历史错误:', error);
      res.status(500).json({
        code: 500,
        error: '获取翻译历史失败',
      });
    }
  }
);

router.delete(
  '/translation-history/:id',
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const translation = await prisma.emotionTranslation.findFirst({
        where: { id, userId },
      });

      if (!translation) {
        return res.status(404).json({
          code: 404,
          error: '翻译记录不存在或无权删除',
        });
      }

      await prisma.emotionTranslation.delete({
        where: { id },
      });

      res.json({
        code: 200,
        message: '删除成功',
      });
    } catch (error) {
      console.error('删除翻译记录错误:', error);
      res.status(500).json({
        code: 500,
        error: '删除失败',
      });
    }
  }
);

router.post(
  '/translation-history/batch-delete',
  validateBody(deleteTranslationSchema),
  async (req: Request, res: Response) => {
    try {
      const { ids } = req.body;
      const userId = req.userId!;

      const translations = await prisma.emotionTranslation.findMany({
        where: {
          id: { in: ids },
          userId,
        },
      });

      if (translations.length === 0) {
        return res.status(404).json({
          code: 404,
          error: '没有找到可删除的记录',
        });
      }

      await prisma.emotionTranslation.deleteMany({
        where: {
          id: { in: translations.map(t => t.id) },
          userId,
        },
      });

      res.json({
        code: 200,
        message: `成功删除 ${translations.length} 条记录`,
        deletedCount: translations.length,
      });
    } catch (error) {
      console.error('批量删除翻译记录错误:', error);
      res.status(500).json({
        code: 500,
        error: '批量删除失败',
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
