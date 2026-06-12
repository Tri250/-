// ============================================
// PawSync Pro - Toast Component
// 
// 顶部滑入通知 + Lottie庆祝动画
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  XCircle, 
  X,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils';

// ═══════════════════════════════════════════
// 🎯 Toast 类型定义
// ═══════════════════════════════════════════

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'celebration';

export interface ToastProps {
  /** Toast ID */
  id: string;
  
  /** 类型 */
  type: ToastType;
  
  /** 标题 */
  title: string;
  
  /** 描述 */
  description?: string;
  
  /** 显示时长 (ms) */
  duration?: number;
  
  /** 是否可关闭 */
  closable?: boolean;
  
  /** 关闭回调 */
  onClose?: (id: string) => void;
  
  /** 点击回调 */
  onClick?: () => void;
}

export interface ToastContainerProps {
  /** Toast列表 */
  toasts: ToastProps[];
  
  /** 关闭回调 */
  onClose?: (id: string) => void;
  
  /** 位置 */
  position?: 'top' | 'bottom';
}

// ═══════════════════════════════════════════
// 🎨 类型配置
// ═══════════════════════════════════════════

const typeConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-sage-100 dark:bg-sage-900/30',
    borderColor: 'border-sage-400',
    iconColor: 'text-sage-500',
    titleColor: 'text-sage-700 dark:text-sage-300',
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-blush-100 dark:bg-blush-900/30',
    borderColor: 'border-blush-400',
    iconColor: 'text-blush-500',
    titleColor: 'text-blush-700 dark:text-blush-300',
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-warm-100 dark:bg-warm-900/30',
    borderColor: 'border-warm-400',
    iconColor: 'text-warm-500',
    titleColor: 'text-warm-700 dark:text-warm-300',
  },
  info: {
    icon: Info,
    bgColor: 'bg-lavender-100 dark:bg-lavender-900/30',
    borderColor: 'border-lavender-400',
    iconColor: 'text-lavender-500',
    titleColor: 'text-lavender-700 dark:text-lavender-300',
  },
  celebration: {
    icon: Sparkles,
    bgColor: 'bg-primary-100 dark:bg-primary-900/30',
    borderColor: 'border-primary-400',
    iconColor: 'text-primary-500',
    titleColor: 'text-primary-700 dark:text-primary-300',
  },
};

// ═══════════════════════════════════════════
// 🎬 动画变体
// ═══════════════════════════════════════════

const toastVariants = {
  initial: {
    opacity: 0,
    y: -20,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 280,
      damping: 24,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
  },
};

// ═══════════════════════════════════════════
// 🎯 Toast 组件
// ═══════════════════════════════════════════

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  description,
  duration = 3000,
  closable = true,
  onClose,
  onClick,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const config = typeConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, id, onClose]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    onClose?.(id);
  }, [id, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn(
            'relative flex items-start gap-3 p-4',
            'rounded-xl border',
            'shadow-liquid3',
            'backdrop-blur-sm',
            config.bgColor,
            config.borderColor,
            onClick && 'cursor-pointer',
          )}
          variants={toastVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          onClick={onClick}
          layout
        >
          {/* 图标 */}
          <motion.div
            className={cn('flex-shrink-0', config.iconColor)}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
          >
            <Icon className="w-5 h-5" strokeWidth={2} />
          </motion.div>
          
          {/* 内容 */}
          <div className="flex-1 min-w-0">
            <motion.p
              className={cn('font-semibold text-sm', config.titleColor)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              {title}
            </motion.p>
            {description && (
              <motion.p
                className="text-xs text-cocoa-600 dark:text-cocoa-400 mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {description}
              </motion.p>
            )}
          </div>
          
          {/* 关闭按钮 */}
          {closable && (
            <motion.button
              className="flex-shrink-0 p-1 rounded-lg hover:bg-white/50 dark:hover:bg-dark-surface/50 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-4 h-4 text-cocoa-500" />
            </motion.button>
          )}
          
          {/* 进度条 */}
          {duration > 0 && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-1 bg-current opacity-20 rounded-b-xl"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: duration / 1000, ease: 'linear' }}
              style={{ originX: 0 }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ═══════════════════════════════════════════
// 🎯 ToastContainer 组件
// ═══════════════════════════════════════════

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onClose,
  position = 'top',
}) => {
  return (
    <div
      className={cn(
        'fixed left-0 right-0 z-toast',
        'px-4 pointer-events-none',
        position === 'top' ? 'top-safe' : 'bottom-safe',
      )}
      style={{
        top: position === 'top' ? 'env(safe-area-inset-top, 16px)' : undefined,
        bottom: position === 'bottom' ? 'env(safe-area-inset-bottom, 16px)' : undefined,
      }}
    >
      <div className="max-w-md mx-auto space-y-2 pointer-events-auto">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <Toast key={toast.id} {...toast} onClose={onClose} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════
// 🎯 useToast Hook
// ═══════════════════════════════════════════

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = useCallback(
    (toast: Omit<ToastProps, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setToasts((prev) => [...prev, { ...toast, id }]);
      return id;
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  // 快捷方法
  const success = useCallback(
    (title: string, description?: string) =>
      addToast({ type: 'success', title, description }),
    [addToast]
  );

  const error = useCallback(
    (title: string, description?: string) =>
      addToast({ type: 'error', title, description }),
    [addToast]
  );

  const warning = useCallback(
    (title: string, description?: string) =>
      addToast({ type: 'warning', title, description }),
    [addToast]
  );

  const info = useCallback(
    (title: string, description?: string) =>
      addToast({ type: 'info', title, description }),
    [addToast]
  );

  const celebrate = useCallback(
    (title: string, description?: string) =>
      addToast({ type: 'celebration', title, description, duration: 4000 }),
    [addToast]
  );

  return {
    toasts,
    addToast,
    removeToast,
    clearAll,
    success,
    error,
    warning,
    info,
    celebrate,
    ToastContainer: () => <ToastContainer toasts={toasts} onClose={removeToast} />,
  };
};

export default Toast;