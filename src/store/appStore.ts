import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  username: string;
  isPremium: boolean;
  createdAt: string;
}

interface Pet {
  id: string;
  name: string;
  breed: string;
  age: number;
  avatarUrl: string;
  type: 'dog' | 'cat' | 'bird' | 'other';
}

interface Analysis {
  id: string;
  petId: string;
  type: 'voice' | 'image' | 'video';
  result: {
    emotion: string;
    translation: string;
    confidence: number;
  };
  createdAt: string;
}

interface HealthAlert {
  id: string;
  petId: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  read: boolean;
}

interface CareTip {
  id: string;
  category: 'feeding' | 'exercise' | 'grooming' | 'health' | 'behavior';
  title: string;
  description: string;
  content?: string;
  petType?: 'cat' | 'dog' | 'other';
  priority: 'high' | 'medium' | 'low';
}

interface AppSettings {
  darkMode: boolean;
  notifications: boolean;
  language: string;
  units: 'metric' | 'imperial';
  soundEnabled: boolean;
  fontSize: 'small' | 'medium' | 'large';
  autoPlay: boolean;
}

interface AppState {
  // 初始化状态
  isInitialized: boolean;
  initProgress: number;
  initMessage: string;

  // 用户与认证
  user: User | null;
  isAuthenticated: boolean;
  isOnboardingComplete: boolean;

  // 宠物
  pets: Pet[];
  currentPet: Pet | null;

  // 分析记录
  analyses: Analysis[];

  // 健康
  healthAlerts: HealthAlert[];
  currentEmotion: 'happy' | 'anxious' | 'angry' | 'needs' | 'neutral';
  healthScore: number;
  isRecording: boolean;
  careTips: CareTip[];

  // 设置
  settings: AppSettings;

  // Actions - 初始化
  initializeApp: () => Promise<void>;
  setInitProgress: (progress: number, message: string) => void;

  // Actions - 用户
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, username: string) => Promise<boolean>;
  logout: () => void;
  completeOnboarding: () => void;

  // Actions - 宠物
  setCurrentPet: (pet: Pet) => void;
  updateCurrentPet: (updates: Partial<Pet>) => void;
  addPet: (pet: Omit<Pet, 'id'>) => void;
  removePet: (petId: string) => void;

  // Actions - 分析
  addAnalysis: (analysis: Omit<Analysis, 'id' | 'createdAt'>) => void;

  // Actions - 健康
  addHealthAlert: (alert: Omit<HealthAlert, 'id' | 'read'>) => void;
  markAlertRead: (id: string) => void;
  setIsRecording: (isRecording: boolean) => void;
  setCurrentEmotion: (emotion: 'happy' | 'anxious' | 'angry' | 'needs' | 'neutral') => void;
  setHealthScore: (score: number) => void;

  // Actions - 设置
  updateSettings: (settings: Partial<AppSettings>) => void;
  clearAllData: () => void;
}

const DEFAULT_PET: Pet = {
  id: 'pet-default-1',
  name: '小橘',
  breed: '橘猫',
  age: 2,
  avatarUrl: '',
  type: 'cat',
};

const DEFAULT_USER: User = {
  id: 'user-default-1',
  email: 'demo@pawsync.pro',
  username: '小陈工',
  isPremium: true,
  createdAt: new Date().toISOString(),
};

const DEFAULT_CARE_TIPS: CareTip[] = [
  {
    id: 'tip-1',
    category: 'feeding',
    title: '规律喂食',
    description: '每天定时定量喂食，有助于消化系统健康',
    priority: 'high',
  },
  {
    id: 'tip-2',
    category: 'exercise',
    title: '每日运动',
    description: '保持每天 30 分钟以上的活动量',
    priority: 'high',
  },
  {
    id: 'tip-3',
    category: 'grooming',
    title: '定期梳理',
    description: '每周梳理毛发 2-3 次，减少掉毛',
    priority: 'medium',
  },
  {
    id: 'tip-4',
    category: 'health',
    title: '年度体检',
    description: '每年至少做一次全面体检',
    priority: 'medium',
  },
  {
    id: 'tip-5',
    category: 'behavior',
    title: '社交训练',
    description: '从小进行社交训练，养成稳定性格',
    priority: 'low',
  },
];

const DEFAULT_HEALTH_ALERTS: HealthAlert[] = [
  {
    id: 'alert-welcome',
    petId: 'pet-default-1',
    type: 'welcome',
    severity: 'low',
    message: '欢迎使用 PawSync Pro！小橘的健康档案已建立。',
    timestamp: new Date().toISOString(),
    read: false,
  },
];

const DEFAULT_SETTINGS: AppSettings = {
  darkMode: false,
  notifications: true,
  language: 'zh-CN',
  units: 'metric',
  soundEnabled: true,
  fontSize: 'medium',
  autoPlay: true,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isInitialized: false,
      initProgress: 0,
      initMessage: '正在加载...',
      user: DEFAULT_USER,
      isAuthenticated: true,
      isOnboardingComplete: true,
      pets: [DEFAULT_PET],
      currentPet: DEFAULT_PET,
      analyses: [],
      healthAlerts: DEFAULT_HEALTH_ALERTS,
      currentEmotion: 'happy',
      healthScore: 88,
      isRecording: false,
      careTips: DEFAULT_CARE_TIPS,
      settings: DEFAULT_SETTINGS,

      initializeApp: async () => {
        const steps = [
          { progress: 20, message: '正在加载核心模块...' },
          { progress: 50, message: '正在同步宠物数据...' },
          { progress: 80, message: '正在初始化 AI 引擎...' },
          { progress: 100, message: '准备就绪' },
        ];
        for (const step of steps) {
          set({ initProgress: step.progress, initMessage: step.message });
          await new Promise((r) => setTimeout(r, 300));
        }
        set({ isInitialized: true });
      },

      setInitProgress: (progress, message) => set({ initProgress: progress, initMessage: message }),

      setUser: (user) => set({ user, isAuthenticated: user !== null }),

      login: async (email, _password) => {
        const newUser: User = {
          id: `user-${Date.now()}`,
          email,
          username: email.split('@')[0],
          isPremium: false,
          createdAt: new Date().toISOString(),
        };
        set({ user: newUser, isAuthenticated: true });
        return true;
      },

      register: async (email, _password, username) => {
        const newUser: User = {
          id: `user-${Date.now()}`,
          email,
          username,
          isPremium: false,
          createdAt: new Date().toISOString(),
        };
        set({ user: newUser, isAuthenticated: true, isOnboardingComplete: false });
        return true;
      },

      logout: () =>
        set({ user: null, isAuthenticated: false, isOnboardingComplete: false }),

      completeOnboarding: () => set({ isOnboardingComplete: true }),

      setCurrentPet: (pet) => set({ currentPet: pet }),

      updateCurrentPet: (updates) =>
        set((state) => ({
          currentPet: state.currentPet ? { ...state.currentPet, ...updates } : null,
        })),

      addPet: (pet) =>
        set((state) => {
          const newPet: Pet = { ...pet, id: `pet-${Date.now()}` };
          return { pets: [...state.pets, newPet] };
        }),

      removePet: (petId) =>
        set((state) => ({
          pets: state.pets.filter((p) => p.id !== petId),
          currentPet: state.currentPet?.id === petId ? null : state.currentPet,
        })),

      addAnalysis: (analysis) =>
        set((state) => ({
          analyses: [
            ...state.analyses,
            {
              ...analysis,
              id: `analysis-${Date.now()}`,
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      addHealthAlert: (alert) =>
        set((state) => ({
          healthAlerts: [
            ...state.healthAlerts,
            { ...alert, id: `alert-${Date.now()}`, read: false },
          ],
        })),

      markAlertRead: (id) =>
        set((state) => ({
          healthAlerts: state.healthAlerts.map((a) =>
            a.id === id ? { ...a, read: true } : a
          ),
        })),

      setIsRecording: (isRecording) => set({ isRecording }),
      setCurrentEmotion: (emotion) => set({ currentEmotion: emotion }),
      setHealthScore: (score) => set({ healthScore: score }),

      updateSettings: (newSettings) =>
        set((state) => ({ settings: { ...state.settings, ...newSettings } })),

      clearAllData: () =>
        set({
          pets: [DEFAULT_PET],
          currentPet: DEFAULT_PET,
          analyses: [],
          healthAlerts: DEFAULT_HEALTH_ALERTS,
          settings: DEFAULT_SETTINGS,
        }),
    }),
    {
      name: 'app-storage',
    }
  )
);
