/**
 * 统一流管理器
 * 自动协议选择、自适应码率控制、流健康监控、弱网优化
 */

import {
  StreamProtocol,
  StreamConfig,
  DEFAULT_STREAM_CONFIG,
  StreamHealth,
  StreamState,
  QualityLevel,
  ConnectionQuality,
  AdaptiveBitrateConfig,
  DEFAULT_ADAPTIVE_BITRATE_CONFIG,
  BitrateTier,
  DEFAULT_BITRATE_TIERS,
  StreamError,
  StreamErrorCode,
  StreamEventHandler,
  StreamEvent,
  WebRTCConfig,
  RtspConfig,
  HlsConfig,
  NetworkStats,
} from './types';
import { WebRTCService } from './webrtcService';
import { RtspService } from './rtspService';
import { HlsService } from './hlsService';

/**
 * 流连接信息
 */
interface StreamConnection {
  deviceId: string;
  protocol: StreamProtocol;
  service: WebRTCService | RtspService | HlsService;
  mediaStream: MediaStream | null;
  state: StreamState;
  config: StreamConfig;
  health: StreamHealth | null;
  adaptiveBitrateEnabled: boolean;
  currentQuality: QualityLevel;
  lastBandwidthEstimate: number;
  statsHistory: NetworkStats[];
  healthCheckIntervalId?: number;
  adaptiveBitrateIntervalId?: number;
}

/**
 * 流管理器选项
 */
interface StreamManagerOptions {
  defaultConfig?: Partial<StreamConfig>;
  onStateChange?: StreamEventHandler;
  onError?: (error: StreamError) => void;
  onHealthUpdate?: (deviceId: string, health: StreamHealth) => void;
  onQualityChange?: (deviceId: string, quality: QualityLevel) => void;
}

/**
 * 统一流管理器
 * 管理 WebRTC/RTSP/HLS 多协议流
 */
export class StreamManager {
  private connections: Map<string, StreamConnection> = new Map();
  private defaultConfig: Partial<StreamConfig>;
  private eventHandlers: Set<StreamEventHandler> = new Set();
  private errorHandlers: Set<(error: StreamError) => void> = new Set();
  private healthHandlers: Set<(deviceId: string, health: StreamHealth) => void> = new Set();
  private qualityHandlers: Set<(deviceId: string, quality: QualityLevel) => void> = new Set();

  // 服务实例（可共享）
  private webrtcService: WebRTCService | null = null;
  private rtspService: RtspService | null = null;
  private hlsService: HlsService | null = null;

  constructor(options?: StreamManagerOptions) {
    this.defaultConfig = { ...DEFAULT_STREAM_CONFIG, ...options?.defaultConfig };

    if (options?.onStateChange) {
      this.eventHandlers.add(options.onStateChange);
    }
    if (options?.onError) {
      this.errorHandlers.add(options.onError);
    }
    if (options?.onHealthUpdate) {
      this.healthHandlers.add(options.onHealthUpdate);
    }
    if (options?.onQualityChange) {
      this.qualityHandlers.add(options.onQualityChange);
    }
  }

  /**
   * 创建流
   * @param deviceId 设备 ID
   * @param config 流配置
   * @returns MediaStream
   */
  async createStream(deviceId: string, config?: Partial<StreamConfig>): Promise<MediaStream> {
    // 合并配置
    const finalConfig: StreamConfig = {
      ...this.defaultConfig,
      ...config,
      deviceId,
    } as StreamConfig;

    // 检查是否已存在连接
    const existingConnection = this.connections.get(deviceId);
    if (existingConnection && existingConnection.state === 'connected') {
      if (existingConnection.mediaStream) {
        return existingConnection.mediaStream;
      }
    }

    // 创建连接记录
    const connection: StreamConnection = {
      deviceId,
      protocol: finalConfig.preferredProtocol,
      service: null as unknown as WebRTCService | RtspService | HlsService,
      mediaStream: null,
      state: 'connecting',
      config: finalConfig,
      health: null,
      adaptiveBitrateEnabled: finalConfig.adaptiveBitrate?.enabled ?? true,
      currentQuality: finalConfig.adaptiveBitrate?.initialQuality ?? 'medium',
      lastBandwidthEstimate: 0,
      statsHistory: [],
    };

    this.connections.set(deviceId, connection);
    this.emitStateChange(deviceId, 'connecting');

    // 尝试连接，按优先级顺序尝试协议
    const protocols = [
      finalConfig.preferredProtocol,
      ...(finalConfig.fallbackProtocols || []),
    ];

    for (const protocol of protocols) {
      try {
        const stream = await this.connectWithProtocol(deviceId, protocol, finalConfig);
        
        connection.protocol = protocol;
        connection.mediaStream = stream;
        connection.state = 'connected';
        
        // 启动健康监控
        this.startHealthMonitoring(deviceId);
        
        // 启动自适应码率控制
        if (connection.adaptiveBitrateEnabled) {
          this.startAdaptiveBitrateControl(deviceId);
        }

        this.emitStateChange(deviceId, 'connected');
        
        return stream;
      } catch (error) {
        console.warn(`协议 ${protocol} 连接失败:`, error);
        
        // 继续尝试下一个协议
        if (protocols.indexOf(protocol) < protocols.length - 1) {
          continue;
        }

        // 所有协议都失败
        connection.state = 'error';
        this.emitStateChange(deviceId, 'error');

        const streamError = new StreamError(
          StreamErrorCode.CONNECTION_FAILED,
          `所有协议连接失败: ${error instanceof Error ? error.message : String(error)}`,
          deviceId,
          error instanceof Error ? error : undefined
        );

        this.emitError(streamError);
        throw streamError;
      }
    }

    // 不应该到达这里
    throw new StreamError(
      StreamErrorCode.CONNECTION_FAILED,
      '无法建立流连接',
      deviceId
    );
  }

  /**
   * 使用指定协议连接
   */
  private async connectWithProtocol(
    deviceId: string,
    protocol: StreamProtocol,
    config: StreamConfig
  ): Promise<MediaStream> {
    switch (protocol) {
      case 'webrtc':
        return this.connectWebRTC(deviceId, config);
      case 'rtsp':
        return this.connectRTSP(deviceId, config);
      case 'hls':
        return this.connectHLS(deviceId, config);
      default:
        throw new StreamError(
          StreamErrorCode.NOT_SUPPORTED,
          `不支持的协议: ${protocol}`,
          deviceId
        );
    }
  }

  /**
   * WebRTC 连接
   */
  private async connectWebRTC(deviceId: string, config: StreamConfig): Promise<MediaStream> {
    const connection = this.connections.get(deviceId);
    if (!connection) {
      throw new StreamError(
        StreamErrorCode.DEVICE_NOT_FOUND,
        '连接不存在',
        deviceId
      );
    }

    // 创建或获取 WebRTC 服务
    if (!this.webrtcService) {
      const webrtcConfig: Partial<WebRTCConfig> = {
        ...config.webrtc,
        signalingUrl: config.webrtc?.signalingUrl || this.defaultConfig.webrtc?.signalingUrl,
      };

      this.webrtcService = new WebRTCService({
        config: webrtcConfig,
        onStateChange: (event) => this.handleServiceStateChange(deviceId, event),
        onError: (error) => this.handleServiceError(deviceId, error),
        onStatsUpdate: (stats) => this.handleServiceStatsUpdate(deviceId, stats),
      });
    }

    connection.service = this.webrtcService;

    // 连接
    const signalingUrl = config.webrtc?.signalingUrl;
    const stream = await this.webrtcService.connect(deviceId, signalingUrl);

    return stream;
  }

  /**
   * RTSP 连接
   */
  private async connectRTSP(deviceId: string, config: StreamConfig): Promise<MediaStream> {
    const connection = this.connections.get(deviceId);
    if (!connection) {
      throw new StreamError(
        StreamErrorCode.DEVICE_NOT_FOUND,
        '连接不存在',
        deviceId
      );
    }

    // RTSP 需要提供 URL
    if (!config.rtsp?.proxyUrl) {
      throw new StreamError(
        StreamErrorCode.RTSP_URL_INVALID,
        'RTSP URL 未配置',
        deviceId
      );
    }

    // 创建 RTSP 服务
    const rtspConfig: Partial<RtspConfig> = {
      ...config.rtsp,
    };

    const rtspService = new RtspService({
      config: rtspConfig,
      onError: (error) => this.handleServiceError(deviceId, error),
      onStateChange: (state) => this.handleRtspStateChange(deviceId, state),
      onStatsUpdate: (stats) => this.handleServiceStatsUpdate(deviceId, stats),
    });

    connection.service = rtspService;

    // 连接（需要 RTSP URL）
    const rtspUrl = config.rtsp.proxyUrl; // 这里应该是实际的 RTSP URL
    const stream = await rtspService.connect(rtspUrl);

    return stream;
  }

  /**
   * HLS 连接
   */
  private async connectHLS(deviceId: string, config: StreamConfig): Promise<MediaStream> {
    const connection = this.connections.get(deviceId);
    if (!connection) {
      throw new StreamError(
        StreamErrorCode.DEVICE_NOT_FOUND,
        '连接不存在',
        deviceId
      );
    }

    // HLS 需要提供 URL
    if (!config.hls) {
      throw new StreamError(
        StreamErrorCode.HLS_MANIFEST_ERROR,
        'HLS URL 未配置',
        deviceId
      );
    }

    // 创建 HLS 服务
    const hlsConfig: Partial<HlsConfig> = {
      ...config.hls,
    };

    const hlsService = new HlsService({
      config: hlsConfig,
      onError: (error) => this.handleServiceError(deviceId, error),
      onStateChange: (event) => this.handleHlsStateChange(deviceId, event),
    });

    connection.service = hlsService;

    // 加载 HLS 流
    const hlsUrl = (config.hls as any).url; // HLS m3u8 URL
    await hlsService.loadHlsStream(hlsUrl);

    // HLS 不直接返回 MediaStream，需要通过视频元素获取
    // 这里返回空流，实际使用时需要配合视频元素
    return new MediaStream();
  }

  /**
   * 处理服务状态变化
   */
  private handleServiceStateChange(deviceId: string, event: StreamEvent): void {
    const connection = this.connections.get(deviceId);
    if (!connection) return;

    if (event.type === 'stateChange' && event.data) {
      const state = (event.data as { state: StreamState }).state;
      connection.state = state;
      this.emitStateChange(deviceId, state);
    }
  }

  /**
   * 处理 RTSP 状态变化
   */
  private handleRtspStateChange(deviceId: string, state: StreamState): void {
    const connection = this.connections.get(deviceId);
    if (!connection) return;

    connection.state = state;
    this.emitStateChange(deviceId, state);
  }

  /**
   * 处理 HLS 状态变化
   */
  private handleHlsStateChange(deviceId: string, event: any): void {
    const connection = this.connections.get(deviceId);
    if (!connection) return;

    if (event.type === 'stateChange' && event.data) {
      const state = event.data.state as StreamState;
      connection.state = state;
      this.emitStateChange(deviceId, state);
    }
  }

  /**
   * 处理服务错误
   */
  private handleServiceError(deviceId: string, error: StreamError): void {
    const connection = this.connections.get(deviceId);
    if (!connection) return;

    connection.state = 'error';
    this.emitStateChange(deviceId, 'error');
    this.emitError(error);

    // 尝试切换到备选协议
    this.attemptProtocolFallback(deviceId);
  }

  /**
   * 处理服务统计更新
   */
  private handleServiceStatsUpdate(deviceId: string, stats: StreamHealth): void {
    const connection = this.connections.get(deviceId);
    if (!connection) return;

    connection.health = stats;

    // 更新带宽估算历史
    connection.statsHistory.push(stats.network);
    if (connection.statsHistory.length > 10) {
      connection.statsHistory.shift();
    }

    // 计算带宽估算
    connection.lastBandwidthEstimate = this.estimateBandwidth(connection.statsHistory);

    // 通知健康处理器
    this.healthHandlers.forEach(handler => handler(deviceId, stats));
  }

  /**
   * 尝试协议降级
   */
  private async attemptProtocolFallback(deviceId: string): Promise<void> {
    const connection = this.connections.get(deviceId);
    if (!connection || !connection.config.fallbackProtocols) return;

    const currentProtocol = connection.protocol;
    const fallbackProtocols = connection.config.fallbackProtocols;
    const nextProtocolIndex = fallbackProtocols.indexOf(currentProtocol) + 1;

    if (nextProtocolIndex < fallbackProtocols.length) {
      const nextProtocol = fallbackProtocols[nextProtocolIndex];

      try {
        // 关闭当前连接
        await this.destroyStream(deviceId, false);

        // 使用新协议连接
        const stream = await this.connectWithProtocol(deviceId, nextProtocol, connection.config);

        connection.protocol = nextProtocol;
        connection.mediaStream = stream;
        connection.state = 'connected';

        this.emitStateChange(deviceId, 'connected');
      } catch (error) {
        console.error('协议降级失败:', error);
      }
    }
  }

  /**
   * 切换质量级别
   * @param deviceId 设备 ID
   * @param quality 目标质量
   */
  async switchQuality(deviceId: string, quality: QualityLevel): Promise<void> {
    const connection = this.connections.get(deviceId);
    if (!connection) {
      throw new StreamError(
        StreamErrorCode.DEVICE_NOT_FOUND,
        '连接不存在',
        deviceId
      );
    }

    // 检查质量是否在允许范围内
    const adaptiveConfig = connection.config.adaptiveBitrate;
    const minQuality = adaptiveConfig?.minQuality || 'low';
    const maxQuality = adaptiveConfig?.maxQuality || 'ultra';

    const qualityOrder: QualityLevel[] = ['low', 'medium', 'high', 'ultra'];
    const minIndex = qualityOrder.indexOf(minQuality);
    const maxIndex = qualityOrder.indexOf(maxQuality);
    const targetIndex = qualityOrder.indexOf(quality);

    if (targetIndex < minIndex || targetIndex > maxIndex) {
      throw new StreamError(
        StreamErrorCode.INVALID_STATE,
        `质量级别 ${quality} 不在允许范围内`,
        deviceId
      );
    }

    connection.currentQuality = quality;

    // 根据协议类型执行质量切换
    // WebRTC 和 RTSP 通常需要重新协商或重新连接
    // HLS 可以直接切换到不同的流

    this.emitQualityChange(deviceId, quality);
  }

  /**
   * 获取流健康状态
   * @param deviceId 设备 ID
   * @returns StreamHealth
   */
  async getHealth(deviceId: string): Promise<StreamHealth> {
    const connection = this.connections.get(deviceId);
    if (!connection) {
      throw new StreamError(
        StreamErrorCode.DEVICE_NOT_FOUND,
        '连接不存在',
        deviceId
      );
    }

    // 如果有最新的健康数据，直接返回
    if (connection.health) {
      return connection.health;
    }

    // 否则从服务获取
    if (connection.service instanceof WebRTCService) {
      return connection.service.getConnectionStats(deviceId);
    } else if (connection.service instanceof RtspService) {
      return connection.service.getHealth();
    }

    // HLS 没有实时健康数据
    return {
      deviceId,
      protocol: connection.protocol,
      state: connection.state,
      quality: 'unknown',
      network: {
        rtt: 0,
        packetLoss: 0,
        availableBandwidth: 0,
        bytesReceived: 0,
        bytesSent: 0,
        bitrateReceived: 0,
        bitrateSent: 0,
        jitter: 0,
      },
      video: {
        width: 0,
        height: 0,
        frameRate: 0,
        codec: '',
        framesDecoded: 0,
        framesDropped: 0,
        freezeCount: 0,
        totalFreezeDuration: 0,
      },
      audio: {
        sampleRate: 0,
        channels: 0,
        codec: '',
        silenceCount: 0,
        audioLevel: 0,
      },
      lastUpdated: Date.now(),
      reconnectCount: 0,
    };
  }

  /**
   * 启用自适应码率
   * @param deviceId 设备 ID
   */
  enableAdaptiveBitrate(deviceId: string): void {
    const connection = this.connections.get(deviceId);
    if (!connection) return;

    connection.adaptiveBitrateEnabled = true;
    this.startAdaptiveBitrateControl(deviceId);
  }

  /**
   * 禁用自适应码率
   * @param deviceId 设备 ID
   */
  disableAdaptiveBitrate(deviceId: string): void {
    const connection = this.connections.get(deviceId);
    if (!connection) return;

    connection.adaptiveBitrateEnabled = false;

    if (connection.adaptiveBitrateIntervalId) {
      clearInterval(connection.adaptiveBitrateIntervalId);
      connection.adaptiveBitrateIntervalId = undefined;
    }
  }

  /**
   * 启动健康监控
   */
  private startHealthMonitoring(deviceId: string): void {
    const connection = this.connections.get(deviceId);
    if (!connection) return;

    // 每 5 秒检查一次健康状态
    connection.healthCheckIntervalId = window.setInterval(async () => {
      try {
        await this.getHealth(deviceId);
      } catch (error) {
        console.error('健康检查失败:', error);
      }
    }, 5000);
  }

  /**
   * 启动自适应码率控制
   */
  private startAdaptiveBitrateControl(deviceId: string): void {
    const connection = this.connections.get(deviceId);
    if (!connection) return;

    const adaptiveConfig: AdaptiveBitrateConfig = {
      ...DEFAULT_ADAPTIVE_BITRATE_CONFIG,
      ...connection.config.adaptiveBitrate,
    };

    // 每 5 秒评估一次带宽并调整质量
    connection.adaptiveBitrateIntervalId = window.setInterval(() => {
      this.evaluateAndAdjustBitrate(deviceId, adaptiveConfig);
    }, adaptiveConfig.adjustmentInterval);
  }

  /**
   * 评估带宽并调整码率
   */
  private evaluateAndAdjustBitrate(
    deviceId: string,
    config: AdaptiveBitrateConfig
  ): void {
    const connection = this.connections.get(deviceId);
    if (!connection || !connection.health) return;

    const bandwidth = connection.lastBandwidthEstimate;
    const currentQuality = connection.currentQuality;

    // 找到适合当前带宽的质量级别
    const suitableTier = this.findSuitableBitrateTier(bandwidth, config.bitrateTiers);

    if (!suitableTier) return;

    // 检查是否需要调整
    if (suitableTier.quality !== currentQuality) {
      // 检查调整阈值
      const currentTier = config.bitrateTiers.find(t => t.quality === currentQuality);
      if (!currentTier) return;

      const bandwidthDiff = Math.abs(bandwidth - currentTier.maxBitrate) / currentTier.maxBitrate;

      if (bandwidthDiff > config.adjustmentThreshold) {
        // 执行质量切换
        this.switchQuality(deviceId, suitableTier.quality).catch(error => {
          console.error('质量切换失败:', error);
        });
      }
    }
  }

  /**
   * 找到适合带宽的码率层级
   */
  private findSuitableBitrateTier(
    bandwidth: number,
    tiers: BitrateTier[]
  ): BitrateTier | null {
    // 按质量从高到低排序
    const sortedTiers = [...tiers].sort((a, b) => {
      const order: QualityLevel[] = ['ultra', 'high', 'medium', 'low'];
      return order.indexOf(b.quality) - order.indexOf(a.quality);
    });

    // 找到带宽能够支持的最高质量
    for (const tier of sortedTiers) {
      if (bandwidth >= tier.minBitrate) {
        return tier;
      }
    }

    // 返回最低质量
    return sortedTiers[sortedTiers.length - 1] || null;
  }

  /**
   * 估算带宽
   */
  private estimateBandwidth(statsHistory: NetworkStats[]): number {
    if (statsHistory.length === 0) return 0;

    // 使用最近的数据估算带宽
    const recentStats = statsHistory.slice(-5);

    // 计算平均接收比特率
    const avgBitrate = recentStats.reduce((sum, stats) => {
      return sum + stats.bitrateReceived;
    }, 0) / recentStats.length;

    // 结合可用带宽估算
    const availableBandwidth = recentStats[recentStats.length - 1]?.availableBandwidth || 0;

    // 取较大值作为估算带宽
    return Math.max(avgBitrate, availableBandwidth);
  }

  /**
   * 启用弱网优化
   * 包括 NACK（重传）和 FEC（前向纠错）
   */
  enableWeakNetworkOptimization(deviceId: string): void {
    const connection = this.connections.get(deviceId);
    if (!connection) return;

    // WebRTC 的弱网优化通过 PeerConnection 配置实现
    // RTSP 和 HLS 的弱网优化通过代理服务器实现

    // 这里主要是标记启用，实际配置在连接创建时已设置
    connection.config.enableWeakNetworkOptimization = true;
    connection.config.enableNack = true;
    connection.config.enableFec = true;
  }

  /**
   * 销毁流
   * @param deviceId 设备 ID
   * @param emitEvent 是否发送事件
   */
  async destroyStream(deviceId: string, emitEvent: boolean = true): Promise<void> {
    const connection = this.connections.get(deviceId);
    if (!connection) return;

    // 停止监控
    if (connection.healthCheckIntervalId) {
      clearInterval(connection.healthCheckIntervalId);
    }
    if (connection.adaptiveBitrateIntervalId) {
      clearInterval(connection.adaptiveBitrateIntervalId);
    }

    // 停止媒体轨道
    if (connection.mediaStream) {
      connection.mediaStream.getTracks().forEach(track => track.stop());
    }

    // 断开服务连接
    if (connection.service instanceof WebRTCService) {
      connection.service.disconnect(deviceId);
    } else if (connection.service instanceof RtspService) {
      await connection.service.disconnect();
    } else if (connection.service instanceof HlsService) {
      await connection.service.unload();
    }

    // 移除连接记录
    this.connections.delete(deviceId);

    if (emitEvent) {
      this.emitStateChange(deviceId, 'disconnected');
    }
  }

  /**
   * 获取媒体流
   */
  getStream(deviceId: string): MediaStream | null {
    const connection = this.connections.get(deviceId);
    return connection?.mediaStream || null;
  }

  /**
   * 获取当前协议
   */
  getProtocol(deviceId: string): StreamProtocol | null {
    const connection = this.connections.get(deviceId);
    return connection?.protocol || null;
  }

  /**
   * 获取当前质量
   */
  getCurrentQuality(deviceId: string): QualityLevel | null {
    const connection = this.connections.get(deviceId);
    return connection?.currentQuality || null;
  }

  /**
   * 获取所有连接的设备 ID
   */
  getConnectedDevices(): string[] {
    return Array.from(this.connections.keys()).filter(
      deviceId => this.connections.get(deviceId)?.state === 'connected'
    );
  }

  /**
   * 发送状态变化事件
   */
  private emitStateChange(deviceId: string, state: StreamState): void {
    const event: StreamEvent = {
      type: 'stateChange',
      deviceId,
      data: { state },
      timestamp: Date.now(),
    };

    this.eventHandlers.forEach(handler => handler(event));
  }

  /**
   * 发送错误事件
   */
  private emitError(error: StreamError): void {
    this.errorHandlers.forEach(handler => handler(error));
  }

  /**
   * 发送质量变化事件
   */
  private emitQualityChange(deviceId: string, quality: QualityLevel): void {
    this.qualityHandlers.forEach(handler => handler(deviceId, quality));
  }

  /**
   * 添加事件处理器
   */
  addEventHandler(handler: StreamEventHandler): void {
    this.eventHandlers.add(handler);
  }

  /**
   * 移除事件处理器
   */
  removeEventHandler(handler: StreamEventHandler): void {
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
   * 添加健康处理器
   */
  addHealthHandler(handler: (deviceId: string, health: StreamHealth) => void): void {
    this.healthHandlers.add(handler);
  }

  /**
   * 移除健康处理器
   */
  removeHealthHandler(handler: (deviceId: string, health: StreamHealth) => void): void {
    this.healthHandlers.delete(handler);
  }

  /**
   * 添加质量处理器
   */
  addQualityHandler(handler: (deviceId: string, quality: QualityLevel) => void): void {
    this.qualityHandlers.add(handler);
  }

  /**
   * 移除质量处理器
   */
  removeQualityHandler(handler: (deviceId: string, quality: QualityLevel) => void): void {
    this.qualityHandlers.delete(handler);
  }

  /**
   * 销毁管理器，关闭所有连接
   */
  destroy(): void {
    // 关闭所有连接
    this.connections.forEach((_, deviceId) => {
      this.destroyStream(deviceId, false);
    });

    // 销毁服务实例
    if (this.webrtcService) {
      this.webrtcService.destroy();
    }
    if (this.rtspService) {
      this.rtspService.destroy();
    }
    if (this.hlsService) {
      this.hlsService.destroy();
    }

    // 清空处理器
    this.eventHandlers.clear();
    this.errorHandlers.clear();
    this.healthHandlers.clear();
    this.qualityHandlers.clear();
  }
}

export default StreamManager;