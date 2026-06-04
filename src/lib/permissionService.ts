/**
 * Permission Service - 权限管理服务
 *
 * 统一处理 Android 和 Web 端的权限请求
 * 确保跨平台权限管理一致性
 */

import { platformCheck } from './platformService';

export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unknown';

export interface PermissionResult {
  status: PermissionStatus;
  canRequest: boolean;
  message?: string;
}

/**
 * Permission Service - 权限服务
 */
export const PermissionService = {
  /**
   * 检查相机权限
   */
  async checkCameraPermission(): Promise<PermissionResult> {
    if (platformCheck.isNative()) {
      try {
        const { Camera } = await import('@capacitor/camera');
        const permissions = await Camera.checkPermissions();
        
        const status = permissions.camera as PermissionStatus;
        return {
          status,
          canRequest: status === 'prompt' || status === 'denied',
          message: status === 'granted' 
            ? '相机权限已授权' 
            : status === 'denied'
              ? '相机权限被拒绝，请在设置中开启'
              : '需要请求相机权限',
        };
      } catch (error) {
        console.error('[Permission] Camera check failed:', error);
        return {
          status: 'unknown',
          canRequest: true,
          message: '无法检查相机权限',
        };
      }
    }

    // Web 环境
    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        return {
          status: result.state,
          canRequest: result.state === 'prompt',
          message: result.state === 'granted' 
            ? '相机权限已授权' 
            : result.state === 'denied'
              ? '相机权限被拒绝'
              : '需要请求相机权限',
        };
      } catch {
        // 某些浏览器不支持 camera 权限查询
        return {
          status: 'prompt',
          canRequest: true,
          message: '需要请求相机权限',
        };
      }
    }

    return {
      status: 'prompt',
      canRequest: true,
      message: '需要请求相机权限',
    };
  },

  /**
   * 请求相机权限
   */
  async requestCameraPermission(): Promise<PermissionResult> {
    if (platformCheck.isNative()) {
      try {
        const { Camera } = await import('@capacitor/camera');
        const permissions = await Camera.requestPermissions();
        
        const status = permissions.camera as PermissionStatus;
        return {
          status,
          canRequest: false,
          message: status === 'granted' 
            ? '相机权限已授权' 
            : '相机权限被拒绝',
        };
      } catch (error) {
        console.error('[Permission] Camera request failed:', error);
        return {
          status: 'denied',
          canRequest: false,
          message: '相机权限请求失败',
        };
      }
    }

    // Web 环境
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // 立即关闭流，我们只是检查权限
      stream.getTracks().forEach(track => track.stop());
      
      return {
        status: 'granted',
        canRequest: false,
        message: '相机权限已授权',
      };
    } catch (error) {
      const err = error as Error;
      const isDenied = err.name === 'NotAllowedError';
      
      return {
        status: isDenied ? 'denied' : 'unknown',
        canRequest: false,
        message: isDenied ? '相机权限被拒绝' : '相机权限请求失败',
      };
    }
  },

  /**
   * 检查麦克风权限
   */
  async checkMicrophonePermission(): Promise<PermissionResult> {
    if (platformCheck.isNative()) {
      try {
        // Capacitor 没有直接的麦克风权限 API，使用媒体设备
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasMicrophone = devices.some(device => device.kind === 'audioinput');
        
        if (!hasMicrophone) {
          return {
            status: 'denied',
            canRequest: false,
            message: '未检测到麦克风设备',
          };
        }
        
        return {
          status: 'prompt',
          canRequest: true,
          message: '需要请求麦克风权限',
        };
      } catch (error) {
        console.error('[Permission] Microphone check failed:', error);
        return {
          status: 'unknown',
          canRequest: true,
          message: '无法检查麦克风权限',
        };
      }
    }

    // Web 环境
    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        return {
          status: result.state,
          canRequest: result.state === 'prompt',
          message: result.state === 'granted' 
            ? '麦克风权限已授权' 
            : result.state === 'denied'
              ? '麦克风权限被拒绝'
              : '需要请求麦克风权限',
        };
      } catch {
        return {
          status: 'prompt',
          canRequest: true,
          message: '需要请求麦克风权限',
        };
      }
    }

    return {
      status: 'prompt',
      canRequest: true,
      message: '需要请求麦克风权限',
    };
  },

  /**
   * 请求麦克风权限
   */
  async requestMicrophonePermission(): Promise<PermissionResult> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      
      return {
        status: 'granted',
        canRequest: false,
        message: '麦克风权限已授权',
      };
    } catch (error) {
      const err = error as Error;
      const isDenied = err.name === 'NotAllowedError';
      
      return {
        status: isDenied ? 'denied' : 'unknown',
        canRequest: false,
        message: isDenied ? '麦克风权限被拒绝' : '麦克风权限请求失败',
      };
    }
  },

  /**
   * 检查通知权限
   */
  async checkNotificationPermission(): Promise<PermissionResult> {
    if (platformCheck.isNative()) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const result = await LocalNotifications.checkPermissions();
        
        const status = result.display as PermissionStatus;
        return {
          status,
          canRequest: status === 'prompt',
          message: status === 'granted' 
            ? '通知权限已授权' 
            : status === 'denied'
              ? '通知权限被拒绝，请在设置中开启'
              : '需要请求通知权限',
        };
      } catch (error) {
        console.error('[Permission] Notification check failed:', error);
        return {
          status: 'unknown',
          canRequest: true,
          message: '无法检查通知权限',
        };
      }
    }

    // Web 环境
    if ('Notification' in window) {
      return {
        status: Notification.permission as PermissionStatus,
        canRequest: Notification.permission === 'default',
        message: Notification.permission === 'granted' 
          ? '通知权限已授权' 
          : Notification.permission === 'denied'
            ? '通知权限被拒绝'
            : '需要请求通知权限',
      };
    }

    return {
      status: 'denied',
      canRequest: false,
      message: '浏览器不支持通知功能',
    };
  },

  /**
   * 请求通知权限
   */
  async requestNotificationPermission(): Promise<PermissionResult> {
    if (platformCheck.isNative()) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const result = await LocalNotifications.requestPermissions();
        
        const status = result.display as PermissionStatus;
        return {
          status,
          canRequest: false,
          message: status === 'granted' 
            ? '通知权限已授权' 
            : '通知权限被拒绝',
        };
      } catch (error) {
        console.error('[Permission] Notification request failed:', error);
        return {
          status: 'denied',
          canRequest: false,
          message: '通知权限请求失败',
        };
      }
    }

    // Web 环境
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return {
        status: permission as PermissionStatus,
        canRequest: false,
        message: permission === 'granted' 
          ? '通知权限已授权' 
          : '通知权限被拒绝',
      };
    }

    return {
      status: 'denied',
      canRequest: false,
      message: '浏览器不支持通知功能',
    };
  },

  /**
   * 检查存储权限（Android）
   */
  async checkStoragePermission(): Promise<PermissionResult> {
    if (platformCheck.isAndroid()) {
      // Android 13+ 不需要存储权限
      // 这里仅作为示例
      return {
        status: 'granted',
        canRequest: false,
        message: '存储权限已授权',
      };
    }

    // Web 环境不需要存储权限
    return {
      status: 'granted',
      canRequest: false,
      message: '存储权限已授权',
    };
  },

  /**
   * 检查所有必需权限
   */
  async checkAllPermissions(): Promise<Record<string, PermissionResult>> {
    const [camera, microphone, notification] = await Promise.all([
      this.checkCameraPermission(),
      this.checkMicrophonePermission(),
      this.checkNotificationPermission(),
    ]);

    return {
      camera,
      microphone,
      notification,
    };
  },

  /**
   * 请求所有必需权限
   */
  async requestAllPermissions(): Promise<Record<string, PermissionResult>> {
    const [camera, microphone, notification] = await Promise.all([
      this.requestCameraPermission(),
      this.requestMicrophonePermission(),
      this.requestNotificationPermission(),
    ]);

    return {
      camera,
      microphone,
      notification,
    };
  },

  /**
   * 检查是否有权限执行某操作
   */
  async hasPermission(type: 'camera' | 'microphone' | 'notification'): Promise<boolean> {
    const checkers = {
      camera: this.checkCameraPermission,
      microphone: this.checkMicrophonePermission,
      notification: this.checkNotificationPermission,
    };

    const result = await checkers[type].call(this);
    return result.status === 'granted';
  },

  /**
   * 确保有权限（如果没有则请求）
   */
  async ensurePermission(type: 'camera' | 'microphone' | 'notification'): Promise<boolean> {
    const hasPermission = await this.hasPermission(type);
    if (hasPermission) {
      return true;
    }

    const requesters = {
      camera: this.requestCameraPermission,
      microphone: this.requestMicrophonePermission,
      notification: this.requestNotificationPermission,
    };

    const result = await requesters[type].call(this);
    return result.status === 'granted';
  },
};

export default PermissionService;
