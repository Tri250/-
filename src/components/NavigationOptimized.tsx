/**
 * PawSync Pro 4.0 温暖治愈版
 * 导航栏专家级优化 - 4-Tab结构
 * 
 * 产品经理优化要点：
 * 1. Tab结构：今日·宠物动态 → 健康·数据看板 → AI·智能伙伴 → 我的·宠物档案
 * 2. 视觉层次：每个Tab有独立色彩标识，与功能模块对应
 * 3. 交互体验：Tab切换有流畅动画，当前Tab有明确指示
 * 4. 颜色搭配：暖橙(今日) + 薄荷绿(健康) + 薰衣草紫(AI) + 樱花粉(我的)
 */

import React, { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Home, Heart, Bot, User } from 'lucide-react';
import { cn } from '../lib/utils';

interface NavigationOptimizedProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

// ============================================================================
// 4-Tab配置 - 专家级色彩层级
// ============================================================================

const navTabs = [
  {
    id: 'home',
    label: '今日',
    icon: Home,
    page: 'home',
    // 暖橙 - 关爱、温暖、今日动态
    activeColor: 'text-primary-500',
    activeBg: 'bg-primary-50',
    inactiveColor: 'text-neutral-400',
  },
  {
    id: 'health',
    label: '健康',
    icon: Heart,
    page: 'health',
    // 薄荷绿 - 健康、专业、数据看板
    activeColor: 'text-secondary-500',
    activeBg: 'bg-secondary-50',
    inactiveColor: 'text-neutral-400',
  },
  {
    id: 'ai',
    label: 'AI',
    icon: Bot,
    page: 'ai-consultant',
    // 薰衣草紫 - 智能、神秘、AI伙伴
    activeColor: 'text-lavender-500',
    activeBg: 'bg-lavender-50',
    inactiveColor: 'text-neutral-400',
  },
  {
    id: 'profile',
    label: '我的',
    icon: User,
    page: 'profile',
    // 樱花粉 - 可爱、温柔、个人档案
    activeColor: 'text-sakura-500',
    activeBg: 'bg-sakura-50',
    inactiveColor: 'text-neutral-400',
  },
];

// ============================================================================
// Tab项组件
// ============================================================================

const NavTab = memo<{
  tab: typeof navTabs[0];
  isActive: boolean;
  onClick: () => void;
}>(({ tab, isActive, onClick }) => {
  const Icon = tab.icon;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all',
        isActive ? tab.activeBg : 'hover:bg-neutral-50'
      )}
      aria-label={tab.label}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* 图标 */}
      <motion.div
        initial={false}
        animate={{
          scale: isActive ? 1.1 : 1,
          y: isActive ? -2 : 0,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        <Icon 
          className={cn(
            'w-6 h-6 transition-colors',
            isActive ? tab.activeColor : tab.inactiveColor
          )}
        />
      </motion.div>
      
      {/* 标签 */}
      <motion.span
        initial={false}
        animate={{
          fontWeight: isActive ? 600 : 400,
        }}
        className={cn(
          'text-xs transition-colors',
          isActive ? tab.activeColor : tab.inactiveColor
        )}
      >
        {tab.label}
      </motion.span>
      
      {/* 活动指示器 */}
      {isActive && (
        <motion.div
          layoutId="nav-indicator"
          className={cn('w-1 h-1 rounded-full', tab.activeColor.replace('text-', 'bg-'))}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </button>
  );
});

NavTab.displayName = 'NavTab';

// ============================================================================
// 导航栏组件
// ============================================================================

export const NavigationOptimized: React.FC<NavigationOptimizedProps> = memo(({ currentPage, onNavigate }) => {
  // 判断当前Tab是否激活
  const getIsActive = useCallback((tabId: string, page: string) => {
    // 首页相关页面都归为"今日"
    if (tabId === 'home') {
      return ['home', 'health-records', 'reminders', 'translator'].includes(currentPage);
    }
    // 健康相关页面都归为"健康"
    if (tabId === 'health') {
      return ['health', 'advanced-health', 'health-report', 'health-manual'].includes(currentPage);
    }
    // AI相关页面都归为"AI"
    if (tabId === 'ai') {
      return ['ai-consultant', 'bond-emotion', 'camera-monitor'].includes(currentPage);
    }
    // 个人相关页面都归为"我的"
    if (tabId === 'profile') {
      return ['profile', 'pets', 'settings', 'favorites', 'help-feedback', 'developer-info'].includes(currentPage);
    }
    return currentPage === page;
  }, [currentPage]);

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40',
        'bg-white/95 backdrop-blur-lg',
        'border-t border-neutral-100',
        'px-4 py-2',
        'safe-area-bottom'
      )}
      role="navigation"
      aria-label="主导航"
    >
      <div className="max-w-md mx-auto flex justify-around items-center">
        {navTabs.map((tab) => (
          <NavTab
            key={tab.id}
            tab={tab}
            isActive={getIsActive(tab.id, tab.page)}
            onClick={() => onNavigate(tab.page)}
          />
        ))}
      </div>
      
      {/* 底部装饰线 */}
      <motion.div
        className={cn(
          'absolute bottom-0 left-0 right-0 h-px',
          'bg-gradient-to-r from-primary-500 via-secondary-500 to-lavender-500'
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
      />
    </nav>
  );
});

NavigationOptimized.displayName = 'NavigationOptimized';

export default NavigationOptimized;