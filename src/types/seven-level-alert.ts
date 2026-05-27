// ============================================
// PawSync Pro 3.0 - Seven Level Alert Types
//
// 作者: 带娃的小陈工
// 日期: 2026-05-27
// 描述: 7级健康预警体系类型定义
// ============================================

// 预警等级
export type AlertLevel = 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6';

// 严重程度
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

// 预警配置
export interface AlertConfig {
  level: AlertLevel;
  name: string;
  description: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  icon: string;
  response: string;
  notification: boolean;
}

// 预警事件
export interface AlertEvent {
  id: string;
  petId: string;
  level: AlertLevel;
  title: string;
  description: string;
  timestamp: string;
  severity: SeverityLevel;
  acknowledged: boolean;
  acknowledgedAt?: string;
  details: string;
  recommendation: string;
}

// 品种特异预警
export interface BreedSpecificAlert {
  breed: string;
  condition: string;
  description: string;
  riskLevel: AlertLevel;
  earlySigns: string[];
}

// 趋势预警
export interface TrendAlert {
  id: string;
  petId: string;
  level: AlertLevel;
  deviation: number;
  metrics: Array<{
    name: string;
    deviation: number;
    baseline: number;
    current: number;
  }>;
  timestamp: string;
  acknowledged: boolean;
  recommendation: string;
}

// 预警统计
export interface AlertStatistics {
  totalAlerts: number;
  unacknowledgedCount: number;
  levelDistribution: Record<AlertLevel, number>;
  weeklyTrend: Array<{
    date: string;
    count: number;
  }>;
}

// 预警通知配置
export interface AlertNotificationConfig {
  level: AlertLevel;
  enabled: boolean;
  pushNotification: boolean;
  emailNotification: boolean;
  smsNotification: boolean;
  phoneCall: boolean;
}