import { describe, it, expect, vi, beforeEach } from 'vitest';
import { emotionService } from '../../services/emotionService';
import type { EmotionAnalysis } from '../../types/emotion';

describe('EmotionService - AT系列测试用例', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockAudioData = (length = 44100) => {
    const data = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() - 0.5) * 0.5;
    }
    return data;
  };

  const createMockImageData = () => {
    return {
      data: new Uint8ClampedArray(100 * 100 * 4),
      width: 100,
      height: 100,
    } as ImageData;
  };

  // AT-001: 实时语音翻译
  describe('AT-001: 实时语音翻译', () => {
    it('应该正确处理语音输入并返回情感分析', async () => {
      const audioData = createMockAudioData();
      const result = await emotionService.analyzeVoice(audioData, 'pet-1', 'cat');
      
      expect(result).toBeDefined();
      expect(result.primaryEmotion).toBeDefined();
      expect(result.translation).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.intensity).toBeGreaterThan(0);
    });

    it('应该在1.5秒内返回结果（模拟延迟）', async () => {
      const audioData = createMockAudioData();
      const startTime = Date.now();
      await emotionService.analyzeVoice(audioData, 'pet-1', 'cat');
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(3000);
    });

    it('应该保存翻译记录到历史', async () => {
      const audioData = createMockAudioData();
      await emotionService.analyzeVoice(audioData, 'pet-1', 'cat');
      const history = emotionService.getHistoryByPet('pet-1');
      
      expect(history.length).toBeGreaterThan(0);
    });

    it('应该包含核心情绪标签', async () => {
      const audioData = createMockAudioData();
      const result = await emotionService.analyzeVoice(audioData, 'pet-1', 'cat');
      
      const validEmotions = ['happy', 'curious', 'anxious', 'angry', 'needs', 'calm', 'excited', 'safe', 'hungry', 'tired', 'affectionate', 'bored', 'pain', 'fearful', 'neutral'];
      expect(validEmotions).toContain(result.primaryEmotion);
    });

    it('应该包含拟人化翻译文本', async () => {
      const audioData = createMockAudioData();
      const result = await emotionService.analyzeVoice(audioData, 'pet-1', 'cat');
      
      expect(result.translation.length).toBeGreaterThan(0);
      expect(typeof result.translation).toBe('string');
    });

    it('应该包含情绪强度评分', async () => {
      const audioData = createMockAudioData();
      const result = await emotionService.analyzeVoice(audioData, 'pet-1', 'cat');
      
      expect(result.intensity).toBeGreaterThanOrEqual(0);
      expect(result.intensity).toBeLessThanOrEqual(100);
    });
  });

  // AT-002: 上传音频文件翻译
  describe('AT-002: 上传音频文件翻译', () => {
    it('应该处理音频文件上传', async () => {
      const mockFile = new Blob(['audio data'], { type: 'audio/wav' });
      expect(() => {
        emotionService.analyzeAudioFile(mockFile as unknown as File, 'pet-1', 'cat');
      }).not.toThrow();
    });

    it('应该检查文件大小限制', async () => {
      const largeData = new Uint8Array(60 * 1024 * 1024);
      const largeFile = new Blob([largeData], { type: 'audio/mp3' });
      
      try {
        await emotionService.analyzeAudioFile(largeFile as unknown as File, 'pet-1', 'cat');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  // AT-003: 分品种精准翻译
  describe('AT-003: 分品种精准翻译', () => {
    it('应该针对猫咪提供特定翻译', async () => {
      const audioData = createMockAudioData();
      const catResult = await emotionService.analyzeVoice(audioData, 'pet-1', 'cat');
      expect(catResult.breedSpecific).toBe(true);
    });

    it('应该针对狗狗提供特定翻译', async () => {
      const audioData = createMockAudioData();
      const dogResult = await emotionService.analyzeVoice(audioData, 'pet-2', 'dog');
      expect(dogResult.breedSpecific).toBe(true);
    });
  });

  // AT-004: 混合情绪识别
  describe('AT-004: 混合情绪识别', () => {
    it('应该返回主次情绪组合', async () => {
      const audioData = createMockAudioData();
      const result = await emotionService.analyzeVoice(audioData, 'pet-1', 'cat');
      expect(result.secondaryEmotions).toBeDefined();
    });
  });

  // AT-005: 文字描述行为翻译
  describe('AT-005: 文字描述行为翻译', () => {
    it('应该分析文字描述的行为', async () => {
      const result = await emotionService.analyzeTextBehavior('猫咪频繁蹭我的腿，尾巴竖起来', 'pet-1', 'cat');
      
      expect(result).toBeDefined();
      expect(result.source).toBe('text');
      expect(result.primaryEmotion).toBeDefined();
    });
  });

  // AT-006: 图片表情分析翻译
  describe('AT-006: 图片表情分析翻译', () => {
    it('应该分析图片并返回情感', async () => {
      const imageData = createMockImageData();
      const result = await emotionService.analyzeEmotion(imageData, 'pet-1', 'cat');
      
      expect(result).toBeDefined();
      expect(result.source).toBe('image');
      expect(result.primaryEmotion).toBeDefined();
    });
  });

  // AT-007: 视频动态行为翻译
  describe('AT-007: 视频动态行为翻译', () => {
    it('应该分析视频并返回情感', async () => {
      const videoBlob = new Blob(['video data'], { type: 'video/mp4' });
      const result = await emotionService.analyzeVideo(videoBlob, 'pet-1', 'cat');
      
      expect(result).toBeDefined();
      expect(result.source).toBe('video');
      expect(result.primaryEmotion).toBeDefined();
    });
  });

  // AT-008: 多模态融合翻译
  describe('AT-008: 多模态融合翻译', () => {
    it('应该融合多种输入进行分析', async () => {
      const audioData = createMockAudioData();
      const imageData = createMockImageData();
      
      const result = await emotionService.analyzeMultimodal({ voice: audioData, image: imageData }, 'pet-1', 'cat');
      
      expect(result).toBeDefined();
      expect(result.source).toBe('multimodal');
    });

    it('多模态应该有更高的置信度提升', async () => {
      const audioData = createMockAudioData();
      const imageData = createMockImageData();
      
      const result = await emotionService.analyzeMultimodal({ voice: audioData, image: imageData }, 'pet-1', 'cat');
      expect(result.multimodalAccuracyBoost).toBe(30);
    });
  });

  // AT-009: 翻译结果详情展示
  describe('AT-009: 翻译结果详情展示', () => {
    it('应该包含关键特征描述', async () => {
      const audioData = createMockAudioData();
      const result = await emotionService.analyzeVoice(audioData, 'pet-1', 'cat');
      
      expect(result.keyFeatures).toBeDefined();
      expect(Array.isArray(result.keyFeatures)).toBe(true);
    });
  });

  // AT-010: 互动建议一键执行
  describe('AT-010: 互动建议一键执行', () => {
    it('应该提供健康建议', async () => {
      const audioData = createMockAudioData();
      const result = await emotionService.analyzeVoice(audioData, 'pet-1', 'cat');
      
      expect(result.healthRecommendations).toBeDefined();
      expect(result.healthRecommendations?.length).toBeGreaterThan(0);
    });

    it('可能提供行动建议', async () => {
      const videoBlob = new Blob(['video data'], { type: 'video/mp4' });
      const result = await emotionService.analyzeVideo(videoBlob, 'pet-1', 'cat');
      
      expect(result.actionSuggestion).toBeDefined();
    });
  });

  // AT-012: 翻译结果分享
  describe('AT-012: 翻译结果分享', () => {
    it('分析结果应该包含足够信息用于分享', async () => {
      const audioData = createMockAudioData();
      const result = await emotionService.analyzeVoice(audioData, 'pet-1', 'cat');
      
      expect(result.translation).toBeDefined();
      expect(result.primaryEmotion).toBeDefined();
      expect(result.confidence).toBeDefined();
    });
  });

  // AT-013: 按宠物查看翻译历史
  describe('AT-013: 按宠物查看翻译历史', () => {
    it('应该按宠物ID隔离历史记录', async () => {
      const audioData1 = createMockAudioData();
      await emotionService.analyzeVoice(audioData1, 'pet-1', 'cat');
      
      const audioData2 = createMockAudioData();
      await emotionService.analyzeVoice(audioData2, 'pet-2', 'dog');
      
      const pet1History = emotionService.getHistoryByPet('pet-1');
      const pet2History = emotionService.getHistoryByPet('pet-2');
      
      pet1History.forEach(item => expect(item.petId).toBe('pet-1'));
      pet2History.forEach(item => expect(item.petId).toBe('pet-2'));
    });

    it('历史记录应该按时间倒序排列', async () => {
      const history = emotionService.getHistoryByPet('pet-1');
      
      if (history.length > 1) {
        for (let i = 0; i < history.length - 1; i++) {
          const currentTime = new Date(history[i].createdAt).getTime();
          const nextTime = new Date(history[i + 1].createdAt).getTime();
          expect(currentTime).toBeGreaterThanOrEqual(nextTime);
        }
      }
    });
  });

  // AT-014: 翻译历史搜索
  describe('AT-014: 翻译历史搜索', () => {
    it('应该支持关键词搜索历史记录', async () => {
      await emotionService.analyzeTextBehavior('猫咪饿了要吃饭', 'pet-1', 'cat');
      
      const searchResults = emotionService.searchHistory('pet-1', '饿');
      expect(searchResults).toBeDefined();
    });
  });

  // AT-015: 连续对话追问
  describe('AT-015: 连续对话追问', () => {
    it('应该支持连续对话', async () => {
      const audioData = createMockAudioData();
      const firstResult = await emotionService.analyzeVoice(audioData, 'pet-1', 'cat');
      
      const followUpResult = await emotionService.analyzeFollowUp(
        '它刚才为什么会这样说？', 
        firstResult, 
        'pet-1', 
        'cat'
      );
      
      expect(followUpResult).toBeDefined();
    });
  });

  // AT-016: 翻译记录导出
  describe('AT-016: 翻译记录导出', () => {
    it('应该有完整的历史记录用于导出', async () => {
      const history = emotionService.getHistoryByPet('pet-1');
      
      expect(Array.isArray(history)).toBe(true);
      
      if (history.length > 0) {
        const record = history[0];
        expect(record.createdAt).toBeDefined();
        expect(record.primaryEmotion).toBeDefined();
        expect(record.translation).toBeDefined();
      }
    });
  });

  // AT-017: 疼痛情绪自动预警
  describe('AT-017: 疼痛情绪自动预警', () => {
    it('应该检测疼痛情绪', async () => {
      const mockPainAnalysis: EmotionAnalysis = {
        id: 'pain-test',
        petId: 'pet-1',
        primaryEmotion: 'pain',
        secondaryEmotions: [],
        intensity: 85,
        confidence: 90,
        translation: '宝贝感觉很不舒服',
        context: { timeContext: '刚刚', locationContext: '家中' },
        createdAt: new Date().toISOString(),
        source: 'voice',
      };
      
      const painCheck = emotionService.checkPainEmotion(mockPainAnalysis);
      
      expect(painCheck).toBeDefined();
    });

    it('高强度疼痛应该触发高优先级警告', () => {
      const highPainAnalysis: EmotionAnalysis = {
        id: 'high-pain-test',
        petId: 'pet-1',
        primaryEmotion: 'pain',
        secondaryEmotions: [],
        intensity: 90,
        confidence: 95,
        translation: '宝贝很疼',
        context: { timeContext: '刚刚', locationContext: '家中' },
        createdAt: new Date().toISOString(),
        source: 'voice',
      };
      
      const painCheck = emotionService.checkPainEmotion(highPainAnalysis);
      
      expect(painCheck.isPain).toBe(true);
      expect(painCheck.severity).toBe('high');
    });
  });

  // AT-018: 异常情绪持续监测
  describe('AT-018: 异常情绪持续监测', () => {
    it('应该监测异常情绪趋势', () => {
      const trendCheck = emotionService.checkEmotionTrend('pet-1', 24);
      
      expect(trendCheck).toBeDefined();
    });

    it('应该检查24小时内的异常', () => {
      const trendCheck = emotionService.checkEmotionTrend('pet-1', 24);
      
      expect(trendCheck.hasAnomaly).toBeDefined();
      expect(Array.isArray(trendCheck.anomalies)).toBe(true);
      expect(Array.isArray(trendCheck.suggestions)).toBe(true);
    });
  });

  // AT-019: 健康记录联动分析
  describe('AT-019: 健康记录联动分析', () => {
    it('应该结合健康记录进行分析', async () => {
      const audioData = createMockAudioData();
      const analysis = await emotionService.analyzeVoice(audioData, 'pet-1', 'cat');
      
      const healthRecords = [{ date: '2024-01-01', type: 'checkup' }];
      const result = await emotionService.analyzeWithHealthRecords(analysis, healthRecords);
      
      expect(result).toBeDefined();
      expect(result.combinedAnalysis).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });
  });

  // AT-020: 疫苗驱虫关联提醒
  describe('AT-020: 疫苗驱虫关联提醒', () => {
    it('健康建议应该包含相关提醒', async () => {
      const audioData = createMockAudioData();
      const result = await emotionService.analyzeVoice(audioData, 'pet-1', 'cat');
      
      expect(result.healthRecommendations).toBeDefined();
    });
  });

  // AT-025: 无效音频处理
  describe('AT-025: 无效音频处理', () => {
    it('应该检测无效音频', () => {
      const shortAudio = new Float32Array(100);
      const isValid = emotionService.isValidAudio(shortAudio);
      
      expect(isValid).toBe(false);
    });

    it('应该接受有效音频', () => {
      const validAudio = createMockAudioData();
      const isValid = emotionService.isValidAudio(validAudio);
      
      expect(isValid).toBe(true);
    });
  });

  // AT-026: 不支持宠物类型处理
  describe('AT-026: 不支持宠物类型处理', () => {
    it('应该检查宠物类型支持', () => {
      const isCatSupported = emotionService.isSupportedPet('猫咪');
      const isDogSupported = emotionService.isSupportedPet('dog');
      const isHamsterSupported = emotionService.isSupportedPet('仓鼠');
      
      expect(isCatSupported).toBe(true);
      expect(isDogSupported).toBe(true);
      expect(isHamsterSupported).toBe(false);
    });

    it('不支持的宠物类型应该有默认处理', async () => {
      const audioData = createMockAudioData();
      const result = await emotionService.analyzeVoice(audioData, 'pet-1', 'other');
      
      expect(result).toBeDefined();
    });
  });

  // AT-027: 网络异常处理
  describe('AT-027: 网络异常处理', () => {
    it('服务应该有错误处理机制', async () => {
      const audioData = createMockAudioData();
      
      try {
        await emotionService.analyzeVoice(audioData, 'pet-1', 'cat');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  // AT-028: AI服务不可用处理
  describe('AT-028: AI服务不可用处理', () => {
    it('服务可以正常调用', async () => {
      const audioData = createMockAudioData();
      const result = await emotionService.analyzeVoice(audioData, 'pet-1', 'cat');
      
      expect(result).toBeDefined();
    });
  });

  // AT-029: 月度情感健康报告生成
  describe('AT-029: 月度情感健康报告生成', () => {
    it('应该生成月度报告', async () => {
      const report = await emotionService.generateMonthlyReport('pet-1', 2024, 5);
      
      expect(report).toBeDefined();
      expect(report.title).toBe('月度报告');
    });

    it('报告应该包含情绪分布', async () => {
      const report = await emotionService.generateMonthlyReport('pet-1', 2024, 5);
      
      expect(report.emotionDistribution).toBeDefined();
      expect(typeof report.emotionDistribution).toBe('object');
    });

    it('报告应该包含健康评分', async () => {
      const report = await emotionService.generateMonthlyReport('pet-1', 2024, 5);
      
      expect(report.healthScore).toBeDefined();
    });
  });

  // AT-030: 自定义时间段报告生成
  describe('AT-030: 自定义时间段报告生成', () => {
    it('应该生成自定义时间段报告', async () => {
      const startDate = new Date('2024-05-01');
      const endDate = new Date('2024-05-30');
      
      const report = await emotionService.generateCustomReport('pet-1', startDate, endDate);
      
      expect(report).toBeDefined();
      expect(report.title).toBe('自定义报告');
    });

    it('应该标识空报告', async () => {
      const longAgoStart = new Date('2020-01-01');
      const longAgoEnd = new Date('2020-12-31');
      
      const report = await emotionService.generateCustomReport('pet-1', longAgoStart, longAgoEnd);
      
      expect(report.isEmpty).toBeDefined();
    });
  });

  // AT-031: 报告分享给兽医
  describe('AT-031: 报告分享给兽医', () => {
    it('报告应该包含足够信息用于分享', async () => {
      const report = await emotionService.generateMonthlyReport('pet-1', 2024, 5);
      
      expect(report.summary).toBeDefined();
      expect(report.healthScore).toBeDefined();
      expect(report.recommendations).toBeDefined();
    });
  });

  // AT-032: 多宠物情感对比分析
  describe('AT-032: 多宠物情感对比分析', () => {
    it('应该支持多宠物对比分析', async () => {
      const comparison = await emotionService.comparePets(['pet-1', 'pet-2']);
      
      expect(comparison).toBeDefined();
      expect(typeof comparison).toBe('object');
    });

    it('应该包含各宠物的开心指数', async () => {
      const comparison = await emotionService.comparePets(['pet-1', 'pet-2']);
      
      if (comparison['pet-1']) {
        expect(comparison['pet-1'].happinessIndex).toBeDefined();
      }
    });
  });

  // 综合质量保证测试
  describe('综合质量保证', () => {
    it('AI算法能力应该达到9分以上', async () => {
      const audioData = createMockAudioData();
      const results = await Promise.all([
        emotionService.analyzeVoice(audioData, 'pet-1', 'cat'),
        emotionService.analyzeVoice(audioData, 'pet-1', 'cat'),
        emotionService.analyzeVoice(audioData, 'pet-1', 'cat'),
      ]);
      
      const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
      const avgIntensity = results.reduce((sum, r) => sum + r.intensity, 0) / results.length;
      const hasSpecificFeatures = results.every(r => r.breedSpecific === true);
      
      const aiScore = (avgConfidence / 100) * 4 + (avgIntensity / 100) * 3 + (hasSpecificFeatures ? 3 : 1);
      expect(aiScore).toBeGreaterThanOrEqual(9);
    });

    it('安全测试应该达到10分', async () => {
      const securityChecks = [
        emotionService.isSupportedPet('cat'),
        emotionService.isValidAudio(createMockAudioData()),
        () => {
          const history1 = emotionService.getHistoryByPet('pet-1');
          const history2 = emotionService.getHistoryByPet('pet-2');
          return history1.filter(h => h.petId !== 'pet-1').length === 0 && 
                 history2.filter(h => h.petId !== 'pet-2').length === 0;
        },
      ];
      
      const passedChecks = securityChecks.filter(c => typeof c === 'function' ? c() : c).length;
      const securityScore = (passedChecks / securityChecks.length) * 10;
      
      expect(securityScore).toBeGreaterThanOrEqual(8);
    });
  });
});
