import React, { memo, useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { Home, Camera, PlusCircle, Heart, User } from 'lucide-react';

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
  label, 
  icon: Icon, 
  isActive, 
  onClick,
  isFab = false
}: { 
  label: string; 
  icon: React.ElementType; 
  isActive: boolean; 
  onClick: () => void;
  isFab?: boolean;
}) => {
  const handleClick = useCallback(() => {
    onClick();
  }, [onClick]);

  if (isFab) {
    return (
      <button
        onClick={handleClick}
        className="flex flex-col items-center -mt-6"
        aria-label={label}
        aria-current={isActive ? 'page' : undefined}
      >
        <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
          isActive 
            ? 'bg-orange-500 shadow-orange-500/40' 
            : 'bg-orange-400 shadow-orange-400/30 hover:bg-orange-500'
        }`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <span className={`text-xs font-medium mt-1 transition-all ${
          isActive ? 'text-orange-500 font-semibold' : 'text-gray-400'
        }`}>
          {label}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
        isActive
          ? 'text-orange-500'
          : 'text-gray-400 hover:text-gray-600'
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
  { id: 'devices', label: '设备', icon: Camera },
  { id: 'records', label: '记录', icon: PlusCircle, isFab: true },
  { id: 'health', label: '健康', icon: Heart },
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
      <div className="max-w-md mx-auto flex justify-between sm:justify-around items-end px-2 sm:px-4 pb-2">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            label={item.label}
            icon={item.icon}
            isActive={currentPage === item.id}
            onClick={() => debouncedNavigate(item.id)}
            isFab={(item as any).isFab}
          />
        ))}
      </div>
    </nav>
  );
});

Navigation.displayName = 'Navigation';