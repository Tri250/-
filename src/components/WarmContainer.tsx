/**
 * WarmContainer - 温色系页面容器
 *
 * 模拟参考图的米色/奶油色背景，温暖科技风
 */

import React from 'react';

interface WarmContainerProps {
  children: React.ReactNode;
  className?: string;
  showPetHero?: boolean;
}

export const WarmContainer: React.FC<WarmContainerProps> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`min-h-screen pb-24 ${className}`}
      style={{
        background:
          'linear-gradient(180deg, #faf5ee 0%, #fdf6ec 35%, #ffffff 100%)',
      }}
    >
      {children}
    </div>
  );
};

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  transparent?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  rightAction,
  transparent = false,
}) => {
  return (
    <div
      className={`px-4 pt-4 pb-3 flex items-start justify-between ${
        transparent ? '' : 'bg-transparent'
      }`}
    >
      <div>
        {title && (
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
      {rightAction && <div className="flex-shrink-0">{rightAction}</div>}
    </div>
  );
};

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const WarmCard: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  padding = 'md',
}) => {
  const padMap = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl ${padMap[padding]} ${
        onClick ? 'cursor-pointer active:scale-[0.99] transition-transform' : ''
      } ${className}`}
      style={{
        background: 'rgba(255, 251, 244, 0.85)',
        boxShadow: '0 1px 3px rgba(120, 80, 30, 0.04), 0 4px 12px rgba(120, 80, 30, 0.03)',
        border: '1px solid rgba(255, 220, 180, 0.35)',
      }}
    >
      {children}
    </div>
  );
};

interface SectionTitleProps {
  title: string;
  rightAction?: React.ReactNode;
  className?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  rightAction,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between mb-3 px-1 ${className}`}>
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
      {rightAction}
    </div>
  );
};

export default WarmContainer;
