// ============================================
// PawSync Pro - AI健康预警系统类型定义
//
// 作者: 带娃的小陈工
// 日期: 2026-05-28
// 描述: 健康预警系统核心类型定义
// ============================================

// 宠物品种信息
export interface PetBreedInfo {
  type: 'cat' | 'dog' | 'other';
  name: string;
  // 品种特异性正常范围
  normalRanges: {
    weight: { min: number; max: number; unit: 'kg' };
    temperature: { min: number; max: number; unit: '℃' };
    heartRate: { min: number; max: number; unit: 'bpm' };
    respiration: { min: number; max: number; unit: 'bpm' };
  };
}

// 健康指标类型（扩展版）
export type HealthMetricType = 
  | 'weight'
  | 'temperature'
  | 'heartRate'
  | 'respiration'
  | 'sleep'
  | 'activity'
  | 'eating'
  | 'drinking'
  | 'vomit'
  | 'cough'
  | 'diarrhea'
  | 'energy'
  | 'appetite'
  | 'mood';

// 预警严重程度
export type AlertSeverity = 'low' | 'medium' | 'high' | 'emergency';

// 预警类型
export type AlertType = 
  | 'weight_abnormal'
  | 'temperature_abnormal'
  | 'heart_rate_abnormal'
  | 'respiration_abnormal'
  | 'vomit_abnormal'
  | 'cough_abnormal'
  | 'diarrhea_abnormal'
  | 'activity_low'
  | 'sleep_abnormal'
  | 'eating_abnormal'
  | 'drinking_abnormal'
  | 'infection_suspected'
  | 'pain_suspected'
  | 'general_concern';

// 健康指标记录
export interface HealthMetric {
  id: string;
  petId: string;
  type: HealthMetricType;
  value: number;
  unit: string;
  timestamp: string;
  notes?: string;
  source?: 'manual' | 'device' | 'prediction';
}

// 健康预警
export interface HealthWarning {
  id: string;
  petId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  metrics: HealthMetric[];
  analysis: {
    summary: string;
    possibleCauses: Array<{
      cause: string;
      probability: number;
      description: string;
    }>;
    recommendations: string[];
    actionRequired?: string;
  };
  timestamp: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  resolved: boolean;
  resolvedAt?: string;
  relatedRecords?: string[];
}

// 健康报告类型
export type ReportType = 'monthly' | 'weekly' | 'custom' | 'issue_specific';

// 健康报告
export interface HealthReport {
  id: string;
  petId: string;
  type: ReportType;
  title: string;
  period: {
    start: string;
    end: string;
  };
  content: {
    overview: {
      healthScore: number;
      status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
      summary: string;
    };
    metrics: Array<{
      type: HealthMetricType;
      name: string;
      current: number;
      average: number;
      trend: 'up' | 'down' | 'stable';
      status: 'normal' | 'warning' | 'abnormal';
    }>;
    charts: Array<{
      type: 'line' | 'bar' | 'pie';
      title: string;
      data: Array<{ date: string; value: number }>;
    }>;
    warnings: {
      total: number;
      active: number;
      resolved: number;
      bySeverity: {
        low: number;
        medium: number;
        high: number;
        emergency: number;
      };
    };
    healthEvents: Array<{
      date: string;
      type: string;
      description: string;
      severity?: AlertSeverity;
    }>;
    recommendations: string[];
    followUp?: string;
  };
  createdAt: string;
  format: 'pdf' | 'html' | 'json';
}

// 提醒类型
export type ReminderType = 
  | 'warning_active'
  | 'vaccination'
  | 'deworming'
  | 'checkup'
  | 'medication'
  | 'custom';

// 智能提醒
export interface SmartReminder {
  id: string;
  petId: string;
  type: ReminderType;
  title: string;
  message: string;
  relatedWarningId?: string;
  dueDate: string;
  repeatInterval?: {
    type: 'hour' | 'day' | 'week' | 'month';
    value: number;
  };
  repeatUntil?: string;
  snoozeUntil?: string;
  completed: boolean;
  completedAt?: string;
  notifications: Array<{
    time: string;
    channel: 'app' | 'email' | 'sms';
    sent: boolean;
  }>;
  createdAt: string;
}

// AI对话记录
export interface AIChatMessage {
  id: string;
  petId: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    healthDataReference?: string[];
    warningReference?: string[];
  };
}

// AI对话会话
export interface AIChatConversation {
  id: string;
  petId: string;
  title: string;
  messages: AIChatMessage[];
  createdAt: string;
  updatedAt: string;
}

// 健康趋势分析
export interface HealthTrendAnalysis {
  petId: string;
  period: { start: string; end: string };
  metrics: Array<{
    type: HealthMetricType;
    name: string;
    unit: string;
    current: number;
    average: number;
    minimum: number;
    maximum: number;
    trend: 'up' | 'down' | 'stable';
    prediction?: number;
    predictionDays?: number;
    predictionNote?: string;
  }>;
  summary: string;
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
    recommendations: string[];
  };
}

// 症状分析结果
export interface SymptomAnalysis {
  petId: string;
  symptoms: string[];
  analysis: {
    possibleConditions: Array<{
      condition: string;
      severity: AlertSeverity;
      probability: number;
      description: string;
      recommendations: string[];
      signsToWatch: string[];
      whenToSeeVet?: string;
    }>;
    overallAssessment: string;
    immediateActions: string[];
  };
  relatedWarnings?: string[];
  generatedAt: string;
}

// 宠物医院信息
export interface VeterinaryClinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
  isEmergency?: boolean;
  rating?: number;
}

// 预警筛选条件
export interface WarningFilter {
  petId?: string;
  severity?: AlertSeverity[];
  type?: AlertType[];
  status?: 'all' | 'active' | 'resolved' | 'acknowledged';
  dateRange?: { start: string; end: string };
}

// 提醒筛选条件
export interface ReminderFilter {
  petId?: string;
  type?: ReminderType[];
  status?: 'all' | 'pending' | 'completed' | 'snoozed';
  dateRange?: { start: string; end: string };
}

// 导出格式
export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json';
