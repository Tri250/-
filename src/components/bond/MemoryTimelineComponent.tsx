// ============================================
// PawSync Pro 3.0 - Memory Timeline Component
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 沉浸式时光档案馆 - 无限滚动时间轴、特殊时刻纪念卡片
// ============================================

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  Heart, 
  Camera, 
  Video, 
  Mic, 
  Star,
  Plus,
  Calendar,
  MapPin,
  Trash2,
  Share2,
  Image,
  X,
  Sparkles
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import type { Milestone } from '../../types/bond';
import { AddMemoryModal } from './AddMemoryModal';

interface MemoryItem {
  id: string;
  type: 'photo' | 'video' | 'voice' | 'milestone';
  title: string;
  url: string;
  thumbnail?: string;
  timestamp: string;
  location?: string;
  tags: string[];
  isFavorite: boolean;
  isHighlight: boolean;
}

interface MemoryTimelineComponentProps {
  externalShowUploadModal?: boolean;
  onExternalShowUploadModalChange?: (show: boolean) => void;
}

export function MemoryTimelineComponent({ 
  externalShowUploadModal, 
  onExternalShowUploadModalChange 
}: MemoryTimelineComponentProps) {
  const { currentPet } = useAppStore();
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MemoryItem | null>(null);
  const [_selectedYear, _setSelectedYear] = useState<number>(new Date().getFullYear());
  const [internalShowUploadModal, setInternalShowUploadModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const _showUploadModal = externalShowUploadModal ?? internalShowUploadModal;
  const _setShowUploadModal = onExternalShowUploadModalChange ?? setInternalShowUploadModal;
  const { scrollYProgress } = useScroll();
  
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.3]);

  const petId = currentPet?.id || '1';
  const petName = currentPet?.name || '毛孩子';

  useEffect(() => {
    loadData();
  }, [petId]);

  const loadData = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockMemories: MemoryItem[] = [
        {
          id: 'mem-1',
          type: 'photo',
          title: '慵懒的午后',
          url: 'https://picsum.photos/seed/cat1/800/600',
          thumbnail: 'https://picsum.photos/seed/cat1/400/300',
          timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
          location: '客厅',
          tags: ['萌宠', '治愈', '日常'],
          isFavorite: true,
          isHighlight: true
        },
        {
          id: 'mem-2',
          type: 'video',
          title: '第一次玩逗猫棒',
          url: 'https://example.com/video1.mp4',
          thumbnail: 'https://picsum.photos/seed/cat2/400/300',
          timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
          tags: ['玩耍', '成长记录'],
          isFavorite: true,
          isHighlight: false
        },
        {
          id: 'mem-3',
          type: 'milestone',
          title: '1岁生日',
          url: 'https://picsum.photos/seed/cake/800/600',
          thumbnail: 'https://picsum.photos/seed/cake/400/300',
          timestamp: new Date(Date.now() - 86400000 * 30).toISOString(),
          tags: ['生日', '里程碑'],
          isFavorite: true,
          isHighlight: true
        },
        {
          id: 'mem-4',
          type: 'photo',
          title: '窗边发呆',
          url: 'https://picsum.photos/seed/window/800/600',
          thumbnail: 'https://picsum.photos/seed/window/400/300',
          timestamp: new Date(Date.now() - 86400000 * 7).toISOString(),
          location: '卧室',
          tags: ['日常', '可爱'],
          isFavorite: false,
          isHighlight: false
        },
        {
          id: 'mem-5',
          type: 'voice',
          title: '呼噜声',
          url: 'https://example.com/purr.mp3',
          timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
          tags: ['声音'],
          isFavorite: true,
          isHighlight: false
        }
      ];

      const mockMilestones: Milestone[] = [
        {
          id: 'ms-1',
          petId,
          type: 'birthday',
          title: '🎂 2岁生日',
          description: `${petName}的2岁生日派对`,
          date: '2026-04-15',
          photos: [
            'https://picsum.photos/seed/bday1/400/300',
            'https://picsum.photos/seed/bday2/400/300'
          ],
          celebrationCount: 5
        },
        {
          id: 'ms-2',
          petId,
          type: 'adoption',
          title: '🏠 领养纪念日',
          description: `${petName}成为我们家庭成员的日子`,
          date: '2025-05-20',
          photos: [
            'https://picsum.photos/seed/adopt1/400/300'
          ],
          celebrationCount: 3
        },
        {
          id: 'ms-3',
          petId,
          type: 'first_time',
          title: '✨ 第一次外出',
          description: `${petName}第一次去公园`,
          date: '2025-08-10',
          photos: [],
          celebrationCount: 2
        }
      ];

      setMemories(mockMemories);
      setMilestones(mockMilestones);
    } catch (error) {
      console.error('Failed to load memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'photo': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'voice': return <Mic className="w-4 h-4" />;
      case 'milestone': return <Star className="w-4 h-4" />;
      default: return <Camera className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'photo': return 'text-blue-500 bg-blue-100';
      case 'video': return 'text-purple-500 bg-purple-100';
      case 'voice': return 'text-orange-500 bg-orange-100';
      case 'milestone': return 'text-yellow-500 bg-yellow-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    if (days < 30) return `${Math.floor(days / 7)}周前`;
    if (days < 365) return `${Math.floor(days / 30)}个月前`;
    return `${Math.floor(days / 365)}年前`;
  };

  const groupByMonth = (items: MemoryItem[]) => {
    const groups: Record<string, MemoryItem[]> = {};
    
    items.forEach(item => {
      const date = new Date(item.timestamp);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    
    return groups;
  };

  const groupedMemories = groupByMonth(memories);
  const sortedMonths = Object.keys(groupedMemories).sort((a, b) => b.localeCompare(a));

  const handleToggleFavorite = (id: string) => {
    setMemories(prev => prev.map(m => 
      m.id === id ? { ...m, isFavorite: !m.isFavorite } : m
    ));
  };

  const handleDelete = (id: string) => {
    if (!confirm('确定要删除这个回忆吗？')) return;
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  // 处理添加新回忆
  const handleAddMemory = (memory: unknown) => {
    const newMemory = memory as MemoryItem;
    setMemories(prev => [newMemory, ...prev]);
  };

  const renderMilestoneCard = (milestone: Milestone) => {
    const daysUntil = Math.floor(
      (new Date(milestone.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-4 border-2 border-yellow-200 shadow-lg overflow-hidden"
      >
        {/* 装饰性背景 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-200 rounded-full opacity-20 transform translate-x-16 -translate-y-16" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{milestone.type === 'birthday' ? '🎂' : 
                milestone.type === 'adoption' ? '🏠' : '✨'}</span>
              <div>
                <h3 className="font-bold text-gray-800">{milestone.title}</h3>
                <p className="text-xs text-gray-500">{milestone.description}</p>
              </div>
            </div>
            {daysUntil <= 30 && daysUntil > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs">
                {daysUntil}天后
              </span>
            )}
          </div>

          {milestone.photos.length > 0 && (
            <div className="flex gap-2 mb-3">
              {milestone.photos.slice(0, 3).map((photo, idx) => (
                <img
                  key={idx}
                  src={photo}
                  alt={`纪念照片 ${idx + 1}`}
                  className="w-20 h-20 rounded-xl object-cover"
                />
              ))}
              {milestone.photos.length > 3 && (
                <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center">
                  <span className="text-sm text-gray-500">+{milestone.photos.length - 3}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>{new Date(milestone.date).toLocaleDateString('zh-CN')}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-yellow-600">
              <Heart className="w-3 h-3 fill-current" />
              <span>{milestone.celebrationCount}次庆祝</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderMemoryCard = (memory: MemoryItem, index: number) => {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05 }}
        onClick={() => setSelectedItem(memory)}
        className="relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group"
      >
        {/* 媒体预览 */}
        <div className="relative aspect-square">
          {memory.type === 'photo' || memory.type === 'milestone' ? (
            <img
              src={memory.thumbnail || memory.url}
              alt={memory.title}
              className="w-full h-full object-cover"
            />
          ) : memory.type === 'video' ? (
            <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
              <Video className="w-16 h-16 text-purple-400" />
            </div>
          ) : memory.type === 'voice' ? (
            <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
              <Mic className="w-16 h-16 text-orange-400" />
            </div>
          ) : null}

          {/* 类型标签 */}
          <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs flex items-center gap-1 ${getTypeColor(memory.type)}`}>
            {getTypeIcon(memory.type)}
            <span>{memory.type === 'photo' ? '照片' : memory.type === 'video' ? '视频' : memory.type === 'voice' ? '声音' : '里程碑'}</span>
          </div>

          {/* 高亮标识 */}
          {memory.isHighlight && (
            <div className="absolute top-2 right-2">
              <span className="px-2 py-1 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full text-xs flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                精选
              </span>
            </div>
          )}

          {/* 悬停时的操作按钮 */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleFavorite(memory.id);
              }}
              className="p-3 bg-white rounded-full"
            >
              <Heart className={`w-5 h-5 ${memory.isFavorite ? 'text-red-500 fill-current' : 'text-gray-600'}`} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedItem(memory);
              }}
              className="p-3 bg-white rounded-full"
            >
              <Share2 className="w-5 h-5 text-gray-600" />
            </motion.button>
          </div>
        </div>

        {/* 信息区域 */}
        <div className="p-3">
          <h3 className="font-medium text-gray-800 mb-1 line-clamp-1">{memory.title}</h3>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{formatDate(memory.timestamp)}</span>
            {memory.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {memory.location}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  // 详情模态框
  const DetailModal = () => (
    <AnimatePresence>
      {selectedItem && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full"
          >
            {/* 关闭按钮 */}
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* 媒体内容 */}
            <div className="relative rounded-2xl overflow-hidden bg-black">
              {(selectedItem.type === 'photo' || selectedItem.type === 'milestone') ? (
                <img
                  src={selectedItem.url}
                  alt={selectedItem.title}
                  className="w-full max-h-[70vh] object-contain"
                />
              ) : selectedItem.type === 'video' ? (
                <div className="aspect-video bg-gray-900 flex items-center justify-center">
                  <Video className="w-24 h-24 text-gray-600" />
                </div>
              ) : selectedItem.type === 'voice' ? (
                <div className="aspect-video bg-gray-900 flex items-center justify-center">
                  <Mic className="w-24 h-24 text-gray-600" />
                </div>
              ) : null}
            </div>

            {/* 详情信息 */}
            <div className="bg-white rounded-b-2xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">{selectedItem.title}</h2>
              
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span>{formatDate(selectedItem.timestamp)}</span>
                {selectedItem.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {selectedItem.location}
                  </span>
                )}
              </div>

              {selectedItem.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedItem.tags.map((tag, idx) => (
                    <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => handleToggleFavorite(selectedItem.id)}
                  className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors ${
                    selectedItem.isFavorite 
                      ? 'bg-red-100 text-red-600' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${selectedItem.isFavorite ? 'fill-current' : ''}`} />
                  <span>{selectedItem.isFavorite ? '已收藏' : '收藏'}</span>
                </button>
                <button
                  onClick={() => {}}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  <span>分享</span>
                </button>
                <button
                  onClick={() => handleDelete(selectedItem.id)}
                  className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部信息 */}
      <div className="relative">
        <motion.div style={{ y, opacity }} className="relative">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            💫 {petName}的时光档案馆
          </h1>
          <p className="text-sm text-gray-500">
            记录每一个珍贵瞬间
          </p>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => _setShowUploadModal(true)}
          className="absolute right-0 top-0 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">添加回忆</span>
        </motion.button>
      </div>

      {/* 特殊时刻纪念卡片 */}
      {milestones.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            重要里程碑
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {milestones.map((milestone) => renderMilestoneCard(milestone))}
          </div>
        </div>
      )}

      {/* 按月份分组的时间轴 */}
      <div ref={containerRef} className="space-y-8">
        {sortedMonths.map((month, monthIndex) => {
          const [year, m] = month.split('-');
          const monthName = new Date(parseInt(year), parseInt(m) - 1).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
          
          return (
            <div key={month} className="relative">
              {/* 时间线 */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-pink-300 to-purple-300 rounded-full" />
              
              {/* 月份标签 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: monthIndex * 0.1 }}
                className="relative flex items-center gap-4 mb-4"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center z-10 shadow-lg">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">{monthName}</h2>
                  <p className="text-xs text-gray-500">{groupedMemories[month].length}个回忆</p>
                </div>
              </motion.div>

              {/* 记忆网格 */}
              <div className="ml-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {groupedMemories[month].map((memory, index) => renderMemoryCard(memory, index))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 空状态 */}
      {memories.length === 0 && (
        <div className="text-center py-12">
          <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">还没有任何回忆</p>
          <button
            onClick={() => _setShowUploadModal(true)}
            className="px-6 py-3 bg-pink-500 text-white rounded-xl hover:shadow-lg transition-all"
          >
            添加第一个回忆
          </button>
        </div>
      )}

      {/* 详情模态框 */}
      <DetailModal />
      
      {/* 添加回忆模态框 */}
      <AddMemoryModal 
        isOpen={_showUploadModal}
        onClose={() => _setShowUploadModal(false)}
        onAdd={handleAddMemory}
      />
    </div>
  );
}
