// ============================================
// PawSync Pro - Feature Flags Configuration
//
// 作者: 带娃的小陈工
// 日期: 2026-06-10
// 描述: 跨平台功能标志配置，统一管理各平台功能可用性
// ============================================

import { platformService } from '@/services/platform';

/**
 * 功能标志配置接口
 */
export interface FeatureFlags {
  // AI 功能
  ENABLE_AI_CONSULTATION: boolean;
  ENABLE_EMOTION_ANALYSIS: boolean;
  ENABLE_TRANSLATOR: boolean;
  ENABLE_VOICE_CLONING: boolean;

  // 监控功能
  ENABLE_CAMERA_MONITOR: boolean;
  ENABLE_LIVE_STREAM: boolean;
  ENABLE_AI_DETECTION: boolean;
  ENABLE_MULTI_CAMERA: boolean;

  // 健康功能
  ENABLE_HEALTH_RECORDS: boolean;
  ENABLE_HEALTH_MANUAL: boolean;
  ENABLE_MEDICAL_RECORDS: boolean;
  ENABLE_ADVANCED_HEALTH: boolean;

  // 通知功能
  ENABLE_PUSH_NOTIFICATIONS: boolean;
  ENABLE_LOCAL_NOTIFICATIONS: boolean;
  ENABLE_SCHEDULED_NOTIFICATIONS: boolean;

  // 平台特定功能
  ENABLE_NATIVE_SHARE: boolean;
  ENABLE_HAPTICS: boolean;
  ENABLE_BIOMETRIC: boolean;
  ENABLE_OFFLINE_MODE: boolean;

  // 社交功能
  ENABLE_BOND_EMOTION: boolean;
  ENABLE_COMMUNITY: boolean;
  ENABLE_SHARE: boolean;

  // 云服务
  ENABLE_CLOUD_SYNC: boolean;
  ENABLE_CLOUD_BACKUP: boolean;
  ENABLE_AUTO_SYNC: boolean;

  // 实验性功能
  ENABLE_EXPERIMENTAL_FEATURES: boolean;
  ENABLE_BETA_FEATURES: boolean;
}

/**
 * 基础功能标志（所有平台通用）
 */
const baseFeatureFlags: FeatureFlags = {
  // AI 功能
  ENABLE_AI_CONSULTATION: true,
  ENABLE_EMOTION_ANALYSIS: true,
  ENABLE_TRANSLATOR: true,
  ENABLE_VOICE_CLONING: false, // 需要额外权限

  // 监控功能
  ENABLE_CAMERA_MONITOR: true,
  ENABLE_LIVE_STREAM: true,
  ENABLE_AI_DETECTION: true,
  ENABLE_MULTI_CAMERA: true,

  // 健康功能
  ENABLE_HEALTH_RECORDS: true,
  ENABLE_HEALTH_MANUAL: true,
  ENABLE_MEDICAL_RECORDS: true,
  ENABLE_ADVANCED_HEALTH: true,

  // 通知功能
  ENABLE_PUSH_NOTIFICATIONS: true,
  ENABLE_LOCAL_NOTIFICATIONS: true,
  ENABLE_SCHEDULED_NOTIFICATIONS: true,

  // 平台特定功能（默认关闭，根据平台启用）
  ENABLE_NATIVE_SHARE: false,
  ENABLE_HAPTICS: false,
  ENABLE_BIOMETRIC: false,
  ENABLE_OFFLINE_MODE: true,

  // 社交功能
  ENABLE_BOND_EMOTION: true,
  ENABLE_COMMUNITY: false, // 开发中
  ENABLE_SHARE: true,

  // 云服务
  ENABLE_CLOUD_SYNC: true,
  ENABLE_CLOUD_BACKUP: true,
  ENABLE_AUTO_SYNC: true,

  // 实验性功能
  ENABLE_EXPERIMENTAL_FEATURES: false,
  ENABLE_BETA_FEATURES: false,
};

/**
 * Web 平台功能标志
 */
const webFeatureFlags: Partial<FeatureFlags> = {
  ENABLE_PUSH_NOTIFICATIONS: 'Notification' in window,
  ENABLE_NATIVE_SHARE: !!navigator.share,
  ENABLE_HAPTICS: 'vibrate' in navigator,
  ENABLE_BIOMETRIC: 'PublicKeyCredential' in window,
};

/**
 * Android 平台功能标志
 */
const androidFeatureFlags: Partial<FeatureFlags> = {
  ENABLE_NATIVE_SHARE: true,
  ENABLE_HAPTICS: true,
  ENABLE_BIOMETRIC: true,
  ENABLE_PUSH_NOTIFICATIONS: true,
  ENABLE_LOCAL_NOTIFICATIONS: true,
};

/**
 * iOS 平台功能标志
 */
const iosFeatureFlags: Partial<FeatureFlags> = {
  ENABLE_NATIVE_SHARE: true,
  ENABLE_HAPTICS: true,
  ENABLE_BIOMETRIC: true,
  ENABLE_PUSH_NOTIFICATIONS: true,
  ENABLE_LOCAL_NOTIFICATIONS: true,
};

/**
 * 开发环境功能标志
 */
const devFeatureFlags: Partial<FeatureFlags> = {
  ENABLE_EXPERIMENTAL_FEATURES: true,
  ENABLE_BETA_FEATURES: true,
};

/**
 * 获取当前平台的功能标志
 */
export function getFeatureFlags(): FeatureFlags {
  const platform = platformService.getPlatform();
  const isDev = import.meta.env.DEV;

  let platformFlags: Partial<FeatureFlags> = {};

  switch (platform) {
    case 'android':
      platformFlags = androidFeatureFlags;
      break;
    case 'ios':
      platformFlags = iosFeatureFlags;
      break;
    case 'web':
    default:
      platformFlags = webFeatureFlags;
      break;
  }

  return {
    ...baseFeatureFlags,
    ...platformFlags,
    ...(isDev ? devFeatureFlags : {}),
  };
}

/**
 * 检查功能是否启用
 */
export function isFeatureEnabled(featureName: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return flags[featureName];
}

/**
 * 功能标志 Hook（用于 React 组件）
 */
export function useFeatureFlags(): FeatureFlags {
  return getFeatureFlags();
}

/**
 * 检查单个功能的 Hook
 */
export function useFeature(featureName: keyof FeatureFlags): boolean {
  return isFeatureEnabled(featureName);
}

// 导出默认功能标志
export const FeatureFlags = getFeatureFlags();
export default FeatureFlags;
