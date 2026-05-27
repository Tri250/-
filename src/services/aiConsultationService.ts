import type { AIMessage, AIConsultation, TrendReport, HealthReport } from '../types/ai-consultation';

interface AIResponse {
  content: string;
  confidence: number;
  isEmergency?: boolean;
  isHealthRelated?: boolean;
}

interface HealthKnowledgeBase {
  symptoms: Record<string, {
    conditions: { name: string; probability: number; severity: string; recommendation: string }[];
    generalAdvice: string[];
  }>;
  commonQuestions: Record<string, { answer: string; confidence: number }>;
  petTypeAdvice: Record<string, Record<string, string>>;
  emergencyPhrases: string[];
  nonHealthTopics: string[];
  forbiddenWords: string[];
}

const symptomSynonyms: Record<string, string[]> = {
  '食欲不振': ['食欲不振', '没胃口', '不想吃', '不吃饭', '拒食', '不吃东西'],
  '呕吐': ['呕吐', '吐了', '反胃', '呕', '吐白沫', '吐黄水'],
  '咳嗽': ['咳嗽', '咳', '打喷嚏', '流鼻涕'],
  '腹泻': ['腹泻', '拉肚子', '拉稀', '便便稀', '软便', '拉肚子'],
  '发烧': ['发烧', '发热', '体温高', '体温'],
  '脱毛': ['脱毛', '掉毛', '掉毛严重', '毛掉得多', '毛发脱落'],
  '嗜睡': ['嗜睡', '贪睡', '爱睡觉', '没精神', '精神萎靡'],
  '攻击性': ['攻击性', '凶', '咬人', '攻击', '脾气坏'],
  '抽搐': ['抽搐', '抽风', '发抖', '震颤', '痉挛'],
  '皮肤问题': ['皮肤瘙痒', '皮肤红', '起疹子', '掉皮', '皮肤问题'],
};

const questionSynonyms: Record<string, string[]> = {
  '驱虫': ['驱虫', '打虫', '寄生虫', '体内驱虫', '体外驱虫'],
  '疫苗': ['疫苗', '打针', '免疫', '预防针', '疫苗时间'],
  '体检': ['体检', '检查', '健康检查', '身体检查', '体检项目'],
  '换牙': ['换牙', '长牙', '牙齿', '乳牙', '换牙期'],
  '应激': ['应激', '紧张', '害怕', '焦虑', '应激反应'],
  '发烧判断': ['发烧', '发热', '体温', '量体温', '正常体温'],
  '饮水量': ['喝水', '饮水', '喝水量', '水量', '水', '不爱喝水'],
  '体重管理': ['体重', '减肥', '胖', '瘦', '体型', '太重', '太胖', '减肥'],
  '减肥': ['减肥', '太胖', '控制体重', '减重', '瘦身'],
  '掉毛': ['掉毛', '脱毛', '毛多', '毛掉', '毛发'],
};

const healthKnowledgeBase: HealthKnowledgeBase = {
  symptoms: {
    '食欲不振': {
      conditions: [
        { name: '应激反应', probability: 0.4, severity: 'low', recommendation: '提供安静环境，尝试不同食物，观察24-48小时' },
        { name: '消化系统问题', probability: 0.3, severity: 'medium', recommendation: '暂时禁食12小时，提供清水，如持续请就医' },
        { name: '口腔问题', probability: 0.2, severity: 'medium', recommendation: '检查口腔是否有异物或炎症' },
        { name: '潜在疾病', probability: 0.1, severity: 'high', recommendation: '如伴随其他症状请立即就医' },
      ],
      generalAdvice: ['保持食物新鲜', '提供多种食物选择', '定时定量喂食'],
    },
    '呕吐': {
      conditions: [
        { name: '饮食不当', probability: 0.5, severity: 'low', recommendation: '禁食12-24小时，少量多次给水' },
        { name: '毛球症', probability: 0.25, severity: 'low', recommendation: '使用化毛膏或猫草' },
        { name: '肠胃不适', probability: 0.15, severity: 'medium', recommendation: '观察粪便和精神状态，必要时送医院检查' },
        { name: '严重疾病', probability: 0.1, severity: 'high', recommendation: '如频繁呕吐、带血或精神萎靡请立即送医院' },
      ],
      generalAdvice: ['记录呕吐频率和内容', '避免喂油腻食物', '提供充足清水'],
    },
    '咳嗽': {
      conditions: [
        { name: '轻微感冒', probability: 0.4, severity: 'low', recommendation: '保持温暖，增加湿度，观察1-2天' },
        { name: '呼吸道感染', probability: 0.3, severity: 'medium', recommendation: '观察是否有鼻涕、发热，必要时就医' },
        { name: '异物吸入', probability: 0.2, severity: 'high', recommendation: '如咳嗽剧烈或持续请立即检查' },
        { name: '过敏', probability: 0.1, severity: 'low', recommendation: '检查环境中是否有新的过敏原' },
      ],
      generalAdvice: ['保持室内空气清新', '避免烟雾和灰尘', '监测呼吸状态'],
    },
    '腹泻': {
      conditions: [
        { name: '饮食变化', probability: 0.4, severity: 'low', recommendation: '暂时喂食清淡食物，逐渐恢复正常饮食' },
        { name: '寄生虫', probability: 0.3, severity: 'medium', recommendation: '检查粪便，必要时驱虫' },
        { name: '细菌感染', probability: 0.2, severity: 'medium', recommendation: '观察是否发热，必要时就医' },
        { name: '病毒感染', probability: 0.1, severity: 'high', recommendation: '如伴随发热、呕吐请立即就医' },
      ],
      generalAdvice: ['补充水分防止脱水', '记录粪便颜色和性状', '避免油腻食物'],
    },
    '发烧': {
      conditions: [
        { name: '感染', probability: 0.5, severity: 'medium', recommendation: '监测体温，必要时就医' },
        { name: '炎症反应', probability: 0.3, severity: 'medium', recommendation: '观察伴随症状' },
        { name: '疫苗反应', probability: 0.1, severity: 'low', recommendation: '接种后24-48小时轻微发热正常' },
        { name: '严重疾病', probability: 0.1, severity: 'high', recommendation: '体温超过39.5°C或持续超过24小时请就医' },
      ],
      generalAdvice: ['保持舒适环境', '提供充足清水', '避免过度包裹'],
    },
    '脱毛': {
      conditions: [
        { name: '正常换毛', probability: 0.4, severity: 'low', recommendation: '增加梳毛频率' },
        { name: '皮肤问题', probability: 0.3, severity: 'medium', recommendation: '检查皮肤是否有红肿、皮屑' },
        { name: '压力', probability: 0.2, severity: 'low', recommendation: '提供安全环境和互动' },
        { name: '营养缺乏', probability: 0.1, severity: 'medium', recommendation: '检查饮食是否均衡' },
      ],
      generalAdvice: ['定期梳毛', '保持皮肤清洁', '提供营养补充'],
    },
    '嗜睡': {
      conditions: [
        { name: '正常休息', probability: 0.4, severity: 'low', recommendation: '观察是否恢复活力' },
        { name: '疲劳', probability: 0.3, severity: 'low', recommendation: '保证充足休息' },
        { name: '发热或疾病', probability: 0.2, severity: 'high', recommendation: '测量体温，如异常请就医' },
        { name: '药物影响', probability: 0.1, severity: 'low', recommendation: '检查近期用药情况' },
      ],
      generalAdvice: ['记录睡眠时长', '监测精神状态', '保证舒适休息环境'],
    },
    '攻击性': {
      conditions: [
        { name: '恐惧或压力', probability: 0.4, severity: 'low', recommendation: '提供安全空间，避免刺激' },
        { name: '领地行为', probability: 0.3, severity: 'low', recommendation: '适当社交化训练' },
        { name: '疼痛', probability: 0.2, severity: 'high', recommendation: '检查是否有身体不适' },
        { name: '未绝育', probability: 0.1, severity: 'low', recommendation: '考虑绝育手术' },
      ],
      generalAdvice: ['避免惩罚', '使用正向训练', '提供充足玩具'],
    },
    '抽搐': {
      conditions: [
        { name: '癫痫', probability: 0.3, severity: 'high', recommendation: '立即就医，防止窒息' },
        { name: '中毒', probability: 0.3, severity: 'high', recommendation: '紧急送医，带上疑似毒物' },
        { name: '脑部问题', probability: 0.2, severity: 'high', recommendation: '立即就医检查' },
        { name: '代谢问题', probability: 0.2, severity: 'high', recommendation: '紧急就医' },
      ],
      generalAdvice: ['保持呼吸道通畅', '避免强行喂药', '及时送医'],
    },
  },
  commonQuestions: {
    '驱虫': {
      answer: '常规驱虫建议：体内驱虫每3-6个月一次，体外驱虫每月一次。具体频率需根据宠物生活环境和兽医建议调整。',
      confidence: 0.98,
    },
    '疫苗': {
      answer: '基础疫苗包括猫三联/狗四联，首年完成基础免疫后每年加强一次。狂犬病疫苗根据当地法规执行，通常每年或三年一次。',
      confidence: 0.97,
    },
    '体检': {
      answer: '建议每年进行一次全面体检，7岁以上老年宠物建议每半年一次。体检项目包括血常规、生化、X光、B超等。',
      confidence: 0.96,
    },
    '换牙': {
      answer: '狗狗换牙期通常在4-6个月，猫咪在3-5个月。期间可能出现牙龈红肿、爱咬东西，提供磨牙玩具，注意观察是否有双排牙。',
      confidence: 0.95,
    },
    '应激': {
      answer: '宠物应激反应包括躲起来、食欲不振、过度舔毛、攻击行为等。提供安静环境、熟悉的物品、费洛蒙扩散器都有助于缓解。',
      confidence: 0.94,
    },
    '发烧判断': {
      answer: '猫咪正常体温38.0-39.2°C，狗狗37.5-39.0°C。超过39.5°C属于高烧，需立即就医。可用直肠温度计或耳温计测量。',
      confidence: 0.96,
    },
    '饮水量': {
      answer: '猫咪每天需水量约40-60ml/kg体重，狗狗约50-100ml/kg。多提供饮水点，可尝试流动饮水机增加饮水量。',
      confidence: 0.95,
    },
    '体重管理': {
      answer: '体重管理建议：定期称重，保持理想体态评分(BCS 4-5/9)。控制热量摄入，增加运动量，选择低脂食物，避免过度喂食零食。',
      confidence: 0.97,
    },
    '减肥': {
      answer: '宠物减肥建议：1. 每日喂食量减少20%；2. 选择低卡处方粮；3. 增加每日互动游戏时间(30分钟以上)；4. 每周减重不超过1-2%；5. 定期称体重监控进度。请不要使用人类减肥药！',
      confidence: 0.98,
    },
    '掉毛': {
      answer: '季节性掉毛是正常的，可增加梳毛频率(每天1-2次)。如果伴随皮肤红肿、皮屑或瘙痒，可能是皮肤问题，请就医检查。',
      confidence: 0.95,
    },
  },
  petTypeAdvice: {
    cat: {
      hairball: '定期喂食化毛膏或猫草，每周1-2次',
      litterbox: '保持猫砂盆清洁，多猫家庭需提供多个猫砂盆',
      scratching: '提供抓板，定期修剪指甲',
    },
    dog: {
      exercise: '每天至少两次散步，运动量根据体型和年龄调整',
      training: '坚持基础服从训练，正向强化为主',
      socialization: '尽早社交化，接触不同环境和人群',
    },
  },
  emergencyPhrases: [
    '抽搐', '抽风', '昏迷', '失去意识', '口吐白沫', '呼吸困难',
    '大出血', '吐血', '拉血', '中毒', '误食毒药', '摔倒受伤', '严重车祸',
    '无法站立', '剧烈疼痛', '窒息', '喘不过气', '濒临死亡', '急救',
    '紧急情况', '危险', '快要死了', '不行了', '快死了',
  ],
  nonHealthTopics: [
    '天气', '气温', '今天下雨', '明天天气', '天气好',
    '新闻', '政治', '经济', '股票', '游戏', '娱乐',
    '工作', '学习', '考试', '升学', '工作',
    '我的心情', '我今天', '我想去', '吃什么', '买什么',
    '聊天', '陪我', '说话', '聊天', '嗨', '你好',
  ],
  forbiddenWords: [
    '毒药', '下毒', '毒死', '安乐死', '杀害', '杀死',
    '虐待', '折磨', '暴力', '打架', '自残',
  ],
};

export class AIConsultationService {
  private consultations: Map<string, AIConsultation> = new Map();

  private matchesSynonym(question: string, synonyms: string[]): boolean {
    const lowerQuestion = question.toLowerCase();
    return synonyms.some(synonym => lowerQuestion.includes(synonym.toLowerCase()));
  }

  private analyzeContext(question: string, consultationHistory: AIMessage[]): {
    hasHistory: boolean;
    relatedSymptoms: string[];
    previousPetInfo: any;
  } {
    const hasHistory = consultationHistory.length > 0;
    const relatedSymptoms: string[] = [];
    
    consultationHistory.forEach(msg => {
      if (msg.role === 'user') {
        Object.entries(symptomSynonyms).forEach(([symptom, syns]) => {
          if (this.matchesSynonym(msg.content, syns)) {
            if (!relatedSymptoms.includes(symptom)) {
              relatedSymptoms.push(symptom);
            }
          }
        });
      }
    });

    return { hasHistory, relatedSymptoms, previousPetInfo: {} };
  }

  analyzeQuestion(question: string, petType?: string, consultationHistory: AIMessage[] = []): AIResponse {
    const lowerQuestion = question.toLowerCase();

    for (const word of healthKnowledgeBase.forbiddenWords) {
      if (lowerQuestion.includes(word)) {
        return {
          content: '您的请求包含违规信息，我无法为您提供相关帮助。请遵守法律法规，文明养宠。',
          confidence: 0.99,
          isHealthRelated: false,
        };
      }
    }

    for (const phrase of healthKnowledgeBase.emergencyPhrases) {
      if (lowerQuestion.includes(phrase)) {
        return {
          content: '⚠️ 这是紧急情况！请立即带宠物前往附近的24小时宠物医院急救！\n\n急救前注意事项：\n1. 保持呼吸道通畅\n2. 避免强行喂药\n3. 如疑似中毒，带上疑似毒物样本\n4. 尽量减少移动\n\n请立即就医，不要拖延！',
          confidence: 0.99,
          isEmergency: true,
          isHealthRelated: true,
        };
      }
    }

    for (const topic of healthKnowledgeBase.nonHealthTopics) {
      if (lowerQuestion.includes(topic)) {
        return {
          content: '我是专注于宠物健康的AI顾问，无法回答天气等非宠物健康相关问题。请您描述宠物的健康状况或养护问题，我会尽力为您解答。',
          confidence: 0.98,
          isHealthRelated: false,
        };
      }
    }

    const context = this.analyzeContext(question, consultationHistory);

    for (const [keyword, synonyms] of Object.entries(questionSynonyms)) {
      if (this.matchesSynonym(question, synonyms)) {
        const answer = healthKnowledgeBase.commonQuestions[keyword];
        if (answer) {
          let content = answer.answer;
          
          if (context.hasHistory && context.relatedSymptoms.length > 0) {
            content += `\n\n结合之前您提到的${context.relatedSymptoms.join('、')}症状，建议您继续观察记录。`;
          }
          
          return { content, confidence: answer.confidence, isHealthRelated: true };
        }
      }
    }

    const foundSymptoms: string[] = [];
    for (const [symptom, synonyms] of Object.entries(symptomSynonyms)) {
      if (this.matchesSynonym(question, synonyms)) {
        foundSymptoms.push(symptom);
      }
    }

    if (context.hasHistory) {
      foundSymptoms.push(...context.relatedSymptoms);
    }

    const uniqueSymptoms = [...new Set(foundSymptoms)];

    if (uniqueSymptoms.length > 0) {
      const symptom = uniqueSymptoms[0];
      const data = healthKnowledgeBase.symptoms[symptom];
      if (data) {
        const conditionsStr = data.conditions
          .map(c => `- ${c.name}（概率: ${Math.round(c.probability * 100)}%）\n  建议: ${c.recommendation}`)
          .join('\n\n');
        
        const adviceStr = data.generalAdvice.map(a => `• ${a}`).join('\n');
        
        let petAdvice = '';
        if (petType && healthKnowledgeBase.petTypeAdvice[petType]) {
          petAdvice = `\n\n针对${petType === 'cat' ? '猫咪' : '狗狗'}的特别建议:\n${Object.values(healthKnowledgeBase.petTypeAdvice[petType]).map(a => `• ${a}`).join('\n')}`;
        }

        let contextNote = '';
        if (uniqueSymptoms.length > 1) {
          contextNote = `\n\n注意：您还提到了${uniqueSymptoms.slice(1).join('、')}等症状，建议综合观察。`;
        }

        const safeNotice = '\n\n⚠️ 安全声明：以上建议仅供参考，不能替代专业兽医诊断。如症状持续或加重，请立即就医。';
        
        const content = `根据您描述的「${symptom}」症状，可能的原因和建议如下：\n\n${conditionsStr}\n\n日常护理建议:\n${adviceStr}${petAdvice}${contextNote}${safeNotice}`;
        
        return { content, confidence: 0.92, isHealthRelated: true };
      }
    }

    const generalResponses = [
      {
        content: '感谢您的咨询！根据您的描述，我已了解情况。建议您继续观察宠物的状态，记录相关症状的频率和表现。如果症状持续或加重，请及时咨询兽医。\n\n⚠️ 安全声明：以上建议仅供参考，不能替代专业兽医诊断。',
        confidence: 0.85,
      },
      {
        content: '理解您的担忧！从您描述的情况来看，目前可以先进行居家护理观察。请保持环境安静，提供充足的水和食物。如有任何变化，请随时告诉我。\n\n⚠️ 安全声明：以上建议仅供参考，不能替代专业兽医诊断。',
        confidence: 0.82,
      },
      {
        content: '收到您的信息。为了更好地帮助您分析，请问宠物的年龄、品种、性别是什么？最近饮食和活动情况如何？\n\n⚠️ 安全声明：以上建议仅供参考，不能替代专业兽医诊断。',
        confidence: 0.88,
      },
    ];

    const randomResponse = generalResponses[Math.floor(Math.random() * generalResponses.length)];
    return { content: randomResponse.content, confidence: randomResponse.confidence, isHealthRelated: true };
  }

  generateResponse(message: AIMessage, petType?: string, consultationHistory: AIMessage[] = []): AIMessage {
    const analysis = this.analyzeQuestion(message.content, petType, consultationHistory);
    
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: analysis.content,
      createdAt: new Date().toISOString(),
    };
  }

  async sendMessage(consultationId: string, content: string, petType?: string, consultationHistory: AIMessage[] = []): Promise<AIMessage> {
    await this.simulateDelay(800 + Math.random() * 700);
    
    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };

    const aiResponse = this.generateResponse(userMessage, petType, consultationHistory);
    
    return aiResponse;
  }

  generateHealthReport(petId: string, petName: string, period: string, healthData: any = {}): HealthReport {
    const report: HealthReport = {
      id: Date.now().toString(),
      petId,
      petName,
      period,
      title: `${period}健康报告`,
      summary: healthData.hasData 
        ? '整体健康状况良好，各项指标正常。'
        : '暂无该时间段的健康数据，无法生成完整报告。',
      petBasicInfo: {
        name: petName,
        age: '2岁',
        breed: '英短蓝猫',
        weight: healthData.weight || '4.2kg',
      },
      healthEvents: healthData.events || [
        { date: '2024-05-15', type: '疫苗', description: '猫三联疫苗接种' },
        { date: '2024-04-20', type: '体重', description: '体重记录 4.1kg' },
      ],
      healthTrends: {
        weight: { trend: 'stable', change: 0.1, unit: 'kg' },
        activity: { trend: 'up', change: 15, unit: '分钟/天' },
      },
      healthScore: healthData.hasData ? 85 : 0,
      recommendations: healthData.hasData 
        ? [
            '继续保持定期体检',
            '增加饮水量',
            '适当增加户外活动',
            '定期驱虫',
          ]
        : [
            '建议先记录宠物的疫苗、体检或成长信息',
            '可以开始记录日常健康数据',
          ],
      isEmpty: !healthData.hasData,
      createdAt: new Date().toISOString(),
    };

    return report;
  }

  generateTrendReport(petId: string, period: '7d' | '30d' | '90d'): TrendReport {
    return {
      id: Date.now().toString(),
      petId,
      period,
      title: `${period}健康趋势报告`,
      summary: '整体健康状况良好，建议继续保持当前的护理方式。',
      keyFindings: [
        '体重稳定在理想范围内',
        '活动量适中，精力充沛',
        '饮食规律，食欲良好',
      ],
      recommendations: [
        '继续保持定期体检',
        '增加饮水量',
        '适当增加户外活动',
      ],
      healthScore: 85,
      chartsData: {},
      weight: { change: 0.2, trend: 'stable' },
      activity: { change: 30, trend: 'up' },
      createdAt: new Date().toISOString(),
    };
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const aiConsultationService = new AIConsultationService();
