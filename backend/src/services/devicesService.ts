/**
 * IoT 设备管理服务
 * MQTT/WebSocket 通信接口
 */

import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';

/**
 * 设备类型
 */
export type DeviceType = 'FEEDER' | 'WATER_DISPENSER' | 'CAMERA' | 'TOY' | 'TRACKER' | 'LITTER_BOX' | 'DOOR' | 'OTHER';

/**
 * 设备状态
 */
export type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'ERROR';

/**
 * 指令状态
 */
export type CommandStatus = 'PENDING' | 'EXECUTING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT';

/**
 * 设备注册数据
 */
export interface RegisterDeviceData {
  userId: string;
  name: string;
  deviceType: DeviceType;
  deviceId: string;
  firmwareVersion?: string;
  config?: Record<string, any>;
}

/**
 * 设备指令数据
 */
export interface SendCommandData {
  command: string;
  params?: Record<string, any>;
}

/**
 * 设备状态更新数据
 */
export interface UpdateDeviceStatusData {
  status?: DeviceStatus;
  batteryLevel?: number;
  firmwareVersion?: string;
  config?: Record<string, any>;
}

/**
 * 设备指令执行结果
 */
export interface CommandResult {
  success: boolean;
  message: string;
  data?: Record<string, any>;
}

/**
 * 智能设备数据接口
 */
export interface SmartDevice {
  id: string;
  userId: string;
  name: string;
  deviceType: DeviceType;
  deviceId: string;
  status: DeviceStatus;
  lastOnline?: Date;
  config?: Record<string, any>;
  batteryLevel?: number;
  firmwareVersion?: string;
  createdAt: Date;
  updatedAt: Date;
  commands?: DeviceCommand[];
}

/**
 * 设备指令数据接口
 */
export interface DeviceCommand {
  id: string;
  deviceId: string;
  command: string;
  params?: Record<string, any>;
  status: CommandStatus;
  result?: Record<string, any>;
  executedAt?: Date;
  createdAt: Date;
}

/**
 * 设备类型配置
 */
const DEVICE_TYPE_CONFIGS: Record<DeviceType, {
  name: string;
  supportedCommands: string[];
  defaultConfig: Record<string, any>;
}> = {
  FEEDER: {
    name: '智能喂食器',
    supportedCommands: ['feed', 'set_schedule', 'get_status', 'set_portion'],
    defaultConfig: {
      portionSize: 50, // 克
      schedule: [],
      soundEnabled: true,
    },
  },
  WATER_DISPENSER: {
    name: '智能饮水机',
    supportedCommands: ['dispense', 'set_schedule', 'get_status', 'set_temperature'],
    defaultConfig: {
      temperature: 20, // 摄氏度
      schedule: [],
      filterReminder: 30, // 天
    },
  },
  CAMERA: {
    name: '宠物摄像头',
    supportedCommands: ['start_stream', 'stop_stream', 'ptz', 'get_snapshot', 'set_motion_detect'],
    defaultConfig: {
      resolution: '1080p',
      motionDetect: true,
      nightVision: 'auto',
    },
  },
  TOY: {
    name: '智能玩具',
    supportedCommands: ['play', 'stop', 'set_mode', 'get_status'],
    defaultConfig: {
      mode: 'auto',
      duration: 10, // 分钟
      soundEnabled: true,
    },
  },
  TRACKER: {
    name: '定位追踪器',
    supportedCommands: ['get_location', 'set_geofence', 'get_history', 'set_interval'],
    defaultConfig: {
      updateInterval: 300, // 秒
      geofence: [],
      lowBatteryAlert: 20,
    },
  },
  LITTER_BOX: {
    name: '智能猫砂盆',
    supportedCommands: ['clean', 'set_schedule', 'get_status', 'reset'],
    defaultConfig: {
      autoClean: true,
      cleanDelay: 5, // 分钟
      schedule: [],
    },
  },
  DOOR: {
    name: '智能门',
    supportedCommands: ['open', 'close', 'set_schedule', 'get_status', 'set_curfew'],
    defaultConfig: {
      curfewEnabled: false,
      curfewStart: '22:00',
      curfewEnd: '06:00',
      schedule: [],
    },
  },
  OTHER: {
    name: '其他设备',
    supportedCommands: ['get_status'],
    defaultConfig: {},
  },
};

/**
 * 设备服务类
 */
export class DevicesService {
  /**
   * 解析设备数据
   * @param device 数据库设备记录
   * @returns 解析后的设备
   */
  private parseDevice(device: any): SmartDevice {
    return {
      ...device,
      deviceType: device.deviceType as DeviceType,
      status: device.status as DeviceStatus,
      config: device.config ? JSON.parse(device.config) : undefined,
    };
  }

  /**
   * 解析指令数据
   * @param command 数据库指令记录
   * @returns 解析后的指令
   */
  private parseCommand(command: any): DeviceCommand {
    return {
      ...command,
      status: command.status as CommandStatus,
      params: command.params ? JSON.parse(command.params) : undefined,
      result: command.result ? JSON.parse(command.result) : undefined,
    };
  }

  /**
   * 注册新设备
   * @param data 设备注册数据
   * @returns 创建的设备
   */
  async registerDevice(data: RegisterDeviceData): Promise<SmartDevice> {
    // 检查设备ID是否已存在
    const existingDevice = await prisma.smartDevice.findUnique({
      where: { deviceId: data.deviceId },
    });

    if (existingDevice) {
      throw new Error('设备ID已存在');
    }

    // 获取设备类型默认配置
    const typeConfig = DEVICE_TYPE_CONFIGS[data.deviceType];

    // 创建设备
    const device = await prisma.smartDevice.create({
      data: {
        userId: data.userId,
        name: data.name,
        deviceType: data.deviceType,
        deviceId: data.deviceId,
        status: 'OFFLINE',
        firmwareVersion: data.firmwareVersion,
        config: JSON.stringify({
          ...typeConfig.defaultConfig,
          ...data.config,
        }),
      },
    });

    return this.parseDevice(device);
  }

  /**
   * 获取用户的设备列表
   * @param userId 用户ID
   * @param options 查询选项
   * @returns 设备列表
   */
  async getDevicesByUserId(
    userId: string,
    options?: {
      deviceType?: DeviceType;
      status?: DeviceStatus;
    }
  ): Promise<SmartDevice[]> {
    const where: any = { userId };

    if (options?.deviceType) {
      where.deviceType = options.deviceType;
    }

    if (options?.status) {
      where.status = options.status;
    }

    const devices = await prisma.smartDevice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        commands: {
          where: { status: 'PENDING' },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return devices.map((d: any) => ({
      ...this.parseDevice(d),
      commands: d.commands?.map((c: any) => this.parseCommand(c)),
    }));
  }

  /**
   * 获取单个设备详情
   * @param deviceId 设备ID
   * @returns 设备详情
   */
  async getDeviceById(deviceId: string): Promise<SmartDevice | null> {
    const device = await prisma.smartDevice.findUnique({
      where: { id: deviceId },
      include: {
        commands: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!device) {
      return null;
    }

    return {
      ...this.parseDevice(device),
      commands: device.commands?.map((c: any) => this.parseCommand(c)),
    };
  }

  /**
   * 通过设备唯一标识获取设备
   * @param deviceId 设备唯一标识
   * @returns 设备详情
   */
  async getDeviceByDeviceId(deviceId: string): Promise<SmartDevice | null> {
    const device = await prisma.smartDevice.findUnique({
      where: { deviceId },
    });

    if (!device) {
      return null;
    }

    return this.parseDevice(device);
  }

  /**
   * 发送设备指令
   * @param deviceDbId 设备数据库ID
   * @param data 指令数据
   * @returns 创建的指令记录
   */
  async sendCommand(
    deviceDbId: string,
    data: SendCommandData
  ): Promise<DeviceCommand> {
    // 获取设备信息
    const device = await prisma.smartDevice.findUnique({
      where: { id: deviceDbId },
    });

    if (!device) {
      throw new Error('设备不存在');
    }

    // 检查设备状态
    if (device.status === 'OFFLINE') {
      throw new Error('设备离线，无法发送指令');
    }

    if (device.status === 'MAINTENANCE') {
      throw new Error('设备维护中，暂时无法发送指令');
    }

    // 检查指令是否支持
    const typeConfig = DEVICE_TYPE_CONFIGS[device.deviceType as DeviceType];
    if (!typeConfig.supportedCommands.includes(data.command)) {
      throw new Error(`设备不支持该指令: ${data.command}`);
    }

    // 创建指令记录
    const command = await prisma.deviceCommand.create({
      data: {
        deviceId: deviceDbId,
        command: data.command,
        params: data.params ? JSON.stringify(data.params) : undefined,
        status: 'PENDING',
      },
    });

    // 模拟发送指令到设备（实际应通过 MQTT/WebSocket）
    this.simulateSendCommand(command.id, device, data);

    return this.parseCommand(command);
  }

  /**
   * 模拟发送指令到设备
   * 生产环境应替换为真实的 MQTT/WebSocket 通信
   * @param commandId 指令ID
   * @param device 设备信息
   * @param data 指令数据
   */
  protected async simulateSendCommand(
    commandId: string,
    device: any,
    data: SendCommandData
  ): Promise<void> {
    // 更新指令状态为执行中
    await prisma.deviceCommand.update({
      where: { id: commandId },
      data: { status: 'EXECUTING' },
    });

    // 模拟执行延迟
    setTimeout(async () => {
      try {
        // 模拟执行结果
        const result = this.simulateCommandExecution(device.deviceType as DeviceType, data);

        // 更新指令状态
        await prisma.deviceCommand.update({
          where: { id: commandId },
          data: {
            status: result.success ? 'SUCCESS' : 'FAILED',
            result: JSON.stringify(result),
            executedAt: new Date(),
          },
        });
      } catch (error) {
        console.error('指令执行失败:', error);
        await prisma.deviceCommand.update({
          where: { id: commandId },
          data: {
            status: 'FAILED',
            result: JSON.stringify({ success: false, message: '指令执行异常' }),
            executedAt: new Date(),
          },
        });
      }
    }, 1000 + Math.random() * 2000);
  }

  /**
   * 模拟指令执行
   * @param deviceType 设备类型
   * @param data 指令数据
   * @returns 执行结果
   */
  protected simulateCommandExecution(
    deviceType: DeviceType,
    data: SendCommandData
  ): CommandResult {
    // 模拟成功率 90%
    const success = Math.random() > 0.1;

    if (!success) {
      return {
        success: false,
        message: '设备响应超时',
      };
    }

    // 根据设备类型和指令返回模拟结果
    switch (deviceType) {
      case 'FEEDER':
        if (data.command === 'feed') {
          return {
            success: true,
            message: '喂食成功',
            data: { portion: data.params?.portion || 50, timestamp: new Date().toISOString() },
          };
        }
        break;

      case 'CAMERA':
        if (data.command === 'get_snapshot') {
          return {
            success: true,
            message: '快照获取成功',
            data: { imageUrl: '/uploads/snapshots/snapshot.jpg' },
          };
        }
        break;

      case 'TRACKER':
        if (data.command === 'get_location') {
          return {
            success: true,
            message: '位置获取成功',
            data: {
              latitude: 31.2304 + Math.random() * 0.01,
              longitude: 121.4737 + Math.random() * 0.01,
              accuracy: 10 + Math.random() * 5,
              timestamp: new Date().toISOString(),
            },
          };
        }
        break;

      case 'DOOR':
        if (data.command === 'open' || data.command === 'close') {
          return {
            success: true,
            message: data.command === 'open' ? '门已打开' : '门已关闭',
            data: { state: data.command === 'open' ? 'open' : 'closed' },
          };
        }
        break;
    }

    return {
      success: true,
      message: '指令执行成功',
    };
  }

  /**
   * 更新设备状态
   * @param deviceDbId 设备数据库ID
   * @param data 状态更新数据
   * @returns 更新后的设备
   */
  async updateDeviceStatus(
    deviceDbId: string,
    data: UpdateDeviceStatusData
  ): Promise<SmartDevice> {
    const device = await prisma.smartDevice.findUnique({
      where: { id: deviceDbId },
    });

    if (!device) {
      throw new Error('设备不存在');
    }

    const currentConfig = device.config ? JSON.parse(device.config) : {};

    const updatedDevice = await prisma.smartDevice.update({
      where: { id: deviceDbId },
      data: {
        status: data.status,
        batteryLevel: data.batteryLevel,
        firmwareVersion: data.firmwareVersion,
        config: data.config ? JSON.stringify({ ...currentConfig, ...data.config }) : undefined,
        lastOnline: data.status === 'ONLINE' ? new Date() : device.lastOnline,
      },
    });

    return this.parseDevice(updatedDevice);
  }

  /**
   * 删除设备
   * @param deviceDbId 设备数据库ID
   * @returns 是否成功
   */
  async deleteDevice(deviceDbId: string): Promise<boolean> {
    const device = await prisma.smartDevice.findUnique({
      where: { id: deviceDbId },
    });

    if (!device) {
      return false;
    }

    await prisma.smartDevice.delete({
      where: { id: deviceDbId },
    });

    return true;
  }

  /**
   * 获取设备指令历史
   * @param deviceDbId 设备数据库ID
   * @param options 查询选项
   * @returns 指令历史列表
   */
  async getCommandHistory(
    deviceDbId: string,
    options?: {
      status?: CommandStatus;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ commands: DeviceCommand[]; total: number }> {
    const where: any = { deviceId: deviceDbId };

    if (options?.status) {
      where.status = options.status;
    }

    const [commands, total] = await Promise.all([
      prisma.deviceCommand.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 20,
        skip: options?.offset || 0,
      }),
      prisma.deviceCommand.count({ where }),
    ]);

    return {
      commands: commands.map((c: any) => this.parseCommand(c)),
      total,
    };
  }

  /**
   * 获取设备类型配置
   * @param deviceType 设备类型
   * @returns 设备类型配置
   */
  getDeviceTypeConfig(deviceType: DeviceType) {
    return DEVICE_TYPE_CONFIGS[deviceType];
  }

  /**
   * 获取所有支持的设备类型
   * @returns 设备类型列表
   */
  getSupportedDeviceTypes() {
    return Object.entries(DEVICE_TYPE_CONFIGS).map(([type, config]) => ({
      type,
      name: config.name,
      supportedCommands: config.supportedCommands,
    }));
  }

  /**
   * 处理设备心跳
   * @param deviceId 设备唯一标识
   * @param data 心跳数据
   * @returns 更新后的设备
   */
  async handleHeartbeat(
    deviceId: string,
    data: {
      batteryLevel?: number;
      firmwareVersion?: string;
      status?: DeviceStatus;
    }
  ): Promise<SmartDevice> {
    const device = await prisma.smartDevice.findUnique({
      where: { deviceId },
    });

    if (!device) {
      throw new Error('设备未注册');
    }

    const updatedDevice = await prisma.smartDevice.update({
      where: { deviceId },
      data: {
        status: data.status || 'ONLINE',
        batteryLevel: data.batteryLevel,
        firmwareVersion: data.firmwareVersion,
        lastOnline: new Date(),
      },
    });

    return this.parseDevice(updatedDevice);
  }
}

// 导出单例实例
export const devicesService = new DevicesService();

export default DevicesService;