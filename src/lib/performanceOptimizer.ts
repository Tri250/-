/**
 * Performance Optimizer - 性能优化工具
 *
 * 针对Android平台的动画性能优化
 * 通过检测平台自动调整动画参数，提升低端设备体验
 */

import { platformCheck } from './platformService';

// 性能等级
export type PerformanceLevel = 'high' | 'medium' | 'low';

// 动画配置接口
export interface AnimationConfig {
  duration: number;
  delay: number;
  enabled: boolean;
  complexity: 'full' | 'reduced' | 'minimal';
}

/**
 * 检测设备性能等级
 */
export const detectPerformanceLevel = (): PerformanceLevel => {
  // Android设备检测
  if (platformCheck.isAndroid()) {
    // 检测设备内存（如果可用）
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    if (deviceMemory !== undefined) {
      if (deviceMemory >= 6) return 'high';
      if (deviceMemory >= 4) return 'medium';
      return 'low';
    }
    
    // 检测CPU核心数
    const cpuCores = navigator.hardwareConcurrency || 4;
    if (cpuCores >= 8) return 'high';
    if (cpuCores >= 4) return 'medium';
    return 'low';
  }
  
  // iOS设备通常性能较好
  if (platformCheck.isIOS()) {
    return 'high';
  }
  
  // Web环境默认高性能
  return 'high';
};

// 当前性能等级
const performanceLevel = detectPerformanceLevel();

/**
 * 获取优化的动画配置
 */
export const getOptimizedAnimationConfig = (): AnimationConfig => {
  const isAndroid = platformCheck.isAndroid();
  const isLowEnd = performanceLevel === 'low';
  
  // Android平台或低端设备：减少动画时长和复杂度
  if (isAndroid || isLowEnd) {
    return {
      // 大幅缩短动画时长
      duration: isLowEnd ? 150 : 250,
      // 减少延迟
      delay: isLowEnd ? 50 : 100,
      // 低端设备禁用装饰性动画
      enabled: !isLowEnd,
      // 降低动画复杂度
      complexity: isLowEnd ? 'minimal' : 'reduced',
    };
  }
  
  // 高性能设备：完整动画体验
  return {
    duration: 800,
    delay: 300,
    enabled: true,
    complexity: 'full',
  };
};

// 动画配置
export const animationConfig = getOptimizedAnimationConfig();

/**
 * 动画时长优化
 */
export const optimizedDuration = {
  // 入场动画
  enter: animationConfig.duration * 0.3,
  // 主动画
  main: animationConfig.duration * 0.5,
  // 次要动画
  secondary: animationConfig.duration * 0.2,
  // 进度条动画
  progress: animationConfig.complexity === 'full' ? 2000 : 
            animationConfig.complexity === 'reduced' ? 1000 : 500,
  // 列表项交错延迟
  stagger: animationConfig.delay * 0.3,
};

/**
 * 弹性动画参数优化
 */
export const optimizedSpring = {
  // 标准弹性（Android优化）
  standard: animationConfig.complexity === 'full' 
    ? { tension: 300, friction: 20 }
    : { tension: 400, friction: 30 },
  
  // 快速弹性
  fast: animationConfig.complexity === 'full'
    ? { tension: 400, friction: 15 }
    : { tension: 500, friction: 25 },
  
  // 柔和弹性
  gentle: animationConfig.complexity === 'full'
    ? { tension: 200, friction: 25 }
    : { tension: 300, friction: 35 },
};

/**
 * 检查是否应该简化动画
 */
export const shouldSimplifyAnimations = (): boolean => {
  return animationConfig.complexity !== 'full';
};

/**
 * 检查是否应该禁用装饰性动画
 */
export const shouldDisableDecorativeAnimations = (): boolean => {
  return animationConfig.complexity === 'minimal';
};

/**
 * 获取硬件加速样式
 */
export const getHardwareAccelerationStyle = (): React.CSSProperties => {
  return {
    // 启用GPU加速
    transform: 'translateZ(0)',
    // 强制创建新的合成层
    willChange: 'transform, opacity',
    // 优化渲染
    backfaceVisibility: 'hidden',
  };
};

/**
 * 获取优化的过渡样式
 */
export const getOptimizedTransition = (properties: string[] = ['opacity', 'transform']): string => {
  const duration = optimizedDuration.main;
  const easing = 'cubic-bezier(0.4, 0, 0.2, 1)';
  
  return properties
    .map(prop => `${prop} ${duration}ms ${easing}`)
    .join(', ');
};

/**
 * 性能监控装饰器
 */
export const measurePerformance = (name: string) => {
  if (process.env.NODE_ENV === 'development') {
    const start = performance.now();
    return {
      end: () => {
        const duration = performance.now() - start;
        if (duration > 16.67) { // 超过一帧
          console.warn(`[Performance] ${name} took ${duration.toFixed(2)}ms`);
        }
      },
    };
  }
  return { end: () => {} };
};

/**
 * 请求空闲回调的降级处理
 */
export const requestIdleCallback = (
  callback: IdleRequestCallback,
  options?: IdleRequestOptions
): number => {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  }
  // 降级：使用setTimeout
  const timerId = setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => 50,
    });
  }, 1);
  return timerId as unknown as number;
};

/**
 * 取消空闲回调
 */
export const cancelIdleCallback = (id: number): void => {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
};

/**
 * 批量更新优化
 * 用于减少频繁的状态更新
 */
export class BatchUpdater {
  private pendingUpdates: Map<string, unknown> = new Map();
  private rafId: number | null = null;
  
  queue(key: string, value: unknown): void {
    this.pendingUpdates.set(key, value);
    
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => {
        this.flush();
      });
    }
  }
  
  private flush(): void {
    // 子类实现具体更新逻辑
    this.pendingUpdates.clear();
    this.rafId = null;
  }
  
  cancel(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.pendingUpdates.clear();
  }
}

// 导出性能优化工具集合
export const performanceOptimizer = {
  getPerformanceLevel: detectPerformanceLevel,
  getAnimationConfig: getOptimizedAnimationConfig,
  shouldSimplifyAnimations,
  shouldDisableDecorativeAnimations,
  getHardwareAccelerationStyle,
  getOptimizedTransition,
  measurePerformance,
  requestIdleCallback,
  cancelIdleCallback,
};

export default performanceOptimizer;
