// ============================================
// PawSync Pro - Button.tsx
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 通用按钮组件
// ============================================

import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
}

const variantClasses = {
  primary: 'bg-gradient-to-br from-orange-400 to-peach-500 text-white hover:from-orange-500 hover:to-peach-600 shadow-lg hover:shadow-xl',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
};

const sizeClasses = {
  small: 'px-3 py-1.5 text-sm',
  medium: 'px-4 py-2 text-base',
  large: 'px-6 py-3 text-lg',
};

export function Button({
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  icon,
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  fullWidth = false,
}: ButtonProps) {
  const baseClasses = variantClasses[variant];
  const sizeClass = sizeClasses[size];
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseClasses}
        ${sizeClass}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
        rounded-full
        font-medium
        flex
        items-center
        justify-center
        gap-2
        transition-all
        duration-300
        ${className}
      `}
    >
      {loading ? (
        <span className="animate-spin">{icon || '⏳'}</span>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
