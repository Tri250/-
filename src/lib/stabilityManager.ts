import { crashReporter } from './crashReporter';

type CacheCleanupLevel = 1 | 2 | 3;

type RecoveryLevel = 0 | 1 | 2 | 3;

interface MemorySnapshot {
  usedJSHeapSize: number;
  jsHeapSizeLimit: number;
  totalJSHeapSize?: number;
  timestamp: number;
}

interface ANRReport {
  duration: number;
  timestamp: string;
  lastAction: string;
  memoryUsage: MemorySnapshot | null;
  stack?: string;
}

interface CrashSnapshot {
  timestamp: string;
  url: string;
  memoryUsage: MemorySnapshot | null;
  errorCount: number;
  recentActions: string[];
  appState: Record<string, unknown>;
}

interface WhiteScreenDetectionOptions {
  checkInterval: number;
  whiteScreenTimeout: number;
  rootSelector: string;
}

const DEFAULT_ANR_WARNING_MS = 3000;
const DEFAULT_ANR_CRITICAL_MS = 5000;
const DEFAULT_MEMORY_CHECK_INTERVAL = 5000;
const DEFAULT_OOM_TREND_SAMPLES = 5;
const DEFAULT_OOM_GROWTH_RATE = 0.1;

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
  private currentRecoveryLevel: RecoveryLevel = 0;
  private errorLog: Array<{ timestamp: string; message: string; stack?: string; [key: string]: unknown }> = [];
  private maxErrorLog = 200;

  private memoryHistory: MemorySnapshot[] = [];
  private maxMemoryHistory = 30;
  private memoryCheckInterval: ReturnType<typeof setInterval> | null = null;
  private oomTrendSamples = DEFAULT_OOM_TREND_SAMPLES;
  private oomGrowthRate = DEFAULT_OOM_GROWTH_RATE;

  private anrWarningMs = DEFAULT_ANR_WARNING_MS;
  private anrCriticalMs = DEFAULT_ANR_CRITICAL_MS;
  private anrCheckInterval: ReturnType<typeof setInterval> | null = null;
  private lastMainThreadPong = Date.now();
  private anrReports: ANRReport[] = [];
  private maxAnrReports = 10;
  private lastAction = 'app_start';
  private actionHistory: string[] = [];
  private maxActionHistory = 50;

  private whiteScreenOptions: WhiteScreenDetectionOptions = {
    checkInterval: 1000,
    whiteScreenTimeout: 5000,
    rootSelector: '#root',
  };
  private whiteScreenCheckInterval: ReturnType<typeof setInterval> | null = null;
  private firstContentfulPaintTime: number | null = null;
  private isWhiteScreenDetected = false;

  private crashSnapshotKey = 'stability_crash_snapshot';
  private appStateSnapshots: Record<string, unknown> = {};

  private cacheCleanupCallbacks: Map<CacheCleanupLevel, Array<() => void>> = new Map();
  private userDataKeys = new Set<string>();

  static getInstance(): StabilityManager {
    if (!StabilityManager.instance) {
      StabilityManager.instance = new StabilityManager();
    }
    return StabilityManager.instance;
  }

  constructor() {
    this.setupGlobalErrorHandler();
    this.setupUnhandledRejectionHandler();
    this.setupMemoryMonitoring();
    this.setupANRMonitoring();
    this.setupWhiteScreenDetection();
    this.setupBeforeUnload();
    this.registerDefaultCleanupCallbacks();
  }

  private setupGlobalErrorHandler(): void {
    const originalOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      const err = error || new Error(String(message));
      this.handleError(err, {
        source,
        lineno,
        colno,
        type: 'global_error',
      });
      if (typeof originalOnError === 'function') {
        return originalOnError.call(window, message, source, lineno, colno, error);
      }
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

  private setupBeforeUnload(): void {
    window.addEventListener('beforeunload', () => {
      this.saveCrashSnapshot('before_unload');
    });
  }

  private setupMemoryMonitoring(): void {
    const memory = (performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number; totalJSHeapSize?: number } }).memory;
    if (!memory) return;

    this.memoryCheckInterval = setInterval(() => {
      const snapshot: MemorySnapshot = {
        usedJSHeapSize: memory.usedJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        totalJSHeapSize: memory.totalJSHeapSize,
        timestamp: Date.now(),
      };

      this.memoryHistory.push(snapshot);
      if (this.memoryHistory.length > this.maxMemoryHistory) {
        this.memoryHistory.shift();
      }

      this.checkMemoryPressure(snapshot);
      this.checkOOMTrend();
    }, DEFAULT_MEMORY_CHECK_INTERVAL);
  }

  private checkMemoryPressure(snapshot: MemorySnapshot): void {
    const ratio = snapshot.usedJSHeapSize / snapshot.jsHeapSizeLimit;

    if (ratio >= 0.95) {
      this.handleCriticalMemory();
    } else if (ratio >= 0.9) {
      this.handleMemoryWarning(3);
    } else if (ratio >= 0.8) {
      this.handleMemoryWarning(2);
    } else if (ratio >= 0.7) {
      this.handleMemoryWarning(1);
    }
  }

  private checkOOMTrend(): void {
    if (this.memoryHistory.length < this.oomTrendSamples) return;

    const recent = this.memoryHistory.slice(-this.oomTrendSamples);
    const firstRatio = recent[0].usedJSHeapSize / recent[0].jsHeapSizeLimit;
    const lastRatio = recent[recent.length - 1].usedJSHeapSize / recent[recent.length - 1].jsHeapSizeLimit;
    const growthRate = (lastRatio - firstRatio) / firstRatio;

    if (growthRate >= this.oomGrowthRate && lastRatio >= 0.6) {
      console.warn('[StabilityManager] OOM trend detected, growth rate:', growthRate.toFixed(2));
      this.handleMemoryWarning(1);
      this.triggerGC();
    }
  }

  private setupANRMonitoring(): void {
    const ping = () => {
      this.lastMainThreadPong = Date.now();
    };

    const schedulePing = () => {
      requestAnimationFrame(() => {
        ping();
        setTimeout(schedulePing, 100);
      });
    };

    schedulePing();

    this.anrCheckInterval = setInterval(() => {
      const now = Date.now();
      const duration = now - this.lastMainThreadPong;

      if (duration >= this.anrCriticalMs) {
        this.handleANR(duration, 'critical');
      } else if (duration >= this.anrWarningMs) {
        this.handleANR(duration, 'warning');
      }
    }, 1000);
  }

  private handleANR(duration: number, severity: 'warning' | 'critical'): void {
    const report: ANRReport = {
      duration,
      timestamp: new Date().toISOString(),
      lastAction: this.lastAction,
      memoryUsage: this.getCurrentMemorySnapshot(),
      stack: new Error('ANR stack trace').stack,
    };

    this.anrReports.push(report);
    if (this.anrReports.length > this.maxAnrReports) {
      this.anrReports.shift();
    }

    console.warn(`[StabilityManager] ANR ${severity}: ${duration}ms, last action: ${this.lastAction}`);

    if (severity === 'critical') {
      crashReporter.reportANR(report);
      this.saveCrashSnapshot('anr_critical');
      this.attemptProgressiveRecovery();
    }
  }

  private setupWhiteScreenDetection(): void {
    if (typeof document === 'undefined') return;

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      this.startWhiteScreenCheck();
    } else {
      window.addEventListener('DOMContentLoaded', () => {
        this.startWhiteScreenCheck();
      });
    }

    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              this.firstContentfulPaintTime = entry.startTime;
              observer.disconnect();
            }
          }
        });
        observer.observe({ entryTypes: ['paint'] });
      } catch {
        // ignore
      }
    }
  }

  private startWhiteScreenCheck(): void {
    let whiteScreenStart: number | null = null;

    this.whiteScreenCheckInterval = setInterval(() => {
      const root = document.querySelector(this.whiteScreenOptions.rootSelector);
      const isWhite = this.checkIsWhiteScreen(root);

      if (isWhite) {
        if (whiteScreenStart === null) {
          whiteScreenStart = Date.now();
        } else {
          const duration = Date.now() - whiteScreenStart;
          if (duration >= this.whiteScreenOptions.whiteScreenTimeout && !this.isWhiteScreenDetected) {
            this.handleWhiteScreen(duration);
          }
        }
      } else {
        whiteScreenStart = null;
        this.isWhiteScreenDetected = false;
      }
    }, this.whiteScreenOptions.checkInterval);
  }

  private checkIsWhiteScreen(root: Element | null): boolean {
    if (!root) return true;
    if (root.children.length === 0) return true;

    const rect = root.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return true;

    const hasVisibleContent = Array.from(root.children).some(child => {
      const childRect = child.getBoundingClientRect();
      return childRect.width > 0 && childRect.height > 0 && child.children.length > 0;
    });

    return !hasVisibleContent;
  }

  private handleWhiteScreen(duration: number): void {
    this.isWhiteScreenDetected = true;
    console.error('[StabilityManager] White screen detected, duration:', duration, 'ms');

    crashReporter.reportWhiteScreen(duration);
    this.saveCrashSnapshot('white_screen');

    this.attemptProgressiveRecovery();
  }

  private registerDefaultCleanupCallbacks(): void {
    this.cacheCleanupCallbacks.set(1, [
      () => this.clearImageCache(),
    ]);

    this.cacheCleanupCallbacks.set(2, [
      () => this.clearImageCache(),
      () => this.clearNonCriticalData(),
    ]);

    this.cacheCleanupCallbacks.set(3, [
      () => this.clearImageCache(),
      () => this.clearNonCriticalData(),
      () => this.clearAllCachesPreserveUserData(),
    ]);
  }

  private clearImageCache(): void {
    try {
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        img.removeAttribute('src');
      });
    } catch {
      console.warn('Failed to clear image cache');
    }

    try {
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            if (name.includes('image') || name.includes('img') || name.includes('photo')) {
              caches.delete(name);
            }
          });
        });
      }
    } catch {
      console.warn('Failed to clear image cache storage');
    }
  }

  private clearNonCriticalData(): void {
    try {
      const nonCriticalPrefixes = ['cache_', 'temp_', 'tmp_', 'history_', 'recent_'];
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && nonCriticalPrefixes.some(prefix => key.startsWith(prefix))) {
          if (!this.userDataKeys.has(key)) {
            keysToRemove.push(key);
          }
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch {
      console.warn('Failed to clear non-critical data');
    }
  }

  private clearAllCachesPreserveUserData(): void {
    try {
      const keysToKeep: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && this.userDataKeys.has(key)) {
          keysToKeep.push(key);
        }
      }

      const preservedData: Record<string, string | null> = {};
      keysToKeep.forEach(key => {
        preservedData[key] = localStorage.getItem(key);
      });

      localStorage.clear();

      Object.entries(preservedData).forEach(([key, value]) => {
        if (value !== null) {
          localStorage.setItem(key, value);
        }
      });
    } catch {
      console.warn('Failed to clear caches preserving user data');
    }

    try {
      sessionStorage.clear();
    } catch {
      console.warn('Failed to clear sessionStorage');
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
    crashReporter.reportError(error, context);

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

    if (this.errorLog.length > this.maxErrorLog) {
      this.errorLog.shift();
    }

    try {
      localStorage.setItem('stability_error_log', JSON.stringify(this.errorLog.slice(-100)));
    } catch {
      console.warn('Failed to persist error log');
    }
  }

  private handleCriticalError(error: Error): void {
    this.crashCount++;

    console.error('[StabilityManager] Critical error threshold reached:', error);

    this.saveCrashSnapshot('critical_error');

    if (this.crashCount >= this.crashThreshold) {
      this.handleCrash();
    } else {
      this.attemptProgressiveRecovery();
    }
  }

  private handleMemoryWarning(level: CacheCleanupLevel): void {
    console.warn(`[StabilityManager] Memory warning (Level ${level}) triggered`);

    this.performCacheCleanup(level);

    if (level >= 2) {
      this.triggerGC();
    }
  }

  private handleCriticalMemory(): void {
    console.error('[StabilityManager] Critical memory threshold reached');

    this.performCacheCleanup(3);
    this.triggerGC();
    this.saveCrashSnapshot('critical_memory');

    setTimeout(() => {
      const memory = this.getCurrentMemorySnapshot();
      if (memory && memory.usedJSHeapSize / memory.jsHeapSizeLimit >= 0.9) {
        this.attemptProgressiveRecovery();
      }
    }, 2000);
  }

  private handleCrash(): void {
    console.error('[StabilityManager] Crash threshold reached, attempting emergency recovery');

    this.saveCrashSnapshot('crash');
    crashReporter.reportCrash(new Error('Crash threshold reached'));

    this.emergencyCleanup();
    this.attemptProgressiveRecovery();
  }

  private performCacheCleanup(level: CacheCleanupLevel): void {
    const callbacks = this.cacheCleanupCallbacks.get(level) || [];
    callbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.warn(`Cache cleanup callback failed (Level ${level}):`, error);
      }
    });

    if (level >= 2) {
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
  }

  private triggerGC(): void {
    if ('gc' in window && typeof (window as { gc?: () => void }).gc === 'function') {
      try {
        (window as { gc: () => void }).gc();
        console.log('[StabilityManager] Manual GC triggered');
      } catch {
        console.warn('Manual GC failed');
      }
    }
  }

  private attemptProgressiveRecovery(): void {
    if (this.recoveryAttempts >= this.maxRecoveryAttempts) {
      this.showFailurePage();
      return;
    }

    this.currentRecoveryLevel = Math.min(
      (this.currentRecoveryLevel + 1) as RecoveryLevel,
      3 as RecoveryLevel
    );

    this.recoveryAttempts++;

    console.log(`[StabilityManager] Attempting progressive recovery (Level ${this.currentRecoveryLevel})...`);

    switch (this.currentRecoveryLevel) {
      case 1:
        this.performCacheCleanup(1);
        this.triggerGC();
        break;
      case 2:
        this.performCacheCleanup(2);
        this.triggerGC();
        break;
      case 3:
        this.performCacheCleanup(3);
        this.triggerGC();
        setTimeout(() => {
          window.location.reload();
        }, 500);
        break;
      default:
        break;
    }
  }

  private emergencyCleanup(): void {
    this.performCacheCleanup(3);
    this.errorLog = [];
    this.errorCount = 0;
    this.crashCount = 0;
  }

  private saveCrashSnapshot(reason: string): void {
    try {
      const snapshot: CrashSnapshot = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        memoryUsage: this.getCurrentMemorySnapshot(),
        errorCount: this.errorCount,
        recentActions: [...this.actionHistory],
        appState: { ...this.appStateSnapshots, reason },
      };

      sessionStorage.setItem(this.crashSnapshotKey, JSON.stringify(snapshot));
      crashReporter.addContext('crash_snapshot', snapshot);
    } catch {
      console.warn('Failed to save crash snapshot');
    }
  }

  getCrashSnapshot(): CrashSnapshot | null {
    try {
      const data = sessionStorage.getItem(this.crashSnapshotKey);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  clearCrashSnapshot(): void {
    try {
      sessionStorage.removeItem(this.crashSnapshotKey);
    } catch {
      // ignore
    }
  }

  private getCurrentMemorySnapshot(): MemorySnapshot | null {
    const memory = (performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number; totalJSHeapSize?: number } }).memory;
    if (!memory) return null;

    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      totalJSHeapSize: memory.totalJSHeapSize,
      timestamp: Date.now(),
    };
  }

  recordAction(action: string): void {
    this.lastAction = action;
    this.actionHistory.push(`${new Date().toISOString()}: ${action}`);
    if (this.actionHistory.length > this.maxActionHistory) {
      this.actionHistory.shift();
    }
  }

  setAppState(key: string, value: unknown): void {
    this.appStateSnapshots[key] = value;
  }

  registerUserDataKey(key: string): void {
    this.userDataKeys.add(key);
  }

  registerCacheCleanupCallback(level: CacheCleanupLevel, callback: () => void): void {
    if (!this.cacheCleanupCallbacks.has(level)) {
      this.cacheCleanupCallbacks.set(level, []);
    }
    this.cacheCleanupCallbacks.get(level)!.push(callback);
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
            <div style="display: flex; gap: 12px; justify-content: center;">
              <button onclick="window.location.reload()" style="padding: 12px 24px; background: #3b82f6; color: white; border-radius: 8px; font-weight: 500; cursor: pointer; border: none;">
                刷新页面
              </button>
              <button onclick="localStorage.clear(); sessionStorage.clear(); window.location.reload();" style="padding: 12px 24px; background: #ef4444; color: white; border-radius: 8px; font-weight: 500; cursor: pointer; border: none;">
                清除数据并刷新
              </button>
            </div>
          </div>
        </div>
      `;
    }
  }

  getErrorLog(): Array<{ timestamp: string; message: string; stack?: string; [key: string]: unknown }> {
    return [...this.errorLog];
  }

  getANRReports(): ANRReport[] {
    return [...this.anrReports];
  }

  getMemoryHistory(): MemorySnapshot[] {
    return [...this.memoryHistory];
  }

  getStats(): {
    errorCount: number;
    crashCount: number;
    recoveryAttempts: number;
    currentRecoveryLevel: RecoveryLevel;
    isStable: boolean;
    memoryUsage: { usedMB: number; totalMB: number; percentage: number } | null;
    anrReportCount: number;
  } {
    const memory = this.getCurrentMemorySnapshot();
    const memoryUsage = memory
      ? {
          usedMB: Math.round(memory.usedJSHeapSize / (1024 * 1024)),
          totalMB: Math.round(memory.jsHeapSizeLimit / (1024 * 1024)),
          percentage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100),
        }
      : null;

    return {
      errorCount: this.errorCount,
      crashCount: this.crashCount,
      recoveryAttempts: this.recoveryAttempts,
      currentRecoveryLevel: this.currentRecoveryLevel,
      isStable: this.errorCount < this.errorThreshold && this.crashCount < this.crashThreshold,
      memoryUsage,
      anrReportCount: this.anrReports.length,
    };
  }

  reset(): void {
    this.errorCount = 0;
    this.crashCount = 0;
    this.recoveryAttempts = 0;
    this.currentRecoveryLevel = 0;
    this.errorLog = [];
    this.anrReports = [];
    this.memoryHistory = [];
    this.clearCrashSnapshot();
  }

  destroy(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }
    if (this.anrCheckInterval) {
      clearInterval(this.anrCheckInterval);
      this.anrCheckInterval = null;
    }
    if (this.whiteScreenCheckInterval) {
      clearInterval(this.whiteScreenCheckInterval);
      this.whiteScreenCheckInterval = null;
    }
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
