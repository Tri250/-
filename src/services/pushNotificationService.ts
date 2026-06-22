import { PawSyncNotification } from '../plugins';
import type { PushNotification, NotificationConfig, NotificationPriority } from '../types/push';

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
  private listeners: Array<(notification: PushNotification) => void> = [];

  async initialize(): Promise<void> {
    console.log('Push notification service initialized');
  }

  async registerToken(token: string): Promise<{ success: boolean; message: string }> {
    this.deviceToken = token;
    return {
      success: true,
      message: 'Token registered successfully'
    };
  }

  async unregisterToken(): Promise<void> {
    this.deviceToken = null;
  }

  async getToken(): Promise<string | null> {
    return this.deviceToken;
  }

  async getNotifications(limit: number = 20): Promise<PushNotification[]> {
    return [...this.notifications].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, limit);
  }

  async getUnreadCount(): Promise<number> {
    return this.notifications.filter(n => !n.read).length;
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      return true;
    }
    return false;
  }

  async markAllAsRead(): Promise<void> {
    this.notifications.forEach(n => n.read = true);
  }

  async sendNotification(
    title: string,
    body: string,
    options: {
      type?: 'health' | 'security' | 'reminder' | 'promotion';
      priority?: NotificationPriority;
      data?: Record<string, string>;
    } = {}
  ): Promise<PushNotification> {
    try {
      const result = await PawSyncNotification.showNotification({
        title,
        body,
        id: `push-${Date.now()}`,
        type: options.type || 'reminder',
      });
    } catch (error) {
      console.warn('Failed to show native notification:', error);
    }

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

    this.notifications.unshift(notification);
    if (this.notifications.length > 100) {
      this.notifications.pop();
    }

    this.notifyListeners(notification);

    return notification;
  }

  async showHealthNotification(title: string, body: string, data?: Record<string, string>) {
    try {
      await PawSyncNotification.showNotification({
        title,
        body,
        id: `health-${Date.now()}`,
        type: 'health',
      });
    } catch (error) {
      console.warn('Failed to show health notification:', error);
    }
  }

  async showSecurityNotification(title: string, body: string, data?: Record<string, string>) {
    try {
      await PawSyncNotification.showNotification({
        title,
        body,
        id: `security-${Date.now()}`,
        type: 'security',
      });
    } catch (error) {
      console.warn('Failed to show security notification:', error);
    }
  }

  async getConfig(): Promise<NotificationConfig> {
    return { ...this.config };
  }

  async updateConfig(updates: Partial<NotificationConfig>): Promise<NotificationConfig> {
    this.config = { ...this.config, ...updates };
    
    if (updates.categories) {
      this.config.categories = { ...this.config.categories, ...updates.categories };
    }

    return { ...this.config };
  }

  async getCategoryStatus(category: keyof NotificationConfig['categories']): Promise<boolean> {
    return this.config.categories[category]?.enabled ?? true;
  }

  async setCategoryStatus(category: keyof NotificationConfig['categories'], enabled: boolean): Promise<void> {
    if (this.config.categories[category]) {
      this.config.categories[category].enabled = enabled;
    }
  }

  async checkNotificationPermission(): Promise<boolean> {
    try {
      const result = await PawSyncNotification.checkPermission();
      return result.granted ?? false;
    } catch {
      return false;
    }
  }

  async requestNotificationPermission(): Promise<boolean> {
    try {
      const result = await PawSyncNotification.requestPermission();
      return result.granted ?? false;
    } catch {
      return false;
    }
  }

  subscribe(listener: (notification: PushNotification) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(notification: PushNotification) {
    this.listeners.forEach(listener => listener(notification));
  }
}

export const pushNotificationService = new PushNotificationService();