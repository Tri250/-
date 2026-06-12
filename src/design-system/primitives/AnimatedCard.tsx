// ============================================
// PawSync Pro - Animated Card Component
// 
// 卡片悬停浮起 + spring回弹
// iOS 26 风格
// ============================================

import React, { forwardRef, useState } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';
import { shadows } from '../tokens/shadows';

// ═══════════════════════════════════════════
// 🎯 AnimatedCard 类型定义
// ═══════════════════════════════════════════

export interface AnimatedCardProps extends Omit<HTMLMotionProps<'div'>, 'style'> {
  /** 是否启用悬停浮起效果 */
  hoverEnabled?: boolean;
  
  /** 悬停浮起距离 (px) */
  hoverElevation?: number;
  
  /** 悬停缩放比例 */
  hoverScale?: number;
  
  /** 是否启用按压效果 */
  pressEnabled?: boolean;
  
  /** 按压缩放比例 */
  pressScale?: number;
  
  /** 卡片阴影级别 */
  shadowLevel?: 'light' | 'medium' | 'heavy' | 'elevated';
  
  /** 圆角大小 */
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  
  /** 内边距 */
  padding?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
  
  /** 是否为深色模式 */
  dark?: boolean;
  
  /** 点击回调 */
  onPress?: () => void;
  
  /** 自定义样式 */
  style?: React.CSSProperties;
  
  /** 子元素 */
  children?: React.ReactNode;
}

// ═══════════════════════════════════════════
// 🎨 配置映射
// ═══════════════════════════════════════════

const shadowConfig = {
  light: shadows.liquid2,
  medium: shadows.liquid3,
  heavy: shadows.liquid4,
  elevated: shadows.liquid5,
};

const hoverShadowConfig = {
  light: shadows.liquid3,
  medium: shadows.liquid4,
  heavy: shadows.liquid5,
  elevated: shadows.composite.floatingCard,
};

const roundedConfig = {
  sm: 'rounded-xl',
  md: 'rounded-2xl',
  lg: 'rounded-[24px]',
  xl: 'rounded-[28px]',
  '2xl': 'rounded-[32px]',
  '3xl': 'rounded-[40px]',
};

const paddingConfig = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
  xl: 'p-6',
};

// ═══════════════════════════════════════════
// 🎬 动画变体
// ═══════════════════════════════════════════

const cardVariants = {
  rest: {
    y: 0,
    scale: 1,
    boxShadow: shadows.liquid3,
    transition: {
      type: 'spring',
      stiffness: 250,
      damping: 22,
      mass: 0.9,
    },
  },
  hover: {
    y: -4,
    scale: 1.02,
    boxShadow: shadows.liquid4,
    transition: {
      type: 'spring',
      stiffness: 280,
      damping: 20,
    },
  },
  press: {
    y: 0,
    scale: 0.98,
    boxShadow: shadows.liquid2,
    transition: {
      type: 'spring',
      stiffness: 350,
      damping: 25,
    },
  },
};

// ═══════════════════════════════════════════
// 🎯 AnimatedCard 组件
// ═══════════════════════════════════════════

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  (
    {
      hoverEnabled = true,
      hoverElevation = 4,
      hoverScale = 1.02,
      pressEnabled = true,
      pressScale = 0.98,
      shadowLevel = 'medium',
      rounded = 'xl',
      padding = 'md',
      dark = false,
      onPress,
      onClick,
      className,
      style,
      children,
      ...motionProps
    },
    ref
  ) => {
    const [isPressed, setIsPressed] = useState(false);

    // 自定义变体
    const customVariants = {
      rest: {
        y: 0,
        scale: 1,
        boxShadow: shadowConfig[shadowLevel],
      },
      hover: {
        y: -hoverElevation,
        scale: hoverScale,
        boxShadow: hoverShadowConfig[shadowLevel],
      },
      press: {
        y: 0,
        scale: pressScale,
        boxShadow: shadowConfig.light,
      },
    };

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      onPress?.();
      onClick?.(e);
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          'relative bg-white dark:bg-dark-card',
          'overflow-hidden',
          roundedConfig[rounded],
          paddingConfig[padding],
          'transition-colors',
          onPress && 'cursor-pointer',
          className
        )}
        style={{
          boxShadow: shadowConfig[shadowLevel],
          ...style,
        }}
        variants={customVariants}
        initial="rest"
        whileHover={hoverEnabled ? 'hover' : undefined}
        whileTap={pressEnabled && onPress ? 'press' : undefined}
        onClick={handleClick}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        transition={{
          type: 'spring',
          stiffness: 280,
          damping: 22,
        }}
        {...motionProps}
      >
        {/* 顶部高光 */}
        <div
          className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{
            background: dark
              ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.60), transparent)',
          }}
        />
        
        {/* 内容 */}
        {children}
      </motion.div>
    );
  }
);

AnimatedCard.displayName = 'AnimatedCard';

// ═══════════════════════════════════════════
// 🎯 预设变体
// ═══════════════════════════════════════════

/** 轻卡片 - 微浮起 */
export const LightCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  (props, ref) => (
    <AnimatedCard
      ref={ref}
      hoverElevation={2}
      hoverScale={1.01}
      shadowLevel="light"
      {...props}
    />
  )
);
LightCard.displayName = 'LightCard';

/** 浮动卡片 - 明显浮起 */
export const FloatingCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  (props, ref) => (
    <AnimatedCard
      ref={ref}
      hoverElevation={6}
      hoverScale={1.03}
      shadowLevel="elevated"
      {...props}
    />
  )
);
FloatingCard.displayName = 'FloatingCard';

/** 静态卡片 - 无交互 */
export const StaticCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  (props, ref) => (
    <AnimatedCard
      ref={ref}
      hoverEnabled={false}
      pressEnabled={false}
      {...props}
    />
  )
);
StaticCard.displayName = 'StaticCard';

export default AnimatedCard;