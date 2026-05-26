import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { monitorService } from '../../services/monitorService';

describe('MonitorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('startMonitoring - 开始监控', () => {
    it('应该成功启动监控', async () => {
      const result = await monitorService.startMonitoring('cam-001', {
        quality: 'high',
        motionDetection: true,
        audioEnabled: true,
      });
      
      expect(result.isActive).toBe(true);
      expect(result.streamQuality).toBe('high');
      expect(result.eventDetection.abnormalBehavior).toBe(true);
      expect(result.eventDetection.emotionalChange).toBe(true);
      expect(result.eventDetection.dangerApproach).toBe(true);
    });

    it('应该设置正确的事件检测配置', async () => {
      const result = await monitorService.startMonitoring('cam-001', {
        quality: 'auto',
        motionDetection: false,
        audioEnabled: false,
      });
      
      expect(result.eventDetection.abnormalBehavior).toBe(false);
    });
  });

  describe('stopMonitoring - 停止监控', () => {
    it('应该成功停止监控', async () => {
      await monitorService.startMonitoring('cam-001', {
        quality: 'high',
        motionDetection: true,
        audioEnabled: true,
      });
      
      const result = await monitorService.stopMonitoring('cam-001');
      expect(result).toBe(true);
    });
  });

  describe('getMonitoringStatus - 获取监控状态', () => {
    it('应该返回监控状态', async () => {
      const status = await monitorService.getMonitoringStatus('cam-001');
      
      expect(status).toHaveProperty('isActive');
      expect(status).toHaveProperty('streamQuality');
      expect(status).toHaveProperty('isRecording');
      expect(status).toHaveProperty('eventDetection');
    });

    it('监控未启动时状态应该为false', async () => {
      const status = await monitorService.getMonitoringStatus('cam-001');
      expect(status.isActive).toBe(false);
    });

    it('监控启动后状态应该为true', async () => {
      await monitorService.startMonitoring('cam-001', {
        quality: 'high',
        motionDetection: true,
        audioEnabled: true,
      });
      
      const status = await monitorService.getMonitoringStatus('cam-001');
      expect(status.isActive).toBe(true);
    });
  });

  describe('startRecording - 开始录制', () => {
    it('应该成功开始录制', async () => {
      const session = await monitorService.startRecording('cam-001');
      
      expect(session).toHaveProperty('id');
      expect(session.cameraId).toBe('cam-001');
      expect(session.status).toBe('recording');
      expect(session).toHaveProperty('startTime');
    });
  });

  describe('stopRecording - 停止录制', () => {
    it('应该成功停止录制', async () => {
      const session = await monitorService.startRecording('cam-001');
      
      const stoppedSession = await monitorService.stopRecording(session.id);
      
      expect(stoppedSession.status).toBe('completed');
      expect(stoppedSession).toHaveProperty('endTime');
      expect(stoppedSession).toHaveProperty('duration');
      expect(stoppedSession).toHaveProperty('fileSize');
      expect(stoppedSession).toHaveProperty('fileUrl');
    });

    it('应该设置正确的录制时长', async () => {
      const session = await monitorService.startRecording('cam-001');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const stoppedSession = await monitorService.stopRecording(session.id);
      
      expect(stoppedSession.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getRecordingHistory - 获取录制历史', () => {
    it('应该返回录制历史列表', async () => {
      await monitorService.startRecording('cam-001');
      await monitorService.startRecording('cam-001');
      
      const history = await monitorService.getRecordingHistory('cam-001');
      
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
    });

    it('应该支持限制返回数量', async () => {
      const history = await monitorService.getRecordingHistory('cam-001', 1);
      
      expect(history.length).toBe(1);
    });

    it('应该按设备ID过滤', async () => {
      await monitorService.startRecording('cam-002');
      
      const history = await monitorService.getRecordingHistory('cam-001');
      
      history.forEach(session => {
        expect(session.cameraId).toBe('cam-001');
      });
    });
  });

  describe('getAllEvents - 获取所有事件', () => {
    it('应该返回事件列表', async () => {
      const events = await monitorService.getAllEvents(10);
      
      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBe(10);
    });

    it('事件应该包含正确的属性', async () => {
      const events = await monitorService.getAllEvents(1);
      const event = events[0];
      
      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('type');
      expect(event).toHaveProperty('severity');
      expect(event).toHaveProperty('description');
      expect(event).toHaveProperty('cameraId');
      expect(event).toHaveProperty('timestamp');
      expect(event).toHaveProperty('petId');
      expect(event).toHaveProperty('acknowledged');
    });

    it('事件类型应该是有效的值', async () => {
      const events = await monitorService.getAllEvents(20);
      events.forEach(event => {
        expect(['behavior', 'emotion', 'environment']).toContain(event.type);
      });
    });

    it('严重程度应该是有效的值', async () => {
      const events = await monitorService.getAllEvents(20);
      events.forEach(event => {
        expect(['info', 'warning', 'critical']).toContain(event.severity);
      });
    });
  });

  describe('acknowledgeEvent - 确认事件', () => {
    it('应该成功确认事件', async () => {
      const result = await monitorService.acknowledgeEvent('event-1');
      expect(result).toBe(true);
    });
  });

  describe('updateStreamConfig - 更新流配置', () => {
    it('应该成功更新流配置', async () => {
      const result = await monitorService.updateStreamConfig('cam-001', {
        quality: 'low',
      });
      expect(result).toBe(true);
    });
  });

  describe('onEventDetection - 事件检测回调', () => {
    it('应该注册并触发事件检测回调', async () => {
      const callback = vi.fn();
      monitorService.onEventDetection(callback);
      
      await monitorService.simulateEvent('behavior', 'info', '测试事件');
      
      expect(callback).toHaveBeenCalled();
      const event = callback.mock.calls[0][0];
      expect(event.type).toBe('behavior');
      expect(event.severity).toBe('info');
      expect(event.description).toBe('测试事件');
    });

    it('应该支持多个回调', async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      monitorService.onEventDetection(callback1);
      monitorService.onEventDetection(callback2);
      
      await monitorService.simulateEvent('emotion', 'warning', '测试事件');
      
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe('simulateEvent - 模拟事件', () => {
    it('应该创建有效的事件对象', async () => {
      const callback = vi.fn();
      monitorService.onEventDetection(callback);
      
      await monitorService.simulateEvent('environment', 'critical', '环境异常');
      
      const event = callback.mock.calls[0][0];
      
      expect(event).toHaveProperty('id');
      expect(event.type).toBe('environment');
      expect(event.severity).toBe('critical');
      expect(event.description).toBe('环境异常');
      expect(event.cameraId).toBe('cam-001');
      expect(event.petId).toBe('1');
      expect(event.acknowledged).toBe(false);
    });
  });
});