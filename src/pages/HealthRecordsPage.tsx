import React, { useState, useMemo, useCallback } from 'react';
import { 
  ChevronLeft, 
  Search,
  Plus,
  X,
  Filter,
  Check
} from 'lucide-react';
import { FAB, Timeline, TimelineItem, EmptyState, VirtualTimeline } from '../components/DesignSystem';
import { AddRecordModal } from '../components/AddRecordModal';
import { useHealthRecordStore } from '../store/healthRecordStore';
import { usePetStore } from '../store/petStore';
import { DEFAULT_TAGS, RecordType, HealthTag } from '../types/health-record';

interface HealthRecordsPageProps {
  onNavigate: (page: string) => void;
}

export const HealthRecordsPage: React.FC<HealthRecordsPageProps> = ({ onNavigate }) => {
  const { 
    tags, 
    selectedTag, 
    searchQuery, 
    getFilteredRecords, 
    getFilteredRecordsByTags,
    setSelectedTag, 
    setSearchQuery, 
    addRecord,
    addTag 
  } = useHealthRecordStore();
  const { currentPetId } = usePetStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecordType, setSelectedRecordType] = useState<RecordType>('text');
  const [showTagCreator, setShowTagCreator] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6B7280');
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const filteredRecords = useMemo(() => {
    if (!currentPetId) return [];
    if (multiSelectMode && selectedTags.length > 0) {
      return getFilteredRecordsByTags(currentPetId, selectedTags);
    }
    return getFilteredRecords(currentPetId);
  }, [currentPetId, multiSelectMode, selectedTags, getFilteredRecords, getFilteredRecordsByTags]);
  
  const tagColors = useMemo(() => {
    return tags.reduce((acc, tag) => {
      acc[tag.id] = tag.color;
      return acc;
    }, {} as Record<string, string>);
  }, [tags]);

  const PRESET_COLORS = [
    '#FF6B6B', '#FFA94D', '#4DABF7', '#F59E0B', 
    '#10B981', '#8B5CF6', '#EC4899', '#0E9CE5',
    '#6B7280', '#1F2937', '#374151', '#9CA3AF'
  ];

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

  const handleCreateTag = useCallback(() => {
    if (!newTagName.trim()) return;
    
    addTag({
      name: newTagName.trim(),
      color: newTagColor,
    });
    
    setNewTagName('');
    setNewTagColor('#6B7280');
    setShowTagCreator(false);
  }, [newTagName, newTagColor, addTag]);

  const toggleMultiSelectTag = useCallback((tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  }, []);

  const clearMultiSelect = useCallback(() => {
    setMultiSelectMode(false);
    setSelectedTags([]);
    setSelectedTag(null);
  }, []);

  const recordCount = filteredRecords.length;

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-4 py-4 sticky top-0 z-30">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <button 
            onClick={() => onNavigate('home')}
            className="p-2 -ml-2 rounded-full hover:bg-neutral-100 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-neutral-600" />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold text-neutral-800">健康记录</h1>
            <p className="text-xs text-neutral-500">记录宠物的健康状况</p>
          </div>
        </div>
      </header>

      {/* Search & Filter */}
      <div className="bg-white border-b border-neutral-100 px-4 py-3">
        <div className="max-w-md mx-auto space-y-3">
          {/* Search */}
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索记录..."
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-100 rounded-xl text-sm border-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all"
              />
            </div>
            <button
              onClick={() => setMultiSelectMode(!multiSelectMode)}
              className={`p-2.5 rounded-xl transition-all ${
                multiSelectMode 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
              title="多标签筛选"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {/* Multi-Select Mode */}
          {multiSelectMode && (
            <div className="bg-primary-50 rounded-xl p-3 border border-primary-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-primary-700">
                  多标签筛选 ({selectedTags.length}个已选)
                </span>
                <button
                  onClick={clearMultiSelect}
                  className="text-xs text-primary-600 hover:text-primary-800"
                >
                  清除筛选
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleMultiSelectTag(tag.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                      selectedTags.includes(tag.id)
                        ? 'ring-2 ring-offset-1'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: `${tag.color}20`,
                      color: tag.color,
                      ...(selectedTags.includes(tag.id) && { ringColor: tag.color }),
                    }}
                  >
                    {selectedTags.includes(tag.id) && <Check className="w-3 h-3" />}
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tags Filter - Single Mode */}
          {!multiSelectMode && (
            <div className="flex gap-2 overflow-x-auto pb-1 items-center">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedTag === null
                    ? 'bg-primary-500 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                全部
              </button>
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => setSelectedTag(tag.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedTag === tag.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                  style={selectedTag !== tag.id ? { backgroundColor: tag.color + '20', color: tag.color } : {}}
                >
                  {tag.name}
                </button>
              ))}
              <button
                onClick={() => setShowTagCreator(true)}
                className="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap bg-neutral-100 text-neutral-600 hover:bg-neutral-200 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                新标签
              </button>
            </div>
          )}

          {/* Record Count */}
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>共 {recordCount} 条记录</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-primary-600 hover:text-primary-800"
              >
                清除搜索
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tag Creator Modal */}
      {showTagCreator && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-800">创建新标签</h3>
              <button
                onClick={() => setShowTagCreator(false)}
                className="p-2 rounded-full hover:bg-neutral-100"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">标签名称</label>
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="输入标签名称..."
                className="w-full px-4 py-2.5 bg-neutral-100 rounded-xl text-sm border-none focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                maxLength={10}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">标签颜色</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewTagColor(color)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      newTagColor === color ? 'ring-2 ring-offset-2 ring-primary-500' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowTagCreator(false)}
                className="flex-1 py-3 rounded-xl bg-neutral-100 text-neutral-700 font-medium hover:bg-neutral-200"
              >
                取消
              </button>
              <button
                onClick={handleCreateTag}
                disabled={!newTagName.trim()}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Records List */}
      <div className="px-4 py-4">
        <div className="max-w-md mx-auto">
          {filteredRecords.length === 0 ? (
            <EmptyState
              type="records"
              title="还没有记录"
              description="开始记录您宠物的健康状况吧"
              action={
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary-500/30 transition-all"
                >
                  开始记录
                </button>
              }
            />
          ) : (
            <Timeline>
              {filteredRecords.map((record) => (
                <TimelineItem
                  key={record.id}
                  date={record.createdAt}
                  title={record.title}
                  content={record.content}
                  type={record.type}
                  isImportant={record.isImportant}
                  tags={record.tags}
                  tagColors={tagColors}
                  onClick={() => console.log('View record:', record.id)}
                />
              ))}
            </Timeline>
          )}
        </div>
      </div>

      {/* FAB */}
      <FAB onAction={handleAddRecord} />

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
