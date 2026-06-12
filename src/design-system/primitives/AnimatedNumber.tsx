// ============================================
// PawSync Pro - Animated Number Component
// 
// 数字滚动动画 (count-up)
// requestAnimationFrame 实现
// ============================================

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, useSpring, useTransform, MotionValue } from 'framer-motion';
import { cn } from '../../lib/utils';

// ═══════════════════════════════════════════
// 🎯 AnimatedNumber 类型定义
// ═══════════════════════════════════════════

export interface AnimatedNumberProps {
  /** 目标数值 */
  value: number;
  
  /** 初始数值 */
  initialValue?: number;
  
  /** 动画时长 (ms) */
  duration?: number;
  
  /** 格式化函数 */
  formatValue?: (value: number) => string;
  
  /** 小数位数 */
  decimals?: number;
  
  /** 是否使用千分位分隔符 */
  useGrouping?: boolean;
  
  /** 前缀 */
  prefix?: string;
  
  /** 后缀 */
  suffix?: string;
  
  /** 弹簧动画配置 */
  springConfig?: {
    stiffness?: number;
    damping?: number;
    mass?: number;
  };
  
  /** 是否启用动画 */
  animated?: boolean;
  
  /** 容器类名 */
  className?: string;
  
  /** 数字类名 */
  numberClassName?: string;
  
  /** 前缀/后缀类名 */
  affixClassName?: string;
  
  /** 动画完成回调 */
  onComplete?: () => void;
}

// ═══════════════════════════════════════════
// 🎯 AnimatedNumber 组件
// ═══════════════════════════════════════════

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  initialValue = 0,
  duration = 1200,
  formatValue,
  decimals = 0,
  useGrouping = false,
  prefix = '',
  suffix = '',
  springConfig = { stiffness: 100, damping: 30, mass: 1 },
  animated = true,
  className,
  numberClassName,
  affixClassName,
  onComplete,
}) => {
  const [displayValue, setDisplayValue] = useState(initialValue);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const startValueRef = useRef<number>(initialValue);

  // 格式化数值
  const formatNumber = useCallback(
    (num: number) => {
      if (formatValue) {
        return formatValue(num);
      }
      
      const formatted = decimals > 0
        ? num.toFixed(decimals)
        : Math.round(num).toString();
      
      if (useGrouping) {
        return new Intl.NumberFormat('zh-CN').format(Number(formatted));
      }
      
      return formatted;
    },
    [formatValue, decimals, useGrouping]
  );

  // requestAnimationFrame 动画
  useEffect(() => {
    if (!animated) {
      setDisplayValue(value);
      return;
    }

    startValueRef.current = displayValue;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // easeOutQuart 缓动函数
      const easeProgress = 1 - Math.pow(1 - progress, 4);

      const currentValue = startValueRef.current + (value - startValueRef.current) * easeProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
        onComplete?.();
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration, animated, onComplete]);

  return (
    <motion.span
      className={cn('inline-flex items-baseline tabular-nums', className)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: 'spring',
        ...springConfig,
      }}
    >
      {/* 前缀 */}
      {prefix && (
        <span className={cn('text-sm font-medium', affixClassName)}>
          {prefix}
        </span>
      )}
      
      {/* 数字 */}
      <motion.span
        className={cn(
          'font-bold tracking-tight',
          'text-cocoa-900 dark:text-dark-textPrimary',
          numberClassName
        )}
        key={formatNumber(displayValue)}
        initial={{ opacity: 0.7, y: 2 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
      >
        {formatNumber(displayValue)}
      </motion.span>
      
      {/* 后缀 */}
      {suffix && (
        <span className={cn('text-sm font-medium ml-1', affixClassName)}>
          {suffix}
        </span>
      )}
    </motion.span>
  );
};

// ═══════════════════════════════════════════
// 🎯 预设变体
// ═══════════════════════════════════════════

/** 大数字 - 核心指标 */
export const LargeAnimatedNumber: React.FC<AnimatedNumberProps> = (props) => (
  <AnimatedNumber
    {...props}
    numberClassName={cn('text-3xl', props.numberClassName)}
  />
);

/** 小数字 - 辅助指标 */
export const SmallAnimatedNumber: React.FC<AnimatedNumberProps> = (props) => (
  <AnimatedNumber
    {...props}
    numberClassName={cn('text-lg', props.numberClassName)}
  />
);

/** 百分比数字 */
export const PercentageNumber: React.FC<AnimatedNumberProps> = (props) => (
  <AnimatedNumber
    {...props}
    suffix="%"
    decimals={props.decimals ?? 1}
  />
);

/** 温度数字 */
export const TemperatureNumber: React.FC<AnimatedNumberProps> = (props) => (
  <AnimatedNumber
    {...props}
    suffix="°C"
    decimals={props.decimals ?? 1}
  />
);

/** 体重数字 */
export const WeightNumber: React.FC<AnimatedNumberProps> = (props) => (
  <AnimatedNumber
    {...props}
    suffix="kg"
    decimals={props.decimals ?? 2}
  />
);

export default AnimatedNumber;