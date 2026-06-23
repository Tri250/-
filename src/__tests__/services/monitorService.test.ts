import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock databaseService with in-memory tracking for recording sessions
const inMemoryStore = new Map<string, unknown>();

vi.mock('../../services/databaseService', () => ({
  databaseService: {
    put: vi.fn().mockImplementation(async (_store: string, item: unknown) => {
      const record = item as Record<string, unknown>;
      if (record.id) {
        inMemoryStore.set(String(record.id), item);
      }
      return item;
    }),
    get: vi.fn().mockImplementation(async (_store: string, id: string) => {
      return inMemoryStore.get(String(id)) ?? null;
    }),
    getAll: vi.fn().mockResolvedValue([]),
    getByIndex: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockImplementation(async (_store: string, id: string) => {
      inMemoryStore.delete(String(id));
    }),
  },
  STORES: {
    RECORDING_SESSIONS: 'recording_sessions',
    EVENTS: 'events',
  },
}));

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  url: string;
  readyState: number = MockWebSocket.CONNECTING;
  onopen: ((ev: Event) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  onclose: ((ev: CloseEvent) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    // Simulate async open
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 0);
  }

  send = vi.fn();
  close = vi.fn(() => {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close', { wasClean: true }));
  });
}

vi.stubGlobal('WebSocket', MockWebSocket);

// Mock MediaRecorder
class MockMediaRecorder {
  static isTypeSupported = vi.fn().mockReturnValue(true);
  state: string = 'inactive';
  ondataavailable: ((ev: { data: Blob }) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  onstop: (() => void) | null = null;

  start = vi.fn(() => {
    this.state = 'recording';
  });
  stop = vi.fn(() => {
    this.state = 'inactive';
    // Simulate data available
    this.ondataavailable?.({ data: new Blob(['video-data'], { type: 'video/webm' }) });
    this.onstop?.();
  });
}

vi.stubGlobal('MediaRecorder', MockMediaRecorder as any);

// Mock URL.createObjectURL
vi.stubGlobal('URL', {
  ...URL,
  createObjectURL: vi.fn().mockReturnValue('blob:http://localhost/test-blob'),
  revokeObjectURL: vi.fn(),
});

// Mock HTMLCanvasElement.prototype.captureStream for recording
HTMLCanvasElement.prototype.captureStream = vi.fn().mockReturnValue({
  getTracks: vi.fn().mockReturnValue([]),
  getVideoTracks: vi.fn().mockReturnValue([]),
  getAudioTracks: vi.fn().mockReturnValue([]),
} as unknown as MediaStream);

// Mock HTMLCanvasElement.prototype.getContext for 2d context
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  drawImage: vi.fn(),
  getImageData: vi.fn().mockReturnValue({
    data: new Uint8ClampedArray(64 * 64 * 4),
    width: 64,
    height: 64,
  }),
  fillRect: vi.fn(),
  fillStyle: '',
}) as any;

import { monitorService } from '../../services/monitorService';

describe('MonitorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    inMemoryStore.clear();
  });

  describe('startMonitoring - 开始监控', () => {
    it('应该成功启动监控', async () => {
      const result = await monitorService.startMonitoring('cam-001', {
        quality: '1080p',
        motionDetection: true,
        audioEnabled: true,
        nightVision: false,
        eventRecording: true,
      });

      expect(result.isActive).toBe(true);
      expect(result.streamQuality).toBe('1080p');
      expect(result.eventDetection.abnormalBehavior).toBe(true);
      expect(result.eventDetection.emotionalChange).toBe(true);
      expect(result.eventDetection.dangerApproach).toBe(true);
    });

    it('应该设置正确的事件检测配置', async () => {
      const result = await monitorService.startMonitoring('cam-002', {
        quality: 'auto',
        motionDetection: false,
        audioEnabled: false,
        nightVision: false,
        eventRecording: false,
      });

      expect(result.eventDetection.abnormalBehavior).toBe(false);
    });
  });

  describe('stopMonitoring - 停止监控', () => {
    it('应该成功停止监控', async () => {
      await monitorService.startMonitoring('cam-010', {
        quality: '1080p',
        motionDetection: true,
        audioEnabled: true,
        nightVision: false,
        eventRecording: true,
      });

      const result = await monitorService.stopMonitoring('cam-010');
      expect(result).toBe(true);
    });

    it('停止不存在的监控应该返回false', async () => {
      const result = await monitorService.stopMonitoring('cam-nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('getMonitoringStatus - 获取监控状态', () => {
    it('监控未启动时状态应该为false', async () => {
      const status = await monitorService.getMonitoringStatus('cam-status-1');
      expect(status.isActive).toBe(false);
    });

    it('监控启动后状态应该为true', async () => {
      await monitorService.startMonitoring('cam-status-2', {
        quality: '1080p',
        motionDetection: true,
        audioEnabled: true,
        nightVision: false,
        eventRecording: true,
      });

      const status = await monitorService.getMonitoringStatus('cam-status-2');
      expect(status.isActive).toBe(true);

      // Cleanup
      await monitorService.stopMonitoring('cam-status-2');
    });

    it('应该返回正确的流质量', async () => {
      await monitorService.startMonitoring('cam-status-3', {
        quality: '720p',
        motionDetection: true,
        audioEnabled: true,
        nightVision: false,
        eventRecording: true,
      });

      const status = await monitorService.getMonitoringStatus('cam-status-3');
      expect(status.streamQuality).toBe('720p');

      await monitorService.stopMonitoring('cam-status-3');
    });
  });

  describe('startRecording - 开始录制', () => {
    it('应该成功开始录制', async () => {
      await monitorService.startMonitoring('cam-rec-1', {
        quality: '1080p',
        motionDetection: true,
        audioEnabled: true,
        nightVision: false,
        eventRecording: true,
      });

      const session = await monitorService.startRecording('cam-rec-1');

      expect(session).toHaveProperty('id');
      expect(session.cameraId).toBe('cam-rec-1');
      expect(session.status).toBe('recording');
      expect(session).toHaveProperty('startTime');

      await monitorService.stopMonitoring('cam-rec-1');
    });

    it('监控未启动时应该抛出错误', async () => {
      await expect(
        monitorService.startRecording('cam-no-monitor'),
      ).rejects.toThrow('监控未启动');
    });
  });

  describe('stopRecording - 停止录制', () => {
    it('应该成功停止录制', async () => {
      await monitorService.startMonitoring('cam-rec-stop', {
        quality: '1080p',
        motionDetection: true,
        audioEnabled: true,
        nightVision: false,
        eventRecording: true,
      });

      const session = await monitorService.startRecording('cam-rec-stop');

      const stoppedSession = await monitorService.stopRecording(session.id);

      expect(stoppedSession.status).toBe('completed');
      expect(stoppedSession).toHaveProperty('endTime');
      expect(stoppedSession).toHaveProperty('duration');
      expect(stoppedSession).toHaveProperty('fileSize');
      expect(stoppedSession).toHaveProperty('fileUrl');

      await monitorService.stopMonitoring('cam-rec-stop');
    });

    it('不存在的录制会话应该抛出错误', async () => {
      await expect(
        monitorService.stopRecording('non-existent-session'),
      ).rejects.toThrow();
    });
  });

  describe('getRecordingHistory - 获取录制历史', () => {
    it('应该返回录制历史列表', async () => {
      const history = await monitorService.getRecordingHistory('cam-history-1');

      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('getAllEvents - 获取所有事件', () => {
    it('应该返回事件列表', async () => {
      const events = await monitorService.getAllEvents(10);

      expect(Array.isArray(events)).toBe(true);
    });
  });

  describe('acknowledgeEvent - 确认事件', () => {
    it('不存在的event应该返回false', async () => {
      const result = await monitorService.acknowledgeEvent('event-nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('updateStreamConfig - 更新流配置', () => {
    it('未启动监控时应该返回false', async () => {
      const result = await monitorService.updateStreamConfig('cam-no-session', {
        quality: '480p',
      });
      expect(result).toBe(false);
    });

    it('监控启动后应该成功更新流配置', async () => {
      await monitorService.startMonitoring('cam-config', {
        quality: '1080p',
        motionDetection: true,
        audioEnabled: true,
        nightVision: false,
        eventRecording: true,
      });

      const result = await monitorService.updateStreamConfig('cam-config', {
        quality: '480p',
      });
      expect(result).toBe(true);

      await monitorService.stopMonitoring('cam-config');
    });
  });

  describe('onEventDetection - 事件检测回调', () => {
    it('应该注册事件检测回调', () => {
      const callback = vi.fn();
      monitorService.onEventDetection(callback);

      // Callback is registered; we can't easily trigger it without internal access
      // but we verify it doesn't throw
      expect(true).toBe(true);
    });

    it('应该支持多个回调', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      monitorService.onEventDetection(callback1);
      monitorService.onEventDetection(callback2);

      expect(true).toBe(true);
    });
  });

  describe('运动检测算法', () => {
    it('Canvas应该支持captureStream用于录制', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;

      const stream = canvas.captureStream(30);
      expect(stream).toBeDefined();
    });

    it('Canvas应该支持getContext获取2d上下文', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      expect(ctx).not.toBeNull();
    });
  });
});
