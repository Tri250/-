import { create } from 'zustand';
import { BondMetrics, DailyActivity, Badge, Achievement, BondStore } from '../types/bond';

const mockBadges: Badge[] = [
  {
    id: '1',
    name: '初次翻译',
    description: '完成第一次宠物情绪翻译',
    icon: '🎤',
    category: 'translation',
    isUnlocked: true,
    unlockedAt: new Date(Date.now() - 86400000 * 5),
    requirement: '完成1次翻译'
  },
  {
    id: '2',
    name: '翻译达人',
    description: '完成30次情绪翻译',
    icon: '🌟',
    category: 'translation',
    isUnlocked: false,
    requirement: '完成30次翻译'
  },
  {
    id: '3',
    name: '训练新手',
    description: '开始第一个训练课程',
    icon: '🏆',
    category: 'training',
    isUnlocked: true,
    unlockedAt: new Date(Date.now() - 86400000 * 3),
    requirement: '开始1门课程'
  },
  {
    id: '4',
    name: '健康守护者',
    description: '连续7天进行健康检查',
    icon: '❤️',
    category: 'health',
    isUnlocked: false,
    requirement: '连续7天健康打卡'
  },
  {
    id: '5',
    name: '七天连续',
    description: '连续使用应用7天',
    icon: '🔥',
    category: 'social',
    isUnlocked: true,
    unlockedAt: new Date(Date.now() - 86400000 * 2),
    requirement: '连续使用7天'
  }
];

const mockAchievements: Achievement[] = [
  {
    id: '1',
    name: '翻译百次',
    description: '累计完成100次情绪翻译',
    type: 'milestone',
    progress: 45,
    target: 100,
    isCompleted: false,
    rewardPoints: 500
  },
  {
    id: '2',
    name: '训练达人',
    description: '累计训练时长达到10小时',
    type: 'milestone',
    progress: 2,
    target: 10,
    isCompleted: false,
    rewardPoints: 300
  },
  {
    id: '3',
    name: '三十天连续',
    description: '连续使用应用30天',
    type: 'streak',
    progress: 5,
    target: 30,
    isCompleted: false,
    rewardPoints: 1000
  }
];

const initialMetrics: BondMetrics = {
  understanding: 72,
  companionship: 68,
  care: 85,
  growth: 55,
  overall: 70
};

export const useBondStore = create<BondStore>((set, get) => ({
  metrics: initialMetrics,
  dailyActivities: [],
  badges: mockBadges,
  achievements: mockAchievements,
  totalPoints: 850,
  streakDays: 5,
  lastActiveDate: new Date(),

  updateMetrics: (metrics) => set((state) => {
    const newMetrics = { ...state.metrics, ...metrics };
    newMetrics.overall = Math.round(
      (newMetrics.understanding + newMetrics.companionship + newMetrics.care + newMetrics.growth) / 4
    );
    return { metrics: newMetrics };
  }),

  addDailyActivity: (activity) => set((state) => ({
    dailyActivities: [{ ...activity, id: Date.now().toString(), timestamp: new Date().toISOString() }, ...state.dailyActivities],
    totalPoints: state.totalPoints + activity.points
  })),

  unlockBadge: (badgeId) => set((state) => ({
    badges: state.badges.map(badge => 
      badge.id === badgeId && !badge.isUnlocked
        ? { ...badge, isUnlocked: true, unlockedAt: new Date() }
        : badge
    )
  })),

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
              completedAt: isCompleted && !a.isCompleted ? new Date() : a.completedAt
            }
          : a
      ),
      totalPoints: isCompleted && !achievement.isCompleted 
        ? state.totalPoints + achievement.rewardPoints 
        : state.totalPoints
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
  }
}));
