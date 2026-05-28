
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Heart, BookOpen, Calendar, User, Bot, FileText, TrendingUp, GraduationCap, Camera, Shield, Sparkles } from 'lucide-react';

export const Navigation: React.FC = () => {
  const location = useLocation();
  
  const navItems = [
    { id: 'home', label: '首页', icon: Home, path: '/' },
    { id: 'health', label: '健康', icon: Shield, path: '/health-records' },
    { id: 'ai', label: 'AI顾问', icon: Bot, path: '/ai-consultant' },
    { id: 'camera', label: '监控', icon: Camera, path: '/camera-monitor' },
    { id: 'profile', label: '我的', icon: User, path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-4 py-3 z-40">
      <div className="max-w-md mx-auto flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.id}
              to={item.path}
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
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
