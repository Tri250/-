/**
 * Permission Service - 权限管理服务
 *
 * 统一管理 Web 和 Android/iOS 平台的权限检查和请求
 * 集成 Capacitor 原生权限 API，确保跨平台一致性
 */

import { Capacitor } from '@capacitor/core';
import type { PermissionType, PermissionStatus, PermissionConfig } from '../types/push';

export type PermissionState = 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale' | 'limited';

export interface ExtendedPermissionStatus extends PermissionStatus {
  nativeState?: PermissionState;
  platform: 'web' | 'android' | 'ios';
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
 * 检查是否为原生平台
 */
const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * 获取当前平台
 */
const getCurrentPlatform = (): 'web' | 'android' | 'ios' => {
  if (Capacitor.isNativePlatform()) {
    return Capacitor.getPlatform() as 'android' | 'ios';
  }
  return 'web';
};

class PermissionManager {
  private permissionStatuses: Map<PermissionType, ExtendedPermissionStatus> = new Map();
  private denialCallbacks: Map<PermissionType, (() => void)[]> = new Map();

  /**
   * 检查权限状态（支持原生平台）
   */
  async checkPermission(type: PermissionType): Promise<ExtendedPermissionStatus> {
    const platform = getCurrentPlatform();
    
    try {
      // 原生平台使用 Capacitor API
      if (isNativePlatform()) {
        return await this.checkNativePermission(type, platform);
      }
      
      // Web 平台使用 Web API
      return await this.checkWebPermission(type, platform);
    } catch (error) {
      console.warn(`Permission check failed for ${type}:`, error);
      return this.createStatus(type, 'prompt', platform);
    }
  }

  /**
   * 检查原生平台权限
   */
  private async checkNativePermission(type: PermissionType, platform: 'android' | 'ios'): Promise<ExtendedPermissionStatus> {
    try {
      if (type === 'camera') {
        const { Camera } = await import('@capacitor/camera');
        const status = await Camera.checkPermissions();
        const cameraState = status.camera as PermissionState;
        return this.createStatus(type, this.mapNativeState(cameraState), platform, cameraState);
      }
      
      if (type === 'microphone') {
        // 麦克风权限通常与相机一起检查
        const { Camera } = await import('@capacitor/camera');
        const status = await Camera.checkPermissions();
        // Capacitor Camera 也包含麦克风权限信息
        const micState = (status as any).microphone || status.camera;
        return this.createStatus(type, this.mapNativeState(micState as PermissionState), platform, micState as PermissionState);
      }
      
      if (type === 'notification') {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const status = await LocalNotifications.checkPermissions();
        const displayState = status.display as PermissionState;
        return this.createStatus(type, this.mapNativeState(displayState), platform, displayState);
      }

      if (type === 'storage') {
        // Android 13+ 存储权限已细分，这里简化处理
        return this.createStatus(type, 'granted', platform);
      }

      if (type === 'location') {
        const { Geolocation } = await import('@capacitor/geolocation');
        const status = await Geolocation.checkPermissions();
        const locationState = status.location as PermissionState;
        return this.createStatus(type, this.mapNativeState(locationState), platform, locationState);
      }

      return this.createStatus(type, 'prompt', platform);
    } catch (error) {
      console.warn(`Native permission check failed for ${type}:`, error);
      return this.createStatus(type, 'prompt', platform);
    }
  }

  /**
   * 检查 Web 平台权限
   */
  private async checkWebPermission(type: PermissionType, platform: 'web'): Promise<ExtendedPermissionStatus> {
    try {
      if (type === 'camera') {
        const result = await navigator.permissions.query({ name: 'camera' });
        return this.createStatus(type, result.state, platform);
      }
      
      if (type === 'microphone') {
        const result = await navigator.permissions.query({ name: 'microphone' });
        return this.createStatus(type, result.state, platform);
      }
      
      if (type === 'location') {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        return this.createStatus(type, result.state, platform);
      }

      if (type === 'notification') {
        if ('Notification' in window) {
          const permission = Notification.permission;
          return this.createStatus(type, permission as PermissionState, platform);
        }
        return this.createStatus(type, 'denied', platform);
      }

      return this.createStatus(type, 'prompt', platform);
    } catch (error) {
      console.warn(`Web permission check failed for ${type}:`, error);
      return this.createStatus(type, 'prompt', platform);
    }
  }

  /**
   * 映射原生权限状态到标准状态
   */
  private mapNativeState(state: PermissionState): 'granted' | 'denied' | 'prompt' {
    if (state === 'granted') return 'granted';
    if (state === 'denied') return 'denied';
    if (state === 'prompt-with-rationale' || state === 'limited') return 'prompt';
    return 'prompt';
  }

  /**
   * 创建权限状态对象
   */
  private createStatus(
    type: PermissionType, 
    state: PermissionState, 
    platform: 'web' | 'android' | 'ios',
    nativeState?: PermissionState
  ): ExtendedPermissionStatus {
    const mappedState = this.mapNativeState(state);
    const status: ExtendedPermissionStatus = {
      type,
      granted: mappedState === 'granted',
      denied: mappedState === 'denied',
      prompt: mappedState === 'prompt',
      canRequest: mappedState !== 'denied',
      lastChecked: new Date(),
      nativeState: nativeState || state,
      platform,
    };
    
    this.permissionStatuses.set(type, status);
    
    if (status.denied) {
      this.notifyDenial(type);
    }
    
    return status;
  }

  /**
   * 请求权限（支持原生平台）
   */
  async requestPermission(type: PermissionType): Promise<boolean> {
    const config = PERMISSION_CONFIGS[type];
    
    try {
      // 原生平台使用 Capacitor API
      if (isNativePlatform()) {
        return await this.requestNativePermission(type);
      }
      
      // Web 平台使用 Web API
      return await this.requestWebPermission(type);
    } catch (error) {
      console.warn(`Permission request failed for ${type}:`, error);
      this.handleDenial(type, config);
      return false;
    }
  }

  /**
   * 请求原生平台权限
   */
  private async requestNativePermission(type: PermissionType): Promise<boolean> {
    try {
      if (type === 'camera') {
        const { Camera } = await import('@capacitor/camera');
        const status = await Camera.requestPermissions();
        return status.camera === 'granted';
      }
      
      if (type === 'microphone') {
        // 麦克风权限请求
        const { Camera } = await import('@capacitor/camera');
        const status = await Camera.requestPermissions();
        return status.camera === 'granted' || (status as any).microphone === 'granted';
      }
      
      if (type === 'notification') {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const status = await LocalNotifications.requestPermissions();
        return status.display === 'granted';
      }

      if (type === 'location') {
        const { Geolocation } = await import('@capacitor/geolocation');
        const status = await Geolocation.requestPermissions();
        return status.location === 'granted';
      }

      return false;
    } catch (error) {
      console.warn(`Native permission request failed for ${type}:`, error);
      return false;
    }
  }

  /**
   * 请求 Web 平台权限
   */
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
      console.warn(`Web permission request failed for ${type}:`, error);
      return false;
    }
  }

  private handleDenial(type: PermissionType, _config: PermissionConfig): void {
    const status = this.permissionStatuses.get(type);
    if (status) {
      status.denied = true;
      status.granted = false;
      status.canRequest = false;
    }
    this.notifyDenial(type);
  }

  private notifyDenial(type: PermissionType): void {
    const callbacks = this.denialCallbacks.get(type) || [];
    callbacks.forEach(cb => cb());
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

  getPermissionStatus(type: PermissionType): ExtendedPermissionStatus | null {
    return this.permissionStatuses.get(type);
  }

  getConfig(type: PermissionType): PermissionConfig {
    return PERMISSION_CONFIGS[type];
  }

  getAllConfigs(): Record<PermissionType, PermissionConfig> {
    return PERMISSION_CONFIGS;
  }

  async checkAllPermissions(): Promise<Map<PermissionType, ExtendedPermissionStatus>> {
    const types: PermissionType[] = ['camera', 'microphone', 'location', 'notification'];
    
    for (const type of types) {
      await this.checkPermission(type);
    }
    
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

  /**
   * 打开系统设置页面（仅原生平台）
   */
  async openSettings(): Promise<void> {
    if (isNativePlatform()) {
      try {
        const { AppLauncher } = await import('@capacitor/app-launcher');
        // Android: 打开应用设置
        await AppLauncher.openUrl({ url: 'android.settings.APPLICATION_DETAILS_SETTINGS' });
      } catch (error) {
        console.warn('Failed to open settings:', error);
      }
    }
  }
}

export const permissionManager = new PermissionManager();

/**
 * 权限管理 Hook
 */
export function usePermission(type: PermissionType) {
  const request = async (): Promise<boolean> => {
    return permissionManager.requestPermission(type);
  };

  const check = async (): Promise<ExtendedPermissionStatus> => {
    return permissionManager.checkPermission(type);
  };

  const getStatus = (): ExtendedPermissionStatus | null => {
    return permissionManager.getPermissionStatus(type);
  };

  const isAvailable = (): boolean => {
    return permissionManager.isFeatureAvailable(type);
  };

  const getFallback = (): string => {
    return permissionManager.getFallbackMessage(type);
  };

  const openSettings = async (): Promise<void> => {
    return permissionManager.openSettings();
  };

  return {
    request,
    check,
    getStatus,
    isAvailable,
    getFallback,
    openSettings,
    config: permissionManager.getConfig(type),
    isNative: isNativePlatform(),
    platform: getCurrentPlatform(),
  };
}