// ============================================
// 天气状态管理 - Zustand Store
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { weatherService } from '../services/weatherService';
import type { WeatherData, WeatherLocation } from '../types/weather';

interface WeatherState {
  // 数据
  weatherData: WeatherData | null;
  currentLocation: WeatherLocation | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  
  // 设置
  apiKey: string;
  updateInterval: number;
  isAutoUpdateEnabled: boolean;
  
  // 动作
  setWeatherData: (data: WeatherData | null) => void;
  setCurrentLocation: (location: WeatherLocation | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setApiKey: (apiKey: string) => void;
  setUpdateInterval: (interval: number) => void;
  
  // 业务逻辑
  fetchWeather: () => Promise<void>;
  fetchWeatherByLocation: (lat: number, lon: number) => Promise<void>;
  searchLocation: (query: string) => Promise<WeatherLocation[]>;
  setLocationAndFetch: (location: WeatherLocation) => Promise<void>;
  refreshWeather: () => Promise<void>;
  startAutoUpdate: () => void;
  stopAutoUpdate: () => void;
  toggleAutoUpdate: () => void;
  clearError: () => void;
}

export const useWeatherStore = create<WeatherState>()(
  persist(
    (set, get) => ({
      // 初始状态
      weatherData: null,
      currentLocation: null,
      isLoading: false,
      error: null,
      lastUpdated: null,
      apiKey: '',
      updateInterval: 10 * 60 * 1000, // 10分钟
      isAutoUpdateEnabled: false,

      // 基础设置
      setWeatherData: (data) => set({ weatherData: data, lastUpdated: Date.now() }),
      setCurrentLocation: (location) => {
        set({ currentLocation: location });
        if (location) {
          weatherService.setLocation(location);
        }
      },
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setApiKey: (apiKey) => {
        set({ apiKey });
        weatherService.setApiKey(apiKey);
      },
      setUpdateInterval: (interval) => {
        set({ updateInterval: interval });
        weatherService.setUpdateInterval(interval);
      },

      // 获取天气数据
      fetchWeather: async () => {
        const { apiKey } = get();
        
        if (!apiKey) {
          set({ error: '请先配置天气API Key' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          // 设置API Key到服务
          weatherService.setApiKey(apiKey);
          
          const data = await weatherService.getFullWeatherData();
          set({ 
            weatherData: data, 
            currentLocation: data.location,
            isLoading: false,
            lastUpdated: Date.now(),
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '获取天气失败',
            isLoading: false,
          });
        }
      },

      // 根据坐标获取天气
      fetchWeatherByLocation: async (lat, lon) => {
        const { apiKey } = get();
        
        if (!apiKey) {
          set({ error: '请先配置天气API Key' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          weatherService.setApiKey(apiKey);
          
          // 反向地理编码获取位置名称
          const location = await weatherService.reverseGeocode(lat, lon);
          weatherService.setLocation(location);
          
          const data = await weatherService.getFullWeatherData(location);
          set({ 
            weatherData: data, 
            currentLocation: location,
            isLoading: false,
            lastUpdated: Date.now(),
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '获取天气失败',
            isLoading: false,
          });
        }
      },

      // 搜索位置
      searchLocation: async (query) => {
        const { apiKey } = get();
        
        if (!apiKey) {
          throw new Error('请先配置天气API Key');
        }

        try {
          weatherService.setApiKey(apiKey);
          return await weatherService.searchLocation(query);
        } catch (error) {
          throw error instanceof Error ? error : new Error('搜索位置失败');
        }
      },

      // 设置位置并获取天气
      setLocationAndFetch: async (location) => {
        const { apiKey } = get();
        
        if (!apiKey) {
          set({ error: '请先配置天气API Key' });
          return;
        }

        set({ isLoading: true, error: null, currentLocation: location });

        try {
          weatherService.setApiKey(apiKey);
          weatherService.setLocation(location);
          
          const data = await weatherService.getFullWeatherData(location);
          set({ 
            weatherData: data, 
            isLoading: false,
            lastUpdated: Date.now(),
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '获取天气失败',
            isLoading: false,
          });
        }
      },

      // 刷新天气
      refreshWeather: async () => {
        const { currentLocation, apiKey } = get();
        
        if (!apiKey) {
          set({ error: '请先配置天气API Key' });
          return;
        }

        if (!currentLocation) {
          set({ error: '请先设置位置' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          weatherService.setApiKey(apiKey);
          const data = await weatherService.getFullWeatherData(currentLocation);
          set({ 
            weatherData: data, 
            isLoading: false,
            lastUpdated: Date.now(),
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '刷新天气失败',
            isLoading: false,
          });
        }
      },

      // 启动自动更新
      startAutoUpdate: () => {
        const { apiKey, updateInterval } = get();
        
        if (!apiKey) {
          set({ error: '请先配置天气API Key' });
          return;
        }

        weatherService.setApiKey(apiKey);
        weatherService.setUpdateInterval(updateInterval);
        
        // 注册监听器
        weatherService.addListener((data) => {
          set({ 
            weatherData: data, 
            currentLocation: data.location,
            lastUpdated: Date.now(),
          });
        });

        weatherService.startAutoUpdate();
        set({ isAutoUpdateEnabled: true });
      },

      // 停止自动更新
      stopAutoUpdate: () => {
        weatherService.stopAutoUpdate();
        weatherService.removeListener(() => {});
        set({ isAutoUpdateEnabled: false });
      },

      // 切换自动更新
      toggleAutoUpdate: () => {
        const { isAutoUpdateEnabled } = get();
        if (isAutoUpdateEnabled) {
          get().stopAutoUpdate();
        } else {
          get().startAutoUpdate();
        }
      },

      // 清除错误
      clearError: () => set({ error: null }),
    }),
    {
      name: 'weather-storage',
      partialize: (state) => ({
        apiKey: state.apiKey,
        updateInterval: state.updateInterval,
        currentLocation: state.currentLocation,
      }),
    }
  )
);

// 导出选择器
export const selectWeatherData = (state: WeatherState) => state.weatherData;
export const selectCurrentLocation = (state: WeatherState) => state.currentLocation;
export const selectIsLoading = (state: WeatherState) => state.isLoading;
export const selectError = (state: WeatherState) => state.error;
export const selectLastUpdated = (state: WeatherState) => state.lastUpdated;
export const selectApiKey = (state: WeatherState) => state.apiKey;
export const selectIsAutoUpdateEnabled = (state: WeatherState) => state.isAutoUpdateEnabled;
