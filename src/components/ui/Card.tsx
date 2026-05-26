import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'gradient';
  padding?: 'none' | 'small' | 'medium' | 'large';
  className?: string;
  onClick?: () => void;
}

const paddingClasses = {
  none: '',
  small: 'p-3',
  medium: 'p-5',
  large: 'p-6',
};

const variantClasses = {
  default: 'bg-white rounded-2xl shadow-sm border border-gray-100',
  elevated: 'bg-white rounded-2xl shadow-lg border border-gray-100',
  gradient: 'bg-gradient-to-br from-orange-50 via-white to-peach-50 rounded-2xl shadow-sm border border-orange-100',
};

export function Card({
  children,
  variant = 'default',
  padding = 'medium',
  className = '',
  onClick,
}: CardProps) {
  const baseClasses = variantClasses[variant];
  const paddingClass = paddingClasses[padding];
  
  return (
    <div
      className={`${baseClasses} ${paddingClass} ${className} ${
        onClick ? 'cursor-pointer hover:shadow-md transition-all duration-300' : ''
      }`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {children}
    </div>
  );
}
