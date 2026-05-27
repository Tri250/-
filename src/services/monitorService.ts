import type { LiveMonitoring, SmartEvent, RecordingSession, StreamConfig, EventType, EventSeverity } from '../types/monitor';

const MOCK_DELAY = 500;

class MonitorService {
  private isMonitoring: boolean = false;
  private recordingSessions: RecordingSession[] = [];
  private eventCallbacks: Array<(event: SmartEvent) => void> = [];

  async startMonitoring(cameraId: string, config: StreamConfig): Promise<LiveMonitoring> {
    await this.simulateDelay(MOCK_DELAY);
    this.isMonitoring = true;

    return {
      isActive: true,
      streamQuality: config.quality,
      isRecording: false,
      eventDetection: {
        abnormalBehavior: config.motionDetection,
        emotionalChange: true,
        dangerApproach: true,
      },
    };
  }

  async stopMonitoring(cameraId: string): Promise<boolean> {
    await this.simulateDelay(MOCK_DELAY);
    this.isMonitoring = false;
    return true;
  }

  async getMonitoringStatus(cameraId: string): Promise<LiveMonitoring> {
    await this.simulateDelay(200);
    
    return {
      isActive: this.isMonitoring,
      streamQuality: 'auto',
      isRecording: this.recordingSessions.some(s => s.cameraId === cameraId && s.status === 'recording'),
      eventDetection: {
        abnormalBehavior: true,
        emotionalChange: true,
        dangerApproach: true,
      },
    };
  }

  async startRecording(cameraId: string): Promise<RecordingSession> {
    await this.simulateDelay(MOCK_DELAY);

    const session: RecordingSession = {
      id: `rec-${Date.now()}`,
      cameraId,
      startTime: new Date().toISOString(),
      status: 'recording',
    };

    this.recordingSessions.push(session);
    return session;
  }

  async stopRecording(sessionId: string): Promise<RecordingSession> {
    await this.simulateDelay(MOCK_DELAY);
    
    const session = this.recordingSessions.find(s => s.id === sessionId);
    if (session) {
      session.status = 'completed';
      session.endTime = new Date().toISOString();
      session.duration = Math.floor((Date.now() - new Date(session.startTime).getTime()) / 1000);
      session.fileSize = Math.floor(Math.random() * 100000000);
      session.fileUrl = `https://example.com/recordings/${sessionId}.mp4`;
    }
    
    return session!;
  }

  async getRecordingHistory(cameraId: string, limit: number = 20): Promise<RecordingSession[]> {
    await this.simulateDelay(400);
    
    return this.recordingSessions
      .filter(s => s.cameraId === cameraId)
      .slice(0, limit);
  }

  async getAllEvents(limit: number = 50): Promise<SmartEvent[]> {
    await this.simulateDelay(300);
    
    const eventTypes: EventType[] = ['behavior', 'emotion', 'environment'];
    const severities: EventSeverity[] = ['info', 'warning', 'critical'];

    const mockEvents: SmartEvent[] = [];
    for (let i = 0; i < limit; i++) {
      const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      mockEvents.push({
        id: `event-${i}`,
        type,
        severity: severities[Math.floor(Math.random() * severities.length)],
        description: this.getEventDescription(type),
        cameraId: `cam-00${(i % 3) + 1}`,
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        petId: '1',
        acknowledged: i > 5,
      });
    }
    
    return mockEvents;
  }

  async acknowledgeEvent(eventId: string): Promise<boolean> {
    await this.simulateDelay(200);
    return true;
  }

  async updateStreamConfig(cameraId: string, config: Partial<StreamConfig>): Promise<boolean> {
    await this.simulateDelay(300);
    console.log(`Updated stream config for ${cameraId}:`, config);
    return true;
  }

  onEventDetection(callback: (event: SmartEvent) => void) {
    this.eventCallbacks.push(callback);
  }

  async simulateEvent(type: EventType, severity: EventSeverity, description: string) {
    const event: SmartEvent = {
      id: `event-${Date.now()}`,
      type,
      severity,
      description,
      cameraId: 'cam-001',
      timestamp: new Date().toISOString(),
      petId: '1',
      acknowledged: false,
    };

    this.eventCallbacks.forEach(cb => cb(event));
  }

  private getEventDescription(type: EventType): string {
    const descriptions: Record<EventType, string[]> = {
      behavior: [
        '检测到异常行为：快速移动，可能是受到惊吓',
        '宠物正在安静睡觉，呼吸平稳',
        '检测到剧烈运动，消耗大量能量',
        '长时间静止不动，建议观察',
        '宠物频繁抓挠，可能皮肤不适',
        '异常舔舐行为，需关注',
        '食欲下降，建议检查饮食',
        '活动量明显减少',
        '开始进食，状态正常',
        '在猫砂盆停留时间过长',
        '跳跃高度异常，可能有关节问题',
        '频繁进出猫砂盆，可能泌尿系统问题',
      ],
      emotion: [
        '情绪变化：从平静转为兴奋',
        '情绪波动较大，建议安抚',
        '持续发出叫声，可能有需求',
        '情绪稳定良好，状态正常',
        '表现出焦虑行为，建议陪伴',
        '发出呼噜声，表示放松',
        '尾巴摇摆频率变化',
        '耳朵位置变化，表示警觉',
        '瞳孔放大，可能兴奋或恐惧',
        '身体姿态放松，状态良好',
      ],
      environment: [
        '检测到异常声音，建议查看',
        '光线变暗，自动开启夜视模式',
        '温度异常，建议调节室温',
        '环境安全，一切正常',
        '检测到陌生人接近',
        '检测到其他动物',
        '空气质量变化',
        '检测到烟雾或异味',
        '门窗被打开',
        '检测到异常震动',
        '摄像头被遮挡',
        '网络连接不稳定',
      ],
    };

    const options = descriptions[type];
    return options[Math.floor(Math.random() * options.length)];
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const monitorService = new MonitorService();
