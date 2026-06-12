// ============================================
// PawSync Pro - appStore.ts
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 应用主状态管理，包含用户、宠物、分析结果等状态
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  isPremium: boolean;
  createdAt: string;
}

export interface Pet {
  id: string;
  name: string;
  breed: string;
  age: number;
  avatarUrl: string;
  type: 'cat' | 'dog' | 'other';
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
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, username: string) => Promise<boolean>;
  logout: () => void;
  completeOnboarding: () => void;
  setCurrentPet: (pet: Pet) => void;
  updateCurrentPet: (pet: Partial<Pet>) => void;
  addPet: (pet: Omit<Pet, 'id'>) => void;
  addAnalysis: (analysis: Omit<Analysis, 'id' | 'createdAt'>) => void;
  addHealthAlert: (alert: Omit<HealthAlert, 'id'>) => void;
  setIsRecording: (isRecording: boolean) => void;
  setCurrentEmotion: (emotion: 'happy' | 'anxious' | 'angry' | 'needs' | 'neutral') => void;
  setHealthScore: (score: number) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  clearAllData: () => void;
  initializeApp: () => Promise<void>;
  setInitProgress: (progress: number, message: string) => void;
}

const defaultCareTips: CareTip[] = [
  {
    id: '1',
    category: 'feeding',
    title: '定时定量喂食',
    content: '成年猫每天需要2-3次定时喂食，保持规律的饮食习惯有助于消化系统健康。',
    petType: 'cat',
    priority: 'high',
  },
  {
    id: '2',
    category: 'health',
    title: '定期体检',
    content: '建议每年带宠物进行一次全面体检，及时发现潜在健康问题。',
    petType: 'all',
    priority: 'high',
  },
  {
    id: '3',
    category: 'grooming',
    title: '毛发护理',
    content: '定期梳理毛发可以促进血液循环，减少掉毛和毛球问题。',
    petType: 'cat',
    priority: 'medium',
  },
  {
    id: '4',
    category: 'exercise',
    title: '每日互动玩耍',
    content: '每天花15-30分钟与宠物互动玩耍，保持身心健康和良好的关系。',
    petType: 'all',
    priority: 'high',
  },
  {
    id: '5',
    category: 'behavior',
    title: '观察异常行为',
    content: '注意宠物的行为变化，如食欲不振、过度舔毛等可能是健康问题的信号。',
    petType: 'all',
    priority: 'medium',
  },
];

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
      user: {
        id: 'default-user',
        email: 'user@pawsync.local',
        username: '宠物主人',
        isPremium: false,
        createdAt: new Date().toISOString(),
      },
      isAuthenticated: true,
      isOnboardingComplete: true,
      isInitialized: false,
      initProgress: 0,
      initMessage: '正在启动应用...',
      pets: [{
        id: '1',
        name: '小橘',
        breed: '橘猫',
        age: 2,
        avatarUrl: '',
        type: 'cat' as const,
      }],
      currentPet: {
        id: '1',
        name: '小橘',
        breed: '橘猫',
        age: 2,
        avatarUrl: '',
        type: 'cat' as const,
      },
      analyses: [],
      healthAlerts: [{
        id: '1',
        petId: '1',
        type: 'cough',
        severity: 'low',
        message: '注意观察咳嗽情况',
        timestamp: new Date().toISOString(),
      }],
      currentEmotion: 'happy',
      healthScore: 92,
      isRecording: false,
      settings: defaultSettings,
      careTips: defaultCareTips,

      setInitProgress: (progress, message) => set({ initProgress: progress, initMessage: message }),

      initializeApp: async () => {
        const { setInitProgress } = get();
        
        try {
          setInitProgress(10, '正在加载应用配置...');
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // 初始化平台服务（Android/iOS）
          setInitProgress(20, '正在初始化平台服务...');
          try {
            const { PlatformServices } = await import('../lib/platformService');
            const platform = PlatformServices.getCurrentPlatform();
            console.log(`[AppStore] Current platform: ${platform}`);
            
            // 原生平台初始化
            if (PlatformServices.isNativePlatform()) {
              console.log('[AppStore] Initializing native platform services...');
              
              // 初始化推送通知服务
              try {
                const { pushNotificationService } = await import('../services/pushNotificationService');
                await pushNotificationService.initialize();
                console.log('[AppStore] Push notification service initialized');
              } catch (pushError) {
                console.warn('[AppStore] Push notification initialization failed:', pushError);
              }
              
              // 初始化权限检查
              try {
                const { permissionManager } = await import('../services/permissionService');
                await permissionManager.checkAllPermissions();
                console.log('[AppStore] Permissions checked');
              } catch (permError) {
                console.warn('[AppStore] Permission check failed:', permError);
              }
            }
          } catch (platformError) {
            console.warn('[AppStore] Platform service initialization failed:', platformError);
          }
          
          // 初始化所有数据存储
          setInitProgress(30, '正在初始化数据存储...');
          try {
            // 初始化新增的Store
            const { useDevicesStore } = await import('./devicesStore');
            const { useDietStore } = await import('./dietStore');
            const { useRecordsStore } = await import('./recordsStore');
            const { useHealthStore } = await import('./healthStore');
            const { useFavoritesStore } = await import('./favoritesStore');
            const { useSettingsStore } = await import('./settingsStore');
            const { useUserProfileStore } = await import('./userProfileStore');
            const { useTranslatorStore } = await import('./translatorStore');
            const { useServicesStore } = await import('./servicesStore');
            const { useHealthReportStore } = await import('./healthReportStore');
            const { usePetStore } = await import('./petStore');
            const { useReminderStore } = await import('./reminderStore');
            const { useMedicalStore } = await import('./medicalStore');
            const { useTrainingStore } = await import('./trainingStore');
            const { useInsuranceStore } = await import('./insuranceStore');
            const { useBondStore } = await import('./bondStore');
            
            // 初始化各个Store
            await useDevicesStore.getState().initialize();
            await useDietStore.getState().initialize();
            await useRecordsStore.getState().initialize();
            await useHealthStore.getState().initialize();
            await useFavoritesStore.getState().initialize();
            await useSettingsStore.getState().initialize();
            await useUserProfileStore.getState().initialize();
            await useTranslatorStore.getState().initialize();
            await useServicesStore.getState().initialize();
            await useHealthReportStore.getState().initialize();
            await usePetStore.getState().initialize?.();
            await useReminderStore.getState().initialize?.();
            await useMedicalStore.getState().initialize?.();
            await useTrainingStore.getState().initialize?.();
            await useInsuranceStore.getState().initialize?.();
            await useBondStore.getState().initialize?.();
            
            console.log('[AppStore] All stores initialized');
          } catch (storeError) {
            console.warn('[AppStore] Store initialization failed:', storeError);
          }
          
          setInitProgress(50, '正在加载用户数据...');
          await new Promise(resolve => setTimeout(resolve, 100));
          
          setInitProgress(70, '正在加载宠物信息...');
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // 加载功能标志
          setInitProgress(85, '正在加载功能配置...');
          try {
            const { getFeatureFlags } = await import('../lib/featureFlags');
            const flags = getFeatureFlags();
            console.log('[AppStore] Feature flags loaded:', Object.keys(flags).length);
          } catch (flagError) {
            console.warn('[AppStore] Feature flags loading failed:', flagError);
          }
          
          setInitProgress(90, '正在完成初始化...');
          await new Promise(resolve => setTimeout(resolve, 100));
          
          setInitProgress(100, '初始化完成');
          
          const state = get();
          if (!state.pets.length && state.isAuthenticated) {
            const defaultPet: Pet = {
              id: '1',
              name: '小橘',
              breed: '橘猫',
              age: 2,
              avatarUrl: '',
              type: 'cat',
            };
            set({ 
              pets: [defaultPet], 
              currentPet: defaultPet,
            });
          }
          
          set({ isInitialized: true });
          console.log('[AppStore] App initialization completed');
        } catch (error) {
          console.error('[AppStore] Initialization failed:', error);
          setInitProgress(100, '初始化完成（部分功能可能受限）');
          set({ isInitialized: true });
        }
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      login: async (email, _password) => {
        set({ initProgress: 30, initMessage: '正在验证账号...' });
        await new Promise(resolve => setTimeout(resolve, 500));
        
        set({ initProgress: 60, initMessage: '正在获取用户信息...' });
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockUser: User = {
          id: '1',
          email,
          username: email.split('@')[0],
          isPremium: false,
          createdAt: new Date().toISOString(),
        };
        
        set({ 
          user: mockUser, 
          isAuthenticated: true,
          initProgress: 100,
          initMessage: '登录成功',
        });
        return true;
      },

      register: async (email, _password, username) => {
        set({ initProgress: 30, initMessage: '正在创建账号...' });
        await new Promise(resolve => setTimeout(resolve, 500));
        
        set({ initProgress: 60, initMessage: '正在初始化用户数据...' });
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockUser: User = {
          id: Date.now().toString(),
          email,
          username,
          isPremium: false,
          createdAt: new Date().toISOString(),
        };
        
        set({ 
          user: mockUser, 
          isAuthenticated: true, 
          isOnboardingComplete: false,
          initProgress: 100,
          initMessage: '注册成功',
        });
        return true;
      },

      logout: () => {
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

      updateCurrentPet: (petUpdate) => set((state) => {
        if (!state.currentPet) return state;
        const updatedPet = { ...state.currentPet, ...petUpdate };
        return {
          currentPet: updatedPet,
          pets: state.pets.map(p => p.id === updatedPet.id ? updatedPet : p),
        };
      }),

      addPet: (pet) => set((state) => ({
        pets: [...state.pets, { ...pet, id: Date.now().toString() }],
      })),

      addAnalysis: (analysis) => set((state) => ({
        analyses: [...state.analyses, {
          ...analysis,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        }],
      })),

      addHealthAlert: (alert) => set((state) => ({
        healthAlerts: [...state.healthAlerts, {
          ...alert,
          id: Date.now().toString(),
        }],
      })),

      setIsRecording: (isRecording) => set({ isRecording }),

      setCurrentEmotion: (emotion) => set({ currentEmotion: emotion }),

      setHealthScore: (score) => set({ healthScore: score }),

      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings },
      })),

      clearAllData: () => set({
        analyses: [],
        healthAlerts: [],
        pets: [],
        currentPet: null,
      }),
    }),
    {
      name: 'pawsync-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isOnboardingComplete: state.isOnboardingComplete,
        pets: state.pets,
        currentPet: state.currentPet,
        analyses: state.analyses.slice(-50),
        healthAlerts: state.healthAlerts.slice(-20),
        settings: state.settings,
        healthScore: state.healthScore,
      }),
    }
  )
);