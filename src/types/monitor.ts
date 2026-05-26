export type StreamQuality = 'auto' | '1080p' | '720p' | '480p';

export type EventType = 'behavior' | 'emotion' | 'environment';

export type EventSeverity = 'info' | 'warning' | 'critical';

export interface LiveMonitoring {
  isActive: boolean;
  streamQuality: StreamQuality;
  isRecording: boolean;
  eventDetection: {
    abnormalBehavior: boolean;
    emotionalChange: boolean;
    dangerApproach: boolean;
  };
}

export interface SmartEvent {
  id: string;
  type: EventType;
  severity: EventSeverity;
  description: string;
  cameraId: string;
  timestamp: string;
  petId?: string;
  metadata?: Record<string, any>;
  acknowledged: boolean;
}

export interface RecordingSession {
  id: string;
  cameraId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  fileSize?: number;
  status: 'recording' | 'paused' | 'completed' | 'failed';
  fileUrl?: string;
}

export interface StreamConfig {
  quality: StreamQuality;
  audioEnabled: boolean;
  nightVision: boolean;
  motionDetection: boolean;
  eventRecording: boolean;
}

export interface CameraView {
  cameraId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  gridPosition?: { row: number; col: number };
}

export interface MonitoringAlert {
  id: string;
  eventId: string;
  type: EventType;
  severity: EventSeverity;
  title: string;
  message: string;
  timestamp: string;
  cameraName: string;
  actions: Array<{
    label: string;
    action: string;
    icon?: string;
  }>;
}

export interface PlaybackConfig {
  startTime: string;
  endTime: string;
  speed: number;
  quality: StreamQuality;
}
