/**
 * Platform Service - 平台服务抽象层
 *
 * 统一管理 Web、Android、iOS 平台的原生功能
 * 确保功能在所有平台上有一致的行为和优雅的降级处理
 */

import { isPlatform } from '@capacitor/core';

// 平台类型
export type PlatformType = 'android' | 'ios' | 'web';

/**
 * 获取当前平台类型
 */
export const getCurrentPlatform = (): PlatformType => {
  if (isPlatform('android')) return 'android';
  if (isPlatform('ios')) return 'ios';
  return 'web';
};

/**
 * 检查是否为原生平台（Android 或 iOS）
 */
export const isNativePlatform = (): boolean => {
  return isPlatform('android') || isPlatform('ios');
};

/**
 * 检查当前平台
 */
export const platformCheck = {
  isAndroid: () => isPlatform('android'),
  isIOS: () => isPlatform('ios'),
  isWeb: () => !isPlatform('android') && !isPlatform('ios'),
  isNative: () => isNativePlatform(),
};

/**
 * Haptics Service - 触觉反馈服务
 */
export const HapticsService = {
  /**
   * 触发轻量级触觉反馈
   */
  async light(): Promise<void> {
    if (platformCheck.isNative()) {
      try {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (error) {
        console.warn('[Haptics] Light impact failed:', error);
      }
    }
  },

  /**
   * 触发中等强度触觉反馈
   */
  async medium(): Promise<void> {
    if (platformCheck.isNative()) {
      try {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        await Haptics.impact({ style: ImpactStyle.Medium });
      } catch (error) {
        console.warn('[Haptics] Medium impact failed:', error);
      }
    }
  },

  /**
   * 触发重度触觉反馈
   */
  async heavy(): Promise<void> {
    if (platformCheck.isNative()) {
      try {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } catch (error) {
        console.warn('[Haptics] Heavy impact failed:', error);
      }
    }
  },

  /**
   * 触发选择反馈（用于列表选择）
   */
  async selection(): Promise<void> {
    if (platformCheck.isNative()) {
      try {
        const { Haptics } = await import('@capacitor/haptics');
        await Haptics.selectionChanged();
      } catch (error) {
        console.warn('[Haptics] Selection changed failed:', error);
      }
    }
  },

  /**
   * 触发通知反馈
   */
  async notification(type: 'success' | 'warning' | 'error'): Promise<void> {
    if (platformCheck.isNative()) {
      try {
        const { Haptics, NotificationType } = await import('@capacitor/haptics');
        const notificationType = {
          success: NotificationType.Success,
          warning: NotificationType.Warning,
          error: NotificationType.Error,
        }[type];
        await Haptics.notification({ type: notificationType });
      } catch (error) {
        console.warn('[Haptics] Notification failed:', error);
      }
    }
  },
};

/**
 * Share Service - 分享服务
 */
export interface ShareOptions {
  title: string;
  text: string;
  url?: string;
  dialogTitle?: string;
}

export const ShareService = {
  /**
   * 检查是否支持分享功能
   */
  async isSupported(): Promise<boolean> {
    if (platformCheck.isNative()) {
      try {
        const { Share } = await import('@capacitor/share');
        return await Share.canShare();
      } catch {
        return false;
      }
    }
    // Web 环境
    return !!(navigator.share && navigator.canShare);
  },

  /**
   * 分享内容
   */
  async share(options: ShareOptions): Promise<boolean> {
    const { title, text, url, dialogTitle } = options;

    // 优先使用原生分享
    if (platformCheck.isNative()) {
      try {
        const { Share } = await import('@capacitor/share');
        const shareOptions = {
          title,
          text,
          url,
        };
        if (await Share.canShare(shareOptions)) {
          await Share.share(shareOptions);
          return true;
        }
      } catch (error) {
        console.warn('[Share] Native share failed, falling back to web:', error);
      }
    }

    // Web 环境降级
    if (navigator.share) {
      try {
        const shareData: ShareData = { title, text };
        if (url) {
          shareData.url = url;
        }
        await navigator.share(shareData);
        return true;
      } catch (error) {
        // 用户取消分享不是错误
        if ((error as Error).name !== 'AbortError') {
          console.error('[Share] Web share failed:', error);
        }
        return false;
      }
    }

    // 复制到剪贴板作为最后的降级方案
    try {
      await navigator.clipboard.writeText(`${title}\n${text}${url ? '\n' + url : ''}`);
      console.log('[Share] Content copied to clipboard');
      return true;
    } catch {
      console.error('[Share] No sharing method available');
      return false;
    }
  },
};

/**
 * Camera Service - 相机服务（统一接口）
 */
export const CameraService = {
  /**
   * 检查相机权限
   */
  async checkPermission(): Promise<'granted' | 'denied' | 'prompt'> {
    if (platformCheck.isNative()) {
      try {
        const { Camera, PermissionStatus } = await import('@capacitor/camera');
        const status = await Camera.checkPermissions();
        return status.camera as PermissionStatus;
      } catch {
        return 'prompt';
      }
    }
    // Web 环境假设已授权
    return 'granted';
  },

  /**
   * 请求相机权限
   */
  async requestPermission(): Promise<boolean> {
    if (platformCheck.isNative()) {
      try {
        const { Camera, PermissionStatus } = await import('@capacitor/camera');
        const status = await Camera.requestPermissions();
        return status.camera === PermissionStatus.Granted;
      } catch {
        return false;
      }
    }
    return true;
  },

  /**
   * 获取照片
   */
  async getPhoto(options?: {
    quality?: number;
    allowEditing?: boolean;
    resultType?: 'base64' | 'dataUrl' | 'uri';
  }): Promise<string | null> {
    if (platformCheck.isNative()) {
      try {
        const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
        const image = await Camera.getPhoto({
          quality: options?.quality ?? 80,
          allowEditing: options?.allowEditing ?? false,
          resultType: CameraResultType.Base64,
          source: CameraSource.Prompt,
        });
        return image.base64String ?? null;
      } catch (error) {
        console.error('[Camera] Failed to get photo:', error);
        return null;
      }
    }

    // Web 环境使用文件输入
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        if (options?.resultType === 'base64' || options?.resultType === 'dataUrl' || !options?.resultType) {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(options?.resultType === 'base64' ? result.split(',')[1] : result);
          };
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(file);
        } else {
          // 返回 blob URL
          resolve(URL.createObjectURL(file));
        }
      };

      input.click();
    });
  },
};

/**
 * Local Notifications Service - 本地通知服务
 */
export const NotificationService = {
  /**
   * 检查通知权限
   */
  async checkPermission(): Promise<boolean> {
    if (platformCheck.isNative()) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const result = await LocalNotifications.checkPermissions();
        return result.display === 'granted';
      } catch {
        return false;
      }
    }
    // Web 环境使用通知 API
    return Notification.permission === 'granted';
  },

  /**
   * 请求通知权限
   */
  async requestPermission(): Promise<boolean> {
    if (platformCheck.isNative()) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const result = await LocalNotifications.requestPermissions();
        return result.display === 'granted';
      } catch {
        return false;
      }
    }
    // Web 环境
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  },

  /**
   * 发送本地通知
   */
  async show(options: {
    title: string;
    body: string;
    id?: number;
    schedule?: { at: Date };
  }): Promise<void> {
    if (platformCheck.isNative()) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        await LocalNotifications.schedule({
          notifications: [
            {
              title: options.title,
              body: options.body,
              id: options.id ?? Date.now(),
              schedule: options.schedule,
            },
          ],
        });
      } catch (error) {
        console.error('[Notifications] Failed to show notification:', error);
      }
    } else {
      // Web 环境使用通知 API
      if (Notification.permission === 'granted') {
        new Notification(options.title, {
          body: options.body,
          icon: '/favicon.ico',
        });
      }
    }
  },
};

/**
 * Storage Service - 存储服务（统一接口）
 */
export const StorageService = {
  /**
   * 设置存储值
   */
  async set(key: string, value: unknown): Promise<void> {
    try {
      const serialized = JSON.stringify(value);

      if (platformCheck.isNative()) {
        // 优先使用 Capacitor Storage
        try {
          const { Preferences } = await import('@capacitor/preferences');
          await Preferences.set({ key, value: serialized });
          return;
        } catch {
          // 降级到 localStorage
        }
      }

      // Web 或降级
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error('[Storage] Failed to set item:', error);
    }
  },

  /**
   * 获取存储值
   */
  async get<T>(key: string, defaultValue?: T): Promise<T | null> {
    try {
      let value: string | null = null;

      if (platformCheck.isNative()) {
        try {
          const { Preferences } = await import('@capacitor/preferences');
          const result = await Preferences.get({ key });
          value = result.value;
        } catch {
          // 降级到 localStorage
          value = localStorage.getItem(key);
        }
      } else {
        value = localStorage.getItem(key);
      }

      if (value === null) {
        return defaultValue ?? null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      console.error('[Storage] Failed to get item:', error);
      return defaultValue ?? null;
    }
  },

  /**
   * 删除存储值
   */
  async remove(key: string): Promise<void> {
    try {
      if (platformCheck.isNative()) {
        try {
          const { Preferences } = await import('@capacitor/preferences');
          await Preferences.remove({ key });
          return;
        } catch {
          // 降级到 localStorage
        }
      }
      localStorage.removeItem(key);
    } catch (error) {
      console.error('[Storage] Failed to remove item:', error);
    }
  },

  /**
   * 清空所有存储
   */
  async clear(): Promise<void> {
    try {
      if (platformCheck.isNative()) {
        try {
          const { Preferences } = await import('@capacitor/preferences');
          await Preferences.clear();
          return;
        } catch {
          // 降级到 localStorage
        }
      }
      localStorage.clear();
    } catch (error) {
      console.error('[Storage] Failed to clear storage:', error);
    }
  },
};

/**
 * Keyboard Service - 键盘服务
 */
export const KeyboardService = {
  /**
   * 显示键盘
   */
  async show(): Promise<void> {
    if (platformCheck.isNative()) {
      try {
        const { Keyboard } = await import('@capacitor/keyboard');
        await Keyboard.show();
      } catch (error) {
        console.warn('[Keyboard] Show failed:', error);
      }
    }
  },

  /**
   * 隐藏键盘
   */
  async hide(): Promise<void> {
    if (platformCheck.isNative()) {
      try {
        const { Keyboard } = await import('@capacitor/keyboard');
        await Keyboard.hide();
      } catch (error) {
        console.warn('[Keyboard] Hide failed:', error);
      }
    }
  },

  /**
   * 添加键盘显示监听器
   */
  onShow(callback: () => void): () => void {
    if (platformCheck.isNative()) {
      import('@capacitor/keyboard').then(({ Keyboard }) => {
        Keyboard.addListener('keyboardDidShow', callback);
      });
    } else {
      window.addEventListener('keyboardDidShow', callback);
    }
    return () => {
      if (platformCheck.isNative()) {
        Keyboard.removeAllListeners();
      }
    };
  },

  /**
   * 添加键盘隐藏监听器
   */
  onHide(callback: () => void): () => void {
    if (platformCheck.isNative()) {
      import('@capacitor/keyboard').then(({ Keyboard }) => {
        Keyboard.addListener('keyboardDidHide', callback);
      });
    } else {
      window.addEventListener('keyboardDidHide', callback);
    }
    return () => {
      if (platformCheck.isNative()) {
        Keyboard.removeAllListeners();
      }
    };
  },
};

// 导出平台服务集合
export const PlatformServices = {
  haptics: HapticsService,
  share: ShareService,
  camera: CameraService,
  notification: NotificationService,
  storage: StorageService,
  keyboard: KeyboardService,
  platform: platformCheck,
  getCurrentPlatform,
  isNativePlatform,
};

export default PlatformServices;
