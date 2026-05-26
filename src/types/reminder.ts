// 智能提醒相关类型

export type ReminderType = 
  | 'vaccine' 
  | 'deworming' 
  | 'checkup' 
  | 'bath' 
  | 'brush_teeth' 
  | 'medicine' 
  | 'grooming' 
  | 'custom';

export type RepeatType = 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';

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
}

export const REMINDER_TYPES: { id: ReminderType; name: string; icon: string; color: string }[] = [
  { id: 'vaccine', name: '疫苗', icon: '💉', color: '#10B981' },
  { id: 'deworming', name: '驱虫', icon: '🐛', color: '#F59E0B' },
  { id: 'checkup', name: '体检', icon: '🏥', color: '#8B5CF6' },
  { id: 'bath', name: '洗澡', icon: '🛁', color: '#0E9CE5' },
  { id: 'brush_teeth', name: '刷牙', icon: '🪥', color: '#EC4899' },
  { id: 'medicine', name: '喂药', icon: '💊', color: '#EF4444' },
  { id: 'grooming', name: '美容', icon: '✂️', color: '#FF6B00' },
  { id: 'custom', name: '自定义', icon: '📌', color: '#6B7280' },
];
