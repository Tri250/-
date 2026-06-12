/**
 * Diet Store - 饮食数据存储
 *
 * 管理宠物饮食记录、营养分析、饮食建议等功能
 * 支持 Capacitor 原生存储
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

// 饮食记录类型
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'treat';

// 饮食记录
export interface DietRecord {
  id: string;
  petId: string;
  type: MealType;
  food: string;
  amount: number; // 克
  calories?: number;
  time: string;
  date: string;
  note?: string;
  image?: string;
}

// 饮食统计
export interface DietStats {
  totalMeals: number;
  totalAmount: number; // 克
  totalCalories: number;
  totalDuration: number; // 分钟
  avgMealsPerDay: number;
  avgAmountPerMeal: number;
}

// 营养摄入
export interface NutritionIntake {
  protein: number; // 蛋白质 %
  fat: number; // 脂肪 %
  carbohydrate: number; // 碳水化合物 %
  fiber: number; // 纤维 %
}

// 饮食建议
export interface DietAdvice {
  id: string;
  petId: string;
  title: string;
  content: string;
  category: 'feeding' | 'nutrition' | 'schedule' | 'water' | 'treat';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

// 时间范围
export type TimeRange = 'day' | 'week' | 'month';

// Store 接口
interface DietState {
  records: DietRecord[];
  advices: DietAdvice[];
  selectedDate: string;
  timeRange: TimeRange;
  isLoading: boolean;
  
  // 记录操作
  addRecord: (record: Omit<DietRecord, 'id'>) => Promise<DietRecord>;
  updateRecord: (id: string, updates: Partial<DietRecord>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  
  // 查询
  getRecordsByDate: (date: string) => DietRecord[];
  getRecordsByPet: (petId: string) => DietRecord[];
  getRecordsByRange: (range: TimeRange) => DietRecord[];
  
  // 统计
  getStats: (petId: string, range?: TimeRange) => DietStats;
  getNutritionIntake: (petId: string) => NutritionIntake;
  
  // 建议
  addAdvice: (advice: Omit<DietAdvice, 'id' | 'createdAt'>) => void;
  getAdvicesByPet: (petId: string) => DietAdvice[];
  
  // 设置
  setSelectedDate: (date: string) => void;
  setTimeRange: (range: TimeRange) => void;
  
  // 初始化
  initialize: () => Promise<void>;
}

// Capacitor 原生存储适配
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

// 生成唯一ID
const generateId = () => `diet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// 获取今天日期
const getTodayDate = () => new Date().toISOString().split('T')[0];

// 模拟饮食记录
const mockRecords: DietRecord[] = [
  {
    id: 'diet-1',
    petId: 'pet-1',
    type: 'breakfast',
    food: '狗粮',
    amount: 120,
    calories: 350,
    time: '08:30',
    date: getTodayDate(),
    note: '主食',
  },
  {
    id: 'diet-2',
    petId: 'pet-1',
    type: 'snack',
    food: '零食',
    amount: 30,
    calories: 80,
    time: '10:15',
    date: getTodayDate(),
  },
  {
    id: 'diet-3',
    petId: 'pet-1',
    type: 'lunch',
    food: '狗粮',
    amount: 100,
    calories: 280,
    time: '14:00',
    date: getTodayDate(),
  },
  {
    id: 'diet-4',
    petId: 'pet-1',
    type: 'dinner',
    food: '狗粮',
    amount: 120,
    calories: 350,
    time: '20:00',
    date: getTodayDate(),
  },
];

// 模拟饮食建议
const mockAdvices: DietAdvice[] = [
  {
    id: 'advice-1',
    petId: 'pet-1',
    title: '每日喂食建议',
    content: '根据JOJO的体重(12.5kg)和活动量，建议每日摄入350g狗粮，分3-4次喂食。',
    category: 'feeding',
    priority: 'high',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'advice-2',
    petId: 'pet-1',
    title: '饮水提醒',
    content: '确保JOJO每天有充足的饮水，建议每天换水2次，保持水质新鲜。',
    category: 'water',
    priority: 'medium',
    createdAt: new Date().toISOString(),
  },
];

export const useDietStore = create<DietState>()(
  persist(
    (set, get) => ({
      records: [],
      advices: [],
      selectedDate: getTodayDate(),
      timeRange: 'day',
      isLoading: false,

      // 添加记录
      addRecord: async (recordData) => {
        const newRecord: DietRecord = {
          ...recordData,
          id: generateId(),
        };
        
        set((state) => ({
          records: [...state.records, newRecord],
        }));
        
        return newRecord;
      },

      // 更新记录
      updateRecord: async (id, updates) => {
        set((state) => ({
          records: state.records.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        }));
      },

      // 删除记录
      deleteRecord: async (id) => {
        set((state) => ({
          records: state.records.filter((r) => r.id !== id),
        }));
      },

      // 按日期查询
      getRecordsByDate: (date) => {
        return get().records.filter((r) => r.date === date);
      },

      // 按宠物查询
      getRecordsByPet: (petId) => {
        return get().records.filter((r) => r.petId === petId);
      },

      // 按时间范围查询
      getRecordsByRange: (range) => {
        const now = new Date();
        let startDate: Date;
        
        switch (range) {
          case 'day':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            break;
        }
        
        return get().records.filter((r) => new Date(r.date) >= startDate);
      },

      // 获取统计
      getStats: (petId, range = 'day') => {
        const records = get().getRecordsByRange(range).filter((r) => r.petId === petId);
        
        const totalMeals = records.length;
        const totalAmount = records.reduce((sum, r) => sum + r.amount, 0);
        const totalCalories = records.reduce((sum, r) => sum + (r.calories || 0), 0);
        
        const days = range === 'day' ? 1 : range === 'week' ? 7 : 30;
        const avgMealsPerDay = totalMeals / days;
        const avgAmountPerMeal = totalMeals > 0 ? totalAmount / totalMeals : 0;
        
        return {
          totalMeals,
          totalAmount,
          totalCalories,
          totalDuration: totalMeals * 1.5, // 假设每次进食1.5分钟
          avgMealsPerDay,
          avgAmountPerMeal,
        };
      },

      // 获取营养摄入
      getNutritionIntake: (petId) => {
        // 模拟营养数据
        return {
          protein: 35,
          fat: 25,
          carbohydrate: 30,
          fiber: 10,
        };
      },

      // 添加建议
      addAdvice: (adviceData) => {
        const newAdvice: DietAdvice = {
          ...adviceData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        
        set((state) => ({
          advices: [...state.advices, newAdvice],
        }));
      },

      // 获取宠物建议
      getAdvicesByPet: (petId) => {
        return get().advices.filter((a) => a.petId === petId);
      },

      // 设置日期
      setSelectedDate: (date) => {
        set({ selectedDate: date });
      },

      // 设置时间范围
      setTimeRange: (range) => {
        set({ timeRange: range });
      },

      // 初始化
      initialize: async () => {
        set({ isLoading: true });
        
        if (get().records.length === 0) {
          set({ records: mockRecords });
        }
        
        if (get().advices.length === 0) {
          set({ advices: mockAdvices });
        }
        
        set({ isLoading: false });
      },
    }),
    {
      name: 'pawsync-diet-store',
      storage: createJSONStorage(() => capacitorStorage),
      partialize: (state) => ({
        records: state.records,
        advices: state.advices,
      }),
    }
  )
);