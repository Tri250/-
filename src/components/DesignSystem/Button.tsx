import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  children,
  className = '',
  onClick,
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 focus:outline-none';
  
  const variantClasses = {
    primary: 'bg-gradient-primary text-white hover:shadow-glow-primary hover:-translate-y-0.5 active:translate-y-0 active:scale-97',
    secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-97',
    outline: 'border-2 border-primary-500 text-primary-500 hover:bg-primary-50 active:scale-97',
    ghost: 'text-neutral-700 hover:bg-neutral-100 active:scale-97',
    gradient: 'bg-gradient-primary text-white hover:shadow-glow-primary hover:-translate-y-0.5 active:translate-y-0 active:scale-97',
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm gap-1.5',
    md: 'px-6 py-3 text-base gap-2',
    lg: 'px-8 py-4 text-lg gap-2.5',
    xl: 'px-10 py-5 text-xl gap-3',
  };
  
  const widthClasses = fullWidth ? 'w-full' : '';
  const disabledClasses = disabled || loading
    ? 'opacity-50 cursor-not-allowed hover:translate-y-0 hover:shadow-none active:scale-100'
    : '';

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${widthClasses}
        ${disabledClasses}
        ${className}
      `}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && <Loader2 className="w-5 h-5 animate-spin" />}
      {!loading && icon}
      {children}
    </button>
  );
};
