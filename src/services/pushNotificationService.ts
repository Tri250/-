import type { PushNotification, NotificationConfig, NotificationPriority } from '../types/push';
import { api } from '../lib/api';
import { capacitorBridge } from './capacitorBridge';
import { databaseService } from './databaseService';

class PushNotificationService {
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
    },
  };
  private deviceToken: string | null = null;
  private listeners: Array<(notification: PushNotification) => void> = [];
  private navigationCallbacks: Array<(data: Record<string, string>) => void> = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load persisted config
      const savedConfig = await databaseService.getConfig<NotificationConfig>('notification_config');
      if (savedConfig) {
        this.config = savedConfig;
      }

      // Load persisted token
      const savedToken = await databaseService.getConfig<string>('push_device_token');
      if (savedToken) {
        this.deviceToken = savedToken;
      }

      // Request push notification permission
      const permissionResult = await capacitorBridge.requestPushPermission();
      if (permissionResult.grant !== 'granted') {
        console.warn('Push notification permission not granted');
        this.initialized = true;
        return;
      }

      // Register for push notifications via Capacitor (FCM on Android)
      capacitorBridge.registerPush();

      // Listen for registration token
      capacitorBridge.addPushEventListener('registration', (token) => {
        this.deviceToken = token.value;
        this.registerToken(token.value);
      });

      // Listen for registration errors
      capacitorBridge.addPushEventListener('registrationError', (error) => {
        console.error('Push notification registration error:', error.error);
      });

      // Listen for push notifications received while app is in foreground
      capacitorBridge.addPushEventListener('pushNotificationReceived', (notification) => {
        const pushNotif: PushNotification = {
          id: notification.id || `push-${Date.now()}`,
          title: notification.title || '',
          body: notification.body || '',
          type: this.inferType(notification.data),
          priority: this.inferPriority(notification.data),
          timestamp: new Date().toISOString(),
          read: false,
          data: notification.data,
        };
        this.saveNotification(pushNotif);
        this.notifyListeners(pushNotif);
      });

      // Listen for push notification action (tap) - handle navigation
      capacitorBridge.addPushEventListener('pushNotificationActionPerformed', (action) => {
        const notification = action.notification;
        const pushNotif: PushNotification = {
          id: notification.id || `push-${Date.now()}`,
          title: notification.title || '',
          body: notification.body || '',
          type: this.inferType(notification.data),
          priority: this.inferPriority(notification.data),
          timestamp: new Date().toISOString(),
          read: true,
          data: notification.data,
        };
        this.saveNotification(pushNotif);
        this.notifyListeners(pushNotif);

        // Handle notification click navigation
        this.handleNotificationNavigation(notification.data || {});
      });

      this.initialized = true;
    } catch (err) {
      console.error('Failed to initialize push notification service:', err);
      this.initialized = true;
    }
  }

  private inferType(data?: Record<string, string>): PushNotification['type'] {
    if (!data?.type) return 'reminder';
    const type = data.type;
    if (type === 'health' || type === 'security' || type === 'reminder' || type === 'promotion') {
      return type;
    }
    return 'reminder';
  }

  private inferPriority(data?: Record<string, string>): NotificationPriority {
    if (!data?.priority) return 'normal';
    const priority = data.priority;
    if (priority === 'low' || priority === 'normal' || priority === 'high' || priority === 'critical') {
      return priority;
    }
    return 'normal';
  }

  private handleNotificationNavigation(data: Record<string, string>): void {
    // Notify navigation callbacks with the notification data
    for (const cb of this.navigationCallbacks) {
      try {
        cb(data);
      } catch (err) {
        console.error('Navigation callback error:', err);
      }
    }
  }

  /**
   * Register a callback for notification click navigation.
   * The callback receives the notification data which can contain
   * route information like { route: '/health', petId: '123' }
   */
  onNotificationNavigation(callback: (data: Record<string, string>) => void): () => void {
    this.navigationCallbacks.push(callback);
    return () => {
      const index = this.navigationCallbacks.indexOf(callback);
      if (index > -1) {
        this.navigationCallbacks.splice(index, 1);
      }
    };
  }

  private async saveNotification(notification: PushNotification): Promise<void> {
    try {
      await databaseService.put(databaseService.STORES.notifications, notification);
    } catch (err) {
      console.error('Failed to save notification to IndexedDB:', err);
    }
  }

  async registerToken(token: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await api.post<{ message: string }>('/push/register', {
        token,
        platform: 'android',
      });

      this.deviceToken = token;
      await databaseService.setConfig('push_device_token', token);

      return {
        success: true,
        message: result.message || 'Token registered successfully',
      };
    } catch (err) {
      console.error('Failed to register push token:', err);
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Token registration failed',
      };
    }
  }

  async unregisterToken(): Promise<void> {
    if (!this.deviceToken) return;

    try {
      await api.post('/push/unregister', {
        token: this.deviceToken,
      });
    } catch (err) {
      console.error('Failed to unregister push token:', err);
    }

    this.deviceToken = null;
    try {
      await databaseService.setConfig('push_device_token', null as any);
    } catch (err) {
      console.error('Failed to clear persisted token:', err);
    }
  }

  async getToken(): Promise<string | null> {
    return this.deviceToken;
  }

  async getNotifications(limit: number = 20): Promise<PushNotification[]> {
    try {
      const all = await databaseService.getAll<PushNotification>(databaseService.STORES.notifications);
      return all
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (err) {
      console.error('Failed to load notifications from IndexedDB:', err);
      return [];
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const all = await databaseService.getAll<PushNotification>(databaseService.STORES.notifications);
      return all.filter((n) => !n.read).length;
    } catch (err) {
      console.error('Failed to count unread notifications:', err);
      return 0;
    }
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const notification = await databaseService.get<PushNotification>(
        databaseService.STORES.notifications,
        notificationId,
      );
      if (!notification) return false;

      notification.read = true;
      await databaseService.put(databaseService.STORES.notifications, notification);
      return true;
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      return false;
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      const all = await databaseService.getAll<PushNotification>(databaseService.STORES.notifications);
      const updated = all.map((n) => ({ ...n, read: true }));
      await databaseService.putMany(databaseService.STORES.notifications, updated);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }

  async sendNotification(
    title: string,
    body: string,
    options: {
      type?: 'health' | 'security' | 'reminder' | 'promotion';
      priority?: NotificationPriority;
      data?: Record<string, string>;
    } = {},
  ): Promise<PushNotification> {
    const notification: PushNotification = {
      id: `push-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      body,
      type: options.type || 'reminder',
      priority: options.priority || this.config.categories[options.type || 'reminder']?.priority || 'normal',
      timestamp: new Date().toISOString(),
      read: false,
      data: options.data,
    };

    // Schedule local notification via Capacitor plugin
    try {
      await capacitorBridge.scheduleNotification({
        title,
        body,
        id: parseInt(notification.id.replace(/\D/g, '').slice(0, 9)),
        schedule: { at: new Date(Date.now() + 100) },
        extra: options.data as Record<string, unknown>,
      });
    } catch (err) {
      console.error('Failed to schedule local notification:', err);
    }

    // Persist to IndexedDB
    await this.saveNotification(notification);

    // Notify in-app listeners
    this.notifyListeners(notification);

    return notification;
  }

  async getConfig(): Promise<NotificationConfig> {
    return { ...this.config };
  }

  async updateConfig(updates: Partial<NotificationConfig>): Promise<NotificationConfig> {
    this.config = { ...this.config, ...updates };

    if (updates.categories) {
      this.config.categories = { ...this.config.categories, ...updates.categories };
    }

    try {
      await databaseService.setConfig('notification_config', this.config);
    } catch (err) {
      console.error('Failed to persist notification config:', err);
    }

    return { ...this.config };
  }

  async getCategoryStatus(category: keyof NotificationConfig['categories']): Promise<boolean> {
    return this.config.categories[category]?.enabled ?? true;
  }

  async setCategoryStatus(category: keyof NotificationConfig['categories'], enabled: boolean): Promise<void> {
    if (this.config.categories[category]) {
      this.config.categories[category].enabled = enabled;
      try {
        await databaseService.setConfig('notification_config', this.config);
      } catch (err) {
        console.error('Failed to persist category status:', err);
      }
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
    this.listeners.forEach((listener) => listener(notification));
  }
}

export const pushNotificationService = new PushNotificationService();