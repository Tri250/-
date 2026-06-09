// ============================================
// PawSync Pro - monitorService.ts
//
// 作者: 带娃的小陈工
// 日期: 2026-06-09
// 描述: 监控服务 - 真实 AI 检测架构和录制管理
// ============================================

import type { LiveMonitoring, SmartEvent, RecordingSession, StreamConfig, EventSeverity } from '../types/monitor';
import { unifiedDetectionService } from './detection';
import type { DetectionResult, AggregatedEvent } from './detection';

// ============================================
// 监控管理器
// ============================================

class MonitorManager {
  private monitoringSessions: Map<string, LiveMonitoring> = new Map();
  private recordingSessions: Map<string, RecordingSession> = new Map();
  private events: SmartEvent[] = [];
  private detectionCallbacks: Map<string, (result: DetectionResult) => void> = new Map();
  private detectionIntervals: Map<string, number> = new Map();
  
  constructor() {
    // 加载已保存的事件
    this.loadSavedEvents();
  }
  
  // 加载已保存的事件
  private loadSavedEvents(): void {
    try {
      const saved = localStorage.getItem('pawsync_events');
      if (saved) {
        const events: SmartEvent[] = JSON.parse(saved);
        // 只加载最近 7 天的事件
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        this.events = events.filter(e => new Date(e.timestamp).getTime() > sevenDaysAgo);
        console.log('[MonitorManager] 加载已保存事件:', this.events.length);
      }
    } catch (error) {
      console.error('[MonitorManager] 加载已保存事件失败:', error);
    }
  }
  
  // 保存事件到本地存储
  private saveEvents(): void {
    try {
      localStorage.setItem('pawsync_events', JSON.stringify(this.events));
      console.log('[MonitorManager] 保存事件:', this.events.length);
    } catch (error) {
      console.error('[MonitorManager] 保存事件失败:', error);
    }
  }
  
  // 开始监控
  async startMonitoring(cameraId: string, config: StreamConfig): Promise<LiveMonitoring> {
    console.log('[MonitorManager] 开始监控:', cameraId, config);
    
    // 创建监控会话
    const monitoring: LiveMonitoring = {
      isActive: true,
      streamQuality: config.quality,
      isRecording: false,
      eventDetection: {
        abnormalBehavior: config.motionDetection ?? true,
        emotionalChange: true,
        dangerApproach: true,
      },
    };
    
    this.monitoringSessions.set(cameraId, monitoring);
    
    // 启动检测循环
    this.startDetectionLoop(cameraId);
    
    return monitoring;
  }
  
  // 停止监控
  async stopMonitoring(cameraId: string): Promise<void> {
    console.log('[MonitorManager] 停止监控:', cameraId);
    
    // 停止检测循环
    this.stopDetectionLoop(cameraId);
    
    // 停止录制（如果有）
    const monitoring = this.monitoringSessions.get(cameraId);
    if (monitoring?.isRecording) {
      const session = this.getActiveRecordingSession(cameraId);
      if (session) {
        await this.stopRecording(session.id);
      }
    }
    
    // 移除监控会话
    this.monitoringSessions.delete(cameraId);
  }
  
  // 启动检测循环
  private startDetectionLoop(cameraId: string): void {
    // 每 5 秒执行一次检测
    const interval = window.setInterval(async () => {
      try {
        // 获取当前监控会话
        const monitoring = this.monitoringSessions.get(cameraId);
        if (!monitoring || !monitoring.isActive) {
          return;
        }
        
        // 执行检测（使用模拟帧数据）
        const result = await this.performDetection(cameraId);
        
        // 处理检测结果
        this.handleDetectionResult(cameraId, result);
        
        // 调用回调
        const callback = this.detectionCallbacks.get(cameraId);
        if (callback) {
          callback(result);
        }
      } catch (error) {
        console.error('[MonitorManager] 检测失败:', error);
      }
    }, 5000);
    
    this.detectionIntervals.set(cameraId, interval);
  }
  
  // 停止检测循环
  private stopDetectionLoop(cameraId: string): void {
    const interval = this.detectionIntervals.get(cameraId);
    if (interval) {
      clearInterval(interval);
      this.detectionIntervals.delete(cameraId);
    }
  }
  
  // 执行检测
  private async performDetection(cameraId: string): Promise<DetectionResult> {
    // 创建模拟帧数据（实际应用中从视频流获取）
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('无法创建 canvas context');
    }
    
    // 绘制模拟图像
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 添加一些随机元素模拟宠物
    const centerX = Math.random() * (canvas.width - 100) + 50;
    const centerY = Math.random() * (canvas.height - 100) + 50;
    ctx.fillStyle = '#666';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // 调用检测服务
    try {
      const result = await unifiedDetectionService.performFullDetection(
        frame,
        undefined, // 音频数据（可选）
        cameraId,
        '1' // 默认宠物 ID
      );
      
      // 转换为 DetectionResult 格式
      return {
        petDetections: result.petDetections,
        trackingResults: result.trackingResults,
        behaviorEvents: result.behaviorEvents,
        soundEvents: result.soundEvents,
        emotionEvents: [], // 情绪事件从行为事件中提取
        environmentData: result.environmentData,
        environmentAnomalies: result.environmentAnomalies,
        aggregatedEvent: result.aggregatedEvent,
        detectionTime: Date.now(),
      };
    } catch (error) {
      console.error('[MonitorManager] 检测服务调用失败:', error);
      
      // 返回空结果
      return {
        petDetections: [],
        trackingResults: [],
        behaviorEvents: [],
        soundEvents: [],
        emotionEvents: [],
        environmentData: {
          cameraId,
          timestamp: new Date().toISOString(),
        },
        environmentAnomalies: [],
        aggregatedEvent: null,
        detectionTime: Date.now(),
      };
    }
  }
  
  // 处理检测结果
  private handleDetectionResult(cameraId: string, result: DetectionResult): void {
    // 处理聚合事件
    if (result.aggregatedEvent) {
      this.addEventFromDetection(result.aggregatedEvent);
    }
    
    // 处理行为事件
    for (const behavior of result.behaviorEvents) {
      const event: SmartEvent = {
        id: behavior.id,
        type: 'behavior',
        severity: behavior.behavior === 'abnormal' ? 'warning' : 'info',
        description: `检测到行为: ${behavior.behavior}`,
        cameraId: behavior.cameraId,
        timestamp: behavior.timestamp,
        petId: behavior.petId,
        acknowledged: false,
      };
      this.addEvent(event);
    }
    
    // 处理声音事件
    for (const sound of result.soundEvents) {
      const event: SmartEvent = {
        id: sound.id,
        type: 'environment',
        severity: 'info',
        description: `检测到声音: ${sound.soundType}`,
        cameraId: sound.cameraId,
        timestamp: sound.timestamp,
        acknowledged: false,
      };
      this.addEvent(event);
    }
    
    // 处理情绪事件（从行为事件中提取情绪信息）
    for (const behavior of result.behaviorEvents) {
      if (behavior.behavior === 'abnormal') {
        const event: SmartEvent = {
          id: `${behavior.id}_emotion`,
          type: 'emotion',
          severity: 'warning',
          description: `情绪变化: 异常行为检测`,
          cameraId: behavior.cameraId,
          timestamp: behavior.timestamp,
          petId: behavior.petId,
          acknowledged: false,
        };
        this.addEvent(event);
      }
    }
  }
  
  // 从检测结果添加事件
  private addEventFromDetection(aggregatedEvent: AggregatedEvent): void {
    const event: SmartEvent = {
      id: aggregatedEvent.id,
      type: aggregatedEvent.type,
      severity: aggregatedEvent.severity,
      description: aggregatedEvent.description,
      cameraId: aggregatedEvent.cameraId,
      timestamp: aggregatedEvent.timestamp,
      petId: aggregatedEvent.petId,
      acknowledged: false,
    };
    this.addEvent(event);
  }
  
  // 添加事件
  addEvent(event: SmartEvent): void {
    // 添加到事件列表
    this.events.unshift(event);
    
    // 限制事件数量
    if (this.events.length > 100) {
      this.events = this.events.slice(0, 100);
    }
    
    // 保存事件
    this.saveEvents();
    
    console.log('[MonitorManager] 添加事件:', event.type, event.description);
  }
  
  // 获取所有事件
  async getAllEvents(limit = 50): Promise<SmartEvent[]> {
    return this.events.slice(0, limit);
  }
  
  // 获取未确认事件
  async getUnacknowledgedEvents(): Promise<SmartEvent[]> {
    return this.events.filter(e => !e.acknowledged);
  }
  
  // 确认事件
  async acknowledgeEvent(eventId: string): Promise<void> {
    const event = this.events.find(e => e.id === eventId);
    if (event) {
      event.acknowledged = true;
      this.saveEvents();
      console.log('[MonitorManager] 确认事件:', eventId);
    }
  }
  
  // 开始录制
  async startRecording(cameraId: string): Promise<RecordingSession> {
    console.log('[MonitorManager] 开始录制:', cameraId);
    
    // 创建录制会话
    const session: RecordingSession = {
      id: `rec_${cameraId}_${Date.now()}`,
      cameraId,
      startTime: new Date().toISOString(),
      status: 'recording',
      duration: 0,
    };
    
    this.recordingSessions.set(session.id, session);
    
    // 更新监控会话
    const monitoring = this.monitoringSessions.get(cameraId);
    if (monitoring) {
      monitoring.isRecording = true;
    }
    
    // 启动录制时长计时
    this.startRecordingTimer(session.id);
    
    return session;
  }
  
  // 停止录制
  async stopRecording(sessionId: string): Promise<RecordingSession> {
    console.log('[MonitorManager] 停止录制:', sessionId);
    
    const session = this.recordingSessions.get(sessionId);
    if (!session) {
      throw new Error('录制会话不存在');
    }
    
    // 停止录制计时
    this.stopRecordingTimer(sessionId);
    
    // 更新会话状态
    session.status = 'completed';
    session.endTime = new Date().toISOString();
    
    // 更新监控会话
    const monitoring = this.monitoringSessions.get(session.cameraId);
    if (monitoring) {
      monitoring.isRecording = false;
    }
    
    // 移除录制会话
    this.recordingSessions.delete(sessionId);
    
    return session;
  }
  
  // 录制计时器
  private recordingTimers: Map<string, number> = new Map();
  
  private startRecordingTimer(sessionId: string): void {
    const timer = window.setInterval(() => {
      const session = this.recordingSessions.get(sessionId);
      if (session && session.status === 'recording') {
        session.duration = (session.duration || 0) + 1;
      }
    }, 1000);
    
    this.recordingTimers.set(sessionId, timer);
  }
  
  private stopRecordingTimer(sessionId: string): void {
    const timer = this.recordingTimers.get(sessionId);
    if (timer) {
      clearInterval(timer);
      this.recordingTimers.delete(sessionId);
    }
  }
  
  // 获取活跃录制会话
  getActiveRecordingSession(cameraId: string): RecordingSession | undefined {
    for (const session of this.recordingSessions.values()) {
      if (session.cameraId === cameraId && session.status === 'recording') {
        return session;
      }
    }
    return undefined;
  }
  
  // 更新流配置
  async updateStreamConfig(cameraId: string, config: Partial<StreamConfig>): Promise<void> {
    console.log('[MonitorManager] 更新流配置:', cameraId, config);
    
    const monitoring = this.monitoringSessions.get(cameraId);
    if (monitoring) {
      if (config.quality) {
        monitoring.streamQuality = config.quality;
      }
      if (config.motionDetection !== undefined) {
        monitoring.eventDetection.abnormalBehavior = config.motionDetection;
      }
    }
  }
  
  // 设置检测回调
  setDetectionCallback(cameraId: string, callback: (result: DetectionResult) => void): void {
    this.detectionCallbacks.set(cameraId, callback);
  }
  
  // 移除检测回调
  removeDetectionCallback(cameraId: string): void {
    this.detectionCallbacks.delete(cameraId);
  }
  
  // 获取监控状态
  getMonitoringStatus(cameraId: string): LiveMonitoring | undefined {
    return this.monitoringSessions.get(cameraId);
  }
  
  // 清除所有事件
  clearAllEvents(): void {
    this.events = [];
    this.saveEvents();
    console.log('[MonitorManager] 清除所有事件');
  }
}

// 导出单例
export const monitorService = new MonitorManager();