import React, { memo, useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { Home, Shield, Sparkles, Camera, User } from 'lucide-react';

const debounce = <T extends (...args: any[]) => any>(
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

const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          func(...lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  };
};

const useVisibilityChange = (
  onVisible?: () => void,
  onHidden?: () => void
): boolean => {
  const [isVisible, setIsVisible] = useState(!document.hidden);
  const onVisibleRef = useRef(onVisible);
  const onHiddenRef = useRef(onHidden);

  useEffect(() => {
    onVisibleRef.current = onVisible;
    onHiddenRef.current = onHidden;
  }, [onVisible, onHidden]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsVisible(visible);
      
      if (visible) {
        onVisibleRef.current?.();
      } else {
        onHiddenRef.current?.();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
};

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const NavItem = memo(({ 
  id, 
  label, 
  icon: Icon, 
  isActive, 
  onClick 
}: { 
  id: string; 
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
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const navRef = useRef<HTMLElement>(null);

  const debouncedNavigate = useMemo(
    () => debounce((page: string) => {
      requestAnimationFrame(() => {
        onNavigate(page);
      });
    }, 50),
    [onNavigate]
  );

  const handleScroll = useMemo(
    () => throttle(() => {
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

  useVisibilityChange(
    () => setIsVisible(true),
    () => setIsVisible(false)
  );

  return (
    <nav 
      ref={navRef}
      className={`fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-4 py-3 z-40 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
      role="navigation"
      aria-label="主导航"
    >
      <div className="max-w-md mx-auto flex justify-around items-center">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            id={item.id}
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