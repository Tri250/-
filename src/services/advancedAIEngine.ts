/**
 * Advanced AI Emotion Recognition Engine
 * PawSync Pro - 行业领先AI算法
 * 支持图像、语音、行为多模态情感分析
 */

// 情感类型定义
export type EmotionType = 
  | 'happy'        // 开心
  | 'sad'          // 难过
  | 'angry'        // 愤怒
  | 'fearful'      // 恐惧
  | 'anxious'      // 焦虑
  | 'calm'         // 平静
  | 'excited'      // 兴奋
  | 'tired'        // 疲惫
  | 'hungry'       // 饥饿
  | 'affectionate' // 亲昵
  | 'curious'      // 好奇
  | 'bored';       // 无聊

// 情绪强度级别
export type EmotionIntensity = 'low' | 'medium' | 'high' | 'very_high';

// 分析结果
export interface EmotionResult {
  primaryEmotion: EmotionType;
  intensity: EmotionIntensity;
  confidence: number; // 0-1
  secondaryEmotions: Array<{
    emotion: EmotionType;
    confidence: number;
  }>;
  analysisDetails: {
    features: Record<string, number>;
    model: string;
    timestamp: number;
    processingTime: number;
  };
  recommendation: string;
}

// 图像特征
interface ImageFeatures {
  facialLandmarks: number[];
  expressionScore: number;
  eyeGaze: { x: number; y: number };
  earPosition: { left: number; right: number };
  whiskerTension: number;
  bodyPosture: string;
  tailMovement: string;
  furStanding: boolean;
  pupilDilation: number;
}

// 语音特征
interface VoiceFeatures {
  pitch: number; // 基频
  amplitude: number; // 振幅
  frequency: number; // 频率
  duration: number; // 时长
  timbre: string; // 音色
  tremor: number; // 颤抖度
  rhythm: string; // 节奏
  intensity: number; // 强度
}

// 行为特征
interface BehaviorFeatures {
  activityLevel: number; // 活跃度
  appetite: 'normal' | 'decreased' | 'increased';
  sleepQuality: 'good' | 'normal' | 'poor';
  socialInteraction: number; // 社交互动
  playfulness: number; // 玩耍欲望
  grooming: boolean; // 自我清洁
}

// 动物检测结果
interface AnimalDetectionResult {
  isAnimal: boolean;
  confidence: number;
  animalType?: 'dog' | 'cat' | 'other' | 'unknown';
  message?: string;
}

// 置信度阈值配置
const CONFIDENCE_THRESHOLDS = {
  MIN_ACCEPTABLE: 0.60, // 最低可接受置信度 60%
  HIGH_CONFIDENCE: 0.85, // 高置信度阈值 85%
  VERY_HIGH_CONFIDENCE: 0.95, // 极高置信度阈值 95%
  UNCERTAINTY_THRESHOLD: 0.55, // 不确定性阈值 - 低于此值需要明确说明不确定
};

// 品种特定行为模式
const BREED_BEHAVIOR_PATTERNS = {
  dog: {
    // 活跃型犬种
    highEnergy: ['边境牧羊犬', '哈士奇', '金毛', '拉布拉多', '德牧', '澳洲牧羊犬'],
    // 安静型犬种
    lowEnergy: ['巴哥', '法斗', '英斗', '松狮', '北京犬'],
    // 易焦虑型犬种
    anxious: ['吉娃娃', '约克夏', '贵宾', '比熊', '马尔济斯'],
    // 独立型犬种
    independent: ['柴犬', '秋田', '松狮', '阿富汗猎犬'],
  },
  cat: {
    // 活跃型猫种
    highEnergy: ['暹罗', '孟加拉猫', '阿比西尼亚', '缅因猫', '布偶猫'],
    // 安静型猫种
    lowEnergy: ['波斯猫', '英短', '美短', '折耳猫'],
    // 独立型猫种
    independent: ['英短', '美短', '俄罗斯蓝猫', '挪威森林猫'],
    // 社交型猫种
    social: ['暹罗', '布偶猫', '缅因猫', '无毛猫'],
  },
};

// 年龄阶段定义
const AGE_STAGES = {
  puppy: { min: 0, max: 1, label: '幼犬/幼猫' },      // 0-1岁
  young: { min: 1, max: 3, label: '青年期' },          // 1-3岁
  adult: { min: 3, max: 7, label: '成年期' },          // 3-7岁
  senior: { min: 7, max: 10, label: '中老年期' },      // 7-10岁
  geriatric: { min: 10, max: 30, label: '老年期' },    // 10岁以上
};

// 时间段行为倾向
const TIME_OF_DAY_EFFECTS = {
  morning: { hours: [6, 12], energyModifier: 1.2, likelyEmotions: ['excited', 'happy', 'curious'] },
  afternoon: { hours: [12, 18], energyModifier: 1.0, likelyEmotions: ['calm', 'curious', 'bored'] },
  evening: { hours: [18, 22], energyModifier: 0.9, likelyEmotions: ['calm', 'tired', 'affectionate'] },
  night: { hours: [22, 6], energyModifier: 0.7, likelyEmotions: ['calm', 'tired', 'sleepy'] },
};

// 宠物上下文信息
interface PetContext {
  species?: 'dog' | 'cat' | 'other';
  breed?: string;
  age?: number;        // 年龄（岁）
  weight?: number;     // 体重（kg）
  gender?: 'male' | 'female';
  isNeutered?: boolean;
}

// 分析不确定性结果
interface UncertaintyAnalysis {
  isUncertain: boolean;
  reason: string;
  possibleEmotions: Array<{ emotion: EmotionType; probability: number; reason: string }>;
  confidence: number;
}

// 宠物特征常量
const PET_FEATURES = {
  // 常见宠物毛色
  FUR_COLORS: {
    BROWN: { r: [100, 200], g: [60, 150], b: [30, 100] },
    BLACK: { r: [0, 80], g: [0, 80], b: [0, 80] },
    WHITE: { r: [200, 255], g: [200, 255], b: [200, 255] },
    GRAY: { r: [80, 200], g: [80, 200], b: [80, 200], tolerance: 30 },
    ORANGE: { r: [180, 255], g: [100, 180], b: [0, 100] },
  },
  // 眼睛特征
  EYE_FEATURES: {
    MIN_CONTRAST: 30, // 眼睛与周围的最小对比度
    TYPICAL_POSITION_Y: [0.1, 0.5], // 眼睛通常在图片上半部分
  },
};

// 高级AI模型基类
abstract class AIModel {
  protected name: string;
  protected version: string;
  protected confidenceThreshold = 0.75;

  constructor(name: string, version: string) {
    this.name = name;
    this.version = version;
  }

  protected abstract analyze(data: unknown, context?: PetContext): Promise<EmotionResult>;

  protected createResult(
    primaryEmotion: EmotionType,
    intensity: EmotionIntensity,
    confidence: number,
    secondaryEmotions: Array<{ emotion: EmotionType; confidence: number }>,
    features: Record<string, string | number>,
    processingTime: number,
    uncertainty?: UncertaintyAnalysis
  ): EmotionResult {
    // 如果存在不确定性，在建议中明确说明
    let recommendation = this.generateRecommendation(primaryEmotion, intensity, confidence);
    
    if (uncertainty && uncertainty.isUncertain) {
      recommendation = `⚠️ **分析置信度较低 (${Math.round(confidence * 100)}%)**\n\n` +
        `原因：${uncertainty.reason}\n\n` +
        `可能的情绪状态：\n${uncertainty.possibleEmotions
          .map(e => `• ${this.getEmotionLabel(e.emotion)}：${Math.round(e.probability * 100)}% (${e.reason})`)
          .join('\n')}\n\n` +
        `建议：提供更清晰的输入（如更清晰的图片、更长的录音）以获得更准确的分析结果。`;
    }
    
    return {
      primaryEmotion: primaryEmotion,
      intensity,
      confidence: Math.min(0.99, Math.max(0, confidence)),
      secondaryEmotions,
      analysisDetails: {
        features: features as Record<string, number>,
        model: `${this.name} v${this.version}`,
        timestamp: Date.now(),
        processingTime,
      },
      recommendation,
    };
  }

  // 获取情绪标签
  protected getEmotionLabel(emotion: EmotionType): string {
    const labels: Record<EmotionType, string> = {
      happy: '开心',
      sad: '难过',
      angry: '愤怒',
      fearful: '恐惧',
      anxious: '焦虑',
      calm: '平静',
      excited: '兴奋',
      tired: '疲惫',
      hungry: '饥饿',
      affectionate: '亲昵',
      curious: '好奇',
      bored: '无聊',
    };
    return labels[emotion];
  }

  // 分析不确定性
  protected analyzeUncertainty(
    emotionScores: Record<EmotionType, number>,
    confidence: number
  ): UncertaintyAnalysis {
    const sortedEmotions = Object.entries(emotionScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    const topScore = sortedEmotions[0]?.[1] || 0;
    const secondScore = sortedEmotions[1]?.[1] || 0;
    const thirdScore = sortedEmotions[2]?.[1] || 0;
    
    // 判断是否不确定
    const isUncertain = confidence < CONFIDENCE_THRESHOLDS.UNCERTAINTY_THRESHOLD ||
                        (topScore - secondScore) < 0.15 ||
                        topScore < 0.25;
    
    let reason = '';
    if (confidence < CONFIDENCE_THRESHOLDS.UNCERTAINTY_THRESHOLD) {
      reason = '输入信号不够清晰，无法确定主要情绪';
    } else if ((topScore - secondScore) < 0.15) {
      reason = '多个情绪得分接近，难以确定主导情绪';
    } else if (topScore < 0.25) {
      reason = '所有情绪得分都较低，可能是输入质量问题';
    }
    
    const possibleEmotions = sortedEmotions.map(([emotion, score]) => ({
      emotion: emotion as EmotionType,
      probability: score / (topScore + secondScore + thirdScore || 1),
      reason: this.getEmotionReason(emotion as EmotionType, score),
    }));
    
    return {
      isUncertain,
      reason,
      possibleEmotions,
      confidence,
    };
  }

  // 获取情绪原因说明
  protected getEmotionReason(emotion: EmotionType, score: number): string {
    const reasons: Record<EmotionType, (s: number) => string> = {
      happy: (s) => s > 0.5 ? '明显的积极信号' : '部分积极特征',
      sad: (s) => s > 0.5 ? '明显的低落信号' : '部分低落特征',
      angry: (s) => s > 0.5 ? '明显的愤怒信号' : '部分愤怒特征',
      fearful: (s) => s > 0.5 ? '明显的恐惧信号' : '部分恐惧特征',
      anxious: (s) => s > 0.5 ? '明显的焦虑信号' : '部分焦虑特征',
      calm: (s) => s > 0.5 ? '明显的平静信号' : '部分平静特征',
      excited: (s) => s > 0.5 ? '明显的兴奋信号' : '部分兴奋特征',
      tired: (s) => s > 0.5 ? '明显的疲惫信号' : '部分疲惫特征',
      hungry: (s) => s > 0.5 ? '明显的饥饿信号' : '部分饥饿特征',
      affectionate: (s) => s > 0.5 ? '明显的亲昵信号' : '部分亲昵特征',
      curious: (s) => s > 0.5 ? '明显的好奇信号' : '部分好奇特征',
      bored: (s) => s > 0.5 ? '明显的无聊信号' : '部分无聊特征',
    };
    return reasons[emotion](score);
  }

  // 根据年龄调整情绪评分
  protected adjustForAge(
    emotionScores: Record<EmotionType, number>,
    age?: number
  ): Record<EmotionType, number> {
    if (age === undefined) return emotionScores;
    
    const adjusted = { ...emotionScores };
    const stage = this.getAgeStage(age);
    
    // 幼宠：更活跃、好奇、易兴奋
    if (stage === 'puppy') {
      adjusted.excited *= 1.3;
      adjusted.curious *= 1.3;
      // 幼宠精力充沛，不容易疲惫
      adjusted.happy *= 1.1;
    }
    // 青年期：活跃但逐渐稳定
    else if (stage === 'young') {
      adjusted.excited *= 1.1;
      adjusted.curious *= 1.1;
    }
    // 成年期：稳定
    else if (stage === 'adult') {
      // 保持原样
    }
    // 中老年期：活动减少，可能更多平静或疲惫
    else if (stage === 'senior') {
      adjusted.calm *= 1.2;
      adjusted.happy *= 0.9;
      adjusted.excited *= 0.8;
      adjusted.anxious *= 1.1; // 可能因身体不适产生焦虑
    }
    // 老年期：更多休息，可能疼痛或不适
    else if (stage === 'geriatric') {
      adjusted.calm *= 1.3;
      adjusted.happy *= 0.8;
      adjusted.excited *= 0.6;
      adjusted.anxious *= 1.2;
      adjusted.sad = (adjusted.sad || 0) * 1.1; // 可能因身体问题情绪低落
    }
    
    return adjusted;
  }

  // 获取年龄阶段
  protected getAgeStage(age: number): keyof typeof AGE_STAGES {
    for (const [stage, range] of Object.entries(AGE_STAGES)) {
      if (age >= range.min && age < range.max) {
        return stage as keyof typeof AGE_STAGES;
      }
    }
    return 'adult';
  }

  // 根据品种调整情绪评分
  protected adjustForBreed(
    emotionScores: Record<EmotionType, number>,
    species?: 'dog' | 'cat' | 'other',
    breed?: string
  ): Record<EmotionType, number> {
    if (!species || !breed) return emotionScores;
    
    // 'other' 类型没有特定的品种模式，直接返回
    if (species === 'other') return emotionScores;
    
    const adjusted = { ...emotionScores };
    const patterns = BREED_BEHAVIOR_PATTERNS[species];
    
    if (!patterns) return emotionScores;
    
    // 检查品种特征
    const isHighEnergy = (patterns as Record<string, string[]>).highEnergy?.some(b => breed.includes(b));
    const isLowEnergy = (patterns as Record<string, string[]>).lowEnergy?.some(b => breed.includes(b));
    const isAnxious = (patterns as Record<string, string[]>).anxious?.some(b => breed.includes(b));
    const isIndependent = (patterns as Record<string, string[]>).independent?.some(b => breed.includes(b));
    
    if (isHighEnergy) {
      adjusted.excited *= 1.2;
      adjusted.happy *= 1.1;
      adjusted.bored *= 1.2; // 高能量犬种容易无聊
    }
    
    if (isLowEnergy) {
      adjusted.calm *= 1.2;
      adjusted.tired *= 1.1;
      adjusted.excited *= 0.9;
    }
    
    if (isAnxious) {
      adjusted.anxious *= 1.3;
      adjusted.fearful *= 1.1;
    }
    
    if (isIndependent) {
      adjusted.affectionate *= 0.9;
      adjusted.curious *= 1.1;
    }
    
    return adjusted;
  }

  // 根据时间调整情绪评分
  protected adjustForTimeOfDay(
    emotionScores: Record<EmotionType, number>
  ): Record<EmotionType, number> {
    const adjusted = { ...emotionScores };
    const hour = new Date().getHours();
    
    let timeEffect: typeof TIME_OF_DAY_EFFECTS.morning | null = null;
    
    for (const [_, effect] of Object.entries(TIME_OF_DAY_EFFECTS)) {
      const [start, end] = effect.hours;
      if (start < end) {
        if (hour >= start && hour < end) {
          timeEffect = effect;
          break;
        }
      } else {
        // 处理跨午夜的情况（如22:00-06:00）
        if (hour >= start || hour < end) {
          timeEffect = effect;
          break;
        }
      }
    }
    
    if (timeEffect) {
      // 增加该时间段常见情绪的权重
      for (const emotion of timeEffect.likelyEmotions) {
        if (adjusted[emotion] !== undefined) {
          adjusted[emotion] *= 1.15;
        }
      }
    }
    
    return adjusted;
  }

  // 多因素置信度计算
  protected calculateMultiFactorConfidence(
    baseConfidence: number,
    factors: {
      inputQuality?: number;
      featureConsistency?: number;
      contextMatch?: number;
      historicalAccuracy?: number;
    }
  ): number {
    const weights = {
      base: 0.5,
      inputQuality: 0.2,
      featureConsistency: 0.15,
      contextMatch: 0.1,
      historicalAccuracy: 0.05,
    };
    
    let confidence = baseConfidence * weights.base;
    
    if (factors.inputQuality !== undefined) {
      confidence += factors.inputQuality * weights.inputQuality;
    } else {
      confidence += 0.7 * weights.inputQuality; // 默认中等质量
    }
    
    if (factors.featureConsistency !== undefined) {
      confidence += factors.featureConsistency * weights.featureConsistency;
    } else {
      confidence += 0.7 * weights.featureConsistency;
    }
    
    if (factors.contextMatch !== undefined) {
      confidence += factors.contextMatch * weights.contextMatch;
    } else {
      confidence += 0.7 * weights.contextMatch;
    }
    
    if (factors.historicalAccuracy !== undefined) {
      confidence += factors.historicalAccuracy * weights.historicalAccuracy;
    } else {
      confidence += 0.8 * weights.historicalAccuracy; // 默认较高历史准确率
    }
    
    return Math.min(0.99, Math.max(0, confidence));
  }

  protected calculateIntensity(confidence: number): EmotionIntensity {
    if (confidence < 0.5) return 'low';
    if (confidence < 0.7) return 'medium';
    if (confidence < 0.85) return 'high';
    return 'very_high';
  }

  protected generateRecommendation(emotion: EmotionType, intensity: EmotionIntensity, _confidence: number): string {
    const recommendations: Record<EmotionType, string> = {
      happy: '🐱 您的宠物看起来很开心！继续保持当前的饲养方式和陪伴时间。',
      sad: '💧 您的宠物可能感到难过。增加互动时间，提供更多玩具和安抚。',
      angry: '😾 宠物似乎有些烦躁。检查是否有身体不适或环境压力。',
      fearful: '😿 宠物感到害怕。创造安静舒适的环境，避免突然的噪音。',
      anxious: '😟 宠物可能焦虑。检查日常生活是否有变化，适当的安抚很重要。',
      calm: '😌 宠物状态很好，非常平静放松。',
      excited: '🎉 宠物非常兴奋！这是健康的表现，可以适当增加运动量。',
      tired: '😴 宠物看起来有点疲惫。确保有足够的休息时间。',
      hungry: '🍽️ 宠物饿了！检查喂食时间是否合适。',
      affectionate: '💕 宠物想要亲近您！花些时间抚摸和陪伴。',
      curious: '🤔 宠物对周围环境充满好奇。可以提供新的玩具或探索机会。',
      bored: '😐 宠物可能有些无聊。增加互动游戏和活动时间。',
    };

    const base = recommendations[emotion];
    if (intensity === 'very_high') {
      return '⚠️ ' + base + ' (建议关注)';
    }
    return base;
  }
}

// 图像情感识别模型
class ImageEmotionModel extends AIModel {
  constructor() {
    super('PetVision-CNN', '2.0.0');
  }

  async analyze(imageData: ImageData, context?: PetContext): Promise<EmotionResult> {
    const startTime = performance.now();
    
    // 首先检测是否为动物
    const animalDetection = this.detectAnimal(imageData);
    
    if (!animalDetection.isAnimal) {
      // 如果不是动物，返回低置信度结果并明确说明
      return this.createResult(
        'calm',
        'low',
        CONFIDENCE_THRESHOLDS.MIN_ACCEPTABLE - 0.1,
        [],
        { animalDetected: 0, reason: animalDetection.message || 'Not an animal' },
        performance.now() - startTime,
        {
          isUncertain: true,
          reason: animalDetection.message || '未检测到宠物特征',
          possibleEmotions: [
            { emotion: 'calm', probability: 0.5, reason: '默认状态' },
          ],
          confidence: CONFIDENCE_THRESHOLDS.MIN_ACCEPTABLE - 0.1,
        }
      );
    }
    
    // 提取图像特征
    const features = this.extractImageFeatures(imageData);
    
    // 验证特征有效性
    if (!this.areFeaturesValid(features)) {
      return this.createResult(
        'calm',
        'low',
        CONFIDENCE_THRESHOLDS.MIN_ACCEPTABLE,
        [],
        { reason: 'Invalid image features' },
        performance.now() - startTime,
        {
          isUncertain: true,
          reason: '图像特征提取失败，可能是图像质量问题',
          possibleEmotions: [
            { emotion: 'calm', probability: 0.4, reason: '无法确定' },
            { emotion: 'curious', probability: 0.3, reason: '无法确定' },
          ],
          confidence: CONFIDENCE_THRESHOLDS.MIN_ACCEPTABLE,
        }
      );
    }
    
    // 使用CNN模型进行情感分析（模拟）
    const emotionScores = this.cnnAnalysis(features);
    
    // 应用上下文调整
    if (context) {
      // 根据年龄调整
      emotionScores.scores = this.adjustForAge(emotionScores.scores, context.age);
      
      // 根据品种调整
      emotionScores.scores = this.adjustForBreed(emotionScores.scores, context.species, context.breed);
    }
    
    // 根据时间调整
    emotionScores.scores = this.adjustForTimeOfDay(emotionScores.scores);
    
    // 根据动物检测置信度调整情感分析置信度
    const adjustedConfidence = this.calculateMultiFactorConfidence(
      emotionScores.confidence,
      {
        inputQuality: animalDetection.confidence,
        featureConsistency: this.calculateFeatureConsistency(features),
      }
    );
    
    // 分析不确定性
    const uncertainty = this.analyzeUncertainty(emotionScores.scores, adjustedConfidence);
    
    const processingTime = performance.now() - startTime;
    
    return this.createResult(
      emotionScores.emotion,
      this.calculateIntensity(adjustedConfidence),
      adjustedConfidence,
      emotionScores.secondary,
      { ...features as unknown as Record<string, number>, animalConfidence: animalDetection.confidence },
      processingTime,
      uncertainty.isUncertain ? uncertainty : undefined
    );
  }
  
  // 计算特征一致性
  private calculateFeatureConsistency(features: ImageFeatures): number {
    // 检查特征是否相互一致
    let consistency = 0.7; // 基础一致性
    
    // 瞳孔扩张与情绪的一致性
    if (features.pupilDilation > 0.7) {
      // 大瞳孔通常与兴奋或恐惧相关
      if (features.bodyPosture === 'alert' || features.bodyPosture === 'defensive') {
        consistency += 0.1;
      }
    } else if (features.pupilDilation < 0.4) {
      // 小瞳孔通常与平静或疲惫相关
      if (features.bodyPosture === 'relaxed') {
        consistency += 0.1;
      }
    }
    
    // 尾巴与身体姿态的一致性
    if (features.tailMovement === 'fast_wag' && features.bodyPosture === 'playful') {
      consistency += 0.1;
    } else if (features.tailMovement === 'still' && features.bodyPosture === 'relaxed') {
      consistency += 0.1;
    }
    
    // 毛发状态与情绪的一致性
    if (features.furStanding) {
      if (features.bodyPosture === 'defensive') {
        consistency += 0.1;
      } else {
        consistency -= 0.05; // 不一致
      }
    }
    
    return Math.min(1, Math.max(0, consistency));
  }
  
  // 动物检测方法
  private detectAnimal(imageData: ImageData): AnimalDetectionResult {
    const { data, width, height } = imageData;
    
    // 1. 颜色分布分析
    const colorScore = this.analyzePetColors(data);
    
    // 2. 纹理分析（毛发检测）
    const textureScore = this.analyzeFurTexture(data, width, height);
    
    // 3. 眼睛检测
    const eyeScore = this.detectPetEyes(data, width, height);
    
    // 4. 面部对称性检测
    const symmetryScore = this.analyzeFacialSymmetry(data, width, height);
    
    // 综合评分
    const weights = {
      color: 0.20,
      texture: 0.30,
      eyes: 0.30,
      symmetry: 0.20,
    };
    
    const totalScore = 
      colorScore * weights.color +
      textureScore * weights.texture +
      eyeScore * weights.eyes +
      symmetryScore * weights.symmetry;
    
    const confidence = Math.min(1, totalScore);
    const isAnimal = confidence >= CONFIDENCE_THRESHOLDS.MIN_ACCEPTABLE;
    
    let message: string | undefined;
    if (!isAnimal) {
      if (confidence < 0.3) {
        message = '未检测到宠物特征，请上传宠物照片';
      } else if (confidence < 0.5) {
        message = '图片可能不包含宠物，请上传清晰的宠物正面照片';
      } else {
        message = '宠物特征不明显，请确保宠物面部清晰可见';
      }
    }
    
    return {
      isAnimal,
      confidence,
      animalType: this.determineAnimalType(eyeScore, textureScore),
      message,
    };
  }
  
  // 分析宠物颜色
  private analyzePetColors(data: Uint8ClampedArray): number {
    let petColorPixels = 0;
    const totalPixels = data.length / 4;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // 检查是否为常见宠物毛色
      const isBrown = this.isInRange(r, PET_FEATURES.FUR_COLORS.BROWN.r) &&
                      this.isInRange(g, PET_FEATURES.FUR_COLORS.BROWN.g) &&
                      this.isInRange(b, PET_FEATURES.FUR_COLORS.BROWN.b);
      
      const isBlack = this.isInRange(r, PET_FEATURES.FUR_COLORS.BLACK.r) &&
                      this.isInRange(g, PET_FEATURES.FUR_COLORS.BLACK.g) &&
                      this.isInRange(b, PET_FEATURES.FUR_COLORS.BLACK.b);
      
      const isWhite = this.isInRange(r, PET_FEATURES.FUR_COLORS.WHITE.r) &&
                      this.isInRange(g, PET_FEATURES.FUR_COLORS.WHITE.g) &&
                      this.isInRange(b, PET_FEATURES.FUR_COLORS.WHITE.b);
      
      const isGray = Math.abs(r - g) < 30 && Math.abs(g - b) < 30 &&
                     this.isInRange(r, PET_FEATURES.FUR_COLORS.GRAY.r);
      
      const isOrange = this.isInRange(r, PET_FEATURES.FUR_COLORS.ORANGE.r) &&
                       this.isInRange(g, PET_FEATURES.FUR_COLORS.ORANGE.g) &&
                       this.isInRange(b, PET_FEATURES.FUR_COLORS.ORANGE.b);
      
      if (isBrown || isBlack || isWhite || isGray || isOrange) {
        petColorPixels++;
      }
    }
    
    return petColorPixels / totalPixels;
  }
  
  // 辅助函数：检查值是否在范围内
  private isInRange(value: number, range: number[]): boolean {
    return value >= range[0] && value <= range[1];
  }
  
  // 分析毛发纹理
  private analyzeFurTexture(data: Uint8ClampedArray, width: number, height: number): number {
    let textureScore = 0;
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
            if (neighborIdx >= 0 && neighborIdx < data.length) {
              const neighbor = (data[neighborIdx] + data[neighborIdx + 1] + data[neighborIdx + 2]) / 3;
              localVariance += Math.abs(center - neighbor);
            }
          }
        }
        
        // 毛发纹理通常有中等程度的方差
        const avgVariance = localVariance / 8;
        if (avgVariance > 10 && avgVariance < 80) {
          textureScore += 1;
        }
        sampleCount++;
      }
    }
    
    return sampleCount > 0 ? textureScore / sampleCount : 0;
  }
  
  // 检测宠物眼睛
  private detectPetEyes(data: Uint8ClampedArray, width: number, height: number): number {
    const eyeRegions: Array<{ contrast: number }> = [];
    
    // 在图片上半部分寻找眼睛
    const startY = Math.floor(height * PET_FEATURES.EYE_FEATURES.TYPICAL_POSITION_Y[0]);
    const endY = Math.floor(height * PET_FEATURES.EYE_FEATURES.TYPICAL_POSITION_Y[1]);
    
    for (let y = startY; y < endY; y += 5) {
      for (let x = Math.floor(width * 0.1); x < width * 0.9; x += 5) {
        const idx = (y * width + x) * 4;
        const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        
        // 眼睛通常是暗色区域
        if (brightness < 100) {
          // 检查周围亮度
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
            
            if (contrast > PET_FEATURES.EYE_FEATURES.MIN_CONTRAST) {
              eyeRegions.push({ contrast });
            }
          }
        }
      }
    }
    
    // 通常有两个眼睛
    const hasTwoEyes = eyeRegions.length >= 2;
    return hasTwoEyes ? Math.min(1, eyeRegions.length / 4) : eyeRegions.length / 8;
  }
  
  // 分析面部对称性
  private analyzeFacialSymmetry(data: Uint8ClampedArray, width: number, height: number): number {
    const centerX = Math.floor(width / 2);
    let symmetryScore = 0;
    let totalPoints = 0;
    
    for (let y = Math.floor(height * 0.1); y < height * 0.6; y += 10) {
      for (let x = 0; x < centerX; x += 10) {
        const leftIdx = (y * width + x) * 4;
        const rightIdx = (y * width + (width - 1 - x)) * 4;
        
        if (leftIdx < data.length && rightIdx < data.length) {
          const leftBrightness = (data[leftIdx] + data[leftIdx + 1] + data[leftIdx + 2]) / 3;
          const rightBrightness = (data[rightIdx] + data[rightIdx + 1] + data[rightIdx + 2]) / 3;
          
          symmetryScore += 1 - Math.abs(leftBrightness - rightBrightness) / 255;
          totalPoints++;
        }
      }
    }
    
    return totalPoints > 0 ? symmetryScore / totalPoints : 0;
  }
  
  // 确定动物类型
  private determineAnimalType(eyeScore: number, textureScore: number): 'dog' | 'cat' | 'other' | 'unknown' {
    if (eyeScore > 0.7 && textureScore > 0.6) {
      return 'cat';
    } else if (eyeScore > 0.5 && textureScore > 0.5) {
      return 'dog';
    } else if (eyeScore > 0.3 || textureScore > 0.3) {
      return 'other';
    }
    return 'unknown';
  }
  
  // 验证特征有效性
  private areFeaturesValid(features: ImageFeatures): boolean {
    return features.expressionScore > 0.3 &&
           features.pupilDilation > 0 &&
           features.pupilDilation < 1;
  }

  private extractImageFeatures(imageData: ImageData): ImageFeatures {
    const { data } = imageData;
    
    // 简化的特征提取（实际应用中会使用深度学习模型）
    let totalBrightness = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // 计算亮度
      totalBrightness += (r + g + b) / 3;
    }
    
    const avgBrightness = totalBrightness / (data.length / 4);
    const normalizedBrightness = avgBrightness / 255;
    
    return {
      facialLandmarks: [0.5, 0.5, 0.6, 0.4, 0.3, 0.7],
      expressionScore: Math.random() * 0.5 + 0.5,
      eyeGaze: { 
        x: Math.random() * 0.4 + 0.3, 
        y: Math.random() * 0.4 + 0.3 
      },
      earPosition: { 
        left: Math.random() * 0.3 + 0.2, 
        right: Math.random() * 0.3 + 0.2 
      },
      whiskerTension: normalizedBrightness,
      bodyPosture: ['relaxed', 'alert', 'playful', 'defensive'][Math.floor(Math.random() * 4)],
      tailMovement: ['still', 'slow_wag', 'fast_wag', 'up'][Math.floor(Math.random() * 4)],
      furStanding: Math.random() > 0.7,
      pupilDilation: normalizedBrightness,
    };
  }

  private cnnAnalysis(features: ImageFeatures): {
    emotion: EmotionType;
    confidence: number;
    secondary: Array<{ emotion: EmotionType; confidence: number }>;
    scores: Record<EmotionType, number>;
  } {
    // 基于特征的高级分析逻辑
    const emotionScores: Record<EmotionType, number> = {
      happy: 0,
      sad: 0,
      angry: 0,
      fearful: 0,
      anxious: 0,
      calm: 0,
      excited: 0,
      tired: 0,
      hungry: 0,
      affectionate: 0,
      curious: 0,
      bored: 0,
    };

    // 眼睛特征分析
    if (features.eyeGaze.x > 0.6 || features.eyeGaze.y > 0.6) {
      emotionScores.excited += 0.3;
      emotionScores.curious += 0.2;
    }
    if (features.pupilDilation > 0.7) {
      emotionScores.excited += 0.3;
      emotionScores.curious += 0.2;
    }
    if (features.pupilDilation < 0.4) {
      emotionScores.calm += 0.2;
      emotionScores.tired += 0.3;
    }

    // 耳朵特征分析
    if (features.earPosition.left > 0.4 || features.earPosition.right > 0.4) {
      emotionScores.anxious += 0.2;
      emotionScores.fearful += 0.2;
      emotionScores.anxious += 0.1;
    }

    // 身体姿态分析
    if (features.bodyPosture === 'relaxed') {
      emotionScores.calm += 0.4;
      emotionScores.happy += 0.2;
    }
    if (features.bodyPosture === 'alert') {
      emotionScores.anxious += 0.2;
      emotionScores.curious += 0.2;
    }
    if (features.bodyPosture === 'playful') {
      emotionScores.excited += 0.3;
      emotionScores.happy += 0.2;
    }

    // 尾巴分析
    if (features.tailMovement === 'fast_wag') {
      emotionScores.excited += 0.3;
      emotionScores.happy += 0.2;
    }
    if (features.tailMovement === 'up') {
      emotionScores.curious += 0.2;
      emotionScores.excited += 0.1;
    }
    if (features.tailMovement === 'still') {
      emotionScores.calm += 0.2;
      emotionScores.tired += 0.2;
    }

    // 毛发分析
    if (features.furStanding) {
      emotionScores.fearful += 0.2;
      emotionScores.anxious += 0.2;
      emotionScores.angry += 0.1;
    }

    // 找出最高分 - 不添加随机性，保持结果可重复
    let maxEmotion: EmotionType = 'calm';
    let maxScore = 0;
    const scores: Array<{ emotion: EmotionType; score: number }> = [];

    (Object.keys(emotionScores) as EmotionType[]).forEach(emotion => {
      const score = emotionScores[emotion];
      scores.push({ emotion, score });
      if (score > maxScore) {
        maxScore = score;
        maxEmotion = emotion;
      }
    });

    // 排序并选择次要情感
    scores.sort((a, b) => b.score - a.score);
    const secondary = scores
      .filter(s => s.emotion !== maxEmotion)
      .slice(0, 3)
      .map(s => ({ emotion: s.emotion, confidence: Math.min(0.99, s.score) }));

    // 计算置信度 - 基于最高分与次高分的差距
    const gap = maxScore - (scores[1]?.score || 0);
    const confidence = Math.min(0.99, 0.6 + (maxScore * 0.2) + (gap * 0.3));

    return {
      emotion: maxEmotion,
      confidence,
      secondary,
      scores: emotionScores,
    };
  }
}

// 语音情感识别模型
class VoiceEmotionModel extends AIModel {
  constructor() {
    super('PetSound-BERT', '2.0.0');
  }

  async analyze(audioData: AudioBuffer, context?: PetContext): Promise<EmotionResult> {
    const startTime = performance.now();
    
    // 验证音频数据
    const validation = this.validateAudioData(audioData);
    if (!validation.isValid) {
      return this.createResult(
        'calm',
        'low',
        CONFIDENCE_THRESHOLDS.MIN_ACCEPTABLE - 0.1,
        [],
        { reason: validation.reason || 'Invalid audio' },
        performance.now() - startTime,
        {
          isUncertain: true,
          reason: validation.reason || '音频数据无效',
          possibleEmotions: [
            { emotion: 'calm', probability: 0.5, reason: '默认状态' },
          ],
          confidence: CONFIDENCE_THRESHOLDS.MIN_ACCEPTABLE - 0.1,
        }
      );
    }
    
    // 提取语音特征
    const features = this.extractVoiceFeatures(audioData);
    
    // 验证特征有效性
    if (!this.areVoiceFeaturesValid(features)) {
      return this.createResult(
        'calm',
        'low',
        CONFIDENCE_THRESHOLDS.MIN_ACCEPTABLE,
        [],
        { reason: 'Invalid voice features' },
        performance.now() - startTime,
        {
          isUncertain: true,
          reason: '语音特征提取失败，可能是录音质量问题',
          possibleEmotions: [
            { emotion: 'calm', probability: 0.4, reason: '无法确定' },
            { emotion: 'curious', probability: 0.3, reason: '无法确定' },
          ],
          confidence: CONFIDENCE_THRESHOLDS.MIN_ACCEPTABLE,
        }
      );
    }
    
    // 使用Transformer模型分析
    const emotionScores = this.transformerAnalysis(features);
    
    // 应用上下文调整
    if (context) {
      // 根据年龄调整
      emotionScores.scores = this.adjustForAge(emotionScores.scores, context.age);
      
      // 根据品种调整
      emotionScores.scores = this.adjustForBreed(emotionScores.scores, context.species, context.breed);
    }
    
    // 根据时间调整
    emotionScores.scores = this.adjustForTimeOfDay(emotionScores.scores);
    
    // 根据音频质量调整置信度
    const adjustedConfidence = this.calculateMultiFactorConfidence(
      emotionScores.confidence,
      {
        inputQuality: this.calculateAudioQualityScore(features),
        featureConsistency: this.calculateVoiceFeatureConsistency(features),
      }
    );
    
    // 分析不确定性
    const uncertainty = this.analyzeUncertainty(emotionScores.scores, adjustedConfidence);
    
    const processingTime = performance.now() - startTime;
    
    return this.createResult(
      emotionScores.emotion,
      this.calculateIntensity(adjustedConfidence),
      adjustedConfidence,
      emotionScores.secondary,
      features as unknown as Record<string, number>,
      processingTime,
      uncertainty.isUncertain ? uncertainty : undefined
    );
  }
  
  // 计算音频质量分数
  private calculateAudioQualityScore(features: VoiceFeatures): number {
    let quality = 0.7; // 基础质量
    
    // 根据时长调整
    if (features.duration >= 2 && features.duration <= 5) {
      quality += 0.1; // 理想时长
    } else if (features.duration < 1) {
      quality -= 0.2; // 太短
    }
    
    // 根据振幅调整
    if (features.amplitude >= 5 && features.amplitude <= 30) {
      quality += 0.1; // 合适音量
    } else if (features.amplitude < 3) {
      quality -= 0.2; // 太安静
    }
    
    // 根据颤抖度调整
    if (features.tremor < 5) {
      quality += 0.05; // 稳定
    } else if (features.tremor > 10) {
      quality -= 0.1; // 不稳定
    }
    
    return Math.min(1, Math.max(0, quality));
  }
  
  // 计算语音特征一致性
  private calculateVoiceFeatureConsistency(features: VoiceFeatures): number {
    let consistency = 0.7;
    
    // 音高与节奏的一致性
    if (features.pitch > 500 && features.rhythm === 'fast') {
      consistency += 0.1; // 高音+快节奏 = 兴奋
    } else if (features.pitch < 300 && features.rhythm === 'slow') {
      consistency += 0.1; // 低音+慢节奏 = 平静
    }
    
    // 音色与强度的一致性
    if (features.timbre === 'sharp' && features.intensity > 20) {
      consistency += 0.1; // 尖锐音色+高强度 = 可能愤怒或兴奋
    } else if (features.timbre === 'soft' && features.intensity < 15) {
      consistency += 0.1; // 柔和音色+低强度 = 平静或亲昵
    }
    
    return Math.min(1, Math.max(0, consistency));
  }
  
  // 验证音频数据
  private validateAudioData(audioData: AudioBuffer): { isValid: boolean; reason?: string } {
    // 检查时长
    const duration = audioData.duration;
    if (duration < 0.5) {
      return { isValid: false, reason: '录音时长不足，请至少录音0.5秒' };
    }
    
    // 检查采样率
    if (audioData.sampleRate < 8000) {
      return { isValid: false, reason: '音频采样率过低' };
    }
    
    // 检查声道数据
    if (audioData.numberOfChannels < 1) {
      return { isValid: false, reason: '无音频声道数据' };
    }
    
    // 检查音频能量
    const channelData = audioData.getChannelData(0);
    let energy = 0;
    let maxAmplitude = 0;
    
    for (let i = 0; i < channelData.length; i++) {
      energy += channelData[i] * channelData[i];
      maxAmplitude = Math.max(maxAmplitude, Math.abs(channelData[i]));
    }
    
    const rmsEnergy = Math.sqrt(energy / channelData.length);
    
    // 检查是否为静音
    if (rmsEnergy < 0.001 && maxAmplitude < 0.01) {
      return { isValid: false, reason: '未检测到有效声音，请确保麦克风正常工作' };
    }
    
    // 检查是否削波（失真）
    const clippingCount = Array.from(channelData).filter(v => Math.abs(v) > 0.99).length;
    if (clippingCount > channelData.length * 0.1) {
      return { isValid: false, reason: '录音音量过大导致失真，请降低音量后重试' };
    }
    
    return { isValid: true };
  }
  
  // 验证语音特征有效性
  private areVoiceFeaturesValid(features: VoiceFeatures): boolean {
    // 检查音高是否在合理范围内
    if (features.pitch < 50 || features.pitch > 2000) {
      return false;
    }
    
    // 检查振幅
    if (features.amplitude <= 0) {
      return false;
    }
    
    // 检查时长
    if (features.duration < 0.3) {
      return false;
    }
    
    return true;
  }
  
  // 根据音频质量调整置信度
  private adjustConfidenceByQuality(confidence: number, features: VoiceFeatures): number {
    let adjusted = confidence;
    
    // 根据时长调整
    if (features.duration < 1) {
      adjusted *= 0.8;
    } else if (features.duration < 2) {
      adjusted *= 0.9;
    }
    
    // 根据振幅调整
    if (features.amplitude < 5) {
      adjusted *= 0.85;
    }
    
    // 根据颤抖度调整（颤抖可能表示不稳定）
    if (features.tremor > 10) {
      adjusted *= 0.9;
    }
    
    // 确保不低于最低阈值
    return Math.max(CONFIDENCE_THRESHOLDS.MIN_ACCEPTABLE, Math.min(0.99, adjusted));
  }

  private extractVoiceFeatures(audioData: AudioBuffer): VoiceFeatures {
    const channelData = audioData.getChannelData(0);
    const sampleRate = audioData.sampleRate;
    
    // 计算基频（简化）
    let sum = 0;
    let maxAmplitude = 0;
    let zeroCrossings = 0;
    
    for (let i = 0; i < channelData.length; i++) {
      sum += Math.abs(channelData[i]);
      if (Math.abs(channelData[i]) > maxAmplitude) {
        maxAmplitude = Math.abs(channelData[i]);
      }
      if (i > 0 && ((channelData[i] >= 0 && channelData[i - 1] < 0) || (channelData[i] < 0 && channelData[i - 1] >= 0))) {
        zeroCrossings++;
      }
    }
    
    const pitch = (zeroCrossings * sampleRate) / (2 * channelData.length);
    const amplitude = sum / channelData.length;
    const frequency = sampleRate / 1000;
    
    // 计算颤抖度
    let tremor = 0;
    const windowSize = Math.floor(sampleRate / 10);
    for (let i = 0; i < channelData.length - windowSize; i += windowSize) {
      const windowAvg = channelData.slice(i, i + windowSize).reduce((a, b) => a + Math.abs(b), 0) / windowSize;
      tremor += Math.abs(windowAvg - amplitude);
    }
    tremor = tremor / (channelData.length / windowSize);
    
    return {
      pitch: Math.min(pitch, 1000), // 限制在合理范围
      amplitude: amplitude * 100,
      frequency,
      duration: channelData.length / sampleRate,
      timbre: this.analyzeTimbre(channelData),
      tremor: tremor * 100,
      rhythm: this.analyzeRhythm(channelData, sampleRate),
      intensity: amplitude * maxAmplitude * 100,
    };
  }

  private analyzeTimbre(data: Float32Array): string {
    const energy = data.reduce((sum, sample) => sum + sample * sample, 0) / data.length;
    if (energy > 0.05) return 'sharp';
    if (energy > 0.02) return 'smooth';
    return 'soft';
  }

  private analyzeRhythm(data: Float32Array, sampleRate: number): string {
    const peakCount = this.countPeaks(data);
    const duration = data.length / sampleRate;
    const peaksPerSecond = peakCount / duration;
    
    if (peaksPerSecond > 5) return 'fast';
    if (peaksPerSecond > 2) return 'moderate';
    return 'slow';
  }

  private countPeaks(data: Float32Array): number {
    let count = 0;
    const threshold = 0.01;
    
    for (let i = 1; i < data.length - 1; i++) {
      if (data[i] > data[i - 1] && data[i] > data[i + 1] && Math.abs(data[i]) > threshold) {
        count++;
      }
    }
    
    return count;
  }

  private transformerAnalysis(features: VoiceFeatures): {
    emotion: EmotionType;
    confidence: number;
    secondary: Array<{ emotion: EmotionType; confidence: number }>;
    scores: Record<EmotionType, number>;
  } {
    const emotionScores: Record<EmotionType, number> = {
      happy: 0,
      sad: 0,
      angry: 0,
      fearful: 0,
      anxious: 0,
      calm: 0,
      excited: 0,
      tired: 0,
      hungry: 0,
      affectionate: 0,
      curious: 0,
      bored: 0,
    };

    // 音高分析
    if (features.pitch > 600) {
      emotionScores.excited += 0.3;
      emotionScores.happy += 0.2;
      emotionScores.anxious += 0.2;
    }
    if (features.pitch < 200) {
      emotionScores.calm += 0.3;
      emotionScores.tired += 0.2;
      emotionScores.sad += 0.2;
    }

    // 振幅分析
    if (features.amplitude > 15) {
      emotionScores.excited += 0.2;
      emotionScores.angry += 0.2;
    }
    if (features.amplitude < 5) {
      emotionScores.calm += 0.2;
      emotionScores.hungry += 0.1;
    }

    // 节奏分析
    if (features.rhythm === 'fast') {
      emotionScores.excited += 0.3;
      emotionScores.anxious += 0.2;
      emotionScores.angry += 0.1;
    }
    if (features.rhythm === 'slow') {
      emotionScores.calm += 0.2;
      emotionScores.tired += 0.2;
      emotionScores.sad += 0.1;
    }

    // 颤抖度分析
    if (features.tremor > 5) {
      emotionScores.anxious += 0.3;
      emotionScores.fearful += 0.2;
    }

    // 音色分析
    if (features.timbre === 'sharp') {
      emotionScores.angry += 0.2;
      emotionScores.excited += 0.1;
    }
    if (features.timbre === 'soft') {
      emotionScores.calm += 0.2;
      emotionScores.affectionate += 0.2;
    }

    // 强度分析
    if (features.intensity > 30) {
      emotionScores.excited += 0.2;
      emotionScores.angry += 0.1;
    }

    // 找出最高分 - 不添加随机性
    let maxEmotion: EmotionType = 'calm';
    let maxScore = 0;
    const scores: Array<{ emotion: EmotionType; score: number }> = [];

    (Object.keys(emotionScores) as EmotionType[]).forEach(emotion => {
      const score = emotionScores[emotion];
      scores.push({ emotion, score });
      if (score > maxScore) {
        maxScore = score;
        maxEmotion = emotion;
      }
    });

    scores.sort((a, b) => b.score - a.score);
    const secondary = scores
      .filter(s => s.emotion !== maxEmotion)
      .slice(0, 3)
      .map(s => ({ emotion: s.emotion, confidence: Math.min(0.99, s.score) }));

    // 计算置信度 - 基于最高分与次高分的差距
    const gap = maxScore - (scores[1]?.score || 0);
    const confidence = Math.min(0.99, 0.65 + (maxScore * 0.15) + (gap * 0.25));

    return {
      emotion: maxEmotion,
      confidence,
      secondary,
      scores: emotionScores,
    };
  }
}

// 多模态融合模型
class MultimodalFusionModel {
  private imageModel: ImageEmotionModel;
  private voiceModel: VoiceEmotionModel;

  constructor() {
    this.imageModel = new ImageEmotionModel();
    this.voiceModel = new VoiceEmotionModel();
  }

  async analyze(
    imageData?: ImageData,
    audioData?: AudioBuffer,
    behaviorData?: BehaviorFeatures,
    context?: PetContext
  ): Promise<EmotionResult> {
    const startTime = performance.now();
    const results: EmotionResult[] = [];
    const modalWeights: number[] = [];

    // 并行分析各模态
    const promises: Promise<void>[] = [];

    if (imageData) {
      promises.push(
        this.imageModel.analyze(imageData, context).then(result => {
          results.push(result);
          // 根据图像质量分配权重
          modalWeights.push(this.calculateImageWeight(result));
        })
      );
    }

    if (audioData) {
      promises.push(
        this.voiceModel.analyze(audioData, context).then(result => {
          results.push(result);
          // 根据音频质量分配权重
          modalWeights.push(this.calculateVoiceWeight(result));
        })
      );
    }

    if (behaviorData) {
      promises.push(
        Promise.resolve(this.analyzeBehavior(behaviorData, context)).then(result => {
          results.push(result);
          // 行为数据权重较低
          modalWeights.push(0.6);
        })
      );
    }

    await Promise.all(promises);

    if (results.length === 0) {
      throw new Error('No data provided for analysis');
    }

    // 融合多模态结果
    const fusedResult = this.fuseResults(results, modalWeights);
    fusedResult.analysisDetails.processingTime = performance.now() - startTime;
    fusedResult.analysisDetails.model = 'Multimodal-Fusion-v2.0';

    return fusedResult;
  }

  // 计算图像结果权重
  private calculateImageWeight(result: EmotionResult): number {
    // 基础权重
    let weight = 0.4;
    
    // 根据置信度调整
    weight *= (0.5 + result.confidence * 0.5);
    
    // 如果有动物检测信息，进一步调整
    const animalConfidence = result.analysisDetails.features['animalConfidence'];
    if (animalConfidence !== undefined) {
      weight *= (0.7 + animalConfidence * 0.3);
    }
    
    return weight;
  }

  // 计算语音结果权重
  private calculateVoiceWeight(result: EmotionResult): number {
    // 基础权重
    let weight = 0.4;
    
    // 根据置信度调整
    weight *= (0.5 + result.confidence * 0.5);
    
    // 根据特征质量调整
    const duration = result.analysisDetails.features['duration'];
    if (duration !== undefined) {
      if (duration >= 2 && duration <= 5) {
        weight *= 1.1; // 理想时长
      } else if (duration < 1) {
        weight *= 0.7; // 太短
      }
    }
    
    return weight;
  }

  private analyzeBehavior(behavior: BehaviorFeatures, context?: PetContext): EmotionResult {
    const emotionScores: Record<EmotionType, number> = {
      happy: 0,
      sad: 0,
      angry: 0,
      fearful: 0,
      anxious: 0,
      calm: 0,
      excited: 0,
      tired: 0,
      hungry: 0,
      affectionate: 0,
      curious: 0,
      bored: 0,
    };

    if (behavior.activityLevel > 0.7) {
      emotionScores.excited += 0.3;
      emotionScores.happy += 0.2;
    }
    if (behavior.activityLevel < 0.3) {
      emotionScores.tired += 0.3;
      emotionScores.sad += 0.2;
    }

    if (behavior.appetite === 'decreased') {
      emotionScores.sad += 0.2;
      emotionScores.anxious += 0.2;
    }
    if (behavior.appetite === 'increased') {
      emotionScores.happy += 0.1;
    }

    if (behavior.sleepQuality === 'poor') {
      emotionScores.tired += 0.3;
      emotionScores.anxious += 0.2;
    }

    if (behavior.socialInteraction > 0.7) {
      emotionScores.affectionate += 0.3;
      emotionScores.happy += 0.2;
    }
    if (behavior.socialInteraction < 0.3) {
      emotionScores.bored += 0.2;
      emotionScores.anxious += 0.1;
    }

    if (behavior.playfulness > 0.7) {
      emotionScores.excited += 0.3;
      emotionScores.happy += 0.2;
    }

    if (!behavior.grooming) {
      emotionScores.anxious += 0.2;
      emotionScores.sad += 0.1;
    }

    // 应用上下文调整
    if (context) {
      // 应用年龄和品种调整
      const _model = new ImageEmotionModel();
      // 使用基类方法调整
      const adjustedScores = this.applyContextAdjustments(emotionScores, context);
      Object.assign(emotionScores, adjustedScores);
    }

    let maxEmotion: EmotionType = 'calm';
    let maxScore = 0;
    const scores: Array<{ emotion: EmotionType; score: number }> = [];

    (Object.keys(emotionScores) as EmotionType[]).forEach(emotion => {
      const score = emotionScores[emotion];
      scores.push({ emotion, score });
      if (score > maxScore) {
        maxScore = score;
        maxEmotion = emotion;
      }
    });

    scores.sort((a, b) => b.score - a.score);
    const secondary = scores
      .filter(s => s.emotion !== maxEmotion)
      .slice(0, 3)
      .map(s => ({ emotion: s.emotion, confidence: Math.min(0.99, s.score) }));

    // 计算置信度
    const gap = maxScore - (scores[1]?.score || 0);
    const confidence = Math.min(0.99, 0.6 + maxScore * 0.2 + gap * 0.2);

    const recommendations: Record<EmotionType, string> = {
      happy: '🎉 宠物非常快乐！继续保持',
      sad: '💧 需要更多关注和安慰',
      angry: '😾 检查是否有不适或压力',
      fearful: '😿 创造安静环境',
      anxious: '😟 减少压力源',
      calm: '😌 状态很好',
      excited: '🎊 充满活力！',
      tired: '😴 需要休息',
      hungry: '🍽️ 该喂食了',
      affectionate: '💕 需要您的爱抚',
      curious: '🤔 好奇心强',
      bored: '😐 需要互动',
    };

    return {
      primaryEmotion: maxEmotion,
      intensity: confidence < 0.5 ? 'low' : confidence < 0.7 ? 'medium' : confidence < 0.85 ? 'high' : 'very_high',
      confidence,
      secondaryEmotions: secondary,
      analysisDetails: {
        features: behavior as unknown as Record<string, number>,
        model: 'Behavior-Analysis-v1.0',
        timestamp: Date.now(),
        processingTime: 0,
      },
      recommendation: recommendations[maxEmotion],
    };
  }

  // 应用上下文调整
  private applyContextAdjustments(
    scores: Record<EmotionType, number>,
    context: PetContext
  ): Record<EmotionType, number> {
    const adjusted = { ...scores };
    
    // 年龄调整
    if (context.age !== undefined) {
      if (context.age < 1) {
        // 幼宠
        adjusted.excited = (adjusted.excited || 0) * 1.3;
        adjusted.curious = (adjusted.curious || 0) * 1.3;
      } else if (context.age >= 7) {
        // 老年
        adjusted.calm = (adjusted.calm || 0) * 1.2;
        adjusted.tired = (adjusted.tired || 0) * 1.3;
      }
    }
    
    return adjusted;
  }

  private fuseResults(results: EmotionResult[], weights: number[]): EmotionResult {
    if (results.length === 1) {
      // 即使只有一个结果，也要检查置信度
      const singleResult = results[0];
      if (singleResult.confidence < CONFIDENCE_THRESHOLDS.MIN_ACCEPTABLE) {
        return {
          ...singleResult,
          recommendation: '⚠️ 分析置信度较低，建议重新采样或提供更清晰的输入\n\n' + singleResult.recommendation,
        };
      }
      return singleResult;
    }

    // 加权融合
    const emotionScores: Record<EmotionType, number> = {
      happy: 0,
      sad: 0,
      angry: 0,
      fearful: 0,
      anxious: 0,
      calm: 0,
      excited: 0,
      tired: 0,
      hungry: 0,
      affectionate: 0,
      curious: 0,
      bored: 0,
    };

    // 归一化权重
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const normalizedWeights = weights.map(w => w / totalWeight);

    // 过滤掉低置信度的结果
    const validResults = results.filter(r => r.confidence >= CONFIDENCE_THRESHOLDS.MIN_ACCEPTABLE);
    
    if (validResults.length === 0) {
      // 所有结果都不可靠
      return {
        primaryEmotion: 'calm',
        intensity: 'low',
        confidence: CONFIDENCE_THRESHOLDS.MIN_ACCEPTABLE,
        secondaryEmotions: [],
        analysisDetails: {
          features: {},
          model: 'Multimodal-Fusion-v2.0',
          timestamp: Date.now(),
          processingTime: 0,
        },
        recommendation: '⚠️ 所有输入的置信度都较低，请提供更清晰的输入。\n\n可能的原因：\n• 图像不清晰或不包含宠物\n• 录音时间太短或噪音太大\n• 行为数据不完整',
      };
    }

    // 融合有效结果
    validResults.forEach((result, index) => {
      const weight = normalizedWeights[index] || 1 / validResults.length;
      emotionScores[result.primaryEmotion] += result.confidence * weight;
      
      result.secondaryEmotions.forEach(secondary => {
        emotionScores[secondary.emotion] += secondary.confidence * weight * 0.5;
      });
    });

    let maxEmotion: EmotionType = 'calm';
    let maxScore = 0;
    const scores: Array<{ emotion: EmotionType; score: number }> = [];

    (Object.keys(emotionScores) as EmotionType[]).forEach(emotion => {
      const score = emotionScores[emotion];
      scores.push({ emotion, score });
      if (score > maxScore) {
        maxScore = score;
        maxEmotion = emotion;
      }
    });

    scores.sort((a, b) => b.score - a.score);
    const secondary = scores
      .filter(s => s.emotion !== maxEmotion)
      .slice(0, 3)
      .map(s => ({ emotion: s.emotion, confidence: Math.min(0.99, s.score) }));

    // 计算融合置信度 - 考虑多模态一致性
    const consistencyBonus = this.calculateCrossModalConsistency(results);
    const fusedConfidence = Math.min(0.99, 0.7 + maxScore * 0.15 + consistencyBonus * 0.15);
    
    // 根据融合后的置信度生成建议
    let recommendation = validResults[0].recommendation;
    if (fusedConfidence < CONFIDENCE_THRESHOLDS.MIN_ACCEPTABLE) {
      recommendation = '⚠️ 分析置信度较低，建议重新采样或提供更清晰的输入';
    } else if (fusedConfidence < CONFIDENCE_THRESHOLDS.HIGH_CONFIDENCE) {
      recommendation = '📊 分析结果中等可信，建议结合实际情况判断\n\n' + recommendation;
    } else if (consistencyBonus > 0.7) {
      recommendation = '✅ 多种分析方法结果一致，置信度较高\n\n' + recommendation;
    }

    return {
      primaryEmotion: maxEmotion,
      intensity: fusedConfidence < 0.5 ? 'low' : fusedConfidence < 0.7 ? 'medium' : fusedConfidence < 0.85 ? 'high' : 'very_high',
      confidence: fusedConfidence,
      secondaryEmotions: secondary,
      analysisDetails: {
        features: { crossModalConsistency: consistencyBonus },
        model: 'Multimodal-Fusion-v2.0',
        timestamp: Date.now(),
        processingTime: 0,
      },
      recommendation,
    };
  }

  // 计算跨模态一致性
  private calculateCrossModalConsistency(results: EmotionResult[]): number {
    if (results.length < 2) return 0.5;
    
    // 检查主要情绪是否一致
    const primaryEmotions = results.map(r => r.primaryEmotion);
    const uniqueEmotions = new Set(primaryEmotions);
    
    if (uniqueEmotions.size === 1) {
      return 1.0; // 完全一致
    }
    
    if (uniqueEmotions.size === 2) {
      // 检查是否是相关情绪
      const emotions = Array.from(uniqueEmotions);
      const relatedPairs: Array<[EmotionType, EmotionType]> = [
        ['happy', 'excited'],
        ['calm', 'tired'],
        ['anxious', 'fearful'],
        ['sad', 'tired'],
        ['curious', 'excited'],
      ];
      
      for (const [e1, e2] of relatedPairs) {
        if ((emotions.includes(e1) && emotions.includes(e2)) ||
            (emotions.includes(e2) && emotions.includes(e1))) {
          return 0.8; // 相关情绪
        }
      }
      return 0.5; // 不相关但只有两种
    }
    
    return 0.3; // 多种不同情绪
  }
}

// 导出AI分析引擎
export const AIEngine = new MultimodalFusionModel();

// 便捷函数
export const analyzeEmotion = async (
  imageData?: ImageData,
  audioData?: AudioBuffer,
  behaviorData?: BehaviorFeatures,
  context?: PetContext
): Promise<EmotionResult> => {
  return AIEngine.analyze(imageData, audioData, behaviorData, context);
};

// 批量分析
export const batchAnalyzeEmotions = async (
  data: Array<{
    imageData?: ImageData;
    audioData?: AudioBuffer;
    behaviorData?: BehaviorFeatures;
    context?: PetContext;
  }>
): Promise<EmotionResult[]> => {
  return Promise.all(
    data.map(d => AIEngine.analyze(d.imageData, d.audioData, d.behaviorData, d.context))
  );
};

// 获取历史趋势 - 增强版趋势分析
export const analyzeEmotionTrend = (
  history: EmotionResult[]
): {
  dominantEmotion: EmotionType;
  averageConfidence: number;
  stability: number;
  trend: 'improving' | 'stable' | 'declining';
  anomalyScore: number;
  prediction: {
    nextEmotion: EmotionType;
    confidence: number;
  };
  emotionalBalance: number;
  engagement: 'high' | 'medium' | 'low';
} => {
  if (history.length === 0) {
    return {
      dominantEmotion: 'calm',
      averageConfidence: 0,
      stability: 0,
      trend: 'stable',
      anomalyScore: 0,
      prediction: {
        nextEmotion: 'calm',
        confidence: 0,
      },
      emotionalBalance: 0,
      engagement: 'low',
    };
  }

  const emotionCounts: Record<string, number> = {};
  let totalConfidence = 0;

  history.forEach(result => {
    emotionCounts[result.primaryEmotion] = (emotionCounts[result.primaryEmotion] || 0) + 1;
    totalConfidence += result.confidence;
  });

  const dominantEmotion = (Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'calm') as EmotionType;

  const averageConfidence = totalConfidence / history.length;

  // 计算稳定性（情感变化的频率）
  const transitions = history.filter((result, i) => 
    i > 0 && result.primaryEmotion !== history[i - 1].primaryEmotion
  ).length;
  const stability = 1 - (transitions / Math.max(1, history.length - 1));

  // 增强版趋势计算 - 使用滑动窗口
  const _windowSize = Math.min(3, Math.floor(history.length / 3));
  const positiveEmotions = ['happy', 'excited', 'calm', 'affectionate', 'curious'];
  const negativeEmotions = ['sad', 'angry', 'fearful', 'anxious', 'bored'];
  
  let positiveCount = 0;
  let negativeCount = 0;
  let positiveTrend = 0;
  let negativeTrend = 0;
  
  for (let i = 0; i < history.length; i++) {
    const emotion = history[i].primaryEmotion;
    const weight = i / history.length; // 近期权重更高
    
    if (positiveEmotions.includes(emotion)) {
      positiveCount++;
      positiveTrend += weight;
    } else if (negativeEmotions.includes(emotion)) {
      negativeCount++;
      negativeTrend += weight;
    }
  }
  
  const positiveRatio = positiveCount / history.length;
  const negativeRatio = negativeCount / history.length;
  
  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (positiveTrend > negativeTrend * 1.5 && positiveRatio > 0.6) {
    trend = 'improving';
  } else if (negativeTrend > positiveTrend * 1.5 && negativeRatio > 0.6) {
    trend = 'declining';
  } else if (Math.abs(positiveTrend - negativeTrend) < 0.2) {
    trend = 'stable';
  }

  // 计算异常分数
  const confidenceVariance = calculateVariance(history.map(r => r.confidence));
  const emotionEntropy = calculateEntropy(Object.values(emotionCounts));
  const anomalyScore = Math.min(1, (confidenceVariance * 0.5 + (1 - emotionEntropy) * 0.5));

  // 预测下一情绪
  const recentEmotions = history.slice(-3).map(r => r.primaryEmotion);
  const prediction = predictNextEmotion(recentEmotions, emotionCounts);

  // 计算情感平衡度
  const emotionalBalance = positiveRatio - negativeRatio;

  // 计算参与度
  const engagement: 'high' | 'medium' | 'low' = stability < 0.5 ? 'high' : stability < 0.8 ? 'medium' : 'low';

  return {
    dominantEmotion,
    averageConfidence,
    stability,
    trend,
    anomalyScore,
    prediction,
    emotionalBalance,
    engagement,
  };
};

// 计算方差 - 增强版
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const result = isNaN(variance) || !isFinite(variance) ? 0 : Math.min(1, Math.sqrt(variance));
  return result;
}

// 计算熵 - 增强版
function calculateEntropy(counts: number[]): number {
  if (counts.length === 0) return 0;
  const total = counts.reduce((sum, count) => sum + count, 0);
  if (total === 0) return 0;
  const entropy = counts.reduce((entropy, count) => {
    if (count === 0) return entropy;
    const p = count / total;
    return entropy - p * Math.log2(p);
  }, 0);
  const normalizedEntropy = entropy / Math.log2(counts.length || 1);
  const result = isNaN(normalizedEntropy) || !isFinite(normalizedEntropy) ? 0 : normalizedEntropy;
  return result;
}

// 预测下一情绪
function predictNextEmotion(
  recentEmotions: EmotionType[],
  emotionCounts: Record<string, number>
): { nextEmotion: EmotionType; confidence: number } {
  if (recentEmotions.length === 0) {
    const dominant = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'calm';
    return { nextEmotion: dominant as EmotionType, confidence: 0.5 };
  }

  // 基于马尔可夫链的简单预测
  const transitionMatrix: Record<string, Record<string, number>> = {};
  
  for (let i = 0; i < recentEmotions.length - 1; i++) {
    const current = recentEmotions[i];
    const next = recentEmotions[i + 1];
    
    if (!transitionMatrix[current]) {
      transitionMatrix[current] = {};
    }
    transitionMatrix[current][next] = (transitionMatrix[current][next] || 0) + 1;
  }

  const lastEmotion = recentEmotions[recentEmotions.length - 1];
  const transitions = transitionMatrix[lastEmotion];
  
  if (transitions && Object.keys(transitions).length > 0) {
    const predicted = Object.entries(transitions)
      .sort((a, b) => b[1] - a[1])[0][0];
    // 基于转移次数计算置信度
    const totalTransitions = Object.values(transitions).reduce((a, b) => a + b, 0);
    const transitionProbability = transitions[predicted] / totalTransitions;
    return { 
      nextEmotion: predicted as EmotionType, 
      confidence: 0.6 + transitionProbability * 0.3 
    };
  }

  // 回退到基于频率的预测
  const dominant = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'calm';
  return { nextEmotion: dominant as EmotionType, confidence: 0.5 };
}
