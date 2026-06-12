/**
 * User Profile Store - 用户档案数据存储
 *
 * 管理用户个人信息、账户设置、会员状态等功能
 * 支持 Capacitor 原生存储
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

// 用户信息
export interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  phone?: string;
  gender?: 'male' | 'female' | 'other';
  birthday?: string;
  location?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

// 会员状态
export interface MembershipStatus {
  level: 'free' | 'basic' | 'premium' | 'vip';
  expireDate?: string;
  features: string[];
}

// 用户统计
export interface UserStats {
  totalPets: number;
  totalRecords: number;
  totalDays: number;
  achievements: number;
  points: number;
}

// Store 接口
interface UserProfileState {
  profile: UserProfile | null;
  membership: MembershipStatus;
  stats: UserStats;
  isLoggedIn: boolean;
  
  // 用户操作
  login: (profile: UserProfile) => void;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setAvatar: (avatar: string) => void;
  
  // 会员操作
  upgradeMembership: (level: MembershipStatus['level']) => void;
  checkMembership: () => boolean;
  
  // 统计更新
  updateStats: (stats: Partial<UserStats>) => void;
  addPoints: (points: number) => void;
  
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

const defaultMembership: MembershipStatus = {
  level: 'free',
  features: ['basic_features', 'limited_storage'],
};

const defaultStats: UserStats = {
  totalPets: 1,
  totalRecords: 50,
  totalDays: 30,
  achievements: 5,
  points: 1000,
};

const mockProfile: UserProfile = {
  id: 'user-1',
  name: '宠物主人',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
  email: 'user@pawsync.com',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: new Date().toISOString(),
};

export const useUserProfileStore = create<UserProfileState>()(
  persist(
    (set, get) => ({
      profile: null,
      membership: defaultMembership,
      stats: defaultStats,
      isLoggedIn: false,

      login: (profile) => {
        set({
          profile,
          isLoggedIn: true,
        });
      },

      logout: () => {
        set({
          profile: null,
          isLoggedIn: false,
          membership: defaultMembership,
        });
      },

      updateProfile: (updates) => {
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, ...updates, updatedAt: new Date().toISOString() }
            : null,
        }));
      },

      setAvatar: (avatar) => {
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, avatar, updatedAt: new Date().toISOString() }
            : null,
        }));
      },

      upgradeMembership: (level) => {
        const featuresByLevel: Record<MembershipStatus['level'], string[]> = {
          free: ['basic_features', 'limited_storage'],
          basic: ['basic_features', 'standard_storage', 'health_tracking'],
          premium: ['all_features', 'unlimited_storage', 'ai_consultation', 'priority_support'],
          vip: ['all_features', 'unlimited_storage', 'ai_consultation', 'priority_support', 'exclusive_content'],
        };
        
        set({
          membership: {
            level,
            features: featuresByLevel[level],
            expireDate: level !== 'free' 
              ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
              : undefined,
          },
        });
      },

      checkMembership: () => {
        const membership = get().membership;
        if (membership.level === 'free') return true;
        
        if (membership.expireDate) {
          return new Date(membership.expireDate) > new Date();
        }
        return true;
      },

      updateStats: (stats) => {
        set((state) => ({
          stats: { ...state.stats, ...stats },
        }));
      },

      addPoints: (points) => {
        set((state) => ({
          stats: { ...state.stats, points: state.stats.points + points },
        }));
      },

      initialize: async () => {
        // 模拟已登录用户
        if (!get().profile) {
          set({
            profile: mockProfile,
            isLoggedIn: true,
          });
        }
      },
    }),
    {
      name: 'pawsync-user-profile-store',
      storage: createJSONStorage(() => capacitorStorage),
      partialize: (state) => ({
        profile: state.profile,
        membership: state.membership,
        stats: state.stats,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
);