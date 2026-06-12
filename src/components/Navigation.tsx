// ============================================
// PawSync Pro - Navigation.tsx
//
// 作者: 带娃的小陈工
// 日期: 2026-06-12
// 描述: 固定底部导航栏 - Apple风格设计
// ============================================

import React, { memo, useMemo, useCallback } from 'react';
import { Home, Camera, PlusCircle, Heart, User } from 'lucide-react';
import { useResponsiveStyle } from '../lib/responsive';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

// 导航项配置
const navItems = [
  { id: 'home', label: '首页', icon: Home },
  { id: 'devices', label: '设备', icon: Camera },
  { id: 'records', label: '记录', icon: PlusCircle, isFab: true },
  { id: 'health', label: '健康', icon: Heart },
  { id: 'profile', label: '我的', icon: User },
];

// 单个导航项组件
const NavItem = memo(({ 
  label, 
  icon: Icon, 
  isActive, 
  onClick,
  isFab = false,
  colors
}: { 
  label: string; 
  icon: React.ElementType; 
  isActive: boolean; 
  onClick: () => void;
  isFab?: boolean;
  colors: {
    activeBg: string;
    activeText: string;
    inactiveText: string;
    fabBg: string;
    fabShadow: string;
  };
}) => {
  const handleClick = useCallback(() => {
    onClick();
  }, [onClick]);

  // FAB按钮样式 - 中央凸起按钮
  if (isFab) {
    return (
      <button
        onClick={handleClick}
        className="flex flex-col items-center justify-center relative group"
        aria-label={label}
        aria-current={isActive ? 'page' : undefined}
      >
        {/* FAB容器 */}
        <div 
          className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ease-out ${
            isActive 
              ? `${colors.fabBg} ${colors.fabShadow} scale-105` 
              : `${colors.fabBg} ${colors.fabShadow} hover:scale-105 active:scale-95`
          }`}
        >
          {/* 内圈光晕效果 */}
          <div className={`absolute inset-1 rounded-full ${isActive ? 'bg-white/20' : 'bg-white/10'} transition-opacity`} />
          
          {/* 图标 */}
          <Icon className="w-7 h-7 text-white relative z-10 transition-transform duration-300 group-hover:rotate-12" />
          
          {/* 活动状态指示环 */}
          {isActive && (
            <div className="absolute inset-0 rounded-full ring-2 ring-white/30 animate-pulse" />
          )}
        </div>
        
        {/* 标签 */}
        <span 
          className={`text-xs font-medium mt-2 transition-all duration-300 ${
            isActive 
              ? `${colors.activeText} font-semibold scale-105` 
              : `${colors.inactiveText} group-hover:${colors.activeText}`
          }`}
        >
          {label}
        </span>
      </button>
    );
  }

  // 普通导航项样式
  return (
    <button
      onClick={handleClick}
      className={`flex flex-col items-center justify-center gap-1.5 py-2 px-3 rounded-xl transition-all duration-300 ease-out group relative ${
        isActive 
          ? 'bg-gradient-to-br from-orange-50 to-orange-100/80' 
          : 'hover:bg-gray-50/80 active:bg-gray-100/60'
      }`}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* 图标容器 */}
      <div className={`relative transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
        {/* 活动状态背景圆 */}
        {isActive && (
          <div className={`absolute inset-0 rounded-lg ${colors.activeBg} opacity-20 blur-sm`} />
        )}
        
        {/* 图标 */}
        <Icon 
          className={`w-6 h-6 transition-all duration-300 ${
            isActive 
              ? `${colors.activeText} drop-shadow-sm` 
              : `${colors.inactiveText} group-hover:${colors.activeText}`
          }`}
        />
        
        {/* 活动状态指示点 */}
        {isActive && (
          <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${colors.activeBg} animate-pulse`} />
        )}
      </div>
      
      {/* 标签 */}
      <span 
        className={`text-xs transition-all duration-300 ${
          isActive 
            ? `${colors.activeText} font-semibold` 
            : `${colors.inactiveText} font-medium group-hover:${colors.activeText}`
        }`}
      >
        {label}
      </span>
      
      {/* 活动状态底部指示线 */}
      {isActive && (
        <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full ${colors.activeBg}`} />
      )}
    </button>
  );
});

NavItem.displayName = 'NavItem';

// 主导航组件
export const Navigation: React.FC<NavigationProps> = memo(({ currentPage, onNavigate }) => {
  const responsiveStyle = useResponsiveStyle();
  
  // 颜色配置 - 精细调整的颜色搭配
  const colors = useMemo(() => ({
    // 活动状态颜色 - 温暖的橙色系
    activeBg: 'bg-gradient-to-r from-orange-500 to-orange-400',
    activeText: 'text-orange-500',
    
    // 非活动状态颜色 - 柔和的灰色系
    inactiveText: 'text-gray-400',
    
    // FAB按钮颜色 - 醒目的橙色渐变
    fabBg: 'bg-gradient-to-br from-orange-500 via-orange-400 to-amber-500',
    fabShadow: 'shadow-lg shadow-orange-500/40',
    
    // 导航栏背景
    navBg: 'bg-gradient-to-t from-white via-white to-gray-50/30',
    navBorder: 'border-t border-gray-100/80',
  }), []);

  // 导航处理
  const handleNavigate = useCallback((page: string) => {
    requestAnimationFrame(() => {
      onNavigate(page);
    });
  }, [onNavigate]);

  return (
    <nav 
      className={`fixed bottom-0 left-0 right-0 z-50 ${colors.navBg} ${colors.navBorder} backdrop-blur-xl`}
      style={{
        paddingBottom: Math.max(0, (responsiveStyle.safeAreaPadding?.paddingBottom as number || 16)),
        paddingTop: '12px',
      }}
      role="navigation"
      aria-label="主导航"
    >
      {/* 顶部装饰线 */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-200/50 to-transparent" />
      
      {/* 导航内容 */}
      <div 
        className="max-w-md mx-auto flex justify-around items-end px-2"
        style={{
          paddingBottom: Math.max(8, ((responsiveStyle.safeAreaPadding?.paddingBottom as number || 16) - 4)),
        }}
      >
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            label={item.label}
            icon={item.icon}
            isActive={currentPage === item.id}
            onClick={() => handleNavigate(item.id)}
            isFab={item.isFab}
            colors={colors}
          />
        ))}
      </div>
      
      {/* 底部安全区域填充 */}
      <div 
        className="absolute bottom-0 left-0 right-0 bg-white/95"
        style={{
          height: 'env(safe-area-inset-bottom, 0px)',
        }}
      />
    </nav>
  );
});

Navigation.displayName = 'Navigation';