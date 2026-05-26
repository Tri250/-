import { create } from 'zustand';
import { HealthRecord, HealthTag, DEFAULT_TAGS } from '../types/health-record';

interface HealthRecordStore {
  records: HealthRecord[];
  tags: HealthTag[];
  selectedTag: string | null;
  searchQuery: string;
  
  // Actions
  addRecord: (record: Omit<HealthRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateRecord: (id: string, updates: Partial<HealthRecord>) => void;
  deleteRecord: (id: string) => void;
  toggleImportant: (id: string) => void;
  
  addTag: (tag: Omit<HealthTag, 'id'>) => void;
  deleteTag: (id: string) => void;
  
  setSelectedTag: (tagId: string | null) => void;
  setSearchQuery: (query: string) => void;
  
  getFilteredRecords: (petId: string) => HealthRecord[];
}

// 示例数据
const INITIAL_RECORDS: HealthRecord[] = [
  {
    id: '1',
    petId: '1',
    type: 'text',
    title: '毛球食欲不振',
    content: '今天早上发现毛球吃得比平时少，精神状态还好，继续观察。',
    tags: ['abnormal', 'food'],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    isImportant: true,
  },
  {
    id: '2',
    petId: '1',
    type: 'photo',
    title: '体检报告',
    content: '年度体检完成，各项指标正常。体重5.2kg，保持良好。',
    tags: ['checkup'],
    attachments: ['https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400'],
    createdAt: new Date(Date.now() - 604800000).toISOString(),
    updatedAt: new Date(Date.now() - 604800000).toISOString(),
    isImportant: true,
  },
  {
    id: '3',
    petId: '2',
    type: 'text',
    title: '第一次驱虫',
    content: '今天带旺财做了第一次体内外驱虫，医生说很健康。',
    tags: ['medicine'],
    createdAt: new Date(Date.now() - 2592000000).toISOString(),
    updatedAt: new Date(Date.now() - 2592000000).toISOString(),
    isImportant: false,
  },
];

export const useHealthRecordStore = create<HealthRecordStore>((set, get) => ({
  records: INITIAL_RECORDS,
  tags: DEFAULT_TAGS,
  selectedTag: null,
  searchQuery: '',

  addRecord: (record) => {
    const newRecord: HealthRecord = {
      ...record,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({
      records: [newRecord, ...state.records],
    }));
  },

  updateRecord: (id, updates) => {
    set((state) => ({
      records: state.records.map((record) =>
        record.id === id
          ? { ...record, ...updates, updatedAt: new Date().toISOString() }
          : record
      ),
    }));
  },

  deleteRecord: (id) => {
    set((state) => ({
      records: state.records.filter((record) => record.id !== id),
    }));
  },

  toggleImportant: (id) => {
    set((state) => ({
      records: state.records.map((record) =>
        record.id === id
          ? { ...record, isImportant: !record.isImportant }
          : record
      ),
    }));
  },

  addTag: (tag) => {
    const newTag: HealthTag = {
      ...tag,
      id: Date.now().toString(),
    };
    set((state) => ({
      tags: [...state.tags, newTag],
    }));
  },

  deleteTag: (id) => {
    set((state) => ({
      tags: state.tags.filter((tag) => tag.id !== id),
    }));
  },

  setSelectedTag: (tagId) => set({ selectedTag: tagId }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  getFilteredRecords: (petId) => {
    const state = get();
    let filtered = state.records.filter((r) => r.petId === petId);
    
    if (state.selectedTag) {
      filtered = filtered.filter((r) => r.tags.includes(state.selectedTag));
    }
    
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
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
}));
