// ============================================
// Lazy Load Utilities - 懒加载工具
// P1-3: 性能优化 - 路由懒加载、组件懒加载
// ============================================

import React, { lazy, Suspense, ComponentType, ReactNode } from 'react';
import { LoadingIndicator } from '../components/ui/MicroInteractions';

// ============================================
// 路由懒加载包装器
// ============================================
interface LazyRouteOptions {
  fallback?: ReactNode;
  delay?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyRoute<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  options: LazyRouteOptions = {}
): React.FC<Record<string, unknown>> {
  const { fallback, delay = 0 } = options;

  const LazyComponent = lazy(() => {
    if (delay > 0) {
      return Promise.all([
        factory(),
        new Promise<void>(resolve => setTimeout(resolve, delay))
      ]).then(([moduleExports]) => moduleExports);
    }
    return factory();
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LazyRouteWrapper: React.FC<Record<string, unknown>> = (props) => {
    return React.createElement(
      Suspense,
      { fallback: fallback || React.createElement(LoadingIndicator, { text: '加载中...' }) },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      React.createElement(LazyComponent as React.ComponentType<any>, props as any)
    );
  };

  return LazyRouteWrapper;
}

// ============================================
// 图片懒加载 Hook
// ============================================
import { useEffect, useRef, useState, useCallback } from 'react';

interface UseLazyImageOptions {
  rootMargin?: string;
  threshold?: number;
  placeholder?: string;
}

export function useLazyImage(
  src: string,
  options: UseLazyImageOptions = {}
) {
  const { rootMargin = '50px', threshold = 0.01, placeholder } = options;
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder || '');
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  useEffect(() => {
    if (!isInView) return;

    const img = new Image();
    img.src = src;
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
    };
  }, [isInView, src]);

  return { ref: imgRef, src: currentSrc, isLoaded, isInView };
}

// ============================================
// 无限滚动 Hook
// ============================================
interface UseInfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}

export function useInfiniteScroll(options: UseInfiniteScrollOptions) {
  const { threshold = 0, rootMargin = '100px', onLoadMore, hasMore, isLoading } = options;
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold, rootMargin }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin, onLoadMore, hasMore, isLoading]);

  return loaderRef;
}

// ============================================
// 虚拟列表 Hook
// ============================================
interface UseVirtualListOptions<T> {
  items: T[];
  itemHeight: number;
  overscan?: number;
  containerHeight: number;
}

interface VirtualListState<T> {
  virtualItems: Array<{ item: T; index: number; style: React.CSSProperties }>;
  totalHeight: number;
  startIndex: number;
  endIndex: number;
}

export function useVirtualList<T>(options: UseVirtualListOptions<T>): VirtualListState<T> {
  const { items, itemHeight, overscan = 5, containerHeight } = options;
  const [scrollTop] = useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const virtualItems = items.slice(startIndex, endIndex + 1).map((item, index) => ({
    item,
    index: startIndex + index,
    style: {
      position: 'absolute' as const,
      top: (startIndex + index) * itemHeight,
      height: itemHeight,
      left: 0,
      right: 0,
    },
  }));

  const totalHeight = items.length * itemHeight;

  return { virtualItems, totalHeight, startIndex, endIndex };
}

// ============================================
// 防抖 Hook
// ============================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebounce<T extends (...args: any[]) => unknown>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    },
    [callback, delay]
  );
}

// ============================================
// 节流 Hook
// ============================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useThrottle<T extends (...args: any[]) => unknown>(
  callback: T,
  limit: number
): (...args: Parameters<T>) => void {
  const inThrottle = useRef(false);

  return useCallback(
    (...args: Parameters<T>) => {
      if (!inThrottle.current) {
        callback(...args);
        inThrottle.current = true;
        setTimeout(() => {
          inThrottle.current = false;
        }, limit);
      }
    },
    [callback, limit]
  );
}

// ============================================
// 预加载资源
// ============================================
export function prefetchResources(resources: string[]): Promise<void[]> {
  const promises = resources.map((resource) => {
    return new Promise<void>((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = resource;
      link.onload = () => resolve();
      link.onerror = () => reject();
      document.head.appendChild(link);
    });
  });

  return Promise.all(promises);
}

// ============================================
// 组件预加载
// ============================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function prefetchComponent<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): Promise<{ default: T }> {
  return factory();
}
