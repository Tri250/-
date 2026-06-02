import React, { useRef, useState, useCallback } from 'react';
import { cn } from '../../lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'subtle';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  asChild?: boolean;
  enable3D?: boolean;
}

export function GlassCard({ 
  children, 
  className, 
  variant = 'default', 
  padding = 'md', 
  onClick, 
  asChild = false,
  enable3D = false 
}: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!enable3D || !cardRef.current) return;

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 12;
    const rotateY = (centerX - x) / 12;
    
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`,
    });
  }, [enable3D]);

  const handleMouseEnter = useCallback(() => {
    if (enable3D) setIsHovering(true);
  }, [enable3D]);

  const handleMouseLeave = useCallback(() => {
    if (enable3D) {
      setIsHovering(false);
      setTiltStyle({
        transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      });
    }
  }, [enable3D]);

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };
  const variantClasses = {
    default: 'shadow-card',
    elevated: 'shadow-elevated',
    subtle: 'shadow-soft'
  };

  const combinedStyle: React.CSSProperties = {
    ...tiltStyle,
    transition: isHovering 
      ? 'transform 0.1s ease-out' 
      : 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease',
    willChange: isHovering ? 'transform' : 'auto',
  };

  return (
    <div 
      ref={cardRef}
      className={cn(
        'glass-card dark:glass-card-dark rounded-xl transition-all duration-300',
        'hover-lift active-scale ripple-effect',
        paddingClasses[padding],
        variantClasses[variant],
        onClick && 'cursor-pointer',
        className
      )} 
      style={combinedStyle}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}

interface GlassSurfaceProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassSurface({ children, className }: GlassSurfaceProps) {
  return (
    <div className={cn('glass-surface dark:glass-surface-dark rounded-lg', className)}>
      {children}
    </div>
  );
}

interface GlassButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function GlassButton({ 
  children, 
  className, 
  variant = 'primary', 
  size = 'md', 
  onClick, 
  disabled = false, 
  loading = false 
}: GlassButtonProps) {
  const variantClasses = {
    primary: 'bg-gradient-primary text-white hover:opacity-90',
    secondary: 'bg-secondary-500 text-white hover:bg-secondary-600',
    ghost: 'bg-white/60 text-neutral-700 dark:text-neutral-200 dark:bg-neutral-800/60 hover:bg-white/80 dark:hover:bg-neutral-700/60',
    danger: 'bg-danger-500 text-white hover:bg-danger-600'
  };
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  return (
    <button 
      className={cn(
        'glass-button rounded-lg font-medium transition-all duration-200',
        'active-scale ripple-effect disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className
      )} 
      onClick={onClick} 
      disabled={disabled || loading}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          加载中
        </span>
      ) : (
        children
      )}
    </button>
  );
}