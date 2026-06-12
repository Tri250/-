/**
 * Settings Store - 设置管理数据存储
 *
 * 管理应用设置、用户偏好、通知设置等功能
 * 支持 Capacitor 原生存储
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

// 通知设置
export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  healthReminders: boolean;
  feedingReminders: boolean;
  activityReminders: boolean;
  systemNotifications: boolean;
}

// 显示设置
export interface DisplaySettings {
  darkMode: boolean;
  language: string;
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  showAnimations: boolean;
}

// 数据设置
export interface DataSettings {
  autoSync: boolean;
  syncInterval: number; // 分钟
  offlineMode: boolean;
  dataUsage: 'low' | 'medium' | 'high';
}

// 隐私设置
export interface PrivacySettings {
  analyticsEnabled: boolean;
  crashReportsEnabled: boolean;
  locationTracking: boolean;
  shareData: boolean;
}

// 存储设置
export interface StorageSettings {
  autoBackup: boolean;
  backupInterval: number; // 天
  storageLocation: 'local' | 'cloud' | 'both';
}

// Store 接口
interface SettingsState {
  notifications: NotificationSettings;
  display: DisplaySettings;
  data: DataSettings;
  privacy: PrivacySettings;
  storage: StorageSettings;
  
  // 通知设置
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  
  // 显示设置
  updateDisplaySettings: (settings: Partial<DisplaySettings>) => void;
  toggleDarkMode: () => void;
  
  // 数据设置
  updateDataSettings: (settings: Partial<DataSettings>) => void;
  
  // 隐私设置
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => void;
  
  // 存储设置
  updateStorageSettings: (settings: Partial<StorageSettings>) => void;
  
  // 重置
  resetAllSettings: () => void;
  resetNotificationSettings: () => void;
  resetDisplaySettings: () => void;
  
  // 初始化
  initialize: () => Promise<void>;
}

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

// 默认设置
const defaultNotificationSettings: NotificationSettings = {
  enabled: true,
  sound: true,
  vibration: true,
  healthReminders: true,
  feedingReminders: true,
  activityReminders: true,
  systemNotifications: true,
};

const defaultDisplaySettings: DisplaySettings = {
  darkMode: false,
  language: 'zh-CN',
  fontSize: 'medium',
  compactMode: false,
  showAnimations: true,
};

const defaultDataSettings: DataSettings = {
  autoSync: true,
  syncInterval: 15,
  offlineMode: false,
  dataUsage: 'medium',
};

const defaultPrivacySettings: PrivacySettings = {
  analyticsEnabled: true,
  crashReportsEnabled: true,
  locationTracking: false,
  shareData: false,
};

const defaultStorageSettings: StorageSettings = {
  autoBackup: true,
  backupInterval: 7,
  storageLocation: 'both',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      notifications: defaultNotificationSettings,
      display: defaultDisplaySettings,
      data: defaultDataSettings,
      privacy: defaultPrivacySettings,
      storage: defaultStorageSettings,

      updateNotificationSettings: (settings) => {
        set((state) => ({
          notifications: { ...state.notifications, ...settings },
        }));
      },

      updateDisplaySettings: (settings) => {
        set((state) => ({
          display: { ...state.display, ...settings },
        }));
        
        // 应用暗黑模式
        if (settings.darkMode !== undefined) {
          if (settings.darkMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      },

      toggleDarkMode: () => {
        set((state) => {
          const newDarkMode = !state.display.darkMode;
          
          if (newDarkMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          
          return {
            display: { ...state.display, darkMode: newDarkMode },
          };
        });
      },

      updateDataSettings: (settings) => {
        set((state) => ({
          data: { ...state.data, ...settings },
        }));
      },

      updatePrivacySettings: (settings) => {
        set((state) => ({
          privacy: { ...state.privacy, ...settings },
        }));
      },

      updateStorageSettings: (settings) => {
        set((state) => ({
          storage: { ...state.storage, ...settings },
        }));
      },

      resetAllSettings: () => {
        set({
          notifications: defaultNotificationSettings,
          display: defaultDisplaySettings,
          data: defaultDataSettings,
          privacy: defaultPrivacySettings,
          storage: defaultStorageSettings,
        });
        
        document.documentElement.classList.remove('dark');
      },

      resetNotificationSettings: () => {
        set({ notifications: defaultNotificationSettings });
      },

      resetDisplaySettings: () => {
        set({ display: defaultDisplaySettings });
        document.documentElement.classList.remove('dark');
      },

      initialize: async () => {
        // 应用暗黑模式
        const state = set.getState ? {} : useSettingsStore.getState();
        if (state.display?.darkMode) {
          document.documentElement.classList.add('dark');
        }
      },
    }),
    {
      name: 'pawsync-settings-store',
      storage: createJSONStorage(() => capacitorStorage),
    }
  )
);