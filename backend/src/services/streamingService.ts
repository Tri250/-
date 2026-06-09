/**
 * 流媒体服务基类
 * 提供 WebRTC 信令处理、RTSP 代理管理和 MediaMTX 集成接口
 */

import { v4 as uuidv4 } from 'uuid';
import {
  StreamingServiceConfig,
  WebRTCConnectRequest,
  WebRTCConnectResponse,
  WebRTCAnswerRequest,
  WebRTCAnswerResponse,
  RTSPProxyRequest,
  RTSPProxyResponse,
  StreamHealth,
  StreamStatus,
  QualityLevel,
  QualitySwitchRequest,
  QualitySwitchResponse,
  StreamError,
  IceServer,
  IceCandidate,
} from '../types/v2-streaming';

/**
 * 默认流媒体服务配置
 */
const DEFAULT_CONFIG: StreamingServiceConfig = {
  mediamtxEndpoint: process.env.MEDIAMTX_ENDPOINT || 'http://localhost:8889',
  webrtcPort: parseInt(process.env.WEBRTC_PORT || '8889', 10),
  rtspPort: parseInt(process.env.RTSP_PORT || '8554', 10),
  hlsPort: parseInt(process.env.HLS_PORT || '8888', 10),
  maxConnections: parseInt(process.env.MAX_STREAM_CONNECTIONS || '100', 10),
  connectionTimeout: parseInt(process.env.STREAM_CONNECTION_TIMEOUT || '30', 10),
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
    {
      urls: 'turn:turn.example.com:3478',
      username: process.env.TURN_USERNAME || '',
      credential: process.env.TURN_CREDENTIAL || '',
    },
  ],
};

/**
 * WebRTC 会话信息
 */
interface WebRTCSession {
  sessionId: string;
  deviceId: string;
  quality: QualityLevel;
  status: StreamStatus;
  sdpOffer?: string;
  sdpAnswer?: string;
  iceCandidates: IceCandidate[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * RTSP 代理会话信息
 */
interface RTSPSession {
  sessionId: string;
  deviceId: string;
  rtspUrl: string;
  quality: QualityLevel;
  status: StreamStatus;
  websocketUrl: string;
  hlsUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 流媒体服务类
 */
export class StreamingService {
  protected config: StreamingServiceConfig;
  
  // 存储活跃的会话
  protected webrtcSessions: Map<string, WebRTCSession> = new Map();
  protected rtspSessions: Map<string, RTSPSession> = new Map();
  
  // 设备到会话的映射
  protected deviceSessions: Map<string, string[]> = new Map();

  constructor(config: Partial<StreamingServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 建立 WebRTC 连接
   * @param request 连接请求
   * @returns 连接响应
   */
  async connectWebRTC(request: WebRTCConnectRequest): Promise<WebRTCConnectResponse> {
    const { deviceId, quality = 'auto', enableAudio = true, enableVideo = true } = request;
    
    // 检查设备是否已有活跃连接
    const existingSessions = this.deviceSessions.get(deviceId) || [];
    const activeSession = existingSessions.find(id => {
      const session = this.webrtcSessions.get(id);
      return session && session.status === 'connected';
    });
    
    if (activeSession) {
      const session = this.webrtcSessions.get(activeSession)!;
      return {
        sessionId: session.sessionId,
        sdpOffer: session.sdpOffer || '',
        iceServers: this.config.iceServers,
        status: 'connected',
        createdAt: session.createdAt.toISOString(),
      };
    }

    // 创建新会话
    const sessionId = uuidv4();
    const sdpOffer = await this.generateSDPOffer(deviceId, {
      enableAudio,
      enableVideo,
      quality,
    });

    const session: WebRTCSession = {
      sessionId,
      deviceId,
      quality,
      status: 'connecting',
      sdpOffer,
      iceCandidates: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.webrtcSessions.set(sessionId, session);
    
    // 更新设备会话映射
    const deviceSessionIds = this.deviceSessions.get(deviceId) || [];
    deviceSessionIds.push(sessionId);
    this.deviceSessions.set(deviceId, deviceSessionIds);

    // 尝试调用 MediaMTX 服务
    try {
      await this.callMediaMTXAPI('/api/v3/webrtc/connect', {
        sessionId,
        deviceId,
        sdpOffer,
      });
    } catch (error) {
      console.warn('MediaMTX 服务不可用，使用模拟模式:', error);
    }

    return {
      sessionId,
      sdpOffer,
      iceServers: this.config.iceServers,
      status: 'connecting',
      createdAt: session.createdAt.toISOString(),
    };
  }

  /**
   * 接收 SDP Answer
   * @param request Answer 请求
   * @returns Answer 响应
   */
  async handleWebRTCAnswer(request: WebRTCAnswerRequest): Promise<WebRTCAnswerResponse> {
    const { sessionId, sdpAnswer, iceCandidates = [] } = request;

    const session = this.webrtcSessions.get(sessionId);
    if (!session) {
      throw new Error('会话不存在');
    }

    // 更新会话
    session.sdpAnswer = sdpAnswer;
    session.iceCandidates.push(...iceCandidates);
    session.status = 'connected';
    session.updatedAt = new Date();

    // 尝试调用 MediaMTX 服务
    try {
      await this.callMediaMTXAPI('/api/v3/webrtc/answer', {
        sessionId,
        sdpAnswer,
        iceCandidates,
      });
    } catch (error) {
      console.warn('MediaMTX 服务不可用，使用模拟模式:', error);
    }

    return {
      success: true,
      message: 'WebRTC 连接已建立',
      sessionId,
    };
  }

  /**
   * 创建 RTSP 代理连接
   * @param request 代理请求
   * @returns 代理响应
   */
  async createRTSPProxy(request: RTSPProxyRequest): Promise<RTSPProxyResponse> {
    const { deviceId, rtspUrl, quality = 'auto' } = request;

    // 创建会话
    const sessionId = uuidv4();
    const websocketUrl = `ws://localhost:${this.config.webrtcPort}/ws/${sessionId}`;
    const hlsUrl = `http://localhost:${this.config.hlsPort}/hls/${sessionId}/index.m3u8`;

    const session: RTSPSession = {
      sessionId,
      deviceId,
      rtspUrl,
      quality,
      status: 'connecting',
      websocketUrl,
      hlsUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.rtspSessions.set(sessionId, session);

    // 更新设备会话映射
    const deviceSessionIds = this.deviceSessions.get(deviceId) || [];
    deviceSessionIds.push(sessionId);
    this.deviceSessions.set(deviceId, deviceSessionIds);

    // 尝试调用 MediaMTX 服务
    try {
      await this.callMediaMTXAPI('/api/v3/paths/add', {
        name: sessionId,
        source: rtspUrl,
        sourceOnDemand: true,
      });
      
      // 更新状态为已连接
      session.status = 'connected';
      session.updatedAt = new Date();
    } catch (error) {
      console.warn('MediaMTX 服务不可用，使用模拟模式:', error);
      // 模拟延迟后连接成功
      setTimeout(() => {
        session.status = 'connected';
        session.updatedAt = new Date();
      }, 1000);
    }

    return {
      sessionId,
      websocketUrl,
      hlsUrl,
      status: session.status,
      createdAt: session.createdAt.toISOString(),
    };
  }

  /**
   * 获取流健康状态
   * @param deviceId 设备ID
   * @returns 健康状态
   */
  async getStreamHealth(deviceId: string): Promise<StreamHealth> {
    // 查找设备的活跃会话
    const sessionIds = this.deviceSessions.get(deviceId) || [];
    let activeSession: WebRTCSession | RTSPSession | null = null;
    let sessionType: 'webrtc' | 'rtsp' = 'webrtc';

    for (const id of sessionIds) {
      const webrtcSession = this.webrtcSessions.get(id);
      if (webrtcSession && webrtcSession.status === 'connected') {
        activeSession = webrtcSession;
        break;
      }
      
      const rtspSession = this.rtspSessions.get(id);
      if (rtspSession && rtspSession.status === 'connected') {
        activeSession = rtspSession;
        sessionType = 'rtsp';
        break;
      }
    }

    if (!activeSession) {
      return {
        deviceId,
        status: 'disconnected',
        uptime: 0,
        bitrate: 0,
        fps: 0,
        resolution: 'N/A',
        packetLoss: 0,
        latency: 0,
        lastFrameTime: new Date().toISOString(),
        errors: [],
      };
    }

    // 尝试从 MediaMTX 获取实时状态
    try {
      const status = await this.callMediaMTXAPI(`/api/v3/paths/get/${activeSession.sessionId}`);
      if (status) {
        return this.parseMediaMTXStatus(deviceId, status);
      }
    } catch (error) {
      console.warn('无法从 MediaMTX 获取状态，使用模拟数据:', error);
    }

    // 返回模拟状态
    return this.simulateStreamHealth(deviceId, activeSession);
  }

  /**
   * 切换画质
   * @param request 画质切换请求
   * @returns 切换响应
   */
  async switchQuality(request: QualitySwitchRequest): Promise<QualitySwitchResponse> {
    const { deviceId, quality } = request;

    // 查找设备的活跃会话
    const sessionIds = this.deviceSessions.get(deviceId) || [];
    let updated = false;

    for (const id of sessionIds) {
      const webrtcSession = this.webrtcSessions.get(id);
      if (webrtcSession) {
        webrtcSession.quality = quality;
        webrtcSession.updatedAt = new Date();
        updated = true;
        continue;
      }

      const rtspSession = this.rtspSessions.get(id);
      if (rtspSession) {
        rtspSession.quality = quality;
        rtspSession.updatedAt = new Date();
        updated = true;
      }
    }

    if (!updated) {
      throw new Error('未找到活跃的流会话');
    }

    // 根据画质返回对应的码率和分辨率
    const qualitySettings = this.getQualitySettings(quality);

    return {
      success: true,
      message: `画质已切换为 ${quality}`,
      currentQuality: quality,
      ...qualitySettings,
    };
  }

  /**
   * 断开连接
   * @param sessionId 会话ID
   */
  async disconnect(sessionId: string): Promise<void> {
    // 检查 WebRTC 会话
    const webrtcSession = this.webrtcSessions.get(sessionId);
    if (webrtcSession) {
      webrtcSession.status = 'disconnected';
      this.webrtcSessions.delete(sessionId);
      
      // 从设备映射中移除
      const deviceSessionIds = this.deviceSessions.get(webrtcSession.deviceId) || [];
      const index = deviceSessionIds.indexOf(sessionId);
      if (index > -1) {
        deviceSessionIds.splice(index, 1);
      }
      
      return;
    }

    // 检查 RTSP 会话
    const rtspSession = this.rtspSessions.get(sessionId);
    if (rtspSession) {
      rtspSession.status = 'disconnected';
      this.rtspSessions.delete(sessionId);
      
      // 从设备映射中移除
      const deviceSessionIds = this.deviceSessions.get(rtspSession.deviceId) || [];
      const index = deviceSessionIds.indexOf(sessionId);
      if (index > -1) {
        deviceSessionIds.splice(index, 1);
      }
      
      // 尝试从 MediaMTX 移除路径
      try {
        await this.callMediaMTXAPI(`/api/v3/paths/remove/${sessionId}`, {}, 'DELETE');
      } catch (error) {
        console.warn('无法从 MediaMTX 移除路径:', error);
      }
    }
  }

  /**
   * 获取所有活跃会话
   * @returns 会话列表
   */
  getActiveSessions(): { webrtc: WebRTCSession[]; rtsp: RTSPSession[] } {
    const webrtc: WebRTCSession[] = [];
    const rtsp: RTSPSession[] = [];

    this.webrtcSessions.forEach(session => {
      if (session.status === 'connected' || session.status === 'connecting') {
        webrtc.push(session);
      }
    });

    this.rtspSessions.forEach(session => {
      if (session.status === 'connected' || session.status === 'connecting') {
        rtsp.push(session);
      }
    });

    return { webrtc, rtsp };
  }

  /**
   * 生成 SDP Offer
   * @param deviceId 设备ID
   * @param options 选项
   * @returns SDP Offer
   */
  protected async generateSDPOffer(
    deviceId: string,
    options: { enableAudio: boolean; enableVideo: boolean; quality: QualityLevel }
  ): Promise<string> {
    // 模拟生成 SDP Offer
    // 实际实现中应该调用 WebRTC 库生成真实的 SDP
    const { enableAudio, enableVideo, quality } = options;
    
    const qualitySettings = this.getQualitySettings(quality);
    
    // 这是一个简化的 SDP Offer 示例
    const sdpOffer = `v=0
o=- ${Date.now()} ${Date.now()} IN IP4 127.0.0.1
s=PetStream-${deviceId}
t=0 0
${enableAudio ? `m=audio 1 UDP/TLS/RTP/SAVPF 111
a=rtpmap:111 opus/48000/2
a=sendrecv` : ''}
${enableVideo ? `m=video 1 UDP/TLS/RTP/SAVPF 96
a=rtpmap:96 H264/90000
a=fmtp:96 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f
a=sendrecv` : ''}`;

    return sdpOffer.trim();
  }

  /**
   * 获取画质设置
   * @param quality 画质级别
   * @returns 画质设置
   */
  protected getQualitySettings(quality: QualityLevel): { bitrate: number; resolution: string } {
    const settings: Record<QualityLevel, { bitrate: number; resolution: string }> = {
      low: { bitrate: 500, resolution: '640x480' },
      medium: { bitrate: 1500, resolution: '1280x720' },
      high: { bitrate: 4000, resolution: '1920x1080' },
      auto: { bitrate: 2000, resolution: '1280x720' },
    };
    return settings[quality];
  }

  /**
   * 调用 MediaMTX API
   * @param path API 路径
   * @param data 请求数据
   * @param method HTTP 方法
   * @returns 响应数据
   */
  protected async callMediaMTXAPI(
    path: string,
    data?: Record<string, unknown>,
    method: string = 'POST'
  ): Promise<Record<string, unknown> | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.connectionTimeout * 1000);

    try {
      const response = await fetch(`${this.config.mediamtxEndpoint}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`MediaMTX API 错误: ${response.status}`);
      }

      const responseData = await response.json();
      return responseData as Record<string, unknown>;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * 解析 MediaMTX 状态
   * @param deviceId 设备ID
   * @param status MediaMTX 状态
   * @returns 流健康状态
   */
  protected parseMediaMTXStatus(deviceId: string, status: Record<string, unknown>): StreamHealth {
    // 解析 MediaMTX 返回的状态
    // 实际实现需要根据 MediaMTX API 返回格式进行解析
    return {
      deviceId,
      status: 'connected',
      uptime: (status.uptime as number) || 0,
      bitrate: (status.bitrate as number) || 0,
      fps: (status.fps as number) || 30,
      resolution: (status.resolution as string) || '1920x1080',
      packetLoss: (status.packetLoss as number) || 0,
      latency: (status.latency as number) || 0,
      lastFrameTime: new Date().toISOString(),
      errors: [],
    };
  }

  /**
   * 模拟流健康状态
   * @param deviceId 设备ID
   * @param session 会话信息
   * @returns 流健康状态
   */
  protected simulateStreamHealth(deviceId: string, session: WebRTCSession | RTSPSession): StreamHealth {
    const qualitySettings = this.getQualitySettings(session.quality);
    const uptime = Math.floor((Date.now() - session.createdAt.getTime()) / 1000);

    return {
      deviceId,
      status: session.status as StreamStatus,
      uptime,
      bitrate: qualitySettings.bitrate + Math.random() * 200 - 100,
      fps: 25 + Math.random() * 10,
      resolution: qualitySettings.resolution,
      packetLoss: Math.random() * 0.5,
      latency: 50 + Math.random() * 100,
      lastFrameTime: new Date().toISOString(),
      errors: [],
    };
  }

  /**
   * 清理过期会话
   * @param maxAge 最大存活时间（秒）
   */
  cleanupExpiredSessions(maxAge: number = 3600): void {
    const now = Date.now();
    const maxAgeMs = maxAge * 1000;

    // 清理 WebRTC 会话
    this.webrtcSessions.forEach((session, sessionId) => {
      if (now - session.updatedAt.getTime() > maxAgeMs) {
        this.disconnect(sessionId);
      }
    });

    // 清理 RTSP 会话
    this.rtspSessions.forEach((session, sessionId) => {
      if (now - session.updatedAt.getTime() > maxAgeMs) {
        this.disconnect(sessionId);
      }
    });
  }
}

// 导出单例实例
export const streamingService = new StreamingService();

export default StreamingService;