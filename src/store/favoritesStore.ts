/**
 * Favorites Store - 收藏管理数据存储
 *
 * 管理用户收藏的内容、文章、服务等功能
 * 支持 Capacitor 原生存储
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

// 收藏类型
export type FavoriteType = 'article' | 'service' | 'product' | 'tip' | 'video' | 'other';

// 收藏项
export interface Favorite {
  id: string;
  type: FavoriteType;
  title: string;
  description?: string;
  image?: string;
  url?: string;
  category?: string;
  tags?: string[];
  createdAt: string;
}

// 收藏分组
export interface FavoriteGroup {
  id: string;
  name: string;
  favorites: string[]; // Favorite IDs
  createdAt: string;
}

// Store 接口
interface FavoritesState {
  favorites: Favorite[];
  groups: FavoriteGroup[];
  isLoading: boolean;
  
  // 收藏操作
  addFavorite: (favorite: Omit<Favorite, 'id' | 'createdAt'>) => Promise<Favorite>;
  removeFavorite: (id: string) => Promise<void>;
  isFavorite: (url: string) => boolean;
  
  // 分组操作
  createGroup: (name: string) => FavoriteGroup;
  deleteGroup: (id: string) => void;
  addToGroup: (groupId: string, favoriteId: string) => void;
  removeFromGroup: (groupId: string, favoriteId: string) => void;
  
  // 查询
  getFavoritesByType: (type: FavoriteType) => Favorite[];
  getFavoritesByGroup: (groupId: string) => Favorite[];
  searchFavorites: (query: string) => Favorite[];
  
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

const generateId = () => `fav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      groups: [],
      isLoading: false,

      addFavorite: async (favoriteData) => {
        // 检查是否已收藏
        if (favoriteData.url && get().isFavorite(favoriteData.url)) {
          return get().favorites.find((f) => f.url === favoriteData.url)!;
        }
        
        const newFavorite: Favorite = {
          ...favoriteData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        
        set((state) => ({
          favorites: [newFavorite, ...state.favorites],
        }));
        
        return newFavorite;
      },

      removeFavorite: async (id) => {
        set((state) => ({
          favorites: state.favorites.filter((f) => f.id !== id),
          groups: state.groups.map((g) => ({
            ...g,
            favorites: g.favorites.filter((fid) => fid !== id),
          })),
        }));
      },

      isFavorite: (url) => {
        return get().favorites.some((f) => f.url === url);
      },

      createGroup: (name) => {
        const newGroup: FavoriteGroup = {
          id: generateId(),
          name,
          favorites: [],
          createdAt: new Date().toISOString(),
        };
        
        set((state) => ({
          groups: [...state.groups, newGroup],
        }));
        
        return newGroup;
      },

      deleteGroup: (id) => {
        set((state) => ({
          groups: state.groups.filter((g) => g.id !== id),
        }));
      },

      addToGroup: (groupId, favoriteId) => {
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId && !g.favorites.includes(favoriteId)
              ? { ...g, favorites: [...g.favorites, favoriteId] }
              : g
          ),
        }));
      },

      removeFromGroup: (groupId, favoriteId) => {
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? { ...g, favorites: g.favorites.filter((id) => id !== favoriteId) }
              : g
          ),
        }));
      },

      getFavoritesByType: (type) => {
        return get().favorites.filter((f) => f.type === type);
      },

      getFavoritesByGroup: (groupId) => {
        const group = get().groups.find((g) => g.id === groupId);
        if (!group) return [];
        return get().favorites.filter((f) => group.favorites.includes(f.id));
      },

      searchFavorites: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().favorites.filter((f) =>
          f.title.toLowerCase().includes(lowerQuery) ||
          (f.description?.toLowerCase().includes(lowerQuery)) ||
          (f.tags?.some((t) => t.toLowerCase().includes(lowerQuery)))
        );
      },

      initialize: async () => {
        set({ isLoading: true });
        set({ isLoading: false });
      },
    }),
    {
      name: 'pawsync-favorites-store',
      storage: createJSONStorage(() => capacitorStorage),
      partialize: (state) => ({
        favorites: state.favorites,
        groups: state.groups,
      }),
    }
  )
);