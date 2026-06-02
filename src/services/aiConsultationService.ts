import type { AIMessage, ConversationContext } from '../types/ai-consultation';
import { SYMPTOM_KEYWORDS, INTENT_KEYWORDS } from '../types/ai-consultation';

interface AIResponse {
  content: string;
  confidence: number;
  source?: string;
}

interface HealthKnowledgeBase {
  symptoms: Record<string, {
    conditions: { name: string; probability: number; severity: string; recommendation: string }[];
    generalAdvice: string[];
  }>;
  commonQuestions: Record<string, { answer: string; confidence: number }>;
  petTypeAdvice: Record<string, Record<string, string>>;
  followUpQuestions: Record<string, string[]>;
  contextResponses: Record<string, string>;
}

const symptomSynonyms: Record<string, string[]> = {
  '食欲不振': ['食欲不振', '没胃口', '不想吃', '不吃饭', '拒食', '不吃东西', '吃得少'],
  '呕吐': ['呕吐', '吐了', '反胃', '呕', '吐', '恶心'],
  '咳嗽': ['咳嗽', '咳', '打喷嚏', '咳咳', '干咳'],
  '腹泻': ['腹泻', '拉肚子', '拉稀', '便便稀', '软便', '拉', '大便稀'],
  '发烧': ['发烧', '发热', '体温高', '体温', '发烫', '热度'],
  '脱毛': ['脱毛', '掉毛', '掉毛严重', '毛掉得多', '秃', '掉头发'],
  '嗜睡': ['嗜睡', '贪睡', '爱睡觉', '没精神', '精神不好', '懒洋洋'],
  '攻击性': ['攻击性', '凶', '咬人', '攻击', '脾气坏', '暴躁'],
  '瘙痒': ['瘙痒', '痒', '抓', '挠', '皮肤痒', '一直抓'],
  '口臭': ['口臭', '口气', '嘴巴臭', '口臭味'],
  '眼屎': ['眼屎', '眼睛分泌物', '眼泪', '眼红', '眼睛发炎'],
  '耳垢': ['耳垢', '耳朵脏', '耳屎', '耳朵臭', '抓耳朵'],
  '跛行': ['跛行', '瘸', '腿瘸', '走路一瘸一拐', '不敢着地'],
  '便秘': ['便秘', '拉不出', '大便干', '排便困难', '不拉屎'],
  '尿频': ['尿频', '尿多', '频繁尿', '尿血', '排尿困难'],
  '焦虑': ['焦虑', '紧张', '害怕', '不安', '恐惧', '应激'],
};

const questionSynonyms: Record<string, string[]> = {
  '驱虫': ['驱虫', '打虫', '寄生虫', '体内驱虫', '体外驱虫', '虫子', '蛔虫', '跳蚤', '蜱虫'],
  '疫苗': ['疫苗', '打针', '免疫', '预防针', '接种', '狂犬', '猫三联', '狗四联'],
  '体检': ['体检', '检查', '健康检查', '身体检查', '查体', '化验'],
  '换牙': ['换牙', '长牙', '牙齿', '乳牙', '双排牙', '掉牙'],
  '应激': ['应激', '紧张', '害怕', '焦虑', '适应', '新环境'],
  '发烧判断': ['发烧', '发热', '体温', '量体温', '测体温', '温度'],
  '饮水量': ['喝水', '饮水', '喝水量', '水量', '水', '不喝水'],
  '体重管理': ['体重', '减肥', '胖', '瘦', '体型', '超重', '肥胖'],
  '绝育': ['绝育', '去势', '结扎', '阉割', '做手术', '摘除'],
  '喂养': ['喂养', '喂食', '吃', '狗粮', '猫粮', '食物', '营养', '饮食'],
  '洗澡': ['洗澡', '洗浴', '清洁', '沐浴', '香波', '洗毛'],
  '训练': ['训练', '教', '学会', '行为', '习惯', '指令'],
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
      generalAdvice: ['保持食物新鲜', '提供多种食物选择', '定时定量喂食', '观察精神状态'],
    },
    '呕吐': {
      conditions: [
        { name: '饮食不当', probability: 0.5, severity: 'low', recommendation: '禁食12-24小时，少量多次给水' },
        { name: '毛球症', probability: 0.25, severity: 'low', recommendation: '使用化毛膏或猫草' },
        { name: '肠胃不适', probability: 0.15, severity: 'medium', recommendation: '观察粪便和精神状态，必要时送医院检查' },
        { name: '严重疾病', probability: 0.1, severity: 'high', recommendation: '如频繁呕吐、带血或精神萎靡请立即送医院' },
      ],
      generalAdvice: ['记录呕吐频率和内容', '避免喂油腻食物', '提供充足清水', '观察是否伴随腹泻'],
    },
    '咳嗽': {
      conditions: [
        { name: '轻微感冒', probability: 0.4, severity: 'low', recommendation: '保持温暖，增加湿度，观察1-2天' },
        { name: '呼吸道感染', probability: 0.3, severity: 'medium', recommendation: '观察是否有鼻涕、发热，必要时就医' },
        { name: '异物吸入', probability: 0.2, severity: 'high', recommendation: '如咳嗽剧烈或持续请立即检查' },
        { name: '过敏', probability: 0.1, severity: 'low', recommendation: '检查环境中是否有新的过敏原' },
      ],
      generalAdvice: ['保持室内空气清新', '避免烟雾和灰尘', '监测呼吸状态', '注意是否伴有发热'],
    },
    '腹泻': {
      conditions: [
        { name: '饮食变化', probability: 0.4, severity: 'low', recommendation: '暂时喂食清淡食物，逐渐恢复正常饮食' },
        { name: '寄生虫', probability: 0.3, severity: 'medium', recommendation: '检查粪便，必要时驱虫' },
        { name: '细菌感染', probability: 0.2, severity: 'medium', recommendation: '观察是否发热，必要时就医' },
        { name: '病毒感染', probability: 0.1, severity: 'high', recommendation: '如伴随发热、呕吐请立即就医' },
      ],
      generalAdvice: ['补充水分防止脱水', '记录粪便颜色和性状', '避免油腻食物', '暂时禁食后给易消化食物'],
    },
    '发烧': {
      conditions: [
        { name: '感染', probability: 0.5, severity: 'medium', recommendation: '监测体温，必要时就医' },
        { name: '炎症反应', probability: 0.3, severity: 'medium', recommendation: '观察伴随症状' },
        { name: '疫苗反应', probability: 0.1, severity: 'low', recommendation: '接种后24-48小时轻微发热正常' },
        { name: '严重疾病', probability: 0.1, severity: 'high', recommendation: '体温超过39.5°C或持续超过24小时请就医' },
      ],
      generalAdvice: ['保持舒适环境', '提供充足清水', '避免过度包裹', '定时测量体温'],
    },
    '脱毛': {
      conditions: [
        { name: '正常换毛', probability: 0.4, severity: 'low', recommendation: '增加梳毛频率' },
        { name: '皮肤问题', probability: 0.3, severity: 'medium', recommendation: '检查皮肤是否有红肿、皮屑' },
        { name: '压力', probability: 0.2, severity: 'low', recommendation: '提供安全环境和互动' },
        { name: '营养缺乏', probability: 0.1, severity: 'medium', recommendation: '检查饮食是否均衡' },
      ],
      generalAdvice: ['定期梳毛', '保持皮肤清洁', '提供营养补充', '检查是否有皮肤病变'],
    },
    '嗜睡': {
      conditions: [
        { name: '正常休息', probability: 0.4, severity: 'low', recommendation: '观察是否恢复活力' },
        { name: '疲劳', probability: 0.3, severity: 'low', recommendation: '保证充足休息' },
        { name: '发热或疾病', probability: 0.2, severity: 'high', recommendation: '测量体温，如异常请就医' },
        { name: '药物影响', probability: 0.1, severity: 'low', recommendation: '检查近期用药情况' },
      ],
      generalAdvice: ['记录睡眠时长', '监测精神状态', '保证舒适休息环境', '观察食欲变化'],
    },
    '攻击性': {
      conditions: [
        { name: '恐惧或压力', probability: 0.4, severity: 'low', recommendation: '提供安全空间，避免刺激' },
        { name: '领地行为', probability: 0.3, severity: 'low', recommendation: '适当社交化训练' },
        { name: '疼痛', probability: 0.2, severity: 'high', recommendation: '检查是否有身体不适' },
        { name: '未绝育', probability: 0.1, severity: 'low', recommendation: '考虑绝育手术' },
      ],
      generalAdvice: ['避免惩罚', '使用正向训练', '提供充足玩具', '观察触发因素'],
    },
    '瘙痒': {
      conditions: [
        { name: '皮肤过敏', probability: 0.4, severity: 'medium', recommendation: '检查过敏原，使用抗过敏药物' },
        { name: '寄生虫', probability: 0.3, severity: 'medium', recommendation: '检查是否有跳蚤、螨虫' },
        { name: '皮肤干燥', probability: 0.2, severity: 'low', recommendation: '使用保湿洗浴产品' },
        { name: '真菌感染', probability: 0.1, severity: 'medium', recommendation: '就医检查，使用抗真菌药物' },
      ],
      generalAdvice: ['定期驱虫', '保持皮肤清洁', '避免过度洗澡', '检查皮肤状况'],
    },
    '口臭': {
      conditions: [
        { name: '牙结石', probability: 0.5, severity: 'medium', recommendation: '定期洁牙，使用洁牙骨或洁牙零食' },
        { name: '口腔炎症', probability: 0.25, severity: 'medium', recommendation: '检查口腔，必要时就医' },
        { name: '消化问题', probability: 0.15, severity: 'low', recommendation: '调整饮食，观察消化情况' },
        { name: '肾脏问题', probability: 0.1, severity: 'high', recommendation: '如伴随其他症状请就医检查' },
      ],
      generalAdvice: ['定期刷牙', '使用洁牙零食', '定期口腔检查', '观察饮食习惯'],
    },
  },
  commonQuestions: {
    '驱虫': {
      answer: '常规驱虫建议：体内驱虫每3-6个月一次，体外驱虫每月一次。具体频率需根据宠物生活环境和兽医建议调整。幼犬幼猫建议从2周龄开始驱虫，每2周一次直到3月龄。',
      confidence: 0.98,
    },
    '疫苗': {
      answer: '基础疫苗包括猫三联/狗四联，首年完成基础免疫后每年加强一次。狂犬病疫苗根据当地法规执行，通常每年或三年一次。幼宠6-8周龄开始首免，每隔3-4周接种一次，共3-4次。',
      confidence: 0.97,
    },
    '体检': {
      answer: '建议每年进行一次全面体检，7岁以上老年宠物建议每半年一次。体检项目包括血常规、生化、X光、B超等。定期体检可以早期发现潜在健康问题。',
      confidence: 0.96,
    },
    '换牙': {
      answer: '狗狗换牙期通常在4-6个月，猫咪在3-5个月。期间可能出现牙龈红肿、爱咬东西，提供磨牙玩具，注意观察是否有双排牙。如乳牙未脱落需就医拔除。',
      confidence: 0.95,
    },
    '应激': {
      answer: '宠物应激反应包括躲起来、食欲不振、过度舔毛、攻击行为等。提供安静环境、熟悉的物品、费洛蒙扩散器都有助于缓解。新宠物到家需要2-4周适应期。',
      confidence: 0.94,
    },
    '发烧判断': {
      answer: '猫咪正常体温38.0-39.2°C，狗狗37.5-39.0°C。超过39.5°C属于高烧，需立即就医。可用直肠温度计或耳温计测量。发烧时宠物可能表现为精神萎靡、食欲不振、呼吸急促。',
      confidence: 0.96,
    },
    '饮水量': {
      answer: '猫咪每天需水量约40-60ml/kg体重，狗狗约50-100ml/kg。多提供饮水点，可尝试流动饮水机增加饮水量。饮水量突然增加或减少都可能是健康问题的信号。',
      confidence: 0.95,
    },
    '体重管理': {
      answer: '体重管理建议：定期称重，保持理想体态评分(BCS 4-5/9)。控制热量摄入，增加运动量，选择低脂食物，避免过度喂食零食。肥胖会增加糖尿病、关节炎等疾病风险。',
      confidence: 0.97,
    },
    '绝育': {
      answer: '建议在6-12月龄进行绝育手术。绝育可以预防多种疾病（如子宫蓄脓、乳腺肿瘤、前列腺问题），减少攻击性和标记行为。术后需注意护理，防止舔舐伤口。',
      confidence: 0.96,
    },
    '喂养': {
      answer: '成犬建议每天喂食2次，成猫可自由采食或分2-3次。选择优质商业粮或均衡自制餐。幼宠需要更高频率喂食（3-4次/天）。避免喂食巧克力、洋葱、葡萄等有毒食物。',
      confidence: 0.97,
    },
    '洗澡': {
      answer: '狗狗建议1-2周洗一次，猫咪通常不需要频繁洗澡（除非脏了或有皮肤问题）。使用宠物专用洗浴产品，水温37-38°C，洗后彻底吹干。洗澡频率过高会破坏皮肤保护层。',
      confidence: 0.94,
    },
    '训练': {
      answer: '训练建议：使用正向强化方法，奖励正确行为。每次训练5-10分钟，保持耐心和一致性。基础指令包括坐下、趴下、等待、过来。社会化训练在幼宠期（3-14周）最为关键。',
      confidence: 0.95,
    },
  },
  petTypeAdvice: {
    cat: {
      hairball: '定期喂食化毛膏或猫草，每周1-2次',
      litterbox: '保持猫砂盆清洁，多猫家庭需提供多个猫砂盆',
      scratching: '提供抓板，定期修剪指甲',
      territory: '猫咪有强烈的领地意识，环境变化需循序渐进',
      water: '猫咪天生不爱喝水，可尝试流动水源或湿粮增加水分摄入',
    },
    dog: {
      exercise: '每天至少两次散步，运动量根据体型和年龄调整',
      training: '坚持基础服从训练，正向强化为主',
      socialization: '尽早社交化，接触不同环境和人群',
      chewing: '提供合适的咀嚼玩具，避免破坏家具',
      grooming: '定期梳毛、修剪指甲、清洁耳朵',
    },
  },
  followUpQuestions: {
    '食欲不振': ['这种情况持续多久了？', '宠物最近有没有换粮或环境变化？', '除了食欲不振还有其他症状吗？'],
    '呕吐': ['呕吐物是什么样子的？', '呕吐频率如何？', '最近有没有吃过不干净的东西？'],
    '腹泻': ['粪便是什么颜色和性状？', '有没有血丝或粘液？', '腹泻持续多久了？'],
    '发烧': ['体温是多少度？', '有没有测量过体温？', '除了发热还有其他症状吗？'],
    '咳嗽': ['咳嗽是干咳还是有痰？', '咳嗽频率如何？', '有没有接触过其他生病的动物？'],
    '瘙痒': ['瘙痒部位在哪里？', '皮肤有没有红肿或脱毛？', '最近有没有换过洗浴用品？'],
  },
  contextResponses: {
    'continue': '关于您刚才提到的症状，请问还有其他需要补充的吗？',
    'clarify': '为了更准确地判断，我需要了解更多信息：',
    'reassure': '请不要过于担心，这种情况在宠物中比较常见。',
    'urgent': '⚠️ 根据您描述的情况，建议您尽快带宠物就医检查。',
    'monitor': '建议您继续观察24-48小时，如果症状加重请及时就医。',
  },
};

export class AIConsultationService {
  private consultations: Map<string, AIMessage[]> = new Map();

  private matchesSynonym(question: string, synonyms: string[]): boolean {
    const lowerQuestion = question.toLowerCase();
    return synonyms.some(synonym => lowerQuestion.includes(synonym.toLowerCase()));
  }

  private detectIntent(message: string): string | null {
    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        return intent;
      }
    }
    return null;
  }

  private extractSymptoms(message: string): string[] {
    const foundSymptoms: string[] = [];
    for (const [symptom, synonyms] of Object.entries(symptomSynonyms)) {
      if (this.matchesSynonym(message, synonyms)) {
        foundSymptoms.push(symptom);
      }
    }
    return foundSymptoms;
  }

  private extractPetInfo(message: string): Partial<ConversationContext['petInfo']> {
    const info: Partial<ConversationContext['petInfo']> = {};
    
    if (message.includes('猫') || message.includes('猫咪')) {
      info.type = 'cat';
    } else if (message.includes('狗') || message.includes('狗狗')) {
      info.type = 'dog';
    }
    
    const ageMatch = message.match(/(\d+)\s*(岁|月|年)/);
    if (ageMatch) {
      const num = parseInt(ageMatch[1]);
      if (message.includes('月')) {
        info.age = num / 12;
      } else {
        info.age = num;
      }
    }
    
    const weightMatch = message.match(/(\d+(?:\.\d+)?)\s*(kg|公斤|斤)/);
    if (weightMatch) {
      const weight = parseFloat(weightMatch[1]);
      info.weight = message.includes('斤') ? weight / 2 : weight;
    }
    
    return info;
  }

  extractContextInfo(message: string, currentContext: ConversationContext): Partial<ConversationContext> {
    const update: Partial<ConversationContext> = {};
    
    const petInfo = this.extractPetInfo(message);
    if (Object.keys(petInfo).length > 0) {
      update.petInfo = { ...currentContext.petInfo, ...petInfo };
    }
    
    const symptoms = this.extractSymptoms(message);
    if (symptoms.length > 0) {
      update.mentionedSymptoms = [...new Set([...currentContext.mentionedSymptoms, ...symptoms])];
    }
    
    const intent = this.detectIntent(message);
    if (intent) {
      update.lastIntent = intent;
      update.discussedTopics = [...new Set([...currentContext.discussedTopics, intent])];
    }
    
    return update;
  }

  private buildContextualResponse(
    message: string,
    context: ConversationContext,
    baseResponse: string,
    detectedSymptoms: string[]
  ): string {
    let response = baseResponse;
    
    if (context.mentionedSymptoms.length > 1 && detectedSymptoms.length > 0) {
      response += `\n\n📋 您之前还提到了「${context.mentionedSymptoms.filter(s => !detectedSymptoms.includes(s)).join('、')}」的症状，这些症状可能与当前情况相关，建议一并关注。`;
    }
    
    if (detectedSymptoms.length > 0 && healthKnowledgeBase.followUpQuestions[detectedSymptoms[0]]) {
      const questions = healthKnowledgeBase.followUpQuestions[detectedSymptoms[0]];
      response += `\n\n❓ ${questions[0]}`;
    }
    
    if (context.lastIntent === 'emergency') {
      response = '⚠️ **紧急提示**\n\n' + response;
    }
    
    return response;
  }

  analyzeQuestion(question: string, petType?: string, context?: ConversationContext): AIResponse {
    const detectedSymptoms = this.extractSymptoms(question);
    const intent = this.detectIntent(question);
    
    for (const [keyword, synonyms] of Object.entries(questionSynonyms)) {
      if (this.matchesSynonym(question, synonyms)) {
        const answer = healthKnowledgeBase.commonQuestions[keyword];
        if (answer) {
          let response = answer.answer;
          
          if (petType && healthKnowledgeBase.petTypeAdvice[petType]) {
            const petAdvice = healthKnowledgeBase.petTypeAdvice[petType];
            const relevantAdvice = Object.entries(petAdvice)
              .filter(([key]) => question.includes(key) || keyword.includes(key))
              .map(([, value]) => value);
            if (relevantAdvice.length > 0) {
              response += `\n\n🐱 针对${petType === 'cat' ? '猫咪' : '狗狗'}的建议：\n${relevantAdvice.map(a => `• ${a}`).join('\n')}`;
            }
          }
          
          return { content: response, confidence: answer.confidence };
        }
      }
    }

    for (const [symptom, synonyms] of Object.entries(symptomSynonyms)) {
      if (this.matchesSynonym(question, synonyms)) {
        const data = healthKnowledgeBase.symptoms[symptom];
        if (data) {
          const conditionsStr = data.conditions
            .map(c => `- ${c.name}（概率: ${Math.round(c.probability * 100)}%）\n  💡 建议: ${c.recommendation}`)
            .join('\n\n');
          
          const adviceStr = data.generalAdvice.map(a => `• ${a}`).join('\n');
          
          let petAdvice = '';
          if (petType && healthKnowledgeBase.petTypeAdvice[petType]) {
            petAdvice = `\n\n🐱 针对${petType === 'cat' ? '猫咪' : '狗狗'}的特别建议:\n${Object.values(healthKnowledgeBase.petTypeAdvice[petType]).map(a => `• ${a}`).join('\n')}`;
          }
          
          let severityEmoji = 'ℹ️';
          const highSeverity = data.conditions.find(c => c.severity === 'high' && c.probability > 0.15);
          if (highSeverity) {
            severityEmoji = '⚠️';
          }
          
          let content = `${severityEmoji} 根据您描述的「${symptom}」症状，可能的原因和建议如下：\n\n${conditionsStr}\n\n📝 日常护理建议:\n${adviceStr}${petAdvice}`;
          
          if (context) {
            content = this.buildContextualResponse(question, context, content, [symptom]);
          }
          
          return { content, confidence: 0.92 };
        }
      }
    }

    const contextAwareResponses = this.generateContextAwareResponse(question, context, detectedSymptoms, intent);
    return contextAwareResponses;
  }

  private generateContextAwareResponse(
    question: string,
    context?: ConversationContext,
    detectedSymptoms?: string[],
    intent?: string | null
  ): AIResponse {
    if (context && context.mentionedSymptoms.length > 0 && detectedSymptoms && detectedSymptoms.length === 0) {
      const previousSymptoms = context.mentionedSymptoms;
      return {
        content: `您之前提到了「${previousSymptoms.join('、')}」的症状，请问现在这些症状有好转吗？还是出现了新的问题？\n\n请详细描述一下当前的情况，我会为您提供更准确的建议。`,
        confidence: 0.88,
      };
    }

    if (intent === 'emergency') {
      return {
        content: '⚠️ **紧急情况提示**\n\n根据您的描述，这可能是一个需要紧急处理的情况。建议您：\n\n1. 立即联系最近的宠物医院\n2. 在前往医院的路上保持宠物安静和温暖\n3. 如果可能，记录症状发生的时间和表现\n4. 不要自行用药，以免掩盖症状\n\n需要我帮您查找附近的宠物医院吗？',
        confidence: 0.95,
      };
    }

    if (intent === 'diagnosis') {
      return {
        content: '根据您的描述，我需要更多信息来帮助分析可能的原因：\n\n1. 📅 这种症状持续多久了？\n2. 🐾 宠物的年龄和品种？\n3. 📊 症状的频率和严重程度？\n4. 🔍 是否有其他伴随症状？\n\n请提供这些信息，我会给出更准确的判断。',
        confidence: 0.85,
      };
    }

    if (intent === 'treatment') {
      return {
        content: '关于治疗建议，我需要先了解具体情况：\n\n1. 宠物目前的主要症状是什么？\n2. 症状持续多长时间了？\n3. 是否已经看过兽医？\n4. 是否有用药史或过敏史？\n\n⚠️ 请注意：对于严重症状，建议先就医确诊，不要自行用药治疗。',
        confidence: 0.86,
      };
    }

    if (intent === 'prevention') {
      return {
        content: '预防措施建议：\n\n🏥 **定期体检**：每年至少一次全面体检\n💉 **疫苗接种**：按时完成疫苗接种\n🐛 **定期驱虫**：体内驱虫每3-6个月，体外驱虫每月\n🥗 **均衡饮食**：选择优质宠物食品\n🏃 **适量运动**：保持适当运动量\n🧼 **卫生管理**：定期清洁和梳理\n\n请问您想了解哪个方面的具体预防措施？',
        confidence: 0.90,
      };
    }

    if (intent === 'nutrition') {
      return {
        content: '关于宠物饮食营养建议：\n\n🍖 **主食选择**：\n• 选择符合AAFCO标准的优质商业粮\n• 幼宠需要高蛋白、高能量的幼宠粮\n• 老年宠物需要易消化的老年粮\n\n🚫 **禁忌食物**：\n• 巧克力、洋葱、葡萄、木糖醇\n• 煮熟的骨头、生鸡蛋\n\n💧 **饮水建议**：\n• 保持充足的清洁饮水\n• 猫咪可尝试流动水源增加饮水量\n\n请问您想了解哪种宠物或哪个年龄段的具体饮食建议？',
        confidence: 0.91,
      };
    }

    if (intent === 'behavior') {
      return {
        content: '关于宠物行为训练建议：\n\n🎯 **基础训练原则**：\n• 使用正向强化方法\n• 保持耐心和一致性\n• 每次训练5-10分钟\n\n📚 **基础指令**：\n• 坐下、趴下、等待、过来\n• 定点排便训练\n• 社交化训练\n\n⚠️ **常见问题**：\n• 分离焦虑：逐渐适应独处\n• 攻击行为：找出原因，避免惩罚\n• 破坏行为：提供足够玩具和运动\n\n请问您遇到了什么具体的行为问题？',
        confidence: 0.89,
      };
    }

    const generalResponses = [
      {
        content: '感谢您的咨询！为了更好地帮助您，请告诉我：\n\n1. 🐾 您的宠物是什么品种？多大了？\n2. 📋 具体有什么症状或问题？\n3. ⏰ 这种情况持续多久了？\n4. 🔍 是否有其他伴随症状？\n\n提供这些信息后，我可以给您更准确的建议。',
        confidence: 0.85,
      },
      {
        content: '您好！我是您的AI健康顾问。我可以帮助您：\n\n🔍 分析宠物症状和可能原因\n💊 提供护理和治疗建议\n📋 解答日常养护问题\n⚠️ 判断是否需要紧急就医\n\n请详细描述您的问题，我会尽力为您提供专业建议。',
        confidence: 0.88,
      },
      {
        content: '收到您的信息。为了更准确地分析，请问：\n\n• 宠物的种类、年龄、性别？\n• 主要症状是什么？\n• 症状持续多长时间？\n• 近期是否有环境变化或饮食变化？\n\n这些信息有助于我给出更精准的建议。',
        confidence: 0.86,
      },
    ];

    const randomResponse = generalResponses[Math.floor(Math.random() * generalResponses.length)];
    return { content: randomResponse.content, confidence: randomResponse.confidence };
  }

  generateResponse(message: AIMessage, petType?: string, context?: ConversationContext): AIMessage {
    const analysis = this.analyzeQuestion(message.content, petType, context);
    
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: analysis.content,
      messageType: 'text',
      createdAt: new Date().toISOString(),
    };
  }

  async sendMessageWithContext(
    content: string,
    contextMessages: AIMessage[],
    context: ConversationContext,
    petType?: string
  ): Promise<AIMessage> {
    await this.simulateDelay(800 + Math.random() * 700);
    
    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      messageType: 'text',
      createdAt: new Date().toISOString(),
    };

    const analysis = this.analyzeQuestion(content, petType, context);
    
    let responseContent = analysis.content;
    
    if (contextMessages.length > 0) {
      const lastMessage = contextMessages[contextMessages.length - 1];
      if (lastMessage.role === 'assistant') {
        const isFollowUp = content.length < 20 || 
          content.includes('还有') || 
          content.includes('然后') ||
          content.includes('另外') ||
          content.includes('那');
        
        if (isFollowUp && context.mentionedSymptoms.length > 0) {
          responseContent = `好的，关于您之前提到的「${context.mentionedSymptoms.join('、')}」问题：\n\n${analysis.content}`;
        }
      }
    }
    
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: responseContent,
      messageType: 'text',
      createdAt: new Date().toISOString(),
    };
  }

  async sendMessage(consultationId: string, content: string, petType?: string): Promise<AIMessage> {
    await this.simulateDelay(800 + Math.random() * 700);
    
    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      messageType: 'text',
      createdAt: new Date().toISOString(),
    };

    const aiResponse = this.generateResponse(userMessage, petType);
    
    return aiResponse;
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const aiConsultationService = new AIConsultationService();