/**
 * 多模态融合服务
 * Cross-Attention 融合层架构
 * 音频+图像联合分析
 * 冲突检测和处理
 */

import type {
  MultimodalFusionOptions,
  MultimodalFusionResult,
  AudioAnalysisResult,
  ImageAnalysisResult,
  AudioFeatures,
  ImageFeatures,
  CrossModalAttention,
  ModalityConflict,
  ModalityFeatures,
  InferenceMode,
} from './types';
import { audioModelService } from './audioModelService';
import { imageModelService } from './imageModelService';
import { DEFAULT_FUSION_OPTIONS } from './types';

// ==================== 类型定义 ====================

/**
 * 融合策略处理器类型
 */
type FusionStrategyHandler = (
  audioResult: AudioAnalysisResult,
  imageResult: ImageAnalysisResult,
  options: MultimodalFusionOptions
) => Promise<{
  fusedFeatures: Float32Array;
  crossAttention?: CrossModalAttention;
  finalPrediction: MultimodalFusionResult['finalPrediction'];
  modalityContribution: MultimodalFusionResult['modalityContribution'];
}>;

// ==================== Cross-Attention 融合层 ====================

/**
 * Cross-Attention 融合层
 * 实现跨模态注意力机制
 */
class CrossAttentionFusionLayer {
  private attentionDim = 64;
  private hiddenDim = 128;

  /**
   * 计算跨模态注意力
   */
  computeAttention(
    audioFeatures: Float32Array,
    imageFeatures: Float32Array
  ): CrossModalAttention {
    // 简化的 Cross-Attention 实现
    // 实际项目中应使用 TensorFlow.js 或 PyTorch

    const audioLen = audioFeatures.length;
    const imageLen = imageFeatures.length;

    // 音频到图像的注意力
    const audioToImage = new Float32Array(imageLen);
    for (let i = 0; i < imageLen; i++) {
      let sum = 0;
      for (let j = 0; j < audioLen; j++) {
        // 简化的注意力计算（点积）
        sum += audioFeatures[j] * imageFeatures[i] * (1 / Math.sqrt(this.attentionDim));
      }
      audioToImage[i] = this.softmax(sum, audioLen);
    }

    // 图像到音频的注意力
    const imageToAudio = new Float32Array(audioLen);
    for (let i = 0; i < audioLen; i++) {
      let sum = 0;
      for (let j = 0; j < imageLen; j++) {
        sum += imageFeatures[j] * audioFeatures[i] * (1 / Math.sqrt(this.attentionDim));
      }
      imageToAudio[i] = this.softmax(sum, imageLen);
    }

    // 融合权重
    const fusionWeights = new Float32Array(audioLen + imageLen);
    const totalWeight = audioLen + imageLen;
    
    for (let i = 0; i < audioLen; i++) {
      fusionWeights[i] = 0.5 + (audioToImage[i % imageLen] - 0.5) * 0.2;
    }
    for (let i = audioLen; i < totalWeight; i++) {
      fusionWeights[i] = 0.5 + (imageToAudio[i % audioLen] - 0.5) * 0.2;
    }

    return {
      audioToImage,
      imageToAudio,
      fusionWeights,
    };
  }

  /**
   * Softmax 函数（简化版本）
   */
  private softmax(value: number, _length: number): number {
    // 简化的 softmax，实际应使用完整实现
    const expValue = Math.exp(value);
    // 这里简化处理，返回归一化值
    return Math.max(0, Math.min(1, expValue / (expValue + 1)));
  }

  /**
   * 融合特征
   */
  fuseFeatures(
    audioFeatures: Float32Array,
    imageFeatures: Float32Array,
    attention: CrossModalAttention
  ): Float32Array {
    const audioLen = audioFeatures.length;
    const imageLen = imageFeatures.length;
    const fusedLength = this.hiddenDim;

    const fusedFeatures = new Float32Array(fusedLength);

    // 使用注意力权重融合特征
    for (let i = 0; i < fusedLength; i++) {
      let audioContribution = 0;
      let imageContribution = 0;

      // 从音频特征提取
      const audioIdx = i % audioLen;
      audioContribution = audioFeatures[audioIdx] * attention.fusionWeights[audioIdx];

      // 从图像特征提取
      const imageIdx = i % imageLen;
      imageContribution = imageFeatures[imageIdx] * attention.fusionWeights[audioLen + imageIdx];

      // 融合
      fusedFeatures[i] = audioContribution + imageContribution;
    }

    // 归一化
    const maxVal = Math.max(...fusedFeatures.map(Math.abs));
    if (maxVal > 0) {
      for (let i = 0; i < fusedLength; i++) {
        fusedFeatures[i] /= maxVal;
      }
    }

    return fusedFeatures;
  }
}

// ==================== 冲突检测器 ====================

/**
 * 冲突检测器
 * 检测和处理多模态分析中的冲突
 */
class ConflictDetector {
  /**
   * 检测模态冲突
   */
  detectConflict(
    audioResult: AudioAnalysisResult,
    imageResult: ImageAnalysisResult,
    options: MultimodalFusionOptions
  ): ModalityConflict {
    // 检查预测冲突
    const predictionConflict = this.checkPredictionConflict(audioResult, imageResult);
    
    // 检查置信度冲突
    const confidenceConflict = this.checkConfidenceConflict(audioResult, imageResult, options);
    
    // 检查特征冲突
    const featureConflict = this.checkFeatureConflict(audioResult, imageResult);

    // 确定主要冲突类型
    const conflicts = [
      predictionConflict,
      confidenceConflict,
      featureConflict,
    ];

    const maxConflict = conflicts.reduce((max, curr) => 
      curr.severity > max.severity ? curr : max
    );

    return maxConflict;
  }

  /**
   * 检查预测冲突
   */
  private checkPredictionConflict(
    audioResult: AudioAnalysisResult,
    imageResult: ImageAnalysisResult
  ): ModalityConflict {
    const audioClass = audioResult.classification?.predictedClass;
    const imageClass = imageResult.classification?.predictedClass;

    if (!audioClass || !imageClass) {
      return {
        hasConflict: false,
        conflictType: 'none',
        description: '缺少分类结果',
        severity: 0,
        resolution: '使用单一模态结果',
      };
    }

    // 检查类别是否一致
    if (audioClass === imageClass) {
      return {
        hasConflict: false,
        conflictType: 'none',
        description: '音频和图像预测一致',
        severity: 0,
        resolution: '使用一致结果',
      };
    }

    // 检查类别是否相关
    const relatedCategories = this.getRelatedCategories(audioClass, imageClass);
    
    if (relatedCategories) {
      return {
        hasConflict: false,
        conflictType: 'none',
        description: `音频(${audioClass})和图像(${imageClass})类别相关`,
        severity: 0.2,
        resolution: '使用置信度更高的结果',
      };
    }

    // 存在冲突
    return {
      hasConflict: true,
      conflictType: 'prediction',
      description: `音频预测(${audioClass})与图像预测(${imageClass})不一致`,
      severity: 0.8,
      resolution: '使用置信度加权融合',
    };
  }

  /**
   * 检查置信度冲突
   */
  private checkConfidenceConflict(
    audioResult: AudioAnalysisResult,
    imageResult: ImageAnalysisResult,
    options: MultimodalFusionOptions
  ): ModalityConflict {
    const audioConfidence = audioResult.confidence;
    const imageConfidence = imageResult.confidence;
    const threshold = options.confidenceThreshold || 0.7;

    // 检查置信度差异
    const diff = Math.abs(audioConfidence - imageConfidence);
    
    if (diff < 0.2) {
      return {
        hasConflict: false,
        conflictType: 'none',
        description: '置信度差异较小',
        severity: 0,
        resolution: '使用加权平均',
      };
    }

    // 检查是否都低于阈值
    if (audioConfidence < threshold && imageConfidence < threshold) {
      return {
        hasConflict: true,
        conflictType: 'confidence',
        description: '两个模态置信度都低于阈值',
        severity: 0.6,
        resolution: '请求更多数据或使用后端推理',
      };
    }

    // 一个高一个低
    if (diff > 0.3) {
      return {
        hasConflict: true,
        conflictType: 'confidence',
        description: `置信度差异较大(${diff.toFixed(2)})`,
        severity: 0.4,
        resolution: '使用置信度更高的模态结果',
      };
    }

    return {
      hasConflict: false,
      conflictType: 'none',
      description: '置信度差异适中',
      severity: 0.1,
      resolution: '使用置信度加权',
    };
  }

  /**
   * 检查特征冲突
   */
  private checkFeatureConflict(
    audioResult: AudioAnalysisResult,
    imageResult: ImageAnalysisResult
  ): ModalityConflict {
    const audioFeatures = audioResult.features;
    const imageFeatures = imageResult.features;

    if (!audioFeatures || !imageFeatures) {
      return {
        hasConflict: false,
        conflictType: 'none',
        description: '缺少特征数据',
        severity: 0,
        resolution: '使用可用特征',
      };
    }

    // 检查特征维度
    const audioDim = this.getFeatureDimension(audioFeatures);
    const imageDim = this.getFeatureDimension(imageFeatures);

    if (audioDim === 0 || imageDim === 0) {
      return {
        hasConflict: true,
        conflictType: 'feature',
        description: '特征维度为零',
        severity: 0.5,
        resolution: '重新提取特征',
      };
    }

    return {
      hasConflict: false,
      conflictType: 'none',
      description: '特征正常',
      severity: 0,
      resolution: '正常融合',
    };
  }

  /**
   * 获取相关类别
   */
  private getRelatedCategories(audioClass: string, imageClass: string): boolean {
    // 定义相关类别映射
    const relatedMap: Record<string, Set<string>> = {
      'speech': new Set(['human', 'face', 'person']),
      'animal': new Set(['dog', 'cat', 'bird', 'pet']),
      'music': new Set(['instrument', 'concert']),
      'dog': new Set(['animal', 'pet', 'bark']),
      'cat': new Set(['animal', 'pet', 'meow']),
    };

    const audioRelated = relatedMap[audioClass];
    const imageRelated = relatedMap[imageClass];

    if (audioRelated && audioRelated.has(imageClass)) return true;
    if (imageRelated && imageRelated.has(audioClass)) return true;

    return false;
  }

  /**
   * 获取特征维度
   */
  private getFeatureDimension(features: AudioFeatures | ImageFeatures): number {
    let dim = 0;
    
    // AudioFeatures 属性
    if ('mfcc' in features && features.mfcc) dim += features.mfcc.length;
    if ('melSpectrogram' in features && features.melSpectrogram) dim += features.melSpectrogram.length;
    if ('yamnetEmbedding' in features && features.yamnetEmbedding) dim += features.yamnetEmbedding.length;
    if ('chroma' in features && features.chroma) dim += features.chroma.length;
    
    // ImageFeatures 属性
    if ('mobilenetEmbedding' in features && features.mobilenetEmbedding) dim += features.mobilenetEmbedding.length;
    if ('hogFeatures' in features && features.hogFeatures) dim += features.hogFeatures.length;
    if ('colorHistogram' in features && features.colorHistogram) dim += features.colorHistogram.length;
    
    return dim;
  }

  /**
   * 解决冲突
   */
  resolveConflict(
    conflict: ModalityConflict,
    audioResult: AudioAnalysisResult,
    imageResult: ImageAnalysisResult,
    options: MultimodalFusionOptions
  ): {
    audioWeight: number;
    imageWeight: number;
    strategy: string;
  } {
    switch (options.conflictResolution) {
      case 'weighted':
        // 使用预设权重
        return {
          audioWeight: options.audioWeight || 0.5,
          imageWeight: options.imageWeight || 0.5,
          strategy: '加权平均',
        };

      case 'confidence':
        // 使用置信度作为权重
        const totalConfidence = audioResult.confidence + imageResult.confidence;
        return {
          audioWeight: totalConfidence > 0 ? audioResult.confidence / totalConfidence : 0.5,
          imageWeight: totalConfidence > 0 ? imageResult.confidence / totalConfidence : 0.5,
          strategy: '置信度加权',
        };

      case 'hierarchical':
        // 使用层级优先级
        // 图像优先（视觉信息更丰富）
        return {
          audioWeight: 0.3,
          imageWeight: 0.7,
          strategy: '层级优先（图像优先）',
        };

      case 'reject':
        // 拒绝低置信度结果
        const threshold = options.confidenceThreshold || 0.7;
        if (audioResult.confidence < threshold && imageResult.confidence < threshold) {
          return {
            audioWeight: 0,
            imageWeight: 0,
            strategy: '拒绝（置信度不足）',
          };
        }
        return {
          audioWeight: audioResult.confidence >= threshold ? 1 : 0,
          imageWeight: imageResult.confidence >= threshold ? 1 : 0,
          strategy: '阈值过滤',
        };

      default:
        return {
          audioWeight: 0.5,
          imageWeight: 0.5,
          strategy: '默认平均',
        };
    }
  }
}

// ==================== 融合策略处理器 ====================

/**
 * 早期融合策略
 * 在特征层面直接拼接
 */
const earlyFusionStrategy: FusionStrategyHandler = async (
  audioResult,
  imageResult,
  options
) => {
  const audioFeatures = audioResult.features?.mfcc || new Float32Array(13);
  const imageFeatures = imageResult.features?.colorHistogram || new Float32Array(64);

  // 直接拼接特征
  const fusedFeatures = new Float32Array(audioFeatures.length + imageFeatures.length);
  fusedFeatures.set(audioFeatures, 0);
  fusedFeatures.set(imageFeatures, audioFeatures.length);

  // 计算预测
  const audioWeight = options.audioWeight || 0.5;
  const imageWeight = options.imageWeight || 0.5;

  const audioProb = audioResult.classification?.probabilities || {};
  const imageProb = imageResult.classification?.probabilities || {};

  // 加权融合概率
  const fusedProbabilities: Record<string, number> = {};
  const allLabels = new Set([...Object.keys(audioProb), ...Object.keys(imageProb)]);
  
  allLabels.forEach((label) => {
    fusedProbabilities[label] = 
      (audioProb[label] || 0) * audioWeight + 
      (imageProb[label] || 0) * imageWeight;
  });

  // 找最高概率
  let maxProb = 0;
  let predictedLabel = 'unknown';
  Object.entries(fusedProbabilities).forEach(([label, prob]) => {
    if (prob > maxProb) {
      maxProb = prob;
      predictedLabel = label;
    }
  });

  return {
    fusedFeatures,
    finalPrediction: {
      label: predictedLabel,
      confidence: maxProb,
      probabilities: fusedProbabilities,
    },
    modalityContribution: {
      audio: audioWeight,
      image: imageWeight,
    },
  };
};

/**
 * 后期融合策略
 * 在决策层面融合
 */
const lateFusionStrategy: FusionStrategyHandler = async (
  audioResult,
  imageResult,
  options
) => {
  // 不融合特征，只融合决策
  const audioFeatures = audioResult.features?.mfcc || new Float32Array(13);
  const imageFeatures = imageResult.features?.colorHistogram || new Float32Array(64);

  // 创建空融合特征
  const fusedFeatures = new Float32Array(0);

  const audioWeight = options.audioWeight || 0.5;
  const imageWeight = options.imageWeight || 0.5;

  const audioProb = audioResult.classification?.probabilities || {};
  const imageProb = imageResult.classification?.probabilities || {};

  // 加权融合概率
  const fusedProbabilities: Record<string, number> = {};
  const allLabels = new Set([...Object.keys(audioProb), ...Object.keys(imageProb)]);
  
  allLabels.forEach((label) => {
    fusedProbabilities[label] = 
      (audioProb[label] || 0) * audioWeight + 
      (imageProb[label] || 0) * imageWeight;
  });

  let maxProb = 0;
  let predictedLabel = 'unknown';
  Object.entries(fusedProbabilities).forEach(([label, prob]) => {
    if (prob > maxProb) {
      maxProb = prob;
      predictedLabel = label;
    }
  });

  return {
    fusedFeatures,
    finalPrediction: {
      label: predictedLabel,
      confidence: maxProb,
      probabilities: fusedProbabilities,
    },
    modalityContribution: {
      audio: audioWeight,
      image: imageWeight,
    },
  };
};

/**
 * Cross-Attention 融合策略
 * 使用注意力机制融合
 */
const crossAttentionFusionStrategy: FusionStrategyHandler = async (
  audioResult,
  imageResult,
  options
) => {
  const fusionLayer = new CrossAttentionFusionLayer();

  const audioFeatures = audioResult.features?.mfcc || new Float32Array(13);
  const imageFeatures = imageResult.features?.colorHistogram || new Float32Array(64);

  // 计算跨模态注意力
  const crossAttention = fusionLayer.computeAttention(audioFeatures, imageFeatures);

  // 融合特征
  const fusedFeatures = fusionLayer.fuseFeatures(audioFeatures, imageFeatures, crossAttention);

  // 计算模态贡献
  const audioWeight = options.audioWeight || 0.5;
  const imageWeight = options.imageWeight || 0.5;

  // 根据注意力调整权重
  const adjustedAudioWeight = audioWeight * (1 + crossAttention.audioToImage.reduce((a, b) => a + b, 0) / crossAttention.audioToImage.length - 0.5);
  const adjustedImageWeight = imageWeight * (1 + crossAttention.imageToAudio.reduce((a, b) => a + b, 0) / crossAttention.imageToAudio.length - 0.5);

  const totalWeight = adjustedAudioWeight + adjustedImageWeight;
  const normalizedAudioWeight = totalWeight > 0 ? adjustedAudioWeight / totalWeight : audioWeight;
  const normalizedImageWeight = totalWeight > 0 ? adjustedImageWeight / totalWeight : imageWeight;

  const audioProb = audioResult.classification?.probabilities || {};
  const imageProb = imageResult.classification?.probabilities || {};

  const fusedProbabilities: Record<string, number> = {};
  const allLabels = new Set([...Object.keys(audioProb), ...Object.keys(imageProb)]);
  
  allLabels.forEach((label) => {
    fusedProbabilities[label] = 
      (audioProb[label] || 0) * normalizedAudioWeight + 
      (imageProb[label] || 0) * normalizedImageWeight;
  });

  let maxProb = 0;
  let predictedLabel = 'unknown';
  Object.entries(fusedProbabilities).forEach(([label, prob]) => {
    if (prob > maxProb) {
      maxProb = prob;
      predictedLabel = label;
    }
  });

  return {
    fusedFeatures,
    crossAttention,
    finalPrediction: {
      label: predictedLabel,
      confidence: maxProb,
      probabilities: fusedProbabilities,
    },
    modalityContribution: {
      audio: normalizedAudioWeight,
      image: normalizedImageWeight,
    },
  };
};

/**
 * 层级融合策略
 * 使用层级结构融合
 */
const hierarchicalFusionStrategy: FusionStrategyHandler = async (
  audioResult,
  imageResult,
  options
) => {
  // 第一层：特征融合
  const audioFeatures = audioResult.features?.mfcc || new Float32Array(13);
  const imageFeatures = imageResult.features?.colorHistogram || new Float32Array(64);

  // 第二层：注意力融合
  const fusionLayer = new CrossAttentionFusionLayer();
  const crossAttention = fusionLayer.computeAttention(audioFeatures, imageFeatures);
  const fusedFeatures = fusionLayer.fuseFeatures(audioFeatures, imageFeatures, crossAttention);

  // 第三层：决策融合
  const audioProb = audioResult.classification?.probabilities || {};
  const imageProb = imageResult.classification?.probabilities || {};

  // 层级权重：图像优先
  const audioWeight = 0.3;
  const imageWeight = 0.7;

  const fusedProbabilities: Record<string, number> = {};
  const allLabels = new Set([...Object.keys(audioProb), ...Object.keys(imageProb)]);
  
  allLabels.forEach((label) => {
    fusedProbabilities[label] = 
      (audioProb[label] || 0) * audioWeight + 
      (imageProb[label] || 0) * imageWeight;
  });

  let maxProb = 0;
  let predictedLabel = 'unknown';
  Object.entries(fusedProbabilities).forEach(([label, prob]) => {
    if (prob > maxProb) {
      maxProb = prob;
      predictedLabel = label;
    }
  });

  return {
    fusedFeatures,
    crossAttention,
    finalPrediction: {
      label: predictedLabel,
      confidence: maxProb,
      probabilities: fusedProbabilities,
    },
    modalityContribution: {
      audio: audioWeight,
      image: imageWeight,
    },
  };
};

// ==================== 多模态融合服务 ====================

/**
 * 多模态融合服务
 * 提供音频+图像联合分析和冲突处理
 */
export class MultimodalFusionService {
  // 单例实例
  private static instance: MultimodalFusionService | null = null;

  // 冲突检测器
  private conflictDetector: ConflictDetector;

  // 融合策略处理器
  private fusionStrategies: Map<string, FusionStrategyHandler>;

  // 配置
  private initialized = false;

  private constructor() {
    this.conflictDetector = new ConflictDetector();
    this.fusionStrategies = new Map([
      ['early', earlyFusionStrategy],
      ['late', lateFusionStrategy],
      ['cross_attention', crossAttentionFusionStrategy],
      ['hierarchical', hierarchicalFusionStrategy],
    ]);
  }

  /**
   * 获取单例实例
   */
  static getInstance(): MultimodalFusionService {
    if (!MultimodalFusionService.instance) {
      MultimodalFusionService.instance = new MultimodalFusionService();
    }
    return MultimodalFusionService.instance;
  }

  /**
   * 初始化服务
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // 初始化依赖服务
      await audioModelService.init();
      await imageModelService.init();

      this.initialized = true;
      console.log('[MultimodalFusionService] 初始化成功');
    } catch (error) {
      console.error('[MultimodalFusionService] 初始化失败:', error);
      throw error;
    }
  }

  /**
   * 执行多模态融合分析
   * 主入口方法
   */
  async fuse(
    audioData: Float32Array,
    imageData: ImageData,
    options: MultimodalFusionOptions = {}
  ): Promise<MultimodalFusionResult> {
    const startTime = Date.now();
    const id = `fusion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 合并默认选项
    const opts: MultimodalFusionOptions = {
      ...DEFAULT_FUSION_OPTIONS,
      ...options,
    };

    try {
      // 确保已初始化
      if (!this.initialized) {
        await this.init();
      }

      // 并行执行音频和图像分析
      const [audioResult, imageResult] = await Promise.all([
        audioModelService.analyzeAudio(audioData, {
          returnIntermediate: true,
          inferenceMode: 'frontend',
        }),
        imageModelService.analyzeImage(imageData, {
          returnFeatures: true,
          inferenceMode: 'frontend',
        }),
      ]);

      // 检查分析结果
      if (!audioResult.success || !imageResult.success) {
        return {
          id,
          timestamp: Date.now(),
          processingTime: Date.now() - startTime,
          fusionStrategy: opts.fusionStrategy,
          audioResult,
          imageResult,
          finalPrediction: {
            label: 'unknown',
            confidence: 0,
            probabilities: {},
          },
          modalityContribution: {
            audio: 0,
            image: 0,
          },
          success: false,
          error: '音频或图像分析失败',
        };
      }

      // 冲突检测
      let conflictDetection: ModalityConflict | undefined;
      if (opts.enableConflictDetection) {
        conflictDetection = this.conflictDetector.detectConflict(audioResult, imageResult, opts);
        
        // 如果存在冲突，调整权重
        if (conflictDetection.hasConflict) {
          const resolution = this.conflictDetector.resolveConflict(
            conflictDetection,
            audioResult,
            imageResult,
            opts
          );
          opts.audioWeight = resolution.audioWeight;
          opts.imageWeight = resolution.imageWeight;
        }
      }

      // 选择融合策略
      const strategyHandler = this.fusionStrategies.get(opts.fusionStrategy);
      if (!strategyHandler) {
        throw new Error(`未知的融合策略: ${opts.fusionStrategy}`);
      }

      // 执行融合
      const fusionResult = await strategyHandler(audioResult, imageResult, opts);

      const processingTime = Date.now() - startTime;

      return {
        id,
        timestamp: Date.now(),
        processingTime,
        fusionStrategy: opts.fusionStrategy,
        audioResult,
        imageResult,
        fusedFeatures: fusionResult.fusedFeatures,
        crossAttention: fusionResult.crossAttention,
        conflictDetection,
        finalPrediction: fusionResult.finalPrediction,
        modalityContribution: fusionResult.modalityContribution,
        success: true,
      };
    } catch (error) {
      return {
        id,
        timestamp: Date.now(),
        processingTime: Date.now() - startTime,
        fusionStrategy: opts.fusionStrategy,
        finalPrediction: {
          label: 'unknown',
          confidence: 0,
          probabilities: {},
        },
        modalityContribution: {
          audio: 0,
          image: 0,
        },
        success: false,
        error: error instanceof Error ? error.message : '多模态融合失败',
      };
    }
  }

  /**
   * 仅融合已有结果
   * 不执行新的分析
   */
  async fuseResults(
    audioResult: AudioAnalysisResult,
    imageResult: ImageAnalysisResult,
    options: MultimodalFusionOptions = {}
  ): Promise<MultimodalFusionResult> {
    const startTime = Date.now();
    const id = `fusion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const opts: MultimodalFusionOptions = {
      ...DEFAULT_FUSION_OPTIONS,
      ...options,
    };

    try {
      // 冲突检测
      let conflictDetection: ModalityConflict | undefined;
      if (opts.enableConflictDetection) {
        conflictDetection = this.conflictDetector.detectConflict(audioResult, imageResult, opts);
        
        if (conflictDetection.hasConflict) {
          const resolution = this.conflictDetector.resolveConflict(
            conflictDetection,
            audioResult,
            imageResult,
            opts
          );
          opts.audioWeight = resolution.audioWeight;
          opts.imageWeight = resolution.imageWeight;
        }
      }

      // 选择融合策略
      const strategyHandler = this.fusionStrategies.get(opts.fusionStrategy);
      if (!strategyHandler) {
        throw new Error(`未知的融合策略: ${opts.fusionStrategy}`);
      }

      const fusionResult = await strategyHandler(audioResult, imageResult, opts);

      return {
        id,
        timestamp: Date.now(),
        processingTime: Date.now() - startTime,
        fusionStrategy: opts.fusionStrategy,
        audioResult,
        imageResult,
        fusedFeatures: fusionResult.fusedFeatures,
        crossAttention: fusionResult.crossAttention,
        conflictDetection,
        finalPrediction: fusionResult.finalPrediction,
        modalityContribution: fusionResult.modalityContribution,
        success: true,
      };
    } catch (error) {
      return {
        id,
        timestamp: Date.now(),
        processingTime: Date.now() - startTime,
        fusionStrategy: opts.fusionStrategy,
        audioResult,
        imageResult,
        finalPrediction: {
          label: 'unknown',
          confidence: 0,
          probabilities: {},
        },
        modalityContribution: {
          audio: 0,
          image: 0,
        },
        success: false,
        error: error instanceof Error ? error.message : '融合失败',
      };
    }
  }

  /**
   * 获取模态特征
   */
  getModalityFeatures(
    audioResult: AudioAnalysisResult,
    imageResult: ImageAnalysisResult
  ): ModalityFeatures {
    return {
      audio: audioResult.features,
      image: imageResult.features,
      dimensions: {
        audio: this.getFeatureDimension(audioResult.features),
        image: this.getFeatureDimension(imageResult.features),
      },
    };
  }

  /**
   * 获取特征维度
   */
  private getFeatureDimension(features?: AudioFeatures | ImageFeatures): number {
    if (!features) return 0;
    
    let dim = 0;
    
    // AudioFeatures 属性
    if ('mfcc' in features && features.mfcc) dim += features.mfcc.length;
    if ('melSpectrogram' in features && features.melSpectrogram) dim += features.melSpectrogram.length;
    if ('yamnetEmbedding' in features && features.yamnetEmbedding) dim += features.yamnetEmbedding.length;
    if ('chroma' in features && features.chroma) dim += features.chroma.length;
    
    // ImageFeatures 属性
    if ('mobilenetEmbedding' in features && features.mobilenetEmbedding) dim += features.mobilenetEmbedding.length;
    if ('hogFeatures' in features && features.hogFeatures) dim += features.hogFeatures.length;
    if ('colorHistogram' in features && features.colorHistogram) dim += features.colorHistogram.length;
    
    return dim;
  }

  /**
   * 检查服务状态
   */
  getStatus(): {
    initialized: boolean;
    audioServiceReady: boolean;
    imageServiceReady: boolean;
    availableStrategies: string[];
  } {
    return {
      initialized: this.initialized,
      audioServiceReady: audioModelService.getStatus().initialized,
      imageServiceReady: imageModelService.getStatus().initialized,
      availableStrategies: Array.from(this.fusionStrategies.keys()),
    };
  }

  /**
   * 注册自定义融合策略
   */
  registerStrategy(name: string, handler: FusionStrategyHandler): void {
    this.fusionStrategies.set(name, handler);
    console.log(`[MultimodalFusionService] 注册融合策略: ${name}`);
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.initialized = false;
    console.log('[MultimodalFusionService] 服务已销毁');
  }
}

// 导出单例
export const multimodalFusionService = MultimodalFusionService.getInstance();