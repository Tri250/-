import React, { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';

interface HealingPageLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  headerGradient?: 'warm' | 'cool' | 'neutral';
  showDecorations?: boolean;
}

const gradientConfigs = {
  warm: 'from-amber-400 via-orange-400 to-rose-400',
  cool: 'from-teal-400 via-cyan-400 to-blue-400',
  neutral: 'from-slate-400 via-gray-400 to-zinc-400',
};

export const HealingPageLayout: React.FC<HealingPageLayoutProps> = ({
  children,
  title,
  subtitle,
  onBack,
  headerGradient = 'warm',
  showDecorations = true,
}) => {
  const gradient = gradientConfigs[headerGradient];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-peach-50/30 pb-24">
      {/* 顶部装饰背景 */}
      <header className={`relative overflow-hidden bg-gradient-to-br ${gradient} text-white`}>
        {/* 装饰光斑 */}
        {showDecorations && (
          <>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl animate-healing-float" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/15 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl animate-healing-float-delay-1" />
            <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-white/10 rounded-full blur-xl animate-healing-breathe-slow" />
          </>
        )}

        <div className="relative max-w-md mx-auto px-4 pt-12 pb-8">
          {/* 导航栏 */}
          <div className="flex items-center gap-4 mb-6">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2.5 -ml-2 rounded-2xl bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all active:scale-95"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              {subtitle && (
                <p className="text-sm text-white/80 mt-1 font-medium">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-md mx-auto px-4 -mt-4 relative z-10">
        {/* 白色内容卡片 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-soft border border-white/60 p-5">
          {children}
        </div>
      </main>
    </div>
  );
};

// 信息层级组件
interface InfoSectionProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const InfoSection: React.FC<InfoSectionProps> = ({
  title,
  icon,
  children,
  action,
}) => {
  return (
    <section className="mb-6 last:mb-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon && (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
              {icon}
            </div>
          )}
          <h2 className="text-base font-bold text-neutral-800">{title}</h2>
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>
      {children}
    </section>
  );
};

// 治愈系卡片组件
interface HealingCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'highlight' | 'subtle';
  onClick?: () => void;
}

export const HealingCard: React.FC<HealingCardProps> = ({
  children,
  className = '',
  variant = 'default',
  onClick,
}) => {
  const variantClasses = {
    default: 'bg-white shadow-soft border border-neutral-100',
    highlight: 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100',
    subtle: 'bg-neutral-50/50 border border-neutral-100',
  };

  return (
    <div
      onClick={onClick}
      className={`
        rounded-2xl p-4 
        ${variantClasses[variant]}
        ${onClick ? 'cursor-pointer healing-hover' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// 治愈系标签组件
interface HealingTagProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'info' | 'love';
  icon?: ReactNode;
}

export const HealingTag: React.FC<HealingTagProps> = ({
  label,
  variant = 'default',
  icon,
}) => {
  const variantClasses = {
    default: 'bg-neutral-100 text-neutral-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    info: 'bg-blue-100 text-blue-700',
    love: 'bg-rose-100 text-rose-700',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${variantClasses[variant]}`}>
      {icon}
      {label}
    </span>
  );
};

// 治愈系空状态组件
interface HealingEmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const HealingEmptyState: React.FC<HealingEmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mb-4 animate-healing-breathe">
        <div className="text-amber-500">
          {icon}
        </div>
      </div>
      <h3 className="text-lg font-semibold text-neutral-800 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-neutral-500 mb-6 max-w-xs">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-xl font-medium shadow-lg shadow-amber-200 hover:shadow-xl transition-all active:scale-95"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default HealingPageLayout;
