import React, { memo, useRef, useCallback, useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'subtle' | 'liquid';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  asChild?: boolean;
  enable3D?: boolean;
  enableLiquid?: boolean;
  enableShine?: boolean;
  enableGlow?: boolean;
}

const tiltCache = new Map<string, { x: number; y: number }>();

export const GlassCard = memo(({ 
  children, 
  className, 
  variant = 'default', 
  padding = 'md', 
  onClick, 
  enable3D = false,
  enableLiquid = false,
  enableShine = false,
  enableGlow = false
}: GlassCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const isHoveringRef = useRef(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!enable3D || !cardRef.current) return;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      const card = cardRef.current;
      if (!card) return;
      
      const rect = card.getBoundingClientRect();
      const cacheKey = `${rect.width}-${rect.height}`;
      const cached = tiltCache.get(cacheKey);
      
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = cached?.x ?? rect.width / 2;
      const centerY = cached?.y ?? rect.height / 2;
      
      if (!cached) {
        tiltCache.set(cacheKey, { x: centerX, y: centerY });
      }
      
      const rotateX = (y - centerY) / 12;
      const rotateY = (centerX - x) / 12;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      card.style.willChange = 'transform';
    });
  }, [enable3D]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    if (enable3D) {
      isHoveringRef.current = true;
      if (cardRef.current) {
        cardRef.current.style.transition = 'transform 0.1s ease-out';
      }
    }
  }, [enable3D]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (enable3D && cardRef.current) {
      isHoveringRef.current = false;
      cardRef.current.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      cardRef.current.style.willChange = 'auto';
    }
  }, [enable3D]);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const variantClasses = {
    default: 'shadow-card',
    elevated: 'shadow-elevated',
    subtle: 'shadow-soft',
    liquid: 'shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.5)]'
  };

  return (
    <div 
      ref={cardRef}
      className={cn(
        'glass-card dark:glass-card-dark rounded-2xl transition-all duration-300',
        'hover-lift active-scale',
        enableLiquid && 'liquid-hover liquid-press',
        enableShine && 'glass-shine',
        enableGlow && 'glass-glow',
        paddingClasses[padding],
        variantClasses[variant],
        onClick && 'cursor-pointer',
        className
      )} 
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 液态玻璃光泽层 */}
      {enableShine && isHovered && (
        <div 
          className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
          aria-hidden="true"
        >
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-liquid-shine"
          />
        </div>
      )}
      
      {/* 内容 */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* 液态玻璃边框发光层 */}
      {enableGlow && isHovered && (
        <div 
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(139, 92, 246, 0.1))',
            filter: 'blur(8px)',
            transform: 'scale(1.02)'
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
});

GlassCard.displayName = 'GlassCard';

// 液态玻璃Hero卡片
interface LiquidHeroCardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: 'orange' | 'purple' | 'blue';
}

export const LiquidHeroCard = memo(({ 
  children, 
  className,
  gradient = 'orange'
}: LiquidHeroCardProps) => {
  const gradientClasses = {
    orange: 'from-orange-500/20 via-amber-400/10 to-orange-300/20',
    purple: 'from-purple-500/20 via-violet-400/10 to-purple-300/20',
    blue: 'from-blue-500/20 via-cyan-400/10 to-blue-300/20'
  };

  return (
    <div 
      className={cn(
        'relative overflow-hidden rounded-3xl',
        'bg-gradient-to-br',
        gradientClasses[gradient],
        'backdrop-blur-2xl',
        'border border-white/30',
        'shadow-[0_16px_48px_rgba(0,0,0,0.1),inset_0_2px_0_rgba(255,255,255,0.5)]',
        'animate-liquid-morph',
        className
      )}
    >
      {/* 背景光效 */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 pointer-events-none"
        aria-hidden="true"
      />
      
      {/* 浮动光斑 */}
      <div 
        className="absolute -top-20 -right-20 w-40 h-40 bg-white/20 rounded-full blur-3xl animate-liquid-float"
        aria-hidden="true"
      />
      <div 
        className="absolute -bottom-20 -left-20 w-32 h-32 bg-white/15 rounded-full blur-2xl animate-liquid-float"
        style={{ animationDelay: '1s' }}
        aria-hidden="true"
      />
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
});

LiquidHeroCard.displayName = 'LiquidHeroCard';

// 液态玻璃表面组件
interface GlassSurfaceProps {
  children: React.ReactNode;
  className?: string;
  blur?: 'sm' | 'md' | 'lg';
}

export const GlassSurface = memo(({ 
  children, 
  className,
  blur = 'md'
}: GlassSurfaceProps) => {
  const blurClasses = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg'
  };

  return (
    <div 
      className={cn(
        'glass-surface dark:glass-surface-dark rounded-xl',
        blurClasses[blur],
        className
      )}
    >
      {children}
    </div>
  );
});

GlassSurface.displayName = 'GlassSurface';

// 液态玻璃按钮
interface GlassButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export const GlassButton = memo(({ 
  children, 
  className, 
  variant = 'primary', 
  size = 'md', 
  onClick, 
  disabled = false, 
  loading = false 
}: GlassButtonProps) => {
  const handleClick = useCallback(() => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  }, [disabled, loading, onClick]);

  const variantClasses = {
    primary: 'bg-gradient-to-br from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 shadow-[0_4px_16px_rgba(249,115,22,0.3)]',
    secondary: 'bg-white/80 text-neutral-800 dark:bg-neutral-800/80 dark:text-neutral-100 hover:bg-white dark:hover:bg-neutral-700/80 border border-neutral-200 dark:border-neutral-700',
    ghost: 'bg-white/40 text-neutral-700 dark:text-neutral-200 dark:bg-neutral-800/40 hover:bg-white/60 dark:hover:bg-neutral-700/40',
    danger: 'bg-gradient-to-br from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 shadow-[0_4px_16px_rgba(239,68,68,0.3)]'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  return (
    <button 
      className={cn(
        'glass-button font-medium transition-all duration-300',
        'liquid-press',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className
      )} 
      onClick={handleClick} 
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
});

GlassButton.displayName = 'GlassButton';

// 骨架屏卡片
export const SkeletonCard = memo(({ className }: { className?: string }) => (
  <div className={cn('glass-card p-4 space-y-3', className)}>
    <div className="h-4 w-3/4 skeleton rounded-lg" />
    <div className="h-3 w-full skeleton rounded-lg" />
    <div className="h-3 w-5/6 skeleton rounded-lg" />
    <div className="h-20 w-full skeleton rounded-xl mt-2" />
  </div>
));

SkeletonCard.displayName = 'SkeletonCard';

// 骨架屏快捷操作
export const SkeletonQuickActions = memo(({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-3 gap-2.5">
    {Array.from({ length: count }).map((_, i) => (
      <div 
        key={i} 
        className="glass-card p-3 space-y-2"
        style={{ animationDelay: `${i * 0.05}s` }}
      >
        <div className="w-12 h-12 mx-auto skeleton rounded-2xl" />
        <div className="h-3 w-3/4 mx-auto skeleton rounded-lg" />
      </div>
    ))}
  </div>
));

SkeletonQuickActions.displayName = 'SkeletonQuickActions';
