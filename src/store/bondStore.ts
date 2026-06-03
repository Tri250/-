import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DailyActivity {
  id: string;
  petId: string;
  name: string;
  duration: number;
  notes?: string;
  date: string;
  timestamp?: number;
}

export interface Milestone {
  id: string;
  petId: string;
  title: string;
  description: string;
  emoji?: string;
  date: string;
  createdAt: string;
}

export interface Memory {
  id: string;
  petId: string;
  title: string;
  description?: string;
  mediaUrl?: string;
  mediaType?: 'photo' | 'video';
  date: string;
  tags?: string[];
  createdAt: string;
}

interface BondState {
  memories: Memory[];
  milestones: Milestone[];
  dailyActivities: DailyActivity[];
  trainingRecords: any[];
  
  addMemory: (memory: Omit<Memory, 'id' | 'createdAt'>) => void;
  updateMemory: (id: string, updates: Partial<Memory>) => void;
  deleteMemory: (id: string) => void;
  
  addMilestone: (milestone: Omit<Milestone, 'id' | 'createdAt'>) => void;
  updateMilestone: (id: string, updates: Partial<Milestone>) => void;
  deleteMilestone: (id: string) => void;
  
  addDailyActivity: (activity: Omit<DailyActivity, 'id' | 'timestamp'>) => void;
  getActivitiesByPet: (petId: string) => DailyActivity[];
  
  getMemoriesByPet: (petId: string) => Memory[];
  getMilestonesByPet: (petId: string) => Milestone[];
}

export const useBondStore = create<BondState>()(
  persist(
    (set, get) => ({
      memories: [],
      milestones: [],
      dailyActivities: [],
      trainingRecords: [],

      addMemory: (memory) =>
        set((state) => ({
          memories: [
            {
              ...memory,
              id: `memory-${Date.now()}`,
              createdAt: new Date().toISOString(),
            },
            ...state.memories,
          ],
        })),

      updateMemory: (id, updates) =>
        set((state) => ({
          memories: state.memories.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),

      deleteMemory: (id) =>
        set((state) => ({
          memories: state.memories.filter((m) => m.id !== id),
        })),

      addMilestone: (milestone) =>
        set((state) => ({
          milestones: [
            {
              ...milestone,
              id: `milestone-${Date.now()}`,
              createdAt: new Date().toISOString(),
            },
            ...state.milestones,
          ],
        })),

      updateMilestone: (id, updates) =>
        set((state) => ({
          milestones: state.milestones.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),

      deleteMilestone: (id) =>
        set((state) => ({
          milestones: state.milestones.filter((m) => m.id !== id),
        })),

      addDailyActivity: (activity) =>
        set((state) => ({
          dailyActivities: [
            {
              ...activity,
              id: `activity-${Date.now()}`,
              timestamp: Date.now(),
            },
            ...state.dailyActivities,
          ],
        })),

      getActivitiesByPet: (petId) =>
        get().dailyActivities.filter((a) => a.petId === petId),

      getMemoriesByPet: (petId) =>
        get().memories.filter((m) => m.petId === petId),

      getMilestonesByPet: (petId) =>
        get().milestones.filter((m) => m.petId === petId),
    }),
    {
      name: 'bond-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
