/**
 * BLE Service - 蓝牙低功耗设备服务
 *
 * 提供 BLE 设备扫描、连接、断开、服务发现、特征读写等完整蓝牙协议栈
 * 优先通过后端 API 代理操作，降级到 Web Bluetooth API
 */

import { api } from '../lib/api';

// ─── 类型定义 ────────────────────────────────────────────────

export interface BLEScanResult {
  id: string;
  name: string;
  rssi: number;
  txPower?: number;
  manufacturerData?: Map<number, Uint8Array>;
  serviceUUIDs?: string[];
  isConnectable: boolean;
  advertisementData: Record<string, unknown>;
}

export interface BLEDevice {
  id: string;
  name: string;
  gattServer?: BLEDeviceGATTServer;
  rssi?: number;
  isConnected: boolean;
  bonded: boolean;
}

export interface BLEDeviceGATTServer {
  connected: boolean;
  connect(): Promise<BLEDeviceGATTServer>;
  disconnect(): void;
  getPrimaryService(uuid: string): Promise<BLEGATTService>;
  getPrimaryServices(): Promise<BLEGATTService[]>;
}

export interface BLEGATTService {
  uuid: string;
  isPrimary: boolean;
  device: BLEDevice;
  getCharacteristic(uuid: string): Promise<BLEGATTCharacteristic>;
  getCharacteristics(): Promise<BLEGATTCharacteristic[]>;
  getIncludedService(uuid: string): Promise<BLEGATTService>;
  getIncludedServices(): Promise<BLEGATTService[]>;
}

export interface BLEGATTCharacteristic {
  uuid: string;
  service: BLEGATTService;
  properties: BLECharacteristicProperties;
  value: DataView | null;
  readValue(): Promise<DataView>;
  writeValue(value: BufferSource): Promise<void>;
  startNotifications(): Promise<BLEGATTCharacteristic>;
  stopNotifications(): Promise<BLEGATTCharacteristic>;
  addEventListener(
    type: 'characteristicvaluechanged',
    listener: (event: Event) => void,
  ): void;
  removeEventListener(
    type: 'characteristicvaluechanged',
    listener: (event: Event) => void,
  ): void;
}

export interface BLECharacteristicProperties {
  read: boolean;
  write: boolean;
  writeWithoutResponse: boolean;
  notify: boolean;
  indicate: boolean;
  authenticatedSignedWrites: boolean;
  reliableWrite: boolean;
  writableAuxiliaries: boolean;
}

export interface BLEConnectionState {
  deviceId: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'disconnecting' | 'error';
  error?: string;
  timestamp: string;
}

export interface BLEServiceConfig {
  scanDuration: number;
  autoConnect: boolean;
  maxRetries: number;
  retryDelay: number;
}

// ─── BLE API ─────────────────────────────────────────────────

const bleApi = {
  scan: (duration?: number) =>
    api.post<{ devices: BLEScanResult[] }>('/iot/ble/scan', { duration }),
  connect: (bluetoothId: string) =>
    api.post<{ success: boolean; device: BLEDevice }>('/iot/ble/connect', { bluetoothId }),
  disconnect: (bluetoothId: string) =>
    api.post<{ success: boolean }>('/iot/ble/disconnect', { bluetoothId }),
  readCharacteristic: (deviceId: string, serviceUUID: string, characteristicUUID: string) =>
    api.get<{ data: number[] }>(`/iot/ble/${deviceId}/characteristics/${serviceUUID}/${characteristicUUID}`),
  writeCharacteristic: (deviceId: string, serviceUUID: string, characteristicUUID: string, data: number[]) =>
    api.post<{ success: boolean }>(`/iot/ble/${deviceId}/characteristics/${serviceUUID}/${characteristicUUID}`, { data }),
};

// ─── 已知 BLE 设备服务/特征 UUID ──────────────────────────────

const KNOWN_SERVICES: Record<string, string> = {
  BATTERY: '0000180f-0000-1000-8000-00805f9b34fb',
  DEVICE_INFO: '0000180a-0000-1000-8000-00805f9b34fb',
  FEEDER_SERVICE: '0000fff0-0000-1000-8000-00805f9b34fb',
  FOUNTAIN_SERVICE: '0000fff1-0000-1000-8000-00805f9b34fb',
  LASER_SERVICE: '0000fff2-0000-1000-8000-00805f9b34fb',
};

const KNOWN_CHARACTERISTICS: Record<string, string> = {
  BATTERY_LEVEL: '00002a19-0000-1000-8000-00805f9b34fb',
  FIRMWARE_VERSION: '00002a26-0000-1000-8000-00805f9b34fb',
  FEEDER_CONTROL: '0000fff3-0000-1000-8000-00805f9b34fb',
  FEEDER_STATUS: '0000fff4-0000-1000-8000-00805f9b34fb',
  FOUNTAIN_CONTROL: '0000fff5-0000-1000-8000-00805f9b34fb',
  LASER_CONTROL: '0000fff6-0000-1000-8000-00805f9b34fb',
};

// ─── BLE 服务类 ──────────────────────────────────────────────

class BLEService {
  private connectedDevices: Map<string, BLEDevice> = new Map();
  private scanResults: BLEScanResult[] = [];
  private isScanning = false;
  private scanTimeout: ReturnType<typeof setTimeout> | null = null;
  private connectionStates: Map<string, BLEConnectionState> = new Map();
  private config: BLEServiceConfig = {
    scanDuration: 5000,
    autoConnect: true,
    maxRetries: 3,
    retryDelay: 1000,
  };
  private notificationListeners: Map<string, Set<(data: DataView) => void>> = new Map();

  private scanListeners: Array<(results: BLEScanResult[]) => void> = [];
  private connectionStateListeners: Array<(state: BLEConnectionState) => void> = [];
  private discoveryListeners: Array<(device: BLEDevice) => void> = [];

  // ─── 配置 ──────────────────────────────────────────────────

  configure(config: Partial<BLEServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ─── 启用检查 ──────────────────────────────────────────────

  isAvailable(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  // ─── 设备扫描 ──────────────────────────────────────────────

  async startScan(durationMs?: number): Promise<BLEScanResult[]> {
    if (this.isScanning) {
      return this.scanResults;
    }

    this.isScanning = true;
    this.scanResults = [];

    const scanDuration = durationMs ?? this.config.scanDuration;

    try {
      // 优先通过后端 API 扫描
      const { devices } = await bleApi.scan(scanDuration);
      this.scanResults = devices;
      this.notifyScanResults(devices);
      return devices;
    } catch (error) {
      console.warn('[BLEService] API scan failed, falling back to Web Bluetooth:', error);
      return this.scanWithWebBluetooth(scanDuration);
    } finally {
      this.isScanning = false;
      if (this.scanTimeout) {
        clearTimeout(this.scanTimeout);
        this.scanTimeout = null;
      }
    }
  }

  async stopScan(): Promise<void> {
    this.isScanning = false;
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }
  }

  private async scanWithWebBluetooth(durationMs: number): Promise<BLEScanResult[]> {
    if (!this.isAvailable()) {
      console.warn('[BLEService] Web Bluetooth API not available');
      return [];
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: Object.values(KNOWN_SERVICES),
      });

      if (!device) return [];

      const result: BLEScanResult = {
        id: device.id,
        name: device.name ?? 'Unknown Device',
        rssi: -50,
        isConnectable: true,
        advertisementData: {},
      };

      this.scanResults = [result];
      this.notifyScanResults([result]);
      return [result];
    } catch (error) {
      if ((error as Error).name === 'NotFoundError') {
        return [];
      }
      console.error('[BLEService] Web Bluetooth scan failed:', error);
      return [];
    }
  }

  // ─── 设备连接 ──────────────────────────────────────────────

  async connect(bluetoothId: string): Promise<BLEDevice> {
    const existingState = this.connectionStates.get(bluetoothId);
    if (existingState?.status === 'connected') {
      const cached = this.connectedDevices.get(bluetoothId);
      if (cached) return cached;
    }

    this.updateConnectionState(bluetoothId, 'connecting');

    try {
      // 优先通过后端 API 连接
      const { device: apiDevice } = await bleApi.connect(bluetoothId);
      if (apiDevice) {
        this.connectedDevices.set(bluetoothId, apiDevice);
        this.updateConnectionState(bluetoothId, 'connected');
        this.notifyDiscovery(apiDevice);
        return apiDevice;
      }
    } catch (error) {
      console.warn('[BLEService] API connect failed, falling back to Web Bluetooth:', error);
    }

    // 降级到 Web Bluetooth API
    return this.connectWithWebBluetooth(bluetoothId);
  }

  private async connectWithWebBluetooth(bluetoothId: string): Promise<BLEDevice> {
    if (!this.isAvailable()) {
      const error = 'Web Bluetooth API not available';
      this.updateConnectionState(bluetoothId, 'error', error);
      throw new Error(error);
    }

    let retries = 0;
    while (retries < this.config.maxRetries) {
      try {
        const device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: Object.values(KNOWN_SERVICES),
        });

        if (!device) {
          throw new Error('Device not found');
        }

        const server = await device.gatt?.connect();
        if (!server) {
          throw new Error('GATT server connection failed');
        }

        const bleDevice: BLEDevice = {
          id: device.id,
          name: device.name ?? 'Unknown Device',
          gattServer: server as unknown as BLEDeviceGATTServer,
          isConnected: true,
          bonded: false,
        };

        this.connectedDevices.set(device.id, bleDevice);
        this.updateConnectionState(device.id, 'connected');
        this.notifyDiscovery(bleDevice);

        // 监听断开事件
        device.addEventListener('gattserverdisconnected', () => {
          this.handleDisconnection(device.id);
        });

        return bleDevice;
      } catch (error) {
        retries++;
        if (retries >= this.config.maxRetries) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          this.updateConnectionState(bluetoothId, 'error', message);
          throw error;
        }
        await new Promise((r) => setTimeout(r, this.config.retryDelay));
      }
    }

    throw new Error('Max retries exceeded');
  }

  // ─── 设备断开 ──────────────────────────────────────────────

  async disconnect(bluetoothId: string): Promise<boolean> {
    this.updateConnectionState(bluetoothId, 'disconnecting');

    try {
      // 优先通过后端 API 断开
      await bleApi.disconnect(bluetoothId);
    } catch (error) {
      console.warn('[BLEService] API disconnect failed:', error);
    }

    // 本地断开
    const device = this.connectedDevices.get(bluetoothId);
    if (device?.gattServer) {
      try {
        device.gattServer.disconnect();
      } catch {
        // 忽略
      }
    }

    this.connectedDevices.delete(bluetoothId);
    this.updateConnectionState(bluetoothId, 'disconnected');
    return true;
  }

  private handleDisconnection(deviceId: string): void {
    this.connectedDevices.delete(deviceId);
    this.updateConnectionState(deviceId, 'disconnected');
  }

  // ─── 服务发现 ──────────────────────────────────────────────

  async discoverServices(deviceId: string): Promise<BLEGATTService[]> {
    const device = this.connectedDevices.get(deviceId);
    if (!device?.gattServer) {
      throw new Error(`Device ${deviceId} not connected`);
    }

    try {
      return await device.gattServer.getPrimaryServices();
    } catch (error) {
      console.error('[BLEService] Service discovery failed:', error);
      throw error;
    }
  }

  async getService(deviceId: string, serviceUUID: string): Promise<BLEGATTService> {
    const device = this.connectedDevices.get(deviceId);
    if (!device?.gattServer) {
      throw new Error(`Device ${deviceId} not connected`);
    }

    return device.gattServer.getPrimaryService(serviceUUID);
  }

  // ─── 特征读/写 ─────────────────────────────────────────────

  async readCharacteristic(
    deviceId: string,
    serviceUUID: string,
    characteristicUUID: string,
  ): Promise<DataView> {
    const device = this.connectedDevices.get(deviceId);
    if (!device?.gattServer) {
      throw new Error(`Device ${deviceId} not connected`);
    }

    try {
      const service = await device.gattServer.getPrimaryService(serviceUUID);
      const characteristic = await service.getCharacteristic(characteristicUUID);
      return await characteristic.readValue();
    } catch (error) {
      // 降级到后端 API
      console.warn('[BLEService] Local read failed, trying API:', error);
      const { data } = await bleApi.readCharacteristic(deviceId, serviceUUID, characteristicUUID);
      return new DataView(new Uint8Array(data).buffer);
    }
  }

  async writeCharacteristic(
    deviceId: string,
    serviceUUID: string,
    characteristicUUID: string,
    value: BufferSource,
  ): Promise<void> {
    const device = this.connectedDevices.get(deviceId);
    if (!device?.gattServer) {
      throw new Error(`Device ${deviceId} not connected`);
    }

    try {
      const service = await device.gattServer.getPrimaryService(serviceUUID);
      const characteristic = await service.getCharacteristic(characteristicUUID);
      await characteristic.writeValue(value);
    } catch (error) {
      // 降级到后端 API
      console.warn('[BLEService] Local write failed, trying API:', error);
      const dataArray = Array.from(new Uint8Array(
        value instanceof ArrayBuffer ? value : value.buffer,
      ));
      await bleApi.writeCharacteristic(deviceId, serviceUUID, characteristicUUID, dataArray);
    }
  }

  // ─── 通知订阅 ──────────────────────────────────────────────

  async subscribeToNotifications(
    deviceId: string,
    serviceUUID: string,
    characteristicUUID: string,
    callback: (data: DataView) => void,
  ): Promise<() => void> {
    const device = this.connectedDevices.get(deviceId);
    if (!device?.gattServer) {
      throw new Error(`Device ${deviceId} not connected`);
    }

    const listenerKey = `${deviceId}:${characteristicUUID}`;

    try {
      const service = await device.gattServer.getPrimaryService(serviceUUID);
      const characteristic = await service.getCharacteristic(characteristicUUID);

      const handler = (event: Event) => {
        const target = event.target as BLEGATTCharacteristic;
        if (target.value) {
          callback(target.value);
        }
      };

      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', handler);

      // 注册到本地监听器注册表
      if (!this.notificationListeners.has(listenerKey)) {
        this.notificationListeners.set(listenerKey, new Set());
      }
      this.notificationListeners.get(listenerKey)!.add(callback as unknown as (data: DataView) => void);

      return async () => {
        try {
          characteristic.removeEventListener('characteristicvaluechanged', handler);
          await characteristic.stopNotifications();
        } catch {
          // 忽略
        }
        this.notificationListeners.get(listenerKey)?.delete(callback as unknown as (data: DataView) => void);
      };
    } catch (error) {
      console.error('[BLEService] Subscribe notifications failed:', error);
      throw error;
    }
  }

  // ─── 便捷方法：电池电量 ─────────────────────────────────────

  async getBatteryLevel(deviceId: string): Promise<number> {
    try {
      const data = await this.readCharacteristic(
        deviceId,
        KNOWN_SERVICES.BATTERY,
        KNOWN_CHARACTERISTICS.BATTERY_LEVEL,
      );
      return data.getUint8(0);
    } catch {
      return -1;
    }
  }

  // ─── 便捷方法：固件版本 ─────────────────────────────────────

  async getFirmwareVersion(deviceId: string): Promise<string> {
    try {
      const data = await this.readCharacteristic(
        deviceId,
        KNOWN_SERVICES.DEVICE_INFO,
        KNOWN_CHARACTERISTICS.FIRMWARE_VERSION,
      );
      return new TextDecoder().decode(data.buffer);
    } catch {
      return 'unknown';
    }
  }

  // ─── 查询方法 ──────────────────────────────────────────────

  getConnectedDevices(): BLEDevice[] {
    return Array.from(this.connectedDevices.values());
  }

  getConnectionState(deviceId: string): BLEConnectionState | null {
    return this.connectionStates.get(deviceId) ?? null;
  }

  isDeviceConnected(deviceId: string): boolean {
    const state = this.connectionStates.get(deviceId);
    return state?.status === 'connected';
  }

  getScanResults(): BLEScanResult[] {
    return [...this.scanResults];
  }

  // ─── 事件监听器 ────────────────────────────────────────────

  onScanResults(listener: (results: BLEScanResult[]) => void): () => void {
    this.scanListeners.push(listener);
    return () => {
      const idx = this.scanListeners.indexOf(listener);
      if (idx > -1) this.scanListeners.splice(idx, 1);
    };
  }

  onConnectionStateChange(listener: (state: BLEConnectionState) => void): () => void {
    this.connectionStateListeners.push(listener);
    return () => {
      const idx = this.connectionStateListeners.indexOf(listener);
      if (idx > -1) this.connectionStateListeners.splice(idx, 1);
    };
  }

  onDeviceDiscovered(listener: (device: BLEDevice) => void): () => void {
    this.discoveryListeners.push(listener);
    return () => {
      const idx = this.discoveryListeners.indexOf(listener);
      if (idx > -1) this.discoveryListeners.splice(idx, 1);
    };
  }

  // ─── 通知方法 ──────────────────────────────────────────────

  private notifyScanResults(results: BLEScanResult[]): void {
    this.scanListeners.forEach((cb) => {
      try { cb(results); } catch { /* 忽略 */ }
    });
  }

  private updateConnectionState(
    deviceId: string,
    status: BLEConnectionState['status'],
    error?: string,
  ): void {
    const state: BLEConnectionState = {
      deviceId,
      status,
      error,
      timestamp: new Date().toISOString(),
    };
    this.connectionStates.set(deviceId, state);
    this.connectionStateListeners.forEach((cb) => {
      try { cb(state); } catch { /* 忽略 */ }
    });
  }

  private notifyDiscovery(device: BLEDevice): void {
    this.discoveryListeners.forEach((cb) => {
      try { cb(device); } catch { /* 忽略 */ }
    });
  }

  // ─── 清理 ──────────────────────────────────────────────────

  async disconnectAll(): Promise<void> {
    const deviceIds = Array.from(this.connectedDevices.keys());
    for (const id of deviceIds) {
      await this.disconnect(id);
    }
    this.connectedDevices.clear();
    this.connectionStates.clear();
    this.notificationListeners.clear();
  }

  destroy(): void {
    this.disconnectAll();
    this.scanListeners = [];
    this.connectionStateListeners = [];
    this.discoveryListeners = [];
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }
    console.log('[BLEService] Destroyed');
  }
}

export const bleService = new BLEService();