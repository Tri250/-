import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeEmotionTrend, EmotionResult, EmotionType } from '../../../src/services/advancedAIEngine';

describe('AI Engine - Emotion Trend Tests', () => {
  describe('Trend Analysis', () => {
    it('应该分析情感趋势', () => {
      const history: EmotionResult[] = [
        createMockResult('happy', 0.8),
        createMockResult('happy', 0.85),
        createMockResult('excited', 0.9),
        createMockResult('calm', 0.75),
        createMockResult('happy', 0.88),
      ];
      
      const trend = analyzeEmotionTrend(history);
      
      expect(trend).toBeDefined();
      expect(trend.dominantEmotion).toBe('happy');
      expect(trend.averageConfidence).toBeGreaterThan(0);
      expect(trend.stability).toBeGreaterThan(0);
      expect(['improving', 'stable', 'declining']).toContain(trend.trend);
      expect(trend.anomalyScore).toBeGreaterThanOrEqual(0);
      expect(trend.anomalyScore).toBeLessThanOrEqual(1);
      expect(trend.prediction).toBeDefined();
      expect(['high', 'medium', 'low']).toContain(trend.engagement);
    });

    it('应该处理空历史数据', () => {
      const trend = analyzeEmotionTrend([]);
      
      expect(trend).toBeDefined();
      expect(trend.dominantEmotion).toBe('calm');
      expect(trend.averageConfidence).toBe(0);
      expect(trend.stability).toBe(0);
      expect(trend.trend).toBe('stable');
      expect(trend.anomalyScore).toBe(0);
      expect(trend.engagement).toBe('low');
    });

    it('应该检测改善趋势', () => {
      const history: EmotionResult[] = [
        createMockResult('sad', 0.6),
        createMockResult('sad', 0.65),
        createMockResult('calm', 0.7),
        createMockResult('happy', 0.8),
        createMockResult('happy', 0.85),
        createMockResult('excited', 0.9),
      ];
      
      const trend = analyzeEmotionTrend(history);
      expect(trend.trend).toBe('improving');
    });

    it('应该检测下降趋势', () => {
      const history: EmotionResult[] = [
        createMockResult('happy', 0.85),
        createMockResult('happy', 0.8),
        createMockResult('calm', 0.7),
        createMockResult('sad', 0.6),
        createMockResult('sad', 0.55),
        createMockResult('anxious', 0.5),
        createMockResult('fearful', 0.45),
      ];
      
      const trend = analyzeEmotionTrend(history);
      expect(['declining', 'stable']).toContain(trend.trend);
      expect(trend.emotionalBalance).toBeLessThanOrEqual(0);
    });

    it('应该检测稳定趋势', () => {
      const history: EmotionResult[] = [
        createMockResult('happy', 0.8),
        createMockResult('happy', 0.82),
        createMockResult('happy', 0.78),
        createMockResult('happy', 0.81),
        createMockResult('happy', 0.79),
      ];
      
      const trend = analyzeEmotionTrend(history);
      expect(['stable', 'improving']).toContain(trend.trend);
    });

    it('应该正确计算平均置信度', () => {
      const history: EmotionResult[] = [
        createMockResult('happy', 0.8),
        createMockResult('happy', 0.9),
        createMockResult('happy', 0.7),
      ];
      
      const trend = analyzeEmotionTrend(history);
      expect(trend.averageConfidence).toBeCloseTo(0.8, 1);
    });

    it('应该正确计算稳定性', () => {
      const stableHistory: EmotionResult[] = [
        createMockResult('happy', 0.8),
        createMockResult('happy', 0.85),
        createMockResult('happy', 0.9),
      ];
      
      const unstableHistory: EmotionResult[] = [
        createMockResult('happy', 0.8),
        createMockResult('sad', 0.7),
        createMockResult('excited', 0.9),
      ];
      
      const stableTrend = analyzeEmotionTrend(stableHistory);
      const unstableTrend = analyzeEmotionTrend(unstableHistory);
      
      expect(stableTrend.stability).toBeGreaterThan(unstableTrend.stability);
    });

    it('应该处理单条记录', () => {
      const history = [createMockResult('happy', 0.85)];
      
      const trend = analyzeEmotionTrend(history);
      expect(trend.dominantEmotion).toBe('happy');
      expect(trend.averageConfidence).toBe(0.85);
      expect(trend.prediction).toBeDefined();
    });

    it('应该处理大量历史数据', () => {
      const history: EmotionResult[] = Array.from({ length: 100 }, (_, i) => 
        createMockResult('happy', 0.8 + (i % 10) * 0.01)
      );
      
      const trend = analyzeEmotionTrend(history);
      expect(trend).toBeDefined();
      expect(trend.averageConfidence).toBeGreaterThan(0);
      expect(trend.anomalyScore).toBeGreaterThanOrEqual(0);
    });

    it('应该处理所有正面情感', () => {
      const history: EmotionResult[] = [
        createMockResult('happy', 0.9),
        createMockResult('excited', 0.85),
        createMockResult('affectionate', 0.88),
        createMockResult('calm', 0.82),
        createMockResult('happy', 0.87),
        createMockResult('excited', 0.86),
      ];
      
      const trend = analyzeEmotionTrend(history);
      expect(['improving', 'stable']).toContain(trend.trend);
      expect(trend.emotionalBalance).toBeGreaterThan(0);
    });

    it('应该处理所有负面情感', () => {
      const history: EmotionResult[] = [
        createMockResult('sad', 0.8),
        createMockResult('anxious', 0.75),
        createMockResult('fearful', 0.82),
        createMockResult('angry', 0.78),
        createMockResult('sad', 0.79),
        createMockResult('anxious', 0.77),
      ];
      
      const trend = analyzeEmotionTrend(history);
      expect(['declining', 'stable']).toContain(trend.trend);
      expect(trend.emotionalBalance).toBeLessThan(0);
    });

    it('应该正确计算情感平衡度', () => {
      const history: EmotionResult[] = [
        createMockResult('happy', 0.8),
        createMockResult('happy', 0.85),
        createMockResult('sad', 0.7),
        createMockResult('angry', 0.6),
      ];
      
      const trend = analyzeEmotionTrend(history);
      expect(trend.emotionalBalance).toBeDefined();
      expect(trend.emotionalBalance).toBeGreaterThanOrEqual(-1);
      expect(trend.emotionalBalance).toBeLessThanOrEqual(1);
    });

    it('应该正确计算异常分数', () => {
      const normalHistory: EmotionResult[] = [
        createMockResult('happy', 0.8),
        createMockResult('happy', 0.82),
        createMockResult('happy', 0.81),
        createMockResult('happy', 0.83),
      ];
      
      const trend = analyzeEmotionTrend(normalHistory);
      expect(trend.anomalyScore).toBeLessThanOrEqual(0.6);
    });
  });
});

function createMockResult(emotion: EmotionType, confidence: number): EmotionResult {
  return {
    primaryEmotion: emotion,
    intensity: confidence > 0.8 ? 'high' : confidence > 0.6 ? 'medium' : 'low',
    confidence,
    secondaryEmotions: [],
    analysisDetails: {
      features: {},
      model: 'Test-Model',
      timestamp: Date.now(),
      processingTime: 10,
    },
    recommendation: `Test recommendation for ${emotion}`,
  };
}
