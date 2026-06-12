/**
 * BottomNav V2 - 奶油极简风
 *
 * 特性：
 * - 奶油色背景 + 极淡顶部分割线
 * - 线框图标（未选中）/ 填充图标（选中）
 * - 选中态颜色变化 + 微上浮
 * - 居中FAB带柔和阴影
 * - 底部安全区域适配
 */

import React, { memo, useCallback } from 'react';
import { Home, Camera, Activity, User, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface BottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onAdd?: () => void;
}

// 线框图标组件
const NavIcon = memo(({
  icon: Icon,
  isActive,
  activeColor,
}: {
  icon: React.ElementType;
  isActive: boolean;
  activeColor: string;
}) => {
  return (
    <motion.div
      animate={{
        y: isActive ? -2 : 0,
        scale: isActive ? 1.05 : 1,
      }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      <Icon
        className="w-6 h-6 transition-all duration-200"
        style={{
          color: isActive ? activeColor : '#9CA3AF',
          strokeWidth: isActive ? 2.2 : 1.6,
          fill: isActive ? 'currentColor' : 'none',
        }}
      />
    </motion.div>
  );
});
NavIcon.displayName = 'NavIcon';

const navItems = [
  { id: 'home', label: '首页', icon: Home, color: '#F97316' },
  { id: 'devices', label: '设备', icon: Camera, color: '#F59E0B' },
  { id: 'add', label: '', icon: Plus, color: '#FFFFFF' },
  { id: 'records', label: '记录', icon: Activity, color: '#F97316' },
  { id: 'profile', label: '我的', icon: User, color: '#F97316' },
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
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(253, 248, 243, 0.95)',
        backdropFilter: 'blur(20px) saturate(180%)',
        borderTop: '0.5px solid rgba(0, 0, 0, 0.04)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      role="navigation"
      aria-label="主导航"
    >
      <div className="max-w-md mx-auto flex items-center justify-between px-2 h-[64px]">
        {navItems.slice(0, 2).map((item) => (
          <button
            key={item.id}
            onClick={() => handleClick(item.id)}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full active:opacity-60"
            aria-label={item.label}
            aria-current={currentPage === item.id ? 'page' : undefined}
          >
            <NavIcon
              icon={item.icon}
              isActive={currentPage === item.id}
              activeColor={item.color}
            />
            <span
              className="text-[10px] transition-all duration-200"
              style={{
                color: currentPage === item.id ? item.color : '#9CA3AF',
                fontWeight: currentPage === item.id ? 600 : 400,
              }}
            >
              {item.label}
            </span>
          </button>
        ))}

        {/* 居中FAB */}
        <div className="flex-1 flex justify-center">
          <motion.button
            onClick={() => handleClick('add')}
            whileTap={{ scale: 0.9 }}
            className="w-14 h-14 -mt-3 rounded-full flex items-center justify-center relative"
            style={{
              background: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
              boxShadow: '0 4px 16px rgba(59, 130, 246, 0.35)',
            }}
            aria-label="添加记录"
          >
            <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
          </motion.button>
        </div>

        {navItems.slice(3).map((item) => (
          <button
            key={item.id}
            onClick={() => handleClick(item.id)}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full active:opacity-60"
            aria-label={item.label}
            aria-current={currentPage === item.id ? 'page' : undefined}
          >
            <NavIcon
              icon={item.icon}
              isActive={currentPage === item.id}
              activeColor={item.color}
            />
            <span
              className="text-[10px] transition-all duration-200"
              style={{
                color: currentPage === item.id ? item.color : '#9CA3AF',
                fontWeight: currentPage === item.id ? 600 : 400,
              }}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
});

BottomNav.displayName = 'BottomNav';
