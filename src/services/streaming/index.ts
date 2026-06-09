/**
 * 流媒体服务统一导出
 * 支持 WebRTC/RTSP/HLS 多协议
 */

// 类型定义
export {
  // 基础类型
  StreamProtocol,
  StreamState,
  QualityLevel,
  ConnectionQuality,

  // WebRTC 配置
  WebRTCConfig,
  IceServer,
  DEFAULT_WEBRTC_CONFIG,

  // RTSP 配置
  RtspConfig,
  RtspCredentials,
  DEFAULT_RTSP_CONFIG,

  // HLS 配置
  HlsConfig,
  HlsPlaylist,
  HlsSegment,
  DEFAULT_HLS_CONFIG,

  // 流健康监控
  StreamHealth,
  NetworkStats,
  VideoStats,
  AudioStats,

  // 自适应码率
  AdaptiveBitrateConfig,
  BitrateTier,
  DEFAULT_ADAPTIVE_BITRATE_CONFIG,
  DEFAULT_BITRATE_TIERS,

  // 流配置
  StreamConfig,
  DEFAULT_STREAM_CONFIG,

  // 信令消息
  SignalingMessageType,
  SignalingMessage,
  SdpSignalingMessage,
  IceSignalingMessage,
  ConnectSignalingMessage,
  ErrorSignalingMessage,

  // 事件类型
  StreamEventType,
  StreamEventHandler,
  StreamEvent,

  // 播放信息
  PlaybackState,
  PlaybackInfo,

  // 错误类型
  StreamErrorCode,
  StreamError,
} from './types';

// 服务
export { WebRTCService } from './webrtcService';
export { RtspService } from './rtspService';
export { HlsService } from './hlsService';
export { StreamManager } from './streamManager';

// 默认导出
export { StreamManager as default } from './streamManager';