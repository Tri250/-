// ============================================
// PawSync Pro - Liquid Glass Component
// 
// iOS 26 风格液态玻璃效果
// 半透明 + 折射 + 动态光影
// ============================================

import React, { forwardRef, useMemo } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

// ═══════════════════════════════════════════
// 🌊 Liquid Glass 类型定义
// ═══════════════════════════════════════════

export interface LiquidGlassProps extends Omit<HTMLMotionProps<'div'>, 'style'> {
  /** 玻璃强度: light(轻) | medium(中) | heavy(重) */
  intensity?: 'light' | 'medium' | 'heavy';
  
  /** 是否显示顶部高光 */
  highlight?: boolean;
  
  /** 是否显示边框 */
  border?: boolean;
  
  /** 背景色覆盖 */
  backgroundColor?: string;
  
  /** 是否为深色模式 */
  dark?: boolean;
  
  /** 自定义样式 */
  style?: React.CSSProperties;
  
  /** 子元素 */
  children?: React.ReactNode;
  
  /** 是否可交互 (添加hover效果) */
  interactive?: boolean;
  
  /** 圆角大小 */
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
}

// ═══════════════════════════════════════════
// 🎨 玻璃强度配置
// ═══════════════════════════════════════════

const intensityConfig = {
  light: {
    blur: 12,
    backgroundOpacity: 0.70,
    borderOpacity: 0.40,
  },
  medium: {
    blur: 20,
    backgroundOpacity: 0.80,
    borderOpacity: 0.50,
  },
  heavy: {
    blur: 32,
    backgroundOpacity: 0.90,
    borderOpacity: 0.60,
  },
};

const roundedConfig = {
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  xl: 'rounded-3xl',
  '2xl': 'rounded-[28px]',
  '3xl': 'rounded-[32px]',
  full: 'rounded-full',
};

// ═══════════════════════════════════════════
// 🌊 LiquidGlass 组件
// ═══════════════════════════════════════════

export const LiquidGlass = forwardRef<HTMLDivElement, LiquidGlassProps>(
  (
    {
      intensity = 'medium',
      highlight = true,
      border = true,
      backgroundColor,
      dark = false,
      interactive = false,
      rounded = 'xl',
      className,
      style,
      children,
      ...motionProps
    },
    ref
  ) => {
    const config = intensityConfig[intensity];
    
    // 动态生成玻璃样式
    const glassStyle = useMemo(() => {
      const baseColor = dark 
        ? `rgba(38, 36, 32, ${config.backgroundOpacity})`
        : backgroundColor || `rgba(255, 251, 245, ${config.backgroundOpacity})`;
      
      const borderColor = dark
        ? `rgba(58, 54, 50, ${config.borderOpacity})`
        : `rgba(255, 243, 231, ${config.borderOpacity})`;
      
      return {
        backgroundColor: baseColor,
        backdropFilter: `blur(${config.blur}px) saturate(180%)`,
        WebkitBackdropFilter: `blur(${config.blur}px) saturate(180%)`,
        boxShadow: dark
          ? `0 4px 12px rgba(0, 0, 0, 0.30), inset 0 1px 0 rgba(255, 255, 255, 0.10)`
          : `0 4px 12px rgba(122, 90, 56, 0.10), ${highlight ? 'inset 0 1px 0 rgba(255, 255, 255, 0.60)' : ''}`,
        border: border ? `1px solid ${borderColor}` : 'none',
        ...style,
      };
    }, [config, dark, backgroundColor, highlight, border, style]);

    // 交互动画变体
    const variants = interactive
      ? {
          rest: { scale: 1 },
          hover: { scale: 1.02, y: -2 },
          tap: { scale: 0.98 },
        }
      : undefined;

    return (
      <motion.div
        ref={ref}
        className={cn(
          'relative overflow-hidden',
          roundedConfig[rounded],
          interactive && 'cursor-pointer',
          className
        )}
        style={glassStyle}
        variants={variants}
        initial="rest"
        whileHover={interactive ? 'hover' : undefined}
        whileTap={interactive ? 'tap' : undefined}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 25,
        }}
        {...motionProps}
      >
        {/* 顶部高光层 */}
        {highlight && (
          <div
            className="absolute inset-x-0 top-0 h-px pointer-events-none"
            style={{
              background: dark
                ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)'
                : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.80), transparent)',
            }}
          />
        )}
        
        {/* 内容 */}
        {children}
      </motion.div>
    );
  }
);

LiquidGlass.displayName = 'LiquidGlass';

// ═══════════════════════════════════════════
// 🎯 预设变体组件
// ═══════════════════════════════════════════

/** 玻璃卡片 - 标准卡片 */
export const GlassCard = forwardRef<HTMLDivElement, LiquidGlassProps>(
  (props, ref) => (
    <LiquidGlass
      ref={ref}
      intensity="medium"
      rounded="xl"
      interactive
      {...props}
      className={cn('p-4', props.className)}
    />
  )
);
GlassCard.displayName = 'GlassCard';

/** 玻璃按钮 - 按钮样式 */
export const GlassButton = forwardRef<HTMLDivElement, LiquidGlassProps>(
  (props, ref) => (
    <LiquidGlass
      ref={ref}
      intensity="light"
      rounded="lg"
      interactive
      {...props}
      className={cn('px-4 py-2 inline-flex items-center justify-center', props.className)}
    />
  )
);
GlassButton.displayName = 'GlassButton';

/** 玻璃模态 - 模态框背景 */
export const GlassModal = forwardRef<HTMLDivElement, LiquidGlassProps>(
  (props, ref) => (
    <LiquidGlass
      ref={ref}
      intensity="heavy"
      rounded="2xl"
      {...props}
      className={cn('p-6', props.className)}
    />
  )
);
GlassModal.displayName = 'GlassModal';

/** 玻璃工具栏 - 顶部/底部栏 */
export const GlassToolbar = forwardRef<HTMLDivElement, LiquidGlassProps>(
  (props, ref) => (
    <LiquidGlass
      ref={ref}
      intensity="medium"
      rounded="lg"
      {...props}
      className={cn('px-4 py-3', props.className)}
    />
  )
);
GlassToolbar.displayName = 'GlassToolbar';

/** 玻璃标签栏 - 底部Tab栏 */
export const GlassTabBar = forwardRef<HTMLDivElement, LiquidGlassProps>(
  (props, ref) => (
    <LiquidGlass
      ref={ref}
      intensity="medium"
      {...props}
      className={cn(
        'rounded-t-2xl px-2 pb-safe',
        props.className
      )}
      style={{
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        ...props.style,
      }}
    />
  )
);
GlassTabBar.displayName = 'GlassTabBar';

export default LiquidGlass;