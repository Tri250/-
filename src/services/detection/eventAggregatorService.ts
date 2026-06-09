/**
 * 事件聚合服务
 * 多模态事件融合、事件优先级排序、LLM 智能解读
 */

import type { SmartEvent, EventType, EventSeverity } from '../../types/monitor';
import type {
  AggregatedEvent,
  EventPriority,
  EventAggregatorConfig,
  DetectionMode,
  DetectionServiceStatus,
  BehaviorEvent,
  SoundEvent,
  EnvironmentAnomaly,
  PetDetection,
} from './types';
import { DEFAULT_EVENT_AGGREGATOR_CONFIG } from './types';

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
 * LLM 解读请求
 */
interface LLMInsightRequest {
  events: SmartEvent[];
  context?: {
    petType?: string;
    petName?: string;
    cameraName?: string;
    recentHistory?: SmartEvent[];
  };
  language: string;
}

/**
 * LLM 解读响应
 */
interface LLMInsightResponse {
  insight: string;
  suggestedActions?: Array<{
    label: string;
    action: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  confidence: number;
}

/**
 * 事件聚合服务类
 */
class EventAggregatorService {
  /** 服务配置 */
  private config: EventAggregatorConfig;
  /** 后端 API 基础 URL */
  private backendBaseUrl: string;
  /** 检测模式 */
  private mode: DetectionMode;
  /** 是否已初始化 */
  private initialized: boolean = false;
  /** 聚合事件历史 */
  private aggregatedHistory: AggregatedEvent[] = [];
  /** 原始事件历史 */
  private eventHistory: SmartEvent[] = [];
  /** 最大历史记录数 */
  private maxHistorySize: number = 1000;
  /** 时间窗口缓存 */
  private timeWindowCache: Map<string, SmartEvent[]> = new Map();

  /**
   * 构造函数
   */
  constructor() {
    this.config = { ...DEFAULT_EVENT_AGGREGATOR_CONFIG };
    this.backendBaseUrl = '/api';
    this.mode = 'realtime';
  }

  /**
   * 初始化服务
   * @param config 聚合配置
   * @param backendBaseUrl 后端 API 基础 URL
   */
  async initialize(
    config?: Partial<EventAggregatorConfig>,
    backendBaseUrl?: string
  ): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    if (backendBaseUrl) {
      this.backendBaseUrl = backendBaseUrl;
    }

    // 检查后端 API 可用性
    try {
      const response = await fetch(`${this.backendBaseUrl}/ai/insight/health`, {
        method: 'GET',
      });
      
      if (response.ok) {
        this.initialized = true;
        console.log('[EventAggregatorService] 服务初始化成功');
      } else {
        console.warn('[EventAggregatorService] 后端 API 不可用，使用模拟模式');
        this.initialized = true;
      }
    } catch (error) {
      console.warn('[EventAggregatorService] 后端 API 连接失败，使用模拟模式:', error);
      this.initialized = true;
    }
  }

  /**
   * 聚合事件
   * @param events 原始事件数组
   * @returns 聚合事件
   */
  async aggregateEvents(events: SmartEvent[]): Promise<AggregatedEvent> {
    if (!this.initialized) {
      throw new Error('[EventAggregatorService] 服务未初始化');
    }

    if (events.length === 0) {
      throw new Error('[EventAggregatorService] 事件数组为空');
    }

    const timestamp = new Date().toISOString();

    // 按时间窗口分组
    const windowEvents = this.groupByTimeWindow(events);

    // 多模态融合
    const fusedEvent = this.fuseMultiModalEvents(windowEvents);

    // 计算置信度
    const confidence = this.calculateFusionConfidence(windowEvents);

    // 生成 LLM 解读
    let insight: string | undefined;
    let suggestedActions: Array<{ label: string; action: string; priority: 'low' | 'medium' | 'high' }> | undefined;

    if (this.config.enableLLMInsight) {
      try {
        const llmResponse = await this.generateLLMInsight(events);
        insight = llmResponse.insight;
        suggestedActions = llmResponse.suggestedActions;
      } catch (error) {
        console.error('[EventAggregatorService] LLM 解读失败:', error);
        insight = this.generateFallbackInsight(events);
      }
    }

    // 创建聚合事件
    const aggregatedEvent: AggregatedEvent = {
      id: `agg-${Date.now()}`,
      timestamp,
      type: fusedEvent.type,
      severity: fusedEvent.severity,
      title: this.generateEventTitle(fusedEvent, events),
      description: this.generateEventDescription(fusedEvent, events),
      cameraId: events[0].cameraId,
      petId: events.find(e => e.petId)?.petId,
      sourceEvents: events,
      confidence,
      insight,
      suggestedActions,
      metadata: {
        eventCount: events.length,
        timeWindow: this.config.timeWindowSize,
        fusionStrategy: 'multi_modal',
      },
    };

    // 更新历史记录
    this.updateHistory(aggregatedEvent, events);

    return aggregatedEvent;
  }

  /**
   * 生成智能解读
   * @param events 事件数组
   * @returns 解读文本
   */
  async generateInsight(events: SmartEvent[]): Promise<string> {
    if (!this.initialized) {
      throw new Error('[EventAggregatorService] 服务未初始化');
    }

    if (!this.config.enableLLMInsight) {
      return this.generateFallbackInsight(events);
    }

    try {
      const response = await this.callLLMInsightAPI(events);
      return response.insight;
    } catch (error) {
      console.error('[EventAggregatorService] 生成解读失败:', error);
      return this.generateFallbackInsight(events);
    }
  }

  /**
   * 优先级排序
   * @param events 事件数组
   * @returns 排序后的事件数组
   */
  prioritizeEvents(events: SmartEvent[]): SmartEvent[] {
    // 计算每个事件的优先级分数
    const priorities = events.map(event => this.calculateEventPriority(event));

    // 按优先级分数排序
    const sortedEvents = events
      .map((event, index) => ({ event, priority: priorities[index] }))
      .sort((a, b) => b.priority.score - a.priority.score)
      .map(item => item.event);

    return sortedEvents;
  }

  /**
   * 获取事件优先级详情
   * @param event 事件
   * @returns 优先级详情
   */
  getEventPriority(event: SmartEvent): EventPriority {
    return this.calculateEventPriority(event);
  }

  /**
   * 获取聚合事件历史
   * @param limit 最大数量
   * @returns 聚合事件数组
   */
  getAggregatedHistory(limit: number = 50): AggregatedEvent[] {
    return this.aggregatedHistory.slice(-limit);
  }

  /**
   * 获取原始事件历史
   * @param limit 最大数量
   * @returns 原始事件数组
   */
  getEventHistory(limit: number = 100): SmartEvent[] {
    return this.eventHistory.slice(-limit);
  }

  /**
   * 获取服务状态
   */
  getStatus(): DetectionServiceStatus {
    return {
      serviceName: 'EventAggregatorService',
      initialized: this.initialized,
      modelStatus: {
        yolov8: 'idle',
        yamnet: 'idle',
        behavior: 'idle',
        custom: this.config.enableLLMInsight ? 'loaded' : 'idle',
      },
      isDetecting: this.eventHistory.length > 0,
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
  updateConfig(config: Partial<EventAggregatorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 清除历史数据
   */
  clearHistory(): void {
    this.aggregatedHistory = [];
    this.eventHistory = [];
    this.timeWindowCache.clear();
  }

  /**
   * 转换行为事件为智能事件
   */
  convertBehaviorEvent(behaviorEvent: BehaviorEvent): SmartEvent {
    return {
      id: behaviorEvent.id,
      type: 'behavior',
      severity: this.mapBehaviorToSeverity(behaviorEvent.behavior),
      description: behaviorEvent.description || `检测到行为: ${behaviorEvent.behavior}`,
      cameraId: behaviorEvent.cameraId,
      timestamp: behaviorEvent.timestamp,
      petId: behaviorEvent.petId,
      acknowledged: false,
      metadata: {
        behavior: behaviorEvent.behavior,
        confidence: behaviorEvent.confidence,
        duration: behaviorEvent.duration,
      },
    };
  }

  /**
   * 转换声音事件为智能事件
   */
  convertSoundEvent(soundEvent: SoundEvent): SmartEvent {
    return {
      id: soundEvent.id,
      type: 'behavior',
      severity: soundEvent.isPetSound ? 'info' : 'warning',
      description: `检测到声音: ${soundEvent.soundType}`,
      cameraId: soundEvent.cameraId,
      timestamp: soundEvent.timestamp,
      acknowledged: false,
      metadata: {
        soundType: soundEvent.soundType,
        isPetSound: soundEvent.isPetSound,
        confidence: soundEvent.confidence,
        volumeLevel: soundEvent.volumeLevel,
      },
    };
  }

  /**
   * 转换环境异常为智能事件
   */
  convertEnvironmentAnomaly(anomaly: EnvironmentAnomaly): SmartEvent {
    return {
      id: anomaly.id,
      type: 'environment',
      severity: anomaly.severity,
      description: anomaly.description,
      cameraId: anomaly.cameraId,
      timestamp: anomaly.timestamp,
      acknowledged: false,
      metadata: {
        anomalyType: anomaly.type,
        value: anomaly.value,
        normalRange: anomaly.normalRange,
      },
    };
  }

  /**
   * 转换宠物检测为智能事件
   */
  convertPetDetection(detection: PetDetection): SmartEvent {
    return {
      id: detection.id,
      type: 'behavior',
      severity: 'info',
      description: `检测到宠物: ${detection.petType}`,
      cameraId: detection.cameraId,
      timestamp: detection.timestamp,
      petId: detection.petId,
      acknowledged: false,
      metadata: {
        petType: detection.petType,
        confidence: detection.confidence,
        boundingBox: detection.boundingBox,
        behavior: detection.behavior,
        emotion: detection.emotion,
      },
    };
  }

  // ==================== 私有方法 ====================

  /**
   * 按时间窗口分组
   */
  private groupByTimeWindow(events: SmartEvent[]): SmartEvent[] {
    const now = Date.now();
    const windowStart = now - this.config.timeWindowSize * 1000;

    return events.filter(event => {
      const eventTime = new Date(event.timestamp).getTime();
      return eventTime >= windowStart && eventTime <= now;
    });
  }

  /**
   * 多模态融合
   */
  private fuseMultiModalEvents(events: SmartEvent[]): {
    type: EventType;
    severity: EventSeverity;
  } {
    // 统计各类型事件数量
    const typeCounts: Record<EventType, number> = {
      behavior: 0,
      emotion: 0,
      environment: 0,
    };

    const severityCounts: Record<EventSeverity, number> = {
      info: 0,
      warning: 0,
      critical: 0,
    };

    for (const event of events) {
      typeCounts[event.type]++;
      severityCounts[event.severity]++;
    }

    // 确定主要类型
    let dominantType: EventType = 'behavior';
    let maxCount = 0;
    for (const [type, count] of Object.entries(typeCounts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantType = type as EventType;
      }
    }

    // 确定严重程度（优先选择更严重的）
    if (severityCounts.critical > 0) {
      return { type: dominantType, severity: 'critical' };
    }
    if (severityCounts.warning > 0) {
      return { type: dominantType, severity: 'warning' };
    }
    return { type: dominantType, severity: 'info' };
  }

  /**
   * 计算融合置信度
   */
  private calculateFusionConfidence(events: SmartEvent[]): number {
    if (events.length === 0) {
      return 0;
    }

    // 计算平均置信度
    const confidences = events
      .map(e => e.metadata?.confidence as number)
      .filter(c => c !== undefined);

    if (confidences.length === 0) {
      return 0.5; // 默认置信度
    }

    // 多事件融合时置信度会提高
    const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    const eventCountBoost = Math.min(events.length * 0.05, 0.2);

    return Math.min(avgConfidence + eventCountBoost, 1);
  }

  /**
   * 调用 LLM 解读 API
   */
  private async callLLMInsightAPI(events: SmartEvent[]): Promise<LLMInsightResponse> {
    const request: LLMInsightRequest = {
      events,
      context: {
        recentHistory: this.eventHistory.slice(-10),
      },
      language: this.config.insightLanguage,
    };

    const response = await fetch(`${this.backendBaseUrl}/ai/insight`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`LLM API 请求失败: ${response.status}`);
    }

    const result: APIResponse<LLMInsightResponse> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'LLM 解读失败');
    }

    return result.data;
  }

  /**
   * 生成 LLM 智能解读
   */
  private async generateLLMInsight(events: SmartEvent[]): Promise<LLMInsightResponse> {
    try {
      return await this.callLLMInsightAPI(events);
    } catch {
      // 返回备用解读
      return {
        insight: this.generateFallbackInsight(events),
        suggestedActions: this.generateSuggestedActions(events),
        confidence: 0.5,
      };
    }
  }

  /**
   * 生成备用解读
   */
  private generateFallbackInsight(events: SmartEvent[]): string {
    if (events.length === 0) {
      return '无事件';
    }

    // 分析事件类型
    const behaviorEvents = events.filter(e => e.type === 'behavior');
    const emotionEvents = events.filter(e => e.type === 'emotion');
    const environmentEvents = events.filter(e => e.type === 'environment');

    let insight = '';

    // 行为分析
    if (behaviorEvents.length > 0) {
      const behaviors = behaviorEvents.map(e => e.metadata?.behavior as string).filter(b => b);
      if (behaviors.length > 0) {
        insight += `宠物当前行为: ${behaviors.join(', ')}. `;
      }
    }

    // 情绪分析
    if (emotionEvents.length > 0) {
      const emotions = emotionEvents.map(e => e.description);
      insight += `情绪状态: ${emotions.join(', ')}. `;
    }

    // 环境分析
    if (environmentEvents.length > 0) {
      const envTypes = environmentEvents.map(e => e.metadata?.anomalyType as string).filter(t => t);
      if (envTypes.length > 0) {
        insight += `环境变化: ${envTypes.join(', ')}. `;
      }
    }

    // 严重程度分析
    const criticalEvents = events.filter(e => e.severity === 'critical');
    const warningEvents = events.filter(e => e.severity === 'warning');
    
    if (criticalEvents.length > 0) {
      insight += `发现 ${criticalEvents.length} 个紧急事件，请立即关注。`;
    } else if (warningEvents.length > 0) {
      insight += `发现 ${warningEvents.length} 个警告事件，建议关注。`;
    } else {
      insight += `当前状态正常，无异常事件。`;
    }

    return insight;
  }

  /**
   * 生成建议操作
   */
  private generateSuggestedActions(events: SmartEvent[]): Array<{
    label: string;
    action: string;
    priority: 'low' | 'medium' | 'high';
  }> {
    const actions: Array<{
      label: string;
      action: string;
      priority: 'low' | 'medium' | 'high';
    }> = [];

    // 根据事件类型生成建议
    const criticalEvents = events.filter(e => e.severity === 'critical');
    const warningEvents = events.filter(e => e.severity === 'warning');

    if (criticalEvents.length > 0) {
      actions.push({
        label: '立即查看',
        action: 'view_camera',
        priority: 'high',
      });
      actions.push({
        label: '通知家人',
        action: 'notify_family',
        priority: 'high',
      });
    }

    if (warningEvents.length > 0) {
      actions.push({
        label: '查看详情',
        action: 'view_details',
        priority: 'medium',
      });
    }

    // 根据事件类型添加特定建议
    const environmentEvents = events.filter(e => e.type === 'environment');
    if (environmentEvents.length > 0) {
      actions.push({
        label: '检查环境',
        action: 'check_environment',
        priority: 'medium',
      });
    }

    return actions;
  }

  /**
   * 计算事件优先级
   */
  private calculateEventPriority(event: SmartEvent): EventPriority {
    const weights = this.config.priorityWeights;
    const factors: Array<{ name: string; weight: number; value: number }> = [];

    // 严重程度因素
    const severityValue = this.mapSeverityToValue(event.severity);
    factors.push({
      name: 'severity',
      weight: weights.severity,
      value: severityValue,
    });

    // 时间因素（越新越重要）
    const ageMs = Date.now() - new Date(event.timestamp).getTime();
    const recencyValue = Math.max(0, 1 - ageMs / (3600 * 1000)); // 1小时内
    factors.push({
      name: 'recency',
      weight: weights.recency,
      value: recencyValue,
    });

    // 频率因素（相似事件越多越重要）
    const similarEvents = this.eventHistory.filter(e =>
      e.type === event.type &&
      e.cameraId === event.cameraId &&
      Date.now() - new Date(e.timestamp).getTime() < 300 * 1000
    );
    const frequencyValue = Math.min(similarEvents.length / 5, 1);
    factors.push({
      name: 'frequency',
      weight: weights.frequency,
      value: frequencyValue,
    });

    // 置信度因素
    const confidenceValue = event.metadata?.confidence as number || 0.5;
    factors.push({
      name: 'confidence',
      weight: weights.confidence,
      value: confidenceValue,
    });

    // 计算总分
    const score = factors.reduce((sum, f) => sum + f.weight * f.value, 0) * 100;

    // 确定优先级等级
    let level: 'low' | 'medium' | 'high' | 'critical';
    if (score >= 80) {
      level = 'critical';
    } else if (score >= 60) {
      level = 'high';
    } else if (score >= 40) {
      level = 'medium';
    } else {
      level = 'low';
    }

    return {
      eventId: event.id,
      score,
      level,
      factors,
    };
  }

  /**
   * 映射严重程度到数值
   */
  private mapSeverityToValue(severity: EventSeverity): number {
    const values: Record<EventSeverity, number> = {
      info: 0.2,
      warning: 0.5,
      critical: 1.0,
    };
    return values[severity];
  }

  /**
   * 映射行为到严重程度
   */
  private mapBehaviorToSeverity(behavior: string): EventSeverity {
    const abnormalBehaviors = ['abnormal', 'scratching', 'running'];
    if (abnormalBehaviors.includes(behavior)) {
      return 'warning';
    }
    return 'info';
  }

  /**
   * 生成事件标题
   */
  private generateEventTitle(
    fusedEvent: { type: EventType; severity: EventSeverity },
    events: SmartEvent[]
  ): string {
    const typeNames: Record<EventType, string> = {
      behavior: '行为事件',
      emotion: '情绪事件',
      environment: '环境事件',
    };

    const severityNames: Record<EventSeverity, string> = {
      info: '信息',
      warning: '警告',
      critical: '紧急',
    };

    return `${severityNames[fusedEvent.severity]}: ${typeNames[fusedEvent.type]} (${events.length}个)`;
  }

  /**
   * 生成事件描述
   */
  private generateEventDescription(
    fusedEvent: { type: EventType; severity: EventSeverity },
    events: SmartEvent[]
  ): string {
    const descriptions = events.map(e => e.description).slice(0, 3);
    const description = descriptions.join('; ');
    
    if (events.length > 3) {
      return `${description}... (共${events.length}个事件)`;
    }
    return description;
  }

  /**
   * 更新历史记录
   */
  private updateHistory(aggregatedEvent: AggregatedEvent, events: SmartEvent[]): void {
    this.aggregatedHistory.push(aggregatedEvent);
    this.eventHistory.push(...events);

    if (this.aggregatedHistory.length > this.maxHistorySize) {
      this.aggregatedHistory.splice(0, this.aggregatedHistory.length - this.maxHistorySize);
    }

    if (this.eventHistory.length > this.maxHistorySize * 2) {
      this.eventHistory.splice(0, this.eventHistory.length - this.maxHistorySize * 2);
    }
  }
}

// 导出单例和服务类
export const eventAggregatorService = new EventAggregatorService();
export { EventAggregatorService };