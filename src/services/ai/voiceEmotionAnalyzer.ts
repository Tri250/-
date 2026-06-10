// ============================================
// PawSync Pro 3.0 - Voice Emotion Analyzer
//
// 作者: 带娃的小陈工
// 日期: 2026-06-10
// 描述: AI 声音情绪分析服务
// 支持真实 AI 模型推理（后端 Wav2Vec2）
// ============================================

import type {
  VoiceAnalysisResult,
  VoiceAnalysisRequest,
  ExplainableAudioFeatures,
  PetIntention,
  BackendAIConfig,
  DEFAULT_BACKEND_AI_CONFIG,
} from '../../types/voice-analysis';
import { INTENTION_CONFIGS } from '../../types/voice-analysis';
import { audioModelService } from './audioModelService';

// ==================== 类型定义 ====================

/**
 * 音频分析内部结果
 */
interface InternalAudioAnalysis {
  fftResult: {
    dominantFrequency: number;
    spectralCentroid: number;
    rmsEnergy: number;
    zeroCrossingRate: number;
    spectrum: Float32Array;
  };
  features: {
    mfcc: Float32Array;
    melSpectrogram: Float32Array;
  };
  duration: number;
}

/**
 * 后端 API 响应
 */
interface BackendAPIResponse {
  success: boolean;
  result?: {
    intention: PetIntention;
    confidence: number;
    distribution: Record<PetIntention, number>;
    features: {
      pitch: { mean: number; variance: number; range: [number, number] };
      energy: { mean: number; peak: number; variance: number };
      duration: number;
    };
    reasoning: string[];
  };
  error?: { code: string; message: string };
}

// ==================== 声音情绪分析器 ====================

/**
 * 声音情绪分析服务
 * 支持前端轻量分析和后端高精度推理
 */
export class VoiceEmotionAnalyzer {
  // 单例实例
  private static instance: VoiceEmotionAnalyzer | null = null;

  // 后端 API 配置
  private backendConfig: BackendAIConfig = {
    baseUrl: '/api/ai',
    version: 'v1',
    timeout: 30000,
    retries: 3,
    enableCache: true,
    cacheExpiry: 3600000,
  };

  // 缓存
  private cache: Map<string, { result: VoiceAnalysisResult; expiresAt: number }> = new Map();

  // 初始化状态
  private initialized = false;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): VoiceEmotionAnalyzer {
    if (!VoiceEmotionAnalyzer.instance) {
      VoiceEmotionAnalyzer.instance = new VoiceEmotionAnalyzer();
    }
    return VoiceEmotionAnalyzer.instance;
  }

  /**
   * 初始化服务
   */
  async init(config?: Partial<BackendAIConfig>): Promise<void> {
    if (this.initialized) return;

    // 更新配置
    if (config) {
      this.backendConfig = { ...this.backendConfig, ...config };
    }

    // 初始化音频模型服务
    await audioModelService.init();

    this.initialized = true;
    console.log('[VoiceEmotionAnalyzer] 初始化成功');
  }

  /**
   * 分析声音情绪
   * 主入口方法
   */
  async analyzeEmotion(audioBlob: Blob): Promise<VoiceAnalysisResult> {
    const startTime = Date.now();
    const id = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // 确保已初始化
      if (!this.initialized) {
        await this.init();
      }

      // 检查缓存
      const cacheKey = await this.generateCacheKey(audioBlob);
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        console.log('[VoiceEmotionAnalyzer] 使用缓存结果');
        return cached.result;
      }

      // 将 Blob 转换为 AudioBuffer
      const audioBuffer = await this.blobToAudioBuffer(audioBlob);
      const audioData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      const duration = audioBuffer.duration;

      // 执行前端分析
      const frontendAnalysis = await this.performFrontendAnalysis(audioData, sampleRate, duration);

      // 根据配置选择推理模式
      const inferenceMode = this.shouldUseBackend(audioBlob) ? 'backend' : 'frontend';

      let result: VoiceAnalysisResult;

      if (inferenceMode === 'backend') {
        // 后端高精度推理
        result = await this.performBackendAnalysis(audioBlob, frontendAnalysis, id, startTime);
      } else {
        // 前端轻量分析
        result = this.performLocalAnalysis(frontendAnalysis, id, startTime, duration);
      }

      // 缓存结果
      if (this.backendConfig.enableCache) {
        this.cache.set(cacheKey, {
          result,
          expiresAt: Date.now() + this.backendConfig.cacheExpiry,
        });
      }

      return result;
    } catch (error) {
      console.error('[VoiceEmotionAnalyzer] 分析失败:', error);
      return {
        id,
        timestamp: new Date().toISOString(),
        primaryIntention: 'social',
        confidence: 0,
        confidenceLevel: 'low',
        intentionDistribution: this.getDefaultDistribution(),
        features: this.getDefaultFeatures(),
        reasoning: ['分析过程中发生错误'],
        behaviorIndicators: [],
        inferenceMode: 'frontend',
        processingTime: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : '声音分析失败',
      };
    }
  }

  /**
   * 判断是否应该使用后端推理
   */
  private shouldUseBackend(audioBlob: Blob): boolean {
    // 大文件或需要高精度分析时使用后端
    const sizeThreshold = 100 * 1024; // 100KB
    return audioBlob.size > sizeThreshold;
  }

  /**
   * 执行前端分析
   */
  private async performFrontendAnalysis(
    audioData: Float32Array,
    sampleRate: number,
    duration: number
  ): Promise<InternalAudioAnalysis> {
    // 使用音频模型服务进行 FFT 分析
    const analysisResult = await audioModelService.analyzeAudio(audioData, {
      sampleRate,
      useFFT: true,
      returnIntermediate: true,
    });

    if (!analysisResult.fftResult || !analysisResult.features) {
      throw new Error('前端音频分析失败');
    }

    return {
      fftResult: {
        dominantFrequency: analysisResult.fftResult.dominantFrequency,
        spectralCentroid: analysisResult.fftResult.spectralCentroid,
        rmsEnergy: analysisResult.fftResult.rmsEnergy,
        zeroCrossingRate: analysisResult.fftResult.zeroCrossingRate,
        spectrum: analysisResult.fftResult.spectrum,
      },
      features: {
        mfcc: analysisResult.features.mfcc || new Float32Array(13),
        melSpectrogram: analysisResult.features.melSpectrogram || new Float32Array(128),
      },
      duration,
    };
  }

  /**
   * 执行后端分析
   */
  private async performBackendAnalysis(
    audioBlob: Blob,
    frontendAnalysis: InternalAudioAnalysis,
    id: string,
    startTime: number
  ): Promise<VoiceAnalysisResult> {
    let retries = 0;
    let lastError: Error | null = null;

    while (retries < this.backendConfig.retries) {
      try {
        // 调用后端 API (Python Wav2Vec2)
        const response = await this.callBackendAPI(audioBlob);

        if (response.success && response.result) {
          // 合合前后端结果
          const features = this.buildExplainableFeatures(
            frontendAnalysis.fftResult,
            frontendAnalysis.duration
          );

          return {
            id,
            timestamp: new Date().toISOString(),
            primaryIntention: response.result.intention,
            confidence: response.result.confidence,
            confidenceLevel: this.getConfidenceLevel(response.result.confidence),
            intentionDistribution: response.result.distribution,
            features,
            reasoning: response.result.reasoning,
            behaviorIndicators: this.extractBehaviorIndicators(response.result.intention, features),
            inferenceMode: 'backend',
            processingTime: Date.now() - startTime,
            success: true,
          };
        }

        lastError = new Error(response.error?.message || '后端分析失败');
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('后端 API 调用失败');
      }

      retries++;
      if (retries < this.backendConfig.retries) {
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }

    // 后端失败，回退到前端分析
    console.warn('[VoiceEmotionAnalyzer] 后端分析失败，回退到前端分析:', lastError);
    return this.performLocalAnalysis(frontendAnalysis, id, startTime, frontendAnalysis.duration);
  }

  /**
   * 调用后端 AI API
   */
  private async callBackendAPI(audioBlob: Blob): Promise<BackendAPIResponse> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.wav');
    formData.append('model', 'wav2vec2');
    formData.append('task', 'emotion_classification');

    const response = await fetch(
      `${this.backendConfig.baseUrl}/${this.backendConfig.version}/voice/emotion`,
      {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(this.backendConfig.timeout),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 执行本地分析
   */
  private performLocalAnalysis(
    analysis: InternalAudioAnalysis,
    id: string,
    startTime: number,
    duration: number
  ): VoiceAnalysisResult {
    // 基于音频特征推断意图
    const intentionResult = this.inferIntentionFromFeatures(analysis.fftResult, duration);

    // 构建可解释性特征
    const features = this.buildExplainableFeatures(analysis.fftResult, duration);

    // 提取行为指标
    const behaviorIndicators = this.extractBehaviorIndicators(
      intentionResult.primaryIntention,
      features
    );

    return {
      id,
      timestamp: new Date().toISOString(),
      primaryIntention: intentionResult.primaryIntention,
      confidence: intentionResult.confidence,
      confidenceLevel: this.getConfidenceLevel(intentionResult.confidence),
      intentionDistribution: intentionResult.distribution,
      features,
      reasoning: intentionResult.reasoning,
      behaviorIndicators,
      inferenceMode: 'frontend',
      processingTime: Date.now() - startTime,
      success: true,
    };
  }

  /**
   * 基于音频特征推断意图
   */
  private inferIntentionFromFeatures(
    fftResult: InternalAudioAnalysis['fftResult'],
    duration: number
  ): {
    primaryIntention: PetIntention;
    confidence: number;
    distribution: Record<PetIntention, number>;
    reasoning: string[];
  } {
    const { dominantFrequency, spectralCentroid, rmsEnergy, zeroCrossingRate } = fftResult;

    // 归一化特征
    const normalizedPitch = Math.min(dominantFrequency / 1000, 1);
    const normalizedCentroid = Math.min(spectralCentroid / 5000, 1);
    const normalizedEnergy = Math.min(rmsEnergy * 10, 1);
    const normalizedZCR = Math.min(zeroCrossingRate * 100, 1);

    // 计算各意图的匹配度
    const scores: Record<PetIntention, number> = {
      happy: 0,
      hungry: 0,
      anxious: 0,
      playful: 0,
      angry: 0,
      tired: 0,
      social: 0,
    };

    const reasoning: string[] = [];

    // 开心: 高音高 + 高能量 + 稳定节奏
    if (normalizedPitch > 0.4 && normalizedEnergy > 0.5 && normalizedZCR < 0.5) {
      scores.happy = (normalizedPitch + normalizedEnergy) / 2 * 0.8;
      reasoning.push('音高较高且能量充足，可能表达开心');
    }

    // 饥饿: 中音高 + 中能量 + 有节奏性
    if (normalizedPitch > 0.3 && normalizedPitch < 0.6 && normalizedEnergy > 0.3 && duration > 0.5) {
      scores.hungry = (normalizedPitch + normalizedEnergy + duration) / 3 * 0.7;
      reasoning.push('声音有节奏性且持续，可能是请求食物');
    }

    // 焦虑: 高音高 + 低能量 + 高过零率
    if (normalizedCentroid > 0.5 && normalizedEnergy < 0.4 && normalizedZCR > 0.4) {
      scores.anxious = (normalizedCentroid + normalizedZCR) / 2 * 0.75;
      reasoning.push('频谱质心高但能量低，可能表达焦虑');
    }

    // 玩耍: 高能量 + 快节奏 + 高音高变化
    if (normalizedEnergy > 0.6 && normalizedZCR > 0.3 && duration < 1.0) {
      scores.playful = (normalizedEnergy + normalizedZCR) / 2 * 0.85;
      reasoning.push('能量高且节奏快，可能想玩耍');
    }

    // 生气: 高音高 + 高能量 + 高变化
    if (normalizedPitch > 0.5 && normalizedEnergy > 0.7 && normalizedZCR > 0.5) {
      scores.angry = (normalizedPitch + normalizedEnergy + normalizedZCR) / 3 * 0.9;
      reasoning.push('音高高、能量强且变化大，可能表达不满');
    }

    // 疲惫: 低音高 + 低能量 + 长持续时间
    if (normalizedPitch < 0.3 && normalizedEnergy < 0.3 && duration > 1.0) {
      scores.tired = (1 - normalizedPitch + 1 - normalizedEnergy) / 2 * 0.6;
      reasoning.push('音高低且能量弱，可能需要休息');
    }

    // 社交: 中等特征 + 持续性
    const avgScore = (normalizedPitch + normalizedEnergy + normalizedZCR) / 3;
    if (avgScore > 0.3 && avgScore < 0.6) {
      scores.social = avgScore * 0.7;
      reasoning.push('声音特征适中，可能寻求关注');
    }

    // 找出最高分意图
    let primaryIntention: PetIntention = 'social';
    let maxScore = 0;

    for (const [intention, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        primaryIntention = intention as PetIntention;
      }
    }

    // 归一化分布
    const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0);
    const distribution: Record<PetIntention, number> = {
      happy: 0,
      hungry: 0,
      anxious: 0,
      playful: 0,
      angry: 0,
      tired: 0,
      social: 0,
    };

    if (totalScore > 0) {
      for (const [intention, score] of Object.entries(scores)) {
        distribution[intention as PetIntention] = score / totalScore;
      }
    } else {
      // 默认分布
      for (const intention of Object.keys(distribution)) {
        distribution[intention as PetIntention] = 1 / 7;
      }
    }

    return {
      primaryIntention,
      confidence: maxScore,
      distribution,
      reasoning,
    };
  }

  /**
   * 构建可解释性特征
   */
  private buildExplainableFeatures(
    fftResult: InternalAudioAnalysis['fftResult'],
    duration: number
  ): ExplainableAudioFeatures {
    const { dominantFrequency, spectralCentroid, rmsEnergy, zeroCrossingRate, spectrum } = fftResult;

    // 计算音高范围
    let minFreq = 0;
    let maxFreq = 0;
    for (let i = 0; i < spectrum.length; i++) {
      const freq = i * (16000 / spectrum.length);
      if (spectrum[i] > 0.01) {
        if (minFreq === 0) minFreq = freq;
        maxFreq = freq;
      }
    }

    // 判断趋势
    let trend: 'rising' | 'falling' | 'stable' | 'fluctuating' = 'stable';
    if (zeroCrossingRate > 0.5) {
      trend = 'fluctuating';
    } else if (spectralCentroid > 3000) {
      trend = 'rising';
    } else if (spectralCentroid < 1500) {
      trend = 'falling';
    }

    // 判断节奏模式
    let pattern: 'steady' | 'irregular' | 'accelerating' | 'decelerating' = 'steady';
    if (zeroCrossingRate > 0.6) {
      pattern = 'irregular';
    } else if (rmsEnergy > 0.7) {
      pattern = 'accelerating';
    } else if (rmsEnergy < 0.3) {
      pattern = 'decelerating';
    }

    return {
      pitch: {
        mean: dominantFrequency,
        variance: Math.pow(dominantFrequency * 0.2, 2),
        range: [minFreq, maxFreq],
        trend,
        explanation: this.getPitchExplanation(dominantFrequency, trend),
      },
      energy: {
        mean: rmsEnergy * 100,
        peak: rmsEnergy * 150,
        variance: rmsEnergy * 20,
        explanation: this.getEnergyExplanation(rmsEnergy),
      },
      duration: {
        total: duration,
        active: duration * 0.8,
        silence: duration * 0.2,
        explanation: this.getDurationExplanation(duration),
      },
      frequency: {
        dominant: dominantFrequency,
        range: [minFreq, maxFreq],
        harmonics: [dominantFrequency * 2, dominantFrequency * 3],
        explanation: this.getFrequencyExplanation(dominantFrequency),
      },
      rhythm: {
        pattern,
        intensity: zeroCrossingRate * 100,
        explanation: this.getRhythmExplanation(pattern, zeroCrossingRate),
      },
    };
  }

  /**
   * 音高解释
   */
  private getPitchExplanation(pitch: number, trend: string): string {
    if (pitch > 600) {
      return `音高较高 (${pitch.toFixed(0)}Hz)，${trend === 'rising' ? '且有上升趋势' : trend === 'fluctuating' ? '变化较大' : '相对稳定'}，通常表示兴奋或急切`;
    } else if (pitch < 300) {
      return `音高较低 (${pitch.toFixed(0)}Hz)，${trend === 'falling' ? '且有下降趋势' : '相对稳定'}，通常表示放松或疲惫`;
    }
    return `音高适中 (${pitch.toFixed(0)}Hz)，${trend === 'stable' ? '保持稳定' : '有一定变化'}，可能表达一般性需求`;
  }

  /**
   * 能量解释
   */
  private getEnergyExplanation(energy: number): string {
    if (energy > 0.6) {
      return `声音能量较强 (${(energy * 100).toFixed(0)}%)，表示声音有力，可能是强烈的表达`;
    } else if (energy < 0.3) {
      return `声音能量较弱 (${(energy * 100).toFixed(0)}%)，表示声音柔和，可能是温和的表达`;
    }
    return `声音能量适中 (${(energy * 100).toFixed(0)}%)，表达强度一般`;
  }

  /**
   * 持续时间解释
   */
  private getDurationExplanation(duration: number): string {
    if (duration > 2) {
      return `声音持续时间较长 (${duration.toFixed(1)}秒)，可能是持续性的表达`;
    } else if (duration < 0.5) {
      return `声音持续时间较短 (${duration.toFixed(1)}秒)，可能是短暂的反应`;
    }
    return `声音持续时间适中 (${duration.toFixed(1)}秒)`;
  }

  /**
   * 频率解释
   */
  private getFrequencyExplanation(freq: number): string {
    if (freq > 800) {
      return `主频率较高 (${freq.toFixed(0)}Hz)，声音尖锐，可能表达急切或兴奋`;
    } else if (freq < 400) {
      return `主频率较低 (${freq.toFixed(0)}Hz)，声音低沉，可能表达放松或不满`;
    }
    return `主频率适中 (${freq.toFixed(0)}Hz)，声音平衡`;
  }

  /**
   * 节奏解释
   */
  private getRhythmExplanation(pattern: string, intensity: number): string {
    const intensityDesc = intensity > 50 ? '节奏明显' : '节奏柔和';
    switch (pattern) {
      case 'accelerating':
        return `${intensityDesc}，节奏加快，可能表达兴奋或急切`;
      case 'decelerating':
        return `${intensityDesc}，节奏放缓，可能表达放松或疲惫`;
      case 'irregular':
        return `${intensityDesc}，节奏不规则，可能表达不安或焦虑`;
      default:
        return `${intensityDesc}，节奏稳定，表达较为平稳`;
    }
  }

  /**
   * 提取行为指标
   */
  private extractBehaviorIndicators(
    intention: PetIntention,
    features: ExplainableAudioFeatures
  ): string[] {
    const indicators: string[] = [];
    const config = INTENTION_CONFIGS[intention];

    // 基于意图添加指标
    indicators.push(`主要意图: ${config.label}`);

    // 基于特征添加指标
    if (features.pitch.mean > 600) {
      indicators.push('音调较高');
    }
    if (features.energy.mean > 60) {
      indicators.push('声音有力');
    }
    if (features.duration.total > 2) {
      indicators.push('持续时间长');
    }
    if (features.rhythm.pattern === 'irregular') {
      indicators.push('节奏不稳定');
    }

    return indicators;
  }

  /**
   * 获取置信度等级
   */
  private getConfidenceLevel(confidence: number): 'high' | 'medium' | 'low' {
    if (confidence > 0.7) return 'high';
    if (confidence > 0.4) return 'medium';
    return 'low';
  }

  /**
   * 获取默认分布
   */
  private getDefaultDistribution(): Record<PetIntention, number> {
    return {
      happy: 1 / 7,
      hungry: 1 / 7,
      anxious: 1 / 7,
      playful: 1 / 7,
      angry: 1 / 7,
      tired: 1 / 7,
      social: 1 / 7,
    };
  }

  /**
   * 获取默认特征
   */
  private getDefaultFeatures(): ExplainableAudioFeatures {
    return {
      pitch: {
        mean: 400,
        variance: 100,
        range: [200, 600],
        trend: 'stable',
        explanation: '无法获取音高数据',
      },
      energy: {
        mean: 50,
        peak: 70,
        variance: 20,
        explanation: '无法获取能量数据',
      },
      duration: {
        total: 1,
        active: 0.8,
        silence: 0.2,
        explanation: '无法获取持续时间数据',
      },
      frequency: {
        dominant: 400,
        range: [200, 600],
        harmonics: [800, 1200],
        explanation: '无法获取频率数据',
      },
      rhythm: {
        pattern: 'steady',
        intensity: 50,
        explanation: '无法获取节奏数据',
      },
    };
  }

  /**
   * Blob 转 AudioBuffer
   */
  private async blobToAudioBuffer(blob: Blob): Promise<AudioBuffer> {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const arrayBuffer = await blob.arrayBuffer();
    return audioContext.decodeAudioData(arrayBuffer);
  }

  /**
   * 生成缓存键
   */
  private async generateCacheKey(blob: Blob): Promise<string> {
    // 使用 Blob 大小和类型作为简单缓存键
    // 实际项目中应使用更精确的哈希
    return `voice_${blob.size}_${blob.type}`;
  }

  /**
   * 获取服务状态
   */
  getStatus(): {
    initialized: boolean;
    cacheSize: number;
    backendAvailable: boolean;
  } {
    return {
      initialized: this.initialized,
      cacheSize: this.cache.size,
      backendAvailable: true, // 假设后端可用
    };
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[VoiceEmotionAnalyzer] 缓存已清除');
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.clearCache();
    this.initialized = false;
    console.log('[VoiceEmotionAnalyzer] 服务已销毁');
  }
}

// 导出单例
export const voiceEmotionAnalyzer = VoiceEmotionAnalyzer.getInstance();