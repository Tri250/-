import React from 'react';
import { Home, Heart, Video, Smile, User } from 'lucide-react';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPage, onNavigate }) => {
  const navItems = [
    { id: 'home', label: '首页', icon: Home },
    { id: 'health', label: '健康', icon: Heart },
    { id: 'monitor', label: '监控', icon: Video },
    { id: 'bond', label: '情感', icon: Smile },
    { id: 'profile', label: '我的', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-orange-100/50 px-4 py-3 z-40 safe-area-bottom">
      <div className="max-w-md mx-auto flex justify-around items-center">
        {navItems.map((item, index) => {
          const isActive = currentPage === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-300 ${
                isActive
                  ? 'text-orange-600 bg-orange-50 shadow-lg shadow-orange-100'
                  : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <Icon 
                className={`w-6 h-6 transition-all duration-300 ${
                  isActive ? 'scale-110' : ''
                }`}
              />
              <span className={`text-xs font-medium transition-all duration-300 ${
                isActive ? 'font-bold' : ''
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
