import React from 'react';
import { Home, Heart, BookOpen, Calendar, User, Bot, FileText, TrendingUp, GraduationCap, Camera, Shield, Sparkles } from 'lucide-react';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPage, onNavigate }) => {
  const navItems = [
    { id: 'home', label: '首页', icon: Home },
    { id: 'advanced-health', label: '健康', icon: Shield },
    { id: 'bond-emotion', label: '情感', icon: Sparkles },
    { id: 'camera-monitor', label: '监控', icon: Camera },
    { id: 'profile', label: '我的', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-4 py-3 z-40">
      <div className="max-w-md mx-auto flex justify-around items-center">
        {navItems.map((item, index) => {
          const isActive = currentPage === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                isActive
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <Icon 
                className={`w-6 h-6 transition-transform duration-300 ${
                  isActive ? 'scale-110' : ''
                }`}
              />
              <span className={`text-xs font-medium transition-all ${
                isActive ? 'font-semibold' : ''
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
