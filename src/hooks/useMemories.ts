// ============================================
// PawSync Pro 3.0 - useMemories Hook
//
// 作者: 带娃的小陈工
// 日期: 2026-06-10
// 描述: 回忆数据管理 Hook - 加载、上传、删除回忆
// ============================================

import { useState, useCallback } from 'react';
import { api } from '../lib/api';
import type { MemoryItem, Milestone } from '../types/bond';

// API 响应类型
interface MemoriesResponse {
  memories: MemoryItem[];
  milestones: Milestone[];
}

interface MemoryUploadResponse {
  memory: MemoryItem;
}

// Hook 返回类型
interface UseMemoriesReturn {
  memories: MemoryItem[];
  milestones: Milestone[];
  loading: boolean;
  error: string | null;
  loadMemories: (petId: string) => Promise<void>;
  uploadMemory: (petId: string, files: File[], metadata: MemoryUploadMetadata) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
}

// 上传元数据类型
interface MemoryUploadMetadata {
  title?: string;
  description?: string;
  type?: 'photo' | 'video' | 'voice' | 'milestone';
  location?: string;
  tags?: string[];
  isAiHighlight?: boolean;
}

/**
 * 回忆数据管理 Hook
 * 提供加载、上传、删除回忆的功能
 */
export function useMemories(): UseMemoriesReturn {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 加载回忆数据
   * @param petId 宠物 ID
   */
  const loadMemories = useCallback(async (petId: string) => {
    setLoading(true);
    setError(null);

    try {
      // 调用 API 获取回忆数据
      const response = await api.get<MemoriesResponse>(`/memories?petId=${petId}`);
      
      setMemories(response.memories || []);
      setMilestones(response.milestones || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载回忆数据失败';
      setError(errorMessage);
      console.error('加载回忆数据失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 上传回忆
   * @param petId 宠物 ID
   * @param files 文件列表
   * @param metadata 元数据
   */
  const uploadMemory = useCallback(async (
    petId: string,
    files: File[],
    metadata: MemoryUploadMetadata
  ) => {
    setLoading(true);
    setError(null);

    try {
      // 创建 FormData 用于文件上传
      const formData = new FormData();
      
      // 添加文件
      files.forEach((file, index) => {
        formData.append(`file${index}`, file);
      });

      // 添加元数据
      formData.append('petId', petId);
      if (metadata.title) formData.append('title', metadata.title);
      if (metadata.description) formData.append('description', metadata.description);
      if (metadata.type) formData.append('type', metadata.type);
      if (metadata.location) formData.append('location', metadata.location);
      if (metadata.tags) formData.append('tags', JSON.stringify(metadata.tags));
      if (metadata.isAiHighlight) formData.append('isAiHighlight', 'true');

      // 使用 fetch 直接上传 FormData
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const token = api.getToken();

      const response = await fetch(`${apiBaseUrl}/memories/upload`, {
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

      const result: MemoryUploadResponse = await response.json();
      
      // 将新回忆添加到列表
      setMemories(prev => [result.memory, ...prev]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '上传回忆失败';
      setError(errorMessage);
      console.error('上传回忆失败:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 删除回忆
   * @param id 回忆 ID
   */
  const deleteMemory = useCallback(async (id: string) => {
    setError(null);

    try {
      await api.delete(`/memories/${id}`);
      
      // 从列表中移除
      setMemories(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除回忆失败';
      setError(errorMessage);
      console.error('删除回忆失败:', err);
      throw err;
    }
  }, []);

  /**
   * 切换收藏状态
   * @param id 回忆 ID
   */
  const toggleFavorite = useCallback(async (id: string) => {
    setError(null);

    try {
      const response = await api.post<{ memory: MemoryItem }>(`/memories/${id}/favorite`);
      
      // 更新列表中的收藏状态
      setMemories(prev => prev.map(m => 
        m.id === id ? response.memory : m
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '切换收藏失败';
      setError(errorMessage);
      console.error('切换收藏失败:', err);
    }
  }, []);

  return {
    memories,
    milestones,
    loading,
    error,
    loadMemories,
    uploadMemory,
    deleteMemory,
    toggleFavorite,
  };
}

export default useMemories;