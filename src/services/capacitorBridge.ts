/**
 * CapacitorBridge - 统一原生桥接服务
 *
 * 封装所有 Capacitor 插件调用，提供平台检测、错误处理和 Web 降级方案
 */

import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { LocalNotifications, type ScheduleOptions } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { Haptics, HapticsNotificationType, ImpactStyle } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { Preferences } from '@capacitor/preferences';
import { Keyboard } from '@capacitor/keyboard';
import { Geolocation } from '@capacitor/geolocation';
import { BackgroundTask } from '@capacitor/background-task';
import { App } from '@capacitor/app';

// ─── 类型定义 ───────────────────────────────────────────────

export interface PhotoResult {
  base64String: string | null;
  dataUrl: string | null;
  path: string | null;
  format: string;
  savedPath: string | null;
}

export interface TakePhotoOptions {
  quality?: number;
  allowEditing?: boolean;
  resultType?: 'base64' | 'dataUrl' | 'uri';
  saveToGallery?: boolean;
}

export interface PickImageOptions {
  quality?: number;
  allowEditing?: boolean;
  resultType?: 'base64' | 'dataUrl' | 'uri';
}

export interface ScheduleNotificationOptions {
  title: string;
  body: string;
  id?: number;
  schedule?: { at: Date } | { every: string; count?: number };
  extra?: Record<string, unknown>;
}

export interface ShareContentOptions {
  title?: string;
  text?: string;
  url?: string;
  dialogTitle?: string;
}

export type HapticType = 'light' | 'medium' | 'heavy' | 'selection';

// ─── 辅助函数 ───────────────────────────────────────────────

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

function logError(plugin: string, method: string, error: unknown): void {
  console.error(`[CapacitorBridge][${plugin}] ${method} failed:`, error);
}

// ─── CapacitorBridge 类 ─────────────────────────────────────

class CapacitorBridge {
  // ─── 相机 ────────────────────────────────────────────────

  /**
   * 拍照：调用设备相机拍摄照片
   */
  async takePhoto(options?: TakePhotoOptions): Promise<PhotoResult> {
    if (isNative()) {
      try {
        const resultType = options?.resultType === 'dataUrl'
          ? CameraResultType.DataUrl
          : options?.resultType === 'uri'
            ? CameraResultType.Uri
            : CameraResultType.Base64;

        const photo = await Camera.getPhoto({
          quality: options?.quality ?? 80,
          allowEditing: options?.allowEditing ?? false,
          resultType,
          source: CameraSource.Camera,
          saveToGallery: options?.saveToGallery ?? false,
        });

        return {
          base64String: photo.base64String ?? null,
          dataUrl: photo.dataUrl ?? null,
          path: photo.path ?? null,
          format: photo.format,
          savedPath: photo.savedPath ?? null,
        };
      } catch (error) {
        logError('Camera', 'takePhoto', error);
        return this.getEmptyPhotoResult();
      }
    }

    // Web 降级：使用文件输入（仅限拍照）
    return this.webFileInput('environment', options);
  }

  /**
   * 选图：从相册选择图片
   */
  async pickImage(options?: PickImageOptions): Promise<PhotoResult> {
    if (isNative()) {
      try {
        const resultType = options?.resultType === 'dataUrl'
          ? CameraResultType.DataUrl
          : options?.resultType === 'uri'
            ? CameraResultType.Uri
            : CameraResultType.Base64;

        const photo = await Camera.getPhoto({
          quality: options?.quality ?? 80,
          allowEditing: options?.allowEditing ?? false,
          resultType,
          source: CameraSource.Photos,
        });

        return {
          base64String: photo.base64String ?? null,
          dataUrl: photo.dataUrl ?? null,
          path: photo.path ?? null,
          format: photo.format,
          savedPath: photo.savedPath ?? null,
        };
      } catch (error) {
        logError('Camera', 'pickImage', error);
        return this.getEmptyPhotoResult();
      }
    }

    // Web 降级：使用文件输入
    return this.webFileInput(undefined, options);
  }

  private getEmptyPhotoResult(): PhotoResult {
    return {
      base64String: null,
      dataUrl: null,
      path: null,
      format: '',
      savedPath: null,
    };
  }

  private webFileInput(
    capture: 'environment' | 'user' | undefined,
    options?: TakePhotoOptions | PickImageOptions,
  ): Promise<PhotoResult> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      if (capture) {
        input.capture = capture;
      }

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          resolve(this.getEmptyPhotoResult());
          return;
        }

        const resultType = options?.resultType ?? 'base64';

        if (resultType === 'uri') {
          resolve({
            base64String: null,
            dataUrl: null,
            path: URL.createObjectURL(file),
            format: file.type.split('/')[1] || 'jpeg',
            savedPath: null,
          });
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          const format = file.type.split('/')[1] || 'jpeg';

          if (resultType === 'dataUrl') {
            resolve({
              base64String: null,
              dataUrl,
              path: null,
              format,
              savedPath: null,
            });
          } else {
            resolve({
              base64String: dataUrl.split(',')[1] ?? null,
              dataUrl: null,
              path: null,
              format,
              savedPath: null,
            });
          }
        };
        reader.onerror = () => resolve(this.getEmptyPhotoResult());
        reader.readAsDataURL(file);
      };

      input.click();
    });
  }

  // ─── 本地通知 ────────────────────────────────────────────

  /**
   * 调度本地通知，返回通知 ID
   */
  async scheduleNotification(options: ScheduleNotificationOptions): Promise<number> {
    const notifId = options.id ?? Date.now();

    if (isNative()) {
      try {
        const scheduleOpts: ScheduleOptions = {
          notifications: [
            {
              title: options.title,
              body: options.body,
              id: notifId,
              schedule: options.schedule as ScheduleOptions['notifications'][number]['schedule'],
              extra: options.extra,
            },
          ],
        };
        await LocalNotifications.schedule(scheduleOpts);
        return notifId;
      } catch (error) {
        logError('LocalNotifications', 'scheduleNotification', error);
        return notifId;
      }
    }

    // Web 降级：使用浏览器 Notification API
    try {
      if (Notification.permission === 'granted') {
        const atDate = options.schedule && 'at' in options.schedule ? options.schedule.at : undefined;
        if (atDate) {
          const delay = atDate.getTime() - Date.now();
          if (delay > 0) {
            setTimeout(() => {
              new Notification(options.title, { body: options.body });
            }, delay);
          }
        } else {
          new Notification(options.title, { body: options.body });
        }
      } else if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(options.title, { body: options.body });
        }
      }
    } catch (error) {
      logError('WebNotification', 'scheduleNotification', error);
    }

    return notifId;
  }

  /**
   * 取消指定通知
   */
  async cancelNotification(id: number): Promise<void> {
    if (isNative()) {
      try {
        await LocalNotifications.cancel({ notifications: [{ id }] });
      } catch (error) {
        logError('LocalNotifications', 'cancelNotification', error);
      }
    }
    // Web 环境无法取消已发出的 Notification
  }

  // ─── 推送通知 ────────────────────────────────────────────

  /**
   * 请求推送通知权限
   */
  async requestPushPermission(): Promise<boolean> {
    if (isNative()) {
      try {
        const result = await PushNotifications.requestPermissions();
        return result.receive === 'granted';
      } catch (error) {
        logError('PushNotifications', 'requestPushPermission', error);
        return false;
      }
    }

    // Web 降级
    try {
      if (Notification.permission === 'granted') return true;
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      return false;
    } catch (error) {
      logError('WebNotification', 'requestPushPermission', error);
      return false;
    }
  }

  /**
   * 注册推送 Token，返回 token 字符串（仅原生平台有效）
   */
  async registerPushToken(): Promise<string | null> {
    if (!isNative()) return null;

    try {
      await PushNotifications.register();
      return new Promise<string | null>((resolve) => {
        let resolved = false;

        const tokenHandler = PushNotifications.addListener(
          'registration',
          (token) => {
            if (!resolved) {
              resolved = true;
              resolve(token.value);
            }
          },
        );

        const errorHandler = PushNotifications.addListener(
          'registrationError',
          () => {
            if (!resolved) {
              resolved = true;
              resolve(null);
            }
          },
        );

        // 超时保护
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            tokenHandler.then((h) => h.remove()).catch(() => {});
            errorHandler.then((h) => h.remove()).catch(() => {});
            resolve(null);
          }
        }, 10000);
      });
    } catch (error) {
      logError('PushNotifications', 'registerPushToken', error);
      return null;
    }
  }

  // ─── 分享 ────────────────────────────────────────────────

  /**
   * 分享内容
   */
  async shareContent(options: ShareContentOptions): Promise<boolean> {
    if (isNative()) {
      try {
        const canShare = await Share.canShare();
        if (canShare.value) {
          await Share.share({
            title: options.title,
            text: options.text,
            url: options.url,
            dialogTitle: options.dialogTitle,
          });
          return true;
        }
      } catch (error) {
        // 用户取消分享不算错误
        if ((error as Error).message?.includes('User cancelled')) {
          return false;
        }
        logError('Share', 'shareContent', error);
      }
    }

    // Web 降级
    if (navigator.share) {
      try {
        await navigator.share({
          title: options.title,
          text: options.text,
          url: options.url,
        });
        return true;
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          logError('WebShare', 'shareContent', error);
        }
        return false;
      }
    }

    // 最终降级：复制到剪贴板
    try {
      const text = [options.title, options.text, options.url].filter(Boolean).join('\n');
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      logError('Clipboard', 'shareContent', error);
      return false;
    }
  }

  // ─── 触觉反馈 ────────────────────────────────────────────

  /**
   * 触发触觉反馈
   */
  async triggerHaptic(type: HapticType): Promise<void> {
    if (isNative()) {
      try {
        switch (type) {
          case 'light':
            await Haptics.impact({ style: ImpactStyle.Light });
            break;
          case 'medium':
            await Haptics.impact({ style: ImpactStyle.Medium });
            break;
          case 'heavy':
            await Haptics.impact({ style: ImpactStyle.Heavy });
            break;
          case 'selection':
            await Haptics.selectionChanged();
            break;
        }
      } catch (error) {
        logError('Haptics', 'triggerHaptic', error);
      }
    }
    // Web 环境无触觉反馈，静默忽略
  }

  // ─── 偏好存储 ────────────────────────────────────────────

  /**
   * 设置偏好值
   */
  async setPreference(key: string, value: string): Promise<void> {
    if (isNative()) {
      try {
        await Preferences.set({ key, value });
        return;
      } catch (error) {
        logError('Preferences', 'setPreference', error);
      }
    }

    // Web 降级
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      logError('LocalStorage', 'setPreference', error);
    }
  }

  /**
   * 获取偏好值
   */
  async getPreference(key: string): Promise<string | null> {
    if (isNative()) {
      try {
        const result = await Preferences.get({ key });
        return result.value;
      } catch (error) {
        logError('Preferences', 'getPreference', error);
      }
    }

    // Web 降级
    try {
      return localStorage.getItem(key);
    } catch (error) {
      logError('LocalStorage', 'getPreference', error);
      return null;
    }
  }

  // ─── 键盘 ────────────────────────────────────────────────

  /**
   * 显示键盘
   */
  async showKeyboard(): Promise<void> {
    if (isNative()) {
      try {
        await Keyboard.show();
      } catch (error) {
        logError('Keyboard', 'showKeyboard', error);
      }
    }
  }

  /**
   * 隐藏键盘
   */
  async hideKeyboard(): Promise<void> {
    if (isNative()) {
      try {
        await Keyboard.hide();
      } catch (error) {
        logError('Keyboard', 'hideKeyboard', error);
      }
    }
  }

  // ─── 位置服务 ────────────────────────────────────────────

  /**
   * 获取当前位置
   */
  async getCurrentPosition(): Promise<{
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  } | null> {
    if (isNative()) {
      try {
        const result = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000,
        });
        return {
          latitude: result.coords.latitude,
          longitude: result.coords.longitude,
          accuracy: result.coords.accuracy,
          timestamp: result.timestamp,
        };
      } catch (error) {
        logError('Geolocation', 'getCurrentPosition', error);
        return null;
      }
    }

    // Web 降级
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          });
        },
        (error) => {
          logError('WebGeolocation', 'getCurrentPosition', error);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 15000 },
      );
    });
  }

  // ─── 后台任务 ────────────────────────────────────────────

  /**
   * 注册后台任务（Android 16 适配）
   * 用于在切后台时完成数据同步、健康数据上传等
   */
  async registerBackgroundTask(taskId: string, callback: () => Promise<void>): Promise<void> {
    if (isNative()) {
      try {
        await BackgroundTask.beforeExit(async () => {
          try {
            await callback();
          } catch (error) {
            logError('BackgroundTask', taskId, error);
          }
          BackgroundTask.finish({ taskId });
        });
      } catch (error) {
        logError('BackgroundTask', 'registerBackgroundTask', error);
      }
    }
  }

  // ─── WebView 崩溃恢复通知 ───────────────────────────────

  /**
   * 监听 WebView 渲染进程崩溃事件（Android 专用）
   * 前端可据此显示恢复提示
   */
  onRenderProcessGone(callback: () => void): () => void {
    if (isNative()) {
      const handler = App.addListener('appStateChange', (state) => {
        if (!state.isActive) {
          callback();
        }
      });
      return () => handler.then((h) => h.remove()).catch(() => {});
    }
    return () => {};
  }

  // ─── 平台检测 ────────────────────────────────────────────

  isNative(): boolean {
    return isNative();
  }

  getPlatform(): string {
    return Capacitor.getPlatform();
  }
}

// 导出单例
export const capacitorBridge = new CapacitorBridge();
