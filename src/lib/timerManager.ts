class TimerManager {
  private timers: Map<string, { id: ReturnType<typeof setTimeout>; type: 'timeout' | 'interval' }> = new Map();
  private idleCallbacks: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private isBackgrounded = false;

  setTimer(key: string, callback: () => void, delay: number, type: 'timeout' | 'interval' = 'timeout'): void {
    this.clearTimer(key);
    
    if (this.isBackgrounded && type === 'interval') {
      return;
    }
    
    const id = type === 'timeout' 
      ? setTimeout(callback, delay)
      : setInterval(callback, delay);
    
    this.timers.set(key, { id, type });
  }

  setIdleCallback(key: string, callback: () => void, options?: { timeout?: number }): void {
    this.clearIdleCallback(key);
    
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(callback, options);
      this.idleCallbacks.set(key, id as unknown as ReturnType<typeof setTimeout>);
    } else {
      const id = setTimeout(callback, options?.timeout || 50);
      this.idleCallbacks.set(key, id);
    }
  }

  clearTimer(key: string): void {
    const timer = this.timers.get(key);
    if (timer) {
      if (timer.type === 'timeout') {
        clearTimeout(timer.id);
      } else {
        clearInterval(timer.id);
      }
      this.timers.delete(key);
    }
  }

  clearIdleCallback(key: string): void {
    const id = this.idleCallbacks.get(key);
    if (id) {
      if ('cancelIdleCallback' in window) {
        window.cancelIdleCallback(id as unknown as number);
      } else {
        clearTimeout(id);
      }
      this.idleCallbacks.delete(key);
    }
  }

  clearAllTimers(): void {
    this.timers.forEach((timer, key) => {
      this.clearTimer(key);
    });
    this.idleCallbacks.forEach((id, key) => {
      this.clearIdleCallback(key);
    });
  }

  setBackgroundState(isBackgrounded: boolean): void {
    this.isBackgrounded = isBackgrounded;
    
    if (isBackgrounded) {
      this.pauseIntervals();
    } else {
      this.resumeIntervals();
    }
  }

  private pausedIntervals: Map<string, { callback: () => void; delay: number }> = new Map();

  private pauseIntervals(): void {
    this.timers.forEach((timer, key) => {
      if (timer.type === 'interval') {
        this.pausedIntervals.set(key, {
          callback: () => {},
          delay: 0
        });
        clearInterval(timer.id);
        this.timers.delete(key);
      }
    });
  }

  private resumeIntervals(): void {
    this.pausedIntervals.forEach(({ callback, delay }, key) => {
      const id = setInterval(callback, delay);
      this.timers.set(key, { id, type: 'interval' });
    });
    this.pausedIntervals.clear();
  }

  getActiveTimerCount(): number {
    return this.timers.size + this.idleCallbacks.size;
  }
}

export const timerManager = new TimerManager();

export const setupVisibilityListener = (): (() => void) => {
  const handleVisibilityChange = () => {
    timerManager.setBackgroundState(document.hidden);
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    timerManager.clearAllTimers();
  };
};