// 智能提醒相关类型

export type ReminderType = 
  | 'vaccine' 
  | 'deworming' 
  | 'checkup' 
  | 'bath' 
  | 'brush_teeth' 
  | 'medicine' 
  | 'grooming' 
  | 'birthday'
  | 'custom';

export type RepeatType = 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export type NotificationChannel = 'app' | 'push' | 'email' | 'sms' | 'wechat';

export interface ReminderNotification {
  channels: NotificationChannel[];
  notifyBefore: number;
  notifyAgainAfter?: number;
}

export interface SmartRecommendation {
  type: ReminderType;
  suggestedDate: string;
  suggestedTime: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  basedOn?: {
    petAge?: number;
    lastVaccineDate?: string;
    lastDewormingDate?: string;
    petBirthday?: string;
    petBreed?: string;
  };
}

export interface Reminder {
  id: string;
  petId: string;
  type: ReminderType;
  title: string;
  notes?: string;
  date: string;
  time: string;
  repeat: RepeatType;
  endDate?: string;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  notification?: ReminderNotification;
  smartRecommendation?: SmartRecommendation;
}

export const REMINDER_TYPES: { id: ReminderType; name: string; icon: string; color: string }[] = [
  { id: 'vaccine', name: '疫苗', icon: '💉', color: '#10B981' },
  { id: 'deworming', name: '驱虫', icon: '🐛', color: '#F59E0B' },
  { id: 'checkup', name: '体检', icon: '🏥', color: '#8B5CF6' },
  { id: 'bath', name: '洗澡', icon: '🛁', color: '#0E9CE5' },
  { id: 'brush_teeth', name: '刷牙', icon: '🪥', color: '#EC4899' },
  { id: 'medicine', name: '喂药', icon: '💊', color: '#EF4444' },
  { id: 'grooming', name: '美容', icon: '✂️', color: '#FF6B00' },
  { id: 'birthday', name: '生日', icon: '🎂', color: '#FF69B4' },
  { id: 'custom', name: '自定义', icon: '📌', color: '#6B7280' },
];

export const NOTIFICATION_CHANNELS: { id: NotificationChannel; name: string; icon: string }[] = [
  { id: 'app', name: '应用内通知', icon: '📱' },
  { id: 'push', name: '推送通知', icon: '🔔' },
  { id: 'email', name: '邮件通知', icon: '📧' },
  { id: 'sms', name: '短信通知', icon: '💬' },
  { id: 'wechat', name: '微信通知', icon: '💚' },
];

export const NOTIFY_BEFORE_OPTIONS = [
  { value: 0, label: '准时提醒' },
  { value: 30, label: '提前30分钟' },
  { value: 60, label: '提前1小时' },
  { value: 120, label: '提前2小时' },
  { value: 360, label: '提前6小时' },
  { value: 720, label: '提前12小时' },
  { value: 1440, label: '提前1天' },
  { value: 2880, label: '提前2天' },
  { value: 4320, label: '提前3天' },
  { value: 10080, label: '提前1周' },
];
