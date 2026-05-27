import { create } from 'zustand';
import type { CameraDevice, CameraBrand, StreamQuality, PairingProgress } from '../types/camera';
import { cameraManager } from '../services/cameraService';

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
  devices: [],
  selectedDevice: null,
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
    set({ isPairing: true, error: null, pairingProgress: null });
    
    try {
      const device = await cameraManager.pairDevice(
        { brand, deviceCode, deviceName },
        (progress) => set({ pairingProgress: progress })
      );
      
      set((state) => ({
        devices: [...state.devices, device],
        isPairing: false,
        pairingProgress: null,
      }));
      
      return device;
    } catch (error) {
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
