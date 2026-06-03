import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { useCameraStore } from '../../store/cameraStore';
import { cameraManager } from '../../services/cameraService';
import type { CameraDevice } from '../../types/camera';

const createMockDevice = (overrides: Partial<CameraDevice> = {}): CameraDevice => ({
  id: 'cam-001',
  name: '测试设备',
  status: 'online' as const,
  brand: 'xiaomi' as const,
  model: 'test',
  streamUrl: 'https://example.com/stream',
  lastActive: new Date().toISOString(),
  capabilities: [],
  settings: {
    resolution: '1080p',
    nightVisionMode: 'auto',
    motionDetection: { enabled: false, sensitivity: 50, notificationEnabled: false },
    recording: { mode: 'off', quality: 'high', storage: 'sd' },
    audio: { enabled: false, volume: 50, noiseReduction: false },
    aiTracking: { enabled: false, targetType: 'pet', smoothTracking: false },
  },
  protocol: 'rtsp' as const,
  ...overrides,
});

vi.mock('../../services/cameraService', () => ({
  cameraManager: {
    getAllDevices: vi.fn().mockResolvedValue([]),
    removeDevice: vi.fn().mockResolvedValue(true),
    pairDevice: vi.fn(),
  },
}));

describe('CameraStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (cameraManager.getAllDevices as Mock).mockResolvedValue([]);
  });

  afterEach(() => {
    const store = useCameraStore as { persist?: { clearStorage?: () => void } };
    try {
      store.persist?.clearStorage?.();
    } catch {
      // ignore
    }
  });

  describe('Initial State - 初始状态', () => {
    it('应该有默认的初始状态', async () => {
      await useCameraStore.getState().loadDevices();
      const store = useCameraStore.getState();
      
      expect(store.devices).toEqual([]);
      expect(store.selectedDevice).toBeNull();
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
      expect(store.streamQuality).toBe('auto');
      expect(store.isPairing).toBe(false);
      expect(store.pairingProgress).toBeNull();
    });
  });

  describe('loadDevices - 加载设备', () => {
    it('应该加载设备列表', async () => {
      const mockDevices = [
        createMockDevice({ id: 'cam-001', name: '测试设备' }),
      ];
      (cameraManager.getAllDevices as Mock).mockResolvedValue(mockDevices);
      
      await useCameraStore.getState().loadDevices();
      const store = useCameraStore.getState();
      
      expect(store.devices).toEqual(mockDevices);
      expect(store.isLoading).toBe(false);
    });

    it('加载失败时应该设置错误', async () => {
      (cameraManager.getAllDevices as Mock).mockRejectedValue(new Error('Failed to load'));
      
      await useCameraStore.getState().loadDevices();
      const store = useCameraStore.getState();
      
      expect(store.error).toBe('Failed to load devices');
      expect(store.isLoading).toBe(false);
    });
  });

  describe('selectDevice - 选择设备', () => {
    it('应该选择指定的设备', () => {
      const device = createMockDevice({ id: 'cam-001', name: '测试设备' });
      
      useCameraStore.getState().selectDevice(device);
      const store = useCameraStore.getState();
      
      expect(store.selectedDevice).toEqual(device);
    });
  });

  describe('addDevice - 添加设备', () => {
    it('应该添加设备到列表', () => {
      const device = createMockDevice({ id: 'cam-002', name: '新设备' });
      
      useCameraStore.getState().addDevice(device);
      const store = useCameraStore.getState();
      
      expect(store.devices).toContainEqual(device);
    });
  });

  describe('removeDevice - 删除设备', () => {
    it('应该成功删除设备', async () => {
      const device = createMockDevice({ id: 'cam-001', name: '测试设备' });
      useCameraStore.getState().addDevice(device);
      (cameraManager.removeDevice as Mock).mockResolvedValue(true);
      
      await useCameraStore.getState().removeDevice(device.id);
      const store = useCameraStore.getState();
      
      expect(store.devices.find(d => d.id === device.id)).toBeUndefined();
    });

    it('删除失败时应该设置错误', async () => {
      (cameraManager.removeDevice as Mock).mockRejectedValue(new Error('Failed to remove'));
      
      await useCameraStore.getState().removeDevice('cam-001');
      const store = useCameraStore.getState();
      
      expect(store.error).toBe('Failed to remove device');
    });
  });

  describe('pairDevice - 配对设备', () => {
    it('应该配对设备并添加到列表', async () => {
      const pairedDevice = createMockDevice({ 
        id: 'cam-paired', 
        name: '配对设备',
        model: 'TEST-MODEL',
        thumbnailUrl: 'https://example.com/thumb',
        lastOnline: new Date().toISOString(),
      });
      (cameraManager.pairDevice as Mock).mockResolvedValue(pairedDevice);
      
      const result = await useCameraStore.getState().pairDevice('xiaomi', 'TEST-MODEL', '测试设备');
      
      expect(result).toEqual(pairedDevice);
      const store = useCameraStore.getState();
      expect(store.devices).toContainEqual(pairedDevice);
      expect(store.isPairing).toBe(false);
    });

    it('配对失败时应该设置错误', async () => {
      (cameraManager.pairDevice as Mock).mockRejectedValue(new Error('Pairing failed'));
      
      await expect(
        useCameraStore.getState().pairDevice('xiaomi', 'TEST-MODEL')
      ).rejects.toThrow('Pairing failed');
      
      const store = useCameraStore.getState();
      expect(store.error).toBe('Failed to pair device');
      expect(store.isPairing).toBe(false);
    });
  });

  describe('setStreamQuality - 设置流质量', () => {
    it('应该设置流质量', () => {
      useCameraStore.getState().setStreamQuality('high');
      const store = useCameraStore.getState();
      
      expect(store.streamQuality).toBe('high');
    });

    it('应该接受所有有效的质量值', () => {
      const qualities: ('auto' | 'low' | 'medium' | 'high' | 'ultra')[] = ['auto', 'low', 'medium', 'high', 'ultra'];
      
      qualities.forEach(quality => {
        useCameraStore.getState().setStreamQuality(quality);
        expect(useCameraStore.getState().streamQuality).toBe(quality);
      });
    });
  });

  describe('updateDeviceStatus - 更新设备状态', () => {
    it('应该更新指定设备的状态', () => {
      const device = createMockDevice({ id: 'cam-001', name: '测试设备' });
      useCameraStore.getState().addDevice(device);
      
      useCameraStore.getState().updateDeviceStatus(device.id, 'offline');
      const store = useCameraStore.getState();
      
      const updatedDevice = store.devices.find(d => d.id === device.id);
      expect(updatedDevice?.status).toBe('offline');
    });
  });
});