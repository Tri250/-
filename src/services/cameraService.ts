import type { CameraDevice, DeviceConfig, StreamOptions, DeviceCapability, CameraError, PairingProgress } from '../types/camera';

const MOCK_DELAY = 800;

const brandCapabilities: Record<string, DeviceCapability> = {
  xiaomi: {
    brand: 'xiaomi',
    supports1080p: true,
    supports720p: true,
    supports480p: true,
    supportsAudio: true,
    supportsNightVision: true,
    maxResolution: '1920x1080',
  },
  huawei: {
    brand: 'huawei',
    supports1080p: true,
    supports720p: true,
    supports480p: true,
    supportsAudio: true,
    supportsNightVision: true,
    maxResolution: '2560x1440',
  },
  honor: {
    brand: 'honor',
    supports1080p: true,
    supports720p: true,
    supports480p: true,
    supportsAudio: true,
    supportsNightVision: true,
    maxResolution: '1920x1080',
  },
};

class CameraManager {
  private devices: CameraDevice[] = [];
  private connectionCallbacks: Array<(device: CameraDevice) => void> = [];

  constructor() {
    this.initializeMockDevices();
  }

  private initializeMockDevices() {
    this.devices = [
      {
        id: 'cam-001',
        brand: 'xiaomi',
        model: 'MJSXJ02CM',
        name: '客厅摄像头',
        status: 'online',
        streamUrl: 'https://example.com/stream/cam-001',
        thumbnailUrl: 'https://picsum.photos/400/300?random=1',
        lastOnline: new Date().toISOString(),
        location: '客厅',
      },
      {
        id: 'cam-002',
        brand: 'huawei',
        model: 'HW-海雀Pro',
        name: '卧室摄像头',
        status: 'online',
        streamUrl: 'https://example.com/stream/cam-002',
        thumbnailUrl: 'https://picsum.photos/400/300?random=2',
        lastOnline: new Date().toISOString(),
        location: '卧室',
      },
      {
        id: 'cam-003',
        brand: 'honor',
        model: 'Honor-小值C1',
        name: '厨房摄像头',
        status: 'offline',
        streamUrl: 'https://example.com/stream/cam-003',
        thumbnailUrl: 'https://picsum.photos/400/300?random=3',
        lastOnline: new Date(Date.now() - 3600000).toISOString(),
        location: '厨房',
      },
    ];
  }

  async connectXiaomi(deviceCode: string): Promise<CameraDevice> {
    await this.simulateDelay(MOCK_DELAY);
    
    const existingDevice = this.devices.find(d => d.brand === 'xiaomi' && d.model === deviceCode);
    if (existingDevice) {
      existingDevice.status = 'online';
      existingDevice.lastOnline = new Date().toISOString();
      return existingDevice;
    }

    const newDevice: CameraDevice = {
      id: `cam-${Date.now()}`,
      brand: 'xiaomi',
      model: deviceCode,
      name: `小米摄像头 ${deviceCode}`,
      status: 'online',
      streamUrl: `https://example.com/stream/${deviceCode}`,
      thumbnailUrl: `https://picsum.photos/400/300?random=${Date.now()}`,
      lastOnline: new Date().toISOString(),
    };

    this.devices.push(newDevice);
    this.notifyConnection(newDevice);
    return newDevice;
  }

  async connectHuawei(deviceCode: string): Promise<CameraDevice> {
    await this.simulateDelay(MOCK_DELAY);
    
    const existingDevice = this.devices.find(d => d.brand === 'huawei' && d.model === deviceCode);
    if (existingDevice) {
      existingDevice.status = 'online';
      existingDevice.lastOnline = new Date().toISOString();
      return existingDevice;
    }

    const newDevice: CameraDevice = {
      id: `cam-${Date.now()}`,
      brand: 'huawei',
      model: deviceCode,
      name: `华为摄像头 ${deviceCode}`,
      status: 'online',
      streamUrl: `https://example.com/stream/${deviceCode}`,
      thumbnailUrl: `https://picsum.photos/400/300?random=${Date.now()}`,
      lastOnline: new Date().toISOString(),
    };

    this.devices.push(newDevice);
    this.notifyConnection(newDevice);
    return newDevice;
  }

  async connectHonor(deviceCode: string): Promise<CameraDevice> {
    await this.simulateDelay(MOCK_DELAY);
    
    const existingDevice = this.devices.find(d => d.brand === 'honor' && d.model === deviceCode);
    if (existingDevice) {
      existingDevice.status = 'online';
      existingDevice.lastOnline = new Date().toISOString();
      return existingDevice;
    }

    const newDevice: CameraDevice = {
      id: `cam-${Date.now()}`,
      brand: 'honor',
      model: deviceCode,
      name: `荣耀摄像头 ${deviceCode}`,
      status: 'online',
      streamUrl: `https://example.com/stream/${deviceCode}`,
      thumbnailUrl: `https://picsum.photos/400/300?random=${Date.now()}`,
      lastOnline: new Date().toISOString(),
    };

    this.devices.push(newDevice);
    this.notifyConnection(newDevice);
    return newDevice;
  }

  async getStream(deviceId: string): Promise<MediaStream> {
    await this.simulateDelay(500);
    
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

  async getAllDevices(): Promise<CameraDevice[]> {
    await this.simulateDelay(300);
    return [...this.devices];
  }

  async getDeviceById(deviceId: string): Promise<CameraDevice | null> {
    await this.simulateDelay(200);
    return this.devices.find(d => d.id === deviceId) || null;
  }

  async removeDevice(deviceId: string): Promise<boolean> {
    await this.simulateDelay(500);
    const index = this.devices.findIndex(d => d.id === deviceId);
    if (index !== -1) {
      this.devices.splice(index, 1);
      return true;
    }
    return false;
  }

  async getCapability(brand: string): Promise<DeviceCapability> {
    await this.simulateDelay(200);
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
      await this.simulateDelay(delay);
    }

    switch (config.brand) {
      case 'xiaomi':
        return this.connectXiaomi(config.deviceCode);
      case 'huawei':
        return this.connectHuawei(config.deviceCode);
      case 'honor':
        return this.connectHonor(config.deviceCode);
      default:
        throw new Error(`Unsupported brand: ${config.brand}`);
    }
  }

  async updateStream(deviceId: string, options: StreamOptions): Promise<boolean> {
    await this.simulateDelay(300);
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

  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const cameraManager = new CameraManager();
