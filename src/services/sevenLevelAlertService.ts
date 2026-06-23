import { databaseService, STORE_NAMES } from './databaseService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.pawsync.com/v1';

// ─── 七级预警类型定义 ────────────────────────────────────────

export type AlertLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  level: AlertLevel;
  category: 'health' | 'emotion' | 'behavior' | 'environment' | 'nutrition';
  conditions: AlertCondition[];
  cooldownMinutes: number;
  enabled: boolean;
}

export interface AlertCondition {
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=' | 'between' | 'contains';
  value: number | string | [number, number];
  weight: number;
}

export interface AlertRecord {
  id: string;
  petId: string;
  ruleId: string;
  level: AlertLevel;
  category: string;
  title: string;
  description: string;
  data: Record<string, unknown>;
  actionRequired: boolean;
  actionTaken: boolean;
  actionDescription?: string;
  escalatedFrom?: number;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

export interface HealthDataInput {
  petId: string;
  timestamp: string;
  vitals?: {
    heartRate?: number;
    respiratoryRate?: number;
    temperature?: number;
    weight?: number;
    bloodPressure?: { systolic: number; diastolic: number };
    oxygenSaturation?: number;
  };
  behavior?: {
    activityLevel?: number;
    appetite?: number;
    waterIntake?: number;
    sleepDuration?: number;
    vocalization?: number;
    socialInteraction?: number;
    grooming?: number;
  };
  emotion?: {
    stress?: number;
    anxiety?: number;
    happiness?: number;
    fear?: number;
    aggression?: number;
  };
  symptoms?: string[];
  environment?: {
    temperature?: number;
    humidity?: number;
    noise?: number;
  };
}

// ─── 预警级别配置 ────────────────────────────────────────────

const ALERT_LEVEL_CONFIG: Record<AlertLevel, {
  name: string;
  color: string;
  icon: string;
  description: string;
  responseTime: string;
  autoNotify: boolean;
}> = {
  1: { name: '信息', color: '#4CAF50', icon: 'ℹ️', description: '常规信息通知', responseTime: '无需立即响应', autoNotify: false },
  2: { name: '提示', color: '#8BC34A', icon: '💡', description: '轻微变化提示', responseTime: '24小时内关注', autoNotify: false },
  3: { name: '注意', color: '#FFC107', icon: '⚠️', description: '需要关注的变化', responseTime: '12小时内关注', autoNotify: false },
  4: { name: '警告', color: '#FF9800', icon: '🔶', description: '明显异常需处理', responseTime: '6小时内处理', autoNotify: true },
  5: { name: '严重', color: '#FF5722', icon: '🔴', description: '严重异常需紧急处理', responseTime: '2小时内处理', autoNotify: true },
  6: { name: '危急', color: '#D32F2F', icon: '🚨', description: '危急状态需立即处理', responseTime: '30分钟内处理', autoNotify: true },
  7: { name: '紧急', color: '#B71C1C', icon: '🆘', description: '生命威胁需紧急救治', responseTime: '立即处理', autoNotify: true },
};

// ─── 默认预警规则 ────────────────────────────────────────────

const DEFAULT_RULES: AlertRule[] = [
  // Level 1 - 信息
  { id: 'info_weight_change', name: '体重轻微变化', description: '体重变化在5%以内', level: 1, category: 'health', conditions: [{ metric: 'vitals.weight', operator: 'between', value: [-5, 5], weight: 1 }], cooldownMinutes: 1440, enabled: true },
  { id: 'info_appetite_slight', name: '食欲轻微变化', description: '食欲评分轻微下降', level: 1, category: 'nutrition', conditions: [{ metric: 'behavior.appetite', operator: 'between', value: [50, 70], weight: 1 }], cooldownMinutes: 720, enabled: true },

  // Level 2 - 提示
  { id: 'hint_low_activity', name: '活动量偏低', description: '活动量低于正常范围', level: 2, category: 'behavior', conditions: [{ metric: 'behavior.activityLevel', operator: '<', value: 40, weight: 1 }], cooldownMinutes: 360, enabled: true },
  { id: 'hint_water_change', name: '饮水量变化', description: '饮水量明显增减', level: 2, category: 'nutrition', conditions: [{ metric: 'behavior.waterIntake', operator: '<', value: 30 }, { metric: 'behavior.waterIntake', operator: '>', value: 90, weight: 1 }], cooldownMinutes: 360, enabled: true },

  // Level 3 - 注意
  { id: 'notice_elevated_hr', name: '心率偏高', description: '心率超出正常范围', level: 3, category: 'health', conditions: [{ metric: 'vitals.heartRate', operator: '>', value: 160, weight: 1 }], cooldownMinutes: 120, enabled: true },
  { id: 'notice_low_appetite', name: '食欲明显下降', description: '食欲评分低于50', level: 3, category: 'nutrition', conditions: [{ metric: 'behavior.appetite', operator: '<', value: 50, weight: 1 }], cooldownMinutes: 120, enabled: true },
  { id: 'notice_stress', name: '压力水平偏高', description: '压力评分持续偏高', level: 3, category: 'emotion', conditions: [{ metric: 'emotion.stress', operator: '>', value: 70, weight: 1 }], cooldownMinutes: 180, enabled: true },

  // Level 4 - 警告
  { id: 'warning_high_temp', name: '体温偏高', description: '体温超过39.5°C', level: 4, category: 'health', conditions: [{ metric: 'vitals.temperature', operator: '>', value: 39.5, weight: 1 }], cooldownMinutes: 60, enabled: true },
  { id: 'warning_low_temp', name: '体温偏低', description: '体温低于37°C', level: 4, category: 'health', conditions: [{ metric: 'vitals.temperature', operator: '<', value: 37, weight: 1 }], cooldownMinutes: 60, enabled: true },
  { id: 'warning_high_resp', name: '呼吸频率偏高', description: '呼吸频率超过40次/分', level: 4, category: 'health', conditions: [{ metric: 'vitals.respiratoryRate', operator: '>', value: 40, weight: 1 }], cooldownMinutes: 60, enabled: true },
  { id: 'warning_anxiety', name: '焦虑水平偏高', description: '焦虑评分超过70', level: 4, category: 'emotion', conditions: [{ metric: 'emotion.anxiety', operator: '>', value: 70, weight: 1 }], cooldownMinutes: 60, enabled: true },

  // Level 5 - 严重
  { id: 'severe_very_high_temp', name: '高烧', description: '体温超过40.5°C', level: 5, category: 'health', conditions: [{ metric: 'vitals.temperature', operator: '>', value: 40.5, weight: 1 }], cooldownMinutes: 30, enabled: true },
  { id: 'severe_very_high_hr', name: '心率严重偏高', description: '心率超过200', level: 5, category: 'health', conditions: [{ metric: 'vitals.heartRate', operator: '>', value: 200, weight: 1 }], cooldownMinutes: 30, enabled: true },
  { id: 'severe_symptoms', name: '严重症状', description: '出现呕吐、腹泻等严重症状', level: 5, category: 'health', conditions: [{ metric: 'symptoms', operator: 'contains', value: 'vomiting', weight: 0.5 }, { metric: 'symptoms', operator: 'contains', value: 'diarrhea', weight: 0.5 }], cooldownMinutes: 30, enabled: true },
  { id: 'severe_aggression', name: '攻击性增强', description: '攻击性评分超过80', level: 5, category: 'behavior', conditions: [{ metric: 'emotion.aggression', operator: '>', value: 80, weight: 1 }], cooldownMinutes: 30, enabled: true },

  // Level 6 - 危急
  { id: 'critical_breathing', name: '呼吸困难', description: '呼吸频率超过60次/分或血氧低于90%', level: 6, category: 'health', conditions: [{ metric: 'vitals.respiratoryRate', operator: '>', value: 60, weight: 0.6 }, { metric: 'vitals.oxygenSaturation', operator: '<', value: 90, weight: 0.4 }], cooldownMinutes: 15, enabled: true },
  { id: 'critical_bp', name: '血压异常', description: '血压严重异常', level: 6, category: 'health', conditions: [{ metric: 'vitals.bloodPressure.systolic', operator: '>', value: 180, weight: 0.5 }, { metric: 'vitals.bloodPressure.systolic', operator: '<', value: 80, weight: 0.5 }], cooldownMinutes: 15, enabled: true },

  // Level 7 - 紧急
  { id: 'emergency_cardiac', name: '心脏骤停风险', description: '心率超过250或低于40', level: 7, category: 'health', conditions: [{ metric: 'vitals.heartRate', operator: '>', value: 250, weight: 0.5 }, { metric: 'vitals.heartRate', operator: '<', value: 40, weight: 0.5 }], cooldownMinutes: 5, enabled: true },
  { id: 'emergency_oxygen', name: '严重缺氧', description: '血氧饱和度低于80%', level: 7, category: 'health', conditions: [{ metric: 'vitals.oxygenSaturation', operator: '<', value: 80, weight: 1 }], cooldownMinutes: 5, enabled: true },
  { id: 'emergency_temp', name: '致命体温', description: '体温超过42°C或低于35°C', level: 7, category: 'health', conditions: [{ metric: 'vitals.temperature', operator: '>', value: 42, weight: 0.5 }, { metric: 'vitals.temperature', operator: '<', value: 35, weight: 0.5 }], cooldownMinutes: 5, enabled: true },
];

export class SevenLevelAlertService {
  private rules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, AlertRecord> = new Map();
  private alertHistory: AlertRecord[] = [];
  private escalationTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private lastTriggerTime: Map<string, number> = new Map();

  constructor() {
    // 加载默认规则
    for (const rule of DEFAULT_RULES) {
      this.rules.set(rule.id, rule);
    }
  }

  // ─── 规则管理 ──────────────────────────────────────────────

  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  getRule(ruleId: string): AlertRule | undefined {
    return this.rules.get(ruleId);
  }

  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
  }

  updateRule(ruleId: string, updates: Partial<AlertRule>): void {
    const existing = this.rules.get(ruleId);
    if (existing) {
      this.rules.set(ruleId, { ...existing, ...updates });
    }
  }

  deleteRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  getLevelConfig(level: AlertLevel) {
    return ALERT_LEVEL_CONFIG[level];
  }

  // ─── 核心评估引擎 ─────────────────────────────────────────

  evaluateHealthData(data: HealthDataInput): AlertRecord[] {
    const triggeredAlerts: AlertRecord[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      // 冷却期检查
      const lastTrigger = this.lastTriggerTime.get(rule.id) || 0;
      if (Date.now() - lastTrigger < rule.cooldownMinutes * 60 * 1000) continue;

      // 评估条件
      const matchResult = this.evaluateConditions(rule.conditions, data);
      if (matchResult.matched) {
        const alert = this.createAlert(data.petId, rule, matchResult.matchedConditions, data);
        triggeredAlerts.push(alert);
        this.lastTriggerTime.set(rule.id, Date.now());
      }
    }

    // 综合评估：多个低级预警可能升级
    const escalatedAlerts = this.checkEscalation(data.petId, triggeredAlerts);
    triggeredAlerts.push(...escalatedAlerts);

    // 持久化所有预警
    for (const alert of triggeredAlerts) {
      this.activeAlerts.set(alert.id, alert);
      this.alertHistory.push(alert);
      this.persistAlert(alert);
    }

    // 高级别自动推送通知
    for (const alert of triggeredAlerts) {
      if (ALERT_LEVEL_CONFIG[alert.level].autoNotify) {
        this.sendNotification(alert);
      }
    }

    return triggeredAlerts;
  }

  private evaluateConditions(
    conditions: AlertCondition[],
    data: HealthDataInput,
  ): { matched: boolean; matchedConditions: string[]; totalWeight: number } {
    const matchedConditions: string[] = [];
    let totalWeight = 0;
    let matchedWeight = 0;

    for (const condition of conditions) {
      totalWeight += condition.weight;
      const value = this.getNestedValue(data, condition.metric);

      if (value !== undefined && value !== null) {
        const isMatch = this.evaluateCondition(condition, value);
        if (isMatch) {
          matchedConditions.push(condition.metric);
          matchedWeight += condition.weight;
        }
      }
    }

    // 如果所有条件都匹配（权重100%），或者部分条件匹配且权重超过50%
    return {
      matched: totalWeight > 0 && matchedWeight / totalWeight >= 0.5,
      matchedConditions,
      totalWeight: matchedWeight,
    };
  }

  private evaluateCondition(condition: AlertCondition, value: unknown): boolean {
    const numValue = typeof value === 'number' ? value : parseFloat(String(value));

    switch (condition.operator) {
      case '>': return !isNaN(numValue) && numValue > (condition.value as number);
      case '<': return !isNaN(numValue) && numValue < (condition.value as number);
      case '>=': return !isNaN(numValue) && numValue >= (condition.value as number);
      case '<=': return !isNaN(numValue) && numValue <= (condition.value as number);
      case '==': return value === condition.value;
      case '!=': return value !== condition.value;
      case 'between': {
        const [min, max] = condition.value as [number, number];
        return !isNaN(numValue) && numValue >= min && numValue <= max;
      }
      case 'contains': {
        const arr = value as string | string[];
        const target = String(condition.value);
        if (Array.isArray(arr)) return arr.includes(target);
        return String(arr).includes(target);
      }
      default: return false;
    }
  }

  private getNestedValue(obj: unknown, path: string): unknown {
    const keys = path.split('.');
    let current: unknown = obj;
    for (const key of keys) {
      if (current === null || current === undefined) return undefined;
      current = (current as Record<string, unknown>)[key];
    }
    return current;
  }

  // ─── 预警创建 ──────────────────────────────────────────────

  private createAlert(
    petId: string,
    rule: AlertRule,
    matchedConditions: string[],
    data: HealthDataInput,
  ): AlertRecord {
    const levelConfig = ALERT_LEVEL_CONFIG[rule.level];
    return {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      petId,
      ruleId: rule.id,
      level: rule.level,
      category: rule.category,
      title: `${levelConfig.icon} [Level ${rule.level}] ${rule.name}`,
      description: `${rule.description}\n触发条件：${matchedConditions.join('、')}\n建议响应时间：${levelConfig.responseTime}`,
      data: data as unknown as Record<string, unknown>,
      actionRequired: rule.level >= 4,
      actionTaken: false,
      createdAt: new Date().toISOString(),
    };
  }

  // ─── 升级机制 ──────────────────────────────────────────────

  private checkEscalation(petId: string, newAlerts: AlertRecord[]): AlertRecord[] {
    const escalatedAlerts: AlertRecord[] = [];

    // 获取该宠物当前活跃的预警
    const activeForPet = Array.from(this.activeAlerts.values())
      .filter(a => a.petId === petId && !a.resolvedAt);

    // 统计各级别数量
    const levelCounts: Partial<Record<AlertLevel, number>> = {};
    for (const alert of [...activeForPet, ...newAlerts]) {
      levelCounts[alert.level] = (levelCounts[alert.level] || 0) + 1;
    }

    // 规则：3个Level 3 = 升级到 Level 4
    if ((levelCounts[3] || 0) >= 3 && !activeForPet.some(a => a.level >= 4)) {
      escalatedAlerts.push(this.createEscalatedAlert(petId, 4, '多个注意级别预警同时触发，自动升级为警告'));
    }

    // 规则：2个Level 4 = 升级到 Level 5
    if ((levelCounts[4] || 0) >= 2 && !activeForPet.some(a => a.level >= 5)) {
      escalatedAlerts.push(this.createEscalatedAlert(petId, 5, '多个警告级别预警同时触发，自动升级为严重'));
    }

    // 规则：2个Level 5 = 升级到 Level 6
    if ((levelCounts[5] || 0) >= 2 && !activeForPet.some(a => a.level >= 6)) {
      escalatedAlerts.push(this.createEscalatedAlert(petId, 6, '多个严重级别预警同时触发，自动升级为危急'));
    }

    // 规则：持续异常超过30分钟自动升级一级
    const thirtyMinAgo = Date.now() - 30 * 60 * 1000;
    for (const alert of activeForPet) {
      if (alert.level < 7 && new Date(alert.createdAt).getTime() < thirtyMinAgo && !alert.escalatedFrom) {
        const newLevel = Math.min(alert.level + 1, 7) as AlertLevel;
        escalatedAlerts.push(this.createEscalatedAlert(petId, newLevel, `预警持续30分钟未处理，从Level ${alert.level}自动升级到Level ${newLevel}`));
      }
    }

    return escalatedAlerts;
  }

  private createEscalatedAlert(petId: string, level: AlertLevel, reason: string): AlertRecord {
    const levelConfig = ALERT_LEVEL_CONFIG[level];
    return {
      id: `alert-esc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      petId,
      ruleId: 'escalation',
      level,
      category: 'health',
      title: `${levelConfig.icon} [Level ${level}] 自动升级预警`,
      description: `${reason}\n建议响应时间：${levelConfig.responseTime}`,
      data: { reason },
      actionRequired: level >= 4,
      actionTaken: false,
      escalatedFrom: level - 1,
      createdAt: new Date().toISOString(),
    };
  }

  // ─── 通知推送 ──────────────────────────────────────────────

  private async sendNotification(alert: AlertRecord): Promise<void> {
    try {
      // 使用 Capacitor Push Notification 或 Local Notification
      const { LocalNotifications } = await import('@capacitor/local-notifications');

      await LocalNotifications.schedule({
        notifications: [{
          title: alert.title,
          body: alert.description.substring(0, 200),
          id: Date.now(),
          schedule: { at: new Date(Date.now() + 1000) },
          sound: alert.level >= 6 ? 'alert_urgent.wav' : undefined,
          extra: { alertId: alert.id, level: alert.level },
        }],
      });
    } catch {
      // Capacitor 不可用时静默处理
      console.warn(`[SevenLevelAlert] Level ${alert.level} alert: ${alert.title}`);
    }
  }

  // ─── 预警操作 ──────────────────────────────────────────────

  async acknowledgeAlert(alertId: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.acknowledgedAt = new Date().toISOString();
      await this.persistAlert(alert);
    }
  }

  async resolveAlert(alertId: string, actionDescription?: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolvedAt = new Date().toISOString();
      alert.actionTaken = true;
      alert.actionDescription = actionDescription;
      this.activeAlerts.delete(alertId);

      // 清除升级定时器
      const timer = this.escalationTimers.get(alertId);
      if (timer) {
        clearTimeout(timer);
        this.escalationTimers.delete(alertId);
      }

      await this.persistAlert(alert);
    }
  }

  getActiveAlerts(petId?: string): AlertRecord[] {
    const alerts = Array.from(this.activeAlerts.values());
    if (petId) return alerts.filter(a => a.petId === petId);
    return alerts;
  }

  getAlertHistory(petId?: string, limit: number = 50): AlertRecord[] {
    let history = [...this.alertHistory];
    if (petId) history = history.filter(a => a.petId === petId);
    return history
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  // ─── 综合评估 ──────────────────────────────────────────────

  getOverallStatus(petId: string): {
    currentLevel: AlertLevel;
    activeAlertCount: number;
    highestActiveLevel: AlertLevel;
    recentTrend: 'improving' | 'stable' | 'worsening';
    summary: string;
  } {
    const activeAlerts = this.getActiveAlerts(petId);
    const highestActiveLevel = activeAlerts.reduce<AlertLevel>((max, a) => Math.max(max, a.level), 1 as AlertLevel);

    // 趋势分析：比较最近1小时和之前1小时的预警级别
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const twoHoursAgo = now - 2 * 60 * 60 * 1000;

    const recentAlerts = this.alertHistory.filter(a => new Date(a.createdAt).getTime() > oneHourAgo);
    const olderAlerts = this.alertHistory.filter(a => {
      const t = new Date(a.createdAt).getTime();
      return t > twoHoursAgo && t <= oneHourAgo;
    });

    const recentAvg = recentAlerts.length > 0 ? recentAlerts.reduce((s, a) => s + a.level, 0) / recentAlerts.length : 1;
    const olderAvg = olderAlerts.length > 0 ? olderAlerts.reduce((s, a) => s + a.level, 0) / olderAlerts.length : 1;

    let trend: 'improving' | 'stable' | 'worsening';
    if (recentAvg < olderAvg - 0.5) trend = 'improving';
    else if (recentAvg > olderAvg + 0.5) trend = 'worsening';
    else trend = 'stable';

    const levelConfig = ALERT_LEVEL_CONFIG[highestActiveLevel];
    let summary = `当前最高预警级别：Level ${highestActiveLevel}（${levelConfig.name}）`;
    if (activeAlerts.length > 0) {
      summary += `，共 ${activeAlerts.length} 条活跃预警`;
    }
    if (trend === 'worsening') summary += '，趋势恶化';
    else if (trend === 'improving') summary += '，趋势好转';

    return {
      currentLevel: highestActiveLevel,
      activeAlertCount: activeAlerts.length,
      highestActiveLevel,
      recentTrend: trend,
      summary,
    };
  }

  // ─── 持久化 ────────────────────────────────────────────────

  private async persistAlert(alert: AlertRecord): Promise<void> {
    try {
      await databaseService.put(STORE_NAMES.ALERT_RECORDS, alert);
    } catch {
      // 持久化失败不影响主流程
    }
  }

  async loadAlertHistory(petId: string): Promise<void> {
    try {
      const records = await databaseService.getByIndex<AlertRecord>(STORE_NAMES.ALERT_RECORDS, 'petId', petId);
      this.alertHistory = records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      // 加载失败使用空历史
    }
  }
}

export const sevenLevelAlertService = new SevenLevelAlertService();
