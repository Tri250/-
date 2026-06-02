import { useEffect, useRef, useCallback, useState } from 'react';
import { memoryManager } from '../lib/memoryManager';
import { timerManager } from '../lib/timerManager';

export const useBackgroundCleanup = (
  cleanupFn: () => void,
  options: { delay?: number; onVisibilityChange?: boolean } = {}
): void => {
  const { delay = 30000, onVisibilityChange = true } = options;
  const cleanupRef = useRef(cleanupFn);
  const isBackgroundedRef = useRef(false);
  const cleanupTimerRef = useRef<string>('background-cleanup');

  useEffect(() => {
    cleanupRef.current = cleanupFn;
  }, [cleanupFn]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isBackgroundedRef.current = true;
        
        timerManager.setTimer(cleanupTimerRef.current, () => {
          if (isBackgroundedRef.current) {
            cleanupRef.current();
          }
        }, delay);
      } else {
        isBackgroundedRef.current = false;
        timerManager.clearTimer(cleanupTimerRef.current);
      }
    };

    if (onVisibilityChange) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      if (onVisibilityChange) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      timerManager.clearTimer(cleanupTimerRef.current);
    };
  }, [delay, onVisibilityChange]);
};

export const useComponentCleanup = (
  cleanupFn: () => void,
  deps: React.DependencyList = []
): void => {
  const cleanupRef = useRef(cleanupFn);
  const cleanupKeyRef = useRef(`component-cleanup-${Date.now()}-${Math.random()}`);

  useEffect(() => {
    cleanupRef.current = cleanupFn;
    memoryManager.registerCleanup(cleanupKeyRef.current, cleanupFn);
  }, [cleanupFn]);

  useEffect(() => {
    return () => {
      try {
        cleanupRef.current();
        memoryManager.unregisterCleanup(cleanupKeyRef.current);
      } catch (error) {
        console.warn('Component cleanup failed:', error);
      }
    };
  }, deps);
};

export const useCacheManager = <T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { ttl?: number; enabled?: boolean } = {}
): [T | null, boolean, () => void] => {
  const { ttl = 5 * 60 * 1000, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    const cached = memoryManager.getCache<T>(key);
    if (cached) {
      setData(cached);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const result = await fetcher();
      memoryManager.setCache(key, result, ttl);
      setData(result);
      setIsLoading(false);
    } catch (error) {
      console.warn('Cache fetch failed:', error);
      setData(null);
      setIsLoading(false);
    }
  }, [key, fetcher, ttl, enabled]);

  const clearCache = useCallback(() => {
    memoryManager.clearCache(key);
    setData(null);
  }, [key]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return [data, isLoading, clearCache];
};

export const useObjectPoolManager = <T>(
  createFn: () => T,
  resetFn: (obj: T) => void,
  maxSize: number = 20
): { acquire: () => T; release: (obj: T) => void } => {
  const poolRef = useRef<T[]>([]);
  const createdRef = useRef(0);

  const acquire = useCallback(() => {
    if (poolRef.current.length > 0) {
      return poolRef.current.pop()!;
    }
    createdRef.current++;
    return createFn();
  }, [createFn]);

  const release = useCallback((obj: T) => {
    resetFn(obj);
    if (poolRef.current.length < maxSize) {
      poolRef.current.push(obj);
    }
  }, [resetFn, maxSize]);

  useEffect(() => {
    const cleanupKey = `object-pool-${Date.now()}`;
    memoryManager.registerCleanup(cleanupKey, () => {
      poolRef.current = [];
    });

    return () => {
      poolRef.current = [];
      memoryManager.unregisterCleanup(cleanupKey);
    };
  }, []);

  return { acquire, release };
};

export const useIntervalCleanup = (
  callback: () => void,
  delay: number,
  options: { pauseInBackground?: boolean; immediate?: boolean } = {}
): void => {
  const { pauseInBackground = true, immediate = false } = options;
  const callbackRef = useRef(callback);
  const intervalKeyRef = useRef(`interval-${Date.now()}-${Math.random()}`);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (immediate) {
      callbackRef.current();
    }

    const setupInterval = () => {
      timerManager.setTimer(intervalKeyRef.current, callbackRef.current, delay, 'interval');
    };

    const handleVisibilityChange = () => {
      if (document.hidden && pauseInBackground) {
        timerManager.clearTimer(intervalKeyRef.current);
      } else if (!document.hidden) {
        setupInterval();
      }
    };

    if (pauseInBackground) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      if (!document.hidden) {
        setupInterval();
      }
    } else {
      setupInterval();
    }

    return () => {
      timerManager.clearTimer(intervalKeyRef.current);
      if (pauseInBackground) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [delay, pauseInBackground, immediate]);
};

export const useMemoryMonitor = (
  thresholdMB: number = 250,
  onThresholdExceeded?: (usage: number) => void
): { usageMB: number; level: 'normal' | 'warning' | 'critical' } => {
  const onThresholdRef = useRef(onThresholdExceeded);
  const [usageMB, setUsageMB] = useState(0);
  const [level, setLevel] = useState<'normal' | 'warning' | 'critical'>('normal');

  useEffect(() => {
    onThresholdRef.current = onThresholdExceeded;
  }, [onThresholdExceeded]);

  useEffect(() => {
    const checkMemory = () => {
      const pressure = memoryManager.checkMemoryPressure();
      setUsageMB(pressure.usage);
      setLevel(pressure.level);

      if (pressure.level !== 'normal' && onThresholdRef.current) {
        onThresholdRef.current(pressure.usage);
      }
    };

    checkMemory();
    const stopMonitoring = memoryManager.startMonitoring(10000);

    return stopMonitoring;
  }, [thresholdMB]);

  return { usageMB, level };
};