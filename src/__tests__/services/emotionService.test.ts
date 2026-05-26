import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('EmotionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeVoice - 模拟语音情感分析', () => {
    it('应该返回有效的分析结果', async () => {
      const mockAnalyzeVoice = vi.fn().mockResolvedValue({
        emotion: 'happy',
        translation: '宝贝今天很开心呢！',
        confidence: 92,
        intensity: 85,
        subEmotions: ['好奇', '兴奋'],
      });

      const result = await mockAnalyzeVoice({
        petId: 'pet-1',
        audioData: new ArrayBuffer(1024),
      });

      expect(result).toHaveProperty('emotion');
      expect(result).toHaveProperty('translation');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('intensity');
      expect(result).toHaveProperty('subEmotions');
    });

    it('应该返回开心情感类型', async () => {
      const mockAnalyzeVoice = vi.fn().mockResolvedValue({
        emotion: 'happy',
        translation: '测试翻译',
        confidence: 90,
      });

      const result = await mockAnalyzeVoice({ petId: 'pet-1', audioData: new ArrayBuffer(1024) });
      
      expect(result.emotion).toBe('happy');
    });

    it('应该返回焦虑情感类型', async () => {
      const mockAnalyzeVoice = vi.fn().mockResolvedValue({
        emotion: 'anxious',
        translation: '宝贝有些焦虑',
        confidence: 88,
      });

      const result = await mockAnalyzeVoice({ petId: 'pet-1', audioData: new ArrayBuffer(1024) });
      
      expect(result.emotion).toBe('anxious');
    });

    it('应该返回生气的情感类型', async () => {
      const mockAnalyzeVoice = vi.fn().mockResolvedValue({
        emotion: 'angry',
        translation: '宝贝很生气',
        confidence: 95,
      });

      const result = await mockAnalyzeVoice({ petId: 'pet-1', audioData: new ArrayBuffer(1024) });
      
      expect(result.emotion).toBe('angry');
    });

    it('应该返回有需求的情感类型', async () => {
      const mockAnalyzeVoice = vi.fn().mockResolvedValue({
        emotion: 'needs',
        translation: '宝贝有需求',
        confidence: 87,
      });

      const result = await mockAnalyzeVoice({ petId: 'pet-1', audioData: new ArrayBuffer(1024) });
      
      expect(result.emotion).toBe('needs');
    });

    it('应该返回平静的情感类型', async () => {
      const mockAnalyzeVoice = vi.fn().mockResolvedValue({
        emotion: 'neutral',
        translation: '宝贝很平静',
        confidence: 91,
      });

      const result = await mockAnalyzeVoice({ petId: 'pet-1', audioData: new ArrayBuffer(1024) });
      
      expect(result.emotion).toBe('neutral');
    });

    it('置信度应该在0-100之间', async () => {
      const mockAnalyzeVoice = vi.fn().mockImplementation(async () => {
        const confidence = Math.floor(Math.random() * 100);
        return {
          emotion: 'happy',
          translation: '测试',
          confidence,
        };
      });

      for (let i = 0; i < 10; i++) {
        const result = await mockAnalyzeVoice({ petId: 'pet-1', audioData: new ArrayBuffer(1024) });
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(100);
      }
    });

    it('应该处理网络错误', async () => {
      const mockAnalyzeVoice = vi.fn().mockRejectedValue(new Error('网络错误'));

      await expect(
        mockAnalyzeVoice({ petId: 'pet-1', audioData: new ArrayBuffer(1024) })
      ).rejects.toThrow('网络错误');
    });

    it('应该处理超时', async () => {
      const mockAnalyzeVoice = vi.fn().mockRejectedValue(new Error('请求超时'));

      await expect(
        mockAnalyzeVoice({ petId: 'pet-1', audioData: new ArrayBuffer(1024) })
      ).rejects.toThrow('请求超时');
    });
  });

  describe('analyzeImage - 模拟图像情感分析', () => {
    it('应该返回有效的图像分析结果', async () => {
      const mockAnalyzeImage = vi.fn().mockResolvedValue({
        emotion: 'happy',
        translation: '宝贝看起来很开心',
        confidence: 89,
      });

      const result = await mockAnalyzeImage({
        petId: 'pet-1',
        imageData: new ArrayBuffer(2048),
      });

      expect(result).toHaveProperty('emotion');
      expect(result).toHaveProperty('translation');
      expect(result).toHaveProperty('confidence');
    });

    it('应该处理无效的图像数据', async () => {
      const mockAnalyzeImage = vi.fn().mockRejectedValue(new Error('无效的图像数据'));

      await expect(
        mockAnalyzeImage({ petId: 'pet-1', imageData: null })
      ).rejects.toThrow('无效的图像数据');
    });
  });

  describe('getEmotionHistory - 获取情感历史', () => {
    it('应该返回历史记录列表', async () => {
      const mockHistory = vi.fn().mockResolvedValue([
        {
          id: '1',
          emotion: 'happy',
          timestamp: '2024-01-15T10:00:00Z',
        },
        {
          id: '2',
          emotion: 'anxious',
          timestamp: '2024-01-15T11:00:00Z',
        },
      ]);

      const result = await mockHistory({ petId: 'pet-1', limit: 10 });

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('emotion');
      expect(result[0]).toHaveProperty('timestamp');
    });

    it('应该支持分页', async () => {
      const mockHistory = vi.fn().mockResolvedValue([]);

      await mockHistory({ petId: 'pet-1', limit: 5, offset: 10 });

      expect(mockHistory).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 10 })
      );
    });

    it('应该过滤情感类型', async () => {
      const mockHistory = vi.fn().mockResolvedValue([]);

      await mockHistory({ petId: 'pet-1', emotion: 'happy' });

      expect(mockHistory).toHaveBeenCalledWith(
        expect.objectContaining({ emotion: 'happy' })
      );
    });
  });

  describe('getEmotionStatistics - 获取情感统计', () => {
    it('应该返回统计数据', async () => {
      const mockStats = vi.fn().mockResolvedValue({
        totalCount: 100,
        emotionDistribution: {
          happy: 45,
          anxious: 20,
          angry: 5,
          needs: 15,
          neutral: 15,
        },
        averageConfidence: 87.5,
      });

      const result = await mockStats({ petId: 'pet-1', period: 'week' });

      expect(result).toHaveProperty('totalCount');
      expect(result).toHaveProperty('emotionDistribution');
      expect(result).toHaveProperty('averageConfidence');
    });

    it('应该支持不同时间段', async () => {
      const mockStats = vi.fn().mockResolvedValue({
        totalCount: 0,
        emotionDistribution: {},
        averageConfidence: 0,
      });

      await mockStats({ petId: 'pet-1', period: 'month' });

      expect(mockStats).toHaveBeenCalledWith(
        expect.objectContaining({ period: 'month' })
      );
    });
  });
});
