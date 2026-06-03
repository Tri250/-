import { create } from 'zustand';
import type { LiveMonitoring, SmartEvent, RecordingSession, StreamConfig } from '../types/monitor';
import { monitorService } from '../services/monitorService';

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
  events: [],
  recordingSession: null,
  recordingDuration: 0,
  isLoading: false,
  error: null,

  startMonitoring: async (cameraId, config) => {
    set({ isLoading: true, error: null });
    try {
      const monitoring = await monitorService.startMonitoring(cameraId, config);
      set({ monitoring, isMonitoring: true, isLoading: false });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      set({ error: 'Failed to start monitoring', isLoading: false });
    }
  },

  stopMonitoring: async (cameraId) => {
    try {
      await monitorService.stopMonitoring(cameraId);
      set({ isMonitoring: false, monitoring: null });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      set({ error: 'Failed to stop monitoring' });
    }
  },

  loadEvents: async (limit = 50) => {
    try {
      const events = await monitorService.getAllEvents(limit);
      set({ events });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      set({ error: 'Failed to acknowledge event' });
    }
  },

  startRecording: async (cameraId) => {
    try {
      const session = await monitorService.startRecording(cameraId);
      set({ recordingSession: session, recordingDuration: 0 });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      set({ error: 'Failed to start recording' });
    }
  },

  stopRecording: async () => {
    const { recordingSession } = get();
    if (!recordingSession) return;

    try {
      const session = await monitorService.stopRecording(recordingSession.id);
      set({ recordingSession: session });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      set({ error: 'Failed to stop recording' });
    }
  },

  updateStreamConfig: async (cameraId, config) => {
    try {
      await monitorService.updateStreamConfig(cameraId, config);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      set({ error: 'Failed to update stream config' });
    }
  },

  incrementRecordingDuration: () => {
    set((state) => ({
      recordingDuration: state.recordingDuration + 1,
    }));
  },
}));
