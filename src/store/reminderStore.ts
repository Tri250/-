import { create } from 'zustand';
import { Reminder, ReminderType, REMINDER_TYPES } from '../types/reminder';

interface ReminderStore {
  reminders: Reminder[];
  selectedType: ReminderType | null;
  viewMode: 'today' | 'week' | 'all';
  
  // Actions
  addReminder: (reminder: Omit<Reminder, 'id' | 'isCompleted' | 'createdAt'>) => void;
  updateReminder: (id: string, updates: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
  toggleComplete: (id: string) => void;
  
  setSelectedType: (type: ReminderType | null) => void;
  setViewMode: (mode: 'today' | 'week' | 'all') => void;
  
  getFilteredReminders: (petId: string) => Reminder[];
  getUpcomingReminders: (petId: string, limit: number) => Reminder[];
}

// 示例数据
const INITIAL_REMINDERS: Reminder[] = [
  {
    id: '1',
    petId: '1',
    type: 'vaccine',
    title: '三联疫苗接种',
    notes: '需要提前半小时到医院',
    date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    time: '10:00',
    repeat: 'once',
    isCompleted: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    petId: '1',
    type: 'deworming',
    title: '体内驱虫',
    date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    time: '09:00',
    repeat: 'monthly',
    isCompleted: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    petId: '2',
    type: 'bath',
    title: '洗澡',
    date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    time: '14:00',
    repeat: 'weekly',
    isCompleted: false,
    createdAt: new Date().toISOString(),
  },
];

export const useReminderStore = create<ReminderStore>((set, get) => ({
  reminders: INITIAL_REMINDERS,
  selectedType: null,
  viewMode: 'all',

  addReminder: (reminder) => {
    const newReminder: Reminder = {
      ...reminder,
      id: Date.now().toString(),
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      reminders: [...state.reminders, newReminder],
    }));
  },

  updateReminder: (id, updates) => {
    set((state) => ({
      reminders: state.reminders.map((reminder) =>
        reminder.id === id ? { ...reminder, ...updates } : reminder
      ),
    }));
  },

  deleteReminder: (id) => {
    set((state) => ({
      reminders: state.reminders.filter((reminder) => reminder.id !== id),
    }));
  },

  toggleComplete: (id) => {
    set((state) => ({
      reminders: state.reminders.map((reminder) =>
        reminder.id === id
          ? {
              ...reminder,
              isCompleted: !reminder.isCompleted,
              completedAt: !reminder.isCompleted ? new Date().toISOString() : undefined,
            }
          : reminder
      ),
    }));
  },

  setSelectedType: (type) => set({ selectedType: type }),
  setViewMode: (mode) => set({ viewMode: mode }),

  getFilteredReminders: (petId) => {
    const state = get();
    let filtered = state.reminders.filter((r) => r.petId === petId);
    
    if (state.selectedType) {
      filtered = filtered.filter((r) => r.type === state.selectedType);
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    if (state.viewMode === 'today') {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      filtered = filtered.filter((r) => {
        const reminderDate = new Date(r.date);
        return reminderDate >= today && reminderDate < tomorrow;
      });
    } else if (state.viewMode === 'week') {
      filtered = filtered.filter((r) => {
        const reminderDate = new Date(r.date);
        return reminderDate >= today && reminderDate < weekEnd;
      });
    }
    
    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  getUpcomingReminders: (petId, limit) => {
    const state = get();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return state.reminders
      .filter((r) => r.petId === petId && !r.isCompleted && new Date(r.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, limit);
  },
}));
