import type { CameraDevice, DeviceConfig, StreamOptions, DeviceCapability, PairingProgress, BrandInfo, CameraCapability, CameraSettings, CameraBrand } from '../types/camera';
import { capacitorBridge } from './capacitorBridge';
import { databaseService } from './databaseService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.pawsync.com/v1';

const WS_PROXY_BASE = import.meta.env.VITE_WS_PROXY_BASE || 'wss://stream.pawsync.com';

const IP_BRANDS: Set<string> = new Set(['hikvision', 'dahua', 'onvif', 'generic']);
const ACCOUNT_BRANDS: Set<string> = new Set(['ring', 'nest']);
const CODE_BRANDS: Set<string> = new Set(['xiaomi', 'huawei', 'honor', 'ezviz', 'tapo', 'yi', 'eufy', '360', 'haier']);

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

// ===== Helper: fetch with retry =====
async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  let lastError: Error | null = null;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Client error ${response.status}: ${response.statusText}`);
      }
      lastError = new Error(`Server error ${response.status}: ${response.statusText}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
    if (i < retries - 1) {
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw lastError || new Error('Request failed after retries');
}

// ===== RTSP URL builders per IP brand =====
function buildHikvisionRtsp(ip: string, username: string, password: string): string {
  return `rtsp://${username}:${password}@${ip}:554/Streaming/Channels/101`;
}

function buildDahuaRtsp(ip: string, username: string, password: string): string {
  return `rtsp://${username}:${password}@${ip}:554/cam/realmonitor?channel=1&subtype=0`;
}

function buildOnvifRtsp(ip: string, port: number, username: string, password: string): string {
  return `rtsp://${username}:${password}@${ip}:${port}/stream1`;
}

function buildGenericRtsp(ip: string, port: number, username: string, password: string, customUrl?: string): string {
  return customUrl || `rtsp://${username}:${password}@${ip}:${port}/stream`;
}

// ===== Convert RTSP to HLS/FLV via WebSocket proxy =====
function rtspToHlsUrl(rtspUrl: string): string {
  const encoded = encodeURIComponent(rtspUrl);
  return `${WS_PROXY_BASE}/hls/${encoded}/index.m3u8`;
}

function rtspToFlvUrl(rtspUrl: string): string {
  const encoded = encodeURIComponent(rtspUrl);
  return `${WS_PROXY_BASE}/flv/${encoded}`;
}

class CameraManager {
  private devices: CameraDevice[] = [];
  private connectionCallbacks: Array<(device: CameraDevice) => void> = [];
  private initialized = false;

  constructor() {
    this.loadFromDB();
  }

  private async loadFromDB() {
    try {
      const saved = await databaseService.getAll<CameraDevice>(databaseService.STORES.cameras);
      this.devices = saved;
    } catch (err) {
      console.error('Failed to load devices from IndexedDB:', err);
      this.devices = [];
    }
    this.initialized = true;
  }

  private async ensureLoaded() {
    if (!this.initialized) {
      await this.loadFromDB();
    }
  }

  private async persistDevice(device: CameraDevice) {
    try {
      await databaseService.put(databaseService.STORES.cameras, device);
    } catch (err) {
      console.error('Failed to persist device:', err);
    }
  }

  private async removePersistedDevice(deviceId: string) {
    try {
      await databaseService.delete(databaseService.STORES.cameras, deviceId);
    } catch (err) {
      console.error('Failed to remove device from IndexedDB:', err);
    }
  }

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

  // ===== Photo capture =====
  async takePhoto(): Promise<string> {
    const photo = await capacitorBridge.takePhoto();
    return photo.path || photo.webPath;
  }

  async pickImage(): Promise<string> {
    const photo = await capacitorBridge.pickImage();
    return photo.path || photo.webPath;
  }

  // ===== IP camera connection (Hikvision / Dahua / ONVIF / Generic) =====
  private async connectIPCamera(params: {
    brand: CameraBrand;
    model: string;
    name: string;
    ipAddress: string;
    port: number;
    username: string;
    password: string;
    rtspUrl: string;
  }): Promise<CameraDevice> {
    await this.ensureLoaded();

    const existing = this.devices.find((d) => d.brand === params.brand && d.ipAddress === params.ipAddress);
    if (existing) {
      existing.status = 'online';
      existing.lastActive = new Date().toISOString();
      existing.streamUrl = params.rtspUrl;
      await this.persistDevice(existing);
      this.notifyConnection(existing);
      return existing;
    }

    const hlsUrl = rtspToHlsUrl(params.rtspUrl);
    const device: CameraDevice = {
      id: `cam-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      brand: params.brand,
      model: params.model,
      name: params.name,
      status: 'online',
      streamUrl: hlsUrl,
      lastActive: new Date().toISOString(),
      capabilities: this.getDefaultCapabilities(),
      settings: this.getDefaultSettings(),
      protocol: 'hls',
      ipAddress: params.ipAddress,
      port: params.port,
      username: params.username,
      password: params.password,
    };

    this.devices.push(device);
    await this.persistDevice(device);
    this.notifyConnection(device);
    return device;
  }

  async connectHikvision(ipAddress: string, username: string, password: string): Promise<CameraDevice> {
    const rtspUrl = buildHikvisionRtsp(ipAddress, username, password);
    return this.connectIPCamera({
      brand: 'hikvision',
      model: 'IP Camera',
      name: `海康威视 ${ipAddress}`,
      ipAddress,
      port: 554,
      username,
      password,
      rtspUrl,
    });
  }

  async connectDahua(ipAddress: string, username: string, password: string): Promise<CameraDevice> {
    const rtspUrl = buildDahuaRtsp(ipAddress, username, password);
    return this.connectIPCamera({
      brand: 'dahua',
      model: 'IP Camera',
      name: `大华摄像头 ${ipAddress}`,
      ipAddress,
      port: 554,
      username,
      password,
      rtspUrl,
    });
  }

  async connectOnvif(ipAddress: string, username: string, password: string, port: number = 80): Promise<CameraDevice> {
    const rtspUrl = buildOnvifRtsp(ipAddress, port, username, password);
    return this.connectIPCamera({
      brand: 'onvif',
      model: 'ONVIF Camera',
      name: `ONVIF设备 ${ipAddress}`,
      ipAddress,
      port,
      username,
      password,
      rtspUrl,
    });
  }

  async connectGeneric(config: { ipAddress: string; port: number; username: string; password: string; streamUrl?: string }): Promise<CameraDevice> {
    const rtspUrl = buildGenericRtsp(config.ipAddress, config.port, config.username, config.password, config.streamUrl);
    return this.connectIPCamera({
      brand: 'generic',
      model: 'Generic IP Camera',
      name: `IP摄像头 ${config.ipAddress}`,
      ipAddress: config.ipAddress,
      port: config.port,
      username: config.username,
      password: config.password,
      rtspUrl,
    });
  }

  // ===== Cloud account camera connection (Ring / Nest) =====
  private async connectAccountCamera(params: {
    brand: CameraBrand;
    model: string;
    accountId: string;
  }): Promise<CameraDevice> {
    await this.ensureLoaded();

    const response = await fetchWithRetry(`${API_BASE_URL}/cameras/${params.brand}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: params.accountId }),
    });

    const result = await response.json();

    const device: CameraDevice = {
      id: result.id || `cam-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      brand: params.brand,
      model: params.model,
      name: result.name || `${params.brand} 摄像头`,
      status: 'online',
      streamUrl: result.streamUrl,
      lastActive: new Date().toISOString(),
      capabilities: this.getDefaultCapabilities(),
      settings: this.getDefaultSettings(),
      protocol: 'hls',
      accessToken: result.accessToken,
    };

    this.devices.push(device);
    await this.persistDevice(device);
    this.notifyConnection(device);
    return device;
  }

  async connectRing(accountId: string): Promise<CameraDevice> {
    return this.connectAccountCamera({ brand: 'ring', model: 'Doorbell', accountId });
  }

  async connectNest(accountId: string): Promise<CameraDevice> {
    return this.connectAccountCamera({ brand: 'nest', model: 'Nest Cam', accountId });
  }

  // ===== Pairing-code camera connection (Xiaomi / Huawei / Honor / Ezviz / Tapo / Yi / Eufy / 360 / Haier) =====
  private async connectCodeCamera(params: {
    brand: CameraBrand;
    model: string;
    name: string;
    deviceCode: string;
  }): Promise<CameraDevice> {
    await this.ensureLoaded();

    const existing = this.devices.find((d) => d.brand === params.brand && d.model === params.deviceCode);
    if (existing) {
      existing.status = 'online';
      existing.lastActive = new Date().toISOString();
      await this.persistDevice(existing);
      this.notifyConnection(existing);
      return existing;
    }

    const response = await fetchWithRetry(`${API_BASE_URL}/cameras/${params.brand}/bind`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceCode: params.deviceCode }),
    });

    const result = await response.json();

    const device: CameraDevice = {
      id: result.id || `cam-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      brand: params.brand,
      model: params.deviceCode,
      name: result.name || params.name,
      status: 'online',
      streamUrl: result.streamUrl,
      lastActive: new Date().toISOString(),
      capabilities: this.getDefaultCapabilities(),
      settings: this.getDefaultSettings(),
      protocol: 'hls',
      accessToken: result.accessToken,
    };

    this.devices.push(device);
    await this.persistDevice(device);
    this.notifyConnection(device);
    return device;
  }

  async connectXiaomi(deviceCode: string): Promise<CameraDevice> {
    return this.connectCodeCamera({ brand: 'xiaomi', model: deviceCode, name: `小米摄像头 ${deviceCode}`, deviceCode });
  }

  async connectHuawei(deviceCode: string): Promise<CameraDevice> {
    return this.connectCodeCamera({ brand: 'huawei', model: deviceCode, name: `华为摄像头 ${deviceCode}`, deviceCode });
  }

  async connectHonor(deviceCode: string): Promise<CameraDevice> {
    return this.connectCodeCamera({ brand: 'honor', model: deviceCode, name: `荣耀摄像头 ${deviceCode}`, deviceCode });
  }

  async connectEzviz(deviceCode: string): Promise<CameraDevice> {
    return this.connectCodeCamera({ brand: 'ezviz', model: deviceCode, name: `萤石摄像头 ${deviceCode}`, deviceCode });
  }

  async connectTapo(deviceCode: string): Promise<CameraDevice> {
    return this.connectCodeCamera({ brand: 'tapo', model: deviceCode, name: `TP-Link Tapo ${deviceCode}`, deviceCode });
  }

  async connectYi(deviceCode: string): Promise<CameraDevice> {
    return this.connectCodeCamera({ brand: 'yi', model: deviceCode, name: `小蚁摄像头 ${deviceCode}`, deviceCode });
  }

  async connectEufy(deviceCode: string): Promise<CameraDevice> {
    return this.connectCodeCamera({ brand: 'eufy', model: deviceCode, name: `Eufy 摄像头 ${deviceCode}`, deviceCode });
  }

  async connect360(deviceCode: string): Promise<CameraDevice> {
    return this.connectCodeCamera({ brand: '360', model: deviceCode, name: `360智能摄像头 ${deviceCode}`, deviceCode });
  }

  async connectHaier(deviceCode: string): Promise<CameraDevice> {
    return this.connectCodeCamera({ brand: 'haier', model: deviceCode, name: `海尔摄像头 ${deviceCode}`, deviceCode });
  }

  // ===== Stream =====
  async getStream(deviceId: string): Promise<MediaStream> {
    await this.ensureLoaded();

    const device = this.devices.find((d) => d.id === deviceId);
    if (!device || device.status !== 'online') {
      throw new Error(`Camera ${deviceId} is not available`);
    }

    // Phone camera: use getUserMedia
    if (device.brand === ('phone' as CameraBrand)) {
      try {
        return await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (err) {
        throw new Error('Failed to access phone camera: ' + (err instanceof Error ? err.message : String(err)));
      }
    }

    // IP / cloud cameras: use HLS/FLV stream URL
    // In a Capacitor app, the video element with HLS.js or FLV.js handles the stream.
    // Here we return a MediaStream by creating an HTMLVideoElement-based capture.
    if (device.streamUrl) {
      throw new Error(
        `IP/cloud camera streams should be played via HLS/FLV player, not getUserMedia. ` +
        `Use streamUrl: ${device.streamUrl} with an HLS/FLV compatible player.`
      );
    }

    throw new Error(`No stream available for device ${deviceId}`);
  }

  getStreamUrl(deviceId: string): string | undefined {
    const device = this.devices.find((d) => d.id === deviceId);
    return device?.streamUrl;
  }

  getFlvStreamUrl(deviceId: string): string | undefined {
    const device = this.devices.find((d) => d.id === deviceId);
    if (!device?.streamUrl) return undefined;
    // If the streamUrl is already an HLS URL, derive the FLV URL from the original RTSP
    if (IP_BRANDS.has(device.brand) && device.ipAddress && device.username && device.password) {
      const rtspUrl = this.buildRtspFromDevice(device);
      return rtspToFlvUrl(rtspUrl);
    }
    return undefined;
  }

  private buildRtspFromDevice(device: CameraDevice): string {
    const { ipAddress, port, username, password, brand } = device;
    switch (brand) {
      case 'hikvision':
        return buildHikvisionRtsp(ipAddress!, username!, password!);
      case 'dahua':
        return buildDahuaRtsp(ipAddress!, username!, password!);
      case 'onvif':
        return buildOnvifRtsp(ipAddress!, port || 80, username!, password!);
      default:
        return buildGenericRtsp(ipAddress!, port || 554, username!, password!);
    }
  }

  // ===== Device CRUD =====
  async getAllDevices(): Promise<CameraDevice[]> {
    await this.ensureLoaded();
    return [...this.devices];
  }

  async getDeviceById(deviceId: string): Promise<CameraDevice | null> {
    await this.ensureLoaded();
    return this.devices.find((d) => d.id === deviceId) || null;
  }

  async removeDevice(deviceId: string): Promise<boolean> {
    await this.ensureLoaded();
    const index = this.devices.findIndex((d) => d.id === deviceId);
    if (index !== -1) {
      const [removed] = this.devices.splice(index, 1);
      await this.removePersistedDevice(removed.id);
      return true;
    }
    return false;
  }

  async getCapability(brand: string): Promise<DeviceCapability> {
    return brandCapabilities[brand] || brandCapabilities.xiaomi;
  }

  // ===== Pairing with real backend API =====
  async pairDevice(config: DeviceConfig, onProgress?: (progress: PairingProgress) => void): Promise<CameraDevice> {
    const report = (stage: PairingProgress['stage'], message: string, progress: number) => {
      onProgress?.({ stage, message, progress });
    };

    try {
      // Stage 1: Scanning
      report('scanning', '正在扫描设备...', 10);

      if (IP_BRANDS.has(config.brand)) {
        // IP camera: verify connectivity via backend
        report('connecting', '正在连接设备...', 30);
        const probeResponse = await fetchWithRetry(`${API_BASE_URL}/cameras/probe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brand: config.brand,
            ipAddress: config.ipAddress,
            port: config.port,
            username: config.username,
            password: config.password,
          }),
        });
        const probeResult = await probeResponse.json();
        if (!probeResult.reachable) {
          report('error', '设备不可达，请检查IP地址和网络', 0);
          throw new Error('Device unreachable');
        }

        report('verifying', '正在验证设备凭据...', 60);
        if (!probeResult.authenticated) {
          report('error', '认证失败，请检查用户名和密码', 0);
          throw new Error('Authentication failed');
        }

        report('completed', '配对成功！', 100);
        return this.connectIPBrand(config);
      }

      if (ACCOUNT_BRANDS.has(config.brand)) {
        // Cloud account camera: OAuth via backend
        report('connecting', '正在通过云端认证...', 30);
        const oauthResponse = await fetchWithRetry(`${API_BASE_URL}/cameras/${config.brand}/oauth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accountId: config.accountId }),
        });
        const oauthResult = await oauthResponse.json();

        report('verifying', '正在获取设备列表...', 60);
        if (!oauthResult.devices || oauthResult.devices.length === 0) {
          report('error', '未找到关联的摄像头设备', 0);
          throw new Error('No devices found for this account');
        }

        report('completed', '配对成功！', 100);
        return this.connectAccountBrand(config);
      }

      if (CODE_BRANDS.has(config.brand)) {
        // Pairing code camera: bind via backend
        report('connecting', '正在绑定设备...', 30);
        const bindResponse = await fetchWithRetry(`${API_BASE_URL}/cameras/${config.brand}/bind`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceCode: config.deviceCode, name: config.name }),
        });
        const bindResult = await bindResponse.json();

        report('verifying', '正在验证设备...', 60);
        if (!bindResult.success) {
          report('error', bindResult.message || '设备绑定失败', 0);
          throw new Error(bindResult.message || 'Device binding failed');
        }

        report('completed', '配对成功！', 100);
        return this.connectCodeBrand(config);
      }

      throw new Error(`Unsupported brand: ${config.brand}`);
    } catch (err) {
      if ((err as Error).message !== 'Device unreachable' &&
          (err as Error).message !== 'Authentication failed' &&
          (err as Error).message !== 'No devices found for this account' &&
          !(err as Error).message.includes('Device binding failed')) {
        report('error', '配对失败，请重试', 0);
      }
      throw err;
    }
  }

  private connectIPBrand(config: DeviceConfig): Promise<CameraDevice> {
    switch (config.brand) {
      case 'hikvision':
        return this.connectHikvision(config.ipAddress || '', config.username || '', config.password || '');
      case 'dahua':
        return this.connectDahua(config.ipAddress || '', config.username || '', config.password || '');
      case 'onvif':
        return this.connectOnvif(config.ipAddress || '', config.username || '', config.password || '', config.port);
      case 'generic':
        return this.connectGeneric({
          ipAddress: config.ipAddress || '',
          port: config.port || 554,
          username: config.username || '',
          password: config.password || '',
          streamUrl: config.streamUrl,
        });
      default:
        throw new Error(`Not an IP brand: ${config.brand}`);
    }
  }

  private connectAccountBrand(config: DeviceConfig): Promise<CameraDevice> {
    switch (config.brand) {
      case 'ring':
        return this.connectRing(config.accountId || '');
      case 'nest':
        return this.connectNest(config.accountId || '');
      default:
        throw new Error(`Not an account brand: ${config.brand}`);
    }
  }

  private connectCodeBrand(config: DeviceConfig): Promise<CameraDevice> {
    switch (config.brand) {
      case 'xiaomi':
        return this.connectXiaomi(config.deviceCode!);
      case 'huawei':
        return this.connectHuawei(config.deviceCode!);
      case 'honor':
        return this.connectHonor(config.deviceCode!);
      case 'ezviz':
        return this.connectEzviz(config.deviceCode!);
      case 'tapo':
        return this.connectTapo(config.deviceCode!);
      case 'yi':
        return this.connectYi(config.deviceCode!);
      case 'eufy':
        return this.connectEufy(config.deviceCode!);
      case '360':
        return this.connect360(config.deviceCode!);
      case 'haier':
        return this.connectHaier(config.deviceCode!);
      default:
        throw new Error(`Not a code brand: ${config.brand}`);
    }
  }

  async updateStream(deviceId: string, options: StreamOptions): Promise<boolean> {
    await this.ensureLoaded();
    const device = this.devices.find((d) => d.id === deviceId);
    if (!device) return false;

    if (options.resolution) {
      device.settings.resolution = options.resolution as CameraSettings['resolution'];
    }
    if (options.nightVision) {
      device.settings.nightVisionMode = options.nightVision;
    }
    if (options.audioEnabled !== undefined) {
      device.settings.audio.enabled = options.audioEnabled;
    }

    await this.persistDevice(device);
    return true;
  }

  onDeviceConnection(callback: (device: CameraDevice) => void) {
    this.connectionCallbacks.push(callback);
  }

  private notifyConnection(device: CameraDevice) {
    this.connectionCallbacks.forEach((cb) => cb(device));
  }
}

export const cameraManager = new CameraManager();
