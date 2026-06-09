// ============================================
// PawSync Pro 3.0 - 录制服务
//
// 作者: 带娃的小陈工
// 日期: 2026-06-09
// 描述: MediaRecorder API 录制实现
// ============================================

import type {
  RecordingSession,
  RecordingConfig,
  RecordingFormat,
  RecordingQuality,
  RecordingStatus,
  RecordingEvent,
  TimelineMarker,
  StorageStats,
} from './types';
import { QUALITY_CONFIG_MAP, RECORDING_MIME_TYPES, DEFAULT_RECORDING_CONFIG } from './types';
import { StorageService, storageService } from './storageService';

/**
 * 录制服务类
 * 使用 MediaRecorder API 实现视频录制
 */
export class RecordingService {
  /** 活动录制会话 */
  private activeSessions: Map<string, {
    session: RecordingSession;
    mediaRecorder: MediaRecorder;
    chunks: Blob[];
    stream: MediaStream;
    startTime: number;
  }> = new Map();

  /** 录制历史记录 */
  private recordingHistory: RecordingSession[] = [];

  /** 存储服务 */
  private storage: StorageService;

  /** 事件回调 */
  private eventCallbacks: Array<(event: RecordingEvent) => void> = [];

  /** 是否已初始化 */
  private initialized: boolean = false;

  /**
   * 构造函数
   */
  constructor(storage?: StorageService) {
    this.storage = storage || storageService;
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // 初始化存储服务
    await this.storage.initialize();

    // 加载历史录制记录
    const records = await this.storage.getAllRecordings();
    this.recordingHistory = records.map(r => r.session);

    this.initialized = true;
    console.log('录制服务初始化完成');
  }

  /**
   * 开始录制
   * @param cameraId 摄像头 ID
   * @param stream 媒体流
   * @param config 录制配置
   * @returns 录制会话
   */
  async startRecording(
    cameraId: string,
    stream: MediaStream,
    config?: Partial<RecordingConfig>
  ): Promise<RecordingSession> {
    await this.initialize();

    // 合并配置
    const finalConfig: RecordingConfig = {
      ...DEFAULT_RECORDING_CONFIG,
      ...config,
    };

    // 检查 MediaRecorder 支持
    if (!window.MediaRecorder) {
      throw new Error('当前浏览器不支持 MediaRecorder API');
    }

    // 获取支持的 MIME 类型
    const mimeType = this.getSupportedMimeType(finalConfig.format);
    if (!mimeType) {
      throw new Error(`不支持 ${finalConfig.format} 格式录制`);
    }

    // 创建录制会话
    const sessionId = `rec-${cameraId}-${Date.now()}`;
    const session: RecordingSession = {
      id: sessionId,
      cameraId,
      startTime: new Date().toISOString(),
      status: 'recording',
      format: finalConfig.format,
      config: finalConfig,
      markers: [],
      metadata: {
        recordingType: 'manual',
      },
      isUploadedToCloud: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 获取质量配置
    const qualityConfig = QUALITY_CONFIG_MAP[finalConfig.quality];

    // 创建 MediaRecorder
    const options: MediaRecorderOptions = {
      mimeType,
      videoBitsPerSecond: finalConfig.videoBitrate || qualityConfig.videoBitrate,
      audioBitsPerSecond: finalConfig.audioBitrate || qualityConfig.audioBitrate,
    };

    try {
      const mediaRecorder = new MediaRecorder(stream, options);

      // 存储数据块
      const chunks: Blob[] = [];

      // 监听数据可用事件
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
          this.emitEvent({
            type: 'chunk_saved',
            sessionId,
            timestamp: new Date().toISOString(),
            data: { chunkSize: event.data.size, totalChunks: chunks.length },
          });
        }
      };

      // 监听停止事件
      mediaRecorder.onstop = async () => {
        await this.handleRecordingStop(sessionId, chunks);
      };

      // 监听错误事件
      mediaRecorder.onerror = (event) => {
        console.error('录制错误:', event);
        this.handleRecordingError(sessionId, '录制过程中发生错误');
      };

      // 开始录制
      // 使用分片模式，每秒保存一次数据
      mediaRecorder.start(1000);

      // 保存会话
      this.activeSessions.set(sessionId, {
        session,
        mediaRecorder,
        chunks,
        stream,
        startTime: Date.now(),
      });

      // 触发事件
      this.emitEvent({
        type: 'started',
        sessionId,
        timestamp: new Date().toISOString(),
        data: { config: finalConfig, mimeType },
      });

      console.log(`开始录制: ${sessionId}, 格式: ${mimeType}`);
      return session;
    } catch (error) {
      console.error('创建 MediaRecorder 失败:', error);
      throw new Error('无法创建录制器');
    }
  }

  /**
   * 停止录制
   * @param sessionId 会话 ID
   * @returns 录制会话
   */
  async stopRecording(sessionId: string): Promise<RecordingSession> {
    const activeSession = this.activeSessions.get(sessionId);
    if (!activeSession) {
      throw new Error(`录制会话不存在: ${sessionId}`);
    }

    const { mediaRecorder, session } = activeSession;

    // 停止录制
    if (mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }

    // 更新会话状态
    session.status = 'completed';
    session.endTime = new Date().toISOString();
    session.duration = Math.floor((Date.now() - activeSession.startTime) / 1000);

    // 触发事件
    this.emitEvent({
      type: 'stopped',
      sessionId,
      timestamp: new Date().toISOString(),
      data: { duration: session.duration },
    });

    // 等待数据处理完成
    // MediaRecorder.onstop 会处理数据保存

    return session;
  }

  /**
   * 暂停录制
   * @param sessionId 会话 ID
   */
  async pauseRecording(sessionId: string): Promise<void> {
    const activeSession = this.activeSessions.get(sessionId);
    if (!activeSession) {
      throw new Error(`录制会话不存在: ${sessionId}`);
    }

    const { mediaRecorder, session } = activeSession;

    if (mediaRecorder.state === 'recording') {
      mediaRecorder.pause();
      session.status = 'paused';

      this.emitEvent({
        type: 'paused',
        sessionId,
        timestamp: new Date().toISOString(),
      });

      console.log(`暂停录制: ${sessionId}`);
    }
  }

  /**
   * 恢复录制
   * @param sessionId 会话 ID
   */
  async resumeRecording(sessionId: string): Promise<void> {
    const activeSession = this.activeSessions.get(sessionId);
    if (!activeSession) {
      throw new Error(`录制会话不存在: ${sessionId}`);
    }

    const { mediaRecorder, session } = activeSession;

    if (mediaRecorder.state === 'paused') {
      mediaRecorder.resume();
      session.status = 'recording';

      this.emitEvent({
        type: 'resumed',
        sessionId,
        timestamp: new Date().toISOString(),
      });

      console.log(`恢复录制: ${sessionId}`);
    }
  }

  /**
   * 添加时间轴标记
   * @param sessionId 会话 ID
   * @param marker 标记信息
   */
  async addMarker(sessionId: string, marker: Partial<TimelineMarker>): Promise<TimelineMarker> {
    const activeSession = this.activeSessions.get(sessionId);
    if (!activeSession) {
      throw new Error(`录制会话不存在: ${sessionId}`);
    }

    const fullMarker: TimelineMarker = {
      id: `marker-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timestampMs: Date.now() - activeSession.startTime,
      type: marker.type || 'manual',
      label: marker.label || '标记点',
      ...marker,
    };

    activeSession.session.markers.push(fullMarker);

    this.emitEvent({
      type: 'marker_added',
      sessionId,
      timestamp: new Date().toISOString(),
      data: { marker: fullMarker },
    });

    return fullMarker;
  }

  /**
   * 获取录制历史
   * @param cameraId 摄像头 ID（可选）
   * @returns 录制会话列表
   */
  async getRecordingHistory(cameraId?: string): Promise<RecordingSession[]> {
    await this.initialize();

    if (cameraId) {
      return this.recordingHistory.filter(s => s.cameraId === cameraId);
    }

    return [...this.recordingHistory];
  }

  /**
   * 删除录制
   * @param sessionId 会话 ID
   */
  async deleteRecording(sessionId: string): Promise<void> {
    await this.initialize();

    // 从存储中删除
    await this.storage.deleteRecording(sessionId);

    // 从历史记录中移除
    const index = this.recordingHistory.findIndex(s => s.id === sessionId);
    if (index !== -1) {
      this.recordingHistory.splice(index, 1);
    }

    console.log(`删除录制: ${sessionId}`);
  }

  /**
   * 获取存储使用情况
   * @returns 存储统计
   */
  async getStorageUsage(): Promise<StorageStats> {
    await this.initialize();
    return this.storage.getStorageStats();
  }

  /**
   * 获取活动录制会话
   * @param cameraId 摄像头 ID（可选）
   * @returns 活动会话列表
   */
  getActiveSessions(cameraId?: string): RecordingSession[] {
    const sessions: RecordingSession[] = [];

    this.activeSessions.forEach((value) => {
      if (!cameraId || value.session.cameraId === cameraId) {
        sessions.push(value.session);
      }
    });

    return sessions;
  }

  /**
   * 检查是否正在录制
   * @param cameraId 摄像头 ID
   * @returns 是否正在录制
   */
  isRecording(cameraId: string): boolean {
    // 将 Map 转换为数组后检查
    const sessionIds = Array.from(this.activeSessions.keys());
    return sessionIds.some(sessionId => sessionId.startsWith(`rec-${cameraId}`));
  }

  /**
   * 获取支持的 MIME 类型
   * @param format 录制格式
   * @returns 支持的 MIME 类型
   */
  private getSupportedMimeType(format: RecordingFormat): string | null {
    const mimeTypes = RECORDING_MIME_TYPES[format];

    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }

    return null;
  }

  /**
   * 处理录制停止
   * @param sessionId 会话 ID
   * @param chunks 数据块
   */
  private async handleRecordingStop(sessionId: string, chunks: Blob[]): Promise<void> {
    const activeSession = this.activeSessions.get(sessionId);
    if (!activeSession) return;

    const { session, stream } = activeSession;

    // 合并数据块
    const blob = new Blob(chunks, { type: RECORDING_MIME_TYPES[session.format][0] });

    // 更新会话信息
    session.fileSize = blob.size;
    session.fileUrl = URL.createObjectURL(blob);

    // 生成缩略图
    const thumbnail = await this.generateThumbnail(stream);

    // 保存到存储
    const result = await this.storage.saveRecording(blob, session, thumbnail);

    if (result.success) {
      session.localId = result.localId;
      console.log(`录制已保存: ${sessionId}, 大小: ${blob.size} 字节`);
    } else {
      console.error(`保存录制失败: ${result.error}`);
      session.status = 'failed';
    }

    // 添加到历史记录
    this.recordingHistory.unshift(session);

    // 清理活动会话
    this.activeSessions.delete(sessionId);

    // 停止媒体流轨道
    stream.getTracks().forEach(track => track.stop());
  }

  /**
   * 处理录制错误
   * @param sessionId 会话 ID
   * @param error 错误信息
   */
  private handleRecordingError(sessionId: string, error: string): void {
    const activeSession = this.activeSessions.get(sessionId);
    if (!activeSession) return;

    activeSession.session.status = 'failed';

    this.emitEvent({
      type: 'error',
      sessionId,
      timestamp: new Date().toISOString(),
      data: { error },
    });

    // 清理活动会话
    this.activeSessions.delete(sessionId);
  }

  /**
   * 生成缩略图
   * @param stream 媒体流
   * @returns 缩略图 Blob
   */
  private async generateThumbnail(stream: MediaStream): Promise<Blob | undefined> {
    try {
      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) return undefined;

      // 创建视频元素
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;

      // 等待视频加载
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          video.currentTime = 0;
          resolve();
        };
        video.play();
      });

      // 创建 canvas
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 180;

      const ctx = canvas.getContext('2d');
      if (!ctx) return undefined;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 转换为 Blob
      const thumbnailBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (blob) => resolve(blob!),
          'image/jpeg',
          0.8
        );
      });

      // 清理
      video.srcObject = null;

      return thumbnailBlob;
    } catch (error) {
      console.error('生成缩略图失败:', error);
      return undefined;
    }
  }

  /**
   * 触发事件
   * @param event 录制事件
   */
  private emitEvent(event: RecordingEvent): void {
    this.eventCallbacks.forEach(callback => callback(event));
  }

  /**
   * 注册事件回调
   * @param callback 回调函数
   */
  onEvent(callback: (event: RecordingEvent) => void): void {
    this.eventCallbacks.push(callback);
  }

  /**
   * 移除事件回调
   * @param callback 回调函数
   */
  removeEventCallback(callback: (event: RecordingEvent) => void): void {
    const index = this.eventCallbacks.indexOf(callback);
    if (index !== -1) {
      this.eventCallbacks.splice(index, 1);
    }
  }

  /**
   * 检查浏览器支持
   * @returns 支持信息
   */
  checkBrowserSupport(): {
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

  /**
   * 获取推荐的录制格式
   * @returns 推荐格式
   */
  getRecommendedFormat(): RecordingFormat {
    const support = this.checkBrowserSupport();

    // Chrome/Firefox 优先支持 webm
    if (support.webm) {
      return 'webm';
    }

    // Safari 支持 mp4
    if (support.mp4) {
      return 'mp4';
    }

    return 'webm';
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    // 停止所有活动录制
    this.activeSessions.forEach((activeSession, sessionId) => {
      try {
        activeSession.mediaRecorder.stop();
        activeSession.stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.error(`清理录制会话失败: ${sessionId}`, error);
      }
    });

    this.activeSessions.clear();
    this.eventCallbacks = [];
  }
}

// 导出默认实例
export const recordingService = new RecordingService();