import React, { useState } from 'react';
import { 
  ChevronLeft, 
  FileText, 
  Search, 
  Filter, 
  Plus,
  Mic,
  Image,
  File,
  Video,
  X,
  Check
} from 'lucide-react';
import { Card, FAB, Timeline, TimelineItem, EmptyState } from '../components/DesignSystem';
import { useHealthRecordStore } from '../store/healthRecordStore';
import { usePetStore } from '../store/petStore';
import { DEFAULT_TAGS } from '../types/health-record';
import { motion, AnimatePresence } from 'framer-motion';

interface HealthRecordsPageProps {
  onNavigate: (page: string) => void;
}

export const HealthRecordsPage: React.FC<HealthRecordsPageProps> = ({ onNavigate }) => {
  const { records, tags, selectedTag, searchQuery, getFilteredRecords, setSelectedTag, setSearchQuery, addRecord } = useHealthRecordStore();
  const { currentPetId } = usePetStore();
  const [fabOpen, setFabOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [recordType, setRecordType] = useState<'text' | 'voice' | 'photo' | 'video'>('text');
  const [recordTitle, setRecordTitle] = useState('');
  const [recordContent, setRecordContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const filteredRecords = currentPetId ? getFilteredRecords(currentPetId) : [];
  
  const tagColors = DEFAULT_TAGS.reduce((acc, tag) => {
    acc[tag.id] = tag.color;
    return acc;
  }, {} as Record<string, string>);

  const handleAddRecord = (type: 'text' | 'voice' | 'photo' | 'video') => {
    setFabOpen(false);
    setRecordType(type);
    setRecordTitle('');
    setRecordContent('');
    setSelectedTags([]);
    setShowAddModal(true);
  };

  const handleSubmitRecord = () => {
    if (!recordTitle.trim()) {
      alert('请输入记录标题');
      return;
    }
    
    if (currentPetId) {
      addRecord({
        petId: currentPetId,
        type: recordType,
        title: recordTitle,
        content: recordContent,
        tags: selectedTags,
        isImportant: false,
      });
    }
    
    setShowAddModal(false);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
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
                  onClick={() => setFabOpen(true)}
                  className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary-500/30 transition-all"
                >
                  开始记录
                </button>
              }
            />
          ) : (
            <Timeline>
              {filteredRecords.map((record, index) => (
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

      {/* 添加记录模态框 */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-6 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800">添加健康记录</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* 标题输入 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">标题</label>
                <input
                  type="text"
                  value={recordTitle}
                  onChange={(e) => setRecordTitle(e.target.value)}
                  placeholder="输入记录标题..."
                  className="w-full px-4 py-3 bg-gray-100 rounded-xl text-sm border-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all"
                />
              </div>

              {/* 内容输入 - 根据类型显示不同界面 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {recordType === 'text' && '内容'}
                  {recordType === 'voice' && '语音记录'}
                  {recordType === 'photo' && '拍照记录'}
                  {recordType === 'video' && '视频记录'}
                </label>
                
                {recordType === 'text' && (
                  <textarea
                    value={recordContent}
                    onChange={(e) => setRecordContent(e.target.value)}
                    placeholder="输入记录内容..."
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-100 rounded-xl text-sm border-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all resize-none"
                  />
                )}
                
                {recordType === 'voice' && (
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-center">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                      <Mic className="w-10 h-10 text-white" />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">点击下方按钮开始录音</p>
                    <button 
                      className="px-6 py-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors"
                      onClick={() => setRecordContent(recordContent ? recordContent : '🎤 已录制完成的语音记录')}
                    >
                      {recordContent ? '重新录制' : '开始录制'}
                    </button>
                    {recordContent && (
                      <p className="text-xs text-green-600 mt-2">✓ 语音记录已准备好</p>
                    )}
                  </div>
                )}
                
                {recordType === 'photo' && (
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mb-4">
                      <Image className="w-10 h-10 text-white" />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">点击下方按钮拍照或选择图片</p>
                    <button 
                      className="px-6 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                      onClick={() => setRecordContent(recordContent ? recordContent : '📷 已拍摄完成的照片记录')}
                    >
                      {recordContent ? '重新拍摄' : '开始拍照'}
                    </button>
                    {recordContent && (
                      <p className="text-xs text-green-600 mt-2">✓ 照片记录已准备好</p>
                    )}
                  </div>
                )}
                
                {recordType === 'video' && (
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 text-center">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mb-4">
                      <Video className="w-10 h-10 text-white" />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">点击下方按钮开始录制视频</p>
                    <button 
                      className="px-6 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      onClick={() => setRecordContent(recordContent ? recordContent : '🎬 已录制完成的视频记录')}
                    >
                      {recordContent ? '重新录制' : '开始录像'}
                    </button>
                    {recordContent && (
                      <p className="text-xs text-green-600 mt-2">✓ 视频记录已准备好</p>
                    )}
                  </div>
                )}
              </div>

              {/* 标签选择 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">标签</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        selectedTags.includes(tag.id)
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      style={!selectedTags.includes(tag.id) ? { backgroundColor: tag.color + '20', color: tag.color } : {}}
                    >
                      {selectedTags.includes(tag.id) && <Check className="w-3 h-3 inline mr-1" />}
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 提交按钮 */}
              <button
                onClick={handleSubmitRecord}
                className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-primary-500/30 transition-all"
              >
                保存记录
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
