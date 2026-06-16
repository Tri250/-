/**
 * Permission Service - 权限管理服务
 *
 * Android/iOS 使用 Capacitor 原生权限 API
 * Web 降级使用浏览器 API
 */

import { platformCheck } from '../lib/platformService';

export type PermissionType = 'camera' | 'microphone' | 'location' | 'storage' | 'notification';

export interface PermissionStatus {
  type: PermissionType;
  granted: boolean;
  denied: boolean;
  prompt: boolean;
  canRequest: boolean;
  lastChecked: Date;
}

export interface PermissionConfig {
  type: PermissionType;
  required: boolean;
  description: string;
  fallbackMessage: string;
  requestMessage: string;
}

const PERMISSION_CONFIGS: Record<PermissionType, PermissionConfig> = {
  camera: {
    type: 'camera',
    required: false,
    description: '用于拍摄宠物照片和视频',
    fallbackMessage: '相机权限未开启，无法使用拍照功能，请手动开启权限',
    requestMessage: '需要相机权限来拍摄宠物照片和视频',
  },
  microphone: {
    type: 'microphone',
    required: false,
    description: '用于录制宠物声音进行翻译',
    fallbackMessage: '麦克风权限未开启，无法使用语音翻译功能，请手动开启权限',
    requestMessage: '需要麦克风权限来录制宠物声音',
  },
  location: {
    type: 'location',
    required: false,
    description: '用于推荐附近的宠物服务',
    fallbackMessage: '位置权限未开启，无法推荐附近服务',
    requestMessage: '需要位置权限来推荐附近的宠物服务',
  },
  storage: {
    type: 'storage',
    required: false,
    description: '用于保存宠物照片和记录',
    fallbackMessage: '存储权限未开启，无法保存照片和记录',
    requestMessage: '需要存储权限来保存宠物照片和记录',
  },
  notification: {
    type: 'notification',
    required: false,
    description: '用于接收健康提醒和通知',
    fallbackMessage: '通知权限未开启，无法接收重要提醒',
    requestMessage: '需要通知权限来接收健康提醒',
  },
};

/**
 * 将 Capacitor 权限状态统一映射
 */
function mapPermissionState(state: string): 'granted' | 'denied' | 'prompt' {
  if (state === 'granted') return 'granted';
  if (state === 'denied') return 'denied';
  return 'prompt';
}

class PermissionManager {
  private permissionStatuses: Map<PermissionType, PermissionStatus> = new Map();
  private denialCallbacks: Map<PermissionType, (() => void)[]> = new Map();

  async checkPermission(type: PermissionType): Promise<PermissionStatus> {
    try {
      // 原生平台：使用 Capacitor 权限 API
      if (platformCheck.isNative()) {
        return this.checkNativePermission(type);
      }

      // Web 降级：使用浏览器 API
      return this.checkWebPermission(type);
    } catch (error) {
      console.warn(`Permission check failed for ${type}:`, error);
      return this.createStatus(type, 'prompt');
    }
  }

  private async checkNativePermission(type: PermissionType): Promise<PermissionStatus> {
    switch (type) {
      case 'camera': {
        const { Camera } = await import('@capacitor/camera');
        const result = await Camera.checkPermissions();
        return this.createStatus(type, mapPermissionState(result.camera));
      }
      case 'microphone': {
        // Capacitor 没有独立的麦克风权限 API，使用 Web API 降级
        return this.checkWebPermission(type);
      }
      case 'notification': {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const result = await LocalNotifications.checkPermissions();
        return this.createStatus(type, mapPermissionState(result.display));
      }
      default:
        return this.checkWebPermission(type);
    }
  }

  private async checkWebPermission(type: PermissionType): Promise<PermissionStatus> {
    if (type === 'camera') {
      try {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        return this.createStatus(type, result.state);
      } catch {
        return this.createStatus(type, 'prompt');
      }
    }

    if (type === 'microphone') {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        return this.createStatus(type, result.state);
      } catch {
        return this.createStatus(type, 'prompt');
      }
    }

    if (type === 'location') {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        return this.createStatus(type, result.state);
      } catch {
        return this.createStatus(type, 'prompt');
      }
    }

    if (type === 'notification') {
      if ('Notification' in window) {
        return this.createStatus(type, Notification.permission as PermissionState);
      }
      return this.createStatus(type, 'denied');
    }

    return this.createStatus(type, 'prompt');
  }

  private createStatus(type: PermissionType, state: PermissionState | string): PermissionStatus {
    const status: PermissionStatus = {
      type,
      granted: state === 'granted',
      denied: state === 'denied',
      prompt: state === 'prompt',
      canRequest: state !== 'denied',
      lastChecked: new Date(),
    };

    this.permissionStatuses.set(type, status);

    if (status.denied) {
      this.notifyDenial(type);
    }

    return status;
  }

  private notifyDenial(type: PermissionType): void {
    const callbacks = this.denialCallbacks.get(type) || [];
    callbacks.forEach(cb => cb());
  }

  async requestPermission(type: PermissionType): Promise<boolean> {
    // 原生平台：使用 Capacitor 原生权限请求
    if (platformCheck.isNative()) {
      return this.requestNativePermission(type);
    }

    // Web 降级
    return this.requestWebPermission(type);
  }

  private async requestNativePermission(type: PermissionType): Promise<boolean> {
    try {
      switch (type) {
        case 'camera': {
          const { Camera } = await import('@capacitor/camera');
          const result = await Camera.requestPermissions();
          return result.camera === 'granted';
        }
        case 'notification': {
          const { LocalNotifications } = await import('@capacitor/local-notifications');
          const result = await LocalNotifications.requestPermissions();
          return result.display === 'granted';
        }
        default:
          return this.requestWebPermission(type);
      }
    } catch (error) {
      console.warn(`Permission request failed for ${type}:`, error);
      return false;
    }
  }

  private async requestWebPermission(type: PermissionType): Promise<boolean> {
    try {
      if (type === 'camera') {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
      }

      if (type === 'microphone') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
      }

      if (type === 'location') {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => resolve(true),
            () => resolve(false),
            { timeout: 10000 }
          );
        });
      }

      if (type === 'notification') {
        if ('Notification' in window) {
          const result = await Notification.requestPermission();
          return result === 'granted';
        }
        return false;
      }

      return false;
    } catch (error) {
      console.warn(`Permission request failed for ${type}:`, error);
      this.handleDenial(type);
      return false;
    }
  }

  private handleDenial(type: PermissionType): void {
    const status = this.permissionStatuses.get(type);
    if (status) {
      status.denied = true;
      status.granted = false;
      status.canRequest = false;
    }
    this.notifyDenial(type);
  }

  onPermissionDenied(type: PermissionType, callback: () => void): void {
    const callbacks = this.denialCallbacks.get(type) || [];
    callbacks.push(callback);
    this.denialCallbacks.set(type, callbacks);
  }

  removeDenialCallback(type: PermissionType, callback: () => void): void {
    const callbacks = this.denialCallbacks.get(type) || [];
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
      this.denialCallbacks.set(type, callbacks);
    }
  }

  getPermissionStatus(type: PermissionType): PermissionStatus | null {
    return this.permissionStatuses.get(type);
  }

  getConfig(type: PermissionType): PermissionConfig {
    return PERMISSION_CONFIGS[type];
  }

  getAllConfigs(): Record<PermissionType, PermissionConfig> {
    return PERMISSION_CONFIGS;
  }

  async checkAllPermissions(): Promise<Map<PermissionType, PermissionStatus>> {
    const types: PermissionType[] = ['camera', 'microphone', 'location', 'notification'];
    await Promise.all(types.map(t => this.checkPermission(t)));
    return this.permissionStatuses;
  }

  isFeatureAvailable(type: PermissionType): boolean {
    const status = this.permissionStatuses.get(type);
    if (!status) return true;
    return status.granted || status.prompt;
  }

  getFallbackMessage(type: PermissionType): string {
    return PERMISSION_CONFIGS[type].fallbackMessage;
  }

  shouldShowPermissionPrompt(type: PermissionType): boolean {
    const status = this.permissionStatuses.get(type);
    if (!status) return true;
    return status.prompt || (status.denied && this.canReRequest(type));
  }

  private canReRequest(type: PermissionType): boolean {
    return type !== 'notification';
  }
}

export const permissionManager = new PermissionManager();

export function usePermission(type: PermissionType) {
  const request = async (): Promise<boolean> => {
    return permissionManager.requestPermission(type);
  };

  const check = async (): Promise<PermissionStatus> => {
    return permissionManager.checkPermission(type);
  };

  const getStatus = (): PermissionStatus | null => {
    return permissionManager.getPermissionStatus(type);
  };

  const isAvailable = (): boolean => {
    return permissionManager.isFeatureAvailable(type);
  };

  const getFallback = (): string => {
    return permissionManager.getFallbackMessage(type);
  };

  return {
    request,
    check,
    getStatus,
    isAvailable,
    getFallback,
    config: permissionManager.getConfig(type),
  };
}