import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock capacitorBridge before importing cameraService
vi.mock('../../services/capacitorBridge', () => ({
  capacitorBridge: {
    takePhoto: vi.fn().mockResolvedValue({ path: '/photo/test.jpg', webPath: '/photo/test.jpg', base64String: null, dataUrl: null, format: 'jpeg', savedPath: null }),
    pickImage: vi.fn().mockResolvedValue({ path: '/photo/picked.jpg', webPath: '/photo/picked.jpg', base64String: null, dataUrl: null, format: 'jpeg', savedPath: null }),
  },
}));

// Mock databaseService
vi.mock('../../services/databaseService', () => ({
  databaseService: {
    STORES: { cameras: 'camera_devices' },
    getAll: vi.fn().mockResolvedValue([]),
    put: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
  },
}));

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { cameraManager } from '../../services/cameraService';

describe('CameraService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    // Reset cameraManager internal state by clearing the devices
    // Since cameraManager is a singleton, we need to reset its state
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getAllDevices - 获取所有设备', () => {
    it('应该返回设备列表（空列表）', async () => {
      const devices = await cameraManager.getAllDevices();
      expect(Array.isArray(devices)).toBe(true);
    });
  });

  describe('getDeviceById - 根据ID获取设备', () => {
    it('不存在的设备ID应该返回null', async () => {
      const result = await cameraManager.getDeviceById('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('connectXiaomi - 连接小米设备', () => {
    it('应该通过API连接新的小米设备', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'cam-xiaomi-001',
          name: '小米摄像头 TEST-MI-001',
          streamUrl: 'https://stream.example.com/xiaomi/001',
          accessToken: 'token-123',
        }),
      });

      const device = await cameraManager.connectXiaomi('TEST-MI-001');

      expect(device).toHaveProperty('id');
      expect(device.brand).toBe('xiaomi');
      expect(device.model).toBe('TEST-MI-001');
      expect(device.status).toBe('online');
      expect(device.streamUrl).toBeDefined();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('应该重新连接已存在的设备', async () => {
      // First connect
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'cam-xiaomi-002',
          name: '小米摄像头 MJSXJ02CM',
          streamUrl: 'https://stream.example.com/xiaomi/002',
        }),
      });
      const first = await cameraManager.connectXiaomi('MJSXJ02CM');

      // Reconnect same device code - should find existing device
      const second = await cameraManager.connectXiaomi('MJSXJ02CM');
      expect(second.status).toBe('online');
      expect(second.id).toBe(first.id);
    });
  });

  describe('connectHuawei - 连接华为设备', () => {
    it('应该通过API连接新的华为设备', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'cam-huawei-001',
          name: '华为摄像头 TEST-HW-001',
          streamUrl: 'https://stream.example.com/huawei/001',
        }),
      });

      const device = await cameraManager.connectHuawei('TEST-HW-001');

      expect(device).toHaveProperty('id');
      expect(device.brand).toBe('huawei');
      expect(device.model).toBe('TEST-HW-001');
      expect(device.status).toBe('online');
    });
  });

  describe('connectHonor - 连接荣耀设备', () => {
    it('应该通过API连接新的荣耀设备', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'cam-honor-001',
          name: '荣耀摄像头 TEST-HONOR-001',
          streamUrl: 'https://stream.example.com/honor/001',
        }),
      });

      const device = await cameraManager.connectHonor('TEST-HONOR-001');

      expect(device).toHaveProperty('id');
      expect(device.brand).toBe('honor');
      expect(device.model).toBe('TEST-HONOR-001');
      expect(device.status).toBe('online');
    });
  });

  describe('connectHikvision - 连接海康威视IP摄像头', () => {
    it('应该连接海康威视IP摄像头', async () => {
      const device = await cameraManager.connectHikvision('192.168.1.100', 'admin', 'password123');

      expect(device).toHaveProperty('id');
      expect(device.brand).toBe('hikvision');
      expect(device.status).toBe('online');
      expect(device.ipAddress).toBe('192.168.1.100');
      expect(device.streamUrl).toContain('hls');
    });
  });

  describe('connectRing - 连接Ring云账号摄像头', () => {
    it('应该通过API连接Ring设备', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'cam-ring-001',
          name: 'Ring Doorbell',
          streamUrl: 'https://stream.example.com/ring/001',
          accessToken: 'ring-token',
        }),
      });

      const device = await cameraManager.connectRing('account-123');

      expect(device).toHaveProperty('id');
      expect(device.brand).toBe('ring');
      expect(device.status).toBe('online');
    });
  });

  describe('removeDevice - 删除设备', () => {
    it('应该成功删除存在的设备', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'cam-del-001',
          name: '小米摄像头 DEL-001',
          streamUrl: 'https://stream.example.com/del/001',
        }),
      });

      const device = await cameraManager.connectXiaomi('DEL-001');
      const result = await cameraManager.removeDevice(device.id);

      expect(result).toBe(true);

      const found = await cameraManager.getDeviceById(device.id);
      expect(found).toBeNull();
    });

    it('删除不存在的设备应该返回false', async () => {
      const result = await cameraManager.removeDevice('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('getCapability - 获取设备能力', () => {
    it('应该返回小米设备的能力', async () => {
      const capability = await cameraManager.getCapability('xiaomi');

      expect(capability.brand).toBe('xiaomi');
      expect(capability.supports1080p).toBe(true);
      expect(capability.supportsAudio).toBe(true);
      expect(capability.maxResolution).toBe('1920x1080');
    });

    it('应该返回华为设备的能力', async () => {
      const capability = await cameraManager.getCapability('huawei');

      expect(capability.brand).toBe('huawei');
      expect(capability.maxResolution).toBe('2560x1440');
    });

    it('未知品牌应该返回默认能力', async () => {
      const capability = await cameraManager.getCapability('unknown');

      expect(capability.brand).toBe('xiaomi');
    });
  });

  describe('pairDevice - 配对设备', () => {
    it('应该配对小米设备（code品牌）', async () => {
      // pairDevice calls fetch twice: once for bind, once for connectCodeCamera
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          id: 'cam-pair-xiaomi',
          name: '小米摄像头 PAIR-MI-001',
          streamUrl: 'https://stream.example.com/pair/xiaomi',
        }),
      });

      const progressCallback = vi.fn();
      const device = await cameraManager.pairDevice(
        { brand: 'xiaomi', deviceCode: 'PAIR-MI-001' },
        progressCallback,
      );

      expect(device).toHaveProperty('id');
      expect(device.status).toBe('online');
      expect(progressCallback).toHaveBeenCalled();
    });

    it('应该配对海康威视设备（IP品牌）', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          reachable: true,
          authenticated: true,
        }),
      });

      const device = await cameraManager.pairDevice({
        brand: 'hikvision',
        ipAddress: '192.168.1.200',
        port: 554,
        username: 'admin',
        password: 'pass',
      });

      expect(device.brand).toBe('hikvision');
      expect(device.status).toBe('online');
    });

    it('应该配对Ring设备（account品牌）', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          devices: [{ id: 'ring-device-1' }],
        }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'cam-ring-pair',
          name: 'Ring Doorbell',
          streamUrl: 'https://stream.example.com/ring/pair',
          accessToken: 'token-ring',
        }),
      });

      const device = await cameraManager.pairDevice({
        brand: 'ring',
        accountId: 'ring-account-1',
      });

      expect(device.brand).toBe('ring');
      expect(device.status).toBe('online');
    });

    it('不支持的品牌应该抛出错误', async () => {
      await expect(
        cameraManager.pairDevice({ brand: 'unknown' as 'xiaomi', deviceCode: 'TEST' }),
      ).rejects.toThrow();
    });
  });

  describe('updateStream - 更新流配置', () => {
    it('应该更新设备的流配置', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'cam-stream-001',
          name: '小米摄像头 STREAM-001',
          streamUrl: 'https://stream.example.com/stream/001',
        }),
      });

      const device = await cameraManager.connectXiaomi('STREAM-001');
      const result = await cameraManager.updateStream(device.id, {
        resolution: '1080p',
        audioEnabled: true,
        nightVision: 'off',
      });

      expect(result).toBe(true);
    });

    it('不存在的设备应该返回false', async () => {
      const result = await cameraManager.updateStream('non-existent', {
        resolution: '1080p',
        audioEnabled: false,
        nightVision: 'off',
      });

      expect(result).toBe(false);
    });
  });

  describe('takePhoto - 拍照', () => {
    it('应该调用capacitorBridge.takePhoto并返回路径', async () => {
      const path = await cameraManager.takePhoto();
      expect(path).toBe('/photo/test.jpg');
    });
  });

  describe('pickImage - 选图', () => {
    it('应该调用capacitorBridge.pickImage并返回路径', async () => {
      const path = await cameraManager.pickImage();
      expect(path).toBe('/photo/picked.jpg');
    });
  });

  describe('onDeviceConnection - 设备连接回调', () => {
    it('应该注册并在设备连接时触发回调', async () => {
      const callback = vi.fn();
      cameraManager.onDeviceConnection(callback);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'cam-callback-001',
          name: '小米摄像头 CALLBACK-TEST',
          streamUrl: 'https://stream.example.com/callback/001',
        }),
      });

      await cameraManager.connectXiaomi('CALLBACK-TEST');

      expect(callback).toHaveBeenCalled();
      const connectedDevice = callback.mock.calls[0][0];
      expect(connectedDevice.model).toBe('CALLBACK-TEST');
    });
  });

  describe('getStreamUrl - 获取流URL', () => {
    it('应该返回设备的流URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'cam-url-001',
          name: '小米摄像头 URL-TEST',
          streamUrl: 'https://stream.example.com/url/001',
        }),
      });

      const device = await cameraManager.connectXiaomi('URL-TEST');
      const streamUrl = cameraManager.getStreamUrl(device.id);

      expect(streamUrl).toBeDefined();
      expect(streamUrl).toBeTruthy();
    });

    it('不存在的设备应该返回undefined', () => {
      const streamUrl = cameraManager.getStreamUrl('non-existent');
      expect(streamUrl).toBeUndefined();
    });
  });
});
