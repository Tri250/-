// ============================================
// PawSync Pro - feedback.ts
//
// 作者: 带娃的小陈工
// 日期: 2026-06-09
// 描述: 用户反馈闭环系统类型定义
// ============================================

import type { PrimaryEmotion } from './emotion';

// 重新导出 PrimaryEmotion 以便其他模块使用
export type { PrimaryEmotion } from './emotion';

/**
 * 反馈类型枚举
 * - accurate: 分析准确
 * - inaccurate: 分析不准确
 * - alternative: 换一种解释方式
 */
export type FeedbackRating = 'accurate' | 'inaccurate' | 'alternative';

/**
 * 反馈状态
 */
export type FeedbackStatus = 'pending' | 'processed' | 'applied' | 'dismissed';

/**
 * 反馈数据结构
 */
export interface Feedback {
  id: string;
  analysisId: string;
  petId: string;
  userId?: string;
  rating: FeedbackRating;
  correctedEmotion?: PrimaryEmotion;
  comment?: string;
  originalEmotion: PrimaryEmotion;
  originalConfidence: number;
  originalTranslation: string;
  status: FeedbackStatus;
  createdAt: string;
  updatedAt?: string;
  processedAt?: string;
  appliedToModel?: boolean;
}

/**
 * 提交反馈请求参数
 */
export interface SubmitFeedbackRequest {
  analysisId: string;
  rating: FeedbackRating;
  correctedEmotion?: PrimaryEmotion;
  comment?: string;
}

/**
 * 反馈历史查询参数
 */
export interface FeedbackHistoryQuery {
  petId?: string;
  rating?: FeedbackRating;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * 反馈趋势分析结果
 */
export interface FeedbackTrendAnalysis {
  totalFeedback: number;
  accurateCount: number;
  inaccurateCount: number;
  alternativeCount: number;
  accuracyRate: number;
  emotionCorrections: Record<PrimaryEmotion, {
    count: number;
    correctedTo: Record<PrimaryEmotion, number>;
  }>;
  commonIssues: string[];
  improvementSuggestions: string[];
  period: {
    startDate: string;
    endDate: string;
  };
}

/**
 * 反馈统计摘要
 */
export interface FeedbackSummary {
  total: number;
  accurate: number;
  inaccurate: number;
  alternative: number;
  accuracyRate: number;
  recentFeedback: Feedback[];
  topCorrectedEmotions: Array<{
    emotion: PrimaryEmotion;
    correctionCount: number;
    mostCorrectedTo: PrimaryEmotion;
  }>;
}

/**
 * 反馈配置常量
 */
export const FEEDBACK_CONFIGS: Record<FeedbackRating, {
  emoji: string;
  label: string;
  description: string;
  color: string;
  bgColor: string;
}> = {
  accurate: {
    emoji: '👍',
    label: '很准',
    description: '分析结果准确，符合宠物实际状态',
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100',
  },
  inaccurate: {
    emoji: '👎',
    label: '不太对',
    description: '分析结果不准确，需要修正',
    color: 'text-red-600',
    bgColor: 'bg-red-50 hover:bg-red-100',
  },
  alternative: {
    emoji: '🔄',
    label: '换一种',
    description: '想要不同的解释方式或角度',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
  },
};

/**
 * 反馈类型标签映射
 */
export const FEEDBACK_LABELS: Record<FeedbackRating, string> = {
  accurate: '准确',
  inaccurate: '不准确',
  alternative: '换一种',
};

/**
 * 情绪修正建议
 */
export interface EmotionCorrectionSuggestion {
  from: PrimaryEmotion;
  to: PrimaryEmotion;
  reason: string;
  frequency: number;
  confidence: number;
}

/**
 * 反馈影响分析
 */
export interface FeedbackImpact {
  feedbackId: string;
  appliedDate: string;
  affectedEmotion: PrimaryEmotion;
  confidenceAdjustment: number;
  weightChange: number;
  beforeAccuracy: number;
  afterAccuracy: number;
}