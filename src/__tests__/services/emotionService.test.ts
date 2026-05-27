import { describe, it, expect, vi } from 'vitest';
import { emotionService } from '@/services/emotionService';

describe('EmotionService', () => {
  describe('Initialization', () => {
    it('should initialize with mock data', async () => {
      const analyses = await emotionService.getRecentAnalyses(10);
      expect(analyses.length).toBeGreaterThanOrEqual(1);
    }, 10000);
  });

  describe('Voice Analysis', () => {
    it('should analyze voice and return valid emotion analysis', async () => {
      const audioData = new Float32Array(44100);
      for (let i = 0; i < audioData.length; i++) {
        audioData[i] = Math.random() * 2 - 1;
      }

      const result = await emotionService.analyzeVoice(audioData);

      expect(result.id).toBeDefined();
      expect(result.petId).toBe('1');
      expect(result.source).toBe('voice');
      expect(result.confidence).toBeGreaterThanOrEqual(75);
      expect(result.confidence).toBeLessThanOrEqual(99);
      expect(result.intensity).toBeGreaterThanOrEqual(50);
      expect(result.intensity).toBeLessThanOrEqual(100);
      expect(result.translation).toBeDefined();
      expect(result.context.timeContext).toBe('刚刚');
    }, 15000);

    it('should handle empty audio data gracefully', async () => {
      const audioData = new Float32Array(0);
      
      const result = await emotionService.analyzeVoice(audioData);

      expect(result.id).toBeDefined();
      expect(result.primaryEmotion).toBeDefined();
    }, 15000);

    it('should handle very short audio data', async () => {
      const audioData = new Float32Array(100);
      for (let i = 0; i < audioData.length; i++) {
        audioData[i] = Math.random() * 2 - 1;
      }

      const result = await emotionService.analyzeVoice(audioData);

      expect(result.id).toBeDefined();
      expect(result.source).toBe('voice');
    }, 15000);
  });

  describe('Image Analysis', () => {
    it('should analyze image and return valid emotion analysis', async () => {
      const imageData = {
        width: 640,
        height: 480,
        data: new Uint8ClampedArray(640 * 480 * 4),
      };

      const result = await emotionService.analyzeEmotion(imageData);

      expect(result.id).toBeDefined();
      expect(result.petId).toBe('1');
      expect(result.source).toBe('image');
      expect(result.confidence).toBeGreaterThanOrEqual(70);
      expect(result.confidence).toBeLessThanOrEqual(99);
    }, 15000);

    it('should handle different image sizes', async () => {
      const imageData = {
        width: 1920,
        height: 1080,
        data: new Uint8ClampedArray(1920 * 1080 * 4),
      };

      const result = await emotionService.analyzeEmotion(imageData);

      expect(result.id).toBeDefined();
    }, 15000);
  });

  describe('Dashboard', () => {
    it('should return dashboard with valid structure', async () => {
      const dashboard = await emotionService.getDashboard();

      expect(dashboard.centralEmotion).toBeDefined();
      expect(['happy', 'curious', 'calm', 'needs', 'anxious', 'angry', 'excited', 'safe']).toContain(dashboard.centralEmotion);
      expect(dashboard.intensity).toBeGreaterThanOrEqual(0);
      expect(dashboard.intensity).toBeLessThanOrEqual(100);
      expect(dashboard.confidence).toBeGreaterThanOrEqual(0);
      expect(dashboard.confidence).toBeLessThanOrEqual(100);
      expect(dashboard.dimensions).toBeDefined();
      expect(dashboard.dimensions.excitement).toBeDefined();
      expect(dashboard.dimensions.anxiety).toBeDefined();
      expect(dashboard.dimensions.affection).toBeDefined();
      expect(dashboard.dimensions.curiosity).toBeDefined();
      expect(dashboard.recentHistory).toBeDefined();
      expect(['up', 'down', 'stable']).toContain(dashboard.trends.direction);
    }, 10000);
  });

  describe('Emotion Dimensions', () => {
    it('should return valid emotion dimensions', async () => {
      const dimensions = await emotionService.getEmotionDimensions();

      expect(dimensions).toHaveLength(4);
      const names = dimensions.map(d => d.name);
      expect(names).toContain('excitement');
      expect(names).toContain('anxiety');
      expect(names).toContain('affection');
      expect(names).toContain('curiosity');

      dimensions.forEach(dim => {
        expect(dim.value).toBeGreaterThanOrEqual(0);
        expect(dim.value).toBeLessThanOrEqual(100);
        expect(dim.label).toBeDefined();
        expect(dim.icon).toBeDefined();
        expect(dim.color).toBeDefined();
      });
    }, 10000);
  });

  describe('Waveform Data', () => {
    it('should generate correct number of waveform samples', async () => {
      const duration = 10;
      const waveform = await emotionService.getWaveformData(duration);

      expect(waveform.length).toBe(duration * 10);
    }, 10000);

    it('should generate valid waveform values', async () => {
      const waveform = await emotionService.getWaveformData(5);

      waveform.forEach(sample => {
        expect(sample.timestamp).toBeDefined();
        expect(typeof sample.timestamp).toBe('number');
        expect(sample.amplitude).toBeDefined();
        expect(typeof sample.amplitude).toBe('number');
        expect(sample.frequency).toBeGreaterThanOrEqual(2);
        expect(sample.frequency).toBeLessThanOrEqual(6);
      });
    }, 10000);

    it('should handle default duration', async () => {
      const waveform = await emotionService.getWaveformData();

      expect(waveform.length).toBe(10 * 10);
    }, 10000);
  });

  describe('Recent Analyses', () => {
    it('should return limited number of analyses', async () => {
      const limit = 3;
      const analyses = await emotionService.getRecentAnalyses(limit);

      expect(analyses.length).toBeLessThanOrEqual(limit);
    }, 10000);

    it('should return all analyses when limit is higher than count', async () => {
      const analyses = await emotionService.getRecentAnalyses(100);

      expect(analyses.length).toBeGreaterThanOrEqual(1);
    }, 10000);
  });

  describe('Emotion Configuration', () => {
    it('should return correct config for each emotion', () => {
      const emotions = ['happy', 'curious', 'anxious', 'angry', 'needs', 'calm', 'excited', 'safe'] as const;
      
      emotions.forEach(emotion => {
        const config = emotionService.getEmotionConfig(emotion);
        expect(config).toBeDefined();
        expect(config.emoji).toBeDefined();
        expect(config.label).toBeDefined();
        expect(config.color).toBeDefined();
      });
    });

    it('should return valid color classes', () => {
      const config = emotionService.getEmotionConfig('happy');
      expect(config.color.startsWith('text-')).toBe(true);
    });
  });

  describe('Translation System', () => {
    it('should return valid translation for each emotion', async () => {
      const audioData = new Float32Array(44100);
      for (let i = 0; i < audioData.length; i++) {
        audioData[i] = Math.random() * 2 - 1;
      }

      const translations: Set<string> = new Set();
      
      for (let i = 0; i < 20; i++) {
        const result = await emotionService.analyzeVoice(audioData);
        translations.add(result.translation);
      }

      expect(translations.size).toBeGreaterThan(1);
    }, 30000);
  });
});