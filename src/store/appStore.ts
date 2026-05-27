import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  isPremium: boolean;
  premiumExpires: string;
  createdAt: string;
}

export interface Pet {
  id: string;
  name: string;
  breed: string;
  age: number;
  avatarUrl: string;
  type: 'cat' | 'dog' | 'other';
  healthScore: number;
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
  isResolved: boolean;
}

export interface CareTip {
  id: string;
  category: 'feeding' | 'exercise' | 'grooming' | 'health' | 'behavior';
  title: string;
  content: string;
  petType?: 'cat' | 'dog' | 'all';
  priority: 'high' | 'medium' | 'low';
}

export interface VoiceMemory {
  id: string;
  petId: string;
  emotion: string;
  confidence: number;
  transcription: string;
  createdAt: string;
}

export interface BehaviorEvent {
  id: string;
  petId: string;
  behaviorType: string;
  confidence: number;
  timestamp: string;
}

export interface DailyJournal {
  id: string;
  petId: string;
  date: string;
  summary: string;
  healthScore: number;
  activityScore: number;
  emotionScore: number;
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
  voiceMemories: VoiceMemory[];
  behaviorEvents: BehaviorEvent[];
  dailyJournals: DailyJournal[];
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, username: string) => Promise<boolean>;
  logout: () => void;
  completeOnboarding: () => void;
  setCurrentPet: (pet: Pet) => void;
  addPet: (pet: Omit<Pet, 'id'>) => void;
  addAnalysis: (analysis: Omit<Analysis, 'id' | 'createdAt'>) => void;
  addHealthAlert: (alert: Omit<HealthAlert, 'id'>) => void;
  resolveAlert: (alertId: string) => void;
  setIsRecording: (isRecording: boolean) => void;
  setCurrentEmotion: (emotion: 'happy' | 'anxious' | 'angry' | 'needs' | 'neutral') => void;
  setHealthScore: (score: number) => void;
  addVoiceMemory: (memory: Omit<VoiceMemory, 'id'>) => void;
  addBehaviorEvent: (event: Omit<BehaviorEvent, 'id'>) => void;
  addDailyJournal: (journal: Omit<DailyJournal, 'id'>) => void;
  setVoiceMemories: (memories: VoiceMemory[]) => void;
  setBehaviorEvents: (events: BehaviorEvent[]) => void;
  setDailyJournals: (journals: DailyJournal[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  isAuthenticated: true,
  isOnboardingComplete: true,
  pets: [
    {
      id: '1',
      name: '小橘',
      breed: '橘猫',
      age: 2,
      avatarUrl: '',
      type: 'cat',
      healthScore: 92,
    },
    {
      id: '2',
      name: '旺财',
      breed: '金毛',
      age: 3,
      avatarUrl: '',
      type: 'dog',
      healthScore: 88,
    },
  ],
  currentPet: {
    id: '1',
    name: '小橘',
    breed: '橘猫',
    age: 2,
    avatarUrl: '',
    type: 'cat',
    healthScore: 92,
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
      isResolved: false,
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
  voiceMemories: [],
  behaviorEvents: [],
  dailyJournals: [],
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  login: async (email, password) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const mockUser: User = {
      id: '1',
      email,
      username: email.split('@')[0],
      isPremium: false,
      premiumExpires: '',
      createdAt: new Date().toISOString(),
    };
    set({ user: mockUser, isAuthenticated: true });
    return true;
  },
  register: async (email, password, username) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const mockUser: User = {
      id: Date.now().toString(),
      email,
      username,
      isPremium: false,
      premiumExpires: '',
      createdAt: new Date().toISOString(),
    };
    set({ user: mockUser, isAuthenticated: true, isOnboardingComplete: false });
    return true;
  },
  logout: () => set({ user: null, isAuthenticated: false, isOnboardingComplete: false }),
  completeOnboarding: () => set({ isOnboardingComplete: true }),
  setCurrentPet: (pet) => set({ currentPet: pet, healthScore: pet.healthScore }),
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
  resolveAlert: (alertId) => set((state) => ({
    healthAlerts: state.healthAlerts.map(alert => 
      alert.id === alertId ? { ...alert, isResolved: true } : alert
    ),
  })),
  setIsRecording: (isRecording) => set({ isRecording }),
  setCurrentEmotion: (emotion) => set({ currentEmotion: emotion }),
  setHealthScore: (score) => set({ healthScore: score }),
  addVoiceMemory: (memory) => set((state) => ({
    voiceMemories: [...state.voiceMemories, {
      ...memory,
      id: Date.now().toString(),
    }],
  })),
  addBehaviorEvent: (event) => set((state) => ({
    behaviorEvents: [...state.behaviorEvents, {
      ...event,
      id: Date.now().toString(),
    }],
  })),
  addDailyJournal: (journal) => set((state) => ({
    dailyJournals: [...state.dailyJournals, {
      ...journal,
      id: Date.now().toString(),
    }],
  })),
  setVoiceMemories: (memories) => set({ voiceMemories: memories }),
  setBehaviorEvents: (events) => set({ behaviorEvents: events }),
  setDailyJournals: (journals) => set({ dailyJournals: journals }),
}));
