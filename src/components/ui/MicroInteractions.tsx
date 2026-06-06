// ============================================
// Micro Interactions - 微交互组件集合
// P0-2: 微交互反馈优化
// ============================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, AlertCircle, Info } from 'lucide-react';

// ============================================
// 按压反馈按钮
// ============================================
interface PressableButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  scale?: number;
  feedback?: 'scale' | 'ripple' | 'both';
  className?: string;
}

export const PressableButton: React.FC<PressableButtonProps> = ({
  children,
  scale = 0.96,
  feedback = 'scale',
  className = '',
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsPressed(true);
    if (feedback === 'ripple' || feedback === 'both') {
      const rect = e.currentTarget.getBoundingClientRect();
      setRipple({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPressed(false);
    setTimeout(() => setRipple(null), 600);
  };

  return (
    <button
      className={`relative overflow-hidden transition-transform duration-150 ${className}`}
      style={{
        transform: isPressed && (feedback === 'scale' || feedback === 'both') ? `scale(${scale})` : 'scale(1)',
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => {
        setIsPressed(false);
        setTimeout(() => setRipple(null), 600);
      }}
      {...props}
    >
      {children}
      {ripple && (
        <span
          className="absolute bg-white/30 rounded-full pointer-events-none animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}
    </button>
  );
};

// ============================================
// 页面切换动画包装器
// ============================================
interface PageTransitionProps {
  children: React.ReactNode;
  pageKey: string;
  direction?: 'left' | 'right' | 'up' | 'down';
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  pageKey,
  direction = 'right',
}) => {
  const variants = {
    initial: {
      opacity: 0,
      x: direction === 'left' ? -50 : direction === 'right' ? 50 : 0,
      y: direction === 'up' ? -50 : direction === 'down' ? 50 : 0,
    },
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
    },
    exit: {
      opacity: 0,
      x: direction === 'left' ? 50 : direction === 'right' ? -50 : 0,
      y: direction === 'up' ? 50 : direction === 'down' ? -50 : 0,
    },
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pageKey}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================
// 共享元素过渡
// ============================================
interface SharedElementProps {
  children: React.ReactNode;
  id: string;
  className?: string;
}

export const SharedElement: React.FC<SharedElementProps> = ({
  children,
  id,
  className = '',
}) => {
  return (
    <motion.div
      layoutId={id}
      className={className}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30,
      }}
    >
      {children}
    </motion.div>
  );
};

// ============================================
// 骨架屏组件
// ============================================
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}) => {
  const baseClasses = 'bg-neutral-200 dark:bg-neutral-700';
  
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={{ width, height }}
    />
  );
};

// ============================================
// 骨架屏卡片
// ============================================
interface SkeletonCardProps {
  lines?: number;
  hasImage?: boolean;
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  lines = 3,
  hasImage = false,
  className = '',
}) => {
  return (
    <div className={`p-4 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 ${className}`}>
      <div className="flex items-start gap-3">
        {hasImage && (
          <Skeleton variant="circular" width={48} height={48} />
        )}
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" />
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
              key={i}
              variant="text"
              width={i === lines - 1 ? '80%' : '100%'}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================
// 空状态组件
// ============================================
interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <motion.div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {Icon && (
        <motion.div
          className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 flex items-center justify-center mb-4"
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatType: 'loop',
          }}
        >
          <Icon className="w-10 h-10 text-orange-500 dark:text-orange-400" />
        </motion.div>
      )}
      <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs mb-4">
          {description}
        </p>
      )}
      {action && (
        <PressableButton
          onClick={action.onClick}
          className="px-6 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium shadow-lg shadow-orange-500/25"
        >
          {action.label}
        </PressableButton>
      )}
    </motion.div>
  );
};

// ============================================
// Toast 提示组件
// ============================================
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 3000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertCircle,
  };

  const colors = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-amber-500',
  };

  const Icon = icons[type];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl ${colors[type]} text-white shadow-lg`}
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <Icon className="w-5 h-5" />
          <span className="font-medium text-sm">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================
// 加载状态指示器
// ============================================
interface LoadingIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  size = 'md',
  text,
  className = '',
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 className={`${sizes[size]} text-orange-500`} />
      </motion.div>
      {text && (
        <span className="text-sm text-neutral-500 dark:text-neutral-400">{text}</span>
      )}
    </div>
  );
};

// ============================================
// 渐进式内容加载
// ============================================
interface ProgressiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  placeholder?: string;
  aspectRatio?: string;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  placeholder,
  aspectRatio = '1/1',
  className = '',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder || src);

  useEffect(() => {
    if (!placeholder) {
      const img = new Image();
      img.src = src || '';
      img.onload = () => {
        setCurrentSrc(src || '');
        setIsLoaded(true);
      };
    }
  }, [src, placeholder]);

  return (
    <div className="relative overflow-hidden" style={{ aspectRatio }}>
      <img
        src={currentSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-all duration-500 ${isLoaded ? 'blur-0' : 'blur-md'} ${className}`}
        onLoad={() => setIsLoaded(true)}
        {...props}
      />
      {!isLoaded && (
        <div className="absolute inset-0 bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
      )}
    </div>
  );
};

// ============================================
// 触觉反馈 Hook
// ============================================
export const useHapticFeedback = () => {
  const trigger = (type: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30],
        success: [10, 50, 10],
        error: [30, 50, 30],
      };
      navigator.vibrate(patterns[type]);
    }
  };

  return { trigger };
};
