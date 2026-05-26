export interface BondMetrics {
  understanding: number;
  companionship: number;
  care: number;
  growth: number;
  overall: number;
}

export interface DailyActivity {
  id: string;
  date: Date;
  type: 'translation' | 'training' | 'health_check' | 'play' | 'feeding';
  description: string;
  points: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'translation' | 'training' | 'health' | 'insurance' | 'medical' | 'social';
  isUnlocked: boolean;
  unlockedAt?: Date;
  requirement: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  type: 'streak' | 'milestone' | 'completion';
  progress: number;
  target: number;
  isCompleted: boolean;
  completedAt?: Date;
  rewardPoints: number;
}

export interface BondStore {
  metrics: BondMetrics;
  dailyActivities: DailyActivity[];
  badges: Badge[];
  achievements: Achievement[];
  totalPoints: number;
  streakDays: number;
  lastActiveDate: Date;
  
  updateMetrics: (metrics: Partial<BondMetrics>) => void;
  addDailyActivity: (activity: Omit<DailyActivity, 'id'>) => void;
  unlockBadge: (badgeId: string) => void;
  updateAchievement: (achievementId: string, progress: number) => void;
  checkStreak: () => void;
}
