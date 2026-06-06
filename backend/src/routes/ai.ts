import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middleware';

const router = Router();

router.use(authenticateToken);

// AI服务配置
const AI_SERVICE_CONFIG = {
  endpoint: process.env.AI_SERVICE_ENDPOINT || 'http://localhost:8000',
  timeout: 30000,
  maxRetries: 3,
};

router.post('/chat', [body('petId').isString(), body('message').isString()], async (req: Request, res: Response) => {
  try {
    const { petId, message } = req.body;

    const pet = await prisma.pet.findFirst({
      where: { id: petId, userId: req.userId },
      include: {
        healthRecords: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        vaccines: {
          orderBy: { date: 'desc' },
          take: 3,
        },
        checkups: {
          orderBy: { date: 'desc' },
          take: 3,
        },
      },
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

    // 调用真实的AI服务
    const aiResponseContent = await callAIService(pet, message, conversation?.messages || []);

    const aiResponse = {
      role: 'assistant',
      content: aiResponseContent,
      timestamp: new Date().toISOString(),
    };

    const messages = conversation 
      ? [...conversation.messages, userMessage, aiResponse]
      : [userMessage, aiResponse];

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
    console.error('AI Chat Error:', error);
    res.status(500).json({ error: '对话服务暂时不可用，请稍后重试' });
  }
});

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
    console.error('Get Conversation Error:', error);
    res.status(500).json({ error: '获取对话失败' });
  }
});

router.post('/generate-report', [body('petId').isString()], async (req: Request, res: Response) => {
  try {
    const { petId } = req.body;

    const pet = await prisma.pet.findFirst({
      where: { id: petId, userId: req.userId },
      include: {
        healthRecords: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        vaccines: {
          orderBy: { date: 'desc' },
        },
        checkups: {
          orderBy: { date: 'desc' },
          take: 5,
        },
        growthRecords: {
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    });

    if (!pet) {
      return res.status(404).json({ error: '宠物不存在' });
    }

    // 生成真实的健康报告
    const report = await generateHealthReport(pet);
    res.json({ report });
  } catch (error) {
    console.error('Generate Report Error:', error);
    res.status(500).json({ error: '生成报告失败' });
  }
});

// 调用真实的AI服务
async function callAIService(
  pet: {
    name: string;
    species: string;
    breed?: string;
    age?: number;
    weight?: number;
    healthStatus?: string;
    healthRecords: Array<{ type: string; value: string; createdAt: Date }>;
    vaccines: Array<{ name: string; date: Date; nextDate?: Date }>;
    checkups: Array<{ date: Date; result?: string }>;
  },
  message: string,
  history: Array<{ role: string; content: string }>
): Promise<string> {
  try {
    // 构建上下文信息
    const context = buildPetContext(pet);
    
    // 调用外部AI服务
    const response = await fetch(`${AI_SERVICE_CONFIG.endpoint}/api/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_SERVICE_API_KEY || ''}`,
      },
      body: JSON.stringify({
        petContext: context,
        userMessage: message,
        conversationHistory: history.slice(-10), // 最近10条对话
      }),
    });

    if (!response.ok) {
      throw new Error(`AI服务响应错误: ${response.status}`);
    }

    const data = await response.json();
    return data.response || generateFallbackResponse(pet, message);
  } catch (error) {
    console.error('AI Service Call Error:', error);
    // 如果AI服务不可用，返回基于规则的回复
    return generateFallbackResponse(pet, message);
  }
}

// 构建宠物上下文
function buildPetContext(pet: {
  name: string;
  species: string;
  breed?: string;
  age?: number;
  weight?: number;
  healthStatus?: string;
  healthRecords: Array<{ type: string; value: string; createdAt: Date }>;
  vaccines: Array<{ name: string; date: Date; nextDate?: Date }>;
  checkups: Array<{ date: Date; result?: string }>;
}): string {
  const parts = [
    `宠物名称: ${pet.name}`,
    `种类: ${pet.species === 'dog' ? '狗' : pet.species === 'cat' ? '猫' : '其他'}`,
  ];

  if (pet.breed) parts.push(`品种: ${pet.breed}`);
  if (pet.age !== undefined) parts.push(`年龄: ${pet.age}岁`);
  if (pet.weight) parts.push(`体重: ${pet.weight}kg`);
  if (pet.healthStatus) parts.push(`健康状态: ${pet.healthStatus}`);

  // 添加最近的疫苗信息
  if (pet.vaccines.length > 0) {
    const recentVaccines = pet.vaccines
      .filter(v => new Date(v.date) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
      .map(v => v.name)
      .join(', ');
    if (recentVaccines) {
      parts.push(`近期疫苗: ${recentVaccines}`);
    }
  }

  // 添加最近的健康记录
  if (pet.healthRecords.length > 0) {
    const recentRecords = pet.healthRecords
      .slice(0, 3)
      .map(r => `${r.type}: ${r.value}`)
      .join(', ');
    parts.push(`近期记录: ${recentRecords}`);
  }

  return parts.join('\n');
}

// 生成基于规则的回退回复
function generateFallbackResponse(pet: { name: string; species: string }, message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // 基于关键词匹配提供基础建议
  if (lowerMessage.includes('吃') || lowerMessage.includes('食') || lowerMessage.includes('喂')) {
    return `关于${pet.name}的饮食问题，建议您：\n1. 根据${pet.species === 'dog' ? '狗' : '猫'}的年龄、体重和活动量选择合适的食物\n2. 定时定量喂食，避免过度喂养\n3. 确保充足的饮水\n4. 如有食欲不振等异常情况，请及时就医`;
  }
  
  if (lowerMessage.includes('疫苗') || lowerMessage.includes('接种')) {
    return `关于${pet.name}的疫苗接种：\n1. 请按照兽医建议的疫苗计划进行接种\n2. 记录每次接种的时间和疫苗类型\n3. 注意接种后的观察期\n4. 定期复查抗体水平`;
  }
  
  if (lowerMessage.includes('生病') || lowerMessage.includes('不舒服') || lowerMessage.includes('症状')) {
    return `如果${pet.name}出现不适症状，建议您：\n1. 密切观察症状变化\n2. 记录症状出现的时间和表现\n3. 如症状持续或加重，请及时联系兽医\n4. 不要自行给宠物用药`;
  }
  
  if (lowerMessage.includes('运动') || lowerMessage.includes('活动') || lowerMessage.includes('锻炼')) {
    return `关于${pet.name}的运动建议：\n1. 每天保持适量的运动时间\n2. 根据年龄和健康状况调整运动强度\n3. 选择适合${pet.species === 'dog' ? '狗' : '猫'}的运动方式\n4. 注意运动后的休息和补水`;
  }
  
  return `感谢您的咨询！作为${pet.name}的AI健康顾问，我建议您：\n1. 定期进行健康检查\n2. 保持均衡的饮食和适量的运动\n3. 按时完成疫苗接种和驱虫\n4. 关注宠物的行为变化\n\n如需更详细的建议，请提供更多具体信息，或咨询专业兽医。`;
}

// 生成真实的健康报告
async function generateHealthReport(pet: {
  name: string;
  species: string;
  breed?: string;
  age?: number;
  weight?: number;
  healthStatus?: string;
  healthRecords: Array<{ type: string; value: string; createdAt: Date }>;
  vaccines: Array<{ name: string; date: Date; nextDate?: Date }>;
  checkups: Array<{ date: Date; result?: string }>;
  growthRecords: Array<{ weight: number; date: Date }>;
}): Promise<{
  petName: string;
  generatedAt: string;
  healthStatus: string;
  summary: string;
  weight: string;
  recommendations: string[];
  lastCheckup: string;
  nextVaccine: string;
  analysis: {
    weightTrend: 'increasing' | 'decreasing' | 'stable';
    healthScore: number;
    riskFactors: string[];
  };
}> {
  const now = new Date();
  
  // 分析体重趋势
  let weightTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (pet.growthRecords.length >= 2) {
    const recent = pet.growthRecords.slice(0, 2);
    const diff = recent[0].weight - recent[1].weight;
    if (Math.abs(diff) > 0.5) {
      weightTrend = diff > 0 ? 'increasing' : 'decreasing';
    }
  }
  
  // 计算健康评分
  let healthScore = 80;
  const riskFactors: string[] = [];
  
  // 根据疫苗情况调整评分
  const overdueVaccines = pet.vaccines.filter(v => v.nextDate && new Date(v.nextDate) < now);
  if (overdueVaccines.length > 0) {
    healthScore -= 10;
    riskFactors.push('有疫苗已过期');
  }
  
  // 根据健康记录调整评分
  const recentIssues = pet.healthRecords.filter(r => 
    r.type === 'symptom' && 
    new Date(r.createdAt) > new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  );
  if (recentIssues.length > 0) {
    healthScore -= 5 * recentIssues.length;
    riskFactors.push('近期有健康异常记录');
  }
  
  // 根据体检记录调整评分
  const lastCheckup = pet.checkups[0];
  if (lastCheckup) {
    const daysSinceCheckup = Math.floor((now.getTime() - new Date(lastCheckup.date).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceCheckup > 365) {
      healthScore -= 10;
      riskFactors.push('超过一年未进行体检');
    }
  }
  
  healthScore = Math.max(0, Math.min(100, healthScore));
  
  // 生成建议
  const recommendations: string[] = [];
  
  if (overdueVaccines.length > 0) {
    recommendations.push(`尽快补种疫苗: ${overdueVaccines.map(v => v.name).join(', ')}`);
  }
  
  if (!lastCheckup || new Date(lastCheckup.date).getTime() < now.getTime() - 365 * 24 * 60 * 60 * 1000) {
    recommendations.push('建议尽快安排年度体检');
  }
  
  if (weightTrend === 'increasing') {
    recommendations.push('体重呈上升趋势，建议控制饮食并增加运动量');
  } else if (weightTrend === 'decreasing') {
    recommendations.push('体重呈下降趋势，建议检查营养摄入是否充足');
  }
  
  recommendations.push('保持均衡饮食，定时定量喂食');
  recommendations.push('每天保持适量的运动时间');
  recommendations.push('定期进行驱虫和疫苗接种');
  
  // 生成总结
  let summary = `${pet.name}的整体健康状况`;
  if (healthScore >= 90) {
    summary += '优秀';
  } else if (healthScore >= 75) {
    summary += '良好';
  } else if (healthScore >= 60) {
    summary += '一般，需要关注';
  } else {
    summary += '需要改善';
  }
  summary += `。健康评分: ${healthScore}/100。`;
  
  if (riskFactors.length > 0) {
    summary += ` 需要注意的风险因素: ${riskFactors.join('、')}。`;
  }
  
  // 查找下一次疫苗
  const upcomingVaccines = pet.vaccines
    .filter(v => v.nextDate && new Date(v.nextDate) > now)
    .sort((a, b) => new Date(a.nextDate!).getTime() - new Date(b.nextDate!).getTime());
  
  return {
    petName: pet.name,
    generatedAt: now.toISOString(),
    healthStatus: pet.healthStatus || '未知',
    summary,
    weight: pet.weight ? `${pet.weight} kg` : '未记录',
    recommendations,
    lastCheckup: lastCheckup?.date ? new Date(lastCheckup.date).toISOString().split('T')[0] : '无记录',
    nextVaccine: upcomingVaccines[0]?.nextDate 
      ? new Date(upcomingVaccines[0].nextDate).toISOString().split('T')[0] 
      : '无计划',
    analysis: {
      weightTrend,
      healthScore,
      riskFactors,
    },
  };
}

export default router;
