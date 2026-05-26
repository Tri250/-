import React from 'react';

type CardAnimationType = 'hover' | 'click' | 'enter';

interface CardAnimationProps {
  children: React.ReactNode;
  type?: CardAnimationType;
  className?: string;
}

export function CardAnimation({
  children,
  type = 'hover',
  className = '',
}: CardAnimationProps) {
  const getAnimationClass = () => {
    switch (type) {
      case 'hover':
        return 'transition-all duration-300 hover:scale-105 hover:shadow-xl hover:-translate-y-1';
      case 'click':
        return 'transition-all duration-200 active:scale-95 active:shadow-md';
      case 'enter':
        return 'animate-fade-in';
      default:
        return '';
    }
  };

  return (
    <div className={`${getAnimationClass()} gpu-accelerated ${className}`}>
      {children}
    </div>
  );
}

interface CardSkeletonProps {
  count?: number;
}

export function CardSkeleton({ count = 1 }: CardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-xl p-4 shadow-sm animate-pulse"
        >
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-5/6" />
        </div>
      ))}
    </>
  );
}

interface AnimatedCardProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function AnimatedCard({
  children,
  delay = 0,
  className = '',
}: AnimatedCardProps) {
  return (
    <div
      className={`animate-fade-in gpu-accelerated ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
