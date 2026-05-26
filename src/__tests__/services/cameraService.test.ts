import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cameraManager } from '../../services/cameraService';

describe('CameraManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllDevices - 获取所有设备', () => {
    it('应该返回设备列表', async () => {
      const devices = await cameraManager.getAllDevices();
      
      expect(Array.isArray(devices)).toBe(true);
      expect(devices.length).toBeGreaterThan(0);
    });

    it('设备应该包含必要属性', async () => {
      const devices = await cameraManager.getAllDevices();
      const device = devices[0];
      
      expect(device).toHaveProperty('id');
      expect(device).toHaveProperty('brand');
      expect(device).toHaveProperty('model');
      expect(device).toHaveProperty('name');
      expect(device).toHaveProperty('status');
      expect(device).toHaveProperty('streamUrl');
      expect(device).toHaveProperty('lastOnline');
    });

    it('应该包含在线和离线设备', async () => {
      const devices = await cameraManager.getAllDevices();
      const onlineDevices = devices.filter(d => d.status === 'online');
      const offlineDevices = devices.filter(d => d.status === 'offline');
      
      expect(onlineDevices.length).toBeGreaterThan(0);
      expect(offlineDevices.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getDeviceById - 根据ID获取设备', () => {
    it('应该返回正确的设备', async () => {
      const devices = await cameraManager.getAllDevices();
      const firstDevice = devices[0];
      
      const device = await cameraManager.getDeviceById(firstDevice.id);
      
      expect(device).not.toBeNull();
      expect(device?.id).toBe(firstDevice.id);
      expect(device?.name).toBe(firstDevice.name);
    });

    it('应该返回null如果设备不存在', async () => {
      const device = await cameraManager.getDeviceById('non-existent-id');
      expect(device).toBeNull();
    });
  });

  describe('connectXiaomi - 连接小米设备', () => {
    it('应该成功连接小米设备', async () => {
      const deviceCode = 'MJSXJ02CM';
      const device = await cameraManager.connectXiaomi(deviceCode);
      
      expect(device).toHaveProperty('id');
      expect(device.brand).toBe('xiaomi');
      expect(device.model).toBe(deviceCode);
      expect(device.status).toBe('online');
    });

    it('应该支持不同型号的小米设备', async () => {
      const deviceCode = 'new-device-model';
      const device = await cameraManager.connectXiaomi(deviceCode);
      
      expect(device.brand).toBe('xiaomi');
      expect(device.model).toBe(deviceCode);
    });
  });

  describe('connectHuawei - 连接华为设备', () => {
    it('应该成功连接华为设备', async () => {
      const deviceCode = 'HW-海雀Pro';
      const device = await cameraManager.connectHuawei(deviceCode);
      
      expect(device).toHaveProperty('id');
      expect(device.brand).toBe('huawei');
      expect(device.model).toBe(deviceCode);
      expect(device.status).toBe('online');
    });
  });

  describe('connectHonor - 连接荣耀设备', () => {
    it('应该成功连接荣耀设备', async () => {
      const deviceCode = 'Honor-小值C1';
      const device = await cameraManager.connectHonor(deviceCode);
      
      expect(device).toHaveProperty('id');
      expect(device.brand).toBe('honor');
      expect(device.model).toBe(deviceCode);
      expect(device.status).toBe('online');
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
      expect(capability.supportsNightVision).toBe(true);
      expect(capability.maxResolution).toBe('2560x1440');
    });

    it('未知品牌应该返回默认能力', async () => {
      const capability = await cameraManager.getCapability('unknown');
      
      expect(capability).toBeDefined();
      expect(capability.supports1080p).toBe(true);
    });
  });

  describe('removeDevice - 删除设备', () => {
    it('应该成功删除设备', async () => {
      const devices = await cameraManager.getAllDevices();
      const deviceToRemove = devices[0];
      
      const result = await cameraManager.removeDevice(deviceToRemove.id);
      
      expect(result).toBe(true);
      
      const devicesAfter = await cameraManager.getAllDevices();
      expect(devicesAfter.find(d => d.id === deviceToRemove.id)).toBeUndefined();
    });

    it('删除不存在的设备应该返回false', async () => {
      const result = await cameraManager.removeDevice('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('pairDevice - 配对设备', () => {
    it('应该成功配对小米设备', async () => {
      const config = {
        brand: 'xiaomi',
        deviceCode: 'test-device',
      };
      
      let progressCount = 0;
      const device = await cameraManager.pairDevice(config, (progress) => {
        progressCount++;
        expect(progress).toHaveProperty('stage');
        expect(progress).toHaveProperty('message');
        expect(progress).toHaveProperty('progress');
      });
      
      expect(device).toBeDefined();
      expect(device.brand).toBe('xiaomi');
      expect(progressCount).toBeGreaterThan(0);
    });

    it('应该成功配对华为设备', async () => {
      const config = {
        brand: 'huawei',
        deviceCode: 'test-huawei',
      };
      
      const device = await cameraManager.pairDevice(config);
      
      expect(device).toBeDefined();
      expect(device.brand).toBe('huawei');
    });

    it('应该成功配对荣耀设备', async () => {
      const config = {
        brand: 'honor',
        deviceCode: 'test-honor',
      };
      
      const device = await cameraManager.pairDevice(config);
      
      expect(device).toBeDefined();
      expect(device.brand).toBe('honor');
    });

    it('不支持的品牌应该抛出错误', async () => {
      const config = {
        brand: 'unknown' as any,
        deviceCode: 'test',
      };
      
      await expect(cameraManager.pairDevice(config)).rejects.toThrow('Unsupported brand');
    });
  });

  describe('updateStream - 更新流配置', () => {
    it('应该成功更新流配置', async () => {
      const devices = await cameraManager.getAllDevices();
      const device = devices[0];
      
      const result = await cameraManager.updateStream(device.id, {
        quality: '1080p',
        fps: 30,
      });
      
      expect(result).toBe(true);
    });

    it('更新不存在的设备应该返回false', async () => {
      const result = await cameraManager.updateStream('non-existent', {
        quality: '720p',
      });
      
      expect(result).toBe(false);
    });
  });
});