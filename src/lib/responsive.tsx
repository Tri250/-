/**
 * Responsive Design System - 响应式设计系统
 *
 * 多端分辨率适配，确保无变形
 * 支持：iPhone SE / iPhone 标准 / iPhone Plus / iPad / iPad Pro
 */

import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

// 设备类型
export type DeviceType = 'phone' | 'tablet' | 'desktop';

// 屏幕尺寸
export type ScreenSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// 屏幕方向
export type Orientation = 'portrait' | 'landscape';

// 设备信息
export interface DeviceInfo {
  type: DeviceType;
  size: ScreenSize;
  orientation: Orientation;
  width: number;
  height: number;
  pixelRatio: number;
  isNative: boolean;
  platform: 'web' | 'android' | 'ios';
  safeArea: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

// 断点配置
export const breakpoints = {
  xs: 320,   // iPhone SE
  sm: 375,   // iPhone 标准
  md: 414,   // iPhone Plus
  lg: 768,   // iPad
  xl: 1024,  // iPad Pro 11
  '2xl': 1280, // iPad Pro 12.9
};

// 获取屏幕尺寸
const getScreenSize = (width: number): ScreenSize => {
  if (width < breakpoints.xs) return 'xs';
  if (width < breakpoints.sm) return 'xs';
  if (width < breakpoints.md) return 'sm';
  if (width < breakpoints.lg) return 'md';
  if (width < breakpoints.xl) return 'lg';
  if (width < breakpoints['2xl']) return 'xl';
  return '2xl';
};

// 获取设备类型
const getDeviceType = (width: number): DeviceType => {
  if (width < breakpoints.lg) return 'phone';
  if (width < breakpoints['2xl']) return 'tablet';
  return 'desktop';
};

// 获取屏幕方向
const getOrientation = (width: number, height: number): Orientation => 
  width > height ? 'landscape' : 'portrait';

// 获取安全区域
const getSafeArea = (): { top: number; bottom: number; left: number; right: number } => {
  return {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  };
};

/**
 * 获取设备信息
 */
export const getDeviceInfo = (): DeviceInfo => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const pixelRatio = window.devicePixelRatio || 1;
  
  return {
    type: getDeviceType(width),
    size: getScreenSize(width),
    orientation: getOrientation(width, height),
    width,
    height,
    pixelRatio,
    isNative: Capacitor.isNativePlatform(),
    platform: Capacitor.isNativePlatform() 
      ? Capacitor.getPlatform() as 'android' | 'ios'
      : 'web',
    safeArea: getSafeArea(),
  };
};

/**
 * 响应式 Hook
 */
export const useResponsive = () => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(getDeviceInfo());

  const updateDeviceInfo = useCallback(() => {
    setDeviceInfo(getDeviceInfo());
  }, []);

  useEffect(() => {
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);
    
    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, [updateDeviceInfo]);

  return {
    ...deviceInfo,
    isPhone: deviceInfo.type === 'phone',
    isTablet: deviceInfo.type === 'tablet',
    isDesktop: deviceInfo.type === 'desktop',
    isPortrait: deviceInfo.orientation === 'portrait',
    isLandscape: deviceInfo.orientation === 'landscape',
    isSmall: deviceInfo.size === 'xs' || deviceInfo.size === 'sm',
    isMedium: deviceInfo.size === 'md',
    isLarge: deviceInfo.size === 'lg' || deviceInfo.size === 'xl' || deviceInfo.size === '2xl',
  };
};

/**
 * 响应式值 Hook
 */
export const useResponsiveValue = <T,>(values: Partial<Record<ScreenSize, T>>, defaultValue: T): T => {
  const { size } = useResponsive();
  const sizeOrder: ScreenSize[] = [size, 'md', 'sm', 'xs'];
  
  for (const s of sizeOrder) {
    if (values[s] !== undefined) {
      return values[s]!;
    }
  }
  
  return defaultValue;
};

// 导出响应式样式Hook
export { useResponsiveStyle } from './responsiveStyle';

/**
 * 响应式图片尺寸
 */
export const getResponsiveImageSize = (
  originalWidth: number,
  originalHeight: number,
  containerWidth: number,
  containerHeight?: number
): { width: number; height: number } => {
  // 保持比例，不变形
  const aspectRatio = originalWidth / originalHeight;
  
  if (containerHeight) {
    // 有容器高度限制
    const widthByHeight = containerHeight * aspectRatio;
    
    if (widthByHeight <= containerWidth) {
      return {
        width: widthByHeight,
        height: containerHeight,
      };
    } else {
      return {
        width: containerWidth,
        height: containerWidth / aspectRatio,
      };
    }
  } else {
    // 只有宽度限制
    return {
      width: containerWidth,
      height: containerWidth / aspectRatio,
    };
  }
};

/**
 * 响应式字体缩放
 */
export const getResponsiveFontSize = (baseSize: number, pixelRatio: number): number => {
  // 根据像素密度调整字体大小，确保清晰度
  if (pixelRatio >= 3) {
    // 高分辨率屏幕（如 iPhone Pro）
    return baseSize;
  } else if (pixelRatio >= 2) {
    // 标准视网膜屏幕
    return baseSize;
  } else {
    // 低分辨率屏幕
    return Math.round(baseSize * 1.1);
  }
};

/**
 * CSS 响应式类名生成
 */
export const responsiveClasses = {
  // 容器
  container: (size: ScreenSize) => {
    const maxWidths: Record<ScreenSize, string> = {
      xs: 'max-w-xs',
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
    };
    return maxWidths[size];
  },

  // 网格列数
  gridCols: (size: ScreenSize) => {
    const cols: Record<ScreenSize, string> = {
      xs: 'grid-cols-2',
      sm: 'grid-cols-3',
      md: 'grid-cols-4',
      lg: 'grid-cols-6',
      xl: 'grid-cols-8',
      '2xl': 'grid-cols-10',
    };
    return cols[size];
  },

  // 间距
  gap: (size: ScreenSize) => {
    const gaps: Record<ScreenSize, string> = {
      xs: 'gap-2',
      sm: 'gap-3',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
      '2xl': 'gap-10',
    };
    return gaps[size];
  },

  // 内边距
  padding: (size: ScreenSize) => {
    const paddings: Record<ScreenSize, string> = {
      xs: 'p-3',
      sm: 'p-4',
      md: 'p-5',
      lg: 'p-6',
      xl: 'p-8',
      '2xl': 'p-10',
    };
    return paddings[size];
  },

  // 文字大小
  text: (size: ScreenSize) => {
    const texts: Record<ScreenSize, string> = {
      xs: 'text-sm',
      sm: 'text-base',
      md: 'text-lg',
      lg: 'text-xl',
      xl: 'text-2xl',
      '2xl': 'text-3xl',
    };
    return texts[size];
  },
};

/**
 * 响应式媒体查询 CSS
 */
export const responsiveMediaQueries = {
  xs: '@media screen and (max-width: 319px)',
  sm: '@media screen and (min-width: 320px) and (max-width: 374px)',
  md: '@media screen and (min-width: 375px) and (max-width: 413px)',
  lg: '@media screen and (min-width: 414px) and (max-width: 767px)',
  xl: '@media screen and (min-width: 768px) and (max-width: 1023px)',
  '2xl': '@media screen and (min-width: 1024px)',
};

/**
 * 响应式图片 URL 生成
 */
export const getResponsiveImageUrl = (
  baseUrl: string,
  width: number,
  options?: {
    height?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
  }
): string => {
  // 如果是 Unsplash 图片，使用其 API 调整尺寸
  if (baseUrl.includes('unsplash.com')) {
    const params = new URLSearchParams({
      w: width.toString(),
      fit: 'crop',
      crop: 'faces',
      auto: 'format',
      q: (options?.quality || 80).toString(),
    });
    
    if (options?.height) {
      params.set('h', options.height.toString());
    }
    
    return `${baseUrl}?${params.toString()}`;
  }
  
  // 其他图片源，返回原 URL
  return baseUrl;
};

/**
 * 响应式组件包装器
 */
export const ResponsiveWrapper: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, className = '', style = {} }) => {
  const { size, safeAreaPadding } = useResponsiveStyle();
  
  return (
    <div
      className={`responsive-wrapper ${responsiveClasses.container(size)} ${className}`}
      style={{
        ...safeAreaPadding,
        ...style,
      }}
    >
      {children}
    </div>
  );
};