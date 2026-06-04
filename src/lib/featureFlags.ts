/**
 * Feature Flags - 功能开关配置
 *
 * 用于控制不同平台的功能启用/禁用
 * 确保 Android 和 Web 端功能一致性
 */

import { platformCheck } from './platformService';

// 功能开关类型
export interface FeatureFlags {
  // AI 功能
  ENABLE_AI_CONSULTATION: boolean;
  ENABLE_EMOTION_ANALYSIS: boolean;
  ENABLE_TRANSLATOR: boolean;
  ENABLE_HEALTH_ALERTS: boolean;

  // 监控功能
  ENABLE_CAMERA_MONITOR: boolean;
  ENABLE_LIVE_STREAM: boolean;
  ENABLE_DEVICE_PAIRING: boolean;

  // 通知功能
  ENABLE_PUSH_NOTIFICATIONS: boolean;
  ENABLE_LOCAL_NOTIFICATIONS: boolean;

  // 平台特定功能
  ENABLE_NATIVE_SHARE: boolean;
  ENABLE_HAPTICS: boolean;
  ENABLE_NATIVE_CAMERA: boolean;
  ENABLE_KEYBOARD_MANAGER: boolean;

  // 性能优化
  ENABLE_ANIMATIONS: boolean;
  ENABLE_PERFORMANCE_DETECTION: boolean;
  ENABLE_BACKGROUND_SYNC: boolean;

  // 安全功能
  ENABLE_BIOMETRIC_AUTH: boolean;
  ENABLE_DATA_ENCRYPTION: boolean;

  // 开发功能
  ENABLE_DEBUG_MODE: boolean;
  ENABLE_MOCK_DATA: boolean;
}

// 获取功能开关配置
const createFeatureFlags = (): FeatureFlags => {
  const isDev = import.meta.env.VITE_ENV === 'development';
  const isMockEnabled = import.meta.env.VITE_ENABLE_MOCK_DATA === 'true';

  return {
    // AI 功能
    ENABLE_AI_CONSULTATION: true,
    ENABLE_EMOTION_ANALYSIS: true,
    ENABLE_TRANSLATOR: true,
    ENABLE_HEALTH_ALERTS: true,

    // 监控功能
    ENABLE_CAMERA_MONITOR: true,
    ENABLE_LIVE_STREAM: true,
    ENABLE_DEVICE_PAIRING: true,

    // 通知功能
    ENABLE_PUSH_NOTIFICATIONS: true,
    ENABLE_LOCAL_NOTIFICATIONS: true,

    // 平台特定功能
    ENABLE_NATIVE_SHARE: platformCheck.isNative(),
    ENABLE_HAPTICS: platformCheck.isNative(),
    ENABLE_NATIVE_CAMERA: true,
    ENABLE_KEYBOARD_MANAGER: true,

    // 性能优化
    ENABLE_ANIMATIONS: true,
    ENABLE_PERFORMANCE_DETECTION: true,
    ENABLE_BACKGROUND_SYNC: platformCheck.isNative(),

    // 安全功能
    ENABLE_BIOMETRIC_AUTH: platformCheck.isNative(),
    ENABLE_DATA_ENCRYPTION: true,

    // 开发功能
    ENABLE_DEBUG_MODE: isDev,
    ENABLE_MOCK_DATA: isMockEnabled || isDev,
  };
};

// 功能开关单例
let featureFlagsInstance: FeatureFlags | null = null;

/**
 * 获取功能开关实例
 */
export const getFeatureFlags = (): FeatureFlags => {
  if (!featureFlagsInstance) {
    featureFlagsInstance = createFeatureFlags();
  }
  return featureFlagsInstance;
};

/**
 * 检查特定功能是否启用
 */
export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  const flags = getFeatureFlags();
  return flags[feature] ?? false;
};

/**
 * 条件渲染组件的 Hook
 */
export const useFeatureFlag = (feature: keyof FeatureFlags): boolean => {
  return isFeatureEnabled(feature);
};

/**
 * 功能标志组
 */
export const FeatureFlagGroups = {
  // 所有 AI 功能
  allAIFeatures: [
    'ENABLE_AI_CONSULTATION',
    'ENABLE_EMOTION_ANALYSIS',
    'ENABLE_TRANSLATOR',
    'ENABLE_HEALTH_ALERTS',
  ] as const,

  // 所有监控功能
  allCameraFeatures: [
    'ENABLE_CAMERA_MONITOR',
    'ENABLE_LIVE_STREAM',
    'ENABLE_DEVICE_PAIRING',
  ] as const,

  // 所有通知功能
  allNotificationFeatures: [
    'ENABLE_PUSH_NOTIFICATIONS',
    'ENABLE_LOCAL_NOTIFICATIONS',
  ] as const,

  // 所有平台特定功能
  allNativeFeatures: [
    'ENABLE_NATIVE_SHARE',
    'ENABLE_HAPTICS',
    'ENABLE_NATIVE_CAMERA',
    'ENABLE_KEYBOARD_MANAGER',
  ] as const,
};

/**
 * 获取已启用的功能列表
 */
export const getEnabledFeatures = (): string[] => {
  const flags = getFeatureFlags();
  return Object.entries(flags)
    .filter(([_, enabled]) => enabled)
    .map(([feature]) => feature);
};

/**
 * 获取已禁用的功能列表
 */
export const getDisabledFeatures = (): string[] => {
  const flags = getFeatureFlags();
  return Object.entries(flags)
    .filter(([_, enabled]) => !enabled)
    .map(([feature]) => feature);
};

/**
 * 功能开关变更监听器
 */
type FeatureFlagListener = (flags: FeatureFlags) => void;
const listeners = new Set<FeatureFlagListener>();

/**
 * 订阅功能开关变更
 */
export const subscribeToFeatureFlags = (listener: FeatureFlagListener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * 通知功能开关变更
 */
export const notifyFeatureFlagsChange = (): void => {
  featureFlagsInstance = createFeatureFlags();
  listeners.forEach((listener) => listener(featureFlagsInstance!));
};
