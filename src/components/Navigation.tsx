// ============================================
// PawSync Pro - SmartBottomNav
//
// 智能底部导航栏
//   · 4 Tab + 中间 FAB 展开菜单
//   · 滚动感知显示/隐藏
//   · 微交互: Liquid Glass + 物理动画
//   · 基于统一路由配置
// ============================================

import React, { memo, useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import {
  routeConfig,
  fabActions,
  type RouteId,
  type FabAction,
} from '../config/routes';

const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };
};

// ============================================
// NavItem - 单个Tab
// ============================================
const NavItem = memo(({
  label,
  icon: Icon,
  isActive,
  onClick,
  order,
}: {
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
  order: number;
}) => {
  const handleClick = useCallback(() => {
    onClick();
  }, [onClick]);

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex flex-col items-center justify-center gap-1 flex-1 h-full pt-2 pb-1',
        'transition-all duration-300',
        'active:scale-95',
        'group'
      )}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      style={{ animationDelay: `${order * 40}ms` }}
    >
      {/* 图标容器 */}
      <div
        className={cn(
          'relative w-11 h-11 rounded-2xl flex items-center justify-center',
          'transition-all duration-300 ease-out',
          isActive
            ? 'bg-gradient-to-br from-orange-100 via-amber-50 to-rose-100 shadow-[0_4px_14px_rgba(251,146,60,0.25)] scale-105'
            : 'hover:bg-cream-100/60'
        )}
      >
        {/* 激活态: 背景光晕 */}
        {isActive && (
          <div className="absolute inset-0 rounded-2xl opacity-50 animate-pulse-soft"
               style={{ background: 'radial-gradient(circle, rgba(251,146,60,0.25) 0%, transparent 70%)' }} />
        )}

        <Icon
          className={cn(
            'w-6 h-6 relative z-10 transition-all duration-300',
            isActive
              ? 'text-primary-500 drop-shadow-[0_1px_2px_rgba(251,146,60,0.3)]'
              : 'text-neutral-400 group-hover:text-neutral-600'
          )}
          strokeWidth={isActive ? 2.6 : 2}
        />
      </div>

      {/* 文字 */}
      <span
        className={cn(
          'text-[10px] leading-none transition-all duration-300 tracking-tight',
          isActive
            ? 'text-primary-500 font-semibold'
            : 'text-neutral-400 font-medium group-hover:text-neutral-600'
        )}
      >
        {label}
      </span>
    </button>
  );
});

NavItem.displayName = 'NavItem';

// ============================================
// FabMenuItem - FAB 展开后的单项
// ============================================
const FabMenuItem = memo(({
  action,
  index,
  isOpen,
  onClick,
}: {
  action: FabAction;
  index: number;
  isOpen: boolean;
  onClick: () => void;
}) => {
  const Icon = action.icon;
  const delay = index * 45;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 w-full',
        'px-4 py-3 rounded-2xl',
        'bg-white/70 backdrop-blur-md border border-white/60',
        'transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
        'shadow-[0_2px_8px_rgba(122,90,56,0.08)]',
        'hover:shadow-[0_4px_16px_rgba(122,90,56,0.12)] hover:bg-white/90',
        'active:scale-95',
        'origin-left',
        isOpen
          ? 'opacity-100 translate-x-0 scale-100'
          : 'opacity-0 -translate-x-3 scale-90 pointer-events-none'
      )}
      style={{
        transitionDelay: isOpen ? `${delay}ms` : `${120 - delay}ms`,
      }}
      aria-label={action.label}
    >
      {/* 图标 */}
      <div className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center',
        `bg-gradient-to-br ${action.gradient}`,
        'shadow-[0_2px_8px_rgba(0,0,0,0.1)]'
      )}>
        <Icon className="w-5 h-5 text-white drop-shadow-sm" strokeWidth={2.3} />
      </div>

      {/* 文字 */}
      <div className="flex-1 text-left">
        <div className="text-sm font-semibold text-neutral-800">{action.label}</div>
        <div className="text-[10px] text-neutral-500">{action.hint}</div>
      </div>
    </button>
  );
});

FabMenuItem.displayName = 'FabMenuItem';

// ============================================
// SmartBottomNav - 主组件
// ============================================
interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Navigation: React.FC<NavigationProps> = memo(({ currentPage, onNavigate }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [fabOpen, setFabOpen] = useState(false);
  const lastScrollY = useRef(0);

  // 底部 Tab
  const bottomTabs = routeConfig.bottomTabs;

  const debouncedNavigate = useMemo(
    () =>
      debounce((page: string) => {
        requestAnimationFrame(() => {
          onNavigate(page);
        });
      }, 50),
    [onNavigate]
  );

  const handleScroll = useMemo(
    () =>
      debounce(() => {
        const currentScrollY = window.scrollY;
        const diff = currentScrollY - lastScrollY.current;

        if (diff > 50 && currentScrollY > 120) {
          setIsVisible(false);
          setFabOpen(false);
        } else if (diff < -10 || currentScrollY < 120) {
          setIsVisible(true);
        }

        lastScrollY.current = currentScrollY;
      }, 100),
    []
  );

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // FAB 点击
  const handleFabClick = useCallback(() => {
    setFabOpen((open) => !open);
  }, []);

  // FAB 菜单项点击
  const handleFabAction = useCallback((action: FabAction) => {
    setFabOpen(false);
    if (action.route) {
      setTimeout(() => onNavigate(action.route as string), 120);
    }
    // action.action?.() // 当前项无自定义 action
  }, [onNavigate]);

  // 点击空白关闭
  useEffect(() => {
    if (!fabOpen) return;
    const handleOutside = () => setFabOpen(false);
    const handler = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-fab-container]')) {
        handleOutside();
      }
    };
    setTimeout(() => {
      document.addEventListener('mousedown', handler);
      document.addEventListener('touchstart', handler, { passive: true });
    }, 50);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [fabOpen]);

  // 是否底部 Tab
  const isCurrentBottomTab = (tabId: RouteId) => currentPage === tabId;

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40',
        'transition-transform duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
        isVisible ? 'translate-y-0' : 'translate-y-full'
      )}
      role="navigation"
      aria-label="主导航"
      data-fab-container
    >
      <div className="relative max-w-md mx-auto px-2">
        {/* === FAB 展开菜单 === */}
        <div
          className={cn(
            'absolute left-1/2 -translate-x-1/2 bottom-28 w-[92%]',
            'transition-all duration-300',
            fabOpen
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 translate-y-6 pointer-events-none'
          )}
        >
          {/* 背景遮罩 (点击空白可关闭) */}
          {fabOpen && (
            <div
              className="fixed inset-0 -z-10"
              onClick={() => setFabOpen(false)}
              aria-hidden="true"
            />
          )}

          <div
            className={cn(
              'rounded-3xl overflow-hidden',
              'p-3 space-y-2',
              'bg-white/85 backdrop-blur-2xl',
              'border border-white/60',
              'shadow-[0_-8px_40px_rgba(122,90,56,0.18),0_4px_20px_rgba(122,90,56,0.12)]',
              'transition-all duration-300'
            )}
            style={{
              transformOrigin: 'center bottom',
            }}
          >
            {/* 标题栏 */}
            <div className="flex items-center justify-between px-1 pt-1 pb-2">
              <div>
                <div className="text-sm font-bold text-neutral-800">快捷操作</div>
                <div className="text-[10px] text-neutral-500">选择要进行的操作</div>
              </div>
              <div className="text-[10px] text-neutral-400 bg-cream-100 px-2 py-1 rounded-full">
                点击空白可关闭
              </div>
            </div>

            {/* 动作项 */}
            {fabActions.map((action, index) => (
              <FabMenuItem
                key={action.id}
                action={action}
                index={index}
                isOpen={fabOpen}
                onClick={() => handleFabAction(action)}
              />
            ))}
          </div>

          {/* 指示箭头 */}
          <div
            className={cn(
              'absolute -bottom-3 left-1/2 -translate-x-1/2',
              'w-4 h-4 rotate-45',
              'bg-white/85 border-r border-b border-white/60',
              'backdrop-blur-2xl'
            )}
            style={{ boxShadow: '4px 4px 8px rgba(122,90,56,0.08)' }}
          />
        </div>

        {/* === 主栏 === */}
        <div
          className="relative h-24 mt-3"
        >
          {/* Liquid Glass 背景 */}
          <div
            className={cn(
              'absolute inset-x-0 bottom-0 h-16',
              'bg-white/90 backdrop-blur-2xl',
              'border-t border-cream-200/80',
              'shadow-[0_-4px_24px_rgba(122,90,56,0.10)]',
            )}
            style={{
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            {/* 顶部高光 */}
            <div
              className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-orange-200/60 to-transparent"
              aria-hidden="true"
            />
          </div>

          {/* === FAB 主按钮 === */}
          <button
            onClick={handleFabClick}
            className={cn(
              'absolute left-1/2 -translate-x-1/2 -top-4 z-20',
              'w-[72px] h-[72px] rounded-[26px]',
              'bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600',
              'text-white',
              'flex items-center justify-center',
              'active:scale-95 transition-transform duration-300',
              'shadow-[0_8px_24px_rgba(251,146,60,0.45),0_2px_6px_rgba(251,146,60,0.3)]',
              fabOpen && 'rotate-[135deg]'
            )}
            style={{
              transform: `translateX(-50%) ${fabOpen ? 'rotate(135deg)' : 'rotate(0deg)'}`,
              transition: 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            aria-label="快捷菜单"
            aria-expanded={fabOpen}
          >
            {/* 内部光晕 */}
            <div className="absolute inset-1.5 rounded-[22px] bg-gradient-to-br from-white/40 to-transparent opacity-60 pointer-events-none" />
            <Plus className="w-9 h-9 relative z-10" strokeWidth={2.4} />
          </button>

          {/* === 4 Tab === */}
          <div className="relative h-16 flex items-center justify-around">
            {/* 左半 Tab */}
            {bottomTabs.slice(0, 2).map((tab, idx) => (
              <NavItem
                key={tab.id}
                label={tab.title}
                icon={tab.icon}
                isActive={isCurrentBottomTab(tab.id)}
                onClick={() => debouncedNavigate(tab.id)}
                order={idx}
              />
            ))}

            {/* 中间 FAB 占位 */}
            <div className="w-[96px] h-full flex-shrink-0" />

            {/* 右半 Tab */}
            {bottomTabs.slice(2).map((tab, idx) => (
              <NavItem
                key={tab.id}
                label={tab.title}
                icon={tab.icon}
                isActive={isCurrentBottomTab(tab.id)}
                onClick={() => debouncedNavigate(tab.id)}
                order={idx + 2}
              />
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
});

Navigation.displayName = 'SmartBottomNav';

export default Navigation;
