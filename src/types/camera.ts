export type CameraBrand = 'xiaomi' | 'huawei' | 'honor';

export type CameraStatus = 'online' | 'offline' | 'connecting' | 'error';

export type StreamQuality = 'auto' | '1080p' | '720p' | '480p';

export interface CameraDevice {
  id: string;
  brand: CameraBrand;
  model: string;
  name: string;
  status: CameraStatus;
  streamUrl: string;
  thumbnailUrl?: string;
  lastOnline?: string;
  location?: string;
}

export interface DeviceConfig {
  brand: CameraBrand;
  deviceCode: string;
  deviceName?: string;
  location?: string;
}

export interface StreamOptions {
  quality: StreamQuality;
  audioEnabled: boolean;
  nightVision: boolean;
}

export interface DeviceCapability {
  brand: CameraBrand;
  supports1080p: boolean;
  supports720p: boolean;
  supports480p: boolean;
  supportsAudio: boolean;
  supportsNightVision: boolean;
  maxResolution: string;
}

export interface CameraError {
  code: string;
  message: string;
  deviceId?: string;
  timestamp: string;
}

export interface PairingProgress {
  stage: 'scanning' | 'connecting' | 'verifying' | 'completed' | 'failed';
  message: string;
  progress: number;
}
