// ============================================
// PawSync Pro - Navigation.tsx
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 底部导航栏组件
// ============================================

import { Home, MessageCircle, Heart, GraduationCap, Shield, User, Sparkles } from 'lucide-react';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: 'home', icon: Home, label: '首页', color: 'text-primary-500', bg: 'bg-primary-50' },
  { id: 'translator', icon: MessageCircle, label: '翻译', color: 'text-primary-500', bg: 'bg-primary-50' },
  { id: 'training', icon: GraduationCap, label: '训练', color: 'text-purple-500', bg: 'bg-purple-50' },
  { id: 'health', icon: Heart, label: '健康', color: 'text-success-500', bg: 'bg-success-50' },
  { id: 'services', icon: Sparkles, label: '服务', color: 'text-secondary-500', bg: 'bg-secondary-50' },
  { id: 'profile', icon: User, label: '我的', color: 'text-neutral-500', bg: 'bg-neutral-100' },
];

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-neutral-100 px-2 py-2 z-50 shadow-lg">
      <div className="max-w-md mx-auto flex justify-between items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center py-2 px-3 rounded-2xl transition-all duration-300 ${
                isActive
                  ? `${item.color} ${item.bg} scale-105`
                  : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <Icon className={`w-6 h-6 mb-1 transition-all duration-300 ${isActive ? 'scale-110' : ''}`} />
              <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}