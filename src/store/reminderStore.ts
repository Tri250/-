import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { Reminder, ReminderType, REMINDER_TYPES as _REMINDER_TYPES, NotificationChannel } from '../types/reminder';

// Capacitor 原生存储适配器
const capacitorStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (Capacitor.isNativePlatform()) {
      const { value } = await Preferences.get({ key: name });
      return value;
    }
    return localStorage.getItem(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key: name, value });
    } else {
      localStorage.setItem(name, value);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      await Preferences.remove({ key: name });
    } else {
      localStorage.removeItem(name);
    }
  },
};

interface ReminderStore {
  reminders: Reminder[];
  selectedType: ReminderType | null;
  viewMode: 'today' | 'week' | 'all';
  
  addReminder: (reminder: Omit<Reminder, 'id' | 'isCompleted' | 'createdAt'>) => void;
  updateReminder: (id: string, updates: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
  toggleComplete: (id: string) => void;
  
  setSelectedType: (type: ReminderType | null) => void;
  setViewMode: (mode: 'today' | 'week' | 'all') => void;
  
  getFilteredReminders: (petId: string) => Reminder[];
  getUpcomingReminders: (petId: string, limit: number) => Reminder[];
  getSmartRecommendations: (petId: string, petBirthday?: string, lastVaccineDate?: string, lastDewormingDate?: string) => Array<{ type: ReminderType; suggestedDate: string; suggestedTime: string; reason: string; priority: 'high' | 'medium' | 'low' }>;
  sendNotification: (reminder: Reminder, channels: NotificationChannel[]) => Promise<boolean>;
}

// 示例数据
const INITIAL_REMINDERS: Reminder[] = [
  {
    id: '1',
    petId: '1',
    type: 'vaccine',
    title: '三联疫苗接种',
    notes: '需要提前半小时到医院',
    date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    time: '10:00',
    repeat: 'once',
    isCompleted: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    petId: '1',
    type: 'deworming',
    title: '体内驱虫',
    date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    time: '09:00',
    repeat: 'monthly',
    isCompleted: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    petId: '2',
    type: 'bath',
    title: '洗澡',
    date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    time: '14:00',
    repeat: 'weekly',
    isCompleted: false,
    createdAt: new Date().toISOString(),
  },
];

export const useReminderStore = create<ReminderStore>()(
  persist(
    (set, get) => ({
      reminders: INITIAL_REMINDERS,
      selectedType: null,
      viewMode: 'all',

      addReminder: (reminder) => {
        const newReminder: Reminder = {
          ...reminder,
          id: Date.now().toString(),
          isCompleted: false,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          reminders: [...state.reminders, newReminder],
        }));
      },

      updateReminder: (id, updates) => {
        set((state) => ({
          reminders: state.reminders.map((reminder) =>
            reminder.id === id ? { ...reminder, ...updates } : reminder
          ),
        }));
      },

      deleteReminder: (id) => {
        set((state) => ({
          reminders: state.reminders.filter((reminder) => reminder.id !== id),
        }));
      },

      toggleComplete: (id) => {
        set((state) => ({
          reminders: state.reminders.map((reminder) =>
            reminder.id === id
              ? {
                  ...reminder,
                  isCompleted: !reminder.isCompleted,
                  completedAt: !reminder.isCompleted ? new Date().toISOString() : undefined,
                }
              : reminder
          ),
        }));
      },

      setSelectedType: (type) => set({ selectedType: type }),
      setViewMode: (mode) => set({ viewMode: mode }),

      getFilteredReminders: (petId) => {
        const state = get();
        let filtered = state.reminders.filter((r) => r.petId === petId);
        
        if (state.selectedType) {
          filtered = filtered.filter((r) => r.type === state.selectedType);
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);
        
        if (state.viewMode === 'today') {
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          filtered = filtered.filter((r) => {
            const reminderDate = new Date(r.date);
            return reminderDate >= today && reminderDate < tomorrow;
          });
        } else if (state.viewMode === 'week') {
          filtered = filtered.filter((r) => {
            const reminderDate = new Date(r.date);
            return reminderDate >= today && reminderDate < weekEnd;
          });
        }
        
        return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      },

      getUpcomingReminders: (petId, limit) => {
        const state = get();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return state.reminders
          .filter((r) => r.petId === petId && !r.isCompleted && new Date(r.date) >= today)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, limit);
      },

      getSmartRecommendations: (petId, petBirthday, lastVaccineDate, lastDewormingDate) => {
        const recommendations: Array<{ type: ReminderType; suggestedDate: string; suggestedTime: string; reason: string; priority: 'high' | 'medium' | 'low' }> = [];
        const today = new Date();
        const state = get();
        
        const existingReminders = state.reminders.filter(r => r.petId === petId);

        if (petBirthday) {
          const birthday = new Date(petBirthday);
          const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
          if (thisYearBirthday < today) {
            thisYearBirthday.setFullYear(today.getFullYear() + 1);
          }
          const daysUntilBirthday = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
          
          const hasBirthdayReminder = existingReminders.some(r => 
            r.type === 'birthday' && 
            new Date(r.date).toDateString() === thisYearBirthday.toDateString()
          );
          
          if (!hasBirthdayReminder && daysUntilBirthday <= 90) {
            recommendations.push({
              type: 'birthday',
              suggestedDate: thisYearBirthday.toISOString().split('T')[0],
              suggestedTime: '09:00',
              reason: `${thisYearBirthday.getFullYear() - birthday.getFullYear()}岁生日即将到来`,
              priority: daysUntilBirthday <= 30 ? 'high' : 'medium',
            });
          }
        }

        if (lastVaccineDate) {
          const lastVaccine = new Date(lastVaccineDate);
          const nextVaccine = new Date(lastVaccine);
          nextVaccine.setFullYear(nextVaccine.getFullYear() + 1);
          const daysUntilVaccine = Math.ceil((nextVaccine.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
          
          const hasVaccineReminder = existingReminders.some(r => 
            r.type === 'vaccine' && 
            Math.abs(new Date(r.date).getTime() - nextVaccine.getTime()) < 7 * 24 * 60 * 60 * 1000
          );
          
          if (!hasVaccineReminder && daysUntilVaccine <= 90 && daysUntilVaccine > 0) {
            recommendations.push({
              type: 'vaccine',
              suggestedDate: nextVaccine.toISOString().split('T')[0],
              suggestedTime: '10:00',
              reason: '疫苗年度加强接种时间',
              priority: daysUntilVaccine <= 30 ? 'high' : 'medium',
            });
          }
        }

        if (lastDewormingDate) {
          const lastDeworming = new Date(lastDewormingDate);
          const nextDeworming = new Date(lastDeworming);
          nextDeworming.setMonth(nextDeworming.getMonth() + 3);
          const daysUntilDeworming = Math.ceil((nextDeworming.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
          
          const hasDewormingReminder = existingReminders.some(r => 
            r.type === 'deworming' && 
            Math.abs(new Date(r.date).getTime() - nextDeworming.getTime()) < 7 * 24 * 60 * 60 * 1000
          );
          
          if (!hasDewormingReminder && daysUntilDeworming <= 30 && daysUntilDeworming > 0) {
            recommendations.push({
              type: 'deworming',
              suggestedDate: nextDeworming.toISOString().split('T')[0],
              suggestedTime: '09:00',
              reason: '季度驱虫提醒',
              priority: daysUntilDeworming <= 7 ? 'high' : 'medium',
            });
          }
        }

        const nextCheckup = new Date(today);
        nextCheckup.setMonth(nextCheckup.getMonth() + 6);
        const hasCheckupReminder = existingReminders.some(r => 
          r.type === 'checkup' && 
          Math.abs(new Date(r.date).getTime() - nextCheckup.getTime()) < 30 * 24 * 60 * 60 * 1000
        );
        
        if (!hasCheckupReminder) {
          recommendations.push({
            type: 'checkup',
            suggestedDate: nextCheckup.toISOString().split('T')[0],
            suggestedTime: '10:00',
            reason: '建议每半年进行一次体检',
            priority: 'low',
          });
        }

        return recommendations.sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
      },

      sendNotification: async (reminder, channels) => {
        try {
          const notificationContent = {
            title: reminder.title,
            body: `提醒时间: ${reminder.date} ${reminder.time}${reminder.notes ? `\n备注: ${reminder.notes}` : ''}`,
            data: {
              reminderId: reminder.id,
              type: reminder.type,
              petId: reminder.petId,
            },
          };

          // 使用 pushNotificationService 发送通知（支持Android原生）
          const { pushNotificationService } = await import('../services/pushNotificationService');
          
          for (const channel of channels) {
            switch (channel) {
              case 'app':
                console.log('发送应用内通知:', notificationContent);
                break;
              case 'push':
                // 使用 pushNotificationService 发送推送通知
                await pushNotificationService.sendNotification(
                  notificationContent.title,
                  notificationContent.body,
                  {
                    type: 'reminder',
                    priority: 'normal',
                    data: notificationContent.data,
                  }
                );
                break;
              case 'email':
                console.log('发送邮件通知:', notificationContent);
                break;
              case 'sms':
                console.log('发送短信通知:', notificationContent);
                break;
              case 'wechat':
                console.log('发送微信通知:', notificationContent);
                break;
            }
          }

          return true;
        } catch (error) {
          console.error('发送通知失败:', error);
          return false;
        }
      },
    }),
    {
      name: 'pawsync-reminders-store',
      storage: createJSONStorage(() => capacitorStorage),
      partialize: (state) => ({
        reminders: state.reminders,
      }),
    }
  )
);
