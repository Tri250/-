import { create } from 'zustand';
import { BondMetrics, Badge, Achievement, BondStore } from '../types/bond';
import { api } from '../lib/api';

const initialMetrics: BondMetrics = {
  understanding: 0,
  companionship: 0,
  care: 0,
  growth: 0,
  overall: 0,
};

export const useBondStore = create<BondStore>((set, get) => ({
  metrics: initialMetrics,
  dailyActivities: [],
  badges: [],
  achievements: [],
  totalPoints: 0,
  streakDays: 0,
  lastActiveDate: new Date(),
  loading: false,
  error: null,

  fetchMetrics: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.get<{ metrics: BondMetrics }>('/bond/metrics');
      set({ metrics: data.metrics, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取情感指标失败', loading: false });
    }
  },

  fetchBadges: async () => {
    try {
      const data = await api.get<{ badges: Badge[] }>('/bond/badges');
      set({ badges: data.badges });
    } catch {
      // silent fail
    }
  },

  fetchAchievements: async () => {
    try {
      const data = await api.get<{ achievements: Achievement[] }>('/bond/achievements');
      set({ achievements: data.achievements });
    } catch {
      // silent fail
    }
  },

  fetchEmotionAnalyses: async () => {
    set({ loading: true, error: null });
    try {
      await api.get<{ analyses: unknown[] }>('/emotion/analyses');
      set({ loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取情感分析失败', loading: false });
    }
  },

  updateMetrics: (metrics) => set((state) => {
    const newMetrics = { ...state.metrics, ...metrics };
    newMetrics.overall = Math.round(
      (newMetrics.understanding + newMetrics.companionship + newMetrics.care + newMetrics.growth) / 4
    );
    return { metrics: newMetrics };
  }),

  addDailyActivity: async (activity) => {
    set((state) => ({
      dailyActivities: [{ ...activity, id: Date.now().toString(), timestamp: new Date().toISOString() }, ...state.dailyActivities],
      totalPoints: state.totalPoints + activity.points,
    }));
    try {
      await api.post('/bond/activities', activity);
    } catch {
      // silent fail
    }
  },

  unlockBadge: async (badgeId) => {
    set((state) => ({
      badges: state.badges.map(badge =>
        badge.id === badgeId && !badge.isUnlocked
          ? { ...badge, isUnlocked: true, unlockedAt: new Date() }
          : badge
      ),
    }));
    try {
      await api.post(`/bond/badges/${badgeId}/unlock`);
    } catch {
      // silent fail
    }
  },

  updateAchievement: (achievementId, progress) => set((state) => {
    const achievement = state.achievements.find(a => a.id === achievementId);
    if (!achievement) return state;

    const newProgress = Math.min(progress, achievement.target);
    const isCompleted = newProgress >= achievement.target;

    return {
      achievements: state.achievements.map(a =>
        a.id === achievementId
          ? {
              ...a,
              progress: newProgress,
              isCompleted,
              completedAt: isCompleted && !a.isCompleted ? new Date() : a.completedAt,
            }
          : a
      ),
      totalPoints: isCompleted && !achievement.isCompleted
        ? state.totalPoints + achievement.rewardPoints
        : state.totalPoints,
    };
  }),

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