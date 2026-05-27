import { useEffect, useCallback } from 'react';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';
interface GlassModalProps {
 isOpen: boolean;
 onClose: () => void;
 title?: string;
 children: React.ReactNode;
 className?: string;
 size?: 'sm' | 'md' | 'lg';
}
export function GlassModal({ isOpen, onClose, title, children, className, size = 'md' }: GlassModalProps) {
 const handleEscape = useCallback((event: KeyboardEvent) => {
 if (event.key === 'Escape') {
 onClose();
 }
 }, [onClose]);
 useEffect(() => {
 if (isOpen) {
 document.addEventListener('keydown', handleEscape);
 document.body.style.overflow = 'hidden';
 return () => {
 document.removeEventListener('keydown', handleEscape);
 document.body.style.overflow = 'unset';
 };
 }
 }, [isOpen, handleEscape]);
 if (!isOpen)
 return null;
 const sizeClasses = {
 sm: 'max-w-sm',
 md: 'max-w-md',
 lg: 'max-w-lg'
 };
 return (<div className="fixed inset-0 z-modal flex items-center justify-center p-4">
 <div className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm animate-fade-in" onClick={onClose}/>
 <div className={cn('relative w-full max-w-lg rounded-2xl overflow-hidden', 'glass-card dark:glass-card-dark', 'shadow-elevated', sizeClasses[size], 'animate-scale-in', className)}>
 {title && (<div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
 <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
 {title}
 </h3>
 <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
 <X className="h-5 w-5"/>
 </button>
 </div>)}
 <div className="p-6">
 {children}
 </div>
 </div>
 </div>);
}
interface ToastProps {
 message: string;
 type?: 'success' | 'error' | 'warning' | 'info';
 duration?: number;
 onClose?: () => void;
}
export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
 useEffect(() => {
 const timer = setTimeout(() => {
 onClose?.();
 }, duration);
 return () => clearTimeout(timer);
 }, [duration, onClose]);
 const typeClasses = {
 success: 'border-success-200 bg-success-50 text-success-800',
 error: 'border-danger-200 bg-danger-50 text-danger-800',
 warning: 'border-warning-200 bg-warning-50 text-warning-800',
 info: 'border-info-200 bg-info-50 text-info-800'
 };
 return (<div className={cn('fixed top-4 right-4 z-toast', 'rounded-xl border p-4 shadow-card', 'max-w-sm', 'animate-slide-in', typeClasses[type])}>
 <div className="flex items-start gap-3">
 <div className="flex-shrink-0">
 {type === 'success' && <svg className="h-5 w-5 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
 </svg>}
 {type === 'error' && <svg className="h-5 w-5 text-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
 </svg>}
 {type === 'warning' && <svg className="h-5 w-5 text-warning-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
 </svg>}
 {type === 'info' && <svg className="h-5 w-5 text-info-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
 </svg>}
 </div>
 <p className="text-sm font-medium">{message}</p>
 {onClose && (<button onClick={onClose} className="flex-shrink-0 text-neutral-400 hover:text-neutral-600">
 <X className="h-4 w-4"/>
 </button>)}
 </div>
 </div>);
}
interface TooltipProps {
 children: React.ReactNode;
 content: string;
 position?: 'top' | 'bottom' | 'left' | 'right';
}
export function Tooltip({ children, content, position = 'top' }: TooltipProps) {
 const positionClasses = {
 top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
 bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
 left: 'right-full top-1/2 -translate-y-1/2 mr-2',
 right: 'left-full top-1/2 -translate-y-1/2 ml-2'
 };
 const arrowClasses = {
 top: 'top-full left-1/2 -translate-x-1/2 border-t-2 border-r-2',
 bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-2 border-l-2',
 left: 'left-full top-1/2 -translate-y-1/2 border-l-2 border-t-2',
 right: 'right-full top-1/2 -translate-y-1/2 border-r-2 border-b-2'
 };
 return (<div className="relative inline-block">
 {children}
 <div className="absolute z-tooltip invisible opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
 <div className={cn('glass-surface dark:glass-surface-dark', 'rounded-lg px-3 py-2 text-sm text-neutral-700 dark:text-neutral-200', 'shadow-card whitespace-nowrap', positionClasses[position])}>
 {content}
 </div>
 <div className={cn('absolute w-2 h-2 bg-white dark:bg-neutral-800 rotate-45', arrowClasses[position])}/>
 </div>
 </div>);
}
