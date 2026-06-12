/**
 * Records Store - 记录管理数据存储
 *
 * 管理宠物日常记录、时间线、历史数据等功能
 * 支持 Capacitor 原生存储
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

// 记录类型
export type RecordType = 'feeding' | 'drinking' | 'activity' | 'health' | 'grooming' | 'training' | 'other';

// 记录状态
export type RecordStatus = 'normal' | 'warning' | 'alert';

// 记录接口
export interface Record {
  id: string;
  petId: string;
  type: RecordType;
  title: string;
  description: string;
  time: string;
  date: string;
  status: RecordStatus;
  tag?: string;
  tagColor?: string;
  image?: string;
  location?: string;
  duration?: number; // 分钟
  amount?: number; // 数量
  unit?: string; // 单位
  note?: string;
  createdAt: string;
}

// 日期汇总
export interface DateSummary {
  date: string;
  feeding: number;
  drinking: number;
  activity: number;
  health: number;
  grooming: number;
  training: number;
  other: number;
}

// Store 接口
interface RecordsState {
  records: Record[];
  summaries: DateSummary[];
  selectedDate: string;
  activeFilter: RecordType | 'all';
  isLoading: boolean;
  
  // 记录操作
  addRecord: (record: Omit<Record, 'id' | 'createdAt'>) => Promise<Record>;
  updateRecord: (id: string, updates: Partial<Record>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  
  // 查询
  getRecordsByDate: (date: string) => Record[];
  getRecordsByPet: (petId: string) => Record[];
  getRecordsByType: (type: RecordType) => Record[];
  getFilteredRecords: (petId: string, type?: RecordType | 'all') => Record[];
  
  // 汇总
  getDateSummary: (date: string) => DateSummary;
  generateSummary: (date: string) => void;
  
  // 设置
  setSelectedDate: (date: string) => void;
  setActiveFilter: (type: RecordType | 'all') => void;
  
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
const generateId = () => `record-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// 获取今天日期
const getTodayDate = () => new Date().toISOString().split('T')[0];

// 模拟记录数据
const mockRecords: Record[] = [
  {
    id: 'record-1',
    petId: 'pet-1',
    type: 'feeding',
    title: '喂食',
    description: '喂食了 120g 狗粮',
    time: '08:30',
    date: getTodayDate(),
    status: 'normal',
    tag: '主食',
    tagColor: '#F59E0B',
    amount: 120,
    unit: 'g',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'record-2',
    petId: 'pet-1',
    type: 'drinking',
    title: '饮水',
    description: '喝水 200ml',
    time: '10:15',
    date: getTodayDate(),
    status: 'normal',
    amount: 200,
    unit: 'ml',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'record-3',
    petId: 'pet-1',
    type: 'activity',
    title: '活动',
    description: '散步 30 分钟，消耗 120 kcal',
    time: '14:00',
    date: getTodayDate(),
    status: 'normal',
    duration: 30,
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'record-4',
    petId: 'pet-1',
    type: 'health',
    title: '健康',
    description: '体重 12.5kg',
    time: '20:00',
    date: getTodayDate(),
    status: 'normal',
    amount: 12.5,
    unit: 'kg',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'record-5',
    petId: 'pet-1',
    type: 'grooming',
    title: '护理',
    description: '洗澡，驱虫',
    time: '21:30',
    date: getTodayDate(),
    status: 'normal',
    createdAt: new Date().toISOString(),
  },
];

export const useRecordsStore = create<RecordsState>()(
  persist(
    (set, get) => ({
      records: [],
      summaries: [],
      selectedDate: getTodayDate(),
      activeFilter: 'all',
      isLoading: false,

      // 添加记录
      addRecord: async (recordData) => {
        const newRecord: Record = {
          ...recordData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        
        set((state) => ({
          records: [newRecord, ...state.records],
        }));
        
        // 更新汇总
        get().generateSummary(recordData.date);
        
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
        const record = get().records.find((r) => r.id === id);
        
        set((state) => ({
          records: state.records.filter((r) => r.id !== id),
        }));
        
        if (record) {
          get().generateSummary(record.date);
        }
      },

      // 按日期查询
      getRecordsByDate: (date) => {
        return get().records.filter((r) => r.date === date);
      },

      // 按宠物查询
      getRecordsByPet: (petId) => {
        return get().records.filter((r) => r.petId === petId);
      },

      // 按类型查询
      getRecordsByType: (type) => {
        return get().records.filter((r) => r.type === type);
      },

      // 过滤查询
      getFilteredRecords: (petId, type = 'all') => {
        let filtered = get().records.filter((r) => r.petId === petId);
        
        if (type !== 'all') {
          filtered = filtered.filter((r) => r.type === type);
        }
        
        return filtered.sort((a, b) => {
          const dateA = new Date(`${a.date} ${a.time}`);
          const dateB = new Date(`${b.date} ${b.time}`);
          return dateB.getTime() - dateA.getTime();
        });
      },

      // 获取日期汇总
      getDateSummary: (date) => {
        const summary = get().summaries.find((s) => s.date === date);
        
        if (summary) return summary;
        
        // 生成汇总
        get().generateSummary(date);
        return get().summaries.find((s) => s.date === date) || {
          date,
          feeding: 0,
          drinking: 0,
          activity: 0,
          health: 0,
          grooming: 0,
          training: 0,
          other: 0,
        };
      },

      // 生成汇总
      generateSummary: (date) => {
        const records = get().getRecordsByDate(date);
        
        const summary: DateSummary = {
          date,
          feeding: records.filter((r) => r.type === 'feeding').length,
          drinking: records.filter((r) => r.type === 'drinking').length,
          activity: records.filter((r) => r.type === 'activity').length,
          health: records.filter((r) => r.type === 'health').length,
          grooming: records.filter((r) => r.type === 'grooming').length,
          training: records.filter((r) => r.type === 'training').length,
          other: records.filter((r) => r.type === 'other').length,
        };
        
        set((state) => ({
          summaries: [
            ...state.summaries.filter((s) => s.date !== date),
            summary,
          ],
        }));
      },

      // 设置日期
      setSelectedDate: (date) => {
        set({ selectedDate: date });
      },

      // 设置过滤类型
      setActiveFilter: (type) => {
        set({ activeFilter: type });
      },

      // 初始化
      initialize: async () => {
        set({ isLoading: true });
        
        if (get().records.length === 0) {
          set({ records: mockRecords });
          get().generateSummary(getTodayDate());
        }
        
        set({ isLoading: false });
      },
    }),
    {
      name: 'pawsync-records-store',
      storage: createJSONStorage(() => capacitorStorage),
      partialize: (state) => ({
        records: state.records.slice(0, 500), // 限制记录数量
        summaries: state.summaries,
      }),
    }
  )
);