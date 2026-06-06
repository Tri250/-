import type { HealthRecord, HealthMetric, HealthAlert, HealthTrend, HealthGoal, HealthScore, HealthMetricType, HealthStatus } from '../types/health';

// 健康评分权重配置
const HEALTH_SCORE_WEIGHTS = {
  nutrition: 0.25,
  activity: 0.25,
  sleep: 0.20,
  mental: 0.15,
  medical: 0.15,
};

// 健康指标正常范围
const HEALTH_RANGES: Record<HealthMetricType, { min: number; max: number; unit: string }> = {
  weight: { min: 2, max: 50, unit: 'kg' },
  sleep: { min: 8, max: 16, unit: 'h' },
  activity: { min: 20, max: 180, unit: 'min' },
  eating: { min: 50, max: 500, unit: 'g' },
  drinking: { min: 100, max: 2000, unit: 'ml' },
};

// 症状数据库
const SYMPTOM_DATABASE: Record<string, {
  conditions: Array<{ name: string; probability: number; severity: HealthStatus; recommendation: string }>;
  generalAdvice: string[];
}> = {
  '食欲不振': {
    conditions: [
      { name: '应激反应', probability: 0.4, severity: 'fair', recommendation: '提供安静环境，尝试不同食物，观察24-48小时' },
      { name: '消化系统问题', probability: 0.3, severity: 'fair', recommendation: '暂时禁食12小时，提供清水，如持续请就医' },
      { name: '口腔问题', probability: 0.2, severity: 'fair', recommendation: '检查口腔是否有异物、炎症、牙结石或溃疡' },
      { name: '潜在疾病', probability: 0.1, severity: 'poor', recommendation: '如伴随其他症状请立即就医' },
    ],
    generalAdvice: ['保持食物新鲜', '提供多种食物选择', '定时定量喂食', '观察精神状态'],
  },
  '呕吐': {
    conditions: [
      { name: '饮食不当', probability: 0.5, severity: 'fair', recommendation: '禁食12-24小时，少量多次给水' },
      { name: '毛球症', probability: 0.25, severity: 'fair', recommendation: '使用化毛膏或猫草帮助排出毛球' },
      { name: '肠胃炎', probability: 0.15, severity: 'fair', recommendation: '观察粪便和精神状态，必要时送医院检查' },
      { name: '严重疾病', probability: 0.1, severity: 'poor', recommendation: '如频繁呕吐请立即送医院' },
    ],
    generalAdvice: ['记录呕吐频率', '避免油腻食物', '提供充足清水', '观察伴随症状'],
  },
  '腹泻': {
    conditions: [
      { name: '饮食变化', probability: 0.4, severity: 'fair', recommendation: '暂时喂食清淡食物，逐渐恢复正常饮食' },
      { name: '寄生虫感染', probability: 0.3, severity: 'fair', recommendation: '检查粪便，必要时驱虫' },
      { name: '细菌感染', probability: 0.2, severity: 'fair', recommendation: '观察是否发热，必要时就医' },
      { name: '病毒感染', probability: 0.1, severity: 'poor', recommendation: '如伴随发热、血便请立即就医' },
    ],
    generalAdvice: ['补充水分防止脱水', '记录粪便性状', '避免油腻食物', '保持环境清洁'],
  },
  '咳嗽': {
    conditions: [
      { name: '轻微感冒', probability: 0.4, severity: 'good', recommendation: '保持温暖，增加湿度，观察1-2天' },
      { name: '呼吸道感染', probability: 0.3, severity: 'fair', recommendation: '观察是否有鼻涕、发热，必要时就医' },
      { name: '异物吸入', probability: 0.2, severity: 'poor', recommendation: '如咳嗽剧烈持续请立即检查' },
      { name: '过敏', probability: 0.1, severity: 'fair', recommendation: '检查环境中是否有新过敏原' },
    ],
    generalAdvice: ['保持空气清新', '避免烟雾灰尘', '监测呼吸状态', '记录咳嗽特点'],
  },
  '精神萎靡': {
    conditions: [
      { name: '疲劳', probability: 0.3, severity: 'good', recommendation: '保证充足休息，观察恢复情况' },
      { name: '发热', probability: 0.25, severity: 'fair', recommendation: '测量体温，如异常请就医' },
      { name: '疼痛', probability: 0.25, severity: 'fair', recommendation: '检查是否有外伤或触痛部位' },
      { name: '严重疾病', probability: 0.2, severity: 'poor', recommendation: '如持续超过24小时请就医' },
    ],
    generalAdvice: ['观察睡眠模式', '检查体温', '注意食欲变化', '避免过度打扰'],
  },
};

class HealthService {
  private healthRecords: HealthRecord[] = [];
  private healthAlerts: HealthAlert[] = [];
  private healthGoals: HealthGoal[] = [];

  constructor() {
    this.loadDataFromStorage();
  }

  // 从本地存储加载数据
  private loadDataFromStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedRecords = localStorage.getItem('healthRecords');
      const savedAlerts = localStorage.getItem('healthAlerts');
      const savedGoals = localStorage.getItem('healthGoals');

      if (savedRecords) {
        try {
          this.healthRecords = JSON.parse(savedRecords);
        } catch {
          this.healthRecords = [];
        }
      }

      if (savedAlerts) {
        try {
          this.healthAlerts = JSON.parse(savedAlerts);
        } catch {
          this.healthAlerts = [];
        }
      }

      if (savedGoals) {
        try {
          this.healthGoals = JSON.parse(savedGoals);
        } catch {
          this.healthGoals = [];
        }
      }
    }
  }

  // 保存数据到本地存储
  private saveDataToStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('healthRecords', JSON.stringify(this.healthRecords));
      localStorage.setItem('healthAlerts', JSON.stringify(this.healthAlerts));
      localStorage.setItem('healthGoals', JSON.stringify(this.healthGoals));
    }
  }

  // ==================== 健康评分算法 ====================

  async getHealthScore(petId: string): Promise<HealthScore> {
    const records = this.healthRecords.filter(r => r.petId === petId);
    const recentRecords = records.slice(0, 7); // 最近7天

    // 计算各项指标得分
    const nutrition = this.calculateNutritionScore(recentRecords);
    const activity = this.calculateActivityScore(recentRecords);
    const sleep = this.calculateSleepScore(recentRecords);
    const mental = this.calculateMentalScore(recentRecords);

    // 计算总体得分（加权平均）
    const overall = Math.round(
      nutrition * HEALTH_SCORE_WEIGHTS.nutrition +
      activity * HEALTH_SCORE_WEIGHTS.activity +
      sleep * HEALTH_SCORE_WEIGHTS.sleep +
      mental * HEALTH_SCORE_WEIGHTS.mental +
      85 * HEALTH_SCORE_WEIGHTS.medical // 医疗检查默认良好
    );

    // 计算趋势
    const trend = this.calculateScoreTrend(records);

    return {
      overall,
      nutrition,
      activity,
      sleep,
      mental,
      trend,
      lastUpdated: new Date().toISOString(),
    };
  }

  // 计算营养得分
  private calculateNutritionScore(records: HealthRecord[]): number {
    if (records.length === 0) return 85;

    let score = 85;
    
    // 分析饮食记录
    const eatingRecords = records.flatMap(r => 
      r.metrics.filter(m => m.type === 'eating')
    );

    if (eatingRecords.length > 0) {
      const avgEating = eatingRecords.reduce((sum, m) => sum + m.value, 0) / eatingRecords.length;
      const range = HEALTH_RANGES.eating;
      
      // 根据摄入量调整分数
      if (avgEating >= range.min && avgEating <= range.max) {
        score += 10;
      } else if (avgEating < range.min * 0.7) {
        score -= 20; // 摄入过少
      } else if (avgEating > range.max * 1.3) {
        score -= 10; // 摄入过多
      }
    }

    // 分析体重变化
    const weightRecords = records.flatMap(r => 
      r.metrics.filter(m => m.type === 'weight')
    );

    if (weightRecords.length >= 2) {
      const recentWeight = weightRecords[0].value;
      const olderWeight = weightRecords[weightRecords.length - 1].value;
      const weightChange = Math.abs(recentWeight - olderWeight);
      
      // 体重变化超过10%扣分
      if (weightChange > olderWeight * 0.1) {
        score -= 15;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  // 计算活动得分
  private calculateActivityScore(records: HealthRecord[]): number {
    if (records.length === 0) return 85;

    let score = 85;
    
    const activityRecords = records.flatMap(r => 
      r.metrics.filter(m => m.type === 'activity')
    );

    if (activityRecords.length > 0) {
      const avgActivity = activityRecords.reduce((sum, m) => sum + m.value, 0) / activityRecords.length;
      // const range = HEALTH_RANGES.activity;
      
      // 理想活动量
      if (avgActivity >= 30 && avgActivity <= 120) {
        score += 10;
      } else if (avgActivity < 20) {
        score -= 15; // 活动过少
      } else if (avgActivity > 180) {
        score -= 5; // 活动过多
      }

      // 检查活动量变化趋势
      if (activityRecords.length >= 3) {
        const recent = activityRecords.slice(0, 3);
        const older = activityRecords.slice(-3);
        const recentAvg = recent.reduce((sum, m) => sum + m.value, 0) / recent.length;
        const olderAvg = older.reduce((sum, m) => sum + m.value, 0) / older.length;
        
        if (recentAvg < olderAvg * 0.7) {
          score -= 10; // 活动量显著下降
        }
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  // 计算睡眠得分
  private calculateSleepScore(records: HealthRecord[]): number {
    if (records.length === 0) return 85;

    let score = 85;
    
    const sleepRecords = records.flatMap(r => 
      r.metrics.filter(m => m.type === 'sleep')
    );

    if (sleepRecords.length > 0) {
      const avgSleep = sleepRecords.reduce((sum, m) => sum + m.value, 0) / sleepRecords.length;
      // const range = HEALTH_RANGES.sleep;
      
      // 理想睡眠时间
      if (avgSleep >= 12 && avgSleep <= 14) {
        score += 10;
      } else if (avgSleep < 8) {
        score -= 15; // 睡眠不足
      } else if (avgSleep > 16) {
        score -= 10; // 睡眠过多
      }

      // 检查睡眠质量（通过睡眠时长的稳定性）
      if (sleepRecords.length >= 3) {
        const values = sleepRecords.map(m => m.value);
        const variance = this.calculateVariance(values);
        if (variance > 4) {
          score -= 10; // 睡眠不规律
        }
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  // 计算心理健康得分
  private calculateMentalScore(records: HealthRecord[]): number {
    let score = 85;
    
    // 基于整体状态评估
    const statusCounts: Record<string, number> = { excellent: 0, good: 0, fair: 0, poor: 0, critical: 0 };
    records.forEach(r => {
      statusCounts[r.overallStatus]++;
    });

    const total = records.length || 1;
    const goodRatio = (statusCounts.excellent + statusCounts.good) / total;
    const poorRatio = (statusCounts.poor + statusCounts.critical) / total;

    if (goodRatio > 0.7) {
      score += 10;
    } else if (poorRatio > 0.3) {
      score -= 15;
    }

    // 检查是否有未处理的警报
    const unacknowledgedAlerts = this.healthAlerts.filter(a => !a.acknowledged).length;
    score -= unacknowledgedAlerts * 5;

    return Math.max(0, Math.min(100, score));
  }

  // 计算得分趋势
  private calculateScoreTrend(records: HealthRecord[]): 'up' | 'down' | 'stable' {
    if (records.length < 7) return 'stable';

    const recent = records.slice(0, 3);
    const older = records.slice(-3);

    const recentGood = recent.filter(r => r.overallStatus === 'good' || r.overallStatus === 'excellent').length;
    const olderGood = older.filter(r => r.overallStatus === 'good' || r.overallStatus === 'excellent').length;

    if (recentGood > olderGood) return 'up';
    if (recentGood < olderGood) return 'down';
    return 'stable';
  }

  // 计算方差
  private calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
  }

  // ==================== 异常检测算法 ====================

  // 检测异常指标
  private detectAnomalies(metrics: HealthMetric[]): HealthAlert[] {
    const alerts: HealthAlert[] = [];

    for (const metric of metrics) {
      const range = HEALTH_RANGES[metric.type];
      if (!range) continue;

      // 检测超出正常范围的情况
      if (metric.value < range.min * 0.7 || metric.value > range.max * 1.3) {
        const isHigh = metric.value > range.max;
        alerts.push({
          id: `alert-${Date.now()}-${metric.type}`,
          petId: metric.petId,
          type: this.mapMetricTypeToAlertType(metric.type),
          severity: this.calculateAlertSeverity(metric, range),
          message: `${this.getMetricLabel(metric.type)}${isHigh ? '过高' : '过低'}: ${metric.value}${metric.unit}`,
          timestamp: new Date().toISOString(),
          acknowledged: false,
          recommendation: this.getRecommendationForMetric(metric.type, isHigh),
        });
      }
    }

    return alerts;
  }

  // 映射指标类型到警报类型
  private mapMetricTypeToAlertType(metricType: HealthMetricType): HealthAlert['type'] {
    const mapping: Record<HealthMetricType, HealthAlert['type']> = {
      weight: 'abnormal',
      sleep: 'lethargy',
      activity: 'abnormal',
      eating: 'abnormal',
      drinking: 'abnormal',
    };
    return mapping[metricType];
  }

  // 计算警报严重程度
  private calculateAlertSeverity(metric: HealthMetric, range: { min: number; max: number }): HealthAlert['severity'] {
    const ratio = metric.value < range.min 
      ? range.min / metric.value 
      : metric.value / range.max;

    if (ratio > 2) return 'high';
    if (ratio > 1.5) return 'medium';
    return 'low';
  }

  // 获取指标标签
  private getMetricLabel(type: HealthMetricType): string {
    const labels: Record<HealthMetricType, string> = {
      weight: '体重',
      sleep: '睡眠时间',
      activity: '活动量',
      eating: '饮食量',
      drinking: '饮水量',
    };
    return labels[type];
  }

  // 获取建议
  private getRecommendationForMetric(type: HealthMetricType, isHigh: boolean): string {
    const recommendations: Record<HealthMetricType, { high: string; low: string }> = {
      weight: {
        high: '控制饮食，增加运动，定期称重监测',
        low: '增加营养摄入，检查是否有寄生虫或疾病',
      },
      sleep: {
        high: '增加日间活动，提供更有趣的玩具',
        low: '提供安静舒适的睡眠环境，减少干扰',
      },
      activity: {
        high: '确保充足休息，避免过度疲劳',
        low: '增加互动游戏时间，鼓励运动',
      },
      eating: {
        high: '控制食量，避免过度喂养',
        low: '尝试不同食物，检查口腔健康',
      },
      drinking: {
        high: '监测是否有糖尿病或肾病，建议就医',
        low: '提供新鲜水源，尝试流动饮水机',
      },
    };
    return recommendations[type][isHigh ? 'high' : 'low'];
  }

  // ==================== 数据管理 ====================

  async getHealthRecords(petId: string, days: number = 7): Promise<HealthRecord[]> {
    return this.healthRecords
      .filter(r => r.petId === petId)
      .slice(0, days);
  }

  async addHealthRecord(record: Omit<HealthRecord, 'id'>): Promise<HealthRecord> {
    const newRecord: HealthRecord = {
      ...record,
      id: `record-${Date.now()}`,
    };

    // 检测异常并生成警报
    const anomalies = this.detectAnomalies(record.metrics);
    this.healthAlerts.push(...anomalies);

    this.healthRecords.unshift(newRecord);
    this.saveDataToStorage();
    
    return newRecord;
  }

  async addHealthMetric(metric: Omit<HealthMetric, 'id'>): Promise<HealthMetric> {
    const newMetric: HealthMetric = {
      ...metric,
      id: `metric-${Date.now()}`,
    };

    // 更新今日记录
    const today = new Date().toISOString().split('T')[0];
    let todayRecord = this.healthRecords.find(r => r.petId === metric.petId && r.date === today);
    
    if (!todayRecord) {
      todayRecord = {
        id: `record-${Date.now()}`,
        petId: metric.petId,
        date: today,
        metrics: [newMetric],
        overallStatus: 'good',
      };
      this.healthRecords.unshift(todayRecord);
    } else {
      todayRecord.metrics.push(newMetric);
    }

    // 检测异常
    const anomalies = this.detectAnomalies([newMetric]);
    this.healthAlerts.push(...anomalies);

    this.saveDataToStorage();
    return newMetric;
  }

  async getHealthAlerts(petId: string): Promise<HealthAlert[]> {
    return this.healthAlerts.filter(a => a.petId === petId);
  }

  async acknowledgeAlert(alertId: string): Promise<boolean> {
    const alert = this.healthAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.saveDataToStorage();
      return true;
    }
    return false;
  }

  // ==================== 趋势分析 ====================

  async getHealthTrends(petId: string, metricType: HealthMetricType): Promise<HealthTrend> {
    const metrics = this.healthRecords
      .filter(r => r.petId === petId)
      .flatMap(r => r.metrics.filter(m => m.type === metricType));

    if (metrics.length < 2) {
      return {
        metricType,
        current: 0,
        previous: 0,
        change: 0,
        percentageChange: 0,
        direction: 'stable',
        days: 7,
      };
    }

    // 计算最近7天和前7天的平均值
    const recent = metrics.slice(0, Math.min(7, Math.floor(metrics.length / 2)));
    const previous = metrics.slice(recent.length, recent.length * 2);

    const current = recent.reduce((sum, m) => sum + m.value, 0) / recent.length;
    const prev = previous.length > 0 
      ? previous.reduce((sum, m) => sum + m.value, 0) / previous.length 
      : current;

    const change = current - prev;
    const percentageChange = prev !== 0 ? (change / prev) * 100 : 0;

    let direction: 'improving' | 'declining' | 'stable' = 'stable';
    
    // 根据指标类型判断改善方向
    const higherIsBetter: HealthMetricType[] = ['activity', 'eating', 'drinking'];
    const lowerIsBetter: HealthMetricType[] = [];
    
    if (Math.abs(percentageChange) > 10) {
      if (higherIsBetter.includes(metricType)) {
        direction = change > 0 ? 'improving' : 'declining';
      } else if (lowerIsBetter.includes(metricType)) {
        direction = change < 0 ? 'improving' : 'declining';
      } else {
        direction = Math.abs(change) < 5 ? 'stable' : 'declining';
      }
    }

    return {
      metricType,
      current: Math.round(current * 10) / 10,
      previous: Math.round(prev * 10) / 10,
      change: Math.round(change * 10) / 10,
      percentageChange: Math.round(percentageChange * 10) / 10,
      direction,
      days: recent.length,
    };
  }

  // ==================== 目标管理 ====================

  async getHealthGoals(petId: string): Promise<HealthGoal[]> {
    return this.healthGoals.filter(g => g.petId === petId);
  }

  async createHealthGoal(goal: Omit<HealthGoal, 'id'>): Promise<HealthGoal> {
    const newGoal: HealthGoal = {
      ...goal,
      id: `goal-${Date.now()}`,
    };

    this.healthGoals.push(newGoal);
    this.saveDataToStorage();
    return newGoal;
  }

  async updateHealthGoal(goalId: string, updates: Partial<HealthGoal>): Promise<boolean> {
    const goal = this.healthGoals.find(g => g.id === goalId);
    if (goal) {
      Object.assign(goal, updates);
      this.saveDataToStorage();
      return true;
    }
    return false;
  }

  async deleteHealthGoal(goalId: string): Promise<boolean> {
    const index = this.healthGoals.findIndex(g => g.id === goalId);
    if (index >= 0) {
      this.healthGoals.splice(index, 1);
      this.saveDataToStorage();
      return true;
    }
    return false;
  }

  // 更新目标进度
  async updateGoalProgress(petId: string): Promise<void> {
    const goals = this.healthGoals.filter(g => g.petId === petId && g.status === 'active');
    
    for (const goal of goals) {
      const metrics = this.healthRecords
        .filter(r => r.petId === petId)
        .flatMap(r => r.metrics.filter(m => m.type === goal.type));
      
      if (metrics.length > 0) {
        const latest = metrics[0].value;
        goal.current = latest;
        
        // 检查是否完成
        if (Math.abs(latest - goal.target) / goal.target < 0.1) {
          goal.status = 'completed';
        }
      }
    }
    
    this.saveDataToStorage();
  }

  // ==================== 症状自检 ====================

  async checkSymptoms(symptoms: string[]): Promise<{
    symptoms: string[];
    possibleConditions: Array<{
      condition: string;
      probability: number;
      severity: string;
      recommendation: string;
    }>;
  }> {
    const allConditions: Array<{
      condition: string;
      probability: number;
      severity: string;
      recommendation: string;
      sourceSymptom: string;
    }> = [];

    for (const symptom of symptoms) {
      const symptomData = SYMPTOM_DATABASE[symptom];
      if (symptomData) {
        for (const condition of symptomData.conditions) {
          allConditions.push({
            condition: condition.name,
            probability: condition.probability,
            severity: condition.severity,
            recommendation: condition.recommendation,
            sourceSymptom: symptom,
          });
        }
      }
    }

    // 按概率排序并去重
    const conditionMap = new Map<string, typeof allConditions[0]>();
    for (const condition of allConditions) {
      const existing = conditionMap.get(condition.condition);
      if (!existing || existing.probability < condition.probability) {
        conditionMap.set(condition.condition, condition);
      }
    }

    const uniqueConditions = Array.from(conditionMap.values())
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 5)
      .map(({ condition, probability, severity, recommendation }) => ({
        condition,
        probability,
        severity,
        recommendation,
      }));

    return {
      symptoms,
      possibleConditions: uniqueConditions,
    };
  }

  // ==================== 指标历史 ====================

  async getMetricHistory(petId: string, metricType: HealthMetricType, days: number = 7): Promise<HealthMetric[]> {
    const metrics: HealthMetric[] = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    for (const record of this.healthRecords) {
      if (record.petId !== petId) continue;
      if (new Date(record.date) < cutoffDate) continue;

      for (const metric of record.metrics) {
        if (metric.type === metricType) {
          metrics.push(metric);
        }
      }
    }

    return metrics.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // 获取统计数据
  async getStatistics(petId: string): Promise<{
    totalRecords: number;
    averageMetrics: Partial<Record<HealthMetricType, number>>;
    alertCount: number;
    unacknowledgedAlerts: number;
  }> {
    const records = this.healthRecords.filter(r => r.petId === petId);
    const alerts = this.healthAlerts.filter(a => a.petId === petId);

    const averageMetrics: Partial<Record<HealthMetricType, number>> = {};
    
    for (const type of ['weight', 'sleep', 'activity', 'eating', 'drinking'] as HealthMetricType[]) {
      const metrics = records.flatMap(r => r.metrics.filter(m => m.type === type));
      if (metrics.length > 0) {
        averageMetrics[type] = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
      }
    }

    return {
      totalRecords: records.length,
      averageMetrics,
      alertCount: alerts.length,
      unacknowledgedAlerts: alerts.filter(a => !a.acknowledged).length,
    };
  }
}

export const healthService = new HealthService();
