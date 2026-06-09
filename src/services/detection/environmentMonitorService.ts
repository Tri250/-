/**
 * 环境监控服务
 * 监控环境变化并检测异常
 * 包括亮度、噪音、画面变化等检测
 */

import type {
  EnvironmentData,
  EnvironmentAnomaly,
  EnvironmentAnomalyType,
  EnvironmentMonitorConfig,
  DetectionMode,
  DetectionServiceStatus,
  EventSeverity,
} from './types';
import { DEFAULT_ENVIRONMENT_MONITOR_CONFIG } from './types';

/**
 * 环境历史数据点
 */
interface EnvironmentDataPoint {
  timestamp: string;
  data: EnvironmentData;
}

/**
 * 环境监控服务类
 */
class EnvironmentMonitorService {
  /** 服务配置 */
  private config: EnvironmentMonitorConfig;
  /** 检测模式 */
  private mode: DetectionMode;
  /** 是否已初始化 */
  private initialized: boolean = false;
  /** 环境数据历史 */
  private dataHistory: Map<string, EnvironmentDataPoint[]> = new Map();
  /** 异常事件历史 */
  private anomalyHistory: EnvironmentAnomaly[] = [];
  /** 最大历史记录数 */
  private maxHistorySize: number = 1000;
  /** 监控定时器 */
  private monitorTimers: Map<string, number> = new Map();
  /** 当前环境数据 */
  private currentData: Map<string, EnvironmentData> = new Map();

  /**
   * 构造函数
   */
  constructor() {
    this.config = { ...DEFAULT_ENVIRONMENT_MONITOR_CONFIG };
    this.mode = 'realtime';
  }

  /**
   * 初始化服务
   * @param config 监控配置
   */
  async initialize(config?: Partial<EnvironmentMonitorConfig>): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    this.initialized = true;
    console.log('[EnvironmentMonitorService] 服务初始化成功');
  }

  /**
   * 监控环境
   * @param cameraId 摄像头 ID
   * @returns 环境数据
   */
  async monitorEnvironment(cameraId: string): Promise<EnvironmentData> {
    if (!this.initialized) {
      throw new Error('[EnvironmentMonitorService] 服务未初始化');
    }

    const timestamp = new Date().toISOString();

    // 获取环境数据（实际应用中需要从传感器或摄像头获取）
    const data = await this.collectEnvironmentData(cameraId, timestamp);
    
    // 更新当前数据
    this.currentData.set(cameraId, data);
    
    // 更新历史记录
    this.updateHistory(cameraId, data);

    return data;
  }

  /**
   * 检测异常
   * @param data 环境数据
   * @returns 异常数组
   */
  detectAnomaly(data: EnvironmentData): EnvironmentAnomaly[] {
    const anomalies: EnvironmentAnomaly[] = [];
    const timestamp = data.timestamp;

    // 检测亮度异常
    if (data.brightness !== undefined) {
      const brightnessAnomaly = this.detectBrightnessAnomaly(data, timestamp);
      if (brightnessAnomaly) {
        anomalies.push(brightnessAnomaly);
      }
    }

    // 检测噪音异常
    if (data.noiseLevel !== undefined) {
      const noiseAnomaly = this.detectNoiseAnomaly(data, timestamp);
      if (noiseAnomaly) {
        anomalies.push(noiseAnomaly);
      }
    }

    // 检测温度异常
    if (data.temperature !== undefined) {
      const tempAnomaly = this.detectTemperatureAnomaly(data, timestamp);
      if (tempAnomaly) {
        anomalies.push(tempAnomaly);
      }
    }

    // 检测湿度异常
    if (data.humidity !== undefined) {
      const humidityAnomaly = this.detectHumidityAnomaly(data, timestamp);
      if (humidityAnomaly) {
        anomalies.push(humidityAnomaly);
      }
    }

    // 检测画面变化异常
    if (data.frameChangeRate !== undefined) {
      const frameChangeAnomaly = this.detectFrameChangeAnomaly(data, timestamp);
      if (frameChangeAnomaly) {
        anomalies.push(frameChangeAnomaly);
      }
    }

    // 检测运动强度异常
    if (data.motionIntensity !== undefined) {
      const motionAnomaly = this.detectMotionAnomaly(data, timestamp);
      if (motionAnomaly) {
        anomalies.push(motionAnomaly);
      }
    }

    // 更新异常历史
    for (const anomaly of anomalies) {
      this.anomalyHistory.push(anomaly);
    }

    // 限制历史大小
    if (this.anomalyHistory.length > this.maxHistorySize) {
      this.anomalyHistory.splice(0, this.anomalyHistory.length - this.maxHistorySize);
    }

    return anomalies;
  }

  /**
   * 获取环境数据历史
   * @param cameraId 摄像头 ID
   * @param limit 最大数量
   * @returns 环境数据数组
   */
  getEnvironmentHistory(cameraId: string, limit: number = 100): EnvironmentData[] {
    const history = this.dataHistory.get(cameraId) || [];
    return history.slice(-limit).map(point => point.data);
  }

  /**
   * 获取异常事件历史
   * @param cameraId 摄像头 ID（可选）
   * @param limit 最大数量
   * @returns 异常数组
   */
  getAnomalyHistory(cameraId?: string, limit: number = 50): EnvironmentAnomaly[] {
    let anomalies = this.anomalyHistory;
    if (cameraId) {
      anomalies = anomalies.filter(a => a.cameraId === cameraId);
    }
    return anomalies.slice(-limit);
  }

  /**
   * 获取当前环境数据
   * @param cameraId 摄像头 ID
   * @returns 环境数据
   */
  getCurrentEnvironment(cameraId: string): EnvironmentData | undefined {
    return this.currentData.get(cameraId);
  }

  /**
   * 开始持续监控
   * @param cameraId 摄像头 ID
   * @param callback 数据回调函数
   */
  startContinuousMonitoring(
    cameraId: string,
    callback: (data: EnvironmentData, anomalies: EnvironmentAnomaly[]) => void
  ): void {
    // 清除现有定时器
    this.stopContinuousMonitoring(cameraId);

    // 创建新定时器
    const timerId = window.setInterval(async () => {
      try {
        const data = await this.monitorEnvironment(cameraId);
        const anomalies = this.detectAnomaly(data);
        callback(data, anomalies);
      } catch (error) {
        console.error('[EnvironmentMonitorService] 监控错误:', error);
      }
    }, this.config.detectionInterval);

    this.monitorTimers.set(cameraId, timerId);
    console.log('[EnvironmentMonitorService] 开始持续监控:', cameraId);
  }

  /**
   * 停止持续监控
   * @param cameraId 摄像头 ID
   */
  stopContinuousMonitoring(cameraId: string): void {
    const timerId = this.monitorTimers.get(cameraId);
    if (timerId) {
      window.clearInterval(timerId);
      this.monitorTimers.delete(cameraId);
      console.log('[EnvironmentMonitorService] 停止持续监控:', cameraId);
    }
  }

  /**
   * 获取服务状态
   */
  getStatus(): DetectionServiceStatus {
    return {
      serviceName: 'EnvironmentMonitorService',
      initialized: this.initialized,
      modelStatus: {
        yolov8: 'idle',
        yamnet: 'idle',
        behavior: 'idle',
        custom: 'idle',
      },
      isDetecting: this.monitorTimers.size > 0,
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
  updateConfig(config: Partial<EnvironmentMonitorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 清除历史数据
   */
  clearHistory(): void {
    this.dataHistory.clear();
    this.anomalyHistory = [];
    this.currentData.clear();
  }

  /**
   * 获取异常类型描述（中文）
   */
  getAnomalyDescription(type: EnvironmentAnomalyType): string {
    const descriptions: Record<EnvironmentAnomalyType, string> = {
      brightness_drop: '亮度骤降',
      brightness_spike: '亮度骤增',
      noise_anomaly: '异常噪音',
      temperature_high: '温度过高',
      temperature_low: '温度过低',
      humidity_high: '湿度过高',
      humidity_low: '湿度过低',
      motion_sudden: '突然运动',
      frame_change_large: '画面大幅变化',
      camera_blocked: '摄像头被遮挡',
      camera_moved: '摄像头移动',
    };
    return descriptions[type] || '未知异常';
  }

  // ==================== 私有方法 ====================

  /**
   * 收集环境数据
   */
  private async collectEnvironmentData(
    cameraId: string,
    timestamp: string
  ): Promise<EnvironmentData> {
    // 实际应用中，这里需要：
    // 1. 从摄像头获取亮度数据
    // 2. 从麦克风获取噪音数据
    // 3. 从传感器获取温度/湿度数据
    // 4. 分析画面变化率

    // 模拟数据生成
    const previousData = this.getPreviousData(cameraId);
    
    const data: EnvironmentData = {
      cameraId,
      timestamp,
      brightness: this.calculateBrightness(previousData),
      noiseLevel: this.calculateNoiseLevel(previousData),
      temperature: this.calculateTemperature(previousData),
      humidity: this.calculateHumidity(previousData),
      frameChangeRate: this.calculateFrameChangeRate(previousData),
      motionIntensity: this.calculateMotionIntensity(previousData),
    };

    return data;
  }

  /**
   * 获取前一数据点
   */
  private getPreviousData(cameraId: string): EnvironmentData | undefined {
    const history = this.dataHistory.get(cameraId) || [];
    if (history.length > 0) {
      return history[history.length - 1].data;
    }
    return undefined;
  }

  /**
   * 检测亮度异常
   */
  private detectBrightnessAnomaly(data: EnvironmentData, timestamp: string): EnvironmentAnomaly | null {
    const previousData = this.getPreviousData(data.cameraId);
    if (!previousData || previousData.brightness === undefined) {
      return null;
    }

    const brightnessChange = Math.abs(data.brightness - previousData.brightness);
    
    if (brightnessChange > this.config.brightnessChangeThreshold) {
      const type: EnvironmentAnomalyType = data.brightness < previousData.brightness
        ? 'brightness_drop'
        : 'brightness_spike';
      
      const severity: EventSeverity = brightnessChange > 0.5 ? 'critical' : 'warning';

      return {
        id: `env-${Date.now()}-brightness`,
        cameraId: data.cameraId,
        timestamp,
        type,
        severity,
        description: this.getAnomalyDescription(type),
        value: data.brightness,
        normalRange: {
          min: previousData.brightness - this.config.brightnessChangeThreshold,
          max: previousData.brightness + this.config.brightnessChangeThreshold,
        },
      };
    }

    return null;
  }

  /**
   * 检测噪音异常
   */
  private detectNoiseAnomaly(data: EnvironmentData, timestamp: string): EnvironmentAnomaly | null {
    if (data.noiseLevel > this.config.noiseThreshold) {
      const severity: EventSeverity = data.noiseLevel > this.config.noiseThreshold + 20
        ? 'critical'
        : 'warning';

      return {
        id: `env-${Date.now()}-noise`,
        cameraId: data.cameraId,
        timestamp,
        type: 'noise_anomaly',
        severity,
        description: this.getAnomalyDescription('noise_anomaly'),
        value: data.noiseLevel,
        normalRange: {
          min: 0,
          max: this.config.noiseThreshold,
        },
      };
    }

    return null;
  }

  /**
   * 检测温度异常
   */
  private detectTemperatureAnomaly(data: EnvironmentData, timestamp: string): EnvironmentAnomaly | null {
    if (data.temperature === undefined) {
      return null;
    }

    if (data.temperature > this.config.temperatureRange.max) {
      return {
        id: `env-${Date.now()}-temp-high`,
        cameraId: data.cameraId,
        timestamp,
        type: 'temperature_high',
        severity: data.temperature > this.config.temperatureRange.max + 5 ? 'critical' : 'warning',
        description: this.getAnomalyDescription('temperature_high'),
        value: data.temperature,
        normalRange: this.config.temperatureRange,
      };
    }

    if (data.temperature < this.config.temperatureRange.min) {
      return {
        id: `env-${Date.now()}-temp-low`,
        cameraId: data.cameraId,
        timestamp,
        type: 'temperature_low',
        severity: data.temperature < this.config.temperatureRange.min - 5 ? 'critical' : 'warning',
        description: this.getAnomalyDescription('temperature_low'),
        value: data.temperature,
        normalRange: this.config.temperatureRange,
      };
    }

    return null;
  }

  /**
   * 检测湿度异常
   */
  private detectHumidityAnomaly(data: EnvironmentData, timestamp: string): EnvironmentAnomaly | null {
    if (data.humidity === undefined) {
      return null;
    }

    if (data.humidity > this.config.humidityRange.max) {
      return {
        id: `env-${Date.now()}-humidity-high`,
        cameraId: data.cameraId,
        timestamp,
        type: 'humidity_high',
        severity: data.humidity > this.config.humidityRange.max + 10 ? 'critical' : 'warning',
        description: this.getAnomalyDescription('humidity_high'),
        value: data.humidity,
        normalRange: this.config.humidityRange,
      };
    }

    if (data.humidity < this.config.humidityRange.min) {
      return {
        id: `env-${Date.now()}-humidity-low`,
        cameraId: data.cameraId,
        timestamp,
        type: 'humidity_low',
        severity: data.humidity < this.config.humidityRange.min - 10 ? 'critical' : 'warning',
        description: this.getAnomalyDescription('humidity_low'),
        value: data.humidity,
        normalRange: this.config.humidityRange,
      };
    }

    return null;
  }

  /**
   * 检测画面变化异常
   */
  private detectFrameChangeAnomaly(data: EnvironmentData, timestamp: string): EnvironmentAnomaly | null {
    if (data.frameChangeRate === undefined) {
      return null;
    }

    if (data.frameChangeRate > this.config.frameChangeThreshold) {
      // 判断是遮挡还是移动
      const type: EnvironmentAnomalyType = data.frameChangeRate > 0.9
        ? 'camera_blocked'
        : 'frame_change_large';

      return {
        id: `env-${Date.now()}-frame`,
        cameraId: data.cameraId,
        timestamp,
        type,
        severity: data.frameChangeRate > 0.8 ? 'critical' : 'warning',
        description: this.getAnomalyDescription(type),
        value: data.frameChangeRate,
        normalRange: {
          min: 0,
          max: this.config.frameChangeThreshold,
        },
      };
    }

    return null;
  }

  /**
   * 检测运动异常
   */
  private detectMotionAnomaly(data: EnvironmentData, timestamp: string): EnvironmentAnomaly | null {
    if (data.motionIntensity === undefined) {
      return null;
    }

    const previousData = this.getPreviousData(data.cameraId);
    if (!previousData || previousData.motionIntensity === undefined) {
      return null;
    }

    const motionChange = Math.abs(data.motionIntensity - previousData.motionIntensity);
    
    if (motionChange > 0.5 && data.motionIntensity > 0.7) {
      return {
        id: `env-${Date.now()}-motion`,
        cameraId: data.cameraId,
        timestamp,
        type: 'motion_sudden',
        severity: 'warning',
        description: this.getAnomalyDescription('motion_sudden'),
        value: data.motionIntensity,
        normalRange: {
          min: 0,
          max: 0.5,
        },
      };
    }

    return null;
  }

  /**
   * 更新历史记录
   */
  private updateHistory(cameraId: string, data: EnvironmentData): void {
    if (!this.dataHistory.has(cameraId)) {
      this.dataHistory.set(cameraId, []);
    }

    const history = this.dataHistory.get(cameraId)!;
    history.push({
      timestamp: data.timestamp,
      data,
    });

    // 限制历史大小
    if (history.length > this.config.historyWindowSize) {
      history.shift();
    }
  }

  /**
   * 计算亮度（模拟）
   */
  private calculateBrightness(previousData?: EnvironmentData): number {
    const base = previousData?.brightness || 50;
    const change = (Math.random() - 0.5) * 10;
    return Math.max(0, Math.min(100, base + change));
  }

  /**
   * 计算噪音级别（模拟）
   */
  private calculateNoiseLevel(previousData?: EnvironmentData): number {
    const base = previousData?.noiseLevel || 40;
    const change = (Math.random() - 0.5) * 20;
    return Math.max(0, Math.min(100, base + change));
  }

  /**
   * 计算温度（模拟）
   */
  private calculateTemperature(previousData?: EnvironmentData): number {
    const base = previousData?.temperature || 22;
    const change = (Math.random() - 0.5) * 2;
    return Math.max(0, Math.min(40, base + change));
  }

  /**
   * 计算湿度（模拟）
   */
  private calculateHumidity(previousData?: EnvironmentData): number {
    const base = previousData?.humidity || 50;
    const change = (Math.random() - 0.5) * 5;
    return Math.max(0, Math.min(100, base + change));
  }

  /**
   * 计算画面变化率（模拟）
   */
  private calculateFrameChangeRate(previousData?: EnvironmentData): number {
    const base = previousData?.frameChangeRate || 0.1;
    const change = (Math.random() - 0.5) * 0.1;
    return Math.max(0, Math.min(1, base + change));
  }

  /**
   * 计算运动强度（模拟）
   */
  private calculateMotionIntensity(previousData?: EnvironmentData): number {
    const base = previousData?.motionIntensity || 0.2;
    const change = (Math.random() - 0.5) * 0.2;
    return Math.max(0, Math.min(1, base + change));
  }
}

// 导出单例和服务类
export const environmentMonitorService = new EnvironmentMonitorService();
export { EnvironmentMonitorService };