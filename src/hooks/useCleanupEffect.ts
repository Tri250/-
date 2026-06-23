import { useEffect, useRef, useCallback } from 'react';
import { memoryLeakDetector } from '../lib/memoryLeakDetector';

type CleanupFn = () => void;

interface CleanupEffectOptions {
  componentName?: string;
  enableLeakDetection?: boolean;
}

export const useCleanupEffect = (
  effect: () => CleanupFn | void,
  deps: React.DependencyList = [],
  options: CleanupEffectOptions = {}
): void => {
  const { componentName = 'UnknownComponent', enableLeakDetection = true } = options;
  const instanceIdRef = useRef<string>(`${componentName}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);
  const cleanupFnRef = useRef<CleanupFn | void>(undefined);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (enableLeakDetection) {
      memoryLeakDetector.registerComponentMount(componentName, instanceIdRef.current);
    }
    mountedRef.current = true;

    cleanupFnRef.current = effect();

    return () => {
      mountedRef.current = false;

      if (cleanupFnRef.current) {
        try {
          cleanupFnRef.current();
        } catch (error) {
          console.warn(`[useCleanupEffect] Cleanup error in ${componentName}:`, error);
        }
        cleanupFnRef.current = undefined;
      }

      if (enableLeakDetection) {
        memoryLeakDetector.registerComponentUnmount(componentName, instanceIdRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

export const useSafeInterval = (
  callback: () => void,
  delay: number | null,
  options: { componentName?: string; label?: string } = {}
): void => {
  const { componentName = 'Unknown', label } = options;
  const callbackRef = useRef(callback);
  const intervalIdRef = useRef<number | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = window.setInterval(() => {
      callbackRef.current();
    }, delay);

    intervalIdRef.current = id;

    const leakId = `interval_${id}_${componentName}_${label || ''}`;
    memoryLeakDetector.registerTimer(String(id), 'setInterval', leakId);

    return () => {
      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current);
        memoryLeakDetector.clearTimer(String(intervalIdRef.current), 'interval');
        intervalIdRef.current = null;
      }
    };
  }, [delay, componentName, label]);
};

export const useSafeTimeout = (
  callback: () => void,
  delay: number | null,
  options: { componentName?: string; label?: string } = {}
): void => {
  const { componentName = 'Unknown', label } = options;
  const callbackRef = useRef(callback);
  const timeoutIdRef = useRef<number | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = window.setTimeout(() => {
      callbackRef.current();
      timeoutIdRef.current = null;
    }, delay);

    timeoutIdRef.current = id;

    const leakId = `timeout_${id}_${componentName}_${label || ''}`;
    memoryLeakDetector.registerTimer(String(id), 'setTimeout', leakId);

    return () => {
      if (timeoutIdRef.current !== null) {
        clearTimeout(timeoutIdRef.current);
        memoryLeakDetector.clearTimer(String(timeoutIdRef.current), 'timeout');
        timeoutIdRef.current = null;
      }
    };
  }, [delay, componentName, label]);
};

export const useSafeEventListener = <K extends keyof WindowEventMap>(
  target: EventTarget | null,
  type: K,
  listener: (event: WindowEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
): void => {
  const listenerRef = useRef(listener);

  useEffect(() => {
    listenerRef.current = listener;
  }, [listener]);

  useEffect(() => {
    if (!target) return;

    const handler = (event: Event) => {
      listenerRef.current(event as WindowEventMap[K]);
    };

    target.addEventListener(type, handler as EventListener, options);

    return () => {
      target.removeEventListener(type, handler as EventListener, options);
    };
  }, [target, type, options]);
};

export const useCleanupTracker = (componentName: string) => {
  const instanceIdRef = useRef<string>(`${componentName}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);
  const cleanupFnsRef = useRef<CleanupFn[]>([]);

  const registerCleanup = useCallback((cleanupFn: CleanupFn) => {
    cleanupFnsRef.current.push(cleanupFn);
  }, []);

  const addTimeout = useCallback((callback: () => void, delay: number, label?: string): number => {
    const id = window.setTimeout(() => {
      callback();
      const idx = cleanupFnsRef.current.findIndex((fn: CleanupFn & { _timeoutId?: number }) => fn._timeoutId === id);
      if (idx !== -1) {
        cleanupFnsRef.current.splice(idx, 1);
      }
    }, delay);

    const cleanup = (() => {
      clearTimeout(id);
      memoryLeakDetector.clearTimer(String(id), 'timeout');
    }) as CleanupFn & { _timeoutId?: number };
    cleanup._timeoutId = id;

    cleanupFnsRef.current.push(cleanup);
    memoryLeakDetector.registerTimer(String(id), 'setTimeout', `${componentName}_${label || ''}`);

    return id;
  }, [componentName]);

  const addInterval = useCallback((callback: () => void, delay: number, label?: string): number => {
    const id = window.setInterval(callback, delay);

    const cleanup = (() => {
      clearInterval(id);
      memoryLeakDetector.clearTimer(String(id), 'interval');
    }) as CleanupFn & { _intervalId?: number };
    cleanup._intervalId = id;

    cleanupFnsRef.current.push(cleanup);
    memoryLeakDetector.registerTimer(String(id), 'setInterval', `${componentName}_${label || ''}`);

    return id;
  }, [componentName]);

  useEffect(() => {
    memoryLeakDetector.registerComponentMount(componentName, instanceIdRef.current);

    return () => {
      cleanupFnsRef.current.forEach((fn) => {
        try {
          fn();
        } catch (error) {
          console.warn(`[useCleanupTracker] Cleanup error in ${componentName}:`, error);
        }
      });
      cleanupFnsRef.current = [];
      memoryLeakDetector.registerComponentUnmount(componentName, instanceIdRef.current);
    };
  }, [componentName]);

  return { registerCleanup, addTimeout, addInterval };
};

export const useMountedState = (): { isMounted: boolean; getMounted: () => boolean } => {
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const getMounted = useCallback(() => isMountedRef.current, []);

  return { isMounted: isMountedRef.current, getMounted };
};

export default useCleanupEffect;
