/**
 * RTSP 流服务
 * 通过 WebSocket 代理连接 RTSP 流
 * 前端无法直接连接 RTSP，需要通过代理服务器
 */

import {
  RtspConfig,
  RtspCredentials,
  DEFAULT_RTSP_CONFIG,
  StreamHealth,
  StreamState,
  ConnectionQuality,
  StreamError,
  StreamErrorCode,
  NetworkStats,
  VideoStats,
  AudioStats,
} from './types';

/**
 * RTSP 代理消息类型
 */
type RtspProxyMessageType =
  | 'connect'
  | 'disconnect'
  | 'start'
  | 'stop'
  | 'data'
  | 'error'
  | 'status'
  | 'stats';

/**
 * RTSP 代理消息基类
 */
interface RtspProxyMessage {
  type: RtspProxyMessageType;
  timestamp: number;
}

/**
 * 连接消息
 */
interface ConnectMessage extends RtspProxyMessage {
  type: 'connect';
  rtspUrl: string;
  credentials?: RtspCredentials;
  options?: {
    useTcp?: boolean;
    bufferSize?: number;
  };
}

/**
 * 数据消息
 */
interface DataMessage extends RtspProxyMessage {
  type: 'data';
  data: string; // Base64 编码的视频数据
  codec: string;
  timestamp: number;
}

/**
 * 错误消息
 */
interface ErrorMessage extends RtspProxyMessage {
  type: 'error';
  code: number;
  message: string;
}

/**
 * 状态消息
 */
interface StatusMessage extends RtspProxyMessage {
  type: 'status';
  status: 'connected' | 'disconnected' | 'streaming' | 'error';
  info?: {
    width?: number;
    height?: number;
    frameRate?: number;
    codec?: string;
  };
}

/**
 * 统计消息
 */
interface StatsMessage extends RtspProxyMessage {
  type: 'stats';
  stats: {
    bytesReceived: number;
    bitrate: number;
    fps: number;
    droppedFrames: number;
    latency: number;
  };
}

/**
 * RTSP 连接状态
 */
interface RtspConnection {
  rtspUrl: string;
  proxySocket: WebSocket | null;
  mediaStream: MediaStream | null;
  state: StreamState;
  reconnectAttempts: number;
  connectedAt?: number;
  videoTrack?: MediaStreamTrack;
  audioTrack?: MediaStreamTrack;
  statsIntervalId?: number;
  lastStats?: StreamHealth;
  dataBuffer: Uint8Array[];
  videoDecoder?: VideoDecoder;
  audioDecoder?: AudioDecoder;
}

/**
 * RTSP 服务选项
 */
interface RtspServiceOptions {
  config?: Partial<RtspConfig>;
  onError?: (error: StreamError) => void;
  onStatsUpdate?: (stats: StreamHealth) => void;
  onStateChange?: (state: StreamState) => void;
}

/**
 * RTSP 流服务
 * 通过 WebSocket 代理连接 RTSP 流
 */
export class RtspService {
  private config: RtspConfig;
  private connection: RtspConnection | null = null;
  private errorHandlers: Set<(error: StreamError) => void> = new Set();
  private statsHandlers: Set<(stats: StreamHealth) => void> = new Set();
  private stateHandlers: Set<(state: StreamState) => void> = new Set();

  constructor(options?: RtspServiceOptions) {
    this.config = { ...DEFAULT_RTSP_CONFIG, ...options?.config };
    
    if (options?.onError) {
      this.errorHandlers.add(options.onError);
    }
    if (options?.onStatsUpdate) {
      this.statsHandlers.add(options.onStatsUpdate);
    }
    if (options?.onStateChange) {
      this.stateHandlers.add(options.onStateChange);
    }
  }

  /**
   * 解析 RTSP URL
   */
  private parseRtspUrl(rtspUrl: string): {
    host: string;
    port: number;
    path: string;
    credentials?: RtspCredentials;
  } {
    try {
      const url = new URL(rtspUrl);
      
      // 提取认证信息
      let credentials: RtspCredentials | undefined;
      if (url.username && url.password) {
        credentials = {
          username: decodeURIComponent(url.username),
          password: decodeURIComponent(url.password),
        };
      }

      return {
        host: url.hostname,
        port: parseInt(url.port) || 554,
        path: url.pathname + url.search,
        credentials,
      };
    } catch {
      throw new StreamError(
        StreamErrorCode.RTSP_URL_INVALID,
        `无效的 RTSP URL: ${rtspUrl}`
      );
    }
  }

  /**
   * 验证 RTSP URL
   */
  validateRtspUrl(rtspUrl: string): boolean {
    try {
      const url = new URL(rtspUrl);
      return url.protocol === 'rtsp:';
    } catch {
      return false;
    }
  }

  /**
   * 连接到 RTSP 流
   * @param rtspUrl RTSP URL
   * @param credentials 认证信息（可选）
   * @returns MediaStream
   */
  async connect(rtspUrl: string, credentials?: RtspCredentials): Promise<MediaStream> {
    // 验证 URL
    if (!this.validateRtspUrl(rtspUrl)) {
      throw new StreamError(
        StreamErrorCode.RTSP_URL_INVALID,
        `无效的 RTSP URL: ${rtspUrl}`
      );
    }

    // 如果已有连接，先断开
    if (this.connection && this.connection.state !== 'disconnected') {
      await this.disconnect();
    }

    // 解析 URL 获取认证信息
    const parsedUrl = this.parseRtspUrl(rtspUrl);
    const finalCredentials = credentials || parsedUrl.credentials;

    // 创建连接状态
    this.connection = {
      rtspUrl,
      proxySocket: null,
      mediaStream: null,
      state: 'connecting',
      reconnectAttempts: 0,
      dataBuffer: [],
    };

    this.emitStateChange('connecting');

    try {
      // 连接到代理服务器
      const proxySocket = await this.connectToProxy();
      this.connection.proxySocket = proxySocket;

      // 发送连接消息
      await this.sendConnectMessage(rtspUrl, finalCredentials);

      // 等待流就绪
      const stream = await this.waitForStream();

      this.connection.mediaStream = stream;
      this.connection.state = 'connected';
      this.connection.connectedAt = Date.now();

      // 启动统计监控
      this.startStatsMonitoring();

      this.emitStateChange('connected');

      return stream;
    } catch (error) {
      this.connection.state = 'error';
      this.emitStateChange('error');

      const streamError = new StreamError(
        StreamErrorCode.CONNECTION_FAILED,
        `RTSP 连接失败: ${error instanceof Error ? error.message : String(error)}`,
        undefined,
        error instanceof Error ? error : undefined
      );

      this.emitError(streamError);
      throw streamError;
    }
  }

  /**
   * 连接到代理服务器
   */
  private connectToProxy(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(this.config.proxyUrl);

      socket.onopen = () => {
        resolve(socket);
      };

      socket.onerror = (error) => {
        reject(new StreamError(
          StreamErrorCode.RTSP_PROXY_ERROR,
          'RTSP 代理服务器连接失败'
        ));
      };

      socket.onmessage = (event) => {
        this.handleProxyMessage(event.data);
      };

      socket.onclose = (event) => {
        this.handleProxyClose(event);
      };
    });
  }

  /**
   * 发送连接消息到代理
   */
  private sendConnectMessage(
    rtspUrl: string,
    credentials?: RtspCredentials
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.connection?.proxySocket) {
        reject(new StreamError(
          StreamErrorCode.RTSP_PROXY_ERROR,
          '代理连接未建立'
        ));
        return;
      }

      const message: ConnectMessage = {
        type: 'connect',
        rtspUrl,
        credentials,
        options: {
          useTcp: this.config.useTcp,
          bufferSize: this.config.bufferSize,
        },
        timestamp: Date.now(),
      };

      // 设置超时
      const timeout = setTimeout(() => {
        reject(new StreamError(
          StreamErrorCode.CONNECTION_TIMEOUT,
          'RTSP 连接超时'
        ));
      }, this.config.connectionTimeout);

      // 监听状态消息
      const handleStatus = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'status') {
            clearTimeout(timeout);
            if (data.status === 'connected' || data.status === 'streaming') {
              resolve();
            } else if (data.status === 'error') {
              reject(new StreamError(
                StreamErrorCode.RTSP_STREAM_NOT_FOUND,
                data.message || 'RTSP 流连接失败'
              ));
            }
          }
        } catch {
          // 忽略解析错误
        }
      };

      this.connection.proxySocket?.addEventListener('message', handleStatus);
      this.connection.proxySocket.send(JSON.stringify(message));
    });
  }

  /**
   * 处理代理消息
   */
  private handleProxyMessage(data: string): void {
    try {
      const message = JSON.parse(data) as RtspProxyMessage;

      switch (message.type) {
        case 'data':
          this.handleDataMessage(message as DataMessage);
          break;
        case 'error':
          this.handleErrorMessage(message as ErrorMessage);
          break;
        case 'status':
          this.handleStatusMessage(message as StatusMessage);
          break;
        case 'stats':
          this.handleStatsMessage(message as StatsMessage);
          break;
      }
    } catch (error) {
      console.error('解析代理消息失败:', error);
    }
  }

  /**
   * 处理数据消息
   */
  private handleDataMessage(message: DataMessage): void {
    if (!this.connection) return;

    try {
      // 解码 Base64 数据
      const binaryData = atob(message.data);
      const bytes = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i);
      }

      // 添加到缓冲区
      this.connection.dataBuffer.push(bytes);

      // 处理视频数据
      this.processVideoData(bytes, message.codec);
    } catch (error) {
      console.error('处理数据消息失败:', error);
    }
  }

  /**
   * 处理视频数据
   * 使用 WebCodecs API 解码视频
   */
  private processVideoData(data: Uint8Array, codec: string): void {
    // 检查浏览器是否支持 WebCodecs
    if (!('VideoDecoder' in window)) {
      console.warn('浏览器不支持 WebCodecs API');
      return;
    }

    if (!this.connection?.videoDecoder) {
      this.initVideoDecoder(codec);
    }

    // 创建编码块
    const chunk = new EncodedVideoChunk({
      type: 'key', // 假设所有块都是关键帧（实际应根据 RTSP 解析）
      timestamp: Date.now() * 1000, // 微秒
      data,
    });

    try {
      this.connection?.videoDecoder?.decode(chunk);
    } catch (error) {
      console.error('视频解码失败:', error);
    }
  }

  /**
   * 初始化视频解码器
   */
  private initVideoDecoder(codec: string): void {
    if (!('VideoDecoder' in window) || !this.connection) return;

    const videoDecoder = new VideoDecoder({
      output: (frame) => {
        // 处理解码后的视频帧
        // 这里可以渲染到 Canvas 或转换为 MediaStream
        frame.close();
      },
      error: (error) => {
        console.error('视频解码器错误:', error);
      },
    });

    // 配置解码器
    videoDecoder.configure({
      codec: this.mapCodecString(codec),
      optimizeForLatency: true,
    });

    this.connection.videoDecoder = videoDecoder;
  }

  /**
   * 映射编解码器字符串
   */
  private mapCodecString(codec: string): string {
    const codecMap: Record<string, string> = {
      'H264': 'avc1.42001E',
      'H265': 'hev1.1.6.L93.B0',
      'VP8': 'vp8',
      'VP9': 'vp09.00.10.08',
    };

    return codecMap[codec.toUpperCase()] || codec;
  }

  /**
   * 处理错误消息
   */
  private handleErrorMessage(message: ErrorMessage): void {
    const error = new StreamError(
      message.code as StreamErrorCode,
      message.message
    );
    this.emitError(error);

    if (this.connection) {
      this.connection.state = 'error';
      this.emitStateChange('error');
    }
  }

  /**
   * 处理状态消息
   */
  private handleStatusMessage(message: StatusMessage): void {
    if (!this.connection) return;

    switch (message.status) {
      case 'connected':
      case 'streaming':
        this.connection.state = 'connected';
        this.emitStateChange('connected');
        break;
      case 'disconnected':
        this.connection.state = 'disconnected';
        this.emitStateChange('disconnected');
        if (this.config.autoReconnect) {
          this.reconnect();
        }
        break;
      case 'error':
        this.connection.state = 'error';
        this.emitStateChange('error');
        break;
    }
  }

  /**
   * 处理统计消息
   */
  private handleStatsMessage(message: StatsMessage): void {
    if (!this.connection) return;

    // 更新统计信息
    // 这里可以存储用于健康监控
  }

  /**
   * 处理代理连接关闭
   */
  private handleProxyClose(event: CloseEvent): void {
    if (!this.connection) return;

    this.connection.state = 'disconnected';
    this.emitStateChange('disconnected');

    // 非正常关闭，尝试重连
    if (event.code !== 1000 && this.config.autoReconnect) {
      this.reconnect();
    }
  }

  /**
   * 等待流就绪
   */
  private waitForStream(): Promise<MediaStream> {
    return new Promise((resolve, reject) => {
      if (!this.connection) {
        reject(new StreamError(
          StreamErrorCode.CONNECTION_FAILED,
          '连接不存在'
        ));
        return;
      }

      // 设置超时
      const timeout = setTimeout(() => {
        reject(new StreamError(
          StreamErrorCode.CONNECTION_TIMEOUT,
          '等待流超时'
        ));
      }, this.config.connectionTimeout);

      // 检查是否已有流
      if (this.connection.mediaStream) {
        clearTimeout(timeout);
        resolve(this.connection.mediaStream);
        return;
      }

      // 创建一个空的 MediaStream
      // 实际的轨道将通过 WebCodecs API 添加
      const stream = new MediaStream();
      this.connection.mediaStream = stream;
      clearTimeout(timeout);
      resolve(stream);
    });
  }

  /**
   * 获取媒体流
   */
  getStream(): MediaStream | null {
    return this.connection?.mediaStream || null;
  }

  /**
   * 重新连接
   */
  async reconnect(): Promise<MediaStream> {
    if (!this.connection) {
      throw new StreamError(
        StreamErrorCode.CONNECTION_FAILED,
        '没有可重连的连接'
      );
    }

    if (this.connection.reconnectAttempts >= (this.config.maxReconnectAttempts || 3)) {
      this.connection.state = 'error';
      this.emitStateChange('error');
      throw new StreamError(
        StreamErrorCode.CONNECTION_FAILED,
        '重连次数已达上限'
      );
    }

    this.connection.state = 'reconnecting';
    this.emitStateChange('reconnecting');
    this.connection.reconnectAttempts++;

    // 等待重连间隔
    await new Promise(resolve =>
      setTimeout(resolve, this.config.reconnectInterval)
    );

    // 关闭现有连接
    await this.disconnect(false);

    // 重新连接
    return this.connect(this.connection.rtspUrl);
  }

  /**
   * 断开连接
   */
  async disconnect(emitEvent: boolean = true): Promise<void> {
    if (!this.connection) return;

    // 停止统计监控
    if (this.connection.statsIntervalId) {
      clearInterval(this.connection.statsIntervalId);
    }

    // 关闭解码器
    if (this.connection.videoDecoder) {
      this.connection.videoDecoder.close();
    }
    if (this.connection.audioDecoder) {
      this.connection.audioDecoder.close();
    }

    // 停止媒体轨道
    if (this.connection.mediaStream) {
      this.connection.mediaStream.getTracks().forEach(track => track.stop());
    }

    // 发送断开消息
    if (this.connection.proxySocket && this.connection.proxySocket.readyState === WebSocket.OPEN) {
      const message: RtspProxyMessage = {
        type: 'disconnect',
        timestamp: Date.now(),
      };
      this.connection.proxySocket.send(JSON.stringify(message));
      this.connection.proxySocket.close();
    }

    if (emitEvent) {
      this.connection.state = 'disconnected';
      this.emitStateChange('disconnected');
    }

    this.connection = null;
  }

  /**
   * 获取连接健康状态
   */
  async getHealth(): Promise<StreamHealth> {
    if (!this.connection) {
      throw new StreamError(
        StreamErrorCode.DEVICE_NOT_FOUND,
        '连接不存在'
      );
    }

    const stats = await this.collectStats();
    this.connection.lastStats = stats;

    // 通知统计处理器
    this.statsHandlers.forEach(handler => handler(stats));

    return stats;
  }

  /**
   * 启动统计监控
   */
  private startStatsMonitoring(): void {
    if (!this.connection) return;

    this.connection.statsIntervalId = window.setInterval(async () => {
      try {
        await this.getHealth();
      } catch (error) {
        console.error('收集统计信息失败:', error);
      }
    }, 1000);
  }

  /**
   * 收集统计信息
   */
  private async collectStats(): Promise<StreamHealth> {
    if (!this.connection) {
      throw new StreamError(
        StreamErrorCode.DEVICE_NOT_FOUND,
        '连接不存在'
      );
    }

    // 基本统计信息
    const networkStats: NetworkStats = {
      rtt: 0,
      packetLoss: 0,
      availableBandwidth: 0,
      bytesReceived: 0,
      bytesSent: 0,
      bitrateReceived: 0,
      bitrateSent: 0,
      jitter: 0,
    };

    const videoStats: VideoStats = {
      width: 0,
      height: 0,
      frameRate: 0,
      codec: '',
      framesDecoded: 0,
      framesDropped: 0,
      freezeCount: 0,
      totalFreezeDuration: 0,
    };

    const audioStats: AudioStats = {
      sampleRate: 0,
      channels: 0,
      codec: '',
      silenceCount: 0,
      audioLevel: 0,
    };

    // 如果有媒体流，获取轨道信息
    if (this.connection.mediaStream) {
      const videoTracks = this.connection.mediaStream.getVideoTracks();
      if (videoTracks.length > 0) {
        const settings = videoTracks[0].getSettings();
        videoStats.width = settings.width || 0;
        videoStats.height = settings.height || 0;
        videoStats.frameRate = settings.frameRate || 0;
      }
    }

    // 计算连接质量
    const quality = this.calculateConnectionQuality(networkStats);

    return {
      deviceId: 'rtsp-stream',
      protocol: 'rtsp',
      state: this.connection.state,
      quality,
      network: networkStats,
      video: videoStats,
      audio: audioStats,
      connectedAt: this.connection.connectedAt,
      lastUpdated: Date.now(),
      reconnectCount: this.connection.reconnectAttempts,
    };
  }

  /**
   * 计算连接质量
   */
  private calculateConnectionQuality(networkStats: NetworkStats): ConnectionQuality {
    const { rtt, packetLoss, availableBandwidth } = networkStats;

    // 简化的质量评估
    let score = 100;

    if (rtt > 300) score -= 30;
    else if (rtt > 200) score -= 20;
    else if (rtt > 100) score -= 10;

    if (packetLoss > 0.1) score -= 30;
    else if (packetLoss > 0.05) score -= 20;
    else if (packetLoss > 0.01) score -= 10;

    if (availableBandwidth < 300000) score -= 20;
    else if (availableBandwidth < 800000) score -= 10;

    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }

  /**
   * 发送状态变化事件
   */
  private emitStateChange(state: StreamState): void {
    this.stateHandlers.forEach(handler => handler(state));
  }

  /**
   * 发送错误事件
   */
  private emitError(error: StreamError): void {
    this.errorHandlers.forEach(handler => handler(error));
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
   * 添加统计处理器
   */
  addStatsHandler(handler: (stats: StreamHealth) => void): void {
    this.statsHandlers.add(handler);
  }

  /**
   * 移除统计处理器
   */
  removeStatsHandler(handler: (stats: StreamHealth) => void): void {
    this.statsHandlers.delete(handler);
  }

  /**
   * 添加状态处理器
   */
  addStateHandler(handler: (state: StreamState) => void): void {
    this.stateHandlers.add(handler);
  }

  /**
   * 移除状态处理器
   */
  removeStateHandler(handler: (state: StreamState) => void): void {
    this.stateHandlers.delete(handler);
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.disconnect();
    this.errorHandlers.clear();
    this.statsHandlers.clear();
    this.stateHandlers.clear();
  }
}

export default RtspService;