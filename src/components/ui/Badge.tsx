import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  color?: 'orange' | 'green' | 'blue' | 'red' | 'gray' | 'yellow' | 'purple' | 'pink' | 'teal';
  size?: 'small' | 'medium';
  className?: string;
  icon?: React.ReactNode;
}

const colorClasses = {
  orange: 'bg-orange-50 text-orange-600',
  green: 'bg-green-50 text-green-600',
  blue: 'bg-blue-50 text-blue-600',
  red: 'bg-red-50 text-red-600',
  gray: 'bg-gray-50 text-gray-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  purple: 'bg-purple-50 text-purple-600',
  pink: 'bg-pink-50 text-pink-600',
  teal: 'bg-teal-50 text-teal-600',
};

const sizeClasses = {
  small: 'px-2 py-0.5 text-xs',
  medium: 'px-3 py-1 text-sm',
};

export function Badge({
  children,
  color = 'orange',
  size = 'small',
  className = '',
  icon,
}: BadgeProps) {
  const baseColor = colorClasses[color];
  const baseSize = sizeClasses[size];
  
  return (
    <span
      className={`
        ${baseColor}
        ${baseSize}
        inline-flex
        items-center
        gap-1
        rounded-full
        font-medium
        ${className}
      `}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
