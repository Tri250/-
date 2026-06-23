import type { CameraDevice, EzvizDeviceInfo, EzvizAccessToken, ONVIFDiscoveryResult, Go2rtcStreamConfig, Go2rtcServerInfo, CameraAddRequest, CameraBrand } from '../types/camera';
import { api } from '../lib/api';

const GO2RTC_BASE = '/api/go2rtc';
const API_BASE = '/cameras';

class CameraAdapterService {
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private devices: CameraDevice[] = [];

  constructor() {
    this.loadDevices();
  }

  private async loadDevices(): Promise<void> {
    try {
      const response = await api.get<{ devices: CameraDevice[] }>(API_BASE);
      this.devices = response.devices || [];
    } catch (error) {
      console.error('[CameraAdapterService] Failed to load devices:', error);
      this.devices = [];
    }
  }

  // ─── 萤石 SDK ──────────────────────────────────────────────

  async getEzvizAccessToken(appKey: string, appSecret: string): Promise<EzvizAccessToken> {
    const response = await api.post<{ token: EzvizAccessToken }>(`${API_BASE}/ezviz/token`, {
      appKey,
      appSecret,
    });
    const token = response.token;
    this.accessToken = token.accessToken;
    this.tokenExpiresAt = Date.now() + token.expiresIn * 1000;
    return token;
  }

  async refreshEzvizToken(refreshToken: string): Promise<EzvizAccessToken> {
    const response = await api.post<{ token: EzvizAccessToken }>(`${API_BASE}/ezviz/token/refresh`, {
      refreshToken,
    });
    const token = response.token;
    this.accessToken = token.accessToken;
    this.tokenExpiresAt = Date.now() + token.expiresIn * 1000;
    return token;
  }

  async getEzvizDeviceList(accessToken: string): Promise<EzvizDeviceInfo[]> {
    const response = await api.get<{ devices: EzvizDeviceInfo[] }>(`${API_BASE}/ezviz/devices`, {
      headers: { 'X-Ezviz-Token': accessToken },
    } as any);
    return response.devices || [];
  }

  async getEzvizDeviceInfo(accessToken: string, deviceSerial: string): Promise<EzvizDeviceInfo | null> {
    const response = await api.get<{ device: EzvizDeviceInfo }>(`${API_BASE}/ezviz/devices/${deviceSerial}`, {
      headers: { 'X-Ezviz-Token': accessToken },
    } as any);
    return response.device || null;
  }

  async getEzvizStreamUrl(accessToken: string, deviceSerial: string, protocol: 'rtsp' | 'ezopen' = 'ezopen'): Promise<string> {
    const response = await api.post<{ streamUrl: string }>(`${API_BASE}/ezviz/devices/${deviceSerial}/stream`, {
      protocol,
      accessToken,
    });
    return response.streamUrl;
  }

  // ─── ONVIF 协议 ────────────────────────────────────────────

  async discoverONVIFDevices(timeout: number = 5000): Promise<ONVIFDiscoveryResult[]> {
    const response = await api.post<{ devices: ONVIFDiscoveryResult[] }>(`${API_BASE}/onvif/discover`, { timeout });
    return response.devices || [];
  }

  async getONVIFDeviceInfo(ipAddress: string, port: number = 80): Promise<ONVIFDiscoveryResult | null> {
    const response = await api.post<{ device: ONVIFDiscoveryResult }>(`${API_BASE}/onvif/device-info`, {
      ipAddress,
      port,
    });
    return response.device || null;
  }

  async getONVIFStreamUrl(ipAddress: string, port: number, username: string, password: string): Promise<string> {
    const response = await api.post<{ streamUrl: string }>(`${API_BASE}/onvif/stream-url`, {
      ipAddress,
      port,
      username,
      password,
    });
    return response.streamUrl;
  }

  // ─── go2rtc 流媒体服务器 ──────────────────────────────────

  async getGo2rtcServerInfo(): Promise<Go2rtcServerInfo> {
    const response = await api.get<{ server: Go2rtcServerInfo }>(`${GO2RTC_BASE}/info`);
    return response.server;
  }

  async getGo2rtcStreams(): Promise<Go2rtcStreamConfig[]> {
    const response = await api.get<{ streams: Go2rtcStreamConfig[] }>(`${GO2RTC_BASE}/streams`);
    return response.streams || [];
  }

  async addGo2rtcStream(config: Go2rtcStreamConfig): Promise<boolean> {
    const response = await api.post<{ success: boolean }>(`${GO2RTC_BASE}/streams`, config);
    return response.success;
  }

  async removeGo2rtcStream(name: string): Promise<boolean> {
    const response = await api.delete<{ success: boolean }>(`${GO2RTC_BASE}/streams/${encodeURIComponent(name)}`);
    return response.success;
  }

  async getGo2rtcWebRTCUrl(streamName: string): Promise<string> {
    const response = await api.get<{ webrtcUrl: string }>(`${GO2RTC_BASE}/streams/${encodeURIComponent(streamName)}/webrtc`);
    return response.webrtcUrl;
  }

  // ─── 设备 CRUD ─────────────────────────────────────────────

  async getDevices(): Promise<CameraDevice[]> {
    try {
      const response = await api.get<{ devices: CameraDevice[] }>(API_BASE);
      this.devices = response.devices || [];
      return [...this.devices];
    } catch (error) {
      console.error('[CameraAdapterService] Failed to fetch devices:', error);
      return [...this.devices];
    }
  }

  async getDeviceById(deviceId: string): Promise<CameraDevice | null> {
    try {
      const response = await api.get<{ device: CameraDevice }>(`${API_BASE}/${deviceId}`);
      return response.device || null;
    } catch (error) {
      console.error('[CameraAdapterService] Failed to fetch device:', error);
      return this.devices.find(d => d.id === deviceId) || null;
    }
  }

  async addDevice(request: CameraAddRequest): Promise<CameraDevice> {
    const response = await api.post<{ device: CameraDevice }>(API_BASE, request);
    const device = response.device;
    this.devices.push(device);

    if (request.brand === 'ezviz' && device.go2rtcId) {
      await this.addGo2rtcStream({
        name: device.go2rtcId,
        source: device.streamUrl!,
        webrtc: true,
      });
    }

    return device;
  }

  async updateDevice(deviceId: string, updates: Partial<CameraDevice>): Promise<CameraDevice | null> {
    const response = await api.put<{ device: CameraDevice }>(`${API_BASE}/${deviceId}`, updates);
    const updated = response.device;
    if (updated) {
      const index = this.devices.findIndex(d => d.id === deviceId);
      if (index !== -1) {
        this.devices[index] = updated;
      }
    }
    return updated;
  }

  async deleteDevice(deviceId: string): Promise<boolean> {
    const device = this.devices.find(d => d.id === deviceId);
    if (device?.go2rtcId) {
      await this.removeGo2rtcStream(device.go2rtcId).catch(() => {});
    }
    await api.delete(`${API_BASE}/${deviceId}`);
    this.devices = this.devices.filter(d => d.id !== deviceId);
    return true;
  }

  async refreshDeviceStatus(deviceId: string): Promise<CameraDevice | null> {
    const response = await api.post<{ device: CameraDevice }>(`${API_BASE}/${deviceId}/refresh`);
    const refreshed = response.device;
    if (refreshed) {
      const index = this.devices.findIndex(d => d.id === deviceId);
      if (index !== -1) {
        this.devices[index] = refreshed;
      }
    }
    return refreshed;
  }

  async testConnection(deviceId: string): Promise<{ success: boolean; latency?: number; error?: string }> {
    const response = await api.post<{ success: boolean; latency?: number; error?: string }>(
      `${API_BASE}/${deviceId}/test-connection`
    );
    return response;
  }

  // ─── PTZ 控制 ──────────────────────────────────────────────

  async ptzControl(deviceId: string, action: 'up' | 'down' | 'left' | 'right' | 'zoomIn' | 'zoomOut' | 'stop'): Promise<boolean> {
    const response = await api.post<{ success: boolean }>(`${API_BASE}/${deviceId}/ptz`, { action });
    return response.success;
  }

  async setPreset(deviceId: string, presetName: string): Promise<boolean> {
    const response = await api.post<{ success: boolean }>(`${API_BASE}/${deviceId}/presets`, { name: presetName });
    return response.success;
  }

  async goToPreset(deviceId: string, presetId: string): Promise<boolean> {
    const response = await api.post<{ success: boolean }>(`${API_BASE}/${deviceId}/presets/${presetId}/go`);
    return response.success;
  }

  // ─── 设备设置 ──────────────────────────────────────────────

  async updateSettings(deviceId: string, settings: CameraDevice['settings']): Promise<CameraDevice | null> {
    return this.updateDevice(deviceId, { settings });
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
      { type: 'sd_card', enabled: true },
    ];
    if (brand === 'ezviz' || brand === 'xiaomi') {
      return [
        ...baseCapabilities,
        { type: 'two_way_audio', enabled: true },
        { type: 'ptz', enabled: true },
        { type: 'cloud_storage', enabled: true },
      ];
    }
    return [
      ...baseCapabilities,
      { type: 'two_way_audio', enabled: false },
      { type: 'ptz', enabled: false },
      { type: 'cloud_storage', enabled: false },
    ];
  }

  private getDefaultSettings(): CameraDevice['settings'] {
    return {
      resolution: '1080p',
      nightVisionMode: 'auto',
      motionDetection: { enabled: true, sensitivity: 60, notificationEnabled: true },
      recording: { mode: 'motion', quality: 'medium', storage: 'sd' },
      audio: { enabled: true, volume: 70, noiseReduction: true },
      aiTracking: { enabled: true, targetType: 'pet', smoothTracking: true },
    };
  }
}

export const cameraAdapterService = new CameraAdapterService();