// ============================================
// PawSync Pro - cameraStore.ts
//
// 作者: 带娃的小陈工
// 日期: 2026-06-09
// 描述: 摄像头状态管理 - 集成真实流媒体服务连接
// ============================================

import { create } from 'zustand';
import type { CameraDevice, CameraBrand, PairingProgress } from '../types/camera';
import { cameraManager } from '../services/cameraService';
import { StreamManager } from '../services/streaming/streamManager';
import type { StreamState, StreamProtocol } from '../services/streaming/types';

type StreamQuality = 'auto' | 'low' | 'medium' | 'high' | 'ultra';

// 流连接状态
interface StreamConnectionState {
  state: StreamState;
  protocol: StreamProtocol | null;
  quality: StreamQuality;
  connectedAt?: number;
  reconnectAttempts: number;
}

interface CameraState {
  devices: CameraDevice[];
  selectedDevice: CameraDevice | null;
  isLoading: boolean;
  error: string | null;
  streamQuality: StreamQuality;
  isPairing: boolean;
  pairingProgress: PairingProgress | null;
  streamConnections: Record<string, StreamConnectionState>;
  streamManager: StreamManager | null;

  loadDevices: () => Promise<void>;
  selectDevice: (device: CameraDevice) => void;
  addDevice: (device: CameraDevice) => void;
  removeDevice: (deviceId: string) => Promise<void>;
  pairDevice: (brand: CameraBrand, deviceCode: string, deviceName?: string) => Promise<CameraDevice>;
  setStreamQuality: (quality: StreamQuality) => void;
  updateDeviceStatus: (deviceId: string, status: CameraDevice['status']) => void;
  connectStream: (deviceId: string) => Promise<void>;
  disconnectStream: (deviceId: string) => Promise<void>;
  getStreamState: (deviceId: string) => StreamConnectionState | null;
  initializeStreamManager: () => void;
  destroyStreamManager: () => void;
}

export const useCameraStore = create<CameraState>((set, get) => ({
  devices: [],
  selectedDevice: null,
  isLoading: false,
  error: null,
  streamQuality: 'auto',
  isPairing: false,
  pairingProgress: null,
  streamConnections: {},
  streamManager: null,

  // 初始化流管理器
  initializeStreamManager: () => {
    const streamManager = new StreamManager({
      onStateChange: (event) => {
        if (event.type === 'stateChange' && event.data) {
          const state = (event.data as { state: StreamState }).state;
          const deviceId = event.deviceId;
          
          set((prev) => ({
            streamConnections: {
              ...prev.streamConnections,
              [deviceId]: {
                ...prev.streamConnections[deviceId] || {
                  state: 'idle',
                  protocol: null,
                  quality: 'auto',
                  reconnectAttempts: 0,
                },
                state,
              },
            },
          }));
          
          // 更新设备状态
          if (state === 'connected') {
            get().updateDeviceStatus(deviceId, 'online');
          } else if (state === 'error' || state === 'disconnected') {
            get().updateDeviceStatus(deviceId, 'offline');
          }
        }
      },
      onError: (error) => {
        console.error('[CameraStore] 流错误:', error);
        const deviceId = error.deviceId;
        if (deviceId) {
          set((prev) => ({
            streamConnections: {
              ...prev.streamConnections,
              [deviceId]: {
                ...prev.streamConnections[deviceId] || {
                  state: 'idle',
                  protocol: null,
                  quality: 'auto',
                  reconnectAttempts: 0,
                },
                state: 'error',
                reconnectAttempts: (prev.streamConnections[deviceId]?.reconnectAttempts || 0) + 1,
              },
            },
            error: error.message,
          }));
        }
      },
      onQualityChange: (deviceId, quality) => {
        set((prev) => ({
          streamConnections: {
            ...prev.streamConnections,
            [deviceId]: {
              ...prev.streamConnections[deviceId] || {
                state: 'idle',
                protocol: null,
                quality: 'auto',
                reconnectAttempts: 0,
              },
              quality,
            },
          },
        }));
      },
    });
    
    set({ streamManager });
    console.log('[CameraStore] 流管理器初始化完成');
  },

  // 销毁流管理器
  destroyStreamManager: () => {
    const { streamManager } = get();
    if (streamManager) {
      streamManager.destroy();
      set({ streamManager: null, streamConnections: {} });
      console.log('[CameraStore] 流管理器已销毁');
    }
  },

  // 加载设备列表
  loadDevices: async () => {
    set({ isLoading: true, error: null });
    try {
      const devices = await cameraManager.getAllDevices();
      set({ devices, isLoading: false });
      console.log('[CameraStore] 加载设备:', devices.length);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载设备失败';
      set({ error: errorMessage, isLoading: false });
      console.error('[CameraStore] 加载设备失败:', error);
    }
  },

  // 选择设备
  selectDevice: (device) => {
    set({ selectedDevice: device });
    console.log('[CameraStore] 选择设备:', device.name);
  },

  // 添加设备
  addDevice: (device) => {
    set((state) => ({
      devices: [...state.devices, device],
    }));
    console.log('[CameraStore] 添加设备:', device.name);
  },

  // 移除设备
  removeDevice: async (deviceId) => {
    try {
      // 先断开流连接
      await get().disconnectStream(deviceId);
      
      // 从管理器中移除设备
      await cameraManager.removeDevice(deviceId);
      
      set((state) => ({
        devices: state.devices.filter(d => d.id !== deviceId),
        selectedDevice: state.selectedDevice?.id === deviceId ? null : state.selectedDevice,
        streamConnections: {
          ...state.streamConnections,
          [deviceId]: undefined,
        },
      }));
      
      console.log('[CameraStore] 移除设备:', deviceId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '移除设备失败';
      set({ error: errorMessage });
      console.error('[CameraStore] 移除设备失败:', error);
    }
  },

  // 配对设备
  pairDevice: async (brand, deviceCode, deviceName) => {
    set({ isPairing: true, error: null, pairingProgress: null });
    
    try {
      const device = await cameraManager.pairDevice(
        { brand, deviceCode, name: deviceName },
        (progress) => set({ pairingProgress: progress })
      );
      
      set((state) => ({
        devices: [...state.devices, device],
        isPairing: false,
        pairingProgress: null,
      }));
      
      console.log('[CameraStore] 配对设备成功:', device.name);
      return device;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '配对设备失败';
      set({ error: errorMessage, isPairing: false, pairingProgress: null });
      console.error('[CameraStore] 配对设备失败:', error);
      throw error;
    }
  },

  // 设置流质量
  setStreamQuality: (quality) => {
    set({ streamQuality: quality });
    
    // 如果有选中的设备，尝试切换质量
    const { selectedDevice, streamManager } = get();
    if (selectedDevice && streamManager) {
      streamManager.switchQuality(selectedDevice.id, quality).catch(console.error);
    }
    
    console.log('[CameraStore] 设置流质量:', quality);
  },

  // 更新设备状态
  updateDeviceStatus: (deviceId, status) => {
    set((state) => ({
      devices: state.devices.map(d =>
        d.id === deviceId ? { ...d, status, lastActive: new Date().toISOString() } : d
      ),
    }));
    console.log('[CameraStore] 更新设备状态:', deviceId, status);
  },

  // 连接流
  connectStream: async (deviceId) => {
    const { streamManager, devices } = get();
    if (!streamManager) {
      console.warn('[CameraStore] 流管理器未初始化');
      return;
    }
    
    const device = devices.find(d => d.id === deviceId);
    if (!device) {
      console.warn('[CameraStore] 设备不存在:', deviceId);
      return;
    }
    
    // 初始化连接状态
    set((prev) => ({
      streamConnections: {
        ...prev.streamConnections,
        [deviceId]: {
          state: 'connecting',
          protocol: null,
          quality: prev.streamQuality,
          reconnectAttempts: 0,
        },
      },
    }));
    
    try {
      // 根据设备配置选择协议
      const protocol: StreamProtocol = device.protocol === 'webrtc' ? 'webrtc' :
                                       device.protocol === 'rtsp' ? 'rtsp' :
                                       device.protocol === 'hls' ? 'hls' : 'webrtc';
      
      // 构建流配置
      const streamConfig = {
        deviceId: device.id,
        preferredProtocol: protocol,
        fallbackProtocols: ['webrtc', 'rtsp', 'hls'] as StreamProtocol[],
        adaptiveBitrate: {
          enabled: true,
          initialQuality: get().streamQuality,
          minQuality: 'low' as StreamQuality,
          maxQuality: 'ultra' as StreamQuality,
        },
        webrtc: device.webrtcUrl ? {
          signalingUrl: device.webrtcUrl,
        } : undefined,
        rtsp: device.streamUrl ? {
          proxyUrl: '/api/rtsp-proxy',
        } : undefined,
        enableWeakNetworkOptimization: true,
        enableAudio: true,
        enableVideo: true,
      };
      
      // 创建流连接
      const stream = await streamManager.createStream(device.id, streamConfig);
      
      // 更新连接状态
      const currentProtocol = streamManager.getProtocol(device.id);
      set((prev) => ({
        streamConnections: {
          ...prev.streamConnections,
          [deviceId]: {
            state: 'connected',
            protocol: currentProtocol,
            quality: streamManager.getCurrentQuality(device.id) || prev.streamQuality,
            connectedAt: Date.now(),
            reconnectAttempts: 0,
          },
        },
      }));
      
      // 更新设备状态为在线
      get().updateDeviceStatus(deviceId, 'online');
      
      console.log('[CameraStore] 连接流成功:', deviceId, '协议:', currentProtocol);
    } catch (error) {
      console.error('[CameraStore] 连接流失败:', error);
      
      set((prev) => ({
        streamConnections: {
          ...prev.streamConnections,
          [deviceId]: {
            state: 'error',
            protocol: null,
            quality: prev.streamQuality,
            reconnectAttempts: (prev.streamConnections[deviceId]?.reconnectAttempts || 0) + 1,
          },
        },
        error: error instanceof Error ? error.message : '连接流失败',
      }));
      
      // 更新设备状态为离线
      get().updateDeviceStatus(deviceId, 'offline');
    }
  },

  // 断开流
  disconnectStream: async (deviceId) => {
    const { streamManager } = get();
    if (!streamManager) return;
    
    try {
      await streamManager.destroyStream(deviceId);
      
      set((prev) => ({
        streamConnections: {
          ...prev.streamConnections,
          [deviceId]: {
            state: 'disconnected',
            protocol: null,
            quality: prev.streamQuality,
            reconnectAttempts: 0,
          },
        },
      }));
      
      console.log('[CameraStore] 断开流:', deviceId);
    } catch (error) {
      console.error('[CameraStore] 断开流失败:', error);
    }
  },

  // 获取流状态
  getStreamState: (deviceId) => {
    return get().streamConnections[deviceId] || null;
  },
}));