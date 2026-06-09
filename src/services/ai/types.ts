/**
 * AI 服务类型定义
 * 支持前端轻量推理和后端高精度推理两种模式
 */

// ==================== 模型类型定义 ====================

/**
 * 支持的模型类型
 */
export type ModelType = 'yamnet' | 'mobilenetv3' | 'custom';

/**
 * 模型加载状态
 */
export type ModelLoadStatus = 'idle' | 'loading' | 'loaded' | 'error' | 'cached';

/**
 * 推理模式
 */
export type InferenceMode = 'frontend' | 'backend' | 'hybrid';

/**
 * 模型配置接口
 */
export interface ModelConfig {
  /** 模型唯一标识 */
  id: string;
  /** 模型类型 */
  type: ModelType;
  /** 模型名称 */
  name: string;
  /** 模型版本 */
  version: string;
  /** 模型文件 URL */
  modelUrl?: string;
  /** 权重文件 URL */
  weightsUrl?: string;
  /** 模型大小（字节） */
  size: number;
  /** 输入维度 */
  inputShape: number[];
  /** 输出维度 */
  outputShape: number[];
  /** 是否支持 Web Worker */
  supportsWorker: boolean;
  /** 缓存策略 */
  cacheStrategy: 'indexeddb' | 'memory' | 'none';
  /** 缓存过期时间（毫秒） */
  cacheExpiry?: number;
  /** 优先推理模式 */
  preferredMode: InferenceMode;
  /** 后端 API 端点（用于后端推理） */
  backendEndpoint?: string;
  /** 模型元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 模型加载进度
 */
export interface ModelLoadProgress {
  /** 模型 ID */
  modelId: string;
  /** 当前阶段 */
  stage: 'downloading' | 'parsing' | 'initializing' | 'warming_up' | 'ready';
  /** 进度百分比 (0-100) */
  progress: number;
  /** 已加载字节数 */
  loadedBytes: number;
  /** 总字节数 */
  totalBytes: number;
  /** 错误信息（如果有） */
  error?: string;
  /** 时间戳 */
  timestamp: number;
}

/**
 * 模型加载结果
 */
export interface ModelLoadResult {
  /** 是否成功 */
  success: boolean;
  /** 模型 ID */
  modelId: string;
  /** 加载耗时（毫秒） */
  loadTime: number;
  /** 是否来自缓存 */
  fromCache: boolean;
  /** 错误信息 */
  error?: string;
}

// ==================== 音频分析类型 ====================

/**
 * 音频分析选项
 */
export interface AudioAnalysisOptions {
  /** 采样率 */
  sampleRate?: number;
  /** 是否使用 FFT 分析 */
  useFFT?: boolean;
  /** 是否使用 YAMNet 模型 */
  useYAMNet?: boolean;
  /** 推理模式 */
  inferenceMode?: InferenceMode;
  /** 是否返回中间结果 */
  returnIntermediate?: boolean;
  /** 超时时间（毫秒） */
  timeout?: number;
}

/**
 * FFT 分析结果
 */
export interface FFTAnalysisResult {
  /** 频谱数据 */
  spectrum: Float32Array;
  /** 频率分辨率 */
  frequencyResolution: number;
  /** 主频率 */
  dominantFrequency: number;
  /** 频谱质心 */
  spectralCentroid: number;
  /** 频谱滚降点 */
  spectralRolloff: number;
  /** 频谱通量 */
  spectralFlux: number;
  /** 均方根能量 */
  rmsEnergy: number;
  /** 过零率 */
  zeroCrossingRate: number;
}

/**
 * 音频特征向量
 */
export interface AudioFeatures {
  /** MFCC 特征 */
  mfcc?: Float32Array;
  /** 梅尔频谱 */
  melSpectrogram?: Float32Array;
  /** 色度特征 */
  chroma?: Float32Array;
  /** YAMNet embedding */
  yamnetEmbedding?: Float32Array;
}

/**
 * 音频分析结果
 */
export interface AudioAnalysisResult {
  /** 分析 ID */
  id: string;
  /** 时间戳 */
  timestamp: number;
  /** 处理耗时（毫秒） */
  processingTime: number;
  /** 使用的推理模式 */
  inferenceMode: InferenceMode;
  /** FFT 分析结果 */
  fftResult?: FFTAnalysisResult;
  /** 音频特征 */
  features?: AudioFeatures;
  /** 分类结果 */
  classification?: AudioClassificationResult;
  /** 情感分析结果 */
  emotion?: AudioEmotionResult;
  /** 置信度 */
  confidence: number;
  /** 是否成功 */
  success: boolean;
  /** 错误信息 */
  error?: string;
}

/**
 * 音频分类结果
 */
export interface AudioClassificationResult {
  /** 预测类别 */
  predictedClass: string;
  /** 类别概率分布 */
  probabilities: Record<string, number>;
  /** Top-K 预测 */
  topPredictions: Array<{
    label: string;
    probability: number;
  }>;
}

/**
 * 音频情感分析结果
 */
export interface AudioEmotionResult {
  /** 主要情感 */
  primaryEmotion: string;
  /** 情感强度 (0-1) */
  intensity: number;
  /** 情感概率分布 */
  emotionDistribution: Record<string, number>;
  /** 唤起度 (0-1) */
  arousal: number;
  /** 效价 (0-1) */
  valence: number;
}

// ==================== 图像分析类型 ====================

/**
 * 图像分析选项
 */
export interface ImageAnalysisOptions {
  /** 目标宽度 */
  targetWidth?: number;
  /** 目标高度 */
  targetHeight?: number;
  /** 是否使用 MobileNetV3 */
  useMobileNet?: boolean;
  /** 推理模式 */
  inferenceMode?: InferenceMode;
  /** 是否返回特征向量 */
  returnFeatures?: boolean;
  /** 超时时间（毫秒） */
  timeout?: number;
}

/**
 * 图像颜色分析结果
 */
export interface ImageColorAnalysis {
  /** 主色调 */
  dominantColors: Array<{
    hex: string;
    rgb: [number, number, number];
    percentage: number;
  }>;
  /** 平均亮度 */
  averageBrightness: number;
  /** 对比度 */
  contrast: number;
  /** 饱和度 */
  saturation: number;
  /** 色温 */
  colorTemperature: number;
}

/**
 * 图像边缘检测结果
 */
export interface ImageEdgeAnalysis {
  /** 边缘密度 */
  edgeDensity: number;
  /** 边缘方向直方图 */
  edgeDirectionHistogram: number[];
  /** 边缘强度 */
  edgeStrength: number;
}

/**
 * 图像纹理分析结果
 */
export interface ImageTextureAnalysis {
  /** 纹理复杂度 */
  complexity: number;
  /** 纹理方向性 */
  directionality: number;
  /** 纹理粗糙度 */
  coarseness: number;
  /** 对比度 */
  contrast: number;
}

/**
 * 图像特征向量
 */
export interface ImageFeatures {
  /** MobileNet embedding */
  mobilenetEmbedding?: Float32Array;
  /** HOG 特征 */
  hogFeatures?: Float32Array;
  /** 颜色直方图 */
  colorHistogram?: Float32Array;
}

/**
 * 图像分析结果
 */
export interface ImageAnalysisResult {
  /** 分析 ID */
  id: string;
  /** 时间戳 */
  timestamp: number;
  /** 处理耗时（毫秒） */
  processingTime: number;
  /** 使用的推理模式 */
  inferenceMode: InferenceMode;
  /** 颜色分析 */
  colorAnalysis?: ImageColorAnalysis;
  /** 边缘检测 */
  edgeAnalysis?: ImageEdgeAnalysis;
  /** 纹理分析 */
  textureAnalysis?: ImageTextureAnalysis;
  /** 图像特征 */
  features?: ImageFeatures;
  /** 分类结果 */
  classification?: ImageClassificationResult;
  /** 目标检测结果 */
  objectDetection?: ImageObjectDetection;
  /** 置信度 */
  confidence: number;
  /** 是否成功 */
  success: boolean;
  /** 错误信息 */
  error?: string;
}

/**
 * 图像分类结果
 */
export interface ImageClassificationResult {
  /** 预测类别 */
  predictedClass: string;
  /** 类别概率分布 */
  probabilities: Record<string, number>;
  /** Top-K 预测 */
  topPredictions: Array<{
    label: string;
    probability: number;
  }>;
}

/**
 * 图像目标检测结果
 */
export interface ImageObjectDetection {
  /** 检测到的对象 */
  objects: Array<{
    label: string;
    confidence: number;
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  /** 检测数量 */
  count: number;
}

// ==================== 多模态融合类型 ====================

/**
 * 多模态融合选项
 */
export interface MultimodalFusionOptions {
  /** 融合策略 */
  fusionStrategy?: 'early' | 'late' | 'cross_attention' | 'hierarchical';
  /** 音频权重 (0-1) */
  audioWeight?: number;
  /** 图像权重 (0-1) */
  imageWeight?: number;
  /** 是否启用冲突检测 */
  enableConflictDetection?: boolean;
  /** 冲突解决策略 */
  conflictResolution?: 'weighted' | 'confidence' | 'hierarchical' | 'reject';
  /** 置信度阈值 */
  confidenceThreshold?: number;
}

/**
 * 模态特征
 */
export interface ModalityFeatures {
  /** 音频特征 */
  audio?: AudioFeatures;
  /** 图像特征 */
  image?: ImageFeatures;
  /** 特征维度 */
  dimensions: {
    audio?: number;
    image?: number;
  };
}

/**
 * 跨模态注意力权重
 */
export interface CrossModalAttention {
  /** 音频到图像的注意力 */
  audioToImage: Float32Array;
  /** 图像到音频的注意力 */
  imageToAudio: Float32Array;
  /** 融合权重 */
  fusionWeights: Float32Array;
}

/**
 * 模态冲突信息
 */
export interface ModalityConflict {
  /** 是否存在冲突 */
  hasConflict: boolean;
  /** 冲突类型 */
  conflictType: 'prediction' | 'confidence' | 'feature' | 'none';
  /** 冲突描述 */
  description: string;
  /** 冲突严重程度 (0-1) */
  severity: number;
  /** 解决建议 */
  resolution: string;
}

/**
 * 多模态融合结果
 */
export interface MultimodalFusionResult {
  /** 结果 ID */
  id: string;
  /** 时间戳 */
  timestamp: number;
  /** 处理耗时（毫秒） */
  processingTime: number;
  /** 融合策略 */
  fusionStrategy: string;
  /** 音频分析结果 */
  audioResult?: AudioAnalysisResult;
  /** 图像分析结果 */
  imageResult?: ImageAnalysisResult;
  /** 融合特征向量 */
  fusedFeatures?: Float32Array;
  /** 跨模态注意力 */
  crossAttention?: CrossModalAttention;
  /** 冲突检测结果 */
  conflictDetection?: ModalityConflict;
  /** 最终预测 */
  finalPrediction: {
    label: string;
    confidence: number;
    probabilities: Record<string, number>;
  };
  /** 模态贡献度 */
  modalityContribution: {
    audio: number;
    image: number;
  };
  /** 是否成功 */
  success: boolean;
  /** 错误信息 */
  error?: string;
}

// ==================== 缓存类型 ====================

/**
 * 缓存条目
 */
export interface CacheEntry<T = unknown> {
  /** 缓存键 */
  key: string;
  /** 缓存值 */
  value: T;
  /** 创建时间 */
  createdAt: number;
  /** 过期时间 */
  expiresAt?: number;
  /** 模型版本 */
  version: string;
  /** 缓存大小（字节） */
  size: number;
}

/**
 * 缓存统计信息
 */
export interface CacheStats {
  /** 总条目数 */
  totalEntries: number;
  /** 总大小（字节） */
  totalSize: number;
  /** 命中次数 */
  hits: number;
  /** 未命中次数 */
  misses: number;
  /** 命中率 */
  hitRate: number;
}

// ==================== Web Worker 类型 ====================

/**
 * Worker 消息类型
 */
export type WorkerMessageType = 
  | 'init'
  | 'load_model'
  | 'infer'
  | 'unload'
  | 'status'
  | 'error';

/**
 * Worker 请求消息
 */
export interface WorkerRequestMessage<T = unknown> {
  /** 消息 ID */
  id: string;
  /** 消息类型 */
  type: WorkerMessageType;
  /** 请求数据 */
  data: T;
  /** 时间戳 */
  timestamp: number;
}

/**
 * Worker 响应消息
 */
export interface WorkerResponseMessage<T = unknown> {
  /** 对应请求 ID */
  requestId: string;
  /** 是否成功 */
  success: boolean;
  /** 响应数据 */
  data?: T;
  /** 错误信息 */
  error?: string;
  /** 处理耗时（毫秒） */
  processingTime: number;
}

// ==================== 服务状态类型 ====================

/**
 * AI 服务状态
 */
export interface AIServiceStatus {
  /** 服务名称 */
  serviceName: string;
  /** 是否已初始化 */
  initialized: boolean;
  /** 已加载模型 */
  loadedModels: string[];
  /** 缓存统计 */
  cacheStats: CacheStats;
  /** Worker 状态 */
  workerStatus: 'idle' | 'busy' | 'error' | 'unavailable';
  /** 最后更新时间 */
  lastUpdated: number;
}

/**
 * AI 服务配置
 */
export interface AIServiceConfig {
  /** 是否启用缓存 */
  enableCache: boolean;
  /** 默认推理模式 */
  defaultInferenceMode: InferenceMode;
  /** 默认超时时间（毫秒） */
  defaultTimeout: number;
  /** 是否启用 Web Worker */
  enableWorker: boolean;
  /** 最大并发请求数 */
  maxConcurrentRequests: number;
  /** 后端 API 基础 URL */
  backendBaseUrl?: string;
  /** 调试模式 */
  debug: boolean;
}

// ==================== 默认配置 ====================

/**
 * 默认 AI 服务配置
 */
export const DEFAULT_AI_SERVICE_CONFIG: AIServiceConfig = {
  enableCache: true,
  defaultInferenceMode: 'frontend',
  defaultTimeout: 30000,
  enableWorker: true,
  maxConcurrentRequests: 4,
  debug: false,
};

/**
 * 默认音频分析选项
 */
export const DEFAULT_AUDIO_OPTIONS: AudioAnalysisOptions = {
  sampleRate: 16000,
  useFFT: true,
  useYAMNet: false,
  inferenceMode: 'frontend',
  returnIntermediate: false,
  timeout: 30000,
};

/**
 * 默认图像分析选项
 */
export const DEFAULT_IMAGE_OPTIONS: ImageAnalysisOptions = {
  targetWidth: 224,
  targetHeight: 224,
  useMobileNet: false,
  inferenceMode: 'frontend',
  returnFeatures: false,
  timeout: 30000,
};

/**
 * 默认多模态融合选项
 */
export const DEFAULT_FUSION_OPTIONS: MultimodalFusionOptions = {
  fusionStrategy: 'cross_attention',
  audioWeight: 0.5,
  imageWeight: 0.5,
  enableConflictDetection: true,
  conflictResolution: 'confidence',
  confidenceThreshold: 0.7,
};