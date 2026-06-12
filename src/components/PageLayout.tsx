// ============================================
// PawSync Pro - PageLayout
//
// 统一页面布局
//   · PageHeader (可选) + 内容区
//   · 底部安全间距适配导航栏
// ============================================

import React from 'react';
import { cn } from '../lib/utils';
import { PageHeader } from './PageHeader';
import { ROUTES } from '../config/routes';

interface PageLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onBack?: () => void;
  showHeader?: boolean;
  showBack?: boolean;
  customTitle?: string;
  headerRightContent?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  /** 内边距大小 */
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

const paddingMap: Record<NonNullable<PageLayoutProps['padding']>, string> = {
  none: '',
  sm: 'px-3 pb-4',
  md: 'px-4 pb-6',
  lg: 'px-5 pb-8',
};

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  currentPage,
  onBack,
  showHeader = true,
  showBack,
  customTitle,
  headerRightContent,
  className,
  contentClassName,
  padding = 'md',
}) => {
  const defaultBack = () => onBack?.();

  return (
    <div
      className={cn(
        'min-h-screen flex flex-col',
        'bg-gradient-to-b from-cream-50 via-orange-50/30 to-rose-50/30',
        className
      )}
    >
      {/* 顶部 Header */}
      {showHeader && (
        <PageHeader
          currentPage={currentPage}
          onBack={onBack ?? defaultBack}
          showBack={showBack}
          customTitle={customTitle}
          rightContent={headerRightContent}
        />
      )}

      {/* 主内容 */}
      <main
        className={cn(
          'flex-1 max-w-md w-full mx-auto',
          paddingMap[padding],
          contentClassName
        )}
      >
        {children}
      </main>

      {/* 底部安全空白 (给导航栏) */}
      <div
        aria-hidden="true"
        className="h-[120px] flex-shrink-0 pointer-events-none"
      />
    </div>
  );
};

PageLayout.displayName = 'PageLayout';
export default PageLayout;

// 快速工具: 获取默认返回目标 (通常回首页或父级 Tab)
export const getDefaultBackTarget = (page: string): string => {
  // 底部 Tab 页返回首页
  const tabs = new Set([ROUTES.HOME, ROUTES.HEALTH_RECORDS, ROUTES.HEALTH, ROUTES.PROFILE]);
  if (tabs.has(page as ROUTES)) return ROUTES.HOME;
  // 其他页返回首页
  return ROUTES.HOME;
};
