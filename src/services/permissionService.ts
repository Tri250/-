import { capacitorBridge } from './capacitorBridge';

// ─── 类型定义 ───────────────────────────────────────────────

export type PermissionType = 'camera' | 'microphone' | 'location' | 'storage' | 'notification' | 'biometric';

export interface PermissionStatus {
  type: PermissionType;
  granted: boolean;
  denied: boolean;
  prompt: boolean;
  canRequest: boolean;
  lastChecked: Date;
  autoResetDetected?: boolean;
}

export interface PermissionConfig {
  type: PermissionType;
  required: boolean;
  description: string;
  fallbackMessage: string;
  requestMessage: string;
}

// ─── 权限配置 ───────────────────────────────────────────────

export const PERMISSION_CONFIGS: Record<PermissionType, PermissionConfig> = {
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
  biometric: {
    type: 'biometric',
    required: false,
    description: '用于生物识别验证保护隐私',
    fallbackMessage: '生物识别权限未开启，无法使用指纹/面容解锁',
    requestMessage: '需要生物识别权限来保护您的隐私数据',
  },
};

// ─── localStorage 持久化键 ──────────────────────────────────

const PERMISSION_STORAGE_PREFIX = 'perm_status_';
const PERMISSION_LAST_CHECK_PREFIX = 'perm_last_check_';

// ─── Android SDK 版本检测 ───────────────────────────────────

async function getAndroidSdkVersion(): Promise<number> {
  if (!capacitorBridge.isNative() || capacitorBridge.getPlatform() !== 'android') {
    return 0;
  }
  try {
    const { Device } = await import('@capacitor/device');
    const info = await Device.getInfo();
    // info.platformVersion 在 Android 上是 SDK 版本号
    return Number((info as Record<string, unknown>).platformVersion) || 0;
  } catch {
    return 0;
  }
}

// ─── 权限自动重置检测（Android 16 特性）────────────────────

function checkAutoReset(type: PermissionType, lastChecked: Date | null): boolean {
  if (!lastChecked) return false;
  const now = Date.now();
  const lastTime = new Date(lastChecked).getTime();
  const daysSinceLastCheck = (now - lastTime) / (1000 * 60 * 60 * 24);
  // Android 16: 超过 30 天未使用的权限可能被系统自动重置
  return daysSinceLastCheck > 30;
}

// ─── 持久化 ─────────────────────────────────────────────────

function persistPermissionStatus(type: PermissionType, status: PermissionStatus): void {
  try {
    const key = `${PERMISSION_STORAGE_PREFIX}${type}`;
    localStorage.setItem(key, JSON.stringify({
      granted: status.granted,
      denied: status.denied,
      prompt: status.prompt,
      canRequest: status.canRequest,
      autoResetDetected: status.autoResetDetected,
      lastChecked: status.lastChecked.toISOString(),
    }));
  } catch {
    // 静默失败
  }
}

function loadPersistedStatus(type: PermissionType): { granted: boolean; denied: boolean; prompt: boolean; canRequest: boolean; autoResetDetected?: boolean; lastChecked: string } | null {
  try {
    const key = `${PERMISSION_STORAGE_PREFIX}${type}`;
    const json = localStorage.getItem(key);
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}

// ─── PermissionManager 类 ────────────────────────────────────

class PermissionManager {
  private permissionStatuses: Map<PermissionType, PermissionStatus> = new Map();
  private denialCallbacks: Map<PermissionType, (() => void)[]> = new Map();

  // ─── 检查权限 ──────────────────────────────────────────────

  async checkPermission(type: PermissionType): Promise<PermissionStatus> {
    try {
      if (capacitorBridge.isNative()) {
        return await this.checkNativePermission(type);
      }
      return await this.checkWebPermission(type);
    } catch (error) {
      console.warn(`[PermissionManager] Check failed for ${type}:`, error);
      return this.createStatus(type, 'prompt');
    }
  }

  // ─── 请求权限 ──────────────────────────────────────────────

  async requestPermission(type: PermissionType): Promise<boolean> {
    const config = PERMISSION_CONFIGS[type];

    try {
      if (capacitorBridge.isNative()) {
        return await this.requestNativePermission(type);
      }
      return await this.requestWebPermission(type);
    } catch (error) {
      console.warn(`[PermissionManager] Request failed for ${type}:`, error);
      this.handleDenial(type, config);
      return false;
    }
  }

  // ─── 原生权限检查 ──────────────────────────────────────────

  private async checkNativePermission(type: PermissionType): Promise<PermissionStatus> {
    switch (type) {
      case 'camera': {
        try {
          const { Camera } = await import('@capacitor/camera');
          const result = await Camera.checkPermissions();
          const state = result.camera as string;
          return this.createStatus(type, this.mapCapacitorState(state));
        } catch {
          return this.createStatus(type, 'prompt');
        }
      }

      case 'microphone': {
        try {
          // Capacitor 没有独立的麦克风权限 API，使用媒体设备枚举推断
          const devices = await navigator.mediaDevices.enumerateDevices();
          const audioInput = devices.find(d => d.kind === 'audioinput');
          if (!audioInput) {
            return this.createStatus(type, 'denied');
          }
          // 如果设备 label 为空，说明还没有获得权限
          if (!audioInput.label) {
            return this.createStatus(type, 'prompt');
          }
          return this.createStatus(type, 'granted');
        } catch {
          return this.createStatus(type, 'prompt');
        }
      }

      case 'location': {
        try {
          const { Geolocation } = await import('@capacitor/geolocation');
          const result = await Geolocation.checkPermissions();
          const state = result.location as string;
          return this.createStatus(type, this.mapCapacitorState(state));
        } catch {
          return this.createStatus(type, 'prompt');
        }
      }

      case 'storage': {
        return await this.checkNativeStoragePermission();
      }

      case 'notification': {
        try {
          const { LocalNotifications } = await import('@capacitor/local-notifications');
          const result = await LocalNotifications.checkPermissions();
          const state = result.display as string;
          return this.createStatus(type, this.mapCapacitorState(state));
        } catch {
          return this.createStatus(type, 'prompt');
        }
      }

      case 'biometric': {
        try {
          const { Biometrics } = await import('@capacitor/biometrics');
          const result = await Biometrics.checkPermissions?.();
          if (result) {
            return this.createStatus(type, this.mapCapacitorState(result.access as string));
          }
          // 如果没有 checkPermissions，尝试 isAvailable
          const available = await Biometrics.isAvailable();
          return this.createStatus(type, available.isAvailable ? 'granted' : 'denied');
        } catch {
          return this.createStatus(type, 'prompt');
        }
      }

      default:
        return this.createStatus(type, 'prompt');
    }
  }

  // ─── 原生存储权限检查 ──────────────────────────────────────

  private async checkNativeStoragePermission(): Promise<PermissionStatus> {
    const sdkVersion = await getAndroidSdkVersion();

    if (sdkVersion >= 33) {
      // Android 13+ (API 33+): 细粒度媒体权限
      // READ_MEDIA_IMAGES, READ_MEDIA_VIDEO, READ_MEDIA_AUDIO
      // Android 14+ (API 34+): READ_MEDIA_VISUAL_USER_SELECTED（部分媒体权限）
      try {
        // 尝试使用 Capacitor 自定义权限插件
        const { PermissionsPlugin } = await import('@capacitor/core') as Record<string, unknown>;
        if (PermissionsPlugin) {
          const Plugins = (await import('@capacitor/core')).Plugins;
          const permPlugin = Plugins.PermissionsPlugin as {
            checkPermission?: (opts: { permission: string }) => Promise<{ result: string }>;
          } | undefined;
          if (permPlugin?.checkPermission) {
            // Android 16 (API 36): 检查部分媒体权限
            if (sdkVersion >= 36) {
              const visualResult = await permPlugin.checkPermission({
                permission: 'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
              });
              if (visualResult.result === 'granted') {
                return this.createStatusWithAutoReset('storage', 'granted');
              }
            }
            const imagesResult = await permPlugin.checkPermission({
              permission: 'android.permission.READ_MEDIA_IMAGES',
            });
            return this.createStatusWithAutoReset('storage', this.mapCapacitorState(imagesResult.result));
          }
        }
      } catch {
        // 自定义插件不可用，降级
      }

      // 降级：Android 13+ 存储权限通常自动授予（Scoped Storage）
      return this.createStatusWithAutoReset('storage', 'granted');
    }

    if (sdkVersion > 0) {
      // Android 12 及以下：READ_EXTERNAL_STORAGE
      try {
        const Plugins = (await import('@capacitor/core')).Plugins;
        const permPlugin = Plugins.PermissionsPlugin as {
          checkPermission?: (opts: { permission: string }) => Promise<{ result: string }>;
        } | undefined;
        if (permPlugin?.checkPermission) {
          const result = await permPlugin.checkPermission({
            permission: 'android.permission.READ_EXTERNAL_STORAGE',
          });
          return this.createStatusWithAutoReset('storage', this.mapCapacitorState(result.result));
        }
      } catch {
        // 降级
      }
    }

    return this.createStatus('storage', 'prompt');
  }

  // ─── 原生权限请求 ──────────────────────────────────────────

  private async requestNativePermission(type: PermissionType): Promise<boolean> {
    switch (type) {
      case 'camera': {
        try {
          const { Camera } = await import('@capacitor/camera');
          const result = await Camera.requestPermissions();
          return result.camera === 'granted';
        } catch {
          return false;
        }
      }

      case 'microphone': {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          return true;
        } catch {
          return false;
        }
      }

      case 'location': {
        try {
          const { Geolocation } = await import('@capacitor/geolocation');
          const result = await Geolocation.requestPermissions();
          return result.location === 'granted';
        } catch {
          return false;
        }
      }

      case 'storage': {
        return await this.requestNativeStoragePermission();
      }

      case 'notification': {
        try {
          const { PushNotifications } = await import('@capacitor/push-notifications');
          const result = await PushNotifications.requestPermissions();
          return result.receive === 'granted';
        } catch {
          // 降级到本地通知权限
          try {
            const { LocalNotifications } = await import('@capacitor/local-notifications');
            const result = await LocalNotifications.requestPermissions();
            return result.display === 'granted';
          } catch {
            return false;
          }
        }
      }

      case 'biometric': {
        try {
          const { Biometrics } = await import('@capacitor/biometrics');
          // BiometricPrompt 验证
          await Biometrics.authenticate({
            reason: PERMISSION_CONFIGS.biometric.requestMessage,
          });
          return true;
        } catch {
          return false;
        }
      }

      default:
        return false;
    }
  }

  // ─── 原生存储权限请求 ──────────────────────────────────────

  private async requestNativeStoragePermission(): Promise<boolean> {
    const sdkVersion = await getAndroidSdkVersion();

    try {
      const Plugins = (await import('@capacitor/core')).Plugins;
      const permPlugin = Plugins.PermissionsPlugin as {
        requestPermission?: (opts: { permission: string }) => Promise<{ result: string }>;
        requestPermissions?: (opts: { permissions: string[] }) => Promise<{ results: Record<string, string> }>;
      } | undefined;

      if (permPlugin?.requestPermissions) {
        if (sdkVersion >= 33) {
          // Android 13+: 请求细粒度媒体权限
          const permissions = ['android.permission.READ_MEDIA_IMAGES'];
          if (sdkVersion >= 36) {
            // Android 16: 同时请求部分媒体权限
            permissions.push('android.permission.READ_MEDIA_VISUAL_USER_SELECTED');
          }
          const result = await permPlugin.requestPermissions({ permissions });
          return Object.values(result.results).some(v => v === 'granted');
        }

        // Android 12 及以下
        const result = await permPlugin.requestPermissions({
          permissions: ['android.permission.READ_EXTERNAL_STORAGE'],
        });
        return Object.values(result.results).some(v => v === 'granted');
      }

      if (permPlugin?.requestPermission) {
        const permission = sdkVersion >= 33
          ? 'android.permission.READ_MEDIA_IMAGES'
          : 'android.permission.READ_EXTERNAL_STORAGE';
        const result = await permPlugin.requestPermission({ permission });
        return result.result === 'granted';
      }
    } catch {
      // 降级
    }

    // 最终降级：Android 13+ Scoped Storage 通常不需要显式请求
    if (sdkVersion >= 33) {
      return true;
    }

    return false;
  }

  // ─── Web 权限检查 ──────────────────────────────────────────

  private async checkWebPermission(type: PermissionType): Promise<PermissionStatus> {
    switch (type) {
      case 'camera': {
        try {
          const result = await navigator.permissions.query({ name: 'camera' });
          return this.createStatus(type, result.state);
        } catch {
          return this.createStatus(type, 'prompt');
        }
      }

      case 'microphone': {
        try {
          const result = await navigator.permissions.query({ name: 'microphone' });
          return this.createStatus(type, result.state);
        } catch {
          return this.createStatus(type, 'prompt');
        }
      }

      case 'location': {
        try {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          return this.createStatus(type, result.state);
        } catch {
          return this.createStatus(type, 'prompt');
        }
      }

      case 'storage': {
        // Web 环境下存储权限通常默认授予（IndexedDB / localStorage）
        // 检查是否可用
        try {
          if (navigator.storage && navigator.storage.estimate) {
            return this.createStatus(type, 'granted');
          }
        } catch {
          // 忽略
        }
        return this.createStatus(type, 'granted');
      }

      case 'notification': {
        if ('Notification' in window) {
          const permission = Notification.permission;
          return this.createStatus(type, permission as PermissionState);
        }
        return this.createStatus(type, 'denied');
      }

      case 'biometric': {
        // Web 环境：使用 WebAuthn 检测
        if (window.PublicKeyCredential) {
          try {
            const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            return this.createStatus(type, available ? 'granted' : 'denied');
          } catch {
            return this.createStatus(type, 'denied');
          }
        }
        return this.createStatus(type, 'denied');
      }

      default:
        return this.createStatus(type, 'prompt');
    }
  }

  // ─── Web 权限请求 ──────────────────────────────────────────

  private async requestWebPermission(type: PermissionType): Promise<boolean> {
    switch (type) {
      case 'camera': {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
          return true;
        } catch {
          return false;
        }
      }

      case 'microphone': {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          return true;
        } catch {
          return false;
        }
      }

      case 'location': {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => resolve(true),
            () => resolve(false),
            { timeout: 10000 }
          );
        });
      }

      case 'storage': {
        // Web 环境下存储权限默认授予
        try {
          if (navigator.storage && navigator.storage.persist) {
            const persisted = await navigator.storage.persist();
            return persisted;
          }
        } catch {
          // 忽略
        }
        return true;
      }

      case 'notification': {
        if ('Notification' in window) {
          const result = await Notification.requestPermission();
          return result === 'granted';
        }
        return false;
      }

      case 'biometric': {
        // Web 环境：无法直接请求 WebAuthn 权限，只能检查可用性
        if (window.PublicKeyCredential) {
          try {
            return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          } catch {
            return false;
          }
        }
        return false;
      }

      default:
        return false;
    }
  }

  // ─── 状态映射与创建 ────────────────────────────────────────

  private mapCapacitorState(state: string): PermissionState {
    switch (state) {
      case 'granted':
      case 'authorized':
        return 'granted';
      case 'denied':
      case 'unavailable':
        return 'denied';
      case 'prompt':
      case 'prompt-with-rationale':
      case 'not-determined':
      case 'ask':
        return 'prompt';
      case 'limited':
      case 'restricted':
        return 'granted'; // limited 仍视为已授权
      default:
        return 'prompt';
    }
  }

  private createStatus(type: PermissionType, state: PermissionState): PermissionStatus {
    const persisted = loadPersistedStatus(type);
    const autoResetDetected = checkAutoReset(type, persisted ? new Date(persisted.lastChecked) : null);

    const status: PermissionStatus = {
      type,
      granted: state === 'granted',
      denied: state === 'denied',
      prompt: state === 'prompt',
      canRequest: state !== 'denied',
      lastChecked: new Date(),
      autoResetDetected,
    };

    // Android 16: 如果检测到权限自动重置，标记为可重新请求
    if (autoResetDetected && status.denied) {
      status.canRequest = true;
      status.prompt = true;
      status.denied = false;
    }

    this.permissionStatuses.set(type, status);
    persistPermissionStatus(type, status);

    if (status.denied) {
      this.notifyDenial(type);
    }

    return status;
  }

  private createStatusWithAutoReset(type: PermissionType, state: PermissionState): PermissionStatus {
    return this.createStatus(type, state);
  }

  // ─── 拒绝处理 ──────────────────────────────────────────────

  private handleDenial(type: PermissionType, _config: PermissionConfig): void {
    const status = this.permissionStatuses.get(type);
    if (status) {
      status.denied = true;
      status.granted = false;
      status.canRequest = false;
      persistPermissionStatus(type, status);
    }
    this.notifyDenial(type);
  }

  private notifyDenial(type: PermissionType): void {
    const callbacks = this.denialCallbacks.get(type) || [];
    callbacks.forEach(cb => cb());
  }

  // ─── 公共 API ──────────────────────────────────────────────

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
    const types: PermissionType[] = ['camera', 'microphone', 'location', 'storage', 'notification', 'biometric'];

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

  // ─── Android 16 特殊 API ───────────────────────────────────

  /**
   * 检测权限是否被系统自动重置（Android 16 特性）
   * 长时间未使用的应用权限会被系统自动撤销
   */
  async detectAutoResetPermissions(): Promise<PermissionType[]> {
    if (!capacitorBridge.isNative() || capacitorBridge.getPlatform() !== 'android') {
      return [];
    }

    const sdkVersion = await getAndroidSdkVersion();
    if (sdkVersion < 36) return []; // 仅 Android 16+

    const resetPermissions: PermissionType[] = [];
    const types: PermissionType[] = ['camera', 'microphone', 'location', 'storage', 'notification', 'biometric'];

    for (const type of types) {
      const persisted = loadPersistedStatus(type);
      if (checkAutoReset(type, persisted ? new Date(persisted.lastChecked) : null)) {
        // 重新检查实际权限状态
        const currentStatus = await this.checkPermission(type);
        if (currentStatus.autoResetDetected) {
          resetPermissions.push(type);
        }
      }
    }

    return resetPermissions;
  }

  /**
   * 检查前台服务类型权限（Android 16 新增）
   * Android 16 要求前台服务必须声明具体类型
   */
  async checkForegroundServicePermission(): Promise<boolean> {
    if (!capacitorBridge.isNative() || capacitorBridge.getPlatform() !== 'android') {
      return true;
    }

    const sdkVersion = await getAndroidSdkVersion();
    if (sdkVersion < 36) return true;

    try {
      const Plugins = (await import('@capacitor/core')).Plugins;
      const permPlugin = Plugins.PermissionsPlugin as {
        checkPermission?: (opts: { permission: string }) => Promise<{ result: string }>;
      } | undefined;
      if (permPlugin?.checkPermission) {
        const result = await permPlugin.checkPermission({
          permission: 'android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE',
        });
        return result.result === 'granted';
      }
    } catch {
      // 降级
    }

    return true;
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
