/**
 * Health Store - 健康主页数据存储
 *
 * 管理宠物健康数据、健康评分、健康趋势等功能
 * 支持 Capacitor 原生存储
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

// 健康指标类型
export type HealthMetricType = 'weight' | 'height' | 'temperature' | 'heartRate' | 'respiration' | 'activity';

// 健康指标
export interface HealthMetric {
  id: string;
  petId: string;
  type: HealthMetricType;
  value: number;
  unit: string;
  timestamp: string;
  status: 'normal' | 'warning' | 'alert';
  note?: string;
}

// 健康评分
export interface HealthScore {
  overall: number;
  physical: number;
  mental: number;
  nutrition: number;
  activity: number;
  lastUpdated: string;
}

// 健康趋势
export interface HealthTrend {
  type: HealthMetricType;
  data: { date: string; value: number }[];
  trend: 'up' | 'down' | 'stable';
}

// 健康提醒
export interface HealthAlert {
  id: string;
  petId: string;
  type: 'checkup' | 'vaccine' | 'medication' | 'weight' | 'behavior';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  scheduledDate?: string;
  completed: boolean;
  createdAt: string;
}

// Store 接口
interface HealthState {
  metrics: HealthMetric[];
  scores: Record<string, HealthScore>;
  alerts: HealthAlert[];
  isLoading: boolean;
  
  // 指标操作
  addMetric: (metric: Omit<HealthMetric, 'id'>) => Promise<HealthMetric>;
  getMetricsByPet: (petId: string) => HealthMetric[];
  getLatestMetric: (petId: string, type: HealthMetricType) => HealthMetric | null;
  
  // 评分
  calculateScore: (petId: string) => HealthScore;
  getScore: (petId: string) => HealthScore;
  
  // 趋势
  getTrend: (petId: string, type: HealthMetricType) => HealthTrend;
  
  // 提醒
  addAlert: (alert: Omit<HealthAlert, 'id' | 'createdAt'>) => void;
  completeAlert: (id: string) => void;
  getAlertsByPet: (petId: string) => HealthAlert[];
  
  // 初始化
  initialize: () => Promise<void>;
}

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

const generateId = () => `health-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// 模拟健康数据
const mockMetrics: HealthMetric[] = [
  {
    id: 'metric-1',
    petId: 'pet-1',
    type: 'weight',
    value: 12.5,
    unit: 'kg',
    timestamp: new Date().toISOString(),
    status: 'normal',
  },
  {
    id: 'metric-2',
    petId: 'pet-1',
    type: 'temperature',
    value: 38.5,
    unit: '°C',
    timestamp: new Date().toISOString(),
    status: 'normal',
  },
  {
    id: 'metric-3',
    petId: 'pet-1',
    type: 'heartRate',
    value: 120,
    unit: 'bpm',
    timestamp: new Date().toISOString(),
    status: 'normal',
  },
];

const mockScore: HealthScore = {
  overall: 85,
  physical: 90,
  mental: 80,
  nutrition: 85,
  activity: 75,
  lastUpdated: new Date().toISOString(),
};

export const useHealthStore = create<HealthState>()(
  persist(
    (set, get) => ({
      metrics: [],
      scores: {},
      alerts: [],
      isLoading: false,

      addMetric: async (metricData) => {
        const newMetric: HealthMetric = {
          ...metricData,
          id: generateId(),
        };
        
        set((state) => ({
          metrics: [...state.metrics, newMetric],
        }));
        
        return newMetric;
      },

      getMetricsByPet: (petId) => {
        return get().metrics.filter((m) => m.petId === petId);
      },

      getLatestMetric: (petId, type) => {
        const metrics = get().getMetricsByPet(petId).filter((m) => m.type === type);
        return metrics.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] || null;
      },

      calculateScore: (petId) => {
        const metrics = get().getMetricsByPet(petId);
        
        // 基于指标计算评分
        const weightMetric = metrics.find((m) => m.type === 'weight');
        const activityMetric = metrics.find((m) => m.type === 'activity');
        
        const score: HealthScore = {
          overall: 85,
          physical: weightMetric?.status === 'normal' ? 90 : 70,
          mental: 80,
          nutrition: 85,
          activity: activityMetric?.status === 'normal' ? 75 : 60,
          lastUpdated: new Date().toISOString(),
        };
        
        set((state) => ({
          scores: { ...state.scores, [petId]: score },
        }));
        
        return score;
      },

      getScore: (petId) => {
        return get().scores[petId] || mockScore;
      },

      getTrend: (petId, type) => {
        const metrics = get().getMetricsByPet(petId)
          .filter((m) => m.type === type)
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        const data = metrics.slice(-7).map((m) => ({
          date: m.timestamp.split('T')[0],
          value: m.value,
        }));
        
        // 计算趋势
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (data.length >= 2) {
          const lastTwo = data.slice(-2);
          const diff = lastTwo[1].value - lastTwo[0].value;
          if (diff > 0) trend = 'up';
          else if (diff < 0) trend = 'down';
        }
        
        return { type, data, trend };
      },

      addAlert: (alertData) => {
        const newAlert: HealthAlert = {
          ...alertData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        
        set((state) => ({
          alerts: [...state.alerts, newAlert],
        }));
      },

      completeAlert: (id) => {
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === id ? { ...a, completed: true } : a
          ),
        }));
      },

      getAlertsByPet: (petId) => {
        return get().alerts.filter((a) => a.petId === petId && !a.completed);
      },

      initialize: async () => {
        set({ isLoading: true });
        
        if (get().metrics.length === 0) {
          set({ metrics: mockMetrics });
        }
        
        if (!get().scores['pet-1']) {
          set({ scores: { 'pet-1': mockScore } });
        }
        
        set({ isLoading: false });
      },
    }),
    {
      name: 'pawsync-health-store',
      storage: createJSONStorage(() => capacitorStorage),
      partialize: (state) => ({
        metrics: state.metrics.slice(0, 200),
        scores: state.scores,
        alerts: state.alerts,
      }),
    }
  )
);