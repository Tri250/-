import { create } from 'zustand';
import type { LiveMonitoring, SmartEvent, RecordingSession, StreamConfig } from '../types/monitor';
import { monitorService } from '../services/monitorService';

// 初始示例事件数据
const initialEvents: SmartEvent[] = [
  {
    id: 'event-1',
    type: 'behavior',
    severity: 'info',
    description: '宠物正在安静休息，呼吸平稳',
    cameraId: 'cam-001',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    petId: '1',
    acknowledged: false,
  },
  {
    id: 'event-2',
    type: 'emotion',
    severity: 'info',
    description: '检测到宠物心情愉快，正在玩耍',
    cameraId: 'cam-001',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    petId: '1',
    acknowledged: true,
  },
  {
    id: 'event-3',
    type: 'environment',
    severity: 'warning',
    description: '检测到环境光线较暗，已自动调节夜视模式',
    cameraId: 'cam-001',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    petId: '1',
    acknowledged: true,
  },
  {
    id: 'event-4',
    type: 'behavior',
    severity: 'info',
    description: '宠物进食完毕，状态良好',
    cameraId: 'cam-001',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    petId: '1',
    acknowledged: true,
  },
];

interface MonitorState {
  isMonitoring: boolean;
  monitoring: LiveMonitoring | null;
  events: SmartEvent[];
  recordingSession: RecordingSession | null;
  recordingDuration: number;
  isLoading: boolean;
  error: string | null;

  startMonitoring: (cameraId: string, config: StreamConfig) => Promise<void>;
  stopMonitoring: (cameraId: string) => Promise<void>;
  loadEvents: (limit?: number) => Promise<void>;
  acknowledgeEvent: (eventId: string) => Promise<void>;
  startRecording: (cameraId: string) => Promise<void>;
  stopRecording: () => Promise<void>;
  updateStreamConfig: (cameraId: string, config: Partial<StreamConfig>) => Promise<void>;
  incrementRecordingDuration: () => void;
}

export const useMonitorStore = create<MonitorState>((set, get) => ({
  isMonitoring: false,
  monitoring: null,
  events: initialEvents,
  recordingSession: null,
  recordingDuration: 0,
  isLoading: false,
  error: null,

  startMonitoring: async (cameraId, config) => {
    set({ isLoading: true, error: null });
    try {
      const monitoring = await monitorService.startMonitoring(cameraId, config);
      set({ monitoring, isMonitoring: true, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to start monitoring', isLoading: false });
    }
  },

  stopMonitoring: async (cameraId) => {
    try {
      await monitorService.stopMonitoring(cameraId);
      set({ isMonitoring: false, monitoring: null });
    } catch (error) {
      set({ error: 'Failed to stop monitoring' });
    }
  },

  loadEvents: async (limit = 50) => {
    try {
      const events = await monitorService.getAllEvents(limit);
      set({ events });
    } catch (error) {
      set({ error: 'Failed to load events' });
    }
  },

  acknowledgeEvent: async (eventId) => {
    try {
      await monitorService.acknowledgeEvent(eventId);
      set((state) => ({
        events: state.events.map(e =>
          e.id === eventId ? { ...e, acknowledged: true } : e
        ),
      }));
    } catch (error) {
      set({ error: 'Failed to acknowledge event' });
    }
  },

  startRecording: async (cameraId) => {
    try {
      const session = await monitorService.startRecording(cameraId);
      set({ recordingSession: session, recordingDuration: 0 });
    } catch (error) {
      set({ error: 'Failed to start recording' });
    }
  },

  stopRecording: async () => {
    const { recordingSession } = get();
    if (!recordingSession) return;

    try {
      const session = await monitorService.stopRecording(recordingSession.id);
      set({ recordingSession: session });
    } catch (error) {
      set({ error: 'Failed to stop recording' });
    }
  },

  updateStreamConfig: async (cameraId, config) => {
    try {
      await monitorService.updateStreamConfig(cameraId, config);
    } catch (error) {
      set({ error: 'Failed to update stream config' });
    }
  },

  incrementRecordingDuration: () => {
    set((state) => ({
      recordingDuration: state.recordingDuration + 1,
    }));
  },
}));
