import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({ value, className = '' }: AnimatedCounterProps) {
  return (
    <span className={`font-bold tabular-nums ${className}`}>
      {value.toLocaleString()}
    </span>
  );
}

interface TrendIndicatorProps {
  value: number;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function TrendIndicator({ value, showIcon = true, size = 'md' }: TrendIndicatorProps) {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };
  
  return (
    <div className={`flex items-center gap-1 ${sizeClasses[size]} ${
      isPositive ? 'text-health-good' : isNeutral ? 'text-surface-500' : 'text-health-danger'
    }`}>
      {showIcon && (
        isPositive ? <TrendingUp className={iconSizes[size]} /> :
        isNeutral ? <Minus className={iconSizes[size]} /> :
        <TrendingDown className={iconSizes[size]} />
      )}
      <span className="font-medium">
        {isPositive ? '+' : ''}{value}%
      </span>
    </div>
  );
}

interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
}

export function ProgressRing({ 
  value, 
  size = 120, 
  strokeWidth = 8, 
  className = '',
  showLabel = true 
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  
  const getColor = (v: number) => {
    if (v >= 80) return 'stroke-health-good';
    if (v >= 60) return 'stroke-brand-500';
    if (v >= 40) return 'stroke-health-warning';
    return 'stroke-health-danger';
  };
  
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-surface-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${getColor(value)} transition-all duration-1000 ease-out`}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-surface-800">{value}%</span>
          <span className="text-xs text-surface-500">健康指数</span>
        </div>
      )}
    </div>
  );
}

interface SkeletonLoaderProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function SkeletonLoader({ 
  variant = 'text', 
  width, 
  height, 
  className = '' 
}: SkeletonLoaderProps) {
  const baseClasses = 'animate-pulse bg-surface-200';
  
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };
  
  const style: React.CSSProperties = {
    width: width || (variant === 'text' ? '100%' : 'auto'),
    height: height || (variant === 'text' ? '1rem' : variant === 'circular' ? '40px' : '100px'),
  };
  
  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}

export function Badge({ 
  children, 
  variant = 'default', 
  size = 'md',
  dot = false,
  pulse = false,
  className = '' 
}: BadgeProps) {
  const variantClasses = {
    default: 'bg-surface-100 text-surface-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
  };
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };
  
  return (
    <span className={`
      inline-flex items-center gap-1.5 font-medium rounded-full
      ${variantClasses[variant]}
      ${sizeClasses[size]}
      ${className}
    `}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full bg-current ${pulse ? 'animate-pulse' : ''}`} />
      )}
      {children}
    </span>
  );
}

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export function GlassCard({ children, className = '', hover = true, glow = false }: GlassCardProps) {
  return (
    <div className={`
      glass-effect rounded-2xl p-6 shadow-soft
      ${hover ? 'transition-all duration-300 hover:shadow-glow hover:-translate-y-0.5' : ''}
      ${glow ? 'shadow-glow' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}

interface GradientButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export function GradientButton({ 
  children, 
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon
}: GradientButtonProps) {
  const variantClasses = {
    primary: 'gradient-brand text-white shadow-glow hover:shadow-glow-lg',
    secondary: 'bg-surface-100 text-surface-700 hover:bg-surface-200',
    outline: 'border-2 border-brand-500 text-brand-500 hover:bg-brand-50',
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-semibold rounded-xl
        transition-all duration-300 ease-out
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
        ${className}
      `}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon}
      {children}
    </button>
  );
}

interface PulseDotProps {
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PulseDot({ color = 'bg-brand-500', size = 'md', className = '' }: PulseDotProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };
  
  return (
    <span className={`relative inline-flex ${sizeClasses[size]} ${className}`}>
      <span className={`absolute inline-flex h-full w-full rounded-full ${color} opacity-75 animate-ping`} />
      <span className={`relative inline-flex rounded-full h-full w-full ${color}`} />
    </span>
  );
}
