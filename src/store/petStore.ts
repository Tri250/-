import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { Pet, PetVaccine, PetCheckup, PetGrowth, PetType, generateUniqueCode, getPetTemplate } from '../types/pet';

// Capacitor 原生存储适配器
const capacitorStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (Capacitor.isNativePlatform()) {
      const { value } = await Preferences.get({ key: name });
      return value;
    }
    return localStorage.getItem(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key: name, value });
    } else {
      localStorage.setItem(name, value);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    if (Capacitor.isNativePlatform()) {
      await Preferences.remove({ key: name });
    } else {
      localStorage.removeItem(name);
    }
  },
};

interface PetStore {
  pets: Pet[];
  currentPetId: string | null;
  vaccines: PetVaccine[];
  checkups: PetCheckup[];
  growthRecords: PetGrowth[];
  
  addPet: (pet: Omit<Pet, 'id' | 'createdAt' | 'uniqueCode'>) => void;
  updatePet: (id: string, updates: Partial<Pet>) => void;
  deletePet: (id: string, keepHealthData?: boolean) => void;
  setCurrentPet: (id: string) => void;
  
  addVaccine: (vaccine: Omit<PetVaccine, 'id'>) => void;
  addCheckup: (checkup: Omit<PetCheckup, 'id'>) => void;
  addGrowthRecord: (record: Omit<PetGrowth, 'id'>) => void;
  
  getCurrentPet: () => Pet | null;
  getPetVaccines: (petId: string) => PetVaccine[];
  getPetCheckups: (petId: string) => PetCheckup[];
  getPetGrowth: (petId: string) => PetGrowth[];
  
  importPetsFromCSV: (data: string) => { success: number; duplicates: number; errors: string[] };
  importPetsFromJSON: (data: Pet[]) => { success: number; duplicates: number; errors: string[] };
}

const INITIAL_PETS: Pet[] = [
  {
    id: '1',
    uniqueCode: 'PET-TEST001-ABCD',
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
    uniqueCode: 'PET-TEST002-EFGH',
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

export const usePetStore = create<PetStore>()(
  persist(
    (set, get) => ({
      pets: INITIAL_PETS,
      currentPetId: '1',
      vaccines: [],
      checkups: [],
      growthRecords: [],

      addPet: (pet) => {
        const template = getPetTemplate(pet.type);
        const newPet: Pet = {
          ...pet,
          id: Date.now().toString(),
          uniqueCode: generateUniqueCode(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          exoticFields: template?.exoticFields || pet.exoticFields,
        };
        set((state) => ({
          pets: [...state.pets, newPet],
          currentPetId: newPet.id,
        }));
      },

      updatePet: (id, updates) => {
        set((state) => ({
          pets: state.pets.map((pet) =>
            pet.id === id ? { ...pet, ...updates, updatedAt: new Date().toISOString() } : pet
          ),
        }));
      },

      deletePet: (id, keepHealthData = false) => {
        set((state) => {
          const newVaccines = keepHealthData ? state.vaccines : state.vaccines.filter(v => v.petId !== id);
          const newCheckups = keepHealthData ? state.checkups : state.checkups.filter(c => c.petId !== id);
          const newGrowthRecords = keepHealthData ? state.growthRecords : state.growthRecords.filter(g => g.petId !== id);
          
          return {
            pets: state.pets.filter((pet) => pet.id !== id),
            currentPetId: state.currentPetId === id ? state.pets[0]?.id || null : state.currentPetId,
            vaccines: newVaccines,
            checkups: newCheckups,
            growthRecords: newGrowthRecords,
          };
        });
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

      importPetsFromCSV: (csvData) => {
        const result = { success: 0, duplicates: 0, errors: [] as string[] };
        const lines = csvData.trim().split('\n');
        
        if (lines.length < 2) {
          result.errors.push('CSV文件格式错误：至少需要标题行和一行数据');
          return result;
        }
        
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const existingPets = get().pets;
        
        for (let i = 1; i < lines.length; i++) {
          try {
            const values = lines[i].split(',').map(v => v.trim());
            const petData: Record<string, string> = {};
            
            headers.forEach((header, index) => {
              petData[header] = values[index] || '';
            });
            
            const name = petData['name'] || petData['名称'] || petData['宠物名'];
            if (!name) {
              result.errors.push(`第${i + 1}行：缺少宠物名称`);
              continue;
            }
            
            const isDuplicate = existingPets.some(p => 
              p.name.toLowerCase() === name.toLowerCase() && 
              p.breed === (petData['breed'] || petData['品种'])
            );
            
            if (isDuplicate) {
              result.duplicates++;
              continue;
            }
            
            const typeMap: Record<string, PetType> = {
              '狗': 'dog', '犬': 'dog', 'dog': 'dog',
              '猫': 'cat', 'cat': 'cat',
              '兔子': 'rabbit', 'rabbit': 'rabbit',
              '仓鼠': 'hamster', 'hamster': 'hamster',
              '豚鼠': 'guinea_pig', 'guinea_pig': 'guinea_pig',
              '鹦鹉': 'parrot', 'parrot': 'parrot',
              '玄凤': 'cockatiel', 'cockatiel': 'cockatiel',
              '乌龟': 'turtle', 'turtle': 'turtle',
              '蜥蜴': 'lizard', 'lizard': 'lizard',
              '蛇': 'snake', 'snake': 'snake',
              '鱼': 'fish', 'fish': 'fish',
            };
            
            const typeInput = (petData['type'] || petData['类型'] || petData['宠物类型'] || 'other').toLowerCase();
            const type = typeMap[typeInput] || 'other';
            
            const genderMap: Record<string, 'male' | 'female' | 'unknown'> = {
              '公': 'male', '雄': 'male', 'male': 'male',
              '母': 'female', '雌': 'female', 'female': 'female',
            };
            const genderInput = (petData['gender'] || petData['性别'] || '').toLowerCase();
            const gender = genderMap[genderInput] || 'unknown';
            
            const template = getPetTemplate(type);
            const newPet: Pet = {
              id: Date.now().toString() + i,
              uniqueCode: generateUniqueCode(),
              name,
              type,
              breed: petData['breed'] || petData['品种'] || '',
              gender,
              birthday: petData['birthday'] || petData['生日'] || petData['出生日期'] || '',
              weight: parseFloat(petData['weight'] || petData['体重'] || '0') || 0,
              color: petData['color'] || petData['毛色'] || petData['颜色'] || '',
              createdAt: new Date().toISOString(),
              healthStatus: 'good',
              characteristics: petData['characteristics'] || petData['特点'] || petData['性格'] || '',
              exoticFields: template?.exoticFields,
            };
            
            set((state) => ({ pets: [...state.pets, newPet] }));
            result.success++;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_error) {
            result.errors.push(`第${i + 1}行：解析错误`);
          }
        }
        
        return result;
      },

      importPetsFromJSON: (data) => {
        const result = { success: 0, duplicates: 0, errors: [] as string[] };
        const existingPets = get().pets;
        
        data.forEach((pet, index) => {
          try {
            if (!pet.name) {
              result.errors.push(`第${index + 1}条：缺少宠物名称`);
              return;
            }
            
            const isDuplicate = existingPets.some(p => 
              p.name.toLowerCase() === pet.name.toLowerCase() && 
              p.breed === pet.breed
            );
            
            if (isDuplicate) {
              result.duplicates++;
              return;
            }
            
            const template = getPetTemplate(pet.type || 'other');
            const newPet: Pet = {
              id: Date.now().toString() + index,
              uniqueCode: generateUniqueCode(),
              name: pet.name,
              type: pet.type || 'other',
              breed: pet.breed || '',
              gender: pet.gender || 'unknown',
              birthday: pet.birthday || '',
              weight: pet.weight || 0,
              color: pet.color || '',
              createdAt: new Date().toISOString(),
              healthStatus: pet.healthStatus || 'good',
              characteristics: pet.characteristics || '',
              exoticFields: pet.exoticFields || template?.exoticFields,
            };
            
            set((state) => ({ pets: [...state.pets, newPet] }));
            result.success++;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_error) {
            result.errors.push(`第${index + 1}条：解析错误`);
          }
        });
        
        return result;
      },
    }),
    {
      name: 'pawsync-pets-store',
      storage: createJSONStorage(() => capacitorStorage),
      partialize: (state) => ({
        pets: state.pets,
        currentPetId: state.currentPetId,
        vaccines: state.vaccines,
        checkups: state.checkups,
        growthRecords: state.growthRecords,
      }),
    }
  )
);
