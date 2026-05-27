import { cn } from '../../lib/utils';

interface GlassInputProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'password' | 'email' | 'number';
  className?: string;
  error?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  required?: boolean;
}

export function GlassInput({
  label,
  value = '',
  onChange,
  placeholder,
  type = 'text',
  className,
  error,
  icon,
  disabled = false,
  required = false
}: GlassInputProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full rounded-lg px-4 py-2.5 text-sm transition-all duration-200',
            'bg-white/60 dark:bg-neutral-800/60',
            'border border-transparent focus:border-primary-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-200',
            'placeholder:text-neutral-400',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            icon && 'pl-10',
            error && 'border-danger-300 focus:border-danger-400 focus:ring-danger-200'
          )}
        />
      </div>
      {error && (
        <p className="text-sm text-danger-500">{error}</p>
      )}
    </div>
  );
}

interface GlassTextareaProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  rows?: number;
  disabled?: boolean;
  required?: boolean;
}

export function GlassTextarea({
  label,
  value = '',
  onChange,
  placeholder,
  className,
  error,
  rows = 3,
  disabled = false,
  required = false
}: GlassTextareaProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={cn(
          'w-full rounded-lg px-4 py-2.5 text-sm transition-all duration-200 resize-none',
          'bg-white/60 dark:bg-neutral-800/60',
          'border border-transparent focus:border-primary-400',
          'focus:outline-none focus:ring-2 focus:ring-primary-200',
          'placeholder:text-neutral-400',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-danger-300 focus:border-danger-400 focus:ring-danger-200'
        )}
      />
      {error && (
        <p className="text-sm text-danger-500">{error}</p>
      )}
    </div>
  );
}

interface GlassSelectProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
}

export function GlassSelect({
  label,
  value,
  onChange,
  options,
  className,
  error,
  disabled = false,
  required = false,
  placeholder
}: GlassSelectProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={cn(
          'w-full rounded-lg px-4 py-2.5 text-sm transition-all duration-200 appearance-none',
          'bg-white/60 dark:bg-neutral-800/60',
          'border border-transparent focus:border-primary-400',
          'focus:outline-none focus:ring-2 focus:ring-primary-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%236B7280%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E")] bg-no-repeat bg-right-[12px] bg-center',
          error && 'border-danger-300 focus:border-danger-400 focus:ring-danger-200'
        )}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-danger-500">{error}</p>
      )}
    </div>
  );
}
