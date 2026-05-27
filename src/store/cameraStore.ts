import { create } from 'zustand';
import type { CameraDevice, CameraBrand, StreamQuality, PairingProgress } from '../types/camera';
import { cameraManager } from '../services/cameraService';

// 示例相机设备
const initialDevices: CameraDevice[] = [
  {
    id: 'cam-001',
    name: '客厅摄像头',
    brand: 'xiaomi',
    status: 'online',
    ipAddress: '192.168.1.100',
    firmwareVersion: 'v2.5.0',
    lastOnline: new Date().toISOString(),
    location: '客厅',
    capabilities: {
      nightVision: true,
      motionDetection: true,
      twoWayAudio: true,
      panTilt: false,
    },
  },
  {
    id: 'cam-002',
    name: '阳台摄像头',
    brand: 'hikvision',
    status: 'online',
    ipAddress: '192.168.1.101',
    firmwareVersion: 'v3.0.1',
    lastOnline: new Date().toISOString(),
    location: '阳台',
    capabilities: {
      nightVision: true,
      motionDetection: true,
      twoWayAudio: false,
      panTilt: true,
    },
  },
];

interface CameraState {
  devices: CameraDevice[];
  selectedDevice: CameraDevice | null;
  isLoading: boolean;
  error: string | null;
  streamQuality: StreamQuality;
  isPairing: boolean;
  pairingProgress: PairingProgress | null;

  loadDevices: () => Promise<void>;
  selectDevice: (device: CameraDevice) => void;
  addDevice: (device: CameraDevice) => void;
  removeDevice: (deviceId: string) => Promise<void>;
  pairDevice: (brand: CameraBrand, deviceCode: string, deviceName?: string) => Promise<CameraDevice>;
  setStreamQuality: (quality: StreamQuality) => void;
  updateDeviceStatus: (deviceId: string, status: CameraDevice['status']) => void;
}

export const useCameraStore = create<CameraState>((set, get) => ({
  devices: initialDevices,
  selectedDevice: initialDevices[0],
  isLoading: false,
  error: null,
  streamQuality: 'auto',
  isPairing: false,
  pairingProgress: null,

  loadDevices: async () => {
    set({ isLoading: true, error: null });
    try {
      const devices = await cameraManager.getAllDevices();
      set({ devices, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load devices', isLoading: false });
    }
  },

  selectDevice: (device) => {
    set({ selectedDevice: device });
  },

  addDevice: (device) => {
    set((state) => ({
      devices: [...state.devices, device],
    }));
  },

  removeDevice: async (deviceId) => {
    try {
      await cameraManager.removeDevice(deviceId);
      set((state) => ({
        devices: state.devices.filter(d => d.id !== deviceId),
        selectedDevice: state.selectedDevice?.id === deviceId ? null : state.selectedDevice,
      }));
    } catch (error) {
      set({ error: 'Failed to remove device' });
    }
  },

  pairDevice: async (brand, deviceCode, deviceName) => {
    console.log('开始配对设备...', { brand, deviceCode, deviceName });
    set({ isPairing: true, error: null, pairingProgress: null });
    
    try {
      const device = await cameraManager.pairDevice(
        { brand, deviceCode, deviceName },
        (progress) => {
          console.log('配对进度:', progress);
          set({ pairingProgress: progress });
        }
      );
      
      console.log('设备配对成功:', device);
      
      set((state) => ({
        devices: [...state.devices, device],
        isPairing: false,
        pairingProgress: null,
      }));
      
      return device;
    } catch (error) {
      console.error('设备配对失败:', error);
      set({ error: 'Failed to pair device', isPairing: false, pairingProgress: null });
      throw error;
    }
  },

  setStreamQuality: (quality) => {
    set({ streamQuality: quality });
  },

  updateDeviceStatus: (deviceId, status) => {
    set((state) => ({
      devices: state.devices.map(d =>
        d.id === deviceId ? { ...d, status } : d
      ),
    }));
  },
}));
