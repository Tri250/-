
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Pet {
  id: string;
  name: string;
  avatar?: string;
  type: 'DOG' | 'CAT' | 'OTHER';
  breed: string;
  gender: 'MALE' | 'FEMALE' | 'UNKNOWN';
  birthday?: string;
  weight?: number;
  color?: string;
  characteristics?: string;
  healthStatus: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'CONCERN';
}

interface Reminder {
  id: string;
  petId?: string;
  type: 'VACCINE' | 'CHECKUP' | 'MEDICATION' | 'FEEDING' | 'EXERCISE' | 'GROOMING' | 'OTHER';
  title: string;
  notes?: string;
  date: string;
  time?: string;
  repeat: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  isCompleted: boolean;
}

interface AppStore {
  isAuthenticated: boolean;
  isOnboardingComplete: boolean;
  currentPet: Pet | null;
  pets: Pet[];
  bondScore: number;
  upcomingReminders: Reminder[];
  login: (email: string, password: string) => void;
  register: (email: string, password: string, name: string) => void;
  logout: () => void;
  completeOnboarding: () => void;
  setCurrentPet: (pet: Pet) => void;
  addPet: (pet: Omit<Pet, 'id'>) => void;
  updatePet: (id: string, data: Partial<Pet>) => void;
  deletePet: (id: string) => void;
  updateBondScore: (score: number) => void;
  addReminder: (reminder: Omit<Reminder, 'id'>) => void;
  completeReminder: (id: string) => void;
  deleteReminder: (id: string) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      isAuthenticated: true,
      isOnboardingComplete: true,
      currentPet: null,
      pets: [
        {
          id: 'pet-1',
          name: '毛球',
          type: 'CAT',
          breed: '英国短毛猫',
          gender: 'FEMALE',
          birthday: '2022-05-20',
          weight: 4.5,
          color: '银渐层',
          characteristics: '粘人、可爱',
          healthStatus: 'EXCELLENT',
        },
        {
          id: 'pet-2',
          name: '旺财',
          type: 'DOG',
          breed: '金毛犬',
          gender: 'MALE',
          birthday: '2021-10-15',
          weight: 25,
          color: '金色',
          characteristics: '活泼、聪明',
          healthStatus: 'GOOD',
        },
      ],
      bondScore: 85,
      upcomingReminders: [
        {
          id: 'reminder-1',
          petId: 'pet-1',
          type: 'VACCINE',
          title: '猫三联疫苗',
          notes: '记得带疫苗本',
          date: '2024-02-15',
          time: '10:00',
          repeat: 'YEARLY',
          isCompleted: false,
        },
        {
          id: 'reminder-2',
          petId: 'pet-1',
          type: 'CHECKUP',
          title: '年度体检',
          date: '2024-03-01',
          repeat: 'YEARLY',
          isCompleted: false,
        },
      ],
      login: (email, password) => {
        set({ isAuthenticated: true });
      },
      register: (email, password, name) => {
        set({ isAuthenticated: true });
      },
      logout: () => {
        set({ isAuthenticated: false, isOnboardingComplete: false });
      },
      completeOnboarding: () => {
        set({ isOnboardingComplete: true });
      },
      setCurrentPet: (pet) => set({ currentPet: pet }),
      addPet: (pet) =>
        set((state) => ({
          pets: [...state.pets, { ...pet, id: `pet-${Date.now()}` }],
        })),
      updatePet: (id, data) =>
        set((state) => ({
          pets: state.pets.map((pet) =>
            pet.id === id ? { ...pet, ...data } : pet
          ),
          currentPet: state.currentPet?.id === id ? { ...state.currentPet, ...data } : state.currentPet,
        })),
      deletePet: (id) =>
        set((state) => ({
          pets: state.pets.filter((pet) => pet.id !== id),
          currentPet: state.currentPet?.id === id ? null : state.currentPet,
        })),
      updateBondScore: (score) => set({ bondScore: Math.min(100, Math.max(0, score)) }),
      addReminder: (reminder) =>
        set((state) => ({
          upcomingReminders: [...state.upcomingReminders, { ...reminder, id: `reminder-${Date.now()}` }],
        })),
      completeReminder: (id) =>
        set((state) => ({
          upcomingReminders: state.upcomingReminders.map((r) =>
            r.id === id ? { ...r, isCompleted: true } : r
          ),
        })),
      deleteReminder: (id) =>
        set((state) => ({
          upcomingReminders: state.upcomingReminders.filter((r) => r.id !== id),
        })),
    }),
    {
      name: 'pawsync-storage',
    }
  )
);
