import React from 'react';
import { 
  ChevronLeft, 
  Heart, 
  Code, 
  Mail, 
  Github,
  Globe,
  Sparkles,
  Coffee,
  Calendar,
  MapPin
} from 'lucide-react';
import { Card } from '../components/DesignSystem';

interface DeveloperInfoPageProps {
  onNavigate: (page: string) => void;
}

export const DeveloperInfoPage: React.FC<DeveloperInfoPageProps> = ({ onNavigate }) => {
  const developerInfo = {
    name: '热爱生活的小陈工',
    title: '全栈开发者 & 宠物爱好者',
    avatar: '👨‍💻',
    bio: '一个热爱编程、热爱生活、热爱宠物的开发者。在带娃之余，用代码创造美好，让科技温暖每一个毛孩子。',
    tags: ['React', 'TypeScript', 'Node.js', 'AI', '宠物科技'],
    location: '中国',
    joinDate: '2024',
    stats: {
      projects: 10,
      stars: 128,
      coffee: 999
    }
  };

  const techStack = [
    { name: 'React', color: 'bg-blue-100 text-blue-600' },
    { name: 'TypeScript', color: 'bg-indigo-100 text-indigo-600' },
    { name: 'Tailwind CSS', color: 'bg-cyan-100 text-cyan-600' },
    { name: 'Node.js', color: 'bg-green-100 text-green-600' },
    { name: 'AI/ML', color: 'bg-purple-100 text-purple-600' },
    { name: 'Vite', color: 'bg-yellow-100 text-yellow-600' },
  ];

  const milestones = [
    { year: '2024', event: 'PawSync Pro 项目启动', emoji: '🚀' },
    { year: '2024', event: '宠物翻译AI引擎开发', emoji: '🧠' },
    { year: '2024', event: '健康监测系统上线', emoji: '📊' },
    { year: '2025', event: '用户突破10000+', emoji: '🎉' },
  ];

  const contactLinks = [
    { icon: Mail, label: '邮箱', value: 'developer@pawsync.com', color: 'bg-red-50 text-red-500' },
    { icon: Github, label: 'GitHub', value: '@pawsync-dev', color: 'bg-gray-100 text-gray-600' },
    { icon: Globe, label: '网站', value: 'pawsync.com', color: 'bg-blue-50 text-blue-500' },
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

        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center p-4">
            <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center mb-2">
              <Code className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-neutral-800">{developerInfo.stats.projects}</p>
            <p className="text-xs text-neutral-500">项目</p>
          </Card>
          <Card className="text-center p-4">
            <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center mb-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-neutral-800">{developerInfo.stats.stars}</p>
            <p className="text-xs text-neutral-500">获赞</p>
          </Card>
          <Card className="text-center p-4">
            <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mb-2">
              <Coffee className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-neutral-800">{developerInfo.stats.coffee}</p>
            <p className="text-xs text-neutral-500">杯咖啡</p>
          </Card>
        </div>

        <Card className="p-4">
          <h3 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <Code className="w-5 h-5 text-orange-500" />
            技术栈
          </h3>
          <div className="flex flex-wrap gap-2">
            {techStack.map((tech) => (
              <span 
                key={tech.name}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${tech.color}`}
              >
                {tech.name}
              </span>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-500" />
            开发历程
          </h3>
          <div className="space-y-3">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center text-lg">
                  {milestone.emoji}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-800">{milestone.event}</p>
                  <p className="text-xs text-neutral-500">{milestone.year}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-500" />
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