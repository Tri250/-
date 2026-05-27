// ============================================
// PawSync Pro 3.0 - AI Health Alert Service
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: AI多模态健康预警系统服务
// ============================================

import type { 
  AIBehaviorAlert, 
  AlertLevel, 
  BehaviorType, 
  SmartFeederData,
  ComprehensiveHealthScore,
  HealthDashboard,
  VetHospital,
  MedicalRecord,
  ChartDataPoint,
  ActivityChartData,
  SleepChartData,
  GrowthCurveData,
  HealthNotification,
  HealthReport
} from '../types/advanced-health';

const MOCK_DELAY = 800;

// 行为类型配置
const behaviorConfig: Record<BehaviorType, {
  label: string;
  icon: string;
  defaultAlertLevel: AlertLevel;
  symptoms: string[];
  recommendations: Record<AlertLevel, string>;
  requiresVet: Record<AlertLevel, boolean>;
}> = {
  vomiting: {
    label: '呕吐',
    icon: '🩺',
    defaultAlertLevel: 'orange',
    symptoms: ['呕吐物颜色异常', '频繁呕吐', '伴随腹泻', '精神萎靡'],
    recommendations: {
      green: '观察是否有重复呕吐，记录呕吐频率和内容',
      yellow: '禁食4-6小时观察，提供少量清水，如持续需就医',
      orange: '立即就医，可能涉及肠胃炎、中毒或其他严重疾病',
      red: '紧急就医！可能存在肠梗阻、中毒等危及生命的情况'
    },
    requiresVet: { green: false, yellow: false, orange: true, red: true }
  },
  diarrhea: {
    label: '腹泻',
    icon: '💧',
    defaultAlertLevel: 'yellow',
    symptoms: ['粪便稀软', '带血或粘液', '排便频率增加', '伴随呕吐'],
    recommendations: {
      green: '短期饮食调整，喂食易消化食物，观察24小时',
      yellow: '补充电解质，调整饮食，如持续48小时以上需就医',
      orange: '可能存在寄生虫或细菌感染，建议就医检查',
      red: '严重腹泻导致脱水，需紧急就医'
    },
    requiresVet: { green: false, yellow: false, orange: true, red: true }
  },
  limping: {
    label: '跛行',
    icon: '🦴',
    defaultAlertLevel: 'orange',
    symptoms: ['不敢着地', '关节僵硬', '舔舐患处', '肌肉萎缩'],
    recommendations: {
      green: '观察是否轻微，检查爪垫是否有异物',
      yellow: '限制活动，局部冷敷，如24小时内无改善需就医',
      orange: '可能存在骨折、关节炎或韧带损伤，需X光检查',
      red: '疑似骨折或严重外伤，立即就医！'
    },
    requiresVet: { green: false, yellow: false, orange: true, red: true }
  },
  excessive_licking: {
    label: '过度舔毛',
    icon: '🐱',
    defaultAlertLevel: 'yellow',
    symptoms: ['某一部位反复舔舐', '出现脱毛', '皮肤发红', '强迫行为'],
    recommendations: {
      green: '检查是否有跳蚤或过敏源，提供替代玩具分散注意力',
      yellow: '可能存在皮肤问题或焦虑，建议就医进行皮肤检查',
      orange: '可能为强迫症或严重过敏，需行为矫正和医疗干预',
      red: '皮肤严重感染或神经系统问题，紧急就医'
    },
    requiresVet: { green: false, yellow: true, orange: true, red: true }
  },
  lethargy: {
    label: '嗜睡',
    icon: '😴',
    defaultAlertLevel: 'orange',
    symptoms: ['睡眠时间明显增加', '对玩具不感兴趣', '不愿走动', '反应迟钝'],
    recommendations: {
      green: '观察是否因天气或近期活动导致，保证充足休息',
      yellow: '持续监测，如伴随其他症状需就医',
      orange: '可能存在感染、疼痛或代谢问题，建议体检',
      red: '严重嗜睡可能是危急病症，立即就医！'
    },
    requiresVet: { green: false, yellow: true, orange: true, red: true }
  },
  coughing: {
    label: '咳嗽',
    icon: '🫁',
    defaultAlertLevel: 'yellow',
    symptoms: ['干咳', '湿咳', '夜间加重', '伴随呕吐'],
    recommendations: {
      green: '可能是轻微刺激，观察是否有痰或发烧',
      yellow: '持续咳嗽超过3天，建议就医检查呼吸道',
      orange: '可能存在支气管炎、肺炎或心脏问题，需详细检查',
      red: '呼吸困难或咳嗽带血，紧急就医！'
    },
    requiresVet: { green: false, yellow: true, orange: true, red: true }
  },
  sneezing: {
    label: '打喷嚏',
    icon: '🤧',
    defaultAlertLevel: 'green',
    symptoms: ['偶尔打喷嚏', '鼻涕', '鼻血', '眼部分泌物'],
    recommendations: {
      green: '可能是灰尘或轻微刺激，保持环境清洁',
      yellow: '持续打喷嚏伴随鼻涕，可能存在过敏或感染',
      orange: '可能为上呼吸道感染或鼻炎，需治疗',
      red: '鼻血或严重呼吸困难，紧急就医'
    },
    requiresVet: { green: false, yellow: true, orange: true, red: true }
  },
  scratching: {
    label: '过度抓挠',
    icon: '✋',
    defaultAlertLevel: 'yellow',
    symptoms: ['频繁抓挠', '皮肤破损', '脱毛', '摇头晃脑'],
    recommendations: {
      green: '检查是否有跳蚤或异物，更换洗护用品',
      yellow: '可能存在皮肤病或过敏，建议就医',
      orange: '严重皮肤问题，需要专业治疗方案',
      red: '皮肤严重感染，需要紧急医疗干预'
    },
    requiresVet: { green: false, yellow: true, orange: true, red: true }
  },
  loss_of_appetite: {
    label: '食欲减退',
    icon: '🍽️',
    defaultAlertLevel: 'orange',
    symptoms: ['进食量减少', '拒绝平时喜欢的食物', '体重下降', '伴随呕吐'],
    recommendations: {
      green: '可能是天气或情绪影响，尝试加热食物增加香味',
      yellow: '持续超过2天，观察是否有其他症状',
      orange: '可能存在消化问题或疾病，建议就医',
      red: '完全拒食超过24小时，可能存在严重问题'
    },
    requiresVet: { green: false, yellow: false, orange: true, red: true }
  },
  increased_thirst: {
    label: '饮水量增加',
    icon: '💧',
    defaultAlertLevel: 'orange',
    symptoms: ['饮水量明显增加', '尿量增加', '体重变化', '精神状态改变'],
    recommendations: {
      green: '天气热或运动后多饮是正常的，观察尿量是否正常',
      yellow: '持续多饮可能是糖尿病、肾病等早期信号',
      orange: '建议进行全面体检，检查肾功能和血糖',
      red: '可能存在危急病症，如酮症酸中毒'
    },
    requiresVet: { green: false, yellow: true, orange: true, red: true }
  },
  urination_change: {
    label: '排尿异常',
    icon: '🚽',
    defaultAlertLevel: 'orange',
    symptoms: ['尿频', '尿血', '排尿困难', '随地大小便'],
    recommendations: {
      green: '可能是饮水增加或发情导致，观察是否疼痛',
      yellow: '尿频或尿量异常，可能是尿路感染',
      orange: '尿血或排尿困难，可能存在结石或感染',
      red: '完全无法排尿是紧急情况，立即就医！'
    },
    requiresVet: { green: false, yellow: true, orange: true, red: true }
  },
  breathing_change: {
    label: '呼吸异常',
    icon: '😮‍💨',
    defaultAlertLevel: 'orange',
    symptoms: ['呼吸急促', '呼吸困难', '张嘴呼吸', '呼吸声异常'],
    recommendations: {
      green: '运动后或天气热时呼吸加快是正常的',
      yellow: '休息时呼吸仍然急促，需要观察其他症状',
      orange: '可能存在心脏或呼吸系统问题',
      red: '呼吸困难是紧急情况，立即就医！'
    },
    requiresVet: { green: false, yellow: true, orange: true, red: true }
  }
};

class AIHealthAlertService {
  private behaviorAlerts: AIBehaviorAlert[] = [];
  private smartFeederData: SmartFeederData[] = [];
  private notifications: HealthNotification[] = [];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // 模拟行为预警数据
    this.behaviorAlerts = [
      {
        id: 'alert-ai-1',
        petId: '1',
        behaviorType: 'excessive_licking',
        alertLevel: 'yellow',
        confidence: 0.87,
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        duration: '30分钟',
        frequency: 3,
        description: '检测到猫咪频繁舔舐腹部，持续约30分钟',
        recommendation: behaviorConfig.excessive_licking.recommendations.yellow,
        vetRequired: false,
        acknowledged: false
      },
      {
        id: 'alert-ai-2',
        petId: '1',
        behaviorType: 'vomiting',
        alertLevel: 'orange',
        confidence: 0.95,
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        duration: '5分钟',
        frequency: 2,
        description: '检测到呕吐行为，呕吐物为未消化食物',
        recommendation: behaviorConfig.vomiting.recommendations.orange,
        vetRequired: true,
        acknowledged: true,
        acknowledgedAt: new Date(Date.now() - 3600000 * 23).toISOString()
      },
      {
        id: 'alert-ai-3',
        petId: '1',
        behaviorType: 'lethargy',
        alertLevel: 'green',
        confidence: 0.72,
        timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
        description: '活动量显著下降，睡眠时间增加',
        recommendation: behaviorConfig.lethargy.recommendations.green,
        vetRequired: false,
        acknowledged: true,
        acknowledgedAt: new Date(Date.now() - 3600000 * 47).toISOString()
      }
    ];

    // 模拟智能喂食器数据
    this.smartFeederData = [
      {
        id: 'feeder-1',
        petId: '1',
        deviceId: 'feeder-001',
        deviceType: 'feeder',
        timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
        portionSize: 50,
        portionUnit: 'g',
        mealsPlanned: 3,
        mealsCompleted: 2,
        waterIntake: 120,
        waterIntakeUnit: 'ml',
        anomaly: false
      },
      {
        id: 'feeder-2',
        petId: '1',
        deviceId: 'feeder-001',
        deviceType: 'feeder',
        timestamp: new Date(Date.now() - 3600000 * 14).toISOString(),
        portionSize: 50,
        portionUnit: 'g',
        mealsPlanned: 3,
        mealsCompleted: 3,
        waterIntake: 180,
        waterIntakeUnit: 'ml',
        anomaly: true,
        anomalyReason: '饮水量异常增加，较昨日增长40%'
      }
    ];

    // 模拟通知
    this.notifications = [
      {
        id: 'notif-1',
        petId: '1',
        type: 'behavior',
        alertLevel: 'yellow',
        title: '行为异常提醒',
        message: '检测到猫咪频繁舔舐腹部，请注意观察',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        read: false,
        actionUrl: '/health/alerts',
        actionLabel: '查看详情'
      },
      {
        id: 'notif-2',
        petId: '1',
        type: 'vaccination',
        alertLevel: 'green',
        title: '疫苗接种提醒',
        message: '狂犬疫苗将于30天后到期，请提前预约',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        read: true
      }
    ];
  }

  // 获取综合健康评分
  async getComprehensiveHealthScore(petId: string): Promise<ComprehensiveHealthScore> {
    await this.simulateDelay(MOCK_DELAY);
    
    return {
      overall: 92,
      accuracy: 95,
      dimensions: [
        {
          id: 'activity',
          name: '活动',
          score: 90,
          trend: 'up',
          change: 5,
          icon: 'activity',
          color: '#22C55E',
          metrics: ['步数', '运动时长', '活动强度']
        },
        {
          id: 'nutrition',
          name: '营养',
          score: 93,
          trend: 'stable',
          change: 2,
          icon: 'nutrition',
          color: '#F97316',
          metrics: ['摄入热量', '蛋白质', '饮水量']
        },
        {
          id: 'sleep',
          name: '睡眠',
          score: 95,
          trend: 'up',
          change: 4,
          icon: 'sleep',
          color: '#8B5CF6',
          metrics: ['睡眠时长', '睡眠质量', '深睡比例']
        },
        {
          id: 'mental',
          name: '心理',
          score: 88,
          trend: 'up',
          change: 3,
          icon: 'mental',
          color: '#06B6D4',
          metrics: ['情绪状态', '焦虑水平', '社交互动']
        }
      ],
      trend: 'up',
      lastUpdated: new Date().toISOString(),
      prediction: {
        riskLevel: 'low',
        predictedIssues: [],
        accuracy: 96
      }
    };
  }

  // 获取健康仪表盘数据
  async getHealthDashboard(petId: string): Promise<HealthDashboard> {
    await this.simulateDelay(MOCK_DELAY);
    
    const healthScore = await this.getComprehensiveHealthScore(petId);
    
    return {
      healthScore,
      activity: {
        daily: 75,
        weekly: 480,
        monthly: 2100,
        target: 60,
        intensityBreakdown: {
          low: 35,
          medium: 45,
          high: 20
        }
      },
      sleep: {
        duration: 13.5,
        quality: 88,
        interruptions: 1,
        deepestSleepTime: '02:30',
        schedule: {
          bedtime: '22:00',
          wakeTime: '08:30'
        }
      },
      nutrition: {
        calories: 385,
        targetCalories: 400,
        protein: 65,
        fat: 25,
        fiber: 8,
        waterIntake: 280,
        targetWaterIntake: 350
      },
      vaccination: {
        status: 'up_to_date',
        nextDue: new Date(Date.now() + 30 * 86400000).toISOString(),
        vaccines: [
          {
            name: '狂犬疫苗',
            lastDate: '2025-12-15',
            nextDate: '2026-06-15',
            status: 'completed'
          },
          {
            name: '猫三联',
            lastDate: '2025-11-20',
            nextDate: '2026-11-20',
            status: 'completed'
          }
        ]
      },
      weight: {
        current: 4.3,
        target: 4.5,
        history: [
          { date: '2026-05-20', weight: 4.3, unit: 'kg', trend: 'stable' },
          { date: '2026-05-15', weight: 4.28, unit: 'kg', trend: 'gaining' },
          { date: '2026-05-10', weight: 4.25, unit: 'kg', trend: 'gaining' },
          { date: '2026-05-05', weight: 4.2, unit: 'kg', trend: 'gaining' },
          { date: '2026-05-01', weight: 4.18, unit: 'kg', trend: 'gaining' }
        ]
      }
    };
  }

  // 获取AI行为预警
  async getAIBehaviorAlerts(petId: string): Promise<AIBehaviorAlert[]> {
    await this.simulateDelay(MOCK_DELAY);
    return this.behaviorAlerts.filter(a => a.petId === petId);
  }

  // 确认预警
  async acknowledgeBehaviorAlert(alertId: string): Promise<boolean> {
    await this.simulateDelay(200);
    
    const alert = this.behaviorAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  // 创建新的行为预警
  async createBehaviorAlert(
    petId: string,
    behaviorType: BehaviorType,
    confidence: number,
    description: string
  ): Promise<AIBehaviorAlert> {
    await this.simulateDelay(MOCK_DELAY);
    
    const config = behaviorConfig[behaviorType];
    const alertLevel = this.calculateAlertLevel(confidence);
    
    const alert: AIBehaviorAlert = {
      id: `alert-ai-${Date.now()}`,
      petId,
      behaviorType,
      alertLevel,
      confidence,
      timestamp: new Date().toISOString(),
      description,
      recommendation: config.recommendations[alertLevel],
      vetRequired: config.requiresVet[alertLevel],
      acknowledged: false
    };
    
    this.behaviorAlerts.unshift(alert);
    
    // 同时创建通知
    this.createNotification({
      id: `notif-${Date.now()}`,
      petId,
      type: 'behavior',
      alertLevel,
      title: `${config.label}检测提醒`,
      message: description,
      timestamp: new Date().toISOString(),
      read: false,
      actionUrl: `/health/alerts/${alert.id}`,
      actionLabel: '查看详情'
    });
    
    return alert;
  }

  // 计算预警等级
  private calculateAlertLevel(confidence: number): AlertLevel {
    if (confidence >= 0.9) return 'red';
    if (confidence >= 0.75) return 'orange';
    if (confidence >= 0.6) return 'yellow';
    return 'green';
  }

  // 获取智能喂食器数据
  async getSmartFeederData(petId: string, days: number = 7): Promise<SmartFeederData[]> {
    await this.simulateDelay(MOCK_DELAY);
    return this.smartFeederData.filter(d => d.petId === petId);
  }

  // 分析喂食异常
  async analyzeFeedingAnomalies(petId: string): Promise<{
    hasAnomaly: boolean;
    anomalies: Array<{ type: string; severity: AlertLevel; description: string }>;
  }> {
    await this.simulateDelay(MOCK_DELAY);
    
    const anomalies: Array<{ type: string; severity: AlertLevel; description: string }> = [];
    
    const recentData = this.smartFeederData
      .filter(d => d.petId === petId)
      .slice(0, 5);
    
    for (const data of recentData) {
      if (data.anomaly && data.anomalyReason) {
        anomalies.push({
          type: 'water_intake',
          severity: 'yellow',
          description: data.anomalyReason
        });
      }
    }
    
    // 分析进食规律
    const avgMeals = recentData.reduce((sum, d) => sum + d.mealsCompleted, 0) / recentData.length;
    if (avgMeals < 2) {
      anomalies.push({
        type: 'eating_pattern',
        severity: 'orange',
        description: '平均每日进食次数偏低，建议关注'
      });
    }
    
    return {
      hasAnomaly: anomalies.length > 0,
      anomalies
    };
  }

  // 获取活动量图表数据
  async getActivityChartData(petId: string, days: number = 7): Promise<ActivityChartData[]> {
    await this.simulateDelay(MOCK_DELAY);
    
    const data: ActivityChartData[] = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        totalMinutes: Math.floor(40 + Math.random() * 60),
        intensity: {
          low: 30 + Math.floor(Math.random() * 20),
          medium: 40 + Math.floor(Math.random() * 20),
          high: 15 + Math.floor(Math.random() * 15)
        },
        activities: {
          walking: 15 + Math.floor(Math.random() * 15),
          running: 10 + Math.floor(Math.random() * 20),
          playing: 5 + Math.floor(Math.random() * 15),
          resting: 10 + Math.floor(Math.random() * 10)
        }
      });
    }
    
    return data;
  }

  // 获取睡眠图表数据
  async getSleepChartData(petId: string, days: number = 7): Promise<SleepChartData[]> {
    await this.simulateDelay(MOCK_DELAY);
    
    const data: SleepChartData[] = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const deepSleep = 25 + Math.floor(Math.random() * 15);
      const lightSleep = 40 + Math.floor(Math.random() * 15);
      const rem = 20 + Math.floor(Math.random() * 10);
      const awake = 100 - deepSleep - lightSleep - rem;
      
      data.push({
        date: date.toISOString().split('T')[0],
        duration: 12 + Math.random() * 4,
        quality: 75 + Math.floor(Math.random() * 25),
        phases: { deep: deepSleep, light: lightSleep, rem: rem, awake: awake },
        startTime: '22:00',
        endTime: '08:30'
      });
    }
    
    return data;
  }

  // 获取成长曲线数据
  async getGrowthCurveData(petId: string): Promise<GrowthCurveData> {
    await this.simulateDelay(MOCK_DELAY);
    
    return {
      petId,
      petBreed: '英短蓝猫',
      petAge: 24,
      petWeight: 4.3,
      breedStandard: {
        breed: '英短蓝猫',
        age: 24,
        weightMin: 3.6,
        weightMax: 5.4,
        weightAvg: 4.5,
        heightMin: 30,
        heightMax: 33
      },
      percentile: 55,
      trajectory: 'normal'
    };
  }

  // 获取附近的24小时兽医医院
  async getNearbyVetHospitals(lat?: number, lng?: number): Promise<VetHospital[]> {
    await this.simulateDelay(MOCK_DELAY);
    
    return [
      {
        id: 'vet-1',
        name: '宠物王国24小时医院',
        address: '朝阳区建国路88号',
        phone: '010-88888888',
        is24Hours: true,
        distance: 1.2,
        rating: 4.8,
        emergencyServices: true
      },
      {
        id: 'vet-2',
        name: '萌爪宠物医疗中心',
        address: '海淀区中关村大街100号',
        phone: '010-66666666',
        is24Hours: true,
        distance: 3.5,
        rating: 4.6,
        emergencyServices: true
      },
      {
        id: 'vet-3',
        name: '爱心宠物诊所',
        address: '朝阳区三里屯北路50号',
        phone: '010-55555555',
        is24Hours: false,
        distance: 2.8,
        rating: 4.5,
        emergencyServices: false
      }
    ];
  }

  // 获取通知列表
  async getNotifications(petId: string): Promise<HealthNotification[]> {
    await this.simulateDelay(MOCK_DELAY);
    return this.notifications.filter(n => n.petId === petId);
  }

  // 创建通知
  async createNotification(notification: HealthNotification): Promise<HealthNotification> {
    this.notifications.unshift(notification);
    return notification;
  }

  // 标记通知已读
  async markNotificationRead(notificationId: string): Promise<boolean> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      return true;
    }
    return false;
  }

  // 生成健康报告
  async generateHealthReport(petId: string, period: 'daily' | 'weekly' | 'monthly'): Promise<HealthReport> {
    await this.simulateDelay(MOCK_DELAY * 2);
    
    const now = new Date();
    const startDate = new Date(now);
    
    if (period === 'daily') {
      startDate.setDate(startDate.getDate() - 1);
    } else if (period === 'weekly') {
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate.setMonth(startDate.getMonth() - 1);
    }
    
    return {
      id: `report-${Date.now()}`,
      petId,
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      summary: {
        overallHealth: 87,
        activityLevel: 85,
        sleepQuality: 92,
        nutritionBalance: 88,
        comparedToLast: 3
      },
      highlights: {
        positive: [
          '睡眠质量明显改善',
          '饮水量恢复正常',
          '情绪状态稳定'
        ],
        concerns: [
          '运动量略有下降',
          '需关注体重变化'
        ],
        recommendations: [
          '建议每天增加15分钟互动游戏时间',
          '继续观察体重变化趋势',
          '保持当前饮食习惯'
        ]
      },
      charts: {
        activity: await this.getActivityChartData(petId, period === 'daily' ? 1 : period === 'weekly' ? 7 : 30),
        sleep: await this.getSleepChartData(petId, period === 'daily' ? 1 : period === 'weekly' ? 7 : 30)
      },
      alerts: await this.getAIBehaviorAlerts(petId),
      generatedAt: now.toISOString()
    };
  }

  // 获取预警配置
  getBehaviorConfig(type: BehaviorType) {
    return behaviorConfig[type];
  }

  // 获取所有预警等级颜色
  getAlertLevelColors() {
    return {
      green: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', glow: 'shadow-green-500/20' },
      yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', glow: 'shadow-yellow-500/20' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', glow: 'shadow-orange-500/20' },
      red: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', glow: 'shadow-red-500/20' }
    };
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const aiHealthAlertService = new AIHealthAlertService();
