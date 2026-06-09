// ============================================
// PawSync Pro - useAnalysisHistory.ts
// 
// 描述: 历史记录Hook
// ============================================

import { useState, useCallback, useMemo } from 'react';
import { useAppStore, type Analysis } from '../../../store/appStore';
import type { PrimaryEmotion } from '../../../types/emotion';
import { EMOTION_CONFIGS } from '../../../types/emotion';

/**
 * 历史记录项（扩展类型）
 */
export interface HistoryItem extends Analysis {
  emotionConfig: {
    emoji: string;
    label: string;
    color: string;
  };
}

/**
 * 统计数据
 */
export interface HistoryStatistics {
  totalCount: number;
  voiceCount: number;
  imageCount: number;
  averageConfidence: number;
  emotionDistribution: Record<string, number>;
  mostCommonEmotion: PrimaryEmotion | null;
}

/**
 * Hook返回值接口
 */
export interface UseAnalysisHistoryReturn {
  history: HistoryItem[];
  filteredHistory: HistoryItem[];
  selectedPetId: string | null;
  statistics: HistoryStatistics;
  setSelectedPetId: (petId: string | null) => void;
  getHistoryByEmotion: (emotion: PrimaryEmotion) => HistoryItem[];
  getHistoryByType: (type: 'voice' | 'image') => HistoryItem[];
  getRecentHistory: (limit: number) => HistoryItem[];
  clearHistory: () => void;
}

/**
 * 分析历史记录Hook
 * 提供历史记录的查询、过滤和统计功能
 */
export function useAnalysisHistory(): UseAnalysisHistoryReturn {
  // 从全局状态获取分析记录
  const analyses = useAppStore((state) => state.analyses);
  const currentPet = useAppStore((state) => state.currentPet);

  // 状态
  const [selectedPetId, setSelectedPetId] = useState<string | null>(
    currentPet?.id || null
  );

  // 转换为扩展的历史记录项
  const history = useMemo<HistoryItem[]>(() => {
    return analyses.map((analysis) => ({
      ...analysis,
      emotionConfig: {
        emoji: EMOTION_CONFIGS[analysis.result.emotion as PrimaryEmotion]?.emoji || '😊',
        label: EMOTION_CONFIGS[analysis.result.emotion as PrimaryEmotion]?.label || '平静',
        color: EMOTION_CONFIGS[analysis.result.emotion as PrimaryEmotion]?.color || 'text-gray-500',
      },
    }));
  }, [analyses]);

  // 过滤后的历史记录
  const filteredHistory = useMemo<HistoryItem[]>(() => {
    if (!selectedPetId) return history;

    return history
      .filter((item) => item.petId === selectedPetId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [history, selectedPetId]);

  // 统计数据
  const statistics = useMemo<HistoryStatistics>(() => {
    const targetHistory = selectedPetId ? filteredHistory : history;

    if (targetHistory.length === 0) {
      return {
        totalCount: 0,
        voiceCount: 0,
        imageCount: 0,
        averageConfidence: 0,
        emotionDistribution: {},
        mostCommonEmotion: null,
      };
    }

    // 按类型统计
    const voiceCount = targetHistory.filter((item) => item.type === 'voice').length;
    const imageCount = targetHistory.filter((item) => item.type === 'image').length;

    // 平均置信度
    const averageConfidence = Math.round(
      targetHistory.reduce((sum, item) => sum + item.result.confidence, 0) / targetHistory.length
    );

    // 情感分布
    const emotionDistribution: Record<string, number> = {};
    targetHistory.forEach((item) => {
      const emotion = item.result.emotion;
      emotionDistribution[emotion] = (emotionDistribution[emotion] || 0) + 1;
    });

    // 最常见情感
    let mostCommonEmotion: PrimaryEmotion | null = null;
    let maxCount = 0;
    for (const [emotion, count] of Object.entries(emotionDistribution)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonEmotion = emotion as PrimaryEmotion;
      }
    }

    return {
      totalCount: targetHistory.length,
      voiceCount,
      imageCount,
      averageConfidence,
      emotionDistribution,
      mostCommonEmotion,
    };
  }, [history, filteredHistory, selectedPetId]);

  // 按情感获取历史记录
  const getHistoryByEmotion = useCallback((emotion: PrimaryEmotion): HistoryItem[] => {
    return filteredHistory.filter((item) => item.result.emotion === emotion);
  }, [filteredHistory]);

  // 按类型获取历史记录
  const getHistoryByType = useCallback((type: 'voice' | 'image'): HistoryItem[] => {
    return filteredHistory.filter((item) => item.type === type);
  }, [filteredHistory]);

  // 获取最近的历史记录
  const getRecentHistory = useCallback((limit: number): HistoryItem[] => {
    return filteredHistory.slice(0, limit);
  }, [filteredHistory]);

  // 清除历史记录（通过全局状态）
  const clearHistory = useCallback(() => {
    // 注意：这里不直接清除，需要通过全局状态管理
    // 可以调用 useAppStore 的 clearAllData 方法
    console.log('清除历史记录需要通过全局状态管理');
  }, []);

  return {
    history,
    filteredHistory,
    selectedPetId,
    statistics,
    setSelectedPetId,
    getHistoryByEmotion,
    getHistoryByType,
    getRecentHistory,
    clearHistory,
  };
}