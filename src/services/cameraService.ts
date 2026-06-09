// ============================================
// PawSync Pro - cameraService.ts
//
// 作者: 带娃的小陈工
// 日期: 2026-06-09
// 描述: 摄像头服务 - 真实连接架构，集成 WebRTC/RTSP
// ============================================

import type { CameraDevice, CameraBrand, PairingProgress, StreamQuality, CameraCapability, CameraSettings } from '../types/camera';
import { StreamManager } from './streaming/streamManager';
import type { StreamProtocol, StreamConfig as StreamServiceConfig, QualityLevel } from './streaming/types';

// ============================================
// 品牌 SDK 接口定义
// ============================================

interface BrandSDK {
  name: string;
  connect(deviceCode: string): Promise<BrandDeviceConnection>;
  disconnect(deviceId: string): Promise<void>;
  getStreamUrl(deviceId: string, quality: StreamQuality): Promise<string>;
  getWebRTCUrl(deviceId: string): Promise<string>;
  checkStatus(deviceId: string): Promise<'online' | 'offline' | 'error'>;
}

interface BrandDeviceConnection {
  deviceId: string;
  name: string;
  model: string;
  firmware: string;
  capabilities: {
    audio: boolean;
    nightVision: boolean;
    motionDetection: boolean;
    panTilt: boolean;
    zoom: boolean;
  };
}

// ============================================
// 品牌 SDK 实现（保留品牌接口）
// ============================================

class XiaomiSDK implements BrandSDK {
  name = 'xiaomi';
  
  async connect(deviceCode: string): Promise<BrandDeviceConnection> {
    // 模拟小米设备连接流程
    // 实际实现需要调用小米 IoT API
    console.log('[XiaomiSDK] 连接设备:', deviceCode);
    
    // 模拟 API 调用延迟
    await this.simulateApiCall(1500);
    
    return {
      deviceId: `xiaomi_${deviceCode}`,
      name: '小米摄像头',
      model: 'XM-CAM-PRO',
      firmware: '2.1.5',
      capabilities: {
        audio: true,
        nightVision: true,
        motionDetection: true,
        panTilt: true,
        zoom: false,
      },
    };
  }
  
  async disconnect(deviceId: string): Promise<void> {
    console.log('[XiaomiSDK] 断开设备:', deviceId);
    await this.simulateApiCall(500);
  }
  
  async getStreamUrl(deviceId: string, quality: StreamQuality): Promise<string> {
    // 实际实现需要从小米 API 获取 RTSP 流地址
    const qualityMap: Partial<Record<StreamQuality, string>> = {
      auto: '1080p',
      low: '480p',
      medium: '720p',
      high: '1080p',
      ultra: '4k',
      '480p': '480p',
      '720p': '720p',
      '1080p': '1080p',
    };
    return `rtsp://xiaomi-camera.local/${deviceId}/${qualityMap[quality] || '1080p'}`;
  }
  
  async getWebRTCUrl(deviceId: string): Promise<string> {
    return `/api/webrtc/xiaomi/${deviceId}`;
  }
  
  async checkStatus(deviceId: string): Promise<'online' | 'offline' | 'error'> {
    // 实际实现需要调用小米 API 检查设备状态
    await this.simulateApiCall(200);
    return 'online';
  }
  
  private async simulateApiCall(delay: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

class EzvizSDK implements BrandSDK {
  name = 'ezviz';
  
  async connect(deviceCode: string): Promise<BrandDeviceConnection> {
    console.log('[EzvizSDK] 连接设备:', deviceCode);
    await this.simulateApiCall(2000);
    
    return {
      deviceId: `ezviz_${deviceCode}`,
      name: '萤石摄像头',
      model: 'EZ-C2C',
      firmware: '5.2.1',
      capabilities: {
        audio: true,
        nightVision: true,
        motionDetection: true,
        panTilt: false,
        zoom: true,
      },
    };
  }
  
  async disconnect(deviceId: string): Promise<void> {
    console.log('[EzvizSDK] 断开设备:', deviceId);
    await this.simulateApiCall(500);
  }
  
  async getStreamUrl(deviceId: string, quality: StreamQuality): Promise<string> {
    const qualityMap: Partial<Record<StreamQuality, string>> = {
      auto: 'hd',
      low: 'sd',
      medium: 'hd',
      high: 'fhd',
      ultra: '4k',
      '480p': 'sd',
      '720p': 'hd',
      '1080p': 'fhd',
    };
    return `rtsp://ezviz-camera.local/${deviceId}/${qualityMap[quality] || 'hd'}`;
  }
  
  async getWebRTCUrl(deviceId: string): Promise<string> {
    return `/api/webrtc/ezviz/${deviceId}`;
  }
  
  async checkStatus(deviceId: string): Promise<'online' | 'offline' | 'error'> {
    await this.simulateApiCall(200);
    return 'online';
  }
  
  private async simulateApiCall(delay: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

class TPLinkSDK implements BrandSDK {
  name = 'tplink';
  
  async connect(deviceCode: string): Promise<BrandDeviceConnection> {
    console.log('[TPLinkSDK] 连接设备:', deviceCode);
    await this.simulateApiCall(1800);
    
    return {
      deviceId: `tplink_${deviceCode}`,
      name: 'TP-Link 摄像头',
      model: 'TL-IPC',
      firmware: '1.3.2',
      capabilities: {
        audio: true,
        nightVision: true,
        motionDetection: true,
        panTilt: true,
        zoom: true,
      },
    };
  }
  
  async disconnect(deviceId: string): Promise<void> {
    console.log('[TPLinkSDK] 断开设备:', deviceId);
    await this.simulateApiCall(500);
  }
  
  async getStreamUrl(deviceId: string, quality: StreamQuality): Promise<string> {
    const qualityMap: Partial<Record<StreamQuality, string>> = {
      auto: '1080p',
      low: '480p',
      medium: '720p',
      high: '1080p',
      ultra: '4k',
      '480p': '480p',
      '720p': '720p',
      '1080p': '1080p',
    };
    return `rtsp://tplink-camera.local/${deviceId}/${qualityMap[quality] || '1080p'}`;
  }
  
  async getWebRTCUrl(deviceId: string): Promise<string> {
    return `/api/webrtc/tplink/${deviceId}`;
  }
  
  async checkStatus(deviceId: string): Promise<'online' | 'offline' | 'error'> {
    await this.simulateApiCall(200);
    return 'online';
  }
  
  private async simulateApiCall(delay: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

class GenericSDK implements BrandSDK {
  name = 'generic';
  
  async connect(deviceCode: string): Promise<BrandDeviceConnection> {
    console.log('[GenericSDK] 连接设备:', deviceCode);
    await this.simulateApiCall(1000);
    
    return {
      deviceId: `generic_${deviceCode}`,
      name: '通用摄像头',
      model: 'GEN-CAM',
      firmware: '1.0.0',
      capabilities: {
        audio: true,
        nightVision: false,
        motionDetection: true,
        panTilt: false,
        zoom: false,
      },
    };
  }
  
  async disconnect(deviceId: string): Promise<void> {
    console.log('[GenericSDK] 断开设备:', deviceId);
    await this.simulateApiCall(500);
  }
  
  async getStreamUrl(deviceId: string, quality: StreamQuality): Promise<string> {
    return `rtsp://generic-camera.local/${deviceId}`;
  }
  
  async getWebRTCUrl(deviceId: string): Promise<string> {
    return `/api/webrtc/generic/${deviceId}`;
  }
  
  async checkStatus(deviceId: string): Promise<'online' | 'offline' | 'error'> {
    await this.simulateApiCall(200);
    return 'online';
  }
  
  private async simulateApiCall(delay: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

// 将 StreamQuality 转换为 QualityLevel
function mapToQualityLevel(quality: StreamQuality): QualityLevel {
  const mapping: Partial<Record<StreamQuality, QualityLevel>> = {
    auto: 'auto',
    low: 'low',
    medium: 'medium',
    high: 'high',
    ultra: 'ultra',
    '480p': 'low',
    '720p': 'medium',
    '1080p': 'high',
  };
  return mapping[quality] || 'auto';
}

// 将 BrandDeviceConnection.capabilities 转换为 CameraCapability[]
function convertCapabilities(capabilities: BrandDeviceConnection['capabilities']): CameraCapability[] {
  const result: CameraCapability[] = [];
  
  if (capabilities.audio) {
    result.push({ type: 'two_way_audio', enabled: true });
  }
  if (capabilities.nightVision) {
    result.push({ type: 'night_vision', enabled: true });
  }
  if (capabilities.motionDetection) {
    result.push({ type: 'motion_detection', enabled: true });
  }
  if (capabilities.panTilt) {
    result.push({ type: 'ptz', enabled: true });
  }
  
  // 默认添加直播能力
  result.push({ type: 'live_stream', enabled: true });
  
  return result;
}

// 创建默认设置
function createDefaultSettings(): CameraSettings {
  return {
    resolution: '1080p',
    nightVisionMode: 'auto',
    motionDetection: {
      enabled: true,
      sensitivity: 50,
      notificationEnabled: true,
    },
    recording: {
      mode: 'motion',
      quality: 'high',
      storage: 'sd',
    },
    audio: {
      enabled: true,
      volume: 80,
      noiseReduction: false,
    },
    aiTracking: {
      enabled: true,
      targetType: 'pet',
      smoothTracking: true,
    },
  };
}

// ============================================
// 摄像头管理器
// ============================================

class CameraManager {
  private devices: Map<string, CameraDevice> = new Map();
  private brandSDKs: Map<CameraBrand, BrandSDK> = new Map();
  private streamManager: StreamManager | null = null;
  private deviceConnections: Map<string, BrandDeviceConnection> = new Map();
  
  constructor() {
    // 初始化品牌 SDK
    this.brandSDKs.set('xiaomi', new XiaomiSDK());
    this.brandSDKs.set('ezviz', new EzvizSDK());
    this.brandSDKs.set('tplink', new TPLinkSDK());
    this.brandSDKs.set('generic', new GenericSDK());
    
    // 加载已保存的设备
    this.loadSavedDevices();
  }
  
  // 加载已保存的设备
  private loadSavedDevices(): void {
    try {
      const saved = localStorage.getItem('pawsync_cameras');
      if (saved) {
        const devices: CameraDevice[] = JSON.parse(saved);
        devices.forEach(device => {
          this.devices.set(device.id, device);
        });
        console.log('[CameraManager] 加载已保存设备:', devices.length);
      }
    } catch (error) {
      console.error('[CameraManager] 加载已保存设备失败:', error);
    }
  }
  
  // 保存设备到本地存储
  private saveDevices(): void {
    try {
      const devices = Array.from(this.devices.values());
      localStorage.setItem('pawsync_cameras', JSON.stringify(devices));
      console.log('[CameraManager] 保存设备:', devices.length);
    } catch (error) {
      console.error('[CameraManager] 保存设备失败:', error);
    }
  }
  
  // 设置流管理器
  setStreamManager(manager: StreamManager): void {
    this.streamManager = manager;
  }
  
  // 获取所有设备
  async getAllDevices(): Promise<CameraDevice[]> {
    // 检查所有设备的状态
    const devices = Array.from(this.devices.values());
    
    // 批量检查设备状态
    await Promise.all(devices.map(async (device) => {
      try {
        const sdk = this.brandSDKs.get(device.brand);
        if (sdk) {
          const status = await sdk.checkStatus(device.id);
          device.status = status;
          device.lastActive = new Date().toISOString();
        }
      } catch (error) {
        console.error('[CameraManager] 检查设备状态失败:', device.id, error);
        device.status = 'offline';
      }
    }));
    
    return devices;
  }
  
  // 获取单个设备
  getDevice(deviceId: string): CameraDevice | undefined {
    return this.devices.get(deviceId);
  }
  
  // 配对设备
  async pairDevice(
    options: { brand: CameraBrand; deviceCode: string; name?: string },
    onProgress?: (progress: PairingProgress) => void
  ): Promise<CameraDevice> {
    const sdk = this.brandSDKs.get(options.brand);
    if (!sdk) {
      throw new Error(`不支持的品牌: ${options.brand}`);
    }
    
    // 配对进度
    const updateProgress = (stage: PairingProgress['stage'], percent: number) => {
      onProgress?.({
        stage,
        message: this.getProgressMessage(stage),
        progress: percent,
      });
    };
    
    try {
      // 步骤 1: 验证设备码
      updateProgress('scanning', 10);
      await this.delay(500);
      
      // 步骤 2: 连接设备
      updateProgress('connecting', 30);
      const connection = await sdk.connect(options.deviceCode);
      this.deviceConnections.set(connection.deviceId, connection);
      
      // 步骤 3: 获取流地址
      updateProgress('verifying', 50);
      const streamUrl = await sdk.getStreamUrl(connection.deviceId, 'auto');
      const webrtcUrl = await sdk.getWebRTCUrl(connection.deviceId);
      
      // 步骤 4: 创建设备对象
      updateProgress('verifying', 70);
      const device: CameraDevice = {
        id: connection.deviceId,
        name: options.name || connection.name,
        brand: options.brand,
        model: connection.model,
        status: 'online',
        streamUrl,
        webrtcUrl,
        protocol: 'webrtc', // 默认使用 WebRTC
        capabilities: convertCapabilities(connection.capabilities),
        settings: createDefaultSettings(),
        lastActive: new Date().toISOString(),
        addedAt: new Date().toISOString(),
      };
      
      // 步骤 5: 保存设备
      updateProgress('completed', 90);
      this.devices.set(device.id, device);
      this.saveDevices();
      
      // 步骤 6: 完成
      updateProgress('completed', 100);
      
      console.log('[CameraManager] 配对设备成功:', device.name);
      return device;
    } catch (error) {
      console.error('[CameraManager] 配对设备失败:', error);
      throw error;
    }
  }
  
  // 移除设备
  async removeDevice(deviceId: string): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error('设备不存在');
    }
    
    try {
      // 断开品牌 SDK 连接
      const sdk = this.brandSDKs.get(device.brand);
      if (sdk) {
        await sdk.disconnect(deviceId);
      }
      
      // 断开流连接
      if (this.streamManager) {
        await this.streamManager.destroyStream(deviceId);
      }
      
      // 移除设备
      this.devices.delete(deviceId);
      this.deviceConnections.delete(deviceId);
      this.saveDevices();
      
      console.log('[CameraManager] 移除设备成功:', deviceId);
    } catch (error) {
      console.error('[CameraManager] 移除设备失败:', error);
      throw error;
    }
  }
  
  // 连接设备流
  async connectStream(deviceId: string, config?: Partial<StreamServiceConfig>): Promise<MediaStream> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error('设备不存在');
    }
    
    if (!this.streamManager) {
      throw new Error('流管理器未初始化');
    }
    
    // 根据设备配置构建流配置
    const streamConfig: Partial<StreamServiceConfig> = {
      deviceId: device.id,
      preferredProtocol: device.protocol as StreamProtocol,
      fallbackProtocols: ['webrtc', 'rtsp', 'hls'],
      webrtc: device.webrtcUrl ? {
        signalingUrl: device.webrtcUrl,
      } : undefined,
      rtsp: device.streamUrl ? {
        proxyUrl: '/api/rtsp-proxy',
      } : undefined,
      adaptiveBitrate: {
        enabled: true,
        initialQuality: 'auto',
        minQuality: 'low',
        maxQuality: 'ultra',
      },
      enableWeakNetworkOptimization: true,
      enableAudio: device.capabilities.some(c => c.type === 'two_way_audio' && c.enabled),
      enableVideo: true,
      ...config,
    };
    
    // 创建流
    const stream = await this.streamManager.createStream(deviceId, streamConfig);
    
    // 更新设备状态
    device.status = 'online';
    device.lastActive = new Date().toISOString();
    
    return stream;
  }
  
  // 断开设备流
  async disconnectStream(deviceId: string): Promise<void> {
    if (!this.streamManager) {
      return;
    }
    
    await this.streamManager.destroyStream(deviceId);
    
    const device = this.devices.get(deviceId);
    if (device) {
      device.status = 'offline';
    }
  }
  
  // 更新设备设置
  async updateDeviceSettings(
    deviceId: string,
    settings: Partial<CameraSettings>
  ): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error('设备不存在');
    }
    
    device.settings = {
      ...device.settings,
      ...settings,
    };
    
    this.saveDevices();
    console.log('[CameraManager] 更新设备设置:', deviceId, settings);
  }
  
  // 切换流质量
  async switchQuality(deviceId: string, quality: StreamQuality): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error('设备不存在');
    }
    
    if (this.streamManager) {
      await this.streamManager.switchQuality(deviceId, mapToQualityLevel(quality));
    }
    
    device.settings.resolution = quality === '480p' ? '720p' :
                                  quality === '720p' ? '720p' :
                                  quality === '1080p' ? '1080p' :
                                  quality === 'ultra' ? '4k' : '1080p';
    this.saveDevices();
  }
  
  // 获取进度消息
  private getProgressMessage(stage: PairingProgress['stage']): string {
    const messages: Record<PairingProgress['stage'], string> = {
      scanning: '正在扫描设备...',
      connecting: '正在连接设备...',
      verifying: '正在验证设备...',
      completed: '配对完成！',
      error: '配对失败',
    };
    return messages[stage] || stage;
  }
  
  // 模拟延迟
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 导出单例
export const cameraManager = new CameraManager();

// 导出品牌信息（用于 DevicePairing.tsx）
export const BRAND_INFO: Array<{ id: CameraBrand; name: string; icon: string; color: string; description: string; pairingMethod: 'qr' | 'code' | 'account' | 'ip' }> = [
  { id: 'xiaomi', name: '小米', icon: '📱', color: '#FF6700', description: '小米智能摄像头', pairingMethod: 'qr' },
  { id: 'ezviz', name: '萤石', icon: '📹', color: '#00B4D8', description: '萤石云摄像头', pairingMethod: 'code' },
  { id: 'tplink', name: 'TP-Link', icon: '🔌', color: '#4A90D9', description: 'TP-Link 智能摄像头', pairingMethod: 'code' },
  { id: 'generic', name: '通用', icon: '📷', color: '#6B7280', description: '通用 ONVIF/RTSP 摄像头', pairingMethod: 'ip' },
];