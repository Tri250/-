/**
 * PermissionManager - 统一权限管理服务
 *
 * 整合了原有的两套权限服务，提供完整的权限生命周期管理：
 * - 权限检查与请求
 * - 状态持久化（拒绝次数、最后请求时间）
 * - Rationale 教育弹窗配置
 * - 跳转系统设置
 * - Android 13+ 存储权限适配
 * - Android 16 权限自动重置检测
 * - 按场景请求权限
 * - 权限健康诊断报告
 *
 * 保持向后兼容，旧的 PermissionService API 仍然可用
 */

import { platformCheck } from './platformService';

// ============================================================
// 类型定义
// ============================================================

export type PermissionType =
  | 'camera'
  | 'microphone'
  | 'notification'
  | 'storage'
  | 'location'
  | 'biometric';

export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unknown';

export interface PermissionResult {
  status: PermissionStatus;
  canRequest: boolean;
  message?: string;
}

export interface PermissionState {
  type: PermissionType;
  status: PermissionStatus;
  canRequest: boolean;
  denialCount: number;
  lastRequestTime: number | null;
  lastCheckTime: number;
  permanentlyDenied: boolean;
  autoResetDetected: boolean;
}

export interface PermissionRationale {
  title: string;
  message: string;
  whyNeeded: string;
  icon?: string;
}

export interface PermissionConfig {
  type: PermissionType;
  required: boolean;
  description: string;
  rationale: PermissionRationale;
  fallbackMessage: string;
  requestMessage: string;
  scenarios: string[];
  androidMinSdk?: number;
  androidMaxSdk?: number;
}

export interface PermissionHealthReport {
  overallStatus: 'healthy' | 'warning' | 'critical';
  permissions: Record<PermissionType, {
    status: PermissionStatus;
    denialCount: number;
    permanentlyDenied: boolean;
    lastRequestTime: number | null;
    issues: string[];
  }>;
  summary: {
    total: number;
    granted: number;
    denied: number;
    prompt: number;
    permanentlyDenied: number;
  };
  recommendations: string[];
  lastCheckTime: number;
}

export interface PermissionSceneRequest {
  scene: string;
  permissions: PermissionType[];
  description: string;
}

// ============================================================
// 权限配置
// ============================================================

const PERMISSION_CONFIGS: Record<PermissionType, PermissionConfig> = {
  camera: {
    type: 'camera',
    required: false,
    description: '用于拍摄宠物照片和视频',
    rationale: {
      title: '相机权限',
      message: '需要访问您的相机来拍摄宠物照片和视频',
      whyNeeded: '拍摄宠物可爱瞬间、记录成长、用于AI健康分析等功能都需要相机权限',
    },
    fallbackMessage: '相机权限未开启，无法使用拍照功能，请手动开启权限',
    requestMessage: '需要相机权限来拍摄宠物照片和视频',
    scenarios: ['camera', 'photo', 'video', 'health-record', 'pet-profile'],
  },
  microphone: {
    type: 'microphone',
    required: false,
    description: '用于录制宠物声音进行翻译',
    rationale: {
      title: '麦克风权限',
      message: '需要访问您的麦克风来录制宠物声音',
      whyNeeded: '宠物声音翻译、语音记录、情绪分析等功能需要麦克风权限来采集声音数据',
    },
    fallbackMessage: '麦克风权限未开启，无法使用语音翻译功能，请手动开启权限',
    requestMessage: '需要麦克风权限来录制宠物声音',
    scenarios: ['translator', 'voice-memory', 'emotion-analysis', 'audio-record'],
  },
  notification: {
    type: 'notification',
    required: false,
    description: '用于接收健康提醒和通知',
    rationale: {
      title: '通知权限',
      message: '需要通知权限来向您发送重要提醒',
      whyNeeded: '健康提醒、用药通知、宠物状态更新等重要信息都通过通知推送',
    },
    fallbackMessage: '通知权限未开启，无法接收重要提醒',
    requestMessage: '需要通知权限来接收健康提醒',
    scenarios: ['reminders', 'health-alerts', 'notifications', 'background'],
  },
  storage: {
    type: 'storage',
    required: false,
    description: '用于保存宠物照片和记录',
    rationale: {
      title: '存储权限',
      message: '需要存储权限来保存宠物照片和记录',
      whyNeeded: '保存宠物照片、导出健康记录、备份数据等功能需要存储权限',
    },
    fallbackMessage: '存储权限未开启，无法保存照片和记录',
    requestMessage: '需要存储权限来保存宠物照片和记录',
    scenarios: ['save-photo', 'export', 'backup', 'file-access'],
    androidMaxSdk: 32,
  },
  location: {
    type: 'location',
    required: false,
    description: '用于推荐附近的宠物服务',
    rationale: {
      title: '位置权限',
      message: '需要位置权限来推荐附近的宠物服务',
      whyNeeded: '附近宠物医院推荐、宠物走失定位、周边服务搜索等功能需要位置信息',
    },
    fallbackMessage: '位置权限未开启，无法推荐附近服务',
    requestMessage: '需要位置权限来推荐附近的宠物服务',
    scenarios: ['nearby', 'location', 'map', 'lost-pet'],
  },
  biometric: {
    type: 'biometric',
    required: false,
    description: '用于生物识别快速登录和隐私保护',
    rationale: {
      title: '生物识别权限',
      message: '需要生物识别权限来保护您的隐私数据',
      whyNeeded: '使用指纹或面容识别快速登录、保护敏感健康数据、快速验证身份',
    },
    fallbackMessage: '生物识别未开启，无法使用快速登录',
    requestMessage: '需要生物识别权限来保护您的隐私',
    scenarios: ['login', 'privacy', 'secure-data', 'authentication'],
  },
};

const STORAGE_KEY = 'permission_manager_state';

// ============================================================
// PermissionManager 类
// ============================================================

class PermissionManager {
  private permissionStates: Map<PermissionType, PermissionState> = new Map();
  private denialCallbacks: Map<PermissionType, (() => void)[]> = new Map();
  private initialized = false;

  constructor() {
    this.initDefaultStates();
  }

  private initDefaultStates(): void {
    const types: PermissionType[] = ['camera', 'microphone', 'notification', 'storage', 'location', 'biometric'];
    const now = Date.now();
    for (const type of types) {
      this.permissionStates.set(type, {
        type,
        status: 'unknown',
        canRequest: true,
        denialCount: 0,
        lastRequestTime: null,
        lastCheckTime: now,
        permanentlyDenied: false,
        autoResetDetected: false,
      });
    }
  }

  // ============================================================
  // 初始化与持久化
  // ============================================================

  async initialize(): Promise<void> {
    if (this.initialized) return;
    try {
      await this.loadPersistedState();
      this.initialized = true;
    } catch (error) {
      console.warn('[PermissionManager] Initialize failed:', error);
    }
  }

  private async loadPersistedState(): Promise<void> {
    try {
      let stored: string | null = null;

      if (platformCheck.isNative()) {
        try {
          const { Preferences } = await import('@capacitor/preferences');
          const result = await Preferences.get({ key: STORAGE_KEY });
          stored = result.value;
        } catch {
          stored = localStorage.getItem(STORAGE_KEY);
        }
      } else {
        stored = localStorage.getItem(STORAGE_KEY);
      }

      if (stored) {
        const parsed = JSON.parse(stored) as Partial<Record<PermissionType, PermissionState>>;
        for (const type of Object.keys(parsed) as PermissionType[]) {
          const saved = parsed[type];
          if (saved) {
            const existing = this.permissionStates.get(type);
            if (existing) {
              this.permissionStates.set(type, { ...existing, ...saved });
            }
          }
        }
      }
    } catch (error) {
      console.warn('[PermissionManager] Load persisted state failed:', error);
    }
  }

  private async persistState(): Promise<void> {
    try {
      const stateObj: Record<string, PermissionState> = {};
      this.permissionStates.forEach((value, key) => {
        stateObj[key] = value;
      });
      const serialized = JSON.stringify(stateObj);

      if (platformCheck.isNative()) {
        try {
          const { Preferences } = await import('@capacitor/preferences');
          await Preferences.set({ key: STORAGE_KEY, value: serialized });
          return;
        } catch {
          // fallback to localStorage
        }
      }
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (error) {
      console.warn('[PermissionManager] Persist state failed:', error);
    }
  }

  private updateState(type: PermissionType, updates: Partial<PermissionState>): void {
    const current = this.permissionStates.get(type);
    if (current) {
      this.permissionStates.set(type, { ...current, ...updates });
      this.persistState();
    }
  }

  // ============================================================
  // 权限检查
  // ============================================================

  async checkPermission(type: PermissionType): Promise<PermissionResult> {
    await this.ensureInitialized();

    let result: PermissionResult;

    switch (type) {
      case 'camera':
        result = await this.checkCameraPermission();
        break;
      case 'microphone':
        result = await this.checkMicrophonePermission();
        break;
      case 'notification':
        result = await this.checkNotificationPermission();
        break;
      case 'storage':
        result = await this.checkStoragePermission();
        break;
      case 'location':
        result = await this.checkLocationPermission();
        break;
      case 'biometric':
        result = await this.checkBiometricPermission();
        break;
      default:
        result = { status: 'unknown', canRequest: true, message: '未知权限类型' };
    }

    const permanentlyDenied = result.status === 'denied' && !result.canRequest;

    this.updateState(type, {
      status: result.status,
      canRequest: result.canRequest,
      lastCheckTime: Date.now(),
      permanentlyDenied,
    });

    if (result.status === 'denied') {
      this.notifyDenial(type);
    }

    return result;
  }

  private async checkCameraPermission(): Promise<PermissionResult> {
    if (platformCheck.isNative()) {
      try {
        const { Camera } = await import('@capacitor/camera');
        const permissions = await Camera.checkPermissions();
        const cameraState = permissions.camera;
        const status = this.normalizeCapacitorStatus(cameraState);
        return {
          status,
          canRequest: status === 'prompt' || status === 'unknown',
          message: this.getStatusMessage('camera', status),
        };
      } catch (error) {
        console.error('[PermissionManager] Camera check failed:', error);
        return { status: 'unknown', canRequest: true, message: '无法检查相机权限' };
      }
    }

    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        const status = result.state as PermissionStatus;
        return {
          status,
          canRequest: status === 'prompt',
          message: this.getStatusMessage('camera', status),
        };
      } catch {
        return { status: 'prompt', canRequest: true, message: this.getStatusMessage('camera', 'prompt') };
      }
    }

    return { status: 'prompt', canRequest: true, message: this.getStatusMessage('camera', 'prompt') };
  }

  private async checkMicrophonePermission(): Promise<PermissionResult> {
    if (platformCheck.isNative()) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasMicrophone = devices.some(device => device.kind === 'audioinput');
        if (!hasMicrophone) {
          return { status: 'denied', canRequest: false, message: '未检测到麦克风设备' };
        }
        return { status: 'prompt', canRequest: true, message: this.getStatusMessage('microphone', 'prompt') };
      } catch (error) {
        console.error('[PermissionManager] Microphone check failed:', error);
        return { status: 'unknown', canRequest: true, message: '无法检查麦克风权限' };
      }
    }

    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        const status = result.state as PermissionStatus;
        return {
          status,
          canRequest: status === 'prompt',
          message: this.getStatusMessage('microphone', status),
        };
      } catch {
        return { status: 'prompt', canRequest: true, message: this.getStatusMessage('microphone', 'prompt') };
      }
    }

    return { status: 'prompt', canRequest: true, message: this.getStatusMessage('microphone', 'prompt') };
  }

  private async checkNotificationPermission(): Promise<PermissionResult> {
    if (platformCheck.isNative()) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const result = await LocalNotifications.checkPermissions();
        const status = this.normalizeCapacitorStatus(result.display);
        return {
          status,
          canRequest: status === 'prompt' || status === 'unknown',
          message: this.getStatusMessage('notification', status),
        };
      } catch (error) {
        console.error('[PermissionManager] Notification check failed:', error);
        return { status: 'unknown', canRequest: true, message: '无法检查通知权限' };
      }
    }

    if ('Notification' in window) {
      const permission = Notification.permission;
      const status = permission === 'default' ? 'prompt' : (permission as PermissionStatus);
      return {
        status,
        canRequest: status === 'prompt',
        message: this.getStatusMessage('notification', status),
      };
    }

    return { status: 'denied', canRequest: false, message: '浏览器不支持通知功能' };
  }

  private async checkStoragePermission(): Promise<PermissionResult> {
    if (platformCheck.isAndroid()) {
      try {
        const sdkLevel = await this.getAndroidSdkLevel();
        if (sdkLevel >= 33) {
          return { status: 'granted', canRequest: false, message: 'Android 13+ 使用 Scoped Storage，无需存储权限' };
        }
        return { status: 'prompt', canRequest: true, message: this.getStatusMessage('storage', 'prompt') };
      } catch {
        return { status: 'granted', canRequest: false, message: '存储权限已授权' };
      }
    }

    if (platformCheck.isNative()) {
      return { status: 'granted', canRequest: false, message: '存储权限已授权' };
    }

    return { status: 'granted', canRequest: false, message: 'Web 环境不需要存储权限' };
  }

  private async checkLocationPermission(): Promise<PermissionResult> {
    if (platformCheck.isNative()) {
      try {
        const { Geolocation } = await import('@capacitor/geolocation');
        const result = await Geolocation.checkPermissions();
        const status = this.normalizeCapacitorStatus(result.location);
        return {
          status,
          canRequest: status === 'prompt' || status === 'unknown',
          message: this.getStatusMessage('location', status),
        };
      } catch {
        // Geolocation plugin 可能未安装
      }
    }

    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        const status = result.state as PermissionStatus;
        return {
          status,
          canRequest: status === 'prompt',
          message: this.getStatusMessage('location', status),
        };
      } catch {
        return { status: 'prompt', canRequest: true, message: this.getStatusMessage('location', 'prompt') };
      }
    }

    return { status: 'prompt', canRequest: true, message: this.getStatusMessage('location', 'prompt') };
  }

  private async checkBiometricPermission(): Promise<PermissionResult> {
    if (platformCheck.isNative()) {
      return { status: 'prompt', canRequest: true, message: this.getStatusMessage('biometric', 'prompt') };
    }
    return { status: 'prompt', canRequest: true, message: this.getStatusMessage('biometric', 'prompt') };
  }

  // ============================================================
  // 权限请求
  // ============================================================

  async requestPermission(type: PermissionType): Promise<PermissionResult> {
    await this.ensureInitialized();

    const state = this.permissionStates.get(type);
    if (state?.permanentlyDenied) {
      return {
        status: 'denied',
        canRequest: false,
        message: PERMISSION_CONFIGS[type].fallbackMessage,
      };
    }

    let result: PermissionResult;

    switch (type) {
      case 'camera':
        result = await this.requestCameraPermission();
        break;
      case 'microphone':
        result = await this.requestMicrophonePermission();
        break;
      case 'notification':
        result = await this.requestNotificationPermission();
        break;
      case 'storage':
        result = await this.requestStoragePermission();
        break;
      case 'location':
        result = await this.requestLocationPermission();
        break;
      case 'biometric':
        result = await this.requestBiometricPermission();
        break;
      default:
        result = { status: 'unknown', canRequest: true, message: '未知权限类型' };
    }

    const now = Date.now();
    const currentState = this.permissionStates.get(type);
    const newDenialCount = result.status === 'denied'
      ? (currentState?.denialCount ?? 0) + 1
      : (currentState?.denialCount ?? 0);
    const permanentlyDenied = result.status === 'denied' && newDenialCount >= 2;

    this.updateState(type, {
      status: result.status,
      canRequest: result.canRequest && !permanentlyDenied,
      denialCount: newDenialCount,
      lastRequestTime: now,
      lastCheckTime: now,
      permanentlyDenied,
    });

    if (result.status === 'denied') {
      this.notifyDenial(type);
    }

    return result;
  }

  private async requestCameraPermission(): Promise<PermissionResult> {
    if (platformCheck.isNative()) {
      try {
        const { Camera } = await import('@capacitor/camera');
        const permissions = await Camera.requestPermissions();
        const status = this.normalizeCapacitorStatus(permissions.camera);
        return {
          status,
          canRequest: false,
          message: this.getStatusMessage('camera', status),
        };
      } catch (error) {
        console.error('[PermissionManager] Camera request failed:', error);
        return { status: 'denied', canRequest: false, message: '相机权限请求失败' };
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return { status: 'granted', canRequest: false, message: this.getStatusMessage('camera', 'granted') };
    } catch (error) {
      const err = error as Error;
      const isDenied = err.name === 'NotAllowedError';
      return {
        status: isDenied ? 'denied' : 'unknown',
        canRequest: false,
        message: isDenied ? '相机权限被拒绝' : '相机权限请求失败',
      };
    }
  }

  private async requestMicrophonePermission(): Promise<PermissionResult> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return { status: 'granted', canRequest: false, message: this.getStatusMessage('microphone', 'granted') };
    } catch (error) {
      const err = error as Error;
      const isDenied = err.name === 'NotAllowedError';
      return {
        status: isDenied ? 'denied' : 'unknown',
        canRequest: false,
        message: isDenied ? '麦克风权限被拒绝' : '麦克风权限请求失败',
      };
    }
  }

  private async requestNotificationPermission(): Promise<PermissionResult> {
    if (platformCheck.isNative()) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const result = await LocalNotifications.requestPermissions();
        const status = this.normalizeCapacitorStatus(result.display);
        return {
          status,
          canRequest: false,
          message: this.getStatusMessage('notification', status),
        };
      } catch (error) {
        console.error('[PermissionManager] Notification request failed:', error);
        return { status: 'denied', canRequest: false, message: '通知权限请求失败' };
      }
    }

    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      const status = permission === 'default' ? 'prompt' : (permission as PermissionStatus);
      return {
        status,
        canRequest: false,
        message: this.getStatusMessage('notification', status),
      };
    }

    return { status: 'denied', canRequest: false, message: '浏览器不支持通知功能' };
  }

  private async requestStoragePermission(): Promise<PermissionResult> {
    if (platformCheck.isAndroid()) {
      const sdkLevel = await this.getAndroidSdkLevel();
      if (sdkLevel >= 33) {
        return { status: 'granted', canRequest: false, message: 'Android 13+ 使用 Scoped Storage，无需存储权限' };
      }
    }
    return { status: 'granted', canRequest: false, message: '存储权限已授权' };
  }

  private async requestLocationPermission(): Promise<PermissionResult> {
    if (platformCheck.isNative()) {
      try {
        const { Geolocation } = await import('@capacitor/geolocation');
        const result = await Geolocation.requestPermissions();
        const status = this.normalizeCapacitorStatus(result.location);
        return {
          status,
          canRequest: false,
          message: this.getStatusMessage('location', status),
        };
      } catch (error) {
        console.error('[PermissionManager] Location request failed:', error);
        return { status: 'denied', canRequest: false, message: '位置权限请求失败' };
      }
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve({ status: 'granted', canRequest: false, message: this.getStatusMessage('location', 'granted') }),
        (error) => {
          const isDenied = error.code === error.PERMISSION_DENIED;
          resolve({
            status: isDenied ? 'denied' : 'unknown',
            canRequest: false,
            message: isDenied ? '位置权限被拒绝' : '位置权限请求失败',
          });
        },
        { timeout: 10000 }
      );
    });
  }

  private async requestBiometricPermission(): Promise<PermissionResult> {
    return { status: 'granted', canRequest: false, message: '生物识别权限已授权' };
  }

  // ============================================================
  // 确保权限（检查 + 请求）
  // ============================================================

  async ensurePermission(type: PermissionType): Promise<boolean> {
    const checkResult = await this.checkPermission(type);
    if (checkResult.status === 'granted') {
      return true;
    }
    if (checkResult.canRequest) {
      const requestResult = await this.requestPermission(type);
      return requestResult.status === 'granted';
    }
    return false;
  }

  async hasPermission(type: PermissionType): Promise<boolean> {
    const result = await this.checkPermission(type);
    return result.status === 'granted';
  }

  // ============================================================
  // 按场景请求权限
  // ============================================================

  getPermissionsForScene(scene: string): PermissionType[] {
    const types: PermissionType[] = ['camera', 'microphone', 'notification', 'storage', 'location', 'biometric'];
    return types.filter(type => PERMISSION_CONFIGS[type].scenarios.includes(scene));
  }

  async requestPermissionsForScene(scene: string): Promise<Record<PermissionType, PermissionResult>> {
    const permissions = this.getPermissionsForScene(scene);
    const results: Partial<Record<PermissionType, PermissionResult>> = {};

    for (const type of permissions) {
      results[type] = await this.ensurePermission(type)
        ? { status: 'granted', canRequest: false, message: '已授权' }
        : { status: 'denied', canRequest: false, message: '未授权' };
    }

    return results as Record<PermissionType, PermissionResult>;
  }

  async checkPermissionsForScene(scene: string): Promise<Record<PermissionType, PermissionResult>> {
    const permissions = this.getPermissionsForScene(scene);
    const results: Partial<Record<PermissionType, PermissionResult>> = {};

    for (const type of permissions) {
      results[type] = await this.checkPermission(type);
    }

    return results as Record<PermissionType, PermissionResult>;
  }

  // ============================================================
  // 跳转系统设置
  // ============================================================

  async openAppSettings(): Promise<boolean> {
    try {
      if (platformCheck.isNative()) {
        const { App } = await import('@capacitor/app');
        await App.openUrl({ url: 'app-settings:' });
        return true;
      }
      console.warn('[PermissionManager] Web 环境不支持打开应用设置');
      return false;
    } catch (error) {
      console.error('[PermissionManager] Open app settings failed:', error);
      return false;
    }
  }

  async openPermissionSettings(type: PermissionType): Promise<boolean> {
    return this.openAppSettings();
  }

  // ============================================================
  // Rationale 配置
  // ============================================================

  getRationale(type: PermissionType): PermissionRationale {
    return PERMISSION_CONFIGS[type].rationale;
  }

  getConfig(type: PermissionType): PermissionConfig {
    return PERMISSION_CONFIGS[type];
  }

  getAllConfigs(): Record<PermissionType, PermissionConfig> {
    return PERMISSION_CONFIGS;
  }

  shouldShowRationale(type: PermissionType): boolean {
    const state = this.permissionStates.get(type);
    if (!state) return false;
    return state.denialCount >= 1 && !state.permanentlyDenied;
  }

  // ============================================================
  // Android 16 权限自动重置检测
  // ============================================================

  async checkForAutoReset(): Promise<{ autoReset: boolean; affectedPermissions: PermissionType[] }> {
    const affected: PermissionType[] = [];
    const types: PermissionType[] = ['camera', 'microphone', 'notification', 'storage', 'location', 'biometric'];

    for (const type of types) {
      const state = this.permissionStates.get(type);
      if (!state) continue;

      if (state.status === 'granted' && state.lastRequestTime) {
        const daysSinceRequest = (Date.now() - state.lastRequestTime) / (1000 * 60 * 60 * 24);
        if (daysSinceRequest > 90) {
          const currentCheck = await this.checkPermission(type);
          if (currentCheck.status !== 'granted') {
            affected.push(type);
            this.updateState(type, { autoResetDetected: true });
          }
        }
      }
    }

    return {
      autoReset: affected.length > 0,
      affectedPermissions: affected,
    };
  }

  // ============================================================
  // 权限健康诊断
  // ============================================================

  async getHealthReport(): Promise<PermissionHealthReport> {
    await this.ensureInitialized();

    const types: PermissionType[] = ['camera', 'microphone', 'notification', 'storage', 'location', 'biometric'];
    const permissions: Partial<Record<PermissionType, {
      status: PermissionStatus;
      denialCount: number;
      permanentlyDenied: boolean;
      lastRequestTime: number | null;
      issues: string[];
    }>> = {};

    let granted = 0;
    let denied = 0;
    let prompt = 0;
    let permanentlyDeniedCount = 0;
    const recommendations: string[] = [];

    for (const type of types) {
      const state = this.permissionStates.get(type)!;
      const issues: string[] = [];

      if (state.status === 'granted') {
        granted++;
      } else if (state.status === 'denied') {
        denied++;
        issues.push('权限被拒绝');
      } else if (state.status === 'prompt') {
        prompt++;
        issues.push('尚未请求权限');
      } else {
        issues.push('权限状态未知');
      }

      if (state.permanentlyDenied) {
        permanentlyDeniedCount++;
        issues.push('永久拒绝，需手动开启');
        recommendations.push(`${PERMISSION_CONFIGS[type].rationale.title}已被永久拒绝，请前往设置开启`);
      }

      if (state.denialCount >= 2) {
        issues.push(`已拒绝 ${state.denialCount} 次`);
      }

      if (state.autoResetDetected) {
        issues.push('可能被系统自动重置');
      }

      permissions[type] = {
        status: state.status,
        denialCount: state.denialCount,
        permanentlyDenied: state.permanentlyDenied,
        lastRequestTime: state.lastRequestTime,
        issues,
      };
    }

    let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (permanentlyDeniedCount > 0) {
      overallStatus = 'critical';
    } else if (denied > 0 || prompt > 0) {
      overallStatus = 'warning';
    }

    if (recommendations.length === 0 && overallStatus !== 'healthy') {
      recommendations.push('建议在合适时机请求未授权的权限');
    }

    return {
      overallStatus,
      permissions: permissions as Record<PermissionType, PermissionHealthReport['permissions'][PermissionType]>,
      summary: {
        total: types.length,
        granted,
        denied,
        prompt,
        permanentlyDenied: permanentlyDeniedCount,
      },
      recommendations,
      lastCheckTime: Date.now(),
    };
  }

  async runSelfDiagnosis(): Promise<PermissionHealthReport> {
    const types: PermissionType[] = ['camera', 'microphone', 'notification', 'storage', 'location', 'biometric'];
    for (const type of types) {
      await this.checkPermission(type);
    }
    await this.checkForAutoReset();
    return this.getHealthReport();
  }

  // ============================================================
  // 状态查询
  // ============================================================

  getPermissionState(type: PermissionType): PermissionState | undefined {
    return this.permissionStates.get(type);
  }

  getAllPermissionStates(): Map<PermissionType, PermissionState> {
    return new Map(this.permissionStates);
  }

  getDenialCount(type: PermissionType): number {
    return this.permissionStates.get(type)?.denialCount ?? 0;
  }

  isPermanentlyDenied(type: PermissionType): boolean {
    return this.permissionStates.get(type)?.permanentlyDenied ?? false;
  }

  resetDenialCount(type: PermissionType): void {
    this.updateState(type, {
      denialCount: 0,
      permanentlyDenied: false,
      canRequest: true,
      autoResetDetected: false,
    });
  }

  resetAllStates(): void {
    const types: PermissionType[] = ['camera', 'microphone', 'notification', 'storage', 'location', 'biometric'];
    const now = Date.now();
    for (const type of types) {
      this.permissionStates.set(type, {
        type,
        status: 'unknown',
        canRequest: true,
        denialCount: 0,
        lastRequestTime: null,
        lastCheckTime: now,
        permanentlyDenied: false,
        autoResetDetected: false,
      });
    }
    this.persistState();
  }

  // ============================================================
  // 事件回调
  // ============================================================

  onPermissionDenied(type: PermissionType, callback: () => void): () => void {
    const callbacks = this.denialCallbacks.get(type) || [];
    callbacks.push(callback);
    this.denialCallbacks.set(type, callbacks);

    return () => {
      this.removeDenialCallback(type, callback);
    };
  }

  removeDenialCallback(type: PermissionType, callback: () => void): void {
    const callbacks = this.denialCallbacks.get(type) || [];
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
      this.denialCallbacks.set(type, callbacks);
    }
  }

  private notifyDenial(type: PermissionType): void {
    const callbacks = this.denialCallbacks.get(type) || [];
    callbacks.forEach(cb => {
      try { cb(); } catch (e) { console.error('[PermissionManager] Denial callback error:', e); }
    });
  }

  // ============================================================
  // 批量操作
  // ============================================================

  async checkAllPermissions(): Promise<Record<PermissionType, PermissionResult>> {
    const types: PermissionType[] = ['camera', 'microphone', 'notification', 'storage', 'location', 'biometric'];
    const results: Partial<Record<PermissionType, PermissionResult>> = {};

    for (const type of types) {
      results[type] = await this.checkPermission(type);
    }

    return results as Record<PermissionType, PermissionResult>;
  }

  async requestAllPermissions(): Promise<Record<PermissionType, PermissionResult>> {
    const types: PermissionType[] = ['camera', 'microphone', 'notification', 'storage', 'location', 'biometric'];
    const results: Partial<Record<PermissionType, PermissionResult>> = {};

    for (const type of types) {
      results[type] = await this.requestPermission(type);
    }

    return results as Record<PermissionType, PermissionResult>;
  }

  // ============================================================
  // 工具方法
  // ============================================================

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private normalizeCapacitorStatus(status: string): PermissionStatus {
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    if (status === 'prompt' || status === 'prompt-with-rationale') return 'prompt';
    return 'unknown';
  }

  private getStatusMessage(type: PermissionType, status: PermissionStatus): string {
    const config = PERMISSION_CONFIGS[type];
    switch (status) {
      case 'granted':
        return `${config.rationale.title}已授权`;
      case 'denied':
        return config.fallbackMessage;
      case 'prompt':
        return config.requestMessage;
      default:
        return `无法确定${config.rationale.title}状态`;
    }
  }

  private async getAndroidSdkLevel(): Promise<number> {
    if (!platformCheck.isAndroid()) return 0;
    try {
      const { Device } = await import('@capacitor/device');
      const info = await Device.getInfo();
      return parseInt(info.osVersion || '0', 10);
    } catch {
      return 0;
    }
  }
}

// ============================================================
// 单例导出
// ============================================================

export const permissionManager = new PermissionManager();

// ============================================================
// 向后兼容层 - 兼容 lib/permissionService.ts 的 API
// ============================================================

export const PermissionService = {
  async checkCameraPermission(): Promise<PermissionResult> {
    return permissionManager.checkPermission('camera');
  },

  async requestCameraPermission(): Promise<PermissionResult> {
    return permissionManager.requestPermission('camera');
  },

  async checkMicrophonePermission(): Promise<PermissionResult> {
    return permissionManager.checkPermission('microphone');
  },

  async requestMicrophonePermission(): Promise<PermissionResult> {
    return permissionManager.requestPermission('microphone');
  },

  async checkNotificationPermission(): Promise<PermissionResult> {
    return permissionManager.checkPermission('notification');
  },

  async requestNotificationPermission(): Promise<PermissionResult> {
    return permissionManager.requestPermission('notification');
  },

  async checkStoragePermission(): Promise<PermissionResult> {
    return permissionManager.checkPermission('storage');
  },

  async checkAllPermissions(): Promise<Record<string, PermissionResult>> {
    const result = await permissionManager.checkAllPermissions();
    return result as Record<string, PermissionResult>;
  },

  async requestAllPermissions(): Promise<Record<string, PermissionResult>> {
    const result = await permissionManager.requestAllPermissions();
    return result as Record<string, PermissionResult>;
  },

  async hasPermission(type: 'camera' | 'microphone' | 'notification'): Promise<boolean> {
    return permissionManager.hasPermission(type);
  },

  async ensurePermission(type: 'camera' | 'microphone' | 'notification'): Promise<boolean> {
    return permissionManager.ensurePermission(type);
  },
};

export default permissionManager;
