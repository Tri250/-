// ============================================
// PawSync Pro 3.0 - Types Index
//
// 作者: 带娃的小陈工
// 日期: 2026-06-10
// 描述: 所有类型定义统一导出入口
// ============================================

// ==================== 新架构类型 ====================

// AI 模型服务类型（从 services 目录导入）
export type {
  ModelType,
  ModelLoadStatus,
  InferenceMode,
  ModelConfig,
  ModelLoadProgress,
  ModelLoadResult,
  AudioAnalysisOptions,
  AudioAnalysisResult,
  ImageAnalysisOptions,
  ImageAnalysisResult,
  MultimodalFusionOptions,
  MultimodalFusionResult,
} from '../../services/ai/types';

// 流媒体服务类型
export type {
  StreamProtocol,
  StreamState,
  QualityLevel,
  ConnectionQuality,
  StreamHealth,
  NetworkStats,
  VideoStats,
  AudioStats,
  WebRTCConfig,
  RtspConfig,
  HlsConfig,
  AdaptiveBitrateConfig,
  StreamConfig,
} from '../../services/streaming/types';

// AI 检测服务类型
export type {
  DetectionMode,
  PetDetection,
  BehaviorType,
  BehaviorEvent,
  SoundEvent,
  EnvironmentData,
  EnvironmentAnomaly,
  AggregatedEvent,
  DetectionConfig,
} from '../../services/detection/types';

// 录制服务类型
export type {
  RecordingFormat,
  RecordingQuality,
  RecordingStatus,
  RecordingSession,
  RecordingConfig,
  PlaybackState,
  StorageStats,
  TimelineMarker,
} from '../../services/recording/types';

// 反馈服务类型（在 types/feedback.ts 中）
export type {
  FeedbackRating,
  FeedbackStatus,
  Feedback,
  FeedbackHistoryQuery,
  FeedbackTrendAnalysis,
  FeedbackSummary,
} from '../feedback';

// ==================== 原有类型 ====================

// 宠物类型
export * from '../pet';

// 健康记录类型
export * from '../health-record';

// AI 咨询类型
export * from '../ai-consultation';

// 健康手册类型
export * from '../health-manual';

// 提醒类型
export * from '../reminder';

// 可视化类型
export * from '../visualization';

// 摄像头类型
export {
  type CameraDevice,
  type CameraBrand,
  type CameraCapability,
  type CameraSettings,
  type ConnectionProtocol,
  type StreamQuality,
  type StreamQualityOption,
} from '../camera';

// 音频类型
export * from '../audio';

// 面部表情类型
export * from '../face';

// 情绪类型
export * from '../emotion';

// 监控类型
export * from '../monitor';

// 亲密关系类型
export * from '../bond';

// 推送通知类型
export * from '../push';

// 云存储类型
export * from '../cloud';

// 实时通信类型
export * from '../rtc';

// ==================== 类型别名 ====================

/**
 * 服务初始化结果类型
 */
export interface ServiceInitResult {
  ai: {
    audio: boolean;
    image: boolean;
    fusion: boolean;
  };
  detection: boolean;
  streaming: boolean;
  recording: boolean;
  feedback: boolean;
}

/**
 * 服务状态类型
 */
export interface ServiceStatus {
  name: string;
  initialized: boolean;
  healthy: boolean;
  lastCheck: string;
  error?: string;
}