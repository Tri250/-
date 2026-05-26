import React from 'react';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  showValue?: boolean;
  label?: string;
  className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 128,
  strokeWidth = 12,
  color = 'url(#ringGradient)',
  showValue = true,
  label,
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B00" />
            <stop offset="100%" stopColor="#FFB473" />
          </linearGradient>
        </defs>
        
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-neutral-100"
        />
        
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1500 ease-out"
          style={{ transitionDelay: '200ms' }}
        />
      </svg>
      
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-neutral-800">{Math.round(progress)}</span>
          {label && <span className="text-sm text-neutral-500 mt-1">{label}</span>}
        </div>
      )}
    </div>
  );
};
