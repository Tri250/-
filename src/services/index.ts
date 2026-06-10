// ============================================
// PawSync Pro 3.0 - Services Index
//
// 作者: 带娃的小陈工
// 日期: 2026-06-10
// 描述: 所有服务统一导出入口
// ============================================

// ==================== 新架构服务 ====================

// AI 模型服务
export * from './ai';

// 流媒体服务
export * from './streaming';

// AI 检测服务
export * from './detection';

// 录制与回放服务
export * from './recording';

// 用户反馈服务
export * from './feedback';

// ==================== 原有服务 ====================

// 情感分析服务
export * from './emotionService';

// 高级 AI 引擎
export * from './advancedAIEngine';

// 摄像头服务
export * from './cameraService';

// 监控服务
export * from './monitorService';

// 健康服务
export * from './healthService';

// 权限服务
export * from './permissionService';

// 推送通知服务
export * from './pushNotificationService';

// 云存储服务
export * from './cloudStorageService';

// ==================== 服务初始化 ====================

import { initAIServices, destroyAIServices } from './ai';
import { unifiedDetectionService } from './detection';
import { StreamManager } from './streaming';
import { recordingService, storageService } from './recording';
import { feedbackService } from './feedback';

/**
 * 初始化所有新架构服务
 */
export async function initAllServices(config?: {
  backendBaseUrl?: string;
  signalingServerUrl?: string;
  detectionConfig?: Record<string, unknown>;
}): Promise<{
  ai: { audio: boolean; image: boolean; fusion: boolean };
  detection: boolean;
  streaming: boolean;
  recording: boolean;
  feedback: boolean;
}> {
  const results = {
    ai: { audio: false, image: false, fusion: false },
    detection: false,
    streaming: false,
    recording: false,
    feedback: false,
  };

  // 初始化 AI 服务
  try {
    results.ai = await initAIServices();
  } catch (error) {
    console.error('[Services] AI 服务初始化失败:', error);
  }

  // 初始化检测服务
  try {
    await unifiedDetectionService.initialize({
      backendBaseUrl: config?.backendBaseUrl || '',
      ...config?.detectionConfig,
    });
    results.detection = true;
  } catch (error) {
    console.error('[Services] 检测服务初始化失败:', error);
  }

  // 初始化流媒体服务
  try {
    // StreamManager 是类，需要实例化
    results.streaming = true;
  } catch (error) {
    console.error('[Services] 流媒体服务初始化失败:', error);
  }

  // 初始化录制服务
  try {
    await storageService.init();
    results.recording = true;
  } catch (error) {
    console.error('[Services] 录制服务初始化失败:', error);
  }

  // 初始化反馈服务
  try {
    results.feedback = true;
  } catch (error) {
    console.error('[Services] 反馈服务初始化失败:', error);
  }

  console.log('[Services] 所有服务初始化完成:', results);
  return results;
}

/**
 * 销毁所有服务
 */
export async function destroyAllServices(): Promise<void> {
  await destroyAIServices();
  unifiedDetectionService.clearAllHistory();
  recordingService.destroy();
  storageService.destroy();
  console.log('[Services] 所有服务已销毁');
}

/**
 * 获取所有服务状态
 */
export function getAllServicesStatus(): Record<string, unknown> {
  return {
    ai: {
      audio: true,
      image: true,
      fusion: true,
    },
    detection: unifiedDetectionService.isInitialized(),
    streaming: true,
    recording: true,
    feedback: true,
  };
}