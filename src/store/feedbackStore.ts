// ============================================
// PawSync Pro - feedbackStore.ts
//
// 作者: 带娃的小陈工
// 日期: 2026-06-09
// 描述: 反馈状态管理 Zustand Store
// ============================================

import { create } from 'zustand';
import type {
  Feedback,
  FeedbackRating,
  FeedbackTrendAnalysis,
  FeedbackSummary,
  PrimaryEmotion,
} from '../types/feedback';
import { feedbackService } from '../services/feedback/feedbackService';

/**
 * 反馈状态接口
 */
interface FeedbackState {
  // 状态数据
  feedbackHistory: Feedback[];
  currentFeedback: Feedback | null;
  trendAnalysis: FeedbackTrendAnalysis | null;
  summary: FeedbackSummary | null;

  // 操作状态
  isSubmitting: boolean;
  isLoading: boolean;
  isAnalyzing: boolean;
  error: string | null;

  // 当前展开的反馈面板
  expandedFeedbackId: string | null;

  // 操作方法
  submitFeedback: (
    analysisId: string,
    rating: FeedbackRating,
    correctedEmotion?: PrimaryEmotion,
    comment?: string
  ) => Promise<void>;
  loadFeedbackHistory: (petId?: string) => Promise<void>;
  analyzeTrends: () => Promise<void>;
  loadSummary: (petId?: string) => Promise<void>;
  clearError: () => void;
  setExpandedFeedback: (feedbackId: string | null) => void;
  syncPendingFeedbacks: () => Promise<{ synced: number; failed: number }>;
  clearLocalHistory: () => void;
}

/**
 * 反馈状态管理 Store
 */
export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  // 初始状态
  feedbackHistory: [],
  currentFeedback: null,
  trendAnalysis: null,
  summary: null,
  isSubmitting: false,
  isLoading: false,
  isAnalyzing: false,
  error: null,
  expandedFeedbackId: null,

  /**
   * 提交反馈
   */
  submitFeedback: async (analysisId, rating, correctedEmotion, comment) => {
    set({ isSubmitting: true, error: null });

    try {
      const feedback = await feedbackService.submitFeedback(
        analysisId,
        rating,
        correctedEmotion,
        comment
      );

      set((state) => ({
        currentFeedback: feedback,
        feedbackHistory: [feedback, ...state.feedbackHistory],
        isSubmitting: false,
      }));

      // 提交成功后自动更新摘要
      get().loadSummary();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '提交反馈失败',
        isSubmitting: false,
      });
    }
  },

  /**
   * 加载反馈历史
   */
  loadFeedbackHistory: async (petId) => {
    set({ isLoading: true, error: null });

    try {
      const history = await feedbackService.getFeedbackHistory(petId);
      set({
        feedbackHistory: history,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '加载反馈历史失败',
        isLoading: false,
      });
    }
  },

  /**
   * 分析反馈趋势
   */
  analyzeTrends: async () => {
    set({ isAnalyzing: true, error: null });

    try {
      const analysis = await feedbackService.analyzeFeedbackTrends();
      set({
        trendAnalysis: analysis,
        isAnalyzing: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '分析反馈趋势失败',
        isAnalyzing: false,
      });
    }
  },

  /**
   * 加载反馈摘要
   */
  loadSummary: async (petId) => {
    try {
      const summary = await feedbackService.getFeedbackSummary(petId);
      set({ summary });
    } catch (error) {
      // 摘要加载失败不显示错误，静默处理
      console.warn('[FeedbackStore] 加载摘要失败:', error);
    }
  },

  /**
   * 清除错误
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * 设置展开的反馈面板
   */
  setExpandedFeedback: (feedbackId) => {
    set({ expandedFeedbackId: feedbackId });
  },

  /**
   * 同步待处理的反馈
   */
  syncPendingFeedbacks: async () => {
    try {
      const result = await feedbackService.syncPendingFeedbacks();
      // 同步后重新加载历史
      get().loadFeedbackHistory();
      return result;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '同步反馈失败',
      });
      return { synced: 0, failed: 0 };
    }
  },

  /**
   * 清除本地历史
   */
  clearLocalHistory: () => {
    feedbackService.clearLocalHistory();
    set({
      feedbackHistory: [],
      currentFeedback: null,
      trendAnalysis: null,
      summary: null,
    });
  },
}));