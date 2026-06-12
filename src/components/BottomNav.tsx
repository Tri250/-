/**
 * BottomNav - 底部5列导航 + 居中FAB按钮
 *
 * 设计参考：温色系宠物APP，5列分布，中间悬浮+号按钮
 */

import React, { memo, useCallback } from 'react';
import { Home, Camera, Activity, User, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface BottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onAdd?: () => void;
}

interface NavItemProps {
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
  color: string;
}

const NavItem = memo(({ label, icon: Icon, isActive, onClick, color }: NavItemProps) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 flex-1 py-1.5 transition-all active:scale-95"
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon
        className={`w-6 h-6 transition-all duration-200 ${
          isActive ? 'scale-110' : 'opacity-60'
        }`}
        style={isActive ? { color, strokeWidth: 2.5 } : { color: '#9ca3af', strokeWidth: 2 }}
      />
      <span
        className={`text-[11px] font-medium transition-all ${
          isActive ? 'font-semibold' : ''
        }`}
        style={isActive ? { color } : { color: '#9ca3af' }}
      >
        {label}
      </span>
    </button>
  );
});
NavItem.displayName = 'NavItem';

const navItems = [
  { id: 'home', label: '首页', icon: Home, color: '#3b82f6' },
  { id: 'devices', label: '设备', icon: Camera, color: '#f59e0b' },
  { id: 'add', label: '', icon: Plus, color: '#ffffff' }, // 居中FAB占位
  { id: 'records', label: '记录', icon: Activity, color: '#f97316' },
  { id: 'profile', label: '我的', icon: User, color: '#f97316' },
];

export const BottomNav: React.FC<BottomNavProps> = memo(({ currentPage, onNavigate, onAdd }) => {
  const handleClick = useCallback((id: string) => {
    if (id === 'add') {
      onAdd?.();
      return;
    }
    onNavigate(id);
  }, [onNavigate, onAdd]);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      role="navigation"
      aria-label="主导航"
    >
      <div className="max-w-md mx-auto flex items-center justify-between px-2 py-2">
        {navItems.slice(0, 2).map((item) => (
          <NavItem
            key={item.id}
            label={item.label}
            icon={item.icon}
            isActive={currentPage === item.id}
            onClick={() => handleClick(item.id)}
            color={item.color}
          />
        ))}

        {/* 居中悬浮 FAB 按钮 */}
        <div className="flex-1 flex justify-center">
          <motion.button
            onClick={() => handleClick('add')}
            className="w-14 h-14 -mt-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 shadow-lg shadow-blue-500/40 flex items-center justify-center active:scale-95"
            aria-label="添加记录"
            whileTap={{ scale: 0.92 }}
          >
            <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
          </motion.button>
        </div>

        {navItems.slice(3).map((item) => (
          <NavItem
            key={item.id}
            label={item.label}
            icon={item.icon}
            isActive={currentPage === item.id}
            onClick={() => handleClick(item.id)}
            color={item.color}
          />
        ))}
      </div>
    </nav>
  );
});

BottomNav.displayName = 'BottomNav';
