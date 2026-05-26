import { describe, it, expect, vi, beforeEach } from 'vitest';
import { emotionService } from '../../services/emotionService';
import type { PrimaryEmotion } from '../../types/emotion';

describe('EmotionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeVoice - 语音情感分析', () => {
    it('应该返回有效的分析结果', async () => {
      const audioData = new Float32Array(1024);
      const result = await emotionService.analyzeVoice(audioData);
      
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('primaryEmotion');
      expect(result).toHaveProperty('translation');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('intensity');
      expect(result).toHaveProperty('subEmotions');
      expect(result).toHaveProperty('context');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('source');
    });

    it('应该返回有效的情感类型', async () => {
      const audioData = new Float32Array(1024);
      const result = await emotionService.analyzeVoice(audioData);
      
      const validEmotions: PrimaryEmotion[] = ['happy', 'curious', 'anxious', 'angry', 'needs', 'calm', 'excited', 'safe'];
      expect(validEmotions).toContain(result.primaryEmotion);
    });

    it('置信度应该在0-100之间', async () => {
      const audioData = new Float32Array(1024);
      const result = await emotionService.analyzeVoice(audioData);
      
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });

    it('强度应该在0-100之间', async () => {
      const audioData = new Float32Array(1024);
      const result = await emotionService.analyzeVoice(audioData);
      
      expect(result.intensity).toBeGreaterThanOrEqual(0);
      expect(result.intensity).toBeLessThanOrEqual(100);
    });

    it('应该设置正确的来源类型', async () => {
      const audioData = new Float32Array(1024);
      const result = await emotionService.analyzeVoice(audioData);
      
      expect(result.source).toBe('voice');
    });

    it('应该包含上下文信息', async () => {
      const audioData = new Float32Array(1024);
      const result = await emotionService.analyzeVoice(audioData);
      
      expect(result.context).toHaveProperty('timeContext');
      expect(result.context).toHaveProperty('locationContext');
    });
  });

  describe('analyzeEmotion - 图像情感分析', () => {
    it('应该返回有效的图像分析结果', async () => {
      const imageData = { 
        width: 100, 
        height: 100, 
        data: new Uint8ClampedArray(40000),
        colorSpace: 'srgb' as const
      };
      const result = await emotionService.analyzeEmotion(imageData as unknown as ImageData);
      
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('primaryEmotion');
      expect(result).toHaveProperty('translation');
      expect(result).toHaveProperty('confidence');
    });

    it('应该设置正确的来源类型', async () => {
      const imageData = { 
        width: 100, 
        height: 100, 
        data: new Uint8ClampedArray(40000),
        colorSpace: 'srgb' as const
      };
      const result = await emotionService.analyzeEmotion(imageData as unknown as ImageData);
      
      expect(result.source).toBe('image');
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
    });

    it('维度应该包含正确的属性', async () => {
      const dashboard = await emotionService.getDashboard();
      
      expect(dashboard.dimensions).toHaveProperty('excitement');
      expect(dashboard.dimensions).toHaveProperty('anxiety');
      expect(dashboard.dimensions).toHaveProperty('affection');
      expect(dashboard.dimensions).toHaveProperty('curiosity');
    });

    it('趋势方向应该是有效的值', async () => {
      const dashboard = await emotionService.getDashboard();
      
      expect(['up', 'down', 'stable']).toContain(dashboard.trends.direction);
    });
  });

  describe('getEmotionDimensions - 获取情感维度', () => {
    it('应该返回情感维度列表', async () => {
      const dimensions = await emotionService.getEmotionDimensions();
      
      expect(Array.isArray(dimensions)).toBe(true);
      expect(dimensions.length).toBe(4);
    });

    it('维度应该包含正确的属性', async () => {
      const dimensions = await emotionService.getEmotionDimensions();
      const dimension = dimensions[0];
      
      expect(dimension).toHaveProperty('name');
      expect(dimension).toHaveProperty('value');
      expect(dimension).toHaveProperty('label');
      expect(dimension).toHaveProperty('icon');
      expect(dimension).toHaveProperty('color');
    });

    it('维度值应该在0-100之间', async () => {
      const dimensions = await emotionService.getEmotionDimensions();
      
      dimensions.forEach(dim => {
        expect(dim.value).toBeGreaterThanOrEqual(0);
        expect(dim.value).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('getWaveformData - 获取波形数据', () => {
    it('应该返回正确数量的波形样本', async () => {
      const waveform = await emotionService.getWaveformData(5);
      
      expect(waveform.length).toBe(50);
    });

    it('波形数据应该包含正确的属性', async () => {
      const waveform = await emotionService.getWaveformData(1);
      const sample = waveform[0];
      
      expect(sample).toHaveProperty('timestamp');
      expect(sample).toHaveProperty('amplitude');
      expect(sample).toHaveProperty('frequency');
    });
  });

  describe('getRecentAnalyses - 获取最近分析记录', () => {
    it('应该返回分析记录列表', async () => {
      const analyses = await emotionService.getRecentAnalyses();
      
      expect(Array.isArray(analyses)).toBe(true);
    });

    it('应该支持限制返回数量', async () => {
      const analyses = await emotionService.getRecentAnalyses(3);
      
      expect(analyses.length).toBeLessThanOrEqual(3);
    });

    it('新分析应该排在前面', async () => {
      const audioData = new Float32Array(1024);
      const newAnalysis = await emotionService.analyzeVoice(audioData);
      
      const analyses = await emotionService.getRecentAnalyses();
      expect(analyses[0].id).toBe(newAnalysis.id);
    });
  });

  describe('getEmotionConfig - 获取情感配置', () => {
    it('应该返回所有情感类型的配置', () => {
      const emotions: PrimaryEmotion[] = ['happy', 'curious', 'anxious', 'angry', 'needs', 'calm', 'excited', 'safe'];
      
      emotions.forEach(emotion => {
        const config = emotionService.getEmotionConfig(emotion);
        expect(config).toHaveProperty('emoji');
        expect(config).toHaveProperty('label');
        expect(config).toHaveProperty('color');
      });
    });

    it('应该返回正确的emoji', () => {
      const happyConfig = emotionService.getEmotionConfig('happy');
      expect(happyConfig.emoji).toBe('😸');
      
      const calmConfig = emotionService.getEmotionConfig('calm');
      expect(calmConfig.emoji).toBe('😌');
    });
  });
});