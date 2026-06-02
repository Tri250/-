import { create } from 'zustand';
import { Pet, PetVaccine, PetCheckup, PetGrowth } from '../types/pet';

interface PetStore {
  pets: Pet[];
  currentPetId: string | null;
  vaccines: PetVaccine[];
  checkups: PetCheckup[];
  growthRecords: PetGrowth[];
  
  // Actions
  addPet: (pet: Omit<Pet, 'id' | 'createdAt'>) => void;
  updatePet: (id: string, updates: Partial<Pet>) => void;
  deletePet: (id: string) => void;
  setCurrentPet: (id: string) => void;
  
  addVaccine: (vaccine: Omit<PetVaccine, 'id'>) => void;
  addCheckup: (checkup: Omit<PetCheckup, 'id'>) => void;
  addGrowthRecord: (record: Omit<PetGrowth, 'id'>) => void;
  
  getCurrentPet: () => Pet | null;
  getPetVaccines: (petId: string) => PetVaccine[];
  getPetCheckups: (petId: string) => PetCheckup[];
  getPetGrowth: (petId: string) => PetGrowth[];
}

// 示例数据
const INITIAL_PETS: Pet[] = [
  {
    id: '1',
    name: '毛球',
    avatar: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200',
    type: 'cat',
    breed: '英国短毛猫',
    gender: 'male',
    birthday: '2022-05-15',
    weight: 5.2,
    color: '橘白',
    createdAt: '2026-01-01',
    healthStatus: 'good',
    characteristics: '黏人、喜欢晒太阳、怕生人',
  },
  {
    id: '2',
    name: '旺财',
    avatar: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200',
    type: 'dog',
    breed: '柯基犬',
    gender: 'male',
    birthday: '2023-01-20',
    weight: 12.5,
    color: '黄白',
    createdAt: '2026-01-01',
    healthStatus: 'excellent',
    characteristics: '活泼、精力充沛、喜欢捡球',
  },
];

export const usePetStore = create<PetStore>((set, get) => ({
  pets: INITIAL_PETS,
  currentPetId: '1',
  vaccines: [],
  checkups: [],
  growthRecords: [],

  addPet: (pet) => {
    const newPet: Pet = {
      ...pet,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      pets: [...state.pets, newPet],
      currentPetId: newPet.id,
    }));
  },

  updatePet: (id, updates) => {
    set((state) => ({
      pets: state.pets.map((pet) =>
        pet.id === id ? { ...pet, ...updates } : pet
      ),
    }));
  },

  deletePet: (id) => {
    set((state) => ({
      pets: state.pets.filter((pet) => pet.id !== id),
      currentPetId: state.currentPetId === id ? state.pets[0]?.id || null : state.currentPetId,
    }));
  },

  setCurrentPet: (id) => set({ currentPetId: id }),

  addVaccine: (vaccine) => {
    const newVaccine: PetVaccine = {
      ...vaccine,
      id: Date.now().toString(),
    };
    set((state) => ({
      vaccines: [...state.vaccines, newVaccine],
    }));
  },

  addCheckup: (checkup) => {
    const newCheckup: PetCheckup = {
      ...checkup,
      id: Date.now().toString(),
    };
    set((state) => ({
      checkups: [...state.checkups, newCheckup],
    }));
  },

  addGrowthRecord: (record) => {
    const newRecord: PetGrowth = {
      ...record,
      id: Date.now().toString(),
    };
    set((state) => ({
      growthRecords: [...state.growthRecords, newRecord],
    }));
  },

  getCurrentPet: () => {
    const state = get();
    return state.pets.find((pet) => pet.id === state.currentPetId) || null;
  },

  getPetVaccines: (petId) => get().vaccines.filter((v) => v.petId === petId),
  getPetCheckups: (petId) => get().checkups.filter((c) => c.petId === petId),
  getPetGrowth: (petId) => get().growthRecords.filter((g) => g.petId === petId),
}));
