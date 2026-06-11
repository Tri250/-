// ============================================
// PawSync Pro - Navigation.tsx
//
// 描述: 底部Tab栏 - 5个Tab + 中间圆形凸起"+"号FAB
// 奶油色/米色风格
// ============================================

import React, { memo, useMemo, useCallback, useRef, useEffect, useState } from 'react';
import {
  Home,
  Smartphone,
  ClipboardList,
  Heart,
  User,
  Plus,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };
};

const NavItem = memo(({
  label,
  icon: Icon,
  isActive,
  onClick,
}: {
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
}) => {
  const handleClick = useCallback(() => {
    onClick();
  }, [onClick]);

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex flex-col items-center justify-center gap-0.5 flex-1 h-full py-2 transition-all',
        'active-scale'
      )}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon
        className={cn(
          'w-6 h-6 transition-all duration-300',
          isActive
            ? 'text-primary-500 scale-110'
            : 'text-neutral-400'
        )}
        strokeWidth={isActive ? 2.5 : 2}
      />
      <span
        className={cn(
          'text-[10px] transition-all leading-none',
          isActive
            ? 'text-primary-500 font-semibold'
            : 'text-neutral-400 font-medium'
        )}
      >
        {label}
      </span>
    </button>
  );
});

NavItem.displayName = 'NavItem';

const navItems = [
  { id: 'home', label: '首页', icon: Home },
  { id: 'health-records', label: '记录', icon: ClipboardList },
  { id: 'health', label: '健康', icon: Heart },
  { id: 'profile', label: '我的', icon: User },
];

export const Navigation: React.FC<NavigationProps> = memo(({ currentPage, onNavigate }) => {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const navRef = useRef<HTMLElement>(null);

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

        if (diff > 50 && currentScrollY > 100) {
          setIsVisible(false);
        } else if (diff < -10 || currentScrollY < 100) {
          setIsVisible(true);
        }

        lastScrollY.current = currentScrollY;
      }, 100),
    []
  );

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  // 中间FAB点击 - 跳转到记录页
  const handleFabClick = useCallback(() => {
    onNavigate('health-records');
  }, [onNavigate]);

  return (
    <nav
      ref={navRef}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300',
        isVisible ? 'translate-y-0' : 'translate-y-full'
      )}
      role="navigation"
      aria-label="主导航"
    >
      <div className="relative max-w-md mx-auto h-20 px-2">
        {/* 背景栏 */}
        <div
          className="absolute inset-x-0 bottom-0 h-16 bg-white/95 backdrop-blur-xl border-t border-cream-200 shadow-[0_-4px_20px_rgba(122,90,56,0.08)]"
          style={{
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        />

        {/* FAB 中间圆形凸起按钮 */}
        <button
          onClick={handleFabClick}
          className={cn(
            'absolute left-1/2 -translate-x-1/2 -top-5 z-10',
            'w-16 h-16 rounded-full',
            'bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600',
            'text-white shadow-glow-cream',
            'flex items-center justify-center',
            'active-scale transition-transform hover:scale-105'
          )}
          aria-label="添加记录"
        >
          {/* 内部光晕 */}
          <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/30 to-transparent opacity-60" />
          <Plus className="w-8 h-8 relative z-10" strokeWidth={2.5} />
        </button>

        {/* 4个Tab */}
        <div className="relative h-16 flex items-center justify-around">
          {navItems.slice(0, 2).map((item) => (
            <NavItem
              key={item.id}
              label={item.label}
              icon={item.icon}
              isActive={currentPage === item.id}
              onClick={() => debouncedNavigate(item.id)}
            />
          ))}

          {/* 中间FAB占位 */}
          <div className="flex-1 h-full" />

          {navItems.slice(2).map((item) => (
            <NavItem
              key={item.id}
              label={item.label}
              icon={item.icon}
              isActive={currentPage === item.id}
              onClick={() => debouncedNavigate(item.id)}
            />
          ))}
        </div>
      </div>
    </nav>
  );
});

Navigation.displayName = 'Navigation';
