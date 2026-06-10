// ============================================
// PawSync Pro 3.0 - useVoices Hook
//
// 作者: 带娃的小陈工
// 日期: 2026-06-10
// 描述: 声音记录管理 Hook - 加载、上传、分析声音
// ============================================

import { useState, useCallback } from 'react';
import { api } from '../lib/api';
import type { VoiceMemory } from '../types/bond';

// 意图识别结果类型
export interface IntentionResult {
  intention: string;           // 识别出的意图
  suggestion: string;          // AI 建议
  confidence: number;          // 置信度
  emotion: 'happy' | 'angry' | 'anxious' | 'hungry' | 'affectionate' | 'curious';
  transcription?: string;      // 转录文本
}

// 声音画像分析结果
export interface VoiceProfileAnalysis {
  voiceType: string;           // 声音类型
  frequencyRange: string;      // 频率范围
  typicalEmotions: string[];   // 常见情绪
  communicationPatterns: string[]; // 沟通模式
  recommendations: string[];   // 建议
}

// API 响应类型
interface VoicesResponse {
  voices: VoiceMemory[];
}

interface VoiceUploadResponse {
  voice: VoiceMemory;
  analysis: IntentionResult;
}

interface VoiceAnalysisResponse {
  analysis: IntentionResult;
  profile: VoiceProfileAnalysis;
}

// Hook 返回类型
interface UseVoicesReturn {
  voices: VoiceMemory[];
  loading: boolean;
  error: string | null;
  loadVoices: (petId: string) => Promise<void>;
  uploadVoice: (audioBlob: Blob, petId: string) => Promise<IntentionResult>;
  analyzeVoice: (id: string) => Promise<VoiceAnalysisResult>;
  deleteVoice: (id: string) => Promise<void>;
  setAsNotification: (id: string) => Promise<void>;
}

// 声音分析结果类型
interface VoiceAnalysisResult {
  intention: IntentionResult;
  profile?: VoiceProfileAnalysis;
}

/**
 * 声音记录管理 Hook
 * 提供加载、上传、分析声音的功能
 */
export function useVoices(): UseVoicesReturn {
  const [voices, setVoices] = useState<VoiceMemory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 加载声音记录
   * @param petId 宠物 ID
   */
  const loadVoices = useCallback(async (petId: string) => {
    setLoading(true);
    setError(null);

    try {
      // 调用 API 获取声音记录
      const response = await api.get<VoicesResponse>(`/voices?petId=${petId}`);
      
      setVoices(response.voices || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载声音记录失败';
      setError(errorMessage);
      console.error('加载声音记录失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 上传声音
   * @param audioBlob 音频 Blob
   * @param petId 宠物 ID
   * @returns 意图识别结果
   */
  const uploadVoice = useCallback(async (
    audioBlob: Blob,
    petId: string
  ): Promise<IntentionResult> => {
    setLoading(true);
    setError(null);

    try {
      // 创建 FormData 用于文件上传
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('petId', petId);

      // 使用 fetch 直接上传 FormData
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const token = api.getToken();

      const response = await fetch(`${apiBaseUrl}/voices/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '上传失败' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result: VoiceUploadResponse = await response.json();
      
      // 将新声音添加到列表
      setVoices(prev => [result.voice, ...prev]);
      
      // 返回意图识别结果
      return result.analysis;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '上传声音失败';
      setError(errorMessage);
      console.error('上传声音失败:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 分析声音
   * @param id 声音 ID
   * @returns 分析结果（意图 + 声音画像）
   */
  const analyzeVoice = useCallback(async (id: string): Promise<VoiceAnalysisResult> => {
    setLoading(true);
    setError(null);

    try {
      // 调用 API 分析声音
      const response = await api.post<VoiceAnalysisResponse>(`/voices/${id}/analyze`);
      
      // 更新声音记录的分析结果
      setVoices(prev => prev.map(v => {
        if (v.id === id) {
          return {
            ...v,
            transcription: response.analysis.transcription,
            translation: response.analysis.suggestion,
            emotion: response.analysis.emotion,
          };
        }
        return v;
      }));

      return {
        intention: response.analysis,
        profile: response.profile,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '分析声音失败';
      setError(errorMessage);
      console.error('分析声音失败:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 删除声音
   * @param id 声音 ID
   */
  const deleteVoice = useCallback(async (id: string) => {
    setError(null);

    try {
      await api.delete(`/voices/${id}`);
      
      // 从列表中移除
      setVoices(prev => prev.filter(v => v.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除声音失败';
      setError(errorMessage);
      console.error('删除声音失败:', err);
      throw err;
    }
  }, []);

  /**
   * 设置为通知音
   * @param id 声音 ID
   */
  const setAsNotification = useCallback(async (id: string) => {
    setError(null);

    try {
      const response = await api.post<{ voices: VoiceMemory[] }>(`/voices/${id}/set-notification`);
      
      // 更新所有声音的通知状态
      setVoices(response.voices || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '设置通知音失败';
      setError(errorMessage);
      console.error('设置通知音失败:', err);
    }
  }, []);

  return {
    voices,
    loading,
    error,
    loadVoices,
    uploadVoice,
    analyzeVoice,
    deleteVoice,
    setAsNotification,
  };
}

export default useVoices;