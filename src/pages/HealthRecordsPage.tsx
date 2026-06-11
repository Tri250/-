// ============================================
// PawSync Pro - HealthRecordsPage.tsx
//
// 描述: 健康记录页面 - 奶油色/米色温暖设计风格
// 顶部标题+分类筛选条+日期分组时间线+底部统计
// ============================================

import React, { useState, useMemo } from 'react';
import {
  Utensils,
  Droplet,
  Activity,
  Heart,
  MoreHorizontal,
  Calendar as CalendarIcon,
  Plus,
  Search,
  ChevronDown,
  X,
} from 'lucide-react';
import { AddRecordModal } from '../components/AddRecordModal';
import { useHealthRecordStore } from '../store/healthRecordStore';
import { usePetStore } from '../store/petStore';
import { RecordType } from '../types/health-record';
import { cn } from '../lib/utils';

interface HealthRecordsPageProps {
  onNavigate: (page: string) => void;
}

type CategoryKey = 'all' | 'feeding' | 'water' | 'activity' | 'health' | 'other';

const categoryConfig: Record<CategoryKey, {
  label: string;
  icon: React.ElementType;
  bgColor: string;
  iconColor: string;
}> = {
  all: { label: '全部', icon: MoreHorizontal, bgColor: 'bg-cream-200', iconColor: 'text-neutral-700' },
  feeding: { label: '喂食', icon: Utensils, bgColor: 'bg-orange-50', iconColor: 'text-primary-500' },
  water: { label: '饮水', icon: Droplet, bgColor: 'bg-blue-50', iconColor: 'text-info-500' },
  activity: { label: '活动', icon: Activity, bgColor: 'bg-emerald-50', iconColor: 'text-success-500' },
  health: { label: '健康', icon: Heart, bgColor: 'bg-rose-50', iconColor: 'text-danger-500' },
  other: { label: '其他', icon: MoreHorizontal, bgColor: 'bg-violet-50', iconColor: 'text-secondary-500' },
};

const categoryToTags: Record<CategoryKey, string[]> = {
  all: [],
  feeding: ['food'],
  water: ['medicine'],
  activity: ['checkup'],
  health: ['abnormal', 'vaccine', 'vomit', 'diarrhea'],
  other: ['grooming'],
};

const typeIconMap: Record<string, { icon: React.ElementType; bg: string; color: string }> = {
  text: { icon: Heart, bg: 'bg-orange-50', color: 'text-primary-500' },
  voice: { icon: Activity, bg: 'bg-violet-50', color: 'text-secondary-500' },
  photo: { icon: Heart, bg: 'bg-emerald-50', color: 'text-success-500' },
  video: { icon: Heart, bg: 'bg-rose-50', color: 'text-danger-500' },
  pdf: { icon: Heart, bg: 'bg-amber-50', color: 'text-warning-500' },
  file: { icon: Heart, bg: 'bg-blue-50', color: 'text-info-500' },
};

const HealthRecordsPage: React.FC<HealthRecordsPageProps> = ({ onNavigate }) => {
  const {
    records,
    tags,
    searchQuery,
    getFilteredRecords,
    setSearchQuery,
    addRecord,
  } = useHealthRecordStore();
  const { currentPetId } = usePetStore();
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecordType, setSelectedRecordType] = useState<RecordType>('text');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('全部日期');

  const allRecords = useMemo(() => {
    const petId = currentPetId || '1';
    return getFilteredRecords(petId);
  }, [currentPetId, getFilteredRecords, records, searchQuery]);

  const filteredRecords = useMemo(() => {
    if (activeCategory === 'all') return allRecords;
    const tagSet = categoryToTags[activeCategory];
    return allRecords.filter((r) => r.tags.some((t) => tagSet.includes(t)));
  }, [allRecords, activeCategory]);

  // 按日期分组
  const groupedRecords = useMemo(() => {
    const groups: Record<string, typeof filteredRecords> = {};
    filteredRecords.forEach((record) => {
      const d = new Date(record.createdAt);
      const dateKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(record);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredRecords]);

  // 统计摘要
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryKey, number> = {
      all: allRecords.length,
      feeding: 0,
      water: 0,
      activity: 0,
      health: 0,
      other: 0,
    };
    allRecords.forEach((r) => {
      (Object.keys(categoryToTags) as CategoryKey[]).forEach((key) => {
        if (key === 'all') return;
        const tagSet = categoryToTags[key];
        if (r.tags.some((t) => tagSet.includes(t))) {
          counts[key]++;
        }
      });
    });
    return counts;
  }, [allRecords]);

  const handleAddRecord = (type: RecordType) => {
    setSelectedRecordType(type);
    setIsModalOpen(true);
  };

  const handleModalSubmit = (recordData: {
    type: RecordType;
    title: string;
    content: string;
    tags: string[];
    isImportant: boolean;
    attachments?: string[];
    voiceDuration?: number;
    voiceTranscription?: string;
    pdfFileName?: string;
  }) => {
    if (!currentPetId) return;

    addRecord({
      petId: currentPetId,
      type: recordData.type,
      title: recordData.title,
      content: recordData.content,
      tags: recordData.tags,
      isImportant: recordData.isImportant,
      attachments: recordData.attachments,
      voiceDuration: recordData.voiceDuration,
      voiceTranscription: recordData.voiceTranscription,
      pdfFileName: recordData.pdfFileName,
    });

    setIsModalOpen(false);
  };

  const formatDateLabel = (dateKey: string): string => {
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = `${yesterday.getFullYear()}-${(yesterday.getMonth() + 1).toString().padStart(2, '0')}-${yesterday.getDate().toString().padStart(2, '0')}`;
    if (dateKey === todayKey) return '今天';
    if (dateKey === yesterdayKey) return '昨天';
    const [, m, d] = dateKey.split('-');
    return `${parseInt(m)}月${parseInt(d)}日`;
  };

  const formatTime = (iso: string): string => {
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-100 to-cream-200 pb-32">
      {/* 顶部标题 */}
      <div className="px-4 pt-2.5 pb-1 flex items-center justify-between text-[13px] font-semibold text-neutral-800">
        <span className="tabular-nums">9:41</span>
        <div className="flex items-center gap-1.5">
          <span>Records</span>
        </div>
      </div>

      <header className="relative px-4 pt-3 pb-5">
        <div className="flex items-start gap-3">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-200 to-amber-300 flex items-center justify-center shadow-soft">
            <span className="text-4xl">📋</span>
          </div>
          <div className="flex-1 pt-1">
            <h1 className="text-[26px] font-bold text-neutral-900 leading-none">记录</h1>
            <p className="text-[12px] text-neutral-500 mt-2 leading-relaxed">
              记录每一次陪伴，见证每一点成长
            </p>
          </div>
          <button
            onClick={() => onNavigate('home')}
            className="w-9 h-9 rounded-full bg-white shadow-soft flex items-center justify-center active-scale"
          >
            <X className="w-4.5 h-4.5 text-neutral-600" strokeWidth={2.2} />
          </button>
        </div>

        {/* 搜索框 */}
        <div className="mt-4 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索记录..."
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-2xl text-sm text-neutral-700 border-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 shadow-soft"
          />
        </div>
      </header>

      <main className="px-4 space-y-4">
        {/* 分类筛选条 */}
        <div className="overflow-x-auto -mx-4 px-4 pb-1 scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            {(Object.keys(categoryConfig) as CategoryKey[]).map((key) => {
              const cfg = categoryConfig[key];
              const Icon = cfg.icon;
              const count = categoryCounts[key];
              const isActive = activeCategory === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-all',
                    isActive
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-glow-cream'
                      : 'bg-white text-neutral-700 shadow-soft'
                  )}
                >
                  <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-white' : cfg.iconColor)} strokeWidth={2.2} />
                  <span>{cfg.label}</span>
                  <span className={cn(
                    'text-[10px] tabular-nums',
                    isActive ? 'text-white/85' : 'text-neutral-400'
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 日期选择器 */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-1.5 text-[13px] font-medium text-neutral-700"
          >
            <CalendarIcon className="w-4 h-4 text-primary-500" />
            {selectedDate}
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
          </button>
          <div className="text-[11px] text-neutral-400">
            共 {filteredRecords.length} 条
          </div>
        </div>

        {/* 时间线列表 */}
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 shadow-soft text-center">
            <div className="text-4xl mb-3">📝</div>
            <h3 className="text-[15px] font-semibold text-neutral-700">还没有记录</h3>
            <p className="text-[12px] text-neutral-400 mt-1">开始记录您宠物的健康状况吧</p>
            <button
              onClick={() => handleAddRecord('text')}
              className="mt-4 px-5 py-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-semibold shadow-glow-cream"
            >
              开始记录
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {groupedRecords.map(([dateKey, dayRecords]) => (
              <div key={dateKey}>
                <div className="flex items-center gap-2 mb-2.5 px-1">
                  <h3 className="text-[14px] font-bold text-neutral-800">
                    {formatDateLabel(dateKey)}
                  </h3>
                  <span className="text-[11px] text-neutral-400">
                    {dayRecords.length} 条
                  </span>
                </div>

                <div className="relative pl-6">
                  {/* 时间线竖线 */}
                  <div className="absolute left-[7px] top-2 bottom-0 w-0.5 bg-cream-300" />

                  <div className="space-y-3">
                    {dayRecords.map((record) => {
                      const iconConfig = typeIconMap[record.type] || typeIconMap.text;
                      const Icon = iconConfig.icon;
                      const recordTags = record.tags
                        .map((tid) => tags.find((t) => t.id === tid))
                        .filter(Boolean);

                      return (
                        <div key={record.id} className="relative">
                          {/* 时间线圆点 */}
                          <div
                            className={cn(
                              'absolute -left-[24px] top-3 w-3.5 h-3.5 rounded-full border-2 border-white shadow-soft',
                              iconConfig.bg
                            )}
                          />

                          {/* 卡片 */}
                          <div className="bg-white rounded-2xl p-3.5 shadow-soft active-scale transition-all">
                            <div className="flex items-start gap-3">
                              <div
                                className={cn(
                                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                                  iconConfig.bg
                                )}
                              >
                                <Icon className={cn('w-5 h-5', iconConfig.color)} strokeWidth={2.2} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-[14px] font-semibold text-neutral-900 truncate pr-2">
                                    {record.title}
                                  </h4>
                                  <span className="text-[11px] text-neutral-400 tabular-nums flex-shrink-0">
                                    {formatTime(record.createdAt)}
                                  </span>
                                </div>
                                <p className="text-[12px] text-neutral-600 mt-1 leading-relaxed line-clamp-2">
                                  {record.content}
                                </p>
                                {recordTags.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {recordTags.map((tag) => (
                                      <span
                                        key={tag!.id}
                                        className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                                        style={{
                                          backgroundColor: `${tag!.color}1A`,
                                          color: tag!.color,
                                        }}
                                      >
                                        {tag!.name}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 底部统计摘要 */}
        {filteredRecords.length > 0 && (
          <div className="bg-white rounded-3xl p-4 shadow-soft">
            <h3 className="text-[14px] font-bold text-neutral-800 mb-3">本周统计</h3>
            <div className="grid grid-cols-5 gap-1.5">
              {(['feeding', 'water', 'activity', 'health', 'other'] as CategoryKey[]).map((key) => {
                const cfg = categoryConfig[key];
                const Icon = cfg.icon;
                return (
                  <div key={key} className="flex flex-col items-center py-2">
                    <div className={cn('w-9 h-9 rounded-full flex items-center justify-center mb-1.5', cfg.bgColor)}>
                      <Icon className={cn('w-4 h-4', cfg.iconColor)} strokeWidth={2.2} />
                    </div>
                    <div className="text-[14px] font-bold text-neutral-900 tabular-nums">
                      {categoryCounts[key]}
                    </div>
                    <div className="text-[9px] text-neutral-400 mt-0.5">次</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* 浮动添加按钮 */}
      <button
        onClick={() => handleAddRecord('text')}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-glow-cream flex items-center justify-center active-scale z-30"
      >
        <Plus className="w-7 h-7" strokeWidth={2.5} />
      </button>

      {/* Add Record Modal */}
      <AddRecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        availableTags={tags}
        initialType={selectedRecordType}
      />
    </div>
  );
};

export default HealthRecordsPage;
