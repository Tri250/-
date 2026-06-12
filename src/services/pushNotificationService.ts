/**
 * Push Notification Service - 推送通知服务
 *
 * 统一管理 Web 和 Android/iOS 平台的推送通知
 * 集成 Capacitor 原生通知 API，确保跨平台一致性
 */

import { Capacitor } from '@capacitor/core';
import type { PushNotification, NotificationConfig, NotificationPriority } from '../types/push';

const MOCK_DELAY = 500;

/**
 * 检查是否为原生平台
 */
const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * 获取当前平台
 */
const getCurrentPlatform = (): 'web' | 'android' | 'ios' => {
  if (Capacitor.isNativePlatform()) {
    return Capacitor.getPlatform() as 'android' | 'ios';
  }
  return 'web';
};

class PushNotificationService {
  private notifications: PushNotification[] = [];
  private config: NotificationConfig = {
    enabled: true,
    sound: true,
    vibration: true,
    badge: true,
    priority: 'normal',
    categories: {
      health: { enabled: true, priority: 'high' },
      security: { enabled: true, priority: 'critical' },
      reminder: { enabled: true, priority: 'normal' },
      promotion: { enabled: false, priority: 'low' },
    }
  };
  private deviceToken: string | null = null;
  private tokenUpdatedAt: string | null = null;
  private listeners: Array<(notification: PushNotification) => void> = [];
  private isInitialized: boolean = false;

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    const mockNotifications: PushNotification[] = [
      {
        id: 'push-1',
        title: '宠物行为异常提醒',
        body: '检测到猫咪频繁舔舐腹部，请关注',
        type: 'health',
        priority: 'high',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        read: false,
        data: {
          petId: '1',
          action: 'view-alert',
          alertId: 'alert-123'
        }
      },
      {
        id: 'push-2',
        title: '疫苗接种提醒',
        body: '糖糖的狂犬疫苗还有30天到期',
        type: 'reminder',
        priority: 'normal',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        read: true,
        data: {
          petId: '1',
          action: 'view-vaccination',
          vaccineId: 'vaccine-456'
        }
      },
      {
        id: 'push-3',
        title: '监控异常通知',
        body: '检测到花园摄像头离线',
        type: 'security',
        priority: 'critical',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        read: false,
        data: {
          petId: '1',
          action: 'view-camera',
          cameraId: 'cam-3'
        }
      }
    ];
    this.notifications = mockNotifications;
  }

  /**
   * 初始化推送通知服务（支持原生平台）
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    const platform = getCurrentPlatform();
    console.log(`[PushNotification] Initializing for platform: ${platform}`);

    try {
      // 原生平台初始化
      if (isNativePlatform()) {
        await this.initializeNativeNotifications();
      } else {
        // Web 平台初始化
        await this.initializeWebNotifications();
      }
      
      this.isInitialized = true;
      console.log('[PushNotification] Service initialized successfully');
    } catch (error) {
      console.error('[PushNotification] Initialization failed:', error);
      // 即使失败也标记为已初始化，避免阻塞应用
      this.isInitialized = true;
    }
  }

  /**
   * 初始化原生平台通知
   */
  private async initializeNativeNotifications(): Promise<void> {
    try {
      // 初始化本地通知
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      
      // 检查权限
      const permissionStatus = await LocalNotifications.checkPermissions();
      console.log('[PushNotification] Local notification permission:', permissionStatus.display);
      
      // 如果权限未授予，请求权限
      if (permissionStatus.display !== 'granted') {
        const requestResult = await LocalNotifications.requestPermissions();
        console.log('[PushNotification] Permission request result:', requestResult.display);
      }
      
      // 监听本地通知事件
      await LocalNotifications.addListener('localNotificationReceived', (notification) => {
        console.log('[PushNotification] Local notification received:', notification);
        this.handleNotificationReceived({
          id: notification.id?.toString() || `local-${Date.now()}`,
          title: notification.title || '',
          body: notification.body || '',
          type: 'reminder',
          priority: 'normal',
          timestamp: new Date().toISOString(),
          read: false,
          data: notification.extra as Record<string, string>,
        });
      });
      
      await LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
        console.log('[PushNotification] Local notification action performed:', action);
        this.handleNotificationAction(action);
      });

      // 初始化推送通知（如果配置了 FCM）
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        
        // 注册推送通知
        await PushNotifications.register();
        
        // 监听推送通知事件
        await PushNotifications.addListener('registration', (token) => {
          console.log('[PushNotification] Push token received:', token.value);
          this.deviceToken = token.value;
          this.tokenUpdatedAt = new Date().toISOString();
        });
        
        await PushNotifications.addListener('registrationError', (error) => {
          console.error('[PushNotification] Push registration error:', error);
        });
        
        await PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('[PushNotification] Push notification received:', notification);
          this.handleNotificationReceived({
            id: notification.id || `push-${Date.now()}`,
            title: notification.title || '',
            body: notification.body || '',
            type: 'health',
            priority: 'high',
            timestamp: new Date().toISOString(),
            read: false,
            data: notification.data as Record<string, string>,
          });
        });
        
        await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          console.log('[PushNotification] Push notification action performed:', action);
          this.handlePushNotificationAction(action);
        });
      } catch (pushError) {
        console.warn('[PushNotification] Push notifications not available:', pushError);
      }
    } catch (error) {
      console.error('[PushNotification] Native initialization failed:', error);
    }
  }

  /**
   * 初始化 Web 平台通知
   */
  private async initializeWebNotifications(): Promise<void> {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        console.log('[PushNotification] Web notification permission:', permission);
      }
    }
  }

  /**
   * 处理接收到的通知
   */
  private handleNotificationReceived(notification: PushNotification): void {
    this.notifications.unshift(notification);
    if (this.notifications.length > 100) {
      this.notifications.pop();
    }
    this.notifyListeners(notification);
  }

  /**
   * 处理本地通知动作
   */
  private handleNotificationAction(action: any): void {
    console.log('[PushNotification] Handling notification action:', action);
    // 可以根据 action 执行特定操作，如跳转到特定页面
  }

  /**
   * 处理推送通知动作
   */
  private handlePushNotificationAction(action: any): void {
    console.log('[PushNotification] Handling push notification action:', action);
    // 可以根据 action 执行特定操作，如跳转到特定页面
  }

  /**
   * 注册设备 Token
   */
  async registerToken(token: string): Promise<{ success: boolean; message: string }> {
    await this.simulateDelay(MOCK_DELAY);
    this.deviceToken = token;
    this.tokenUpdatedAt = new Date().toISOString();
    return {
      success: true,
      message: 'Token registered successfully'
    };
  }

  /**
   * 取消注册设备 Token
   */
  async unregisterToken(): Promise<void> {
    if (isNativePlatform()) {
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        await PushNotifications.unregister();
      } catch (error) {
        console.warn('[PushNotification] Failed to unregister push notifications:', error);
      }
    }
    
    this.deviceToken = null;
    this.tokenUpdatedAt = null;
  }

  /**
   * 获取设备 Token
   */
  async getToken(): Promise<string | null> {
    return this.deviceToken;
  }

  /**
   * 获取通知列表
   */
  async getNotifications(limit: number = 20): Promise<PushNotification[]> {
    await this.simulateDelay(300);
    return [...this.notifications].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, limit);
  }

  /**
   * 获取未读通知数量
   */
  async getUnreadCount(): Promise<number> {
    await this.simulateDelay(100);
    return this.notifications.filter(n => !n.read).length;
  }

  /**
   * 标记通知为已读
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    await this.simulateDelay(100);
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      return true;
    }
    return false;
  }

  /**
   * 标记所有通知为已读
   */
  async markAllAsRead(): Promise<void> {
    await this.simulateDelay(100);
    this.notifications.forEach(n => n.read = true);
  }

  /**
   * 发送通知（支持原生平台）
   */
  async sendNotification(
    title: string,
    body: string,
    options: {
      type?: 'health' | 'security' | 'reminder' | 'promotion';
      priority?: NotificationPriority;
      data?: Record<string, string>;
      schedule?: { at: Date };
    } = {}
  ): Promise<PushNotification> {
    const notification: PushNotification = {
      id: `push-${Date.now()}`,
      title,
      body,
      type: options.type || 'reminder',
      priority: options.priority || this.config.categories[options.type || 'reminder']?.priority || 'normal',
      timestamp: new Date().toISOString(),
      read: false,
      data: options.data
    };

    // 原生平台使用 Capacitor 通知
    if (isNativePlatform()) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        
        // 检查权限
        const permissionStatus = await LocalNotifications.checkPermissions();
        if (permissionStatus.display !== 'granted') {
          console.warn('[PushNotification] Notification permission not granted');
          return notification;
        }

        // 发送本地通知
        await LocalNotifications.schedule({
          notifications: [
            {
              id: parseInt(notification.id.replace(/\D/g, '')) || Date.now(),
              title,
              body,
              schedule: options.schedule ? { at: options.schedule.at } : undefined,
              extra: options.data,
              sound: this.config.sound ? undefined : undefined,
              actionTypeId: 'tap',
            },
          ],
        });

        console.log('[PushNotification] Native notification sent successfully');
      } catch (error) {
        console.error('[PushNotification] Failed to send native notification:', error);
      }
    } else {
      // Web 平台使用 Web Notification API
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          data: options.data,
          tag: notification.id,
        });
      }
    }

    this.notifications.unshift(notification);
    if (this.notifications.length > 100) {
      this.notifications.pop();
    }

    this.notifyListeners(notification);

    return notification;
  }

  /**
   * 发送定时提醒通知
   */
  async scheduleReminder(
    title: string,
    body: string,
    scheduledTime: Date,
    options: {
      type?: 'health' | 'security' | 'reminder' | 'promotion';
      data?: Record<string, string>;
    } = {}
  ): Promise<boolean> {
    if (isNativePlatform()) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        
        const permissionStatus = await LocalNotifications.checkPermissions();
        if (permissionStatus.display !== 'granted') {
          console.warn('[PushNotification] Cannot schedule reminder without permission');
          return false;
        }

        await LocalNotifications.schedule({
          notifications: [
            {
              id: Date.now(),
              title,
              body,
              schedule: { at: scheduledTime },
              extra: options.data,
              actionTypeId: 'tap',
            },
          ],
        });

        console.log('[PushNotification] Reminder scheduled successfully');
        return true;
      } catch (error) {
        console.error('[PushNotification] Failed to schedule reminder:', error);
        return false;
      }
    }

    // Web 平台不支持定时通知，立即发送
    await this.sendNotification(title, body, { ...options, schedule: { at: scheduledTime } });
    return true;
  }

  /**
   * 取消定时通知
   */
  async cancelScheduledNotification(notificationId: number): Promise<boolean> {
    if (isNativePlatform()) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
        return true;
      } catch (error) {
        console.error('[PushNotification] Failed to cancel notification:', error);
        return false;
      }
    }
    return true;
  }

  /**
   * 获取通知配置
   */
  async getConfig(): Promise<NotificationConfig> {
    await this.simulateDelay(100);
    return { ...this.config };
  }

  /**
   * 更新通知配置
   */
  async updateConfig(updates: Partial<NotificationConfig>): Promise<NotificationConfig> {
    await this.simulateDelay(200);
    this.config = { ...this.config, ...updates };
    
    if (updates.categories) {
      this.config.categories = { ...this.config.categories, ...updates.categories };
    }

    return { ...this.config };
  }

  /**
   * 获取分类状态
   */
  async getCategoryStatus(category: keyof NotificationConfig['categories']): Promise<boolean> {
    await this.simulateDelay(50);
    return this.config.categories[category]?.enabled ?? true;
  }

  /**
   * 设置分类状态
   */
  async setCategoryStatus(category: keyof NotificationConfig['categories'], enabled: boolean): Promise<void> {
    await this.simulateDelay(100);
    if (this.config.categories[category]) {
      this.config.categories[category].enabled = enabled;
    }
  }

  /**
   * 订阅通知事件
   */
  subscribe(listener: (notification: PushNotification) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(notification: PushNotification) {
    this.listeners.forEach(listener => listener(notification));
  }

  /**
   * 模拟延迟
   */
  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取平台信息
   */
  getPlatformInfo(): { platform: string; isNative: boolean; hasPermission: boolean } {
    return {
      platform: getCurrentPlatform(),
      isNative: isNativePlatform(),
      hasPermission: this.isInitialized,
    };
  }
}

export const pushNotificationService = new PushNotificationService();