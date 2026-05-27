// ============================================
// PawSync Pro 3.0 - Seven Level Alert Service
//
// 作者: 带娃的小陈工
// 日期: 2026-05-27
// 描述: 7级健康预警体系（L0-L6）
// ============================================

import type { AlertLevel, AlertEvent, BreedSpecificAlert, TrendAlert, AlertConfig } from '../types/seven-level-alert';

const MOCK_DELAY = 400;

// 7级预警配置
const alertLevelConfig: Record<AlertLevel, AlertConfig> = {
  L0: {
    level: 'L0',
    name: '正常',
    description: '所有指标正常',
    color: '#22C55E',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    icon: '✅',
    response: '无',
    notification: false
  },
  L1: {
    level: 'L1',
    name: '注意',
    description: '单次轻微异常',
    color: '#84CC16',
    bgColor: 'bg-lime-50',
    textColor: 'text-lime-700',
    borderColor: 'border-lime-200',
    icon: '⚠️',
    response: 'App内提醒',
    notification: true
  },
  L2: {
    level: 'L2',
    name: '观察',
    description: '24小时内同类异常≥3次',
    color: '#EAB308',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200',
    icon: '🔶',
    response: 'Push推送',
    notification: true
  },
  L3: {
    level: 'L3',
    name: '预警',
    description: '融合多模态异常信号持续',
    color: '#F97316',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
    icon: '🔷',
    response: '短信+Push',
    notification: true
  },
  L4: {
    level: 'L4',
    name: '紧急',
    description: '明确危险行为',
    color: '#EF4444',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    icon: '🚨',
    response: '电话提醒+SOS',
    notification: true
  },
  L5: {
    level: 'L5',
    name: '品种特异',
    description: '特定品种健康风险',
    color: '#A855F7',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    icon: '🔮',
    response: '针对性提醒',
    notification: true
  },
  L6: {
    level: 'L6',
    name: '趋势异常',
    description: '30天行为趋势偏离基线>2σ',
    color: '#6366F1',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-200',
    icon: '📊',
    response: '健康周报提醒',
    notification: true
  }
};

// 品种特异风险配置
const breedSpecificRisks: Record<string, BreedSpecificAlert[]> = {
  'Scottish Fold': [
    { breed: 'Scottish Fold', condition: '关节僵硬', description: '折耳猫易患软骨发育不良，需关注关节活动', riskLevel: 'L5', earlySigns: ['跳跃减少', '不愿活动', '肢体僵硬'] },
    { breed: 'Scottish Fold', condition: '耳部感染', description: '折耳导致耳道狭窄，易发生感染', riskLevel: 'L5', earlySigns: ['频繁抓耳', '耳朵异味', '分泌物'] }
  ],
  'Corgi': [
    { breed: 'Corgi', condition: '腰部异常', description: '柯基易患椎间盘突出，需控制体重', riskLevel: 'L5', earlySigns: ['弓背', '不愿上下楼梯', '后腿无力'] }
  ],
  'German Shepherd': [
    { breed: 'German Shepherd', condition: '髋关节发育不良', description: '德牧易患髋关节问题，需定期检查', riskLevel: 'L5', earlySigns: ['站立困难', '跛行', '活动减少'] }
  ],
  'Persian': [
    { breed: 'Persian', condition: '眼部问题', description: '波斯猫易患泪囊炎和眼睑内翻', riskLevel: 'L5', earlySigns: ['流泪增多', '眼部分泌物', '眯眼'] }
  ],
  'French Bulldog': [
    { breed: 'French Bulldog', condition: '呼吸问题', description: '法斗短鼻导致呼吸困难', riskLevel: 'L5', earlySigns: ['呼吸急促', '张口呼吸', '活动不耐受'] }
  ],
  'Golden Retriever': [
    { breed: 'Golden Retriever', condition: '髋关节发育不良', description: '金毛易患髋关节问题', riskLevel: 'L5', earlySigns: ['跳跃困难', '步态异常', '活动减少'] }
  ],
  'British Shorthair': [
    { breed: 'British Shorthair', condition: '肥胖倾向', description: '英短易肥胖，需控制饮食', riskLevel: 'L5', earlySigns: ['体重过快增长', '活动减少', '食欲亢进'] }
  ],
  'Husky': [
    { breed: 'Husky', condition: '肠胃敏感', description: '哈士奇肠胃敏感，易腹泻', riskLevel: 'L5', earlySigns: ['软便', '腹泻', '食欲波动'] }
  ]
};

class SevenLevelAlertService {
  private alertEvents: AlertEvent[] = [];
  private baselineData: Record<string, number[]> = {};

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    const levels: AlertLevel[] = ['L1', 'L2', 'L3', 'L5', 'L6'];
    
    levels.forEach((level, index) => {
      const config = alertLevelConfig[level];
      this.alertEvents.push({
        id: `alert-${level}-${index}`,
        petId: '1',
        level,
        title: this.generateAlertTitle(level),
        description: config.description,
        timestamp: new Date(Date.now() - index * 7200000).toISOString(),
        severity: this.getSeverity(level),
        acknowledged: index > 2,
        details: this.generateAlertDetails(level),
        recommendation: this.generateRecommendation(level)
      });
    });
  }

  private generateAlertTitle(level: AlertLevel): string {
    const titles: Record<AlertLevel, string> = {
      L0: '健康状态良好',
      L1: '轻微异常提醒',
      L2: '需密切观察',
      L3: '健康预警',
      L4: '紧急警报',
      L5: '品种特异风险提醒',
      L6: '趋势异常提醒'
    };
    return titles[level];
  }

  private generateAlertDetails(level: AlertLevel): string {
    const details: Record<AlertLevel, string> = {
      L0: '所有健康指标正常，宠物状态良好',
      L1: '检测到单次轻微异常行为，建议继续观察',
      L2: '24小时内同类异常已发生3次以上，需要关注',
      L3: '多模态融合检测到持续异常信号，建议加强监控',
      L4: '检测到明确危险行为，请立即关注宠物状况',
      L5: '检测到与品种相关的健康风险迹象',
      L6: '30天行为趋势分析显示偏离正常基线超过2σ'
    };
    return details[level];
  }

  private generateRecommendation(level: AlertLevel): string {
    const recommendations: Record<AlertLevel, string> = {
      L0: '继续保持当前护理方式',
      L1: '继续观察，记录异常发生频率',
      L2: '增加观察频率，记录详细情况',
      L3: '建议尽快联系兽医进行检查',
      L4: '立即就医！情况紧急',
      L5: '建议进行针对性体检，关注相关风险点',
      L6: '查看健康周报，了解详细趋势分析'
    };
    return recommendations[level];
  }

  private getSeverity(level: AlertLevel): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: Record<AlertLevel, 'low' | 'medium' | 'high' | 'critical'> = {
      L0: 'low',
      L1: 'low',
      L2: 'medium',
      L3: 'high',
      L4: 'critical',
      L5: 'medium',
      L6: 'medium'
    };
    return severityMap[level];
  }

  // 计算预警等级
  async calculateAlertLevel(petId: string): Promise<AlertLevel> {
    await this.simulateDelay(MOCK_DELAY);

    // 模拟基于各种因素计算预警等级
    const random = Math.random();
    
    if (random < 0.4) return 'L0';
    if (random < 0.6) return 'L1';
    if (random < 0.75) return 'L2';
    if (random < 0.85) return 'L3';
    if (random < 0.92) return 'L5';
    if (random < 0.98) return 'L6';
    return 'L4';
  }

  // 检测24小时异常频率
  async detect24HourFrequency(petId: string, behaviorType: string): Promise<{
    count: number;
    level: AlertLevel;
    exceedsThreshold: boolean;
  }> {
    await this.simulateDelay(MOCK_DELAY);

    const count = Math.floor(Math.random() * 5);
    const exceedsThreshold = count >= 3;
    
    let level: AlertLevel = 'L0';
    if (count === 1) level = 'L1';
    else if (count >= 3) level = 'L2';

    return { count, level, exceedsThreshold };
  }

  // 检测30天趋势异常
  async detectTrendAnomaly(petId: string): Promise<{
    hasAnomaly: boolean;
    deviation: number;
    level: AlertLevel;
    metrics: Array<{ name: string; deviation: number; baseline: number; current: number }>;
  }> {
    await this.simulateDelay(MOCK_DELAY);

    const deviation = 1.5 + Math.random() * 2;
    const hasAnomaly = deviation > 2;
    const level = hasAnomaly ? 'L6' : 'L0';

    const metrics = [
      { name: '活动量', deviation: deviation * 0.8, baseline: 50, current: 50 + deviation * 8 },
      { name: '睡眠质量', deviation: deviation * 0.6, baseline: 85, current: 85 + deviation * 3 },
      { name: '饮水量', deviation: deviation * 1.2, baseline: 280, current: 280 + deviation * 20 },
      { name: '进食规律', deviation: deviation * 0.7, baseline: 3, current: 3 + deviation * 0.5 }
    ];

    return { hasAnomaly, deviation, level, metrics };
  }

  // 检测品种特异风险
  async detectBreedSpecificRisk(petId: string, breed: string): Promise<BreedSpecificAlert[]> {
    await this.simulateDelay(MOCK_DELAY);

    const risks = breedSpecificRisks[breed] || [];
    
    // 随机决定是否检测到风险
    if (risks.length > 0 && Math.random() > 0.7) {
      return risks.slice(0, 2);
    }

    return [];
  }

  // 获取当前预警状态
  async getCurrentAlertLevel(petId: string): Promise<{
    level: AlertLevel;
    config: AlertConfig;
    events: AlertEvent[];
  }> {
    await this.simulateDelay(MOCK_DELAY);

    const level = await this.calculateAlertLevel(petId);
    const config = alertLevelConfig[level];
    const events = this.alertEvents.filter(e => e.petId === petId);

    return { level, config, events };
  }

  // 获取预警事件列表
  async getAlertEvents(petId: string, level?: AlertLevel): Promise<AlertEvent[]> {
    await this.simulateDelay(300);
    
    let events = this.alertEvents.filter(e => e.petId === petId);
    if (level) {
      events = events.filter(e => e.level === level);
    }
    
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // 确认预警
  async acknowledgeAlert(alertId: string): Promise<boolean> {
    await this.simulateDelay(200);
    
    const alert = this.alertEvents.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  // 创建预警事件
  async createAlertEvent(
    petId: string,
    level: AlertLevel,
    title: string,
    description: string,
    details: string,
    recommendation: string
  ): Promise<AlertEvent> {
    await this.simulateDelay(300);

    const event: AlertEvent = {
      id: `alert-${Date.now()}`,
      petId,
      level,
      title,
      description,
      timestamp: new Date().toISOString(),
      severity: this.getSeverity(level),
      acknowledged: false,
      details,
      recommendation
    };

    this.alertEvents.unshift(event);
    if (this.alertEvents.length > 100) {
      this.alertEvents.pop();
    }

    return event;
  }

  // 获取预警等级配置
  getAlertLevelConfig(level: AlertLevel): AlertConfig {
    return alertLevelConfig[level];
  }

  // 获取所有预警等级
  getAllAlertLevels(): AlertLevel[] {
    return ['L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6'];
  }

  // 获取品种风险配置
  getBreedSpecificRisks(breed: string): BreedSpecificAlert[] {
    return breedSpecificRisks[breed] || [];
  }

  // 获取所有品种风险
  getAllBreedRisks(): Record<string, BreedSpecificAlert[]> {
    return breedSpecificRisks;
  }

  // 获取趋势预警
  async getTrendAlert(petId: string): Promise<TrendAlert | null> {
    await this.simulateDelay(MOCK_DELAY);

    const result = await this.detectTrendAnomaly(petId);
    if (!result.hasAnomaly) return null;

    return {
      id: `trend-${Date.now()}`,
      petId,
      level: 'L6',
      deviation: result.deviation,
      metrics: result.metrics,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      recommendation: '建议查看健康周报，了解详细趋势分析'
    };
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const sevenLevelAlertService = new SevenLevelAlertService();