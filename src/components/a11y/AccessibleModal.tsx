// ============================================
// PawSync Pro - AccessibleModal.tsx
//
// 作者: 带娃的小陈工
// 日期: 2026-06-23
// 描述: 无障碍弹窗组件
// ============================================

import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAccessibility } from '../../utils/accessibility';

// ============================================================
// 类型定义
// ============================================================

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  size?: ModalSize;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement>;
  returnFocusRef?: React.RefObject<HTMLElement>;
  role?: 'dialog' | 'alertdialog';
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  footer?: React.ReactNode;
  fullScreenOnMobile?: boolean;
}

export interface AccessibleModalRef {
  focusFirst: () => void;
  focusClose: () => void;
}

// ============================================================
// 样式配置
// ============================================================

const sizeClasses: Record<ModalSize, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  full: 'sm:max-w-4xl',
};

// ============================================================
// 焦点陷阱工具函数
// ============================================================

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (el) => el instanceof HTMLElement && !el.hasAttribute('aria-hidden')
  ) as HTMLElement[];
}

// ============================================================
// AccessibleModal 组件
// ============================================================

export const AccessibleModal = forwardRef<AccessibleModalRef, AccessibleModalProps>(
  function AccessibleModal(
    {
      isOpen,
      onClose,
      title,
      description,
      children,
      className = '',
      size = 'md',
      closeOnEscape = true,
      closeOnOverlayClick = true,
      showCloseButton = true,
      initialFocusRef,
      returnFocusRef,
      role = 'dialog',
      ariaLabelledBy,
      ariaDescribedBy,
      footer,
      fullScreenOnMobile = true,
    },
    ref
  ) {
    const { prefersReducedMotion, announceForAccessibility } = useAccessibility();
    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);
    const titleId = ariaLabelledBy || `modal-title-${Math.random().toString(36).substr(2, 9)}`;
    const descriptionId = ariaDescribedBy || `modal-description-${Math.random().toString(36).substr(2, 9)}`;

    const [isMounted, setIsMounted] = useState(false);

    const focusFirstElement = useCallback(() => {
      if (!modalRef.current) return;

      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
        return;
      }

      const focusableElements = getFocusableElements(modalRef.current);
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      } else {
        closeButtonRef.current?.focus();
      }
    }, [initialFocusRef]);

    const focusCloseButton = useCallback(() => {
      closeButtonRef.current?.focus();
    }, []);

    useImperativeHandle(ref, () => ({
      focusFirst: focusFirstElement,
      focusClose: focusCloseButton,
    }));

    const handleKeyDown = useCallback(
      (event: KeyboardEvent) => {
        if (!isOpen) return;

        if (closeOnEscape && event.key === 'Escape') {
          event.preventDefault();
          onClose();
          return;
        }

        if (event.key === 'Tab' && modalRef.current) {
          const focusableElements = getFocusableElements(modalRef.current);
          if (focusableElements.length === 0) {
            event.preventDefault();
            return;
          }

          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];
          const activeElement = document.activeElement as HTMLElement;

          if (event.shiftKey) {
            if (activeElement === firstElement || !modalRef.current.contains(activeElement)) {
              event.preventDefault();
              lastElement.focus();
            }
          } else {
            if (activeElement === lastElement) {
              event.preventDefault();
              firstElement.focus();
            }
          }
        }
      },
      [isOpen, closeOnEscape, onClose]
    );

    const handleOverlayClick = useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        if (!closeOnOverlayClick) return;
        if (event.target === event.currentTarget) {
          onClose();
        }
      },
      [closeOnOverlayClick, onClose]
    );

    useEffect(() => {
      if (isOpen) {
        setIsMounted(true);
      }
    }, [isOpen]);

    useEffect(() => {
      if (!isOpen || !isMounted) return;

      previousActiveElement.current = document.activeElement as HTMLElement;

      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      const focusTimer = setTimeout(() => {
        focusFirstElement();
      }, 50);

      if (title && typeof title === 'string') {
        announceForAccessibility(title, 'polite');
      }

      return () => {
        clearTimeout(focusTimer);
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';

        if (returnFocusRef?.current) {
          returnFocusRef.current.focus();
        } else if (previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
      };
    }, [
      isOpen,
      isMounted,
      handleKeyDown,
      focusFirstElement,
      returnFocusRef,
      title,
      announceForAccessibility,
    ]);

    if (!isOpen && !isMounted) return null;

    return (
      <div
        className="fixed inset-0 z-modal flex items-end sm:items-center justify-center"
        role={role}
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
      >
        <div
          className={cn(
            'absolute inset-0 bg-neutral-900/50 backdrop-blur-sm',
            prefersReducedMotion ? '' : 'animate-fade-in'
          )}
          onClick={handleOverlayClick}
          aria-hidden="true"
        />

        <div
          ref={modalRef}
          className={cn(
            'relative w-full rounded-t-2xl sm:rounded-2xl overflow-hidden',
            'bg-white dark:bg-neutral-800',
            'shadow-elevated',
            sizeClasses[size],
            prefersReducedMotion ? '' : 'animate-slide-up sm:animate-scale-in',
            'max-h-[90vh] sm:max-h-[85vh]',
            fullScreenOnMobile ? 'sm:max-h-[85vh]' : '',
            className
          )}
          tabIndex={-1}
        >
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm z-10">
              <div className="flex-1 min-w-0">
                {title && (
                  <h2
                    id={titleId}
                    className="text-base sm:text-lg font-semibold text-neutral-800 dark:text-neutral-100 truncate"
                  >
                    {title}
                  </h2>
                )}
              </div>
              {showCloseButton && (
                <button
                  ref={closeButtonRef}
                  onClick={onClose}
                  className={cn(
                    'p-2 sm:p-1.5 rounded-lg',
                    'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300',
                    'hover:bg-neutral-100 dark:hover:bg-neutral-700',
                    'transition-colors',
                    'min-h-[44px] min-w-[44px] flex items-center justify-center',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2'
                  )}
                  aria-label="关闭弹窗"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              )}
            </div>
          )}

          {description && (
            <div id={descriptionId} className="px-4 sm:px-6 py-3 text-sm text-neutral-600 dark:text-neutral-400">
              {description}
            </div>
          )}

          <div
            className={cn(
              'overflow-y-auto',
              footer ? 'p-4 sm:p-6' : 'p-4 sm:p-6',
              title || showCloseButton ? '' : 'pt-6'
            )}
          >
            {children}
          </div>

          {footer && (
            <div className="px-4 sm:px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 sticky bottom-0 bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm z-10">
              {footer}
            </div>
          )}
        </div>
      </div>
    );
  }
);

export default AccessibleModal;
