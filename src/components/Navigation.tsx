import React, { memo, useMemo, useCallback, useRef } from 'react';
import { Home, Shield, Sparkles, Camera, User } from 'lucide-react';

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

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const NavItem = memo(({ 
  label, 
  icon: Icon, 
  isActive, 
  onClick 
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
      className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
        isActive
          ? 'text-primary-600 bg-primary-50'
          : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50'
      }`}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon 
        className={`w-6 h-6 transition-transform duration-300 ${
          isActive ? 'scale-110' : ''
        }`}
      />
      <span className={`text-xs font-medium transition-all ${
        isActive ? 'font-semibold' : ''
      }`}>
        {label}
      </span>
    </button>
  );
});

NavItem.displayName = 'NavItem';

const navItems = [
  { id: 'home', label: '首页', icon: Home },
  { id: 'advanced-health', label: '健康', icon: Shield },
  { id: 'bond-emotion', label: '情感', icon: Sparkles },
  { id: 'camera-monitor', label: '监控', icon: Camera },
  { id: 'profile', label: '我的', icon: User },
];

export const Navigation: React.FC<NavigationProps> = memo(({ currentPage, onNavigate }) => {
  // 始终保持导航栏可见，移除滚动隐藏逻辑
  const navRef = useRef<HTMLElement>(null);

  const debouncedNavigate = useMemo(
    () => debounce((page: string) => {
      requestAnimationFrame(() => {
        onNavigate(page);
      });
    }, 50),
    [onNavigate]
  );

  return (
    <nav 
      ref={navRef}
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-4 py-3 z-40 safe-area-bottom"
      role="navigation"
      aria-label="主导航"
      style={{ 
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
      }}
    >
      <div className="max-w-md mx-auto flex justify-between sm:justify-around items-center px-2 sm:px-4">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            label={item.label}
            icon={item.icon}
            isActive={currentPage === item.id}
            onClick={() => debouncedNavigate(item.id)}
          />
        ))}
      </div>
    </nav>
  );
});

Navigation.displayName = 'Navigation';