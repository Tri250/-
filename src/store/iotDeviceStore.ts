import { create } from 'zustand';
import type { IoTDevice, DeviceType, DeviceSettings, ControlResult, DeviceEvent } from '../services/iotDeviceService';
import { iotDeviceService } from '../services/iotDeviceService';
import { bleService, type BLEScanResult, type BLEConnectionState } from '../services/bleService';
import { mqttService, type MQTTConnectionState, type MQTTMessage, type MQTTQoS } from '../services/mqttService';

interface IoTDeviceState {
  // 设备列表
  devices: IoTDevice[];
  selectedDevice: IoTDevice | null;
  isLoading: boolean;
  error: string | null;

  // BLE 扫描
  isScanning: boolean;
  bleScanResults: BLEScanResult[];
  bleConnectionStates: Record<string, BLEConnectionState>;

  // MQTT 连接
  mqttState: MQTTConnectionState;
  mqttMessages: MQTTMessage[];

  // 设备事件
  deviceEvents: DeviceEvent[];

  // WebSocket 连接
  isWsConnected: boolean;

  // 操作
  loadDevices: () => Promise<void>;
  selectDevice: (device: IoTDevice | null) => void;
  addDevice: (data: {
    name: string;
    deviceType: DeviceType;
    macAddress?: string;
    bluetoothId?: string;
    settings?: Record<string, unknown>;
  }) => Promise<void>;
  removeDevice: (deviceId: string) => Promise<void>;
  updateSettings: (deviceId: string, settings: DeviceSettings) => Promise<void>;

  // 设备控制
  feed: (deviceId: string, portion?: number) => Promise<ControlResult>;
  waterOn: (deviceId: string, duration?: number) => Promise<ControlResult>;
  waterOff: (deviceId: string) => Promise<ControlResult>;
  laserOn: (deviceId: string, duration?: number) => Promise<ControlResult>;
  laserOff: (deviceId: string) => Promise<ControlResult>;
  laserMove: (deviceId: string, x: number, y: number) => Promise<ControlResult>;
  rebootDevice: (deviceId: string) => Promise<ControlResult>;
  updateFirmware: (deviceId: string, firmwareUrl: string) => Promise<ControlResult>;

  // BLE 操作
  startBLEScan: (durationMs?: number) => Promise<void>;
  stopBLEScan: () => Promise<void>;
  connectBLEDevice: (bluetoothId: string) => Promise<boolean>;
  disconnectBLEDevice: (bluetoothId: string) => Promise<boolean>;

  // MQTT 操作
  connectMQTT: (broker: string, options?: Record<string, unknown>) => Promise<void>;
  disconnectMQTT: () => Promise<void>;
  subscribeMQTT: (topic: string, qos: MQTTQoS) => Promise<void>;
  unsubscribeMQTT: (topic: string) => Promise<void>;
  publishMQTT: (topic: string, payload: string) => Promise<void>;

  // 设备事件
  loadDeviceEvents: (deviceId: string, limit?: number) => Promise<void>;

  // 清理
  disconnect: () => void;
}

export const useIoTDeviceStore = create<IoTDeviceState>((set, get) => {
  // 注册 BLE 扫描监听
  const unsubScan = bleService.onScanResults((results) => {
    set({ bleScanResults: results, isScanning: false });
  });

  // 注册 BLE 连接状态监听
  const unsubConnState = bleService.onConnectionStateChange((state) => {
    set((prev) => ({
      bleConnectionStates: {
        ...prev.bleConnectionStates,
        [state.deviceId]: state,
      },
    }));
  });

  // 注册 MQTT 连接状态监听
  const unsubMqttState = mqttService.onConnectionChange((state) => {
    set({ mqttState: state });
  });

  // 注册 MQTT 消息监听
  const unsubMqttMsg = mqttService.onMessage((message) => {
    set((prev) => ({
      mqttMessages: [...prev.mqttMessages.slice(-99), message],
    }));
  });

  // 注册 IoT 设备变更监听
  const unsubDevice = iotDeviceService.onDeviceChange((device) => {
    set((prev) => ({
      devices: prev.devices.map((d) => (d.id === device.id ? device : d)),
      selectedDevice: prev.selectedDevice?.id === device.id ? device : prev.selectedDevice,
    }));
  });

  // 注册 IoT 设备事件监听
  const unsubEvent = iotDeviceService.onDeviceEvent((event) => {
    set((prev) => ({
      deviceEvents: [...prev.deviceEvents.slice(-99), event],
    }));
  });

  // 注册 WebSocket 连接状态监听
  const unsubWs = iotDeviceService.onConnectionChange((connected) => {
    set({ isWsConnected: connected });
  });

  return {
    devices: [],
    selectedDevice: null,
    isLoading: false,
    error: null,
    isScanning: false,
    bleScanResults: [],
    bleConnectionStates: {},
    mqttState: mqttService.getConnectionState(),
    mqttMessages: [],
    deviceEvents: [],
    isWsConnected: false,

    // ─── 设备管理 ──────────────────────────────────────────

    loadDevices: async () => {
      set({ isLoading: true, error: null });
      try {
        const devices = await iotDeviceService.getDevices();
        set({ devices, isLoading: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '加载设备列表失败',
          isLoading: false,
        });
      }
    },

    selectDevice: (device) => {
      set({ selectedDevice: device });
    },

    addDevice: async (data) => {
      set({ isLoading: true, error: null });
      try {
        const device = await iotDeviceService.addDevice(data);
        set((prev) => ({
          devices: [...prev.devices, device],
          isLoading: false,
        }));
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '添加设备失败',
          isLoading: false,
        });
        throw error;
      }
    },

    removeDevice: async (deviceId) => {
      try {
        await iotDeviceService.removeDevice(deviceId);
        set((prev) => ({
          devices: prev.devices.filter((d) => d.id !== deviceId),
          selectedDevice: prev.selectedDevice?.id === deviceId ? null : prev.selectedDevice,
        }));
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '删除设备失败',
        });
        throw error;
      }
    },

    updateSettings: async (deviceId, settings) => {
      try {
        const device = await iotDeviceService.updateSettings(deviceId, settings);
        set((prev) => ({
          devices: prev.devices.map((d) => (d.id === deviceId ? device : d)),
          selectedDevice: prev.selectedDevice?.id === deviceId ? device : prev.selectedDevice,
        }));
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '更新设置失败',
        });
        throw error;
      }
    },

    // ─── 设备控制 ──────────────────────────────────────────

    feed: async (deviceId, portion) => {
      try {
        const result = await iotDeviceService.feed(deviceId, portion);
        return result;
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '喂食指令失败',
        });
        throw error;
      }
    },

    waterOn: async (deviceId, duration) => {
      try {
        const result = await iotDeviceService.waterOn(deviceId, duration);
        return result;
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '出水指令失败',
        });
        throw error;
      }
    },

    waterOff: async (deviceId) => {
      try {
        const result = await iotDeviceService.waterOff(deviceId);
        return result;
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '关水指令失败',
        });
        throw error;
      }
    },

    laserOn: async (deviceId, duration) => {
      try {
        const result = await iotDeviceService.laserOn(deviceId, duration);
        return result;
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '激光开启失败',
        });
        throw error;
      }
    },

    laserOff: async (deviceId) => {
      try {
        const result = await iotDeviceService.laserOff(deviceId);
        return result;
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '激光关闭失败',
        });
        throw error;
      }
    },

    laserMove: async (deviceId, x, y) => {
      try {
        const result = await iotDeviceService.laserMove(deviceId, x, y);
        return result;
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '激光移动失败',
        });
        throw error;
      }
    },

    rebootDevice: async (deviceId) => {
      try {
        const result = await iotDeviceService.rebootDevice(deviceId);
        return result;
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '重启设备失败',
        });
        throw error;
      }
    },

    updateFirmware: async (deviceId, firmwareUrl) => {
      try {
        const result = await iotDeviceService.updateFirmware(deviceId, firmwareUrl);
        return result;
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '固件更新失败',
        });
        throw error;
      }
    },

    // ─── BLE 操作 ──────────────────────────────────────────

    startBLEScan: async (durationMs) => {
      set({ isScanning: true, bleScanResults: [], error: null });
      try {
        await bleService.startScan(durationMs);
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'BLE 扫描失败',
          isScanning: false,
        });
      }
    },

    stopBLEScan: async () => {
      await bleService.stopScan();
      set({ isScanning: false });
    },

    connectBLEDevice: async (bluetoothId) => {
      try {
        await bleService.connect(bluetoothId);
        return true;
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'BLE 连接失败',
        });
        return false;
      }
    },

    disconnectBLEDevice: async (bluetoothId) => {
      try {
        return await bleService.disconnect(bluetoothId);
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'BLE 断开失败',
        });
        return false;
      }
    },

    // ─── MQTT 操作 ─────────────────────────────────────────

    connectMQTT: async (broker, options) => {
      set({ error: null });
      try {
        await mqttService.connect(broker, options);
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'MQTT 连接失败',
        });
        throw error;
      }
    },

    disconnectMQTT: async () => {
      await mqttService.disconnect();
    },

    subscribeMQTT: async (topic, qos) => {
      try {
        await mqttService.subscribe(topic, qos, (_topic, _payload) => {
          // 回调由 onMessage 监听器统一处理
        });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'MQTT 订阅失败',
        });
        throw error;
      }
    },

    unsubscribeMQTT: async (topic) => {
      try {
        await mqttService.unsubscribe(topic);
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'MQTT 取消订阅失败',
        });
        throw error;
      }
    },

    publishMQTT: async (topic, payload) => {
      try {
        await mqttService.publish(topic, payload);
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'MQTT 发布失败',
        });
        throw error;
      }
    },

    // ─── 设备事件 ──────────────────────────────────────────

    loadDeviceEvents: async (deviceId, limit) => {
      try {
        const events = await iotDeviceService.getDeviceEvents(deviceId, limit);
        set({ deviceEvents: events });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '加载设备事件失败',
        });
      }
    },

    // ─── 清理 ──────────────────────────────────────────────

    disconnect: () => {
      iotDeviceService.disconnect();
      bleService.destroy();
      mqttService.destroy();
      unsubScan();
      unsubConnState();
      unsubMqttState();
      unsubMqttMsg();
      unsubDevice();
      unsubEvent();
      unsubWs();
      set({
        devices: [],
        selectedDevice: null,
        bleScanResults: [],
        bleConnectionStates: {},
        mqttMessages: [],
        deviceEvents: [],
        isWsConnected: false,
      });
    },
  };
});