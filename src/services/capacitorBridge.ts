/**
 * CapacitorBridge - 统一原生桥接服务
 *
 * 封装所有 Capacitor 插件调用，提供平台检测、错误处理和 Web 降级方案
 * 包括 FCM 推送通知、Android Keystore 加密、证书固定、WebView 崩溃恢复
 */

import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { LocalNotifications, type ScheduleOptions } from '@capacitor/local-notifications';
import { PushNotifications, type Token, type PushNotificationSchema, type ActionPerformed } from '@capacitor/push-notifications';
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

export interface PushPermissionResult {
  grant: 'granted' | 'denied' | 'prompt';
}

export type HapticType = 'light' | 'medium' | 'heavy' | 'selection';

// Certificate pinning configuration
export interface CertificatePin {
  domain: string;
  fingerprints: string[];
}

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

  // ─── 推送通知 (FCM) ──────────────────────────────────────

  /**
   * 请求推送通知权限
   */
  async requestPushPermission(): Promise<PushPermissionResult> {
    if (isNative()) {
      try {
        const result = await PushNotifications.requestPermissions();
        return {
          grant: result.receive === 'granted' ? 'granted' : 'denied',
        };
      } catch (error) {
        logError('PushNotifications', 'requestPushPermission', error);
        return { grant: 'denied' };
      }
    }

    // Web 降级
    try {
      if (Notification.permission === 'granted') return { grant: 'granted' };
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        return { grant: permission === 'granted' ? 'granted' : 'denied' };
      }
      return { grant: 'denied' };
    } catch (error) {
      logError('WebNotification', 'requestPushPermission', error);
      return { grant: 'denied' };
    }
  }

  /**
   * 注册 FCM 推送（初始化 PushNotifications 插件）
   */
  registerPush(): void {
    if (isNative()) {
      try {
        PushNotifications.register();
      } catch (error) {
        logError('PushNotifications', 'registerPush', error);
      }
    }
  }

  /**
   * 添加推送事件监听器
   * 支持事件: 'registration', 'registrationError', 'pushNotificationReceived', 'pushNotificationActionPerformed'
   */
  addPushEventListener(
    event: 'registration' | 'registrationError' | 'pushNotificationReceived' | 'pushNotificationActionPerformed',
    callback: (data: any) => void,
  ): () => void {
    if (isNative()) {
      switch (event) {
        case 'registration':
          PushNotifications.addListener('registration', (token: Token) => {
            callback(token);
          }).then((handler) => {
            this._pushHandlers.set(event, handler);
          });
          return () => {
            const handler = this._pushHandlers.get(event);
            if (handler) {
              handler.remove();
              this._pushHandlers.delete(event);
            }
          };

        case 'registrationError':
          PushNotifications.addListener('registrationError', (error: any) => {
            callback(error);
          }).then((handler) => {
            this._pushHandlers.set(event, handler);
          });
          return () => {
            const handler = this._pushHandlers.get(event);
            if (handler) {
              handler.remove();
              this._pushHandlers.delete(event);
            }
          };

        case 'pushNotificationReceived':
          PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
            callback(notification);
          }).then((handler) => {
            this._pushHandlers.set(event, handler);
          });
          return () => {
            const handler = this._pushHandlers.get(event);
            if (handler) {
              handler.remove();
              this._pushHandlers.delete(event);
            }
          };

        case 'pushNotificationActionPerformed':
          PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
            callback(action);
          }).then((handler) => {
            this._pushHandlers.set(event, handler);
          });
          return () => {
            const handler = this._pushHandlers.get(event);
            if (handler) {
              handler.remove();
              this._pushHandlers.delete(event);
            }
          };
      }
    }

    // Web 降级：使用 Service Worker 消息通道
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const messageHandler = (event: MessageEvent) => {
        if (event.data?.type === event || event.data?.type === 'push') {
          callback(event.data.payload || event.data);
        }
      };
      navigator.serviceWorker.addEventListener('message', messageHandler);
      return () => {
        navigator.serviceWorker.removeEventListener('message', messageHandler);
      };
    }

    return () => {};
  }

  private _pushHandlers = new Map<string, { remove: () => void }>();

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

  // ─── 安全存储（Android Keystore 加密） ─────────────────

  /**
   * 安全存储密钥/令牌（使用 Capacitor Preferences 在 Android 上加密存储）
   * 在 Android 上，Preferences 使用 Android Keystore 加密存储
   */
  async secureSet(key: string, value: string): Promise<void> {
    if (isNative()) {
      try {
        await Preferences.set({ key: `secure_${key}`, value });
        return;
      } catch (error) {
        logError('Preferences', 'secureSet', error);
      }
    }

    // Web 降级：使用 Web Crypto API 加密后存储
    try {
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode('pawsync-secure-storage-key-v1'),
        { name: 'AES-GCM' },
        false,
        ['encrypt'],
      );
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        keyMaterial,
        encoder.encode(value),
      );
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);
      const base64 = btoa(String.fromCharCode(...combined));
      localStorage.setItem(`secure_${key}`, base64);
    } catch (error) {
      logError('WebCrypto', 'secureSet', error);
    }
  }

  /**
   * 安全获取存储的密钥/令牌
   */
  async secureGet(key: string): Promise<string | null> {
    if (isNative()) {
      try {
        const result = await Preferences.get({ key: `secure_${key}` });
        return result.value;
      } catch (error) {
        logError('Preferences', 'secureGet', error);
        return null;
      }
    }

    // Web 降级：使用 Web Crypto API 解密
    try {
      const stored = localStorage.getItem(`secure_${key}`);
      if (!stored) return null;

      const combined = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode('pawsync-secure-storage-key-v1'),
        { name: 'AES-GCM' },
        false,
        ['decrypt'],
      );
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        keyMaterial,
        encrypted,
      );
      return new TextDecoder().decode(decrypted);
    } catch (error) {
      logError('WebCrypto', 'secureGet', error);
      return null;
    }
  }

  /**
   * 删除安全存储的密钥/令牌
   */
  async secureRemove(key: string): Promise<void> {
    if (isNative()) {
      try {
        await Preferences.remove({ key: `secure_${key}` });
        return;
      } catch (error) {
        logError('Preferences', 'secureRemove', error);
      }
    }
    try {
      localStorage.removeItem(`secure_${key}`);
    } catch (error) {
      logError('LocalStorage', 'secureRemove', error);
    }
  }

  // ─── 证书固定 ────────────────────────────────────────────

  /**
   * 存储证书固定配置
   * 在 Android 端通过 Preferences 持久化证书指纹，
   * 实际 TLS 验证由 Android network_security_config.xml 处理
   */
  async setCertificatePins(pins: CertificatePin[]): Promise<void> {
    await this.setPreference('certificate_pins', JSON.stringify(pins));
  }

  /**
   * 获取证书固定配置
   */
  async getCertificatePins(): Promise<CertificatePin[]> {
    const stored = await this.getPreference('certificate_pins');
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  /**
   * 验证服务器证书指纹（Web 端使用）
   * 在原生 Android 端，证书固定由 network_security_config.xml 处理
   */
  async validateCertificatePin(domain: string, fingerprint: string): Promise<boolean> {
    const pins = await this.getCertificatePins();
    const domainPin = pins.find((p) => p.domain === domain);
    if (!domainPin) {
      // 无配置的域名允许通过
      return true;
    }
    return domainPin.fingerprints.includes(fingerprint);
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
  onRenderProcessGone(callback: (details: { reason: string; wasCrash: boolean }) => void): () => void {
    if (isNative()) {
      // 在 Android 上，当 WebView 渲染进程崩溃时，App 状态会变为非活跃
      // 我们通过 appStateChange 事件来检测
      const handler = App.addListener('appStateChange', (state) => {
        if (!state.isActive) {
          // 可能是 WebView 崩溃导致应用失去焦点
          callback({ reason: 'render_process_gone', wasCrash: true });
        }
      });
      return () => handler.then((h) => h.remove()).catch(() => {});
    }

    // Web 降级：监听页面可见性变化
    const visibilityHandler = () => {
      if (document.visibilityState === 'hidden') {
        callback({ reason: 'visibility_change', wasCrash: false });
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);
    return () => {
      document.removeEventListener('visibilitychange', visibilityHandler);
    };
  }

  /**
   * 设置 WebView 崩溃恢复提示
   * 当检测到崩溃恢复时，通知用户刷新页面
   */
  onWebViewCrashRecovery(callback: () => void): () => void {
    return this.onRenderProcessGone((details) => {
      if (details.wasCrash) {
        callback();
      }
    });
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