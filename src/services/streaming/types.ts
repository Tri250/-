/**
 * 流媒体服务类型定义
 * 支持 WebRTC/RTSP/HLS 多协议
 */

// ==================== 基础类型 ====================

/**
 * 流协议类型
 */
export type StreamProtocol = 'webrtc' | 'rtsp' | 'hls';

/**
 * 流状态
 */
export type StreamState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting';

/**
 * 视频质量级别
 */
export type QualityLevel = 'auto' | 'low' | 'medium' | 'high' | 'ultra';

/**
 * 连接质量
 */
export type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';

// ==================== WebRTC 配置 ====================

/**
 * ICE 服务器配置
 */
export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

/**
 * WebRTC 配置接口
 */
export interface WebRTCConfig {
  /** ICE 服务器列表（STUN/TURN） */
  iceServers: IceServer[];
  /** ICE 传输策略 */
  iceTransportPolicy?: 'all' | 'relay';
  /** 捆绑策略 */
  bundlePolicy?: 'balanced' | 'max-compat' | 'max-bundle';
  /** RTCP 复用策略 */
  rtcpMuxPolicy?: RTCRtcpMuxPolicy;
  /** 是否支持 IPv6 */
  enableIpv6?: boolean;
  /** 是否启用 TCP 候选 */
  enableTcp?: boolean;
  /** 信令服务器 URL */
  signalingUrl?: string;
  /** 连接超时时间（毫秒） */
  connectionTimeout?: number;
  /** 重连间隔（毫秒） */
  reconnectInterval?: number;
  /** 最大重连次数 */
  maxReconnectAttempts?: number;
}

/**
 * 默认 WebRTC 配置
 */
export const DEFAULT_WEBRTC_CONFIG: WebRTCConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
  iceTransportPolicy: 'all',
  bundlePolicy: 'balanced',
  rtcpMuxPolicy: 'require',
  enableIpv6: true,
  enableTcp: true,
  signalingUrl: 'wss://signaling.example.com',
  connectionTimeout: 10000,
  reconnectInterval: 3000,
  maxReconnectAttempts: 5,
};

// ==================== RTSP 配置 ====================

/**
 * RTSP 认证信息
 */
export interface RtspCredentials {
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
}

/**
 * RTSP 连接参数
 */
export interface RtspConfig {
  /** RTSP 代理服务器 WebSocket URL */
  proxyUrl: string;
  /** 连接超时时间（毫秒） */
  connectionTimeout?: number;
  /** 是否自动重连 */
  autoReconnect?: boolean;
  /** 重连间隔（毫秒） */
  reconnectInterval?: number;
  /** 最大重连次数 */
  maxReconnectAttempts?: number;
  /** 是否启用 TCP 传输 */
  useTcp?: boolean;
  /** 缓冲区大小（毫秒） */
  bufferSize?: number;
}

/**
 * 默认 RTSP 配置
 */
export const DEFAULT_RTSP_CONFIG: RtspConfig = {
  proxyUrl: 'wss://rtsp-proxy.example.com',
  connectionTimeout: 15000,
  autoReconnect: true,
  reconnectInterval: 5000,
  maxReconnectAttempts: 3,
  useTcp: true,
  bufferSize: 1000,
};

// ==================== HLS 配置 ====================

/**
 * HLS 分片信息
 */
export interface HlsSegment {
  /** 分片 URL */
  url: string;
  /** 分片时长（秒） */
  duration: number;
  /** 分片序号 */
  sequence: number;
  /** 是否为关键帧 */
  discontinuity?: boolean;
}

/**
 * HLS 播放列表信息
 */
export interface HlsPlaylist {
  /** 是否为直播流 */
  isLive: boolean;
  /** 目标分片时长（秒） */
  targetDuration: number;
  /** 分片列表 */
  segments: HlsSegment[];
  /** 总时长（秒），点播流有效 */
  totalDuration?: number;
  /** 版本号 */
  version: number;
  /** 是否允许缓存 */
  allowCache: boolean;
}

/**
 * HLS 配置
 */
export interface HlsConfig {
  /** 最大缓冲区长度（秒） */
  maxBufferLength?: number;
  /** 最大缓冲区长度（秒）- 追赶播放时 */
  maxMaxBufferLength?: number;
  /** 开始缓冲的阈值（秒） */
  startBufferLength?: number;
  /** 最大跳帧长度（秒） */
  maxSeekHole?: number;
  /** 是否启用低延迟模式 */
  lowLatencyMode?: boolean;
  /** 分片加载超时时间（毫秒） */
  segmentTimeout?: number;
  /** 最大重试次数 */
  maxRetryCount?: number;
  /** 重试延迟（毫秒） */
  retryDelay?: number;
}

/**
 * 默认 HLS 配置
 */
export const DEFAULT_HLS_CONFIG: HlsConfig = {
  maxBufferLength: 30,
  maxMaxBufferLength: 60,
  startBufferLength: 1,
  maxSeekHole: 0.5,
  lowLatencyMode: false,
  segmentTimeout: 10000,
  maxRetryCount: 3,
  retryDelay: 1000,
};

// ==================== 流健康监控 ====================

/**
 * 网络统计信息
 */
export interface NetworkStats {
  /** 往返时延（毫秒） */
  rtt: number;
  /** 丢包率（0-1） */
  packetLoss: number;
  /** 可用带宽（bps） */
  availableBandwidth: number;
  /** 接收字节数 */
  bytesReceived: number;
  /** 发送字节数 */
  bytesSent: number;
  /** 接收比特率（bps） */
  bitrateReceived: number;
  /** 发送比特率（bps） */
  bitrateSent: number;
  /** 抖动（毫秒） */
  jitter: number;
}

/**
 * 视频统计信息
 */
export interface VideoStats {
  /** 视频宽度 */
  width: number;
  /** 视频高度 */
  height: number;
  /** 帧率 */
  frameRate: number;
  /** 编码格式 */
  codec: string;
  /** 解码帧数 */
  framesDecoded: number;
  /** 丢弃帧数 */
  framesDropped: number;
  /** 冻结次数 */
  freezeCount: number;
  /** 总冻结时长（毫秒） */
  totalFreezeDuration: number;
}

/**
 * 音频统计信息
 */
export interface AudioStats {
  /** 采样率 */
  sampleRate: number;
  /** 声道数 */
  channels: number;
  /** 编码格式 */
  codec: string;
  /** 静音次数 */
  silenceCount: number;
  /** 音频电平（0-1） */
  audioLevel: number;
}

/**
 * 流健康监控指标
 */
export interface StreamHealth {
  /** 设备/流 ID */
  deviceId: string;
  /** 协议类型 */
  protocol: StreamProtocol;
  /** 连接状态 */
  state: StreamState;
  /** 连接质量 */
  quality: ConnectionQuality;
  /** 网络统计 */
  network: NetworkStats;
  /** 视频统计 */
  video: VideoStats;
  /** 音频统计 */
  audio: AudioStats;
  /** 连接建立时间 */
  connectedAt?: number;
  /** 最后更新时间 */
  lastUpdated: number;
  /** 错误信息 */
  errorMessage?: string;
  /** 重连次数 */
  reconnectCount: number;
}

// ==================== 自适应码率 ====================

/**
 * 码率层级配置
 */
export interface BitrateTier {
  /** 质量级别 */
  quality: QualityLevel;
  /** 最大码率（bps） */
  maxBitrate: number;
  /** 最小码率（bps） */
  minBitrate: number;
  /** 推荐分辨率 */
  resolution: {
    width: number;
    height: number;
  };
  /** 推荐帧率 */
  frameRate: number;
}

/**
 * 默认码率层级
 */
export const DEFAULT_BITRATE_TIERS: BitrateTier[] = [
  {
    quality: 'low',
    maxBitrate: 300000,
    minBitrate: 100000,
    resolution: { width: 320, height: 240 },
    frameRate: 15,
  },
  {
    quality: 'medium',
    maxBitrate: 800000,
    minBitrate: 300000,
    resolution: { width: 640, height: 480 },
    frameRate: 24,
  },
  {
    quality: 'high',
    maxBitrate: 2000000,
    minBitrate: 800000,
    resolution: { width: 1280, height: 720 },
    frameRate: 30,
  },
  {
    quality: 'ultra',
    maxBitrate: 5000000,
    minBitrate: 2000000,
    resolution: { width: 1920, height: 1080 },
    frameRate: 30,
  },
];

/**
 * 自适应码率配置
 */
export interface AdaptiveBitrateConfig {
  /** 是否启用自适应码率 */
  enabled: boolean;
  /** 码率层级列表 */
  bitrateTiers: BitrateTier[];
  /** 初始质量 */
  initialQuality: QualityLevel;
  /** 最小质量 */
  minQuality: QualityLevel;
  /** 最大质量 */
  maxQuality: QualityLevel;
  /** 调整间隔（毫秒） */
  adjustmentInterval: number;
  /** 码率调整阈值（百分比） */
  adjustmentThreshold: number;
  /** 带宽估算窗口大小 */
  bandwidthEstimationWindow: number;
}

/**
 * 默认自适应码率配置
 */
export const DEFAULT_ADAPTIVE_BITRATE_CONFIG: AdaptiveBitrateConfig = {
  enabled: true,
  bitrateTiers: DEFAULT_BITRATE_TIERS,
  initialQuality: 'medium',
  minQuality: 'low',
  maxQuality: 'ultra',
  adjustmentInterval: 5000,
  adjustmentThreshold: 0.2,
  bandwidthEstimationWindow: 10,
};

// ==================== 流配置 ====================

/**
 * 流创建配置
 */
export interface StreamConfig {
  /** 设备 ID */
  deviceId: string;
  /** 首选协议 */
  preferredProtocol: StreamProtocol;
  /** 备选协议列表 */
  fallbackProtocols?: StreamProtocol[];
  /** WebRTC 配置 */
  webrtc?: Partial<WebRTCConfig>;
  /** RTSP 配置 */
  rtsp?: Partial<RtspConfig>;
  /** HLS 配置 */
  hls?: Partial<HlsConfig>;
  /** 自适应码率配置 */
  adaptiveBitrate?: Partial<AdaptiveBitrateConfig>;
  /** 是否启用弱网优化 */
  enableWeakNetworkOptimization?: boolean;
  /** 是否启用 FEC（前向纠错） */
  enableFec?: boolean;
  /** 是否启用 NACK（重传） */
  enableNack?: boolean;
  /** 是否启用音频 */
  enableAudio?: boolean;
  /** 是否启用视频 */
  enableVideo?: boolean;
}

/**
 * 默认流配置
 */
export const DEFAULT_STREAM_CONFIG: Partial<StreamConfig> = {
  preferredProtocol: 'webrtc',
  fallbackProtocols: ['rtsp', 'hls'],
  enableWeakNetworkOptimization: true,
  enableFec: true,
  enableNack: true,
  enableAudio: true,
  enableVideo: true,
};

// ==================== 信令消息 ====================

/**
 * 信令消息类型
 */
export type SignalingMessageType =
  | 'offer'
  | 'answer'
  | 'ice-candidate'
  | 'connect'
  | 'disconnect'
  | 'error'
  | 'ping'
  | 'pong';

/**
 * 信令消息基类
 */
export interface SignalingMessage {
  type: SignalingMessageType;
  deviceId: string;
  timestamp: number;
}

/**
 * SDP 信令消息
 */
export interface SdpSignalingMessage extends SignalingMessage {
  type: 'offer' | 'answer';
  sdp: RTCSessionDescriptionInit;
}

/**
 * ICE 候选信令消息
 */
export interface IceSignalingMessage extends SignalingMessage {
  type: 'ice-candidate';
  candidate: RTCIceCandidateInit;
}

/**
 * 连接信令消息
 */
export interface ConnectSignalingMessage extends SignalingMessage {
  type: 'connect';
  token?: string;
  metadata?: Record<string, unknown>;
}

/**
 * 错误信令消息
 */
export interface ErrorSignalingMessage extends SignalingMessage {
  type: 'error';
  code: number;
  message: string;
}

// ==================== 事件类型 ====================

/**
 * 流事件类型
 */
export type StreamEventType =
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'stateChange'
  | 'qualityChange'
  | 'statsUpdate'
  | 'trackAdded'
  | 'trackRemoved';

/**
 * 流事件处理器
 */
export type StreamEventHandler = (event: StreamEvent) => void;

/**
 * 流事件
 */
export interface StreamEvent {
  type: StreamEventType;
  deviceId: string;
  data?: unknown;
  timestamp: number;
}

// ==================== 播放信息 ====================

/**
 * 播放状态
 */
export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';

/**
 * 播放信息
 */
export interface PlaybackInfo {
  /** 当前状态 */
  state: PlaybackState;
  /** 当前播放时间（秒） */
  currentTime: number;
  /** 总时长（秒） */
  duration: number;
  /** 缓冲进度（0-1） */
  bufferedProgress: number;
  /** 音量（0-1） */
  volume: number;
  /** 是否静音 */
  muted: boolean;
  /** 播放速率 */
  playbackRate: number;
  /** 当前质量 */
  quality: QualityLevel;
  /** 可用质量列表 */
  availableQualities: QualityLevel[];
}

// ==================== 错误类型 ====================

/**
 * 流错误代码
 */
export enum StreamErrorCode {
  // 连接错误
  CONNECTION_FAILED = 1001,
  CONNECTION_TIMEOUT = 1002,
  CONNECTION_CLOSED = 1003,
  SIGNALING_ERROR = 1004,
  
  // WebRTC 错误
  ICE_CONNECTION_FAILED = 2001,
  ICE_GATHERING_FAILED = 2002,
  SDP_ERROR = 2003,
  PEER_CONNECTION_ERROR = 2004,
  
  // RTSP 错误
  RTSP_AUTH_FAILED = 3001,
  RTSP_URL_INVALID = 3002,
  RTSP_STREAM_NOT_FOUND = 3003,
  RTSP_PROXY_ERROR = 3004,
  
  // HLS 错误
  HLS_MANIFEST_ERROR = 4001,
  HLS_SEGMENT_ERROR = 4002,
  HLS_PARSE_ERROR = 4003,
  
  // 通用错误
  NOT_SUPPORTED = 5001,
  PERMISSION_DENIED = 5002,
  DEVICE_NOT_FOUND = 5003,
  INVALID_STATE = 5004,
  UNKNOWN_ERROR = 5999,
}

/**
 * 流错误
 */
export class StreamError extends Error {
  code: StreamErrorCode;
  deviceId?: string;
  originalError?: Error;

  constructor(
    code: StreamErrorCode,
    message: string,
    deviceId?: string,
    originalError?: Error
  ) {
    super(message);
    this.name = 'StreamError';
    this.code = code;
    this.deviceId = deviceId;
    this.originalError = originalError;
  }
}