// ============================================
// PawSync Pro - monitorStore.ts
//
// 作者: 带娃的小陈工
// 日期: 2026-06-09
// 描述: 监控状态管理 - 集成真实检测和录制服务
// ============================================

import { create } from 'zustand';
import type { LiveMonitoring, SmartEvent, RecordingSession, StreamConfig, StreamHealth } from '../types/monitor';
import { monitorService } from '../services/monitorService';
import { unifiedDetectionService } from '../services/detection';
import { recordingService } from '../services/recording/recordingService';

interface MonitorState {
  isMonitoring: boolean;
  monitoring: LiveMonitoring | null;
  events: SmartEvent[];
  recordingSession: RecordingSession | null;
  recordingDuration: number;
  streamHealth: Record<string, StreamHealth>;
  isLoading: boolean;
  error: string | null;
  detectionInitialized: boolean;

  startMonitoring: (cameraId: string, config: StreamConfig) => Promise<void>;
  stopMonitoring: (cameraId: string) => Promise<void>;
  loadEvents: (limit?: number) => Promise<void>;
  acknowledgeEvent: (eventId: string) => Promise<void>;
  startRecording: (cameraId: string) => Promise<void>;
  stopRecording: () => Promise<void>;
  updateStreamConfig: (cameraId: string, config: Partial<StreamConfig>) => Promise<void>;
  incrementRecordingDuration: () => void;
  updateStreamHealth: (cameraId: string, health: StreamHealth) => void;
  addEvent: (event: SmartEvent) => void;
  clearEvents: () => void;
  initializeDetection: () => Promise<void>;
}

export const useMonitorStore = create<MonitorState>((set, get) => ({
  isMonitoring: false,
  monitoring: null,
  events: [],
  recordingSession: null,
  recordingDuration: 0,
  streamHealth: {},
  isLoading: false,
  error: null,
  detectionInitialized: false,

  // 初始化检测服务
  initializeDetection: async () => {
    try {
      await unifiedDetectionService.initialize({
        mode: 'realtime',
        backendBaseUrl: '/api',
      });
      set({ detectionInitialized: true });
      console.log('[MonitorStore] 检测服务初始化成功');
    } catch (error) {
      console.error('[MonitorStore] 检测服务初始化失败:', error);
      // 即使失败也标记为初始化，使用模拟模式
      set({ detectionInitialized: true });
    }
  },

  // 开始监控
  startMonitoring: async (cameraId, config) => {
    set({ isLoading: true, error: null });
    try {
      // 使用 monitorService 启动监控
      const monitoring = await monitorService.startMonitoring(cameraId, config);
      
      set({ 
        monitoring, 
        isMonitoring: true, 
        isLoading: false,
        streamHealth: {
          ...get().streamHealth,
          [cameraId]: {
            cameraId,
            latency: 0,
            fps: 30,
            bitrate: 2000,
            packetLoss: 0,
            status: 'excellent',
          },
        },
      });
      
      console.log('[MonitorStore] 开始监控:', cameraId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '启动监控失败';
      set({ error: errorMessage, isLoading: false });
      console.error('[MonitorStore] 启动监控失败:', error);
    }
  },

  // 停止监控
  stopMonitoring: async (cameraId) => {
    try {
      await monitorService.stopMonitoring(cameraId);
      
      // 清除该摄像头的流健康状态
      const currentHealth = get().streamHealth;
      const newHealth = { ...currentHealth };
      delete newHealth[cameraId];
      
      set({ 
        isMonitoring: false, 
        monitoring: null,
        streamHealth: newHealth,
      });
      
      console.log('[MonitorStore] 停止监控:', cameraId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '停止监控失败';
      set({ error: errorMessage });
      console.error('[MonitorStore] 停止监控失败:', error);
    }
  },

  // 加载事件列表
  loadEvents: async (limit = 50) => {
    try {
      // 使用 monitorService 加载事件
      const events = await monitorService.getAllEvents(limit);
      set({ events });
      console.log('[MonitorStore] 加载事件:', events.length);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载事件失败';
      set({ error: errorMessage });
      console.error('[MonitorStore] 加载事件失败:', error);
    }
  },

  // 确认事件
  acknowledgeEvent: async (eventId) => {
    try {
      await monitorService.acknowledgeEvent(eventId);
      
      set((state) => ({
        events: state.events.map(e =>
          e.id === eventId ? { ...e, acknowledged: true } : e
        ),
      }));
      
      console.log('[MonitorStore] 确认事件:', eventId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '确认事件失败';
      set({ error: errorMessage });
      console.error('[MonitorStore] 确认事件失败:', error);
    }
  },

  // 开始录制
  startRecording: async (cameraId) => {
    try {
      // 使用 monitorService 启动录制（用于状态管理）
      const session = await monitorService.startRecording(cameraId);
      
      set({ 
        recordingSession: session, 
        recordingDuration: 0,
        monitoring: get().monitoring ? {
          ...get().monitoring!,
          isRecording: true,
        } : null,
      });
      
      console.log('[MonitorStore] 开始录制:', cameraId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '开始录制失败';
      set({ error: errorMessage });
      console.error('[MonitorStore] 开始录制失败:', error);
    }
  },

  // 停止录制
  stopRecording: async () => {
    const { recordingSession } = get();
    if (!recordingSession) return;

    try {
      // 使用 monitorService 停止录制
      const session = await monitorService.stopRecording(recordingSession.id);
      
      set({ 
        recordingSession: session,
        monitoring: get().monitoring ? {
          ...get().monitoring!,
          isRecording: false,
        } : null,
      });
      
      console.log('[MonitorStore] 停止录制:', recordingSession.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '停止录制失败';
      set({ error: errorMessage });
      console.error('[MonitorStore] 停止录制失败:', error);
    }
  },

  // 更新流配置
  updateStreamConfig: async (cameraId, config) => {
    try {
      await monitorService.updateStreamConfig(cameraId, config);
      console.log('[MonitorStore] 更新流配置:', cameraId, config);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新流配置失败';
      set({ error: errorMessage });
      console.error('[MonitorStore] 更新流配置失败:', error);
    }
  },

  // 增加录制时长
  incrementRecordingDuration: () => {
    set((state) => ({
      recordingDuration: state.recordingDuration + 1,
    }));
  },

  // 更新流健康状态
  updateStreamHealth: (cameraId, health) => {
    set((state) => ({
      streamHealth: {
        ...state.streamHealth,
        [cameraId]: health,
      },
    }));
  },

  // 添加事件（用于实时检测）
  addEvent: (event) => {
    set((state) => ({
      events: [event, ...state.events].slice(0, 100), // 限制最多 100 条
    }));
  },

  // 清除事件
  clearEvents: () => {
    set({ events: [] });
  },
}));