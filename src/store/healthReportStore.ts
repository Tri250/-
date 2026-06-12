/**
 * Health Report Store - 健康报告数据存储
 *
 * 管理健康报告生成、历史报告、报告分析等功能
 * 支持 Capacitor 原生存储
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

// 报告类型
export type ReportType = 'daily' | 'weekly' | 'monthly' | 'annual' | 'special';

// 健康报告
export interface HealthReport {
  id: string;
  petId: string;
  type: ReportType;
  title: string;
  dateRange: {
    start: string;
    end: string;
  };
  summary: string;
  metrics: {
    weight?: { value: number; trend: 'up' | 'down' | 'stable' };
    activity?: { value: number; trend: 'up' | 'down' | 'stable' };
    nutrition?: { score: number; recommendations: string[] };
    behavior?: { score: number; notes: string[] };
  };
  recommendations: string[];
  alerts: string[];
  score: number;
  createdAt: string;
}

// 报告模板
export interface ReportTemplate {
  id: string;
  name: string;
  type: ReportType;
  sections: string[];
}

// Store 接口
interface HealthReportState {
  reports: HealthReport[];
  templates: ReportTemplate[];
  isLoading: boolean;
  isGenerating: boolean;
  
  // 报告操作
  generateReport: (petId: string, type: ReportType) => Promise<HealthReport>;
  deleteReport: (id: string) => void;
  
  // 查询
  getReportsByPet: (petId: string) => HealthReport[];
  getLatestReport: (petId: string) => HealthReport | null;
  getReportsByType: (type: ReportType) => HealthReport[];
  
  // 模板
  getTemplates: () => ReportTemplate[];
  
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

const generateId = () => `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// 模拟报告数据
const mockReports: HealthReport[] = [
  {
    id: 'report-1',
    petId: 'pet-1',
    type: 'daily',
    title: '每日健康报告',
    dateRange: {
      start: new Date().toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
    summary: 'JOJO今天的健康状况良好，活动量正常，饮食规律。',
    metrics: {
      weight: { value: 12.5, trend: 'stable' },
      activity: { value: 85, trend: 'up' },
      nutrition: { score: 90, recommendations: ['保持当前饮食量'] },
      behavior: { score: 85, notes: ['情绪稳定'] },
    },
    recommendations: ['继续保持规律喂食', '适当增加活动量'],
    alerts: [],
    score: 85,
    createdAt: new Date().toISOString(),
  },
];

const mockTemplates: ReportTemplate[] = [
  {
    id: 'template-1',
    name: '每日报告',
    type: 'daily',
    sections: ['summary', 'metrics', 'recommendations'],
  },
  {
    id: 'template-2',
    name: '周报告',
    type: 'weekly',
    sections: ['summary', 'metrics', 'trends', 'recommendations', 'alerts'],
  },
];

export const useHealthReportStore = create<HealthReportState>()(
  persist(
    (set, get) => ({
      reports: [],
      templates: [],
      isLoading: false,
      isGenerating: false,

      generateReport: async (petId, type) => {
        set({ isGenerating: true });
        
        // 模拟生成过程
        await new Promise((resolve) => setTimeout(resolve, 2000));
        
        const now = new Date();
        let dateRange: { start: string; end: string };
        
        switch (type) {
          case 'daily':
            dateRange = {
              start: now.toISOString().split('T')[0],
              end: now.toISOString().split('T')[0],
            };
            break;
          case 'weekly':
            const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            dateRange = {
              start: weekStart.toISOString().split('T')[0],
              end: now.toISOString().split('T')[0],
            };
            break;
          default:
            dateRange = {
              start: now.toISOString().split('T')[0],
              end: now.toISOString().split('T')[0],
            };
        }
        
        const report: HealthReport = {
          id: generateId(),
          petId,
          type,
          title: `${type === 'daily' ? '每日' : type === 'weekly' ? '每周' : '每月'}健康报告`,
          dateRange,
          summary: '健康状况良好，各项指标正常。',
          metrics: {
            weight: { value: 12.5, trend: 'stable' },
            activity: { value: 80, trend: 'up' },
            nutrition: { score: 85, recommendations: ['保持均衡饮食'] },
            behavior: { score: 90, notes: ['情绪稳定，行为正常'] },
          },
          recommendations: ['继续保持规律作息', '适当增加户外活动'],
          alerts: [],
          score: 85 + Math.floor(Math.random() * 10),
          createdAt: now.toISOString(),
        };
        
        set((state) => ({
          reports: [report, ...state.reports],
          isGenerating: false,
        }));
        
        return report;
      },

      deleteReport: (id) => {
        set((state) => ({
          reports: state.reports.filter((r) => r.id !== id),
        }));
      },

      getReportsByPet: (petId) => {
        return get().reports.filter((r) => r.petId === petId);
      },

      getLatestReport: (petId) => {
        const reports = get().getReportsByPet(petId);
        return reports.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0] || null;
      },

      getReportsByType: (type) => {
        return get().reports.filter((r) => r.type === type);
      },

      getTemplates: () => {
        return get().templates;
      },

      initialize: async () => {
        set({ isLoading: true });
        
        if (get().reports.length === 0) {
          set({ reports: mockReports });
        }
        
        if (get().templates.length === 0) {
          set({ templates: mockTemplates });
        }
        
        set({ isLoading: false });
      },
    }),
    {
      name: 'pawsync-health-report-store',
      storage: createJSONStorage(() => capacitorStorage),
      partialize: (state) => ({
        reports: state.reports.slice(0, 50),
        templates: state.templates,
      }),
    }
  )
);