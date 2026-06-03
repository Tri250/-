import { create } from 'zustand';
import type { EmotionAnalysis, EmotionDashboard, _PrimaryEmotion } from '../types/emotion';
import { emotionService } from '../services/emotionService';

interface EmotionState {
  currentAnalysis: EmotionAnalysis | null;
  recentAnalyses: EmotionAnalysis[];
  dashboard: EmotionDashboard | null;
  isAnalyzing: boolean;
  isRecording: boolean;
  error: string | null;

  analyzeVoice: (audioData: Float32Array) => Promise<void>;
  analyzeImage: (imageData: ImageData) => Promise<void>;
  loadRecentAnalyses: (limit?: number) => Promise<void>;
  loadDashboard: () => Promise<void>;
  setIsRecording: (recording: boolean) => void;
  clearCurrentAnalysis: () => void;
}

export const useEmotionStore = create<EmotionState>((set, _get) => ({
  currentAnalysis: null,
  recentAnalyses: [],
  dashboard: null,
  isAnalyzing: false,
  isRecording: false,
  error: null,

  analyzeVoice: async (audioData) => {
    set({ isAnalyzing: true, error: null });
    try {
      const analysis = await emotionService.analyzeVoice(audioData);
      set((state) => ({
        currentAnalysis: analysis,
        recentAnalyses: [analysis, ...state.recentAnalyses].slice(0, 20),
        isAnalyzing: false,
      }));
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      set({ error: 'Failed to analyze voice', isAnalyzing: false });
    }
  },

  analyzeImage: async (imageData) => {
    set({ isAnalyzing: true, error: null });
    try {
      const analysis = await emotionService.analyzeEmotion(imageData);
      set((state) => ({
        currentAnalysis: analysis,
        recentAnalyses: [analysis, ...state.recentAnalyses].slice(0, 20),
        isAnalyzing: false,
      }));
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      set({ error: 'Failed to analyze image', isAnalyzing: false });
    }
  },

  loadRecentAnalyses: async (limit = 10) => {
    try {
      const analyses = await emotionService.getRecentAnalyses(limit);
      set({ recentAnalyses: analyses });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      set({ error: 'Failed to load recent analyses' });
    }
  },

  loadDashboard: async () => {
    try {
      const dashboard = await emotionService.getDashboard();
      set({ dashboard });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      set({ error: 'Failed to load dashboard' });
    }
  },

  setIsRecording: (recording) => {
    set({ isRecording: recording });
  },

  clearCurrentAnalysis: () => {
    set({ currentAnalysis: null });
  },
}));
