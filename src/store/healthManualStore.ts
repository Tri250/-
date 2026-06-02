import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { HealthManual, ManualCategory, SAMPLE_MANUALS, MANUAL_CATEGORIES } from '../types/health-manual';

interface SearchResult extends HealthManual {
  relevanceScore: number;
  matchedFields: string[];
}

interface BookmarkFolder {
  id: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
}

interface OfflineCache {
  manualId: string;
  cachedAt: string;
  content: string;
}

interface HealthManualStore {
  manuals: HealthManual[];
  categories: typeof MANUAL_CATEGORIES;
  selectedCategory: ManualCategory | null;
  currentManualId: string | null;
  bookmarks: string[];
  bookmarkFolders: BookmarkFolder[];
  folderBookmarks: Record<string, string[]>;
  searchQuery: string;
  petTypeFilter: 'dog' | 'cat' | 'both';
  searchResults: SearchResult[];
  isSearching: boolean;
  lastSearchTime: number;
  offlineCache: OfflineCache[];
  isOfflineMode: boolean;
  
  setSelectedCategory: (category: ManualCategory | null) => void;
  setCurrentManual: (id: string | null) => void;
  toggleBookmark: (id: string) => void;
  addToFolder: (manualId: string, folderId: string) => void;
  removeFromFolder: (manualId: string, folderId: string) => void;
  createFolder: (name: string) => void;
  updateFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setPetTypeFilter: (type: 'dog' | 'cat' | 'both') => void;
  performSearch: (query: string) => void;
  highlightText: (text: string, query: string) => string;
  cacheForOffline: (manualId: string) => void;
  removeFromCache: (manualId: string) => void;
  isCached: (manualId: string) => boolean;
  getCachedManual: (manualId: string) => OfflineCache | null;
  setOfflineMode: (enabled: boolean) => void;
  
  getFilteredManuals: () => HealthManual[];
  getCurrentManual: () => HealthManual | null;
  getPopularManuals: () => HealthManual[];
  getBookmarkedManuals: () => HealthManual[];
  getCategoryArticleCount: (category: ManualCategory) => number;
  getFolderManuals: (folderId: string) => HealthManual[];
}

function calculateRelevance(manual: HealthManual, query: string): number {
  const lowerQuery = query.toLowerCase();
  let score = 0;
  
  if (manual.title.toLowerCase().includes(lowerQuery)) {
    score += 100;
    if (manual.title.toLowerCase().startsWith(lowerQuery)) {
      score += 50;
    }
  }
  
  if (manual.summary.toLowerCase().includes(lowerQuery)) {
    score += 60;
  }
  
  if (manual.content.toLowerCase().includes(lowerQuery)) {
    const occurrences = (manual.content.toLowerCase().match(new RegExp(lowerQuery, 'g')) || []).length;
    score += Math.min(40, occurrences * 10);
  }
  
  const matchingTags = manual.tags.filter(tag => tag.toLowerCase().includes(lowerQuery));
  score += matchingTags.length * 30;
  
  if (manual.isPopular) {
    score += 20;
  }
  
  if (manual.verifiedByVet) {
    score += 15;
  }
  
  if (manual.updatedAt) {
    const updateDate = new Date(manual.updatedAt);
    const now = new Date();
    const daysSinceUpdate = (now.getTime() - updateDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 30) {
      score += 10;
    } else if (daysSinceUpdate < 90) {
      score += 5;
    }
  }
  
  return score;
}

function getMatchedFields(manual: HealthManual, query: string): string[] {
  const lowerQuery = query.toLowerCase();
  const fields: string[] = [];
  
  if (manual.title.toLowerCase().includes(lowerQuery)) fields.push('title');
  if (manual.summary.toLowerCase().includes(lowerQuery)) fields.push('summary');
  if (manual.content.toLowerCase().includes(lowerQuery)) fields.push('content');
  if (manual.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) fields.push('tags');
  
  return fields;
}

export const useHealthManualStore = create<HealthManualStore>()(
  persist(
    (set, get) => ({
      manuals: SAMPLE_MANUALS,
      categories: MANUAL_CATEGORIES,
      selectedCategory: null,
      currentManualId: null,
      bookmarks: [],
      bookmarkFolders: [
        { id: 'default', name: '默认收藏', createdAt: new Date().toISOString() }
      ],
      folderBookmarks: {},
      searchQuery: '',
      petTypeFilter: 'both',
      searchResults: [],
      isSearching: false,
      lastSearchTime: 0,
      offlineCache: [],
      isOfflineMode: false,

      setSelectedCategory: (category) => set({ selectedCategory: category }),
      setCurrentManual: (id) => set({ currentManualId: id }),
      toggleBookmark: (id) => set((state) => ({
        bookmarks: state.bookmarks.includes(id)
          ? state.bookmarks.filter((b) => b !== id)
          : [...state.bookmarks, id],
      })),
      
      addToFolder: (manualId, folderId) => set((state) => {
        const currentFolderBookmarks = state.folderBookmarks[folderId] || [];
        if (currentFolderBookmarks.includes(manualId)) return state;
        return {
          folderBookmarks: {
            ...state.folderBookmarks,
            [folderId]: [...currentFolderBookmarks, manualId],
          },
          bookmarks: state.bookmarks.includes(manualId) ? state.bookmarks : [...state.bookmarks, manualId],
        };
      }),
      
      removeFromFolder: (manualId, folderId) => set((state) => {
        const currentFolderBookmarks = state.folderBookmarks[folderId] || [];
        return {
          folderBookmarks: {
            ...state.folderBookmarks,
            [folderId]: currentFolderBookmarks.filter(id => id !== manualId),
          },
        };
      }),
      
      createFolder: (name) => set((state) => ({
        bookmarkFolders: [...state.bookmarkFolders, {
          id: Date.now().toString(),
          name,
          createdAt: new Date().toISOString(),
        }],
      })),
      
      updateFolder: (id, name) => set((state) => ({
        bookmarkFolders: state.bookmarkFolders.map(folder =>
          folder.id === id ? { ...folder, name, updatedAt: new Date().toISOString() } : folder
        ),
      })),
      
      deleteFolder: (id) => set((state) => {
        if (id === 'default') return state;
        const newFolderBookmarks = { ...state.folderBookmarks };
        delete newFolderBookmarks[id];
        return {
          bookmarkFolders: state.bookmarkFolders.filter(folder => folder.id !== id),
          folderBookmarks: newFolderBookmarks,
        };
      }),
  })),
  setSearchQuery: (query) => {
    set({ searchQuery: query });
    if (query.trim().length > 0) {
      get().performSearch(query);
    } else {
      set({ searchResults: [], isSearching: false });
    }
  },
  setPetTypeFilter: (type) => set({ petTypeFilter: type }),

  performSearch: (query) => {
    const startTime = performance.now();
    set({ isSearching: true });
    
    const state = get();
    let manualsToSearch = [...state.manuals];
    
    if (state.selectedCategory) {
      manualsToSearch = manualsToSearch.filter((m) => m.category === state.selectedCategory);
    }
    
    if (state.petTypeFilter !== 'both') {
      manualsToSearch = manualsToSearch.filter((m) => 
        m.forType === state.petTypeFilter || m.forType === 'both'
      );
    }
    
    const results: SearchResult[] = manualsToSearch
      .map((manual) => ({
        ...manual,
        relevanceScore: calculateRelevance(manual, query),
        matchedFields: getMatchedFields(manual, query),
      }))
      .filter((result) => result.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    const endTime = performance.now();
    const searchTime = endTime - startTime;
    
    set({ 
      searchResults: results,
      isSearching: false,
      lastSearchTime: searchTime,
    });
  },

  highlightText: (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    
    let result = '';
    let lastIndex = 0;
    let index = lowerText.indexOf(lowerQuery);
    
    while (index !== -1) {
      result += text.slice(lastIndex, index);
      result += `<mark class="bg-yellow-200 px-0.5 rounded">${text.slice(index, index + query.length)}</mark>`;
      lastIndex = index + query.length;
      index = lowerText.indexOf(lowerQuery, lastIndex);
    }
    
    result += text.slice(lastIndex);
    return result;
  },

  getFilteredManuals: () => {
    const state = get();
    
    if (state.searchQuery.trim().length > 0 && state.searchResults.length > 0) {
      return state.searchResults;
    }
    
    let filtered = [...state.manuals];
    
    if (state.selectedCategory) {
      filtered = filtered.filter((m) => m.category === state.selectedCategory);
    }
    
    if (state.petTypeFilter !== 'both') {
      filtered = filtered.filter((m) => 
        m.forType === state.petTypeFilter || m.forType === 'both'
      );
    }
    
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) => 
          m.title.toLowerCase().includes(query) || 
          m.summary.toLowerCase().includes(query) ||
          m.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  },

      getCurrentManual: () => {
        const state = get();
        return state.manuals.find((m) => m.id === state.currentManualId) || null;
      },

      getPopularManuals: () => get().manuals.filter((m) => m.isPopular).slice(0, 5),
      getBookmarkedManuals: () => get().manuals.filter((m) => get().bookmarks.includes(m.id)),
      getCategoryArticleCount: (category) => get().manuals.filter((m) => m.category === category).length,
      getFolderManuals: (folderId) => {
        const state = get();
        const folderBookmarks = state.folderBookmarks[folderId] || [];
        return state.manuals.filter((m) => folderBookmarks.includes(m.id));
      },
      
      cacheForOffline: (manualId) => set((state) => {
        const manual = state.manuals.find(m => m.id === manualId);
        if (!manual) return state;
        
        const existingCache = state.offlineCache.find(c => c.manualId === manualId);
        if (existingCache) return state;
        
        return {
          offlineCache: [...state.offlineCache, {
            manualId,
            cachedAt: new Date().toISOString(),
            content: manual.content,
          }],
        };
      }),
      
      removeFromCache: (manualId) => set((state) => ({
        offlineCache: state.offlineCache.filter(c => c.manualId !== manualId),
      })),
      
      isCached: (manualId) => get().offlineCache.some(c => c.manualId === manualId),
      
      getCachedManual: (manualId) => get().offlineCache.find(c => c.manualId === manualId) || null,
      
      setOfflineMode: (enabled) => set({ isOfflineMode: enabled }),
    }),
    {
      name: 'health-manual-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        bookmarks: state.bookmarks,
        bookmarkFolders: state.bookmarkFolders,
        folderBookmarks: state.folderBookmarks,
        offlineCache: state.offlineCache,
        isOfflineMode: state.isOfflineMode,
      }),
    }
  )
);
