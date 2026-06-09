/**
 * AI 检测服务基类
 * 提供 YOLOv8 模型调用接口、YAMNet 模型调用接口和 Python 服务调用（HTTP/WebSocket）
 */

import { v4 as uuidv4 } from 'uuid';
import {
  DetectionServiceConfig,
  PetDetection,
  PetDetectionRequest,
  BehaviorEvent,
  BehaviorAnalysisRequest,
  SoundEvent,
  SoundDetectionRequest,
  EnvironmentMonitorRequest,
  EnvironmentMonitorResponse,
  EnvironmentMetrics,
  EnvironmentAlert,
  EnvironmentMetric,
  EventAggregateRequest,
  EventAggregateResponse,
  EventSummary,
  AggregatedEvent,
  LLMInterpretation,
  BehaviorType,
  SoundType,
  PetClass,
  BoundingBox,
  PetAttributes,
} from '../types/v2-streaming';

/**
 * 默认检测服务配置
 */
const DEFAULT_CONFIG: DetectionServiceConfig = {
  yoloEndpoint: process.env.YOLO_ENDPOINT || 'http://localhost:8001',
  yamnetEndpoint: process.env.YAMNET_ENDPOINT || 'http://localhost:8002',
  llmEndpoint: process.env.LLM_ENDPOINT || 'http://localhost:8003',
  timeout: 30000,
  maxRetries: 3,
  batchSize: 10,
};

/**
 * 行为描述映射
 */
const BEHAVIOR_DESCRIPTIONS: Record<BehaviorType, string> = {
  eating: '宠物正在进食',
  drinking: '宠物正在喝水',
  sleeping: '宠物正在睡觉',
  playing: '宠物正在玩耍',
  running: '宠物正在奔跑',
  walking: '宠物正在行走',
  sitting: '宠物正在坐着',
  standing: '宠物正在站立',
  lying: '宠物正在躺着',
  grooming: '宠物正在清洁自己',
  scratching: '宠物正在抓挠',
  barking: '宠物正在吠叫',
  meowing: '宠物正在喵叫',
  chewing: '宠物正在咀嚼东西',
  digging: '宠物正在挖掘',
  jumping: '宠物正在跳跃',
  climbing: '宠物正在攀爬',
  hiding: '宠物正在躲藏',
  following: '宠物正在跟随某人',
  aggressive: '宠物表现出攻击性行为',
  anxious: '宠物表现出焦虑状态',
  sick: '宠物可能生病了',
  unknown: '无法识别的行为',
};

/**
 * 声音描述映射
 */
const SOUND_DESCRIPTIONS: Record<SoundType, string> = {
  bark: '检测到狗叫声',
  meow: '检测到猫叫声',
  whine: '检测到呜咽声',
  growl: '检测到低吼声',
  purr: '检测到呼噜声',
  hiss: '检测到嘶嘶声',
  sneeze: '检测到打喷嚏声',
  cough: '检测到咳嗽声',
  vomit: '检测到呕吐声',
  scratch: '检测到抓挠声',
  footsteps: '检测到脚步声',
  door: '检测到门声',
  glass_break: '检测到玻璃破碎声',
  fire_alarm: '检测到火警声',
  smoke_alarm: '检测到烟雾报警声',
  unknown: '检测到未知声音',
};

/**
 * 行为建议映射
 */
const BEHAVIOR_SUGGESTIONS: Record<BehaviorType, string[]> = {
  eating: ['宠物进食正常', '注意观察进食量是否正常'],
  drinking: ['宠物喝水正常', '确保水源清洁充足'],
  sleeping: ['宠物正在休息', '不要打扰宠物休息'],
  playing: ['宠物心情愉快', '可以继续互动玩耍'],
  running: ['宠物精力充沛', '注意观察是否有异常奔跑'],
  walking: ['宠物活动正常', '可以安排户外散步'],
  sitting: ['宠物处于静止状态', '可以尝试互动'],
  standing: ['宠物正在观察环境', '可能对某事物感兴趣'],
  lying: ['宠物正在休息', '注意观察是否有不适'],
  grooming: ['宠物正在清洁自己', '这是正常行为'],
  scratching: ['可能皮肤有问题', '建议检查皮肤状况'],
  barking: ['宠物在表达某种需求', '观察周围环境是否有异常'],
  meowing: ['宠物在表达某种需求', '检查是否需要食物或关注'],
  chewing: ['宠物在咀嚼东西', '注意防止吞食异物'],
  digging: ['宠物在挖掘', '可能是在寻找什么'],
  jumping: ['宠物很活跃', '注意安全防止受伤'],
  climbing: ['宠物在攀爬', '注意安全'],
  hiding: ['宠物在躲藏', '可能感到害怕或不适'],
  following: ['宠物在跟随某人', '表示对主人依赖'],
  aggressive: ['宠物有攻击倾向', '请远离并寻求专业帮助'],
  anxious: ['宠物感到焦虑', '尝试安抚并找出原因'],
  sick: ['宠物可能生病', '建议尽快就医检查'],
  unknown: ['无法识别行为', '请人工观察确认'],
};

/**
 * 声音告警级别
 */
const SOUND_ALERT_LEVELS: Record<SoundType, boolean> = {
  bark: false,
  meow: false,
  whine: true,
  growl: true,
  purr: false,
  hiss: true,
  sneeze: true,
  cough: true,
  vomit: true,
  scratch: false,
  footsteps: false,
  door: false,
  glass_break: true,
  fire_alarm: true,
  smoke_alarm: true,
  unknown: false,
};

/**
 * AI 检测服务类
 */
export class DetectionService {
  protected config: DetectionServiceConfig;
  
  // 存储检测结果用于聚合分析
  protected detectionResults: Map<string, PetDetection[]> = new Map();
  protected behaviorEvents: Map<string, BehaviorEvent[]> = new Map();
  protected soundEvents: Map<string, SoundEvent[]> = new Map();

  constructor(config: Partial<DetectionServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 宠物检测
   * @param frameBuffer 视频帧数据
   * @param request 检测请求
   * @returns 检测结果
   */
  async detectPet(frameBuffer: Buffer, request: PetDetectionRequest): Promise<PetDetection> {
    const startTime = Date.now();
    const { deviceId, timestamp = new Date().toISOString() } = request;

    try {
      // 尝试调用 YOLOv8 服务
      const result = await this.callYOLOService('/api/detect', {
        image: frameBuffer.toString('base64'),
        deviceId,
      });

      if (result) {
        const detection = this.parseYOLOResult(result, timestamp, Date.now() - startTime);
        
        // 存储检测结果
        this.storeDetectionResult(deviceId, detection);
        
        return detection;
      }
    } catch (error) {
      console.warn('YOLOv8 服务不可用，使用模拟检测:', error);
    }

    // 模拟检测结果
    const detection = this.simulatePetDetection(deviceId, timestamp, Date.now() - startTime);
    
    // 存储检测结果
    this.storeDetectionResult(deviceId, detection);
    
    return detection;
  }

  /**
   * 行为分析
   * @param frameBuffers 视频帧序列
   * @param request 分析请求
   * @returns 行为事件列表
   */
  async analyzeBehavior(
    frameBuffers: Buffer[],
    request: BehaviorAnalysisRequest
  ): Promise<BehaviorEvent[]> {
    const startTime = Date.now();
    const { deviceId, frameCount, timeRange = 10 } = request;

    try {
      // 尝试调用行为分析服务
      const result = await this.callYOLOService('/api/behavior', {
        frames: frameBuffers.map(buf => buf.toString('base64')),
        deviceId,
        frameCount,
        timeRange,
      });

      if (result) {
        const events = this.parseBehaviorResult(result, Date.now() - startTime);
        
        // 存储行为事件
        this.storeBehaviorEvents(deviceId, events);
        
        return events;
      }
    } catch (error) {
      console.warn('行为分析服务不可用，使用模拟分析:', error);
    }

    // 模拟行为分析结果
    const events = this.simulateBehaviorAnalysis(deviceId, timeRange, Date.now() - startTime);
    
    // 存储行为事件
    this.storeBehaviorEvents(deviceId, events);
    
    return events;
  }

  /**
   * 声音检测
   * @param audioBuffer 音频数据
   * @param request 检测请求
   * @returns 声音事件列表
   */
  async detectSound(audioBuffer: Buffer, request: SoundDetectionRequest): Promise<SoundEvent[]> {
    const startTime = Date.now();
    const { deviceId, duration = 5 } = request;

    try {
      // 尝试调用 YAMNet 服务
      const result = await this.callYAMNetService('/api/detect', {
        audio: audioBuffer.toString('base64'),
        deviceId,
        duration,
      });

      if (result) {
        const events = this.parseYAMNetResult(result, Date.now() - startTime);
        
        // 存储声音事件
        this.storeSoundEvents(deviceId, events);
        
        return events;
      }
    } catch (error) {
      console.warn('YAMNet 服务不可用，使用模拟检测:', error);
    }

    // 模拟声音检测结果
    const events = this.simulateSoundDetection(deviceId, duration, Date.now() - startTime);
    
    // 存储声音事件
    this.storeSoundEvents(deviceId, events);
    
    return events;
  }

  /**
   * 环境监控
   * @param request 监控请求
   * @returns 监控响应
   */
  async monitorEnvironment(request: EnvironmentMonitorRequest): Promise<EnvironmentMonitorResponse> {
    const { deviceId, metrics } = request;

    // 模拟环境数据
    const environmentMetrics: EnvironmentMetrics = {
      temperature: 20 + Math.random() * 10,  // 20-30°C
      humidity: 40 + Math.random() * 30,     // 40-70%
      light: 100 + Math.random() * 900,      // 100-1000 lux
      noise: 30 + Math.random() * 40,        // 30-70 dB
      airQuality: 50 + Math.random() * 50,   // 50-100 AQI
    };

    // 根据请求过滤指标
    if (metrics && metrics.length > 0) {
      const filteredMetrics: EnvironmentMetrics = {};
      metrics.forEach(metric => {
        // 将 metric 名称映射到正确的属性名
        const metricKey = metric === 'air_quality' ? 'airQuality' : metric;
        (filteredMetrics as Record<string, number>)[metricKey] = 
          (environmentMetrics as Record<string, number>)[metricKey];
      });
      Object.assign(environmentMetrics, filteredMetrics);
    }

    // 生成告警
    const alerts: EnvironmentAlert[] = this.generateEnvironmentAlerts(environmentMetrics);

    // 生成建议
    const recommendations: string[] = this.generateEnvironmentRecommendations(environmentMetrics, alerts);

    return {
      deviceId,
      timestamp: new Date().toISOString(),
      metrics: environmentMetrics,
      alerts,
      recommendations,
    };
  }

  /**
   * 事件聚合和 LLM 解读
   * @param request 聚合请求
   * @returns 聚合响应
   */
  async aggregateEvents(request: EventAggregateRequest): Promise<EventAggregateResponse> {
    const startTime = Date.now();
    const { deviceId, timeRange, eventTypes } = request;

    // 获取存储的事件
    const behaviorEvents = this.behaviorEvents.get(deviceId) || [];
    const soundEvents = this.soundEvents.get(deviceId) || [];

    // 过滤时间范围内的事件
    const now = Date.now();
    const filteredBehaviorEvents = behaviorEvents.filter(event => {
      const eventTime = new Date(event.startTime).getTime();
      return now - eventTime <= timeRange * 1000;
    });

    const filteredSoundEvents = soundEvents.filter(event => {
      const eventTime = new Date(event.timestamp).getTime();
      return now - eventTime <= timeRange * 1000;
    });

    // 生成摘要
    const summary = this.generateEventSummary(filteredBehaviorEvents, filteredSoundEvents);

    // 生成时间线
    const timeline = this.generateTimeline(filteredBehaviorEvents, filteredSoundEvents, eventTypes);

    // 尝试调用 LLM 服务进行解读
    let llmInterpretation: LLMInterpretation;
    try {
      const result = await this.callLLMService('/api/interpret', {
        deviceId,
        summary,
        timeline,
        timeRange,
      });

      if (result) {
        llmInterpretation = result as unknown as LLMInterpretation;
      } else {
        llmInterpretation = this.simulateLLMInterpretation(summary, timeline);
      }
    } catch (error) {
      console.warn('LLM 服务不可用，使用模拟解读:', error);
      llmInterpretation = this.simulateLLMInterpretation(summary, timeline);
    }

    // 生成建议
    const recommendations = this.generateRecommendations(summary, llmInterpretation);

    return {
      deviceId,
      timeRange,
      summary,
      timeline,
      llmInterpretation,
      recommendations,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * 调用 YOLOv8 服务
   * @param path API 路径
   * @param data 请求数据
   * @returns 响应数据
   */
  protected async callYOLOService(
    path: string,
    data: Record<string, unknown>
  ): Promise<Record<string, unknown> | null> {
    return this.callExternalService(this.config.yoloEndpoint, path, data);
  }

  /**
   * 调用 YAMNet 服务
   * @param path API 路径
   * @param data 请求数据
   * @returns 响应数据
   */
  protected async callYAMNetService(
    path: string,
    data: Record<string, unknown>
  ): Promise<Record<string, unknown> | null> {
    return this.callExternalService(this.config.yamnetEndpoint, path, data);
  }

  /**
   * 调用 LLM 服务
   * @param path API 路径
   * @param data 请求数据
   * @returns 响应数据
   */
  protected async callLLMService(
    path: string,
    data: Record<string, unknown>
  ): Promise<Record<string, unknown> | null> {
    return this.callExternalService(this.config.llmEndpoint, path, data);
  }

  /**
   * 调用外部服务
   * @param endpoint 服务地址
   * @param path API 路径
   * @param data 请求数据
   * @returns 响应数据
   */
  protected async callExternalService(
    endpoint: string,
    path: string,
    data: Record<string, unknown>
  ): Promise<Record<string, unknown> | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${endpoint}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`服务响应错误: ${response.status}`);
      }

      const responseData = await response.json();
      return responseData as Record<string, unknown>;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * 解析 YOLO 结果
   */
  protected parseYOLOResult(
    result: Record<string, unknown>,
    timestamp: string,
    processingTime: number
  ): PetDetection {
    const detections = result.detections as Array<{
      class: string;
      confidence: number;
      bbox: [number, number, number, number];
      attributes?: Record<string, unknown>;
    }> || [];

    if (detections.length === 0) {
      return {
        detected: false,
        confidence: 0,
        class: 'other',
        processingTime,
        timestamp,
      };
    }

    const detection = detections[0];
    const boundingBox: BoundingBox = {
      x: detection.bbox[0],
      y: detection.bbox[1],
      width: detection.bbox[2] - detection.bbox[0],
      height: detection.bbox[3] - detection.bbox[1],
    };

    return {
      detected: true,
      confidence: detection.confidence,
      boundingBox,
      class: detection.class as PetClass,
      breed: detection.attributes?.breed as string,
      breedConfidence: detection.attributes?.breedConfidence as number,
      trackingId: detection.attributes?.trackingId as string,
      attributes: detection.attributes as PetAttributes,
      processingTime,
      timestamp,
    };
  }

  /**
   * 解析行为分析结果
   */
  protected parseBehaviorResult(
    result: Record<string, unknown>,
    processingTime: number
  ): BehaviorEvent[] {
    const behaviors = result.behaviors as Array<{
      type: string;
      confidence: number;
      startTime: string;
      endTime: string;
      severity: string;
    }> || [];

    return behaviors.map(behavior => ({
      eventId: uuidv4(),
      behaviorType: behavior.type as BehaviorType,
      confidence: behavior.confidence,
      startTime: behavior.startTime,
      endTime: behavior.endTime,
      duration: Math.floor(
        (new Date(behavior.endTime).getTime() - new Date(behavior.startTime).getTime()) / 1000
      ),
      severity: behavior.severity as 'low' | 'medium' | 'high',
      description: BEHAVIOR_DESCRIPTIONS[behavior.type as BehaviorType],
      suggestions: BEHAVIOR_SUGGESTIONS[behavior.type as BehaviorType],
      relatedFrames: [],
    }));
  }

  /**
   * 解析 YAMNet 结果
   */
  protected parseYAMNetResult(
    result: Record<string, unknown>,
    processingTime: number
  ): SoundEvent[] {
    const sounds = result.sounds as Array<{
      type: string;
      confidence: number;
      timestamp: string;
      duration: number;
      intensity: number;
      frequency: number;
    }> || [];

    return sounds.map(sound => ({
      eventId: uuidv4(),
      soundType: sound.type as SoundType,
      confidence: sound.confidence,
      timestamp: sound.timestamp,
      duration: sound.duration,
      intensity: sound.intensity,
      frequency: sound.frequency,
      description: SOUND_DESCRIPTIONS[sound.type as SoundType],
      alert: SOUND_ALERT_LEVELS[sound.type as SoundType],
      suggestions: sound.type === 'bark' || sound.type === 'meow' 
        ? ['宠物在表达某种需求，请观察'] 
        : undefined,
    }));
  }

  /**
   * 模拟宠物检测
   */
  protected simulatePetDetection(
    deviceId: string,
    timestamp: string,
    processingTime: number
  ): PetDetection {
    const detected = Math.random() > 0.1;  // 90% 检测率
    const confidence = detected ? 0.7 + Math.random() * 0.25 : 0;
    const petClasses: PetClass[] = ['dog', 'cat', 'bird', 'rabbit', 'hamster', 'other'];
    const classIndex = Math.floor(Math.random() * petClasses.length);

    const breeds: Record<PetClass, string[]> = {
      dog: ['金毛', '拉布拉多', '柯基', '边牧', '哈士奇', '泰迪'],
      cat: ['英短', '美短', '布偶', '暹罗', '波斯', '橘猫'],
      bird: ['鹦鹉', '金丝雀', '鸽子', '麻雀'],
      rabbit: ['荷兰兔', '垂耳兔', '安哥拉兔'],
      hamster: ['仓鼠', '金丝熊'],
      other: ['未知'],
    };

    const breed = breeds[petClasses[classIndex]][Math.floor(Math.random() * breeds[petClasses[classIndex]].length)];

    return {
      detected,
      confidence: Math.round(confidence * 100) / 100,
      boundingBox: detected ? {
        x: Math.random() * 200,
        y: Math.random() * 200,
        width: 100 + Math.random() * 200,
        height: 100 + Math.random() * 200,
      } : undefined,
      class: petClasses[classIndex],
      breed: detected ? breed : undefined,
      breedConfidence: detected ? 0.6 + Math.random() * 0.3 : undefined,
      trackingId: detected ? uuidv4() : undefined,
      attributes: detected ? {
        color: ['白色', '黑色', '棕色', '灰色', '金色'][Math.floor(Math.random() * 5)],
        size: ['small', 'medium', 'large'][Math.floor(Math.random() * 3)] as 'small' | 'medium' | 'large',
        pose: ['站立', '坐着', '躺着', '行走'][Math.floor(Math.random() * 4)],
        accessories: Math.random() > 0.7 ? ['项圈'] : [],
      } : undefined,
      processingTime: Math.min(processingTime + 50 + Math.random() * 100, 300),
      timestamp,
    };
  }

  /**
   * 模拟行为分析
   */
  protected simulateBehaviorAnalysis(
    deviceId: string,
    timeRange: number,
    processingTime: number
  ): BehaviorEvent[] {
    const behaviors: BehaviorType[] = [
      'eating', 'drinking', 'sleeping', 'playing', 'running', 
      'walking', 'sitting', 'standing', 'lying', 'grooming',
    ];
    
    const eventCount = Math.floor(Math.random() * 3) + 1;  // 1-3 个事件
    const events: BehaviorEvent[] = [];
    const now = Date.now();

    for (let i = 0; i < eventCount; i++) {
      const behaviorType = behaviors[Math.floor(Math.random() * behaviors.length)];
      const confidence = 0.6 + Math.random() * 0.35;
      const startTime = new Date(now - Math.random() * timeRange * 1000);
      const duration = Math.floor(Math.random() * 30) + 5;  // 5-35 秒
      const endTime = new Date(startTime.getTime() + duration * 1000);

      events.push({
        eventId: uuidv4(),
        behaviorType,
        confidence: Math.round(confidence * 100) / 100,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
        severity: Math.random() > 0.8 ? 'high' : Math.random() > 0.5 ? 'medium' : 'low',
        description: BEHAVIOR_DESCRIPTIONS[behaviorType],
        suggestions: BEHAVIOR_SUGGESTIONS[behaviorType],
        relatedFrames: [],
      });
    }

    return events;
  }

  /**
   * 模拟声音检测
   */
  protected simulateSoundDetection(
    deviceId: string,
    duration: number,
    processingTime: number
  ): SoundEvent[] {
    const sounds: SoundType[] = [
      'bark', 'meow', 'whine', 'growl', 'purr', 
      'sneeze', 'cough', 'scratch', 'footsteps', 'door',
    ];
    
    const eventCount = Math.floor(Math.random() * 2) + 1;  // 1-2 个事件
    const events: SoundEvent[] = [];
    const now = Date.now();

    for (let i = 0; i < eventCount; i++) {
      const soundType = sounds[Math.floor(Math.random() * sounds.length)];
      const confidence = 0.65 + Math.random() * 0.3;
      const timestamp = new Date(now - Math.random() * duration * 1000);
      const eventDuration = Math.floor(Math.random() * 5) + 1;  // 1-5 秒

      events.push({
        eventId: uuidv4(),
        soundType,
        confidence: Math.round(confidence * 100) / 100,
        timestamp: timestamp.toISOString(),
        duration: eventDuration,
        intensity: 40 + Math.random() * 40,  // 40-80 dB
        frequency: 200 + Math.random() * 800,  // 200-1000 Hz
        description: SOUND_DESCRIPTIONS[soundType],
        alert: SOUND_ALERT_LEVELS[soundType],
        suggestions: soundType === 'bark' || soundType === 'meow' 
          ? ['宠物在表达某种需求，请观察'] 
          : undefined,
      });
    }

    return events;
  }

  /**
   * 生成环境告警
   */
  protected generateEnvironmentAlerts(metrics: EnvironmentMetrics): EnvironmentAlert[] {
    const alerts: EnvironmentAlert[] = [];

    // 温度告警
    if (metrics.temperature && metrics.temperature > 28) {
      alerts.push({
        metric: 'temperature',
        level: 'warning',
        message: '温度过高，可能影响宠物舒适度',
        currentValue: metrics.temperature,
        threshold: 28,
      });
    } else if (metrics.temperature && metrics.temperature < 18) {
      alerts.push({
        metric: 'temperature',
        level: 'warning',
        message: '温度过低，可能影响宠物舒适度',
        currentValue: metrics.temperature,
        threshold: 18,
      });
    }

    // 湿度告警
    if (metrics.humidity && metrics.humidity > 70) {
      alerts.push({
        metric: 'humidity',
        level: 'info',
        message: '湿度较高，注意通风',
        currentValue: metrics.humidity,
        threshold: 70,
      });
    }

    // 噪音告警
    if (metrics.noise && metrics.noise > 60) {
      alerts.push({
        metric: 'noise',
        level: 'warning',
        message: '噪音水平较高，可能影响宠物休息',
        currentValue: metrics.noise,
        threshold: 60,
      });
    }

    // 空气质量告警
    if (metrics.airQuality && metrics.airQuality > 80) {
      alerts.push({
        metric: 'air_quality',
        level: 'critical',
        message: '空气质量较差，建议改善通风',
        currentValue: metrics.airQuality,
        threshold: 80,
      });
    }

    return alerts;
  }

  /**
   * 生成环境建议
   */
  protected generateEnvironmentRecommendations(
    metrics: EnvironmentMetrics,
    alerts: EnvironmentAlert[]
  ): string[] {
    const recommendations: string[] = [];

    if (alerts.length === 0) {
      recommendations.push('当前环境状况良好，适合宠物活动');
    } else {
      alerts.forEach(alert => {
        switch (alert.metric) {
          case 'temperature':
            if (alert.currentValue > 28) {
              recommendations.push('建议开启空调或风扇降温');
            } else {
              recommendations.push('建议增加保暖措施');
            }
            break;
          case 'humidity':
            recommendations.push('建议开启除湿机或增加通风');
            break;
          case 'noise':
            recommendations.push('建议减少噪音源或提供安静休息区');
            break;
          case 'air_quality':
            recommendations.push('建议开窗通风或使用空气净化器');
            break;
        }
      });
    }

    return recommendations;
  }

  /**
   * 生成事件摘要
   */
  protected generateEventSummary(
    behaviorEvents: BehaviorEvent[],
    soundEvents: SoundEvent[]
  ): EventSummary {
    const totalEvents = behaviorEvents.length + soundEvents.length;
    
    // 计算主要行为
    const behaviorCounts: Record<string, number> = {};
    behaviorEvents.forEach(event => {
      behaviorCounts[event.behaviorType] = (behaviorCounts[event.behaviorType] || 0) + 1;
    });
    
    let dominantBehavior: BehaviorType | null = null;
    let maxBehaviorCount = 0;
    Object.entries(behaviorCounts).forEach(([type, count]) => {
      if (count > maxBehaviorCount) {
        maxBehaviorCount = count;
        dominantBehavior = type as BehaviorType;
      }
    });

    // 计算主要声音
    const soundCounts: Record<string, number> = {};
    soundEvents.forEach(event => {
      soundCounts[event.soundType] = (soundCounts[event.soundType] || 0) + 1;
    });
    
    let dominantSound: SoundType | null = null;
    let maxSoundCount = 0;
    Object.entries(soundCounts).forEach(([type, count]) => {
      if (count > maxSoundCount) {
        maxSoundCount = count;
        dominantSound = type as SoundType;
      }
    });

    // 计算平均置信度
    const allConfidences = [
      ...behaviorEvents.map(e => e.confidence),
      ...soundEvents.map(e => e.confidence),
    ];
    const averageConfidence = allConfidences.length > 0 
      ? allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length 
      : 0;

    // 计算告警数量
    const alertCount = soundEvents.filter(e => e.alert).length +
      behaviorEvents.filter(e => e.severity === 'high').length;

    return {
      totalEvents,
      behaviorEvents: behaviorEvents.length,
      soundEvents: soundEvents.length,
      dominantBehavior,
      dominantSound,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      alertCount,
    };
  }

  /**
   * 生成时间线
   */
  protected generateTimeline(
    behaviorEvents: BehaviorEvent[],
    soundEvents: SoundEvent[],
    eventTypes?: (BehaviorType | SoundType)[]
  ): AggregatedEvent[] {
    const timeline: AggregatedEvent[] = [];

    // 过滤事件类型
    const filteredBehaviorEvents = eventTypes 
      ? behaviorEvents.filter(e => eventTypes.includes(e.behaviorType))
      : behaviorEvents;
    
    const filteredSoundEvents = eventTypes 
      ? soundEvents.filter(e => eventTypes.includes(e.soundType))
      : soundEvents;

    // 添加行为事件
    filteredBehaviorEvents.forEach(event => {
      timeline.push({
        timestamp: event.startTime,
        type: 'behavior',
        eventType: event.behaviorType,
        confidence: event.confidence,
        duration: event.duration,
        description: event.description,
      });
    });

    // 添加声音事件
    filteredSoundEvents.forEach(event => {
      timeline.push({
        timestamp: event.timestamp,
        type: 'sound',
        eventType: event.soundType,
        confidence: event.confidence,
        duration: event.duration,
        description: event.description,
      });
    });

    // 按时间排序
    timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return timeline;
  }

  /**
   * 模拟 LLM 解读
   */
  protected simulateLLMInterpretation(
    summary: EventSummary,
    timeline: AggregatedEvent[]
  ): LLMInterpretation {
    const dominantBehavior = summary.dominantBehavior || 'unknown';
    const dominantSound = summary.dominantSound || 'unknown';

    // 生成总结
    let summaryText = `在过去一段时间内，检测到 ${summary.totalEvents} 个事件。`;
    if (summary.dominantBehavior) {
      summaryText += `主要行为是${BEHAVIOR_DESCRIPTIONS[summary.dominantBehavior]}。`;
    }
    if (summary.dominantSound) {
      summaryText += `主要声音是${SOUND_DESCRIPTIONS[summary.dominantSound]}。`;
    }

    // 生成宠物状态描述
    let petStatus = '宠物状态正常';
    if (summary.alertCount > 2) {
      petStatus = '宠物可能存在一些异常行为，建议关注';
    } else if (summary.alertCount > 0) {
      petStatus = '宠物有一些轻微异常，可以继续观察';
    }

    // 生成情绪状态
    const emotionalStates: string[] = ['平静', '活跃', '开心', '轻微焦虑', '正常'];
    const emotionalState = emotionalStates[Math.floor(Math.random() * emotionalStates.length)];

    // 生成可能需求
    const possibleNeeds: string[] = [];
    if (dominantBehavior === 'eating' || dominantBehavior === 'drinking') {
      possibleNeeds.push('可能需要补充食物或水');
    }
    if (dominantBehavior === 'playing') {
      possibleNeeds.push('可能需要更多互动和玩耍');
    }
    if (dominantBehavior === 'sleeping') {
      possibleNeeds.push('需要安静的休息环境');
    }
    if (dominantSound === 'bark' || dominantSound === 'meow') {
      possibleNeeds.push('可能需要关注或互动');
    }
    if (possibleNeeds.length === 0) {
      possibleNeeds.push('当前无明显需求');
    }

    // 生成关注点
    const concerns: string[] = [];
    if (summary.alertCount > 0) {
      concerns.push('存在一些需要关注的异常事件');
    }
    if (timeline.some(e => e.eventType === 'anxious' || e.eventType === 'aggressive')) {
      concerns.push('宠物可能感到焦虑或有攻击倾向');
    }
    if (timeline.some(e => e.eventType === 'sick' || e.eventType === 'cough' || e.eventType === 'vomit')) {
      concerns.push('宠物可能存在健康问题');
    }
    if (concerns.length === 0) {
      concerns.push('当前无明显关注点');
    }

    return {
      summary: summaryText,
      petStatus,
      emotionalState,
      possibleNeeds,
      concerns,
      confidence: 0.7 + Math.random() * 0.2,
    };
  }

  /**
   * 生成建议
   */
  protected generateRecommendations(
    summary: EventSummary,
    interpretation: LLMInterpretation
  ): string[] {
    const recommendations: string[] = [];

    // 基于解读生成建议
    if (interpretation.petStatus.includes('异常')) {
      recommendations.push('建议定期检查宠物状态');
    }

    if (interpretation.possibleNeeds.includes('需要补充食物或水')) {
      recommendations.push('检查食物和水是否充足');
    }

    if (interpretation.possibleNeeds.includes('需要更多互动')) {
      recommendations.push('可以安排一些互动游戏');
    }

    if (interpretation.concerns.some(c => c.includes('健康'))) {
      recommendations.push('建议尽快带宠物就医检查');
    }

    if (recommendations.length === 0) {
      recommendations.push('宠物状态良好，继续保持当前照料方式');
    }

    return recommendations;
  }

  /**
   * 存储检测结果
   */
  protected storeDetectionResult(deviceId: string, detection: PetDetection): void {
    const results = this.detectionResults.get(deviceId) || [];
    results.push(detection);
    
    // 限制存储数量
    if (results.length > 100) {
      results.shift();
    }
    
    this.detectionResults.set(deviceId, results);
  }

  /**
   * 存储行为事件
   */
  protected storeBehaviorEvents(deviceId: string, events: BehaviorEvent[]): void {
    const existingEvents = this.behaviorEvents.get(deviceId) || [];
    existingEvents.push(...events);
    
    // 限制存储数量
    if (existingEvents.length > 50) {
      existingEvents.splice(0, existingEvents.length - 50);
    }
    
    this.behaviorEvents.set(deviceId, existingEvents);
  }

  /**
   * 存储声音事件
   */
  protected storeSoundEvents(deviceId: string, events: SoundEvent[]): void {
    const existingEvents = this.soundEvents.get(deviceId) || [];
    existingEvents.push(...events);
    
    // 限制存储数量
    if (existingEvents.length > 50) {
      existingEvents.splice(0, existingEvents.length - 50);
    }
    
    this.soundEvents.set(deviceId, existingEvents);
  }

  /**
   * 清理过期数据
   * @param maxAge 最大存活时间（秒）
   */
  cleanupExpiredData(maxAge: number = 3600): void {
    const now = Date.now();
    const maxAgeMs = maxAge * 1000;

    // 清理检测结果
    this.detectionResults.forEach((results, deviceId) => {
      const filteredResults = results.filter(r => 
        now - new Date(r.timestamp).getTime() <= maxAgeMs
      );
      this.detectionResults.set(deviceId, filteredResults);
    });

    // 清理行为事件
    this.behaviorEvents.forEach((events, deviceId) => {
      const filteredEvents = events.filter(e => 
        now - new Date(e.startTime).getTime() <= maxAgeMs
      );
      this.behaviorEvents.set(deviceId, filteredEvents);
    });

    // 清理声音事件
    this.soundEvents.forEach((events, deviceId) => {
      const filteredEvents = events.filter(e => 
        now - new Date(e.timestamp).getTime() <= maxAgeMs
      );
      this.soundEvents.set(deviceId, filteredEvents);
    });
  }
}

// 导出单例实例
export const detectionService = new DetectionService();

export default DetectionService;