import { create } from 'zustand';

export interface Pet {
  id: string;
  name: string;
  breed: string;
  age: number;
  avatarUrl: string;
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

interface AppState {
  pets: Pet[];
  currentPet: Pet | null;
  analyses: Analysis[];
  healthAlerts: HealthAlert[];
  currentEmotion: 'happy' | 'anxious' | 'angry' | 'needs' | 'neutral';
  healthScore: number;
  isRecording: boolean;
  setCurrentPet: (pet: Pet) => void;
  addAnalysis: (analysis: Omit<Analysis, 'id' | 'createdAt'>) => void;
  addHealthAlert: (alert: Omit<HealthAlert, 'id'>) => void;
  setIsRecording: (isRecording: boolean) => void;
  setCurrentEmotion: (emotion: 'happy' | 'anxious' | 'angry' | 'needs' | 'neutral') => void;
  setHealthScore: (score: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  pets: [
    {
      id: '1',
      name: '小橘',
      breed: '橘猫',
      age: 2,
      avatarUrl: '',
    },
  ],
  currentPet: {
    id: '1',
    name: '小橘',
    breed: '橘猫',
    age: 2,
    avatarUrl: '',
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
  setCurrentPet: (pet) => set({ currentPet: pet }),
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
