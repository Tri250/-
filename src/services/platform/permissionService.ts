// ============================================
// PawSync Pro - Permission Service
//
// 作者: 带娃的小陈工
// 日期: 2026-06-10
// 描述: 跨平台权限管理服务，支持运行时权限检查
// ============================================

import { Camera } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { platformService } from './platformService';

/**
 * 权限类型
 */
export type PermissionType =
  | 'camera'
  | 'microphone'
  | 'photos'
  | 'location'
  | 'notifications'
  | 'storage'
  | 'contacts'
  | 'calendar';

/**
 * 权限状态
 */
export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'limited' | 'unknown';

/**
 * 权限请求结果
 */
export interface PermissionRequestResult {
  granted: boolean;
  status: PermissionStatus;
  canAskAgain: boolean;
}

/**
 * 权限配置
 */
interface PermissionConfig {
  type: PermissionType;
  nativeMethod?: () => Promise<{ permission: string }>;
  nativeRequest?: () => Promise<{ permission: string }>;
  webCheck?: () => Promise<PermissionStatus>;
  webRequest?: () => Promise<PermissionRequestResult>;
}

/**
 * 权限服务类
 */
class PermissionService {
  private permissionCache: Map<PermissionType, PermissionStatus> = new Map();

  /**
   * 检查权限状态
   */
  async check(permission: PermissionType): Promise<PermissionStatus> {
    // 检查缓存
    const cached = this.permissionCache.get(permission);
    if (cached) return cached;

    let status: PermissionStatus = 'unknown';

    try {
      switch (permission) {
        case 'camera':
          status = await this.checkCameraPermission();
          break;
        case 'microphone':
          status = await this.checkMicrophonePermission();
          break;
        case 'photos':
          status = await this.checkPhotosPermission();
          break;
        case 'location':
          status = await this.checkLocationPermission();
          break;
        case 'notifications':
          status = await this.checkNotificationPermission();
          break;
        case 'storage':
          status = await this.checkStoragePermission();
          break;
        default:
          status = 'unknown';
      }
    } catch (error) {
      console.warn(`[Permission] 检查 ${permission} 权限失败:`, error);
      status = 'unknown';
    }

    // 缓存结果
    this.permissionCache.set(permission, status);
    return status;
  }

  /**
   * 请求权限
   */
  async request(permission: PermissionType): Promise<PermissionRequestResult> {
    try {
      let result: PermissionRequestResult;

      switch (permission) {
        case 'camera':
          result = await this.requestCameraPermission();
          break;
        case 'microphone':
          result = await this.requestMicrophonePermission();
          break;
        case 'photos':
          result = await this.requestPhotosPermission();
          break;
        case 'location':
          result = await this.requestLocationPermission();
          break;
        case 'notifications':
          result = await this.requestNotificationPermission();
          break;
        case 'storage':
          result = await this.requestStoragePermission();
          break;
        default:
          result = { granted: false, status: 'unknown', canAskAgain: false };
      }

      // 更新缓存
      this.permissionCache.set(permission, result.status);
      return result;
    } catch (error) {
      console.error(`[Permission] 请求 ${permission} 权限失败:`, error);
      return { granted: false, status: 'unknown', canAskAgain: false };
    }
  }

  /**
   * 批量检查权限
   */
  async checkMultiple(permissions: PermissionType[]): Promise<Record<PermissionType, PermissionStatus>> {
    const results: Record<PermissionType, PermissionStatus> = {} as Record<PermissionType, PermissionStatus>;
    
    for (const permission of permissions) {
      results[permission] = await this.check(permission);
    }
    
    return results;
  }

  /**
   * 批量请求权限
   */
  async requestMultiple(permissions: PermissionType[]): Promise<Record<PermissionType, PermissionRequestResult>> {
    const results: Record<PermissionType, PermissionRequestResult> = {} as Record<PermissionType, PermissionRequestResult>;
    
    for (const permission of permissions) {
      results[permission] = await this.request(permission);
    }
    
    return results;
  }

  /**
   * 清除权限缓存
   */
  clearCache(): void {
    this.permissionCache.clear();
  }

  // ==================== 具体权限检查 ====================

  /**
   * 检查相机权限
   */
  private async checkCameraPermission(): Promise<PermissionStatus> {
    if (platformService.isNative()) {
      try {
        const result = await Camera.checkPermissions();
        return this.mapNativeStatus(result.camera);
      } catch {
        return 'unknown';
      }
    } else {
      // Web 端检查
      try {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        return this.mapWebStatus(result.state);
      } catch {
        return 'prompt';
      }
    }
  }

  /**
   * 请求相机权限
   */
  private async requestCameraPermission(): Promise<PermissionRequestResult> {
    if (platformService.isNative()) {
      try {
        const result = await Camera.requestPermissions();
        const status = this.mapNativeStatus(result.camera);
        return {
          granted: status === 'granted',
          status,
          canAskAgain: status !== 'denied',
        };
      } catch {
        return { granted: false, status: 'denied', canAskAgain: false };
      }
    } else {
      // Web 端：尝试获取媒体流
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        return { granted: true, status: 'granted', canAskAgain: true };
      } catch (error) {
        if ((error as Error).name === 'NotAllowedError') {
          return { granted: false, status: 'denied', canAskAgain: true };
        }
        return { granted: false, status: 'unknown', canAskAgain: true };
      }
    }
  }

  /**
   * 检查麦克风权限
   */
  private async checkMicrophonePermission(): Promise<PermissionStatus> {
    if (platformService.isNative()) {
      // 原生平台麦克风权限通常在相机权限中一起检查
      return 'prompt';
    } else {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        return this.mapWebStatus(result.state);
      } catch {
        return 'prompt';
      }
    }
  }

  /**
   * 请求麦克风权限
   */
  private async requestMicrophonePermission(): Promise<PermissionRequestResult> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return { granted: true, status: 'granted', canAskAgain: true };
    } catch (error) {
      if ((error as Error).name === 'NotAllowedError') {
        return { granted: false, status: 'denied', canAskAgain: true };
      }
      return { granted: false, status: 'unknown', canAskAgain: true };
    }
  }

  /**
   * 检查相册权限
   */
  private async checkPhotosPermission(): Promise<PermissionStatus> {
    if (platformService.isNative()) {
      try {
        const result = await Camera.checkPermissions();
        return this.mapNativeStatus(result.photos);
      } catch {
        return 'unknown';
      }
    } else {
      // Web 端没有相册权限概念
      return 'granted';
    }
  }

  /**
   * 请求相册权限
   */
  private async requestPhotosPermission(): Promise<PermissionRequestResult> {
    if (platformService.isNative()) {
      try {
        const result = await Camera.requestPermissions();
        const status = this.mapNativeStatus(result.photos);
        return {
          granted: status === 'granted',
          status,
          canAskAgain: status !== 'denied',
        };
      } catch {
        return { granted: false, status: 'denied', canAskAgain: false };
      }
    } else {
      return { granted: true, status: 'granted', canAskAgain: true };
    }
  }

  /**
   * 检查位置权限
   */
  private async checkLocationPermission(): Promise<PermissionStatus> {
    if (platformService.isNative()) {
      try {
        const result = await Geolocation.checkPermissions();
        return this.mapNativeStatus(result.location);
      } catch {
        return 'unknown';
      }
    } else {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        return this.mapWebStatus(result.state);
      } catch {
        return 'prompt';
      }
    }
  }

  /**
   * 请求位置权限
   */
  private async requestLocationPermission(): Promise<PermissionRequestResult> {
    if (platformService.isNative()) {
      try {
        const result = await Geolocation.requestPermissions();
        const status = this.mapNativeStatus(result.location);
        return {
          granted: status === 'granted',
          status,
          canAskAgain: status !== 'denied',
        };
      } catch {
        return { granted: false, status: 'denied', canAskAgain: false };
      }
    } else {
      try {
        await new Promise<void>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            () => resolve(),
            (error) => reject(error),
            { timeout: 5000 }
          );
        });
        return { granted: true, status: 'granted', canAskAgain: true };
      } catch (error) {
        if ((error as GeolocationPositionError).code === 1) {
          return { granted: false, status: 'denied', canAskAgain: true };
        }
        return { granted: false, status: 'unknown', canAskAgain: true };
      }
    }
  }

  /**
   * 检查通知权限
   */
  private async checkNotificationPermission(): Promise<PermissionStatus> {
    if (!('Notification' in window)) return 'unknown';
    return this.mapWebStatus(Notification.permission);
  }

  /**
   * 请求通知权限
   */
  private async requestNotificationPermission(): Promise<PermissionRequestResult> {
    if (!('Notification' in window)) {
      return { granted: false, status: 'unknown', canAskAgain: false };
    }

    const result = await Notification.requestPermission();
    const status = this.mapWebStatus(result);
    return {
      granted: status === 'granted',
      status,
      canAskAgain: result !== 'denied',
    };
  }

  /**
   * 检查存储权限
   */
  private async checkStoragePermission(): Promise<PermissionStatus> {
    if (platformService.isNative()) {
      // 原生平台存储权限通常在 Android 11+ 不需要显式申请
      return 'granted';
    } else {
      // Web 端检查持久存储
      try {
        if (navigator.storage && navigator.storage.persist) {
          const isPersisted = await navigator.storage.persisted();
          return isPersisted ? 'granted' : 'prompt';
        }
        return 'granted';
      } catch {
        return 'granted';
      }
    }
  }

  /**
   * 请求存储权限
   */
  private async requestStoragePermission(): Promise<PermissionRequestResult> {
    if (platformService.isNative()) {
      return { granted: true, status: 'granted', canAskAgain: true };
    } else {
      try {
        if (navigator.storage && navigator.storage.persist) {
          const granted = await navigator.storage.persist();
          return {
            granted,
            status: granted ? 'granted' : 'prompt',
            canAskAgain: true,
          };
        }
        return { granted: true, status: 'granted', canAskAgain: true };
      } catch {
        return { granted: false, status: 'unknown', canAskAgain: true };
      }
    }
  }

  // ==================== 状态映射 ====================

  /**
   * 映射原生平台权限状态
   */
  private mapNativeStatus(status: string): PermissionStatus {
    switch (status) {
      case 'granted':
        return 'granted';
      case 'denied':
        return 'denied';
      case 'prompt':
        return 'prompt';
      case 'limited':
        return 'limited';
      default:
        return 'unknown';
    }
  }

  /**
   * 映射 Web 权限状态
   */
  private mapWebStatus(state: PermissionState): PermissionStatus {
    switch (state) {
      case 'granted':
        return 'granted';
      case 'denied':
        return 'denied';
      case 'prompt':
        return 'prompt';
      default:
        return 'unknown';
    }
  }
}

// 导出单例
export const permissionService = new PermissionService();
export default permissionService;
