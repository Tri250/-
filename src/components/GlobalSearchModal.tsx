import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, X, FileText, Calendar, PawPrint, BookOpen, Bot, ChevronRight, Clock, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePetStore } from '../store/petStore';
import { useHealthRecordStore } from '../store/healthRecordStore';
import { useReminderStore } from '../store/reminderStore';
import { useAppStore } from '../store/appStore';

interface SearchResult {
  id: string;
  type: 'pet' | 'record' | 'reminder' | 'manual' | 'ai';
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  onClick: () => void;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string, params?: any) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const { pets } = usePetStore();
  const { records } = useHealthRecordStore();
  const { reminders } = useReminderStore();
  const { currentPetId } = useAppStore();

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('recentSearches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    }
  }, [isOpen]);

  const searchResults = useMemo<SearchResult[]>(() => {
    if (!query.trim() || query.length < 1) return [];
    
    const q = query.toLowerCase();
    const results: SearchResult[] = [];

    pets.forEach(pet => {
      if (
        pet.name.toLowerCase().includes(q) ||
        pet.breed?.toLowerCase().includes(q)
      ) {
        results.push({
          id: `pet-${pet.id}`,
          type: 'pet',
          title: pet.name,
          subtitle: `${pet.breed || pet.type} · ${pet.gender === 'MALE' ? '公' : '母'}`,
          icon: PawPrint,
          color: 'text-rose-500',
          onClick: () => {
            onNavigate('pets', { petId: pet.id });
            onClose();
          }
        });
      }
    });

    records.forEach(record => {
      if (
        record.title.toLowerCase().includes(q) ||
        record.content?.toLowerCase().includes(q) ||
        record.tags?.some(tag => tag.toLowerCase().includes(q))
      ) {
        results.push({
          id: `record-${record.id}`,
          type: 'record',
          title: record.title,
          subtitle: `${record.type} · ${new Date(record.createdAt).toLocaleDateString()}`,
          icon: FileText,
          color: 'text-blue-500',
          onClick: () => {
            onNavigate('health-records', { recordId: record.id });
            onClose();
          }
        });
      }
    });

    reminders.forEach(reminder => {
      if (
        reminder.title.toLowerCase().includes(q) ||
        reminder.notes?.toLowerCase().includes(q)
      ) {
        results.push({
          id: `reminder-${reminder.id}`,
          type: 'reminder',
          title: reminder.title,
          subtitle: `${reminder.date} ${reminder.time} · ${reminder.type}`,
          icon: Calendar,
          color: 'text-amber-500',
          onClick: () => {
            onNavigate('reminders', { reminderId: reminder.id });
            onClose();
          }
        });
      }
    });

    return results.slice(0, 20);
  }, [query, pets, records, reminders, onNavigate, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && searchResults[selectedIndex]) {
      e.preventDefault();
      searchResults[selectedIndex].onClick();
      if (query.trim()) {
        const newRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
        setRecentSearches(newRecent);
        localStorage.setItem('recentSearches', JSON.stringify(newRecent));
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [searchResults, selectedIndex, query, recentSearches, onClose]);

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      const newRecent = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
      setRecentSearches(newRecent);
      localStorage.setItem('recentSearches', JSON.stringify(newRecent));
    }
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      pet: '宠物',
      record: '健康记录',
      reminder: '提醒',
      manual: '健康手册',
      ai: 'AI咨询'
    };
    return labels[type] || type;
  };

  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    searchResults.forEach(result => {
      if (!groups[result.type]) {
        groups[result.type] = [];
      }
      groups[result.type].push(result);
    });
    return groups;
  }, [searchResults]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="max-w-2xl mx-auto mt-[10vh] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 px-4 py-4 border-b border-neutral-100 dark:border-neutral-800">
            <Search className="w-5 h-5 text-neutral-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="搜索宠物、健康记录、提醒..."
              className="flex-1 bg-transparent text-lg text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none"
              autoFocus
            />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5 text-neutral-400" />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {query.length === 0 && recentSearches.length > 0 && (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-neutral-400" />
                  <span className="text-sm font-medium text-neutral-500">最近搜索</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(search)}
                      className="px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {query.length > 0 && searchResults.length === 0 && (
              <div className="p-8 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <Search className="w-6 h-6 text-neutral-400" />
                </div>
                <p className="text-neutral-500">未找到相关结果</p>
                <p className="text-sm text-neutral-400 mt-1">尝试其他关键词</p>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="p-2">
                {Object.entries(groupedResults).map(([type, results]) => (
                  <div key={type} className="mb-4 last:mb-0">
                    <div className="px-3 py-2 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                      {getTypeLabel(type)} ({results.length})
                    </div>
                    {results.map((result, index) => {
                      const globalIndex = searchResults.indexOf(result);
                      const Icon = result.icon;
                      return (
                        <motion.button
                          key={result.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: globalIndex * 0.03 }}
                          onClick={result.onClick}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                            globalIndex === selectedIndex
                              ? 'bg-primary-50 dark:bg-primary-900/20'
                              : 'hover:bg-neutral-50 dark:hover:bg-neutral-800'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${result.color.replace('text-', 'from-')} to-neutral-100 dark:to-neutral-800 flex items-center justify-center`}>
                            <Icon className={`w-5 h-5 ${result.color}`} />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-medium text-neutral-800 dark:text-neutral-100">{result.title}</div>
                            {result.subtitle && (
                              <div className="text-sm text-neutral-500">{result.subtitle}</div>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-neutral-300" />
                        </motion.button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
            <div className="flex items-center gap-4 text-xs text-neutral-400">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">↑↓</kbd>
                选择
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">Enter</kbd>
                打开
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">ESC</kbd>
                关闭
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GlobalSearchModal;
