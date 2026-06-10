// ============================================
// PawSync Pro - Notification Service
//
// 作者: 带娃的小陈工
// 日期: 2026-06-10
// 描述: 跨平台通知服务，支持本地通知和推送通知
// ============================================

import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { isPlatform } from '@capacitor/core';
import { platformService } from './platformService';

/**
 * 通知类型
 */
export type NotificationType = 'reminder' | 'alert' | 'info' | 'success' | 'warning' | 'error';

/**
 * 通知渠道
 */
export type NotificationChannel = 'default' | 'health' | 'reminder' | 'monitor' | 'system';

/**
 * 通知选项
 */
export interface NotificationOptions {
  id?: number;
  title: string;
  body: string;
  type?: NotificationType;
  channel?: NotificationChannel;
  icon?: string;
  sound?: string;
  vibrate?: boolean;
  badge?: number;
  data?: Record<string, unknown>;
  schedule?: {
    at?: Date;
    every?: 'minute' | 'hour' | 'day' | 'week' | 'month';
    count?: number;
  };
  actionTypeId?: string;
  extra?: Record<string, unknown>;
}

/**
 * 推送通知令牌
 */
export interface PushToken {
  value: string;
  type: 'fcm' | 'apns';
}

/**
 * 通知动作
 */
export interface NotificationAction {
  id: string;
  title: string;
  destructive?: boolean;
  input?: boolean;
  inputButtonTitle?: string;
  inputPlaceholder?: string;
}

/**
 * 通知渠道配置
 */
interface ChannelConfig {
  id: string;
  name: string;
  description: string;
  importance: number;
  visibility?: number;
  sound?: string;
  vibration?: boolean;
  lights?: boolean;
  lightColor?: string;
}

/**
 * 通知服务类
 */
class NotificationService {
  private initialized = false;
  private pushToken: PushToken | null = null;
  private notificationIdCounter = 0;
  private readonly channels: ChannelConfig[] = [
    {
      id: 'default',
      name: '默认通知',
      description: '一般性通知',
      importance: 3,
      vibration: true,
    },
    {
      id: 'health',
      name: '健康提醒',
      description: '宠物健康相关通知',
      importance: 4,
      vibration: true,
      sound: 'health_alert.wav',
    },
    {
      id: 'reminder',
      name: '日程提醒',
      description: '喂食、用药等日程提醒',
      importance: 4,
      vibration: true,
    },
    {
      id: 'monitor',
      name: '监控警报',
      description: '实时监控异常警报',
      importance: 5,
      vibration: true,
      sound: 'alert.wav',
    },
    {
      id: 'system',
      name: '系统通知',
      description: '系统更新和维护通知',
      importance: 2,
    },
  ];

  /**
   * 初始化通知服务
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      // 检查权限
      const hasPermission = await this.checkPermission();
      if (!hasPermission) {
        const granted = await this.requestPermission();
        if (!granted) {
          console.warn('[Notification] 用户未授予通知权限');
          return false;
        }
      }

      // 原生平台初始化
      if (platformService.isNative()) {
        // 注册通知渠道
        await this.registerChannels();

        // 监听本地通知事件
        this.setupLocalNotificationListeners();
      } else {
        // Web 端：请求通知权限
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            console.warn('[Notification] Web 通知权限未授予');
            return false;
          }
        }
      }

      this.initialized = true;
      console.log('[Notification] 通知服务初始化成功');
      return true;
    } catch (error) {
      console.error('[Notification] 初始化失败:', error);
      return false;
    }
  }

  /**
   * 检查通知权限
   */
  async checkPermission(): Promise<boolean> {
    if (platformService.isNative()) {
      try {
        const result = await LocalNotifications.checkPermissions();
        return result.display === 'granted';
      } catch {
        return false;
      }
    } else {
      if (!('Notification' in window)) return false;
      return Notification.permission === 'granted';
    }
  }

  /**
   * 请求通知权限
   */
  async requestPermission(): Promise<boolean> {
    if (platformService.isNative()) {
      try {
        const result = await LocalNotifications.requestPermissions();
        return result.display === 'granted';
      } catch {
        return false;
      }
    } else {
      if (!('Notification' in window)) return false;
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
  }

  /**
   * 注册通知渠道
   */
  private async registerChannels(): Promise<void> {
    if (!platformService.isNative()) return;

    try {
      for (const channel of this.channels) {
        await LocalNotifications.createChannel({
          id: channel.id,
          name: channel.name,
          description: channel.description,
          importance: channel.importance,
          visibility: channel.visibility || 1,
          sound: channel.sound,
          vibration: channel.vibration ?? false,
          lights: channel.lights ?? false,
          lightColor: channel.lightColor,
        });
      }
    } catch (error) {
      console.warn('[Notification] 注册通知渠道失败:', error);
    }
  }

  /**
   * 设置本地通知监听器
   */
  private setupLocalNotificationListeners(): void {
    if (!platformService.isNative()) return;

    // 通知被点击
    LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      console.log('[Notification] 通知被点击:', action);
      // 可以在这里处理通知点击事件，如跳转到特定页面
    });

    // 通知被接收
    LocalNotifications.addListener('localNotificationReceived', (notification) => {
      console.log('[Notification] 收到通知:', notification);
    });
  }

  /**
   * 发送本地通知
   */
  async send(options: NotificationOptions): Promise<boolean> {
    if (!this.initialized) {
      const success = await this.initialize();
      if (!success) return false;
    }

    const id = options.id ?? ++this.notificationIdCounter;
    const channel = options.channel || 'default';

    try {
      if (platformService.isNative()) {
        await LocalNotifications.schedule({
          notifications: [{
            id,
            title: options.title,
            body: options.body,
            channelId: channel,
            sound: options.sound,
            vibrate: options.vibrate,
            smallIcon: options.icon,
            largeIcon: options.icon,
            badge: options.badge,
            extra: {
              type: options.type,
              ...options.data,
              ...options.extra,
            },
            schedule: options.schedule?.at ? { at: options.schedule.at } : undefined,
          }],
        });
      } else {
        // Web 端使用 Web Notification API
        if ('Notification' in window && Notification.permission === 'granted') {
          const notification = new Notification(options.title, {
            body: options.body,
            icon: options.icon || '/favicon.svg',
            badge: options.icon,
            tag: String(id),
            requireInteraction: options.type === 'alert',
            data: {
              type: options.type,
              ...options.data,
            },
          });

          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        }
      }

      return true;
    } catch (error) {
      console.error('[Notification] 发送通知失败:', error);
      return false;
    }
  }

  /**
   * 发送即时通知
   */
  async sendNow(options: Omit<NotificationOptions, 'schedule'>): Promise<boolean> {
    return this.send(options);
  }

  /**
   * 发送定时通知
   */
  async schedule(options: NotificationOptions & { schedule: { at: Date } }): Promise<boolean> {
    return this.send(options);
  }

  /**
   * 取消通知
   */
  async cancel(id: number): Promise<boolean> {
    try {
      if (platformService.isNative()) {
        await LocalNotifications.cancel({ notifications: [{ id }] });
      }
      return true;
    } catch (error) {
      console.error('[Notification] 取消通知失败:', error);
      return false;
    }
  }

  /**
   * 取消所有通知
   */
  async cancelAll(): Promise<boolean> {
    try {
      if (platformService.isNative()) {
        await LocalNotifications.cancel({ notifications: [] });
      }
      return true;
    } catch (error) {
      console.error('[Notification] 取消所有通知失败:', error);
      return false;
    }
  }

  /**
   * 获取待发送的通知
   */
  async getPending(): Promise<NotificationOptions[]> {
    if (!platformService.isNative()) return [];

    try {
      const result = await LocalNotifications.getPending();
      return result.notifications.map(n => ({
        id: n.id,
        title: n.title,
        body: n.body,
        channel: n.channelId as NotificationChannel,
        data: n.extra,
      }));
    } catch (error) {
      console.error('[Notification] 获取待发送通知失败:', error);
      return [];
    }
  }

  // ==================== 推送通知 ====================

  /**
   * 初始化推送通知
   */
  async initializePush(): Promise<boolean> {
    if (!platformService.isNative()) {
      console.warn('[Notification] Web 端暂不支持推送通知');
      return false;
    }

    try {
      // 注册推送通知
      await PushNotifications.register();

      // 监听注册成功
      PushNotifications.addListener('registration', (token) => {
        console.log('[Notification] 推送注册成功:', token.value);
        this.pushToken = {
          value: token.value,
          type: isPlatform('ios') ? 'apns' : 'fcm',
        };
      });

      // 监听注册失败
      PushNotifications.addListener('registrationError', (error) => {
        console.error('[Notification] 推送注册失败:', error);
      });

      // 监听推送接收
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('[Notification] 收到推送:', notification);
      });

      // 监听推送点击
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('[Notification] 推送被点击:', action);
      });

      return true;
    } catch (error) {
      console.error('[Notification] 初始化推送失败:', error);
      return false;
    }
  }

  /**
   * 获取推送令牌
   */
  getPushToken(): PushToken | null {
    return this.pushToken;
  }

  /**
   * 检查推送是否可用
   */
  isPushAvailable(): boolean {
    return platformService.isNative();
  }

  // ==================== 便捷方法 ====================

  /**
   * 发送健康提醒
   */
  async sendHealthReminder(title: string, body: string, data?: Record<string, unknown>): Promise<boolean> {
    return this.send({
      title,
      body,
      type: 'reminder',
      channel: 'health',
      vibrate: true,
      data,
    });
  }

  /**
   * 发送监控警报
   */
  async sendMonitorAlert(title: string, body: string, data?: Record<string, unknown>): Promise<boolean> {
    return this.send({
      title,
      body,
      type: 'alert',
      channel: 'monitor',
      vibrate: true,
      sound: 'alert.wav',
      data,
    });
  }

  /**
   * 发送日程提醒
   */
  async sendScheduleReminder(title: string, body: string, at: Date, data?: Record<string, unknown>): Promise<boolean> {
    return this.send({
      title,
      body,
      type: 'reminder',
      channel: 'reminder',
      vibrate: true,
      schedule: { at },
      data,
    });
  }

  /**
   * 更新应用角标
   */
  async setBadge(count: number): Promise<boolean> {
    if (!platformService.isNative()) return false;

    try {
      await LocalNotifications.setBadgeCount({ count });
      return true;
    } catch (error) {
      console.error('[Notification] 设置角标失败:', error);
      return false;
    }
  }

  /**
   * 清除应用角标
   */
  async clearBadge(): Promise<boolean> {
    return this.setBadge(0);
  }
}

// 导出单例
export const notificationService = new NotificationService();
export default notificationService;
