// ============================================
// 设备管理服务
//
// 作者: 带娃的小陈工
// 日期: 2026-06-10
// 描述: IoT 设备管理服务，支持设备发现、
//       配网、状态管理和控制指令
// ============================================

import {
  SmartDevice,
  DeviceConfig,
  DeviceStatus,
  DeviceCommand,
  DeviceType,
  DeviceAction,
  DeviceConnectionStatus,
  DeviceDiscoveryResult,
  DevicePairingInfo,
  CommandResult,
  IoTEventListener,
  IoTEventType,
  IoTEvent,
  LaserToyStatus,
  AutoFeederStatus,
  SmartCameraStatus,
  FeederSchedule,
} from './types';
import { MQTTService, getMQTTService } from './mqttService';

/**
 * 生成唯一ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 设备管理器配置
 */
interface DeviceManagerConfig {
  // MQTT 代理服务器地址
  brokerUrl: string;
  // 端口号
  port: number;
  // 是否使用 SSL
  useSSL: boolean;
  // API 基础 URL
  apiBaseUrl?: string;
  // 发现超时时间 (毫秒)
  discoveryTimeout?: number;
}

/**
 * 设备管理服务类
 */
export class DeviceManager {
  // 配置
  private config: DeviceManagerConfig;
  // MQTT 服务实例
  private mqttService: MQTTService;
  // 已注册的设备
  private devices: Map<string, SmartDevice> = new Map();
  // 事件监听器
  private eventListeners: Set<IoTEventListener> = new Set();
  // 状态更新定时器
  private statusUpdateTimers: Map<string, ReturnType<typeof setInterval>> = new Map();
  // 配网状态
  private pairingInfo: Map<string, DevicePairingInfo> = new Map();

  constructor(config: DeviceManagerConfig) {
    this.config = config;
    this.mqttService = getMQTTService({
      brokerUrl: config.brokerUrl,
      port: config.port,
      useSSL: config.useSSL,
    });

    // 监听 MQTT 事件
    this.mqttService.addEventListener(this.handleMQTTEvent.bind(this));
  }

  /**
   * 发现设备
   * 扫描局域网内的 IoT 设备
   */
  async discoverDevices(): Promise<SmartDevice[]> {
    const startTime = Date.now();
    const timeout = this.config.discoveryTimeout || 10000;

    return new Promise((resolve, reject) => {
      // 模拟设备发现（实际应通过 UDP 广播或 mDNS 发现）
      const discoveredDevices: SmartDevice[] = [];

      // 设置超时
      const timer = setTimeout(() => {
        const duration = Date.now() - startTime;
        
        this.emitEvent({
          type: IoTEventType.DEVICE_DISCOVERED,
          data: {
            devices: discoveredDevices,
            scanDuration: duration,
            isComplete: true,
          } as DeviceDiscoveryResult,
          timestamp: new Date(),
        });
        
        resolve(discoveredDevices);
      }, timeout);

      // 模拟发现过程
      // 实际实现中，这里应该：
      // 1. 发送 UDP 广播消息
      // 2. 监听设备响应
      // 3. 解析设备信息
      
      // 模拟发现的设备（演示用）
      const mockDevices = this.getMockDevices();
      mockDevices.forEach(device => {
        discoveredDevices.push(device);
        this.devices.set(device.id, device);
      });

      // 清除超时定时器并立即返回
      clearTimeout(timer);
      resolve(discoveredDevices);
    });
  }

  /**
   * 注册设备
   * 将新设备添加到系统中
   */
  async registerDevice(deviceConfig: DeviceConfig): Promise<SmartDevice> {
    // 验证配置
    if (!deviceConfig.deviceId) {
      throw new Error('设备 ID 不能为空');
    }

    // 检查设备是否已存在
    if (this.devices.has(deviceConfig.deviceId)) {
      throw new Error('设备已注册');
    }

    // 创建设备对象
    const device: SmartDevice = {
      id: deviceConfig.deviceId,
      name: `新设备 ${deviceConfig.deviceId.slice(-4)}`,
      type: DeviceType.ENVIRONMENT_SENSOR, // 默认类型
      status: {
        deviceId: deviceConfig.deviceId,
        connectionStatus: DeviceConnectionStatus.CONNECTING,
        isOnline: false,
        lastSeen: new Date(),
      },
      config: deviceConfig,
      capabilities: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 连接到设备
    try {
      await this.mqttService.connect(deviceConfig.deviceId);
      device.status.connectionStatus = DeviceConnectionStatus.ONLINE;
      device.status.isOnline = true;
      device.status.lastSeen = new Date();
    } catch (error) {
      device.status.connectionStatus = DeviceConnectionStatus.ERROR;
      device.status.errorMessage = error instanceof Error ? error.message : '连接失败';
    }

    // 保存设备
    this.devices.set(device.id, device);

    // 启动状态更新
    this.startStatusUpdates(device.id);

    // 触发事件
    this.emitEvent({
      type: IoTEventType.DEVICE_CONNECTED,
      data: { device },
      timestamp: new Date(),
    });

    return device;
  }

  /**
   * 发送指令到设备
   */
  async sendCommand(
    deviceId: string,
    action: string,
    params?: Record<string, unknown>
  ): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error('设备未找到');
    }

    if (!device.status.isOnline) {
      throw new Error('设备离线');
    }

    // 创建指令
    const command: DeviceCommand = {
      commandId: generateId(),
      deviceId,
      action: action as DeviceAction,
      params,
      timestamp: new Date(),
      timeout: 30000,
      priority: 'normal',
    };

    // 发送指令
    await this.mqttService.publish(deviceId, command);

    // 触发事件
    this.emitEvent({
      type: IoTEventType.COMMAND_SENT,
      data: { deviceId, action, params },
      timestamp: new Date(),
    });
  }

  /**
   * 获取设备状态
   */
  async getDeviceStatus(deviceId: string): Promise<DeviceStatus> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error('设备未找到');
    }

    // 从缓存获取状态
    const cachedStatus = this.mqttService.getDeviceStatus(deviceId);
    if (cachedStatus) {
      device.status = { ...device.status, ...cachedStatus };
    }

    return device.status;
  }

  /**
   * 获取所有设备
   */
  getAllDevices(): SmartDevice[] {
    return Array.from(this.devices.values());
  }

  /**
   * 获取设备
   */
  getDevice(deviceId: string): SmartDevice | undefined {
    return this.devices.get(deviceId);
  }

  /**
   * 移除设备
   */
  async removeDevice(deviceId: string): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device) {
      return;
    }

    // 停止状态更新
    this.stopStatusUpdates(deviceId);

    // 断开连接
    this.mqttService.disconnect(deviceId);

    // 移除设备
    this.devices.delete(deviceId);

    // 触发事件
    this.emitEvent({
      type: IoTEventType.DEVICE_DISCONNECTED,
      data: { deviceId },
      timestamp: new Date(),
    });
  }

  /**
   * 更新设备信息
   */
  async updateDevice(deviceId: string, updates: Partial<SmartDevice>): Promise<SmartDevice> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error('设备未找到');
    }

    // 更新设备信息
    const updatedDevice: SmartDevice = {
      ...device,
      ...updates,
      id: device.id, // 防止 ID 被修改
      updatedAt: new Date(),
    };

    this.devices.set(deviceId, updatedDevice);

    return updatedDevice;
  }

  // ============== 设备特定控制方法 ==============

  /**
   * 控制激光逗宠器
   */
  async controlLaserToy(
    deviceId: string,
    action: 'start' | 'stop' | 'setPattern' | 'setSpeed',
    params?: {
      pattern?: 'random' | 'circle' | 'figure8' | 'custom';
      speed?: number;
      duration?: number;
    }
  ): Promise<void> {
    const actionMap: Record<string, DeviceAction> = {
      start: DeviceAction.LASER_START,
      stop: DeviceAction.LASER_STOP,
      setPattern: DeviceAction.LASER_SET_PATTERN,
      setSpeed: DeviceAction.LASER_SET_SPEED,
    };

    await this.sendCommand(deviceId, actionMap[action], params);
  }

  /**
   * 控制自动喂食器
   */
  async controlFeeder(
    deviceId: string,
    action: 'dispense' | 'setSchedule' | 'setPortion' | 'getStatus',
    params?: {
      portion?: number;
      schedule?: FeederSchedule;
    }
  ): Promise<void> {
    const actionMap: Record<string, DeviceAction> = {
      dispense: DeviceAction.FEEDER_DISPENSE,
      setSchedule: DeviceAction.FEEDER_SET_SCHEDULE,
      setPortion: DeviceAction.FEEDER_SET_PORTION,
      getStatus: DeviceAction.FEEDER_GET_STATUS,
    };

    await this.sendCommand(deviceId, actionMap[action], params);
  }

  /**
   * 控制智能摄像头
   */
  async controlCamera(
    deviceId: string,
    action: 'startStream' | 'stopStream' | 'takePhoto' | 'ptz' | 'setNightVision' | 'setMotionDetect',
    params?: {
      pan?: number;
      tilt?: number;
      zoom?: number;
      enabled?: boolean;
    }
  ): Promise<void> {
    const actionMap: Record<string, DeviceAction> = {
      startStream: DeviceAction.CAMERA_START_STREAM,
      stopStream: DeviceAction.CAMERA_STOP_STREAM,
      takePhoto: DeviceAction.CAMERA_TAKE_PHOTO,
      ptz: DeviceAction.CAMERA_PTZ,
      setNightVision: DeviceAction.CAMERA_SET_NIGHT_VISION,
      setMotionDetect: DeviceAction.CAMERA_SET_MOTION_DETECT,
    };

    await this.sendCommand(deviceId, actionMap[action], params);
  }

  /**
   * 重启设备
   */
  async rebootDevice(deviceId: string): Promise<void> {
    await this.sendCommand(deviceId, DeviceAction.DEVICE_REBOOT);
  }

  /**
   * 重置设备
   */
  async resetDevice(deviceId: string): Promise<void> {
    await this.sendCommand(deviceId, DeviceAction.DEVICE_RESET);
  }

  // ============== 配网相关方法 ==============

  /**
   * 开始配网
   */
  async startPairing(deviceType: DeviceType): Promise<DevicePairingInfo> {
    const pairingId = generateId();
    
    const info: DevicePairingInfo = {
      deviceId: pairingId,
      deviceName: `新${this.getDeviceTypeName(deviceType)}`,
      deviceType,
      pairingMode: 'wifi',
      status: 'searching',
      progress: 0,
    };

    this.pairingInfo.set(pairingId, info);

    // 模拟配网过程
    this.simulatePairing(pairingId);

    return info;
  }

  /**
   * 获取配网状态
   */
  getPairingStatus(pairingId: string): DevicePairingInfo | undefined {
    return this.pairingInfo.get(pairingId);
  }

  /**
   * 取消配网
   */
  async cancelPairing(pairingId: string): Promise<void> {
    this.pairingInfo.delete(pairingId);
  }

  // ============== 事件监听 ==============

  /**
   * 添加事件监听器
   */
  addEventListener(listener: IoTEventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  // ============== 私有方法 ==============

  /**
   * 处理 MQTT 事件
   */
  private handleMQTTEvent(event: IoTEvent): void {
    // 转发事件到设备管理器的事件系统
    this.emitEvent(event);

    // 处理状态更新
    if (event.type === IoTEventType.DEVICE_STATUS_UPDATE) {
      const { deviceId, status } = event.data as { deviceId: string; status: DeviceStatus };
      const device = this.devices.get(deviceId);
      if (device) {
        device.status = { ...device.status, ...status };
        device.status.lastSeen = new Date();
      }
    }
  }

  /**
   * 触发事件
   */
  private emitEvent(event: IoTEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('事件监听器错误:', error);
      }
    });
  }

  /**
   * 启动状态更新
   */
  private startStatusUpdates(deviceId: string): void {
    // 避免重复启动
    if (this.statusUpdateTimers.has(deviceId)) {
      return;
    }

    // 定期请求状态更新
    const timer = setInterval(async () => {
      const device = this.devices.get(deviceId);
      if (!device || !device.status.isOnline) {
        this.stopStatusUpdates(deviceId);
        return;
      }

      try {
        await this.sendCommand(deviceId, DeviceAction.DEVICE_GET_STATUS);
      } catch (error) {
        console.error('获取设备状态失败:', error);
      }
    }, 30000); // 每 30 秒更新一次

    this.statusUpdateTimers.set(deviceId, timer);
  }

  /**
   * 停止状态更新
   */
  private stopStatusUpdates(deviceId: string): void {
    const timer = this.statusUpdateTimers.get(deviceId);
    if (timer) {
      clearInterval(timer);
      this.statusUpdateTimers.delete(deviceId);
    }
  }

  /**
   * 获取设备类型名称
   */
  private getDeviceTypeName(type: DeviceType): string {
    const names: Record<DeviceType, string> = {
      [DeviceType.LASER_TOY]: '激光逗宠器',
      [DeviceType.AUTO_FEEDER]: '自动喂食器',
      [DeviceType.SMART_CAMERA]: '智能摄像头',
      [DeviceType.SMART_WATER_DISPENSER]: '智能饮水机',
      [DeviceType.SMART_LITTER_BOX]: '智能猫砂盆',
      [DeviceType.ENVIRONMENT_SENSOR]: '环境传感器',
      [DeviceType.SMART_DOOR_LOCK]: '智能门锁',
      [DeviceType.PET_TRACKER]: '宠物追踪器',
    };
    return names[type] || '设备';
  }

  /**
   * 模拟配网过程
   */
  private simulatePairing(pairingId: string): void {
    const info = this.pairingInfo.get(pairingId);
    if (!info) return;

    // 模拟配网进度
    const progressSteps = [10, 30, 50, 70, 90, 100];
    const statusSteps: DevicePairingInfo['status'][] = [
      'searching',
      'found',
      'connecting',
      'connecting',
      'connected',
      'connected',
    ];

    let step = 0;
    const interval = setInterval(() => {
      if (step >= progressSteps.length) {
        clearInterval(interval);
        return;
      }

      const currentInfo = this.pairingInfo.get(pairingId);
      if (!currentInfo) {
        clearInterval(interval);
        return;
      }

      currentInfo.progress = progressSteps[step];
      currentInfo.status = statusSteps[step];
      this.pairingInfo.set(pairingId, { ...currentInfo });

      step++;
    }, 1500);
  }

  /**
   * 获取模拟设备（演示用）
   */
  private getMockDevices(): SmartDevice[] {
    const now = new Date();
    
    return [
      {
        id: 'laser-toy-001',
        name: '客厅激光逗猫器',
        type: DeviceType.LASER_TOY,
        model: 'PT-L100',
        manufacturer: 'PawTech',
        status: {
          deviceId: 'laser-toy-001',
          connectionStatus: DeviceConnectionStatus.ONLINE,
          isOnline: true,
          batteryLevel: 85,
          signalStrength: 92,
          lastSeen: now,
          firmwareVersion: '1.2.3',
        } as LaserToyStatus,
        config: {
          deviceId: 'laser-toy-001',
          mqttTopic: 'device/laser-toy-001',
        },
        capabilities: [
          { name: 'laser_control', description: '激光控制', available: true },
          { name: 'pattern_mode', description: '模式选择', available: true },
          { name: 'speed_control', description: '速度控制', available: true },
          { name: 'timer', description: '定时功能', available: true },
        ],
        room: '客厅',
        isFavorite: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'feeder-001',
        name: '智能喂食器',
        type: DeviceType.AUTO_FEEDER,
        model: 'PT-F200',
        manufacturer: 'PawTech',
        status: {
          deviceId: 'feeder-001',
          connectionStatus: DeviceConnectionStatus.ONLINE,
          isOnline: true,
          signalStrength: 88,
          lastSeen: now,
          firmwareVersion: '2.0.1',
        } as AutoFeederStatus,
        config: {
          deviceId: 'feeder-001',
          mqttTopic: 'device/feeder-001',
        },
        capabilities: [
          { name: 'dispense', description: '手动喂食', available: true },
          { name: 'schedule', description: '定时喂食', available: true },
          { name: 'portion_control', description: '份量控制', available: true },
          { name: 'food_level', description: '余量监测', available: true },
        ],
        room: '厨房',
        isFavorite: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'camera-001',
        name: '宠物监控摄像头',
        type: DeviceType.SMART_CAMERA,
        model: 'PT-C300',
        manufacturer: 'PawTech',
        status: {
          deviceId: 'camera-001',
          connectionStatus: DeviceConnectionStatus.ONLINE,
          isOnline: true,
          signalStrength: 95,
          lastSeen: now,
          firmwareVersion: '3.1.0',
        } as SmartCameraStatus,
        config: {
          deviceId: 'camera-001',
          mqttTopic: 'device/camera-001',
        },
        capabilities: [
          { name: 'live_stream', description: '实时视频', available: true },
          { name: 'ptz', description: '云台控制', available: true },
          { name: 'night_vision', description: '夜视功能', available: true },
          { name: 'motion_detect', description: '移动侦测', available: true },
          { name: 'two_way_audio', description: '双向语音', available: true },
        ],
        room: '客厅',
        isFavorite: true,
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    // 停止所有状态更新
    this.statusUpdateTimers.forEach((timer) => {
      clearInterval(timer);
    });
    this.statusUpdateTimers.clear();

    // 断开所有设备
    this.devices.forEach((_, deviceId) => {
      this.mqttService.disconnect(deviceId);
    });

    // 清空设备列表
    this.devices.clear();
    this.eventListeners.clear();
    this.pairingInfo.clear();
  }
}

/**
 * 创建设备管理器实例
 */
export function createDeviceManager(config: DeviceManagerConfig): DeviceManager {
  return new DeviceManager(config);
}

/**
 * 默认设备管理器实例
 */
let defaultDeviceManager: DeviceManager | null = null;

/**
 * 获取默认设备管理器实例
 */
export function getDeviceManager(config?: DeviceManagerConfig): DeviceManager {
  if (!defaultDeviceManager && config) {
    defaultDeviceManager = new DeviceManager(config);
  }
  if (!defaultDeviceManager) {
    throw new Error('设备管理器未初始化，请提供配置');
  }
  return defaultDeviceManager;
}

/**
 * 重置设备管理器实例
 */
export function resetDeviceManager(): void {
  if (defaultDeviceManager) {
    defaultDeviceManager.destroy();
    defaultDeviceManager = null;
  }
}