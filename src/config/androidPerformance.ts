/**
 * Android Performance Configuration - Android 性能优化配置
 *
 * 针对 Android 平台的性能优化设置
 * 确保 Android 应用运行流畅，内存占用合理
 */

import { Capacitor } from '@capacitor/core';

/**
 * 检查是否为 Android 平台
 */
const isAndroid = (): boolean => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
};

/**
 * 性能配置接口
 */
export interface AndroidPerformanceConfig {
  // 动画配置
  animations: {
    enabled: boolean;
    reducedMotion: boolean;
    maxFPS: number;
    durationMultiplier: number;
  };
  
  // 图片配置
  images: {
    lazyLoadEnabled: boolean;
    maxImageSize: number; // KB
    compressionQuality: number; // 0-100
    cacheSize: number; // MB
  };
  
  // 内存配置
  memory: {
    maxCacheItems: number;
    cleanupInterval: number; // ms
    warningThreshold: number; // MB
  };
  
  // 网络配置
  network: {
    requestTimeout: number; // ms
    retryAttempts: number;
    cacheEnabled: boolean;
    prefetchEnabled: boolean;
  };
  
  // UI 配置
  ui: {
    virtualListThreshold: number;
    debounceDelay: number; // ms
    throttleDelay: number; // ms
    hardwareAcceleration: boolean;
  };
  
  // 存储配置
  storage: {
    maxLocalStorageSize: number; // KB
    useNativeStorage: boolean;
    encryptionEnabled: boolean;
  };
}

/**
 * 默认 Android 性能配置
 */
const defaultAndroidConfig: AndroidPerformanceConfig = {
  animations: {
    enabled: true,
    reducedMotion: false,
    maxFPS: 60,
    durationMultiplier: 1.0,
  },
  
  images: {
    lazyLoadEnabled: true,
    maxImageSize: 1024, // 1MB
    compressionQuality: 80,
    cacheSize: 50, // 50MB
  },
  
  memory: {
    maxCacheItems: 100,
    cleanupInterval: 30000, // 30秒
    warningThreshold: 150, // 150MB
  },
  
  network: {
    requestTimeout: 15000, // 15秒
    retryAttempts: 3,
    cacheEnabled: true,
    prefetchEnabled: false,
  },
  
  ui: {
    virtualListThreshold: 50,
    debounceDelay: 300,
    throttleDelay: 100,
    hardwareAcceleration: true,
  },
  
  storage: {
    maxLocalStorageSize: 5120, // 5MB
    useNativeStorage: true,
    encryptionEnabled: false,
  },
};

/**
 * 低端设备性能配置
 */
const lowEndDeviceConfig: AndroidPerformanceConfig = {
  animations: {
    enabled: false,
    reducedMotion: true,
    maxFPS: 30,
    durationMultiplier: 0.5,
  },
  
  images: {
    lazyLoadEnabled: true,
    maxImageSize: 512, // 512KB
    compressionQuality: 60,
    cacheSize: 20, // 20MB
  },
  
  memory: {
    maxCacheItems: 50,
    cleanupInterval: 15000, // 15秒
    warningThreshold: 100, // 100MB
  },
  
  network: {
    requestTimeout: 20000, // 20秒
    retryAttempts: 2,
    cacheEnabled: true,
    prefetchEnabled: false,
  },
  
  ui: {
    virtualListThreshold: 30,
    debounceDelay: 500,
    throttleDelay: 200,
    hardwareAcceleration: false,
  },
  
  storage: {
    maxLocalStorageSize: 2048, // 2MB
    useNativeStorage: true,
    encryptionEnabled: false,
  },
};

/**
 * 高端设备性能配置
 */
const highEndDeviceConfig: AndroidPerformanceConfig = {
  animations: {
    enabled: true,
    reducedMotion: false,
    maxFPS: 60,
    durationMultiplier: 1.0,
  },
  
  images: {
    lazyLoadEnabled: true,
    maxImageSize: 2048, // 2MB
    compressionQuality: 90,
    cacheSize: 100, // 100MB
  },
  
  memory: {
    maxCacheItems: 200,
    cleanupInterval: 60000, // 60秒
    warningThreshold: 200, // 200MB
  },
  
  network: {
    requestTimeout: 10000, // 10秒
    retryAttempts: 3,
    cacheEnabled: true,
    prefetchEnabled: true,
  },
  
  ui: {
    virtualListThreshold: 100,
    debounceDelay: 200,
    throttleDelay: 50,
    hardwareAcceleration: true,
  },
  
  storage: {
    maxLocalStorageSize: 10240, // 10MB
    useNativeStorage: true,
    encryptionEnabled: true,
  },
};

/**
 * 设备性能等级
 */
export type DevicePerformanceLevel = 'low' | 'medium' | 'high';

/**
 * 检测设备性能等级
 */
const detectPerformanceLevel = (): DevicePerformanceLevel => {
  // 检测设备内存
  const deviceMemory = navigator.deviceMemory || 4; // GB
  
  // 检测硬件并发数
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  
  // 检测连接速度
  const connection = (navigator as any).connection;
  const effectiveType = connection?.effectiveType || '4g';
  
  console.log('[AndroidPerformance] Device info:', {
    memory: deviceMemory,
    cores: hardwareConcurrency,
    connection: effectiveType,
  });
  
  // 低端设备判断
  if (deviceMemory < 2 || hardwareConcurrency < 4 || effectiveType === '2g') {
    return 'low';
  }
  
  // 高端设备判断
  if (deviceMemory >= 6 && hardwareConcurrency >= 8 && effectiveType === '4g') {
    return 'high';
  }
  
  // 默认中等设备
  return 'medium';
};

/**
 * 获取性能配置
 */
export const getAndroidPerformanceConfig = (): AndroidPerformanceConfig => {
  // 非 Android 平台使用默认配置
  if (!isAndroid()) {
    return defaultAndroidConfig;
  }
  
  // 检测设备性能等级
  const level = detectPerformanceLevel();
  console.log('[AndroidPerformance] Detected performance level:', level);
  
  // 根据性能等级返回配置
  switch (level) {
    case 'low':
      return lowEndDeviceConfig;
    case 'high':
      return highEndDeviceConfig;
    default:
      return defaultAndroidConfig;
  }
};

/**
 * 应用性能配置到 DOM
 */
export const applyAndroidPerformanceConfig = (config: AndroidPerformanceConfig): void => {
  if (!isAndroid()) return;
  
  const root = document.documentElement;
  
  // 应用动画配置
  if (!config.animations.enabled || config.animations.reducedMotion) {
    root.classList.add('reduce-motion');
  }
  
  // 应用硬件加速配置
  if (config.ui.hardwareAcceleration) {
    root.classList.add('gpu-accelerated');
  } else {
    root.classList.add('no-gpu-acceleration');
  }
  
  // 设置 CSS 变量
  root.style.setProperty('--animation-duration-multiplier', config.animations.durationMultiplier.toString());
  root.style.setProperty('--max-fps', config.animations.maxFPS.toString());
  
  console.log('[AndroidPerformance] Applied performance config to DOM');
};

/**
 * 性能监控
 */
export const startPerformanceMonitoring = (config: AndroidPerformanceConfig): void => {
  if (!isAndroid()) return;
  
  // 内存监控
  const memoryCheckInterval = setInterval(() => {
    if (performance.memory) {
      const usedJSHeapSize = performance.memory.usedJSHeapSize / (1024 * 1024);
      console.log('[AndroidPerformance] Memory usage:', usedJSHeapSize.toFixed(2), 'MB');
      
      if (usedJSHeapSize > config.memory.warningThreshold) {
        console.warn('[AndroidPerformance] Memory usage exceeds threshold!');
        // 触发清理
        triggerMemoryCleanup();
      }
    }
  }, config.memory.cleanupInterval);
  
  // FPS 监控
  let lastTime = performance.now();
  let frameCount = 0;
  
  const fpsMonitor = () => {
    frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - lastTime >= 1000) {
      const fps = frameCount;
      console.log('[AndroidPerformance] FPS:', fps);
      
      if (fps < config.animations.maxFPS * 0.5) {
        console.warn('[AndroidPerformance] FPS is too low:', fps);
      }
      
      frameCount = 0;
      lastTime = currentTime;
    }
    
    requestAnimationFrame(fpsMonitor);
  };
  
  requestAnimationFrame(fpsMonitor);
  
  console.log('[AndroidPerformance] Performance monitoring started');
};

/**
 * 触发内存清理
 */
const triggerMemoryCleanup = (): void => {
  // 清理图片缓存
  const images = document.querySelectorAll('img[data-loaded]');
  images.forEach(img => {
    if (img.getAttribute('data-loaded') === 'cached') {
      img.removeAttribute('src');
      img.removeAttribute('data-loaded');
    }
  });
  
  // 清理隐藏元素
  const hiddenElements = document.querySelectorAll('[style*="display: none"]');
  hiddenElements.forEach(el => {
    if (el.innerHTML.length > 1000) {
      el.innerHTML = '';
    }
  });
  
  console.log('[AndroidPerformance] Memory cleanup triggered');
};

/**
 * 初始化 Android 性能优化
 */
export const initializeAndroidPerformance = (): void => {
  if (!isAndroid()) {
    console.log('[AndroidPerformance] Not Android platform, skipping performance initialization');
    return;
  }
  
  console.log('[AndroidPerformance] Initializing Android performance optimization...');
  
  const config = getAndroidPerformanceConfig();
  applyAndroidPerformanceConfig(config);
  startPerformanceMonitoring(config);
  
  console.log('[AndroidPerformance] Android performance optimization initialized');
};

/**
 * Android 性能优化 Hook
 */
export function useAndroidPerformance() {
  const config = getAndroidPerformanceConfig();
  const isAndroidDevice = isAndroid();
  const performanceLevel = detectPerformanceLevel();
  
  return {
    config,
    isAndroid: isAndroidDevice,
    performanceLevel,
    applyConfig: applyAndroidPerformanceConfig,
    startMonitoring: startPerformanceMonitoring,
    initialize: initializeAndroidPerformance,
  };
}