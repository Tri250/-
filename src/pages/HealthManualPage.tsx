import React, { useState } from 'react';
import { 
  ChevronLeft, 
  Search, 
  Bookmark, 
  BookOpen,
  Apple,
  Bath,
  PawPrint,
  AlertTriangle,
  X
} from 'lucide-react';
import { Card, EmptyState } from '../components/DesignSystem';
import { useHealthManualStore } from '../store/healthManualStore';
import { MANUAL_CATEGORIES } from '../types/health-manual';
import { motion, AnimatePresence } from 'framer-motion';
import type { HealthManual } from '../types/health-manual';

interface HealthManualPageProps {
  onNavigate: (page: string) => void;
}

export const HealthManualPage: React.FC<HealthManualPageProps> = ({ onNavigate }) => {
  const { manuals, selectedCategory, searchQuery, petTypeFilter, getFilteredManuals, getPopularManuals, setSelectedCategory, setSearchQuery, setPetTypeFilter, toggleBookmark, bookmarks } = useHealthManualStore();
  const [selectedManual, setSelectedManual] = useState<HealthManual | null>(null);

  const filteredManuals = getFilteredManuals();
  const popularManuals = getPopularManuals();

  const categoryIcons: Record<string, any> = {
    'nutrition': Apple,
    'care': Bath,
    'behavior': PawPrint,
    'emergency': AlertTriangle,
  };

  const handleViewManual = (manual: HealthManual) => {
    setSelectedManual(manual);
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      {/* Header */}
      <header className="bg-gradient-to-br from-green-500 to-green-600 text-white px-4 py-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onNavigate('home');
              }}
              className="p-2 -ml-2 rounded-full bg-white/20 backdrop-blur hover:bg-white/30 transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">健康手册</h1>
              <p className="text-sm text-white/80">专业的宠物护理知识</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-5 h-5 text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索健康知识..."
              className="w-full pl-10 pr-4 py-3 bg-white/20 backdrop-blur rounded-xl text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
            />
          </div>
        </div>
      </header>

      {/* Pet Type Filter */}
      <div className="bg-white border-b border-neutral-100 px-4 py-3">
        <div className="max-w-md mx-auto flex gap-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPetTypeFilter('both');
            }}
            className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              petTypeFilter === 'both'
                ? 'bg-primary-500 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            全部
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPetTypeFilter('cat');
            }}
            className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              petTypeFilter === 'cat'
                ? 'bg-primary-500 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            猫咪
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPetTypeFilter('dog');
            }}
            className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              petTypeFilter === 'dog'
                ? 'bg-primary-500 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            狗狗
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">
        <div className="max-w-md mx-auto">
          {/* Categories */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">分类</h2>
            <div className="grid grid-cols-2 gap-3">
              {MANUAL_CATEGORIES.map((category) => {
                const Icon = categoryIcons[category.id] || BookOpen;
                return (
                  <button
                    key={category.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedCategory(selectedCategory === category.id ? null : category.id);
                    }}
                    className={`p-4 rounded-2xl text-left transition-all ${
                      selectedCategory === category.id
                        ? 'bg-white shadow-lg border-2 border-primary-500'
                        : 'bg-white shadow-sm border border-neutral-200 hover:shadow-md'
                    }`}
                  >
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                      style={{ backgroundColor: category.color + '20', color: category.color }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-neutral-800">{category.name}</h3>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Popular */}
          {popularManuals.length > 0 && selectedCategory === null && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">热门推荐</h2>
              <div className="space-y-3">
                {popularManuals.map((manual, index) => (
                  <Card
                    key={manual.id}
                    hover
                    onClick={() => handleViewManual(manual)}
                    className="p-0 overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: MANUAL_CATEGORIES.find(c => c.id === manual.category)?.color + '20' }}
                        >
                          <BookOpen className="w-6 h-6" style={{ color: MANUAL_CATEGORIES.find(c => c.id === manual.category)?.color }} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-neutral-800 mb-1">{manual.title}</h3>
                          <p className="text-sm text-neutral-500 line-clamp-2">{manual.summary}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-neutral-400">{manual.readTime}分钟阅读</span>
                            {manual.isPopular && (
                              <span className="px-2 py-0.5 bg-warning-100 text-warning-700 rounded-full text-xs font-medium">热门</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(manual.id);
                          }}
                          className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
                        >
                          <Bookmark 
                            className={`w-5 h-5 ${
                              bookmarks.includes(manual.id)
                                ? 'fill-primary-500 text-primary-500'
                                : 'text-neutral-400'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* All Manuals */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">
              {selectedCategory ? MANUAL_CATEGORIES.find(c => c.id === selectedCategory)?.name : '全部内容'}
            </h2>
            {filteredManuals.length === 0 ? (
              <EmptyState
                type="manuals"
                title="没有找到相关内容"
                description="试试其他关键词或分类"
              />
            ) : (
              <div className="space-y-3">
                {filteredManuals.map((manual, index) => (
                  <Card
                    key={manual.id}
                    hover
                    onClick={() => handleViewManual(manual)}
                    className="p-0 overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: MANUAL_CATEGORIES.find(c => c.id === manual.category)?.color + '20' }}
                        >
                          <BookOpen className="w-6 h-6" style={{ color: MANUAL_CATEGORIES.find(c => c.id === manual.category)?.color }} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-neutral-800 mb-1">{manual.title}</h3>
                          <p className="text-sm text-neutral-500 line-clamp-2">{manual.summary}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-neutral-400">{manual.readTime}分钟阅读</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(manual.id);
                          }}
                          className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
                        >
                          <Bookmark 
                            className={`w-5 h-5 ${
                              bookmarks.includes(manual.id)
                                ? 'fill-primary-500 text-primary-500'
                                : 'text-neutral-400'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 手册详情模态框 */}
      <AnimatePresence>
        {selectedManual && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedManual(null)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[85vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
                <h3 className="text-lg font-bold text-gray-800">详情</h3>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedManual(null);
                  }} 
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">{selectedManual.title}</h2>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: MANUAL_CATEGORIES.find(c => c.id === selectedManual.category)?.color + '20', color: MANUAL_CATEGORIES.find(c => c.id === selectedManual.category)?.color }}>
                      {MANUAL_CATEGORIES.find(c => c.id === selectedManual.category)?.name}
                    </span>
                    <span className="text-sm text-gray-500">{selectedManual.readTime}分钟阅读</span>
                    {selectedManual.isPopular && (
                      <span className="px-2 py-1 bg-warning-100 text-warning-700 rounded-full text-xs font-medium">热门</span>
                    )}
                  </div>
                </div>

                <div className="whitespace-pre-line">
                  {selectedManual.content.split('\n').map((line, index) => {
                    if (line.startsWith('# ')) {
                      return <h2 key={index} className="text-xl font-bold text-gray-800 mb-4 mt-6">{line.replace('# ', '')}</h2>;
                    } else if (line.startsWith('## ')) {
                      return <h3 key={index} className="text-lg font-semibold text-gray-800 mb-3 mt-4">{line.replace('## ', '')}</h3>;
                    } else if (line.startsWith('### ')) {
                      return <h4 key={index} className="text-base font-semibold text-gray-700 mb-2 mt-3">{line.replace('### ', '')}</h4>;
                    } else if (line.startsWith('- ')) {
                      return <p key={index} className="text-gray-600 leading-relaxed pl-4 mb-1">{line}</p>;
                    } else if (line.startsWith('❌ ') || line.startsWith('✅ ')) {
                      return <p key={index} className="text-gray-600 leading-relaxed mb-1">{line}</p>;
                    } else if (line.trim() === '') {
                      return <br key={index} />;
                    } else {
                      return <p key={index} className="text-gray-600 leading-relaxed mb-2">{line}</p>;
                    }
                  })}
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleBookmark(selectedManual.id);
                      setSelectedManual({ ...selectedManual });
                    }}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-2"
                  >
                    <Bookmark className={`w-5 h-5 ${bookmarks.includes(selectedManual.id) ? 'fill-primary-500 text-primary-500' : ''}`} />
                    {bookmarks.includes(selectedManual.id) ? '已收藏' : '收藏'}
                  </button>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium"
                  >
                    分享
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
