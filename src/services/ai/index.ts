/**
 * AI 服务统一导出
 * 提供模型加载、音频分析、图像分析和多模态融合功能
 */

// ==================== 类型导出 ====================

export type {
  // 模型类型
  ModelType,
  ModelLoadStatus,
  InferenceMode,
  ModelConfig,
  ModelLoadProgress,
  ModelLoadResult,

  // 音频分析类型
  AudioAnalysisOptions,
  FFTAnalysisResult,
  AudioFeatures,
  AudioAnalysisResult,
  AudioClassificationResult,
  AudioEmotionResult,

  // 图像分析类型
  ImageAnalysisOptions,
  ImageColorAnalysis,
  ImageEdgeAnalysis,
  ImageTextureAnalysis,
  ImageFeatures,
  ImageAnalysisResult,
  ImageClassificationResult,
  ImageObjectDetection,

  // 多模态融合类型
  MultimodalFusionOptions,
  ModalityFeatures,
  CrossModalAttention,
  ModalityConflict,
  MultimodalFusionResult,

  // 缓存类型
  CacheEntry,
  CacheStats,

  // Worker 类型
  WorkerMessageType,
  WorkerRequestMessage,
  WorkerResponseMessage,

  // 服务状态类型
  AIServiceStatus,
  AIServiceConfig,
} from './types';

// ==================== 默认配置导出 ====================

export {
  DEFAULT_AI_SERVICE_CONFIG,
  DEFAULT_AUDIO_OPTIONS,
  DEFAULT_IMAGE_OPTIONS,
  DEFAULT_FUSION_OPTIONS,
} from './types';

// ==================== 服务导出 ====================

// 模型加载器
export { ModelLoader, modelLoader } from './modelLoader';

// 音频模型服务
export { AudioModelService, audioModelService } from './audioModelService';

// 图像模型服务
export { ImageModelService, imageModelService } from './imageModelService';

// 多模态融合服务
export { MultimodalFusionService, multimodalFusionService } from './multimodalFusionService';

// ==================== 内部导入（用于便捷方法） ====================

import { audioModelService } from './audioModelService';
import { imageModelService } from './imageModelService';
import { multimodalFusionService } from './multimodalFusionService';
import { modelLoader } from './modelLoader';
import type {
  AudioAnalysisOptions,
  AudioAnalysisResult,
  ImageAnalysisOptions,
  ImageAnalysisResult,
  MultimodalFusionOptions,
  MultimodalFusionResult,
} from './types';

// ==================== 便捷方法导出 ====================

/**
 * 初始化所有 AI 服务
 */
export async function initAIServices(): Promise<{
  audio: boolean;
  image: boolean;
  fusion: boolean;
}> {
  const results = {
    audio: false,
    image: false,
    fusion: false,
  };

  try {
    await audioModelService.init();
    results.audio = true;
  } catch (error) {
    console.error('[AI] 音频服务初始化失败:', error);
  }

  try {
    await imageModelService.init();
    results.image = true;
  } catch (error) {
    console.error('[AI] 图像服务初始化失败:', error);
  }

  try {
    await multimodalFusionService.init();
    results.fusion = true;
  } catch (error) {
    console.error('[AI] 融合服务初始化失败:', error);
  }

  return results;
}

/**
 * 检查所有 AI 服务状态
 */
export function checkAIServicesStatus(): {
  audio: ReturnType<typeof audioModelService.getStatus>;
  image: ReturnType<typeof imageModelService.getStatus>;
  fusion: ReturnType<typeof multimodalFusionService.getStatus>;
  modelLoader: {
    loadedModels: string[];
    cacheStats: ReturnType<typeof modelLoader.getCacheStats>;
  };
} {
  return {
    audio: audioModelService.getStatus(),
    image: imageModelService.getStatus(),
    fusion: multimodalFusionService.getStatus(),
    modelLoader: {
      loadedModels: modelLoader.getAllModelConfigs().map((c) => c.id),
      cacheStats: modelLoader.getCacheStats(),
    },
  };
}

/**
 * 快速音频分析
 */
export async function quickAudioAnalysis(
  audioData: Float32Array,
  options?: AudioAnalysisOptions
): Promise<AudioAnalysisResult> {
  return audioModelService.analyzeAudio(audioData, options);
}

/**
 * 快速图像分析
 */
export async function quickImageAnalysis(
  imageData: ImageData,
  options?: ImageAnalysisOptions
): Promise<ImageAnalysisResult> {
  return imageModelService.analyzeImage(imageData, options);
}

/**
 * 快速多模态融合分析
 */
export async function quickMultimodalAnalysis(
  audioData: Float32Array,
  imageData: ImageData,
  options?: MultimodalFusionOptions
): Promise<MultimodalFusionResult> {
  return multimodalFusionService.fuse(audioData, imageData, options);
}

/**
 * 销毁所有 AI 服务
 */
export async function destroyAIServices(): Promise<void> {
  audioModelService.destroy();
  imageModelService.destroy();
  multimodalFusionService.destroy();
  await modelLoader.clearAll();
  console.log('[AI] 所有服务已销毁');
}