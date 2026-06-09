// ============================================
// PawSync Pro 3.0 - 回放服务
//
// 作者: 带娃的小陈工
// 日期: 2026-06-09
// 描述: HLS 回放实现、时间轴控制、播放速度调节
// ============================================

import type {
  PlaybackState,
  PlaybackStatus,
  PlaybackSpeed,
  PlaybackEvent,
  TimelineMarker,
  KeyFrame,
  HLSPlaylist,
  HLSSegment,
  RecordingSession,
} from './types';
import { PLAYBACK_SPEED_OPTIONS } from './types';
import { StorageService, storageService } from './storageService';

/**
 * 回放服务类
 * 实现视频回放、时间轴控制、播放速度调节
 */
export class PlaybackService {
  /** 当前回放状态 */
  private currentPlayback: PlaybackState | null = null;

  /** 存储服务 */
  private storage: StorageService;

  /** 视频元素 */
  private videoElement: HTMLVideoElement | null = null;

  /** 事件回调 */
  private eventCallbacks: Array<(event: PlaybackEvent) => void> = [];

  /** 时间更新回调 */
  private timeUpdateCallbacks: Array<(currentTime: number, duration: number) => void> = [];

  /** 是否已初始化 */
  private initialized: boolean = false;

  /** 关键帧列表 */
  private keyFrames: KeyFrame[] = [];

  /** 缓冲进度 */
  private bufferedPercent: number = 0;

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

    await this.storage.initialize();
    this.initialized = true;
    console.log('回放服务初始化完成');
  }

  /**
   * 加载录像
   * @param sessionId 会话 ID
   * @returns 回放状态
   */
  async loadRecording(sessionId: string): Promise<PlaybackState> {
    await this.initialize();

    // 获取录像记录
    const record = await this.storage.getRecordingRecord(sessionId);
    if (!record) {
      throw new Error(`录像不存在: ${sessionId}`);
    }

    const session = record.session;

    // 创建视频元素
    this.videoElement = this.createVideoElement();

    // 获取录像 URL
    const videoUrl = await this.storage.getRecordingUrl(sessionId);
    if (!videoUrl) {
      throw new Error('无法获取录像 URL');
    }

    // 设置视频源
    this.videoElement.src = videoUrl;

    // 等待视频加载
    await this.waitForVideoLoad();

    // 创建回放状态
    this.currentPlayback = {
      sessionId,
      status: 'paused',
      currentTime: 0,
      duration: session.duration || this.videoElement.duration,
      speed: 1,
      volume: 1,
      muted: false,
      bufferedPercent: 0,
      loadingProgress: 0,
      videoElement: this.videoElement,
      markers: session.markers || [],
    };

    // 设置事件监听
    this.setupVideoEvents();

    // 触发加载事件
    this.emitEvent({
      type: 'loaded',
      sessionId,
      timestamp: new Date().toISOString(),
      data: { duration: this.currentPlayback.duration },
    });

    return this.currentPlayback;
  }

  /**
   * 播放
   */
  async play(): Promise<void> {
    if (!this.currentPlayback || !this.videoElement) {
      throw new Error('没有加载录像');
    }

    try {
      await this.videoElement.play();
      this.currentPlayback.status = 'playing';

      this.emitEvent({
        type: 'play',
        sessionId: this.currentPlayback.sessionId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('播放失败:', error);
      this.currentPlayback.status = 'error';
      this.currentPlayback.error = error instanceof Error ? error.message : '播放失败';
    }
  }

  /**
   * 暂停
   */
  pause(): void {
    if (!this.currentPlayback || !this.videoElement) {
      throw new Error('没有加载录像');
    }

    this.videoElement.pause();
    this.currentPlayback.status = 'paused';

    this.emitEvent({
      type: 'pause',
      sessionId: this.currentPlayback.sessionId,
      timestamp: new Date().toISOString(),
      data: { currentTime: this.videoElement.currentTime },
    });
  }

  /**
   * 跳转到指定时间
   * @param timestamp 目标时间（秒）
   */
  seekTo(timestamp: number): void {
    if (!this.currentPlayback || !this.videoElement) {
      throw new Error('没有加载录像');
    }

    // 确保时间在有效范围内
    const targetTime = Math.max(0, Math.min(timestamp, this.videoElement.duration));

    this.videoElement.currentTime = targetTime;
    this.currentPlayback.currentTime = targetTime;

    this.emitEvent({
      type: 'seek',
      sessionId: this.currentPlayback.sessionId,
      timestamp: new Date().toISOString(),
      data: { targetTime, previousTime: this.videoElement.currentTime },
    });
  }

  /**
   * 设置播放速度
   * @param speed 播放速度
   */
  setSpeed(speed: PlaybackSpeed): void {
    if (!this.currentPlayback || !this.videoElement) {
      throw new Error('没有加载录像');
    }

    // 验证速度值
    if (!PLAYBACK_SPEED_OPTIONS.includes(speed)) {
      console.warn(`不支持的速度: ${speed}, 使用默认速度 1`);
      speed = 1;
    }

    this.videoElement.playbackRate = speed;
    this.currentPlayback.speed = speed;

    this.emitEvent({
      type: 'speed_change',
      sessionId: this.currentPlayback.sessionId,
      timestamp: new Date().toISOString(),
      data: { speed },
    });
  }

  /**
   * 设置音量
   * @param volume 音量 (0-1)
   */
  setVolume(volume: number): void {
    if (!this.currentPlayback || !this.videoElement) {
      throw new Error('没有加载录像');
    }

    this.videoElement.volume = Math.max(0, Math.min(1, volume));
    this.currentPlayback.volume = this.videoElement.volume;
  }

  /**
   * 设置静音
   * @param muted 是否静音
   */
  setMuted(muted: boolean): void {
    if (!this.currentPlayback || !this.videoElement) {
      throw new Error('没有加载录像');
    }

    this.videoElement.muted = muted;
    this.currentPlayback.muted = muted;
  }

  /**
   * 获取时间轴标记
   * @returns 标记列表
   */
  getTimelineMarkers(): TimelineMarker[] {
    if (!this.currentPlayback) {
      return [];
    }

    return [...this.currentPlayback.markers];
  }

  /**
   * 获取当前帧数据
   * @returns 当前帧 ImageData
   */
  getCurrentFrame(): ImageData | null {
    if (!this.currentPlayback || !this.videoElement) {
      return null;
    }

    try {
      // 创建 canvas
      const canvas = document.createElement('canvas');
      canvas.width = this.videoElement.videoWidth || 320;
      canvas.height = this.videoElement.videoHeight || 180;

      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);

      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch (error) {
      console.error('获取当前帧失败:', error);
      return null;
    }
  }

  /**
   * 获取当前帧截图
   * @returns 截图 Blob URL
   */
  getCurrentFrameUrl(): string | null {
    if (!this.currentPlayback || !this.videoElement) {
      return null;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = this.videoElement.videoWidth || 320;
      canvas.height = this.videoElement.videoHeight || 180;

      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);

      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (error) {
      console.error('获取截图失败:', error);
      return null;
    }
  }

  /**
   * 跳转到关键帧
   * @param frameIndex 关键帧索引
   */
  seekToKeyFrame(frameIndex: number): void {
    if (this.keyFrames.length === 0) {
      console.warn('没有关键帧数据');
      return;
    }

    const keyFrame = this.keyFrames[frameIndex];
    if (keyFrame && keyFrame.seekable) {
      this.seekTo(keyFrame.timestamp);
    }
  }

  /**
   * 获取关键帧列表
   * @returns 关键帧列表
   */
  getKeyFrames(): KeyFrame[] {
    return [...this.keyFrames];
  }

  /**
   * 获取当前回放状态
   * @returns 回放状态
   */
  getPlaybackState(): PlaybackState | null {
    if (!this.currentPlayback) return null;

    // 更新当前时间
    if (this.videoElement) {
      this.currentPlayback.currentTime = this.videoElement.currentTime;
      this.currentPlayback.bufferedPercent = this.getBufferedPercent();
    }

    return { ...this.currentPlayback };
  }

  /**
   * 获取缓冲进度
   * @returns 缓冲百分比
   */
  private getBufferedPercent(): number {
    if (!this.videoElement || !this.videoElement.buffered.length) {
      return 0;
    }

    const buffered = this.videoElement.buffered;
    const duration = this.videoElement.duration;

    // 获取当前播放位置的缓冲范围
    for (let i = 0; i < buffered.length; i++) {
      if (buffered.start(i) <= this.videoElement.currentTime &&
          buffered.end(i) >= this.videoElement.currentTime) {
        return Math.round((buffered.end(i) / duration) * 100);
      }
    }

    return 0;
  }

  /**
   * 快进
   * @param seconds 秒数
   */
  fastForward(seconds: number = 10): void {
    if (!this.currentPlayback || !this.videoElement) return;

    this.seekTo(this.videoElement.currentTime + seconds);
  }

  /**
   * 快退
   * @param seconds 秒数
   */
  rewind(seconds: number = 10): void {
    if (!this.currentPlayback || !this.videoElement) return;

    this.seekTo(this.videoElement.currentTime - seconds);
  }

  /**
   * 跳转到下一个标记
   */
  seekToNextMarker(): void {
    if (!this.currentPlayback || !this.videoElement) return;

    const currentTime = this.videoElement.currentTime;
    const markers = this.currentPlayback.markers.sort(
      (a, b) => a.timestampMs - b.timestampMs
    );

    const nextMarker = markers.find(m => m.timestampMs / 1000 > currentTime);
    if (nextMarker) {
      this.seekTo(nextMarker.timestampMs / 1000);
    }
  }

  /**
   * 跳转到上一个标记
   */
  seekToPreviousMarker(): void {
    if (!this.currentPlayback || !this.videoElement) return;

    const currentTime = this.videoElement.currentTime;
    const markers = this.currentPlayback.markers.sort(
      (a, b) => b.timestampMs - a.timestampMs
    );

    const prevMarker = markers.find(m => m.timestampMs / 1000 < currentTime);
    if (prevMarker) {
      this.seekTo(prevMarker.timestampMs / 1000);
    }
  }

  /**
   * 创建视频元素
   * @returns 视频元素
   */
  private createVideoElement(): HTMLVideoElement {
    const video = document.createElement('video');
    video.controls = false;
    video.muted = false;
    video.playsInline = true;
    video.preload = 'auto';

    return video;
  }

  /**
   * 等待视频加载
   */
  private waitForVideoLoad(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.videoElement) {
        reject(new Error('视频元素不存在'));
        return;
      }

      const onLoadedMetadata = () => {
        cleanup();
        resolve();
      };

      const onError = () => {
        cleanup();
        reject(new Error('视频加载失败'));
      };

      const cleanup = () => {
        this.videoElement!.removeEventListener('loadedmetadata', onLoadedMetadata);
        this.videoElement!.removeEventListener('error', onError);
      };

      this.videoElement.addEventListener('loadedmetadata', onLoadedMetadata);
      this.videoElement.addEventListener('error', onError);

      // 设置超时
      setTimeout(() => {
        cleanup();
        reject(new Error('视频加载超时'));
      }, 30000);
    });
  }

  /**
   * 设置视频事件监听
   */
  private setupVideoEvents(): void {
    if (!this.videoElement || !this.currentPlayback) return;

    // 时间更新事件
    this.videoElement.addEventListener('timeupdate', () => {
      this.currentPlayback!.currentTime = this.videoElement!.currentTime;
      this.timeUpdateCallbacks.forEach(cb =>
        cb(this.videoElement!.currentTime, this.videoElement!.duration)
      );

      this.emitEvent({
        type: 'time_update',
        sessionId: this.currentPlayback!.sessionId,
        timestamp: new Date().toISOString(),
        data: { currentTime: this.videoElement!.currentTime },
      });
    });

    // 播放结束事件
    this.videoElement.addEventListener('ended', () => {
      this.currentPlayback!.status = 'ended';

      this.emitEvent({
        type: 'ended',
        sessionId: this.currentPlayback!.sessionId,
        timestamp: new Date().toISOString(),
      });
    });

    // 缓冲事件
    this.videoElement.addEventListener('progress', () => {
      this.currentPlayback!.bufferedPercent = this.getBufferedPercent();
    });

    // 等待缓冲事件
    this.videoElement.addEventListener('waiting', () => {
      this.currentPlayback!.status = 'loading';
    });

    // 可以播放事件
    this.videoElement.addEventListener('canplay', () => {
      if (this.currentPlayback!.status === 'loading') {
        this.currentPlayback!.status = 'paused';
      }
    });

    // 错误事件
    this.videoElement.addEventListener('error', () => {
      this.currentPlayback!.status = 'error';
      this.currentPlayback!.error = '播放错误';

      this.emitEvent({
        type: 'error',
        sessionId: this.currentPlayback!.sessionId,
        timestamp: new Date().toISOString(),
        data: { error: '播放错误' },
      });
    });
  }

  /**
   * 触发事件
   * @param event 回放事件
   */
  private emitEvent(event: PlaybackEvent): void {
    this.eventCallbacks.forEach(callback => callback(event));
  }

  /**
   * 注册事件回调
   * @param callback 回调函数
   */
  onEvent(callback: (event: PlaybackEvent) => void): void {
    this.eventCallbacks.push(callback);
  }

  /**
   * 注册时间更新回调
   * @param callback 回调函数
   */
  onTimeUpdate(callback: (currentTime: number, duration: number) => void): void {
    this.timeUpdateCallbacks.push(callback);
  }

  /**
   * 移除事件回调
   * @param callback 回调函数
   */
  removeEventCallback(callback: (event: PlaybackEvent) => void): void {
    const index = this.eventCallbacks.indexOf(callback);
    if (index !== -1) {
      this.eventCallbacks.splice(index, 1);
    }
  }

  /**
   * 释放录像
   */
  release(): void {
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.src = '';
      this.videoElement.load();
      this.videoElement = null;
    }

    this.currentPlayback = null;
    this.keyFrames = [];
    this.bufferedPercent = 0;
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.release();
    this.eventCallbacks = [];
    this.timeUpdateCallbacks = [];
  }

  /**
   * 获取播放速度选项
   * @returns 速度选项列表
   */
  getSpeedOptions(): PlaybackSpeed[] {
    return [...PLAYBACK_SPEED_OPTIONS];
  }

  /**
   * 格式化时间显示
   * @param seconds 秒数
   * @returns 格式化字符串
   */
  formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  /**
   * 获取录像会话信息
   * @param sessionId 会话 ID
   * @returns 录制会话
   */
  async getRecordingSession(sessionId: string): Promise<RecordingSession | null> {
    const record = await this.storage.getRecordingRecord(sessionId);
    return record?.session || null;
  }
}

// 导出默认实例
export const playbackService = new PlaybackService();