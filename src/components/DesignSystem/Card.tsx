import React from 'react';

interface CardProps {
  variant?: 'default' | 'gradient' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  hover = true,
  children,
  className = '',
  onClick,
  style,
}) => {
  const baseClasses = 'rounded-2xl border border-neutral-100 transition-all duration-300';
  
  const variantClasses = {
    default: 'bg-white shadow-card',
    gradient: 'bg-gradient-to-br from-white to-neutral-50 shadow-card',
    outlined: 'bg-white border-neutral-200 shadow-soft',
    elevated: 'bg-white shadow-elevated border-transparent',
  };
  
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
    xl: 'p-8',
  };
  
  const hoverClasses = hover
    ? 'hover:-translate-y-1 hover:shadow-elevated hover:border-primary-100 active:translate-y-0 cursor-pointer'
    : '';

  return (
    <div
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        ${hoverClasses}
        ${className}
      `}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
};
