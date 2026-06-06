import React, { useState } from 'react';
import { 
  ChevronLeft, 
  Heart, 
  MessageSquare, 
  Image
} from 'lucide-react';
import { Card } from '../components/DesignSystem';
import { useAppStore } from '../store/appStore';

interface FavoritesPageProps {
  onNavigate: (page: string) => void;
}

export default function FavoritesPage({ onNavigate }: FavoritesPageProps) {
  const { analyses } = useAppStore();
  const [activeTab, setActiveTab] = useState<'all' | 'translations' | 'photos'>('all');

  const tabs = [
    { id: 'all', label: '全部', icon: Heart },
    { id: 'translations', label: '翻译', icon: MessageSquare },
    { id: 'photos', label: '照片', icon: Image },
  ];

  const emotionEmoji = {
    happy: '😸',
    anxious: '😰',
    angry: '😾',
    needs: '🥺',
    neutral: '😐',
  };

  const favoriteTranslations = analyses.slice().reverse().slice(0, 10);

  const favoritePhotos = [
    { id: 1, date: '2026-01-15', description: '小橘在阳光下打盹', emoji: '🐱' },
    { id: 2, date: '2026-01-14', description: '第一次成功握手', emoji: '🐕' },
    { id: 3, date: '2026-01-13', description: '玩球时的开心模样', emoji: '😺' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      <header className="bg-gradient-to-br from-pink-500 to-rose-500 text-white px-4 py-6">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <button 
            onClick={() => onNavigate('profile')}
            className="p-2 -ml-2 rounded-full bg-white/20 backdrop-blur hover:bg-white/30 transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">我的收藏</h1>
            <p className="text-sm text-white/80">珍藏的精彩时刻</p>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4">
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'all' | 'translations' | 'photos')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-pink-500 text-white shadow-lg'
                    : 'bg-white text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 space-y-4">
        {(activeTab === 'all' || activeTab === 'translations') && (
          <div>
            <h2 className="text-sm font-semibold text-neutral-500 mb-3 px-1">收藏的翻译</h2>
            <Card className="overflow-hidden">
              {favoriteTranslations.length > 0 ? (
                favoriteTranslations.map((item, index) => (
                  <div 
                    key={item.id}
                    className={`flex items-center gap-4 p-4 ${
                      index !== favoriteTranslations.length - 1 ? 'border-b border-neutral-100' : ''
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center text-2xl">
                      {emotionEmoji[item.result.emotion]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-800 truncate">{item.result.translation}</p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {new Date(item.createdAt).toLocaleDateString('zh-CN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <button className="p-2 rounded-full hover:bg-pink-50 text-pink-500 transition-colors">
                      <Heart className="w-5 h-5 fill-current" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                    <MessageSquare className="w-8 h-8 text-neutral-400" />
                  </div>
                  <p className="text-neutral-500">暂无收藏的翻译</p>
                  <p className="text-sm text-neutral-400 mt-1">翻译后点击收藏即可保存</p>
                </div>
              )}
            </Card>
          </div>
        )}

        {(activeTab === 'all' || activeTab === 'photos') && (
          <div>
            <h2 className="text-sm font-semibold text-neutral-500 mb-3 px-1">收藏的照片</h2>
            <Card className="overflow-hidden">
              {favoritePhotos.length > 0 ? (
                favoritePhotos.map((photo, index) => (
                  <div 
                    key={photo.id}
                    className={`flex items-center gap-4 p-4 ${
                      index !== favoritePhotos.length - 1 ? 'border-b border-neutral-100' : ''
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-2xl">
                      {photo.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-800 truncate">{photo.description}</p>
                      <p className="text-xs text-neutral-500 mt-1">{photo.date}</p>
                    </div>
                    <button className="p-2 rounded-full hover:bg-pink-50 text-pink-500 transition-colors">
                      <Heart className="w-5 h-5 fill-current" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                    <Image className="w-8 h-8 text-neutral-400" />
                  </div>
                  <p className="text-neutral-500">暂无收藏的照片</p>
                  <p className="text-sm text-neutral-400 mt-1">拍照后点击收藏即可保存</p>
                </div>
              )}
            </Card>
          </div>
        )}

        <div className="text-center text-xs text-neutral-400 py-4">
          共 {favoriteTranslations.length + favoritePhotos.length} 个收藏
        </div>
      </main>
    </div>
  );
};