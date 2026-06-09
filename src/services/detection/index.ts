/**
 * AI 智能事件检测服务统一导出
 * 支持 YOLOv8/YAMNet 模型
 */

// ==================== 类型定义导出 ====================
export type {
  // 基础类型
  DetectionMode,
  InferenceMode,
  AIModelType,
  ModelLoadStatus,

  // 宠物检测类型
  BoundingBox,
  KeyPoint,
  PetType,
  PetDetectionConfig,
  PetDetection,
  TrackingResult,
  HeatmapData,

  // 行为分析类型
  BehaviorType,
  BehaviorEvent,
  BehaviorTrend,
  BehaviorAnalysisConfig,

  // 声音检测类型
  PetSoundType,
  EnvironmentSoundType,
  SoundEvent,
  PetSoundClassification,
  SoundDetectionConfig,

  // 环境监控类型
  EnvironmentData,
  EnvironmentAnomalyType,
  EnvironmentAnomaly,
  EnvironmentMonitorConfig,

  // 事件聚合类型
  AggregatedEvent,
  EventPriority,
  EventAggregatorConfig,

  // AI 模型配置
  YOLOv8Config,
  YAMNetConfig,
  BehaviorModelConfig,
  DetectionConfig,
  DetectionServiceStatus,
} from './types';

// ==================== 检测结果类型 ====================
/**
 * 完整检测结果
 */
export interface DetectionResult {
  petDetections: PetDetection[];
  trackingResults: TrackingResult[];
  behaviorEvents: BehaviorEvent[];
  soundEvents: SoundEvent[];
  emotionEvents: import('./types').BehaviorEvent[];
  environmentData: EnvironmentData;
  environmentAnomalies: EnvironmentAnomaly[];
  aggregatedEvent?: AggregatedEvent;
  detectionTime: number;
}

// ==================== 默认配置导出 ====================
export {
  DEFAULT_PET_DETECTION_CONFIG,
  DEFAULT_BEHAVIOR_ANALYSIS_CONFIG,
  DEFAULT_SOUND_DETECTION_CONFIG,
  DEFAULT_ENVIRONMENT_MONITOR_CONFIG,
  DEFAULT_EVENT_AGGREGATOR_CONFIG,
  DEFAULT_YOLOV8_CONFIG,
  DEFAULT_YAMNET_CONFIG,
  DEFAULT_BEHAVIOR_MODEL_CONFIG,
  DEFAULT_DETECTION_CONFIG,
} from './types';

// ==================== 服务导出 ====================
export { petDetectionService, PetDetectionService } from './petDetectionService';
export { behaviorAnalysisService, BehaviorAnalysisService } from './behaviorAnalysisService';
export { soundDetectionService, SoundDetectionService } from './soundDetectionService';
export { environmentMonitorService, EnvironmentMonitorService } from './environmentMonitorService';
export { eventAggregatorService, EventAggregatorService } from './eventAggregatorService';

// ==================== 统一检测服务类 ====================
import type { DetectionConfig, DetectionMode } from './types';
import { DEFAULT_DETECTION_CONFIG } from './types';
import { petDetectionService } from './petDetectionService';
import { behaviorAnalysisService } from './behaviorAnalysisService';
import { soundDetectionService } from './soundDetectionService';
import { environmentMonitorService } from './environmentMonitorService';
import { eventAggregatorService } from './eventAggregatorService';
import type { PetDetection, TrackingResult, HeatmapData } from './types';
import type { BehaviorEvent, BehaviorTrend } from './types';
import type { SoundEvent, PetSoundClassification } from './types';
import type { EnvironmentData, EnvironmentAnomaly } from './types';
import type { AggregatedEvent } from './types';
import type { SmartEvent } from '../../types/monitor';

/**
 * 统一检测服务
 * 整合所有检测服务，提供统一接口
 */
class UnifiedDetectionService {
  private config: DetectionConfig;
  private initialized: boolean = false;

  constructor() {
    this.config = { ...DEFAULT_DETECTION_CONFIG };
  }

  /**
   * 初始化所有服务
   */
  async initialize(config?: Partial<DetectionConfig>): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // 并行初始化所有服务
    await Promise.all([
      petDetectionService.initialize(
        config?.petDetection,
        config?.yolov8,
        config?.backendBaseUrl
      ),
      behaviorAnalysisService.initialize(
        config?.behaviorAnalysis,
        config?.behaviorModel,
        config?.backendBaseUrl
      ),
      soundDetectionService.initialize(
        config?.soundDetection,
        config?.yamnet,
        config?.backendBaseUrl
      ),
      environmentMonitorService.initialize(config?.environmentMonitor),
      eventAggregatorService.initialize(config?.eventAggregator, config?.backendBaseUrl),
    ]);

    this.initialized = true;
    console.log('[UnifiedDetectionService] 所有服务初始化完成');
  }

  /**
   * 执行完整检测流程
   * @param frame 图像帧
   * @param audioData 音频数据（可选）
   * @param cameraId 摄像头 ID
   * @param petId 宠物 ID（可选）
   */
  async performFullDetection(
    frame: ImageData,
    audioData?: Float32Array,
    cameraId: string = 'default',
    petId?: string
  ): Promise<{
    petDetections: PetDetection[];
    trackingResults: TrackingResult[];
    behaviorEvents: BehaviorEvent[];
    soundEvents: SoundEvent[];
    environmentData: EnvironmentData;
    environmentAnomalies: EnvironmentAnomaly[];
    aggregatedEvent?: AggregatedEvent;
  }> {
    if (!this.initialized) {
      throw new Error('[UnifiedDetectionService] 服务未初始化');
    }

    // 1. 宠物检测
    const petDetections = await petDetectionService.detectPet(frame, cameraId);
    const trackingResults = petDetectionService.trackPet(petDetections);

    // 2. 行为分析（如果有足够的帧）
    let behaviorEvents: BehaviorEvent[] = [];
    if (petId && petDetections.length > 0) {
      // 使用当前帧作为分析输入（实际应用中需要帧序列）
      behaviorEvents = await behaviorAnalysisService.analyzeBehavior([frame], cameraId, petId);
    }

    // 3. 声音检测（如果有音频数据）
    let soundEvents: SoundEvent[] = [];
    if (audioData) {
      const soundEvent = await soundDetectionService.detectSound(audioData, cameraId);
      soundEvents = [soundEvent];
    }

    // 4. 环境监控
    const environmentData = await environmentMonitorService.monitorEnvironment(cameraId);
    const environmentAnomalies = environmentMonitorService.detectAnomaly(environmentData);

    // 5. 事件聚合
    let aggregatedEvent: AggregatedEvent | undefined;
    
    // 转换所有事件为 SmartEvent 格式
    const allEvents: SmartEvent[] = [];
    
    for (const detection of petDetections) {
      allEvents.push(eventAggregatorService.convertPetDetection(detection));
    }
    
    for (const behavior of behaviorEvents) {
      allEvents.push(eventAggregatorService.convertBehaviorEvent(behavior));
    }
    
    for (const sound of soundEvents) {
      allEvents.push(eventAggregatorService.convertSoundEvent(sound));
    }
    
    for (const anomaly of environmentAnomalies) {
      allEvents.push(eventAggregatorService.convertEnvironmentAnomaly(anomaly));
    }

    if (allEvents.length > 0) {
      aggregatedEvent = await eventAggregatorService.aggregateEvents(allEvents);
    }

    return {
      petDetections,
      trackingResults,
      behaviorEvents,
      soundEvents,
      environmentData,
      environmentAnomalies,
      aggregatedEvent,
    };
  }

  /**
   * 获取活动热点图
   */
  getActivityHeatmap(
    cameraId: string,
    timeRange?: { start: string; end: string }
  ): HeatmapData {
    return petDetectionService.getActivityHeatmap(cameraId, timeRange);
  }

  /**
   * 获取行为趋势
   */
  getBehaviorTrend(
    petId: string,
    period: { start: string; end: string }
  ): BehaviorTrend {
    return behaviorAnalysisService.getBehaviorTrend(petId, period);
  }

  /**
   * 分类宠物声音
   */
  async classifyPetSound(
    audioData: Float32Array,
    petType?: 'cat' | 'dog' | 'bird' | 'rabbit' | 'hamster' | 'other'
  ): Promise<PetSoundClassification> {
    return soundDetectionService.classifyPetSound(audioData, petType);
  }

  /**
   * 开始持续环境监控
   */
  startEnvironmentMonitoring(
    cameraId: string,
    callback: (data: EnvironmentData, anomalies: EnvironmentAnomaly[]) => void
  ): void {
    environmentMonitorService.startContinuousMonitoring(cameraId, callback);
  }

  /**
   * 停止环境监控
   */
  stopEnvironmentMonitoring(cameraId: string): void {
    environmentMonitorService.stopContinuousMonitoring(cameraId);
  }

  /**
   * 获取优先级排序的事件
   */
  prioritizeEvents(events: SmartEvent[]): SmartEvent[] {
    return eventAggregatorService.prioritizeEvents(events);
  }

  /**
   * 生成智能解读
   */
  async generateInsight(events: SmartEvent[]): Promise<string> {
    return eventAggregatorService.generateInsight(events);
  }

  /**
   * 设置检测模式
   */
  setMode(mode: DetectionMode): void {
    petDetectionService.setMode(mode);
    behaviorAnalysisService.setMode(mode);
    soundDetectionService.setMode(mode);
    environmentMonitorService.setMode(mode);
    eventAggregatorService.setMode(mode);
  }

  /**
   * 获取所有服务状态
   */
  getAllServicesStatus(): Record<string, ReturnType<typeof petDetectionService.getStatus>> {
    return {
      petDetection: petDetectionService.getStatus(),
      behaviorAnalysis: behaviorAnalysisService.getStatus(),
      soundDetection: soundDetectionService.getStatus(),
      environmentMonitor: environmentMonitorService.getStatus(),
      eventAggregator: eventAggregatorService.getStatus(),
    };
  }

  /**
   * 清除所有历史数据
   */
  clearAllHistory(): void {
    petDetectionService.clearHistory();
    behaviorAnalysisService.clearHistory();
    soundDetectionService.clearHistory();
    environmentMonitorService.clearHistory();
    eventAggregatorService.clearHistory();
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<DetectionConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.petDetection) {
      petDetectionService.updateConfig(config.petDetection);
    }
    if (config.behaviorAnalysis) {
      behaviorAnalysisService.updateConfig(config.behaviorAnalysis);
    }
    if (config.soundDetection) {
      soundDetectionService.updateConfig(config.soundDetection);
    }
    if (config.environmentMonitor) {
      environmentMonitorService.updateConfig(config.environmentMonitor);
    }
    if (config.eventAggregator) {
      eventAggregatorService.updateConfig(config.eventAggregator);
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): DetectionConfig {
    return { ...this.config };
  }

  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// 导出统一检测服务单例
export const unifiedDetectionService = new UnifiedDetectionService();
export { UnifiedDetectionService };

// ==================== 默认导出 ====================
export default unifiedDetectionService;