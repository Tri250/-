import type { PushNotification, NotificationConfig, NotificationPriority } from '../types/push';
import { capacitorBridge } from './capacitorBridge';
import { databaseService, STORE_NAMES } from './databaseService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.pawsync.com/v1';

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
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load persisted config
      const savedConfig = await databaseService.get<{ key: string; value: NotificationConfig }>(
        STORE_NAMES.APP_SETTINGS,
        'notification_config',
      );
      if (savedConfig?.value) {
        this.config = savedConfig.value;
      }

      // Load persisted token
      const savedToken = await databaseService.get<{ key: string; value: string }>(
        STORE_NAMES.APP_SETTINGS,
        'push_device_token',
      );
      if (savedToken?.value) {
        this.deviceToken = savedToken.value;
      }

      // Request push notification permission
      const permissionResult = await capacitorBridge.requestPushPermission();
      if (permissionResult.grant !== 'granted') {
        console.warn('Push notification permission not granted');
        this.initialized = true;
        return;
      }

      // Register for push notifications
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
          type: 'reminder',
          priority: 'normal',
          timestamp: new Date().toISOString(),
          read: false,
          data: notification.data,
        };
        this.saveNotification(pushNotif);
        this.notifyListeners(pushNotif);
      });

      // Listen for push notification action (tap)
      capacitorBridge.addPushEventListener('pushNotificationActionPerformed', (action) => {
        const notification = action.notification;
        const pushNotif: PushNotification = {
          id: notification.id || `push-${Date.now()}`,
          title: notification.title || '',
          body: notification.body || '',
          type: 'reminder',
          priority: 'normal',
          timestamp: new Date().toISOString(),
          read: false,
          data: notification.data,
        };
        this.saveNotification(pushNotif);
        this.notifyListeners(pushNotif);
      });

      this.initialized = true;
    } catch (err) {
      console.error('Failed to initialize push notification service:', err);
      this.initialized = true;
    }
  }

  private async saveNotification(notification: PushNotification): Promise<void> {
    try {
      await databaseService.put(STORE_NAMES.NOTIFICATIONS, notification);
    } catch (err) {
      console.error('Failed to save notification to IndexedDB:', err);
    }
  }

  async registerToken(token: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetchWithRetry(`${API_BASE_URL}/push/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, platform: 'android' }),
      });

      const result = await response.json();
      this.deviceToken = token;
      await databaseService.put(STORE_NAMES.APP_SETTINGS, { key: 'push_device_token', value: token });

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
      await fetchWithRetry(`${API_BASE_URL}/push/unregister`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: this.deviceToken }),
      });
    } catch (err) {
      console.error('Failed to unregister push token:', err);
    }

    this.deviceToken = null;
    try {
      await databaseService.put(STORE_NAMES.APP_SETTINGS, { key: 'push_device_token', value: null });
    } catch (err) {
      console.error('Failed to clear persisted token:', err);
    }
  }

  async getToken(): Promise<string | null> {
    return this.deviceToken;
  }

  async getNotifications(limit: number = 20): Promise<PushNotification[]> {
    try {
      const all = await databaseService.getAll<PushNotification>(STORE_NAMES.NOTIFICATIONS);
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
      const all = await databaseService.getAll<PushNotification>(STORE_NAMES.NOTIFICATIONS);
      return all.filter((n) => !n.read).length;
    } catch (err) {
      console.error('Failed to count unread notifications:', err);
      return 0;
    }
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const notification = await databaseService.get<PushNotification>(
        STORE_NAMES.NOTIFICATIONS,
        notificationId,
      );
      if (!notification) return false;

      notification.read = true;
      await databaseService.put(STORE_NAMES.NOTIFICATIONS, notification);
      return true;
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      return false;
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      const all = await databaseService.getAll<PushNotification>(STORE_NAMES.NOTIFICATIONS);
      const updated = all.map((n) => ({ ...n, read: true }));
      await databaseService.putMany(STORE_NAMES.NOTIFICATIONS, updated);
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
        notifications: [
          {
            title,
            body,
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 100) },
            sound: this.config.sound ? undefined : undefined,
            attachments: undefined,
            extra: options.data,
          },
        ],
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
      await databaseService.put(STORE_NAMES.APP_SETTINGS, { key: 'notification_config', value: this.config });
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
        await databaseService.put(STORE_NAMES.APP_SETTINGS, { key: 'notification_config', value: this.config });
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
