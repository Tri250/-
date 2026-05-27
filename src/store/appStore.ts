// ============================================
// PawSync Pro - appStore.ts
//
// 作者: 带娃的小陈工
// 日期: 2026-05-27
// 描述: 应用主状态管理，包含用户、宠物、分析结果等状态
// ============================================

import { create } from 'zustand';
import { AuthService, validateEmail, validatePassword, sanitizeInput } from '../services/authService';
import { secureStorage } from '../services/securityService';

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

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isOnboardingComplete: boolean;
  pets: Pet[];
  currentPet: Pet | null;
  analyses: Analysis[];
  healthAlerts: HealthAlert[];
  currentEmotion: 'happy' | 'anxious' | 'angry' | 'needs' | 'neutral';
  healthScore: number;
  isRecording: boolean;
  careTips: CareTip[];
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (email: string, password: string, confirmPassword: string, username: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  completeOnboarding: () => void;
  deleteAccount: (password: string) => Promise<{ success: boolean; message?: string }>;
  updateUserInfo: (updates: Partial<User>) => void;
  setCurrentPet: (pet: Pet) => void;
  addPet: (pet: Omit<Pet, 'id'>) => void;
  addAnalysis: (analysis: Omit<Analysis, 'id' | 'createdAt'>) => void;
  addHealthAlert: (alert: Omit<HealthAlert, 'id'>) => void;
  setIsRecording: (isRecording: boolean) => void;
  setCurrentEmotion: (emotion: 'happy' | 'anxious' | 'angry' | 'needs' | 'neutral') => void;
  setHealthScore: (score: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  isAuthenticated: true, // 临时设为 true 方便测试
  isOnboardingComplete: true, // 临时设为 true 方便测试
  pets: [
    {
      id: '1',
      name: '小橘',
      breed: '橘猫',
      age: 2,
      avatarUrl: '',
      type: 'cat',
    },
  ],
  currentPet: {
    id: '1',
    name: '小橘',
    breed: '橘猫',
    age: 2,
    avatarUrl: '',
    type: 'cat',
  },
  analyses: [],
  healthAlerts: [
    {
      id: '1',
      petId: '1',
      type: 'abnormal',
      severity: 'low',
      message: '轻微活动异常，建议观察',
      timestamp: '2024-01-15 14:30',
    },
  ],
  currentEmotion: 'happy',
  healthScore: 92,
  isRecording: false,
  careTips: [
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
  ],
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  login: async (email, password) => {
    const result = await AuthService.login(email, password);
    if (result.success && result.user) {
      set({ user: result.user, isAuthenticated: true });
      secureStorage.setItem('user', result.user);
    }
    return { success: result.success, message: result.message };
  },
  register: async (email, password, confirmPassword, username) => {
    // 验证邮箱格式
    if (!validateEmail(email)) {
      return { success: false, message: '请输入有效的邮箱地址' };
    }
    
    // 验证密码强度
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return { success: false, message: passwordCheck.message };
    }
    
    // 验证密码匹配
    if (password !== confirmPassword) {
      return { success: false, message: '两次输入的密码不一致' };
    }
    
    const result = await AuthService.register(email, password, username);
    if (result.success) {
      const loginResult = await AuthService.login(email, password);
      if (loginResult.success && loginResult.user) {
        set({ user: loginResult.user, isAuthenticated: true, isOnboardingComplete: false });
        secureStorage.setItem('user', loginResult.user);
      }
    }
    return result;
  },
  logout: () => {
    AuthService.logout();
    secureStorage.removeItem('user');
    set({ user: null, isAuthenticated: false, isOnboardingComplete: false });
  },
  deleteAccount: async (password) => {
    const currentUser = useAppStore.getState().user;
    if (!currentUser) {
      return { success: false, message: '用户未登录' };
    }
    const result = await AuthService.deleteAccount(currentUser.email, password);
    if (result.success) {
      useAppStore.getState().logout();
    }
    return result;
  },
  updateUserInfo: (updates) => set((state) => ({
    user: state.user ? { ...state.user, ...updates } : null,
  })),
  completeOnboarding: () => set({ isOnboardingComplete: true }),
  setCurrentPet: (pet) => set({ currentPet: pet }),
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
}));