import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  timestamp: number;
}

interface AppState {
  isFirstLaunch: boolean;
  notifications: AppNotification[];
  defaultPetId: string | null;
  defaultPetName: string;
  theme: 'light' | 'dark' | 'auto';
  language: 'zh-CN' | 'en-US';
  
  setFirstLaunch: (value: boolean) => void;
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  setDefaultPet: (id: string, name: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setLanguage: (language: 'zh-CN' | 'en-US') => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isFirstLaunch: true,
      notifications: [],
      defaultPetId: null,
      defaultPetName: '小橘',
      theme: 'light',
      language: 'zh-CN',

      setFirstLaunch: (value) => set({ isFirstLaunch: value }),

      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            {
              ...notification,
              id: `notif-${Date.now()}`,
              timestamp: Date.now(),
              read: false,
            },
            ...state.notifications,
          ],
        })),

      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      clearNotifications: () => set({ notifications: [] }),

      setDefaultPet: (id, name) =>
        set({ defaultPetId: id, defaultPetName: name }),

      setTheme: (theme) => set({ theme }),

      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
