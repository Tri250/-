/**
 * BottomNav 2026 - 顶级毛玻璃底部导航
 *
 * 特性：
 * - 液态玻璃背景（backdrop-filter: blur 24px + 饱和度）
 * - 超细顶部分割线
 * - 居中FAB带光晕阴影
 * - 微弹性按下动画
 * - 选中态：图标缩放+底部指示器
 * - 安全区域适配
 */

import React, { memo, useCallback, useState } from 'react';
import { Home, Camera, Activity, User, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { springs, shadows } from '../styles/design-system';

interface BottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onAdd?: () => void;
}

const NavItem = memo(({
  label,
  icon: Icon,
  isActive,
  onClick,
  activeColor,
}: {
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
  activeColor: string;
}) => {
  return (
    <motion.button
      onClick={onClick}
      className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-14 active:opacity-70"
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      whileTap={{ scale: 0.92 }}
      transition={springs.tap}
    >
      {/* 选中态顶部指示器 */}
      {isActive && (
        <motion.div
          layoutId="nav-indicator"
          className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full"
          style={{ background: activeColor }}
          transition={springs.smooth}
        />
      )}

      <motion.div
        animate={{
          scale: isActive ? 1.1 : 1,
          y: isActive ? -1 : 0,
        }}
        transition={springs.smooth}
      >
        <Icon
          className="w-[22px] h-[22px] transition-colors duration-200"
          style={{
            color: isActive ? activeColor : '#9ca3af',
            strokeWidth: isActive ? 2.5 : 1.8,
          }}
        />
      </motion.div>

      <span
        className="text-[10px] font-medium tracking-tight transition-all duration-200"
        style={{
          color: isActive ? activeColor : '#9ca3af',
          fontWeight: isActive ? 600 : 500,
        }}
      >
        {label}
      </span>
    </motion.button>
  );
});
NavItem.displayName = 'NavItem';

const navItems = [
  { id: 'home', label: '首页', icon: Home, color: '#f97316' },
  { id: 'devices', label: '设备', icon: Camera, color: '#f59e0b' },
  { id: 'add', label: '', icon: Plus, color: '#ffffff' },
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
      className="fixed bottom-0 left-0 right-0 z-40"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      role="navigation"
      aria-label="主导航"
    >
      {/* 液态玻璃背景 */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(255, 255, 255, 0.72)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          borderTop: '0.5px solid rgba(0, 0, 0, 0.06)',
        }}
      />

      <div className="relative max-w-md mx-auto flex items-center justify-between px-1">
        {navItems.slice(0, 2).map((item) => (
          <NavItem
            key={item.id}
            label={item.label}
            icon={item.icon}
            isActive={currentPage === item.id}
            onClick={() => handleClick(item.id)}
            activeColor={item.color}
          />
        ))}

        {/* 居中FAB */}
        <div className="flex-1 flex justify-center">
          <motion.button
            onClick={() => handleClick('add')}
            className="relative w-[60px] h-[60px] -mt-6 rounded-full flex items-center justify-center"
            aria-label="添加记录"
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            transition={springs.tap}
          >
            {/* 外层光晕 */}
            <div
              className="absolute inset-0 rounded-full opacity-50"
              style={{
                background: 'radial-gradient(circle, rgba(96,165,250,0.4) 0%, transparent 70%)',
                filter: 'blur(8px)',
              }}
            />
            {/* 主圆形 */}
            <div
              className="relative w-[52px] h-[52px] rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
                boxShadow: shadows.blue,
              }}
            >
              <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
          </motion.button>
        </div>

        {navItems.slice(3).map((item) => (
          <NavItem
            key={item.id}
            label={item.label}
            icon={item.icon}
            isActive={currentPage === item.id}
            onClick={() => handleClick(item.id)}
            activeColor={item.color}
          />
        ))}
      </div>
    </nav>
  );
});

BottomNav.displayName = 'BottomNav';
