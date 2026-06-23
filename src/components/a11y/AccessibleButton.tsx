// ============================================
// PawSync Pro - AccessibleButton.tsx
//
// 作者: 带娃的小陈工
// 日期: 2026-06-23
// 描述: 无障碍按钮组件
// ============================================

import React, { forwardRef, useCallback } from 'react';
import { cn } from '../../lib/utils';
import { useAccessibility } from '../../utils/accessibility';
import { Loader2 } from 'lucide-react';

// ============================================================
// 类型定义
// ============================================================

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface AccessibleButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaExpanded?: boolean;
  ariaPressed?: boolean;
  ariaHaspopup?: boolean | 'dialog' | 'menu' | 'listbox' | 'tree' | 'grid';
  ariaControls?: string;
  role?: string;
  tabIndex?: number;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

// ============================================================
// 样式配置
// ============================================================

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-br from-orange-400 to-peach-500 text-white hover:from-orange-500 hover:to-peach-600 shadow-lg hover:shadow-xl focus-visible:ring-orange-400',
  secondary:
    'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 focus-visible:ring-gray-400',
  ghost:
    'bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 focus-visible:ring-gray-400',
  danger:
    'bg-danger-500 text-white hover:bg-danger-600 shadow-lg hover:shadow-xl focus-visible:ring-danger-400',
  success:
    'bg-success-500 text-white hover:bg-success-600 shadow-lg hover:shadow-xl focus-visible:ring-success-400',
};

const sizeClasses: Record<ButtonSize, string> = {
  small: 'px-3 py-1.5 text-sm min-h-[32px]',
  medium: 'px-4 py-2 text-base min-h-[44px]',
  large: 'px-6 py-3 text-lg min-h-[52px]',
};

// ============================================================
// AccessibleButton 组件
// ============================================================

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  function AccessibleButton(
    {
      children,
      variant = 'primary',
      size = 'medium',
      loading = false,
      disabled = false,
      fullWidth = false,
      className = '',
      onClick,
      onKeyDown,
      type = 'button',
      ariaLabel,
      ariaDescribedBy,
      ariaExpanded,
      ariaPressed,
      ariaHaspopup,
      ariaControls,
      role,
      tabIndex,
      icon,
      iconPosition = 'left',
    },
    ref
  ) {
    const { prefersReducedMotion, announceForAccessibility } = useAccessibility();

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        if (disabled || loading) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      },
      [disabled, loading, onClick]
    );

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (disabled || loading) {
          if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
            event.preventDefault();
          }
          return;
        }

        if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
          event.preventDefault();
          const button = event.currentTarget;
          button.click();

          if (ariaLabel) {
            announceForAccessibility(ariaLabel, 'polite');
          }
        }

        onKeyDown?.(event);
      },
      [disabled, loading, ariaLabel, announceForAccessibility, onKeyDown]
    );

    const baseVariantClass = variantClasses[variant];
    const sizeClass = sizeClasses[size];

    return (
      <button
        ref={ref}
        type={type}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={disabled || loading}
        role={role || 'button'}
        tabIndex={tabIndex ?? (disabled ? -1 : 0)}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-expanded={ariaExpanded}
        aria-pressed={ariaPressed}
        aria-haspopup={ariaHaspopup}
        aria-controls={ariaControls}
        aria-busy={loading || undefined}
        aria-disabled={disabled || undefined}
        className={cn(
          baseVariantClass,
          sizeClass,
          fullWidth ? 'w-full' : '',
          disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          'rounded-full',
          'font-medium',
          'flex items-center justify-center gap-2',
          'transition-all',
          prefersReducedMotion ? 'duration-0' : 'duration-300',
          'focus:outline-none',
          'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900',
          'active:scale-[0.98]',
          'min-w-[44px]',
          className
        )}
      >
        {loading ? (
          <>
            <Loader2
              className={cn(
                'animate-spin',
                size === 'small' ? 'w-4 h-4' : size === 'large' ? 'w-6 h-6' : 'w-5 h-5'
              )}
              aria-hidden="true"
            />
            <span className="sr-only">加载中</span>
            {children && <span aria-hidden="true">{children}</span>}
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <span className="flex-shrink-0" aria-hidden="true">
                {icon}
              </span>
            )}
            {children}
            {icon && iconPosition === 'right' && (
              <span className="flex-shrink-0" aria-hidden="true">
                {icon}
              </span>
            )}
          </>
        )}
      </button>
    );
  }
);

export default AccessibleButton;
