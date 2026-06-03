import React from 'react';
import { 
  ChevronLeft, 
  Heart, 
  Calendar,
  MapPin,
  Music,
  BookOpen
} from 'lucide-react';
import { Card } from '../components/DesignSystem';

interface DeveloperInfoPageProps {
  onNavigate: (page: string) => void;
}

export const DeveloperInfoPage: React.FC<DeveloperInfoPageProps> = ({ onNavigate }) => {
  const developerInfo = {
    name: '热爱生活的小陈',
    title: '全栈开发者 & 宠物爱好者',
    avatar: '👨‍💻',
    bio: '一个热爱编程、热爱生活、热爱宠物的开发者。在带娃之余，用代码创造美好，让科技温暖每一个毛孩子。',
    location: '中国',
    joinDate: '2026',
  };

  const contactLinks = [
    { icon: Music, label: '抖音', value: '搜索"带娃的小陈工"', color: 'bg-black text-white' },
    { icon: BookOpen, label: '小红书', value: '搜索"带娃的小陈工"', color: 'bg-red-500 text-white' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-white to-pink-50/30 pb-24">
      <header className="bg-gradient-to-br from-orange-400 to-pink-500 text-white px-4 py-6">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <button 
            onClick={() => onNavigate('profile')}
            className="p-2 -ml-2 rounded-full bg-white/20 backdrop-blur hover:bg-white/30 transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">开发作者</h1>
            <p className="text-sm text-white/80">了解幕后创作者</p>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        <Card className="text-center p-6 bg-gradient-to-br from-white to-orange-50">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center text-4xl mb-4 shadow-lg">
            {developerInfo.avatar}
          </div>
          <h2 className="text-xl font-bold text-neutral-800">{developerInfo.name}</h2>
          <p className="text-sm text-neutral-500 mt-1">{developerInfo.title}</p>
          
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-xs">
              <MapPin className="w-3 h-3" />
              {developerInfo.location}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-pink-100 text-pink-600 text-xs">
              <Calendar className="w-3 h-3" />
              {developerInfo.joinDate}年开始
            </span>
          </div>

          <p className="text-sm text-neutral-600 mt-4 leading-relaxed px-2">
            {developerInfo.bio}
          </p>

          <div className="flex items-center justify-center gap-1 mt-4">
            <Heart className="w-4 h-4 text-pink-500 fill-current" />
            <span className="text-sm text-pink-500">热爱生活 · 热爱编程 · 热爱宠物</span>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            联系方式
          </h3>
          <div className="space-y-3">
            {contactLinks.map((link, index) => {
              const Icon = link.icon;
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${link.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-800">{link.label}</p>
                    <p className="text-xs text-neutral-500">{link.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-r from-orange-50 to-pink-50">
          <div className="text-center">
            <p className="text-sm text-neutral-600 leading-relaxed">
              "每一只宠物都值得被理解，每一个生命都值得被关爱。"
            </p>
            <p className="text-xs text-neutral-500 mt-2">— 热爱生活的小陈工</p>
          </div>
        </Card>

        <div className="text-center text-xs text-neutral-400 py-4">
          Made with ❤️ by 热爱生活的小陈工
        </div>
      </main>
    </div>
  );
};