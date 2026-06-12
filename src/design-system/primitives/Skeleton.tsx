// ============================================
// PawSync Pro - Skeleton Component
// 
// 骨架屏流光动画
// shimmer 1.5s loop
// ============================================

import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

// ═══════════════════════════════════════════
// 🎯 Skeleton 类型定义
// ═══════════════════════════════════════════

export interface SkeletonProps {
  /** 骨架形状 */
  variant?: 'text' | 'circle' | 'rect' | 'card';
  
  /** 宽度 */
  width?: string | number;
  
  /** 高度 */
  height?: string | number;
  
  /** 圆角 */
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  
  /** 是否显示动画 */
  animated?: boolean;
  
  /** 动画速度 (ms) */
  animationDuration?: number;
  
  /** 类名 */
  className?: string;
  
  /** 子元素 (可选，用于包裹内容) */
  children?: React.ReactNode;
}

// ═══════════════════════════════════════════
// 🎨 配置映射
// ═══════════════════════════════════════════

const variantConfig = {
  text: {
    defaultHeight: '16px',
    defaultWidth: '100%',
    rounded: 'md',
  },
  circle: {
    defaultHeight: '48px',
    defaultWidth: '48px',
    rounded: 'full',
  },
  rect: {
    defaultHeight: '100px',
    defaultWidth: '100%',
    rounded: 'lg',
  },
  card: {
    defaultHeight: '120px',
    defaultWidth: '100%',
    rounded: 'xl',
  },
};

const roundedConfig = {
  sm: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
};

// ═══════════════════════════════════════════
// 🎯 Skeleton 组件
// ═══════════════════════════════════════════

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      variant = 'text',
      width,
      height,
      rounded,
      animated = true,
      animationDuration = 1500,
      className,
      children,
    },
    ref
  ) => {
    const config = variantConfig[variant];
    const actualRounded = rounded || config.rounded;

    const skeletonStyle: React.CSSProperties = {
      width: width || config.defaultWidth,
      height: height || config.defaultHeight,
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          'relative overflow-hidden',
          'bg-cream-200 dark:bg-dark-border',
          roundedConfig[actualRounded],
          className
        )}
        style={skeletonStyle}
      >
        {/* 流光动画 */}
        {animated && (
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
            }}
            animate={{
              backgroundPosition: ['200% 0', '-200% 0'],
            }}
            transition={{
              duration: animationDuration / 1000,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        )}
        
        {/* 子元素 */}
        {children}
      </motion.div>
    );
  }
);

Skeleton.displayName = 'Skeleton';

// ═══════════════════════════════════════════
// 🎯 预设骨架组件
// ═══════════════════════════════════════════

/** 文本骨架 */
export const SkeletonText: React.FC<SkeletonProps> = (props) => (
  <Skeleton variant="text" {...props} />
);

/** 圆形骨架 (头像) */
export const SkeletonCircle: React.FC<SkeletonProps> = (props) => (
  <Skeleton variant="circle" {...props} />
);

/** 卡片骨架 */
export const SkeletonCard: React.FC<SkeletonProps> = (props) => (
  <Skeleton variant="card" {...props} className={cn('p-4', props.className)}>
    <div className="space-y-3">
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="80%" />
    </div>
  </Skeleton>
);

/** 列表项骨架 */
export const SkeletonListItem: React.FC<SkeletonProps> = (props) => (
  <div className={cn('flex items-center gap-3 p-3', props.className)}>
    <Skeleton variant="circle" width="40px" height="40px" />
    <div className="flex-1 space-y-2">
      <Skeleton variant="text" width="40%" height="14px" />
      <Skeleton variant="text" width="70%" height="12px" />
    </div>
  </div>
);

/** 统计卡片骨架 */
export const SkeletonStatCard: React.FC<SkeletonProps> = (props) => (
  <Skeleton
    variant="rect"
    height="80px"
    {...props}
    className={cn('p-4 flex flex-col items-center justify-center', props.className)}
  >
    <Skeleton variant="circle" width="36px" height="36px" />
    <Skeleton variant="text" width="40px" height="24px" className="mt-2" />
    <Skeleton variant="text" width="50px" height="12px" className="mt-1" />
  </Skeleton>
);

/** 骨架屏组 - 完整页面骨架 */
export const SkeletonPage: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-4 p-4">
    {/* 头部 */}
    <div className="flex items-center justify-between">
      <Skeleton variant="circle" width="48px" height="48px" />
      <div className="flex gap-2">
        <Skeleton variant="rect" width="32px" height="32px" rounded="lg" />
        <Skeleton variant="rect" width="32px" height="32px" rounded="lg" />
      </div>
    </div>
    
    {/* 统计卡片 */}
    <div className="grid grid-cols-4 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <SkeletonStatCard key={i} />
      ))}
    </div>
    
    {/* 列表 */}
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <SkeletonListItem key={i} />
      ))}
    </div>
  </div>
);

export default Skeleton;