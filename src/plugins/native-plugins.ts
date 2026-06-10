/**
 * Android 原生插件类型定义
 * 用于前端调用原生功能
 */

import type { PluginListenerHandle } from '@capacitor/core';

declare global {
  interface CapacitorPlugins {
    GeofenceService: GeofenceServicePlugin;
    MQTTBridge: MQTTBridgePlugin;
    VoiceRecorderService: VoiceRecorderServicePlugin;
    HighlightDetector: HighlightDetectorPlugin;
    DeviceController: DeviceControllerPlugin;
  }
}

// ==================== 地理围栏服务 ====================

export interface GeofenceServicePlugin {
  /**
   * 设置地理围栏
   */
  setupGeofence(options: {
    latitude: number;
    longitude: number;
    radius: number;
    id?: string;
  }): Promise<GeofenceResult>;

  /**
   * 移除地理围栏
   */
  removeGeofence(options: { id: string }): Promise<{ success: boolean; message: string }>;

  /**
   * 注册进入围栏回调
   */
  onGeofenceEnter(
    options: { id: string },
    callback: (result: GeofenceEvent) => void
  ): Promise<PluginListenerHandle>;

  /**
   * 注册离开围栏回调
   */
  onGeofenceExit(
    options: { id: string },
    callback: (result: GeofenceEvent) => void
  ): Promise<PluginListenerHandle>;

  /**
   * 获取所有围栏
   */
  getAllGeofences(): Promise<{ geofenceIds: string[]; count: number }>;

  /**
   * 清除所有围栏
   */
  clearAllGeofences(): Promise<{ success: boolean; message: string }>;
}

export interface GeofenceResult {
  id: string;
  success: boolean;
  message: string;
}

export interface GeofenceEvent {
  geofenceId: string;
  event: 'enter' | 'exit';
  timestamp: number;
}

// ==================== MQTT WebSocket 桥接 ====================

export interface MQTTBridgePlugin {
  /**
   * 连接到 MQTT WebSocket 服务器
   */
  connect(options: {
    serverUrl: string;
    options?: {
      username?: string;
      password?: string;
      token?: string;
      clientId?: string;
    };
  }): Promise<MQTTConnectionResult>;

  /**
   * 发布消息
   */
  publish(options: {
    topic: string;
    message: string;
    qos?: number;
  }): Promise<{ success: boolean; messageId: string }>;

  /**
   * 订阅主题
   */
  subscribe(
    options: { topic: string; qos?: number },
    callback: (result: MQTTMessage) => void
  ): Promise<{ success: boolean; topic: string; subscriptionId: string }>;

  /**
   * 取消订阅
   */
  unsubscribe(options: { topic: string }): Promise<{ success: boolean; message: string }>;

  /**
   * 断开连接
   */
  disconnect(): Promise<{ success: boolean; message: string }>;

  /**
   * 检查连接状态
   */
  isConnected(): Promise<{ connected: boolean; serverUrl: string }>;

  /**
   * 注册连接状态回调
   */
  onConnectionChange(
    callback: (result: MQTTConnectionStatus) => void
  ): Promise<PluginListenerHandle>;
}

export interface MQTTConnectionResult {
  success: boolean;
  message: string;
  clientId: string;
}

export interface MQTTMessage {
  topic: string;
  payload: string;
  timestamp: number;
}

export interface MQTTConnectionStatus {
  status: 'connected' | 'disconnected' | 'error' | 'reconnecting' | 'failed';
  message: string;
  timestamp: number;
}

// ==================== 原生录音服务 ====================

export interface VoiceRecorderServicePlugin {
  /**
   * 开始录音
   */
  startRecording(options?: {
    samplingRate?: number;
    bitRate?: number;
    format?: 'mp4' | 'aac' | 'amr';
  }): Promise<RecordingStartResult>;

  /**
   * 停止录音
   */
  stopRecording(options?: { upload?: boolean }): Promise<RecordingStopResult>;

  /**
   * 获取录音路径
   */
  getRecordingPath(): Promise<RecordingPathResult>;

  /**
   * 获取所有录音
   */
  getAllRecordings(): Promise<{ recordings: RecordingInfo[]; count: number; directory: string }>;

  /**
   * 删除录音
   */
  deleteRecording(options: { path: string }): Promise<{ success: boolean; message: string }>;

  /**
   * 设置上传端点
   */
  setUploadEndpoint(options: { endpoint: string }): Promise<{ success: boolean; message: string }>;

  /**
   * 上传录音
   */
  uploadRecording(options?: { path?: string }): Promise<UploadResult>;

  /**
   * 检查录音状态
   */
  isRecording(): Promise<RecordingStatus>;

  /**
   * 取消录音
   */
  cancelRecording(): Promise<{ success: boolean; message: string }>;
}

export interface RecordingStartResult {
  success: boolean;
  message: string;
  recordingPath: string;
}

export interface RecordingStopResult {
  success: boolean;
  message: string;
  recordingPath: string;
  duration: number;
  fileSize: number;
  fileName: string;
}

export interface RecordingPathResult {
  recordingPath: string;
  exists: boolean;
  fileName?: string;
  fileSize?: number;
}

export interface RecordingInfo {
  name: string;
  path: string;
  size: number;
  lastModified: number;
}

export interface UploadResult {
  success: boolean;
  message: string;
  fileName: string;
  fileSize: number;
}

export interface RecordingStatus {
  isRecording: boolean;
  duration?: number;
  currentPath?: string;
}

// ==================== AI 精彩片段检测 ====================

export interface HighlightDetectorPlugin {
  /**
   * 配置 AI 服务
   */
  configure(options: {
    endpoint?: string;
    apiKey?: string;
    frameInterval?: number;
    confidenceThreshold?: number;
    maxHighlights?: number;
  }): Promise<HighlightConfigResult>;

  /**
   * 检测视频精彩片段
   */
  detectHighlights(options: {
    videoPath: string;
    options?: {
      frameInterval?: number;
      maxFrames?: number;
    };
  }): Promise<HighlightDetectionResult>;

  /**
   * 生成精彩片段
   */
  generateClip(options: {
    videoPath: string;
    startTime: number;
    endTime: number;
    outputPath?: string;
  }): Promise<ClipGenerationResult>;

  /**
   * 分析单帧
   */
  analyzeFrame(options: {
    framePath?: string;
    frameBase64?: string;
  }): Promise<FrameAnalysisResult>;

  /**
   * 批量检测
   */
  batchDetect(options: {
    videoPaths: string[];
  }): Promise<BatchDetectionResult>;

  /**
   * 取消检测
   */
  cancelDetection(): Promise<{ success: boolean; message: string }>;
}

export interface HighlightConfigResult {
  success: boolean;
  message: string;
  endpoint: string;
  frameInterval: number;
  confidenceThreshold: number;
  maxHighlights: number;
}

export interface HighlightDetectionResult {
  success: boolean;
  highlights: Highlight[];
  totalFrames: number;
  videoPath: string;
}

export interface Highlight {
  id: string;
  startTime: number;
  endTime: number;
  confidence: number;
  type: string;
  description: string;
}

export interface ClipGenerationResult {
  success: boolean;
  clipPath?: string;
  startTime: number;
  endTime: number;
  duration: number;
  error?: string;
}

export interface FrameAnalysisResult {
  hasPet?: boolean;
  confidence?: number;
  activity?: string;
  emotion?: string;
}

export interface BatchDetectionResult {
  success: boolean;
  results: BatchVideoResult[];
  totalVideos: number;
}

export interface BatchVideoResult {
  videoPath: string;
  highlights?: Highlight[];
  success: boolean;
  error?: string;
}

// ==================== IoT 设备控制器 ====================

export interface DeviceControllerPlugin {
  /**
   * 发现设备
   */
  discoverDevices(options?: {
    method?: 'bluetooth' | 'lan' | 'all';
    timeout?: number;
  }): Promise<DeviceDiscoveryResult>;

  /**
   * 配对设备
   */
  pairDevice(options: {
    deviceId: string;
    method?: 'bluetooth' | 'wifi';
    config?: {
      ssid?: string;
      password?: string;
    };
  }): Promise<DevicePairResult>;

  /**
   * 发送指令
   */
  sendCommand(options: {
    deviceId: string;
    action: string;
    params?: Record<string, unknown>;
  }): Promise<DeviceCommandResult>;

  /**
   * 获取设备状态
   */
  getDeviceStatus(options?: { deviceId?: string }): Promise<DeviceStatusResult>;

  /**
   * 取消配对
   */
  unpairDevice(options: { deviceId: string }): Promise<{ success: boolean; message: string }>;

  /**
   * 停止设备发现
   */
  stopDiscovery(): Promise<{ success: boolean; message: string; discoveredDevices: number }>;

  /**
   * 获取已配对设备
   */
  getPairedDevices(): Promise<{ devices: PairedDevice[]; count: number }>;

  /**
   * 设置 API 端点
   */
  setApiEndpoint(options: { endpoint: string }): Promise<{ success: boolean; message: string }>;
}

export interface DeviceDiscoveryResult {
  success: boolean;
  method: string;
  devices: DiscoveredDevice[];
  count: number;
}

export interface DiscoveredDevice {
  deviceId: string;
  name: string;
  type: 'bluetooth' | 'lan';
  rssi?: number;
  bondState?: number;
  ip?: string;
  category?: string;
}

export interface DevicePairResult {
  success: boolean;
  message: string;
  deviceId: string;
  error?: string;
}

export interface DeviceCommandResult {
  success: boolean;
  message?: string;
  action?: string;
  error?: string;
}

export interface DeviceStatusResult {
  deviceId?: string;
  devices?: DeviceStatusInfo[];
  count?: number;
  status?: DeviceStatusInfo;
}

export interface DeviceStatusInfo {
  name?: string;
  address?: string;
  ssid?: string;
  paired: boolean;
  online: boolean;
  lastSeen: number;
  lastCommand?: string;
  lastCommandTime?: number;
}

export interface PairedDevice {
  deviceId: string;
  paired: boolean;
  name?: string;
  address?: string;
  ssid?: string;
  online?: boolean;
  lastSeen?: number;
}

// ==================== 导出插件实例 ====================

import { registerPlugin } from '@capacitor/core';

export const GeofenceService = registerPlugin<GeofenceServicePlugin>('GeofenceService');
export const MQTTBridge = registerPlugin<MQTTBridgePlugin>('MQTTBridge');
export const VoiceRecorderService = registerPlugin<VoiceRecorderServicePlugin>('VoiceRecorderService');
export const HighlightDetector = registerPlugin<HighlightDetectorPlugin>('HighlightDetector');
export const DeviceController = registerPlugin<DeviceControllerPlugin>('DeviceController');

export default {
  GeofenceService,
  MQTTBridge,
  VoiceRecorderService,
  HighlightDetector,
  DeviceController,
};