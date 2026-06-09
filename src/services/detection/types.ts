/**
 * AI 智能事件检测服务类型定义
 * 支持 YOLOv8/YAMNet 模型
 * 与现有 monitor.ts 类型兼容
 */

import type { SmartEvent, EventType, EventSeverity } from '../../types/monitor';

// 重新导出 EventSeverity 以供其他模块使用
export type { EventSeverity } from '../../types/monitor';

// ==================== 基础类型 ====================

/**
 * 检测模式
 */
export type DetectionMode = 'realtime' | 'batch';

/**
 * 推理模式
 */
export type InferenceMode = 'frontend' | 'backend' | 'hybrid';

/**
 * AI 模型类型
 */
export type AIModelType = 'yolov8' | 'yamnet' | 'behavior' | 'custom';

/**
 * 模型加载状态
 */
export type ModelLoadStatus = 'idle' | 'loading' | 'loaded' | 'error' | 'cached';

// ==================== 宠物检测类型 ====================

/**
 * 边界框
 */
export interface BoundingBox {
  /** X 坐标 */
  x: number;
  /** Y 坐标 */
  y: number;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
}

/**
 * 关键点
 */
export interface KeyPoint {
  /** 关键点名称 */
  name: string;
  /** X 坐标 */
  x: number;
  /** Y 坐标 */
  y: number;
  /** 置信度 */
  confidence: number;
  /** 是否可见 */
  visible: boolean;
}

/**
 * 宠物类型
 */
export type PetType = 'cat' | 'dog' | 'bird' | 'rabbit' | 'hamster' | 'other';

/**
 * 宠物检测配置
 */
export interface PetDetectionConfig {
  /** 检测置信度阈值 */
  confidenceThreshold: number;
  /** 非极大值抑制阈值 */
  nmsThreshold: number;
  /** 最大检测数量 */
  maxDetections: number;
  /** 是否启用关键点检测 */
  enableKeyPoints: boolean;
  /** 是否启用追踪 */
  enableTracking: boolean;
  /** 追踪最大丢失帧数 */
  trackingMaxLostFrames: number;
  /** 推理模式 */
  inferenceMode: InferenceMode;
}

/**
 * 宠物检测结果
 */
export interface PetDetection {
  /** 检测 ID */
  id: string;
  /** 摄像头 ID */
  cameraId: string;
  /** 时间戳 */
  timestamp: string;
  /** 边界框 */
  boundingBox: BoundingBox;
  /** 检测置信度 */
  confidence: number;
  /** 宠物类型 */
  petType: PetType;
  /** 宠物 ID（如果已识别） */
  petId?: string;
  /** 关键点 */
  keyPoints?: KeyPoint[];
  /** 追踪 ID */
  trackId?: number;
  /** 当前行为 */
  behavior?: string;
  /** 当前情绪 */
  emotion?: string;
  /** 附加元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 追踪结果
 */
export interface TrackingResult {
  /** 追踪 ID */
  trackId: number;
  /** 宠物 ID */
  petId?: string;
  /** 轨迹点 */
  trajectory: Array<{
    x: number;
    y: number;
    timestamp: string;
  }>;
  /** 追踪状态 */
  status: 'active' | 'lost' | 'expired';
  /** 总追踪时间（秒） */
  duration: number;
  /** 平均置信度 */
  avgConfidence: number;
}

/**
 * 热点图数据
 */
export interface HeatmapData {
  /** 摄像头 ID */
  cameraId: string;
  /** 时间范围 */
  timeRange: {
    start: string;
    end: string;
  };
  /** 网格分辨率 */
  resolution: {
    width: number;
    height: number;
  };
  /** 热点值矩阵 (0-1) */
  values: number[][];
  /** 热点区域 */
  hotspots: Array<{
    x: number;
    y: number;
    radius: number;
    intensity: number;
  }>;
}

// ==================== 行为分析类型 ====================

/**
 * 行为类型
 */
export type BehaviorType =
  | 'sleeping'      // 睡觉
  | 'playing'       // 玩耍
  | 'eating'        // 进食
  | 'drinking'      // 喝水
  | 'walking'       // 行走
  | 'running'       // 奔跑
  | 'jumping'       // 跳跃
  | 'scratching'    // 抓挠
  | 'grooming'      // 自我清洁
  | 'resting'       // 休息
  | 'digging'       // 挖掘
  | 'climbing'      // 攀爬
  | 'abnormal';     // 异常行为

/**
 * 行为事件
 */
export interface BehaviorEvent {
  /** 事件 ID */
  id: string;
  /** 摄像头 ID */
  cameraId: string;
  /** 时间戳 */
  timestamp: string;
  /** 宠物 ID */
  petId: string;
  /** 行为类型 */
  behavior: BehaviorType;
  /** 置信度 */
  confidence: number;
  /** 持续时间（秒） */
  duration?: number;
  /** 缩略图 URL */
  thumbnailUrl?: string;
  /** 行为描述 */
  description?: string;
  /** 关键帧 */
  keyFrames?: Array<{
    timestamp: string;
    boundingBox: BoundingBox;
    imageUrl?: string;
  }>;
  /** 附加元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 行为趋势
 */
export interface BehaviorTrend {
  /** 宠物 ID */
  petId: string;
  /** 时间范围 */
  period: {
    start: string;
    end: string;
  };
  /** 行为统计 */
  statistics: Record<BehaviorType, {
    /** 总次数 */
    count: number;
    /** 总时长（秒） */
    totalDuration: number;
    /** 平均时长（秒） */
    avgDuration: number;
    /** 频率（次/小时） */
    frequency: number;
  }>;
  /** 时间线数据 */
  timeline: Array<{
    timestamp: string;
    behavior: BehaviorType;
    duration: number;
  }>;
  /** 异常行为标记 */
  anomalies: Array<{
    timestamp: string;
    behavior: BehaviorType;
    reason: string;
  }>;
}

/**
 * 行为分析配置
 */
export interface BehaviorAnalysisConfig {
  /** 分析窗口大小（帧数） */
  windowSize: number;
  /** 行为置信度阈值 */
  confidenceThreshold: number;
  /** 最小行为持续时间（秒） */
  minBehaviorDuration: number;
  /** 是否启用异常检测 */
  enableAnomalyDetection: boolean;
  /** 异常检测敏感度 */
  anomalySensitivity: 'low' | 'medium' | 'high';
  /** 推理模式 */
  inferenceMode: InferenceMode;
}

// ==================== 声音检测类型 ====================

/**
 * 宠物声音类型
 */
export type PetSoundType =
  | 'barking'      // 狗叫
  | 'meowing'      // 猫叫
  | 'whining'      // 呜咽
  | 'purring'      // 呼噜
  | 'howling'      // 嚎叫
  | 'growling'     // 咆哮
  | 'chirping'     // 鸟鸣
  | 'squeaking';   // 吱吱叫

/**
 * 环境声音类型
 */
export type EnvironmentSoundType =
  | 'glass_breaking'  // 玻璃破碎
  | 'door_banging'    // 敲门
  | 'alarm'           // 警报
  | 'doorbell'        // 门铃
  | 'thunder'         // 雷声
  | 'fireworks'       // 烟花
  | 'siren'           // 警笛
  | 'smoke_alarm'     // 烟雾报警
  | 'unknown';        // 未知

/**
 * 声音事件
 */
export interface SoundEvent {
  /** 事件 ID */
  id: string;
  /** 摄像头 ID */
  cameraId: string;
  /** 时间戳 */
  timestamp: string;
  /** 声音类型 */
  soundType: PetSoundType | EnvironmentSoundType;
  /** 是否为宠物声音 */
  isPetSound: boolean;
  /** 置信度 */
  confidence: number;
  /** 音量级别 (dB) */
  volumeLevel: number;
  /** 持续时间（秒） */
  duration: number;
  /** 音频片段 URL */
  audioClipUrl?: string;
  /** 频谱特征 */
  spectralFeatures?: {
    /** 主频率 */
    dominantFrequency: number;
    /** 频谱质心 */
    spectralCentroid: number;
    /** 频谱带宽 */
    spectralBandwidth: number;
  };
  /** 附加元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 宠物声音分类结果
 */
export interface PetSoundClassification {
  /** 分类 ID */
  id: string;
  /** 时间戳 */
  timestamp: string;
  /** 宠物类型 */
  petType: PetType;
  /** 声音类型 */
  soundType: PetSoundType;
  /** 置信度 */
  confidence: number;
  /** 情绪推断 */
  emotion?: {
    type: string;
    intensity: number;
  };
  /** 所有类别概率 */
  probabilities: Record<PetSoundType, number>;
}

/**
 * 声音检测配置
 */
export interface SoundDetectionConfig {
  /** 采样率 */
  sampleRate: number;
  /** 帧长度 */
  frameLength: number;
  /** 跳跃长度 */
  hopLength: number;
  /** 置信度阈值 */
  confidenceThreshold: number;
  /** 音量阈值 (dB) */
  volumeThreshold: number;
  /** 是否启用环境声音检测 */
  enableEnvironmentDetection: boolean;
  /** 推理模式 */
  inferenceMode: InferenceMode;
}

// ==================== 环境监控类型 ====================

/**
 * 环境数据
 */
export interface EnvironmentData {
  /** 摄像头 ID */
  cameraId: string;
  /** 时间戳 */
  timestamp: string;
  /** 温度 (°C) */
  temperature?: number;
  /** 湿度 (%) */
  humidity?: number;
  /** 噪音级别 (dB) */
  noiseLevel?: number;
  /** 亮度 (0-100) */
  brightness?: number;
  /** 画面变化率 (0-1) */
  frameChangeRate?: number;
  /** 运动强度 (0-1) */
  motionIntensity?: number;
  /** 附加传感器数据 */
  sensors?: Record<string, number>;
}

/**
 * 环境异常类型
 */
export type EnvironmentAnomalyType =
  | 'brightness_drop'      // 亮度骤降
  | 'brightness_spike'      // 亮度骤增
  | 'noise_anomaly'         // 异常噪音
  | 'temperature_high'     // 温度过高
  | 'temperature_low'      // 温度过低
  | 'humidity_high'        // 湿度过高
  | 'humidity_low'         // 湿度过低
  | 'motion_sudden'        // 突然运动
  | 'frame_change_large'   // 画面大幅变化
  | 'camera_blocked'       // 摄像头被遮挡
  | 'camera_moved';        // 摄像头移动

/**
 * 环境异常
 */
export interface EnvironmentAnomaly {
  /** 异常 ID */
  id: string;
  /** 摄像头 ID */
  cameraId: string;
  /** 时间戳 */
  timestamp: string;
  /** 异常类型 */
  type: EnvironmentAnomalyType;
  /** 严重程度 */
  severity: EventSeverity;
  /** 描述 */
  description: string;
  /** 异常值 */
  value: number;
  /** 正常范围 */
  normalRange: {
    min: number;
    max: number;
  };
  /** 持续时间（秒） */
  duration?: number;
  /** 附加元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 环境监控配置
 */
export interface EnvironmentMonitorConfig {
  /** 亮度变化阈值 */
  brightnessChangeThreshold: number;
  /** 噪音阈值 (dB) */
  noiseThreshold: number;
  /** 画面变化阈值 */
  frameChangeThreshold: number;
  /** 温度范围 */
  temperatureRange: {
    min: number;
    max: number;
  };
  /** 湿度范围 */
  humidityRange: {
    min: number;
    max: number;
  };
  /** 检测间隔（毫秒） */
  detectionInterval: number;
  /** 历史数据窗口大小 */
  historyWindowSize: number;
}

// ==================== 事件聚合类型 ====================

/**
 * 聚合事件
 */
export interface AggregatedEvent {
  /** 事件 ID */
  id: string;
  /** 时间戳 */
  timestamp: string;
  /** 事件类型 */
  type: EventType;
  /** 严重程度 */
  severity: EventSeverity;
  /** 标题 */
  title: string;
  /** 描述 */
  description: string;
  /** 摄像头 ID */
  cameraId: string;
  /** 宠物 ID */
  petId?: string;
  /** 原始事件列表 */
  sourceEvents: SmartEvent[];
  /** 多模态融合置信度 */
  confidence: number;
  /** LLM 智能解读 */
  insight?: string;
  /** 建议操作 */
  suggestedActions?: Array<{
    label: string;
    action: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  /** 附加元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 事件优先级
 */
export interface EventPriority {
  /** 事件 ID */
  eventId: string;
  /** 优先级分数 (0-100) */
  score: number;
  /** 优先级等级 */
  level: 'low' | 'medium' | 'high' | 'critical';
  /** 优先级因素 */
  factors: Array<{
    name: string;
    weight: number;
    value: number;
  }>;
}

/**
 * 事件聚合配置
 */
export interface EventAggregatorConfig {
  /** 时间窗口大小（秒） */
  timeWindowSize: number;
  /** 最大事件数量 */
  maxEvents: number;
  /** 是否启用 LLM 解读 */
  enableLLMInsight: boolean;
  /** LLM 解读语言 */
  insightLanguage: string;
  /** 优先级权重 */
  priorityWeights: {
    severity: number;
    recency: number;
    frequency: number;
    confidence: number;
  };
}

// ==================== AI 模型配置 ====================

/**
 * YOLOv8 模型配置
 */
export interface YOLOv8Config {
  /** 模型版本 */
  version: 'n' | 's' | 'm' | 'l' | 'x';
  /** 输入尺寸 */
  inputSize: number;
  /** 置信度阈值 */
  confidenceThreshold: number;
  /** NMS 阈值 */
  nmsThreshold: number;
  /** 后端 API 端点 */
  apiEndpoint: string;
  /** 是否启用 GPU */
  enableGPU: boolean;
  /** 批处理大小 */
  batchSize: number;
}

/**
 * YAMNet 模型配置
 */
export interface YAMNetConfig {
  /** 模型版本 */
  version: string;
  /** 采样率 */
  sampleRate: number;
  /** 帧长度 */
  frameLength: number;
  /** 置信度阈值 */
  confidenceThreshold: number;
  /** 后端 API 端点 */
  apiEndpoint: string;
  /** 是否启用 GPU */
  enableGPU: boolean;
}

/**
 * 行为分析模型配置
 */
export interface BehaviorModelConfig {
  /** 模型类型 */
  type: 'lstm' | 'transformer' | '3d_cnn';
  /** 输入序列长度 */
  sequenceLength: number;
  /** 特征维度 */
  featureDim: number;
  /** 置信度阈值 */
  confidenceThreshold: number;
  /** 后端 API 端点 */
  apiEndpoint: string;
}

/**
 * 检测配置
 */
export interface DetectionConfig {
  /** 检测模式 */
  mode: DetectionMode;
  /** 宠物检测配置 */
  petDetection: PetDetectionConfig;
  /** 行为分析配置 */
  behaviorAnalysis: BehaviorAnalysisConfig;
  /** 声音检测配置 */
  soundDetection: SoundDetectionConfig;
  /** 环境监控配置 */
  environmentMonitor: EnvironmentMonitorConfig;
  /** 事件聚合配置 */
  eventAggregator: EventAggregatorConfig;
  /** YOLOv8 配置 */
  yolov8: YOLOv8Config;
  /** YAMNet 配置 */
  yamnet: YAMNetConfig;
  /** 行为模型配置 */
  behaviorModel: BehaviorModelConfig;
  /** 后端 API 基础 URL */
  backendBaseUrl: string;
  /** 请求超时时间（毫秒） */
  requestTimeout: number;
  /** 是否启用缓存 */
  enableCache: boolean;
  /** 调试模式 */
  debug: boolean;
}

// ==================== 服务状态类型 ====================

/**
 * 检测服务状态
 */
export interface DetectionServiceStatus {
  /** 服务名称 */
  serviceName: string;
  /** 是否已初始化 */
  initialized: boolean;
  /** 模型加载状态 */
  modelStatus: Record<AIModelType, ModelLoadStatus>;
  /** 是否正在检测 */
  isDetecting: boolean;
  /** 当前检测模式 */
  currentMode: DetectionMode;
  /** 最后更新时间 */
  lastUpdated: string;
  /** 错误信息 */
  error?: string;
}

// ==================== 默认配置 ====================

/**
 * 默认宠物检测配置
 */
export const DEFAULT_PET_DETECTION_CONFIG: PetDetectionConfig = {
  confidenceThreshold: 0.5,
  nmsThreshold: 0.45,
  maxDetections: 10,
  enableKeyPoints: true,
  enableTracking: true,
  trackingMaxLostFrames: 30,
  inferenceMode: 'backend',
};

/**
 * 默认行为分析配置
 */
export const DEFAULT_BEHAVIOR_ANALYSIS_CONFIG: BehaviorAnalysisConfig = {
  windowSize: 16,
  confidenceThreshold: 0.6,
  minBehaviorDuration: 1.0,
  enableAnomalyDetection: true,
  anomalySensitivity: 'medium',
  inferenceMode: 'backend',
};

/**
 * 默认声音检测配置
 */
export const DEFAULT_SOUND_DETECTION_CONFIG: SoundDetectionConfig = {
  sampleRate: 16000,
  frameLength: 1024,
  hopLength: 512,
  confidenceThreshold: 0.5,
  volumeThreshold: 30,
  enableEnvironmentDetection: true,
  inferenceMode: 'backend',
};

/**
 * 默认环境监控配置
 */
export const DEFAULT_ENVIRONMENT_MONITOR_CONFIG: EnvironmentMonitorConfig = {
  brightnessChangeThreshold: 0.3,
  noiseThreshold: 70,
  frameChangeThreshold: 0.5,
  temperatureRange: { min: 15, max: 30 },
  humidityRange: { min: 30, max: 70 },
  detectionInterval: 1000,
  historyWindowSize: 60,
};

/**
 * 默认事件聚合配置
 */
export const DEFAULT_EVENT_AGGREGATOR_CONFIG: EventAggregatorConfig = {
  timeWindowSize: 300,
  maxEvents: 100,
  enableLLMInsight: true,
  insightLanguage: 'zh-CN',
  priorityWeights: {
    severity: 0.35,
    recency: 0.25,
    frequency: 0.2,
    confidence: 0.2,
  },
};

/**
 * 默认 YOLOv8 配置
 */
export const DEFAULT_YOLOV8_CONFIG: YOLOv8Config = {
  version: 's',
  inputSize: 640,
  confidenceThreshold: 0.5,
  nmsThreshold: 0.45,
  apiEndpoint: '/api/ai/detect',
  enableGPU: true,
  batchSize: 1,
};

/**
 * 默认 YAMNet 配置
 */
export const DEFAULT_YAMNET_CONFIG: YAMNetConfig = {
  version: '1.0',
  sampleRate: 16000,
  frameLength: 1024,
  confidenceThreshold: 0.5,
  apiEndpoint: '/api/ai/sound',
  enableGPU: true,
};

/**
 * 默认行为模型配置
 */
export const DEFAULT_BEHAVIOR_MODEL_CONFIG: BehaviorModelConfig = {
  type: 'transformer',
  sequenceLength: 16,
  featureDim: 256,
  confidenceThreshold: 0.6,
  apiEndpoint: '/api/ai/behavior',
};

/**
 * 默认检测配置
 */
export const DEFAULT_DETECTION_CONFIG: DetectionConfig = {
  mode: 'realtime',
  petDetection: DEFAULT_PET_DETECTION_CONFIG,
  behaviorAnalysis: DEFAULT_BEHAVIOR_ANALYSIS_CONFIG,
  soundDetection: DEFAULT_SOUND_DETECTION_CONFIG,
  environmentMonitor: DEFAULT_ENVIRONMENT_MONITOR_CONFIG,
  eventAggregator: DEFAULT_EVENT_AGGREGATOR_CONFIG,
  yolov8: DEFAULT_YOLOV8_CONFIG,
  yamnet: DEFAULT_YAMNET_CONFIG,
  behaviorModel: DEFAULT_BEHAVIOR_MODEL_CONFIG,
  backendBaseUrl: '/api',
  requestTimeout: 30000,
  enableCache: true,
  debug: false,
};