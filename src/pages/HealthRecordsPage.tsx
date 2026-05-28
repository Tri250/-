
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Tag, Calendar, Type, Mic, Camera, Video, FileText, Clock, ChevronRight, Trash2, Edit2 } from 'lucide-react';
import { Card } from '../components/DesignSystem/Card';

interface HealthRecord {
  id: string;
  type: 'TEXT' | 'VOICE' | 'PHOTO' | 'VIDEO' | 'FILE';
  title: string;
  content: string;
  tags: string[];
  attachments: string[];
  voiceDuration?: number;
  createdAt: string;
  isImportant: boolean;
}

const mockRecords: HealthRecord[] = [
  {
    id: '1',
    type: 'TEXT',
    title: '毛球今天很开心',
    content: '今天带毛球去了公园，玩得很开心，回来后吃了很多猫粮。',
    tags: ['日常', '开心'],
    attachments: [],
    createdAt: '2024-01-15T10:30:00Z',
    isImportant: false,
  },
  {
    id: '2',
    type: 'PHOTO',
    title: '洗澡照片',
    content: '今天给毛球洗了澡，香喷喷的！',
    tags: ['美容', '洗澡'],
    attachments: ['https://example.com/photo1.jpg'],
    createdAt: '2024-01-14T15:45:00Z',
    isImportant: true,
  },
  {
    id: '3',
    type: 'VOICE',
    title: '毛球的叫声',
    content: '',
    tags: ['声音', '日常'],
    attachments: [],
    voiceDuration: 35,
    createdAt: '2024-01-13T09:20:00Z',
    isImportant: false,
  },
  {
    id: '4',
    type: 'TEXT',
    title: '食欲下降',
    content: '最近两天毛球食欲不太好，需要关注一下。',
    tags: ['健康', '关注'],
    attachments: [],
    createdAt: '2024-01-12T18:00:00Z',
    isImportant: true,
  },
  {
    id: '5',
    type: 'FILE',
    title: '体检报告',
    content: '年度体检报告',
    tags: ['医疗', '体检'],
    attachments: ['https://example.com/report.pdf'],
    createdAt: '2024-01-10T10:00:00Z',
    isImportant: true,
  },
];

export default function HealthRecordsPage() {
  const [records, setRecords] = useState<HealthRecord[]>(mockRecords);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: 'TEXT' as const,
    title: '',
    content: '',
    tags: [] as string[],
    isImportant: false,
  });

  const availableTags = ['日常', '健康', '美容', '医疗', '体检', '开心', '关注', '声音'];

  const filteredRecords = records.filter((record) => {
    const matchesSearch = record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || record.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const handleAddRecord = () => {
    if (!formData.title) return;
    
    const newRecord: HealthRecord = {
      id: `record-${Date.now()}`,
      ...formData,
      attachments: [],
      createdAt: new Date().toISOString(),
    };
    
    setRecords([newRecord, ...records]);
    setFormData({
      type: 'TEXT',
      title: '',
      content: '',
      tags: [],
      isImportant: false,
    });
    setShowAddModal(false);
  };

  const handleEditRecord = () => {
    if (!editingRecord || !formData.title) return;
    
    setRecords(records.map((r) =>
      r.id === editingRecord.id ? { ...r, ...formData } : r
    ));
    setEditingRecord(null);
    setShowEditModal(false);
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(records.filter((r) => r.id !== id));
  };

  const openEditModal = (record: HealthRecord) => {
    setEditingRecord(record);
    setFormData({
      type: record.type,
      title: record.title,
      content: record.content,
      tags: record.tags,
      isImportant: record.isImportant,
    });
    setShowEditModal(true);
  };

  const toggleTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.includes(tag)
        ? formData.tags.filter((t) => t !== tag)
        : [...formData.tags, tag],
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const getRecordIcon = (type: HealthRecord['type']) => {
    switch (type) {
      case 'TEXT': return <Type size={18} />;
      case 'VOICE': return <Mic size={18} />;
      case 'PHOTO': return <Camera size={18} />;
      case 'VIDEO': return <Video size={18} />;
      case 'FILE': return <FileText size={18} />;
    }
  };

  const getRecordColor = (type: HealthRecord['type']) => {
    switch (type) {
      case 'TEXT': return 'text-neutral-600 bg-neutral-100';
      case 'VOICE': return 'text-purple-600 bg-purple-100';
      case 'PHOTO': return 'text-success-600 bg-success-100';
      case 'VIDEO': return 'text-primary-600 bg-primary-100';
      case 'FILE': return 'text-yellow-600 bg-yellow-100';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* 头部 */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-neutral-800 mb-4">健康记录</h1>
          
          {/* 搜索和筛选 */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="搜索记录..."
              />
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="p-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>

          {/* 标签筛选 */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                !selectedTag ? 'bg-primary-500 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              全部
            </button>
            {availableTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                  selectedTag === tag ? 'bg-primary-500 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 记录列表 */}
      <div className="px-4 py-4">
        <div className="space-y-3">
          {filteredRecords.map((record, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                hover 
                className={`p-4 ${record.isImportant ? 'border-l-4 border-primary-500' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {/* 类型图标 */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getRecordColor(record.type)}`}>
                    {getRecordIcon(record.type)}
                  </div>
                  
                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-neutral-800 truncate">{record.title}</h3>
                      {record.isImportant && (
                        <span className="text-xs text-primary-500">⭐</span>
                      )}
                    </div>
                    {record.type === 'TEXT' && (
                      <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{record.content}</p>
                    )}
                    {record.type === 'VOICE' && record.voiceDuration && (
                      <div className="flex items-center gap-2 mt-1">
                        <Clock size={14} className="text-neutral-400" />
                        <span className="text-sm text-neutral-500">{record.voiceDuration}秒</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {record.tags.map((tag) => (
                        <span key={tag} className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">
                          <Tag size={10} className="inline mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-neutral-400">{formatDate(record.createdAt)}</span>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => openEditModal(record)}
                          className="p-1.5 text-neutral-400 hover:text-primary-500 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteRecord(record.id)}
                          className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <ChevronRight size={20} className="text-neutral-400 flex-shrink-0" />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* 空状态 */}
        {filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
              <Search size={40} className="text-neutral-400" />
            </div>
            <p className="text-neutral-500">没有找到相关记录</p>
          </div>
        )}
      </div>

      {/* 添加记录弹窗 */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end z-50"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-neutral-800 mb-6">添加记录</h2>
              
              {/* 记录类型选择 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 mb-2">记录类型</label>
                <div className="grid grid-cols-5 gap-2">
                  {(['TEXT', 'VOICE', 'PHOTO', 'VIDEO', 'FILE'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setFormData({ ...formData, type })}
                      className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition-all ${
                        formData.type === type 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getRecordColor(type)}`}>
                        {getRecordIcon(type)}
                      </div>
                      <span className="text-xs">{type === 'TEXT' ? '文字' : type === 'VOICE' ? '语音' : type === 'PHOTO' ? '照片' : type === 'VIDEO' ? '视频' : '文件'}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 标题 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 mb-1">标题</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="输入记录标题"
                />
              </div>

              {/* 内容 */}
              {(formData.type === 'TEXT') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">内容</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={4}
                    placeholder="输入记录内容..."
                  />
                </div>
              )}

              {/* 标签选择 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 mb-2">标签</label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        formData.tags.includes(tag)
                          ? 'bg-primary-500 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* 重要标记 */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm font-medium text-neutral-700">重要记录</span>
                <button
                  onClick={() => setFormData({ ...formData, isImportant: !formData.isImportant })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    formData.isImportant ? 'bg-primary-500' : 'bg-neutral-200'
                  }`}
                >
                  <motion.div
                    animate={{ x: formData.isImportant ? 20 : 2 }}
                    className="w-5 h-5 bg-white rounded-full shadow"
                  />
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-xl border border-neutral-200 text-neutral-700 font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleAddRecord}
                  disabled={!formData.title}
                  className="flex-1 py-3 rounded-xl bg-primary-500 text-white font-medium disabled:bg-neutral-300 disabled:cursor-not-allowed"
                >
                  添加记录
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 编辑记录弹窗 */}
      <AnimatePresence>
        {showEditModal && editingRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end z-50"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-neutral-800 mb-6">编辑记录</h2>
              
              {/* 标题 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 mb-1">标题</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* 内容 */}
              {formData.type === 'TEXT' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">内容</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={4}
                  />
                </div>
              )}

              {/* 标签选择 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 mb-2">标签</label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        formData.tags.includes(tag)
                          ? 'bg-primary-500 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* 重要标记 */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm font-medium text-neutral-700">重要记录</span>
                <button
                  onClick={() => setFormData({ ...formData, isImportant: !formData.isImportant })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    formData.isImportant ? 'bg-primary-500' : 'bg-neutral-200'
                  }`}
                >
                  <motion.div
                    animate={{ x: formData.isImportant ? 20 : 2 }}
                    className="w-5 h-5 bg-white rounded-full shadow"
                  />
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 rounded-xl border border-neutral-200 text-neutral-700 font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleEditRecord}
                  disabled={!formData.title}
                  className="flex-1 py-3 rounded-xl bg-primary-500 text-white font-medium disabled:bg-neutral-300 disabled:cursor-not-allowed"
                >
                  保存修改
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
