// ============================================
// 摄像头适配服务 - 真实实现
// 支持萤石、TP-Link、小米、海康威视等品牌
// ============================================

import type { CameraDevice, EzvizDeviceInfo, EzvizAccessToken, ONVIFDiscoveryResult, Go2rtcStreamConfig, Go2rtcServerInfo, CameraAddRequest, CameraBrand } from '../types/camera';

// IndexedDB 配置
const DB_NAME = 'pawsync_camera_db';
const DEVICES_STORE = 'camera_devices';
const GO2RTC_STORE = 'go2rtc_streams';
const GO2RTC_BASE = 'http://localhost:1984';

class CameraAdapterService {
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private devices: CameraDevice[] = [];
  private go2rtcStreams: Go2rtcStreamConfig[] = [];

  constructor() {
    this.loadDataFromDB();
  }

  // 从 IndexedDB 加载数据
  private async loadDataFromDB() {
    try {
      const db = await this.openDB();
      
      // 加载设备
      const deviceTransaction = db.transaction([DEVICES_STORE], 'readonly');
      const deviceStore = deviceTransaction.objectStore(DEVICES_STORE);
      const deviceRequest = deviceStore.getAll();
      
      deviceRequest.onsuccess = () => {
        this.devices = deviceRequest.result || [];
      };

      // 加载 go2rtc 流
      const streamTransaction = db.transaction([GO2RTC_STORE], 'readonly');
      const streamStore = streamTransaction.objectStore(GO2RTC_STORE);
      const streamRequest = streamStore.getAll();
      
      streamRequest.onsuccess = () => {
        this.go2rtcStreams = streamRequest.result || [];
      };
    } catch (error) {
      console.error('Failed to load camera data:', error);
    }
  }

  // 保存设备到 IndexedDB
  private async saveDeviceToDB(device: CameraDevice) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([DEVICES_STORE], 'readwrite');
      const store = transaction.objectStore(DEVICES_STORE);
      store.put(device);
    } catch (error) {
      console.error('Failed to save device:', error);
    }
  }

  // 删除设备从 IndexedDB
  private async deleteDeviceFromDB(deviceId: string) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([DEVICES_STORE], 'readwrite');
      const store = transaction.objectStore(DEVICES_STORE);
      store.delete(deviceId);
    } catch (error) {
      console.error('Failed to delete device:', error);
    }
  }

  // 保存 go2rtc 流到 IndexedDB
  private async saveStreamToDB(stream: Go2rtcStreamConfig) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([GO2RTC_STORE], 'readwrite');
      const store = transaction.objectStore(GO2RTC_STORE);
      store.put(stream);
    } catch (error) {
      console.error('Failed to save stream:', error);
    }
  }

  // 删除 go2rtc 流从 IndexedDB
  private async deleteStreamFromDB(name: string) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([GO2RTC_STORE], 'readwrite');
      const store = transaction.objectStore(GO2RTC_STORE);
      store.delete(name);
    } catch (error) {
      console.error('Failed to delete stream:', error);
    }
  }

  // 打开 IndexedDB
  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(DEVICES_STORE)) {
          db.createObjectStore(DEVICES_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(GO2RTC_STORE)) {
          db.createObjectStore(GO2RTC_STORE, { keyPath: 'name' });
        }
      };
    });
  }

  // 获取萤石云访问令牌
  async getEzvizAccessToken(appKey: string, appSecret: string): Promise<EzvizAccessToken> {
    try {
      const response = await fetch('https://open.ys7.com/api/lapp/token/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `appKey=${encodeURIComponent(appKey)}&appSecret=${encodeURIComponent(appSecret)}`
      });

      if (!response.ok) {
        throw new Error(`Failed to get Ezviz token: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.code !== '200') {
        throw new Error(`Ezviz API error: ${data.msg}`);
      }

      this.accessToken = data.data.accessToken;
      this.tokenExpiresAt = Date.now() + (data.data.expireTime * 1000);

      return {
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
        expiresIn: data.data.expireTime,
        tokenType: 'Bearer'
      };
    } catch (error) {
      console.error('Failed to get Ezviz access token:', error);
      throw error;
    }
  }

  // 刷新萤石云令牌
  async refreshEzvizToken(refreshToken: string): Promise<EzvizAccessToken> {
    try {
      const response = await fetch('https://open.ys7.com/api/lapp/token/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `refreshToken=${encodeURIComponent(refreshToken)}`
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh Ezviz token: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.code !== '200') {
        throw new Error(`Ezviz API error: ${data.msg}`);
      }

      this.accessToken = data.data.accessToken;
      this.tokenExpiresAt = Date.now() + (data.data.expireTime * 1000);

      return {
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
        expiresIn: data.data.expireTime,
        tokenType: 'Bearer'
      };
    } catch (error) {
      console.error('Failed to refresh Ezviz token:', error);
      throw error;
    }
  }

  // 获取萤石设备列表
  async getEzvizDeviceList(accessToken: string): Promise<EzvizDeviceInfo[]> {
    try {
      const response = await fetch(`https://open.ys7.com/api/lapp/device/list?accessToken=${encodeURIComponent(accessToken)}&pageStart=0&pageSize=50`);

      if (!response.ok) {
        throw new Error(`Failed to get Ezviz devices: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.code !== '200') {
        throw new Error(`Ezviz API error: ${data.msg}`);
      }

      return data.data.map((device: EzvizDeviceInfo) => ({
        ...device,
        isOnline: device.status === 1
      }));
    } catch (error) {
      console.error('Failed to get Ezviz device list:', error);
      throw error;
    }
  }

  // 获取萤石设备信息
  async getEzvizDeviceInfo(accessToken: string, deviceSerial: string): Promise<EzvizDeviceInfo | null> {
    try {
      const response = await fetch(`https://open.ys7.com/api/lapp/device/info?accessToken=${encodeURIComponent(accessToken)}&deviceSerial=${encodeURIComponent(deviceSerial)}`);

      if (!response.ok) {
        throw new Error(`Failed to get Ezviz device info: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.code !== '200') {
        throw new Error(`Ezviz API error: ${data.msg}`);
      }

      return {
        ...data.data,
        isOnline: data.data.status === 1
      };
    } catch (error) {
      console.error('Failed to get Ezviz device info:', error);
      return null;
    }
  }

  // 获取萤石流地址
  async getEzvizStreamUrl(accessToken: string, deviceSerial: string, protocol: 'rtsp' | 'ezopen' = 'ezopen'): Promise<string> {
    try {
      if (protocol === 'ezopen') {
        return `ezopen://${accessToken}@open.ys7.com/${deviceSerial}/1.hd.live`;
      }

      const response = await fetch(`https://open.ys7.com/api/lapp/live/address/get?accessToken=${encodeURIComponent(accessToken)}&deviceSerial=${encodeURIComponent(deviceSerial)}&channelNo=1&protocol=3`);

      if (!response.ok) {
        throw new Error(`Failed to get Ezviz stream URL: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.code !== '200') {
        throw new Error(`Ezviz API error: ${data.msg}`);
      }

      return data.data.url;
    } catch (error) {
      console.error('Failed to get Ezviz stream URL:', error);
      throw error;
    }
  }

  // 发现 ONVIF 设备（使用本地网络扫描）
  async discoverONVIFDevices(timeout: number = 5000): Promise<ONVIFDiscoveryResult[]> {
    // ONVIF 设备发现需要原生插件支持
    // 这里返回空数组，实际实现需要通过 Capacitor 插件调用原生代码
    console.warn('ONVIF discovery requires native plugin support');
    return [];
  }

  // 获取 ONVIF 设备信息
  async getONVIFDeviceInfo(ipAddress: string, port: number = 80): Promise<ONVIFDiscoveryResult | null> {
    // ONVIF 设备信息获取需要原生插件支持
    console.warn('ONVIF device info requires native plugin support');
    return null;
  }

  // 获取 ONVIF 流地址
  async getONVIFStreamUrl(ipAddress: string, port: number, username: string, password: string): Promise<string> {
    return `rtsp://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${ipAddress}:${port}/stream1`;
  }

  // 获取 go2rtc 服务器信息
  async getGo2rtcServerInfo(): Promise<Go2rtcServerInfo> {
    try {
      const response = await fetch(`${GO2RTC_BASE}/api`);
      
      if (!response.ok) {
        throw new Error('go2rtc server not available');
      }

      const data = await response.json();
      
      return {
        version: data.version || 'unknown',
        uptime: data.uptime || 0,
        streams: Object.keys(data.streams || {}).length,
        peers: data.clients || 0
      };
    } catch (error) {
      console.error('Failed to get go2rtc server info:', error);
      return {
        version: 'unknown',
        uptime: 0,
        streams: 0,
        peers: 0
      };
    }
  }

  // 获取 go2rtc 流列表
  async getGo2rtcStreams(): Promise<Go2rtcStreamConfig[]> {
    return [...this.go2rtcStreams];
  }

  // 添加 go2rtc 流
  async addGo2rtcStream(config: Go2rtcStreamConfig): Promise<boolean> {
    try {
      // 添加到本地存储
      this.go2rtcStreams.push(config);
      await this.saveStreamToDB(config);

      // 尝试添加到 go2rtc 服务器
      const response = await fetch(`${GO2RTC_BASE}/api/streams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: config.name,
          src: config.source
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to add go2rtc stream:', error);
      return false;
    }
  }

  // 删除 go2rtc 流
  async removeGo2rtcStream(name: string): Promise<boolean> {
    try {
      // 从本地存储删除
      const initialLength = this.go2rtcStreams.length;
      this.go2rtcStreams = this.go2rtcStreams.filter(s => s.name !== name);
      
      if (this.go2rtcStreams.length < initialLength) {
        await this.deleteStreamFromDB(name);
      }

      // 尝试从 go2rtc 服务器删除
      const response = await fetch(`${GO2RTC_BASE}/api/streams/${encodeURIComponent(name)}`, {
        method: 'DELETE'
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to remove go2rtc stream:', error);
      return false;
    }
  }

  // 获取 go2rtc WebRTC URL
  async getGo2rtcWebRTCUrl(streamName: string): Promise<string> {
    return `${GO2RTC_BASE}/api/webrtc?src=${encodeURIComponent(streamName)}`;
  }

  // 获取所有设备
  async getDevices(): Promise<CameraDevice[]> {
    return [...this.devices];
  }

  // 根据 ID 获取设备
  async getDeviceById(deviceId: string): Promise<CameraDevice | null> {
    return this.devices.find(d => d.id === deviceId) || null;
  }

  // 添加设备
  async addDevice(request: CameraAddRequest): Promise<CameraDevice> {
    const newDevice: CameraDevice = {
      id: `cam-${Date.now()}`,
      name: request.name,
      brand: request.brand,
      model: this.getModelByBrand(request.brand),
      status: 'offline',
      lastActive: new Date().toISOString(),
      streamUrl: request.ipAddress ? `rtsp://${request.username}:${request.password}@${request.ipAddress}:${request.port || 554}/stream1` : undefined,
      webrtcUrl: undefined,
      capabilities: this.getDefaultCapabilities(request.brand),
      settings: this.getDefaultSettings(),
      location: request.location,
      ipAddress: request.ipAddress,
      port: request.port,
      protocol: request.protocol,
      username: request.username,
      password: request.password,
      accessToken: request.accessToken,
      go2rtcId: undefined
    };

    // 如果有 IP 地址，尝试添加到 go2rtc
    if (request.ipAddress && newDevice.streamUrl) {
      const go2rtcName = `${request.brand}_${Date.now()}`;
      const added = await this.addGo2rtcStream({
        name: go2rtcName,
        source: newDevice.streamUrl,
        webrtc: true
      });

      if (added) {
        newDevice.webrtcUrl = `${GO2RTC_BASE}/api/webrtc?src=${go2rtcName}`;
        newDevice.go2rtcId = go2rtcName;
      }
    }

    this.devices.push(newDevice);
    await this.saveDeviceToDB(newDevice);
    return newDevice;
  }

  // 更新设备
  async updateDevice(deviceId: string, updates: Partial<CameraDevice>): Promise<CameraDevice | null> {
    const index = this.devices.findIndex(d => d.id === deviceId);
    if (index === -1) return null;

    this.devices[index] = { ...this.devices[index], ...updates };
    await this.saveDeviceToDB(this.devices[index]);
    return this.devices[index];
  }

  // 删除设备
  async deleteDevice(deviceId: string): Promise<boolean> {
    const device = this.devices.find(d => d.id === deviceId);
    if (device?.go2rtcId) {
      await this.removeGo2rtcStream(device.go2rtcId);
    }

    const initialLength = this.devices.length;
    this.devices = this.devices.filter(d => d.id !== deviceId);
    
    if (this.devices.length < initialLength) {
      await this.deleteDeviceFromDB(deviceId);
      return true;
    }
    return false;
  }

  // 刷新设备状态
  async refreshDeviceStatus(deviceId: string): Promise<CameraDevice | null> {
    const device = this.devices.find(d => d.id === deviceId);
    if (!device) return null;

    try {
      // 尝试 ping 设备 IP
      if (device.ipAddress) {
        const response = await fetch(`http://${device.ipAddress}:${device.port || 80}`, {
          method: 'HEAD',
          mode: 'no-cors',
          signal: AbortSignal.timeout(5000)
        });
        device.status = 'online';
      } else {
        device.status = 'offline';
      }
    } catch {
      device.status = 'offline';
    }

    device.lastActive = new Date().toISOString();
    await this.saveDeviceToDB(device);
    return device;
  }

  // 测试连接
  async testConnection(deviceId: string): Promise<{
    success: boolean;
    latency?: number;
    error?: string;
  }> {
    const device = this.devices.find(d => d.id === deviceId);
    if (!device) {
      return { success: false, error: '设备不存在' };
    }

    const startTime = Date.now();
    
    try {
      if (device.ipAddress) {
        await fetch(`http://${device.ipAddress}:${device.port || 80}`, {
          method: 'HEAD',
          mode: 'no-cors',
          signal: AbortSignal.timeout(10000)
        });
        
        const latency = Date.now() - startTime;
        device.status = 'online';
        device.lastActive = new Date().toISOString();
        await this.saveDeviceToDB(device);
        
        return { success: true, latency };
      }
      
      return { success: false, error: '设备没有配置 IP 地址' };
    } catch (error) {
      device.status = 'offline';
      await this.saveDeviceToDB(device);
      return { success: false, error: '连接失败，请检查网络和设备设置' };
    }
  }

  private getModelByBrand(brand: CameraBrand): string {
    const models: Record<CameraBrand, string> = {
      ezviz: 'CS-C6CN',
      tapo: 'Tapo C100',
      xiaomi: 'Mi Home Camera',
      hikvision: 'DS-2CD2043G0-I',
      dahua: 'IPC-HFW1230S',
      '360': '360 Camera',
      eufy: 'eufyCam 2C',
      haier: 'Haier Camera',
      onvif: 'Generic ONVIF',
      generic: 'Generic Camera',
      huawei: 'HW Camera',
      honor: 'Honor Camera',
      yi: 'Yi Camera',
      ring: 'Ring Doorbell',
      nest: 'Nest Cam',
    };
    return models[brand] || 'Unknown';
  }

  private getDefaultCapabilities(brand: CameraBrand): CameraDevice['capabilities'] {
    const baseCapabilities: CameraDevice['capabilities'] = [
      { type: 'live_stream', enabled: true },
      { type: 'night_vision', enabled: true },
      { type: 'motion_detection', enabled: true },
      { type: 'sd_card', enabled: true }
    ];

    if (brand === 'ezviz' || brand === 'xiaomi') {
      return [
        ...baseCapabilities,
        { type: 'two_way_audio', enabled: true },
        { type: 'ptz', enabled: true },
        { type: 'cloud_storage', enabled: true }
      ];
    }

    return [
      ...baseCapabilities,
      { type: 'two_way_audio', enabled: false },
      { type: 'ptz', enabled: false },
      { type: 'cloud_storage', enabled: false }
    ];
  }

  private getDefaultSettings(): CameraDevice['settings'] {
    return {
      resolution: '1080p',
      nightVisionMode: 'auto',
      motionDetection: { enabled: true, sensitivity: 60, notificationEnabled: true },
      recording: { mode: 'motion', quality: 'medium', storage: 'sd' },
      audio: { enabled: true, volume: 70, noiseReduction: true },
      aiTracking: { enabled: true, targetType: 'pet', smoothTracking: true }
    };
  }
}

export const cameraAdapterService = new CameraAdapterService();
