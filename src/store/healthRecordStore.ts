// ============================================
// PawSync Pro - healthRecordStore.ts (真实数据版)
// 使用 IndexedDB 替代 mock 数据
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { healthRecordDB } from '../lib/db';

export interface HealthTag {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface HealthRecord {
  id: string;
  petId: string;
  type: 'text' | 'photo' | 'voice' | 'video' | 'file' | 'pdf';
  title: string;
  content: string;
  tags: string[];
  attachments?: string[];
  voiceDuration?: number;
  voiceTranscription?: string;
  pdfFileName?: string;
  createdAt: string;
  updatedAt: string;
  isImportant: boolean;
}

export const DEFAULT_TAGS: HealthTag[] = [
  { id: 'checkup', name: '体检', color: 'bg-blue-500', icon: 'Stethoscope' },
  { id: 'vaccine', name: '疫苗', color: 'bg-green-500', icon: 'Syringe' },
  { id: 'medicine', name: '用药', color: 'bg-yellow-500', icon: 'Pill' },
  { id: 'food', name: '饮食', color: 'bg-orange-500', icon: 'Utensils' },
  { id: 'behavior', name: '行为', color: 'bg-purple-500', icon: 'Activity' },
  { id: 'abnormal', name: '异常', color: 'bg-red-500', icon: 'AlertCircle' },
];

interface HealthRecordStore {
  records: HealthRecord[];
  tags: HealthTag[];
  selectedTag: string | null;
  searchQuery: string;
  customTags: HealthTag[];
  isLoading: boolean;
  
  // Actions
  loadRecords: (petId: string) => Promise<void>;
  addRecord: (record: Omit<HealthRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateRecord: (id: string, updates: Partial<HealthRecord>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  toggleImportant: (id: string) => Promise<void>;
  addTag: (tag: Omit<HealthTag, 'id'>) => void;
  deleteTag: (id: string) => void;
  setSelectedTag: (tagId: string | null) => void;
  setSearchQuery: (query: string) => void;
  getFilteredRecords: (petId: string) => HealthRecord[];
  getFilteredRecordsByTags: (petId: string, tagIds: string[]) => HealthRecord[];
  getImportantRecords: (petId: string) => HealthRecord[];
  getRecentRecords: (petId: string, limit?: number) => HealthRecord[];
}

export const useHealthRecordStore = create<HealthRecordStore>()(
  persist(
    (set, get) => ({
      records: [],
      tags: DEFAULT_TAGS,
      selectedTag: null,
      searchQuery: '',
      customTags: [],
      isLoading: false,

      loadRecords: async (petId: string) => {
        set({ isLoading: true });
        try {
          const records = await healthRecordDB.getByIndex('petId', petId);
          // 按时间排序
          const sortedRecords = (records as HealthRecord[]).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          set({ records: sortedRecords, isLoading: false });
        } catch (error) {
          console.error('加载健康记录失败:', error);
          set({ isLoading: false });
        }
      },

      addRecord: async (record) => {
        const newRecord: HealthRecord = {
          ...record,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        await healthRecordDB.create(newRecord);
        
        set((state) => ({
          records: [newRecord, ...state.records],
        }));
      },

      updateRecord: async (id, updates) => {
        const { records } = get();
        const record = records.find(r => r.id === id);
        if (!record) return;

        const updatedRecord = {
          ...record,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        await healthRecordDB.update(id, updatedRecord);
        
        set((state) => ({
          records: state.records.map((r) =>
            r.id === id ? updatedRecord : r
          ),
        }));
      },

      deleteRecord: async (id) => {
        await healthRecordDB.delete(id);
        
        set((state) => ({
          records: state.records.filter((r) => r.id !== id),
        }));
      },

      toggleImportant: async (id) => {
        const { records } = get();
        const record = records.find(r => r.id === id);
        if (!record) return;

        const updatedRecord = { ...record, isImportant: !record.isImportant };
        await healthRecordDB.update(id, updatedRecord);
        
        set((state) => ({
          records: state.records.map((r) =>
            r.id === id ? updatedRecord : r
          ),
        }));
      },

      addTag: (tag) => {
        const newTag: HealthTag = {
          ...tag,
          id: `custom-${Date.now()}`,
        };
        set((state) => ({
          tags: [...state.tags, newTag],
          customTags: [...state.customTags, newTag],
        }));
      },

      deleteTag: (id) => {
        set((state) => ({
          tags: state.tags.filter((tag) => tag.id !== id),
          customTags: state.customTags.filter((tag) => tag.id !== id),
        }));
      },

      setSelectedTag: (tagId) => set({ selectedTag: tagId }),
      setSearchQuery: (query) => set({ searchQuery: query }),

      getFilteredRecords: (petId) => {
        const { records, selectedTag, searchQuery } = get();
        let filtered = records.filter((r) => r.petId === petId);
        
        if (selectedTag) {
          filtered = filtered.filter((r) => r.tags.includes(selectedTag));
        }
        
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(
            (r) =>
              r.title.toLowerCase().includes(query) ||
              r.content.toLowerCase().includes(query) ||
              (r.voiceTranscription && r.voiceTranscription.toLowerCase().includes(query)) ||
              (r.pdfFileName && r.pdfFileName.toLowerCase().includes(query))
          );
        }
        
        return filtered.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      },

      getFilteredRecordsByTags: (petId, tagIds) => {
        const { records, searchQuery } = get();
        let filtered = records.filter((r) => r.petId === petId);
        
        if (tagIds.length > 0) {
          filtered = filtered.filter((r) =>
            tagIds.some((tagId) => r.tags.includes(tagId))
          );
        }
        
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(
            (r) =>
              r.title.toLowerCase().includes(query) ||
              r.content.toLowerCase().includes(query)
          );
        }
        
        return filtered.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      },

      getImportantRecords: (petId) => {
        const { records } = get();
        return records
          .filter((r) => r.petId === petId && r.isImportant)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },

      getRecentRecords: (petId, limit = 5) => {
        const { records } = get();
        return records
          .filter((r) => r.petId === petId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit);
      },
    }),
    {
      name: 'health-record-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tags: state.tags,
        customTags: state.customTags,
        selectedTag: state.selectedTag,
        searchQuery: state.searchQuery,
      }),
    }
  )
);
