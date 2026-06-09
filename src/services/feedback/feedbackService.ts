// ============================================
// PawSync Pro - feedbackService.ts
//
// 作者: 带娃的小陈工
// 日期: 2026-06-09
// 描述: 用户反馈闭环服务，用于持续学习改进
// ============================================

import type {
  Feedback,
  FeedbackRating,
  FeedbackHistoryQuery,
  FeedbackTrendAnalysis,
  FeedbackSummary,
  SubmitFeedbackRequest,
  EmotionCorrectionSuggestion,
  PrimaryEmotion,
} from '../../types/feedback';
import { FEEDBACK_CONFIGS } from '../../types/feedback';
import { EMOTION_CONFIGS } from '../../types/emotion';
import { api } from '../../lib/api';

// 本地存储键名
const STORAGE_KEY = 'pawsync_feedback_history';
const MAX_LOCAL_STORAGE = 100;

/**
 * 反馈服务类
 * 负责收集、存储和分析用户反馈数据
 */
class FeedbackService {
  private feedbackHistory: Feedback[] = [];
  private pendingFeedbacks: Map<string, SubmitFeedbackRequest> = new Map();
  private readonly API_ENDPOINT = '/v2/translator/feedback';

  constructor() {
    this.loadFromLocalStorage();
  }

  /**
   * 从本地存储加载反馈历史
   */
  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.feedbackHistory = JSON.parse(stored);
      }
    } catch {
      // 本地存储不可用，保持空数组
      this.feedbackHistory = [];
    }
  }

  /**
   * 保存反馈历史到本地存储
   */
  private saveToLocalStorage(): void {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(this.feedbackHistory.slice(0, MAX_LOCAL_STORAGE))
      );
    } catch {
      // 保存失败时静默处理
    }
  }

  /**
   * 提交用户反馈
   * @param analysisId 分析结果ID
   * @param rating 反馈类型：准确/不准确/换一种
   * @param correctedEmotion 修正后的情绪（当rating为inaccurate时）
   * @param comment 用户备注
   */
  async submitFeedback(
    analysisId: string,
    rating: FeedbackRating,
    correctedEmotion?: PrimaryEmotion,
    comment?: string
  ): Promise<Feedback> {
    // 获取原始分析数据
    const originalAnalysis = await this.getOriginalAnalysis(analysisId);

    // 创建反馈记录
    const feedback: Feedback = {
      id: `feedback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      analysisId,
      petId: originalAnalysis.petId,
      rating,
      correctedEmotion,
      comment,
      originalEmotion: originalAnalysis.primaryEmotion,
      originalConfidence: originalAnalysis.confidence,
      originalTranslation: originalAnalysis.translation,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // 先保存到本地
    this.feedbackHistory.unshift(feedback);
    this.saveToLocalStorage();

    // 尝试同步到后端
    try {
      const response = await api.post<{ feedback: Feedback }>(
        this.API_ENDPOINT,
        {
          analysisId,
          rating,
          correctedEmotion,
          comment,
          originalEmotion: feedback.originalEmotion,
          originalConfidence: feedback.originalConfidence,
        }
      );

      // 更新本地记录为已同步状态
      const localFeedback = this.feedbackHistory.find(f => f.id === feedback.id);
      if (localFeedback && response.feedback) {
        localFeedback.status = 'processed';
        localFeedback.updatedAt = response.feedback.updatedAt;
        this.saveToLocalStorage();
      }

      return response.feedback || feedback;
    } catch (error) {
      // 后端同步失败，返回本地记录
      console.warn('[FeedbackService] 后端同步失败，已保存到本地:', error);
      return feedback;
    }
  }

  /**
   * 获取原始分析数据
   * 从emotionService或本地存储获取
   */
  private async getOriginalAnalysis(analysisId: string): Promise<{
    petId: string;
    primaryEmotion: PrimaryEmotion;
    confidence: number;
    translation: string;
  }> {
    // 尝试从本地存储获取
    try {
      const storedAnalyses = localStorage.getItem('emotion_analyses');
      if (storedAnalyses) {
        const analyses = JSON.parse(storedAnalyses);
        const analysis = analyses.find((a: { id: string }) => a.id === analysisId);
        if (analysis) {
          return {
            petId: analysis.petId,
            primaryEmotion: analysis.primaryEmotion,
            confidence: analysis.confidence,
            translation: analysis.translation,
          };
        }
      }
    } catch {
      // 静默处理
    }

    // 返回默认值
    return {
      petId: '1',
      primaryEmotion: 'calm',
      confidence: 95,
      translation: '分析结果',
    };
  }

  /**
   * 获取反馈历史记录
   * @param petId 可选，按宠物ID筛选
   */
  async getFeedbackHistory(petId?: string): Promise<Feedback[]> {
    // 先返回本地数据
    let history = this.feedbackHistory;

    if (petId) {
      history = history.filter(f => f.petId === petId);
    }

    // 尝试从后端获取更完整的数据
    try {
      const endpoint = petId
        ? `${this.API_ENDPOINT}/history?petId=${petId}`
        : `${this.API_ENDPOINT}/history`;
      const response = await api.get<{ feedbacks: Feedback[] }>(endpoint);

      if (response.feedbacks && response.feedbacks.length > 0) {
        // 合并后端数据，去重
        const backendIds = new Set(response.feedbacks.map(f => f.id));
        const localOnly = history.filter(f => !backendIds.has(f.id));
        history = [...response.feedbacks, ...localOnly];
      }
    } catch (error) {
      console.warn('[FeedbackService] 从后端获取历史失败:', error);
    }

    return history;
  }

  /**
   * 分析反馈趋势
   * 用于持续学习改进
   */
  async analyzeFeedbackTrends(): Promise<FeedbackTrendAnalysis> {
    const history = await this.getFeedbackHistory();

    // 计算统计数据
    const totalFeedback = history.length;
    const accurateCount = history.filter(f => f.rating === 'accurate').length;
    const inaccurateCount = history.filter(f => f.rating === 'inaccurate').length;
    const alternativeCount = history.filter(f => f.rating === 'alternative').length;

    const accuracyRate = totalFeedback > 0
      ? Math.round((accurateCount / totalFeedback) * 100)
      : 0;

    // 分析情绪修正情况
    const emotionCorrections: Record<PrimaryEmotion, {
      count: number;
      correctedTo: Record<PrimaryEmotion, number>;
    }> = {} as Record<PrimaryEmotion, {
      count: number;
      correctedTo: Record<PrimaryEmotion, number>;
    }>;

    // 初始化所有情绪
    const emotions: PrimaryEmotion[] = [
      'happy', 'curious', 'anxious', 'angry',
      'needs', 'calm', 'excited', 'safe'
    ];

    for (const emotion of emotions) {
      emotionCorrections[emotion] = { count: 0, correctedTo: {} as Record<PrimaryEmotion, number> };
    }

    // 统计修正情况
    for (const feedback of history) {
      if (feedback.rating === 'inaccurate' && feedback.correctedEmotion) {
        const original = feedback.originalEmotion;
        const corrected = feedback.correctedEmotion;

        emotionCorrections[original].count++;
        emotionCorrections[original].correctedTo[corrected] =
          (emotionCorrections[original].correctedTo[corrected] || 0) + 1;
      }
    }

    // 分析常见问题
    const commonIssues = this.identifyCommonIssues(history);

    // 生成改进建议
    const improvementSuggestions = this.generateImprovementSuggestions(
      history,
      emotionCorrections,
      accuracyRate
    );

    // 计算分析周期
    const sortedHistory = [...history].sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const startDate = sortedHistory[0]?.createdAt || new Date().toISOString();
    const endDate = sortedHistory[sortedHistory.length - 1]?.createdAt || new Date().toISOString();

    return {
      totalFeedback,
      accurateCount,
      inaccurateCount,
      alternativeCount,
      accuracyRate,
      emotionCorrections,
      commonIssues,
      improvementSuggestions,
      period: { startDate, endDate },
    };
  }

  /**
   * 识别常见问题
   */
  private identifyCommonIssues(history: Feedback[]): string[] {
    const issues: string[] = [];

    // 分析不准确反馈中的评论
    const inaccurateFeedbacks = history.filter(f =>
      f.rating === 'inaccurate' && f.comment
    );

    // 统计关键词
    const keywordCounts: Record<string, number> = {};
    const keywords = ['音调', '强度', '频率', '节奏', '音色', '环境', '时间', '宠物类型'];

    for (const feedback of inaccurateFeedbacks) {
      const comment = feedback.comment || '';
      for (const keyword of keywords) {
        if (comment.includes(keyword)) {
          keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
        }
      }
    }

    // 找出高频问题关键词
    for (const [keyword, count] of Object.entries(keywordCounts)) {
      if (count >= 3) {
        issues.push(`${keyword}特征分析可能需要优化（出现${count}次）`);
      }
    }

    // 分析特定情绪的准确率
    const emotionAccuracy: Record<PrimaryEmotion, { total: number; accurate: number }> = {} as Record<PrimaryEmotion, { total: number; accurate: number }>;

    for (const emotion of Object.keys(EMOTION_CONFIGS) as PrimaryEmotion[]) {
      emotionAccuracy[emotion] = { total: 0, accurate: 0 };
    }

    for (const feedback of history) {
      emotionAccuracy[feedback.originalEmotion].total++;
      if (feedback.rating === 'accurate') {
        emotionAccuracy[feedback.originalEmotion].accurate++;
      }
    }

    // 找出准确率低的情绪
    for (const [emotion, stats] of Object.entries(emotionAccuracy)) {
      if (stats.total >= 5) {
        const rate = stats.accurate / stats.total;
        if (rate < 0.6) {
          issues.push(`${EMOTION_CONFIGS[emotion as PrimaryEmotion].label}情绪识别准确率偏低（${Math.round(rate * 100)}%）`);
        }
      }
    }

    return issues.slice(0, 5); // 返回最多5个问题
  }

  /**
   * 生成改进建议
   */
  private generateImprovementSuggestions(
    history: Feedback[],
    emotionCorrections: Record<PrimaryEmotion, { count: number; correctedTo: Record<PrimaryEmotion, number> }>,
    accuracyRate: number
  ): string[] {
    const suggestions: string[] = [];

    // 基于整体准确率
    if (accuracyRate < 70) {
      suggestions.push('建议增加更多训练数据以提高整体准确率');
    }

    // 基于情绪修正分析
    for (const [fromEmotion, correction] of Object.entries(emotionCorrections)) {
      if (correction.count >= 3) {
        // 找出最常见的修正目标
        const correctedToEntries = Object.entries(correction.correctedTo);
        if (correctedToEntries.length > 0) {
          const [toEmotion, count] = correctedToEntries.sort((a, b) => b[1] - a[1])[0];
          suggestions.push(
            `${EMOTION_CONFIGS[fromEmotion as PrimaryEmotion].label}常被误判，建议增加${EMOTION_CONFIGS[toEmotion as PrimaryEmotion].label}的特征权重`
          );
        }
      }
    }

    // 基于反馈类型分布
    const alternativeCount = history.filter(f => f.rating === 'alternative').length;
    if (alternativeCount > history.length * 0.2) {
      suggestions.push('用户经常请求换一种解释，建议优化翻译文案的多样性');
    }

    // 基于置信度分析
    const lowConfidenceInaccurate = history.filter(f =>
      f.rating === 'inaccurate' && f.originalConfidence < 80
    );
    if (lowConfidenceInaccurate.length > 0) {
      suggestions.push('低置信度结果更容易出错，建议提高置信度阈值或增加二次确认');
    }

    return suggestions.slice(0, 5); // 返回最多5个建议
  }

  /**
   * 获取反馈摘要
   */
  async getFeedbackSummary(petId?: string): Promise<FeedbackSummary> {
    const history = await this.getFeedbackHistory(petId);

    const total = history.length;
    const accurate = history.filter(f => f.rating === 'accurate').length;
    const inaccurate = history.filter(f => f.rating === 'inaccurate').length;
    const alternative = history.filter(f => f.rating === 'alternative').length;

    const accuracyRate = total > 0 ? Math.round((accurate / total) * 100) : 0;

    // 计算最常被修正的情绪
    interface CorrectionData {
      count: number;
      correctedTo: Partial<Record<PrimaryEmotion, number>>;
    }
    const correctionCounts: Partial<Record<PrimaryEmotion, CorrectionData>> = {};

    for (const feedback of history) {
      if (feedback.rating === 'inaccurate' && feedback.correctedEmotion) {
        const original = feedback.originalEmotion;
        if (!correctionCounts[original]) {
          correctionCounts[original] = { count: 0, correctedTo: {} };
        }
        correctionCounts[original]!.count++;
        correctionCounts[original]!.correctedTo[feedback.correctedEmotion] =
          (correctionCounts[original]!.correctedTo[feedback.correctedEmotion] || 0) + 1;
      }
    }

    // 获取修正次数最多的情绪
    const topCorrectedEmotions = Object.entries(correctionCounts)
      .filter(([, data]) => data.count > 0)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3)
      .map(([emotion, data]) => {
        const mostCorrectedTo = Object.entries(data.correctedTo)
          .sort((a, b) => b[1] - a[1])[0]?.[0] as PrimaryEmotion;
        return {
          emotion: emotion as PrimaryEmotion,
          correctionCount: data.count,
          mostCorrectedTo,
        };
      });

    return {
      total,
      accurate,
      inaccurate,
      alternative,
      accuracyRate,
      recentFeedback: history.slice(0, 5),
      topCorrectedEmotions,
    };
  }

  /**
   * 获取情绪修正建议
   * 用于模型改进
   */
  async getEmotionCorrectionSuggestions(): Promise<EmotionCorrectionSuggestion[]> {
    const history = await this.getFeedbackHistory();

    const corrections: EmotionCorrectionSuggestion[] = [];

    // 统计每种修正组合
    const correctionMap: Record<string, {
      from: PrimaryEmotion;
      to: PrimaryEmotion;
      count: number;
      reasons: string[];
    }> = {};

    for (const feedback of history) {
      if (feedback.rating === 'inaccurate' && feedback.correctedEmotion) {
        const key = `${feedback.originalEmotion}-${feedback.correctedEmotion}`;
        if (!correctionMap[key]) {
          correctionMap[key] = {
            from: feedback.originalEmotion,
            to: feedback.correctedEmotion,
            count: 0,
            reasons: [],
          };
        }
        correctionMap[key].count++;
        if (feedback.comment) {
          correctionMap[key].reasons.push(feedback.comment);
        }
      }
    }

    // 转换为建议列表
    for (const correction of Object.values(correctionMap)) {
      if (correction.count >= 2) {
        // 提取常见原因
        const commonReason = this.extractCommonReason(correction.reasons);

        corrections.push({
          from: correction.from,
          to: correction.to,
          reason: commonReason,
          frequency: correction.count,
          confidence: Math.min(95, 60 + correction.count * 5),
        });
      }
    }

    // 按频率排序
    return corrections.sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * 提取常见原因
   */
  private extractCommonReason(reasons: string[]): string {
    if (reasons.length === 0) {
      return '用户反馈表明此情绪常被误判';
    }

    // 简化处理：返回第一个原因或合并
    if (reasons.length === 1) {
      return reasons[0];
    }

    // 尝找共同关键词
    const keywords = ['音调', '强度', '频率', '节奏', '音色', '环境'];
    for (const keyword of keywords) {
      const count = reasons.filter(r => r.includes(keyword)).length;
      if (count > reasons.length / 2) {
        return `${keyword}特征分析需要优化`;
      }
    }

    return '多种因素导致误判';
  }

  /**
   * 获取反馈配置
   */
  getFeedbackConfig(rating: FeedbackRating) {
    return FEEDBACK_CONFIGS[rating];
  }

  /**
   * 清除本地反馈历史
   */
  clearLocalHistory(): void {
    this.feedbackHistory = [];
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * 检查是否有未同步的反馈
   */
  hasUnsyncedFeedback(): boolean {
    return this.feedbackHistory.some(f => f.status === 'pending');
  }

  /**
   * 同步所有待处理的反馈到后端
   */
  async syncPendingFeedbacks(): Promise<{ synced: number; failed: number }> {
    const pending = this.feedbackHistory.filter(f => f.status === 'pending');
    let synced = 0;
    let failed = 0;

    for (const feedback of pending) {
      try {
        await api.post(this.API_ENDPOINT, {
          analysisId: feedback.analysisId,
          rating: feedback.rating,
          correctedEmotion: feedback.correctedEmotion,
          comment: feedback.comment,
          originalEmotion: feedback.originalEmotion,
          originalConfidence: feedback.originalConfidence,
        });

        feedback.status = 'processed';
        feedback.updatedAt = new Date().toISOString();
        synced++;
      } catch {
        failed++;
      }
    }

    this.saveToLocalStorage();
    return { synced, failed };
  }
}

// 导出单例实例
export const feedbackService = new FeedbackService();