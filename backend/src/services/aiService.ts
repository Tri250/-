/**
 * AI 分析服务基类
 * 支持调用外部 Python 服务（未来）
 * 当前使用模拟实现
 */

import { v4 as uuidv4 } from 'uuid';
import {
  AIServiceConfig,
  PetEmotion,
  VoiceAnalyzeResponse,
  VoiceAnalysisDetails,
  ImageAnalyzeResponse,
  ImageAnalysisDetails,
  MultimodalAnalyzeResponse,
  FusionResult,
  SingleModalResult,
  ConflictAnalysis,
  TrendAnalyzeResponse,
  TrendTimelinePoint,
  EmotionStability,
  EmotionPrediction,
} from '../types/v2';

/**
 * AI 服务配置
 */
const DEFAULT_CONFIG: AIServiceConfig = {
  endpoint: process.env.AI_SERVICE_ENDPOINT || 'http://localhost:8000',
  timeout: 30000,
  maxRetries: 3,
  apiKey: process.env.AI_SERVICE_API_KEY,
};

/**
 * 情绪翻译映射
 */
const EMOTION_TRANSLATIONS: Record<PetEmotion, string> = {
  happy: '开心/愉悦',
  sad: '悲伤/低落',
  angry: '生气/愤怒',
  fearful: '恐惧/害怕',
  anxious: '焦虑/不安',
  excited: '兴奋/激动',
  calm: '平静/放松',
  confused: '困惑/迷茫',
  playful: '顽皮/想玩',
  affectionate: '亲昵/撒娇',
};

/**
 * 情绪建议映射
 */
const EMOTION_SUGGESTIONS: Record<PetEmotion, string[]> = {
  happy: [
    '宠物现在心情很好，可以趁机进行一些训练活动',
    '可以给一些零食奖励，强化积极情绪',
    '适合进行户外活动或游戏',
  ],
  sad: [
    '尝试用玩具或零食转移注意力',
    '增加陪伴时间，多进行互动',
    '检查是否有身体不适或环境变化',
  ],
  angry: [
    '给予空间，不要强行接近',
    '检查是否有疼痛或不适',
    '避免刺激，等待情绪平复',
  ],
  fearful: [
    '找出恐惧源并尽量消除',
    '提供安全的躲藏空间',
    '用温和的声音安抚，不要强迫',
  ],
  anxious: [
    '保持环境安静稳定',
    '使用舒缓的音乐或费洛蒙',
    '建立规律的作息时间',
  ],
  excited: [
    '引导进行消耗精力的活动',
    '注意避免过度兴奋导致的问题',
    '可以安排一些训练或游戏',
  ],
  calm: [
    '这是很好的休息状态',
    '可以轻轻抚摸增进感情',
    '适合进行健康检查或护理',
  ],
  confused: [
    '检查是否有认知问题',
    '保持环境简单一致',
    '耐心引导，不要急躁',
  ],
  playful: [
    '这是互动的好时机',
    '可以安排游戏或训练',
    '注意安全，避免过度疲劳',
  ],
  affectionate: [
    '回应宠物的亲昵行为',
    '这是增进感情的好机会',
    '可以给予轻柔的抚摸',
  ],
};

/**
 * AI 分析服务基类
 */
export class AIService {
  protected config: AIServiceConfig;

  constructor(config: Partial<AIServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 分析语音
   * @param audioBuffer 音频数据
   * @param petId 宠物ID
   * @param context 上下文信息
   * @returns 语音分析结果
   */
  async analyzeVoice(
    audioBuffer: Buffer,
    petId: string,
    context?: string
  ): Promise<VoiceAnalyzeResponse> {
    const startTime = Date.now();

    try {
      // 尝试调用外部 AI 服务
      const result = await this.callExternalService('/api/v2/voice/analyze', {
        audio: audioBuffer.toString('base64'),
        petId,
        context,
      });

      if (result) {
        return result as unknown as VoiceAnalyzeResponse;
      }
    } catch (error) {
      console.warn('外部 AI 服务不可用，使用模拟分析:', error);
    }

    // 模拟分析结果
    return this.simulateVoiceAnalysis(petId, Date.now() - startTime, context);
  }

  /**
   * 分析图像
   * @param imageBuffer 图像数据
   * @param petId 宠物ID
   * @param context 上下文信息
   * @returns 图像分析结果
   */
  async analyzeImage(
    imageBuffer: Buffer,
    petId: string,
    context?: string
  ): Promise<ImageAnalyzeResponse> {
    const startTime = Date.now();

    try {
      // 尝试调用外部 AI 服务
      const result = await this.callExternalService('/api/v2/image/analyze', {
        image: imageBuffer.toString('base64'),
        petId,
        context,
      });

      if (result) {
        return result as unknown as ImageAnalyzeResponse;
      }
    } catch (error) {
      console.warn('外部 AI 服务不可用，使用模拟分析:', error);
    }

    // 模拟分析结果
    return this.simulateImageAnalysis(petId, Date.now() - startTime, context);
  }

  /**
   * 多模态分析
   * @param audioBuffer 音频数据（可选）
   * @param imageBuffer 图像数据（可选）
   * @param petId 宠物ID
   * @param context 上下文信息
   * @returns 多模态分析结果
   */
  async analyzeMultimodal(
    audioBuffer: Buffer | null,
    imageBuffer: Buffer | null,
    petId: string,
    context?: string
  ): Promise<MultimodalAnalyzeResponse> {
    const startTime = Date.now();

    try {
      // 尝试调用外部 AI 服务
      const result = await this.callExternalService('/api/v2/multimodal/analyze', {
        audio: audioBuffer?.toString('base64'),
        image: imageBuffer?.toString('base64'),
        petId,
        context,
      });

      if (result) {
        return result as unknown as MultimodalAnalyzeResponse;
      }
    } catch (error) {
      console.warn('外部 AI 服务不可用，使用模拟分析:', error);
    }

    // 模拟分析结果
    return this.simulateMultimodalAnalysis(
      audioBuffer !== null,
      imageBuffer !== null,
      Date.now() - startTime,
      petId,
      context
    );
  }

  /**
   * 获取情绪趋势
   * @param petId 宠物ID
   * @param period 时间周期
   * @returns 趋势分析结果
   */
  async getEmotionTrend(
    petId: string,
    period: '7d' | '30d' | '90d'
  ): Promise<TrendAnalyzeResponse> {
    try {
      // 尝试调用外部 AI 服务
      const result = await this.callExternalService('/api/v2/trend/analyze', {
        petId,
        period,
      });

      if (result) {
        return result as unknown as TrendAnalyzeResponse;
      }
    } catch (error) {
      console.warn('外部 AI 服务不可用，使用模拟数据:', error);
    }

    // 模拟趋势数据
    return this.simulateTrendAnalysis(petId, period);
  }

  /**
   * 调用外部 AI 服务
   * @param path API 路径
   * @param data 请求数据
   * @returns 响应数据或 null
   */
  protected async callExternalService(
    path: string,
    requestData: Record<string, unknown>
  ): Promise<Record<string, unknown> | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.endpoint}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify(requestData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`AI 服务响应错误: ${response.status}`);
      }

      const responseData = await response.json();
      return responseData as Record<string, unknown>;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * 模拟语音分析
   */
  protected simulateVoiceAnalysis(
    _petId: string,
    processingTime: number,
    _context?: string
  ): VoiceAnalyzeResponse {
    const emotions: PetEmotion[] = [
      'happy', 'excited', 'anxious', 'calm', 'playful', 'affectionate'
    ];
    const emotion = emotions[Math.floor(Math.random() * emotions.length)];
    const confidence = 0.7 + Math.random() * 0.25;

    const details: VoiceAnalysisDetails = {
      pitch: 200 + Math.random() * 800,
      duration: 500 + Math.random() * 2000,
      intensity: 40 + Math.random() * 40,
      frequency: Array.from({ length: 10 }, () => Math.random() * 1000),
      patterns: ['短促', '重复', '升调'],
    };

    return {
      emotion,
      confidence: Math.round(confidence * 100) / 100,
      translation: this.generateTranslation(emotion, 'voice'),
      details,
      suggestion: this.getSuggestion(emotion),
      analysisId: uuidv4(),
      processingTime: Math.min(processingTime + 100 + Math.random() * 200, 500),
    };
  }

  /**
   * 模拟图像分析
   */
  protected simulateImageAnalysis(
    _petId: string,
    processingTime: number,
    _context?: string
  ): ImageAnalyzeResponse {
    const emotions: PetEmotion[] = [
      'happy', 'calm', 'playful', 'sleepy', 'curious'
    ] as PetEmotion[];
    const emotion = emotions[Math.floor(Math.random() * emotions.length)];
    const confidence = 0.65 + Math.random() * 0.3;

    const breeds = ['金毛', '拉布拉多', '柯基', '边牧', '哈士奇', '泰迪', '英短', '美短', '布偶'];
    const breed = breeds[Math.floor(Math.random() * breeds.length)];

    const details: ImageAnalysisDetails = {
      boundingBox: {
        x: Math.random() * 100,
        y: Math.random() * 100,
        width: 200 + Math.random() * 300,
        height: 200 + Math.random() * 300,
      },
      landmarks: [
        { name: 'left_eye', x: 100, y: 120 },
        { name: 'right_eye', x: 150, y: 120 },
        { name: 'nose', x: 125, y: 150 },
        { name: 'mouth', x: 125, y: 180 },
      ],
      pose: '正面',
      accessories: [],
    };

    return {
      animalDetected: true,
      breed,
      breedConfidence: 0.8 + Math.random() * 0.15,
      emotion,
      confidence: Math.round(confidence * 100) / 100,
      translation: this.generateTranslation(emotion, 'image'),
      details,
      analysisId: uuidv4(),
      processingTime: Math.min(processingTime + 200 + Math.random() * 400, 800),
    };
  }

  /**
   * 模拟多模态分析
   */
  protected simulateMultimodalAnalysis(
    hasVoice: boolean,
    hasImage: boolean,
    processingTime: number,
    _petId: string,
    _context?: string
  ): MultimodalAnalyzeResponse {
    const emotions: PetEmotion[] = [
      'happy', 'excited', 'calm', 'playful', 'affectionate'
    ];
    const emotion = emotions[Math.floor(Math.random() * emotions.length)];
    const confidence = 0.8 + Math.random() * 0.15;

    // 生成单模态结果
    const singleModalResults: { voice?: SingleModalResult; image?: SingleModalResult } = {};

    if (hasVoice) {
      singleModalResults.voice = {
        modality: 'voice',
        emotion: emotions[Math.floor(Math.random() * emotions.length)],
        confidence: 0.7 + Math.random() * 0.2,
        translation: this.generateTranslation(emotion, 'voice'),
      };
    }

    if (hasImage) {
      singleModalResults.image = {
        modality: 'image',
        emotion: emotions[Math.floor(Math.random() * emotions.length)],
        confidence: 0.7 + Math.random() * 0.2,
        translation: this.generateTranslation(emotion, 'image'),
      };
    }

    // 分析冲突
    const conflictAnalysis = this.analyzeConflict(
      singleModalResults.voice,
      singleModalResults.image
    );

    // 融合结果
    const fusionResult: FusionResult = {
      emotion,
      confidence: Math.round(confidence * 100) / 100,
      translation: this.generateTranslation(emotion, 'multimodal'),
      suggestion: this.getSuggestion(emotion),
      details: {
        voiceWeight: hasVoice ? 0.5 : 0,
        imageWeight: hasImage ? 0.5 : 0,
        fusionMethod: 'weighted_average',
      },
    };

    return {
      fusionResult,
      singleModalResults,
      conflictAnalysis,
      analysisId: uuidv4(),
      processingTime: Math.min(processingTime + 400 + Math.random() * 600, 1200),
    };
  }

  /**
   * 分析模态冲突
   */
  protected analyzeConflict(
    voiceResult?: SingleModalResult,
    imageResult?: SingleModalResult
  ): ConflictAnalysis {
    if (!voiceResult || !imageResult) {
      return {
        hasConflict: false,
        resolution: '仅有一种模态数据，无需冲突解决',
        weightedEmotion: (voiceResult || imageResult)!.emotion,
        weightedConfidence: (voiceResult || imageResult)!.confidence,
      };
    }

    const hasConflict = voiceResult.emotion !== imageResult.emotion;
    const voiceWeight = 0.45;
    const imageWeight = 0.55;

    let weightedEmotion: PetEmotion;
    let weightedConfidence: number;

    if (hasConflict) {
      // 根据置信度加权
      if (voiceResult.confidence > imageResult.confidence) {
        weightedEmotion = voiceResult.emotion;
        weightedConfidence = voiceResult.confidence * voiceWeight + imageResult.confidence * imageWeight;
      } else {
        weightedEmotion = imageResult.emotion;
        weightedConfidence = voiceResult.confidence * voiceWeight + imageResult.confidence * imageWeight;
      }

      return {
        hasConflict: true,
        conflictType: 'emotion_mismatch',
        resolution: `语音和图像分析结果不一致，语音显示"${EMOTION_TRANSLATIONS[voiceResult.emotion]}"，图像显示"${EMOTION_TRANSLATIONS[imageResult.emotion]}"。已根据置信度加权融合。`,
        weightedEmotion,
        weightedConfidence,
      };
    }

    weightedEmotion = voiceResult.emotion;
    weightedConfidence = (voiceResult.confidence + imageResult.confidence) / 2;

    return {
      hasConflict: false,
      resolution: '语音和图像分析结果一致',
      weightedEmotion,
      weightedConfidence,
    };
  }

  /**
   * 模拟趋势分析
   */
  protected simulateTrendAnalysis(
    petId: string,
    period: '7d' | '30d' | '90d'
  ): TrendAnalyzeResponse {
    const now = new Date();
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const emotions: PetEmotion[] = [
      'happy', 'calm', 'playful', 'excited', 'affectionate', 'anxious'
    ];

    // 生成时间线数据
    const timeline: TrendTimelinePoint[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      timeline.push({
        date: date.toISOString().split('T')[0],
        emotion: emotions[Math.floor(Math.random() * emotions.length)],
        confidence: 0.6 + Math.random() * 0.35,
        source: Math.random() > 0.5 ? 'voice' : 'image',
      });
    }

    // 计算情绪分布
    const emotionDistribution: Record<PetEmotion, number> = {
      happy: 0, sad: 0, angry: 0, fearful: 0, anxious: 0,
      excited: 0, calm: 0, confused: 0, playful: 0, affectionate: 0,
    };

    timeline.forEach(point => {
      emotionDistribution[point.emotion]++;
    });

    // 转换为百分比
    Object.keys(emotionDistribution).forEach(key => {
      emotionDistribution[key as PetEmotion] = 
        Math.round((emotionDistribution[key as PetEmotion] / days) * 100);
    });

    // 找出主要情绪
    let dominantEmotion: PetEmotion = 'happy';
    let maxCount = 0;
    Object.entries(emotionDistribution).forEach(([emotion, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantEmotion = emotion as PetEmotion;
      }
    });

    // 计算稳定性
    const stability: EmotionStability = {
      score: 60 + Math.random() * 30,
      volatility: Math.random() * 20,
      trend: Math.random() > 0.6 ? 'improving' : Math.random() > 0.3 ? 'stable' : 'declining',
    };

    // 生成预测
    const prediction: EmotionPrediction = {
      nextWeekEmotion: emotions[Math.floor(Math.random() * emotions.length)],
      confidence: 0.65 + Math.random() * 0.25,
      factors: ['近期活动模式', '环境变化', '健康状况'],
    };

    return {
      petId,
      period,
      timeline,
      dominantEmotion,
      emotionDistribution,
      stability,
      prediction,
      generatedAt: now.toISOString(),
    };
  }

  /**
   * 生成翻译文本
   */
  protected generateTranslation(emotion: PetEmotion, _source: string): string {
    const translation = EMOTION_TRANSLATIONS[emotion];
    const templates = [
      `您的宠物现在看起来${translation}`,
      `分析显示您的宠物正处于${translation}的状态`,
      `从表现来看，您的宠物似乎${translation}`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * 获取建议
   */
  protected getSuggestion(emotion: PetEmotion): string {
    const suggestions = EMOTION_SUGGESTIONS[emotion];
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  }
}

// 导出单例实例
export const aiService = new AIService();

export default AIService;