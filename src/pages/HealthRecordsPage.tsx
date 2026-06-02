import React, { useState } from 'react';
import { 
  ChevronLeft, 
  Search
} from 'lucide-react';
import { FAB, Timeline, TimelineItem, EmptyState } from '../components/DesignSystem';
import { AddRecordModal } from '../components/AddRecordModal';
import { useHealthRecordStore } from '../store/healthRecordStore';
import { usePetStore } from '../store/petStore';
import { DEFAULT_TAGS, RecordType } from '../types/health-record';

interface HealthRecordsPageProps {
  onNavigate: (page: string) => void;
}

export const HealthRecordsPage: React.FC<HealthRecordsPageProps> = ({ onNavigate }) => {
  const { tags, selectedTag, searchQuery, getFilteredRecords, setSelectedTag, setSearchQuery, addRecord } = useHealthRecordStore();
  const { currentPetId } = usePetStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecordType, setSelectedRecordType] = useState<RecordType>('text');

  const filteredRecords = currentPetId ? getFilteredRecords(currentPetId) : [];
  
  const tagColors = DEFAULT_TAGS.reduce((acc, tag) => {
    acc[tag.id] = tag.color;
    return acc;
  }, {} as Record<string, string>);

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
    });
    
    setIsModalOpen(false);
  };

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
          <div className="relative">
            <Search className="w-5 h-5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索记录..."
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-100 rounded-xl text-sm border-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all"
            />
          </div>

          {/* Tags Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
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
          </div>
        </div>
      </div>

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
