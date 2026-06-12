// ============================================
// PawSync Pro - PageHeader
//
// 统一页面头部: 标题 + 面包屑 + 返回
// ============================================

import React, { memo, useMemo } from 'react';
import { ChevronLeft, MoreHorizontal, PawPrint } from 'lucide-react';
import { cn } from '../lib/utils';
import {
  routeConfig,
  ROUTES,
  type RouteId,
} from '../config/routes';

interface PageHeaderProps {
  /** 当前页面路由 ID */
  currentPage: string;
  /** 返回函数 (通常回到首页) */
  onBack?: () => void;
  /** 是否显示返回按钮 (底部Tab页不显示) */
  showBack?: boolean;
  /** 自定义标题 (覆盖配置) */
  customTitle?: string;
  /** 右侧内容 */
  rightContent?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = memo(({
  currentPage,
  onBack,
  showBack,
  customTitle,
  rightContent,
  className,
}) => {
  const meta = routeConfig.meta[currentPage as RouteId];
  const breadcrumb = useMemo(
    () => routeConfig.helpers.getBreadcrumb(currentPage as RouteId),
    [currentPage]
  );

  // 底部 Tab 页不显示返回
  const isTab = routeConfig.helpers.isBottomTab(currentPage);
  const shouldShowBack = showBack ?? !isTab;

  const title = customTitle ?? meta?.title ?? '爪爪连心';
  const subtitle = meta?.subtitle;
  const AccentIcon = meta?.icon ?? PawPrint;

  return (
    <header
      className={cn(
        'sticky top-0 z-30',
        'bg-white/80 backdrop-blur-2xl',
        'border-b border-cream-200/60',
        'px-4 pt-safe-top',
        className
      )}
    >
      <div className="flex items-center h-14 gap-3 max-w-md mx-auto">
        {/* 返回按钮 */}
        {shouldShowBack && onBack && (
          <button
            onClick={onBack}
            className={cn(
              'w-10 h-10 rounded-2xl',
              'flex items-center justify-center',
              'bg-cream-100/80 hover:bg-cream-200/60',
              'text-neutral-600 hover:text-neutral-800',
              'active:scale-95 transition-all'
            )}
            aria-label="返回"
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={2.2} />
          </button>
        )}

        {/* 图标 + 标题 (左侧无返回时显示大图标) */}
        {!shouldShowBack ? (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-100 to-rose-100 flex items-center justify-center mr-1 shadow-sm">
            <AccentIcon className="w-5 h-5 text-primary-500" strokeWidth={2.3} />
          </div>
        ) : null}

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <h1 className="text-base font-bold text-neutral-800 truncate">{title}</h1>
            {subtitle && (
              <span className="text-[11px] text-neutral-400 font-medium truncate">
                · {subtitle}
              </span>
            )}
          </div>

          {/* 面包屑 */}
          {breadcrumb.length > 1 && (
            <div className="flex items-center gap-1 mt-0.5 text-[10px] text-neutral-400 overflow-hidden">
              {breadcrumb.map((bc, i) => (
                <React.Fragment key={bc.id}>
                  {i > 0 && <ChevronLeft className="w-2.5 h-2.5 flex-shrink-0 rotate-180 text-neutral-300" />}
                  <span className={cn(
                    'truncate',
                    i === breadcrumb.length - 1
                      ? 'text-neutral-500 font-medium'
                      : 'text-neutral-400'
                  )}>
                    {bc.title}
                  </span>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* 右侧 */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {rightContent ?? (
            <button
              className={cn(
                'w-9 h-9 rounded-2xl',
                'flex items-center justify-center',
                'text-neutral-500 hover:text-neutral-800 hover:bg-cream-100/60',
                'active:scale-95 transition-all'
              )}
              aria-label="更多"
            >
              <MoreHorizontal className="w-5 h-5" strokeWidth={2.2} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
});

PageHeader.displayName = 'PageHeader';
export default PageHeader;
