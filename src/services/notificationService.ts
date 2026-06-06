// ============================================
// PawSync Pro - 真实通知服务
// 使用 Notification API 实现推送、权限管理、本地通知调度
// ============================================

export type NotificationPermission = 'default' | 'granted' | 'denied';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

export interface NotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  image?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp?: number;
  data?: Record<string, unknown>;
  actions?: NotificationAction[];
  priority?: NotificationPriority;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface ScheduledNotification {
  id: string;
  options: NotificationOptions;
  scheduledTime: number;
  repeat?: 'daily' | 'weekly' | 'monthly' | 'none';
  repeatInterval?: number; // 毫秒
}

export interface NotificationHistory {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  clicked: boolean;
  data?: Record<string, unknown>;
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  showPreviews: boolean;
  doNotDisturb: boolean;
  doNotDisturbStart?: string; // HH:mm
  doNotDisturbEnd?: string; // HH:mm
  priorityFilter: NotificationPriority;
}

class NotificationService {
  private permission: NotificationPermission = 'default';
  private scheduledNotifications: Map<string, ScheduledNotification> = new Map();
  private notificationHistory: NotificationHistory[] = [];
  private settings: NotificationSettings = {
    enabled: true,
    sound: true,
    vibration: true,
    showPreviews: true,
    doNotDisturb: false,
    priorityFilter: 'low',
  };

  // 事件监听器
  private clickListeners: Array<(data: Record<string, unknown>) => void> = [];
  private showListeners: Array<(notification: Notification) => void> = [];
  private closeListeners: Array<(notification: Notification) => void> = [];
  private errorListeners: Array<(error: Error) => void> = [];

  // 定时器
  private scheduleCheckInterval: number | null = null;

  // 存储键
  private readonly SETTINGS_KEY = 'pawsync_notification_settings';
  private readonly HISTORY_KEY = 'pawsync_notification_history';
  private readonly SCHEDULED_KEY = 'pawsync_scheduled_notifications';

  constructor() {
    this.initialize();
  }

  // ==================== 初始化 ====================

  private async initialize(): Promise<void> {
    // 检查通知支持
    if (!this.isSupported()) {
      console.warn('Notification API not supported');
      return;
    }

    // 加载权限状态
    this.permission = Notification.permission;

    // 加载设置
    this.loadSettings();

    // 加载历史记录
    this.loadHistory();

    // 加载定时通知
    this.loadScheduledNotifications();

    // 启动定时检查
    this.startScheduleCheck();

    // 监听权限变化
    if ('permissions' in navigator) {
      try {
        const status = await navigator.permissions.query({ name: 'notifications' as PermissionName });
        status.addEventListener('change', () => {
          this.permission = Notification.permission;
        });
      } catch (error) {
        console.warn('Failed to watch notification permission:', error);
      }
    }
  }

  // ==================== 权限管理 ====================

  /**
   * 检查浏览器是否支持 Notification API
   */
  isSupported(): boolean {
    return 'Notification' in window;
  }

  /**
   * 获取当前权限状态
   */
  getPermission(): NotificationPermission {
    return this.permission;
  }

  /**
   * 请求通知权限
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('浏览器不支持通知功能');
    }

    try {
      const result = await Notification.requestPermission();
      this.permission = result;
      return result;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      throw new Error(`请求通知权限失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 检查是否已授予权限
   */
  hasPermission(): boolean {
    return this.permission === 'granted';
  }

  // ==================== 发送通知 ====================

  /**
   * 发送本地通知
   */
  async sendNotification(options: NotificationOptions): Promise<Notification | null> {
    // 检查权限
    if (!this.hasPermission()) {
      console.warn('Notification permission not granted');
      return null;
    }

    // 检查设置
    if (!this.settings.enabled) {
      console.log('Notifications are disabled in settings');
      return null;
    }

    // 检查勿扰模式
    if (this.isDoNotDisturbActive()) {
      const priorityOrder = { low: 0, normal: 1, high: 2, critical: 3 };
      const notificationPriority = priorityOrder[options.priority || 'normal'];
      const filterPriority = priorityOrder[this.settings.priorityFilter];
      
      if (notificationPriority < filterPriority) {
        console.log('Notification blocked by do not disturb');
        return null;
      }
    }

    try {
      const notificationOptions: NotificationOptions = {
        body: options.body,
        icon: options.icon || '/icon-192x192.png',
        badge: options.badge || '/badge-72x72.png',
        tag: options.tag,
        requireInteraction: options.requireInteraction,
        silent: options.silent ?? !this.settings.sound,
        timestamp: options.timestamp || Date.now(),
        data: options.data,
        actions: options.actions,
        ...options,
      };

      const notification = new Notification(options.title, notificationOptions);

      // 添加事件监听
      notification.onclick = () => {
        this.handleNotificationClick(notification);
      };

      notification.onshow = () => {
        this.showListeners.forEach(listener => listener(notification));
      };

      notification.onclose = () => {
        this.closeListeners.forEach(listener => listener(notification));
      };

      notification.onerror = (event) => {
        const error = new Error('Notification error: ' + event.type);
        this.errorListeners.forEach(listener => listener(error));
      };

      // 添加到历史记录
      this.addToHistory({
        id: options.tag || `notif-${Date.now()}`,
        title: options.title,
        body: options.body || '',
        timestamp: Date.now(),
        clicked: false,
        data: options.data,
      });

      // 触发振动
      if (this.settings.vibration && navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }

      return notification;
    } catch (error) {
      console.error('Failed to send notification:', error);
      this.errorListeners.forEach(listener => 
        listener(new Error(`发送通知失败: ${error instanceof Error ? error.message : '未知错误'}`))
      );
      return null;
    }
  }

  /**
   * 发送简单通知
   */
  async notify(title: string, body?: string, options: Partial<NotificationOptions> = {}): Promise<Notification | null> {
    return this.sendNotification({
      title,
      body,
      ...options,
    });
  }

  /**
   * 发送宠物相关通知
   */
  async notifyPet(petName: string, message: string, type: 'info' | 'warning' | 'alert' = 'info'): Promise<Notification | null> {
    const icons = {
      info: '/icon-info.png',
      warning: '/icon-warning.png',
      alert: '/icon-alert.png',
    };

    return this.sendNotification({
      title: `${petName} 的状态更新`,
      body: message,
      icon: icons[type],
      tag: `pet-${petName}-${Date.now()}`,
      priority: type === 'alert' ? 'high' : 'normal',
      data: { type: 'pet-update', petName, messageType: type },
    });
  }

  /**
   * 发送健康提醒通知
   */
  async notifyHealthReminder(title: string, message: string, actionUrl?: string): Promise<Notification | null> {
    return this.sendNotification({
      title: `🏥 ${title}`,
      body: message,
      icon: '/icon-health.png',
      tag: `health-${Date.now()}`,
      priority: 'high',
      requireInteraction: true,
      data: { type: 'health-reminder', actionUrl },
      actions: actionUrl ? [
        { action: 'open', title: '查看详情' },
        { action: 'dismiss', title: '稍后提醒' },
      ] : undefined,
    });
  }

  /**
   * 发送喂食提醒
   */
  async notifyFeedingReminder(petName: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'): Promise<Notification | null> {
    const mealNames = {
      breakfast: '早餐',
      lunch: '午餐',
      dinner: '晚餐',
      snack: '零食',
    };

    return this.sendNotification({
      title: `🍽️ 喂食提醒`,
      body: `该给 ${petName} 准备${mealNames[mealType]}了`,
      icon: '/icon-food.png',
      tag: `feeding-${petName}-${mealType}`,
      priority: 'normal',
      data: { type: 'feeding-reminder', petName, mealType },
    });
  }

  // ==================== 定时通知 ====================

  /**
   * 调度定时通知
   */
  scheduleNotification(
    options: NotificationOptions,
    scheduledTime: number,
    repeat: 'daily' | 'weekly' | 'monthly' | 'none' = 'none'
  ): string {
    const id = `scheduled-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const scheduled: ScheduledNotification = {
      id,
      options,
      scheduledTime,
      repeat,
    };

    this.scheduledNotifications.set(id, scheduled);
    this.saveScheduledNotifications();

    return id;
  }

  /**
   * 取消定时通知
   */
  cancelScheduledNotification(id: string): boolean {
    const deleted = this.scheduledNotifications.delete(id);
    if (deleted) {
      this.saveScheduledNotifications();
    }
    return deleted;
  }

  /**
   * 获取所有定时通知
   */
  getScheduledNotifications(): ScheduledNotification[] {
    return Array.from(this.scheduledNotifications.values());
  }

  /**
   * 创建重复提醒
   */
  createRecurringReminder(
    options: NotificationOptions,
    intervalMs: number,
    startTime?: number
  ): string {
    const id = `recurring-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const scheduledTime = startTime || Date.now() + intervalMs;

    const scheduled: ScheduledNotification = {
      id,
      options,
      scheduledTime,
      repeat: 'none',
      repeatInterval: intervalMs,
    };

    this.scheduledNotifications.set(id, scheduled);
    this.saveScheduledNotifications();

    return id;
  }

  /**
   * 检查并发送定时通知
   */
  private checkScheduledNotifications(): void {
    const now = Date.now();

    this.scheduledNotifications.forEach((scheduled, id) => {
      if (scheduled.scheduledTime <= now) {
        // 发送通知
        this.sendNotification(scheduled.options);

        // 处理重复
        if (scheduled.repeat && scheduled.repeat !== 'none') {
          let nextTime = scheduled.scheduledTime;
          
          switch (scheduled.repeat) {
            case 'daily':
              nextTime += 24 * 60 * 60 * 1000;
              break;
            case 'weekly':
              nextTime += 7 * 24 * 60 * 60 * 1000;
              break;
            case 'monthly': {
              const date = new Date(nextTime);
              date.setMonth(date.getMonth() + 1);
              nextTime = date.getTime();
              break;
            }
          }

          scheduled.scheduledTime = nextTime;
        } else if (scheduled.repeatInterval) {
          // 自定义间隔重复
          scheduled.scheduledTime = now + scheduled.repeatInterval;
        } else {
          // 删除一次性通知
          this.scheduledNotifications.delete(id);
        }

        this.saveScheduledNotifications();
      }
    });
  }

  /**
   * 启动定时检查
   */
  private startScheduleCheck(): void {
    // 每分钟检查一次
    this.scheduleCheckInterval = window.setInterval(() => {
      this.checkScheduledNotifications();
    }, 60000);

    // 立即检查一次
    this.checkScheduledNotifications();
  }

  /**
   * 停止定时检查
   */
  stopScheduleCheck(): void {
    if (this.scheduleCheckInterval !== null) {
      clearInterval(this.scheduleCheckInterval);
      this.scheduleCheckInterval = null;
    }
  }

  // ==================== 设置管理 ====================

  /**
   * 获取通知设置
   */
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  /**
   * 更新通知设置
   */
  updateSettings(updates: Partial<NotificationSettings>): NotificationSettings {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
    return this.settings;
  }

  /**
   * 启用/禁用通知
   */
  setEnabled(enabled: boolean): void {
    this.settings.enabled = enabled;
    this.saveSettings();
  }

  /**
   * 设置勿扰模式
   */
  setDoNotDisturb(enabled: boolean, startTime?: string, endTime?: string): void {
    this.settings.doNotDisturb = enabled;
    if (startTime) this.settings.doNotDisturbStart = startTime;
    if (endTime) this.settings.doNotDisturbEnd = endTime;
    this.saveSettings();
  }

  /**
   * 检查勿扰模式是否激活
   */
  private isDoNotDisturbActive(): boolean {
    if (!this.settings.doNotDisturb) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    if (this.settings.doNotDisturbStart && this.settings.doNotDisturbEnd) {
      const start = this.settings.doNotDisturbStart;
      const end = this.settings.doNotDisturbEnd;

      if (start <= end) {
        // 同一天内
        return currentTime >= start && currentTime <= end;
      } else {
        // 跨天（如 22:00 - 08:00）
        return currentTime >= start || currentTime <= end;
      }
    }

    return true;
  }

  // ==================== 历史记录 ====================

  /**
   * 获取通知历史
   */
  getHistory(limit: number = 50): NotificationHistory[] {
    return this.notificationHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * 清除历史记录
   */
  clearHistory(): void {
    this.notificationHistory = [];
    this.saveHistory();
  }

  /**
   * 添加到历史记录
   */
  private addToHistory(history: NotificationHistory): void {
    this.notificationHistory.unshift(history);
    // 只保留最近 100 条
    if (this.notificationHistory.length > 100) {
      this.notificationHistory = this.notificationHistory.slice(0, 100);
    }
    this.saveHistory();
  }

  // ==================== 存储管理 ====================

  private loadSettings(): void {
    try {
      const stored = localStorage.getItem(this.SETTINGS_KEY);
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  }

  private loadHistory(): void {
    try {
      const stored = localStorage.getItem(this.HISTORY_KEY);
      if (stored) {
        this.notificationHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load notification history:', error);
    }
  }

  private saveHistory(): void {
    try {
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(this.notificationHistory));
    } catch (error) {
      console.error('Failed to save notification history:', error);
    }
  }

  private loadScheduledNotifications(): void {
    try {
      const stored = localStorage.getItem(this.SCHEDULED_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.scheduledNotifications = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.error('Failed to load scheduled notifications:', error);
    }
  }

  private saveScheduledNotifications(): void {
    try {
      const obj = Object.fromEntries(this.scheduledNotifications);
      localStorage.setItem(this.SCHEDULED_KEY, JSON.stringify(obj));
    } catch (error) {
      console.error('Failed to save scheduled notifications:', error);
    }
  }

  // ==================== 事件处理 ====================

  private handleNotificationClick(notification: Notification): void {
    window.focus();
    notification.close();

    const data = notification.data as Record<string, unknown> || {};
    
    // 更新历史记录
    const historyItem = this.notificationHistory.find(h => h.id === notification.tag);
    if (historyItem) {
      historyItem.clicked = true;
      this.saveHistory();
    }

    // 触发点击事件
    this.clickListeners.forEach(listener => listener(data));

    // 处理特定操作
    if (data.type === 'health-reminder' && data.actionUrl) {
      window.location.href = data.actionUrl as string;
    }
  }

  // ==================== 事件监听 ====================

  onClick(listener: (data: Record<string, unknown>) => void): () => void {
    this.clickListeners.push(listener);
    return () => {
      const index = this.clickListeners.indexOf(listener);
      if (index > -1) {
        this.clickListeners.splice(index, 1);
      }
    };
  }

  onShow(listener: (notification: Notification) => void): () => void {
    this.showListeners.push(listener);
    return () => {
      const index = this.showListeners.indexOf(listener);
      if (index > -1) {
        this.showListeners.splice(index, 1);
      }
    };
  }

  onClose(listener: (notification: Notification) => void): () => void {
    this.closeListeners.push(listener);
    return () => {
      const index = this.closeListeners.indexOf(listener);
      if (index > -1) {
        this.closeListeners.splice(index, 1);
      }
    };
  }

  onError(listener: (error: Error) => void): () => void {
    this.errorListeners.push(listener);
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  // ==================== 清理 ====================

  destroy(): void {
    this.stopScheduleCheck();
    this.clickListeners = [];
    this.showListeners = [];
    this.closeListeners = [];
    this.errorListeners = [];
  }
}

export const notificationService = new NotificationService();
