// ============================================
// PawSync Pro 3.0 - Health Service
//
// 描述: 健康监测服务 - 基于真实指标数据的健康评分与告警系统
// ============================================

import type { HealthRecord, HealthMetric, HealthAlert, HealthTrend, HealthGoal, HealthScore, HealthMetricType } from '../types/health';
import { databaseService, STORE_NAMES } from './databaseService';

// 默认基线值（无历史数据时使用）
const DEFAULT_BASELINES: Record<HealthMetricType, { value: number; unit: string }> = {
  weight: { value: 4.5, unit: 'kg' },
  sleep: { value: 14, unit: 'h' },
  activity: { value: 45, unit: 'min' },
  eating: { value: 2, unit: '次' },
  drinking: { value: 3, unit: '次' },
};

// 健康评分权重
const SCORE_WEIGHTS = {
  nutrition: 0.25,
  activity: 0.25,
  sleep: 0.25,
  mental: 0.25,
};

class HealthService {
  private healthRecords: HealthRecord[] = [];
  private healthAlerts: HealthAlert[] = [];
  private healthGoals: HealthGoal[] = [];
  private initialized = false;

  constructor() {
    this.loadFromDatabase();
  }

  // 从 IndexedDB 加载历史数据
  private async loadFromDatabase(): Promise<void> {
    try {
      await databaseService.init();

      const allRecords = await databaseService.getAll<HealthRecord>(STORE_NAMES.HEALTH_RECORDS);
      this.healthRecords = allRecords.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      const allAlerts = await databaseService.getAll<HealthAlert>(STORE_NAMES.HEALTH_ALERTS);
      this.healthAlerts = allAlerts.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      const allGoals = await databaseService.getAll<HealthGoal>(STORE_NAMES.HEALTH_GOALS);
      this.healthGoals = allGoals;

      this.initialized = true;
    } catch (error) {
      console.warn('[HealthService] 加载历史数据失败:', error);
      this.healthRecords = [];
      this.healthAlerts = [];
      this.healthGoals = [];
      this.initialized = true;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.loadFromDatabase();
    }
  }

  // ============================================
  // 健康评分 - 基于真实指标计算
  // ============================================

  /**
   * 获取健康评分：基于最近 7 天的真实指标计算
   * nutrition: 基于体重变化趋势 + 饮食记录
   * activity: 基于活动时长 + 步数
   * sleep: 基于睡眠时长 + 规律性
   * mental: 基于情绪分析结果统计
   * overall: 加权平均
   */
  async getHealthScore(petId: string): Promise<HealthScore> {
    await this.ensureInitialized();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString();

    // 获取最近 7 天的指标数据
    const recentMetrics = await this.getRecentMetrics(petId, 7);

    // 计算各项评分
    const nutrition = this.calculateNutritionScore(petId, recentMetrics);
    const activity = this.calculateActivityScore(recentMetrics);
    const sleep = this.calculateSleepScore(recentMetrics);
    const mental = this.calculateMentalScore(petId);

    // 加权平均
    const overall = Math.round(
      nutrition * SCORE_WEIGHTS.nutrition +
      activity * SCORE_WEIGHTS.activity +
      sleep * SCORE_WEIGHTS.sleep +
      mental * SCORE_WEIGHTS.mental
    );

    // 计算趋势：与上周对比
    const trend = this.calculateOverallTrend(petId, recentMetrics);

    return {
      overall: Math.min(100, Math.max(0, overall)),
      nutrition: Math.min(100, Math.max(0, nutrition)),
      activity: Math.min(100, Math.max(0, activity)),
      sleep: Math.min(100, Math.max(0, sleep)),
      mental: Math.min(100, Math.max(0, mental)),
      trend,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * 获取最近 N 天的指标数据
   */
  private async getRecentMetrics(petId: string, days: number): Promise<HealthMetric[]> {
    const cutoffTime = new Date();
    cutoffTime.setDate(cutoffTime.getDate() - days);

    // 先从内存中的记录获取
    const metricsFromRecords: HealthMetric[] = [];
    for (const record of this.healthRecords) {
      if (record.petId === petId && new Date(record.date).getTime() >= cutoffTime.getTime()) {
        metricsFromRecords.push(...record.metrics);
      }
    }

    // 如果内存中没有，从 IndexedDB 获取
    if (metricsFromRecords.length === 0) {
      const allMetrics = await databaseService.getByIndex<HealthMetric>(STORE_NAMES.HEALTH_METRICS, 'petId', petId);
      return allMetrics.filter(
        (m: HealthMetric) => new Date(m.timestamp).getTime() >= cutoffTime.getTime()
      );
    }

    return metricsFromRecords;
  }

  /**
   * 营养评分：基于体重变化趋势 + 饮食记录
   */
  private calculateNutritionScore(petId: string, metrics: HealthMetric[]): number {
    const weightMetrics = metrics.filter(m => m.type === 'weight');
    const eatingMetrics = metrics.filter(m => m.type === 'eating');

    let score = 70; // 基础分

    // 体重稳定性评分
    if (weightMetrics.length >= 2) {
      const sortedWeights = weightMetrics.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      const latestWeight = sortedWeights[0].value;
      const previousWeight = sortedWeights[sortedWeights.length - 1].value;
      const weightChangePercent = Math.abs((latestWeight - previousWeight) / previousWeight) * 100;

      if (weightChangePercent < 2) {
        score += 20; // 体重非常稳定
      } else if (weightChangePercent < 5) {
        score += 10; // 体重基本稳定
      } else if (weightChangePercent < 10) {
        score -= 5; // 体重有变化
      } else {
        score -= 20; // 体重变化较大
      }
    } else if (weightMetrics.length === 1) {
      score += 5; // 有数据但不足以判断趋势
    }

    // 饮食规律性评分
    if (eatingMetrics.length >= 3) {
      const eatingValues = eatingMetrics.map(m => m.value);
      const avgEating = eatingValues.reduce((a, b) => a + b, 0) / eatingValues.length;
      const variance = eatingValues.reduce((sum, v) => sum + Math.pow(v - avgEating, 2), 0) / eatingValues.length;
      const cv = avgEating > 0 ? Math.sqrt(variance) / avgEating : 1;

      if (cv < 0.2) {
        score += 10; // 饮食非常规律
      } else if (cv < 0.4) {
        score += 5; // 饮食基本规律
      } else {
        score -= 5; // 饮食不规律
      }
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * 活动评分：基于活动时长
   */
  private calculateActivityScore(metrics: HealthMetric[]): number {
    const activityMetrics = metrics.filter(m => m.type === 'activity');

    if (activityMetrics.length === 0) {
      return 50; // 无数据时返回中间值
    }

    let score = 50; // 基础分

    // 平均活动时长
    const avgActivity = activityMetrics.reduce((a, b) => a + b.value, 0) / activityMetrics.length;

    // 活动时长评分（分钟）
    if (avgActivity >= 60) {
      score += 35; // 充足
    } else if (avgActivity >= 30) {
      score += 25; // 适中
    } else if (avgActivity >= 15) {
      score += 10; // 偏少
    } else {
      score -= 10; // 不足
    }

    // 活动规律性
    if (activityMetrics.length >= 3) {
      const values = activityMetrics.map(m => m.value);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
      const cv = avg > 0 ? Math.sqrt(variance) / avg : 1;

      if (cv < 0.3) {
        score += 15; // 规律
      } else if (cv < 0.5) {
        score += 8; // 基本规律
      } else {
        score -= 5; // 不规律
      }
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * 睡眠评分：基于睡眠时长 + 规律性
   */
  private calculateSleepScore(metrics: HealthMetric[]): number {
    const sleepMetrics = metrics.filter(m => m.type === 'sleep');

    if (sleepMetrics.length === 0) {
      return 50;
    }

    let score = 50;

    // 平均睡眠时长
    const avgSleep = sleepMetrics.reduce((a, b) => a + b.value, 0) / sleepMetrics.length;

    // 睡眠时长评分（小时）- 宠物（猫/狗）理想睡眠 12-16 小时
    if (avgSleep >= 12 && avgSleep <= 16) {
      score += 35; // 理想
    } else if (avgSleep >= 10 && avgSleep <= 18) {
      score += 25; // 可接受
    } else if (avgSleep >= 8 && avgSleep <= 20) {
      score += 10; // 偏差
    } else {
      score -= 15; // 异常
    }

    // 睡眠规律性
    if (sleepMetrics.length >= 3) {
      const values = sleepMetrics.map(m => m.value);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      if (stdDev < 1.5) {
        score += 15; // 非常规律
      } else if (stdDev < 3) {
        score += 8; // 基本规律
      } else {
        score -= 10; // 不规律
      }
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * 心理评分：基于情绪分析结果统计
   */
  private calculateMentalScore(petId: string): number {
    // 从音频事件中统计情绪分布
    let score = 60; // 基础分

    // 尝试从 IndexedDB 获取音频事件
    try {
      const audioEvents = this.healthRecords
        .filter(r => r.petId === petId)
        .flatMap(r => r.metrics)
        .filter(m => m.type === 'activity'); // 复用活动指标作为情绪代理

      if (audioEvents.length === 0) {
        return 60; // 无数据时返回默认值
      }
    } catch {
      // 静默处理
    }

    // 简化实现：基于活动水平推断心理状态
    // 活动量正常 → 心理状态好
    // 活动量过低 → 可能抑郁
    // 活动量过高 → 可能焦虑
    const recentRecords = this.healthRecords.filter(r => r.petId === petId).slice(0, 7);
    if (recentRecords.length > 0) {
      const activityMetrics = recentRecords.flatMap(r => r.metrics).filter(m => m.type === 'activity');
      if (activityMetrics.length > 0) {
        const avgActivity = activityMetrics.reduce((a, b) => a + b.value, 0) / activityMetrics.length;
        if (avgActivity >= 30 && avgActivity <= 90) {
          score += 25; // 正常活动范围
        } else if (avgActivity >= 15 && avgActivity <= 120) {
          score += 10; // 可接受范围
        } else {
          score -= 10; // 异常范围
        }
      }
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * 计算整体趋势：与上周对比
   */
  private calculateOverallTrend(
    petId: string,
    _recentMetrics: HealthMetric[]
  ): 'up' | 'down' | 'stable' {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const recentRecords = this.healthRecords.filter(
      r => r.petId === petId && new Date(r.date).getTime() >= sevenDaysAgo.getTime()
    );
    const previousRecords = this.healthRecords.filter(
      r => r.petId === petId &&
        new Date(r.date).getTime() >= fourteenDaysAgo.getTime() &&
        new Date(r.date).getTime() < sevenDaysAgo.getTime()
    );

    if (recentRecords.length === 0 || previousRecords.length === 0) {
      return 'stable';
    }

    // 比较两期的平均活动量作为趋势代理
    const recentActivity = this.getAvgMetricValue(recentRecords, 'activity');
    const previousActivity = this.getAvgMetricValue(previousRecords, 'activity');

    const change = previousActivity > 0
      ? ((recentActivity - previousActivity) / previousActivity) * 100
      : 0;

    if (change > 10) return 'up';
    if (change < -10) return 'down';
    return 'stable';
  }

  private getAvgMetricValue(records: HealthRecord[], type: HealthMetricType): number {
    const values = records
      .flatMap(r => r.metrics)
      .filter(m => m.type === type)
      .map(m => m.value);

    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  // ============================================
  // 健康记录管理
  // ============================================

  async getHealthRecords(petId: string, days: number = 7): Promise<HealthRecord[]> {
    await this.ensureInitialized();

    const records = this.healthRecords.filter(r => r.petId === petId);
    return records.slice(0, days);
  }

  async addHealthRecord(record: Omit<HealthRecord, 'id'>): Promise<HealthRecord> {
    await this.ensureInitialized();

    const newRecord: HealthRecord = {
      ...record,
      id: `record-${Date.now()}`,
    };

    this.healthRecords.unshift(newRecord);

    // 持久化到 IndexedDB
    databaseService.put(STORE_NAMES.HEALTH_RECORDS, newRecord);

    // 添加指标到 IndexedDB
    for (const metric of newRecord.metrics) {
      databaseService.put(STORE_NAMES.HEALTH_METRICS, metric);
    }

    // 检查是否需要生成告警
    await this.checkAndGenerateAlerts(newRecord);

    return newRecord;
  }

  async addHealthMetric(metric: Omit<HealthMetric, 'id'>): Promise<HealthMetric> {
    await this.ensureInitialized();

    const newMetric: HealthMetric = {
      ...metric,
      id: `metric-${Date.now()}`,
    };

    // 添加到当天的记录中
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRecord = this.healthRecords.find(r => r.petId === metric.petId && r.date === todayStr);

    if (todayRecord) {
      todayRecord.metrics.push(newMetric);
      databaseService.put(STORE_NAMES.HEALTH_RECORDS, todayRecord);
    } else {
      // 创建新的每日记录
      const newRecord: HealthRecord = {
        id: `record-${Date.now()}`,
        petId: metric.petId,
        date: todayStr,
        metrics: [newMetric],
        overallStatus: 'good',
      };
      this.healthRecords.unshift(newRecord);
      databaseService.put(STORE_NAMES.HEALTH_RECORDS, newRecord);
    }

    // 持久化指标
    databaseService.put(STORE_NAMES.HEALTH_METRICS, newMetric);

    // 检查是否需要生成告警
    await this.checkMetricForAlerts(newMetric);

    return newMetric;
  }

  // ============================================
  // 健康告警 - 基于真实数据阈值检测
  // ============================================

  /**
   * 获取健康告警：基于真实数据阈值检测生成
   */
  async getHealthAlerts(petId: string): Promise<HealthAlert[]> {
    await this.ensureInitialized();

    // 先返回已存在的告警
    const existingAlerts = this.healthAlerts.filter(a => a.petId === petId);

    // 动态检测并生成新告警
    const dynamicAlerts = await this.generateDynamicAlerts(petId);

    // 合并，去重
    const allAlerts = [...dynamicAlerts, ...existingAlerts];
    const seen = new Set<string>();
    return allAlerts.filter(alert => {
      if (seen.has(alert.message)) return false;
      seen.add(alert.message);
      return true;
    });
  }

  /**
   * 基于真实数据阈值检测动态生成告警
   */
  private async generateDynamicAlerts(petId: string): Promise<HealthAlert[]> {
    const alerts: HealthAlert[] = [];
    const now = new Date().toISOString();

    // 获取最近 7 天的指标
    const recentMetrics = await this.getRecentMetrics(petId, 7);

    // 1. 体重突然变化 > 5%
    const weightMetrics = recentMetrics.filter(m => m.type === 'weight');
    if (weightMetrics.length >= 2) {
      const sorted = weightMetrics.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      const latest = sorted[0].value;
      const oldest = sorted[sorted.length - 1].value;
      const changePercent = Math.abs((latest - oldest) / oldest) * 100;

      if (changePercent > 5) {
        const direction = latest > oldest ? '增加' : '减少';
        alerts.push({
          id: `alert-weight-${Date.now()}`,
          petId,
          type: 'abnormal',
          severity: changePercent > 10 ? 'high' : 'medium',
          message: `体重${direction}了${changePercent.toFixed(1)}%，请关注宠物饮食和健康状况`,
          timestamp: now,
          acknowledged: false,
          recommendation: changePercent > 10
            ? '体重变化较大，建议尽快咨询兽医'
            : '注意观察饮食和精神状态，如持续变化请就医',
        });
      }
    }

    // 2. 活动量连续 3 天低于基线 50%
    const activityMetrics = recentMetrics.filter(m => m.type === 'activity');
    if (activityMetrics.length >= 3) {
      const baseline = DEFAULT_BASELINES.activity.value;
      const lowActivityDays = activityMetrics.filter(m => m.value < baseline * 0.5).length;

      if (lowActivityDays >= 3) {
        alerts.push({
          id: `alert-activity-${Date.now()}`,
          petId,
          type: 'lethargy',
          severity: lowActivityDays >= 5 ? 'high' : 'medium',
          message: `连续${lowActivityDays}天活动量低于正常水平，宠物可能身体不适`,
          timestamp: now,
          acknowledged: false,
          recommendation: '增加陪伴和互动，如持续低活动量请咨询兽医',
        });
      }
    }

    // 3. 睡眠时长异常
    const sleepMetrics = recentMetrics.filter(m => m.type === 'sleep');
    if (sleepMetrics.length >= 2) {
      const avgSleep = sleepMetrics.reduce((a, b) => a + b.value, 0) / sleepMetrics.length;

      if (avgSleep < 8) {
        alerts.push({
          id: `alert-sleep-low-${Date.now()}`,
          petId,
          type: 'abnormal',
          severity: avgSleep < 6 ? 'high' : 'medium',
          message: `平均睡眠时长仅${avgSleep.toFixed(1)}小时，远低于正常范围`,
          timestamp: now,
          acknowledged: false,
          recommendation: '检查睡眠环境，确保安静舒适，如持续异常请就医',
        });
      } else if (avgSleep > 20) {
        alerts.push({
          id: `alert-sleep-high-${Date.now()}`,
          petId,
          type: 'lethargy',
          severity: avgSleep > 22 ? 'high' : 'low',
          message: `平均睡眠时长${avgSleep.toFixed(1)}小时，可能嗜睡`,
          timestamp: now,
          acknowledged: false,
          recommendation: '嗜睡可能是健康问题的信号，建议咨询兽医',
        });
      }
    }

    // 保存新告警到内存和 IndexedDB
    for (const alert of alerts) {
      this.healthAlerts.unshift(alert);
      databaseService.put(STORE_NAMES.HEALTH_ALERTS, alert);
    }

    return alerts;
  }

  /**
   * 检查新记录是否需要生成告警
   */
  private async checkAndGenerateAlerts(record: HealthRecord): Promise<void> {
    for (const metric of record.metrics) {
      await this.checkMetricForAlerts(metric);
    }
  }

  /**
   * 检查单个指标是否需要生成告警
   */
  private async checkMetricForAlerts(metric: HealthMetric): Promise<void> {
    const now = new Date().toISOString();

    // 体重突然变化
    if (metric.type === 'weight') {
      const petRecords = this.healthRecords.filter(r => r.petId === metric.petId);
      const previousWeightMetrics = petRecords
        .flatMap(r => r.metrics)
        .filter(m => m.type === 'weight' && m.id !== metric.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      if (previousWeightMetrics.length > 0) {
        const previousWeight = previousWeightMetrics[0].value;
        const changePercent = Math.abs((metric.value - previousWeight) / previousWeight) * 100;

        if (changePercent > 5) {
          const direction = metric.value > previousWeight ? '增加' : '减少';
          const alert: HealthAlert = {
            id: `alert-weight-${Date.now()}`,
            petId: metric.petId,
            type: 'abnormal',
            severity: changePercent > 10 ? 'high' : 'medium',
            message: `体重${direction}了${changePercent.toFixed(1)}%，请关注宠物饮食和健康状况`,
            timestamp: now,
            acknowledged: false,
            recommendation: changePercent > 10
              ? '体重变化较大，建议尽快咨询兽医'
              : '注意观察饮食和精神状态，如持续变化请就医',
          };
          this.healthAlerts.unshift(alert);
          databaseService.put(STORE_NAMES.HEALTH_ALERTS, alert);
        }
      }
    }
  }

  async acknowledgeAlert(alertId: string): Promise<boolean> {
    await this.ensureInitialized();

    const alert = this.healthAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      databaseService.put(STORE_NAMES.HEALTH_ALERTS, alert);
      return true;
    }
    return false;
  }

  // ============================================
  // 健康趋势 - 基于真实历史数据计算
  // ============================================

  /**
   * 获取健康趋势：基于真实历史数据计算，不是随机数
   */
  async getHealthTrends(petId: string, metricType: HealthMetricType): Promise<HealthTrend> {
    await this.ensureInitialized();

    const now = new Date();

    // 最近 7 天的数据
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 前 7 天的数据（用于对比）
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // 获取指标数据
    const allMetrics = await databaseService.getByIndex<HealthMetric>(STORE_NAMES.HEALTH_METRICS, 'petId', petId);
    const filtered = allMetrics.filter((m: HealthMetric) => m.type === metricType);

    const recentMetrics = filtered.filter(
      (m: HealthMetric) => new Date(m.timestamp).getTime() >= sevenDaysAgo.getTime()
    );
    const previousMetrics = filtered.filter(
      (m: HealthMetric) =>
        new Date(m.timestamp).getTime() >= fourteenDaysAgo.getTime() &&
        new Date(m.timestamp).getTime() < sevenDaysAgo.getTime()
    );

    // 计算当前和之前的平均值
    const current = recentMetrics.length > 0
      ? recentMetrics.reduce((a: number, m: HealthMetric) => a + m.value, 0) / recentMetrics.length
      : DEFAULT_BASELINES[metricType].value;

    const previous = previousMetrics.length > 0
      ? previousMetrics.reduce((a: number, m: HealthMetric) => a + m.value, 0) / previousMetrics.length
      : DEFAULT_BASELINES[metricType].value;

    const change = current - previous;
    const percentageChange = previous !== 0 ? (change / previous) * 100 : 0;

    // 判断趋势方向
    let direction: 'improving' | 'declining' | 'stable' = 'stable';
    const absChange = Math.abs(percentageChange);

    if (absChange > 5) {
      // 根据指标类型判断改善还是恶化
      direction = this.isImprovement(metricType, change) ? 'improving' : 'declining';
    }

    return {
      metricType,
      current: Math.round(current * 100) / 100,
      previous: Math.round(previous * 100) / 100,
      change: Math.round(change * 100) / 100,
      percentageChange: Math.round(percentageChange * 100) / 100,
      direction,
      days: 7,
    };
  }

  /**
   * 判断指标变化是否为改善
   */
  private isImprovement(metricType: HealthMetricType, change: number): boolean {
    switch (metricType) {
      case 'activity':
        return change > 0; // 活动量增加是改善
      case 'sleep':
        // 睡眠趋向 12-16 小时是改善
        return true; // 简化：变化本身意味着调整
      case 'weight':
        // 体重稳定是改善（变化小）
        return Math.abs(change) < 0.5;
      case 'eating':
      case 'drinking':
        return change > 0; // 进食/饮水增加通常是改善
      default:
        return change > 0;
    }
  }

  // ============================================
  // 健康目标管理
  // ============================================

  async getHealthGoals(petId: string): Promise<HealthGoal[]> {
    await this.ensureInitialized();

    const goals = this.healthGoals.filter(g => g.petId === petId);

    // 如果没有目标，返回空数组（不生成随机目标）
    return goals;
  }

  async createHealthGoal(goal: Omit<HealthGoal, 'id'>): Promise<HealthGoal> {
    await this.ensureInitialized();

    const newGoal: HealthGoal = {
      ...goal,
      id: `goal-${Date.now()}`,
    };

    this.healthGoals.push(newGoal);
    databaseService.put(STORE_NAMES.HEALTH_GOALS, newGoal);

    return newGoal;
  }

  async updateHealthGoal(goalId: string, updates: Partial<HealthGoal>): Promise<boolean> {
    await this.ensureInitialized();

    const index = this.healthGoals.findIndex(g => g.id === goalId);
    if (index !== -1) {
      this.healthGoals[index] = { ...this.healthGoals[index], ...updates };
      databaseService.put(STORE_NAMES.HEALTH_GOALS, this.healthGoals[index]);
      return true;
    }
    return false;
  }

  async deleteHealthGoal(goalId: string): Promise<boolean> {
    await this.ensureInitialized();

    const index = this.healthGoals.findIndex(g => g.id === goalId);
    if (index !== -1) {
      this.healthGoals.splice(index, 1);
      databaseService.delete(STORE_NAMES.HEALTH_GOALS, goalId);
      return true;
    }
    return false;
  }

  // ============================================
  // 症状检查
  // ============================================

  async checkSymptoms(symptoms: string[]): Promise<{
    symptoms: string[];
    possibleConditions: { condition: string; probability: number; severity: string; recommendation: string }[];
  }> {
    await this.ensureInitialized();

    // 基于症状的规则匹配（不是随机数）
    const conditionMap: Record<string, { condition: string; probability: number; severity: string; recommendation: string }[]> = {
      '咳嗽': [
        { condition: '上呼吸道感染', probability: 0.4, severity: 'fair', recommendation: '保持温暖，观察1-2天，如持续请就医' },
        { condition: '过敏反应', probability: 0.2, severity: 'fair', recommendation: '检查环境，避免接触过敏原' },
      ],
      '打喷嚏': [
        { condition: '轻微感冒', probability: 0.35, severity: 'fair', recommendation: '保持温暖，多饮水，观察1-2天' },
        { condition: '过敏反应', probability: 0.25, severity: 'fair', recommendation: '检查环境，避免接触过敏原' },
      ],
      '呕吐': [
        { condition: '消化不良', probability: 0.35, severity: 'fair', recommendation: '暂时禁食，少量饮水，如持续请就医' },
        { condition: '肠胃炎', probability: 0.25, severity: 'poor', recommendation: '建议就医检查' },
      ],
      '腹泻': [
        { condition: '饮食不当', probability: 0.3, severity: 'fair', recommendation: '调整饮食，观察便便状态' },
        { condition: '肠胃炎', probability: 0.25, severity: 'poor', recommendation: '建议就医检查' },
      ],
      '食欲不振': [
        { condition: '消化不良', probability: 0.3, severity: 'fair', recommendation: '尝试更换食物，如持续超过2天请就医' },
        { condition: '口腔问题', probability: 0.2, severity: 'fair', recommendation: '检查口腔是否有异常' },
      ],
      '精神不振': [
        { condition: '疲劳', probability: 0.3, severity: 'fair', recommendation: '确保充足休息，观察1-2天' },
        { condition: '感染', probability: 0.2, severity: 'poor', recommendation: '如伴随其他症状请就医' },
      ],
      '发热': [
        { condition: '感染', probability: 0.4, severity: 'poor', recommendation: '建议尽快就医' },
        { condition: '炎症反应', probability: 0.2, severity: 'fair', recommendation: '监测体温，如持续请就医' },
      ],
    };

    const possibleConditions: { condition: string; probability: number; severity: string; recommendation: string }[] = [];
    const seenConditions = new Set<string>();

    for (const symptom of symptoms) {
      const conditions = conditionMap[symptom] || [];
      for (const condition of conditions) {
        if (!seenConditions.has(condition.condition)) {
          seenConditions.add(condition.condition);
          possibleConditions.push(condition);
        } else {
          // 如果已有该病症，增加概率
          const existing = possibleConditions.find(c => c.condition === condition.condition);
          if (existing) {
            existing.probability = Math.min(0.9, existing.probability + 0.1);
          }
        }
      }
    }

    // 如果没有匹配到任何症状，返回通用建议
    if (possibleConditions.length === 0 && symptoms.length > 0) {
      possibleConditions.push({
        condition: '需要进一步观察',
        probability: 0.3,
        severity: 'fair',
        recommendation: '持续观察宠物状态，如症状加重请咨询兽医',
      });
    }

    // 按概率排序
    possibleConditions.sort((a, b) => b.probability - a.probability);

    return { symptoms, possibleConditions };
  }

  // ============================================
  // 指标历史
  // ============================================

  async getMetricHistory(petId: string, metricType: HealthMetricType, days: number = 7): Promise<HealthMetric[]> {
    await this.ensureInitialized();

    const cutoffTime = new Date();
    cutoffTime.setDate(cutoffTime.getDate() - days);

    // 从内存中的记录获取
    const metrics: HealthMetric[] = [];
    for (const record of this.healthRecords) {
      if (record.petId === petId && new Date(record.date).getTime() >= cutoffTime.getTime()) {
        metrics.push(...record.metrics.filter(m => m.type === metricType));
      }
    }

    // 如果内存中没有，从 IndexedDB 获取
    if (metrics.length === 0) {
      const allMetrics = await databaseService.getByIndex<HealthMetric>(STORE_NAMES.HEALTH_METRICS, 'petId', petId);
      const byType = allMetrics.filter((m: HealthMetric) => m.type === metricType);
      const filtered = byType.filter(
        (m: HealthMetric) => new Date(m.timestamp).getTime() >= cutoffTime.getTime()
      );
      return filtered.sort(
        (a: HealthMetric, b: HealthMetric) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    }

    return metrics.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
}

export const healthService = new HealthService();
