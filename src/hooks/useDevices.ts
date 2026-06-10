// ============================================
// PawSync Pro 3.0 - useDevices Hook
//
// 作者: 带娃的小陈工
// 日期: 2026-06-10
// 描述: 设备管理 Hook - 加载设备、发送指令、实时状态更新
// ============================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import type { SmartDevice, InteractionLog } from '../types/bond';

// 设备状态类型
export interface DeviceStatus {
  deviceId: string;
  status: 'online' | 'offline' | 'busy';
  lastActive: string;
  batteryLevel?: number;
  temperature?: number;
  isRunning?: boolean;
  currentAction?: string;
}

// WebSocket 连接状态
type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

// API 响应类型
interface DevicesResponse {
  devices: SmartDevice[];
  logs: InteractionLog[];
}

interface CommandResponse {
  success: boolean;
  log: InteractionLog;
  deviceStatus: DeviceStatus;
}

// Hook 返回类型
interface UseDevicesReturn {
  devices: SmartDevice[];
  interactionLogs: InteractionLog[];
  loading: boolean;
  error: string | null;
  wsStatus: WebSocketStatus;
  loadDevices: (petId: string) => Promise<void>;
  sendCommand: (deviceId: string, action: string) => Promise<void>;
  getDeviceStatus: (deviceId: string) => Promise<DeviceStatus>;
  addDevice: (device: Omit<SmartDevice, 'id'>) => Promise<void>;
  deleteDevice: (deviceId: string) => Promise<void>;
  updateDevice: (deviceId: string, data: Partial<SmartDevice>) => Promise<void>;
}

/**
 * 设备管理 Hook
 * 提供加载设备、发送指令、实时状态更新的功能
 */
export function useDevices(): UseDevicesReturn {
  const [devices, setDevices] = useState<SmartDevice[]>([]);
  const [interactionLogs, setInteractionLogs] = useState<InteractionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<WebSocketStatus>('disconnected');
  
  // WebSocket 连接引用
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 建立 WebSocket 连接用于实时状态更新
   */
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // 已连接
    }

    setWsStatus('connecting');
    
    // WebSocket 地址
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws';
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsStatus('connected');
        console.log('[WebSocket] 已连接');
        
        // 清除重连定时器
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // 处理设备状态更新
          if (data.type === 'device_status') {
            const status: DeviceStatus = data.payload;
            
            setDevices(prev => prev.map(d => {
              if (d.id === status.deviceId) {
                return {
                  ...d,
                  status: status.status,
                  lastActive: status.lastActive,
                };
              }
              return d;
            }));
          }
          
          // 处理新的互动日志
          if (data.type === 'interaction_log') {
            const log: InteractionLog = data.payload;
            setInteractionLogs(prev => [log, ...prev]);
          }
        } catch (err) {
          console.error('[WebSocket] 解析消息失败:', err);
        }
      };

      ws.onerror = (err) => {
        setWsStatus('error');
        console.error('[WebSocket] 连接错误:', err);
      };

      ws.onclose = () => {
        setWsStatus('disconnected');
        console.log('[WebSocket] 已断开');
        
        // 5秒后自动重连
        reconnectTimerRef.current = setTimeout(() => {
          connectWebSocket();
        }, 5000);
      };
    } catch (err) {
      setWsStatus('error');
      console.error('[WebSocket] 创建连接失败:', err);
    }
  }, []);

  /**
   * 断开 WebSocket 连接
   */
  const disconnectWebSocket = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setWsStatus('disconnected');
  }, []);

  // 组件卸载时断开连接
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, [disconnectWebSocket]);

  /**
   * 加载设备列表
   * @param petId 宠物 ID
   */
  const loadDevices = useCallback(async (petId: string) => {
    setLoading(true);
    setError(null);

    try {
      // 调用 API 获取设备列表
      const response = await api.get<DevicesResponse>(`/devices?petId=${petId}`);
      
      setDevices(response.devices || []);
      setInteractionLogs(response.logs || []);
      
      // 建立 WebSocket 连接
      connectWebSocket();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载设备列表失败';
      setError(errorMessage);
      console.error('加载设备列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [connectWebSocket]);

  /**
   * 发送设备指令
   * @param deviceId 设备 ID
   * @param action 操作类型
   */
  const sendCommand = useCallback(async (deviceId: string, action: string) => {
    setError(null);

    try {
      // 调用 API 发送指令
      const response = await api.post<CommandResponse>(`/devices/${deviceId}/command`, { action });
      
      if (response.success) {
        // 更新设备状态
        setDevices(prev => prev.map(d => {
          if (d.id === deviceId) {
            return {
              ...d,
              status: response.deviceStatus.status,
              lastActive: response.deviceStatus.lastActive,
            };
          }
          return d;
        }));
        
        // 添加新的互动日志
        if (response.log) {
          setInteractionLogs(prev => [response.log, ...prev]);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '发送指令失败';
      setError(errorMessage);
      console.error('发送指令失败:', err);
      throw err;
    }
  }, []);

  /**
   * 获取设备状态
   * @param deviceId 设备 ID
   * @returns 设备状态
   */
  const getDeviceStatus = useCallback(async (deviceId: string): Promise<DeviceStatus> => {
    try {
      // 调用 API 获取设备状态
      const response = await api.get<DeviceStatus>(`/devices/${deviceId}/status`);
      
      // 更新本地设备状态
      setDevices(prev => prev.map(d => {
        if (d.id === deviceId) {
          return {
            ...d,
            status: response.status,
            lastActive: response.lastActive,
          };
        }
        return d;
      }));
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取设备状态失败';
      console.error('获取设备状态失败:', err);
      throw err;
    }
  }, []);

  /**
   * 添加新设备
   * @param device 设备信息
   */
  const addDevice = useCallback(async (device: Omit<SmartDevice, 'id'>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post<{ device: SmartDevice }>('/devices', device);
      
      setDevices(prev => [...prev, response.device]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '添加设备失败';
      setError(errorMessage);
      console.error('添加设备失败:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 删除设备
   * @param deviceId 设备 ID
   */
  const deleteDevice = useCallback(async (deviceId: string) => {
    setError(null);

    try {
      await api.delete(`/devices/${deviceId}`);
      
      setDevices(prev => prev.filter(d => d.id !== deviceId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除设备失败';
      setError(errorMessage);
      console.error('删除设备失败:', err);
      throw err;
    }
  }, []);

  /**
   * 更新设备信息
   * @param deviceId 设备 ID
   * @param data 更新数据
   */
  const updateDevice = useCallback(async (deviceId: string, data: Partial<SmartDevice>) => {
    setError(null);

    try {
      const response = await api.put<{ device: SmartDevice }>(`/devices/${deviceId}`, data);
      
      setDevices(prev => prev.map(d => 
        d.id === deviceId ? response.device : d
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新设备失败';
      setError(errorMessage);
      console.error('更新设备失败:', err);
      throw err;
    }
  }, []);

  return {
    devices,
    interactionLogs,
    loading,
    error,
    wsStatus,
    loadDevices,
    sendCommand,
    getDeviceStatus,
    addDevice,
    deleteDevice,
    updateDevice,
  };
}

export default useDevices;