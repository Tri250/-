// ============================================
// PawSync Pro 3.0 - Camera Monitor Types
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 摄像头监控系统完整类型定义
// ============================================

export type CameraBrand = 'ezviz' | 'tapo' | 'xiaomi' | 'hikvision' | 'dahua' | '360' | 'eufy' | 'haier' | 'onvif' | 'generic';

export type ConnectionProtocol = 'rtsp' | 'onvif' | 'ezopen' | 'webrtc' | 'hls' | 'rtmp';

export interface CameraDevice {
  id: string;
  name: string;
  brand: CameraBrand;
  model: string;
  status: 'online' | 'offline' | 'error' | 'updating';
  lastActive: string;
  thumbnail?: string;
  streamUrl?: string;
  webrtcUrl?: string;
  capabilities: CameraCapability[];
  settings: CameraSettings;
  location?: string;
  ipAddress?: string;
  port?: number;
  protocol: ConnectionProtocol;
  username?: string;
  password?: string;
  accessToken?: string;
  go2rtcId?: string;
}

export interface CameraCapability {
  type: 'live_stream' | 'two_way_audio' | 'ptz' | 'night_vision' | 'motion_detection' | 'cloud_storage' | 'sd_card';
  enabled: boolean;
  settings?: Record<string, any>;
}

export interface CameraSettings {
  resolution: '720p' | '1080p' | '2k' | '4k';
  nightVisionMode: 'auto' | 'on' | 'off' | 'color';
  motionDetection: {
    enabled: boolean;
    sensitivity: number;
    notificationEnabled: boolean;
    detectionZones?: Array<{ x: number; y: number; width: number; height: number }>;
  };
  recording: {
    mode: 'always' | 'motion' | 'schedule' | 'off';
    quality: 'low' | 'medium' | 'high';
    storage: 'cloud' | 'sd' | 'nas';
  };
  audio: {
    enabled: boolean;
    volume: number;
    noiseReduction: boolean;
  };
  aiTracking: {
    enabled: boolean;
    targetType: 'pet' | 'person' | 'all';
    smoothTracking: boolean;
  };
}

export interface LiveStream {
  cameraId: string;
  streamUrl: string;
  thumbnailUrl?: string;
  quality: 'auto' | 'low' | 'medium' | 'high' | 'ultra';
  latency: number;
  startTime: string;
  status: 'connecting' | 'streaming' | 'paused' | 'error';
  currentViewers?: number;
}

export interface PTZControl {
  cameraId: string;
  pan: number;
  tilt: number;
  zoom: number;
  preset?: string;
  speed: number;
}

export interface Recording {
  id: string;
  cameraId: string;
  type: 'motion' | 'manual' | 'scheduled' | 'alert';
  startTime: string;
  endTime: string;
  duration: number;
  thumbnailUrl?: string;
  videoUrl?: string;
  cloudUrl?: string;
  size: number;
  location?: string;
  hasAIAnalysis: boolean;
  aiTags?: string[];
  isFavorite: boolean;
  isProcessed: boolean;
}

export interface MotionAlert {
  id: string;
  cameraId: string;
  timestamp: string;
  type: 'motion' | 'sound' | 'pet_detected' | 'person_detected' | 'intrusion' | 'pet_in_trouble';
  severity: 'low' | 'medium' | 'high' | 'critical';
  thumbnailUrl?: string;
  videoUrl?: string;
  description: string;
  detectedZones?: Array<{ x: number; y: number; width: number; height: number }>;
  petDetected?: {
    type: 'cat' | 'dog' | 'other';
    confidence: number;
    behavior?: string;
  };
  acknowledged: boolean;
  acknowledgedAt?: string;
}

export interface CameraGroup {
  id: string;
  name: string;
  cameras: string[];
  layout: '1x1' | '2x2' | '3x3' | '4x4';
  autoRotate: boolean;
  rotateInterval?: number;
}

export interface CameraPreset {
  id: string;
  cameraId: string;
  name: string;
  position: PTZControl;
  isDefault: boolean;
  icon?: string;
}

export interface PictureInPicture {
  cameraId: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size: 'small' | 'medium' | 'large';
  opacity: number;
  draggable: boolean;
  autoHide: boolean;
  hideTimeout: number;
}

export interface TimeLapseConfig {
  cameraId: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
  interval: number;
  duration: number;
  outputUrl?: string;
}

export interface CameraStatistics {
  cameraId: string;
  date: string;
  totalRecordingTime: number;
  motionEvents: number;
  petDetections: number;
  averageLatency: number;
  storageUsed: number;
  bandwidthUsed: number;
}

export interface EzvizDeviceInfo {
  deviceSerial: string;
  deviceName: string;
  deviceModel: string;
  deviceType: string;
  status: number;
  isOnline: boolean;
  ip: string;
  localIp: string;
  resolution: string;
  supportH265: boolean;
  supportCloud: boolean;
  isEncrypt: boolean;
  capability: {
    ptz: boolean;
    talk: boolean;
    video: boolean;
    audio: boolean;
    sdCard: boolean;
    cloud: boolean;
  };
}

export interface EzvizAccessToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface ONVIFDiscoveryResult {
  ipAddress: string;
  port: number;
  deviceName: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  hardWareId: string;
  scopes: string[];
}

export interface Go2rtcStreamConfig {
  name: string;
  source: string;
  protocols?: string[];
  listen?: string;
  webrtc?: boolean;
  hls?: boolean;
}

export interface Go2rtcServerInfo {
  version: string;
  uptime: number;
  streams: number;
  peers: number;
}

export interface CameraAddRequest {
  name: string;
  brand: CameraBrand;
  protocol: ConnectionProtocol;
  ipAddress?: string;
  port?: number;
  username?: string;
  password?: string;
  accessToken?: string;
  location?: string;
}

export interface CameraDiscoveryState {
  isDiscovering: boolean;
  discoveredDevices: ONVIFDiscoveryResult[];
  lastDiscoveryTime?: string;
}

export interface StreamQuality {
  label: string;
  value: string;
  resolution: string;
  fps: number;
}

export interface CameraShareInfo {
  sharedTo: string[];
  sharedBy?: string;
  permission: 'view' | 'control' | 'admin';
  sharedAt?: string;
}
