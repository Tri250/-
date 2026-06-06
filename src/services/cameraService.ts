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
  ezviz: {
    brand: 'ezviz',
    supports1080p: true,
    supports720p: true,
    supports480p: true,
    supportsAudio: true,
    supportsNightVision: true,
    maxResolution: '2560x1440',
  },
  tapo: {
    brand: 'tapo',
    supports1080p: true,
    supports720p: true,
    supports480p: true,
    supportsAudio: true,
    supportsNightVision: true,
    maxResolution: '1920x1080',
  },
  hikvision: {
    brand: 'hikvision',
    supports1080p: true,
    supports720p: true,
    supports480p: true,
    supportsAudio: true,
    supportsNightVision: true,
    maxResolution: '3840x2160',
  },
  dahua: {
    brand: 'dahua',
    supports1080p: true,
    supports720p: true,
    supports480p: true,
    supportsAudio: true,
    supportsNightVision: true,
    maxResolution: '3840x2160',
  },
  yi: {
    brand: 'yi',
    supports1080p: true,
    supports720p: true,
    supports480p: true,
    supportsAudio: true,
    supportsNightVision: true,
    maxResolution: '1920x1080',
  },
  ring: {
    brand: 'ring',
    supports1080p: true,
    supports720p: true,
    supports480p: false,
    supportsAudio: true,
    supportsNightVision: true,
    maxResolution: '1920x1080',
  },
  nest: {
    brand: 'nest',
    supports1080p: true,
    supports720p: true,
    supports480p: true,
    supportsAudio: true,
    supportsNightVision: true,
    maxResolution: '2560x1440',
  },
  eufy: {
    brand: 'eufy',
    supports1080p: true,
    supports720p: true,
    supports480p: true,
    supportsAudio: true,
    supportsNightVision: true,
    maxResolution: '2560x1440',
  },
  '360': {
    brand: '360',
    supports1080p: true,
    supports720p: true,
    supports480p: true,
    supportsAudio: true,
    supportsNightVision: true,
    maxResolution: '1920x1080',
  },
  haier: {
    brand: 'haier',
    supports1080p: true,
    supports720p: true,
    supports480p: true,
    supportsAudio: true,
    supportsNightVision: true,
    maxResolution: '1920x1080',
  },
  onvif: {
    brand: 'onvif',
    supports1080p: true,
    supports720p: true,
    supports480p: true,
    supportsAudio: true,
    supportsNightVision: true,
    maxResolution: '3840x2160',
  },
  generic: {
    brand: 'generic',
    supports1080p: true,
    supports720p: true,
    supports480p: true,
    supportsAudio: true,
    supportsNightVision: true,
    maxResolution: '3840x2160',
  },
};

// 本地存储键
const STORAGE_KEY = 'pawsync_camera_devices';

// 媒体设备信息接口
export interface MediaDeviceInfo {
  deviceId: string;
  label: string;
  kind: 'videoinput' | 'audioinput';
  groupId: string;
}

class CameraManager {
  private devices: CameraDevice[] = [];
  private connectionCallbacks: Array<(device: CameraDevice) => void> = [];
  private currentStream: MediaStream | null = null;
  private permissionStatus: 'granted' | 'denied' | 'prompt' | 'unknown' = 'unknown';

  constructor() {
    this.loadDevicesFromStorage();
    this.checkPermission();
  }

  // 检查摄像头权限
  private async checkPermission(): Promise<void> {
    try {
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        this.permissionStatus = result.state as 'granted' | 'denied' | 'prompt';
        result.addEventListener('change', () => {
          this.permissionStatus = result.state as 'granted' | 'denied' | 'prompt';
        });
      }
    } catch (error) {
      console.warn('Permission API not supported:', error);
    }
  }

  // 从本地存储加载设备
  private loadDevicesFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.devices = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load devices from storage:', error);
      this.devices = [];
    }
  }

  // 保存设备到本地存储
  private saveDevicesToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.devices));
    } catch (error) {
      console.error('Failed to save devices to storage:', error);
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

  private createDeviceBase(brand: CameraBrand, model: string, name: string, streamUrl: string, thumbnail: string, extra?: Partial<CameraDevice>): CameraDevice {
    const device: CameraDevice = {
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
    return device;
  }

  // ==================== 真实硬件访问 API ====================

  /**
   * 请求摄像头权限
   */
  async requestPermission(): Promise<{ granted: boolean; status: string }> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach(track => track.stop());
      this.permissionStatus = 'granted';
      return { granted: true, status: 'granted' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('Permission denied')) {
        this.permissionStatus = 'denied';
        return { granted: false, status: 'denied' };
      }
      return { granted: false, status: 'error' };
    }
  }

  /**
   * 获取权限状态
   */
  getPermissionStatus(): 'granted' | 'denied' | 'prompt' | 'unknown' {
    return this.permissionStatus;
  }

  /**
   * 枚举所有可用的媒体设备
   */
  async enumerateDevices(): Promise<MediaDeviceInfo[]> {
    try {
      // 先请求权限以获取设备标签
      await this.requestPermission();
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter(device => device.kind === 'videoinput' || device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `未知设备 (${device.kind})`,
          kind: device.kind as 'videoinput' | 'audioinput',
          groupId: device.groupId,
        }));
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
      throw new Error('无法枚举媒体设备');
    }
  }

  /**
   * 获取视频输入设备（摄像头）列表
   */
  async getVideoDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await this.enumerateDevices();
    return devices.filter(d => d.kind === 'videoinput');
  }

  /**
   * 获取音频输入设备（麦克风）列表
   */
  async getAudioDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await this.enumerateDevices();
    return devices.filter(d => d.kind === 'audioinput');
  }

  /**
   * 获取指定设备的媒体流（真实摄像头访问）
   * @param deviceId 设备ID，为空则使用默认设备
   * @param options 流选项
   */
  async getMediaStream(
    deviceId?: string,
    options: {
      video?: boolean | MediaTrackConstraints;
      audio?: boolean | MediaTrackConstraints;
    } = {}
  ): Promise<MediaStream> {
    try {
      // 停止之前的流
      this.stopCurrentStream();

      const constraints: MediaStreamConstraints = {
        video: deviceId 
          ? { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
          : { width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: options.audio !== false ? { echoCancellation: true, noiseSuppression: true } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.currentStream = stream;
      
      // 监听轨道结束事件
      stream.getTracks().forEach(track => {
        track.addEventListener('ended', () => {
          if (this.currentStream === stream) {
            this.currentStream = null;
          }
        });
      });

      return stream;
    } catch (error) {
      console.error('Failed to get media stream:', error);
      throw new Error(`无法访问摄像头: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取屏幕共享流
   */
  async getDisplayStream(options: DisplayMediaStreamOptions = {}): Promise<MediaStream> {
    try {
      this.stopCurrentStream();
      
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor' },
        audio: false,
        ...options,
      });
      
      this.currentStream = stream;
      return stream;
    } catch (error) {
      console.error('Failed to get display stream:', error);
      throw new Error(`无法获取屏幕共享: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 停止当前媒体流
   */
  stopCurrentStream(): void {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => {
        track.stop();
      });
      this.currentStream = null;
    }
  }

  /**
   * 获取当前活动的媒体流
   */
  getCurrentStream(): MediaStream | null {
    return this.currentStream;
  }

  /**
   * 捕获视频帧为图片
   */
  captureFrame(videoElement: HTMLVideoElement): string | null {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.9);
    } catch (error) {
      console.error('Failed to capture frame:', error);
      return null;
    }
  }

  /**
   * 切换摄像头（前后置）
   */
  async switchCamera(currentFacingMode: 'user' | 'environment' = 'user'): Promise<MediaStream> {
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    
    try {
      this.stopCurrentStream();
      
      const constraints: MediaStreamConstraints = {
        video: { facingMode: newFacingMode },
        audio: true,
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.currentStream = stream;
      return stream;
    } catch (error) {
      console.error('Failed to switch camera:', error);
      throw new Error(`无法切换摄像头: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 调整视频轨道设置（亮度、对比度等）
   */
  async applyVideoConstraints(constraints: MediaTrackConstraints): Promise<void> {
    if (!this.currentStream) {
      throw new Error('没有活动的视频流');
    }

    const videoTrack = this.currentStream.getVideoTracks()[0];
    if (!videoTrack) {
      throw new Error('没有视频轨道');
    }

    try {
      await videoTrack.applyConstraints(constraints);
    } catch (error) {
      console.error('Failed to apply video constraints:', error);
      throw new Error(`无法应用视频设置: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取视频轨道的当前设置
   */
  getVideoSettings(): MediaTrackSettings | null {
    if (!this.currentStream) return null;
    const videoTrack = this.currentStream.getVideoTracks()[0];
    return videoTrack ? videoTrack.getSettings() : null;
  }

  /**
   * 获取视频轨道支持的能力
   */
  getVideoCapabilities(): MediaTrackCapabilities | null {
    if (!this.currentStream) return null;
    const videoTrack = this.currentStream.getVideoTracks()[0];
    return videoTrack ? videoTrack.getCapabilities() : null;
  }

  // ==================== IP 摄像头连接方法 ====================

  async connectXiaomi(deviceCode: string): Promise<CameraDevice> {
    const existingDevice = this.devices.find(d => d.brand === 'xiaomi' && d.model === deviceCode);
    if (existingDevice) {
      existingDevice.status = 'online';
      existingDevice.lastActive = new Date().toISOString();
      this.saveDevicesToStorage();
      return existingDevice;
    }

    const newDevice = this.createDeviceBase(
      'xiaomi',
      deviceCode,
      `小米摄像头 ${deviceCode}`,
      `https://example.com/stream/${deviceCode}`,
      ''
    );

    this.devices.push(newDevice);
    this.saveDevicesToStorage();
    this.notifyConnection(newDevice);
    return newDevice;
  }

  async connectHuawei(deviceCode: string): Promise<CameraDevice> {
    const existingDevice = this.devices.find(d => d.brand === 'huawei' && d.model === deviceCode);
    if (existingDevice) {
      existingDevice.status = 'online';
      existingDevice.lastActive = new Date().toISOString();
      this.saveDevicesToStorage();
      return existingDevice;
    }

    const newDevice = this.createDeviceBase(
      'huawei',
      deviceCode,
      `华为摄像头 ${deviceCode}`,
      `https://example.com/stream/${deviceCode}`,
      ''
    );

    this.devices.push(newDevice);
    this.saveDevicesToStorage();
    this.notifyConnection(newDevice);
    return newDevice;
  }

  async connectHonor(deviceCode: string): Promise<CameraDevice> {
    const existingDevice = this.devices.find(d => d.brand === 'honor' && d.model === deviceCode);
    if (existingDevice) {
      existingDevice.status = 'online';
      existingDevice.lastActive = new Date().toISOString();
      this.saveDevicesToStorage();
      return existingDevice;
    }

    const newDevice = this.createDeviceBase(
      'honor',
      deviceCode,
      `荣耀摄像头 ${deviceCode}`,
      `https://example.com/stream/${deviceCode}`,
      ''
    );

    this.devices.push(newDevice);
    this.saveDevicesToStorage();
    this.notifyConnection(newDevice);
    return newDevice;
  }

  async connectEzviz(deviceCode: string): Promise<CameraDevice> {
    const existingDevice = this.devices.find(d => d.brand === 'ezviz' && d.model === deviceCode);
    if (existingDevice) {
      existingDevice.status = 'online';
      existingDevice.lastActive = new Date().toISOString();
      this.saveDevicesToStorage();
      return existingDevice;
    }

    const newDevice = this.createDeviceBase(
      'ezviz',
      deviceCode,
      `萤石摄像头 ${deviceCode}`,
      `https://example.com/stream/${deviceCode}`,
      ''
    );

    this.devices.push(newDevice);
    this.saveDevicesToStorage();
    this.notifyConnection(newDevice);
    return newDevice;
  }

  async connectTapo(deviceCode: string): Promise<CameraDevice> {
    const existingDevice = this.devices.find(d => d.brand === 'tapo' && d.model === deviceCode);
    if (existingDevice) {
      existingDevice.status = 'online';
      existingDevice.lastActive = new Date().toISOString();
      this.saveDevicesToStorage();
      return existingDevice;
    }

    const newDevice = this.createDeviceBase(
      'tapo',
      deviceCode,
      `TP-Link Tapo ${deviceCode}`,
      `https://example.com/stream/${deviceCode}`,
      ''
    );

    this.devices.push(newDevice);
    this.saveDevicesToStorage();
    this.notifyConnection(newDevice);
    return newDevice;
  }

  async connectHikvision(ipAddress: string, username: string, password: string): Promise<CameraDevice> {
    const existingDevice = this.devices.find(d => d.brand === 'hikvision' && d.ipAddress === ipAddress);
    if (existingDevice) {
      existingDevice.status = 'online';
      existingDevice.lastActive = new Date().toISOString();
      this.saveDevicesToStorage();
      return existingDevice;
    }

    const newDevice = this.createDeviceBase(
      'hikvision',
      'IP Camera',
      `海康威视 ${ipAddress}`,
      `rtsp://${username}:${password}@${ipAddress}:554/stream1`,
      '',
      { ipAddress, port: 554 }
    );

    this.devices.push(newDevice);
    this.saveDevicesToStorage();
    this.notifyConnection(newDevice);
    return newDevice;
  }

  async connectDahua(ipAddress: string, username: string, password: string): Promise<CameraDevice> {
    const existingDevice = this.devices.find(d => d.brand === 'dahua' && d.ipAddress === ipAddress);
    if (existingDevice) {
      existingDevice.status = 'online';
      existingDevice.lastActive = new Date().toISOString();
      this.saveDevicesToStorage();
      return existingDevice;
    }

    const newDevice = this.createDeviceBase(
      'dahua',
      'IP Camera',
      `大华摄像头 ${ipAddress}`,
      `rtsp://${username}:${password}@${ipAddress}:554/cam/realmonitor?channel=1&subtype=0`,
      '',
      { ipAddress, port: 554 }
    );

    this.devices.push(newDevice);
    this.saveDevicesToStorage();
    this.notifyConnection(newDevice);
    return newDevice;
  }

  async connectYi(deviceCode: string): Promise<CameraDevice> {
    const existingDevice = this.devices.find(d => d.brand === 'yi' && d.model === deviceCode);
    if (existingDevice) {
      existingDevice.status = 'online';
      existingDevice.lastActive = new Date().toISOString();
      this.saveDevicesToStorage();
      return existingDevice;
    }

    const newDevice = this.createDeviceBase(
      'yi',
      deviceCode,
      `小蚁摄像头 ${deviceCode}`,
      `https://example.com/stream/${deviceCode}`,
      ''
    );

    this.devices.push(newDevice);
    this.saveDevicesToStorage();
    this.notifyConnection(newDevice);
    return newDevice;
  }

  async connectRing(_accountId: string): Promise<CameraDevice> {
    const newDevice = this.createDeviceBase(
      'ring',
      'Doorbell',
      `Ring 门铃`,
      `https://example.com/stream/ring-${Date.now()}`,
      ''
    );

    this.devices.push(newDevice);
    this.saveDevicesToStorage();
    this.notifyConnection(newDevice);
    return newDevice;
  }

  async connectNest(_accountId: string): Promise<CameraDevice> {
    const newDevice = this.createDeviceBase(
      'nest',
      'Nest Cam',
      `Nest 摄像头`,
      `https://example.com/stream/nest-${Date.now()}`,
      ''
    );

    this.devices.push(newDevice);
    this.saveDevicesToStorage();
    this.notifyConnection(newDevice);
    return newDevice;
  }

  async connectEufy(deviceCode: string): Promise<CameraDevice> {
    const existingDevice = this.devices.find(d => d.brand === 'eufy' && d.model === deviceCode);
    if (existingDevice) {
      existingDevice.status = 'online';
      existingDevice.lastActive = new Date().toISOString();
      this.saveDevicesToStorage();
      return existingDevice;
    }

    const newDevice = this.createDeviceBase(
      'eufy',
      deviceCode,
      `Eufy 摄像头 ${deviceCode}`,
      `https://example.com/stream/${deviceCode}`,
      ''
    );

    this.devices.push(newDevice);
    this.saveDevicesToStorage();
    this.notifyConnection(newDevice);
    return newDevice;
  }

  async connect360(deviceCode: string): Promise<CameraDevice> {
    const existingDevice = this.devices.find(d => d.brand === '360' && d.model === deviceCode);
    if (existingDevice) {
      existingDevice.status = 'online';
      existingDevice.lastActive = new Date().toISOString();
      this.saveDevicesToStorage();
      return existingDevice;
    }

    const newDevice = this.createDeviceBase(
      '360',
      deviceCode,
      `360智能摄像头 ${deviceCode}`,
      `https://example.com/stream/${deviceCode}`,
      ''
    );

    this.devices.push(newDevice);
    this.saveDevicesToStorage();
    this.notifyConnection(newDevice);
    return newDevice;
  }

  async connectHaier(deviceCode: string): Promise<CameraDevice> {
    const existingDevice = this.devices.find(d => d.brand === 'haier' && d.model === deviceCode);
    if (existingDevice) {
      existingDevice.status = 'online';
      existingDevice.lastActive = new Date().toISOString();
      this.saveDevicesToStorage();
      return existingDevice;
    }

    const newDevice = this.createDeviceBase(
      'haier',
      deviceCode,
      `海尔摄像头 ${deviceCode}`,
      `https://example.com/stream/${deviceCode}`,
      ''
    );

    this.devices.push(newDevice);
    this.saveDevicesToStorage();
    this.notifyConnection(newDevice);
    return newDevice;
  }

  async connectOnvif(ipAddress: string, username: string, password: string, port: number = 80): Promise<CameraDevice> {
    const existingDevice = this.devices.find(d => d.brand === 'onvif' && d.ipAddress === ipAddress);
    if (existingDevice) {
      existingDevice.status = 'online';
      existingDevice.lastActive = new Date().toISOString();
      this.saveDevicesToStorage();
      return existingDevice;
    }

    const newDevice = this.createDeviceBase(
      'onvif',
      'ONVIF Camera',
      `ONVIF设备 ${ipAddress}`,
      `rtsp://${username}:${password}@${ipAddress}:${port}/stream`,
      '',
      { ipAddress, port }
    );

    this.devices.push(newDevice);
    this.saveDevicesToStorage();
    this.notifyConnection(newDevice);
    return newDevice;
  }

  async connectGeneric(config: { ipAddress: string; port: number; username: string; password: string; streamUrl?: string }): Promise<CameraDevice> {
    const existingDevice = this.devices.find(d => d.brand === 'generic' && d.ipAddress === config.ipAddress);
    if (existingDevice) {
      existingDevice.status = 'online';
      existingDevice.lastActive = new Date().toISOString();
      this.saveDevicesToStorage();
      return existingDevice;
    }

    const newDevice = this.createDeviceBase(
      'generic',
      'Generic IP Camera',
      `IP摄像头 ${config.ipAddress}`,
      config.streamUrl || `rtsp://${config.username}:${config.password}@${config.ipAddress}:${config.port}/stream`,
      '',
      { ipAddress: config.ipAddress, port: config.port }
    );

    this.devices.push(newDevice);
    this.saveDevicesToStorage();
    this.notifyConnection(newDevice);
    return newDevice;
  }

  // ==================== 设备管理方法 ====================

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

  async getAllDevices(): Promise<CameraDevice[]> {
    return [...this.devices];
  }

  async getDeviceById(deviceId: string): Promise<CameraDevice | null> {
    return this.devices.find(d => d.id === deviceId) || null;
  }

  async removeDevice(deviceId: string): Promise<boolean> {
    const index = this.devices.findIndex(d => d.id === deviceId);
    if (index !== -1) {
      this.devices.splice(index, 1);
      this.saveDevicesToStorage();
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
      case 'xiaomi':
        return this.connectXiaomi(config.deviceCode || '');
      case 'huawei':
        return this.connectHuawei(config.deviceCode || '');
      case 'honor':
        return this.connectHonor(config.deviceCode || '');
      case 'ezviz':
        return this.connectEzviz(config.deviceCode || '');
      case 'tapo':
        return this.connectTapo(config.deviceCode || '');
      case 'hikvision':
        return this.connectHikvision(config.ipAddress || '', config.username || '', config.password || '');
      case 'dahua':
        return this.connectDahua(config.ipAddress || '', config.username || '', config.password || '');
      case 'yi':
        return this.connectYi(config.deviceCode || '');
      case 'ring':
        return this.connectRing(config.accountId || '');
      case 'nest':
        return this.connectNest(config.accountId || '');
      case 'eufy':
        return this.connectEufy(config.deviceCode || '');
      case '360':
        return this.connect360(config.deviceCode || '');
      case 'haier':
        return this.connectHaier(config.deviceCode || '');
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
        throw new Error(`Unsupported brand: ${config.brand}`);
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
