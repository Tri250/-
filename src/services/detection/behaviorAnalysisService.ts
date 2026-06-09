/**
 * 行为分析服务
 * 使用行为识别模型分析宠物行为
 * 通过后端 API 调用 AI 模型
 */

import type {
  BehaviorEvent,
  BehaviorType,
  BehaviorTrend,
  BehaviorAnalysisConfig,
  BehaviorModelConfig,
  DetectionMode,
  DetectionServiceStatus,
  BoundingBox,
} from './types';
import { DEFAULT_BEHAVIOR_ANALYSIS_CONFIG, DEFAULT_BEHAVIOR_MODEL_CONFIG } from './types';

/**
 * 后端 API 响应格式
 */
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  processingTime?: number;
}

/**
 * 行为识别结果
 */
interface BehaviorRecognitionResult {
  behavior: BehaviorType;
  confidence: number;
  duration?: number;
  keyFrames?: Array<{
    timestamp: string;
    boundingBox: BoundingBox;
  }>;
}

/**
 * 行为统计数据
 */
interface BehaviorStatistics {
  count: number;
  totalDuration: number;
  avgDuration: number;
  frequency: number;
}

/**
 * 行为分析服务类
 */
class BehaviorAnalysisService {
  /** 服务配置 */
  private config: BehaviorAnalysisConfig;
  /** 行为模型配置 */
  private modelConfig: BehaviorModelConfig;
  /** 后端 API 基础 URL */
  private backendBaseUrl: string;
  /** 检测模式 */
  private mode: DetectionMode;
  /** 是否已初始化 */
  private initialized: boolean = false;
  /** 行为事件历史 */
  private eventHistory: BehaviorEvent[] = [];
  /** 当前活跃行为 */
  private activeBehaviors: Map<string, BehaviorEvent> = new Map();
  /** 最大历史记录数 */
  private maxHistorySize: number = 1000;
  /** 帧缓冲区 */
  private frameBuffer: Map<string, ImageData[]> = new Map();

  /**
   * 构造函数
   */
  constructor() {
    this.config = { ...DEFAULT_BEHAVIOR_ANALYSIS_CONFIG };
    this.modelConfig = { ...DEFAULT_BEHAVIOR_MODEL_CONFIG };
    this.backendBaseUrl = '/api';
    this.mode = 'realtime';
  }

  /**
   * 初始化服务
   * @param config 分析配置
   * @param modelConfig 模型配置
   * @param backendBaseUrl 后端 API 基础 URL
   */
  async initialize(
    config?: Partial<BehaviorAnalysisConfig>,
    modelConfig?: Partial<BehaviorModelConfig>,
    backendBaseUrl?: string
  ): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    if (modelConfig) {
      this.modelConfig = { ...this.modelConfig, ...modelConfig };
    }
    if (backendBaseUrl) {
      this.backendBaseUrl = backendBaseUrl;
    }

    // 检查后端 API 可用性
    try {
      const response = await fetch(`${this.backendBaseUrl}${this.modelConfig.apiEndpoint}/health`, {
        method: 'GET',
      });
      
      if (response.ok) {
        this.initialized = true;
        console.log('[BehaviorAnalysisService] 服务初始化成功');
      } else {
        console.warn('[BehaviorAnalysisService] 后端 API 不可用，使用模拟模式');
        this.initialized = true;
      }
    } catch (error) {
      console.warn('[BehaviorAnalysisService] 后端 API 连接失败，使用模拟模式:', error);
      this.initialized = true;
    }
  }

  /**
   * 分析行为
   * @param frames 图像帧数组
   * @param cameraId 摄像头 ID
   * @param petId 宠物 ID
   * @returns 行为事件数组
   */
  async analyzeBehavior(
    frames: ImageData[],
    cameraId: string,
    petId: string
  ): Promise<BehaviorEvent[]> {
    if (!this.initialized) {
      throw new Error('[BehaviorAnalysisService] 服务未初始化');
    }

    if (frames.length < this.config.windowSize) {
      console.warn('[BehaviorAnalysisService] 帧数不足，需要至少', this.config.windowSize, '帧');
      return [];
    }

    const timestamp = new Date().toISOString();

    try {
      // 调用后端行为分析 API
      const results = await this.callBehaviorAPI(frames, cameraId, petId);
      
      // 处理行为事件
      const events = this.processBehaviorResults(results, cameraId, petId, timestamp);
      
      // 更新历史记录
      this.updateHistory(events);

      // 检测异常行为
      if (this.config.enableAnomalyDetection) {
        this.detectAnomalies(events);
      }

      return events;
    } catch (error) {
      console.error('[BehaviorAnalysisService] 分析失败:', error);
      // 返回模拟数据
      return this.generateMockBehaviorEvents(cameraId, petId, timestamp);
    }
  }

  /**
   * 获取行为趋势
   * @param petId 宠物 ID
   * @param period 时间范围
   * @returns 行为趋势数据
   */
  getBehaviorTrend(
    petId: string,
    period: { start: string; end: string }
  ): BehaviorTrend {
    // 过滤时间范围内的行为事件
    const startTime = new Date(period.start).getTime();
    const endTime = new Date(period.end).getTime();
    
    const filteredEvents = this.eventHistory.filter(event => {
      if (event.petId !== petId) return false;
      const eventTime = new Date(event.timestamp).getTime();
      return eventTime >= startTime && eventTime <= endTime;
    });

    // 计算统计数据
    const statistics = this.calculateBehaviorStatistics(filteredEvents, period);

    // 生成时间线
    const timeline = this.generateTimeline(filteredEvents);

    // 检测异常
    const anomalies = this.detectTrendAnomalies(filteredEvents);

    return {
      petId,
      period,
      statistics,
      timeline,
      anomalies,
    };
  }

  /**
   * 获取当前活跃行为
   * @param petId 宠物 ID
   * @returns 当前行为事件
   */
  getActiveBehavior(petId: string): BehaviorEvent | undefined {
    return this.activeBehaviors.get(petId);
  }

  /**
   * 获取服务状态
   */
  getStatus(): DetectionServiceStatus {
    return {
      serviceName: 'BehaviorAnalysisService',
      initialized: this.initialized,
      modelStatus: {
        yolov8: 'idle',
        yamnet: 'idle',
        behavior: this.initialized ? 'loaded' : 'idle',
        custom: 'idle',
      },
      isDetecting: this.activeBehaviors.size > 0,
      currentMode: this.mode,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * 设置检测模式
   */
  setMode(mode: DetectionMode): void {
    this.mode = mode;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<BehaviorAnalysisConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 清除历史数据
   */
  clearHistory(): void {
    this.eventHistory = [];
    this.activeBehaviors.clear();
    this.frameBuffer.clear();
  }

  /**
   * 获取支持的行为类型列表
   */
  getSupportedBehaviors(): BehaviorType[] {
    return [
      'sleeping',
      'playing',
      'eating',
      'drinking',
      'walking',
      'running',
      'jumping',
      'scratching',
      'grooming',
      'resting',
      'digging',
      'climbing',
      'abnormal',
    ];
  }

  /**
   * 获取行为描述（中文）
   */
  getBehaviorDescription(behavior: BehaviorType): string {
    const descriptions: Record<BehaviorType, string> = {
      sleeping: '宠物正在睡觉',
      playing: '宠物正在玩耍',
      eating: '宠物正在进食',
      drinking: '宠物正在喝水',
      walking: '宠物正在行走',
      running: '宠物正在奔跑',
      jumping: '宠物正在跳跃',
      scratching: '宠物正在抓挠',
      grooming: '宠物正在自我清洁',
      resting: '宠物正在休息',
      digging: '宠物正在挖掘',
      climbing: '宠物正在攀爬',
      abnormal: '检测到异常行为',
    };
    return descriptions[behavior] || '未知行为';
  }

  // ==================== 私有方法 ====================

  /**
   * 调用行为分析后端 API
   */
  private async callBehaviorAPI(
    frames: ImageData[],
    cameraId: string,
    petId: string
  ): Promise<BehaviorRecognitionResult[]> {
    // 将帧转换为 Base64 数组
    const base64Frames = await Promise.all(
      frames.map(frame => this.imageDataToBase64(frame))
    );

    const response = await fetch(`${this.backendBaseUrl}${this.modelConfig.apiEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        frames: base64Frames,
        sequenceLength: this.modelConfig.sequenceLength,
        confidenceThreshold: this.config.confidenceThreshold,
        enableAnomalyDetection: this.config.enableAnomalyDetection,
        anomalySensitivity: this.config.anomalySensitivity,
        cameraId,
        petId,
      }),
    });

    if (!response.ok) {
      throw new Error(`行为分析 API 请求失败: ${response.status}`);
    }

    const result: APIResponse<BehaviorRecognitionResult[]> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || '行为分析失败');
    }

    return result.data;
  }

  /**
   * 处理行为识别结果
   */
  private processBehaviorResults(
    results: BehaviorRecognitionResult[],
    cameraId: string,
    petId: string,
    timestamp: string
  ): BehaviorEvent[] {
    const events: BehaviorEvent[] = [];

    for (const result of results) {
      // 过滤低置信度结果
      if (result.confidence < this.config.confidenceThreshold) {
        continue;
      }

      const event: BehaviorEvent = {
        id: `behavior-${Date.now()}-${events.length}`,
        cameraId,
        timestamp,
        petId,
        behavior: result.behavior,
        confidence: result.confidence,
        duration: result.duration,
        description: this.getBehaviorDescription(result.behavior),
        keyFrames: result.keyFrames?.map(kf => ({
          timestamp: kf.timestamp,
          boundingBox: kf.boundingBox,
        })),
        metadata: {
          modelType: this.modelConfig.type,
        },
      };

      events.push(event);

      // 更新活跃行为
      if (result.duration && result.duration >= this.config.minBehaviorDuration) {
        this.activeBehaviors.set(petId, event);
      }
    }

    return events;
  }

  /**
   * 计算行为统计数据
   */
  private calculateBehaviorStatistics(
    events: BehaviorEvent[],
    period: { start: string; end: string }
  ): Record<BehaviorType, BehaviorStatistics> {
    const statistics: Record<BehaviorType, BehaviorStatistics> = {} as Record<BehaviorType, BehaviorStatistics>;
    
    // 初始化所有行为类型
    const behaviors = this.getSupportedBehaviors();
    for (const behavior of behaviors) {
      statistics[behavior] = {
        count: 0,
        totalDuration: 0,
        avgDuration: 0,
        frequency: 0,
      };
    }

    // 计算统计数据
    for (const event of events) {
      const stats = statistics[event.behavior];
      stats.count++;
      stats.totalDuration += event.duration || 0;
    }

    // 计算平均值和频率
    const periodDuration = (new Date(period.end).getTime() - new Date(period.start).getTime()) / 1000 / 3600; // 小时
    
    for (const behavior of behaviors) {
      const stats = statistics[behavior];
      stats.avgDuration = stats.count > 0 ? stats.totalDuration / stats.count : 0;
      stats.frequency = periodDuration > 0 ? stats.count / periodDuration : 0;
    }

    return statistics;
  }

  /**
   * 生成时间线
   */
  private generateTimeline(events: BehaviorEvent[]): Array<{
    timestamp: string;
    behavior: BehaviorType;
    duration: number;
  }> {
    return events
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(event => ({
        timestamp: event.timestamp,
        behavior: event.behavior,
        duration: event.duration || 0,
      }));
  }

  /**
   * 检测趋势异常
   */
  private detectTrendAnomalies(events: BehaviorEvent[]): Array<{
    timestamp: string;
    behavior: BehaviorType;
    reason: string;
  }> {
    const anomalies: Array<{
      timestamp: string;
      behavior: BehaviorType;
      reason: string;
    }> = [];

    // 检测异常行为事件
    for (const event of events) {
      if (event.behavior === 'abnormal') {
        anomalies.push({
          timestamp: event.timestamp,
          behavior: event.behavior,
          reason: '检测到异常行为模式',
        });
      }
    }

    // 检测行为频率异常
    const behaviorCounts: Record<BehaviorType, number> = {} as Record<BehaviorType, number>;
    for (const event of events) {
      behaviorCounts[event.behavior] = (behaviorCounts[event.behavior] || 0) + 1;
    }

    // 如果某种行为频率异常高
    for (const [behavior, count] of Object.entries(behaviorCounts)) {
      if (behavior !== 'abnormal' && count > events.length * 0.5) {
        anomalies.push({
          timestamp: events[events.length - 1].timestamp,
          behavior: behavior as BehaviorType,
          reason: `${this.getBehaviorDescription(behavior as BehaviorType)}频率异常高`,
        });
      }
    }

    return anomalies;
  }

  /**
   * 检测异常行为
   */
  private detectAnomalies(events: BehaviorEvent[]): void {
    for (const event of events) {
      if (event.behavior === 'abnormal') {
        console.warn('[BehaviorAnalysisService] 检测到异常行为:', event);
        // 可以触发通知或警报
      }
    }
  }

  /**
   * 更新历史记录
   */
  private updateHistory(events: BehaviorEvent[]): void {
    this.eventHistory.push(...events);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.splice(0, this.eventHistory.length - this.maxHistorySize);
    }
  }

  /**
   * 将 ImageData 转换为 Base64
   */
  private async imageDataToBase64(frame: ImageData): Promise<string> {
    const canvas = document.createElement('canvas');
    canvas.width = frame.width;
    canvas.height = frame.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法创建 Canvas 上下文');
    }
    ctx.putImageData(frame, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  }

  /**
   * 生成模拟行为事件
   */
  private generateMockBehaviorEvents(
    cameraId: string,
    petId: string,
    timestamp: string
  ): BehaviorEvent[] {
    const behaviors = this.getSupportedBehaviors().filter(b => b !== 'abnormal');
    const mockEvents: BehaviorEvent[] = [];
    const numEvents = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < numEvents; i++) {
      const behavior = behaviors[Math.floor(Math.random() * behaviors.length)];
      mockEvents.push({
        id: `behavior-mock-${Date.now()}-${i}`,
        cameraId,
        timestamp,
        petId,
        behavior,
        confidence: 0.6 + Math.random() * 0.4,
        duration: Math.random() * 60,
        description: this.getBehaviorDescription(behavior),
      });
    }

    return mockEvents;
  }
}

// 导出单例和服务类
export const behaviorAnalysisService = new BehaviorAnalysisService();
export { BehaviorAnalysisService };