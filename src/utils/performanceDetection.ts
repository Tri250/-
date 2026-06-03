// ============================================
// PawSync Pro - 性能检测工具
//
// 功能: 检测设备性能能力，为低端设备提供回退方案
// ============================================

import { useState, useEffect, useCallback } from 'react';

export interface DeviceCapabilities {
  /** 是否支持 backdrop-filter */
  hasBackdropFilter: boolean;
  /** 是否为低端设备 */
  isLowEndDevice: boolean;
  /** 设备内存 (GB)，如果不可用则为 null */
  deviceMemory: number | null;
  /** 硬件并发数，如果不可用则为 null */
  hardwareConcurrency: number | null;
  /** 是否支持 reduced motion */
  prefersReducedMotion: boolean;
  /** 是否为移动设备 */
  isMobile: boolean;
  /** 是否为低性能模式 */
  isLowPerformance: boolean;
  /** 性能等级: 'high' | 'medium' | 'low' */
  performanceTier: 'high' | 'medium' | 'low';
}

/**
 * 检测是否支持 backdrop-filter
 */
function checkBackdropFilterSupport(): boolean {
  // 检查 CSS 支持
  if (typeof CSS !== 'undefined' && CSS.supports) {
    return CSS.supports('backdrop-filter', 'blur(1px)') ||
           CSS.supports('-webkit-backdrop-filter', 'blur(1px)');
  }
  
  // 回退检测：检查浏览器引擎
  const ua = navigator.userAgent.toLowerCase();
  const isSafari = ua.includes('safari') && !ua.includes('chrome');
  const isChrome = ua.includes('chrome');
  const isEdge = ua.includes('edge');
  const isFirefox = ua.includes('firefox');
  
  // Safari 和 Chrome 支持 backdrop-filter
  if (isSafari || isChrome || isEdge) {
    return true;
  }
  
  // Firefox 从版本 103 开始支持
  if (isFirefox) {
    const match = ua.match(/firefox\/(\d+)/);
    if (match && parseInt(match[1], 10) >= 103) {
      return true;
    }
  }
  
  return false;
}

/**
 * 检测是否为移动设备
 */
function checkIsMobile(): boolean {
  if (typeof window === 'undefined') return false;
  
  // 使用 User Agent 检测
  const ua = navigator.userAgent.toLowerCase();
  const isMobileUA = /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
  
  // 使用屏幕尺寸检测
  const isSmallScreen = window.innerWidth <= 768;
  
  // 使用触摸检测
  const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  return isMobileUA || (isSmallScreen && hasTouchScreen);
}

/**
 * 检测是否偏好减少动画
 */
function checkPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * 获取设备内存
 */
function getDeviceMemory(): number | null {
  // @ts-expect-error - deviceMemory 是实验性 API
  if (navigator.deviceMemory) {
    // @ts-expect-error - deviceMemory 是实验性 API，TypeScript 类型定义中不存在
    return navigator.deviceMemory;
  }
  return null;
}

/**
 * 获取硬件并发数
 */
function getHardwareConcurrency(): number | null {
  if (navigator.hardwareConcurrency) {
    return navigator.hardwareConcurrency;
  }
  return null;
}

/**
 * 检测设备性能等级
 */
function detectPerformanceTier(
  memory: number | null,
  concurrency: number | null,
  isMobile: boolean
): 'high' | 'medium' | 'low' {
  // 低端设备判定条件
  const isLowMemory = memory !== null && memory < 4;
  const isLowConcurrency = concurrency !== null && concurrency < 4;
  
  // 如果内存小于 2GB 或 CPU 核心数小于 2，判定为低端设备
  if ((memory !== null && memory < 2) || (concurrency !== null && concurrency < 2)) {
    return 'low';
  }
  
  // 如果内存小于 4GB 或 CPU 核心数小于 4，判定为中等设备
  if (isLowMemory || isLowConcurrency) {
    return 'medium';
  }
  
  // 移动设备默认降一级
  if (isMobile) {
    return memory !== null && memory >= 6 ? 'medium' : 'low';
  }
  
  return 'high';
}

/**
 * 检测设备能力
 */
export function detectDeviceCapabilities(): DeviceCapabilities {
  const hasBackdropFilter = checkBackdropFilterSupport();
  const isMobile = checkIsMobile();
  const prefersReducedMotion = checkPrefersReducedMotion();
  const deviceMemory = getDeviceMemory();
  const hardwareConcurrency = getHardwareConcurrency();
  const performanceTier = detectPerformanceTier(deviceMemory, hardwareConcurrency, isMobile);
  
  // 低端设备判定
  const isLowEndDevice = performanceTier === 'low' || !hasBackdropFilter;
  
  // 低性能模式：低端设备或偏好减少动画
  const isLowPerformance = isLowEndDevice || prefersReducedMotion;
  
  return {
    hasBackdropFilter,
    isLowEndDevice,
    deviceMemory,
    hardwareConcurrency,
    prefersReducedMotion,
    isMobile,
    isLowPerformance,
    performanceTier,
  };
}

/**
 * React Hook: 使用设备能力检测
 */
export function useDeviceCapabilities(): DeviceCapabilities {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>(() => {
    // 服务端渲染时返回默认值
    if (typeof window === 'undefined') {
      return {
        hasBackdropFilter: true,
        isLowEndDevice: false,
        deviceMemory: null,
        hardwareConcurrency: null,
        prefersReducedMotion: false,
        isMobile: false,
        isLowPerformance: false,
        performanceTier: 'high',
      };
    }
    return detectDeviceCapabilities();
  });
  
  useEffect(() => {
    // 监听 reduced motion 偏好变化
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = () => {
      setCapabilities(detectDeviceCapabilities());
    };
    
    // 添加监听器
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // 兼容旧版浏览器
      mediaQuery.addListener(handleChange);
    }
    
    // 监听窗口大小变化（可能影响移动设备判定）
    const handleResize = () => {
      setCapabilities(detectDeviceCapabilities());
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return capabilities;
}

/**
 * 应用性能类到根元素
 */
export function applyPerformanceClass(capabilities: DeviceCapabilities): void {
  const root = document.documentElement;
  
  if (capabilities.isLowPerformance) {
    root.classList.add('low-performance');
  } else {
    root.classList.remove('low-performance');
  }
  
  if (capabilities.performanceTier === 'low') {
    root.classList.add('performance-low');
    root.classList.remove('performance-medium', 'performance-high');
  } else if (capabilities.performanceTier === 'medium') {
    root.classList.add('performance-medium');
    root.classList.remove('performance-low', 'performance-high');
  } else {
    root.classList.add('performance-high');
    root.classList.remove('performance-low', 'performance-medium');
  }
  
  if (capabilities.isMobile) {
    root.classList.add('is-mobile');
  } else {
    root.classList.remove('is-mobile');
  }
}

/**
 * 获取玻璃效果的回退样式
 */
export function getGlassFallbackStyles(capabilities: DeviceCapabilities): React.CSSProperties {
  if (!capabilities.isLowPerformance && capabilities.hasBackdropFilter) {
    // 高性能设备，使用默认玻璃效果
    return {};
  }
  
  // 低端设备回退样式
  return {
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
    background: 'rgba(255, 255, 255, 0.95)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  };
}

/**
 * 获取深色模式玻璃效果的回退样式
 */
export function getGlassDarkFallbackStyles(capabilities: DeviceCapabilities): React.CSSProperties {
  if (!capabilities.isLowPerformance && capabilities.hasBackdropFilter) {
    return {};
  }
  
  return {
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
    background: 'rgba(30, 30, 35, 0.95)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  };
}

/**
 * Hook: 获取玻璃效果样式
 */
export function useGlassStyles(isDark: boolean = false): {
  capabilities: DeviceCapabilities;
  glassStyle: React.CSSProperties;
  shouldUseFallback: boolean;
} {
  const capabilities = useDeviceCapabilities();
  
  const glassStyle = useCallback(() => {
    return isDark 
      ? getGlassDarkFallbackStyles(capabilities)
      : getGlassFallbackStyles(capabilities);
  }, [capabilities, isDark])();
  
  return {
    capabilities,
    glassStyle,
    shouldUseFallback: capabilities.isLowPerformance || !capabilities.hasBackdropFilter,
  };
}
