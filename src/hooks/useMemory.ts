import { useEffect, useRef, useCallback, useState } from 'react';
import { timerManager } from '../lib/timerManager';

export const useManagedTimeout = (
  callback: () => void,
  delay: number,
  key: string,
  deps: React.DependencyList = []
): void => {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    timerManager.setTimer(key, () => callbackRef.current(), delay, 'timeout');
    
    return () => {
      timerManager.clearTimer(key);
    };
  }, [key, delay, ...deps]);
};

export const useManagedInterval = (
  callback: () => void,
  delay: number,
  key: string,
  deps: React.DependencyList = [],
  options: { pauseInBackground?: boolean } = {}
): void => {
  const callbackRef = useRef(callback);
  const { pauseInBackground = true } = options;
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (pauseInBackground && document.hidden) {
      return;
    }
    
    timerManager.setTimer(key, () => callbackRef.current(), delay, 'interval');
    
    return () => {
      timerManager.clearTimer(key);
    };
  }, [key, delay, pauseInBackground, ...deps]);
};

export const useCleanup = (cleanupFn: () => void): void => {
  const cleanupRef = useRef(cleanupFn);
  
  useEffect(() => {
    cleanupRef.current = cleanupFn;
  }, [cleanupFn]);

  useEffect(() => {
    return () => {
      cleanupRef.current();
    };
  }, []);
};

export const useVisibilityChange = (
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

export const useMemoryMonitor = (
  thresholdMB: number = 300,
  onThresholdExceeded?: (memoryMB: number) => void
): { memoryMB: number; isOverThreshold: boolean } => {
  const [memoryMB, setMemoryMB] = useState(0);
  const onThresholdRef = useRef(onThresholdExceeded);

  useEffect(() => {
    onThresholdRef.current = onThresholdExceeded;
  }, [onThresholdExceeded]);

  useEffect(() => {
    const checkMemory = () => {
      const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
      if (memory) {
        const usedJSHeapSize = memory.usedJSHeapSize;
        const mb = usedJSHeapSize / (1024 * 1024);
        setMemoryMB(Math.round(mb));
        
        if (mb > thresholdMB) {
          onThresholdRef.current?.(mb);
        }
      }
    };

    const intervalId = setInterval(checkMemory, 5000);
    checkMemory();

    return () => {
      clearInterval(intervalId);
    };
  }, [thresholdMB]);

  const isOverThreshold = memoryMB > thresholdMB;

  return { memoryMB, isOverThreshold };
};

export const useObjectPool = <T>(
  createFn: () => T,
  resetFn: (obj: T) => void,
  initialSize: number = 5
): { acquire: () => T; release: (obj: T) => void } => {
  const poolRef = useRef<T[]>([]);
  const createRef = useRef(createFn);
  const resetRef = useRef(resetFn);

  useEffect(() => {
    createRef.current = createFn;
    resetRef.current = resetFn;
    
    for (let i = 0; i < initialSize; i++) {
      poolRef.current.push(createRef.current());
    }
  }, [createFn, resetFn, initialSize]);

  const acquire = useCallback(() => {
    if (poolRef.current.length > 0) {
      return poolRef.current.pop()!;
    }
    return createRef.current();
  }, []);

  const release = useCallback((obj: T) => {
    resetRef.current(obj);
    if (poolRef.current.length < initialSize * 2) {
      poolRef.current.push(obj);
    }
  }, [initialSize]);

  return { acquire, release };
};