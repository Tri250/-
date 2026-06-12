// ============================================
// PawSync Pro - Animated Pressable Component
// 
// Apple标准按压反馈
// scale 0.96 + 阴影减弱
// ============================================

import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

// ═══════════════════════════════════════════
// 🎯 AnimatedPressable 类型定义
// ═══════════════════════════════════════════

export interface AnimatedPressableProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  /** 按压缩放比例 (默认 0.96) */
  pressScale?: number;
  
  /** 悬停缩放比例 (默认 1.02) */
  hoverScale?: number;
  
  /** 是否启用悬停效果 */
  hoverEnabled?: boolean;
  
  /** 是否启用按压效果 */
  pressEnabled?: boolean;
  
  /** 弹簧配置 */
  springConfig?: {
    stiffness?: number;
    damping?: number;
    mass?: number;
  };
  
  /** 点击回调 */
  onPress?: () => void;
  
  /** 子元素 */
  children?: React.ReactNode;
  
  /** 禁用状态 */
  disabled?: boolean;
  
  /** 是否显示涟漪效果 */
  ripple?: boolean;
}

// ═══════════════════════════════════════════
// 🎬 默认动画变体
// ═══════════════════════════════════════════

const defaultVariants = {
  rest: {
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 350,
      damping: 28,
      mass: 0.7,
    },
  },
  hover: {
    scale: 1.02,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
  press: {
    scale: 0.96,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 20,
    },
  },
};

// ═══════════════════════════════════════════
// 🎯 AnimatedPressable 组件
// ═══════════════════════════════════════════

export const AnimatedPressable = forwardRef<HTMLButtonElement, AnimatedPressableProps>(
  (
    {
      pressScale = 0.96,
      hoverScale = 1.02,
      hoverEnabled = true,
      pressEnabled = true,
      springConfig,
      onPress,
      onClick,
      children,
      disabled = false,
      ripple = false,
      className,
      style,
      ...motionProps
    },
    ref
  ) => {
    // 自定义弹簧配置
    const customVariants = springConfig
      ? {
          rest: {
            scale: 1,
            transition: {
              type: 'spring',
              ...springConfig,
            },
          },
          hover: {
            scale: hoverScale,
            transition: {
              type: 'spring',
              ...springConfig,
            },
          },
          press: {
            scale: pressScale,
            transition: {
              type: 'spring',
              stiffness: springConfig.stiffness ? springConfig.stiffness + 50 : 400,
              damping: springConfig.damping || 20,
            },
          },
        }
      : {
          rest: { scale: 1 },
          hover: { scale: hoverScale },
          press: { scale: pressScale },
        };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      onPress?.();
      onClick?.(e);
    };

    return (
      <motion.button
        ref={ref}
        className={cn(
          'relative overflow-hidden',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        style={style}
        variants={customVariants}
        initial="rest"
        whileHover={hoverEnabled && !disabled ? 'hover' : undefined}
        whileTap={pressEnabled && !disabled ? 'press' : undefined}
        onClick={handleClick}
        disabled={disabled}
        aria-disabled={disabled}
        {...motionProps}
      >
        {children}
        
        {/* 涟漪效果 */}
        {ripple && !disabled && (
          <motion.div
            className="absolute inset-0 bg-white/20 rounded-inherit"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 0, opacity: 0 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </motion.button>
    );
  }
);

AnimatedPressable.displayName = 'AnimatedPressable';

// ═══════════════════════════════════════════
// 🎯 预设变体
// ═══════════════════════════════════════════

/** 轻触按钮 - 微缩放 */
export const LightPressable = forwardRef<HTMLButtonElement, AnimatedPressableProps>(
  (props, ref) => (
    <AnimatedPressable
      ref={ref}
      pressScale={0.98}
      hoverScale={1.01}
      {...props}
    />
  )
);
LightPressable.displayName = 'LightPressable';

/** 强触按钮 - 明显缩放 */
export const StrongPressable = forwardRef<HTMLButtonElement, AnimatedPressableProps>(
  (props, ref) => (
    <AnimatedPressable
      ref={ref}
      pressScale={0.94}
      hoverScale={1.04}
      {...props}
    />
  )
);
StrongPressable.displayName = 'StrongPressable';

/** 弹性按钮 - 弹跳效果 */
export const BouncyPressable = forwardRef<HTMLButtonElement, AnimatedPressableProps>(
  (props, ref) => (
    <AnimatedPressable
      ref={ref}
      pressScale={0.95}
      hoverScale={1.03}
      springConfig={{ stiffness: 400, damping: 15, mass: 0.6 }}
      {...props}
    />
  )
);
BouncyPressable.displayName = 'BouncyPressable';

export default AnimatedPressable;