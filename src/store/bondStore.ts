// ============================================
// PawSync Pro - bondStore.ts (真实数据版)
// 使用 IndexedDB 替代 mock 数据
// ============================================

import { create } from 'zustand';
import { badgeDB, achievementDB, bondActivityDB } from '../lib/db';

export interface BondMetrics {
  understanding: number;
  companionship: number;
  care: number;
  growth: number;
  overall: number;
}

export interface DailyActivity {
  id: string;
  petId: string;
  type: 'translation' | 'training' | 'interaction' | 'health';
  description: string;
  points: number;
  timestamp: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'translation' | 'training' | 'health' | 'social';
  isUnlocked: boolean;
  unlockedAt?: Date;
  requirement: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  type: 'milestone' | 'streak' | 'collection';
  progress: number;
  target: number;
  isCompleted: boolean;
  completedAt?: Date;
  rewardPoints: number;
}

interface BondStore {
  metrics: BondMetrics;
  dailyActivities: DailyActivity[];
  badges: Badge[];
  achievements: Achievement[];
  totalPoints: number;
  streakDays: number;
  lastActiveDate: Date;
  
  // Actions
  loadBondData: () => Promise<void>;
  updateMetrics: (metrics: Partial<BondMetrics>) => void;
  addDailyActivity: (activity: Omit<DailyActivity, 'id' | 'timestamp'>) => Promise<void>;
  unlockBadge: (badgeId: string) => Promise<void>;
  updateAchievement: (achievementId: string, progress: number) => Promise<void>;
  checkStreak: () => void;
  calculateMetrics: () => void;
}

const calculateOverall = (metrics: Partial<BondMetrics>): number => {
  const values = [
    metrics.understanding ?? 0,
    metrics.companionship ?? 0,
    metrics.care ?? 0,
    metrics.growth ?? 0,
  ].filter(v => v > 0);
  
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
};

export const useBondStore = create<BondStore>((set, get) => ({
  metrics: {
    understanding: 0,
    companionship: 0,
    care: 0,
    growth: 0,
    overall: 0,
  },
  dailyActivities: [],
  badges: [],
  achievements: [],
  totalPoints: 0,
  streakDays: 0,
  lastActiveDate: new Date(),

  loadBondData: async () => {
    try {
      // 加载徽章
      const badges = await badgeDB.getAll();
      set({ badges: badges as Badge[] });
      
      // 加载成就
      const achievements = await achievementDB.getAll();
      set({ achievements: achievements as Achievement[] });
      
      // 计算总积分
      const totalPoints = (achievements as Achievement[]).reduce(
        (sum, a) => sum + (a.isCompleted ? a.rewardPoints : 0), 
        0
      );
      set({ totalPoints });
      
      // 检查连续天数
      get().checkStreak();
      
      // 计算亲密度指标
      get().calculateMetrics();
    } catch (error) {
      console.error('加载情感数据失败:', error);
    }
  },

  calculateMetrics: () => {
    const { dailyActivities, achievements } = get();
    
    // 基于活动计算各项指标
    const translationCount = dailyActivities.filter(a => a.type === 'translation').length;
    const trainingCount = dailyActivities.filter(a => a.type === 'training').length;
    const healthCount = dailyActivities.filter(a => a.type === 'health').length;
    const interactionCount = dailyActivities.filter(a => a.type === 'interaction').length;
    
    // 理解度：基于翻译次数
    const understanding = Math.min(100, 20 + translationCount * 2);
    
    // 陪伴度：基于互动次数
    const companionship = Math.min(100, 20 + interactionCount * 3);
    
    // 照顾度：基于健康记录
    const care = Math.min(100, 30 + healthCount * 4);
    
    // 成长度：基于训练和成就
    const completedAchievements = achievements.filter(a => a.isCompleted).length;
    const growth = Math.min(100, 10 + trainingCount * 3 + completedAchievements * 10);
    
    const overall = calculateOverall({ understanding, companionship, care, growth });
    
    set({
      metrics: {
        understanding,
        companionship,
        care,
        growth,
        overall,
      },
    });
  },

  updateMetrics: (metrics) => set((state) => {
    const newMetrics = { ...state.metrics, ...metrics };
    newMetrics.overall = calculateOverall(newMetrics);
    return { metrics: newMetrics };
  }),

  addDailyActivity: async (activity) => {
    const newActivity: DailyActivity = {
      ...activity,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    
    await bondActivityDB.create(newActivity);
    
    set((state) => ({
      dailyActivities: [newActivity, ...state.dailyActivities],
      totalPoints: state.totalPoints + activity.points,
    }));
    
    // 重新计算指标
    get().calculateMetrics();
  },

  unlockBadge: async (badgeId) => {
    const { badges } = get();
    const badge = badges.find(b => b.id === badgeId);
    
    if (!badge || badge.isUnlocked) return;
    
    const updatedBadge = { ...badge, isUnlocked: true, unlockedAt: new Date() };
    await badgeDB.update(badgeId, updatedBadge);
    
    set((state) => ({
      badges: state.badges.map(b => b.id === badgeId ? updatedBadge : b),
    }));
  },

  updateAchievement: async (achievementId, progress) => {
    const { achievements, totalPoints } = get();
    const achievement = achievements.find(a => a.id === achievementId);
    
    if (!achievement || achievement.isCompleted) return;
    
    const newProgress = Math.min(progress, achievement.target);
    const isCompleted = newProgress >= achievement.target;
    
    const updatedAchievement = {
      ...achievement,
      progress: newProgress,
      isCompleted,
      completedAt: isCompleted ? new Date() : undefined,
    };
    
    await achievementDB.update(achievementId, updatedAchievement);
    
    set((state) => ({
      achievements: state.achievements.map(a =>
        a.id === achievementId ? updatedAchievement : a
      ),
      totalPoints: isCompleted ? totalPoints + achievement.rewardPoints : totalPoints,
    }));
  },

  checkStreak: () => {
    const { streakDays, lastActiveDate } = get();
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastActive = new Date(lastActiveDate);
    const isYesterday = lastActive.toDateString() === yesterday.toDateString();
    const isToday = lastActive.toDateString() === today.toDateString();
    
    if (isToday) return;
    
    if (isYesterday) {
      set({ streakDays: streakDays + 1, lastActiveDate: today });
    } else {
      set({ streakDays: 1, lastActiveDate: today });
    }
  },
}));
