/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================
// PawSync Pro 3.0 - 录制与回放服务类型定义
//
// 作者: 带娃的小陈工
// 日期: 2026-06-09
// 描述: 录制、回放、存储相关类型定义
// ============================================

import type { RecordingSession as BaseRecordingSession, RecordingMarker, StreamQuality } from '../../types/monitor';

/**
 * 录制格式类型
 */
export type RecordingFormat = 'webm' | 'mp4';

/**
 * 录制质量等级
 */
export type RecordingQuality = 'low' | 'medium' | 'high' | 'ultra';

/**
 * 录制状态
 */
export type RecordingStatus = 'idle' | 'recording' | 'paused' | 'completed' | 'failed';

/**
 * 回放状态
 */
export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';

/**
 * 存储提供者类型
 */
export type StorageProvider = 'local' | 'indexeddb' | 'tencent-cos' | 'aliyun-oss' | 'aws-s3';

/**
 * 录制配置
 */
export interface RecordingConfig {
  /** 录制格式 */
  format: RecordingFormat;
  /** 录制质量 */
  quality: RecordingQuality;
  /** 视频比特率 (bps) */
  videoBitrate?: number;
  /** 音频比特率 (bps) */
  audioBitrate?: number;
  /** 帧率 */
  frameRate?: number;
  /** 是否启用音频 */
  audioEnabled: boolean;
  /** 最大录制时长 (秒) */
  maxDuration?: number;
  /** 分片大小 (字节)，用于大文件分片上传 */
  chunkSize?: number;
  /** 是否启用循环录制 */
  loopRecording: boolean;
  /** 循环录制最大存储 (MB) */
  maxStorageMB?: number;
  /** 自动删除旧录像的天数 */
  autoDeleteDays?: number;
}

/**
 * 录制会话 - 扩展基础类型
 */
export interface RecordingSession extends BaseRecordingSession {
  /** 录制配置 */
  config: RecordingConfig;
  /** 录制格式 */
  format: RecordingFormat;
  /** 视频轨道信息 */
  videoTrack?: MediaStreamTrack;
  /** 音频轨道信息 */
  audioTrack?: MediaStreamTrack;
  /** 缩略图 URL */
  thumbnailUrl?: string;
  /** 云存储 URL */
  cloudUrl?: string;
  /** 本地存储 ID (IndexedDB) */
  localId?: string;
  /** 是否已上传到云端 */
  isUploadedToCloud: boolean;
  /** 标记列表 */
  markers: TimelineMarker[];
  /** 元数据 */
  metadata: RecordingMetadata;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 录制元数据
 */
export interface RecordingMetadata {
  /** 摄像头名称 */
  cameraName?: string;
  /** 位置 */
  location?: string;
  /** 宠物 ID */
  petId?: string;
  /** 宠物名称 */
  petName?: string;
  /** 录制类型 */
  recordingType: 'manual' | 'motion' | 'scheduled' | 'alert';
  /** 检测到的事件数量 */
  eventCount?: number;
  /** AI 标签 */
  aiTags?: string[];
  /** 备注 */
  notes?: string;
  /** 其他自定义数据 */
  [key: string]: any;
}

/**
 * 时间轴标记
 */
export interface TimelineMarker extends RecordingMarker {
  /** 标记时间戳 (毫秒) */
  timestampMs: number;
  /** 持续时间 (毫秒) */
  duration?: number;
  /** 缩略图 */
  thumbnail?: string;
  /** 关联的事件 ID */
  eventId?: string;
  /** 关联的宠物 ID */
  petId?: string;
  /** 置信度 */
  confidence?: number;
  /** 额外数据 */
  data?: Record<string, any>;
}

/**
 * 回放状态
 */
export interface PlaybackState {
  /** 会话 ID */
  sessionId: string;
  /** 回放状态 */
  status: PlaybackStatus;
  /** 当前时间 (秒) */
  currentTime: number;
  /** 总时长 (秒) */
  duration: number;
  /** 播放速度 */
  speed: PlaybackSpeed;
  /** 音量 */
  volume: number;
  /** 是否静音 */
  muted: boolean;
  /** 缓冲进度 (0-100) */
  bufferedPercent: number;
  /** 加载进度 */
  loadingProgress: number;
  /** 视频元素 */
  videoElement?: HTMLVideoElement;
  /** 媒体源 */
  mediaSource?: MediaSource;
  /** 错误信息 */
  error?: string;
  /** 时间轴标记 */
  markers: TimelineMarker[];
  /** 当前帧数据 */
  currentFrame?: ImageData;
}

/**
 * 播放速度
 */
export type PlaybackSpeed = 0.25 | 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2 | 4;

/**
 * 存储配置
 */
export interface StorageConfig {
  /** 存储提供者 */
  provider: StorageProvider;
  /** 是否启用本地存储 */
  enableLocalStorage: boolean;
  /** 是否启用云存储 */
  enableCloudStorage: boolean;
  /** 本地存储最大空间 (MB) */
  maxLocalStorageMB: number;
  /** 云存储桶名称 */
  cloudBucket?: string;
  /** 云存储区域 */
  cloudRegion?: string;
  /** 云存储访问密钥 */
  cloudAccessKey?: string;
  /** 云存储密钥 */
  cloudSecretKey?: string;
  /** 自动上传到云端 */
  autoUploadToCloud: boolean;
  /** 自动删除策略天数 */
  autoDeleteDays: number;
  /** 压缩质量 (0-1) */
  compressionQuality: number;
}

/**
 * 存储统计信息
 */
export interface StorageStats {
  /** 本地已用空间 (字节) */
  localUsed: number;
  /** 本地总空间 (字节) */
  localTotal: number;
  /** 云端已用空间 (字节) */
  cloudUsed: number;
  /** 云端总空间 (字节) */
  cloudTotal: number;
  /** 录像文件数量 */
  recordingCount: number;
  /** 总录制时长 (秒) */
  totalDuration: number;
  /** 最旧录像时间 */
  oldestRecording?: string;
  /** 最新录像时间 */
  newestRecording?: string;
  /** 存储使用百分比 */
  usagePercent: number;
}

/**
 * 存储结果
 */
export interface StorageResult {
  /** 是否成功 */
  success: boolean;
  /** 本地存储 ID */
  localId?: string;
  /** 云端 URL */
  cloudUrl?: string;
  /** 文件大小 */
  size: number;
  /** 错误信息 */
  error?: string;
}

/**
 * 云上传结果
 */
export interface CloudUploadResult {
  /** 是否成功 */
  success: boolean;
  /** 云端 URL */
  url?: string;
  /** 云端文件 ID */
  fileId?: string;
  /** 上传耗时 (毫秒) */
  uploadTime?: number;
  /** 错误信息 */
  error?: string;
}

/**
 * 上传进度回调
 */
export interface UploadProgress {
  /** 上传 ID */
  uploadId: string;
  /** 进度 (0-100) */
  progress: number;
  /** 状态 */
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  /** 已上传字节 */
  uploadedBytes: number;
  /** 总字节 */
  totalBytes: number;
  /** 速度 (字节/秒) */
  speed?: number;
  /** 错误信息 */
  error?: string;
}

/**
 * 录制事件
 */
export interface RecordingEvent {
  /** 事件类型 */
  type: 'started' | 'stopped' | 'paused' | 'resumed' | 'error' | 'marker_added' | 'chunk_saved';
  /** 会话 ID */
  sessionId: string;
  /** 时间戳 */
  timestamp: string;
  /** 事件数据 */
  data?: any;
}

/**
 * 回放事件
 */
export interface PlaybackEvent {
  /** 事件类型 */
  type: 'loaded' | 'play' | 'pause' | 'seek' | 'speed_change' | 'ended' | 'error' | 'time_update';
  /** 会话 ID */
  sessionId: string;
  /** 时间戳 */
  timestamp: string;
  /** 事件数据 */
  data?: any;
}

/**
 * IndexedDB 存储记录
 */
export interface IndexedDBRecordingRecord {
  /** 主键 */
  id: string;
  /** 会话数据 */
  session: RecordingSession;
  /** 视频 Blob 数据 */
  videoBlob?: Blob;
  /** 缩略图 Blob */
  thumbnailBlob?: Blob;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 是否已同步到云端 */
  syncedToCloud: boolean;
}

/**
 * HLS 分片信息
 */
export interface HLSSegment {
  /** 分片 URL */
  url: string;
  /** 时长 (秒) */
  duration: number;
  /** 开始时间 */
  startTime: number;
  /** 结束时间 */
  endTime: number;
  /** 是否已加载 */
  loaded: boolean;
}

/**
 * HLS 播放列表
 */
export interface HLSPlaylist {
  /** 播放列表类型 */
  type: 'live' | 'vod';
  /** 目标时长 */
  targetDuration: number;
  /** 分片列表 */
  segments: HLSSegment[];
  /** 总时长 */
  totalDuration: number;
}

/**
 * 关键帧信息
 */
export interface KeyFrame {
  /** 时间戳 (秒) */
  timestamp: number;
  /** 帧类型 */
  type: 'I' | 'P' | 'B';
  /** 是否可跳转 */
  seekable: boolean;
  /** 缩略图 */
  thumbnail?: string;
}

/**
 * 默认录制配置
 */
export const DEFAULT_RECORDING_CONFIG: RecordingConfig = {
  format: 'webm',
  quality: 'high',
  videoBitrate: 2500000,
  audioBitrate: 128000,
  frameRate: 30,
  audioEnabled: true,
  maxDuration: 600, // 10分钟
  loopRecording: true,
  maxStorageMB: 1024, // 1GB
  autoDeleteDays: 7,
};

/**
 * 默认存储配置
 */
export const DEFAULT_STORAGE_CONFIG: StorageConfig = {
  provider: 'indexeddb',
  enableLocalStorage: true,
  enableCloudStorage: false,
  maxLocalStorageMB: 2048, // 2GB
  autoUploadToCloud: false,
  autoDeleteDays: 7,
  compressionQuality: 0.8,
};

/**
 * 质量配置映射
 */
export const QUALITY_CONFIG_MAP: Record<RecordingQuality, {
  videoBitrate: number;
  audioBitrate: number;
  frameRate: number;
  resolution: { width: number; height: number };
}> = {
  low: {
    videoBitrate: 500000,
    audioBitrate: 64000,
    frameRate: 15,
    resolution: { width: 640, height: 480 },
  },
  medium: {
    videoBitrate: 1500000,
    audioBitrate: 96000,
    frameRate: 24,
    resolution: { width: 1280, height: 720 },
  },
  high: {
    videoBitrate: 2500000,
    audioBitrate: 128000,
    frameRate: 30,
    resolution: { width: 1920, height: 1080 },
  },
  ultra: {
    videoBitrate: 5000000,
    audioBitrate: 192000,
    frameRate: 60,
    resolution: { width: 2560, height: 1440 },
  },
};

/**
 * 播放速度选项
 */
export const PLAYBACK_SPEED_OPTIONS: PlaybackSpeed[] = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4];

/**
 * 录制格式 MIME 类型映射
 */
export const RECORDING_MIME_TYPES: Record<RecordingFormat, string[]> = {
  webm: ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'],
  mp4: ['video/mp4;codecs=h264,aac', 'video/mp4'],
};