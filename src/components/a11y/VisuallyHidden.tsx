// ============================================
// PawSync Pro - VisuallyHidden.tsx
//
// 作者: 带娃的小陈工
// 日期: 2026-06-23
// 描述: 视觉隐藏但屏幕阅读器可见的组件
// ============================================

import React from 'react';
import { cn } from '../../lib/utils';

// ============================================================
// 类型定义
// ============================================================

export interface VisuallyHiddenProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  id?: string;
  focusable?: boolean;
}

// ============================================================
// 视觉隐藏样式
// ============================================================

const visuallyHiddenBase = `
  absolute
  -m-px
  w-px
  h-px
  p-0
  overflow-hidden
  whitespace-nowrap
  border-0
  clip-0
`;

const visuallyHiddenFocusable = `
  focus:not( :focus-within ) :invisible
  focus:relative
  focus:w-auto
  focus:h-auto
  focus:m-0
  focus:overflow-visible
  focus:whitespace-normal
  focus:clip-auto
`;

// ============================================================
// VisuallyHidden 组件
//
// 视觉上隐藏内容，但保持对屏幕阅读器等辅助技术可见。
// 常用于：
// - 装饰性元素的语义化描述
// - 表单标签的隐藏文本
// - 跳转到主要内容的链接（skip link）
// - 图标按钮的替代文本
// ============================================================

export function VisuallyHidden({
  children,
  className = '',
  as: Component = 'span',
  id,
  focusable = false,
}: VisuallyHiddenProps) {
  const Tag = Component as any;

  return (
    <Tag
      id={id}
      className={cn(
        visuallyHiddenBase,
        focusable ? visuallyHiddenFocusable : '',
        className
      )}
    >
      {children}
    </Tag>
  );
}

// ============================================================
// HiddenForSR 组件
// 对屏幕阅读器隐藏，但视觉上可见
// ============================================================

export interface HiddenForScreenReaderProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export function HiddenForScreenReader({
  children,
  className = '',
  as: Component = 'span',
}: HiddenForScreenReaderProps) {
  const Tag = Component as any;

  return (
    <Tag
      aria-hidden="true"
      className={className}
    >
      {children}
    </Tag>
  );
}

// ============================================================
// SkipLink 跳过导航链接组件
// 用于帮助键盘用户快速跳过导航链接
// ============================================================

export interface SkipLinkProps {
  to?: string;
  children?: React.ReactNode;
  className?: string;
}

export function SkipLink({
  to = '#main-content',
  children = '跳转到主要内容',
  className = '',
}: SkipLinkProps) {
  return (
    <a
      href={to}
      className={cn(
        'absolute left-4 top-4 z-toast',
        'px-4 py-2 rounded-lg',
        'bg-primary-500 text-white font-medium',
        'shadow-elevated',
        'transition-all duration-200',
        '-translate-y-full opacity-0',
        'focus:translate-y-0 focus:opacity-100',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        className
      )}
    >
      {children}
    </a>
  );
}

// ============================================================
// sr-only Tailwind 兼容类的组件化版本
// 直接导出样式类，方便在其他组件中使用
// ============================================================

export const visuallyHiddenClass = `
  absolute
  -m-px
  w-px
  h-px
  p-0
  overflow-hidden
  whitespace-nowrap
  border-0
  clip-0
`;

export const srOnly = visuallyHiddenClass;

export default VisuallyHidden;
