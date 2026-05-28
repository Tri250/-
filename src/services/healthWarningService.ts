// ============================================
// PawSync Pro - AI健康预警系统核心服务
//
// 作者: 带娃的小陈工
// 日期: 2026-05-28
// 描述: 健康数据智能分析、异常预警、AI报告生成
// ============================================

import {
  HealthMetric,
  HealthMetricType,
  AlertSeverity,
  AlertType,
  HealthWarning,
  HealthReport,
  ReportType,
  SmartReminder,
  HealthTrendAnalysis,
  SymptomAnalysis,
  VeterinaryClinic,
  WarningFilter,
  ReminderFilter,
  PetBreedInfo,
  AIChatConversation,
  AIChatMessage,
} from '../types/health-warning';

// 宠物品种正常范围配置
const BREED_CONFIGS: Record<string, PetBreedInfo> = {
  '金毛犬': {
    type: 'dog',
    name: '金毛犬',
    normalRanges: {
      weight: { min: 25, max: 32, unit: 'kg' },
      temperature: { min: 37.5, max: 39.0, unit: '℃' },
      heartRate: { min: 60, max: 100, unit: 'bpm' },
      respiration: { min: 10, max: 30, unit: 'bpm' },
    },
  },
  '英国短毛猫': {
    type: 'cat',
    name: '英国短毛猫',
    normalRanges: {
      weight: { min: 3.0, max: 5.5, unit: 'kg' },
      temperature: { min: 38.0, max: 39.2, unit: '℃' },
      heartRate: { min: 110, max: 140, unit: 'bpm' },
      respiration: { min: 20, max: 30, unit: 'bpm' },
    },
  },
  'default_dog': {
    type: 'dog',
    name: '通用犬类',
    normalRanges: {
      weight: { min: 5, max: 50, unit: 'kg' },
      temperature: { min: 37.5, max: 39.0, unit: '℃' },
      heartRate: { min: 60, max: 140, unit: 'bpm' },
      respiration: { min: 10, max: 30, unit: 'bpm' },
    },
  },
  'default_cat': {
    type: 'cat',
    name: '通用猫类',
    normalRanges: {
      weight: { min: 2.5, max: 7.0, unit: 'kg' },
      temperature: { min: 38.0, max: 39.2, unit: '℃' },
      heartRate: { min: 110, max: 140, unit: 'bpm' },
      respiration: { min: 20, max: 30, unit: 'bpm' },
    },
  },
};

// 症状分析知识库
const SYMPTOM_KNOWLEDGE = {
  '呕吐': [
    {
      condition: '毛球症',
      probability: 0.4,
      severity: 'low' as AlertSeverity,
      description: '猫咪常见，因舔毛摄入毛发过多',
      recommendations: ['喂食化毛膏', '增加梳毛频率', '观察呕吐物'],
      signsToWatch: ['频繁干呕', '食欲不振'],
      whenToSeeVet: '超过24小时未进食',
    },
    {
      condition: '急性胃炎',
      probability: 0.3,
      severity: 'medium' as AlertSeverity,
      description: '可能由饮食不当或感染引起',
      recommendations: ['禁食12小时', '少量多次饮水', '观察精神状态'],
      signsToWatch: ['呕吐物带血', '精神萎靡'],
      whenToSeeVet: '持续呕吐超过24小时',
    },
  ],
  '发热': [
    {
      condition: '病毒性感染',
      probability: 0.5,
      severity: 'medium' as AlertSeverity,
      description: '常见病毒感染症状',
      recommendations: ['物理降温', '保持环境凉爽', '补充水分'],
      signsToWatch: ['呼吸急促', '拒绝进食'],
      whenToSeeVet: '体温超过40.5℃',
    },
  ],
  '精神萎靡': [
    {
      condition: '身体不适',
      probability: 0.6,
      severity: 'medium' as AlertSeverity,
      description: '多种疾病的共同表现',
      recommendations: ['安静休息', '观察其他症状', '测量体温'],
      signsToWatch: ['拒绝互动', '躲在角落'],
      whenToSeeVet: '持续超过24小时',
    },
  ],
};

// 宠物医院模拟数据
const NEARBY_CLINICS: VeterinaryClinic[] = [
  {
    id: 'clinic-1',
    name: '爱宠动物医院',
    address: '北京市朝阳区建国路88号',
    phone: '010-88888888',
    latitude: 39.9,
    longitude: 116.4,
    distance: 1.2,
    isEmergency: true,
    rating: 4.8,
  },
  {
    id: 'clinic-2',
    name: '宠物健康中心',
    address: '北京市朝阳区建国路100号',
    phone: '010-66666666',
    latitude: 39.91,
    longitude: 116.42,
    distance: 2.5,
    isEmergency: false,
    rating: 4.5,
  },
];

export class HealthWarningService {
  private healthMetrics: Map<string, HealthMetric[]> = new Map();
  private healthWarnings: Map<string, HealthWarning[]> = new Map();
  private healthReports: Map<string, HealthReport[]> = new Map();
  private smartReminders: Map<string, SmartReminder[]> = new Map();
  private chatConversations: Map<string, AIChatConversation[]> = new Map();
  private petData: Map<string, { breed: string; age: number }> = new Map();

  constructor() {
    this.initializeDemoData();
  }

  // ============ 模块1: 健康数据采集与AI融合分析 ============

  // A01: 基础健康指标自动分析
  async analyzeBasicMetrics(petId: string, metrics: HealthMetric[]): Promise<{
    status: 'normal' | 'warning' | 'abnormal';
    analysis: string;
    warnings?: HealthWarning[];
  }> {
    await this.simulateDelay(800);

    const breed = this.petData.get(petId)?.breed || 'default_dog';
    const breedConfig = BREED_CONFIGS[breed] || BREED_CONFIGS.default_dog;

    // 保存指标数据
    const existingMetrics = this.healthMetrics.get(petId) || [];
    this.healthMetrics.set(petId, [...existingMetrics, ...metrics]);

    const warnings: HealthWarning[] = [];
    let overallStatus: 'normal' | 'warning' | 'abnormal' = 'normal';

    for (const metric of metrics) {
      const analysis = this.analyzeMetric(metric, breedConfig);
      if (analysis.warning) {
        warnings.push(analysis.warning);
        if (analysis.warning.severity === 'emergency' || analysis.warning.severity === 'high') {
          overallStatus = 'abnormal';
        } else if (overallStatus === 'normal') {
          overallStatus = 'warning';
        }
      }
    }

    // 保存预警
    if (warnings.length > 0) {
      const existingWarnings = this.healthWarnings.get(petId) || [];
      this.healthWarnings.set(petId, [...existingWarnings, ...warnings]);

      // 触发提醒
      for (const warning of warnings) {
        await this.createReminderForWarning(warning);
      }
    }

    return {
      status: overallStatus,
      analysis: overallStatus === 'normal' 
        ? '健康状态良好，各项指标正常' 
        : overallStatus === 'warning' 
          ? '检测到轻微异常，建议观察' 
          : '检测到异常指标，建议及时关注',
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  // A02: 异常指标自动识别
  private analyzeMetric(
    metric: HealthMetric,
    breedConfig: PetBreedInfo
  ): { warning?: HealthWarning } {
    const ranges = breedConfig.normalRanges;
    let warning: HealthWarning | undefined;

    switch (metric.type) {
      case 'weight':
        if (metric.value > ranges.weight.max * 1.05) {
          const percentage = ((metric.value - ranges.weight.max) / ranges.weight.max) * 100;
          const severity = percentage > 15 ? 'medium' : 'low';
          warning = this.createWarning(
            metric.petId,
            'weight_abnormal',
            severity,
            '体重超标',
            `当前体重 ${metric.value}${metric.unit}，超出正常范围 ${percentage.toFixed(1)}%`,
            [metric],
            ['控制饮食', '增加运动量', '定期称重'],
            '观察食欲变化'
          );
        } else if (metric.value < ranges.weight.min * 0.95) {
          const percentage = ((ranges.weight.min - metric.value) / ranges.weight.min) * 100;
          warning = this.createWarning(
            metric.petId,
            'weight_abnormal',
            'medium',
            '体重过轻',
            `当前体重 ${metric.value}${metric.unit}，低于正常范围 ${percentage.toFixed(1)}%`,
            [metric],
            ['增加营养摄入', '检查食欲', '咨询兽医'],
            '记录每日食量'
          );
        }
        break;

      case 'temperature':
        if (metric.value > ranges.temperature.max + 0.5) {
          const severity = metric.value > 40.0 ? 'high' : 'medium';
          warning = this.createWarning(
            metric.petId,
            'temperature_abnormal',
            severity,
            '体温偏高',
            `当前体温 ${metric.value}${metric.unit}，略高于正常范围`,
            [metric],
            ['物理降温', '观察精神状态', '补充水分'],
            metric.value > 40.0 ? '建议就医' : '继续观察'
          );
        } else if (metric.value < ranges.temperature.min - 0.5) {
          warning = this.createWarning(
            metric.petId,
            'temperature_abnormal',
            'medium',
            '体温偏低',
            `当前体温 ${metric.value}${metric.unit}，略低于正常范围`,
            [metric],
            ['注意保暖', '观察其他症状', '测量血压'],
            '继续观察'
          );
        }
        break;

      case 'vomit':
        if (metric.value >= 2) {
          const severity = metric.value >= 5 ? 'emergency' : 'medium';
          warning = this.createWarning(
            metric.petId,
            'vomit_abnormal',
            severity,
            severity === 'emergency' ? '频繁呕吐，紧急关注' : '呕吐异常',
            `今日已呕吐 ${metric.value} 次`,
            [metric],
            severity === 'emergency' 
              ? ['立即就医', '保持安静', '记录呕吐物'] 
              : ['禁食12小时', '少量补水', '观察情况'],
            severity === 'emergency' ? '立即送医' : '观察24小时'
          );
        }
        break;

      case 'drinking':
        if (metric.value < 85) {
          warning = this.createWarning(
            metric.petId,
            'drinking_abnormal',
            'low',
            '饮水量减少',
            `今日饮水量较昨日减少 ${100 - metric.value}%`,
            [metric],
            ['观察饮水习惯', '检查水碗清洁度', '增加湿粮比例'],
            '记录每日饮水量'
          );
        }
        break;
    }

    return { warning };
  }

  // A03: 多维度数据关联分析
  async analyzeMultidimensionalData(
    petId: string,
    symptoms: string[]
  ): Promise<SymptomAnalysis> {
    await this.simulateDelay(1200);

    const relatedMetrics = this.healthMetrics.get(petId) || [];
    const relatedWarnings = this.healthWarnings.get(petId) || [];

    const possibleConditions: SymptomAnalysis['analysis']['possibleConditions'] = [];
    for (const symptom of symptoms) {
      const knowledge = SYMPTOM_KNOWLEDGE[symptom as keyof typeof SYMPTOM_KNOWLEDGE];
      if (knowledge) {
        possibleConditions.push(...knowledge);
      }
    }

    // 去重
    const uniqueConditions = Array.from(
      new Map(possibleConditions.map(c => [c.condition, c])).values()
    ).sort((a, b) => b.probability - a.probability);

    const hasHighFever = relatedMetrics.some(m => m.type === 'temperature' && m.value > 39.5);
    const hasFrequentVomit = relatedMetrics.some(m => m.type === 'vomit' && m.value >= 3);

    const overallSeverity = hasHighFever || hasFrequentVomit ? 'medium' : 'low';

    const analysis: SymptomAnalysis = {
      petId,
      symptoms,
      analysis: {
        possibleConditions: uniqueConditions.length > 0
          ? uniqueConditions
          : [{
              condition: '需要进一步观察',
              severity: 'low',
              probability: 0.5,
              description: '根据描述，症状不典型，建议观察',
              recommendations: ['记录症状变化', '观察食欲精神', '有异常及时就医'],
              signsToWatch: ['症状加重', '新症状出现', '食欲下降'],
              whenToSeeVet: '症状持续加重',
            }],
        overallAssessment: this.generateOverallAssessment(symptoms, hasHighFever, hasFrequentVomit),
        immediateActions: [
          '测量体温',
          '观察精神状态',
          '记录症状变化',
          ...(overallSeverity === 'medium' ? ['考虑咨询兽医'] : []),
        ],
      },
      relatedWarnings: relatedWarnings.filter(w => !w.resolved).map(w => w.id),
      generatedAt: new Date().toISOString(),
    };

    // 检查是否需要创建感染预警
    if (hasHighFever && symptoms.some(s => s.includes('精神') || s.includes('食欲'))) {
      const infectionWarning = this.createWarning(
        petId,
        'infection_suspected',
        'medium',
        '疑似感染风险',
        '体温异常伴随精神萎靡和食欲下降，有感染风险',
        relatedMetrics.filter(m => m.type === 'temperature' || m.type === 'vomit'),
        ['物理降温', '补充水分', '观察24小时'],
        '24小时内未好转请就医'
      );
      const existingWarnings = this.healthWarnings.get(petId) || [];
      this.healthWarnings.set(petId, [...existingWarnings, infectionWarning]);
    }

    return analysis;
  }

  // A04: 历史数据趋势分析
  async analyzeTrends(
    petId: string,
    days: number = 30
  ): Promise<HealthTrendAnalysis> {
    await this.simulateDelay(1000);

    const metrics = this.healthMetrics.get(petId) || [];
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    const periodMetrics = metrics.filter(m => 
      new Date(m.timestamp) >= startDate
    );

    const trendMetrics: HealthTrendAnalysis['metrics'] = [];
    const metricTypes: HealthMetricType[] = ['weight', 'temperature', 'activity', 'sleep'];

    for (const type of metricTypes) {
      const typeMetrics = periodMetrics.filter(m => m.type === type);
      if (typeMetrics.length > 0) {
        const values = typeMetrics.map(m => m.value);
        const current = values[values.length - 1];
        const average = values.reduce((a, b) => a + b, 0) / values.length;
        const minimum = Math.min(...values);
        const maximum = Math.max(...values);

        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (values.length >= 7) {
          const recent = values.slice(-3);
          const previous = values.slice(-6, -3);
          const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
          const prevAvg = previous.reduce((a, b) => a + b, 0) / previous.length;
          const change = (recentAvg - prevAvg) / prevAvg;
          
          if (change > 0.05) trend = 'up';
          else if (change < -0.05) trend = 'down';
        }

        let prediction: number | undefined;
        let predictionNote: string | undefined;

        if (type === 'weight' && trend === 'up') {
          const weeklyIncrease = (current - average) * 7 / days;
          if (weeklyIncrease > 0.1) {
            prediction = current + weeklyIncrease * 2;
            predictionNote = '若持续增长，2周内可能达到肥胖标准';
          }
        }

        trendMetrics.push({
          type,
          name: this.getMetricName(type),
          unit: typeMetrics[0].unit,
          current,
          average,
          minimum,
          maximum,
          trend,
          prediction,
          predictionDays: prediction ? 14 : undefined,
          predictionNote,
        });
      }
    }

    const riskLevel = trendMetrics.some(m => m.trend !== 'stable' && m.predictionNote)
      ? 'medium'
      : trendMetrics.some(m => m.trend !== 'stable')
        ? 'low'
        : 'low';

    return {
      petId,
      period: {
        start: startDate.toISOString(),
        end: now.toISOString(),
      },
      metrics: trendMetrics,
      summary: this.generateTrendSummary(trendMetrics),
      riskAssessment: {
        level: riskLevel,
        factors: trendMetrics
          .filter(m => m.trend !== 'stable')
          .map(m => `${m.name}${m.trend === 'up' ? '上升' : '下降'}`),
        recommendations: this.generateTrendRecommendations(trendMetrics),
      },
    };
  }

  // A05: 多宠物数据隔离分析
  setPetInfo(petId: string, breed: string, age: number): void {
    this.petData.set(petId, { breed, age });
  }

  // ============ 模块2: 异常检测与分级预警 ============

  // B01-B03: 分级预警
  private createWarning(
    petId: string,
    type: AlertType,
    severity: AlertSeverity,
    title: string,
    message: string,
    metrics: HealthMetric[],
    recommendations: string[],
    actionRequired?: string
  ): HealthWarning {
    return {
      id: `warning-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      petId,
      type,
      severity,
      title,
      message,
      metrics,
      analysis: {
        summary: this.generateWarningSummary(type, severity, message),
        possibleCauses: this.generatePossibleCauses(type, severity),
        recommendations,
        actionRequired,
      },
      timestamp: new Date().toISOString(),
      acknowledged: false,
      resolved: false,
    };
  }

  // B04: 预警重复触发控制
  async checkDuplicateWarning(petId: string, type: AlertType, hours: number = 24): Promise<boolean> {
    const warnings = this.healthWarnings.get(petId) || [];
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    const recentSimilarWarning = warnings.find(w => 
      w.type === type && 
      !w.resolved && 
      new Date(w.timestamp) > cutoff
    );

    return !!recentSimilarWarning;
  }

  // B05: 预警自动解除
  async autoResolveWarnings(petId: string): Promise<void> {
    const warnings = this.healthWarnings.get(petId) || [];
    const metrics = this.healthMetrics.get(petId) || [];

    for (const warning of warnings) {
      if (warning.resolved) continue;

      const relatedMetrics = metrics.filter(m => 
        warning.metrics.some(wm => wm.type === m.type)
      );

      if (relatedMetrics.length > 0) {
        const lastMetric = relatedMetrics[relatedMetrics.length - 1];
        const isNormal = await this.checkMetricNormal(petId, lastMetric);
        
        if (isNormal) {
          warning.resolved = true;
          warning.resolvedAt = new Date().toISOString();
        }
      }
    }
  }

  // ============ 模块3: AI健康报告生成 ============

  // C01: 基础健康报告生成
  async generateHealthReport(
    petId: string,
    type: ReportType = 'monthly',
    customPeriod?: { start: string; end: string }
  ): Promise<HealthReport> {
    await this.simulateDelay(2000);

    const now = new Date();
    let start: Date;
    let end = now;

    if (type === 'custom' && customPeriod) {
      start = new Date(customPeriod.start);
      end = new Date(customPeriod.end);
    } else if (type === 'weekly') {
      start = new Date(now);
      start.setDate(start.getDate() - 7);
    } else {
      start = new Date(now);
      start.setMonth(start.getMonth() - 1);
    }

    const metrics = this.healthMetrics.get(petId) || [];
    const warnings = this.healthWarnings.get(petId) || [];
    const periodMetrics = metrics.filter(m => 
      new Date(m.timestamp) >= start && new Date(m.timestamp) <= end
    );
    const periodWarnings = warnings.filter(w => 
      new Date(w.timestamp) >= start && new Date(w.timestamp) <= end
    );

    const reportMetrics: HealthReport['content']['metrics'] = [];
    const metricTypes: HealthMetricType[] = ['weight', 'temperature', 'activity', 'sleep'];

    for (const metricType of metricTypes) {
      const typeMetrics = periodMetrics.filter(m => m.type === metricType);
      if (typeMetrics.length > 0) {
        const values = typeMetrics.map(m => m.value);
        const current = values[values.length - 1];
        const average = values.reduce((a, b) => a + b, 0) / values.length;
        
        reportMetrics.push({
          type: metricType,
          name: this.getMetricName(metricType),
          current,
          average,
          trend: current > average ? 'up' : current < average ? 'down' : 'stable',
          status: Math.abs(current - average) / average < 0.1 ? 'normal' : 'warning',
        });
      }
    }

    const healthScore = this.calculateHealthScore(periodWarnings, reportMetrics);

    const chartData: HealthReport['content']['charts'] = [
      {
        type: 'line',
        title: '体重趋势',
        data: periodMetrics
          .filter(m => m.type === 'weight')
          .map(m => ({
            date: m.timestamp.split('T')[0],
            value: m.value,
          })),
      },
      {
        type: 'line',
        title: '体温趋势',
        data: periodMetrics
          .filter(m => m.type === 'temperature')
          .map(m => ({
            date: m.timestamp.split('T')[0],
            value: m.value,
          })),
      },
    ];

    const report: HealthReport = {
      id: `report-${Date.now()}`,
      petId,
      type,
      title: `${type === 'monthly' ? '月度' : type === 'weekly' ? '周度' : '自定义'}健康报告`,
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      content: {
        overview: {
          healthScore,
          status: healthScore >= 90 ? 'excellent' : healthScore >= 75 ? 'good' : healthScore >= 60 ? 'fair' : 'poor',
          summary: this.generateReportSummary(healthScore, periodWarnings),
        },
        metrics: reportMetrics,
        charts: chartData,
        warnings: {
          total: periodWarnings.length,
          active: periodWarnings.filter(w => !w.resolved).length,
          resolved: periodWarnings.filter(w => w.resolved).length,
          bySeverity: {
            low: periodWarnings.filter(w => w.severity === 'low').length,
            medium: periodWarnings.filter(w => w.severity === 'medium').length,
            high: periodWarnings.filter(w => w.severity === 'high').length,
            emergency: periodWarnings.filter(w => w.severity === 'emergency').length,
          },
        },
        healthEvents: periodWarnings.map(w => ({
          date: w.timestamp.split('T')[0],
          type: this.getAlertTypeName(w.type),
          description: w.message,
          severity: w.severity,
        })),
        recommendations: this.generateReportRecommendations(healthScore, reportMetrics, periodWarnings),
      },
      createdAt: new Date().toISOString(),
      format: 'pdf',
    };

    const existingReports = this.healthReports.get(petId) || [];
    this.healthReports.set(petId, [...existingReports, report]);

    return report;
  }

  // C02: 异常专项报告生成
  async generateIssueSpecificReport(
    petId: string,
    warningId: string
  ): Promise<HealthReport> {
    const warnings = this.healthWarnings.get(petId) || [];
    const warning = warnings.find(w => w.id === warningId);
    
    if (!warning) {
      throw new Error('预警不存在');
    }

    const report: HealthReport = {
      id: `report-issue-${Date.now()}`,
      petId,
      type: 'issue_specific',
      title: `${warning.title}专项分析报告`,
      period: {
        start: warning.timestamp,
        end: new Date().toISOString(),
      },
      content: {
        overview: {
          healthScore: 75,
          status: 'fair',
          summary: `针对"${warning.title}"的专项分析报告`,
        },
        metrics: warning.metrics.map(m => ({
          type: m.type,
          name: this.getMetricName(m.type),
          current: m.value,
          average: m.value,
          trend: 'stable',
          status: 'warning',
        })),
        charts: [],
        warnings: {
          total: 1,
          active: 1,
          resolved: 0,
          bySeverity: {
            low: warning.severity === 'low' ? 1 : 0,
            medium: warning.severity === 'medium' ? 1 : 0,
            high: warning.severity === 'high' ? 1 : 0,
            emergency: warning.severity === 'emergency' ? 1 : 0,
          },
        },
        healthEvents: [
          {
            date: warning.timestamp.split('T')[0],
            type: this.getAlertTypeName(warning.type),
            description: warning.message,
            severity: warning.severity,
          },
        ],
        recommendations: warning.analysis.recommendations,
        followUp: this.generateFollowUpPlan(warning),
      },
      createdAt: new Date().toISOString(),
      format: 'pdf',
    };

    const existingReports = this.healthReports.get(petId) || [];
    this.healthReports.set(petId, [...existingReports, report]);

    return report;
  }

  // C04: 多宠物报告独立生成
  async getReports(petId: string): Promise<HealthReport[]> {
    return this.healthReports.get(petId) || [];
  }

  // ============ 模块4: 智能提醒推送 ============

  // D01: 预警提醒即时推送
  private async createReminderForWarning(warning: HealthWarning): Promise<SmartReminder> {
    const reminder: SmartReminder = {
      id: `reminder-${Date.now()}`,
      petId: warning.petId,
      type: 'warning_active',
      title: `⚠️ ${warning.title}`,
      message: warning.message,
      relatedWarningId: warning.id,
      dueDate: new Date().toISOString(),
      completed: false,
      notifications: [
        {
          time: new Date().toISOString(),
          channel: 'app',
          sent: true,
        },
      ],
      createdAt: new Date().toISOString(),
    };

    const existingReminders = this.smartReminders.get(warning.petId) || [];
    this.smartReminders.set(warning.petId, [...existingReminders, reminder]);

    return reminder;
  }

  // D02: 提醒标记完成
  async markReminderCompleted(reminderId: string, petId: string): Promise<boolean> {
    const reminders = this.smartReminders.get(petId) || [];
    const reminder = reminders.find(r => r.id === reminderId);
    
    if (reminder) {
      reminder.completed = true;
      reminder.completedAt = new Date().toISOString();
      return true;
    }
    
    return false;
  }

  // D03: 重复提醒设置
  async setRepeatReminder(
    reminderId: string,
    petId: string,
    interval: { type: 'hour' | 'day' | 'week' | 'month'; value: number }
  ): Promise<boolean> {
    const reminders = this.smartReminders.get(petId) || [];
    const reminder = reminders.find(r => r.id === reminderId);
    
    if (reminder) {
      reminder.repeatInterval = interval;
      return true;
    }
    
    return false;
  }

  // D04: 即将到期预警提醒
  async createVaccineReminder(
    petId: string,
    vaccineName: string,
    dueDate: string
  ): Promise<SmartReminder> {
    const reminder: SmartReminder = {
      id: `reminder-vaccine-${Date.now()}`,
      petId,
      type: 'vaccination',
      title: `💉 ${vaccineName}接种提醒`,
      message: `${vaccineName}接种即将到期，请及时安排`,
      dueDate,
      completed: false,
      notifications: [
        {
          time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          channel: 'app',
          sent: true,
        },
      ],
      createdAt: new Date().toISOString(),
    };

    const existingReminders = this.smartReminders.get(petId) || [];
    this.smartReminders.set(petId, [...existingReminders, reminder]);

    return reminder;
  }

  // D05: 提醒批量管理
  async deleteReminders(reminderIds: string[], petId: string): Promise<number> {
    const reminders = this.smartReminders.get(petId) || [];
    const remaining = reminders.filter(r => !reminderIds.includes(r.id));
    this.smartReminders.set(petId, remaining);
    
    return reminderIds.length - remaining.length;
  }

  // ============ 模块5: AI对话式健康咨询 ============

  // E01: 基础健康问题咨询
  async chatWithAI(
    petId: string,
    conversationId: string | null,
    message: string
  ): Promise<{
    conversation: AIChatConversation;
    response: string;
  }> {
    await this.simulateDelay(2500);

    const petInfo = this.petData.get(petId);
    const warnings = this.healthWarnings.get(petId) || [];
    const metrics = this.healthMetrics.get(petId) || [];

    let response = '';

    if (message.includes('喝') && message.includes('水')) {
      response = `根据${petInfo?.breed || '宠物'}的体重，每日建议饮水量约为：\n` +
        `• 猫：40-60ml/kg体重\n` +
        `• 狗：50-100ml/kg体重\n\n` +
        `请确保提供清洁的饮用水，并观察您的宠物是否有异常的饮水习惯变化。`;
    } else if (message.includes('发热') || message.includes('发烧')) {
      const recentTemp = metrics.filter(m => m.type === 'temperature').slice(-1)[0];
      response = `${recentTemp ? `最近一次体温为${recentTemp.value}℃。` : ''}\n` +
        `宠物正常体温范围：\n` +
        `• 犬：37.5-39.0℃\n` +
        `• 猫：38.0-39.2℃\n\n` +
        `如果体温超过40℃，建议采取物理降温措施并及时就医。`;
    } else if (message.includes('呕吐')) {
      response = `呕吐可能的原因：\n` +
        `1. 毛球症（猫咪常见）\n` +
        `2. 饮食不当\n` +
        `3. 消化系统感染\n\n` +
        `建议措施：\n` +
        `• 轻度：禁食12小时，少量多次补水\n` +
        `• 严重：频繁呕吐（≥5次）或带血时立即就医`;
    } else {
      response = `您好！我是您的AI健康顾问。\n\n` +
        `我可以帮您：\n` +
        `• 解答关于宠物健康的问题\n` +
        `• 分析健康数据和趋势\n` +
        `• 提供症状初诊建议\n` +
        `• 推荐合适的护理方案\n\n` +
        `请问有什么可以帮到您的？`;
    }

    let conversation: AIChatConversation;
    
    if (conversationId) {
      const conversations = this.chatConversations.get(petId) || [];
      conversation = conversations.find(c => c.id === conversationId)!;
    } else {
      conversation = {
        id: `conv-${Date.now()}`,
        petId,
        title: message.slice(0, 30) + (message.length > 30 ? '...' : ''),
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const userMessage: AIChatMessage = {
      id: `msg-${Date.now()}-1`,
      petId,
      conversationId: conversation.id,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    const assistantMessage: AIChatMessage = {
      id: `msg-${Date.now()}-2`,
      petId,
      conversationId: conversation.id,
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString(),
      metadata: {
        healthDataReference: metrics.slice(-3).map(m => m.id),
        warningReference: warnings.filter(w => !w.resolved).map(w => w.id),
      },
    };

    conversation.messages.push(userMessage, assistantMessage);
    conversation.updatedAt = new Date().toISOString();

    if (!conversationId) {
      const existingConversations = this.chatConversations.get(petId) || [];
      this.chatConversations.set(petId, [...existingConversations, conversation]);
    }

    return { conversation, response };
  }

  // E05: 对话历史查询
  async getConversations(petId: string): Promise<AIChatConversation[]> {
    return this.chatConversations.get(petId) || [];
  }

  // ============ 模块6: 历史预警管理 ============

  // F01-F03: 预警查询和筛选
  async getWarnings(petId: string, filter?: WarningFilter): Promise<HealthWarning[]> {
    let warnings = this.healthWarnings.get(petId) || [];

    if (filter) {
      if (filter.severity) {
        warnings = warnings.filter(w => filter.severity!.includes(w.severity));
      }
      if (filter.type) {
        warnings = warnings.filter(w => filter.type!.includes(w.type));
      }
      if (filter.status) {
        switch (filter.status) {
          case 'active':
            warnings = warnings.filter(w => !w.resolved);
            break;
          case 'resolved':
            warnings = warnings.filter(w => w.resolved);
            break;
          case 'acknowledged':
            warnings = warnings.filter(w => w.acknowledged);
            break;
        }
      }
      if (filter.dateRange) {
        warnings = warnings.filter(w => {
          const date = new Date(w.timestamp);
          return date >= new Date(filter.dateRange!.start) && 
                 date <= new Date(filter.dateRange!.end);
        });
      }
    }

    return warnings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // F04: 预警删除
  async deleteWarning(warningId: string, petId: string): Promise<boolean> {
    const warnings = this.healthWarnings.get(petId) || [];
    const filtered = warnings.filter(w => w.id !== warningId);
    this.healthWarnings.set(petId, filtered);
    
    return filtered.length < warnings.length;
  }

  // 其他辅助方法
  async getReminders(petId: string, filter?: ReminderFilter): Promise<SmartReminder[]> {
    let reminders = this.smartReminders.get(petId) || [];

    if (filter) {
      if (filter.type) {
        reminders = reminders.filter(r => filter.type!.includes(r.type));
      }
      if (filter.status) {
        switch (filter.status) {
          case 'pending':
            reminders = reminders.filter(r => !r.completed && !r.snoozeUntil);
            break;
          case 'completed':
            reminders = reminders.filter(r => r.completed);
            break;
          case 'snoozed':
            reminders = reminders.filter(r => r.snoozeUntil && new Date(r.snoozeUntil) > new Date());
            break;
        }
      }
    }

    return reminders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async acknowledgeWarning(warningId: string, petId: string): Promise<boolean> {
    const warnings = this.healthWarnings.get(petId) || [];
    const warning = warnings.find(w => w.id === warningId);
    
    if (warning) {
      warning.acknowledged = true;
      warning.acknowledgedAt = new Date().toISOString();
      return true;
    }
    
    return false;
  }

  async getNearbyClinics(petId: string): Promise<VeterinaryClinic[]> {
    return NEARBY_CLINICS;
  }

  // ============ 私有辅助方法 ============

  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getMetricName(type: HealthMetricType): string {
    const names: Record<HealthMetricType, string> = {
      weight: '体重',
      temperature: '体温',
      heartRate: '心率',
      respiration: '呼吸',
      sleep: '睡眠',
      activity: '活动量',
      eating: '进食',
      drinking: '饮水',
      vomit: '呕吐',
      cough: '咳嗽',
      diarrhea: '腹泻',
      energy: '精力',
      appetite: '食欲',
      mood: '情绪',
    };
    return names[type] || type;
  }

  private getAlertTypeName(type: AlertType): string {
    const names: Record<AlertType, string> = {
      weight_abnormal: '体重异常',
      temperature_abnormal: '体温异常',
      heart_rate_abnormal: '心率异常',
      respiration_abnormal: '呼吸异常',
      vomit_abnormal: '呕吐异常',
      cough_abnormal: '咳嗽异常',
      diarrhea_abnormal: '腹泻异常',
      activity_low: '活动量低',
      sleep_abnormal: '睡眠异常',
      eating_abnormal: '进食异常',
      drinking_abnormal: '饮水异常',
      infection_suspected: '疑似感染',
      pain_suspected: '疑似疼痛',
      general_concern: '一般关注',
    };
    return names[type] || type;
  }

  private generateWarningSummary(type: AlertType, severity: AlertSeverity, message: string): string {
    return `${message}，建议密切观察，${severity === 'emergency' || severity === 'high' ? '必要时及时就医' : '如有加重请就医'}。`;
  }

  private generatePossibleCauses(type: AlertType, severity: AlertSeverity): HealthWarning['analysis']['possibleCauses'] {
    const causes: Record<AlertType, HealthWarning['analysis']['possibleCauses']> = {
      temperature_abnormal: [
        { cause: '感染', probability: 0.4, description: '病毒或细菌感染' },
        { cause: '环境因素', probability: 0.3, description: '环境温度过高或过低' },
        { cause: '炎症', probability: 0.3, description: '身体炎症反应' },
      ],
      vomit_abnormal: [
        { cause: '饮食不当', probability: 0.35, description: '进食了不合适的食物' },
        { cause: '毛球症（猫）', probability: 0.3, description: '毛球堵塞消化道' },
        { cause: '肠胃炎', probability: 0.25, description: '胃肠道炎症' },
      ],
      weight_abnormal: [
        { cause: '饮食变化', probability: 0.4, description: '饮食量或种类改变' },
        { cause: '运动变化', probability: 0.3, description: '运动量变化' },
        { cause: '健康问题', probability: 0.3, description: '潜在健康问题影响' },
      ],
    };

    return causes[type] || [
      { cause: '需要进一步观察', probability: 0.5, description: '目前原因不明，建议观察' },
    ];
  }

  private generateOverallAssessment(symptoms: string[], hasHighFever: boolean, hasFrequentVomit: boolean): string {
    const symptomCount = symptoms.length;
    
    if (hasHighFever && hasFrequentVomit) {
      return '症状较严重，建议及时就医检查';
    } else if (symptomCount >= 3) {
      return '多种症状同时出现，需要密切关注';
    } else if (hasHighFever) {
      return '有发热症状，建议观察24小时';
    } else {
      return '症状轻微，建议居家观察';
    }
  }

  private generateTrendSummary(metrics: HealthTrendAnalysis['metrics']): string {
    const unstable = metrics.filter(m => m.trend !== 'stable');
    
    if (unstable.length === 0) {
      return '各项指标稳定，健康状况良好';
    } else if (unstable.length === 1) {
      const m = unstable[0];
      return `${m.name}有${m.trend === 'up' ? '上升' : '下降'}趋势，建议继续观察`;
    } else {
      return `${unstable.length}项指标有变化，建议咨询兽医`;
    }
  }

  private generateTrendRecommendations(metrics: HealthTrendAnalysis['metrics']): string[] {
    const recommendations: string[] = [];
    
    const weightTrend = metrics.find(m => m.type === 'weight');
    if (weightTrend?.trend === 'up') {
      recommendations.push('建议控制饮食，增加运动量');
    } else if (weightTrend?.trend === 'down') {
      recommendations.push('检查食欲，增加营养摄入');
    }
    
    recommendations.push('定期测量健康指标');
    recommendations.push('观察宠物行为变化');
    
    return recommendations;
  }

  private calculateHealthScore(
    warnings: HealthWarning[],
    metrics: HealthReport['content']['metrics']
  ): number {
    let score = 100;
    
    for (const warning of warnings) {
      if (!warning.resolved) {
        switch (warning.severity) {
          case 'emergency':
            score -= 25;
            break;
          case 'high':
            score -= 15;
            break;
          case 'medium':
            score -= 8;
            break;
          case 'low':
            score -= 3;
            break;
        }
      }
    }
    
    for (const metric of metrics) {
      if (metric.status === 'warning') {
        score -= 2;
      }
    }
    
    return Math.max(0, Math.min(100, score));
  }

  private generateReportSummary(score: number, warnings: HealthWarning[]): string {
    if (score >= 90) return '健康状况优秀，继续保持良好的护理习惯';
    if (score >= 75) return '健康状况良好，有轻微异常需要关注';
    if (score >= 60) return '健康状况一般，建议加强观察和护理';
    return '健康状况需要关注，建议咨询兽医';
  }

  private generateReportRecommendations(
    score: number,
    metrics: HealthReport['content']['metrics'],
    warnings: HealthWarning[]
  ): string[] {
    const recommendations: string[] = ['保持规律的作息和饮食习惯'];
    
    if (score < 90) {
      recommendations.push('增加互动时间，关注情绪变化');
    }
    
    if (score < 75) {
      recommendations.push('考虑安排一次健康检查');
    }
    
    if (warnings.some(w => w.type === 'weight_abnormal')) {
      recommendations.push('定期称重，监控体重变化');
    }
    
    return recommendations;
  }

  private generateFollowUpPlan(warning: HealthWarning): string {
    const plans: Record<AlertSeverity, string> = {
      low: '继续观察3天，记录症状变化',
      medium: '观察24小时，如无好转请就医',
      high: '建议48小时内就医检查',
      emergency: '请立即就医',
    };
    
    return plans[warning.severity];
  }

  private async checkMetricNormal(petId: string, metric: HealthMetric): Promise<boolean> {
    const breed = this.petData.get(petId)?.breed || 'default_dog';
    const breedConfig = BREED_CONFIGS[breed] || BREED_CONFIGS.default_dog;
    const ranges = breedConfig.normalRanges;

    switch (metric.type) {
      case 'weight':
        return metric.value >= ranges.weight.min && metric.value <= ranges.weight.max;
      case 'temperature':
        return metric.value >= ranges.temperature.min && metric.value <= ranges.temperature.max;
      case 'vomit':
        return metric.value < 2;
      default:
        return true;
    }
  }

  private initializeDemoData(): void {
    // 设置演示宠物信息
    this.setPetInfo('pet-1', '金毛犬', 3);
    this.setPetInfo('pet-2', '英国短毛猫', 2);

    // 为演示宠物添加一些历史数据
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      const weight1: HealthMetric = {
        id: `demo-metric-1-${i}`,
        petId: 'pet-1',
        type: 'weight',
        value: 28 + Math.sin(i * 0.2) * 0.5,
        unit: 'kg',
        timestamp: date.toISOString(),
      };

      const temp1: HealthMetric = {
        id: `demo-metric-2-${i}`,
        petId: 'pet-1',
        type: 'temperature',
        value: 38.5 + Math.random() * 0.3,
        unit: '℃',
        timestamp: date.toISOString(),
      };

      const weight2: HealthMetric = {
        id: `demo-metric-3-${i}`,
        petId: 'pet-2',
        type: 'weight',
        value: 4.2 + Math.sin(i * 0.15) * 0.3,
        unit: 'kg',
        timestamp: date.toISOString(),
      };

      const existing1 = this.healthMetrics.get('pet-1') || [];
      const existing2 = this.healthMetrics.get('pet-2') || [];
      
      this.healthMetrics.set('pet-1', [...existing1, weight1, temp1]);
      this.healthMetrics.set('pet-2', [...existing2, weight2]);
    }
  }
}

export const healthWarningService = new HealthWarningService();
