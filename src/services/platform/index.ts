// ============================================
// PawSync Pro - Platform Services Index
//
// 作者: 带娃的小陈工
// 日期: 2026-06-10
// 描述: 跨平台服务统一导出入口
// ============================================

// 平台服务
export {
  platformService,
  PlatformService,
  type PlatformType,
  type HapticImpact,
  type HapticNotification,
  type ShareOptions,
  type KeyboardOptions,
} from './platformService';

// 通知服务
export {
  notificationService,
  NotificationService,
  type NotificationType,
  type NotificationChannel,
  type NotificationOptions,
  type PushToken,
  type NotificationAction,
} from './notificationService';

// 权限服务
export {
  permissionService,
  PermissionService,
  type PermissionType,
  type PermissionStatus,
  type PermissionRequestResult,
} from './permissionService';

// 生物识别服务
export {
  biometricService,
  BiometricService,
  type BiometricType,
  type BiometricAuthResult,
  type BiometricAvailability,
  type BiometricAuthOptions,
} from './biometricService';

// ==================== 便捷导出 ====================

// 平台检测
export const isNative = () => platformService.isNative();
export const isWeb = () => platformService.isWeb();
export const getPlatform = () => platformService.getPlatform();

// 触觉反馈
export const hapticImpact = (style: import('./platformService').HapticImpact) => 
  platformService.impact(style);
export const hapticNotification = (type: import('./platformService').HapticNotification) => 
  platformService.notification(type);

// 分享
export const share = (options: import('./platformService').ShareOptions) => 
  platformService.share(options);

// 通知
export const sendNotification = (options: import('./notificationService').NotificationOptions) => 
  notificationService.send(options);

// 权限
export const checkPermission = (permission: import('./permissionService').PermissionType) => 
  permissionService.check(permission);
export const requestPermission = (permission: import('./permissionService').PermissionType) => 
  permissionService.request(permission);
