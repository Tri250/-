// ============================================
// 地理围栏服务
//
// 作者: 带娃的小陈工
// 日期: 2026-06-10
// 描述: 地理围栏服务，支持位置监控和
//       智能提醒触发
// ============================================

import {
  Location,
  GeofenceConfig,
  GeofenceEvent,
  GeofenceAction,
  DeviceCommand,
  IoTEventListener,
  IoTEventType,
  IoTEvent,
} from './types';

/**
 * 生成唯一ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 地理围栏服务配置
 */
interface GeofenceServiceConfig {
  // 位置更新间隔 (毫秒)
  updateInterval?: number;
  // 最小移动距离触发更新 (米)
  minimumDistance?: number;
  // 是否启用高精度定位
  highAccuracy?: boolean;
  // 最大围栏数量
  maxGeofences?: number;
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: GeofenceServiceConfig = {
  updateInterval: 5000,
  minimumDistance: 10,
  highAccuracy: true,
  maxGeofences: 20,
};

/**
 * 地理围栏服务类
 */
export class GeofenceService {
  // 配置
  private config: GeofenceServiceConfig;
  // 已设置的围栏
  private geofences: Map<string, GeofenceConfig> = new Map();
  // 当前位置
  private currentLocation: Location | null = null;
  // 上次位置
  private lastLocation: Location | null = null;
  // 进入事件回调
  private enterCallbacks: Map<string, Set<() => void>> = new Map();
  // 离开事件回调
  private exitCallbacks: Map<string, Set<() => void>> = new Map();
  // 位置监听器
  private locationListeners: Set<(location: Location) => void> = new Set();
  // 事件监听器
  private eventListeners: Set<IoTEventListener> = new Set();
  // 位置更新定时器
  private updateTimer: ReturnType<typeof setInterval> | null = null;
  // 围栏状态跟踪（记录是否在围栏内）
  private geofenceStates: Map<string, boolean> = new Map();
  // 是否正在监听
  private isMonitoring = false;
  // Watch ID (用于浏览器 Geolocation API)
  private watchId: number | null = null;

  constructor(config?: GeofenceServiceConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 设置地理围栏
   */
  async setupGeofence(config: GeofenceConfig): Promise<void> {
    // 验证配置
    if (!config.id || !config.name) {
      throw new Error('围栏 ID 和名称不能为空');
    }

    if (!config.center || !config.radius) {
      throw new Error('围栏中心点和半径不能为空');
    }

    // 检查数量限制
    if (this.geofences.size >= (this.config.maxGeofences || 20)) {
      throw new Error('已达到最大围栏数量限制');
    }

    // 保存围栏配置
    this.geofences.set(config.id, {
      ...config,
      createdAt: config.createdAt || new Date(),
      updatedAt: new Date(),
    });

    // 初始化围栏状态
    if (this.currentLocation) {
      const isInside = this.isLocationInGeofence(this.currentLocation, config);
      this.geofenceStates.set(config.id, isInside);
    }

    // 触发事件
    this.emitEvent({
      type: IoTEventType.GEOFENCE_ENTER, // 使用创建事件代替
      data: { action: 'created', geofence: config },
      timestamp: new Date(),
    });
  }

  /**
   * 移除地理围栏
   */
  async removeGeofence(geofenceId: string): Promise<void> {
    this.geofences.delete(geofenceId);
    this.geofenceStates.delete(geofenceId);
    this.enterCallbacks.delete(geofenceId);
    this.exitCallbacks.delete(geofenceId);
  }

  /**
   * 更新地理围栏
   */
  async updateGeofence(geofenceId: string, updates: Partial<GeofenceConfig>): Promise<void> {
    const geofence = this.geofences.get(geofenceId);
    if (!geofence) {
      throw new Error('围栏未找到');
    }

    const updatedGeofence: GeofenceConfig = {
      ...geofence,
      ...updates,
      id: geofence.id, // 防止 ID 被修改
      updatedAt: new Date(),
    };

    this.geofences.set(geofenceId, updatedGeofence);
  }

  /**
   * 获取所有围栏
   */
  getAllGeofences(): GeofenceConfig[] {
    return Array.from(this.geofences.values());
  }

  /**
   * 获取围栏
   */
  getGeofence(geofenceId: string): GeofenceConfig | undefined {
    return this.geofences.get(geofenceId);
  }

  /**
   * 注册进入围栏回调
   */
  onEnter(geofenceId: string, callback: () => void): () => void {
    if (!this.enterCallbacks.has(geofenceId)) {
      this.enterCallbacks.set(geofenceId, new Set());
    }
    this.enterCallbacks.get(geofenceId)?.add(callback);

    // 返回取消注册函数
    return () => {
      this.enterCallbacks.get(geofenceId)?.delete(callback);
    };
  }

  /**
   * 注册离开围栏回调
   */
  onExit(geofenceId: string, callback: () => void): () => void {
    if (!this.exitCallbacks.has(geofenceId)) {
      this.exitCallbacks.set(geofenceId, new Set());
    }
    this.exitCallbacks.get(geofenceId)?.add(callback);

    // 返回取消注册函数
    return () => {
      this.exitCallbacks.get(geofenceId)?.delete(callback);
    };
  }

  /**
   * 获取当前位置
   */
  async getCurrentLocation(): Promise<Location> {
    // 如果有缓存的位置且不太久，返回缓存
    if (this.currentLocation) {
      const age = Date.now() - this.currentLocation.timestamp.getTime();
      if (age < this.config.updateInterval!) {
        return this.currentLocation;
      }
    }

    // 获取新位置
    return this.fetchLocation();
  }

  /**
   * 开始位置监控
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;

    // 使用浏览器 Geolocation API
    if ('geolocation' in navigator) {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          this.handlePositionUpdate(position);
        },
        (error) => {
          console.error('位置获取错误:', error);
          this.emitEvent({
            type: IoTEventType.ERROR,
            data: { error: error.message },
            timestamp: new Date(),
          });
        },
        {
          enableHighAccuracy: this.config.highAccuracy,
          timeout: 10000,
          maximumAge: this.config.updateInterval,
        }
      );
    } else {
      // 如果浏览器不支持，使用模拟位置更新
      this.startMockLocationUpdates();
    }
  }

  /**
   * 停止位置监控
   */
  stopMonitoring(): void {
    this.isMonitoring = false;

    // 停止浏览器定位
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    // 停止模拟定位
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }

  /**
   * 添加位置监听器
   */
  addLocationListener(listener: (location: Location) => void): () => void {
    this.locationListeners.add(listener);
    return () => this.locationListeners.delete(listener);
  }

  /**
   * 添加事件监听器
   */
  addEventListener(listener: IoTEventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  /**
   * 检查位置是否在围栏内
   */
  isLocationInGeofence(location: Location, geofence: GeofenceConfig): boolean {
    const distance = this.calculateDistance(
      location.latitude,
      location.longitude,
      geofence.center.latitude,
      geofence.center.longitude
    );
    return distance <= geofence.radius;
  }

  /**
   * 获取位置到围栏的距离
   */
  getDistanceToGeofence(location: Location, geofenceId: string): number {
    const geofence = this.geofences.get(geofenceId);
    if (!geofence) {
      throw new Error('围栏未找到');
    }

    return this.calculateDistance(
      location.latitude,
      location.longitude,
      geofence.center.latitude,
      geofence.center.longitude
    );
  }

  /**
   * 获取当前位置所在的围栏
   */
  getCurrentGeofences(): GeofenceConfig[] {
    if (!this.currentLocation) {
      return [];
    }

    return this.getAllGeofences().filter(geofence =>
      this.isLocationInGeofence(this.currentLocation!, geofence)
    );
  }

  // ============== 私有方法 ==============

  /**
   * 获取位置
   */
  private async fetchLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = this.positionToLocation(position);
            this.currentLocation = location;
            resolve(location);
          },
          (error) => {
            reject(new Error(`位置获取失败: ${error.message}`));
          },
          {
            enableHighAccuracy: this.config.highAccuracy,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      } else {
        // 返回模拟位置
        const mockLocation = this.getMockLocation();
        this.currentLocation = mockLocation;
        resolve(mockLocation);
      }
    });
  }

  /**
   * 处理位置更新
   */
  private handlePositionUpdate(position: GeolocationPosition): void {
    const location = this.positionToLocation(position);
    this.lastLocation = this.currentLocation;
    this.currentLocation = location;

    // 通知位置监听器
    this.locationListeners.forEach(listener => {
      try {
        listener(location);
      } catch (error) {
        console.error('位置监听器错误:', error);
      }
    });

    // 触发位置更新事件
    this.emitEvent({
      type: IoTEventType.LOCATION_UPDATE,
      data: { location },
      timestamp: new Date(),
    });

    // 检查围栏状态变化
    this.checkGeofenceTransitions(location);
  }

  /**
   * 将 GeolocationPosition 转换为 Location
   */
  private positionToLocation(position: GeolocationPosition): Location {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude ?? undefined,
      speed: position.coords.speed ?? undefined,
      heading: position.coords.heading ?? undefined,
      timestamp: new Date(position.timestamp),
    };
  }

  /**
   * 检查围栏状态转换
   */
  private checkGeofenceTransitions(location: Location): void {
    this.geofences.forEach((geofence, geofenceId) => {
      if (!geofence.enabled) return;

      const isCurrentlyInside = this.isLocationInGeofence(location, geofence);
      const wasPreviouslyInside = this.geofenceStates.get(geofenceId) ?? false;

      // 状态变化检测
      if (isCurrentlyInside && !wasPreviouslyInside) {
        // 进入围栏
        this.handleGeofenceEnter(geofence, location);
      } else if (!isCurrentlyInside && wasPreviouslyInside) {
        // 离开围栏
        this.handleGeofenceExit(geofence, location);
      }

      // 更新状态
      this.geofenceStates.set(geofenceId, isCurrentlyInside);
    });
  }

  /**
   * 处理进入围栏
   */
  private handleGeofenceEnter(geofence: GeofenceConfig, location: Location): void {
    // 创建事件
    const event: GeofenceEvent = {
      id: generateId(),
      geofenceId: geofence.id,
      geofenceName: geofence.name,
      type: 'enter',
      location,
      timestamp: new Date(),
    };

    // 触发回调
    const callbacks = this.enterCallbacks.get(geofence.id);
    callbacks?.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('进入回调错误:', error);
      }
    });

    // 执行围栏动作
    if (geofence.onEnter?.enabled) {
      this.executeGeofenceAction(geofence.onEnter, event);
    }

    // 触发事件
    this.emitEvent({
      type: IoTEventType.GEOFENCE_ENTER,
      data: event,
      timestamp: new Date(),
    });
  }

  /**
   * 处理离开围栏
   */
  private handleGeofenceExit(geofence: GeofenceConfig, location: Location): void {
    // 创建事件
    const event: GeofenceEvent = {
      id: generateId(),
      geofenceId: geofence.id,
      geofenceName: geofence.name,
      type: 'exit',
      location,
      timestamp: new Date(),
    };

    // 触发回调
    const callbacks = this.exitCallbacks.get(geofence.id);
    callbacks?.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('离开回调错误:', error);
      }
    });

    // 执行围栏动作
    if (geofence.onExit?.enabled) {
      this.executeGeofenceAction(geofence.onExit, event);
    }

    // 触发事件
    this.emitEvent({
      type: IoTEventType.GEOFENCE_EXIT,
      data: event,
      timestamp: new Date(),
    });
  }

  /**
   * 执行围栏动作
   */
  private async executeGeofenceAction(action: GeofenceAction, event: GeofenceEvent): Promise<void> {
    switch (action.type) {
      case 'notification':
        // 发送通知
        if (action.config.message) {
          this.sendNotification(action.config.message, event);
        }
        break;

      case 'device_control':
        // 控制设备
        if (action.config.deviceCommand) {
          // 这里需要与 DeviceManager 集成
          console.log('执行设备控制:', action.config.deviceCommand);
        }
        break;

      case 'reminder':
        // 触发提醒
        if (action.config.reminderId) {
          console.log('触发提醒:', action.config.reminderId);
        }
        break;

      case 'webhook':
        // 调用 Webhook
        if (action.config.webhookUrl) {
          try {
            await fetch(action.config.webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(event),
            });
          } catch (error) {
            console.error('Webhook 调用失败:', error);
          }
        }
        break;
    }
  }

  /**
   * 发送通知
   */
  private sendNotification(message: string, event: GeofenceEvent): void {
    // 检查浏览器通知权限
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(`地理围栏提醒`, {
          body: message,
          icon: '/favicon.svg',
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(`地理围栏提醒`, {
              body: message,
              icon: '/favicon.svg',
            });
          }
        });
      }
    }
  }

  /**
   * 计算两点之间的距离 (米)
   * 使用 Haversine 公式
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // 地球半径 (米)
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * 角度转弧度
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * 触发事件
   */
  private emitEvent(event: IoTEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('事件监听器错误:', error);
      }
    });
  }

  /**
   * 获取模拟位置
   */
  private getMockLocation(): Location {
    // 模拟北京位置
    return {
      latitude: 39.9042 + (Math.random() - 0.5) * 0.01,
      longitude: 116.4074 + (Math.random() - 0.5) * 0.01,
      accuracy: 10,
      timestamp: new Date(),
    };
  }

  /**
   * 启动模拟位置更新
   */
  private startMockLocationUpdates(): void {
    this.updateTimer = setInterval(() => {
      const mockLocation = this.getMockLocation();
      this.handlePositionUpdate({
        coords: {
          latitude: mockLocation.latitude,
          longitude: mockLocation.longitude,
          accuracy: mockLocation.accuracy ?? 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: mockLocation.timestamp.getTime(),
      } as GeolocationPosition);
    }, this.config.updateInterval);
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.stopMonitoring();
    this.geofences.clear();
    this.geofenceStates.clear();
    this.enterCallbacks.clear();
    this.exitCallbacks.clear();
    this.locationListeners.clear();
    this.eventListeners.clear();
  }
}

/**
 * 创建地理围栏服务实例
 */
export function createGeofenceService(config?: GeofenceServiceConfig): GeofenceService {
  return new GeofenceService(config);
}

/**
 * 默认地理围栏服务实例
 */
let defaultGeofenceService: GeofenceService | null = null;

/**
 * 获取默认地理围栏服务实例
 */
export function getGeofenceService(config?: GeofenceServiceConfig): GeofenceService {
  if (!defaultGeofenceService) {
    defaultGeofenceService = new GeofenceService(config);
  }
  return defaultGeofenceService;
}

/**
 * 重置地理围栏服务实例
 */
export function resetGeofenceService(): void {
  if (defaultGeofenceService) {
    defaultGeofenceService.destroy();
    defaultGeofenceService = null;
  }
}