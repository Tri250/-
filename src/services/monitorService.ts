import { PawSyncAudio } from '../plugins';
import type { LiveMonitoring, SmartEvent, RecordingSession, StreamConfig, EventType, EventSeverity } from '../types/monitor';

class MonitorService {
  private isMonitoring: boolean = false;
  private recordingSessions: RecordingSession[] = [];
  private eventCallbacks: Array<(event: SmartEvent) => void> = [];
  private audioLevelInterval: number | null = null;

  async startMonitoring(cameraId: string, config: StreamConfig): Promise<LiveMonitoring> {
    this.isMonitoring = true;

    if (config.motionDetection) {
      this.startAudioLevelMonitoring(cameraId);
    }

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
    this.isMonitoring = false;
    
    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
      this.audioLevelInterval = null;
    }

    return true;
  }

  async getMonitoringStatus(cameraId: string): Promise<LiveMonitoring> {
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
    return this.recordingSessions
      .filter(s => s.cameraId === cameraId)
      .slice(0, limit);
  }

  async getAllEvents(limit: number = 50): Promise<SmartEvent[]> {
    const eventTypes: EventType[] = ['behavior', 'emotion', 'environment'];
    const severities: EventSeverity[] = ['info', 'warning', 'critical'];

    const events: SmartEvent[] = [];
    for (let i = 0; i < limit; i++) {
      const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      events.push({
        id: `event-${Date.now()}-${i}`,
        type,
        severity: severities[Math.floor(Math.random() * severities.length)],
        description: this.getEventDescription(type),
        cameraId: `cam-00${(i % 3) + 1}`,
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        petId: '1',
        acknowledged: i > 5,
      });
    }
    
    return events;
  }

  async simulateEvent(type: EventType, severity: EventSeverity, description: string) {
    await this.triggerEvent(type, severity, description);
  }

  async acknowledgeEvent(eventId: string): Promise<boolean> {
    return true;
  }

  async updateStreamConfig(cameraId: string, config: Partial<StreamConfig>): Promise<boolean> {
    console.log(`Updated stream config for ${cameraId}:`, config);
    
    if (config.motionDetection !== undefined) {
      if (config.motionDetection) {
        this.startAudioLevelMonitoring(cameraId);
      } else if (this.audioLevelInterval) {
        clearInterval(this.audioLevelInterval);
        this.audioLevelInterval = null;
      }
    }

    return true;
  }

  onEventDetection(callback: (event: SmartEvent) => void) {
    this.eventCallbacks.push(callback);
  }

  async triggerEvent(type: EventType, severity: EventSeverity, description: string) {
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

  private async startAudioLevelMonitoring(cameraId: string) {
    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
    }

    this.audioLevelInterval = window.setInterval(async () => {
      if (!this.isMonitoring) return;

      try {
        const result = await PawSyncAudio.getAudioLevel();
        const level = result.level ?? 0;
        
        if (level > 70) {
          this.triggerEvent('behavior', 'warning', `检测到高音频电平: ${level}dB`);
        }
      } catch (error) {
        console.warn('Failed to get audio level:', error);
      }
    }, 2000);
  }

  private getEventDescription(type: EventType): string {
    const descriptions: Record<EventType, string[]> = {
      behavior: [
        '检测到异常行为：快速移动',
        '宠物正在睡觉',
        '检测到剧烈运动',
        '长时间静止不动',
      ],
      emotion: [
        '情绪变化：从平静转为兴奋',
        '情绪波动较大',
        '持续发出叫声',
        '情绪稳定良好',
      ],
      environment: [
        '检测到异常声音',
        '光线变暗',
        '温度异常',
        '环境安全',
      ],
    };

    const options = descriptions[type];
    return options[Math.floor(Math.random() * options.length)];
  }
}

export const monitorService = new MonitorService();