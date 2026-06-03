import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cameraManager } from '../../services/cameraService';

describe('CameraService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getAllDevices - 获取所有设备', () => {
    it('应该返回设备列表', async () => {
      const devices = await cameraManager.getAllDevices();
      expect(Array.isArray(devices)).toBe(true);
      expect(devices.length).toBeGreaterThan(0);
    });

    it('设备应该包含正确的属性', async () => {
      const devices = await cameraManager.getAllDevices();
      const device = devices[0];
      
      expect(device).toHaveProperty('id');
      expect(device).toHaveProperty('name');
      expect(device).toHaveProperty('status');
      expect(device).toHaveProperty('streamUrl');
      expect(device).toHaveProperty('brand');
      expect(device).toHaveProperty('model');
    });

    it('应该返回在线和离线设备', async () => {
      const devices = await cameraManager.getAllDevices();
      const onlineDevices = devices.filter(d => d.status === 'online');
      const offlineDevices = devices.filter(d => d.status === 'offline');
      
      expect(onlineDevices.length).toBeGreaterThan(0);
      expect(offlineDevices.length).toBeGreaterThan(0);
    });
  });

  describe('getDeviceById - 根据ID获取设备', () => {
    it('应该返回匹配的设备', async () => {
      const devices = await cameraManager.getAllDevices();
      const firstDevice = devices[0];
      
      const result = await cameraManager.getDeviceById(firstDevice.id);
      expect(result).not.toBeNull();
      expect(result?.id).toBe(firstDevice.id);
    });

    it('不存在的设备ID应该返回null', async () => {
      const result = await cameraManager.getDeviceById('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('connectXiaomi - 连接小米设备', () => {
    it('应该连接新的小米设备', async () => {
      vi.useFakeTimers();
      const deviceCode = 'TEST-MI-001';
      const promise = cameraManager.connectXiaomi(deviceCode);
      vi.advanceTimersByTime(800);
      const device = await promise;
      vi.useRealTimers();
      
      expect(device).toHaveProperty('id');
      expect(device.brand).toBe('xiaomi');
      expect(device.model).toBe(deviceCode);
      expect(device.status).toBe('online');
    });

    it('应该重新连接已存在的设备', async () => {
      vi.useFakeTimers();
      const deviceCode = 'MJSXJ02CM';
      const promise = cameraManager.connectXiaomi(deviceCode);
      vi.advanceTimersByTime(800);
      const device = await promise;
      vi.useRealTimers();
      
      expect(device.status).toBe('online');
      expect(device.name).toBe('客厅摄像头');
    });
  });

  describe('connectHuawei - 连接华为设备', () => {
    it('应该连接新的华为设备', async () => {
      vi.useFakeTimers();
      const deviceCode = 'TEST-HW-001';
      const promise = cameraManager.connectHuawei(deviceCode);
      vi.advanceTimersByTime(800);
      const device = await promise;
      vi.useRealTimers();
      
      expect(device).toHaveProperty('id');
      expect(device.brand).toBe('huawei');
      expect(device.model).toBe(deviceCode);
      expect(device.status).toBe('online');
    });
  });

  describe('connectHonor - 连接荣耀设备', () => {
    it('应该连接新的荣耀设备', async () => {
      vi.useFakeTimers();
      const deviceCode = 'TEST-HONOR-001';
      const promise = cameraManager.connectHonor(deviceCode);
      vi.advanceTimersByTime(800);
      const device = await promise;
      vi.useRealTimers();
      
      expect(device).toHaveProperty('id');
      expect(device.brand).toBe('honor');
      expect(device.model).toBe(deviceCode);
      expect(device.status).toBe('online');
    });
  });

  describe('removeDevice - 删除设备', () => {
    it('应该成功删除存在的设备', async () => {
      const devicesBefore = await cameraManager.getAllDevices();
      const deviceToRemove = devicesBefore[0];
      
      vi.useFakeTimers();
      const promise = cameraManager.removeDevice(deviceToRemove.id);
      vi.advanceTimersByTime(500);
      const result = await promise;
      vi.useRealTimers();
      
      expect(result).toBe(true);
      
      const devicesAfter = await cameraManager.getAllDevices();
      expect(devicesAfter.find(d => d.id === deviceToRemove.id)).toBeUndefined();
    });

    it('删除不存在的设备应该返回false', async () => {
      vi.useFakeTimers();
      const promise = cameraManager.removeDevice('non-existent-id');
      vi.advanceTimersByTime(500);
      const result = await promise;
      vi.useRealTimers();
      
      expect(result).toBe(false);
    });
  });

  describe('getCapability - 获取设备能力', () => {
    it('应该返回小米设备的能力', async () => {
      vi.useFakeTimers();
      const promise = cameraManager.getCapability('xiaomi');
      vi.advanceTimersByTime(200);
      const capability = await promise;
      vi.useRealTimers();
      
      expect(capability.brand).toBe('xiaomi');
      expect(capability.supports1080p).toBe(true);
      expect(capability.supportsAudio).toBe(true);
      expect(capability.maxResolution).toBe('1920x1080');
    });

    it('应该返回华为设备的能力', async () => {
      vi.useFakeTimers();
      const promise = cameraManager.getCapability('huawei');
      vi.advanceTimersByTime(200);
      const capability = await promise;
      vi.useRealTimers();
      
      expect(capability.brand).toBe('huawei');
      expect(capability.maxResolution).toBe('2560x1440');
    });

    it('未知品牌应该返回默认能力', async () => {
      vi.useFakeTimers();
      const promise = cameraManager.getCapability('unknown');
      vi.advanceTimersByTime(200);
      const capability = await promise;
      vi.useRealTimers();
      
      expect(capability.brand).toBe('xiaomi');
    });
  });

  describe('pairDevice - 配对设备', () => {
    it('应该配对小米设备', async () => {
      const progressCallback = vi.fn();
      const device = await cameraManager.pairDevice(
        { brand: 'xiaomi', deviceCode: 'PAIR-MI-001' },
        progressCallback
      );
      
      expect(device).toHaveProperty('id');
      expect(device.status).toBe('online');
      expect(progressCallback).toHaveBeenCalledTimes(4);
    });

    it('应该配对华为设备', async () => {
      const device = await cameraManager.pairDevice({ 
        brand: 'huawei', 
        deviceCode: 'PAIR-HW-001' 
      });
      
      expect(device.brand).toBe('huawei');
      expect(device.status).toBe('online');
    });

    it('不支持的品牌应该抛出错误', async () => {
      await expect(
        cameraManager.pairDevice({ brand: 'unknown' as 'xiaomi', deviceCode: 'TEST' })
      ).rejects.toThrow('Unsupported brand');
    });
  });

  describe('updateStream - 更新流配置', () => {
    it('应该更新设备的流配置', async () => {
      const devices = await cameraManager.getAllDevices();
      const device = devices[0];
      
      vi.useFakeTimers();
      const promise = cameraManager.updateStream(device.id, { 
        resolution: '1080p',
        audioEnabled: true,
        nightVision: 'off' 
      });
      vi.advanceTimersByTime(300);
      const result = await promise;
      vi.useRealTimers();
      
      expect(result).toBe(true);
    });

    it('不存在的设备应该返回false', async () => {
      vi.useFakeTimers();
      const promise = cameraManager.updateStream('non-existent', { resolution: '1080p', audioEnabled: false, nightVision: 'off' });
      vi.advanceTimersByTime(300);
      const result = await promise;
      vi.useRealTimers();
      
      expect(result).toBe(false);
    });
  });

  describe('onDeviceConnection - 设备连接回调', () => {
    it('应该注册并触发连接回调', async () => {
      vi.useFakeTimers();
      const callback = vi.fn();
      cameraManager.onDeviceConnection(callback);
      
      const promise = cameraManager.connectXiaomi('CALLBACK-TEST');
      vi.advanceTimersByTime(800);
      await promise;
      vi.useRealTimers();
      
      expect(callback).toHaveBeenCalled();
      const connectedDevice = callback.mock.calls[0][0];
      expect(connectedDevice.model).toBe('CALLBACK-TEST');
    });
  });
});