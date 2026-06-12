/**
 * Devices Store - 设备管理数据存储
 *
 * 管理智能设备列表、状态、配对等功能
 * 支持 Capacitor 原生设备管理
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

// 设备类型
export type DeviceType = 'camera' | 'collar' | 'dispenser' | 'bowl' | 'tracker' | 'other';

// 设备状态
export type DeviceStatus = 'online' | 'offline' | 'warning' | 'pairing';

// 设备接口
export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  battery: number;
  signal: number;
  lastActive: string;
  firmware?: string;
  macAddress?: string;
  petId?: string;
  location?: string;
  image?: string;
  settings?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// 设备统计
export interface DeviceStats {
  total: number;
  online: number;
  offline: number;
  warning: number;
}

// 设备事件
export interface DeviceEvent {
  id: string;
  deviceId: string;
  type: 'status_change' | 'battery_low' | 'signal_lost' | 'firmware_update' | 'alert';
  message: string;
  timestamp: string;
  read: boolean;
}

// Store 接口
interface DevicesState {
  devices: Device[];
  events: DeviceEvent[];
  selectedDeviceId: string | null;
  isLoading: boolean;
  isPairing: boolean;
  
  // 设备操作
  addDevice: (device: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Device>;
  updateDevice: (id: string, updates: Partial<Device>) => Promise<void>;
  removeDevice: (id: string) => Promise<void>;
  selectDevice: (id: string | null) => void;
  
  // 设备状态
  updateDeviceStatus: (id: string, status: DeviceStatus) => Promise<void>;
  updateDeviceBattery: (id: string, battery: number) => void;
  updateDeviceSignal: (id: string, signal: number) => void;
  
  // 设备配对
  startPairing: () => Promise<void>;
  cancelPairing: () => void;
  
  // 事件管理
  addEvent: (event: Omit<DeviceEvent, 'id' | 'timestamp' | 'read'>) => void;
  markEventRead: (eventId: string) => void;
  clearEvents: () => void;
  
  // 统计
  getStats: () => DeviceStats;
  getOnlineDevices: () => Device[];
  getDevicesByPet: (petId: string) => Device[];
  
  // 初始化
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
}

// Capacitor 原生存储适配
const capacitorStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (Capacitor.isNativePlatform()) {
      const { value } = await Preferences.get({ key: name });
      return value;
    }
    return localStorage.getItem(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key: name, value });
    } else {
      localStorage.setItem(name, value);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      await Preferences.remove({ key: name });
    } else {
      localStorage.removeItem(name);
    }
  },
};

// 生成唯一ID
const generateId = () => `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// 模拟设备数据
const mockDevices: Device[] = [
  {
    id: 'device-1',
    name: 'JOJO的碗',
    type: 'bowl',
    status: 'online',
    battery: 85,
    signal: 95,
    lastActive: '刚刚',
    firmware: 'v1.2.3',
    petId: 'pet-1',
    location: '客厅',
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-05-20T10:30:00Z',
  },
  {
    id: 'device-2',
    name: '智能项圈',
    type: 'collar',
    status: 'online',
    battery: 92,
    signal: 88,
    lastActive: '2分钟前',
    firmware: 'v2.1.0',
    petId: 'pet-1',
    createdAt: '2024-02-20T10:00:00Z',
    updatedAt: '2024-05-20T10:28:00Z',
  },
  {
    id: 'device-3',
    name: '饮水机',
    type: 'dispenser',
    status: 'warning',
    battery: 15,
    signal: 72,
    lastActive: '5分钟前',
    firmware: 'v1.0.5',
    petId: 'pet-1',
    location: '厨房',
    createdAt: '2024-03-10T14:00:00Z',
    updatedAt: '2024-05-20T10:25:00Z',
  },
  {
    id: 'device-4',
    name: '客厅摄像头',
    type: 'camera',
    status: 'online',
    battery: 100,
    signal: 98,
    lastActive: '在线',
    firmware: 'v3.0.1',
    location: '客厅',
    createdAt: '2024-01-05T09:00:00Z',
    updatedAt: '2024-05-20T10:30:00Z',
  },
];

export const useDevicesStore = create<DevicesState>()(
  persist(
    (set, get) => ({
      devices: [],
      events: [],
      selectedDeviceId: null,
      isLoading: false,
      isPairing: false,

      // 添加设备
      addDevice: async (deviceData) => {
        const newDevice: Device = {
          ...deviceData,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        set((state) => ({
          devices: [...state.devices, newDevice],
        }));
        
        // 添加设备添加事件
        get().addEvent({
          deviceId: newDevice.id,
          type: 'status_change',
          message: `设备 ${newDevice.name} 已添加`,
        });
        
        return newDevice;
      },

      // 更新设备
      updateDevice: async (id, updates) => {
        set((state) => ({
          devices: state.devices.map((device) =>
            device.id === id
              ? { ...device, ...updates, updatedAt: new Date().toISOString() }
              : device
          ),
        }));
      },

      // 删除设备
      removeDevice: async (id) => {
        const device = get().devices.find((d) => d.id === id);
        
        set((state) => ({
          devices: state.devices.filter((d) => d.id !== id),
          selectedDeviceId: state.selectedDeviceId === id ? null : state.selectedDeviceId,
        }));
        
        if (device) {
          get().addEvent({
            deviceId: id,
            type: 'status_change',
            message: `设备 ${device.name} 已移除`,
          });
        }
      },

      // 选择设备
      selectDevice: (id) => {
        set({ selectedDeviceId: id });
      },

      // 更新设备状态
      updateDeviceStatus: async (id, status) => {
        const device = get().devices.find((d) => d.id === id);
        
        set((state) => ({
          devices: state.devices.map((d) =>
            d.id === id
              ? { ...d, status, lastActive: status === 'online' ? '刚刚' : '离线', updatedAt: new Date().toISOString() }
              : d
          ),
        }));
        
        if (device && device.status !== status) {
          get().addEvent({
            deviceId: id,
            type: 'status_change',
            message: `设备 ${device.name} 状态变更为 ${status}`,
          });
        }
      },

      // 更新电池电量
      updateDeviceBattery: (id, battery) => {
        const device = get().devices.find((d) => d.id === id);
        
        set((state) => ({
          devices: state.devices.map((d) =>
            d.id === id ? { ...d, battery, updatedAt: new Date().toISOString() } : d
          ),
        }));
        
        // 低电量警告
        if (battery <= 20 && device && device.battery > 20) {
          get().addEvent({
            deviceId: id,
            type: 'battery_low',
            message: `设备 ${device.name} 电量低于 20%`,
          });
        }
      },

      // 更新信号强度
      updateDeviceSignal: (id, signal) => {
        const device = get().devices.find((d) => d.id === id);
        
        set((state) => ({
          devices: state.devices.map((d) =>
            d.id === id ? { ...d, signal, updatedAt: new Date().toISOString() } : d
          ),
        }));
        
        // 信号丢失警告
        if (signal < 50 && device && device.signal >= 50) {
          get().addEvent({
            deviceId: id,
            type: 'signal_lost',
            message: `设备 ${device.name} 信号较弱`,
          });
        }
      },

      // 开始配对
      startPairing: async () => {
        set({ isPairing: true });
        
        // 模拟配对过程
        await new Promise((resolve) => setTimeout(resolve, 3000));
        
        // 配对成功后添加设备
        const newDevice = await get().addDevice({
          name: '新设备',
          type: 'other',
          status: 'online',
          battery: 100,
          signal: 100,
          lastActive: '刚刚',
        });
        
        set({ isPairing: false });
        
        return newDevice;
      },

      // 取消配对
      cancelPairing: () => {
        set({ isPairing: false });
      },

      // 添加事件
      addEvent: (event) => {
        const newEvent: DeviceEvent = {
          ...event,
          id: `event-${Date.now()}`,
          timestamp: new Date().toISOString(),
          read: false,
        };
        
        set((state) => ({
          events: [newEvent, ...state.events].slice(0, 100),
        }));
      },

      // 标记事件已读
      markEventRead: (eventId) => {
        set((state) => ({
          events: state.events.map((e) =>
            e.id === eventId ? { ...e, read: true } : e
          ),
        }));
      },

      // 清除事件
      clearEvents: () => {
        set({ events: [] });
      },

      // 获取统计
      getStats: () => {
        const devices = get().devices;
        return {
          total: devices.length,
          online: devices.filter((d) => d.status === 'online').length,
          offline: devices.filter((d) => d.status === 'offline').length,
          warning: devices.filter((d) => d.status === 'warning').length,
        };
      },

      // 获取在线设备
      getOnlineDevices: () => {
        return get().devices.filter((d) => d.status === 'online');
      },

      // 获取宠物关联设备
      getDevicesByPet: (petId) => {
        return get().devices.filter((d) => d.petId === petId);
      },

      // 初始化
      initialize: async () => {
        set({ isLoading: true });
        
        // 如果没有设备，加载模拟数据
        if (get().devices.length === 0) {
          set({ devices: mockDevices });
        }
        
        set({ isLoading: false });
      },

      // 刷新数据
      refresh: async () => {
        set({ isLoading: true });
        
        // 模拟刷新设备状态
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        // 更新设备状态（模拟）
        set((state) => ({
          devices: state.devices.map((d) => ({
            ...d,
            lastActive: d.status === 'online' ? '刚刚' : d.lastActive,
          })),
        }));
        
        set({ isLoading: false });
      },
    }),
    {
      name: 'pawsync-devices-store',
      storage: createJSONStorage(() => capacitorStorage),
      partialize: (state) => ({
        devices: state.devices,
        events: state.events.slice(0, 20),
      }),
    }
  )
);