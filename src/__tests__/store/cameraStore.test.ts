import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock device creator
const createMockDevice = (overrides = {}) => ({
  id: 'camera-001',
  name: '测试摄像头',
  type: 'camera' as const,
  status: 'online' as const,
  thumbnailUrl: 'https://example.com/thumb.jpg',
  snapshotUrl: undefined,
  streamUrl: undefined,
  settings: {
    resolution: '1080p',
    nightVision: false,
    motionDetection: false,
    batteryLevel: 100,
  },
  ...overrides,
});

// Mock camera store implementation
interface CameraState {
  devices: any[];
  selectedDevice: any | null;
  streamQuality: 'low' | 'medium' | 'high';
  isStreaming: boolean;
  error: string | null;
}

const initialState: CameraState = {
  devices: [],
  selectedDevice: null,
  streamQuality: 'high',
  isStreaming: false,
  error: null,
};

let state = { ...initialState };

const resetState = () => {
  state = { ...initialState };
};

const cameraStore = {
  getState: () => state,
  setDevices: (devices: any[]) => {
    state.devices = devices;
  },
  selectDevice: (device: any) => {
    state.selectedDevice = device;
  },
  setStreamQuality: (quality: 'low' | 'medium' | 'high') => {
    state.streamQuality = quality;
  },
  startStreaming: () => {
    state.isStreaming = true;
  },
  stopStreaming: () => {
    state.isStreaming = false;
  },
  setError: (error: string | null) => {
    state.error = error;
  },
  reset: resetState,
};

describe('cameraStore', () => {
  beforeEach(() => {
    resetState();
  });

  afterEach(() => {
    resetState();
  });

  describe('initial state', () => {
    it('should have empty devices array', () => {
      expect(cameraStore.getState().devices).toEqual([]);
    });

    it('should have no selected device', () => {
      expect(cameraStore.getState().selectedDevice).toBeNull();
    });

    it('should have default stream quality set to high', () => {
      expect(cameraStore.getState().streamQuality).toBe('high');
    });

    it('should not be streaming initially', () => {
      expect(cameraStore.getState().isStreaming).toBe(false);
    });

    it('should have no error initially', () => {
      expect(cameraStore.getState().error).toBeNull();
    });
  });

  describe('setDevices', () => {
    it('should update devices array', () => {
      const devices = [
        createMockDevice({ id: '1' }),
        createMockDevice({ id: '2' }),
      ];
      cameraStore.setDevices(devices);
      expect(cameraStore.getState().devices).toHaveLength(2);
    });

    it('should handle empty devices array', () => {
      cameraStore.setDevices([]);
      expect(cameraStore.getState().devices).toEqual([]);
    });
  });

  describe('selectDevice', () => {
    it('should set selected device', () => {
      const device = createMockDevice({ id: 'selected' });
      cameraStore.selectDevice(device);
      expect(cameraStore.getState().selectedDevice).toEqual(device);
    });

    it('should allow changing selected device', () => {
      const device1 = createMockDevice({ id: 'device1' });
      const device2 = createMockDevice({ id: 'device2' });
      cameraStore.selectDevice(device1);
      expect(cameraStore.getState().selectedDevice?.id).toBe('device1');
      cameraStore.selectDevice(device2);
      expect(cameraStore.getState().selectedDevice?.id).toBe('device2');
    });
  });

  describe('setStreamQuality', () => {
    it('should update stream quality to low', () => {
      cameraStore.setStreamQuality('low');
      expect(cameraStore.getState().streamQuality).toBe('low');
    });

    it('should update stream quality to medium', () => {
      cameraStore.setStreamQuality('medium');
      expect(cameraStore.getState().streamQuality).toBe('medium');
    });

    it('should update stream quality to high', () => {
      cameraStore.setStreamQuality('high');
      expect(cameraStore.getState().streamQuality).toBe('high');
    });
  });

  describe('startStreaming', () => {
    it('should set isStreaming to true', () => {
      cameraStore.startStreaming();
      expect(cameraStore.getState().isStreaming).toBe(true);
    });
  });

  describe('stopStreaming', () => {
    it('should set isStreaming to false', () => {
      cameraStore.startStreaming();
      cameraStore.stopStreaming();
      expect(cameraStore.getState().isStreaming).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      cameraStore.setError('Connection failed');
      expect(cameraStore.getState().error).toBe('Connection failed');
    });

    it('should clear error when set to null', () => {
      cameraStore.setError('Error');
      cameraStore.setError(null);
      expect(cameraStore.getState().error).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset state to initial values', () => {
      cameraStore.setDevices([createMockDevice()]);
      cameraStore.selectDevice(createMockDevice());
      cameraStore.setStreamQuality('low');
      cameraStore.startStreaming();
      cameraStore.setError('Some error');
      cameraStore.reset();
      
      const newState = cameraStore.getState();
      expect(newState.devices).toEqual([]);
      expect(newState.selectedDevice).toBeNull();
      expect(newState.streamQuality).toBe('high');
      expect(newState.isStreaming).toBe(false);
      expect(newState.error).toBeNull();
    });
  });

  describe('device integration', () => {
    it('should store device with all properties', () => {
      const device = createMockDevice({
        id: 'test-device',
        name: '测试设备',
        status: 'online',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        settings: {
          resolution: '4K',
          nightVision: true,
          motionDetection: true,
          batteryLevel: 95,
        },
      });
      cameraStore.setDevices([device]);
      expect(cameraStore.getState().devices[0]).toMatchObject({
        id: 'test-device',
        name: '测试设备',
        status: 'online',
        settings: {
          resolution: '4K',
          nightVision: true,
          motionDetection: true,
          batteryLevel: 95,
        },
      });
    });

    it('should handle multiple devices with different statuses', () => {
      const devices = [
        createMockDevice({ id: '1', status: 'online' }),
        createMockDevice({ id: '2', status: 'offline' }),
        createMockDevice({ id: '3', status: 'online' }),
      ];
      cameraStore.setDevices(devices);
      expect(cameraStore.getState().devices).toHaveLength(3);
    });
  });

  describe('stream quality transitions', () => {
    it('should transition from low to high quality', () => {
      cameraStore.setStreamQuality('low');
      expect(cameraStore.getState().streamQuality).toBe('low');
      cameraStore.setStreamQuality('high');
      expect(cameraStore.getState().streamQuality).toBe('high');
    });

    it('should maintain quality setting across operations', () => {
      cameraStore.setStreamQuality('medium');
      cameraStore.startStreaming();
      cameraStore.stopStreaming();
      expect(cameraStore.getState().streamQuality).toBe('medium');
    });
  });

  describe('streaming state management', () => {
    it('should handle start and stop streaming cycle', () => {
      expect(cameraStore.getState().isStreaming).toBe(false);
      cameraStore.startStreaming();
      expect(cameraStore.getState().isStreaming).toBe(true);
      cameraStore.stopStreaming();
      expect(cameraStore.getState().isStreaming).toBe(false);
    });

    it('should allow multiple start calls without error', () => {
      cameraStore.startStreaming();
      cameraStore.startStreaming();
      expect(cameraStore.getState().isStreaming).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should maintain last error state', () => {
      cameraStore.setError('Error 1');
      cameraStore.setError('Error 2');
      expect(cameraStore.getState().error).toBe('Error 2');
    });

    it('should clear error before setting new one', () => {
      cameraStore.setError('Initial error');
      cameraStore.setError(null);
      cameraStore.setError('New error');
      expect(cameraStore.getState().error).toBe('New error');
    });
  });

  describe('createMockDevice helper', () => {
    it('should create device with default values', () => {
      const device = createMockDevice();
      expect(device.id).toBe('camera-001');
      expect(device.name).toBe('测试摄像头');
      expect(device.type).toBe('camera');
      expect(device.status).toBe('online');
    });

    it('should override default values with provided ones', () => {
      const device = createMockDevice({
        id: 'custom-id',
        name: '自定义名称',
        status: 'offline',
      });
      expect(device.id).toBe('custom-id');
      expect(device.name).toBe('自定义名称');
      expect(device.status).toBe('offline');
    });
  });
});
