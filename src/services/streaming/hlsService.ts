/**
 * HLS 流服务
 * 用于录像回放，支持 m3u8 解析和分片加载
 */

import {
  HlsConfig,
  HlsPlaylist,
  HlsSegment,
  DEFAULT_HLS_CONFIG,
  PlaybackInfo,
  PlaybackState,
  QualityLevel,
  StreamError,
  StreamErrorCode,
} from './types';

/**
 * HLS 服务事件类型
 */
type HlsEventType =
  | 'manifestParsed'
  | 'manifestLoaded'
  | 'segmentLoaded'
  | 'fragmentLoaded'
  | 'error'
  | 'stateChange'
  | 'bufferUpdate'
  | 'qualityChange';

/**
 * HLS 服务事件
 */
interface HlsEvent {
  type: HlsEventType;
  data?: unknown;
  timestamp: number;
}

/**
 * HLS 服务事件处理器
 */
type HlsEventHandler = (event: HlsEvent) => void;

/**
 * HLS 流状态
 */
interface HlsStreamState {
  hlsUrl: string;
  playlist: HlsPlaylist | null;
  videoElement: HTMLVideoElement | null;
  state: PlaybackState;
  currentTime: number;
  duration: number;
  bufferedRanges: TimeRanges | null;
  currentQuality: QualityLevel;
  availableQualities: QualityLevel[];
  retryCount: number;
  loadingSegments: Set<number>;
  loadedSegments: Map<number, ArrayBuffer>;
}

/**
 * HLS 服务选项
 */
interface HlsServiceOptions {
  config?: Partial<HlsConfig>;
  onStateChange?: HlsEventHandler;
  onError?: (error: StreamError) => void;
  onBufferUpdate?: HlsEventHandler;
}

/**
 * HLS 流服务
 * 用于录像回放，支持 m3u8 解析和分片加载
 */
export class HlsService {
  private config: HlsConfig;
  private state: HlsStreamState | null = null;
  private eventHandlers: Set<HlsEventHandler> = new Set();
  private errorHandlers: Set<(error: StreamError) => void> = new Set();
  private bufferHandlers: Set<HlsEventHandler> = new Set();
  private abortController: AbortController | null = null;
  private updateIntervalId: number | null = null;

  constructor(options?: HlsServiceOptions) {
    this.config = { ...DEFAULT_HLS_CONFIG, ...options?.config };

    if (options?.onStateChange) {
      this.eventHandlers.add(options.onStateChange);
    }
    if (options?.onError) {
      this.errorHandlers.add(options.onError);
    }
    if (options?.onBufferUpdate) {
      this.bufferHandlers.add(options.onBufferUpdate);
    }
  }

  /**
   * 加载 HLS 流
   * @param hlsUrl HLS m3u8 URL
   * @param videoElement 视频元素（可选）
   * @returns 播放信息
   */
  async loadHlsStream(hlsUrl: string, videoElement?: HTMLVideoElement): Promise<PlaybackInfo> {
    // 验证 URL
    if (!this.validateHlsUrl(hlsUrl)) {
      throw new StreamError(
        StreamErrorCode.HLS_MANIFEST_ERROR,
        `无效的 HLS URL: ${hlsUrl}`
      );
    }

    // 如果已有流，先清理
    if (this.state) {
      await this.unload();
    }

    // 创建状态
    this.state = {
      hlsUrl,
      playlist: null,
      videoElement: videoElement || null,
      state: 'loading',
      currentTime: 0,
      duration: 0,
      bufferedRanges: null,
      currentQuality: 'auto',
      availableQualities: ['auto'],
      retryCount: 0,
      loadingSegments: new Set(),
      loadedSegments: new Map(),
    };

    this.abortController = new AbortController();

    this.emitEvent('stateChange', { state: 'loading' });

    try {
      // 解析 m3u8 文件
      const playlist = await this.parseManifest(hlsUrl);
      this.state.playlist = playlist;

      // 如果提供了视频元素，直接使用原生 HLS 支持（iOS Safari）
      if (this.state.videoElement && this.canUseNativeHls()) {
        return this.loadNativeHls(hlsUrl);
      }

      // 否则使用自定义 HLS 实现
      return this.loadCustomHls(playlist);
    } catch (error) {
      this.state.state = 'error';
      this.emitEvent('stateChange', { state: 'error' });

      const streamError = new StreamError(
        StreamErrorCode.HLS_MANIFEST_ERROR,
        `HLS 流加载失败: ${error instanceof Error ? error.message : String(error)}`,
        undefined,
        error instanceof Error ? error : undefined
      );

      this.emitError(streamError);
      throw streamError;
    }
  }

  /**
   * 验证 HLS URL
   */
  private validateHlsUrl(hlsUrl: string): boolean {
    try {
      const url = new URL(hlsUrl);
      // 支持 http/https 协议
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * 检查是否可以使用原生 HLS 支持
   * iOS Safari 和部分浏览器原生支持 HLS
   */
  private canUseNativeHls(): boolean {
    const video = document.createElement('video');
    return video.canPlayType('application/vnd.apple.mpegurl') !== '';
  }

  /**
   * 使用原生 HLS 支持
   */
  private loadNativeHls(hlsUrl: string): PlaybackInfo {
    if (!this.state?.videoElement) {
      throw new StreamError(
        StreamErrorCode.INVALID_STATE,
        '视频元素不存在'
      );
    }

    this.state.videoElement.src = hlsUrl;

    // 监听视频事件
    this.setupVideoEvents(this.state.videoElement);

    return this.getPlaybackInfo();
  }

  /**
   * 使用自定义 HLS 实现
   */
  private async loadCustomHls(playlist: HlsPlaylist): Promise<PlaybackInfo> {
    if (!this.state) {
      throw new StreamError(
        StreamErrorCode.INVALID_STATE,
        '状态不存在'
      );
    }

    // 设置时长
    if (!playlist.isLive && playlist.totalDuration) {
      this.state.duration = playlist.totalDuration;
    } else {
      this.state.duration = Infinity; // 直播流
    }

    // 开始加载分片
    await this.startSegmentLoading();

    this.emitEvent('manifestParsed', { playlist });

    return this.getPlaybackInfo();
  }

  /**
   * 解析 m3u8 文件
   */
  private async parseManifest(url: string): Promise<HlsPlaylist> {
    const response = await fetch(url, {
      signal: this.abortController?.signal,
    });

    if (!response.ok) {
      throw new StreamError(
        StreamErrorCode.HLS_MANIFEST_ERROR,
        `m3u8 文件加载失败: HTTP ${response.status}`
      );
    }

    const content = await response.text();
    return this.parseM3u8Content(content, url);
  }

  /**
   * 解析 m3u8 内容
   */
  private parseM3u8Content(content: string, baseUrl: string): HlsPlaylist {
    const lines = content.split('\n').map(line => line.trim()).filter(Boolean);

    // 检查是否为 HLS 文件
    if (lines[0] !== '#EXTM3U') {
      throw new StreamError(
        StreamErrorCode.HLS_PARSE_ERROR,
        '无效的 m3u8 文件格式'
      );
    }

    let isLive = true;
    let targetDuration = 0;
    let version = 3;
    let allowCache = true;
    let totalDuration = 0;
    const segments: HlsSegment[] = [];
    let currentSequence = 0;
    let currentDuration = 0;
    let discontinuity = false;

    // 解析每一行
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('#EXT-X-')) {
        // 标签行
        if (line.startsWith('#EXT-X-VERSION:')) {
          version = parseInt(line.substring(15));
        } else if (line.startsWith('#EXT-X-TARGETDURATION:')) {
          targetDuration = parseInt(line.substring(22));
        } else if (line.startsWith('#EXT-X-MEDIA-SEQUENCE:')) {
          currentSequence = parseInt(line.substring(22));
        } else if (line.startsWith('#EXT-X-ALLOW-CACHE:')) {
          allowCache = line.substring(19) === 'YES';
        } else if (line.startsWith('#EXT-X-PLAYLIST-TYPE:')) {
          const type = line.substring(20);
          if (type === 'VOD') {
            isLive = false;
          }
        } else if (line.startsWith('#EXT-X-ENDLIST')) {
          isLive = false;
        } else if (line.startsWith('#EXT-X-DISCONTINUITY')) {
          discontinuity = true;
        }
      } else if (line.startsWith('#EXTINF:')) {
        // 分片时长
        const durationStr = line.substring(8);
        currentDuration = parseFloat(durationStr.split(',')[0]);
      } else if (!line.startsWith('#')) {
        // 分片 URL
        const segmentUrl = this.resolveUrl(line, baseUrl);
        segments.push({
          url: segmentUrl,
          duration: currentDuration,
          sequence: currentSequence,
          discontinuity,
        });
        totalDuration += currentDuration;
        currentSequence++;
        discontinuity = false;
      }
    }

    return {
      isLive,
      targetDuration,
      segments,
      totalDuration: isLive ? undefined : totalDuration,
      version,
      allowCache,
    };
  }

  /**
   * 解析相对 URL
   */
  private resolveUrl(url: string, baseUrl: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    const base = new URL(baseUrl);
    if (url.startsWith('/')) {
      return `${base.origin}${url}`;
    } else {
      const basePath = base.pathname.substring(0, base.pathname.lastIndexOf('/') + 1);
      return `${base.origin}${basePath}${url}`;
    }
  }

  /**
   * 开始加载分片
   */
  private async startSegmentLoading(): Promise<void> {
    if (!this.state?.playlist) return;

    // 加载初始分片（前几个分片用于预缓冲）
    const initialSegments = this.state.playlist.segments.slice(0, 3);
    
    for (const segment of initialSegments) {
      await this.loadSegment(segment);
    }

    // 启动更新循环
    this.startUpdateLoop();
  }

  /**
   * 加载单个分片
   */
  private async loadSegment(segment: HlsSegment): Promise<void> {
    if (!this.state) return;

    // 检查是否正在加载
    if (this.state.loadingSegments.has(segment.sequence)) {
      return;
    }

    // 检查是否已加载
    if (this.state.loadedSegments.has(segment.sequence)) {
      return;
    }

    this.state.loadingSegments.add(segment.sequence);

    try {
      const response = await fetch(segment.url, {
        signal: this.abortController?.signal,
      });

      if (!response.ok) {
        throw new StreamError(
          StreamErrorCode.HLS_SEGMENT_ERROR,
          `分片加载失败: HTTP ${response.status}`
        );
      }

      const data = await response.arrayBuffer();
      
      this.state.loadingSegments.delete(segment.sequence);
      this.state.loadedSegments.set(segment.sequence, data);

      this.emitEvent('segmentLoaded', { segment, data });

      // 如果有视频元素，将数据添加到缓冲区
      if (this.state.videoElement) {
        await this.appendSegmentToBuffer(data);
      }
    } catch (error) {
      this.state.loadingSegments.delete(segment.sequence);

      if (error instanceof Error && error.name === 'AbortError') {
        // 加载被取消，不处理
        return;
      }

      // 重试加载
      if (this.state.retryCount < this.config.maxRetryCount) {
        this.state.retryCount++;
        await new Promise(resolve =>
          setTimeout(resolve, this.config.retryDelay)
        );
        await this.loadSegment(segment);
      } else {
        const streamError = new StreamError(
          StreamErrorCode.HLS_SEGMENT_ERROR,
          `分片加载失败: ${segment.url}`,
          undefined,
          error instanceof Error ? error : undefined
        );
        this.emitError(streamError);
      }
    }
  }

  /**
   * 将分片数据添加到缓冲区
   * 使用 MediaSource API
   */
  private async appendSegmentToBuffer(data: ArrayBuffer): Promise<void> {
    if (!this.state?.videoElement) return;

    // 检查浏览器是否支持 MediaSource
    if (!('MediaSource' in window)) {
      console.warn('浏览器不支持 MediaSource API');
      return;
    }

    // 这里需要实现 MediaSource 的缓冲管理
    // 由于复杂性，这里仅提供框架代码
    // 实际实现需要处理 SourceBuffer 的创建、更新和错误处理
  }

  /**
   * 设置视频元素事件监听
   */
  private setupVideoEvents(videoElement: HTMLVideoElement): void {
    videoElement.addEventListener('loadstart', () => {
      if (this.state) {
        this.state.state = 'loading';
        this.emitEvent('stateChange', { state: 'loading' });
      }
    });

    videoElement.addEventListener('loadedmetadata', () => {
      if (this.state) {
        this.state.duration = videoElement.duration;
        this.state.state = 'idle';
        this.emitEvent('stateChange', { state: 'idle' });
      }
    });

    videoElement.addEventListener('canplay', () => {
      if (this.state) {
        this.state.state = 'playing';
        this.emitEvent('stateChange', { state: 'playing' });
      }
    });

    videoElement.addEventListener('playing', () => {
      if (this.state) {
        this.state.state = 'playing';
        this.emitEvent('stateChange', { state: 'playing' });
      }
    });

    videoElement.addEventListener('pause', () => {
      if (this.state) {
        this.state.state = 'paused';
        this.emitEvent('stateChange', { state: 'paused' });
      }
    });

    videoElement.addEventListener('ended', () => {
      if (this.state) {
        this.state.state = 'ended';
        this.emitEvent('stateChange', { state: 'ended' });
      }
    });

    videoElement.addEventListener('error', () => {
      if (this.state) {
        this.state.state = 'error';
        this.emitEvent('stateChange', { state: 'error' });
        this.emitError(new StreamError(
          StreamErrorCode.HLS_SEGMENT_ERROR,
          '视频播放错误'
        ));
      }
    });

    videoElement.addEventListener('timeupdate', () => {
      if (this.state) {
        this.state.currentTime = videoElement.currentTime;
      }
    });

    videoElement.addEventListener('progress', () => {
      if (this.state) {
        this.state.bufferedRanges = videoElement.buffered;
        this.emitEvent('bufferUpdate', { buffered: videoElement.buffered });
      }
    });
  }

  /**
   * 启动更新循环
   * 用于直播流的持续更新和缓冲管理
   */
  private startUpdateLoop(): void {
    this.updateIntervalId = window.setInterval(() => {
      this.updateStream();
    }, 1000);
  }

  /**
   * 更新流状态
   */
  private async updateStream(): Promise<void> {
    if (!this.state?.playlist) return;

    // 直播流需要定期刷新 m3u8
    if (this.state.playlist.isLive) {
      try {
        const newPlaylist = await this.parseManifest(this.state.hlsUrl);
        
        // 检查是否有新分片
        const newSegments = newPlaylist.segments.filter(
          seg => !this.state!.loadedSegments.has(seg.sequence)
        );

        // 加载新分片
        for (const segment of newSegments) {
          await this.loadSegment(segment);
        }

        this.state.playlist = newPlaylist;
      } catch (error) {
        console.error('刷新 m3u8 失败:', error);
      }
    }

    // 根据播放位置预加载分片
    if (this.state.videoElement) {
      const currentTime = this.state.videoElement.currentTime;
      const targetSegment = this.findSegmentByTime(currentTime + this.config.maxBufferLength);

      if (targetSegment && !this.state.loadedSegments.has(targetSegment.sequence)) {
        await this.loadSegment(targetSegment);
      }
    }
  }

  /**
   * 根据时间查找分片
   */
  private findSegmentByTime(time: number): HlsSegment | null {
    if (!this.state?.playlist) return null;

    let accumulatedTime = 0;
    for (const segment of this.state.playlist.segments) {
      if (accumulatedTime + segment.duration > time) {
        return segment;
      }
      accumulatedTime += segment.duration;
    }

    return null;
  }

  /**
   * 跳转到指定时间点
   * @param timestamp 时间戳（秒）
   */
  async seekTo(timestamp: number): Promise<void> {
    if (!this.state?.videoElement) {
      throw new StreamError(
        StreamErrorCode.INVALID_STATE,
        '视频元素不存在'
      );
    }

    // 验证时间范围
    if (timestamp < 0 || timestamp > this.state.duration) {
      throw new StreamError(
        StreamErrorCode.INVALID_STATE,
        `无效的跳转时间: ${timestamp}`
      );
    }

    // 执行跳转
    this.state.videoElement.currentTime = timestamp;
    this.state.currentTime = timestamp;

    // 确保目标分片已加载
    const targetSegment = this.findSegmentByTime(timestamp);
    if (targetSegment && !this.state.loadedSegments.has(targetSegment.sequence)) {
      await this.loadSegment(targetSegment);
    }
  }

  /**
   * 获取播放信息
   */
  getPlaybackInfo(): PlaybackInfo {
    if (!this.state) {
      return {
        state: 'idle',
        currentTime: 0,
        duration: 0,
        bufferedProgress: 0,
        volume: 1,
        muted: false,
        playbackRate: 1,
        quality: 'auto',
        availableQualities: ['auto'],
      };
    }

    // 计算缓冲进度
    let bufferedProgress = 0;
    if (this.state.bufferedRanges && this.state.bufferedRanges.length > 0) {
      const bufferedEnd = this.state.bufferedRanges.end(this.state.bufferedRanges.length - 1);
      bufferedProgress = bufferedEnd / this.state.duration;
    }

    // 从视频元素获取额外信息
    let volume = 1;
    let muted = false;
    let playbackRate = 1;

    if (this.state.videoElement) {
      volume = this.state.videoElement.volume;
      muted = this.state.videoElement.muted;
      playbackRate = this.state.videoElement.playbackRate;
    }

    return {
      state: this.state.state,
      currentTime: this.state.currentTime,
      duration: this.state.duration,
      bufferedProgress,
      volume,
      muted,
      playbackRate,
      quality: this.state.currentQuality,
      availableQualities: this.state.availableQualities,
    };
  }

  /**
   * 设置视频元素
   */
  setVideoElement(videoElement: HTMLVideoElement): void {
    if (this.state) {
      this.state.videoElement = videoElement;
      this.setupVideoEvents(videoElement);
    }
  }

  /**
   * 播放
   */
  async play(): Promise<void> {
    if (!this.state?.videoElement) {
      throw new StreamError(
        StreamErrorCode.INVALID_STATE,
        '视频元素不存在'
      );
    }

    await this.state.videoElement.play();
  }

  /**
   * 暂停
   */
  pause(): void {
    if (this.state?.videoElement) {
      this.state.videoElement.pause();
    }
  }

  /**
   * 设置音量
   */
  setVolume(volume: number): void {
    if (this.state?.videoElement) {
      this.state.videoElement.volume = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * 设置静音
   */
  setMuted(muted: boolean): void {
    if (this.state?.videoElement) {
      this.state.videoElement.muted = muted;
    }
  }

  /**
   * 设置播放速率
   */
  setPlaybackRate(rate: number): void {
    if (this.state?.videoElement) {
      this.state.videoElement.playbackRate = rate;
    }
  }

  /**
   * 卸载流
   */
  async unload(): Promise<void> {
    // 取消所有加载请求
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    // 停止更新循环
    if (this.updateIntervalId) {
      clearInterval(this.updateIntervalId);
      this.updateIntervalId = null;
    }

    // 清理视频元素
    if (this.state?.videoElement) {
      this.state.videoElement.src = '';
      this.state.videoElement.load();
    }

    // 清理状态
    this.state = null;
  }

  /**
   * 发送事件
   */
  private emitEvent(type: HlsEventType, data?: unknown): void {
    const event: HlsEvent = {
      type,
      data,
      timestamp: Date.now(),
    };

    this.eventHandlers.forEach(handler => handler(event));
  }

  /**
   * 发送错误
   */
  private emitError(error: StreamError): void {
    this.errorHandlers.forEach(handler => handler(error));
  }

  /**
   * 添加事件处理器
   */
  addEventHandler(handler: HlsEventHandler): void {
    this.eventHandlers.add(handler);
  }

  /**
   * 移除事件处理器
   */
  removeEventHandler(handler: HlsEventHandler): void {
    this.eventHandlers.delete(handler);
  }

  /**
   * 添加错误处理器
   */
  addErrorHandler(handler: (error: StreamError) => void): void {
    this.errorHandlers.add(handler);
  }

  /**
   * 移除错误处理器
   */
  removeErrorHandler(handler: (error: StreamError) => void): void {
    this.errorHandlers.delete(handler);
  }

  /**
   * 添加缓冲处理器
   */
  addBufferHandler(handler: HlsEventHandler): void {
    this.bufferHandlers.add(handler);
  }

  /**
   * 移除缓冲处理器
   */
  removeBufferHandler(handler: HlsEventHandler): void {
    this.bufferHandlers.delete(handler);
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.unload();
    this.eventHandlers.clear();
    this.errorHandlers.clear();
    this.bufferHandlers.clear();
  }
}

export default HlsService;