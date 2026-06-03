import React from 'react';
import { cn } from '../../lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
  borderRadius?: number;
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

// Loading spinner component
export const GlassSpinner: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <div
    className="animate-spin rounded-full border-2 border-white/30 border-t-white"
    style={{ width: size, height: size }}
  />
);
