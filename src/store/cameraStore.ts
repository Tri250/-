import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CameraDevice as Device } from '../types/camera';
import { StreamQuality } from '../types/camera';

interface CameraState {
  devices: Device[];
  selectedDeviceId: string | null;
  streamQuality: StreamQuality;
  isStreaming: boolean;
  error: string | null;

  addDevice: (device: Device) => void;
  removeDevice: (deviceId: string) => void;
  updateDevice: (deviceId: string, updates: Partial<Device>) => void;
  selectDevice: (deviceId: string | null) => void;
  setStreamQuality: (quality: StreamQuality) => void;
  setStreaming: (isStreaming: boolean) => void;
  setError: (error: string | null) => void;
  getDeviceById: (deviceId: string) => Device | undefined;
  getDevicesByPet: (petId: string) => Device[];
}

const storage = {
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value);
    } catch {
      // ignore
    }
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};

export const useCameraStore = create<CameraState>()(
  persist(
    (set, get) => ({
      devices: [],
      selectedDeviceId: null,
      streamQuality: 'high',
      isStreaming: false,
      error: null,

      addDevice: (device) =>
        set((state) => ({
          devices: [...state.devices, device],
        })),

      removeDevice: (deviceId) =>
        set((state) => ({
          devices: state.devices.filter((d) => d.id !== deviceId),
          selectedDeviceId:
            state.selectedDeviceId === deviceId ? null : state.selectedDeviceId,
        })),

      updateDevice: (deviceId, updates) =>
        set((state) => ({
          devices: state.devices.map((d) =>
            d.id === deviceId ? { ...d, ...updates } : d
          ),
        })),

      selectDevice: (deviceId) =>
        set({ selectedDeviceId: deviceId }),

      setStreamQuality: (quality) =>
        set({ streamQuality: quality }),

      setStreaming: (isStreaming) =>
        set({ isStreaming }),

      setError: (error) =>
        set({ error }),

      getDeviceById: (deviceId) =>
        get().devices.find((d) => d.id === deviceId),

      getDevicesByPet: (petId) =>
        get().devices.filter((d) => d.petId === petId),
    }),
    {
      name: 'camera-storage',
      storage: createJSONStorage(() => storage),
    }
  )
);
