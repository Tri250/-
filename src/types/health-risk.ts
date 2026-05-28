// 健康风险评分相关类型

export interface HealthRiskFactor {
  type: 'weight' | 'vaccine' | 'symptom' | 'activity' | 'nutrition' | 'age' | 'checkup';
  name: string;
  weight: number; // 权重系数 0-1
  score: number; // 当前得分 0-100
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  description: string;
  recommendation: string;
}

export interface HealthTrendData {
  period: '7d' | '30d' | '90d';
  trend: 'improving' | 'stable' | 'declining';
  change: number; // 分数变化
  historicalScores: {
    date: string;
    score: number;
  }[];
}

export interface HealthRiskAssessment {
  petId: string;
  petName: string;
  overallScore: number; // 总评分 0-100
  overallStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  factors: HealthRiskFactor[];
  trend: HealthTrendData;
  alerts: string[];
  recommendations: string[];
  lastUpdated: string;
  nextCheckupDate?: string;
}

export interface RuleEngineConfig {
  [key: string]: {
    thresholds: {
      [key: string]: { min: number; max: number; status: HealthRiskFactor['status'] };
    };
    weight: number;
  };
}

export const WSAVA_BCS_STANDARD = {
  1: { name: '非常瘦', description: '肋骨明显可见，腰椎突出', risk: 'critical' },
  2: { name: '偏瘦', description: '肋骨轻易可见，腰部明显', risk: 'high' },
  3: { name: '较瘦', description: '肋骨可见，腰部易见', risk: 'moderate' },
  4: { name: '偏瘦', description: '肋骨可触摸，腰部明显', risk: 'low' },
  5: { name: '理想', description: '肋骨可触摸但不可见，腰部明显', risk: 'low' },
  6: { name: '偏胖', description: '肋骨难触摸，有脂肪覆盖', risk: 'moderate' },
  7: { name: '较胖', description: '肋骨不可触摸，脂肪堆积明显', risk: 'high' },
  8: { name: '肥胖', description: '大量脂肪堆积，腰部消失', risk: 'critical' },
  9: { name: '严重肥胖', description: '严重脂肪堆积，影响活动', risk: 'critical' },
};

export const RULE_ENGINE_CONFIG: RuleEngineConfig = {
  weight: {
    thresholds: {
      ideal: { min: 0.9, max: 1.1, status: 'excellent' },
      good: { min: 0.8, max: 1.2, status: 'good' },
      fair: { min: 0.7, max: 1.3, status: 'fair' },
      poor: { min: 0.6, max: 1.4, status: 'poor' },
      critical: { min: 0, max: 2, status: 'critical' },
    },
    weight: 0.25,
  },
  vaccine: {
    thresholds: {
      excellent: { min: 100, max: 100, status: 'excellent' },
      good: { min: 80, max: 99, status: 'good' },
      fair: { min: 60, max: 79, status: 'fair' },
      poor: { min: 40, max: 59, status: 'poor' },
      critical: { min: 0, max: 39, status: 'critical' },
    },
    weight: 0.2,
  },
  activity: {
    thresholds: {
      excellent: { min: 60, max: 1000, status: 'excellent' },
      good: { min: 45, max: 59, status: 'good' },
      fair: { min: 30, max: 44, status: 'fair' },
      poor: { min: 15, max: 29, status: 'poor' },
      critical: { min: 0, max: 14, status: 'critical' },
    },
    weight: 0.15,
  },
  nutrition: {
    thresholds: {
      excellent: { min: 90, max: 100, status: 'excellent' },
      good: { min: 75, max: 89, status: 'good' },
      fair: { min: 60, max: 74, status: 'fair' },
      poor: { min: 40, max: 59, status: 'poor' },
      critical: { min: 0, max: 39, status: 'critical' },
    },
    weight: 0.15,
  },
  symptom: {
    thresholds: {
      excellent: { min: 0, max: 0, status: 'excellent' },
      good: { min: 1, max: 2, status: 'good' },
      fair: { min: 3, max: 4, status: 'fair' },
      poor: { min: 5, max: 6, status: 'poor' },
      critical: { min: 7, max: 100, status: 'critical' },
    },
    weight: 0.2,
  },
  checkup: {
    thresholds: {
      excellent: { min: 0, max: 30, status: 'excellent' },
      good: { min: 31, max: 90, status: 'good' },
      fair: { min: 91, max: 180, status: 'fair' },
      poor: { min: 181, max: 365, status: 'poor' },
      critical: { min: 366, max: 10000, status: 'critical' },
    },
    weight: 0.05,
  },
};

export const getStatusForScore = (score: number): HealthRiskFactor['status'] => {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'fair';
  if (score >= 40) return 'poor';
  return 'critical';
};

export const getRiskLevel = (score: number): HealthRiskAssessment['riskLevel'] => {
  if (score >= 80) return 'low';
  if (score >= 65) return 'moderate';
  if (score >= 50) return 'high';
  return 'critical';
};

export const getStatusColor = (status: HealthRiskFactor['status']) => {
  switch (status) {
    case 'excellent': return '#10B981';
    case 'good': return '#3B82F6';
    case 'fair': return '#F59E0B';
    case 'poor': return '#EF4444';
    case 'critical': return '#DC2626';
    default: return '#6B7280';
  }
};
