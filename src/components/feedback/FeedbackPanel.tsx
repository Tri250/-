// ============================================
// PawSync Pro - FeedbackPanel.tsx
//
// 作者: 带娃的小陈工
// 日期: 2026-06-09
// 描述: 微反馈组件，显示在分析结果下方
// ============================================

import React, { useState, useCallback } from 'react';
import { useFeedbackStore } from '../../store/feedbackStore';
import type { FeedbackRating, PrimaryEmotion } from '../../types/feedback';
import { FEEDBACK_CONFIGS } from '../../types/feedback';
import { EMOTION_CONFIGS } from '../../types/emotion';

/**
 * 反馈面板组件属性
 */
interface FeedbackPanelProps {
  analysisId: string;
  petId?: string;
  onFeedbackSubmitted?: (rating: FeedbackRating) => void;
  className?: string;
}

/**
 * 微反馈组件
 * 提供三个快速反馈按钮：很准、不太对、换一种
 * 支持展开输入修正意见
 */
export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  analysisId,
  petId,
  onFeedbackSubmitted,
  className = '',
}) => {
  // 状态管理
  const { submitFeedback, isSubmitting, currentFeedback } = useFeedbackStore();

  // 本地状态
  const [selectedRating, setSelectedRating] = useState<FeedbackRating | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [correctedEmotion, setCorrectedEmotion] = useState<PrimaryEmotion | undefined>();
  const [comment, setComment] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // 检查是否已提交过反馈
  const hasSubmitted = currentFeedback?.analysisId === analysisId;

  /**
   * 处理快速反馈点击
   */
  const handleQuickFeedback = useCallback(async (rating: FeedbackRating) => {
    setSelectedRating(rating);

    // 对于"不太对"，展开详细输入
    if (rating === 'inaccurate') {
      setIsExpanded(true);
      return;
    }

    // 其他类型直接提交
    try {
      await submitFeedback(analysisId, rating);
      setShowSuccess(true);
      onFeedbackSubmitted?.(rating);

      // 3秒后隐藏成功提示
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('[FeedbackPanel] 提交反馈失败:', error);
    }
  }, [analysisId, submitFeedback, onFeedbackSubmitted]);

  /**
   * 提交详细反馈
   */
  const handleDetailedSubmit = useCallback(async () => {
    if (!selectedRating) return;

    try {
      await submitFeedback(analysisId, selectedRating, correctedEmotion, comment);
      setShowSuccess(true);
      setIsExpanded(false);
      onFeedbackSubmitted?.(selectedRating);

      // 重置状态
      setComment('');
      setCorrectedEmotion(undefined);

      // 3秒后隐藏成功提示
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('[FeedbackPanel] 提交详细反馈失败:', error);
    }
  }, [analysisId, selectedRating, correctedEmotion, comment, submitFeedback, onFeedbackSubmitted]);

  /**
   * 取消详细输入
   */
  const handleCancel = useCallback(() => {
    setIsExpanded(false);
    setSelectedRating(null);
    setComment('');
    setCorrectedEmotion(undefined);
  }, []);

  // 如果已提交过反馈，显示感谢信息
  if (hasSubmitted && !showSuccess) {
    return (
      <div className={`mt-4 p-3 bg-green-50 rounded-lg border border-green-200 ${className}`}>
        <div className="flex items-center gap-2 text-green-700">
          <span className="text-lg">✅</span>
          <span className="font-medium">感谢您的反馈！</span>
          <span className="text-sm text-green-600">
            您的反馈将帮助我们持续改进分析准确度
          </span>
        </div>
      </div>
    );
  }

  // 成功提示
  if (showSuccess) {
    return (
      <div className={`mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 animate-fade-in ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-xl">🎉</span>
          </div>
          <div>
            <p className="font-medium text-green-800">反馈已提交成功</p>
            <p className="text-sm text-green-600">感谢您帮助我们改进宠物情感翻译</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`mt-4 ${className}`}>
      {/* 反馈提示标题 */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm text-gray-500">这个分析结果怎么样？</span>
        <span className="text-xs text-gray-400">帮助我们做得更好</span>
      </div>

      {/* 快速反馈按钮组 */}
      <div className="flex gap-2">
        {(['accurate', 'inaccurate', 'alternative'] as FeedbackRating[]).map((rating) => {
          const config = FEEDBACK_CONFIGS[rating];
          const isSelected = selectedRating === rating;

          return (
            <button
              key={rating}
              onClick={() => handleQuickFeedback(rating)}
              disabled={isSubmitting}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-lg
                transition-all duration-200 transform
                ${config.bgColor}
                ${isSelected ? 'ring-2 ring-offset-2 ring-gray-300 scale-105' : ''}
                ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
                border border-gray-200
              `}
            >
              <span className="text-lg">{config.emoji}</span>
              <span className={`font-medium ${config.color}`}>{config.label}</span>
            </button>
          );
        })}
      </div>

      {/* 详细输入面板 */}
      {isExpanded && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-slide-down">
          <h4 className="font-medium text-gray-700 mb-3">
            请告诉我们哪里不太对
          </h4>

          {/* 情绪修正选择 */}
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">
              您认为正确的情绪是：
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(EMOTION_CONFIGS).map(([emotion, config]) => (
                <button
                  key={emotion}
                  onClick={() => setCorrectedEmotion(emotion as PrimaryEmotion)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-full
                    transition-all duration-200
                    ${correctedEmotion === emotion
                      ? 'bg-blue-100 border-2 border-blue-400'
                      : 'bg-white border border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <span>{config.emoji}</span>
                  <span className="text-sm">{config.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 评论输入 */}
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">
              补充说明（可选）：
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="例如：当时宠物正在吃东西，声音可能是因为食物..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg
                focus:ring-2 focus:ring-blue-200 focus:border-blue-400
                resize-none text-sm"
              rows={3}
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800
                transition-colors duration-200"
            >
              取消
            </button>
            <button
              onClick={handleDetailedSubmit}
              disabled={isSubmitting || !correctedEmotion}
              className={`
                px-5 py-2 bg-blue-500 text-white rounded-lg
                transition-all duration-200
                ${isSubmitting || !correctedEmotion
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-blue-600 active:bg-blue-700'
                }
              `}
            >
              {isSubmitting ? '提交中...' : '提交反馈'}
            </button>
          </div>
        </div>
      )}

      {/* 加载状态 */}
      {isSubmitting && !isExpanded && (
        <div className="mt-2 flex items-center gap-2 text-gray-500">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-sm">正在提交反馈...</span>
        </div>
      )}
    </div>
  );
};

/**
 * 反馈历史组件
 * 显示最近的反馈记录
 */
export const FeedbackHistory: React.FC<{
  petId?: string;
  maxItems?: number;
  className?: string;
}> = ({ petId, maxItems = 5, className = '' }) => {
  const { feedbackHistory, loadFeedbackHistory, isLoading } = useFeedbackStore();

  // 加载历史
  React.useEffect(() => {
    loadFeedbackHistory(petId);
  }, [petId, loadFeedbackHistory]);

  if (isLoading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="flex items-center gap-2 text-gray-500">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          <span>加载反馈历史...</span>
        </div>
      </div>
    );
  }

  if (feedbackHistory.length === 0) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className}`}>
        <p>暂无反馈记录</p>
        <p className="text-sm mt-1">分析结果后点击反馈按钮，帮助我们改进</p>
      </div>
    );
  }

  const displayHistory = feedbackHistory.slice(0, maxItems);

  return (
    <div className={`space-y-2 ${className}`}>
      <h4 className="font-medium text-gray-700 mb-2">最近反馈</h4>
      {displayHistory.map((feedback) => {
        const config = FEEDBACK_CONFIGS[feedback.rating];
        const emotionConfig = EMOTION_CONFIGS[feedback.originalEmotion];

        return (
          <div
            key={feedback.id}
            className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100"
          >
            <span className="text-lg">{config.emoji}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">{config.label}</span>
                <span className="text-sm text-gray-500">
                  原分析：{emotionConfig.emoji} {emotionConfig.label}
                </span>
              </div>
              {feedback.correctedEmotion && (
                <div className="text-sm text-blue-600 mt-1">
                  修正为：{EMOTION_CONFIGS[feedback.correctedEmotion].emoji} {EMOTION_CONFIGS[feedback.correctedEmotion].label}
                </div>
              )}
              {feedback.comment && (
                <p className="text-sm text-gray-500 mt-1 truncate">
                  {feedback.comment}
                </p>
              )}
            </div>
            <span className="text-xs text-gray-400">
              {new Date(feedback.createdAt).toLocaleDateString()}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/**
 * 反馈统计摘要组件
 */
export const FeedbackSummaryCard: React.FC<{
  petId?: string;
  className?: string;
}> = ({ petId, className = '' }) => {
  const { summary, loadSummary, isLoading } = useFeedbackStore();

  // 加载摘要
  React.useEffect(() => {
    loadSummary(petId);
  }, [petId, loadSummary]);

  if (isLoading || !summary) {
    return null;
  }

  if (summary.total === 0) {
    return null;
  }

  return (
    <div className={`p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 ${className}`}>
      <h4 className="font-medium text-blue-800 mb-3">反馈统计</h4>

      {/* 准确率 */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-lg font-bold text-blue-700">{summary.accuracyRate}%</span>
        </div>
        <div>
          <p className="font-medium text-blue-700">准确率</p>
          <p className="text-sm text-blue-500">
            基于 {summary.total} 次反馈
          </p>
        </div>
      </div>

      {/* 统计条 */}
      <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-gray-200">
        <div
          className="bg-green-500"
          style={{ width: `${(summary.accurate / summary.total) * 100}%` }}
          title={`准确: ${summary.accurate}`}
        />
        <div
          className="bg-red-500"
          style={{ width: `${(summary.inaccurate / summary.total) * 100}%` }}
          title={`不准确: ${summary.inaccurate}`}
        />
        <div
          className="bg-blue-500"
          style={{ width: `${(summary.alternative / summary.total) * 100}%` }}
          title={`换一种: ${summary.alternative}`}
        />
      </div>

      {/* 统计数字 */}
      <div className="flex justify-between mt-2 text-sm">
        <span className="text-green-600">👍 {summary.accurate}</span>
        <span className="text-red-600">👎 {summary.inaccurate}</span>
        <span className="text-blue-600">🔄 {summary.alternative}</span>
      </div>

      {/* 常见修正 */}
      {summary.topCorrectedEmotions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-blue-200">
          <p className="text-sm text-blue-700 mb-2">常被修正的情绪：</p>
          {summary.topCorrectedEmotions.slice(0, 2).map((item) => (
            <div key={item.emotion} className="flex items-center gap-2 text-sm text-blue-600">
              <span>{EMOTION_CONFIGS[item.emotion].emoji}</span>
              <span>{EMOTION_CONFIGS[item.emotion].label}</span>
              <span className="text-gray-400">→</span>
              <span>{EMOTION_CONFIGS[item.mostCorrectedTo].emoji}</span>
              <span>{EMOTION_CONFIGS[item.mostCorrectedTo].label}</span>
              <span className="text-xs text-gray-500">({item.correctionCount}次)</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 默认导出主组件
export default FeedbackPanel;