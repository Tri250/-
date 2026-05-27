import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { emotionService } from '@/services/emotionService';
import { useAppStore } from '@/store/appStore';

describe('Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Response Time', () => {
    it('should analyze voice within acceptable time', async () => {
      const audioData = new Float32Array(1000);
      const start = performance.now();
      
      await emotionService.analyzeVoice(audioData);
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(2000);
    });

    it('should get dashboard quickly', async () => {
      const start = performance.now();
      
      await emotionService.getDashboard('1');
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(1000);
    });

    it('should handle multiple concurrent analyses', async () => {
      const audioData1 = new Float32Array(1000);
      const audioData2 = new Float32Array(1500);
      const audioData3 = new Float32Array(800);
      
      const start = performance.now();
      
      await Promise.all([
        emotionService.analyzeVoice(audioData1),
        emotionService.analyzeVoice(audioData2),
        emotionService.analyzeVoice(audioData3),
      ]);
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(4000);
    });

    it('should get emotion dimensions quickly', async () => {
      const start = performance.now();
      
      emotionService.getEmotionDimensions();
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(500);
    });

    it('should get recent analyses quickly', async () => {
      const start = performance.now();
      
      await emotionService.getRecentAnalyses('1', 10);
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('State Management Performance', () => {
    it('should update state efficiently', () => {
      const store = useAppStore.getState();
      const start = performance.now();
      
      for (let i = 0; i < 100; i++) {
        store.setHealthScore(Math.floor(Math.random() * 100));
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should add multiple pets efficiently', () => {
      const store = useAppStore.getState();
      const start = performance.now();
      
      for (let i = 0; i < 20; i++) {
        store.addPet({
          name: `Pet ${i}`,
          breed: 'Test Breed',
          age: 1,
          avatarUrl: '',
          type: 'cat',
        });
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(200);
    });

    it('should add multiple analyses efficiently', () => {
      const store = useAppStore.getState();
      const start = performance.now();
      
      for (let i = 0; i < 50; i++) {
        store.addAnalysis({
          petId: '1',
          type: 'voice',
          result: {
            emotion: 'happy',
            translation: '开心',
            confidence: 90,
          },
        });
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(300);
    });
  });

  describe('Memory Efficiency', () => {
    it('should maintain stable memory usage with repeated operations', () => {
      const store = useAppStore.getState();
      const initialPetsLength = store.pets.length;
      
      for (let i = 0; i < 10; i++) {
        store.addPet({
          name: `Temp Pet ${i}`,
          breed: 'Temp',
          age: 1,
          avatarUrl: '',
          type: 'cat',
        });
      }
      
      const finalPetsLength = useAppStore.getState().pets.length;
      expect(finalPetsLength).toBe(initialPetsLength + 10);
    });
  });

  describe('API Concurrency', () => {
    it('should handle concurrent API calls', async () => {
      const start = performance.now();
      
      await Promise.all([
        emotionService.getRecentAnalyses('1', 5),
        emotionService.getDashboard('1'),
        emotionService.getEmotionDimensions(),
      ]);
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(2000);
    });
  });
});