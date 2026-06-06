import React from 'react';

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 60,
  strokeWidth = 4,
  color = 'orange',
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(100, Math.max(0, value));
  const offset = circumference - (progress / 100) * circumference;

  // 颜色映射
  const colorMap: Record<string, string> = {
    green: '#22c55e',
    blue: '#3b82f6',
    yellow: '#eab308',
    red: '#ef4444',
    orange: '#f97316',
    purple: '#8b5cf6',
    pink: '#ec4899',
  };

  const strokeColor = colorMap[color] || color;

  return (
    <svg
      width={size}
      height={size}
      className={`transform -rotate-90 ${className}`}
    >
      {/* 背景圆环 */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={strokeWidth}
      />
      {/* 进度圆环 */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{
          transition: 'stroke-dashoffset 0.5s ease-out',
        }}
      />
    </svg>
  );
};

export default CircularProgress;
