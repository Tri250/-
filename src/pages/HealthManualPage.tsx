import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Search, 
  Bookmark, 
  BookOpen,
  Apple,
  Bath,
  PawPrint,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Clock,
  Pill,
  Brain
} from 'lucide-react';
import { GlassCard, SkeletonCard } from '../components/DesignSystem';
import { useHealthManualStore } from '../store/healthManualStore';
import { MANUAL_CATEGORIES, ManualCategory } from '../types/health-manual';
import '../styles/animations.css';

interface HealthManualPageProps {
  onNavigate: (page: string) => void;
}

const ManualSkeleton: React.FC = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div 
        key={i} 
        className="bg-white rounded-2xl p-4 shadow-sm animate-pulse"
        style={{ animationDelay: `${i * 0.1}s` }}
      >
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl skeleton" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded skeleton-text" />
            <div className="h-3 w-full rounded skeleton-text" />
            <div className="h-3 w-2/3 rounded skeleton-text" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const CategorySkeleton: React.FC = () => (
  <div className="grid grid-cols-2 gap-3">
    {[1, 2, 3, 4].map((i) => (
      <div 
        key={i} 
        className="bg-white rounded-2xl p-4 shadow-sm animate-pulse"
        style={{ animationDelay: `${i * 0.05}s` }}
      >
        <div className="w-10 h-10 rounded-xl skeleton mb-2" />
        <div className="h-4 w-16 rounded skeleton-text" />
      </div>
    ))}
  </div>
);

export const HealthManualPage: React.FC<HealthManualPageProps> = ({ onNavigate }) => {
  const { 
    manuals, 
    selectedCategory, 
    searchQuery, 
    petTypeFilter, 
    getFilteredManuals, 
    getPopularManuals, 
    setSelectedCategory, 
    setSearchQuery, 
    setPetTypeFilter, 
    toggleBookmark, 
    bookmarks,
    searchResults,
    isSearching,
    lastSearchTime,
    highlightText,
    getCategoryArticleCount
  } = useHealthManualStore();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const filteredManuals = getFilteredManuals();
  const popularManuals = getPopularManuals();

  const categoryIcons: Record<string, React.ElementType> = {
    'nutrition': Apple,
    'care': Bath,
    'behavior': PawPrint,
    'emergency': AlertTriangle,
    'disease': Pill,
    'mental': Brain,
  };

  const categoryGradients: Record<string, string> = {
    'nutrition': 'from-emerald-400 via-green-500 to-teal-500',
    'care': 'from-blue-400 via-cyan-500 to-sky-500',
    'behavior': 'from-purple-400 via-violet-500 to-fuchsia-500',
    'emergency': 'from-red-400 via-rose-500 to-orange-500',
    'disease': 'from-violet-400 via-purple-500 to-indigo-500',
    'mental': 'from-pink-400 via-rose-500 to-fuchsia-500',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 pb-24">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-600" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4 animate-float" style={{ animationDelay: '0s' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4 animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-white/5 rounded-full animate-breathe" />
        
        <div className="max-w-md mx-auto px-4 pt-6 pb-8 relative z-10">
          <div className="flex items-center gap-4 mb-6 animate-stagger-fade card-stagger-1">
            <button 
              onClick={() => onNavigate('home')}
              className="p-2.5 -ml-2 rounded-2xl bg-white/15 backdrop-blur-md hover:bg-white/25 transition-all active-scale border border-white/10"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                健康手册
              </h1>
              <p className="text-sm text-white/70 mt-0.5">专业的宠物护理知识库</p>
            </div>
          </div>

          <div className="relative animate-stagger-fade card-stagger-2">
            <Search className="w-5 h-5 text-white/50 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索健康知识..."
              className="w-full pl-12 pr-4 py-3.5 bg-white/15 backdrop-blur-xl rounded-2xl text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20 transition-all border border-white/10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <span className="text-white text-xs">×</span>
              </button>
            )}
          </div>
          {searchQuery.trim().length > 0 && !isSearching && (
            <div className="flex items-center justify-between mt-2 px-1 animate-fadeIn">
              <span className="text-xs text-white/70">
                找到 {searchResults.length > 0 ? searchResults.length : filteredManuals.length} 条结果
              </span>
              <span className="text-xs text-white/70">
                搜索耗时 {lastSearchTime > 0 ? `${lastSearchTime.toFixed(1)}ms` : '<500ms'}
              </span>
            </div>
          )}
          {isSearching && (
            <div className="flex items-center justify-center mt-2 animate-pulse">
              <span className="text-xs text-white/70">正在搜索...</span>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 -mt-4 space-y-5">
        <div className="animate-stagger-fade card-stagger-2">
          <GlassCard 
            variant="elevated" 
            className="!p-3"
            enable3D={false}
          >
            <div className="flex gap-2">
              {[
                { key: 'both', label: '全部', icon: Sparkles },
                { key: 'cat', label: '猫咪', icon: null },
                { key: 'dog', label: '狗狗', icon: null },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setPetTypeFilter(filter.key as 'both' | 'cat' | 'dog')}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 active-scale ${
                    petTypeFilter === filter.key
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </GlassCard>
        </div>

        <div className="space-y-3 animate-stagger-fade card-stagger-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide flex items-center gap-2">
              <div className="w-1.5 h-4 rounded-full bg-gradient-to-b from-indigo-400 to-purple-500" />
              分类
            </h2>
          </div>
          
          {isLoading ? (
            <CategorySkeleton />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {MANUAL_CATEGORIES.map((category, index) => {
                const Icon = categoryIcons[category.id] || BookOpen;
                const isSelected = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(isSelected ? null : category.id)}
                    className={`relative p-4 rounded-2xl text-left transition-all duration-300 active-scale overflow-hidden group animate-card-enter ${
                      isSelected
                        ? 'bg-white shadow-xl shadow-indigo-500/10 border-2 border-indigo-400 scale-[1.02]'
                        : 'bg-white shadow-sm border border-neutral-100 hover:shadow-lg hover:border-neutral-200 hover:-translate-y-1'
                    }`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {isSelected && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500" />
                    )}
                    <div 
                      className={`w-11 h-11 rounded-xl flex items-center justify-center mb-2.5 transition-all duration-300 ${
                        isSelected 
                          ? 'scale-110 shadow-lg' 
                          : 'group-hover:scale-105'
                      }`}
                      style={{ 
                        background: isSelected 
                          ? `linear-gradient(135deg, ${category.color}, ${category.color}dd)`
                          : `${category.color}15`,
                        boxShadow: isSelected ? `0 8px 20px -4px ${category.color}40` : 'none'
                      }}
                    >
                      <Icon 
                        className={`w-5 h-5 transition-colors ${
                          isSelected ? 'text-white' : ''
                        }`}
                        style={{ color: isSelected ? 'white' : category.color }}
                      />
                    </div>
                    <h3 className="font-semibold text-neutral-800 text-sm">{category.name}</h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {getCategoryArticleCount(category.id as ManualCategory)}篇
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {popularManuals.length > 0 && selectedCategory === null && !isLoading && (
          <div className="space-y-3 animate-stagger-fade card-stagger-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide flex items-center gap-2">
                <div className="w-1.5 h-4 rounded-full bg-gradient-to-b from-amber-400 to-orange-500" />
                热门推荐
              </h2>
              <TrendingUp className="w-4 h-4 text-amber-500" />
            </div>
            <div className="space-y-3">
              {popularManuals.slice(0, 3).map((manual, index) => {
                const categoryColor = MANUAL_CATEGORIES.find(c => c.id === manual.category)?.color || '#6366F1';
                const categoryGradient = categoryGradients[manual.category] || 'from-indigo-400 via-purple-500 to-blue-500';
                return (
                  <div
                    key={manual.id}
                    onClick={() => console.log('View manual:', manual.id)}
                    className="group bg-white rounded-2xl shadow-sm border border-neutral-100 hover:shadow-xl hover:border-neutral-200 transition-all duration-300 cursor-pointer overflow-hidden active-scale animate-card-enter"
                    style={{ animationDelay: `${index * 0.08}s` }}
                  >
                    <div className="flex">
                      <div 
                        className="w-1.5 self-stretch bg-gradient-to-b"
                        style={{ 
                          background: `linear-gradient(to bottom, ${categoryColor}, ${categoryColor}88)` 
                        }}
                      />
                      <div className="flex-1 p-4">
                        <div className="flex items-start gap-3">
                          <div 
                            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${categoryGradient} shadow-lg transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300`}
                          >
                            <BookOpen className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-semibold text-neutral-800 group-hover:text-indigo-600 transition-colors">{manual.title}</h3>
                              {manual.isPopular && (
                                <span className="flex-shrink-0 px-2 py-0.5 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 rounded-full text-xs font-medium">
                                  热门
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-neutral-500 line-clamp-2 mt-1">{manual.summary}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="flex items-center gap-1 text-xs text-neutral-400">
                                <Clock className="w-3 h-3" />
                                {manual.readTime}分钟
                              </span>
                              {manual.verifiedByVet && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.642.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 00-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 00-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 00-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  执业兽医审核
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookmark(manual.id);
                            }}
                            className={`p-2 rounded-xl transition-all duration-200 flex-shrink-0 ${
                              bookmarks.includes(manual.id)
                                ? 'bg-indigo-100 text-indigo-500'
                                : 'bg-neutral-100 text-neutral-400 hover:bg-indigo-50 hover:text-indigo-400'
                            }`}
                          >
                            <Bookmark 
                              className={`w-4 h-4 ${
                                bookmarks.includes(manual.id) ? 'fill-current' : ''
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-3 animate-stagger-fade card-stagger-5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide flex items-center gap-2">
              <div className="w-1.5 h-4 rounded-full bg-gradient-to-b from-emerald-400 to-teal-500" />
              {selectedCategory ? MANUAL_CATEGORIES.find(c => c.id === selectedCategory)?.name : '全部内容'}
            </h2>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-xs text-indigo-500 font-medium hover:text-indigo-600 transition-colors"
              >
                清除筛选
              </button>
            )}
          </div>
          
          {isLoading ? (
            <ManualSkeleton />
          ) : filteredManuals.length === 0 ? (
            <GlassCard variant="subtle" className="text-center py-12">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-neutral-300" />
              </div>
              <h3 className="font-semibold text-neutral-600 mb-1">没有找到相关内容</h3>
              <p className="text-sm text-neutral-400">试试其他关键词或分类</p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {filteredManuals.map((manual, index) => {
                const categoryColor = MANUAL_CATEGORIES.find(c => c.id === manual.category)?.color || '#6366F1';
                const categoryGradient = categoryGradients[manual.category] || 'from-indigo-400 via-purple-500 to-blue-500';
                const Icon = categoryIcons[manual.category] || BookOpen;
                return (
                  <div
                    key={manual.id}
                    onClick={() => console.log('View manual:', manual.id)}
                    className="group bg-white rounded-2xl shadow-sm border border-neutral-100 hover:shadow-xl hover:border-neutral-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden active-scale animate-card-enter"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex">
                      <div 
                        className="w-1.5 self-stretch bg-gradient-to-b"
                        style={{ 
                          background: `linear-gradient(to bottom, ${categoryColor}, ${categoryColor}88)` 
                        }}
                      />
                      <div className="flex-1 p-4">
                        <div className="flex items-start gap-3">
                          <div 
                            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${categoryGradient} shadow-lg transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300`}
                          >
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-neutral-800 group-hover:text-indigo-600 transition-colors">{manual.title}</h3>
                            <p className="text-sm text-neutral-500 line-clamp-2 mt-1">{manual.summary}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="flex items-center gap-1 text-xs text-neutral-400">
                                <Clock className="w-3 h-3" />
                                {manual.readTime}分钟
                              </span>
                              <span 
                                className="px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{ 
                                  backgroundColor: `${categoryColor}15`,
                                  color: categoryColor
                                }}
                              >
                                {MANUAL_CATEGORIES.find(c => c.id === manual.category)?.name}
                              </span>
                              {manual.verifiedByVet && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.642.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 00-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 00-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 00-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  执业兽医审核
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookmark(manual.id);
                            }}
                            className={`p-2 rounded-xl transition-all duration-200 flex-shrink-0 ${
                              bookmarks.includes(manual.id)
                                ? 'bg-indigo-100 text-indigo-500'
                                : 'bg-neutral-100 text-neutral-400 hover:bg-indigo-50 hover:text-indigo-400'
                            }`}
                          >
                            <Bookmark 
                              className={`w-4 h-4 ${
                                bookmarks.includes(manual.id) ? 'fill-current' : ''
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};