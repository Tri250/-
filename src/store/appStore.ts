import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  sanitizeString, 
  safeNumber, 
  generateSafeId, 
  validatePet, 
  validateAnalysis,
  safeJsonParse,
  safeJsonStringify 
} from '../lib/security';

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
  clearData: () => void;
  getPetById: (id: string) => Pet | undefined;
}

const STORAGE_KEY = 'pawsync-storage-v1';
const MAX_ANALYSES = 100;
const MAX_HEALTH_ALERTS = 50;

const DEFAULT_PET: Pet = {
  id: 'default_pet_1',
  name: '小橘',
  breed: '橘猫',
  age: 2,
  avatarUrl: '',
};

const DEFAULT_HEALTH_ALERT: HealthAlert = {
  id: 'default_alert_1',
  petId: 'default_pet_1',
  type: 'abnormal',
  severity: 'low',
  message: '轻微活动异常，建议观察',
  timestamp: new Date(Date.now() - 3600000).toISOString(),
};

// 安全存储适配器
const safeStorage = createJSONStorage(() => {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  return {
    getItem: (key: string) => {
      try {
        const item = localStorage.getItem(key);
        return item || null;
      } catch {
        return null;
      }
    },
    setItem: (key: string, value: string) => {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error('Storage error:', error);
      }
    },
    removeItem: (key: string) => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Storage error:', error);
      }
    },
  };
});

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      pets: [DEFAULT_PET],
      currentPet: DEFAULT_PET,
      analyses: [],
      healthAlerts: [DEFAULT_HEALTH_ALERT],
      currentEmotion: 'happy',
      healthScore: 92,
      isRecording: false,

      setCurrentPet: (pet) => {
        if (validatePet(pet)) {
          const safePet: Pet = {
            ...pet,
            id: sanitizeString(pet.id),
            name: sanitizeString(pet.name),
            breed: sanitizeString(pet.breed),
            age: safeNumber(pet.age, 0),
            avatarUrl: sanitizeString(pet.avatarUrl),
          };
          set({ currentPet: safePet });
        }
      },

      addAnalysis: (analysis) => {
        if (validateAnalysis(analysis)) {
          set((state) => {
            const newAnalysis: Analysis = {
              ...analysis,
              id: generateSafeId(),
              petId: sanitizeString(analysis.petId),
              type: analysis.type,
              result: {
                ...analysis.result,
                translation: sanitizeString(analysis.result.translation),
                confidence: Math.min(100, Math.max(0, safeNumber(analysis.result.confidence, 0))),
              },
              createdAt: new Date().toISOString(),
            };
            // 限制历史记录数量防止内存溢出
            const newAnalyses = [newAnalysis, ...state.analyses].slice(0, MAX_ANALYSES);
            return { analyses: newAnalyses };
          });
        }
      },

      addHealthAlert: (alert) => {
        set((state) => {
          const newAlert: HealthAlert = {
            ...alert,
            id: generateSafeId(),
            petId: sanitizeString(alert.petId),
            message: sanitizeString(alert.message),
            timestamp: new Date().toISOString(),
          };
          // 限制健康警报数量
          const newAlerts = [newAlert, ...state.healthAlerts].slice(0, MAX_HEALTH_ALERTS);
          return { healthAlerts: newAlerts };
        });
      },

      setIsRecording: (isRecording) => set({ isRecording }),
      
      setCurrentEmotion: (emotion) => {
        const validEmotions = ['happy', 'anxious', 'angry', 'needs', 'neutral'] as const;
        const safeEmotion = validEmotions.includes(emotion) ? emotion : 'neutral';
        set({ currentEmotion: safeEmotion });
      },
      
      setHealthScore: (score) => {
        const safeScore = Math.min(100, Math.max(0, safeNumber(score, 92)));
        set({ healthScore: safeScore });
      },

      clearData: () =>
        set({
          analyses: [],
          healthAlerts: [DEFAULT_HEALTH_ALERT],
        }),

      getPetById: (id: string) => {
        const safeId = sanitizeString(id);
        return get().pets.find(pet => pet.id === safeId);
      },
    }),
    {
      name: STORAGE_KEY,
      storage: safeStorage,
      partialize: (state) => ({
        pets: state.pets,
        currentPet: state.currentPet,
        analyses: state.analyses,
        healthAlerts: state.healthAlerts,
        healthScore: state.healthScore,
      }),
      // 数据迁移和验证
      onRehydrateStorage: () => (state) => {
        if (state) {
          // 验证和修复数据
          if (!Array.isArray(state.pets)) {
            state.pets = [DEFAULT_PET];
          }
          if (!state.currentPet || !validatePet(state.currentPet)) {
            state.currentPet = DEFAULT_PET;
          }
          if (!Array.isArray(state.analyses)) {
            state.analyses = [];
          }
          if (!Array.isArray(state.healthAlerts)) {
            state.healthAlerts = [DEFAULT_HEALTH_ALERT];
          }
        }
      },
    }
  )
);

