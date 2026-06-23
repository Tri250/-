/**
 * IoT Device Service - 智能设备管理服务
 *
 * 管理智能喂食器、饮水机、激光玩具、可穿戴设备等 IoT 设备
 * 优先通过后端 API 操作，网络不可用时降级到本地 IndexedDB 缓存
 */

import { api } from '../lib/api';
import { realTimeService } from './realTimeService';
import { databaseService, STORE_NAMES } from './databaseService';

// ─── 类型定义 ────────────────────────────────────────────────

export type DeviceType = 'FEEDER' | 'FOUNTAIN' | 'LASER' | 'WEARABLE';
export type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'CONNECTING' | 'ERROR';

export interface IoTDevice {
  id: string;
  userId: string;
  name: string;
  deviceType: DeviceType;
  macAddress?: string;
  bluetoothId?: string;
  status: DeviceStatus;
  settings: Record<string, unknown>;
  lastOnline?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceSettings {
  feedingSchedule?: Array<{
    id: string;
    time: string;
    portion: number;
    enabled: boolean;
    daysOfWeek: number[];
  }>;
  portionSize?: number;
  autoFeed?: boolean;
  waterFlowRate?: number;
  waterFilterRemaining?: number;
  laserMode?: 'auto' | 'manual';
  laserDuration?: number;
  firmwareVersion?: string;
  batteryLevel?: number;
  [key: string]: unknown;
}

export interface DeviceControlCommand {
  action: 'feed' | 'water_on' | 'water_off' | 'laser_on' | 'laser_off' | 'laser_move' | 'reboot' | 'update_firmware';
  params?: {
    portion?: number;
    duration?: number;
    x?: number;
    y?: number;
    firmwareUrl?: string;
  };
}

export interface ControlResult {
  success: boolean;
  deviceId: string;
  action: string;
  params?: Record<string, unknown>;
  message: string;
  timestamp: string;
}

export interface DeviceEvent {
  id: string;
  deviceId: string;
  type: 'status_change' | 'feeding_completed' | 'water_low' | 'battery_low' | 'firmware_update' | 'error';
  data: Record<string, unknown>;
  timestamp: string;
}

// ─── IoT 设备 API ────────────────────────────────────────────

const iotApi = {
  list: () => api.get<{ devices: IoTDevice[] }>('/iot/devices'),
  add: (data: {
    name: string;
    deviceType: DeviceType;
    macAddress?: string;
    bluetoothId?: string;
    settings?: Record<string, unknown>;
  }) => api.post<{ device: IoTDevice }>('/iot/devices', data),
  updateSettings: (id: string, settings: Record<string, unknown>) =>
    api.put<{ device: IoTDevice }>(`/iot/devices/${id}/settings`, settings),
  control: (id: string, command: DeviceControlCommand) =>
    api.post<ControlResult>(`/iot/devices/${id}/control`, command),
  remove: (id: string) => api.delete(`/iot/devices/${id}`),
  // BLE 相关
  bleScan: (duration?: number) => api.post<{ devices: Array<{ bluetoothId: string; name: string; rssi: number; deviceType: DeviceType }> }>('/iot/ble/scan', { duration }),
  bleConnect: (bluetoothId: string) => api.post<{ success: boolean; deviceId: string }>('/iot/ble/connect', { bluetoothId }),
  bleDisconnect: (bluetoothId: string) => api.post<{ success: boolean }>('/iot/ble/disconnect', { bluetoothId }),
  // MQTT 相关
  mqttConnect: (broker: string, options?: Record<string, unknown>) =>
    api.post<{ success: boolean; clientId: string }>('/iot/mqtt/connect', { broker, options }),
  mqttSubscribe: (topics: string[]) =>
    api.post<{ success: boolean }>('/iot/mqtt/subscribe', { topics }),
  mqttPublish: (topic: string, message: string) =>
    api.post<{ success: boolean }>('/iot/mqtt/publish', { topic, message }),
};

// ─── WebSocket 实时数据流 ─────────────────────────────────────

const WS_IOT_BASE_URL = (() => {
  const env = import.meta.env.VITE_WS_BASE_URL;
  return env || 'ws://localhost:3000/ws';
})();

// ─── IoT 设备服务类 ──────────────────────────────────────────

class IoTDeviceService {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private deviceListeners: Array<(device: IoTDevice) => void> = [];
  private eventListeners: Array<(event: DeviceEvent) => void> = [];
  private connectionListeners: Array<(connected: boolean) => void> = [];
  private isWsConnected = false;
  private subscribedTopics: string[] = [];
  private pendingCommands: Map<string, DeviceControlCommand> = new Map();

  // ─── 初始化 ────────────────────────────────────────────────

  async initialize(): Promise<void> {
    await databaseService.init();
    this.connectWebSocket();
    console.log('[IoTDeviceService] Initialized');
  }

  // ─── 设备列表 ──────────────────────────────────────────────

  async getDevices(): Promise<IoTDevice[]> {
    try {
      const { devices } = await iotApi.list();
      // 同步到本地缓存
      await this.cacheDevices(devices);
      return devices;
    } catch (error) {
      console.warn('[IoTDeviceService] API list failed, loading from cache:', error);
      return this.loadCachedDevices();
    }
  }

  async getDeviceById(id: string): Promise<IoTDevice | null> {
    try {
      const devices = await this.getDevices();
      return devices.find((d) => d.id === id) ?? null;
    } catch {
      return databaseService.get<IoTDevice>(STORE_NAMES.CAMERA_DEVICES, id);
    }
  }

  // ─── 添加设备 ──────────────────────────────────────────────

  async addDevice(data: {
    name: string;
    deviceType: DeviceType;
    macAddress?: string;
    bluetoothId?: string;
    settings?: Record<string, unknown>;
  }): Promise<IoTDevice> {
    try {
      const { device } = await iotApi.add(data);
      await databaseService.put(STORE_NAMES.CAMERA_DEVICES, device);
      return device;
    } catch (error) {
      console.error('[IoTDeviceService] Add device failed:', error);
      throw error;
    }
  }

  // ─── 更新设备设置 ──────────────────────────────────────────

  async updateSettings(deviceId: string, settings: DeviceSettings): Promise<IoTDevice> {
    try {
      const { device } = await iotApi.updateSettings(deviceId, settings);
      await databaseService.put(STORE_NAMES.CAMERA_DEVICES, device);
      this.notifyDeviceChange(device);
      return device;
    } catch (error) {
      console.error('[IoTDeviceService] Update settings failed:', error);
      throw error;
    }
  }

  // ─── 设备控制命令 ──────────────────────────────────────────

  async controlDevice(deviceId: string, command: DeviceControlCommand): Promise<ControlResult> {
    try {
      const result = await iotApi.control(deviceId, command);

      // 如果 WebSocket 已连接，也通过实时通道发送（双通道保障）
      if (this.isWsConnected && this.ws) {
        this.ws.send(JSON.stringify({
          type: 'device_control',
          deviceId,
          command,
          timestamp: new Date().toISOString(),
        }));
      }

      // 缓存命令用于重试
      this.pendingCommands.set(deviceId, command);

      // 触发设备状态更新
      const device = await this.getDeviceById(deviceId);
      if (device) {
        device.status = 'ONLINE';
        device.lastOnline = new Date().toISOString();
        await databaseService.put(STORE_NAMES.CAMERA_DEVICES, device);
        this.notifyDeviceChange(device);
      }

      return result;
    } catch (error) {
      // 离线时通过 MQTT 发布命令（如果 MQTT 已连接）
      if (this.isWsConnected && this.ws) {
        this.ws.send(JSON.stringify({
          type: 'device_control_offline',
          deviceId,
          command,
          timestamp: new Date().toISOString(),
        }));
      }
      console.error('[IoTDeviceService] Control device failed:', error);
      throw error;
    }
  }

  /**
   * 智能喂食器：喂食
   */
  async feed(deviceId: string, portion?: number): Promise<ControlResult> {
    return this.controlDevice(deviceId, {
      action: 'feed',
      params: { portion: portion ?? 1 },
    });
  }

  /**
   * 智能饮水机：开启出水
   */
  async waterOn(deviceId: string, duration?: number): Promise<ControlResult> {
    return this.controlDevice(deviceId, {
      action: 'water_on',
      params: { duration: duration ?? 30 },
    });
  }

  /**
   * 智能饮水机：关闭出水
   */
  async waterOff(deviceId: string): Promise<ControlResult> {
    return this.controlDevice(deviceId, {
      action: 'water_off',
    });
  }

  /**
   * 激光玩具：开启
   */
  async laserOn(deviceId: string, duration?: number): Promise<ControlResult> {
    return this.controlDevice(deviceId, {
      action: 'laser_on',
      params: { duration: duration ?? 60 },
    });
  }

  /**
   * 激光玩具：关闭
   */
  async laserOff(deviceId: string): Promise<ControlResult> {
    return this.controlDevice(deviceId, {
      action: 'laser_off',
    });
  }

  /**
   * 激光玩具：移动激光点
   */
  async laserMove(deviceId: string, x: number, y: number): Promise<ControlResult> {
    return this.controlDevice(deviceId, {
      action: 'laser_move',
      params: { x, y },
    });
  }

  /**
   * 重启设备
   */
  async rebootDevice(deviceId: string): Promise<ControlResult> {
    return this.controlDevice(deviceId, {
      action: 'reboot',
    });
  }

  /**
   * 固件更新
   */
  async updateFirmware(deviceId: string, firmwareUrl: string): Promise<ControlResult> {
    return this.controlDevice(deviceId, {
      action: 'update_firmware',
      params: { firmwareUrl },
    });
  }

  // ─── 删除设备 ──────────────────────────────────────────────

  async removeDevice(deviceId: string): Promise<void> {
    try {
      await iotApi.remove(deviceId);
      await databaseService.delete(STORE_NAMES.CAMERA_DEVICES, deviceId);
    } catch (error) {
      console.error('[IoTDeviceService] Remove device failed:', error);
      throw error;
    }
  }

  // ─── BLE 扫描 ──────────────────────────────────────────────

  async scanBLEDevices(durationMs: number = 5000): Promise<Array<{
    bluetoothId: string;
    name: string;
    rssi: number;
    deviceType: DeviceType;
  }>> {
    try {
      const { devices } = await iotApi.bleScan(durationMs);
      return devices;
    } catch {
      // 降级到 Web Bluetooth API
      return this.scanWithWebBluetooth();
    }
  }

  private async scanWithWebBluetooth(): Promise<Array<{
    bluetoothId: string;
    name: string;
    rssi: number;
    deviceType: DeviceType;
  }>> {
    try {
      if (!navigator.bluetooth) {
        console.warn('[IoTDeviceService] Web Bluetooth API not available');
        return [];
      }

      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '0000180f-0000-1000-8000-00805f9b34fb', // Battery Service
          '0000180a-0000-1000-8000-00805f9b34fb', // Device Information
        ],
      });

      if (!device) return [];

      return [{
        bluetoothId: device.id,
        name: device.name ?? 'Unknown Device',
        rssi: -50,
        deviceType: 'FEEDER',
      }];
    } catch (error) {
      if ((error as Error).name === 'NotFoundError') {
        // 用户取消扫描
        return [];
      }
      console.error('[IoTDeviceService] Web Bluetooth scan failed:', error);
      return [];
    }
  }

  // ─── BLE 连接 ──────────────────────────────────────────────

  async connectBLEDevice(bluetoothId: string): Promise<{ success: boolean; deviceId: string }> {
    try {
      return await iotApi.bleConnect(bluetoothId);
    } catch {
      // 降级到 Web Bluetooth API
      return this.connectWithWebBluetooth(bluetoothId);
    }
  }

  private async connectWithWebBluetooth(bluetoothId: string): Promise<{ success: boolean; deviceId: string }> {
    try {
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth API not available');
      }

      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['0000180f-0000-1000-8000-00805f9b34fb'],
      });

      const server = await device.gatt?.connect();
      if (!server) {
        throw new Error('GATT server connection failed');
      }

      return { success: true, deviceId: device.id };
    } catch (error) {
      console.error('[IoTDeviceService] Web Bluetooth connect failed:', error);
      return { success: false, deviceId: bluetoothId };
    }
  }

  // ─── BLE 断开 ──────────────────────────────────────────────

  async disconnectBLEDevice(bluetoothId: string): Promise<{ success: boolean }> {
    try {
      return await iotApi.bleDisconnect(bluetoothId);
    } catch {
      // Web Bluetooth 断开由浏览器管理
      return { success: true };
    }
  }

  // ─── MQTT 连接 ─────────────────────────────────────────────

  async connectMQTT(broker: string, options?: Record<string, unknown>): Promise<{ success: boolean; clientId: string }> {
    try {
      const result = await iotApi.mqttConnect(broker, options);
      return result;
    } catch (error) {
      console.error('[IoTDeviceService] MQTT connect failed:', error);
      throw error;
    }
  }

  // ─── MQTT 订阅 ─────────────────────────────────────────────

  async subscribeMQTT(topics: string[]): Promise<{ success: boolean }> {
    try {
      const result = await iotApi.mqttSubscribe(topics);
      this.subscribedTopics = [...new Set([...this.subscribedTopics, ...topics])];

      // 同时通过 WebSocket 订阅
      if (this.isWsConnected && this.ws) {
        this.ws.send(JSON.stringify({
          type: 'mqtt_subscribe',
          topics,
        }));
      }

      return result;
    } catch (error) {
      console.error('[IoTDeviceService] MQTT subscribe failed:', error);
      throw error;
    }
  }

  // ─── MQTT 发布 ─────────────────────────────────────────────

  async publishMQTT(topic: string, message: string): Promise<{ success: boolean }> {
    try {
      const result = await iotApi.mqttPublish(topic, message);
      return result;
    } catch (error) {
      // 通过 WebSocket 降级发布
      if (this.isWsConnected && this.ws) {
        this.ws.send(JSON.stringify({
          type: 'mqtt_publish',
          topic,
          message,
          timestamp: new Date().toISOString(),
        }));
        return { success: true };
      }
      console.error('[IoTDeviceService] MQTT publish failed:', error);
      throw error;
    }
  }

  // ─── WebSocket 实时数据流 ───────────────────────────────────

  private connectWebSocket(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const wsUrl = `${WS_IOT_BASE_URL}/iot`;
    try {
      this.ws = new WebSocket(wsUrl);
    } catch (error) {
      console.warn('[IoTDeviceService] WebSocket creation failed:', error);
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      console.log('[IoTDeviceService] WebSocket connected');
      this.isWsConnected = true;
      this.reconnectAttempts = 0;
      this.notifyConnectionChange(true);

      // 重新订阅之前的 topics
      if (this.subscribedTopics.length > 0) {
        this.ws!.send(JSON.stringify({
          type: 'mqtt_subscribe',
          topics: this.subscribedTopics,
        }));
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleWsMessage(data);
      } catch {
        // 忽略非 JSON 消息
      }
    };

    this.ws.onerror = (error) => {
      console.error('[IoTDeviceService] WebSocket error:', error);
    };

    this.ws.onclose = (event) => {
      this.isWsConnected = false;
      this.notifyConnectionChange(false);

      if (!event.wasClean) {
        this.scheduleReconnect();
      }
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[IoTDeviceService] Max reconnect attempts reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connectWebSocket();
    }, delay);
  }

  private handleWsMessage(data: Record<string, unknown>): void {
    switch (data.type) {
      case 'device_event': {
        const event = data.event as DeviceEvent;
        if (event) {
          this.notifyEvent(event);
        }
        break;
      }
      case 'device_update': {
        const device = data.device as IoTDevice;
        if (device) {
          databaseService.put(STORE_NAMES.CAMERA_DEVICES, device).catch(() => {});
          this.notifyDeviceChange(device);
        }
        break;
      }
      case 'mqtt_message': {
        const topic = data.topic as string;
        const message = data.message as string;
        if (topic && message) {
          this.notifyEvent({
            id: `mqtt-${Date.now()}`,
            deviceId: data.deviceId as string ?? '',
            type: 'status_change',
            data: { topic, message },
            timestamp: new Date().toISOString(),
          });
        }
        break;
      }
      case 'control_result': {
        const result = data as ControlResult;
        if (result && result.deviceId) {
          this.pendingCommands.delete(result.deviceId);
        }
        break;
      }
    }
  }

  // ─── 设备事件流 ────────────────────────────────────────────

  async getDeviceEvents(deviceId: string, limit: number = 50): Promise<DeviceEvent[]> {
    try {
      const events = await databaseService.getAll<DeviceEvent>(STORE_NAMES.ALERT_RECORDS);
      return events
        .filter((e) => e.deviceId === deviceId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch {
      return [];
    }
  }

  // ─── 缓存 ──────────────────────────────────────────────────

  private async cacheDevices(devices: IoTDevice[]): Promise<void> {
    try {
      for (const device of devices) {
        await databaseService.put(STORE_NAMES.CAMERA_DEVICES, device);
      }
    } catch {
      // 缓存失败不阻塞
    }
  }

  private async loadCachedDevices(): Promise<IoTDevice[]> {
    try {
      return await databaseService.getAll<IoTDevice>(STORE_NAMES.CAMERA_DEVICES);
    } catch {
      return [];
    }
  }

  // ─── 事件监听器 ────────────────────────────────────────────

  onDeviceChange(listener: (device: IoTDevice) => void): () => void {
    this.deviceListeners.push(listener);
    return () => {
      const idx = this.deviceListeners.indexOf(listener);
      if (idx > -1) this.deviceListeners.splice(idx, 1);
    };
  }

  onDeviceEvent(listener: (event: DeviceEvent) => void): () => void {
    this.eventListeners.push(listener);
    return () => {
      const idx = this.eventListeners.indexOf(listener);
      if (idx > -1) this.eventListeners.splice(idx, 1);
    };
  }

  onConnectionChange(listener: (connected: boolean) => void): () => void {
    this.connectionListeners.push(listener);
    return () => {
      const idx = this.connectionListeners.indexOf(listener);
      if (idx > -1) this.connectionListeners.splice(idx, 1);
    };
  }

  // ─── 通知方法 ──────────────────────────────────────────────

  private notifyDeviceChange(device: IoTDevice): void {
    this.deviceListeners.forEach((cb) => {
      try { cb(device); } catch { /* 回调异常不影响其他 */ }
    });
  }

  private notifyEvent(event: DeviceEvent): void {
    this.eventListeners.forEach((cb) => {
      try { cb(event); } catch { /* 回调异常不影响其他 */ }
    });
  }

  private notifyConnectionChange(connected: boolean): void {
    this.connectionListeners.forEach((cb) => {
      try { cb(connected); } catch { /* 回调异常不影响其他 */ }
    });
  }

  // ─── 清理 ──────────────────────────────────────────────────

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.isWsConnected = false;
    this.subscribedTopics = [];
    this.pendingCommands.clear();
    this.notifyConnectionChange(false);
    console.log('[IoTDeviceService] Disconnected');
  }
}

export const iotDeviceService = new IoTDeviceService();