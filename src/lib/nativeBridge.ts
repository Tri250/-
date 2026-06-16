/**
 * Native Bridge - Android 原生功能桥接层
 *
 * 通过 PawSyncNative JavaScriptInterface 调用 Android 原生能力
 * 完全替代 Web 端降级方案，实现真正的原生体验
 */

import { platformCheck } from './platformService';

// Android 原生桥接接口声明
interface PawSyncNativeInterface {
  // 生物识别
  getBiometricStatus(): string;
  authenticateBiometric(title: string, subtitle: string): void;

  // 网络状态
  getNetworkStatus(): string;

  // 电量状态
  getBatteryStatus(): string;

  // 设备信息
  getDeviceInfo(): string;

  // 应用信息
  getAppInfo(): string;

  // 触觉反馈
  hapticFeedback(type: 'light' | 'medium' | 'heavy'): void;

  // 状态栏颜色
  setStatusBarColor(color: string): void;
  setNavigationBarColor(color: string): void;

  // 屏幕亮度
  setScreenBrightness(brightness: number): void;
  getScreenBrightness(): number;

  // 保持屏幕常亮
  keepScreenOn(keepOn: boolean): void;

  // 返回键
  onBackPressed(): void;
}

declare global {
  interface Window {
    PawSyncNative?: PawSyncNativeInterface;
  }
}

/**
 * 获取 Android 原生桥接实例
 */
function getNativeBridge(): PawSyncNativeInterface | null {
  if (platformCheck.isAndroid() && window.PawSyncNative) {
    return window.PawSyncNative;
  }
  return null;
}

// ============================================================
// 生物识别服务
// ============================================================

export interface BiometricStatus {
  available: boolean;
  message: string;
  status: number;
}

export const NativeBiometric = {
  /** 检查是否支持生物识别 */
  isAvailable(): boolean {
    const bridge = getNativeBridge();
    if (!bridge) return false;
    try {
      const status = JSON.parse(bridge.getBiometricStatus()) as BiometricStatus;
      return status.available;
    } catch {
      return false;
    }
  },

  /** 获取生物识别状态 */
  getStatus(): BiometricStatus {
    const bridge = getNativeBridge();
    if (!bridge) {
      return { available: false, message: '非原生环境', status: -1 };
    }
    try {
      return JSON.parse(bridge.getBiometricStatus()) as BiometricStatus;
    } catch {
      return { available: false, message: '解析失败', status: -1 };
    }
  },

  /** 发起生物识别认证 */
  authenticate(title: string, subtitle: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      const bridge = getNativeBridge();
      if (!bridge) {
        resolve({ success: false, error: '非原生环境' });
        return;
      }

      const cleanup = () => {
        window.removeEventListener('biometricSuccess', onSuccess);
        window.removeEventListener('biometricError', onError as EventListener);
        window.removeEventListener('biometricFailed', onFailed);
      };

      const onSuccess = () => {
        cleanup();
        resolve({ success: true });
      };

      const onError = (e: Event) => {
        cleanup();
        resolve({ success: false, error: (e as CustomEvent).detail || '未知错误' });
      };

      const onFailed = () => {
        cleanup();
        resolve({ success: false, error: '验证失败' });
      };

      window.addEventListener('biometricSuccess', onSuccess, { once: true });
      window.addEventListener('biometricError', onError as EventListener, { once: true });
      window.addEventListener('biometricFailed', onFailed, { once: true });

      bridge.authenticateBiometric(title, subtitle);
    });
  },
};

// ============================================================
// 网络状态服务
// ============================================================

export interface NetworkStatus {
  connected: boolean;
  type: 'wifi' | 'cellular' | 'ethernet' | 'other' | 'none' | 'error';
  metered?: boolean;
}

export const NativeNetwork = {
  /** 获取网络状态 */
  getStatus(): NetworkStatus {
    const bridge = getNativeBridge();
    if (!bridge) {
      return { connected: navigator.onLine, type: navigator.onLine ? 'other' : 'none' };
    }
    try {
      return JSON.parse(bridge.getNetworkStatus()) as NetworkStatus;
    } catch {
      return { connected: false, type: 'error' };
    }
  },

  /** 监听网络变化 */
  onChange(callback: (status: NetworkStatus) => void): () => void {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        callback(detail as NetworkStatus);
      }
    };
    window.addEventListener('networkChanged', handler);
    return () => window.removeEventListener('networkChanged', handler);
  },
};

// ============================================================
// 电量服务
// ============================================================

export interface BatteryStatus {
  level: number;
  charging: boolean;
  lowPower: boolean;
}

export const NativeBattery = {
  /** 获取电量状态 */
  getStatus(): BatteryStatus {
    const bridge = getNativeBridge();
    if (!bridge) {
      return { level: -1, charging: false, lowPower: false };
    }
    try {
      return JSON.parse(bridge.getBatteryStatus()) as BatteryStatus;
    } catch {
      return { level: -1, charging: false, lowPower: false };
    }
  },

  /** 监听电量变化 */
  onBatteryLow(callback: () => void): () => void {
    window.addEventListener('batteryLow', callback);
    return () => window.removeEventListener('batteryLow', callback);
  },

  onPowerConnected(callback: () => void): () => void {
    window.addEventListener('powerConnected', callback);
    return () => window.removeEventListener('powerConnected', callback);
  },

  onPowerDisconnected(callback: () => void): () => void {
    window.addEventListener('powerDisconnected', callback);
    return () => window.removeEventListener('powerDisconnected', callback);
  },
};

// ============================================================
// 设备信息服务
// ============================================================

export interface DeviceInfo {
  platform: string;
  version: string;
  sdk: number;
  manufacturer: string;
  model: string;
  brand: string;
  isLowRam: boolean;
  language: string;
  timezone: string;
}

export const NativeDevice = {
  /** 获取设备信息 */
  getInfo(): DeviceInfo {
    const bridge = getNativeBridge();
    if (!bridge) {
      return {
        platform: 'web',
        version: '0',
        sdk: 0,
        manufacturer: 'unknown',
        model: 'unknown',
        brand: 'unknown',
        isLowRam: false,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    }
    try {
      return JSON.parse(bridge.getDeviceInfo()) as DeviceInfo;
    } catch {
      return {
        platform: 'android',
        version: '0',
        sdk: 0,
        manufacturer: 'unknown',
        model: 'unknown',
        brand: 'unknown',
        isLowRam: false,
        language: 'unknown',
        timezone: 'unknown',
      };
    }
  },
};

// ============================================================
// 应用信息服务
// ============================================================

export interface AppInfo {
  versionName: string;
  versionCode: number;
  packageName: string;
  debug: boolean;
}

export const NativeApp = {
  /** 获取应用信息 */
  getInfo(): AppInfo {
    const bridge = getNativeBridge();
    if (!bridge) {
      return { versionName: '1.0.0', versionCode: 1, packageName: 'com.pawsync.pro', debug: false };
    }
    try {
      return JSON.parse(bridge.getAppInfo()) as AppInfo;
    } catch {
      return { versionName: 'unknown', versionCode: 1, packageName: '', debug: false };
    }
  },
};

// ============================================================
// 原生触觉反馈
// ============================================================

export const NativeHaptics = {
  light(): void {
    getNativeBridge()?.hapticFeedback('light');
  },
  medium(): void {
    getNativeBridge()?.hapticFeedback('medium');
  },
  heavy(): void {
    getNativeBridge()?.hapticFeedback('heavy');
  },
};

// ============================================================
// 系统栏控制
// ============================================================

export const NativeSystemBars = {
  /** 设置状态栏颜色 */
  setStatusBarColor(color: string): void {
    getNativeBridge()?.setStatusBarColor(color);
  },

  /** 设置导航栏颜色 */
  setNavigationBarColor(color: string): void {
    getNativeBridge()?.setNavigationBarColor(color);
  },
};

// ============================================================
// 屏幕控制
// ============================================================

export const NativeScreen = {
  /** 设置屏幕亮度 (0.0 ~ 1.0) */
  setBrightness(brightness: number): void {
    getNativeBridge()?.setScreenBrightness(brightness);
  },

  /** 获取当前亮度 */
  getBrightness(): number {
    return getNativeBridge()?.getScreenBrightness() ?? -1;
  },

  /** 保持屏幕常亮 */
  keepScreenOn(keepOn: boolean): void {
    getNativeBridge()?.keepScreenOn(keepOn);
  },
};

// ============================================================
// 原生返回键监听
// ============================================================

export const NativeBackButton = {
  /** 监听 Android 返回键 */
  onBackPressed(callback: () => boolean): () => void {
    const handler = () => {
      const handled = callback();
      if (!handled) {
        getNativeBridge()?.onBackPressed();
      }
    };
    window.addEventListener('androidBackPressed', handler);
    return () => window.removeEventListener('androidBackPressed', handler);
  },
};

// ============================================================
// 应用生命周期
// ============================================================

export const NativeLifecycle = {
  /** 应用进入后台 */
  onBackground(callback: () => void): () => void {
    window.addEventListener('appBackground', callback);
    return () => window.removeEventListener('appBackground', callback);
  },
};

// 导出所有原生服务
export const NativeServices = {
  biometric: NativeBiometric,
  network: NativeNetwork,
  battery: NativeBattery,
  device: NativeDevice,
  app: NativeApp,
  haptics: NativeHaptics,
  systemBars: NativeSystemBars,
  screen: NativeScreen,
  backButton: NativeBackButton,
  lifecycle: NativeLifecycle,
  isAvailable: () => getNativeBridge() !== null,
};

export default NativeServices;