export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  type: 'health' | 'security' | 'reminder' | 'promotion';
  priority: NotificationPriority;
  timestamp: string;
  read: boolean;
  data?: Record<string, string>;
}

export interface NotificationCategoryConfig {
  enabled: boolean;
  priority: NotificationPriority;
}

export interface NotificationConfig {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  badge: boolean;
  priority: NotificationPriority;
  categories: {
    health: NotificationCategoryConfig;
    security: NotificationCategoryConfig;
    reminder: NotificationCategoryConfig;
    promotion: NotificationCategoryConfig;
  };
}