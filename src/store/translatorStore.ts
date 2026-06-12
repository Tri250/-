/**
 * Translator Store - 翻译器数据存储
 *
 * 管理宠物声音翻译记录、翻译历史、翻译模型等功能
 * 支持 Capacitor 原生存储
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

// 翻译结果
export interface TranslationResult {
  id: string;
  petId: string;
  audioUrl?: string;
  audioDuration: number; // 秒
  emotion: string;
  emotionEmoji: string;
  translation: string;
  confidence: number; // 0-100
  suggestions?: string[];
  timestamp: string;
}

// 翻译历史
export interface TranslationHistory {
  id: string;
  petId: string;
  results: TranslationResult[];
  createdAt: string;
}

// 翻译统计
export interface TranslationStats {
  totalTranslations: number;
  avgConfidence: number;
  mostCommonEmotion: string;
  emotionsBreakdown: Record<string, number>;
}

// Store 接口
interface TranslatorState {
  results: TranslationResult[];
  history: TranslationHistory[];
  stats: TranslationStats;
  isRecording: boolean;
  isTranslating: boolean;
  currentResult: TranslationResult | null;
  
  // 翻译操作
  startRecording: () => void;
  stopRecording: () => void;
  translate: (petId: string, audioData: any) => Promise<TranslationResult>;
  
  // 结果操作
  setCurrentResult: (result: TranslationResult | null) => void;
  saveResult: (result: TranslationResult) => void;
  deleteResult: (id: string) => void;
  
  // 查询
  getResultsByPet: (petId: string) => TranslationResult[];
  getRecentResults: (limit?: number) => TranslationResult[];
  
  // 统计
  calculateStats: (petId: string) => TranslationStats;
  
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

const generateId = () => `trans-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// 模拟翻译数据
const mockResults: TranslationResult[] = [
  {
    id: 'trans-1',
    petId: 'pet-1',
    audioDuration: 3,
    emotion: 'happy',
    emotionEmoji: '😸',
    translation: '我很开心，想和你玩耍！',
    confidence: 95,
    suggestions: ['可以带它出去散步', '给它一些玩具'],
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'trans-2',
    petId: 'pet-1',
    audioDuration: 2,
    emotion: 'hungry',
    emotionEmoji: '🥺',
    translation: '我饿了，想吃东西！',
    confidence: 88,
    suggestions: ['检查喂食时间', '准备食物'],
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
];

const defaultStats: TranslationStats = {
  totalTranslations: 2,
  avgConfidence: 91.5,
  mostCommonEmotion: 'happy',
  emotionsBreakdown: { happy: 1, hungry: 1 },
};

export const useTranslatorStore = create<TranslatorState>()(
  persist(
    (set, get) => ({
      results: [],
      history: [],
      stats: defaultStats,
      isRecording: false,
      isTranslating: false,
      currentResult: null,

      startRecording: () => {
        set({ isRecording: true });
      },

      stopRecording: () => {
        set({ isRecording: false });
      },

      translate: async (petId, audioData) => {
        set({ isTranslating: true });
        
        // 模拟翻译过程
        await new Promise((resolve) => setTimeout(resolve, 2000));
        
        const emotions = ['happy', 'hungry', 'curious', 'anxious', 'sleepy', 'playful'];
        const emotionEmojis: Record<string, string> = {
          happy: '😸',
          hungry: '🥺',
          curious: '🤔',
          anxious: '😰',
          sleepy: '😴',
          playful: '🤩',
        };
        
        const translations: Record<string, string> = {
          happy: '我很开心，想和你玩耍！',
          hungry: '我饿了，想吃东西！',
          curious: '这是什么？我想探索一下！',
          anxious: '我有点担心，需要安慰',
          sleepy: '我困了，想休息一下',
          playful: '来玩吧！我很兴奋！',
        };
        
        const suggestions: Record<string, string[]> = {
          happy: ['可以带它出去散步', '给它一些玩具'],
          hungry: ['检查喂食时间', '准备食物'],
          curious: ['给它新的玩具探索', '带它去新的地方'],
          anxious: ['给它安抚', '检查是否有异常'],
          sleepy: ['让它休息', '准备舒适的睡眠环境'],
          playful: ['和它玩耍', '准备互动玩具'],
        };
        
        const emotion = emotions[Math.floor(Math.random() * emotions.length)];
        
        const result: TranslationResult = {
          id: generateId(),
          petId,
          audioDuration: audioData?.duration || 3,
          emotion,
          emotionEmoji: emotionEmojis[emotion],
          translation: translations[emotion],
          confidence: 85 + Math.floor(Math.random() * 15),
          suggestions: suggestions[emotion],
          timestamp: new Date().toISOString(),
        };
        
        set({
          isTranslating: false,
          currentResult: result,
        });
        
        get().saveResult(result);
        
        return result;
      },

      setCurrentResult: (result) => {
        set({ currentResult: result });
      },

      saveResult: (result) => {
        set((state) => ({
          results: [result, ...state.results].slice(0, 100),
        }));
        
        // 更新统计
        const stats = get().calculateStats(result.petId);
        set({ stats });
      },

      deleteResult: (id) => {
        set((state) => ({
          results: state.results.filter((r) => r.id !== id),
        }));
      },

      getResultsByPet: (petId) => {
        return get().results.filter((r) => r.petId === petId);
      },

      getRecentResults: (limit = 10) => {
        return get().results.slice(0, limit);
      },

      calculateStats: (petId) => {
        const results = get().getResultsByPet(petId);
        
        if (results.length === 0) return defaultStats;
        
        const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
        
        const emotionsBreakdown: Record<string, number> = {};
        results.forEach((r) => {
          emotionsBreakdown[r.emotion] = (emotionsBreakdown[r.emotion] || 0) + 1;
        });
        
        const mostCommonEmotion = Object.entries(emotionsBreakdown)
          .sort((a, b) => b[1] - a[1])[0][0];
        
        return {
          totalTranslations: results.length,
          avgConfidence,
          mostCommonEmotion,
          emotionsBreakdown,
        };
      },

      initialize: async () => {
        if (get().results.length === 0) {
          set({ results: mockResults });
        }
      },
    }),
    {
      name: 'pawsync-translator-store',
      storage: createJSONStorage(() => capacitorStorage),
      partialize: (state) => ({
        results: state.results.slice(0, 50),
        stats: state.stats,
      }),
    }
  )
);