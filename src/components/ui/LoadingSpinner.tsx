import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
  text?: string;
}

const sizeClasses = {
  small: 'w-4 h-4',
  medium: 'w-8 h-8',
  large: 'w-12 h-12',
};

export function LoadingSpinner({
  size = 'medium',
  color = 'text-orange-500',
  className: _className = '',
  text,
}: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeClasses[size]} ${color} animate-spin ${_className}`}>
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="31.416"
            strokeDashoffset="10"
            opacity="0.3"
          />
          <path
            d="M12 2a10 10 0 0 1 10 10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {text && (
        <p className="text-sm text-gray-500 font-medium">{text}</p>
      )}
    </div>
  );
}
