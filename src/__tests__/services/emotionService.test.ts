import { describe, it, expect, vi, beforeEach } from 'vitest';
import { emotionService } from '../../services/emotionService';
import type { PrimaryEmotion } from '../../types/emotion';

describe('EmotionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeVoice - 语音情感分析', () => {
    it('应该返回有效的分析结果', async () => {
      const audioData = new Float32Array(1000);
      const result = await emotionService.analyzeVoice(audioData);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('petId');
      expect(result).toHaveProperty('primaryEmotion');
      expect(result).toHaveProperty('translation');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('intensity');
      expect(result).toHaveProperty('subEmotions');
      expect(result).toHaveProperty('context');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('source', 'voice');
    });

    it('置信度应该在0-100之间', async () => {
      for (let i = 0; i < 10; i++) {
        const audioData = new Float32Array(1000);
        const result = await emotionService.analyzeVoice(audioData);
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(100);
      }
    });

    it('强度应该在0-100之间', async () => {
      for (let i = 0; i < 10; i++) {
        const audioData = new Float32Array(1000);
        const result = await emotionService.analyzeVoice(audioData);
        expect(result.intensity).toBeGreaterThanOrEqual(0);
        expect(result.intensity).toBeLessThanOrEqual(100);
      }
    });

    it('应该返回有效的情感类型', async () => {
      const audioData = new Float32Array(1000);
      const result = await emotionService.analyzeVoice(audioData);
      
      const validEmotions: PrimaryEmotion[] = ['happy', 'curious', 'anxious', 'angry', 'needs', 'calm', 'excited', 'safe'];
      expect(validEmotions).toContain(result.primaryEmotion);
    });

    it('应该返回非空的翻译文本', async () => {
      const audioData = new Float32Array(1000);
      const result = await emotionService.analyzeVoice(audioData);
      expect(result.translation).toBeTruthy();
      expect(typeof result.translation).toBe('string');
      expect(result.translation.length).toBeGreaterThan(0);
    });
  });

  describe('analyzeEmotion - 图像情感分析', () => {
    it('应该返回有效的图像分析结果', async () => {
      const imageData = {
        width: 100,
        height: 100,
        data: new Uint8ClampedArray(40000),
      } as ImageData;
      
      const result = await emotionService.analyzeEmotion(imageData);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('primaryEmotion');
      expect(result).toHaveProperty('translation');
      expect(result).toHaveProperty('confidence');
      expect(result.source).toBe('image');
    });

    it('置信度应该在0-100之间', async () => {
      const imageData = {
        width: 100,
        height: 100,
        data: new Uint8ClampedArray(40000),
      } as ImageData;
      
      for (let i = 0; i < 10; i++) {
        const result = await emotionService.analyzeEmotion(imageData);
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('getDashboard - 获取仪表盘数据', () => {
    it('应该返回有效的仪表盘数据', async () => {
      const dashboard = await emotionService.getDashboard();

      expect(dashboard).toHaveProperty('centralEmotion');
      expect(dashboard).toHaveProperty('intensity');
      expect(dashboard).toHaveProperty('confidence');
      expect(dashboard).toHaveProperty('dimensions');
      expect(dashboard).toHaveProperty('recentHistory');
      expect(dashboard).toHaveProperty('trends');

      expect(dashboard.dimensions).toHaveProperty('excitement');
      expect(dashboard.dimensions).toHaveProperty('anxiety');
      expect(dashboard.dimensions).toHaveProperty('affection');
      expect(dashboard.dimensions).toHaveProperty('curiosity');

      expect(['up', 'down', 'stable']).toContain(dashboard.trends.direction);
    });
  });

  describe('getEmotionDimensions - 获取情感维度', () => {
    it('应该返回四个情感维度', async () => {
      const dimensions = await emotionService.getEmotionDimensions();
      
      expect(dimensions).toHaveLength(4);
      expect(dimensions.every(d => d.value >= 0 && d.value <= 100)).toBe(true);
    });

    it('应该返回正确的维度名称', async () => {
      const dimensions = await emotionService.getEmotionDimensions();
      const names = dimensions.map(d => d.name);
      
      expect(names).toContain('excitement');
      expect(names).toContain('anxiety');
      expect(names).toContain('affection');
      expect(names).toContain('curiosity');
    });
  });

  describe('getWaveformData - 获取波形数据', () => {
    it('应该返回正确数量的样本', async () => {
      const duration = 5;
      const waveform = await emotionService.getWaveformData(duration);
      
      expect(waveform).toHaveLength(duration * 10);
    });

    it('波形数据应该在有效范围内', async () => {
      const waveform = await emotionService.getWaveformData(3);
      
      waveform.forEach(sample => {
        expect(sample.timestamp).toBeGreaterThanOrEqual(0);
        expect(sample.amplitude).toBeGreaterThanOrEqual(-0.5);
        expect(sample.amplitude).toBeLessThanOrEqual(1);
        expect(sample.frequency).toBeGreaterThanOrEqual(2);
        expect(sample.frequency).toBeLessThanOrEqual(6);
      });
    });
  });

  describe('getRecentAnalyses - 获取最近分析记录', () => {
    it('应该返回最近的分析记录', async () => {
      const limit = 5;
      const analyses = await emotionService.getRecentAnalyses(limit);
      
      expect(analyses.length).toBeLessThanOrEqual(limit);
      analyses.forEach(analysis => {
        expect(analysis).toHaveProperty('id');
        expect(analysis).toHaveProperty('primaryEmotion');
      });
    });

    it('应该按时间倒序排列', async () => {
      const analyses = await emotionService.getRecentAnalyses(10);
      
      for (let i = 0; i < analyses.length - 1; i++) {
        expect(new Date(analyses[i].createdAt).getTime()).toBeGreaterThanOrEqual(
          new Date(analyses[i + 1].createdAt).getTime()
        );
      }
    });
  });

  describe('getEmotionConfig - 获取情感配置', () => {
    it('应该返回正确的情感配置', () => {
      const config = emotionService.getEmotionConfig('happy');
      
      expect(config).toHaveProperty('emoji');
      expect(config).toHaveProperty('label');
      expect(config).toHaveProperty('color');
      expect(config.emoji).toBe('😸');
      expect(config.label).toBe('开心');
    });

    it('应该支持所有情感类型', () => {
      const emotions: PrimaryEmotion[] = ['happy', 'curious', 'anxious', 'angry', 'needs', 'calm', 'excited', 'safe'];
      
      emotions.forEach(emotion => {
        const config = emotionService.getEmotionConfig(emotion);
        expect(config).toBeDefined();
        expect(config.emoji).toBeTruthy();
        expect(config.label).toBeTruthy();
        expect(config.color).toBeTruthy();
      });
    });
  });
});