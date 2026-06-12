/**
 * Services Store - 服务管理数据存储
 *
 * 管理宠物服务列表、预约记录、服务提供商等功能
 * 支持 Capacitor 原生存储
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

// 服务类型
export type ServiceType = 'grooming' | 'veterinary' | 'training' | 'boarding' | 'walking' | 'photography' | 'other';

// 服务提供商
export interface ServiceProvider {
  id: string;
  name: string;
  type: ServiceType;
  description: string;
  image?: string;
  rating: number;
  reviews: number;
  priceRange: string;
  location: string;
  distance?: number;
  phone?: string;
  website?: string;
  features: string[];
  available: boolean;
}

// 服务预约
export interface ServiceAppointment {
  id: string;
  petId: string;
  providerId: string;
  type: ServiceType;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  price?: number;
  note?: string;
  createdAt: string;
}

// Store 接口
interface ServicesState {
  providers: ServiceProvider[];
  appointments: ServiceAppointment[];
  isLoading: boolean;
  
  // 服务提供商
  getProvidersByType: (type: ServiceType) => ServiceProvider[];
  getProvidersByLocation: (location: string) => ServiceProvider[];
  searchProviders: (query: string) => ServiceProvider[];
  
  // 预约操作
  createAppointment: (appointment: Omit<ServiceAppointment, 'id' | 'createdAt'>) => Promise<ServiceAppointment>;
  updateAppointment: (id: string, updates: Partial<ServiceAppointment>) => void;
  cancelAppointment: (id: string) => void;
  
  // 查询
  getAppointmentsByPet: (petId: string) => ServiceAppointment[];
  getUpcomingAppointments: () => ServiceAppointment[];
  
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

const generateId = () => `service-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// 模拟服务提供商数据
const mockProviders: ServiceProvider[] = [
  {
    id: 'provider-1',
    name: '宠物美容中心',
    type: 'grooming',
    description: '专业宠物美容服务，包括洗澡、剪毛、造型等',
    rating: 4.8,
    reviews: 256,
    priceRange: '¥50-200',
    location: '市中心',
    distance: 2.5,
    phone: '400-123-4567',
    features: ['专业美容师', '上门服务', '预约灵活'],
    available: true,
  },
  {
    id: 'provider-2',
    name: '爱宠宠物医院',
    type: 'veterinary',
    description: '24小时宠物医疗服务，专业兽医团队',
    rating: 4.9,
    reviews: 512,
    priceRange: '¥100-500',
    location: '东区',
    distance: 3.2,
    phone: '400-234-5678',
    features: ['24小时服务', '专业设备', '急诊服务'],
    available: true,
  },
  {
    id: 'provider-3',
    name: '宠物训练学校',
    type: 'training',
    description: '专业宠物行为训练，纠正不良习惯',
    rating: 4.7,
    reviews: 128,
    priceRange: '¥200-800',
    location: '西区',
    distance: 5.0,
    phone: '400-345-6789',
    features: ['专业训练师', '一对一训练', '行为纠正'],
    available: true,
  },
];

export const useServicesStore = create<ServicesState>()(
  persist(
    (set, get) => ({
      providers: [],
      appointments: [],
      isLoading: false,

      getProvidersByType: (type) => {
        return get().providers.filter((p) => p.type === type);
      },

      getProvidersByLocation: (location) => {
        return get().providers.filter((p) =>
          p.location.toLowerCase().includes(location.toLowerCase())
        );
      },

      searchProviders: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().providers.filter((p) =>
          p.name.toLowerCase().includes(lowerQuery) ||
          p.description.toLowerCase().includes(lowerQuery) ||
          p.type.toLowerCase().includes(lowerQuery)
        );
      },

      createAppointment: async (appointmentData) => {
        const newAppointment: ServiceAppointment = {
          ...appointmentData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        
        set((state) => ({
          appointments: [...state.appointments, newAppointment],
        }));
        
        return newAppointment;
      },

      updateAppointment: (id, updates) => {
        set((state) => ({
          appointments: state.appointments.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        }));
      },

      cancelAppointment: (id) => {
        set((state) => ({
          appointments: state.appointments.map((a) =>
            a.id === id ? { ...a, status: 'cancelled' } : a
          ),
        }));
      },

      getAppointmentsByPet: (petId) => {
        return get().appointments.filter((a) => a.petId === petId);
      },

      getUpcomingAppointments: () => {
        const now = new Date();
        return get().appointments.filter((a) =>
          a.status !== 'cancelled' && a.status !== 'completed' &&
          new Date(`${a.date} ${a.time}`) > now
        );
      },

      initialize: async () => {
        set({ isLoading: true });
        
        if (get().providers.length === 0) {
          set({ providers: mockProviders });
        }
        
        set({ isLoading: false });
      },
    }),
    {
      name: 'pawsync-services-store',
      storage: createJSONStorage(() => capacitorStorage),
      partialize: (state) => ({
        providers: state.providers,
        appointments: state.appointments,
      }),
    }
  )
);