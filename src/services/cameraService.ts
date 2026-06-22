import { PawSyncCamera } from '../plugins';
import type { CameraDevice, DeviceConfig, StreamOptions, DeviceCapability, PairingProgress, BrandInfo, CameraCapability, CameraSettings, CameraBrand } from '../types/camera';

export const BRAND_INFO: BrandInfo[] = [
  { id: 'xiaomi', name: '小米米家', icon: '📱', color: 'hover:border-orange-400', description: '小米智能摄像头', pairingMethod: 'code' },
  { id: 'huawei', name: '华为海雀', icon: '🐦', color: 'hover:border-blue-400', description: '华为智能摄像头', pairingMethod: 'code' },
  { id: 'honor', name: '荣耀小值', icon: '✨', color: 'hover:border-red-400', description: '荣耀智能摄像头', pairingMethod: 'code' },
  { id: 'ezviz', name: '萤石', icon: '🎥', color: 'hover:border-cyan-400', description: '海康威视萤石系列', pairingMethod: 'code' },
  { id: 'tapo', name: 'TP-Link Tapo', icon: '🔌', color: 'hover:border-green-400', description: 'TP-Link智能摄像头', pairingMethod: 'code' },
  { id: 'hikvision', name: '海康威视', icon: '📹', color: 'hover:border-indigo-400', description: '专业监控设备', pairingMethod: 'ip' },
  { id: 'dahua', name: '大华', icon: '📷', color: 'hover:border-purple-400', description: '专业监控设备', pairingMethod: 'ip' },
  { id: 'yi', name: '小蚁', icon: '🐜', color: 'hover:border-yellow-400', description: '小蚁智能摄像头', pairingMethod: 'code' },
  { id: 'ring', name: 'Amazon Ring', icon: '🔔', color: 'hover:border-sky-400', description: 'Amazon智能门铃', pairingMethod: 'account' },
  { id: 'nest', name: 'Google Nest', icon: '🏠', color: 'hover:border-emerald-400', description: 'Google智能摄像头', pairingMethod: 'account' },
  { id: 'eufy', name: 'Eufy', icon: '🔒', color: 'hover:border-teal-400', description: 'Anker智能摄像头', pairingMethod: 'code' },
  { id: '360', name: '360智能', icon: '🌐', color: 'hover:border-lime-400', description: '360智能摄像头', pairingMethod: 'code' },
  { id: 'haier', name: '海尔', icon: '❄️', color: 'hover:border-sky-500', description: '海尔智能摄像头', pairingMethod: 'code' },
  { id: 'onvif', name: 'ONVIF通用', icon: '🔗', color: 'hover:border-gray-400', description: 'ONVIF协议设备', pairingMethod: 'ip' },
  { id: 'generic', name: '其他品牌', icon: '📡', color: 'hover:border-gray-500', description: '通用RTSP/RTMP设备', pairingMethod: 'ip' },
];

const brandCapabilities: Record<string, DeviceCapability> = {
  xiaomi: { brand: 'xiaomi', supports1080p: true, supports720p: true, supports480p: true, supportsAudio: true, supportsNightVision: true, maxResolution: '1920x1080' },
  huawei: { brand: 'huawei', supports1080p: true, supports720p: true, supports480p: true, supportsAudio: true, supportsNightVision: true, maxResolution: '2560x1440' },
  honor: { brand: 'honor', supports1080p: true, supports720p: true, supports480p: true, supportsAudio: true, supportsNightVision: true, maxResolution: '1920x1080' },
  ezviz: { brand: 'ezviz', supports1080p: true, supports720p: true, supports480p: true, supportsAudio: true, supportsNightVision: true, maxResolution: '2560x1440' },
  tapo: { brand: 'tapo', supports1080p: true, supports720p: true, supports480p: true, supportsAudio: true, supportsNightVision: true, maxResolution: '1920x1080' },
  hikvision: { brand: 'hikvision', supports1080p: true, supports720p: true, supports480p: true, supportsAudio: true, supportsNightVision: true, maxResolution: '3840x2160' },
  dahua: { brand: 'dahua', supports1080p: true, supports720p: true, supports480p: true, supportsAudio: true, supportsNightVision: true, maxResolution: '3840x2160' },
  yi: { brand: 'yi', supports1080p: true, supports720p: true, supports480p: true, supportsAudio: true, supportsNightVision: true, maxResolution: '1920x1080' },
  ring: { brand: 'ring', supports1080p: true, supports720p: true, supports480p: false, supportsAudio: true, supportsNightVision: true, maxResolution: '1920x1080' },
  nest: { brand: 'nest', supports1080p: true, supports720p: true, supports480p: true, supportsAudio: true, supportsNightVision: true, maxResolution: '2560x1440' },
  eufy: { brand: 'eufy', supports1080p: true, supports720p: true, supports480p: true, supportsAudio: true, supportsNightVision: true, maxResolution: '2560x1440' },
  '360': { brand: '360', supports1080p: true, supports720p: true, supports480p: true, supportsAudio: true, supportsNightVision: true, maxResolution: '1920x1080' },
  haier: { brand: 'haier', supports1080p: true, supports720p: true, supports480p: true, supportsAudio: true, supportsNightVision: true, maxResolution: '1920x1080' },
  onvif: { brand: 'onvif', supports1080p: true, supports720p: true, supports480p: true, supportsAudio: true, supportsNightVision: true, maxResolution: '3840x2160' },
  generic: { brand: 'generic', supports1080p: true, supports720p: true, supports480p: true, supportsAudio: true, supportsNightVision: true, maxResolution: '3840x2160' },
};

class CameraManager {
  private devices: CameraDevice[] = [];
  private connectionCallbacks: Array<(device: CameraDevice) => void> = [];
  private currentCameraId: string | null = null;

  private getDefaultCapabilities(): CameraCapability[] {
    return [
      { type: 'live_stream', enabled: true },
      { type: 'night_vision', enabled: true },
      { type: 'motion_detection', enabled: true },
      { type: 'sd_card', enabled: true },
    ];
  }

  private getDefaultSettings(): CameraSettings {
    return {
      resolution: '1080p',
      nightVisionMode: 'auto',
      motionDetection: { enabled: true, sensitivity: 60, notificationEnabled: true },
      recording: { mode: 'motion', quality: 'medium', storage: 'sd' },
      audio: { enabled: true, volume: 70, noiseReduction: true },
      aiTracking: { enabled: true, targetType: 'pet', smoothTracking: true },
    };
  }

  private createDeviceBase(brand: CameraBrand, model: string, name: string, streamUrl: string, thumbnail: string, extra?: Partial<CameraDevice>): CameraDevice {
    return {
      id: `cam-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      brand,
      model,
      name,
      status: 'online',
      streamUrl,
      thumbnail,
      lastActive: new Date().toISOString(),
      capabilities: this.getDefaultCapabilities(),
      settings: this.getDefaultSettings(),
      protocol: 'rtsp',
      ...extra,
    };
  }

  async checkCameraPermission(): Promise<boolean> {
    try {
      const result = await PawSyncCamera.checkCameraPermission();
      return result.granted ?? false;
    } catch {
      return false;
    }
  }

  async requestCameraPermission(): Promise<boolean> {
    try {
      const result = await PawSyncCamera.requestCameraPermission();
      return result.granted ?? false;
    } catch {
      return false;
    }
  }

  async getAvailableCameras(): Promise<string[]> {
    try {
      const result = await PawSyncCamera.getAvailableCameras();
      return result.cameras ?? [];
    } catch {
      return ['0', '1'];
    }
  }

  async openCamera(cameraId: string = '0'): Promise<void> {
    this.currentCameraId = cameraId;
    try {
      await PawSyncCamera.openCamera({ cameraId });
    } catch (error) {
      throw new Error(`Failed to open camera: ${error}`);
    }
  }

  async closeCamera(): Promise<void> {
    try {
      await PawSyncCamera.closeCamera();
      this.currentCameraId = null;
    } catch (error) {
      throw new Error(`Failed to close camera: ${error}`);
    }
  }

  async startPreview(): Promise<void> {
    try {
      await PawSyncCamera.startPreview();
    } catch (error) {
      throw new Error(`Failed to start preview: ${error}`);
    }
  }

  async stopPreview(): Promise<void> {
    try {
      await PawSyncCamera.stopPreview();
    } catch (error) {
      throw new Error(`Failed to stop preview: ${error}`);
    }
  }

  async takePhoto(options?: { quality?: number }): Promise<string> {
    try {
      const result = await PawSyncCamera.takePhoto(options || {});
      return result.filePath ?? '';
    } catch (error) {
      throw new Error(`Failed to take photo: ${error}`);
    }
  }

  async getStream(deviceId: string): Promise<MediaStream> {
    const device = this.devices.find(d => d.id === deviceId);
    if (!device || device.status !== 'online') {
      throw new Error(`Camera ${deviceId} is not available`);
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      return stream;
    } catch (error) {
      console.error('Failed to get stream:', error);
      throw new Error('Failed to access camera');
    }
  }

  async connectXiaomi(deviceCode: string): Promise<CameraDevice> {
    const existingDevice = this.devices.find(d => d.model === deviceCode && d.brand === 'xiaomi');
    if (existingDevice) {
      existingDevice.status = 'online';
      existingDevice.lastActive = new Date().toISOString();
      this.notifyConnection(existingDevice);
      return existingDevice;
    }
    
    const newDevice = this.createDeviceBase(
      'xiaomi',
      deviceCode,
      `小米摄像头 ${deviceCode}`,
      `https://example.com/stream/${deviceCode}`,
      `https://picsum.photos/400/300?random=${Date.now()}`
    );
    this.devices.push(newDevice);
    this.notifyConnection(newDevice);
    return newDevice;
  }

  async connectHuawei(deviceCode: string): Promise<CameraDevice> {
    const newDevice = this.createDeviceBase(
      'huawei',
      deviceCode,
      `华为摄像头 ${deviceCode}`,
      `https://example.com/stream/${deviceCode}`,
      `https://picsum.photos/400/300?random=${Date.now()}`
    );
    this.devices.push(newDevice);
    this.notifyConnection(newDevice);
    return newDevice;
  }

  async connectHonor(deviceCode: string): Promise<CameraDevice> {
    const newDevice = this.createDeviceBase(
      'honor',
      deviceCode,
      `荣耀摄像头 ${deviceCode}`,
      `https://example.com/stream/${deviceCode}`,
      `https://picsum.photos/400/300?random=${Date.now()}`
    );
    this.devices.push(newDevice);
    this.notifyConnection(newDevice);
    return newDevice;
  }

  async connectEzviz(deviceCode: string): Promise<CameraDevice> {
    const newDevice = this.createDeviceBase(
      'ezviz',
      deviceCode,
      `萤石摄像头 ${deviceCode}`,
      `https://example.com/stream/${deviceCode}`,
      `https://picsum.photos/400/300?random=${Date.now()}`
    );
    this.devices.push(newDevice);
    this.notifyConnection(newDevice);
    return newDevice;
  }

  async connectTapo(deviceCode: string): Promise<CameraDevice> {
    const newDevice = this.createDeviceBase(
      'tapo',
      deviceCode,
      `TP-Link Tapo ${deviceCode}`,
      `https://example.com/stream/${deviceCode}`,
      `https://picsum.photos/400/300?random=${Date.now()}`
    );
    this.devices.push(newDevice);
    this.notifyConnection(newDevice);
    return newDevice;
  }

  async connectHikvision(ipAddress: string, username: string, password: string): Promise<CameraDevice> {
    const newDevice = this.createDeviceBase(
      'hikvision',
      'IP Camera',
      `海康威视 ${ipAddress}`,
      `rtsp://${username}:${password}@${ipAddress}:554/stream1`,
      `https://picsum.photos/400/300?random=${Date.now()}`,
      { ipAddress, port: 554 }
    );
    this.devices.push(newDevice);
    this.notifyConnection(newDevice);
    return newDevice;
  }

  async connectDahua(ipAddress: string, username: string, password: string): Promise<CameraDevice> {
    const newDevice = this.createDeviceBase(
      'dahua',
      'IP Camera',
      `大华摄像头 ${ipAddress}`,
      `rtsp://${username}:${password}@${ipAddress}:554/cam/realmonitor?channel=1&subtype=0`,
      `https://picsum.photos/400/300?random=${Date.now()}`,
      { ipAddress, port: 554 }
    );
    this.devices.push(newDevice);
    this.notifyConnection(newDevice);
    return newDevice;
  }

  async connectYi(deviceCode: string): Promise<CameraDevice> {
    const newDevice = this.createDeviceBase(
      'yi',
      deviceCode,
      `小蚁摄像头 ${deviceCode}`,
      `https://example.com/stream/${deviceCode}`,
      `https://picsum.photos/400/300?random=${Date.now()}`
    );
    this.devices.push(newDevice);
    this.notifyConnection(newDevice);
    return newDevice;
  }

  async connectRing(accountId: string): Promise<CameraDevice> {
    const newDevice = this.createDeviceBase(
      'ring',
      'Doorbell',
      `Ring 门铃`,
      `https://example.com/stream/ring-${Date.now()}`,
      `https://picsum.photos/400/300?random=${Date.now()}`
    );
    this.devices.push(newDevice);
    this.notifyConnection(newDevice);
    return newDevice;
  }

  async connectNest(accountId: string): Promise<CameraDevice> {
    const newDevice = this.createDeviceBase(
      'nest',
      'Nest Cam',
      `Nest 摄像头`,
      `https://example.com/stream/nest-${Date.now()}`,
      `https://picsum.photos/400/300?random=${Date.now()}`
    );
    this.devices.push(newDevice);
    this.notifyConnection(newDevice);
    return newDevice;
  }

  async connectEufy(deviceCode: string): Promise<CameraDevice> {
    const newDevice = this.createDeviceBase(
      'eufy',
      deviceCode,
      `Eufy 摄像头 ${deviceCode}`,
      `https://example.com/stream/${deviceCode}`,
      `https://picsum.photos/400/300?random=${Date.now()}`
    );
    this.devices.push(newDevice);
    this.notifyConnection(newDevice);
    return newDevice;
  }

  async connect360(deviceCode: string): Promise<CameraDevice> {
    const newDevice = this.createDeviceBase(
      '360',
      deviceCode,
      `360智能摄像头 ${deviceCode}`,
      `https://example.com/stream/${deviceCode}`,
      `https://picsum.photos/400/300?random=${Date.now()}`
    );
    this.devices.push(newDevice);
    this.notifyConnection(newDevice);
    return newDevice;
  }

  async connectHaier(deviceCode: string): Promise<CameraDevice> {
    const newDevice = this.createDeviceBase(
      'haier',
      deviceCode,
      `海尔摄像头 ${deviceCode}`,
      `https://example.com/stream/${deviceCode}`,
      `https://picsum.photos/400/300?random=${Date.now()}`
    );
    this.devices.push(newDevice);
    this.notifyConnection(newDevice);
    return newDevice;
  }

  async connectOnvif(ipAddress: string, username: string, password: string, port: number = 80): Promise<CameraDevice> {
    const newDevice = this.createDeviceBase(
      'onvif',
      'ONVIF Camera',
      `ONVIF设备 ${ipAddress}`,
      `rtsp://${username}:${password}@${ipAddress}:${port}/stream`,
      `https://picsum.photos/400/300?random=${Date.now()}`,
      { ipAddress, port }
    );
    this.devices.push(newDevice);
    this.notifyConnection(newDevice);
    return newDevice;
  }

  async connectGeneric(config: { ipAddress: string; port: number; username: string; password: string; streamUrl?: string }): Promise<CameraDevice> {
    const newDevice = this.createDeviceBase(
      'generic',
      'Generic IP Camera',
      `IP摄像头 ${config.ipAddress}`,
      config.streamUrl || `rtsp://${config.username}:${config.password}@${config.ipAddress}:${config.port}/stream`,
      `https://picsum.photos/400/300?random=${Date.now()}`,
      { ipAddress: config.ipAddress, port: config.port }
    );
    this.devices.push(newDevice);
    this.notifyConnection(newDevice);
    return newDevice;
  }

  async getAllDevices(): Promise<CameraDevice[]> {
    if (this.devices.length === 0) {
      this.devices = [
        {
          id: 'cam-default-1',
          brand: 'xiaomi',
          model: 'MJSXJ02CM',
          name: '客厅摄像头',
          status: 'online',
          streamUrl: 'rtsp://192.168.1.100:554/stream1',
          thumbnail: 'https://example.com/thumb1.jpg',
          lastActive: new Date().toISOString(),
          capabilities: this.getDefaultCapabilities(),
          settings: this.getDefaultSettings(),
          protocol: 'rtsp',
        },
        {
          id: 'cam-default-2',
          brand: 'huawei',
          model: 'HQ8',
          name: '卧室摄像头',
          status: 'offline',
          streamUrl: '',
          thumbnail: 'https://example.com/thumb2.jpg',
          lastActive: new Date(Date.now() - 3600000).toISOString(),
          capabilities: this.getDefaultCapabilities(),
          settings: this.getDefaultSettings(),
          protocol: 'rtsp',
        },
      ];
    }
    return [...this.devices];
  }

  async getDeviceById(deviceId: string): Promise<CameraDevice | null> {
    return this.devices.find(d => d.id === deviceId) || null;
  }

  async removeDevice(deviceId: string): Promise<boolean> {
    const index = this.devices.findIndex(d => d.id === deviceId);
    if (index !== -1) {
      this.devices.splice(index, 1);
      return true;
    }
    return false;
  }

  async getCapability(brand: string): Promise<DeviceCapability> {
    return brandCapabilities[brand] || brandCapabilities.xiaomi;
  }

  async pairDevice(config: DeviceConfig, onProgress?: (progress: PairingProgress) => void): Promise<CameraDevice> {
    const stages: Array<{ stage: PairingProgress['stage']; message: string; delay: number }> = [
      { stage: 'scanning', message: '正在扫描设备...', delay: 800 },
      { stage: 'connecting', message: '正在连接设备...', delay: 1000 },
      { stage: 'verifying', message: '正在验证设备...', delay: 800 },
      { stage: 'completed', message: '配对成功！', delay: 400 },
    ];

    for (let i = 0; i < stages.length; i++) {
      const { stage, message, delay } = stages[i];
      onProgress?.({
        stage,
        message,
        progress: ((i + 1) / stages.length) * 100,
      });
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    switch (config.brand) {
      case 'xiaomi': return this.connectXiaomi(config.deviceCode);
      case 'huawei': return this.connectHuawei(config.deviceCode);
      case 'honor': return this.connectHonor(config.deviceCode);
      case 'ezviz': return this.connectEzviz(config.deviceCode);
      case 'tapo': return this.connectTapo(config.deviceCode);
      case 'hikvision': return this.connectHikvision(config.ipAddress || '', config.username || '', config.password || '');
      case 'dahua': return this.connectDahua(config.ipAddress || '', config.username || '', config.password || '');
      case 'yi': return this.connectYi(config.deviceCode);
      case 'ring': return this.connectRing(config.accountId || '');
      case 'nest': return this.connectNest(config.accountId || '');
      case 'eufy': return this.connectEufy(config.deviceCode);
      case '360': return this.connect360(config.deviceCode);
      case 'haier': return this.connectHaier(config.deviceCode);
      case 'onvif': return this.connectOnvif(config.ipAddress || '', config.username || '', config.password || '', config.port);
      case 'generic': return this.connectGeneric({
        ipAddress: config.ipAddress || '',
        port: config.port || 554,
        username: config.username || '',
        password: config.password || '',
        streamUrl: config.streamUrl,
      });
      default: throw new Error(`Unsupported brand: ${config.brand}`);
    }
  }

  async updateStream(deviceId: string, options: StreamOptions): Promise<boolean> {
    const device = this.devices.find(d => d.id === deviceId);
    if (device) {
      console.log(`Updated stream options for ${deviceId}:`, options);
      return true;
    }
    return false;
  }

  onDeviceConnection(callback: (device: CameraDevice) => void) {
    this.connectionCallbacks.push(callback);
  }

  private notifyConnection(device: CameraDevice) {
    this.connectionCallbacks.forEach(cb => cb(device));
  }
}

export const cameraManager = new CameraManager();