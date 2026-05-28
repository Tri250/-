import { create } from 'zustand';
import { cameraApi, CameraDevice as ApiCameraDevice, MotionAlert } from '../lib/api';

interface CameraState {
  devices: ApiCameraDevice[];
  selectedDevice: ApiCameraDevice | null;
  alerts: MotionAlert[];
  isLoading: boolean;
  isLoadingAlerts: boolean;
  error: string | null;
  streamQuality: 'auto' | 'low' | 'medium' | 'high';
  isPairing: boolean;

  loadDevices: () => Promise<void>;
  selectDevice: (device: ApiCameraDevice) => void;
  bindDevice: (data: {
    name: string;
    brand: string;
    model: string;
    serialNumber: string;
    petId?: string;
    location?: string;
    thumbnailUrl?: string;
  }) => Promise<ApiCameraDevice>;
  updateDevice: (id: string, data: Partial<ApiCameraDevice>) => Promise<void>;
  removeDevice: (deviceId: string) => Promise<void>;
  setStreamQuality: (quality: 'auto' | 'low' | 'medium' | 'high') => void;

  // 告警功能
  loadAlerts: () => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;

  // 初始化白名单
  seedWhitelist: () => Promise<void>;
}

export const useCameraStore = create<CameraState>((set, get) => ({
  devices: [],
  selectedDevice: null,
  alerts: [],
  isLoading: false,
  isLoadingAlerts: false,
  error: null,
  streamQuality: 'auto',
  isPairing: false,

  seedWhitelist: async () => {
    try {
      await cameraApi.seedWhitelist();
    } catch (error) {
      console.error('Failed to seed whitelist:', error);
    }
  },

  loadDevices: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await cameraApi.getCameras();
      set({ devices: response.data, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load devices', isLoading: false });
    }
  },

  selectDevice: (device) => {
    set({ selectedDevice: device });
  },

  bindDevice: async (data) => {
    set({ isPairing: true, error: null });
    try {
      const response = await cameraApi.bindCamera(data);
      const newDevice = response.data;
      set((state) => ({
        devices: [...state.devices, newDevice],
        isPairing: false,
      }));
      return newDevice;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to bind device',
        isPairing: false,
      });
      throw error;
    }
  },

  updateDevice: async (id, data) => {
    try {
      const response = await cameraApi.updateCamera(id, data);
      const updatedDevice = response.data;
      set((state) => ({
        devices: state.devices.map((d) => (d.id === id ? updatedDevice : d)),
        selectedDevice: state.selectedDevice?.id === id ? updatedDevice : state.selectedDevice,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update device' });
      throw error;
    }
  },

  removeDevice: async (deviceId) => {
    try {
      await cameraApi.deleteCamera(deviceId);
      set((state) => ({
        devices: state.devices.filter((d) => d.id !== deviceId),
        selectedDevice: state.selectedDevice?.id === deviceId ? null : state.selectedDevice,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to remove device' });
      throw error;
    }
  },

  setStreamQuality: (quality) => {
    set({ streamQuality: quality });
  },

  // 告警功能
  loadAlerts: async () => {
    set({ isLoadingAlerts: true });
    try {
      const response = await cameraApi.getAlerts();
      set({ alerts: response.data, isLoadingAlerts: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load alerts', isLoadingAlerts: false });
    }
  },

  acknowledgeAlert: async (alertId) => {
    try {
      const response = await cameraApi.acknowledgeAlert(alertId);
      const updatedAlert = response.data;
      set((state) => ({
        alerts: state.alerts.map((a) => (a.id === alertId ? updatedAlert : a)),
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to acknowledge alert' });
      throw error;
    }
  },
}));
