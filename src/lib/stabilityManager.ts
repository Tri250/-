class StabilityManager {
  private static instance: StabilityManager;
  private errorCount = 0;
  private errorThreshold = 10;
  private crashCount = 0;
  private crashThreshold = 3;
  private lastErrorTime = 0;
  private errorWindowMs = 60000;
  private recoveryAttempts = 0;
  private maxRecoveryAttempts = 5;
  private errorLog: Array<{ timestamp: string; message: string; stack?: string }> = [];

  static getInstance(): StabilityManager {
    if (!StabilityManager.instance) {
      StabilityManager.instance = new StabilityManager();
    }
    return StabilityManager.instance;
  }

  constructor() {
    this.setupGlobalErrorHandler();
    this.setupUnhandledRejectionHandler();
    this.setupMemoryWarning();
  }

  private setupGlobalErrorHandler(): void {
    window.onerror = (message, source, lineno, colno, error) => {
      this.handleError(error || new Error(String(message)), {
        source,
        lineno,
        colno,
      });
      return false;
    };
  }

  private setupUnhandledRejectionHandler(): void {
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      this.handleError(error, { type: 'unhandledrejection' });
    });
  }

  private setupMemoryWarning(): void {
    const memory = (performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
    if (memory) {
      setInterval(() => {
        const used = memory.usedJSHeapSize;
        const limit = memory.jsHeapSizeLimit;
        
        if (used / limit > 0.9) {
          this.handleMemoryWarning();
        }
      }, 10000);
    }
  }

  handleError(error: Error, context?: Record<string, unknown>): void {
    const now = Date.now();
    
    if (now - this.lastErrorTime > this.errorWindowMs) {
      this.errorCount = 0;
    }
    
    this.errorCount++;
    this.lastErrorTime = now;
    
    this.logError(error, context);
    
    if (this.errorCount >= this.errorThreshold) {
      this.handleCriticalError(error);
    }
    
    console.error('[StabilityManager] Error caught:', error, context);
  }

  private logError(error: Error, context?: Record<string, unknown>): void {
    const entry = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      ...context,
    };
    
    this.errorLog.push(entry);
    
    if (this.errorLog.length > 100) {
      this.errorLog.shift();
    }
    
    try {
      localStorage.setItem('stability_error_log', JSON.stringify(this.errorLog.slice(-50)));
    } catch {
      console.warn('Failed to persist error log');
    }
  }

  private handleCriticalError(error: Error): void {
    this.crashCount++;
    
    console.error('[StabilityManager] Critical error threshold reached:', error);
    
    if (this.crashCount >= this.crashThreshold) {
      this.handleCrash();
    } else {
      this.attemptRecovery();
    }
  }

  private handleMemoryWarning(): void {
    console.warn('[StabilityManager] Memory warning triggered');
    
    this.clearCaches();
    this.releaseResources();
    
    if ('gc' in window && typeof window.gc === 'function') {
      try {
        window.gc();
      } catch {
        console.warn('Manual GC failed');
      }
    }
  }

  private handleCrash(): void {
    console.error('[StabilityManager] Crash threshold reached, attempting emergency recovery');
    
    this.emergencyCleanup();
    
    const shouldReload = this.recoveryAttempts < this.maxRecoveryAttempts;
    
    if (shouldReload) {
      this.recoveryAttempts++;
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      this.showFailurePage();
    }
  }

  private attemptRecovery(): void {
    console.log('[StabilityManager] Attempting recovery...');
    
    this.clearCaches();
    this.releaseResources();
  }

  private clearCaches(): void {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      console.warn('Failed to clear caches');
    }
  }

  private releaseResources(): void {
    try {
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
    } catch {
      console.warn('Failed to release cache resources');
    }
  }

  private emergencyCleanup(): void {
    this.clearCaches();
    this.releaseResources();
    this.errorLog = [];
    this.errorCount = 0;
    this.crashCount = 0;
  }

  private showFailurePage(): void {
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `
        <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f5f5f5; padding: 20px;">
          <div style="max-width: 400px; text-align: center; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div style="width: 64px; height: 64px; margin: 0 auto 20px; background: #fee2e2; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#ef4444">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <h2 style="font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 12px;">应用遇到严重问题</h2>
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">应用多次尝试恢复失败，请手动刷新页面或重启应用。</p>
            <button onclick="window.location.reload()" style="padding: 12px 24px; background: #3b82f6; color: white; border-radius: 8px; font-weight: 500; cursor: pointer; border: none;">
              刷新页面
            </button>
          </div>
        </div>
      `;
    }
  }

  getErrorLog(): Array<{ timestamp: string; message: string; stack?: string }> {
    return [...this.errorLog];
  }

  getStats(): { 
    errorCount: number; 
    crashCount: number; 
    recoveryAttempts: number;
    isStable: boolean;
  } {
    return {
      errorCount: this.errorCount,
      crashCount: this.crashCount,
      recoveryAttempts: this.recoveryAttempts,
      isStable: this.errorCount < this.errorThreshold && this.crashCount < this.crashThreshold,
    };
  }

  reset(): void {
    this.errorCount = 0;
    this.crashCount = 0;
    this.recoveryAttempts = 0;
    this.errorLog = [];
  }
}

export const stabilityManager = StabilityManager.getInstance();

export const safeExecute = <T>(
  fn: () => T,
  fallback?: T,
  onError?: (error: Error) => void
): T | undefined => {
  try {
    return fn();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    stabilityManager.handleError(err);
    onError?.(err);
    return fallback;
  }
};

export const safeAsyncExecute = async <T>(
  fn: () => Promise<T>,
  fallback?: T,
  onError?: (error: Error) => void
): Promise<T | undefined> => {
  try {
    return await fn();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    stabilityManager.handleError(err);
    onError?.(err);
    return fallback;
  }
};

export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: { 
    maxAttempts?: number; 
    delay?: number; 
    backoff?: boolean;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> => {
  const { maxAttempts = 3, delay = 1000, backoff = true, onRetry } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxAttempts) {
        onRetry?.(attempt, lastError);
        
        const actualDelay = backoff ? delay * Math.pow(2, attempt - 1) : delay;
        await new Promise(resolve => setTimeout(resolve, actualDelay));
      }
    }
  }
  
  throw lastError || new Error('Retry failed with unknown error');
};

export const withTimeout = async <T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Operation timed out'
): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });
  
  return Promise.race([fn(), timeoutPromise]);
};

export const rateLimit = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  maxCalls: number,
  windowMs: number
): ((...args: Parameters<T>) => ReturnType<T> | undefined) => {
  const calls: number[] = [];
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    
    calls.push(now);
    
    const validCalls = calls.filter(time => time > now - windowMs);
    
    if (validCalls.length > maxCalls) {
      console.warn(`Rate limit exceeded: ${validCalls.length} calls in ${windowMs}ms`);
      return undefined;
    }
    
    return fn(...args) as ReturnType<T>;
  };
};

export const debounceWithErrorHandling = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  wait: number,
  onError?: (error: Error) => void
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      try {
        fn(...args);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        stabilityManager.handleError(err);
        onError?.(err);
      }
      timeoutId = null;
    }, wait);
  };
};

export const createSafeEventEmitter = <T extends Record<string, unknown>>() => {
  const listeners: Map<keyof T, Set<(data: T[keyof T]) => void>> = new Map();
  
  const emit = (event: keyof T, data: T[keyof T]) => {
    const eventListeners = listeners.get(event);
    if (!eventListeners) return;
    
    eventListeners.forEach(listener => {
      safeExecute(() => listener(data));
    });
  };
  
  const on = (event: keyof T, listener: (data: T[keyof T]) => void) => {
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    listeners.get(event)!.add(listener);
  };
  
  const off = (event: keyof T, listener: (data: T[keyof T]) => void) => {
    const eventListeners = listeners.get(event);
    if (!eventListeners) return;
    eventListeners.delete(listener);
  };
  
  const removeAllListeners = (event?: keyof T) => {
    if (event) {
      listeners.delete(event);
    } else {
      listeners.clear();
    }
  };
  
  return { emit, on, off, removeAllListeners };
};