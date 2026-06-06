// ============================================
// PawSync Pro - appStore.ts (真实数据版)
// 使用 IndexedDB 替代 mock 数据
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { initDB, initDefaultData, userDB, petDB, analysisDB, healthAlertDB, careTipDB } from '../lib/db';

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  isPremium: boolean;
  createdAt: string;
}

export interface Pet {
  id?: string;
  userId?: string;
  name: string;
  breed: string;
  age: number;
  avatarUrl: string;
  type: 'cat' | 'dog' | 'other';
  weight?: number;
  gender?: 'male' | 'female';
  birthday?: string;
}

export interface Analysis {
  id: string;
  petId: string;
  type: 'voice' | 'image';
  result: {
    emotion: 'happy' | 'anxious' | 'angry' | 'needs' | 'neutral';
    translation: string;
    confidence: number;
  };
  createdAt: string;
}

export interface HealthAlert {
  id: string;
  petId: string;
  type: 'cough' | 'vomit' | 'pain' | 'abnormal';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: string;
  isRead?: boolean;
}

export interface CareTip {
  id: string;
  category: 'feeding' | 'exercise' | 'grooming' | 'health' | 'behavior';
  title: string;
  content: string;
  petType?: 'cat' | 'dog' | 'all';
  priority: 'high' | 'medium' | 'low';
}

export interface AppSettings {
  notifications: boolean;
  soundEnabled: boolean;
  darkMode: boolean;
  fontSize: 'small' | 'medium' | 'large';
  autoPlay: boolean;
  language: 'zh-CN' | 'en-US';
}

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isOnboardingComplete: boolean;
  isInitialized: boolean;
  initProgress: number;
  initMessage: string;
  pets: Pet[];
  currentPet: Pet | null;
  analyses: Analysis[];
  healthAlerts: HealthAlert[];
  currentEmotion: 'happy' | 'anxious' | 'angry' | 'needs' | 'neutral';
  healthScore: number;
  isRecording: boolean;
  careTips: CareTip[];
  settings: AppSettings;
  
  // Actions
  setUser: (user: User | null) => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, username: string) => Promise<boolean>;
  logout: () => Promise<void>;
  completeOnboarding: () => void;
  setCurrentPet: (pet: Pet | null) => void;
  updateCurrentPet: (pet: Partial<Pet>) => Promise<void>;
  addPet: (pet: Omit<Pet, 'id' | 'userId'>) => Promise<void>;
  deletePet: (petId: string) => Promise<void>;
  addAnalysis: (analysis: Omit<Analysis, 'id' | 'createdAt'>) => Promise<void>;
  addHealthAlert: (alert: Omit<HealthAlert, 'id'>) => Promise<void>;
  markAlertAsRead: (alertId: string) => Promise<void>;
  setIsRecording: (isRecording: boolean) => void;
  setCurrentEmotion: (emotion: 'happy' | 'anxious' | 'angry' | 'needs' | 'neutral') => void;
  setHealthScore: (score: number) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  clearAllData: () => Promise<void>;
  initializeApp: () => Promise<void>;
  loadUserData: () => Promise<void>;
  refreshCareTips: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  notifications: true,
  soundEnabled: true,
  darkMode: false,
  fontSize: 'medium',
  autoPlay: true,
  language: 'zh-CN',
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isOnboardingComplete: false,
      isInitialized: false,
      initProgress: 0,
      initMessage: '正在启动应用...',
      pets: [],
      currentPet: null,
      analyses: [],
      healthAlerts: [],
      currentEmotion: 'happy',
      healthScore: 0,
      isRecording: false,
      settings: defaultSettings,
      careTips: [],

      initializeApp: async () => {
        const { initProgress } = get();
        if (initProgress > 0) return;
        
        try {
          set({ initProgress: 10, initMessage: '正在初始化数据库...' });
          await initDB();
          
          set({ initProgress: 30, initMessage: '正在加载默认数据...' });
          await initDefaultData();
          
          set({ initProgress: 50, initMessage: '正在加载用户数据...' });
          await get().loadUserData();
          
          set({ initProgress: 80, initMessage: '正在加载养宠贴士...' });
          await get().refreshCareTips();
          
          set({ initProgress: 100, initMessage: '初始化完成', isInitialized: true });
        } catch (error) {
          console.error('初始化失败:', error);
          set({ initMessage: '初始化失败，请刷新重试' });
        }
      },

      loadUserData: async () => {
        try {
          // 加载用户
          const users = await userDB.getAll();
          if (users.length > 0) {
            const user = users[0] as User;
            set({ user, isAuthenticated: true });
            
            // 加载该用户的宠物
            const allPets = await petDB.getAll() as Pet[];
            const userPets = allPets.filter((p) => p.userId === user.id);
            set({ pets: userPets });
            
            if (userPets.length > 0 && userPets[0].id) {
              set({ currentPet: userPets[0] });
              
              // 加载该宠物的分析记录
              const analyses = await analysisDB.getByIndex('petId', userPets[0].id);
              set({ analyses: analyses as Analysis[] });
              
              // 加载健康告警
              const alerts = await healthAlertDB.getByIndex('petId', userPets[0].id);
              set({ healthAlerts: alerts as HealthAlert[] });
            }
          }
        } catch (error) {
          console.error('加载用户数据失败:', error);
        }
      },

      refreshCareTips: async () => {
        try {
          const tips = await careTipDB.getAll();
          set({ careTips: tips as CareTip[] });
        } catch (error) {
          console.error('加载养宠贴士失败:', error);
        }
      },

      setUser: async (user) => {
        if (user) {
          await userDB.update(user.id, user);
        }
        set({ user, isAuthenticated: !!user });
      },

      login: async (email, _password) => {
        set({ initProgress: 30, initMessage: '正在验证账号...' });
        
        try {
          // 这里应该调用真实的认证 API
          // 现在使用本地数据库模拟
          const users = await userDB.getAll();
          const user = users.find((u: User) => u.email === email);
          
          if (user) {
            set({ 
              user: user as User, 
              isAuthenticated: true,
              initProgress: 100,
              initMessage: '登录成功',
            });
            await get().loadUserData();
            return true;
          }
          
          // 如果没有找到用户，创建新用户
          const newUser: User = {
            id: Date.now().toString(),
            email,
            username: email.split('@')[0],
            isPremium: false,
            createdAt: new Date().toISOString(),
          };
          
          await userDB.create(newUser);
          set({ 
            user: newUser, 
            isAuthenticated: true,
            initProgress: 100,
            initMessage: '登录成功',
          });
          
          return true;
        } catch (error) {
          console.error('登录失败:', error);
          return false;
        }
      },

      register: async (email, password, username) => {
        set({ initProgress: 30, initMessage: '正在创建账号...' });
        
        try {
          const newUser: User = {
            id: Date.now().toString(),
            email,
            username,
            isPremium: false,
            createdAt: new Date().toISOString(),
          };
          
          await userDB.create(newUser);
          
          set({ 
            user: newUser, 
            isAuthenticated: true, 
            isOnboardingComplete: false,
            initProgress: 100,
            initMessage: '注册成功',
          });
          
          return true;
        } catch (error) {
          console.error('注册失败:', error);
          return false;
        }
      },

      logout: async () => {
        set({ 
          user: null, 
          isAuthenticated: false, 
          isOnboardingComplete: false,
          pets: [],
          currentPet: null,
          analyses: [],
          healthAlerts: [],
        });
      },

      completeOnboarding: () => set({ isOnboardingComplete: true }),

      setCurrentPet: (pet) => set({ currentPet: pet }),

      updateCurrentPet: async (petUpdate) => {
        const { currentPet, pets } = get();
        if (!currentPet) return;
        
        const updatedPet = { ...currentPet, ...petUpdate };
        await petDB.update(currentPet.id, updatedPet);
        
        set({
          currentPet: updatedPet,
          pets: pets.map(p => p.id === updatedPet.id ? updatedPet : p),
        });
      },

      addPet: async (pet) => {
        const { user, pets } = get();
        if (!user) return;
        
        const newPet: Pet = {
          ...pet,
          id: Date.now().toString(),
          userId: user.id,
        };
        
        await petDB.create(newPet);
        set({ pets: [...pets, newPet] });
        
        if (pets.length === 0) {
          set({ currentPet: newPet });
        }
      },

      deletePet: async (petId) => {
        const { pets, currentPet } = get();
        await petDB.delete(petId);
        
        const updatedPets = pets.filter(p => p.id !== petId);
        set({ 
          pets: updatedPets,
          currentPet: currentPet?.id === petId ? (updatedPets[0] || null) : currentPet,
        });
      },

      addAnalysis: async (analysis) => {
        const newAnalysis: Analysis = {
          ...analysis,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        };
        
        await analysisDB.create(newAnalysis);
        set((state) => ({
          analyses: [newAnalysis, ...state.analyses],
        }));
      },

      addHealthAlert: async (alert) => {
        const newAlert: HealthAlert = {
          ...alert,
          id: Date.now().toString(),
          isRead: false,
        };
        
        await healthAlertDB.create(newAlert);
        set((state) => ({
          healthAlerts: [newAlert, ...state.healthAlerts],
        }));
      },

      markAlertAsRead: async (alertId) => {
        const alert = get().healthAlerts.find(a => a.id === alertId);
        if (!alert) return;
        const updatedAlert = { ...alert, isRead: true };
        await healthAlertDB.update(alertId, updatedAlert);
        set((state) => ({
          healthAlerts: state.healthAlerts.map(a =>
            a.id === alertId ? updatedAlert : a
          ),
        }));
      },

      setIsRecording: (isRecording) => set({ isRecording }),

      setCurrentEmotion: (emotion) => set({ currentEmotion: emotion }),

      setHealthScore: (score) => set({ healthScore: score }),

      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings },
      })),

      clearAllData: async () => {
        // 这里应该清空所有数据库表
        set({
          analyses: [],
          healthAlerts: [],
          pets: [],
          currentPet: null,
        });
      },
    }),
    {
      name: 'pawsync-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isOnboardingComplete: state.isOnboardingComplete,
        settings: state.settings,
        currentEmotion: state.currentEmotion,
        healthScore: state.healthScore,
      }),
    }
  )
);
