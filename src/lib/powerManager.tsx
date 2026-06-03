import React, { memo, useRef, useEffect, useCallback } from 'react';

interface BatteryInfo {
  level: number;
  charging: boolean;
  addEventListener: (event: string, callback: () => void) => void;
  removeEventListener: (event: string, callback: () => void) => void;
}

interface PowerManagerConfig {
  backgroundDelay?: number;
  throttleInterval?: number;
  maxBackgroundTime?: number;
}

class PowerManager {
  private static instance: PowerManager;
  private isBackgrounded = false;
  private backgroundStartTime = 0;
  private throttledCallbacks: Map<string, { callback: () => void; lastRun: number; interval: number }> = new Map();
  private backgroundCleanupCallbacks: Map<string, () => void> = new Map();
  private config: PowerManagerConfig = {
    backgroundDelay: 30000,
    throttleInterval: 100,
    maxBackgroundTime: 12 * 60 * 60 * 1000,
  };

  static getInstance(): PowerManager {
    if (!PowerManager.instance) {
      PowerManager.instance = new PowerManager();
    }
    return PowerManager.instance;
  }

  constructor() {
    this.setupVisibilityListener();
    this.setupBatteryListener();
  }

  private setupVisibilityListener(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handleBackground();
      } else {
        this.handleForeground();
      }
    });
  }

  private setupBatteryListener(): void {
    if ('getBattery' in navigator) {
      (navigator as Navigator & { getBattery: () => Promise<BatteryInfo> }).getBattery()
        .then((battery) => {
          battery.addEventListener('levelchange', () => {
            if (battery.level < 0.2) {
              this.enablePowerSavingMode();
            }
          });
        })
        .catch(() => {
          console.warn('Battery API not available');
        });
    }
  }

  private handleBackground(): void {
    this.isBackgrounded = true;
    this.backgroundStartTime = Date.now();
    
    setTimeout(() => {
      if (this.isBackgrounded) {
        this.performBackgroundCleanup();
      }
    }, this.config.backgroundDelay);
  }

  private handleForeground(): void {
    this.isBackgrounded = false;
    const backgroundDuration = Date.now() - this.backgroundStartTime;
    
    if (backgroundDuration > this.config.maxBackgroundTime) {
      this.performDeepCleanup();
    }
  }

  private performBackgroundCleanup(): void {
    this.backgroundCleanupCallbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.warn('Background cleanup callback failed:', error);
      }
    });
  }

  private performDeepCleanup(): void {
    console.log('Performing deep cleanup after extended background time');
    this.backgroundCleanupCallbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.warn('Deep cleanup callback failed:', error);
      }
    });
  }

  private enablePowerSavingMode(): void {
    console.log('Enabling power saving mode due to low battery');
    this.config.throttleInterval = 200;
    this.config.backgroundDelay = 10000;
  }

  registerBackgroundCleanup(key: string, callback: () => void): void {
    this.backgroundCleanupCallbacks.set(key, callback);
  }

  unregisterBackgroundCleanup(key: string): void {
    this.backgroundCleanupCallbacks.delete(key);
  }

  throttle<T extends (...args: unknown[]) => unknown>(
    key: string,
    callback: T,
    interval: number = this.config.throttleInterval
  ): (...args: Parameters<T>) => void {
    const entry = this.throttledCallbacks.get(key) || {
      callback: callback as () => void,
      lastRun: 0,
      interval,
    };
    
    this.throttledCallbacks.set(key, entry);

    return (...args: Parameters<T>) => {
      if (this.isBackgrounded) {
        return;
      }

      const now = Date.now();
      if (now - entry.lastRun >= interval) {
        entry.lastRun = now;
        (callback as (...args: unknown[]) => void)(...args);
      }
    };
  }

  isBackground(): boolean {
    return this.isBackgrounded;
  }

  shouldThrottle(): boolean {
    return this.isBackgrounded;
  }

  getThrottleInterval(): number {
    return this.config.throttleInterval;
  }

  getBackgroundDuration(): number {
    if (!this.isBackgrounded) return 0;
    return Date.now() - this.backgroundStartTime;
  }
}

export const powerManager = PowerManager.getInstance();

export const usePowerManagement = (
  options: { 
    onBackground?: () => void;
    onForeground?: () => void;
    backgroundCleanup?: () => void;
  } = {}
): { 
  isBackgrounded: boolean; 
  backgroundDuration: number;
  throttle: <T extends (...args: unknown[]) => unknown>(key: string, callback: T) => (...args: Parameters<T>) => void;
} => {
  const { onBackground, onForeground, backgroundCleanup } = options;
  const [isBackgrounded, setIsBackgrounded] = React.useState(powerManager.isBackground());
  const cleanupKeyRef = useRef(`power-cleanup-${Date.now()}-${Math.random()}`);

  useEffect(() => {
    if (backgroundCleanup) {
      powerManager.registerBackgroundCleanup(cleanupKeyRef.current, backgroundCleanup);
    }

    return () => {
      if (backgroundCleanup) {
        powerManager.unregisterBackgroundCleanup(cleanupKeyRef.current);
      }
    };
  }, [backgroundCleanup]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const background = document.hidden;
      setIsBackgrounded(background);
      
      if (background) {
        onBackground?.();
      } else {
        onForeground?.();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onBackground, onForeground]);

  const throttle = useCallback(<T extends (...args: unknown[]) => unknown>(
    key: string,
    callback: T
  ): (...args: Parameters<T>) => void => {
    return powerManager.throttle(key, callback);
  }, []);

  const backgroundDuration = powerManager.getBackgroundDuration();

  return { isBackgrounded, backgroundDuration, throttle };
};

export const useBatteryAwareness = (): { 
  level: number; 
  isLowBattery: boolean; 
  isCharging: boolean;
} => {
  const [batteryInfo, setBatteryInfo] = React.useState({
    level: 1,
    isLowBattery: false,
    isCharging: true,
  });

  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as Navigator & { getBattery: () => Promise<BatteryInfo> }).getBattery()
        .then((battery) => {
          const updateBatteryInfo = () => {
            setBatteryInfo({
              level: battery.level,
              isLowBattery: battery.level < 0.2,
              isCharging: battery.charging,
            });
          };

          updateBatteryInfo();

          battery.addEventListener('levelchange', updateBatteryInfo);
          battery.addEventListener('chargingchange', updateBatteryInfo);

          return () => {
            battery.removeEventListener('levelchange', updateBatteryInfo);
            battery.removeEventListener('chargingchange', updateBatteryInfo);
          };
        })
        .catch(() => {
          console.warn('Battery API not available');
        });
    }
  }, []);

  return batteryInfo;
};

export const useOptimizedInterval = (
  callback: () => void,
  interval: number,
  options: { 
    pauseInBackground?: boolean;
    pauseOnLowBattery?: boolean;
    adaptiveInterval?: boolean;
  } = {}
): void => {
  const { 
    pauseInBackground = true, 
    pauseOnLowBattery = true, 
    adaptiveInterval = false 
  } = options;
  
  const callbackRef = useRef(callback);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const batteryInfo = useBatteryAwareness();
  const isBackgrounded = powerManager.isBackground();

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const shouldPause = 
      (pauseInBackground && isBackgrounded) ||
      (pauseOnLowBattery && batteryInfo.isLowBattery);

    if (shouldPause) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      return;
    }

    const actualInterval = adaptiveInterval && batteryInfo.isLowBattery 
      ? interval * 2 
      : interval;

    intervalRef.current = setInterval(callbackRef.current, actualInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [interval, isBackgrounded, batteryInfo.isLowBattery, pauseInBackground, pauseOnLowBattery, adaptiveInterval]);
};

export const OptimizedTimer = memo(({ 
  duration, 
  onComplete, 
  pauseInBackground = true,
  className 
}: { 
  duration: number; 
  onComplete: () => void;
  pauseInBackground?: boolean;
  className?: string;
}) => {
  const [remaining, setRemaining] = React.useState(duration);
  const [isPaused, setIsPaused] = React.useState(false);
  const startTimeRef = useRef(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (pauseInBackground) {
        setIsPaused(document.hidden);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pauseInBackground]);

  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newRemaining = duration - elapsed;
      
      if (newRemaining <= 0) {
        setRemaining(0);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        onComplete();
      } else {
        setRemaining(newRemaining);
      }
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [duration, isPaused, onComplete]);

  const progress = Math.max(0, Math.min(1, remaining / duration));
  const seconds = Math.ceil(remaining / 1000);

  return (
    <div className={className}>
      <div className="relative h-2 bg-neutral-200 rounded-full overflow-hidden">
        <div 
          className="absolute h-full bg-primary-500 transition-all duration-100"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <span className="text-sm text-neutral-600 mt-1">{seconds}s</span>
    </div>
  );
});

OptimizedTimer.displayName = 'OptimizedTimer';