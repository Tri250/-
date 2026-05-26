import { create } from 'zustand';
import { HealthManual, ManualCategory, SAMPLE_MANUALS, MANUAL_CATEGORIES } from '../types/health-manual';

interface HealthManualStore {
  manuals: HealthManual[];
  categories: typeof MANUAL_CATEGORIES;
  selectedCategory: ManualCategory | null;
  currentManualId: string | null;
  bookmarks: string[];
  searchQuery: string;
  petTypeFilter: 'dog' | 'cat' | 'both';
  
  // Actions
  setSelectedCategory: (category: ManualCategory | null) => void;
  setCurrentManual: (id: string | null) => void;
  toggleBookmark: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setPetTypeFilter: (type: 'dog' | 'cat' | 'both') => void;
  
  getFilteredManuals: () => HealthManual[];
  getCurrentManual: () => HealthManual | null;
  getPopularManuals: () => HealthManual[];
  getBookmarkedManuals: () => HealthManual[];
}

export const useHealthManualStore = create<HealthManualStore>((set, get) => ({
  manuals: SAMPLE_MANUALS,
  categories: MANUAL_CATEGORIES,
  selectedCategory: null,
  currentManualId: null,
  bookmarks: [],
  searchQuery: '',
  petTypeFilter: 'both',

  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setCurrentManual: (id) => set({ currentManualId: id }),
  toggleBookmark: (id) => set((state) => ({
    bookmarks: state.bookmarks.includes(id)
      ? state.bookmarks.filter((b) => b !== id)
      : [...state.bookmarks, id],
  })),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setPetTypeFilter: (type) => set({ petTypeFilter: type }),

  getFilteredManuals: () => {
    const state = get();
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
}));
