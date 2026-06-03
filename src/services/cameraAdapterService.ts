import type { CameraDevice, EzvizDeviceInfo, EzvizAccessToken, ONVIFDiscoveryResult, Go2rtcStreamConfig, Go2rtcServerInfo, CameraAddRequest, CameraBrand } from '../types/camera';
const MOCK_DELAY = 800;
const GO2RTC_BASE = 'http://localhost:1984';
const mockEzvizDevices: EzvizDeviceInfo[] = [
 {
 deviceSerial: 'EZ1234567890',
 deviceName: '客厅摄像头',
 deviceModel: 'CS-C6CN-A0-1C2WFR',
 deviceType: 'IPC',
 status: 1,
 isOnline: true,
 ip: '192.168.1.100',
 localIp: '192.168.1.100',
 resolution: '1080P',
 supportH265: true,
 supportCloud: true,
 isEncrypt: false,
 capability: { ptz: true, talk: true, video: true, audio: true, sdCard: true, cloud: true }
 },
 {
 deviceSerial: 'EZ0987654321',
 deviceName: '阳台摄像头',
 deviceModel: 'CS-C3W-A0-1C2WFR',
 deviceType: 'IPC',
 status: 1,
 isOnline: true,
 ip: '192.168.1.101',
 localIp: '192.168.1.101',
 resolution: '720P',
 supportH265: false,
 supportCloud: true,
 isEncrypt: false,
 capability: { ptz: false, talk: false, video: true, audio: true, sdCard: true, cloud: true }
 }
];
const mockOnvifDevices: ONVIFDiscoveryResult[] = [
 {
 ipAddress: '192.168.1.102',
 port: 80,
 deviceName: 'TP-Link Tapo C100',
 manufacturer: 'TP-Link',
 model: 'Tapo C100',
 serialNumber: 'TL-C100-ABC123',
 hardWareId: 'C100v1',
 scopes: ['onvif://www.onvif.org/name/TapoC100', 'onvif://www.onvif.org/type/NetworkVideoTransmitter']
 },
 {
 ipAddress: '192.168.1.103',
 port: 8080,
 deviceName: 'Hikvision DS-2CD2043G0-I',
 manufacturer: 'Hikvision',
 model: 'DS-2CD2043G0-I',
 serialNumber: 'DS-2CD2043G0-I-12345',
 hardWareId: 'DS-2CD2043G0-I',
 scopes: ['onvif://www.onvif.org/name/DS-2CD2043G0-I']
 }
];
const mockGo2rtcStreams: Go2rtcStreamConfig[] = [
 { name: 'ezviz_living', source: 'rtsp://admin:password@192.168.1.100/stream1', webrtc: true },
 { name: 'tapo_balcony', source: 'rtsp://admin:password@192.168.1.102:554/stream1', webrtc: true },
 { name: 'hikvision_garden', source: 'rtsp://admin:password@192.168.1.103:554/stream1', webrtc: true }
];
class CameraAdapterService {
 private accessToken: string | null = null;
 private tokenExpiresAt: number = 0;
 private devices: CameraDevice[] = [];
 constructor() {
 this.initializeMockDevices();
 }
 private initializeMockDevices() {
 this.devices = [
 {
 id: 'cam-1',
 name: '客厅摄像头',
 brand: 'ezviz',
 model: 'CS-C6CN',
 status: 'online',
 lastActive: new Date().toISOString(),
 streamUrl: 'rtsp://admin:password@192.168.1.100/stream1',
 webrtcUrl: `${GO2RTC_BASE}/stream/webrtc?src=ezviz_living`,
 capabilities: [
 { type: 'live_stream', enabled: true },
 { type: 'two_way_audio', enabled: true },
 { type: 'ptz', enabled: true },
 { type: 'night_vision', enabled: true },
 { type: 'motion_detection', enabled: true },
 { type: 'cloud_storage', enabled: true },
 { type: 'sd_card', enabled: true }
 ],
 settings: {
 resolution: '1080p',
 nightVisionMode: 'auto',
 motionDetection: { enabled: true, sensitivity: 70, notificationEnabled: true },
 recording: { mode: 'motion', quality: 'high', storage: 'cloud' },
 audio: { enabled: true, volume: 80, noiseReduction: true },
 aiTracking: { enabled: true, targetType: 'pet', smoothTracking: true }
 },
 location: '客厅',
 ipAddress: '192.168.1.100',
 port: 554,
 protocol: 'rtsp',
 username: 'admin',
 password: 'password',
 go2rtcId: 'ezviz_living'
 },
 {
 id: 'cam-2',
 name: '阳台摄像头',
 brand: 'tapo',
 model: 'Tapo C100',
 status: 'online',
 lastActive: new Date().toISOString(),
 streamUrl: 'rtsp://admin:password@192.168.1.102:554/stream1',
 webrtcUrl: `${GO2RTC_BASE}/stream/webrtc?src=tapo_balcony`,
 capabilities: [
 { type: 'live_stream', enabled: true },
 { type: 'two_way_audio', enabled: false },
 { type: 'ptz', enabled: false },
 { type: 'night_vision', enabled: true },
 { type: 'motion_detection', enabled: true },
 { type: 'cloud_storage', enabled: false },
 { type: 'sd_card', enabled: true }
 ],
 settings: {
 resolution: '1080p',
 nightVisionMode: 'auto',
 motionDetection: { enabled: true, sensitivity: 60, notificationEnabled: true },
 recording: { mode: 'motion', quality: 'medium', storage: 'sd' },
 audio: { enabled: true, volume: 70, noiseReduction: false },
 aiTracking: { enabled: false, targetType: 'pet', smoothTracking: false }
 },
 location: '阳台',
 ipAddress: '192.168.1.102',
 port: 554,
 protocol: 'rtsp',
 username: 'admin',
 password: 'password',
 go2rtcId: 'tapo_balcony'
 },
 {
 id: 'cam-3',
 name: '花园摄像头',
 brand: 'hikvision',
 model: 'DS-2CD2043G0-I',
 status: 'offline',
 lastActive: new Date(Date.now() - 3600000).toISOString(),
 streamUrl: 'rtsp://admin:password@192.168.1.103:554/stream1',
 webrtcUrl: `${GO2RTC_BASE}/stream/webrtc?src=hikvision_garden`,
 capabilities: [
 { type: 'live_stream', enabled: true },
 { type: 'two_way_audio', enabled: false },
 { type: 'ptz', enabled: false },
 { type: 'night_vision', enabled: true },
 { type: 'motion_detection', enabled: true },
 { type: 'cloud_storage', enabled: false },
 { type: 'sd_card', enabled: true }
 ],
 settings: {
 resolution: '2k',
 nightVisionMode: 'auto',
 motionDetection: { enabled: true, sensitivity: 80, notificationEnabled: true },
 recording: { mode: 'always', quality: 'high', storage: 'sd' },
 audio: { enabled: false, volume: 50, noiseReduction: true },
 aiTracking: { enabled: true, targetType: 'pet', smoothTracking: false }
 },
 location: '花园',
 ipAddress: '192.168.1.103',
 port: 554,
 protocol: 'rtsp',
 username: 'admin',
 password: 'password',
 go2rtcId: 'hikvision_garden'
 }
 ];
 }
 async getEzvizAccessToken(_appKey: string, _appSecret: string): Promise<EzvizAccessToken> {
 await this.simulateDelay(MOCK_DELAY);
 this.accessToken = `ezviz_token_${Date.now()}`;
 this.tokenExpiresAt = Date.now() + 7200000;
 return {
 accessToken: this.accessToken,
 refreshToken: `refresh_${Date.now()}`,
 expiresIn: 7200,
 tokenType: 'Bearer'
 };
 }
 async refreshEzvizToken(_refreshToken: string): Promise<EzvizAccessToken> {
 await this.simulateDelay(MOCK_DELAY);
 this.accessToken = `ezviz_token_refreshed_${Date.now()}`;
 this.tokenExpiresAt = Date.now() + 7200000;
 return {
 accessToken: this.accessToken,
 refreshToken: `refresh_${Date.now()}`,
 expiresIn: 7200,
 tokenType: 'Bearer'
 };
 }
 async getEzvizDeviceList(_accessToken: string): Promise<EzvizDeviceInfo[]> {
 await this.simulateDelay(MOCK_DELAY);
 return [...mockEzvizDevices];
 }
 async getEzvizDeviceInfo(accessToken: string, deviceSerial: string): Promise<EzvizDeviceInfo | null> {
 await this.simulateDelay(MOCK_DELAY);
 return mockEzvizDevices.find(d => d.deviceSerial === deviceSerial) || null;
 }
 async getEzvizStreamUrl(accessToken: string, deviceSerial: string, protocol: 'rtsp' | 'ezopen' = 'ezopen'): Promise<string> {
 await this.simulateDelay(MOCK_DELAY);
 const device = mockEzvizDevices.find(d => d.deviceSerial === deviceSerial);
 if (!device)
 throw new Error('设备不存在');
 if (protocol === 'ezopen') {
 return `ezopen://open.ys7.com/${deviceSerial}/1.hd.live`;
 }
 return `rtsp://${device.localIp}:554/stream1`;
 }
 async discoverONVIFDevices(_timeout: number = 5000): Promise<ONVIFDiscoveryResult[]> {
 await this.simulateDelay(MOCK_DELAY);
 return [...mockOnvifDevices];
 }
 async getONVIFDeviceInfo(ipAddress: string, port: number = 80): Promise<ONVIFDiscoveryResult | null> {
 await this.simulateDelay(MOCK_DELAY);
 return mockOnvifDevices.find(d => d.ipAddress === ipAddress && d.port === port) || null;
 }
 async getONVIFStreamUrl(ipAddress: string, port: number, username: string, password: string): Promise<string> {
 await this.simulateDelay(MOCK_DELAY);
 return `rtsp://${username}:${password}@${ipAddress}:${port}/stream1`;
 }
 async getGo2rtcServerInfo(): Promise<Go2rtcServerInfo> {
 await this.simulateDelay(300);
 return {
 version: 'v1.8.5',
 uptime: 7200,
 streams: mockGo2rtcStreams.length,
 peers: 3
 };
 }
 async getGo2rtcStreams(): Promise<Go2rtcStreamConfig[]> {
 await this.simulateDelay(300);
 return [...mockGo2rtcStreams];
 }
 async addGo2rtcStream(config: Go2rtcStreamConfig): Promise<boolean> {
 await this.simulateDelay(500);
 mockGo2rtcStreams.push(config);
 return true;
 }
 async removeGo2rtcStream(name: string): Promise<boolean> {
 await this.simulateDelay(300);
 const initialLength = mockGo2rtcStreams.length;
 mockGo2rtcStreams.filter(s => s.name !== name);
 return mockGo2rtcStreams.length < initialLength;
 }
 async getGo2rtcWebRTCUrl(streamName: string): Promise<string> {
 await this.simulateDelay(200);
 return `${GO2RTC_BASE}/stream/webrtc?src=${streamName}`;
 }
 async getDevices(): Promise<CameraDevice[]> {
 await this.simulateDelay(300);
 return [...this.devices];
 }
 async getDeviceById(deviceId: string): Promise<CameraDevice | null> {
 await this.simulateDelay(200);
 return this.devices.find(d => d.id === deviceId) || null;
 }
 async addDevice(request: CameraAddRequest): Promise<CameraDevice> {
 await this.simulateDelay(MOCK_DELAY);
 const newDevice: CameraDevice = {
 id: `cam-${Date.now()}`,
 name: request.name,
 brand: request.brand,
 model: this.getModelByBrand(request.brand),
 status: 'online',
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
 if (request.brand === 'ezviz') {
 const go2rtcName = `ezviz_${Date.now()}`;
 await this.addGo2rtcStream({
 name: go2rtcName,
 source: newDevice.streamUrl!,
 webrtc: true
 });
 newDevice.webrtcUrl = `${GO2RTC_BASE}/stream/webrtc?src=${go2rtcName}`;
 newDevice.go2rtcId = go2rtcName;
 }
 this.devices.push(newDevice);
 return newDevice;
 }
 async updateDevice(deviceId: string, updates: Partial<CameraDevice>): Promise<CameraDevice | null> {
 await this.simulateDelay(300);
 const index = this.devices.findIndex(d => d.id === deviceId);
 if (index === -1)
 return null;
 this.devices[index] = { ...this.devices[index], ...updates };
 return this.devices[index];
 }
 async deleteDevice(deviceId: string): Promise<boolean> {
 await this.simulateDelay(300);
 const device = this.devices.find(d => d.id === deviceId);
 if (device?.go2rtcId) {
 await this.removeGo2rtcStream(device.go2rtcId);
 }
 const initialLength = this.devices.length;
 this.devices = this.devices.filter(d => d.id !== deviceId);
 return this.devices.length < initialLength;
 }
 async refreshDeviceStatus(deviceId: string): Promise<CameraDevice | null> {
 await this.simulateDelay(500);
 const device = this.devices.find(d => d.id === deviceId);
 if (!device)
 return null;
 device.status = Math.random() > 0.15 ? 'online' : 'offline';
 device.lastActive = new Date().toISOString();
 return device;
 }
 async testConnection(deviceId: string): Promise<{
 success: boolean;
 latency?: number;
 error?: string;
 }> {
 await this.simulateDelay(800);
 const device = this.devices.find(d => d.id === deviceId);
 if (!device) {
 return { success: false, error: '设备不存在' };
 }
 const latency = 50 + Math.floor(Math.random() * 200);
 const success = Math.random() > 0.1;
 return {
 success,
 latency: success ? latency : undefined,
 error: success ? undefined : '连接失败，请检查网络和设备设置'
 };
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
 private simulateDelay(ms: number): Promise<void> {
 return new Promise(resolve => setTimeout(resolve, ms));
 }
}
export const cameraAdapterService = new CameraAdapterService();