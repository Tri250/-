import { cn } from '../../lib/utils';
interface GlassCardProps {
 children: React.ReactNode;
 className?: string;
 variant?: 'default' | 'elevated' | 'subtle';
 padding?: 'none' | 'sm' | 'md' | 'lg';
 onClick?: () => void;
 asChild?: boolean;
}
export function GlassCard({ children, className, variant = 'default', padding = 'md', onClick, asChild = false }: GlassCardProps) {
 const paddingClasses = {
 none: '',
 sm: 'p-3',
 md: 'p-4',
 lg: 'p-6'
 };
 const variantClasses = {
 default: 'shadow-card',
 elevated: 'shadow-elevated',
 subtle: 'shadow-soft'
 };
 return (<div className={cn('glass-card dark:glass-card-dark rounded-xl transition-all duration-300', 'hover-lift active-scale', paddingClasses[padding], variantClasses[variant], onClick && 'cursor-pointer', className)} onClick={onClick}>
 {children}
 </div>);
}
interface GlassSurfaceProps {
 children: React.ReactNode;
 className?: string;
}
export function GlassSurface({ children, className }: GlassSurfaceProps) {
 return (<div className={cn('glass-surface dark:glass-surface-dark rounded-lg', className)}>
 {children}
 </div>);
}
interface GlassButtonProps {
 children: React.ReactNode;
 className?: string;
 variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
 size?: 'sm' | 'md' | 'lg';
 onClick?: () => void;
 disabled?: boolean;
 loading?: boolean;
}
export function GlassButton({ children, className, variant = 'primary', size = 'md', onClick, disabled = false, loading = false }: GlassButtonProps) {
 const variantClasses = {
 primary: 'bg-gradient-primary text-white hover:opacity-90',
 secondary: 'bg-secondary-500 text-white hover:bg-secondary-600',
 ghost: 'bg-white/60 text-neutral-700 dark:text-neutral-200 dark:bg-neutral-800/60 hover:bg-white/80 dark:hover:bg-neutral-700/60',
 danger: 'bg-danger-500 text-white hover:bg-danger-600'
 };
 const sizeClasses = {
 sm: 'px-3 py-1.5 text-sm',
 md: 'px-4 py-2 text-sm',
 lg: 'px-6 py-3 text-base'
 };
 return (<button className={cn('glass-button rounded-lg font-medium transition-all duration-200', 'active-scale disabled:opacity-50 disabled:cursor-not-allowed', variantClasses[variant], sizeClasses[size], className)} onClick={onClick} disabled={disabled || loading}>
 {loading ? (<span className="flex items-center gap-2">
 <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
 </svg>
 加载中
 </span>) : (
 children
 )}
 </button>);
}