import type { PushNotification, NotificationConfig, NotificationPriority } from '../types/push';

const MOCK_DELAY = 500;

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

  async initialize(): Promise<void> {
    await this.simulateDelay(MOCK_DELAY);
    console.log('Push notification service initialized');
  }

  async registerToken(token: string): Promise<{ success: boolean; message: string }> {
    await this.simulateDelay(MOCK_DELAY);
    this.deviceToken = token;
    this.tokenUpdatedAt = new Date().toISOString();
    return {
      success: true,
      message: 'Token registered successfully'
    };
  }

  async unregisterToken(): Promise<void> {
    await this.simulateDelay(200);
    this.deviceToken = null;
    this.tokenUpdatedAt = null;
  }

  async getToken(): Promise<string | null> {
    return this.deviceToken;
  }

  async getNotifications(limit: number = 20): Promise<PushNotification[]> {
    await this.simulateDelay(300);
    return [...this.notifications].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, limit);
  }

  async getUnreadCount(): Promise<number> {
    await this.simulateDelay(100);
    return this.notifications.filter(n => !n.read).length;
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    await this.simulateDelay(100);
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      return true;
    }
    return false;
  }

  async markAllAsRead(): Promise<void> {
    await this.simulateDelay(100);
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
    await this.simulateDelay(MOCK_DELAY);

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

  async getConfig(): Promise<NotificationConfig> {
    await this.simulateDelay(100);
    return { ...this.config };
  }

  async updateConfig(updates: Partial<NotificationConfig>): Promise<NotificationConfig> {
    await this.simulateDelay(200);
    this.config = { ...this.config, ...updates };
    
    if (updates.categories) {
      this.config.categories = { ...this.config.categories, ...updates.categories };
    }

    return { ...this.config };
  }

  async getCategoryStatus(category: keyof NotificationConfig['categories']): Promise<boolean> {
    await this.simulateDelay(50);
    return this.config.categories[category]?.enabled ?? true;
  }

  async setCategoryStatus(category: keyof NotificationConfig['categories'], enabled: boolean): Promise<void> {
    await this.simulateDelay(100);
    if (this.config.categories[category]) {
      this.config.categories[category].enabled = enabled;
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

  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const pushNotificationService = new PushNotificationService();