/**
 * WebRTC 流服务
 * 管理 WebRTC 连接、信令、ICE 候选处理
 */

import {
  WebRTCConfig,
  DEFAULT_WEBRTC_CONFIG,
  StreamHealth,
  StreamState,
  ConnectionQuality,
  StreamError,
  StreamErrorCode,
  StreamEventHandler,
  StreamEvent,
  SignalingMessage,
  SdpSignalingMessage,
  IceSignalingMessage,
  NetworkStats,
  VideoStats,
  AudioStats,
} from './types';

/**
 * WebRTC 连接信息
 */
interface WebRTCConnection {
  deviceId: string;
  peerConnection: RTCPeerConnection;
  signalingSocket: WebSocket | null;
  mediaStream: MediaStream | null;
  state: StreamState;
  reconnectAttempts: number;
  connectedAt?: number;
  statsIntervalId?: number;
  lastStats?: StreamHealth;
}

/**
 * WebRTC 服务配置
 */
interface WebRTCServiceOptions {
  config?: Partial<WebRTCConfig>;
  onStateChange?: StreamEventHandler;
  onError?: (error: StreamError) => void;
  onStatsUpdate?: (stats: StreamHealth) => void;
}

/**
 * WebRTC 流服务
 * 处理 WebRTC 连接、信令服务器通信、ICE 候选处理
 */
export class WebRTCService {
  private config: WebRTCConfig;
  private connections: Map<string, WebRTCConnection> = new Map();
  private eventHandlers: Set<StreamEventHandler> = new Set();
  private errorHandlers: Set<(error: StreamError) => void> = new Set();
  private statsHandlers: Set<(stats: StreamHealth) => void> = new Set();

  constructor(options?: WebRTCServiceOptions) {
    this.config = { ...DEFAULT_WEBRTC_CONFIG, ...options?.config };
    
    if (options?.onStateChange) {
      this.eventHandlers.add(options.onStateChange);
    }
    if (options?.onError) {
      this.errorHandlers.add(options.onError);
    }
    if (options?.onStatsUpdate) {
      this.statsHandlers.add(options.onStatsUpdate);
    }
  }

  /**
   * 连接到设备
   * @param deviceId 设备 ID
   * @param signalingUrl 信令服务器 URL（可选，使用配置中的默认值）
   * @returns MediaStream
   */
  async connect(deviceId: string, signalingUrl?: string): Promise<MediaStream> {
    const url = signalingUrl || this.config.signalingUrl;
    
    if (!url) {
      throw new StreamError(
        StreamErrorCode.SIGNALING_ERROR,
        '信令服务器 URL 未配置',
        deviceId
      );
    }

    // 检查是否已存在连接
    const existingConnection = this.connections.get(deviceId);
    if (existingConnection && existingConnection.state === 'connected') {
      if (existingConnection.mediaStream) {
        return existingConnection.mediaStream;
      }
    }

    // 如果正在连接中，等待连接完成
    if (existingConnection && existingConnection.state === 'connecting') {
      return this.waitForConnection(deviceId);
    }

    // 创建新连接
    return this.createConnection(deviceId, url);
  }

  /**
   * 创建新连接
   */
  private async createConnection(deviceId: string, signalingUrl: string): Promise<MediaStream> {
    // 创建 PeerConnection
    const peerConnection = this.createPeerConnection(deviceId);
    
    // 创建信令 WebSocket 连接
    const signalingSocket = await this.createSignalingConnection(deviceId, signalingUrl);
    
    // 创建连接记录
    const connection: WebRTCConnection = {
      deviceId,
      peerConnection,
      signalingSocket,
      mediaStream: null,
      state: 'connecting',
      reconnectAttempts: 0,
    };
    
    this.connections.set(deviceId, connection);
    this.emitStateChange(deviceId, 'connecting');

    try {
      // 发送连接请求
      await this.sendConnectMessage(deviceId, signalingSocket);
      
      // 等待远程流
      const stream = await this.waitForRemoteStream(deviceId);
      
      connection.mediaStream = stream;
      connection.state = 'connected';
      connection.connectedAt = Date.now();
      
      // 启动统计监控
      this.startStatsMonitoring(deviceId);
      
      this.emitStateChange(deviceId, 'connected');
      
      return stream;
    } catch (error) {
      connection.state = 'error';
      this.emitStateChange(deviceId, 'error');
      
      const streamError = new StreamError(
        StreamErrorCode.CONNECTION_FAILED,
        `WebRTC 连接失败: ${error instanceof Error ? error.message : String(error)}`,
        deviceId,
        error instanceof Error ? error : undefined
      );
      
      this.emitError(streamError);
      throw streamError;
    }
  }

  /**
   * 创建 PeerConnection
   */
  private createPeerConnection(deviceId: string): RTCPeerConnection {
    const rtcConfig: RTCConfiguration = {
      iceServers: this.config.iceServers,
      iceTransportPolicy: this.config.iceTransportPolicy,
      bundlePolicy: this.config.bundlePolicy,
      rtcpMuxPolicy: this.config.rtcpMuxPolicy,
    };

    const peerConnection = new RTCPeerConnection(rtcConfig);

    // ICE 候选事件
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.handleIceCandidate(deviceId, event.candidate);
      }
    };

    // ICE 连接状态变化
    peerConnection.oniceconnectionstatechange = () => {
      this.handleIceConnectionStateChange(deviceId, peerConnection.iceConnectionState);
    };

    // 连接状态变化
    peerConnection.onconnectionstatechange = () => {
      this.handleConnectionStateChange(deviceId, peerConnection.connectionState);
    };

    // Track 事件
    peerConnection.ontrack = (event) => {
      this.handleTrack(deviceId, event);
    };

    return peerConnection;
  }

  /**
   * 创建信令服务器连接
   */
  private async createSignalingConnection(
    deviceId: string,
    signalingUrl: string
  ): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(signalingUrl);
      
      socket.onopen = () => {
        resolve(socket);
      };

      socket.onerror = (error) => {
        reject(new StreamError(
          StreamErrorCode.SIGNALING_ERROR,
          '信令服务器连接失败',
          deviceId
        ));
      };

      socket.onmessage = (event) => {
        this.handleSignalingMessage(deviceId, event.data);
      };

      socket.onclose = (event) => {
        this.handleSignalingClose(deviceId, event);
      };
    });
  }

  /**
   * 发送连接消息
   */
  private async sendConnectMessage(deviceId: string, socket: WebSocket): Promise<void> {
    const message: SignalingMessage = {
      type: 'connect',
      deviceId,
      timestamp: Date.now(),
    };

    socket.send(JSON.stringify(message));
  }

  /**
   * 处理信令消息
   */
  private handleSignalingMessage(deviceId: string, data: string): void {
    try {
      const message = JSON.parse(data) as SignalingMessage;
      
      // 验证消息是否属于当前设备
      if (message.deviceId !== deviceId) {
        return;
      }

      switch (message.type) {
        case 'offer':
          this.handleOffer(deviceId, message as SdpSignalingMessage);
          break;
        case 'answer':
          this.handleAnswer(deviceId, message as SdpSignalingMessage);
          break;
        case 'ice-candidate':
          this.handleRemoteIceCandidate(deviceId, message as IceSignalingMessage);
          break;
        case 'error':
          this.handleSignalingError(deviceId, message);
          break;
        case 'ping':
          this.sendPong(deviceId);
          break;
      }
    } catch (error) {
      console.error('解析信令消息失败:', error);
    }
  }

  /**
   * 处理 Offer
   */
  private async handleOffer(deviceId: string, message: SdpSignalingMessage): Promise<void> {
    const connection = this.connections.get(deviceId);
    if (!connection) return;

    try {
      await connection.peerConnection.setRemoteDescription(
        new RTCSessionDescription(message.sdp)
      );
      
      const answer = await connection.peerConnection.createAnswer();
      await connection.peerConnection.setLocalDescription(answer);
      
      // 发送 Answer
      const response: SdpSignalingMessage = {
        type: 'answer',
        deviceId,
        sdp: answer,
        timestamp: Date.now(),
      };
      
      connection.signalingSocket?.send(JSON.stringify(response));
    } catch (error) {
      console.error('处理 Offer 失败:', error);
    }
  }

  /**
   * 处理 Answer
   */
  private async handleAnswer(deviceId: string, message: SdpSignalingMessage): Promise<void> {
    const connection = this.connections.get(deviceId);
    if (!connection) return;

    try {
      await connection.peerConnection.setRemoteDescription(
        new RTCSessionDescription(message.sdp)
      );
    } catch (error) {
      console.error('处理 Answer 失败:', error);
    }
  }

  /**
   * 处理远程 ICE 候选
   */
  private async handleRemoteIceCandidate(
    deviceId: string,
    message: IceSignalingMessage
  ): Promise<void> {
    const connection = this.connections.get(deviceId);
    if (!connection) return;

    try {
      await connection.peerConnection.addIceCandidate(
        new RTCIceCandidate(message.candidate)
      );
    } catch (error) {
      console.error('添加远程 ICE 候选失败:', error);
    }
  }

  /**
   * 处理本地 ICE 候选
   */
  private handleIceCandidate(deviceId: string, candidate: RTCIceCandidate): void {
    const connection = this.connections.get(deviceId);
    if (!connection || !connection.signalingSocket) return;

    const message: IceSignalingMessage = {
      type: 'ice-candidate',
      deviceId,
      candidate: candidate.toJSON(),
      timestamp: Date.now(),
    };

    connection.signalingSocket.send(JSON.stringify(message));
  }

  /**
   * 处理 ICE 连接状态变化
   */
  private handleIceConnectionStateChange(
    deviceId: string,
    state: RTCIceConnectionState
  ): void {
    const connection = this.connections.get(deviceId);
    if (!connection) return;

    switch (state) {
      case 'connected':
      case 'completed':
        connection.state = 'connected';
        this.emitStateChange(deviceId, 'connected');
        break;
      case 'disconnected':
        connection.state = 'disconnected';
        this.emitStateChange(deviceId, 'disconnected');
        // 尝试重连
        this.attemptReconnect(deviceId);
        break;
      case 'failed':
        connection.state = 'error';
        this.emitStateChange(deviceId, 'error');
        this.emitError(new StreamError(
          StreamErrorCode.ICE_CONNECTION_FAILED,
          'ICE 连接失败',
          deviceId
        ));
        break;
      case 'closed':
        connection.state = 'disconnected';
        this.emitStateChange(deviceId, 'disconnected');
        break;
    }
  }

  /**
   * 处理连接状态变化
   */
  private handleConnectionStateChange(
    deviceId: string,
    state: RTCPeerConnectionState
  ): void {
    const connection = this.connections.get(deviceId);
    if (!connection) return;

    switch (state) {
      case 'connected':
        connection.state = 'connected';
        connection.connectedAt = Date.now();
        this.emitStateChange(deviceId, 'connected');
        break;
      case 'disconnected':
        connection.state = 'disconnected';
        this.emitStateChange(deviceId, 'disconnected');
        this.attemptReconnect(deviceId);
        break;
      case 'failed':
        connection.state = 'error';
        this.emitStateChange(deviceId, 'error');
        this.emitError(new StreamError(
          StreamErrorCode.PEER_CONNECTION_ERROR,
          'PeerConnection 连接失败',
          deviceId
        ));
        break;
      case 'closed':
        connection.state = 'disconnected';
        this.emitStateChange(deviceId, 'disconnected');
        break;
    }
  }

  /**
   * 处理 Track 事件
   */
  private handleTrack(deviceId: string, event: RTCTrackEvent): void {
    const connection = this.connections.get(deviceId);
    if (!connection) return;

    const stream = event.streams[0];
    if (stream) {
      connection.mediaStream = stream;
    }
  }

  /**
   * 处理信令错误
   */
  private handleSignalingError(deviceId: string, message: SignalingMessage): void {
    const error = new StreamError(
      StreamErrorCode.SIGNALING_ERROR,
      `信令错误: ${JSON.stringify(message)}`,
      deviceId
    );
    this.emitError(error);
  }

  /**
   * 处理信令连接关闭
   */
  private handleSignalingClose(deviceId: string, event: CloseEvent): void {
    const connection = this.connections.get(deviceId);
    if (!connection) return;

    connection.state = 'disconnected';
    this.emitStateChange(deviceId, 'disconnected');

    // 非正常关闭，尝试重连
    if (event.code !== 1000) {
      this.attemptReconnect(deviceId);
    }
  }

  /**
   * 发送 Pong 响应
   */
  private sendPong(deviceId: string): void {
    const connection = this.connections.get(deviceId);
    if (!connection || !connection.signalingSocket) return;

    const message: SignalingMessage = {
      type: 'pong',
      deviceId,
      timestamp: Date.now(),
    };

    connection.signalingSocket.send(JSON.stringify(message));
  }

  /**
   * 等待远程流
   */
  private waitForRemoteStream(deviceId: string): Promise<MediaStream> {
    return new Promise((resolve, reject) => {
      const connection = this.connections.get(deviceId);
      if (!connection) {
        reject(new StreamError(
          StreamErrorCode.DEVICE_NOT_FOUND,
          '连接不存在',
          deviceId
        ));
        return;
      }

      // 设置超时
      const timeout = setTimeout(() => {
        reject(new StreamError(
          StreamErrorCode.CONNECTION_TIMEOUT,
          '等待远程流超时',
          deviceId
        ));
      }, this.config.connectionTimeout);

      // 监听 track 事件
      connection.peerConnection.ontrack = (event) => {
        clearTimeout(timeout);
        const stream = event.streams[0];
        if (stream) {
          resolve(stream);
        }
      };

      // 检查是否已有流
      const receivers = connection.peerConnection.getReceivers();
      if (receivers.length > 0) {
        const tracks = receivers.map(r => r.track).filter(Boolean);
        if (tracks.length > 0) {
          clearTimeout(timeout);
          resolve(new MediaStream(tracks as MediaStreamTrack[]));
        }
      }
    });
  }

  /**
   * 等待连接完成
   */
  private waitForConnection(deviceId: string): Promise<MediaStream> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new StreamError(
          StreamErrorCode.CONNECTION_TIMEOUT,
          '等待连接超时',
          deviceId
        ));
      }, this.config.connectionTimeout);

      const checkConnection = () => {
        const connection = this.connections.get(deviceId);
        if (connection?.state === 'connected' && connection.mediaStream) {
          clearTimeout(timeout);
          resolve(connection.mediaStream);
        } else if (connection?.state === 'error') {
          clearTimeout(timeout);
          reject(new StreamError(
            StreamErrorCode.CONNECTION_FAILED,
            '连接失败',
            deviceId
          ));
        } else {
          setTimeout(checkConnection, 100);
        }
      };

      checkConnection();
    });
  }

  /**
   * 尝试重连
   */
  private async attemptReconnect(deviceId: string): Promise<void> {
    const connection = this.connections.get(deviceId);
    if (!connection) return;

    if (connection.reconnectAttempts >= (this.config.maxReconnectAttempts || 5)) {
      connection.state = 'error';
      this.emitStateChange(deviceId, 'error');
      this.emitError(new StreamError(
        StreamErrorCode.CONNECTION_FAILED,
        '重连次数已达上限',
        deviceId
      ));
      return;
    }

    connection.state = 'reconnecting';
    this.emitStateChange(deviceId, 'reconnecting');
    connection.reconnectAttempts++;

    // 等待重连间隔
    await new Promise(resolve => 
      setTimeout(resolve, this.config.reconnectInterval)
    );

    try {
      // 关闭旧连接
      this.closeConnection(deviceId, false);
      
      // 重新连接
      const signalingUrl = this.config.signalingUrl;
      if (signalingUrl) {
        await this.createConnection(deviceId, signalingUrl);
      }
    } catch (error) {
      console.error('重连失败:', error);
      // 继续尝试
      this.attemptReconnect(deviceId);
    }
  }

  /**
   * 断开连接
   */
  disconnect(deviceId: string): void {
    this.closeConnection(deviceId, true);
  }

  /**
   * 关闭连接
   */
  private closeConnection(deviceId: string, emitEvent: boolean): void {
    const connection = this.connections.get(deviceId);
    if (!connection) return;

    // 停止统计监控
    if (connection.statsIntervalId) {
      clearInterval(connection.statsIntervalId);
    }

    // 关闭媒体流
    if (connection.mediaStream) {
      connection.mediaStream.getTracks().forEach(track => track.stop());
    }

    // 关闭 PeerConnection
    connection.peerConnection.close();

    // 关闭信令连接
    if (connection.signalingSocket) {
      connection.signalingSocket.close();
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
   * 获取连接统计信息
   */
  async getConnectionStats(deviceId: string): Promise<StreamHealth> {
    const connection = this.connections.get(deviceId);
    if (!connection) {
      throw new StreamError(
        StreamErrorCode.DEVICE_NOT_FOUND,
        '设备连接不存在',
        deviceId
      );
    }

    const stats = await this.collectStats(connection);
    connection.lastStats = stats;
    
    // 通知统计处理器
    this.statsHandlers.forEach(handler => handler(stats));
    
    return stats;
  }

  /**
   * 启动统计监控
   */
  private startStatsMonitoring(deviceId: string): void {
    const connection = this.connections.get(deviceId);
    if (!connection) return;

    // 每 1 秒收集一次统计信息
    connection.statsIntervalId = window.setInterval(async () => {
      try {
        const stats = await this.getConnectionStats(deviceId);
        connection.lastStats = stats;
      } catch (error) {
        console.error('收集统计信息失败:', error);
      }
    }, 1000);
  }

  /**
   * 收集统计信息
   */
  private async collectStats(connection: WebRTCConnection): Promise<StreamHealth> {
    const stats = await connection.peerConnection.getStats();
    
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

    // 解析统计信息
    stats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        videoStats.framesDecoded = report.framesDecoded || 0;
        videoStats.framesDropped = report.framesDropped || 0;
        videoStats.codec = report.codecId || '';
        
        // 计算帧率
        if (report.framesPerSecond) {
          videoStats.frameRate = report.framesPerSecond;
        }
      }

      if (report.type === 'inbound-rtp' && report.kind === 'audio') {
        audioStats.audioLevel = report.audioLevel || 0;
      }

      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        networkStats.rtt = report.currentRoundTripTime * 1000 || 0;
        networkStats.availableBandwidth = report.availableOutgoingBitrate || 0;
      }

      if (report.type === 'transport') {
        networkStats.bytesReceived = report.bytesReceived || 0;
        networkStats.bytesSent = report.bytesSent || 0;
      }
    });

    // 计算连接质量
    const quality = this.calculateConnectionQuality(networkStats);

    return {
      deviceId: connection.deviceId,
      protocol: 'webrtc',
      state: connection.state,
      quality,
      network: networkStats,
      video: videoStats,
      audio: audioStats,
      connectedAt: connection.connectedAt,
      lastUpdated: Date.now(),
      reconnectCount: connection.reconnectAttempts,
    };
  }

  /**
   * 计算连接质量
   */
  private calculateConnectionQuality(networkStats: NetworkStats): ConnectionQuality {
    const { rtt, packetLoss, availableBandwidth } = networkStats;

    // RTT 评分（越低越好）
    let rttScore = 100;
    if (rtt > 300) rttScore = 0;
    else if (rtt > 200) rttScore = 25;
    else if (rtt > 100) rttScore = 50;
    else if (rtt > 50) rttScore = 75;

    // 丢包率评分（越低越好）
    let lossScore = 100;
    if (packetLoss > 0.1) lossScore = 0;
    else if (packetLoss > 0.05) lossScore = 25;
    else if (packetLoss > 0.02) lossScore = 50;
    else if (packetLoss > 0.01) lossScore = 75;

    // 带宽评分（越高越好）
    let bandwidthScore = 100;
    if (availableBandwidth < 300000) bandwidthScore = 25;
    else if (availableBandwidth < 800000) bandwidthScore = 50;
    else if (availableBandwidth < 2000000) bandwidthScore = 75;

    // 综合评分
    const totalScore = (rttScore + lossScore + bandwidthScore) / 3;

    if (totalScore >= 80) return 'excellent';
    if (totalScore >= 60) return 'good';
    if (totalScore >= 40) return 'fair';
    return 'poor';
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
   * 销毁服务，关闭所有连接
   */
  destroy(): void {
    // 关闭所有连接
    this.connections.forEach((_, deviceId) => {
      this.disconnect(deviceId);
    });

    // 清空处理器
    this.eventHandlers.clear();
    this.errorHandlers.clear();
    this.statsHandlers.clear();
  }
}

export default WebRTCService;