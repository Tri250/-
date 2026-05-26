/**
 * OPPO级别性能优化Hooks
 * 提供防抖、节流、懒加载等高性能功能
 */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  DependencyList,
} from 'react';

// 防抖Hook
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// 防抖回调Hook
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300,
  deps: DependencyList = []
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...deps]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

// 节流Hook
export function useThrottle<T>(value: T, limit: number = 300): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdateRef = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    if (now - lastUpdateRef.current >= limit) {
      lastUpdateRef.current = now;
      setThrottledValue(value);
    } else {
      const handler = setTimeout(() => {
        lastUpdateRef.current = Date.now();
        setThrottledValue(value);
      }, limit - (now - lastUpdateRef.current));

      return () => {
        clearTimeout(handler);
      };
    }
  }, [value, limit]);

  return throttledValue;
}

// 节流回调Hook
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  limit: number = 300,
  deps: DependencyList = []
): T {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...deps]);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallRef.current;

      if (timeSinceLastCall >= limit) {
        lastCallRef.current = now;
        callbackRef.current(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          callbackRef.current(...args);
        }, limit - timeSinceLastCall);
      }
    },
    [limit]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
}

// 安全的定时器Hook（内存泄漏防护）
export function useStableInterval(
  callback: () => void,
  delay: number | null
): void {
  const savedCallback = useRef(callback);
  const intervalId = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay !== null) {
      intervalId.current = setInterval(() => {
        savedCallback.current();
      }, delay);
      return () => {
        if (intervalId.current) {
          clearInterval(intervalId.current);
          intervalId.current = null;
        }
      };
    }
  }, [delay]);
}

// 安全的超时Hook
export function useStableTimeout(
  callback: () => void,
  delay: number | null
): void {
  const savedCallback = useRef(callback);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay !== null) {
      timeoutId.current = setTimeout(() => {
        savedCallback.current();
      }, delay);
      return () => {
        if (timeoutId.current) {
          clearTimeout(timeoutId.current);
          timeoutId.current = null;
        }
      };
    }
  }, [delay]);
}

// requestAnimationFrame Hook
export function useAnimationFrame(callback: (deltaTime: number) => void, enabled = true) {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const animate = useCallback((time: number) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current;
      callbackRef.current(deltaTime);
    }
    previousTimeRef.current = time;
    if (enabled) {
      requestRef.current = requestAnimationFrame(animate);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [enabled, animate]);
}

// 窗口大小Hook（防抖优化）
export function useWindowSize(debounceDelay: number = 150) {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  const handleResize = useDebouncedCallback(() => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, debounceDelay);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [handleResize]);

  return windowSize;
}

// 元素可见性Hook（Intersection Observer）
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!ref.current || typeof window === 'undefined') return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return isIntersecting;
}

// 性能监控Hook
export function usePerformanceMonitor(componentName: string) {
  const startTime = useRef<number>(Date.now());

  useEffect(() => {
    const mountTime = Date.now() - startTime.current;
    console.log(`[Performance] ${componentName} mounted in ${mountTime}ms`);

    return () => {
      const unmountTime = Date.now() - startTime.current;
      console.log(`[Performance] ${componentName} unmounted after ${unmountTime}ms`);
    };
  }, [componentName]);
}

// 批量状态更新Hook
export function useBatchState<T extends Record<string, any>>(initialState: T) {
  const [state, setState] = useState<T>(initialState);

  const batchSetState = useCallback((updates: Partial<T> | ((prev: T) => Partial<T>)) => {
    setState(prev => ({
      ...prev,
      ...(typeof updates === 'function' ? updates(prev) : updates),
    }));
  }, []);

  return [state, batchSetState] as const;
}

// 安全的useEffect（错误捕获）
export function useSafeEffect(
  effect: () => void | (() => void),
  deps: DependencyList = [],
  errorHandler?: (error: Error) => void
) {
  useEffect(() => {
    try {
      const cleanup = effect();
      return () => {
        try {
          if (typeof cleanup === 'function') {
            cleanup();
          }
        } catch (error) {
          console.error('Error in effect cleanup:', error);
          errorHandler?.(error as Error);
        }
      };
    } catch (error) {
      console.error('Error in effect:', error);
      errorHandler?.(error as Error);
    }
  }, deps);
}
