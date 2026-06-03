import React from 'react';
import { cn } from '../../lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
  borderRadius?: number;
  variant?: string;
  enable3D?: boolean;
}

const intensityClasses = {
  low: 'bg-white/5',
  medium: 'bg-white/15',
  high: 'bg-white/25',
};

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  intensity = 'medium',
  borderRadius = 16,
}) => {
  return (
    <div
      className={cn(
        'backdrop-blur-sm overflow-hidden',
        intensityClasses[intensity],
        className
      )}
      style={{ borderRadius }}
    >
      <div className="p-4">{children}</div>
    </div>
  );
};

// GlassSurface - A simpler glass effect container
interface GlassSurfaceProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassSurface: React.FC<GlassSurfaceProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        'backdrop-blur-md bg-white/10 rounded-xl border border-white/20',
        className
      )}
    >
      {children}
    </div>
  );
};

// GlassButton - A button with glass effect
interface GlassButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  onClick,
  className,
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-4 py-2 rounded-lg backdrop-blur-sm bg-white/20 border border-white/30',
        'text-white font-medium transition-all',
        'hover:bg-white/30 active:scale-95',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  );
};

// Loading spinner component
export const GlassSpinner: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <div
    className="animate-spin rounded-full border-2 border-white/30 border-t-white"
    style={{ width: size, height: size }}
  />
);
