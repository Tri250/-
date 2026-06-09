// ============================================
// PawSync Pro 3.0 - 录制与回放服务统一导出
//
// 作者: 带娃的小陈工
// 日期: 2026-06-09
// 描述: 录制、回放、存储服务统一入口
// ============================================

// 导出类型定义
export type {
  RecordingFormat,
  RecordingQuality,
  RecordingStatus,
  PlaybackStatus,
  StorageProvider,
  RecordingConfig,
  RecordingSession,
  RecordingMetadata,
  TimelineMarker,
  PlaybackState,
  PlaybackSpeed,
  StorageConfig,
  StorageStats,
  StorageResult,
  CloudUploadResult,
  UploadProgress,
  RecordingEvent,
  PlaybackEvent,
  IndexedDBRecordingRecord,
  HLSSegment,
  HLSPlaylist,
  KeyFrame,
} from './types';

// 导出常量和默认配置
export {
  DEFAULT_RECORDING_CONFIG,
  DEFAULT_STORAGE_CONFIG,
  QUALITY_CONFIG_MAP,
  PLAYBACK_SPEED_OPTIONS,
  RECORDING_MIME_TYPES,
} from './types';

// 导出存储服务
export { StorageService, storageService } from './storageService';

// 导出录制服务
export { RecordingService, recordingService } from './recordingService';

// 导出回放服务
export { PlaybackService, playbackService } from './playbackService';

// 导出便捷方法
/**
 * 快速开始录制
 * @param cameraId 摄像头 ID
 * @param stream 媒体流
 * @param config 录制配置（可选）
 * @returns 录制会话
 */
export async function quickStartRecording(
  cameraId: string,
  stream: MediaStream,
  config?: Partial<import('./types').RecordingConfig>
): Promise<import('./types').RecordingSession> {
  const { recordingService } = await import('./recordingService');
  return recordingService.startRecording(cameraId, stream, config);
}

/**
 * 快速加载录像回放
 * @param sessionId 会话 ID
 * @returns 回放状态
 */
export async function quickLoadPlayback(
  sessionId: string
): Promise<import('./types').PlaybackState> {
  const { playbackService } = await import('./playbackService');
  return playbackService.loadRecording(sessionId);
}

/**
 * 获取存储统计
 * @returns 存储统计信息
 */
export async function getStorageStats(): Promise<import('./types').StorageStats> {
  const { storageService } = await import('./storageService');
  return storageService.getStorageStats();
}

/**
 * 检查浏览器录制支持
 * @returns 支持信息
 */
export function checkRecordingSupport(): {
  mediaRecorder: boolean;
  indexedDB: boolean;
  webm: boolean;
  mp4: boolean;
} {
  return {
    mediaRecorder: !!window.MediaRecorder,
    indexedDB: !!window.indexedDB,
    webm: window.MediaRecorder ? MediaRecorder.isTypeSupported('video/webm') : false,
    mp4: window.MediaRecorder ? MediaRecorder.isTypeSupported('video/mp4') : false,
  };
}