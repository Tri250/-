/* eslint-disable @typescript-eslint/no-explicit-any */
import type { StreamQuality as CameraStreamQuality } from './camera';

export type StreamQuality = CameraStreamQuality;

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

export interface PetDetection {
  id: string;
  cameraId: string;
  timestamp: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
  petType: 'cat' | 'dog' | 'other';
  behavior?: string;
  emotion?: string;
}

export interface BehaviorEvent {
  id: string;
  cameraId: string;
  timestamp: string;
  petId: string;
  behavior: string;
  confidence: number;
  duration?: number;
  thumbnailUrl?: string;
}

export interface EnvironmentData {
  cameraId: string;
  timestamp: string;
  temperature?: number;
  humidity?: number;
  noiseLevel?: number;
  brightness?: number;
}

export interface MonitorLayout {
  type: 'single' | 'split' | 'grid';
  gridSize?: { rows: number; cols: number };
  cameras: string[];
  activeCamera?: string;
}

export interface RecordingMarker {
  id: string;
  timestamp: string;
  type: 'motion' | 'pet' | 'event' | 'manual';
  label: string;
}

export interface TimelineSegment {
  startTime: string;
  endTime: string;
  type: 'recording' | 'motion' | 'pet_activity' | 'empty';
  events?: SmartEvent[];
}

export interface MonitorStats {
  totalRecordingTime: number;
  totalEvents: number;
  petDetections: number;
  motionEvents: number;
  storageUsed: number;
}

export interface StreamHealth {
  cameraId: string;
  latency: number;
  fps: number;
  bitrate: number;
  packetLoss: number;
  status: 'excellent' | 'good' | 'poor' | 'critical';
}
