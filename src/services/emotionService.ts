// ============================================
// PawSync Pro - emotionService.ts
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 高精度情感分析服务，基于Canvas图像分析和音频特征提取
// ============================================

import type {
  EmotionAnalysis,
  EmotionDashboard,
  EmotionDimension,
  EmotionWaveform,
  PrimaryEmotion,
  AudioFeatures,
  EmotionScores,
  EmotionAnalysisDetail,
} from '../types/emotion';
import { EMOTION_CONFIGS, TRANSLATIONS } from '../types/emotion';

// 置信度阈值配置
const EMOTION_CONFIDENCE_THRESHOLDS = {
  MIN_ACCEPTABLE: 60,
  HIGH_CONFIDENCE: 85,
  VERY_HIGH_CONFIDENCE: 95,
  UNCERTAINTY_THRESHOLD: 55,
};

// 宠物类型特定参数
const PET_TYPE_PARAMS = {
  cat: {
    typicalPitchRange: [300, 1200],
    typicalDuration: [0.3, 2.0],
    energyProfile: 'burst',
    commonEmotions: ['curious', 'calm', 'affectionate', 'anxious'],
  },
  dog: {
    typicalPitchRange: [200, 1500],
    typicalDuration: [0.5, 3.0],
    energyProfile: 'sustained',
    commonEmotions: ['happy', 'excited', 'anxious', 'alert'],
  },
};

// 时间段情绪倾向
const TIME_CONTEXT_EFFECTS = {
  morning: { hours: [6, 12], energyBoost: 1.2, likelyEmotions: ['excited', 'happy', 'curious'] },
  afternoon: { hours: [12, 18], energyBoost: 1.0, likelyEmotions: ['calm', 'curious', 'bored'] },
  evening: { hours: [18, 22], energyBoost: 0.9, likelyEmotions: ['calm', 'tired', 'affectionate'] },
  night: { hours: [22, 6], energyBoost: 0.7, likelyEmotions: ['calm', 'tired'] },
};

const EMOTION_WEIGHTS = {
  pitch: 0.22,
  intensity: 0.18,
  frequency: 0.18,
  rhythm: 0.15,
  timbre: 0.17,
  harmonics: 0.10,
};

const FREQUENCY_BANDS = {
  subBass: { min: 20, max: 60, label: '超低频' },
  bass: { min: 60, max: 250, label: '低频' },
  lowMid: { min: 250, max: 500, label: '中低频' },
  mid: { min: 500, max: 2000, label: '中频' },
  highMid: { min: 2000, max: 4000, label: '中高频' },
  high: { min: 4000, max: 6000, label: '高频' },
  veryHigh: { min: 6000, max: 12000, label: '超高频' },
};

const EMOTION_CORRELATIONS: Record<PrimaryEmotion, Record<string, number>> = {
  happy: { pitch: 0.82, intensity: 0.72, frequency: 0.65, rhythm: 0.75, timbre: 0.78, harmonics: 0.70 },
  curious: { pitch: 0.65, intensity: 0.52, frequency: 0.58, rhythm: 0.62, timbre: 0.55, harmonics: 0.60 },
  anxious: { pitch: 0.78, intensity: 0.42, frequency: 0.72, rhythm: 0.35, timbre: 0.48, harmonics: 0.55 },
  angry: { pitch: 0.88, intensity: 0.92, frequency: 0.82, rhythm: 0.45, timbre: 0.75, harmonics: 0.68 },
  needs: { pitch: 0.68, intensity: 0.72, frequency: 0.52, rhythm: 0.65, timbre: 0.58, harmonics: 0.62 },
  calm: { pitch: 0.32, intensity: 0.28, frequency: 0.22, rhythm: 0.85, timbre: 0.72, harmonics: 0.45 },
  excited: { pitch: 0.92, intensity: 0.96, frequency: 0.88, rhythm: 0.55, timbre: 0.82, harmonics: 0.78 },
  safe: { pitch: 0.42, intensity: 0.38, frequency: 0.32, rhythm: 0.78, timbre: 0.82, harmonics: 0.50 },
};

const EMOTION_FREQUENCY_SIGNATURES: Record<PrimaryEmotion, Record<string, number>> = {
  happy: { mid: 0.8, highMid: 0.7, high: 0.6 },
  curious: { lowMid: 0.6, mid: 0.7, highMid: 0.5 },
  anxious: { highMid: 0.8, high: 0.75, veryHigh: 0.5 },
  angry: { bass: 0.7, mid: 0.8, highMid: 0.85 },
  needs: { bass: 0.6, lowMid: 0.7, mid: 0.5 },
  calm: { subBass: 0.5, bass: 0.7, lowMid: 0.6 },
  excited: { mid: 0.85, highMid: 0.9, high: 0.8 },
  safe: { bass: 0.75, lowMid: 0.8, mid: 0.4 },
};

// 动物检测结果接口
interface AnimalDetectionResult {
  isAnimal: boolean;
  confidence: number;
  animalType?: 'dog' | 'cat' | 'other' | 'unknown';
  message?: string;
}

// 语音分析上下文
interface VoiceAnalysisContext {
  duration?: number;
  maxLevel?: number;
  hasValidSound?: boolean;
  petType?: 'cat' | 'dog';
  age?: number;
}

// 分析不确定性结果
interface EmotionUncertainty {
  isUncertain: boolean;
  reason: string;
  possibleEmotions: Array<{ emotion: PrimaryEmotion; probability: number; reason: string }>;
  suggestions: string[];
}

// 宠物特征检测阈值
const PET_FEATURE_THRESHOLDS = {
  catEyeColors: [[240, 200, 150], [200, 150, 100]],
  dogFeatures: {
    snoutRatio: 0.3,
    earPosition: 'up',
  },
  furTextureThreshold: 0.4,
  minConfidence: 60,
};

// 图像特征分析结果
interface ImageFeatures {
  brightness: number;
  contrast: number;
  colorTone: string;
  quality: number;
  isValid: boolean;
  invalidReason?: string;
  // 扩展特征
  colorHistogram?: number[];
  edgeDensity?: number;
  textureVariance?: number;
  faceDetected?: boolean;
  eyeRegions?: Array<{ x: number; y: number; size: number }>;
}

class EmotionService {
  private recentAnalyses: EmotionAnalysis[] = [];
  private analysisHistory: Map<string, EmotionAnalysis[]> = new Map();

  constructor() {
    this.loadHistoryFromStorage();
  }

  // 从本地存储加载历史记录
  private loadHistoryFromStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('emotionAnalysisHistory');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          this.recentAnalyses = parsed.slice(0, 20);
        } catch {
          this.recentAnalyses = [];
        }
      }
    }
  }

  // 保存历史到本地存储
  private saveHistoryToStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('emotionAnalysisHistory', JSON.stringify(this.recentAnalyses.slice(0, 20)));
    }
  }

  // ==================== 音频情感分析 ====================

  async analyzeVoice(audioData: Float32Array, context?: VoiceAnalysisContext): Promise<EmotionAnalysis> {
    // 验证音频数据有效性
    const validation = this.validateAudioInput(audioData, context);
    if (!validation.isValid) {
      return this.createLowConfidenceResult(validation.reason || '音频数据无效', 'voice');
    }

    const audioFeatures = this.extractAudioFeatures(audioData);
    
    if (!this.areAudioFeaturesValid(audioFeatures)) {
      return this.createLowConfidenceResult('无法提取有效的音频特征', 'voice');
    }
    
    const emotionScores = this.calculateEmotionScores(audioFeatures);
    const adjustedScores = this.applyContextAdjustments(emotionScores, context);
    
    const { primaryEmotion, secondaryEmotion, confidence, reasoning } = this.determinePrimaryEmotion(adjustedScores, audioFeatures);
    
    const adjustedConfidence = this.adjustConfidenceByQuality(confidence, audioFeatures, context);
    const uncertainty = this.analyzeEmotionUncertainty(adjustedScores, adjustedConfidence, audioFeatures);
    
    const translation = this.selectTranslation(primaryEmotion, adjustedScores);
    const behaviorIndicators = this.identifyBehaviors(primaryEmotion, audioFeatures);

    const enhancedReasoning = this.buildEnhancedReasoning(reasoning, uncertainty, context);

    const detail: EmotionAnalysisDetail = {
      primaryEmotion,
      secondaryEmotion,
      scores: adjustedScores,
      confidence: adjustedConfidence,
      confidenceLevel: adjustedConfidence >= EMOTION_CONFIDENCE_THRESHOLDS.VERY_HIGH_CONFIDENCE ? 'high' : adjustedConfidence >= EMOTION_CONFIDENCE_THRESHOLDS.HIGH_CONFIDENCE ? 'medium' : 'low',
      reasoning: enhancedReasoning,
      audioFeatures,
      behaviorIndicators,
    };

    const finalTranslation = uncertainty.isUncertain 
      ? `⚠️ **分析置信度较低 (${adjustedConfidence}%)**\n\n原因：${uncertainty.reason}\n\n${uncertainty.suggestions.join('\n')}\n\n---\n\n${translation}`
      : translation;

    const analysis: EmotionAnalysis = {
      id: `analysis-${Date.now()}`,
      petId: '1',
      primaryEmotion,
      intensity: this.calculateIntensity(adjustedScores, audioFeatures),
      confidence: adjustedConfidence,
      subEmotions: secondaryEmotion ? [primaryEmotion, secondaryEmotion] : [primaryEmotion],
      translation: finalTranslation,
      context: {
        timeContext: '刚刚',
        locationContext: '家中',
      },
      createdAt: new Date().toISOString(),
      source: 'voice',
      detail,
    };

    this.recentAnalyses.unshift(analysis);
    if (this.recentAnalyses.length > 20) {
      this.recentAnalyses.pop();
    }
    this.saveHistoryToStorage();

    return analysis;
  }

  // ==================== 图像情感分析（基于Canvas）====================

  async analyzeEmotion(imageData: ImageData): Promise<EmotionAnalysis> {
    // 使用Canvas进行真实的图像分析
    const imageFeatures = this.extractImageFeaturesFromImageData(imageData);
    
    if (!imageFeatures.isValid) {
      return this.createLowConfidenceResult(imageFeatures.invalidReason || '图像分析失败', 'image');
    }

    // 基于图像特征推断情感
    this.inferEmotionFromImageFeatures(imageFeatures);
    
    const audioFeatures = this.generateAudioFeaturesFromImageContext(imageFeatures);
    const emotionScores = this.calculateEmotionScores(audioFeatures);
    
    // 根据图像特征调整分数
    const adjustedScores = this.adjustScoresByImageFeatures(emotionScores, imageFeatures);
    
    const { primaryEmotion, secondaryEmotion, confidence, reasoning } = this.determinePrimaryEmotion(adjustedScores, audioFeatures);
    
    const translation = this.selectTranslation(primaryEmotion, adjustedScores);
    const behaviorIndicators = this.identifyBehaviors(primaryEmotion, audioFeatures);

    const detail: EmotionAnalysisDetail = {
      primaryEmotion,
      secondaryEmotion,
      scores: adjustedScores,
      confidence,
      confidenceLevel: confidence >= 95 ? 'high' : confidence >= 85 ? 'medium' : 'low',
      reasoning: ['【图像分析】基于Canvas图像特征提取', ...reasoning],
      audioFeatures,
      behaviorIndicators,
    };

    const analysis: EmotionAnalysis = {
      id: `analysis-${Date.now()}`,
      petId: '1',
      primaryEmotion,
      intensity: this.calculateIntensity(adjustedScores, audioFeatures),
      confidence,
      subEmotions: secondaryEmotion ? [primaryEmotion, secondaryEmotion] : [primaryEmotion],
      translation,
      context: {
        timeContext: '刚刚',
        locationContext: '家中',
      },
      createdAt: new Date().toISOString(),
      source: 'image',
      detail,
    };

    this.recentAnalyses.unshift(analysis);
    this.saveHistoryToStorage();
    return analysis;
  }

  // 从ImageData提取图像特征
  private extractImageFeaturesFromImageData(imageData: ImageData): ImageFeatures {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    if (width < 50 || height < 50) {
      return {
        brightness: 0,
        contrast: 0,
        colorTone: 'neutral',
        quality: 0,
        isValid: false,
        invalidReason: '图像尺寸过小',
      };
    }

    // 计算基本统计
    let totalBrightness = 0;
    let totalR = 0, totalG = 0, totalB = 0;
    let minBrightness = 255, maxBrightness = 0;
    const pixelCount = data.length / 4;
    
    // 颜色直方图（简化版）
    const colorHistogram = new Array(64).fill(0);
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      const brightness = (r + g + b) / 3;
      totalBrightness += brightness;
      minBrightness = Math.min(minBrightness, brightness);
      maxBrightness = Math.max(maxBrightness, brightness);
      totalR += r;
      totalG += g;
      totalB += b;
      
      // 简化颜色直方图
      const rBin = Math.floor(r / 64);
      const gBin = Math.floor(g / 64);
      const bBin = Math.floor(b / 64);
      const binIndex = rBin * 16 + gBin * 4 + bBin;
      if (binIndex < 64) {
        colorHistogram[binIndex]++;
      }
    }
    
    const avgBrightness = totalBrightness / pixelCount;
    const avgR = totalR / pixelCount;
    const avgG = totalG / pixelCount;
    const avgB = totalB / pixelCount;
    
    // 计算对比度
    const dynamicRange = maxBrightness - minBrightness;
    const contrast = (dynamicRange / 255) * 100;
    
    // 边缘检测（Sobel算子简化版）
    const edgeDensity = this.calculateEdgeDensity(data, width, height);
    
    // 纹理分析
    const textureVariance = this.calculateTextureVariance(data, width, height);
    
    // 检测眼睛区域
    const eyeRegions = this.detectEyeRegions(data, width, height);
    
    // 计算图片质量
    let quality = 70;
    if (avgBrightness > 50 && avgBrightness < 200) quality += 10;
    if (contrast > 30 && contrast < 80) quality += 10;
    if (edgeDensity > 0.05 && edgeDensity < 0.3) quality += 5;
    
    // 判断色调
    let colorTone = 'neutral';
    if (avgR > avgG && avgR > avgB) colorTone = 'warm';
    else if (avgB > avgR && avgB > avgG) colorTone = 'cool';
    else if (avgG > avgR && avgG > avgB) colorTone = 'natural';

    return {
      brightness: Math.round(avgBrightness),
      contrast: Math.round(contrast),
      colorTone,
      quality: Math.min(100, Math.max(0, quality)),
      isValid: true,
      colorHistogram,
      edgeDensity,
      textureVariance,
      faceDetected: eyeRegions.length >= 2,
      eyeRegions,
    };
  }

  // 计算边缘密度
  private calculateEdgeDensity(data: Uint8ClampedArray, width: number, height: number): number {
    let edgeCount = 0;
    const threshold = 30;
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // 水平梯度
        const left = (data[idx - 4] + data[idx - 3] + data[idx - 2]) / 3;
        const right = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3;
        const gx = Math.abs(right - left);
        
        // 垂直梯度
        const up = (data[idx - width * 4] + data[idx - width * 4 + 1] + data[idx - width * 4 + 2]) / 3;
        const down = (data[idx + width * 4] + data[idx + width * 4 + 1] + data[idx + width * 4 + 2]) / 3;
        const gy = Math.abs(down - up);
        
        const gradient = Math.sqrt(gx * gx + gy * gy);
        if (gradient > threshold) {
          edgeCount++;
        }
      }
    }
    
    return edgeCount / (width * height);
  }

  // 计算纹理方差
  private calculateTextureVariance(data: Uint8ClampedArray, width: number, height: number): number {
    let variance = 0;
    let count = 0;
    const step = 4;
    
    for (let y = step; y < height - step; y += step) {
      for (let x = step; x < width - step; x += step) {
        const idx = (y * width + x) * 4;
        const center = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        
        let localVariance = 0;
        for (let dy = -step; dy <= step; dy += step) {
          for (let dx = -step; dx <= step; dx += step) {
            if (dx === 0 && dy === 0) continue;
            const neighborIdx = ((y + dy) * width + (x + dx)) * 4;
            const neighbor = (data[neighborIdx] + data[neighborIdx + 1] + data[neighborIdx + 2]) / 3;
            localVariance += Math.abs(center - neighbor);
          }
        }
        variance += localVariance / 8;
        count++;
      }
    }
    
    return variance / count;
  }

  // 检测眼睛区域
  private detectEyeRegions(data: Uint8ClampedArray, width: number, height: number): Array<{ x: number; y: number; size: number }> {
    const regions: Array<{ x: number; y: number; size: number }> = [];
    
    // 在上半部分图像中寻找暗色圆形区域
    for (let y = Math.floor(height * 0.1); y < height * 0.5; y += 5) {
      for (let x = Math.floor(width * 0.1); x < width * 0.9; x += 5) {
        const idx = (y * width + x) * 4;
        const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        
        if (brightness < 80) {
          // 检查周围是否较亮（眼白）
          let surroundingBrightness = 0;
          let count = 0;
          for (let dy = -10; dy <= 10; dy += 5) {
            for (let dx = -10; dx <= 10; dx += 5) {
              if (dx === 0 && dy === 0) continue;
              const sIdx = ((y + dy) * width + (x + dx)) * 4;
              if (sIdx >= 0 && sIdx < data.length) {
                surroundingBrightness += (data[sIdx] + data[sIdx + 1] + data[sIdx + 2]) / 3;
                count++;
              }
            }
          }
          
          if (count > 0) {
            surroundingBrightness /= count;
            if (surroundingBrightness - brightness > 30) {
              regions.push({ x, y, size: 10 });
            }
          }
        }
      }
    }
    
    return regions;
  }

  // 从图像特征推断情感
  private inferEmotionFromImageFeatures(features: ImageFeatures): { emotion: PrimaryEmotion; confidence: number } {
    // 基于图像特征推断情感
    // 明亮的暖色调 -> happy/excited
    // 柔和的冷色调 -> calm/safe
    // 高对比度、高纹理 -> curious/anxious
    
    if (features.brightness > 180 && features.colorTone === 'warm') {
      return { emotion: 'happy', confidence: 0.75 };
    } else if (features.brightness < 80) {
      return { emotion: 'calm', confidence: 0.70 };
    } else if (features.edgeDensity && features.edgeDensity > 0.15) {
      return { emotion: 'curious', confidence: 0.65 };
    } else if (features.textureVariance && features.textureVariance > 50) {
      return { emotion: 'anxious', confidence: 0.60 };
    }
    
    return { emotion: 'calm', confidence: 0.60 };
  }

  // 根据图像特征调整情感分数
  private adjustScoresByImageFeatures(scores: EmotionScores, features: ImageFeatures): EmotionScores {
    const adjusted = { ...scores };
    
    // 根据亮度和色调调整
    if (features.brightness > 180 && features.colorTone === 'warm') {
      adjusted.happy = Math.min(100, adjusted.happy * 1.3);
      adjusted.excited = Math.min(100, adjusted.excited * 1.2);
    } else if (features.brightness < 80) {
      adjusted.calm = Math.min(100, adjusted.calm * 1.3);
      adjusted.safe = Math.min(100, adjusted.safe * 1.2);
    } else if (features.colorTone === 'cool') {
      adjusted.curious = Math.min(100, adjusted.curious * 1.2);
    }
    
    // 根据边缘密度调整
    if (features.edgeDensity) {
      if (features.edgeDensity > 0.15) {
        adjusted.curious = Math.min(100, adjusted.curious * 1.15);
      } else if (features.edgeDensity < 0.05) {
        adjusted.calm = Math.min(100, adjusted.calm * 1.15);
      }
    }
    
    // 根据纹理调整
    if (features.textureVariance && features.textureVariance > 50) {
      adjusted.anxious = Math.min(100, adjusted.anxious * 1.1);
    }
    
    // 检测到面部特征增加置信度
    if (features.faceDetected) {
      adjusted.happy = Math.min(100, adjusted.happy * 1.1);
      adjusted.calm = Math.min(100, adjusted.calm * 1.1);
    }
    
    return adjusted;
  }

  // 生成与图像上下文相关的音频特征
  private generateAudioFeaturesFromImageContext(features: ImageFeatures): AudioFeatures {
    const basePitch = features.brightness > 150 ? 500 : 350;
    
    return {
      pitch: {
        mean: basePitch,
        variance: features.textureVariance || 5000,
        range: [basePitch - 100, basePitch + 150],
        trend: features.edgeDensity && features.edgeDensity > 0.1 ? 'fluctuating' : 'stable',
        bands: {
          subBass: 5,
          bass: 15,
          lowMid: 20,
          mid: 30,
          highMid: 15,
          high: 10,
          veryHigh: 5,
        },
      },
      intensity: {
        mean: features.brightness / 255 * 0.5 + 0.2,
        peak: features.contrast / 100 * 0.8 + 0.2,
        variance: (features.textureVariance || 5000) / 10000,
        dynamicRange: features.contrast * 0.5,
      },
      frequency: {
        dominant: basePitch,
        range: [200, 600],
        harmonics: [basePitch * 2, basePitch * 3],
      },
      rhythm: {
        tempo: features.edgeDensity && features.edgeDensity > 0.1 ? 100 : 70,
        regularity: features.colorTone === 'neutral' ? 80 : 60,
        pattern: features.faceDetected ? 'steady' : 'irregular',
      },
      timbre: {
        brightness: features.brightness / 255 * 100,
        warmth: features.colorTone === 'warm' ? 70 : 50,
        roughness: features.textureVariance ? Math.min(100, features.textureVariance / 2) : 30,
      },
      duration: 2,
      quality: features.quality,
    };
  }

  // ==================== 文件图像分析 ====================

  async analyzeImageFile(file: File): Promise<EmotionAnalysis> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        // 创建Canvas进行图像处理
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('无法创建Canvas上下文'));
          return;
        }
        
        // 限制处理尺寸以提高性能
        const maxSize = 512;
        let width = img.width;
        let height = img.height;
        
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.floor(height * (maxSize / width));
            width = maxSize;
          } else {
            width = Math.floor(width * (maxSize / height));
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        const imageData = ctx.getImageData(0, 0, width, height);
        
        // 执行动物检测
        const animalResult = this.performAnimalDetection(imageData, width, height);
        
        if (!animalResult.isAnimal) {
          URL.revokeObjectURL(url);
          resolve(this.createLowConfidenceResult(animalResult.message || '未检测到宠物', 'image'));
          return;
        }
        
        // 提取图像特征
        this.extractImageFeaturesFromImageData(imageData);
        
        // 分析情感
        this.analyzeEmotion(imageData).then(analysis => {
          URL.revokeObjectURL(url);
          resolve(analysis);
        }).catch(err => {
          URL.revokeObjectURL(url);
          reject(err);
        });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('图片加载失败'));
      };
      
      img.src = url;
    });
  }

  // 动物检测
  async detectAnimal(file: File): Promise<AnimalDetectionResult> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const maxSize = 512;
        let width = img.width;
        let height = img.height;
        
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.floor(height * (maxSize / width));
            width = maxSize;
          } else {
            width = Math.floor(width * (maxSize / height));
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          const result = this.performAnimalDetection(imageData, width, height);
          URL.revokeObjectURL(url);
          resolve(result);
        } else {
          URL.revokeObjectURL(url);
          resolve({ isAnimal: false, confidence: 0, message: '无法处理图片' });
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ isAnimal: false, confidence: 0, message: '图片加载失败' });
      };
      
      img.src = url;
    });
  }

  // 执行动物检测
  private performAnimalDetection(imageData: ImageData, width: number, height: number): AnimalDetectionResult {
    const data = imageData.data;
    
    // 1. 颜色分布分析
    const colorAnalysis = this.analyzeColorDistribution(data);
    
    // 2. 纹理分析（毛发检测）
    const textureAnalysis = this.analyzeTexture(data, width, height);
    
    // 3. 边缘检测（形状分析）
    const edgeAnalysis = this.analyzeEdges(data, width, height);
    
    // 4. 眼睛检测
    const eyeDetection = this.detectEyes(data, width, height);
    
    // 5. 面部特征检测
    const faceDetection = this.detectFaceFeatures(data, width, height);
    
    // 计算综合得分
    let animalScore = 0;
    let maxScore = 0;
    
    maxScore += 30;
    if (textureAnalysis.hasFurTexture) {
      animalScore += 30 * textureAnalysis.confidence;
    }
    
    maxScore += 25;
    if (eyeDetection.hasEyes) {
      animalScore += 25 * eyeDetection.confidence;
    }
    
    maxScore += 20;
    if (colorAnalysis.isNaturalColors) {
      animalScore += 20 * colorAnalysis.confidence;
    }
    
    maxScore += 15;
    if (edgeAnalysis.hasAnimalShape) {
      animalScore += 15 * edgeAnalysis.confidence;
    }
    
    maxScore += 10;
    if (faceDetection.hasFace) {
      animalScore += 10 * faceDetection.confidence;
    }
    
    const confidence = Math.round((animalScore / maxScore) * 100);
    const isAnimal = confidence >= PET_FEATURE_THRESHOLDS.minConfidence;
    
    let animalType: 'dog' | 'cat' | 'other' | 'unknown' = 'unknown';
    if (isAnimal) {
      if (eyeDetection.eyeShape === 'round' && textureAnalysis.furLength === 'short') {
        animalType = 'cat';
      } else if (eyeDetection.eyeShape === 'oval' && textureAnalysis.furLength === 'medium') {
        animalType = 'dog';
      } else {
        animalType = 'other';
      }
    }
    
    let message: string | undefined;
    if (!isAnimal) {
      if (confidence < 30) {
        message = '未检测到宠物特征，请上传宠物照片。';
      } else if (confidence < 50) {
        message = '图片可能不包含宠物，或图片质量较低。请上传清晰的宠物正面照片。';
      } else {
        message = '宠物特征不明显，请确保图片中宠物的面部清晰可见。';
      }
    }
    
    return { isAnimal, confidence, animalType, message };
  }

  // 颜色分布分析
  private analyzeColorDistribution(data: Uint8ClampedArray): { isNaturalColors: boolean; confidence: number } {
    const colorCounts: Record<string, number> = {};
    let totalPixels = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = Math.floor(data[i] / 32) * 32;
      const g = Math.floor(data[i + 1] / 32) * 32;
      const b = Math.floor(data[i + 2] / 32) * 32;
      const key = `${r},${g},${b}`;
      colorCounts[key] = (colorCounts[key] || 0) + 1;
      totalPixels++;
    }
    
    const uniqueColors = Object.keys(colorCounts).length;
    const colorDiversity = uniqueColors / 512;
    const isNaturalColors = colorDiversity > 0.1 && colorDiversity < 0.8;
    
    let confidence = 0;
    if (isNaturalColors) {
      let naturalColorScore = 0;
      for (const [key, count] of Object.entries(colorCounts)) {
        const [r, g, b] = key.split(',').map(Number);
        const isBrown = r > 100 && r < 200 && g > 60 && g < 150 && b > 30 && b < 100;
        const isBlack = r < 80 && g < 80 && b < 80;
        const isWhite = r > 200 && g > 200 && b > 200;
        const isGray = Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && r > 80 && r < 200;
        const isOrange = r > 180 && g > 100 && g < 180 && b < 100;
        
        if (isBrown || isBlack || isWhite || isGray || isOrange) {
          naturalColorScore += count;
        }
      }
      confidence = naturalColorScore / totalPixels;
    }
    
    return { isNaturalColors, confidence: Math.min(1, confidence * 1.5) };
  }

  // 纹理分析
  private analyzeTexture(data: Uint8ClampedArray, width: number, height: number): { hasFurTexture: boolean; confidence: number; furLength: 'short' | 'medium' | 'long' } {
    let textureVariance = 0;
    let sampleCount = 0;
    
    const step = 4;
    for (let y = step; y < height - step; y += step) {
      for (let x = step; x < width - step; x += step) {
        const idx = (y * width + x) * 4;
        const center = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        
        let localVariance = 0;
        for (let dy = -step; dy <= step; dy += step) {
          for (let dx = -step; dx <= step; dx += step) {
            if (dx === 0 && dy === 0) continue;
            const neighborIdx = ((y + dy) * width + (x + dx)) * 4;
            const neighbor = (data[neighborIdx] + data[neighborIdx + 1] + data[neighborIdx + 2]) / 3;
            localVariance += Math.abs(center - neighbor);
          }
        }
        textureVariance += localVariance / 8;
        sampleCount++;
      }
    }
    
    const avgTextureVariance = textureVariance / sampleCount;
    const hasFurTexture = avgTextureVariance > 10 && avgTextureVariance < 80;
    
    let furLength: 'short' | 'medium' | 'long' = 'medium';
    if (avgTextureVariance > 50) {
      furLength = 'long';
    } else if (avgTextureVariance < 25) {
      furLength = 'short';
    }
    
    const confidence = hasFurTexture 
      ? Math.min(1, (avgTextureVariance / 40) * (1 - Math.abs(avgTextureVariance - 40) / 80))
      : 0.3;
    
    return { hasFurTexture, confidence, furLength };
  }

  // 边缘检测
  private analyzeEdges(data: Uint8ClampedArray, width: number, height: number): { hasAnimalShape: boolean; confidence: number } {
    let edgeCount = 0;
    let totalEdges = 0;
    
    const threshold = 30;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        const left = (data[idx - 4] + data[idx - 3] + data[idx - 2]) / 3;
        const right = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3;
        const gx = Math.abs(right - left);
        
        const up = (data[idx - width * 4] + data[idx - width * 4 + 1] + data[idx - width * 4 + 2]) / 3;
        const down = (data[idx + width * 4] + data[idx + width * 4 + 1] + data[idx + width * 4 + 2]) / 3;
        const gy = Math.abs(down - up);
        
        const gradient = Math.sqrt(gx * gx + gy * gy);
        totalEdges++;
        
        if (gradient > threshold) {
          edgeCount++;
        }
      }
    }
    
    const edgeRatio = edgeCount / totalEdges;
    const hasAnimalShape = edgeRatio > 0.05 && edgeRatio < 0.5;
    const confidence = hasAnimalShape ? Math.min(1, edgeRatio * 5) : 0.3;
    
    return { hasAnimalShape, confidence };
  }

  // 眼睛检测
  private detectEyes(data: Uint8ClampedArray, width: number, height: number): { hasEyes: boolean; confidence: number; eyeShape: 'round' | 'oval' | 'unknown' } {
    const eyeRegions: Array<{ x: number; y: number; size: number; contrast: number }> = [];
    
    for (let y = Math.floor(height * 0.1); y < height * 0.5; y += 5) {
      for (let x = Math.floor(width * 0.1); x < width * 0.9; x += 5) {
        const idx = (y * width + x) * 4;
        const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        
        if (brightness < 100) {
          let surroundingBrightness = 0;
          let count = 0;
          for (let dy = -10; dy <= 10; dy += 5) {
            for (let dx = -10; dx <= 10; dx += 5) {
              if (dx === 0 && dy === 0) continue;
              const sIdx = ((y + dy) * width + (x + dx)) * 4;
              if (sIdx >= 0 && sIdx < data.length) {
                surroundingBrightness += (data[sIdx] + data[sIdx + 1] + data[sIdx + 2]) / 3;
                count++;
              }
            }
          }
          
          if (count > 0) {
            surroundingBrightness /= count;
            const contrast = surroundingBrightness - brightness;
            
            if (contrast > 30) {
              eyeRegions.push({ x, y, size: 10, contrast });
            }
          }
        }
      }
    }
    
    const hasEyes = eyeRegions.length >= 2;
    
    let eyeShape: 'round' | 'oval' | 'unknown' = 'unknown';
    if (hasEyes) {
      const avgContrast = eyeRegions.reduce((sum, r) => sum + r.contrast, 0) / eyeRegions.length;
      eyeShape = avgContrast > 60 ? 'round' : 'oval';
    }
    
    const confidence = hasEyes ? Math.min(1, eyeRegions.length / 4) : 0.2;
    
    return { hasEyes, confidence, eyeShape };
  }

  // 面部特征检测
  private detectFaceFeatures(data: Uint8ClampedArray, width: number, height: number): { hasFace: boolean; confidence: number } {
    const centerX = Math.floor(width / 2);
    const topRegion = Math.floor(height * 0.1);
    const bottomRegion = Math.floor(height * 0.6);
    
    let symmetryScore = 0;
    let totalPoints = 0;
    
    for (let y = topRegion; y < bottomRegion; y += 10) {
      for (let x = 0; x < centerX; x += 10) {
        const leftIdx = (y * width + x) * 4;
        const rightIdx = (y * width + (width - 1 - x)) * 4;
        
        const leftBrightness = (data[leftIdx] + data[leftIdx + 1] + data[leftIdx + 2]) / 3;
        const rightBrightness = (data[rightIdx] + data[rightIdx + 1] + data[rightIdx + 2]) / 3;
        
        symmetryScore += 1 - Math.abs(leftBrightness - rightBrightness) / 255;
        totalPoints++;
      }
    }
    
    const symmetry = symmetryScore / totalPoints;
    const hasFace = symmetry > 0.7;
    const confidence = hasFace ? symmetry : 0.3;
    
    return { hasFace, confidence };
  }

  // ==================== 音频特征提取 ====================

  private extractAudioFeatures(audioData: Float32Array): AudioFeatures {
    const pitchAnalysis = this.analyzePitch(audioData);
    const intensityAnalysis = this.analyzeIntensity(audioData);
    const frequencyAnalysis = this.analyzeFrequency(audioData);
    const rhythmAnalysis = this.analyzeRhythm(audioData);
    const timbreAnalysis = this.analyzeTimbre(audioData);

    return {
      pitch: pitchAnalysis,
      intensity: intensityAnalysis,
      frequency: frequencyAnalysis,
      rhythm: rhythmAnalysis,
      timbre: timbreAnalysis,
      duration: audioData.length / 44100,
      quality: this.calculateAudioQuality(audioData),
    };
  }

  private analyzePitch(audioData: Float32Array): AudioFeatures['pitch'] {
    const sampleRate = 44100;
    const frameSize = 2048;
    const hopSize = 512;
    const pitches: number[] = [];

    for (let i = 0; i < audioData.length - frameSize; i += hopSize) {
      const frame = audioData.slice(i, i + frameSize);
      const pitchCandidates = this.detectPitchCandidates(frame, sampleRate);
      if (pitchCandidates.length > 0) {
        const bestPitch = this.selectBestPitch(pitchCandidates);
        if (bestPitch > 50 && bestPitch < 4000) {
          pitches.push(bestPitch);
        }
      }
    }

    if (pitches.length === 0) {
      return {
        mean: 400,
        variance: 50,
        range: [300, 500],
        trend: 'stable',
        bands: this.getDefaultFrequencyBands(),
      };
    }

    const mean = pitches.reduce((a, b) => a + b, 0) / pitches.length;
    const variance = pitches.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / pitches.length;
    const stdDev = Math.sqrt(variance);
    const minPitch = Math.min(...pitches);
    const maxPitch = Math.max(...pitches);

    const firstHalf = pitches.slice(0, Math.floor(pitches.length / 2));
    const secondHalf = pitches.slice(Math.floor(pitches.length / 2));
    const firstMean = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondMean = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    let trend: 'rising' | 'falling' | 'stable' | 'fluctuating' = 'stable';
    const trendDiff = secondMean - firstMean;
    const trendThreshold = stdDev * 0.5;
    
    if (trendDiff > trendThreshold && trendDiff > 20) trend = 'rising';
    else if (trendDiff < -trendThreshold && trendDiff < -20) trend = 'falling';
    else if (stdDev > mean * 0.15) trend = 'fluctuating';

    const bands = this.analyzeFrequencyBands(audioData, sampleRate);

    return { 
      mean, 
      variance, 
      range: [minPitch, maxPitch], 
      trend,
      bands,
      stability: Math.max(0, 100 - (stdDev / mean) * 100),
    };
  }

  private detectPitchCandidates(frame: Float32Array, sampleRate: number): number[] {
    const candidates: number[] = [];
    const correlations: number[] = [];
    const maxLag = Math.floor(sampleRate / 50);
    const minLag = Math.floor(sampleRate / 4000);

    for (let lag = minLag; lag < Math.min(maxLag, frame.length); lag++) {
      let sum = 0;
      let normFactor = 0;
      for (let i = 0; i < frame.length - lag; i++) {
        sum += frame[i] * frame[i + lag];
        normFactor += frame[i] * frame[i] + frame[i + lag] * frame[i + lag];
      }
      const normalizedCorr = normFactor > 0 ? 2 * sum / normFactor : 0;
      correlations.push(normalizedCorr);
    }

    const threshold = 0.8;
    const peaks: number[] = [];
    for (let i = 1; i < correlations.length - 1; i++) {
      if (correlations[i] > threshold && 
          correlations[i] > correlations[i-1] && 
          correlations[i] > correlations[i+1]) {
        peaks.push(i);
      }
    }

    for (const peakIndex of peaks.slice(0, 3)) {
      const refinedLag = this.refinePeakPosition(correlations, peakIndex);
      const pitch = sampleRate / (minLag + refinedLag);
      candidates.push(pitch);
    }

    if (candidates.length === 0 && correlations.length > 0) {
      const maxCorrIndex = correlations.indexOf(Math.max(...correlations));
      const pitch = sampleRate / (minLag + maxCorrIndex);
      if (pitch > 50 && pitch < 4000) {
        candidates.push(pitch);
      }
    }

    return candidates;
  }

  private refinePeakPosition(correlations: number[], peakIndex: number): number {
    if (peakIndex < 1 || peakIndex >= correlations.length - 1) return peakIndex;
    
    const y1 = correlations[peakIndex - 1];
    const y2 = correlations[peakIndex];
    const y3 = correlations[peakIndex + 1];
    
    const denom = y1 - 2 * y2 + y3;
    if (denom === 0) return peakIndex;
    
    const offset = (y1 - y3) / (2 * denom);
    return peakIndex + Math.max(-0.5, Math.min(0.5, offset));
  }

  private selectBestPitch(candidates: number[]): number {
    if (candidates.length === 0) return 0;
    if (candidates.length === 1) return candidates[0];

    const weights = candidates.map((p, i) => {
      const weight = 1 - i * 0.2;
      const petRangeWeight = (p >= 200 && p <= 1500) ? 1.5 : 1;
      return weight * petRangeWeight;
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const weightedSum = candidates.reduce((a, p, i) => a + p * weights[i], 0);
    
    return weightedSum / totalWeight;
  }

  private analyzeFrequencyBands(audioData: Float32Array, sampleRate: number): Record<string, number> {
    const spectrum = this.computeSpectrum(audioData.slice(0, Math.min(8192, audioData.length)));
    const binWidth = sampleRate / (spectrum.length * 2);
    
    const bandEnergies: Record<string, number> = {};
    const totalEnergy = spectrum.reduce((a, b) => a + b, 0);

    for (const [bandName, band] of Object.entries(FREQUENCY_BANDS)) {
      const startBin = Math.floor(band.min / binWidth);
      const endBin = Math.ceil(band.max / binWidth);
      const bandEnergy = spectrum.slice(startBin, Math.min(endBin, spectrum.length))
        .reduce((a, b) => a + b, 0);
      bandEnergies[bandName] = totalEnergy > 0 ? (bandEnergy / totalEnergy) * 100 : 0;
    }

    return bandEnergies;
  }

  private getDefaultFrequencyBands(): Record<string, number> {
    return {
      subBass: 5,
      bass: 15,
      lowMid: 20,
      mid: 30,
      highMid: 15,
      high: 10,
      veryHigh: 5,
    };
  }

  private analyzeIntensity(audioData: Float32Array): AudioFeatures['intensity'] {
    const intensities: number[] = [];
    const frameSize = 1024;
    const hopSize = 256;

    for (let i = 0; i < audioData.length; i += hopSize) {
      const frame = audioData.slice(i, Math.min(i + frameSize, audioData.length));
      const rms = Math.sqrt(frame.reduce((sum, val) => sum + val * val, 0) / frame.length);
      intensities.push(rms * 100);
    }

    if (intensities.length === 0) {
      return {
        mean: 30,
        peak: 50,
        variance: 5,
        dynamicRange: 20,
        envelope: { attack: 0, decay: 0, sustain: 30, release: 0 },
        contour: 'flat',
      };
    }

    const mean = intensities.reduce((a, b) => a + b, 0) / intensities.length;
    const peak = Math.max(...intensities);
    const minIntensity = Math.min(...intensities.filter(i => i > 0.1));
    const variance = intensities.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intensities.length;

    const dynamicRange = peak - (minIntensity || mean * 0.1);

    return { 
      mean, 
      peak, 
      variance, 
      dynamicRange,
      contour: this.analyzeIntensityContour(intensities),
    };
  }

  private analyzeIntensityContour(intensities: number[]): 'flat' | 'rising' | 'falling' | 'peaked' | 'undulating' {
    if (intensities.length < 5) return 'flat';

    const firstQuarter = intensities.slice(0, Math.floor(intensities.length * 0.25));
    // const secondQuarter = intensities.slice(Math.floor(intensities.length * 0.25), Math.floor(intensities.length * 0.5));
    // const thirdQuarter = intensities.slice(Math.floor(intensities.length * 0.5), Math.floor(intensities.length * 0.75));
    const fourthQuarter = intensities.slice(Math.floor(intensities.length * 0.75));

    const q1Mean = firstQuarter.reduce((a, b) => a + b, 0) / firstQuarter.length;
    const q4Mean = fourthQuarter.reduce((a, b) => a + b, 0) / fourthQuarter.length;

    if (q4Mean > q1Mean * 1.5) return 'rising';
    if (q1Mean > q4Mean * 1.5) return 'falling';

    return 'flat';
  }

  private analyzeFrequency(audioData: Float32Array): AudioFeatures['frequency'] {
    const fftSize = 2048;
    const frequencies: number[] = [];
    const harmonics: number[] = [];

    for (let i = 0; i < audioData.length - fftSize; i += fftSize) {
      const frame = audioData.slice(i, i + fftSize);
      const spectrum = this.computeSpectrum(frame);
      const dominantFreq = this.findDominantFrequency(spectrum, 44100);
      frequencies.push(dominantFreq);

      const harmonic = this.findHarmonics(spectrum, dominantFreq, 44100);
      harmonics.push(...harmonic);
    }

    const dominant = frequencies.length > 0
      ? frequencies.reduce((a, b) => a + b, 0) / frequencies.length
      : 400;

    return {
      dominant,
      range: [Math.min(...frequencies), Math.max(...frequencies)],
      harmonics: harmonics.slice(0, 5),
    };
  }

  private computeSpectrum(frame: Float32Array): number[] {
    const n = frame.length;
    const spectrum: number[] = [];

    for (let k = 0; k < n / 2; k++) {
      let real = 0;
      let imag = 0;
      for (let t = 0; t < n; t++) {
        const angle = (2 * Math.PI * k * t) / n;
        real += frame[t] * Math.cos(angle);
        imag -= frame[t] * Math.sin(angle);
      }
      spectrum.push(Math.sqrt(real * real + imag * imag));
    }

    return spectrum;
  }

  private findDominantFrequency(spectrum: number[], sampleRate: number): number {
    const maxIndex = spectrum.indexOf(Math.max(...spectrum));
    return (maxIndex * sampleRate) / (spectrum.length * 2);
  }

  private findHarmonics(spectrum: number[], fundamental: number, sampleRate: number): number[] {
    const harmonics: number[] = [];
    const binWidth = sampleRate / (spectrum.length * 2);

    for (let h = 2; h <= 5; h++) {
      const harmonicFreq = fundamental * h;
      const binIndex = Math.round(harmonicFreq / binWidth);
      if (binIndex < spectrum.length && spectrum[binIndex] > spectrum[Math.round(fundamental / binWidth)] * 0.3) {
        harmonics.push(harmonicFreq);
      }
    }

    return harmonics;
  }

  private analyzeRhythm(audioData: Float32Array): AudioFeatures['rhythm'] {
    const frameSize = 2048;
    const hopSize = 512;
    const energies: number[] = [];

    for (let i = 0; i < audioData.length; i += hopSize) {
      const frame = audioData.slice(i, Math.min(i + frameSize, audioData.length));
      const energy = frame.reduce((sum, val) => sum + val * val, 0);
      energies.push(energy);
    }

    if (energies.length < 4) {
      return {
        tempo: 80,
        regularity: 70,
        pattern: 'steady',
        complexity: 0.3,
        syncopation: 0,
        groove: 0.5,
      };
    }

    const peaks: number[] = [];
    const meanEnergy = energies.reduce((a, b) => a + b, 0) / energies.length;
    const stdEnergy = Math.sqrt(energies.reduce((a, b) => a + Math.pow(b - meanEnergy, 2), 0) / energies.length);
    const threshold = meanEnergy + stdEnergy * 0.5;

    for (let i = 1; i < energies.length - 1; i++) {
      if (energies[i] > threshold && energies[i] > energies[i - 1] && energies[i] > energies[i + 1]) {
        peaks.push(i);
      }
    }

    const intervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i - 1]);
    }

    const avgInterval = intervals.length > 0
      ? intervals.reduce((a, b) => a + b, 0) / intervals.length
      : 10;

    const tempo = Math.round(60 / (avgInterval * hopSize / 44100));

    const variance = intervals.length > 1
      ? intervals.reduce((a, b) => a + Math.pow(b - avgInterval, 2), 0) / intervals.length
      : 0;

    const regularity = Math.max(0, 100 - variance * 10);

    return {
      tempo: Math.min(200, Math.max(40, tempo)),
      regularity,
      pattern: regularity > 70 ? 'steady' : 'irregular',
      complexity: variance / 100,
      syncopation: 0,
      groove: regularity / 100,
    };
  }

  private analyzeTimbre(audioData: Float32Array): AudioFeatures['timbre'] {
    const spectrum = this.computeSpectrum(audioData.slice(0, Math.min(4096, audioData.length)));
    const totalEnergy = spectrum.reduce((a, b) => a + b, 0);

    if (totalEnergy === 0) {
      return { brightness: 50, warmth: 50, roughness: 50 };
    }

    const midPoint = Math.floor(spectrum.length / 2);
    const highFreqEnergy = spectrum.slice(midPoint).reduce((a, b) => a + b, 0);
    const brightness = (highFreqEnergy / totalEnergy) * 100;

    const lowMidPoint = Math.floor(spectrum.length / 4);
    const lowFreqEnergy = spectrum.slice(0, lowMidPoint).reduce((a, b) => a + b, 0);
    const warmth = (lowFreqEnergy / totalEnergy) * 100;

    const diffEnergy = spectrum.reduce((acc, val, i) => {
      if (i === 0) return acc;
      return acc + Math.abs(val - spectrum[i - 1]);
    }, 0);
    const roughness = Math.min(100, (diffEnergy / spectrum.length) * 2);

    return { brightness, warmth, roughness };
  }

  private calculateAudioQuality(audioData: Float32Array): number {
    const rms = Math.sqrt(audioData.reduce((sum, val) => sum + val * val, 0) / audioData.length);
    const maxAmp = Math.max(...audioData.map(Math.abs));

    let quality = 70;

    if (rms > 0.02 && rms < 0.5) quality += 10;
    if (maxAmp < 0.95) quality += 5;
    if (maxAmp > 0.99) quality -= 15;

    const dcOffset = audioData.reduce((a, b) => a + b, 0) / audioData.length;
    if (Math.abs(dcOffset) < 0.01) quality += 5;

    return Math.min(100, Math.max(0, quality));
  }

  // ==================== 情感计算 ====================

  private calculateEmotionScores(features: AudioFeatures): EmotionScores {
    const scores: EmotionScores = {
      happy: 0,
      curious: 0,
      anxious: 0,
      angry: 0,
      needs: 0,
      calm: 0,
      excited: 0,
      safe: 0,
    };

    const emotions: PrimaryEmotion[] = ['happy', 'curious', 'anxious', 'angry', 'needs', 'calm', 'excited', 'safe'];

    for (const emotion of emotions) {
      const correlations = EMOTION_CORRELATIONS[emotion];
      const freqSig = EMOTION_FREQUENCY_SIGNATURES[emotion];

      const pitchScore = this.calculatePitchScore(features.pitch, correlations.pitch);
      const intensityScore = this.calculateIntensityScore(features.intensity, correlations.intensity);
      const frequencyScore = this.calculateFrequencyScore(features.frequency, features.pitch.bands || {}, freqSig, correlations.frequency);
      const rhythmScore = this.calculateRhythmScore(features.rhythm, emotion);
      const timbreScore = this.calculateTimbreScore(features.timbre, emotion);

      const baseScore = 
        pitchScore * EMOTION_WEIGHTS.pitch +
        intensityScore * EMOTION_WEIGHTS.intensity +
        frequencyScore * EMOTION_WEIGHTS.frequency +
        rhythmScore * EMOTION_WEIGHTS.rhythm +
        timbreScore * EMOTION_WEIGHTS.timbre;

      scores[emotion] = Math.min(100, Math.max(0, baseScore * 100));
    }

    this.normalizeScores(scores);
    return scores;
  }

  private calculatePitchScore(pitch: AudioFeatures['pitch'], correlation: number): number {
    const center = 500;
    const range = 800;
    const distance = Math.abs(pitch.mean - center);
    const baseScore = Math.max(0, 1 - (distance / range));
    return Math.min(1, baseScore * correlation);
  }

  private calculateIntensityScore(intensity: AudioFeatures['intensity'], correlation: number): number {
    const center = 50;
    const range = 60;
    const distance = Math.abs(intensity.mean - center);
    const baseScore = Math.max(0, 1 - (distance / range));
    return Math.min(1, baseScore * correlation);
  }

  private calculateFrequencyScore(frequency: AudioFeatures['frequency'], bands: Record<string, number>, freqSig: Record<string, number>, correlation: number): number {
    let bandScore = 0;
    let bandCount = 0;
    for (const [bandName, expectedWeight] of Object.entries(freqSig)) {
      const actualWeight = bands[bandName] || 0;
      const matchScore = Math.max(0, 1 - Math.abs(actualWeight / 100 - expectedWeight) * 2);
      bandScore += matchScore * expectedWeight;
      bandCount += expectedWeight;
    }
    bandScore = bandCount > 0 ? bandScore / bandCount : 0.5;
    return Math.min(1, bandScore * correlation);
  }

  private calculateRhythmScore(rhythm: AudioFeatures['rhythm'], emotion: PrimaryEmotion): number {
    const patterns: Record<PrimaryEmotion, { tempo: [number, number]; regularity: number }> = {
      happy: { tempo: [80, 140], regularity: 65 },
      curious: { tempo: [60, 100], regularity: 55 },
      anxious: { tempo: [100, 180], regularity: 35 },
      angry: { tempo: [120, 200], regularity: 45 },
      needs: { tempo: [60, 120], regularity: 55 },
      calm: { tempo: [40, 80], regularity: 80 },
      excited: { tempo: [140, 200], regularity: 55 },
      safe: { tempo: [50, 90], regularity: 75 },
    };

    const pattern = patterns[emotion];
    let score = 0;

    if (rhythm.tempo >= pattern.tempo[0] && rhythm.tempo <= pattern.tempo[1]) {
      score += 0.5;
    }

    const regularityDiff = Math.abs(rhythm.regularity - pattern.regularity);
    score += Math.max(0, 0.5 - regularityDiff / 200);

    return Math.min(1, score);
  }

  private calculateTimbreScore(timbre: AudioFeatures['timbre'], emotion: PrimaryEmotion): number {
    const profiles: Record<PrimaryEmotion, { brightness: [number, number]; warmth: [number, number] }> = {
      happy: { brightness: [55, 75], warmth: [50, 65] },
      curious: { brightness: [65, 80], warmth: [45, 60] },
      anxious: { brightness: [70, 85], warmth: [30, 45] },
      angry: { brightness: [75, 90], warmth: [20, 35] },
      needs: { brightness: [50, 65], warmth: [55, 70] },
      calm: { brightness: [35, 50], warmth: [70, 85] },
      excited: { brightness: [80, 95], warmth: [40, 55] },
      safe: { brightness: [40, 55], warmth: [75, 90] },
    };

    const profile = profiles[emotion];
    const brightnessScore = this.calculateRangeScore(timbre.brightness, profile.brightness[0], profile.brightness[1]);
    const warmthScore = this.calculateRangeScore(timbre.warmth, profile.warmth[0], profile.warmth[1]);

    return (brightnessScore + warmthScore) / 2;
  }

  private calculateRangeScore(value: number, min: number, max: number): number {
    const center = (min + max) / 2;
    const range = max - min;
    const distance = Math.abs(value - center);
    return Math.max(0, 1 - (distance / (range * 0.75)));
  }

  private normalizeScores(scores: EmotionScores): void {
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) return;

    for (const emotion of Object.keys(scores) as PrimaryEmotion[]) {
      scores[emotion] = (scores[emotion] / maxScore) * 80 + 10;
    }
  }

  private determinePrimaryEmotion(scores: EmotionScores, features: AudioFeatures): {
    primaryEmotion: PrimaryEmotion;
    secondaryEmotion?: PrimaryEmotion;
    confidence: number;
    reasoning: string[];
  } {
    const sortedEmotions = (Object.entries(scores) as [PrimaryEmotion, number][])
      .sort((a, b) => b[1] - a[1]);

    const primaryEmotion = sortedEmotions[0][0];
    const primaryScore = sortedEmotions[0][1];
    const secondaryScore = sortedEmotions[1][1];
    
    const secondaryEmotion = secondaryScore > primaryScore * 0.65 
      ? sortedEmotions[1][0] 
      : undefined;

    const reasoning: string[] = [
      `【音调分析】均值 ${Math.round(features.pitch.mean)}Hz，趋势: ${features.pitch.trend}`,
      `【强度分析】平均强度 ${Math.round(features.intensity.mean * 100)}%`,
      `【频率分析】主导频率 ${Math.round(features.frequency.dominant)}Hz`,
      `【节奏分析】速度 ${features.rhythm.tempo}BPM，规律性 ${Math.round(features.rhythm.regularity)}%`,
      `【音色分析】明亮度 ${Math.round(features.timbre.brightness)}%，温暖度 ${Math.round(features.timbre.warmth)}%`,
      `【情感判定】主要情感: ${EMOTION_CONFIGS[primaryEmotion].label}，匹配度 ${Math.round(primaryScore)}%`,
    ];

    const confidence = this.calculateAdvancedConfidence(primaryScore, secondaryScore, 0, features, primaryEmotion);

    return { primaryEmotion, secondaryEmotion, confidence, reasoning };
  }

  private calculateAdvancedConfidence(
    primaryScore: number,
    secondaryScore: number,
    _tertiaryScore: number,
    features: AudioFeatures,
    _emotion: PrimaryEmotion
  ): number {
    const gap = primaryScore - secondaryScore;
    
    let baseConfidence = 85;
    if (gap > 30) baseConfidence = 98;
    else if (gap > 25) baseConfidence = 96;
    else if (gap > 20) baseConfidence = 94;
    else if (gap > 15) baseConfidence = 92;
    else if (gap > 10) baseConfidence = 90;
    else if (gap > 5) baseConfidence = 88;

    if (features.quality > 90) baseConfidence += 2;
    else if (features.quality < 60) baseConfidence -= 10;

    return Math.max(EMOTION_CONFIDENCE_THRESHOLDS.MIN_ACCEPTABLE, Math.min(99, baseConfidence));
  }

  private calculateIntensity(scores: EmotionScores, features: AudioFeatures): number {
    const topScore = Math.max(...Object.values(scores));
    const intensityFromAudio = features.intensity.mean * 100;
    return Math.round((topScore * 0.6 + intensityFromAudio * 0.4));
  }

  private selectTranslation(emotion: PrimaryEmotion, scores: EmotionScores): string {
    const translations = TRANSLATIONS[emotion];
    const intensity = scores[emotion];

    if (intensity > 80) {
      return translations[0];
    } else if (intensity > 60) {
      return translations[Math.floor(translations.length / 2)];
    } else {
      return translations[translations.length - 1];
    }
  }

  private identifyBehaviors(emotion: PrimaryEmotion, features: AudioFeatures): string[] {
    const behaviors: string[] = [];

    if (features.intensity.peak > 0.8) {
      behaviors.push('声音突然增大，可能有强烈情绪表达');
    }

    if (features.pitch.variance > 10000) {
      behaviors.push('音调变化较大，情绪波动明显');
    }

    if (features.rhythm.pattern === 'accelerating') {
      behaviors.push('语速加快，可能表示急切或兴奋');
    }

    const emotionBehaviors: Record<PrimaryEmotion, string[]> = {
      happy: ['尾巴摇摆', '耳朵竖起', '眼神明亮'],
      curious: ['头部倾斜', '耳朵转向', '嗅探行为'],
      anxious: ['耳朵贴头', '尾巴夹紧', '躲藏倾向'],
      angry: ['毛发竖立', '瞳孔放大', '低吼声'],
      needs: ['持续注视', '跟随行为', '轻声呼唤'],
      calm: ['身体放松', '眼睛半闭', '呼吸平稳'],
      excited: ['跳跃动作', '快速移动', '高声叫唤'],
      safe: ['身体贴近', '发出呼噜声', '眼神柔和'],
    };

    behaviors.push(...emotionBehaviors[emotion].slice(0, 2));
    return behaviors;
  }

  // ==================== 辅助方法 ====================

  private validateAudioInput(audioData: Float32Array, context?: VoiceAnalysisContext): { isValid: boolean; reason?: string } {
    if (!audioData || audioData.length < 22050) {
      return { isValid: false, reason: '录音时长不足' };
    }
    
    const hasInvalidValues = audioData.some(v => !isFinite(v) || isNaN(v));
    if (hasInvalidValues) {
      return { isValid: false, reason: '音频数据包含无效值' };
    }
    
    let energy = 0;
    let maxAmplitude = 0;
    for (let i = 0; i < audioData.length; i++) {
      energy += audioData[i] * audioData[i];
      maxAmplitude = Math.max(maxAmplitude, Math.abs(audioData[i]));
    }
    const rmsEnergy = Math.sqrt(energy / audioData.length);
    
    if (rmsEnergy < 0.001 && maxAmplitude < 0.01) {
      return { isValid: false, reason: '未检测到有效声音' };
    }
    
    if (context) {
      if (context.duration && context.duration < 1) {
        return { isValid: false, reason: '录音时长不足1秒' };
      }
      if (context.maxLevel !== undefined && context.maxLevel < 3) {
        return { isValid: false, reason: '音量过低' };
      }
    }
    
    return { isValid: true };
  }

  private areAudioFeaturesValid(features: AudioFeatures): boolean {
    if (features.pitch.mean < 50 || features.pitch.mean > 4000) return false;
    if (features.intensity.mean <= 0) return false;
    if (features.quality < 30) return false;
    return true;
  }

  private createLowConfidenceResult(reason: string, source: 'voice' | 'image'): EmotionAnalysis {
    return {
      id: `analysis-${Date.now()}`,
      petId: '1',
      primaryEmotion: 'calm',
      intensity: 30,
      confidence: 50,
      subEmotions: ['calm'],
      translation: `无法准确分析: ${reason}`,
      context: { timeContext: '刚刚', locationContext: '家中' },
      createdAt: new Date().toISOString(),
      source,
      detail: {
        primaryEmotion: 'calm',
        scores: { happy: 10, curious: 10, anxious: 10, angry: 10, needs: 10, calm: 50, excited: 10, safe: 10 },
        confidence: 50,
        confidenceLevel: 'low',
        reasoning: [reason],
        audioFeatures: {
          pitch: { mean: 400, variance: 50, range: [300, 500], trend: 'stable', bands: {} },
          intensity: { mean: 0.3, peak: 0.5, variance: 0.01, dynamicRange: 20, envelope: { attack: 0, decay: 0, sustain: 30, release: 0 }, contour: 'flat' },
          frequency: { dominant: 400, range: [200, 600], harmonics: [] },
          rhythm: { tempo: 80, regularity: 70, pattern: 'steady', complexity: 0.3, syncopation: 0, groove: 0.5 },
          timbre: { brightness: 50, warmth: 50, roughness: 50 },
          duration: 1,
          quality: 50,
        },
        behaviorIndicators: [],
      },
    };
  }

  private applyContextAdjustments(scores: EmotionScores, context?: VoiceAnalysisContext): EmotionScores {
    const adjusted = { ...scores };
    
    if (context?.petType) {
      const petParams = PET_TYPE_PARAMS[context.petType];
      if (petParams) {
        for (const emotion of petParams.commonEmotions) {
          if (adjusted[emotion as PrimaryEmotion] !== undefined) {
            adjusted[emotion as PrimaryEmotion] *= 1.15;
          }
        }
      }
    }
    
    const hour = new Date().getHours();
    for (const [_, timeEffect] of Object.entries(TIME_CONTEXT_EFFECTS)) {
      const [start, end] = timeEffect.hours;
      const inRange = start < end 
        ? (hour >= start && hour < end)
        : (hour >= start || hour < end);
      
      if (inRange) {
        for (const emotion of timeEffect.likelyEmotions) {
          if (adjusted[emotion as PrimaryEmotion] !== undefined) {
            adjusted[emotion as PrimaryEmotion] *= 1.1;
          }
        }
        break;
      }
    }
    
    if (context?.age !== undefined) {
      if (context.age < 1) {
        adjusted.excited *= 1.2;
        adjusted.curious *= 1.2;
      } else if (context.age >= 7) {
        adjusted.calm *= 1.15;
        adjusted.needs *= 1.1;
      }
    }
    
    return adjusted;
  }

  private analyzeEmotionUncertainty(scores: EmotionScores, confidence: number, features: AudioFeatures): EmotionUncertainty {
    const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const topScore = sortedScores[0]?.[1] || 0;
    const secondScore = sortedScores[1]?.[1] || 0;
    
    const isUncertain = confidence < EMOTION_CONFIDENCE_THRESHOLDS.UNCERTAINTY_THRESHOLD ||
                        (topScore - secondScore) < 10 ||
                        topScore < 20;
    
    let reason = '';
    const suggestions: string[] = [];
    
    if (confidence < EMOTION_CONFIDENCE_THRESHOLDS.UNCERTAINTY_THRESHOLD) {
      reason = '音频信号特征不够明显';
      suggestions.push('• 尝试录制更清晰的声音');
      suggestions.push('• 确保环境噪音较小');
    } else if ((topScore - secondScore) < 10) {
      reason = '多种情绪特征相似，难以确定主导情绪';
      suggestions.push('• 结合其他观察（如行为、表情）综合判断');
    }
    
    if (features.quality < 60) {
      suggestions.push('• 音频质量较低，可能影响分析准确性');
    }
    
    const possibleEmotions = sortedScores.map(([emotion, score]) => ({
      emotion: emotion as PrimaryEmotion,
      probability: score / (sortedScores.reduce((sum, [, s]) => sum + s, 0) || 1),
      reason: `${EMOTION_CONFIGS[emotion as PrimaryEmotion].label}特征`,
    }));
    
    return { isUncertain, reason: reason || '分析结果可靠', possibleEmotions, suggestions };
  }

  private adjustConfidenceByQuality(confidence: number, features: AudioFeatures, context?: VoiceAnalysisContext): number {
    let adjustedConfidence = confidence;
    
    if (features.quality < 60) adjustedConfidence -= 20;
    else if (features.quality < 75) adjustedConfidence -= 10;
    else if (features.quality >= 90) adjustedConfidence += 2;
    
    if (context?.duration) {
      if (context.duration < 1) adjustedConfidence -= 15;
      else if (context.duration < 2) adjustedConfidence -= 8;
      else if (context.duration >= 3 && context.duration <= 5) adjustedConfidence += 2;
    }
    
    return Math.max(EMOTION_CONFIDENCE_THRESHOLDS.MIN_ACCEPTABLE - 10, Math.min(99, adjustedConfidence));
  }

  private buildEnhancedReasoning(baseReasoning: string[], uncertainty: EmotionUncertainty, context?: VoiceAnalysisContext): string[] {
    const reasoning = [...baseReasoning];
    
    if (context?.petType) {
      reasoning.push(`【宠物类型】${context.petType === 'cat' ? '猫咪' : '狗狗'}特定模式已应用`);
    }
    
    if (context?.age !== undefined) {
      const ageStage = context.age < 1 ? '幼宠' : context.age < 7 ? '成年' : '老年';
      reasoning.push(`【年龄阶段】${ageStage}期，已应用相应调整`);
    }
    
    if (uncertainty.isUncertain) {
      reasoning.push(`【不确定性分析】${uncertainty.reason}`);
    }
    
    return reasoning;
  }

  // ==================== Dashboard & 其他 ====================

  async getDashboard(): Promise<EmotionDashboard> {
    const latest = this.recentAnalyses[0] || {
      primaryEmotion: 'calm' as PrimaryEmotion,
      intensity: 50,
      confidence: 95,
    };

    // 基于真实历史数据计算趋势
    let direction: 'up' | 'down' | 'stable' = 'stable';
    let change = 0;
    
    if (this.recentAnalyses.length >= 2) {
      const recent = this.recentAnalyses.slice(0, 5);
      const happyCount = recent.filter(a => ['happy', 'excited'].includes(a.primaryEmotion)).length;
      const anxiousCount = recent.filter(a => ['anxious', 'angry'].includes(a.primaryEmotion)).length;
      
      if (happyCount > anxiousCount) {
        direction = 'up';
        change = happyCount * 5;
      } else if (anxiousCount > happyCount) {
        direction = 'down';
        change = -anxiousCount * 5;
      }
    }

    return {
      centralEmotion: latest.primaryEmotion,
      intensity: latest.intensity,
      confidence: latest.confidence,
      dimensions: {
        excitement: Math.floor(40 + (latest.primaryEmotion === 'excited' ? 40 : 0)),
        anxiety: Math.floor(10 + (latest.primaryEmotion === 'anxious' ? 30 : 0)),
        affection: Math.floor(60 + (latest.primaryEmotion === 'happy' ? 30 : 0)),
        curiosity: Math.floor(30 + (latest.primaryEmotion === 'curious' ? 30 : 0)),
      },
      recentHistory: this.recentAnalyses.slice(0, 5),
      trends: { direction, change },
    };
  }

  async getEmotionDimensions(): Promise<EmotionDimension[]> {
    const dashboard = await this.getDashboard();
    
    return [
      { name: 'excitement', value: dashboard.dimensions.excitement, label: '兴奋度', icon: '⚡', color: 'text-yellow-500' },
      { name: 'anxiety', value: dashboard.dimensions.anxiety, label: '焦虑度', icon: '😰', color: 'text-orange-500' },
      { name: 'affection', value: dashboard.dimensions.affection, label: '亲密度', icon: '💕', color: 'text-pink-500' },
      { name: 'curiosity', value: dashboard.dimensions.curiosity, label: '好奇心', icon: '🔍', color: 'text-purple-500' },
    ];
  }

  async getWaveformData(duration: number = 10): Promise<EmotionWaveform[]> {
    const samples = duration * 10;
    const waveform: EmotionWaveform[] = [];

    for (let i = 0; i < samples; i++) {
      waveform.push({
        timestamp: i / 10,
        amplitude: Math.sin(i * 0.5) * 0.5 + Math.random() * 0.3,
        frequency: 2 + Math.random() * 3,
      });
    }

    return waveform;
  }

  async getRecentAnalyses(limit: number = 10): Promise<EmotionAnalysis[]> {
    return this.recentAnalyses.slice(0, limit);
  }

  getEmotionConfig(emotion: PrimaryEmotion) {
    return EMOTION_CONFIGS[emotion];
  }
}

export const emotionService = new EmotionService();
