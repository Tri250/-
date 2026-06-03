import React, { useState } from 'react';
import { Search, BookOpen, ChevronRight } from 'lucide-react';
import { Card } from '../components/DesignSystem/Card';

interface Article {
  id: string;
  categoryId: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  readTime: number;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
}

interface HealthManualPageProps {
  onNavigate?: (page: string) => void;
}

const CATEGORIES: Category[] = [
  { id: 'cat-1', name: '饮食营养', icon: '🍖', count: 12 },
  { id: 'cat-2', name: '疾病预防', icon: '💉', count: 18 },
  { id: 'cat-3', name: '行为训练', icon: '🎓', count: 9 },
  { id: 'cat-4', name: '日常护理', icon: '🛁', count: 15 },
  { id: 'cat-5', name: '心理健康', icon: '💚', count: 7 },
];

const ARTICLES: Article[] = [
  {
    id: 'art-1',
    categoryId: 'cat-1',
    title: '如何为猫咪选择合适的猫粮',
    summary: '不同年龄段、健康状况的猫咪对营养需求不同，本文帮你科学选择。',
    content: '选择猫粮时需要考虑年龄、体重、活动量等因素...',
    tags: ['营养', '猫粮'],
    readTime: 5,
  },
  {
    id: 'art-2',
    categoryId: 'cat-2',
    title: '犬类常见传染病预防',
    summary: '犬瘟热、犬细小等传染病的症状识别与预防措施。',
    content: '犬瘟热是由犬瘟热病毒引起的一种高度接触性传染病...',
    tags: ['传染病', '预防'],
    readTime: 8,
  },
  {
    id: 'art-3',
    categoryId: 'cat-3',
    title: '幼犬基础训练指南',
    summary: '从坐下到召回，幼犬训练的5个关键步骤。',
    content: '幼犬训练应从8周龄开始，使用正向激励方法...',
    tags: ['训练', '幼犬'],
    readTime: 10,
  },
];

export const HealthManualPage: React.FC<HealthManualPageProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredArticles = ARTICLES.filter((article) => {
    const matchesSearch = searchQuery === '' ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || article.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-peach-50 p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6 pt-4">
          <button
            onClick={() => onNavigate?.('home')}
            className="p-2 hover:bg-white rounded-full transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-gray-600 rotate-180" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">健康手册</h1>
            <p className="text-sm text-gray-500">专业的宠物健康知识库</p>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索健康知识..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-orange-400 transition-colors"
          />
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">分类</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !selectedCategory
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              全部
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                  selectedCategory === cat.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                <span className="text-xs opacity-70">({cat.count})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredArticles.length === 0 ? (
            <Card className="p-8 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">没有找到相关文章</p>
            </Card>
          ) : (
            filteredArticles.map((article) => (
              <Card key={article.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-peach-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 mb-1">{article.title}</h3>
                    <p className="text-sm text-gray-500 mb-2 line-clamp-2">{article.summary}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {article.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-gray-100 rounded-full">
                          {tag}
                        </span>
                      ))}
                      <span>· {article.readTime} 分钟阅读</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
