interface LeakInfo {
  id: string;
  type: 'component' | 'timer' | 'event_listener' | 'observer' | 'subscription';
  name: string;
  createdAt: number;
  stack?: string;
  metadata?: Record<string, unknown>;
}

interface ComponentMountInfo {
  componentName: string;
  mountCount: number;
  unmountCount: number;
  mountedInstances: Set<string>;
}

interface TimerLeakInfo {
  id: string;
  type: 'setTimeout' | 'setInterval' | 'requestAnimationFrame';
  createdAt: number;
  cleared: boolean;
  label?: string;
}

interface EventListenerLeakInfo {
  target: string;
  event: string;
  createdAt: number;
  removed: boolean;
}

type LeakWarningCallback = (info: LeakInfo) => void;

const DEFAULT_WARN_THRESHOLD_MS = 5 * 60 * 1000;
const DEFAULT_CHECK_INTERVAL_MS = 30000;

class MemoryLeakDetector {
  private static instance: MemoryLeakDetector;

  private enabled = false;
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private warnThresholdMs = DEFAULT_WARN_THRESHOLD_MS;

  private componentMounts: Map<string, ComponentMountInfo> = new Map();
  private activeTimers: Map<string, TimerLeakInfo> = new Map();
  private activeEventListeners: Map<string, EventListenerLeakInfo> = new Map();
  private activeObservers: Map<string, LeakInfo> = new Map();
  private activeSubscriptions: Map<string, LeakInfo> = new Map();

  private leakHistory: LeakInfo[] = [];
  private maxLeakHistory = 50;

  private warningListeners: Set<LeakWarningCallback> = new Set();

  static getInstance(): MemoryLeakDetector {
    if (!MemoryLeakDetector.instance) {
      MemoryLeakDetector.instance = new MemoryLeakDetector();
    }
    return MemoryLeakDetector.instance;
  }

  enable(): void {
    if (this.enabled) return;
    this.enabled = true;
    this.startPeriodicCheck();
    this.instrumentAPIs();
  }

  disable(): void {
    this.enabled = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setWarnThreshold(thresholdMs: number): void {
    this.warnThresholdMs = thresholdMs;
  }

  onLeakWarning(callback: LeakWarningCallback): () => void {
    this.warningListeners.add(callback);
    return () => this.warningListeners.delete(callback);
  }

  private instrumentAPIs(): void {
    if (typeof window === 'undefined') return;
    if ((window as { __memoryLeakInstrumented?: boolean }).__memoryLeakInstrumented) return;

    const detector = this;

    const originalSetTimeout = window.setTimeout;
    window.setTimeout = function (this: Window, callback: (...args: unknown[]) => void, delay?: number, ...args: unknown[]): number {
      const id = originalSetTimeout.call(
        this,
        function (this: unknown, ...innerArgs: unknown[]) {
          detector.clearTimer(String(id), 'timeout');
          callback.apply(this, innerArgs);
        },
        delay,
        ...args
      ) as unknown as number;
      detector.registerTimer(String(id), 'setTimeout');
      return id;
    } as typeof window.setTimeout;

    const originalClearTimeout = window.clearTimeout;
    window.clearTimeout = function (this: Window, id: number | undefined) {
      if (typeof id === 'number') {
        detector.clearTimer(String(id), 'timeout');
      }
      return originalClearTimeout.call(this, id);
    } as typeof window.clearTimeout;

    const originalSetInterval = window.setInterval;
    window.setInterval = function (this: Window, callback: (...args: unknown[]) => void, delay?: number, ...args: unknown[]): number {
      const id = originalSetInterval.call(this, callback, delay, ...args) as unknown as number;
      detector.registerTimer(String(id), 'setInterval');
      return id;
    } as typeof window.setInterval;

    const originalClearInterval = window.clearInterval;
    window.clearInterval = function (this: Window, id: number | undefined) {
      if (typeof id === 'number') {
        detector.clearTimer(String(id), 'interval');
      }
      return originalClearInterval.call(this, id);
    } as typeof window.clearInterval;

    const originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = function (callback: FrameRequestCallback): number {
      const id = originalRAF(function (time) {
        detector.clearTimer(String(id), 'raf');
        callback(time);
      });
      detector.registerTimer(String(id), 'requestAnimationFrame');
      return id;
    } as typeof window.requestAnimationFrame;

    const originalCAF = window.cancelAnimationFrame;
    window.cancelAnimationFrame = function (id: number) {
      detector.clearTimer(String(id), 'raf');
      return originalCAF(id);
    } as typeof window.cancelAnimationFrame;

    const originalAddEventListener = EventTarget.prototype.addEventListener;
    const originalRemoveEventListener = EventTarget.prototype.removeEventListener;

    EventTarget.prototype.addEventListener = function (
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ): void {
      const targetId = detector.getTargetId(this);
      detector.registerEventListener(targetId, type);
      return originalAddEventListener.call(this, type, listener, options);
    };

    EventTarget.prototype.removeEventListener = function (
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | EventListenerOptions
    ): void {
      const targetId = detector.getTargetId(this);
      detector.clearEventListener(targetId, type);
      return originalRemoveEventListener.call(this, type, listener, options);
    };

    (window as { __memoryLeakInstrumented: boolean }).__memoryLeakInstrumented = true;
  }

  private getTargetId(target: EventTarget): string {
    if (target === window) return 'window';
    if (target === document) return 'document';
    if (target instanceof HTMLElement) {
      return `element:${target.tagName.toLowerCase()}${target.id ? '#' + target.id : ''}`;
    }
    return `target:${target.constructor.name}`;
  }

  registerComponentMount(componentName: string, instanceId: string): void {
    if (!this.enabled) return;

    let info = this.componentMounts.get(componentName);
    if (!info) {
      info = {
        componentName,
        mountCount: 0,
        unmountCount: 0,
        mountedInstances: new Set(),
      };
      this.componentMounts.set(componentName, info);
    }

    info.mountCount++;
    info.mountedInstances.add(instanceId);
  }

  registerComponentUnmount(componentName: string, instanceId: string): void {
    if (!this.enabled) return;

    const info = this.componentMounts.get(componentName);
    if (!info) return;

    info.unmountCount++;
    info.mountedInstances.delete(instanceId);
  }

  registerTimer(id: string, type: TimerLeakInfo['type'], label?: string): void {
    if (!this.enabled) return;

    this.activeTimers.set(id, {
      id,
      type,
      createdAt: Date.now(),
      cleared: false,
      label,
    });
  }

  clearTimer(id: string, _type: string): void {
    const timer = this.activeTimers.get(id);
    if (timer) {
      timer.cleared = true;
      this.activeTimers.delete(id);
    }
  }

  registerEventListener(target: string, event: string): void {
    if (!this.enabled) return;

    const key = `${target}:${event}`;
    this.activeEventListeners.set(key, {
      target,
      event,
      createdAt: Date.now(),
      removed: false,
    });
  }

  clearEventListener(target: string, event: string): void {
    const key = `${target}:${event}`;
    const listener = this.activeEventListeners.get(key);
    if (listener) {
      listener.removed = true;
      this.activeEventListeners.delete(key);
    }
  }

  registerObserver(id: string, name: string, metadata?: Record<string, unknown>): void {
    if (!this.enabled) return;

    this.activeObservers.set(id, {
      id,
      type: 'observer',
      name,
      createdAt: Date.now(),
      stack: new Error().stack,
      metadata,
    });
  }

  clearObserver(id: string): void {
    this.activeObservers.delete(id);
  }

  registerSubscription(id: string, name: string, metadata?: Record<string, unknown>): void {
    if (!this.enabled) return;

    this.activeSubscriptions.set(id, {
      id,
      type: 'subscription',
      name,
      createdAt: Date.now(),
      stack: new Error().stack,
      metadata,
    });
  }

  clearSubscription(id: string): void {
    this.activeSubscriptions.delete(id);
  }

  private startPeriodicCheck(): void {
    this.checkInterval = setInterval(() => {
      this.checkForLeaks();
    }, DEFAULT_CHECK_INTERVAL_MS);
  }

  private checkForLeaks(): void {
    const now = Date.now();

    this.activeTimers.forEach((timer) => {
      if (!timer.cleared && now - timer.createdAt > this.warnThresholdMs) {
        this.reportLeak({
          id: timer.id,
          type: 'timer',
          name: `${timer.type}${timer.label ? ` (${timer.label})` : ''}`,
          createdAt: timer.createdAt,
        });
      }
    });

    this.activeObservers.forEach((observer) => {
      if (now - observer.createdAt > this.warnThresholdMs) {
        this.reportLeak(observer);
      }
    });

    this.activeSubscriptions.forEach((subscription) => {
      if (now - subscription.createdAt > this.warnThresholdMs) {
        this.reportLeak(subscription);
      }
    });
  }

  private reportLeak(leakInfo: LeakInfo): void {
    this.leakHistory.push(leakInfo);
    if (this.leakHistory.length > this.maxLeakHistory) {
      this.leakHistory.shift();
    }

    this.warningListeners.forEach((callback) => {
      try {
        callback(leakInfo);
      } catch {
        // ignore
      }
    });

    console.warn('[MemoryLeakDetector] Potential leak detected:', leakInfo);
  }

  getStats(): {
    componentMounts: Array<{ name: string; mountCount: number; unmountCount: number; activeInstances: number }>;
    activeTimers: number;
    activeEventListeners: number;
    activeObservers: number;
    activeSubscriptions: number;
    leakHistoryCount: number;
  } {
    const componentStats = Array.from(this.componentMounts.values()).map((info) => ({
      name: info.componentName,
      mountCount: info.mountCount,
      unmountCount: info.unmountCount,
      activeInstances: info.mountedInstances.size,
    }));

    return {
      componentMounts: componentStats,
      activeTimers: this.activeTimers.size,
      activeEventListeners: this.activeEventListeners.size,
      activeObservers: this.activeObservers.size,
      activeSubscriptions: this.activeSubscriptions.size,
      leakHistoryCount: this.leakHistory.length,
    };
  }

  getLeakHistory(): LeakInfo[] {
    return [...this.leakHistory];
  }

  reset(): void {
    this.componentMounts.clear();
    this.activeTimers.clear();
    this.activeEventListeners.clear();
    this.activeObservers.clear();
    this.activeSubscriptions.clear();
    this.leakHistory = [];
  }
}

export const memoryLeakDetector = MemoryLeakDetector.getInstance();

export type { LeakInfo, ComponentMountInfo, TimerLeakInfo, EventListenerLeakInfo };
