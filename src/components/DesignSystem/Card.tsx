import React, { useRef, useState, useCallback } from 'react';

interface CardProps {
  variant?: 'default' | 'gradient' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  enable3D?: boolean;
  enableShine?: boolean;
  enableGlow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  hover = true,
  children,
  className = '',
  style,
  onClick,
  enable3D = false,
  enableShine = false,
  enableGlow = false,
}) => {
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
    
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
    });
  }, [enable3D]);

  const handleMouseEnter = useCallback(() => {
    if (enable3D) {
      setIsHovering(true);
    }
  }, [enable3D]);

  const handleMouseLeave = useCallback(() => {
    if (enable3D) {
      setIsHovering(false);
      setTiltStyle({
        transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      });
    }
  }, [enable3D]);

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

  const effectClasses = [
    enableShine ? 'shine-effect' : '',
    enableGlow ? 'border-glow' : '',
  ].filter(Boolean).join(' ');

  const combinedStyle: React.CSSProperties = {
    ...style,
    ...tiltStyle,
    transition: isHovering 
      ? 'transform 0.1s ease-out' 
      : 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease',
    willChange: isHovering ? 'transform' : 'auto',
  };

  return (
    <div
      ref={cardRef}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        ${hoverClasses}
        ${effectClasses}
        ${className}
      `}
      style={combinedStyle}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
};

interface SkeletonCardProps {
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ className = '' }) => (
  <div className={`rounded-2xl p-5 skeleton-card ${className}`}>
    <div className="animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-full skeleton" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded skeleton-text" />
          <div className="h-3 w-1/2 rounded skeleton-text" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-3 w-full rounded skeleton-text" />
        <div className="h-3 w-5/6 rounded skeleton-text" />
        <div className="h-3 w-4/6 rounded skeleton-text" />
      </div>
    </div>
  </div>
);

interface SkeletonQuickActionProps {
  count?: number;
}

export const SkeletonQuickActions: React.FC<SkeletonQuickActionProps> = ({ count = 6 }) => (
  <div className="grid grid-cols-3 gap-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-2xl p-3 text-center skeleton-card">
        <div className="animate-pulse">
          <div className="w-12 h-12 mx-auto rounded-2xl skeleton mb-3" />
          <div className="h-4 w-16 mx-auto rounded skeleton-text mb-1" />
          <div className="h-3 w-12 mx-auto rounded skeleton-text" />
        </div>
      </div>
    ))}
  </div>
);