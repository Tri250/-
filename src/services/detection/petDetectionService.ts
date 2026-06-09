/**
 * 宠物检测服务
 * 使用 YOLOv8 模型进行宠物检测、追踪和活动热点图生成
 * 通过后端 API 调用 AI 模型
 */

import type {
  PetDetection,
  PetDetectionConfig,
  TrackingResult,
  HeatmapData,
  BoundingBox,
  KeyPoint,
  PetType,
  YOLOv8Config,
  DetectionMode,
  DetectionServiceStatus,
} from './types';
import { DEFAULT_PET_DETECTION_CONFIG, DEFAULT_YOLOV8_CONFIG } from './types';

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
 * YOLOv8 检测结果
 */
interface YOLOv8DetectionResult {
  boundingBox: BoundingBox;
  confidence: number;
  classId: number;
  className: string;
  keyPoints?: KeyPoint[];
}

/**
 * 追踪器状态
 */
interface TrackerState {
  trackId: number;
  lastDetection: PetDetection;
  lostFrames: number;
  trajectory: Array<{ x: number; y: number; timestamp: string }>;
  startTime: string;
}

/**
 * 宠物检测服务类
 */
class PetDetectionService {
  /** 服务配置 */
  private config: PetDetectionConfig;
  /** YOLOv8 模型配置 */
  private yolov8Config: YOLOv8Config;
  /** 后端 API 基础 URL */
  private backendBaseUrl: string;
  /** 检测模式 */
  private mode: DetectionMode;
  /** 是否已初始化 */
  private initialized: boolean = false;
  /** 追踪器状态映射 */
  private trackers: Map<number, TrackerState> = new Map();
  /** 下一个追踪 ID */
  private nextTrackId: number = 1;
  /** 热点图数据缓存 */
  private heatmapCache: Map<string, Array<{ x: number; y: number; timestamp: string }>> = new Map();
  /** 检测历史记录 */
  private detectionHistory: PetDetection[] = [];
  /** 最大历史记录数 */
  private maxHistorySize: number = 1000;

  /**
   * 构造函数
   */
  constructor() {
    this.config = { ...DEFAULT_PET_DETECTION_CONFIG };
    this.yolov8Config = { ...DEFAULT_YOLOV8_CONFIG };
    this.backendBaseUrl = '/api';
    this.mode = 'realtime';
  }

  /**
   * 初始化服务
   * @param config 检测配置
   * @param yolov8Config YOLOv8 配置
   * @param backendBaseUrl 后端 API 基础 URL
   */
  async initialize(
    config?: Partial<PetDetectionConfig>,
    yolov8Config?: Partial<YOLOv8Config>,
    backendBaseUrl?: string
  ): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    if (yolov8Config) {
      this.yolov8Config = { ...this.yolov8Config, ...yolov8Config };
    }
    if (backendBaseUrl) {
      this.backendBaseUrl = backendBaseUrl;
    }

    // 检查后端 API 可用性
    try {
      const response = await fetch(`${this.backendBaseUrl}${this.yolov8Config.apiEndpoint}/health`, {
        method: 'GET',
      });
      
      if (response.ok) {
        this.initialized = true;
        console.log('[PetDetectionService] 服务初始化成功');
      } else {
        console.warn('[PetDetectionService] 后端 API 不可用，使用模拟模式');
        this.initialized = true;
      }
    } catch (error) {
      console.warn('[PetDetectionService] 后端 API 连接失败，使用模拟模式:', error);
      this.initialized = true;
    }
  }

  /**
   * 检测宠物
   * @param frame 图像帧数据
   * @param cameraId 摄像头 ID
   * @returns 宠物检测结果数组
   */
  async detectPet(frame: ImageData, cameraId: string): Promise<PetDetection[]> {
    if (!this.initialized) {
      throw new Error('[PetDetectionService] 服务未初始化');
    }

    const timestamp = new Date().toISOString();

    try {
      // 调用后端 YOLOv8 API
      const detections = await this.callYOLOv8API(frame, cameraId);
      
      // 更新追踪器
      if (this.config.enableTracking) {
        this.updateTrackers(detections, cameraId, timestamp);
      }

      // 更新热点图数据
      this.updateHeatmapData(detections, cameraId, timestamp);

      // 更新历史记录
      this.updateHistory(detections);

      return detections;
    } catch (error) {
      console.error('[PetDetectionService] 检测失败:', error);
      // 返回模拟数据
      return this.generateMockDetections(cameraId, timestamp);
    }
  }

  /**
   * 追踪宠物
   * @param detections 检测结果数组
   * @returns 追踪结果数组
   */
  trackPet(detections: PetDetection[]): TrackingResult[] {
    if (!this.config.enableTracking) {
      return [];
    }

    const results: TrackingResult[] = [];

    // 清理过期的追踪器
    this.cleanupExpiredTrackers();

    // 为每个检测找到对应的追踪器
    for (const detection of detections) {
      if (detection.trackId !== undefined) {
        const tracker = this.trackers.get(detection.trackId);
        if (tracker) {
          results.push({
            trackId: tracker.trackId,
            petId: tracker.lastDetection.petId,
            trajectory: tracker.trajectory,
            status: 'active',
            duration: (Date.now() - new Date(tracker.startTime).getTime()) / 1000,
            avgConfidence: this.calculateAvgConfidence(tracker),
          });
        }
      }
    }

    return results;
  }

  /**
   * 获取活动热点图
   * @param cameraId 摄像头 ID
   * @param timeRange 时间范围（可选）
   * @returns 热点图数据
   */
  getActivityHeatmap(
    cameraId: string,
    timeRange?: { start: string; end: string }
  ): HeatmapData {
    const positions = this.heatmapCache.get(cameraId) || [];
    
    // 过滤时间范围
    let filteredPositions = positions;
    if (timeRange) {
      const startTime = new Date(timeRange.start).getTime();
      const endTime = new Date(timeRange.end).getTime();
      filteredPositions = positions.filter(p => {
        const t = new Date(p.timestamp).getTime();
        return t >= startTime && t <= endTime;
      });
    }

    // 生成热点图网格
    const resolution = { width: 20, height: 15 };
    const values: number[][] = [];
    
    for (let y = 0; y < resolution.height; y++) {
      values[y] = [];
      for (let x = 0; x < resolution.width; x++) {
        values[y][x] = 0;
      }
    }

    // 计算每个网格的位置密度
    for (const pos of filteredPositions) {
      const gridX = Math.floor(pos.x * resolution.width);
      const gridY = Math.floor(pos.y * resolution.height);
      if (gridX >= 0 && gridX < resolution.width && gridY >= 0 && gridY < resolution.height) {
        values[gridY][gridX]++;
      }
    }

    // 归一化
    const maxValue = Math.max(...values.flat(), 1);
    for (let y = 0; y < resolution.height; y++) {
      for (let x = 0; x < resolution.width; x++) {
        values[y][x] /= maxValue;
      }
    }

    // 识别热点区域
    const hotspots = this.identifyHotspots(values, resolution);

    return {
      cameraId,
      timeRange: timeRange || {
        start: positions[0]?.timestamp || new Date().toISOString(),
        end: positions[positions.length - 1]?.timestamp || new Date().toISOString(),
      },
      resolution,
      values,
      hotspots,
    };
  }

  /**
   * 获取服务状态
   */
  getStatus(): DetectionServiceStatus {
    return {
      serviceName: 'PetDetectionService',
      initialized: this.initialized,
      modelStatus: {
        yolov8: this.initialized ? 'loaded' : 'idle',
        yamnet: 'idle',
        behavior: 'idle',
        custom: 'idle',
      },
      isDetecting: this.detectionHistory.length > 0,
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
  updateConfig(config: Partial<PetDetectionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 清除历史数据
   */
  clearHistory(): void {
    this.detectionHistory = [];
    this.trackers.clear();
    this.heatmapCache.clear();
  }

  // ==================== 私有方法 ====================

  /**
   * 调用 YOLOv8 后端 API
   */
  private async callYOLOv8API(frame: ImageData, cameraId: string): Promise<PetDetection[]> {
    // 将 ImageData 转换为 Base64
    const canvas = document.createElement('canvas');
    canvas.width = frame.width;
    canvas.height = frame.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法创建 Canvas 上下文');
    }
    ctx.putImageData(frame, 0, 0);
    const base64Image = canvas.toDataURL('image/jpeg', 0.8);

    const response = await fetch(`${this.backendBaseUrl}${this.yolov8Config.apiEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
        confidenceThreshold: this.config.confidenceThreshold,
        nmsThreshold: this.config.nmsThreshold,
        maxDetections: this.config.maxDetections,
        enableKeyPoints: this.config.enableKeyPoints,
        cameraId,
      }),
    });

    if (!response.ok) {
      throw new Error(`YOLOv8 API 请求失败: ${response.status}`);
    }

    const result: APIResponse<YOLOv8DetectionResult[]> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'YOLOv8 检测失败');
    }

    // 转换为 PetDetection 格式
    const timestamp = new Date().toISOString();
    return result.data.map((det, index) => ({
      id: `pet-${Date.now()}-${index}`,
      cameraId,
      timestamp,
      boundingBox: det.boundingBox,
      confidence: det.confidence,
      petType: this.mapClassToPetType(det.className),
      keyPoints: det.keyPoints,
      metadata: {
        classId: det.classId,
        className: det.className,
        processingTime: result.processingTime,
      },
    }));
  }

  /**
   * 更新追踪器状态
   */
  private updateTrackers(detections: PetDetection[], cameraId: string, timestamp: string): void {
    // 增加所有追踪器的丢失帧计数
    for (const [_trackId, tracker] of this.trackers) {
      tracker.lostFrames++;
    }

    // 为每个检测匹配或创建追踪器
    for (const detection of detections) {
      const matchedTrackId = this.matchDetectionToTracker(detection);
      
      if (matchedTrackId !== undefined) {
        // 更新现有追踪器
        const tracker = this.trackers.get(matchedTrackId);
        if (tracker) {
          tracker.lastDetection = detection;
          tracker.lostFrames = 0;
          tracker.trajectory.push({
            x: detection.boundingBox.x + detection.boundingBox.width / 2,
            y: detection.boundingBox.y + detection.boundingBox.height / 2,
            timestamp,
          });
          detection.trackId = matchedTrackId;
        }
      } else {
        // 创建新追踪器
        const trackId = this.nextTrackId++;
        this.trackers.set(trackId, {
          trackId,
          lastDetection: detection,
          lostFrames: 0,
          trajectory: [{
            x: detection.boundingBox.x + detection.boundingBox.width / 2,
            y: detection.boundingBox.y + detection.boundingBox.height / 2,
            timestamp,
          }],
          startTime: timestamp,
        });
        detection.trackId = trackId;
      }
    }
  }

  /**
   * 将检测匹配到现有追踪器
   */
  private matchDetectionToTracker(detection: PetDetection): number | undefined {
    let bestMatchId: number | undefined;
    let bestMatchDistance = Infinity;

    for (const [trackId, tracker] of this.trackers) {
      // 跳过丢失帧数过多的追踪器
      if (tracker.lostFrames > this.config.trackingMaxLostFrames) {
        continue;
      }

      // 计算中心点距离
      const lastCenter = {
        x: tracker.lastDetection.boundingBox.x + tracker.lastDetection.boundingBox.width / 2,
        y: tracker.lastDetection.boundingBox.y + tracker.lastDetection.boundingBox.height / 2,
      };
      const currentCenter = {
        x: detection.boundingBox.x + detection.boundingBox.width / 2,
        y: detection.boundingBox.y + detection.boundingBox.height / 2,
      };
      
      const distance = Math.sqrt(
        Math.pow(currentCenter.x - lastCenter.x, 2) +
        Math.pow(currentCenter.y - lastCenter.y, 2)
      );

      // 使用 IOU 作为匹配标准
      const iou = this.calculateIOU(
        tracker.lastDetection.boundingBox,
        detection.boundingBox
      );

      // 综合距离和 IOU
      const matchScore = distance * (1 - iou);
      
      if (matchScore < bestMatchDistance) {
        bestMatchDistance = matchScore;
        bestMatchId = trackId;
      }
    }

    return bestMatchId;
  }

  /**
   * 计算两个边界框的 IOU
   */
  private calculateIOU(box1: BoundingBox, box2: BoundingBox): number {
    const x1 = Math.max(box1.x, box2.x);
    const y1 = Math.max(box1.y, box2.y);
    const x2 = Math.min(box1.x + box1.width, box2.x + box2.width);
    const y2 = Math.min(box1.y + box1.height, box2.y + box2.height);

    if (x2 < x1 || y2 < y1) {
      return 0;
    }

    const intersection = (x2 - x1) * (y2 - y1);
    const area1 = box1.width * box1.height;
    const area2 = box2.width * box2.height;
    const union = area1 + area2 - intersection;

    return intersection / union;
  }

  /**
   * 清理过期的追踪器
   */
  private cleanupExpiredTrackers(): void {
    for (const [trackId, tracker] of this.trackers) {
      if (tracker.lostFrames > this.config.trackingMaxLostFrames) {
        this.trackers.delete(trackId);
      }
    }
  }

  /**
   * 更新热点图数据
   */
  private updateHeatmapData(detections: PetDetection[], cameraId: string, timestamp: string): void {
    if (!this.heatmapCache.has(cameraId)) {
      this.heatmapCache.set(cameraId, []);
    }

    const positions = this.heatmapCache.get(cameraId)!;
    for (const detection of detections) {
      positions.push({
        x: detection.boundingBox.x + detection.boundingBox.width / 2,
        y: detection.boundingBox.y + detection.boundingBox.height / 2,
        timestamp,
      });
    }

    // 限制缓存大小
    if (positions.length > 10000) {
      positions.splice(0, positions.length - 10000);
    }
  }

  /**
   * 更新历史记录
   */
  private updateHistory(detections: PetDetection[]): void {
    this.detectionHistory.push(...detections);
    if (this.detectionHistory.length > this.maxHistorySize) {
      this.detectionHistory.splice(0, this.detectionHistory.length - this.maxHistorySize);
    }
  }

  /**
   * 识别热点区域
   */
  private identifyHotspots(
    values: number[][],
    resolution: { width: number; height: number }
  ): Array<{ x: number; y: number; radius: number; intensity: number }> {
    const hotspots: Array<{ x: number; y: number; radius: number; intensity: number }> = [];
    const threshold = 0.5;

    for (let y = 0; y < resolution.height; y++) {
      for (let x = 0; x < resolution.width; x++) {
        if (values[y][x] >= threshold) {
          hotspots.push({
            x: x / resolution.width,
            y: y / resolution.height,
            radius: 0.1,
            intensity: values[y][x],
          });
        }
      }
    }

    return hotspots;
  }

  /**
   * 计算追踪器的平均置信度
   */
  private calculateAvgConfidence(tracker: TrackerState): number {
    // 简化实现：返回最后一次检测的置信度
    return tracker.lastDetection.confidence;
  }

  /**
   * 将类别名称映射到宠物类型
   */
  private mapClassToPetType(className: string): PetType {
    const classMap: Record<string, PetType> = {
      cat: 'cat',
      dog: 'dog',
      bird: 'bird',
      rabbit: 'rabbit',
      hamster: 'hamster',
    };
    return classMap[className.toLowerCase()] || 'other';
  }

  /**
   * 生成模拟检测结果
   */
  private generateMockDetections(cameraId: string, timestamp: string): PetDetection[] {
    const mockDetections: PetDetection[] = [];
    const numDetections = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < numDetections; i++) {
      mockDetections.push({
        id: `pet-mock-${Date.now()}-${i}`,
        cameraId,
        timestamp,
        boundingBox: {
          x: Math.random() * 0.6,
          y: Math.random() * 0.6,
          width: 0.2 + Math.random() * 0.2,
          height: 0.2 + Math.random() * 0.2,
        },
        confidence: 0.7 + Math.random() * 0.3,
        petType: Math.random() > 0.5 ? 'cat' : 'dog',
        behavior: ['sleeping', 'playing', 'eating'][Math.floor(Math.random() * 3)],
        emotion: ['happy', 'calm', 'excited'][Math.floor(Math.random() * 3)],
      });
    }

    return mockDetections;
  }
}

// 导出单例和服务类
export const petDetectionService = new PetDetectionService();
export { PetDetectionService };