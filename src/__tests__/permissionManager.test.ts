import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  permissionManager,
  type PermissionType,
  type PermissionStatus,
} from '../lib/permissionManager';

vi.mock('../lib/platformService', () => ({
  platformCheck: {
    isNative: () => false,
    isAndroid: () => false,
  },
}));

vi.mock('@capacitor/camera', () => ({
  Camera: {
    checkPermissions: vi.fn(),
    requestPermissions: vi.fn(),
  },
}));

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    checkPermissions: vi.fn(),
    requestPermissions: vi.fn(),
  },
}));

vi.mock('@capacitor/geolocation', () => ({
  Geolocation: {
    checkPermissions: vi.fn(),
    requestPermissions: vi.fn(),
  },
}));

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock('@capacitor/app', () => ({
  App: {
    openUrl: vi.fn(),
  },
}));

vi.mock('@capacitor/device', () => ({
  Device: {
    getInfo: vi.fn().mockResolvedValue({ osVersion: '0' }),
  },
}));

describe('PermissionManager - 权限管理集成测试', () => {
  const manager = permissionManager;

  beforeEach(() => {
    localStorage.clear();
    manager.resetAllStates();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('初始化与状态', () => {
    it('应该初始化所有权限的默认状态', () => {
      const types: PermissionType[] = ['camera', 'microphone', 'notification', 'storage', 'location', 'biometric'];
      const states = manager.getAllPermissionStates();

      expect(states.size).toBe(6);
      types.forEach(type => {
        const state = states.get(type);
        expect(state).toBeDefined();
        expect(state?.status).toBe('unknown');
        expect(state?.canRequest).toBe(true);
        expect(state?.denialCount).toBe(0);
        expect(state?.permanentlyDenied).toBe(false);
      });
    });

    it('应该正确初始化并加载持久化状态', async () => {
      localStorage.setItem('permission_manager_state', JSON.stringify({
      camera: { status: 'granted', denialCount: 0 },
      microphone: { status: 'denied', denialCount: 2, permanentlyDenied: true },
    }));

      await manager.initialize();

      const cameraState = manager.getPermissionState('camera');
      const micState = manager.getPermissionState('microphone');

      expect(cameraState?.status).toBe('granted');
      expect(micState?.status).toBe('denied');
      expect(micState?.permanentlyDenied).toBe(true);
    });
  });

  describe('权限检查', () => {
    it('应该检查相机权限', async () => {
      const result = await manager.checkPermission('camera');
      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
      expect(['granted', 'denied', 'prompt', 'unknown']).toContain(result.status);
    });

    it('应该检查麦克风权限', async () => {
      const result = await manager.checkPermission('microphone');
      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
    });

    it('应该检查通知权限', async () => {
      const result = await manager.checkPermission('notification');
      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
    });

    it('应该检查存储权限', async () => {
      const result = await manager.checkPermission('storage');
      expect(result).toBeDefined();
      expect(result.status).toBe('granted');
    });

    it('应该检查位置权限', async () => {
      const result = await manager.checkPermission('location');
      expect(result).toBeDefined();
    });

    it('应该检查生物识别权限', async () => {
      const result = await manager.checkPermission('biometric');
      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
    });

    it('应该更新状态最后检查时间', async () => {
      const before = manager.getPermissionState('camera')?.lastCheckTime || 0;
      await manager.checkPermission('camera');
      const after = manager.getPermissionState('camera')?.lastCheckTime || 0;
      expect(after).toBeGreaterThanOrEqual(before);
    });
  });

  describe('权限请求', () => {
    it('应该请求相机权限', async () => {
      const mockGetUserMedia = vi.fn().mockRejectedValue(new DOMException('', 'NotAllowedError'));
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: mockGetUserMedia,
          enumerateDevices: vi.fn().mockResolvedValue([]),
        },
        writable: true,
      });

      const result = await manager.requestPermission('camera');
      expect(result).toBeDefined();
      expect(result.status).toBe('denied');
    });

    it('应该增加拒绝次数', async () => {
      const mockGetUserMedia = vi.fn().mockRejectedValue(new DOMException('', 'NotAllowedError'));
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: mockGetUserMedia,
          enumerateDevices: vi.fn().mockResolvedValue([]),
        },
        writable: true,
      });

      const initialCount = manager.getDenialCount('camera');
      await manager.requestPermission('camera');
      const afterCount = manager.getDenialCount('camera');
      expect(afterCount).toBe(initialCount + 1);
    });

    it('应该在两次拒绝后标记为永久拒绝', async () => {
      const mockGetUserMedia = vi.fn().mockRejectedValue(new DOMException('', 'NotAllowedError'));
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: mockGetUserMedia,
          enumerateDevices: vi.fn().mockResolvedValue([]),
        },
        writable: true,
      });

      await manager.requestPermission('camera');
      await manager.requestPermission('camera');

      expect(manager.isPermanentlyDenied('camera')).toBe(true);
    });

    it('应该阻止永久拒绝后的请求', async () => {
      manager.resetDenialCount('camera');
      const mockGetUserMedia = vi.fn().mockRejectedValue(new DOMException('', 'NotAllowedError'));
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: mockGetUserMedia,
          enumerateDevices: vi.fn().mockResolvedValue([]),
        },
        writable: true,
      });

      await manager.requestPermission('camera');
      await manager.requestPermission('camera');

      const result = await manager.requestPermission('camera');
      expect(result.status).toBe('denied');
      expect(result.canRequest).toBe(false);
    });

    it('应该正确处理权限授予', async () => {
      const mockStream = {
        getTracks: () => [{ stop: vi.fn() }],
      };
      const mockGetUserMedia = vi.fn().mockResolvedValue(mockStream);
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: mockGetUserMedia,
          enumerateDevices: vi.fn().mockResolvedValue([{ kind: 'audioinput' }]),
        },
        writable: true,
      });

      const result = await manager.requestPermission('microphone');
      expect(result.status).toBe('granted');
      expect(result.canRequest).toBe(false);
    });
  });

  describe('Rationale 配置', () => {
    it('应该获取权限的 Rationale 配置', () => {
      const rationale = manager.getRationale('camera');
      expect(rationale).toBeDefined();
      expect(rationale.title).toBeDefined();
      expect(rationale.message).toBeDefined();
      expect(rationale.whyNeeded).toBeDefined();
    });

    it('应该获取完整的权限配置', () => {
      const config = manager.getConfig('camera');
      expect(config).toBeDefined();
      expect(config.type).toBe('camera');
      expect(config.required).toBe(false);
      expect(config.description).toBeDefined();
      expect(config.rationale).toBeDefined();
      expect(config.scenarios.length).toBeGreaterThan(0);
    });

    it('应该获取所有配置', () => {
      const configs = manager.getAllConfigs();
      expect(Object.keys(configs)).toHaveLength(6);
    });

    it('应该判断是否需要显示 Rationale', () => {
      expect(manager.shouldShowRationale('camera')).toBe(false);

      manager.resetDenialCount('camera');
      const mockGetUserMedia = vi.fn().mockRejectedValue(new DOMException('', 'NotAllowedError'));
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: mockGetUserMedia,
          enumerateDevices: vi.fn().mockResolvedValue([]),
        },
        writable: true,
      });

      manager.requestPermission('camera').then(() => {
        expect(manager.shouldShowRationale('camera')).toBe(true);
      });
    });
  });

  describe('按场景请求权限', () => {
    it('应该获取场景对应的权限列表', () => {
      const cameraPermissions = manager.getPermissionsForScene('camera');
      expect(cameraPermissions).toContain('camera');

      const translatorPermissions = manager.getPermissionsForScene('translator');
      expect(translatorPermissions).toContain('microphone');
    });

    it('应该检查场景权限', async () => {
      const results = await manager.checkPermissionsForScene('camera');
      expect(results).toBeDefined();
      expect(results.camera).toBeDefined();
    });
  });

  describe('权限健康诊断', () => {
    it('应该生成健康报告', async () => {
      const report = await manager.getHealthReport();

      expect(report).toBeDefined();
      expect(report.overallStatus).toBeDefined();
      expect(['healthy', 'warning', 'critical']).toContain(report.overallStatus);
      expect(report.permissions).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.summary.total).toBe(6);
      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('应该正确统计权限状态', async () => {
      const report = await manager.getHealthReport();
      const summary = report.summary;

      expect(summary.granted + summary.denied + summary.prompt + summary.permanentlyDenied).toBeLessThanOrEqual(6);
    });

    it('应该运行自我诊断', async () => {
      const report = await manager.runSelfDiagnosis();
      expect(report).toBeDefined();
      expect(report.lastCheckTime).toBeDefined();
    });

    it('应该在永久拒绝时给出建议', async () => {
      manager.resetDenialCount('camera');
      const mockGetUserMedia = vi.fn().mockRejectedValue(new DOMException('', 'NotAllowedError'));
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: mockGetUserMedia,
          enumerateDevices: vi.fn().mockResolvedValue([]),
        },
        writable: true,
      });

      await manager.requestPermission('camera');
      await manager.requestPermission('camera');

      const report = await manager.getHealthReport();
      expect(report.overallStatus).toBe('critical');
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('状态持久化', () => {
    it('应该持久化状态到 localStorage', async () => {
      await manager.initialize();
      await manager.checkPermission('camera');

      const stored = localStorage.getItem('permission_manager_state');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.camera).toBeDefined();
    });

    it('应该重置单个权限状态', () => {
      manager.resetDenialCount('camera');
      const state = manager.getPermissionState('camera');
      expect(state?.denialCount).toBe(0);
      expect(state?.permanentlyDenied).toBe(false);
      expect(state?.canRequest).toBe(true);
    });

    it('应该重置所有状态', () => {
      manager.resetAllStates();
      const states = manager.getAllPermissionStates();
      states.forEach(state => {
        expect(state.status).toBe('unknown');
        expect(state.denialCount).toBe(0);
        expect(state.permanentlyDenied).toBe(false);
      });
    });
  });

  describe('事件回调', () => {
    it('应该注册和移除拒绝回调', async () => {
      const callback = vi.fn();
      const unsubscribe = manager.onPermissionDenied('camera', callback);

      const mockGetUserMedia = vi.fn().mockRejectedValue(new DOMException('', 'NotAllowedError'));
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: mockGetUserMedia,
          enumerateDevices: vi.fn().mockResolvedValue([]),
        },
        writable: true,
      });

      await manager.requestPermission('camera');

      expect(callback).toHaveBeenCalled();

      unsubscribe();

      callback.mockClear();
      await manager.requestPermission('camera');

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('批量操作', () => {
    it('应该检查所有权限', async () => {
      const results = await manager.checkAllPermissions();
      expect(Object.keys(results)).toHaveLength(6);
    });

    it('应该请求所有权限', async () => {
      const results = await manager.requestAllPermissions();
      expect(Object.keys(results)).toHaveLength(6);
    });
  });

  describe('Android 16 自动重置检测', () => {
    it('应该检测权限自动重置', async () => {
      const result = await manager.checkForAutoReset();
      expect(result).toBeDefined();
      expect(result.autoReset).toBe(false);
      expect(Array.isArray(result.affectedPermissions)).toBe(true);
    });
  });

  describe('状态查询', () => {
    it('应该获取单个权限状态', () => {
      const state = manager.getPermissionState('camera');
      expect(state).toBeDefined();
      expect(state?.type).toBe('camera');
    });

    it('应该获取拒绝次数', () => {
      expect(manager.getDenialCount('camera')).toBe(0);
    });

    it('应该判断是否永久拒绝', () => {
      expect(manager.isPermanentlyDenied('camera')).toBe(false);
    });
  });

  describe('ensurePermission', () => {
    it('应该确保权限', async () => {
      const result = await manager.ensurePermission('storage');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('hasPermission', () => {
    it('应该检查是否有权限', async () => {
      const result = await manager.hasPermission('storage');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('openAppSettings', () => {
    it('应该在 Web 环境返回 false', async () => {
      const result = await manager.openAppSettings();
      expect(result).toBe(false);
    });
  });

  describe('openPermissionSettings', () => {
    it('应该打开权限设置', async () => {
      const result = await manager.openPermissionSettings('camera');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('向后兼容层', () => {
    it('PermissionService.checkCameraPermission 应该可用', async () => {
      const { PermissionService } = await import('../lib/permissionManager');
      const result = await PermissionService.checkCameraPermission();
      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
    });

    it('PermissionService.requestCameraPermission 应该可用', async () => {
      const { PermissionService } = await import('../lib/permissionManager');
      const mockGetUserMedia = vi.fn().mockRejectedValue(new DOMException('', 'NotAllowedError'));
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: mockGetUserMedia,
          enumerateDevices: vi.fn().mockResolvedValue([]),
        },
        writable: true,
      });

      const result = await PermissionService.requestCameraPermission();
      expect(result).toBeDefined();
    });
  });
});
