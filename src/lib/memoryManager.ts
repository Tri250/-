class MemoryManager {
  private static instance: MemoryManager;
  private cleanupCallbacks: Map<string, () => void> = new Map();
  private cache: Map<string, { data: unknown; timestamp: number; ttl: number }> = new Map();
  private maxCacheSize = 100;
  private maxCacheAge = 5 * 60 * 1000;
  private warningThresholdMB = 250;
  private criticalThresholdMB = 300;

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  registerCleanup(key: string, callback: () => void): void {
    this.cleanupCallbacks.set(key, callback);
  }

  unregisterCleanup(key: string): void {
    this.cleanupCallbacks.delete(key);
  }

  performCleanup(): void {
    this.cleanupCallbacks.forEach((callback, key) => {
      try {
        callback();
      } catch (error) {
        console.warn(`Cleanup callback failed for key: ${key}`, error);
      }
    });
    this.clearExpiredCache();
  }

  setCache(key: string, data: unknown, ttl: number = this.maxCacheAge): void {
    if (this.cache.size >= this.maxCacheSize) {
      this.evictOldestCache();
    }
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  getCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  clearCache(key: string): void {
    this.cache.delete(key);
  }

  clearAllCache(): void {
    this.cache.clear();
  }

  private clearExpiredCache(): void {
    const now = Date.now();
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    });
  }

  private evictOldestCache(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;
    
    this.cache.forEach((entry, key) => {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    });
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  getMemoryUsage(): { usedMB: number; totalMB: number; percentage: number } | null {
    const memory = (performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
    if (memory) {
      const used = memory.usedJSHeapSize;
      const total = memory.jsHeapSizeLimit;
      return {
        usedMB: Math.round(used / (1024 * 1024)),
        totalMB: Math.round(total / (1024 * 1024)),
        percentage: Math.round((used / total) * 100),
      };
    }
    return null;
  }

  checkMemoryPressure(): { level: 'normal' | 'warning' | 'critical'; usage: number } {
    const usage = this.getMemoryUsage();
    if (!usage) {
      return { level: 'normal', usage: 0 };
    }

    if (usage.usedMB >= this.criticalThresholdMB) {
      return { level: 'critical', usage: usage.usedMB };
    }
    
    if (usage.usedMB >= this.warningThresholdMB) {
      return { level: 'warning', usage: usage.usedMB };
    }
    
    return { level: 'normal', usage: usage.usedMB };
  }

  handleMemoryWarning(): void {
    console.warn('Memory warning triggered, performing cleanup');
    this.performCleanup();
    
    if ('gc' in window && typeof window.gc === 'function') {
      try {
        window.gc();
      } catch {
        console.warn('Manual GC not available');
      }
    }
  }

  startMonitoring(intervalMs: number = 10000): () => void {
    const intervalId = setInterval(() => {
      const pressure = this.checkMemoryPressure();
      
      if (pressure.level === 'critical') {
        this.handleMemoryWarning();
      } else if (pressure.level === 'warning') {
        this.clearExpiredCache();
      }
    }, intervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const memoryManager = MemoryManager.getInstance();

export const createObjectPool = <T>(
  createFn: () => T,
  resetFn: (obj: T) => void,
  maxSize: number = 50
): { acquire: () => T; release: (obj: T) => void; stats: () => { available: number; created: number } } => {
  const pool: T[] = [];
  let createdCount = 0;

  const acquire = (): T => {
    if (pool.length > 0) {
      return pool.pop()!;
    }
    createdCount++;
    return createFn();
  };

  const release = (obj: T): void => {
    resetFn(obj);
    if (pool.length < maxSize) {
      pool.push(obj);
    }
  };

  const stats = () => ({
    available: pool.length,
    created: createdCount,
  });

  return { acquire, release, stats };
};

export const debounceWithCleanup = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  cleanupFn?: () => void
): ((...args: Parameters<T>) => void) & { cancel: () => void; flush: () => void } => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debounced = (...args: Parameters<T>) => {
    lastArgs = args;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
      lastArgs = null;
      timeoutId = null;
    }, wait);
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      lastArgs = null;
      if (cleanupFn) {
        cleanupFn();
      }
    }
  };

  debounced.flush = () => {
    if (timeoutId && lastArgs) {
      clearTimeout(timeoutId);
      func(...lastArgs);
      lastArgs = null;
      timeoutId = null;
    }
  };

  return debounced;
};

export const throttleWithCleanup = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number,
  cleanupFn?: () => void
): ((...args: Parameters<T>) => void) & { cancel: () => void } => {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const throttled = (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      timeoutId = setTimeout(() => {
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

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      inThrottle = false;
      lastArgs = null;
      if (cleanupFn) {
        cleanupFn();
      }
    }
  };

  return throttled;
};

export const safeDispose = (obj: { dispose?: () => void; destroy?: () => void; close?: () => void } | null): void => {
  if (!obj) return;
  
  try {
    if (typeof obj.dispose === 'function') {
      obj.dispose();
    } else if (typeof obj.destroy === 'function') {
      obj.destroy();
    } else if (typeof obj.close === 'function') {
      obj.close();
    }
  } catch (error) {
    console.warn('Failed to dispose object:', error);
  }
};

export const cleanupEventListeners = (
  element: EventTarget,
  listeners: Array<{ event: string; handler: EventListenerOrEventListenerObject }>
): void => {
  listeners.forEach(({ event, handler }) => {
    try {
      element.removeEventListener(event, handler);
    } catch (error) {
      console.warn(`Failed to remove event listener for ${event}:`, error);
    }
  });
};