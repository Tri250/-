import { describe, it, expect, vi, beforeEach } from 'vitest';
import { emotionService } from '../../services/emotionService';
import type { PrimaryEmotion } from '../../types/emotion';

// Mock ImageData for jsdom environment
class MockImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4);
  }
}

// @ts-expect-error - Mock ImageData for test environment
globalThis.ImageData = MockImageData;

describe('EmotionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeVoice - 语音情感分析', () => {
    it('应该返回有效的分析结果', async () => {
      const audioData = new Float32Array(44100); // 1秒的音频数据
      for (let i = 0; i < audioData.length; i++) {
        audioData[i] = Math.sin(i * 0.1) * 0.5;
      }

      const result = await emotionService.analyzeVoice(audioData);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('petId');
      expect(result).toHaveProperty('primaryEmotion');
      expect(result).toHaveProperty('intensity');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('subEmotions');
      expect(result).toHaveProperty('translation');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('source');
      expect(result.source).toBe('voice');
    }, 10000);

    it('应该返回有效的情感类型', async () => {
      const audioData = new Float32Array(44100);
      for (let i = 0; i < audioData.length; i++) {
        audioData[i] = Math.sin(i * 0.1) * 0.5;
      }
      const result = await emotionService.analyzeVoice(audioData);

      const validEmotions: PrimaryEmotion[] = ['happy', 'curious', 'anxious', 'angry', 'needs', 'calm', 'excited', 'safe'];
      expect(validEmotions).toContain(result.primaryEmotion);
    }, 10000);

    it('置信度应该在合理范围内（高精度）', async () => {
      const audioData = new Float32Array(44100);
      for (let i = 0; i < audioData.length; i++) {
        audioData[i] = Math.sin(i * 0.05) * 0.3;
      }

      const result = await emotionService.analyzeVoice(audioData);
      expect(result.confidence).toBeGreaterThanOrEqual(60);
      expect(result.confidence).toBeLessThanOrEqual(99);
    }, 10000);

    it('强度应该在合理范围内', async () => {
      const audioData = new Float32Array(44100);
      for (let i = 0; i < audioData.length; i++) {
        audioData[i] = Math.sin(i * 0.1) * 0.5;
      }
      const result = await emotionService.analyzeVoice(audioData);

      expect(result.intensity).toBeGreaterThanOrEqual(0);
    }, 10000);

    it('应该包含详细分析信息', async () => {
      const audioData = new Float32Array(44100);
      for (let i = 0; i < audioData.length; i++) {
        audioData[i] = Math.sin(i * 0.1) * 0.5;
      }
      const result = await emotionService.analyzeVoice(audioData);

      expect(result.detail).toBeDefined();
      expect(result.detail?.primaryEmotion).toBe(result.primaryEmotion);
      expect(result.detail?.scores).toBeDefined();
      expect(result.detail?.confidenceLevel).toBeDefined();
      expect(result.detail?.reasoning).toBeDefined();
      expect(result.detail?.audioFeatures).toBeDefined();
      expect(result.detail?.behaviorIndicators).toBeDefined();
    }, 10000);

    it('应该包含上下文信息', async () => {
      const audioData = new Float32Array(44100);
      for (let i = 0; i < audioData.length; i++) {
        audioData[i] = Math.sin(i * 0.1) * 0.5;
      }
      const result = await emotionService.analyzeVoice(audioData);

      expect(result.context).toBeDefined();
      expect(result.context.timeContext).toBeDefined();
      expect(result.context.locationContext).toBeDefined();
    }, 10000);

    it('应该处理不同频率的音频数据', async () => {
      const highFreqAudio = new Float32Array(44100);
      for (let i = 0; i < highFreqAudio.length; i++) {
        highFreqAudio[i] = Math.sin(i * 0.5) * 0.8;
      }

      const result = await emotionService.analyzeVoice(highFreqAudio);
      expect(result).toHaveProperty('primaryEmotion');
      expect(result).toHaveProperty('confidence');
    }, 10000);

    it('应该处理低振幅音频', async () => {
      const lowAmplitudeAudio = new Float32Array(44100);
      for (let i = 0; i < lowAmplitudeAudio.length; i++) {
        lowAmplitudeAudio[i] = Math.sin(i * 0.1) * 0.05;
      }

      const result = await emotionService.analyzeVoice(lowAmplitudeAudio);
      expect(result).toHaveProperty('primaryEmotion');
      expect(result).toHaveProperty('confidence');
    }, 10000);

    it('应该处理静音音频', async () => {
      const silentAudio = new Float32Array(44100);
      const result = await emotionService.analyzeVoice(silentAudio);

      expect(result).toHaveProperty('primaryEmotion');
      expect(result).toHaveProperty('confidence');
    }, 10000);
  });

  describe('analyzeEmotion - 图像情感分析', () => {
    it('应该返回有效的图像分析结果', async () => {
      const imageData = new MockImageData(100, 100) as ImageData;
      const result = await emotionService.analyzeEmotion(imageData);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('primaryEmotion');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('source');
      expect(result.source).toBe('image');
    }, 10000);

    it('图像分析应该包含详细推理', async () => {
      const imageData = new MockImageData(100, 100) as ImageData;
      const result = await emotionService.analyzeEmotion(imageData);

      expect(result.detail?.reasoning).toBeDefined();
      expect(result.detail?.reasoning.length).toBeGreaterThan(0);
      expect(result.detail?.reasoning[0]).toContain('图像');
    }, 10000);
  });

  describe('analyzeImageFile - 文件图像分析', () => {
    it('应该能调用 analyzeImageFile 方法', () => {
      // 验证方法存在
      expect(emotionService.analyzeImageFile).toBeDefined();
      expect(typeof emotionService.analyzeImageFile).toBe('function');
    });
  });

  describe('getDashboard - 获取仪表板数据', () => {
    it('应该返回有效的仪表板数据', async () => {
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

    it('趋势应该包含方向和变化', async () => {
      const dashboard = await emotionService.getDashboard();

      expect(dashboard.trends).toHaveProperty('direction');
      expect(dashboard.trends).toHaveProperty('change');
      expect(['up', 'down', 'stable']).toContain(dashboard.trends.direction);
    });
  });

  describe('getEmotionDimensions - 获取情感维度', () => {
    it('应该返回情感维度列表', async () => {
      const dimensions = await emotionService.getEmotionDimensions();

      expect(Array.isArray(dimensions)).toBe(true);
      expect(dimensions.length).toBeGreaterThan(0);
    });

    it('每个维度应该包含正确的属性', async () => {
      const dimensions = await emotionService.getEmotionDimensions();

      dimensions.forEach(dim => {
        expect(dim).toHaveProperty('name');
        expect(dim).toHaveProperty('value');
        expect(dim).toHaveProperty('label');
        expect(dim).toHaveProperty('icon');
        expect(dim).toHaveProperty('color');
      });
    });
  });

  describe('getWaveformData - 获取波形数据', () => {
    it('应该返回波形数据', async () => {
      const waveform = await emotionService.getWaveformData(5);

      expect(Array.isArray(waveform)).toBe(true);
      expect(waveform.length).toBe(50);
    });

    it('波形数据应该包含正确的属性', async () => {
      const waveform = await emotionService.getWaveformData(2);

      waveform.forEach(point => {
        expect(point).toHaveProperty('timestamp');
        expect(point).toHaveProperty('amplitude');
        expect(point).toHaveProperty('frequency');
      });
    });

    it('应该支持不同的持续时间', async () => {
      const shortWaveform = await emotionService.getWaveformData(3);
      const longWaveform = await emotionService.getWaveformData(10);

      expect(longWaveform.length).toBeGreaterThan(shortWaveform.length);
    });
  });

  describe('getRecentAnalyses - 获取最近分析', () => {
    it('应该返回最近的分析记录', async () => {
      const analyses = await emotionService.getRecentAnalyses(5);

      expect(Array.isArray(analyses)).toBe(true);
    });

    it('应该支持限制数量', async () => {
      const analyses = await emotionService.getRecentAnalyses(3);
      expect(analyses.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getEmotionConfig - 获取情感配置', () => {
    it('应该返回有效的情感配置', () => {
      const emotions: PrimaryEmotion[] = ['happy', 'curious', 'anxious', 'angry', 'needs', 'calm', 'excited', 'safe'];

      emotions.forEach(emotion => {
        const config = emotionService.getEmotionConfig(emotion);
        expect(config).toBeDefined();
        expect(config).toHaveProperty('label');
        expect(config).toHaveProperty('color');
        expect(config).toHaveProperty('emoji');
        expect(config).toHaveProperty('description');
      });
    });

    it('应该返回正确的颜色配置', () => {
      const happyConfig = emotionService.getEmotionConfig('happy');
      expect(happyConfig.color).toBeDefined();

      const anxiousConfig = emotionService.getEmotionConfig('anxious');
      expect(anxiousConfig.color).toBeDefined();
    });
  });

  describe('情感分析一致性', () => {
    it('多次分析应该返回一致的结构', async () => {
      const audioData = new Float32Array(8192);
      for (let i = 0; i < audioData.length; i++) {
        audioData[i] = Math.sin(i * 0.1) * 0.5;
      }

      const results = await Promise.all([
        emotionService.analyzeVoice(audioData),
        emotionService.analyzeVoice(audioData),
        emotionService.analyzeVoice(audioData),
      ]);

      results.forEach(result => {
        expect(result).toHaveProperty('primaryEmotion');
        expect(result).toHaveProperty('confidence');
        expect(result).toHaveProperty('intensity');
        expect(result).toHaveProperty('detail');
      });
    }, 30000);
  });
});
