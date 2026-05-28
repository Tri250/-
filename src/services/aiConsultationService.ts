/**
 * PawSync Pro - AI问诊闭环服务
 * 实现分诊报告、紧急程度评估、医生连线
 * 作者: 带娃的小陈工
 */

export interface TriageReport {
  id: string;
  symptoms: string[];
  duration: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  possibleConditions: Array<{
    name: string;
    probability: number;
    description: string;
  }>;
  recommendations: string[];
  urgencyLevel: number; // 1-10
  isEmergency: boolean;
  requiresDoctor: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'doctor';
  content: string;
  timestamp: string;
  attachments?: string[];
}

export interface ConsultationSession {
  id: string;
  petId: string;
  petName: string;
  userId: string;
  status: 'ai_consulting' | 'waiting_doctor' | 'doctor_consulting' | 'completed';
  triageReport?: TriageReport;
  messages: ChatMessage[];
  doctorId?: string;
  doctorName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  title: string;
  hospital: string;
  specialties: string[];
  rating: number;
  consultationCount: number;
  avatar: string;
  isOnline: boolean;
}

class AIConsultationService {
  private sessions: Map<string, ConsultationSession> = new Map();
  private doctors: Doctor[] = [];

  constructor() {
    this.initializeMockData();
  }

  /**
   * 初始化模拟数据
   */
  private initializeMockData() {
    this.doctors = [
      {
        id: 'doctor-1',
        name: '李兽医',
        title: '主任医师',
        hospital: '爱宠宠物医院',
        specialties: ['内科', '老年病', '肿瘤'],
        rating: 4.9,
        consultationCount: 1567,
        avatar: 'doctor1.jpg',
        isOnline: true,
      },
      {
        id: 'doctor-2',
        name: '张医生',
        title: '主治医师',
        hospital: '萌爪动物诊所',
        specialties: ['外科', '皮肤病', '急诊'],
        rating: 4.8,
        consultationCount: 892,
        avatar: 'doctor2.jpg',
        isOnline: true,
      },
      {
        id: 'doctor-3',
        name: '王医生',
        title: '副主任医师',
        hospital: '宠物医疗中心',
        specialties: ['骨科', '神经科', '眼科'],
        rating: 4.7,
        consultationCount: 654,
        avatar: 'doctor3.jpg',
        isOnline: false,
      },
    ];
  }

  /**
   * 开始AI问诊
   */
  async startConsultation(petId: string, petName: string, userId: string): Promise<ConsultationSession> {
    const session: ConsultationSession = {
      id: `session_${Date.now()}`,
      petId,
      petName,
      userId,
      status: 'ai_consulting',
      messages: [
        {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: `您好！我是PawSync AI健康顾问，很高兴为您和${petName}服务。\n\n请描述一下宠物目前的情况，我会尽力帮您分析。`,
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.sessions.set(session.id, session);
    return session;
  }

  /**
   * AI对话回复
   */
  async getAIResponse(sessionId: string, userMessage: string): Promise<{
    response: string;
    shouldGenerateReport: boolean;
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('会话不存在');
    }

    // 添加用户消息
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    session.messages.push(userMsg);

    // 模拟AI分析
    const lowerMessage = userMessage.toLowerCase();
    let response = '';
    let shouldGenerateReport = false;

    if (lowerMessage.includes('呕吐') || lowerMessage.includes('vomit')) {
      response = `感谢您的描述。关于${session.petName}的呕吐情况：\n\n`;
      response += `• 呕吐可能是由多种原因引起\n`;
      response += `• 常见原因包括：饮食不当、消化不良、感染等\n`;
      response += `• 如果呕吐持续或伴有血丝，需要立即就医\n\n`;
      response += `请告诉我：\n`;
      response += `1. 呕吐的频率如何？\n`;
      response += `2. 呕吐物是什么样的？\n`;
      response += `3. 这种情况持续多久了？`;
      shouldGenerateReport = true;
    } else if (lowerMessage.includes('腹泻') || lowerMessage.includes('diarrhea')) {
      response = `了解了。关于${session.petName}的腹泻情况：\n\n`;
      response += `• 腹泻通常与饮食或感染相关\n`;
      response += `• 需要观察粪便的性状和频率\n\n`;
      response += `请告诉我：\n`;
      response += `1. 腹泻持续多长时间了？\n`;
      response += `2. 粪便中是否有血或粘液？\n`;
      response += `3. 宠物是否有精神食欲下降？`;
      shouldGenerateReport = true;
    } else if (lowerMessage.includes('皮肤') || lowerMessage.includes('掉毛')) {
      response = `好的，关于${session.petName}的皮肤问题：\n\n`;
      response += `• 皮肤问题可能由过敏、寄生虫或感染引起\n`;
      response += `• 需要观察皮肤是否有红肿、皮屑或脱毛\n\n`;
      response += `请描述一下：\n`;
      response += `1. 皮肤问题的具体部位？\n`;
      response += `2. 是否有瘙痒症状？\n`;
      response += `3. 毛发脱落的情况如何？`;
      shouldGenerateReport = true;
    } else if (lowerMessage.includes('谢谢') || lowerMessage.includes('明白了')) {
      response = `不客气！很高兴能帮助到您和${session.petName}。\n\n`;
      response += `如果您还有其他问题，随时可以继续咨询。\n`;
      response += `建议定期关注${session.petName}的健康状况，也可以使用我们的症状自查功能进行初步判断。`;
    } else {
      response = `谢谢您的描述。我会持续关注${session.petName}的情况。\n\n`;
      response += `请继续描述宠物的症状或提出您的问题，我会尽力帮助您。\n\n`;
      response += `💡 提示：您可以描述症状、持续时间、宠物行为变化等，这有助于我更准确地分析问题。`;
    }

    // 添加AI回复
    const assistantMsg: ChatMessage = {
      id: `msg_${Date.now() + 1}`,
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString(),
    };
    session.messages.push(assistantMsg);
    session.updatedAt = new Date().toISOString();

    return { response, shouldGenerateReport };
  }

  /**
   * 生成结构化分诊报告
   */
  async generateTriageReport(sessionId: string): Promise<TriageReport> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('会话不存在');
    }

    // 模拟分析消息生成报告
    const symptoms = this.extractSymptoms(session.messages);
    const { severity, urgencyLevel, possibleConditions, recommendations, isEmergency } = 
      this.analyzeSymptoms(symptoms);

    const report: TriageReport = {
      id: `report_${Date.now()}`,
      symptoms,
      duration: '待确认',
      severity,
      possibleConditions,
      recommendations,
      urgencyLevel,
      isEmergency,
      requiresDoctor: urgencyLevel >= 7 || isEmergency,
      createdAt: new Date().toISOString(),
    };

    session.triageReport = report;
    session.updatedAt = new Date().toISOString();

    return report;
  }

  /**
   * 提取症状关键词
   */
  private extractSymptoms(messages: ChatMessage[]): string[] {
    const symptoms: string[] = [];
    const symptomKeywords = [
      '呕吐', '腹泻', '食欲不振', '精神差', '嗜睡',
      '咳嗽', '打喷嚏', '流鼻涕', '呼吸困难',
      '皮肤瘙痒', '掉毛', '红肿', '脱毛',
      '跛行', '抽搐', '发热', '发抖',
      '眼泪多', '耳朵问题', '口臭', '便秘'
    ];

    const allText = messages.map(m => m.content).join('');
    
    symptomKeywords.forEach(keyword => {
      if (allText.includes(keyword)) {
        symptoms.push(keyword);
      }
    });

    return symptoms.length > 0 ? symptoms : ['一般性咨询'];
  }

  /**
   * 分析症状严重程度
   */
  private analyzeSymptoms(symptoms: string[]) {
    let urgencyLevel = 5;
    let severity: TriageReport['severity'] = 'moderate';
    const isEmergency = false;
    const possibleConditions: TriageReport['possibleConditions'] = [];
    const recommendations: string[] = [];

    const criticalSymptoms = ['呼吸困难', '抽搐', '发热', '严重出血'];
    const highSymptoms = ['呕吐', '腹泻', '食欲不振', '精神差'];
    const mediumSymptoms = ['咳嗽', '打喷嚏', '皮肤瘙痒', '掉毛'];

    if (symptoms.some(s => criticalSymptoms.includes(s))) {
      urgencyLevel = 9;
      severity = 'critical';
      possibleConditions.push(
        { name: '严重感染', probability: 0.4, description: '需要立即就医' },
        { name: '中毒', probability: 0.3, description: '可能接触有毒物质' },
        { name: '急性疾病', probability: 0.3, description: '情况紧急' }
      );
      recommendations.push(
        '⚠️ 情况紧急，建议立即带宠物就医！',
        '在路上可以先保持宠物安静，避免剧烈运动',
        '如有中毒可能，带上可疑物质样本'
      );
    } else if (symptoms.some(s => highSymptoms.includes(s))) {
      urgencyLevel = 7;
      severity = 'high';
      possibleConditions.push(
        { name: '胃肠炎', probability: 0.5, description: '消化系统炎症' },
        { name: '感染', probability: 0.3, description: '细菌或病毒感染' },
        { name: '应激反应', probability: 0.2, description: '环境变化引起' }
      );
      recommendations.push(
        '建议24小时内就医检查',
        '暂时禁食观察，提供充足饮水',
        '记录症状变化情况'
      );
    } else if (symptoms.some(s => mediumSymptoms.includes(s))) {
      urgencyLevel = 5;
      severity = 'moderate';
      possibleConditions.push(
        { name: '轻微感染', probability: 0.4, description: '局部感染' },
        { name: '过敏反应', probability: 0.3, description: '食物或环境过敏' },
        { name: '寄生虫', probability: 0.3, description: '可能需要驱虫' }
      );
      recommendations.push(
        '可以先观察1-2天',
        '注意饮食清淡',
        '如症状加重及时就医'
      );
    } else {
      urgencyLevel = 3;
      severity = 'low';
      possibleConditions.push(
        { name: '一般性不适', probability: 0.6, description: '轻微问题' },
        { name: '预防性咨询', probability: 0.4, description: '健康咨询' }
      );
      recommendations.push(
        '持续观察宠物状态',
        '保持良好生活习惯',
        '有疑问可以继续咨询'
      );
    }

    return { severity, urgencyLevel, possibleConditions, recommendations, isEmergency };
  }

  /**
   * 请求连线医生
   */
  async requestDoctor(sessionId: string): Promise<{
    success: boolean;
    doctor?: Doctor;
    estimatedWaitTime?: number;
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('会话不存在');
    }

    session.status = 'waiting_doctor';
    session.updatedAt = new Date().toISOString();

    // 找到在线医生
    const onlineDoctor = this.doctors.find(d => d.isOnline);
    
    if (onlineDoctor) {
      session.status = 'doctor_consulting';
      session.doctorId = onlineDoctor.id;
      session.doctorName = onlineDoctor.name;
      session.updatedAt = new Date().toISOString();

      // 添加系统消息
      const systemMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `✅ 已为您连线${onlineDoctor.name}医生，请描述您的问题，医生会尽快回复。`,
        timestamp: new Date().toISOString(),
      };
      session.messages.push(systemMsg);

      return {
        success: true,
        doctor: onlineDoctor,
        estimatedWaitTime: 0,
      };
    }

    return {
      success: false,
      estimatedWaitTime: 10, // 预计等待10分钟
    };
  }

  /**
   * 发送消息给医生
   */
  async sendMessageToDoctor(sessionId: string, content: string): Promise<ChatMessage> {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'doctor_consulting') {
      throw new Error('当前不在医生咨询模式');
    }

    // 添加用户消息
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    session.messages.push(userMsg);
    session.updatedAt = new Date().toISOString();

    // 模拟医生回复（实际应使用WebSocket）
    const doctorMsg: ChatMessage = {
      id: `msg_${Date.now() + 1}`,
      role: 'doctor',
      content: `您好！我是${session.doctorName}，看到了您的问题。${this.getMockDoctorResponse(content)}`,
      timestamp: new Date().toISOString(),
    };
    session.messages.push(doctorMsg);
    session.updatedAt = new Date().toISOString();

    return doctorMsg;
  }

  /**
   * 模拟医生回复
   */
  private getMockDoctorResponse(question: string): string {
    const lowerQ = question.toLowerCase();
    
    if (lowerQ.includes('怎么办') || lowerQ.includes('how')) {
      return '根据您描述的情况，我建议先观察一段时间。如果症状持续或加重，建议带宠物来医院做进一步检查。';
    }
    
    if (lowerQ.includes('吃什么') || lowerQ.includes('food')) {
      return '建议给宠物喂食清淡易消化的食物，比如煮熟的鸡胸肉和米饭。避免油腻和刺激性食物。';
    }
    
    if (lowerQ.includes('药') || lowerQ.includes('medicine')) {
      return '关于用药，建议先咨询专业兽医，不要自行给宠物喂药。有些人类药物对宠物有毒。';
    }

    return '感谢您的描述。请继续描述宠物的具体情况，我会尽力帮助您分析。';
  }

  /**
   * 获取会话详情
   */
  getSession(sessionId: string): ConsultationSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * 获取在线医生列表
   */
  getOnlineDoctors(): Doctor[] {
    return this.doctors.filter(d => d.isOnline);
  }

  /**
   * 获取所有医生
   */
  getAllDoctors(): Doctor[] {
    return this.doctors;
  }

  /**
   * 结束问诊
   */
  async endConsultation(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    session.status = 'completed';
    session.updatedAt = new Date().toISOString();

    // 添加结束消息
    const endMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: `感谢您的咨询，祝${session.petName}健康成长！如有问题随时欢迎回来咨询。`,
      timestamp: new Date().toISOString(),
    };
    session.messages.push(endMsg);

    return true;
  }

  /**
   * 获取历史问诊记录
   */
  getConsultationHistory(userId: string): ConsultationSession[] {
    const sessions: ConsultationSession[] = [];
    this.sessions.forEach(session => {
      if (session.userId === userId) {
        sessions.push(session);
      }
    });
    return sessions.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  /**
   * 获取分诊报告
   */
  getTriageReport(sessionId: string): TriageReport | null {
    const session = this.sessions.get(sessionId);
    return session?.triageReport || null;
  }
}

export const aiConsultationService = new AIConsultationService();
