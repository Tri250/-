import React from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  mode?: 'in' | 'out';
  direction?: 'up' | 'down' | 'left' | 'right';
}

export function PageTransition({
  children,
  mode = 'in',
  direction = 'up',
}: PageTransitionProps) {
  const getAnimationClass = () => {
    if (mode === 'out') {
      return 'animate-fade-out';
    }

    switch (direction) {
      case 'up':
        return 'animate-slide-in-up';
      case 'down':
        return 'animate-slide-in-down';
      case 'left':
        return 'animate-slide-in-left';
      case 'right':
        return 'animate-slide-in-right';
      default:
        return 'animate-fade-in';
    }
  };

  return (
    <div className={`gpu-accelerated ${getAnimationClass()}`}>
      {children}
    </div>
  );
}

interface StaggeredListProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  className?: string;
}

export function StaggeredList({
  children,
  staggerDelay = 100,
  className = '',
}: StaggeredListProps) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <div
          key={index}
          className="animate-fade-in gpu-accelerated"
          style={{ animationDelay: `${index * staggerDelay}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
