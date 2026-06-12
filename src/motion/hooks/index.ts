// ============================================
// PawSync Pro - Motion Hooks
// 
// 自定义动画hooks
// ============================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSpring, useTransform, useMotionValue, MotionValue } from 'framer-motion';

// ═══════════════════════════════════════════
// 🎯 useCountUp - 数字滚动动画
// ═══════════════════════════════════════════

export interface UseCountUpOptions {
  /** 目标数值 */
  target: number;
  
  /** 初始数值 */
  initial?: number;
  
  /** 动画时长 (ms) */
  duration?: number;
  
  /** 弹簧配置 */
  springConfig?: {
    stiffness?: number;
    damping?: number;
  };
  
  /** 小数位数 */
  decimals?: number;
  
  /** 是否启用动画 */
  enabled?: boolean;
}

export const useCountUp = (options: UseCountUpOptions) => {
  const {
    target,
    initial = 0,
    duration = 1200,
    springConfig = { stiffness: 100, damping: 30 },
    decimals = 0,
    enabled = true,
  } = options;

  const motionValue = useMotionValue(initial);
  const [displayValue, setDisplayValue] = useState(initial);

  // 弹簧动画
  const spring = useSpring(motionValue, {
    stiffness: springConfig.stiffness,
    damping: springConfig.damping,
  });

  // 监听变化
  useEffect(() => {
    if (!enabled) {
      setDisplayValue(target);
      return;
    }

    motionValue.set(target);

    const unsubscribe = spring.on('change', (latest) => {
      setDisplayValue(Number(latest.toFixed(decimals)));
    });

    return unsubscribe;
  }, [target, enabled, motionValue, spring, decimals]);

  // 格式化
  const formatValue = useCallback(
    (value: number, format?: (v: number) => string) => {
      if (format) return format(value);
      return decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
    },
    [decimals]
  );

  return {
    value: displayValue,
    motionValue,
    spring,
    formatValue,
  };
};

// ═══════════════════════════════════════════
// 🎯 useParallax - 视差滚动
// ═══════════════════════════════════════════

export interface UseParallaxOptions {
  /** 视差系数 (0-1) */
  factor?: number;
  
  /** 最大位移 (px) */
  maxOffset?: number;
  
  /** 方向 */
  direction?: 'vertical' | 'horizontal';
  
  /** 是否启用 */
  enabled?: boolean;
}

export const useParallax = (options: UseParallaxOptions = {}) => {
  const {
    factor = 0.5,
    maxOffset = 100,
    direction = 'vertical',
    enabled = true,
  } = options;

  const scrollY = useMotionValue(0);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const handleScroll = () => {
      const currentScroll = window.scrollY;
      scrollY.set(currentScroll);

      // 计算视差位移
      const parallaxOffset = Math.min(currentScroll * factor, maxOffset);
      setOffset(parallaxOffset);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [factor, maxOffset, enabled, scrollY]);

  // MotionValue for Framer Motion
  const y = useTransform(scrollY, (latest) => Math.min(latest * factor, maxOffset));
  const x = direction === 'horizontal' ? y : useMotionValue(0);

  return {
    offset,
    scrollY,
    y: direction === 'vertical' ? y : useMotionValue(0),
    x: direction === 'horizontal' ? y : useMotionValue(0),
  };
};

// ═══════════════════════════════════════════
// 🎯 useScrollDirection - 滚动方向感知
// ═══════════════════════════════════════════

export interface UseScrollDirectionOptions {
  /** 触发阈值 (px) */
  threshold?: number;
  
  /** 是否启用 */
  enabled?: boolean;
}

export const useScrollDirection = (options: UseScrollDirectionOptions = {}) => {
  const { threshold = 50, enabled = true } = options;

  const [direction, setDirection] = useState<'up' | 'down' | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY.current;

      setIsScrolling(true);

      // 清除之前的timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      // 设置滚动停止检测
      scrollTimeout.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);

      // 检测方向
      if (Math.abs(diff) > threshold) {
        if (diff > 0) {
          setDirection('down');
        } else {
          setDirection('up');
        }
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [threshold, enabled]);

  return {
    direction,
    isScrolling,
    scrollY: lastScrollY.current,
  };
};

// ═══════════════════════════════════════════
// 🎯 useInView - 视口可见检测
// ═══════════════════════════════════════════

export interface UseInViewOptions {
  /** 是否只触发一次 */
  once?: boolean;
  
  /** 边距 */
  margin?: string;
  
  /** 阈值 */
  threshold?: number;
  
  /** 是否启用 */
  enabled?: boolean;
}

export const useInView = (options: UseInViewOptions = {}) => {
  const { once = true, margin = '0px', threshold = 0.1, enabled = true } = options;

  const ref = useRef<HTMLElement | null>(null);
  const [isInView, setIsInView] = useState(false);
  const [hasBeenInView, setHasBeenInView] = useState(false);

  useEffect(() => {
    if (!enabled || !ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting;

        if (inView) {
          setIsInView(true);
          setHasBeenInView(true);

          if (once) {
            observer.disconnect();
          }
        } else if (!once) {
          setIsInView(false);
        }
      },
      {
        rootMargin: margin,
        threshold,
      }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [once, margin, threshold, enabled]);

  return {
    ref,
    isInView,
    hasBeenInView,
  };
};

// ═══════════════════════════════════════════
// 🎯 useStagger - 错峰入场动画
// ═══════════════════════════════════════════

export interface UseStaggerOptions {
  /** 子元素数量 */
  count: number;
  
  /** 延迟间隔 (ms) */
  delay?: number;
  
  /** 是否启用 */
  enabled?: boolean;
}

export const useStagger = (options: UseStaggerOptions) => {
  const { count, delay = 50, enabled = true } = options;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const startStagger = useCallback(() => {
    if (!enabled) {
      setCurrentIndex(count);
      return;
    }

    setIsAnimating(true);
    setCurrentIndex(0);

    const animate = (index: number) => {
      if (index >= count) {
        setIsAnimating(false);
        return;
      }

      setTimeout(() => {
        setCurrentIndex(index + 1);
        animate(index + 1);
      }, delay);
    };

    animate(0);
  }, [count, delay, enabled]);

  // 获取单个元素的延迟
  const getDelay = useCallback(
    (index: number) => {
      if (!enabled) return 0;
      return index * delay;
    },
    [delay, enabled]
  );

  return {
    currentIndex,
    isAnimating,
    startStagger,
    getDelay,
  };
};

// ═══════════════════════════════════════════
// 🎯 useHaptic - 触感反馈 (模拟)
// ═══════════════════════════════════════════

export type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export const useHaptic = () => {
  const triggerHaptic = useCallback((style: HapticStyle = 'light') => {
    // 在真实设备上使用 Vibration API
    if ('vibration' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30],
        success: [10, 50, 10],
        warning: [20, 50, 20],
        error: [30, 50, 30, 50, 30],
      };

      navigator.vibrate(patterns[style]);
    }
  }, []);

  return {
    light: () => triggerHaptic('light'),
    medium: () => triggerHaptic('medium'),
    heavy: () => triggerHaptic('heavy'),
    success: () => triggerHaptic('success'),
    warning: () => triggerHaptic('warning'),
    error: () => triggerHaptic('error'),
    trigger: triggerHaptic,
  };
};

// ═══════════════════════════════════════════
// 🎯 useBreathing - 呼吸动画
// ═══════════════════════════════════════════

export interface UseBreathingOptions {
  /** 动画时长 (ms) */
  duration?: number;
  
  /** 最小缩放 */
  minScale?: number;
  
  /** 最大缩放 */
  maxScale?: number;
  
  /** 最小透明度 */
  minOpacity?: number;
  
  /** 最大透明度 */
  maxOpacity?: number;
  
  /** 是否启用 */
  enabled?: boolean;
}

export const useBreathing = (options: UseBreathingOptions = {}) => {
  const {
    duration = 3000,
    minScale = 1,
    maxScale = 1.1,
    minOpacity = 0.3,
    maxOpacity = 0.5,
    enabled = true,
  } = options;

  const scale = useMotionValue(minScale);
  const opacity = useMotionValue(minOpacity);
  const [phase, setPhase] = useState<'in' | 'out'>('in');

  useEffect(() => {
    if (!enabled) {
      scale.set(minScale);
      opacity.set(minOpacity);
      return;
    }

    const animate = () => {
      const nextPhase = phase === 'in' ? 'out' : 'in';
      const nextScale = phase === 'in' ? maxScale : minScale;
      const nextOpacity = phase === 'in' ? maxOpacity : minOpacity;

      scale.set(nextScale);
      opacity.set(nextOpacity);
      setPhase(nextPhase);
    };

    const interval = setInterval(animate, duration);
    animate();

    return () => clearInterval(interval);
  }, [duration, minScale, maxScale, minOpacity, maxOpacity, enabled, phase, scale, opacity]);

  return {
    scale,
    opacity,
    phase,
  };
};

// ═══════════════════════════════════════════
// 🎯 useFloating - 浮动动画
// ═══════════════════════════════════════════

export interface UseFloatingOptions {
  /** 动画时长 (ms) */
  duration?: number;
  
  /** 浮动距离 (px) */
  distance?: number;
  
  /** 是否启用 */
  enabled?: boolean;
}

export const useFloating = (options: UseFloatingOptions = {}) => {
  const { duration = 4000, distance = 10, enabled = true } = options;

  const y = useMotionValue(0);
  const [phase, setPhase] = useState<'up' | 'down'>('up');

  useEffect(() => {
    if (!enabled) {
      y.set(0);
      return;
    }

    const animate = () => {
      const nextPhase = phase === 'up' ? 'down' : 'up';
      const nextY = phase === 'up' ? -distance : 0;

      y.set(nextY);
      setPhase(nextPhase);
    };

    const interval = setInterval(animate, duration);
    animate();

    return () => clearInterval(interval);
  }, [duration, distance, enabled, phase, y]);

  return {
    y,
    phase,
  };
};

export default {
  useCountUp,
  useParallax,
  useScrollDirection,
  useInView,
  useStagger,
  useHaptic,
  useBreathing,
  useFloating,
};