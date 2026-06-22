import { registerPlugin } from '@capacitor/core';

export interface PawSyncCameraPlugin {
  checkCameraPermission(): Promise<{ granted: boolean }>;
  requestCameraPermission(): Promise<{ granted: boolean }>;
  getAvailableCameras(): Promise<{ cameras: string[] }>;
  openCamera(options: { cameraId: string }): Promise<void>;
  closeCamera(): Promise<void>;
  startPreview(): Promise<void>;
  stopPreview(): Promise<void>;
  takePhoto(options?: { quality?: number }): Promise<{ filePath: string }>;
}

export interface PawSyncAudioPlugin {
  checkMicrophonePermission(): Promise<{ granted: boolean }>;
  requestMicrophonePermission(): Promise<{ granted: boolean }>;
  startRecording(): Promise<void>;
  stopRecording(): Promise<{ filePath: string }>;
  getAudioLevel(): Promise<{ level: number }>;
  analyzeAudio(options: { data: number[]; sampleRate: number; petType?: string }): Promise<{
    scores: Record<string, number>;
    primaryEmotion: string;
    confidence: number;
    intensity: number;
    translation: string;
    pitch: number;
    categoryIndex?: number;
  }>;
}

export interface PawSyncNotificationPlugin {
  createNotificationChannel(options: {
    id: string;
    name: string;
    description?: string;
    importance?: number;
  }): Promise<void>;
  showNotification(options: {
    id: string;
    title: string;
    body: string;
    type?: string;
  }): Promise<void>;
  cancelNotification(options: { id: string }): Promise<void>;
  cancelAllNotifications(): Promise<void>;
  checkPermission(): Promise<{ granted: boolean }>;
  requestPermission(): Promise<{ granted: boolean }>;
}

export interface PawSyncFileStoragePlugin {
  checkStoragePermission(): Promise<{ granted: boolean }>;
  requestStoragePermission(): Promise<{ granted: boolean }>;
  saveFile(options: { data: number[]; fileName: string; folder?: string }): Promise<{ success: boolean; filePath?: string }>;
  saveImage(options: { data: number[]; fileName: string }): Promise<{ success: boolean; filePath?: string }>;
  readFile(options: { filePath: string }): Promise<{ data: number[] }>;
  deleteFile(options: { filePath: string }): Promise<{ success: boolean }>;
  listFiles(options: { folder?: string }): Promise<{ files: string[] }>;
  getStorageUsage(): Promise<{ used: number }>;
}

export interface PawSyncHealthPlugin {
  addHealthRecord(options: { petId: string; type: string; tags: string; notes: string; isImportant: boolean }): Promise<{ id: number }>;
  getHealthRecords(options: { petId: string; limit?: number }): Promise<{ records: any[] }>;
  addHealthMetric(options: { petId: string; type: string; value: number; unit: string }): Promise<{ id: number }>;
  getHealthMetrics(options: { petId: string; type?: string; days?: number }): Promise<{ metrics: any[] }>;
  addHealthAlert(options: { petId: string; type: string; severity: string; message: string; recommendation?: string }): Promise<{ id: number }>;
  getHealthAlerts(options: { petId: string }): Promise<{ alerts: any[] }>;
  acknowledgeAlert(options: { alertId: number }): Promise<{ success: boolean }>;
  calculateHealthScore(options: { petId: string }): Promise<{ score: number; diet?: number; activity?: number; sleep?: number; medical?: number }>;
}

export interface PawSyncPermissionPlugin {
  checkPermission(options: { permission: string }): Promise<{ granted: boolean }>;
  requestPermission(options: { permission: string }): Promise<{ granted: boolean }>;
  requestPermissions(options: { permissions: string[] }): Promise<{ results: Record<string, boolean> }>;
  checkAllPermissions(): Promise<{ results: Record<string, boolean> }>;
  shouldShowRequestPermissionRationale(options: { permission: string }): Promise<{ shouldShow: boolean }>;
}

export const PawSyncCamera = registerPlugin<PawSyncCameraPlugin>('PawSyncCamera', {
  web: () => import('./web/camera').then(m => m.PawSyncCameraWeb),
});

export const PawSyncAudio = registerPlugin<PawSyncAudioPlugin>('PawSyncAudio', {
  web: () => import('./web/audio').then(m => m.PawSyncAudioWeb),
});

export const PawSyncNotification = registerPlugin<PawSyncNotificationPlugin>('PawSyncNotification', {
  web: () => import('./web/notification').then(m => m.PawSyncNotificationWeb),
});

export const PawSyncFileStorage = registerPlugin<PawSyncFileStoragePlugin>('PawSyncFileStorage', {
  web: () => import('./web/fileStorage').then(m => m.PawSyncFileStorageWeb),
});

export const PawSyncHealth = registerPlugin<PawSyncHealthPlugin>('PawSyncHealth', {
  web: () => import('./web/health').then(m => m.PawSyncHealthWeb),
});

export const PawSyncPermission = registerPlugin<PawSyncPermissionPlugin>('PawSyncPermission', {
  web: () => import('./web/permission').then(m => m.PawSyncPermissionWeb),
});