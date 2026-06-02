import React, { memo, useRef, useCallback, useEffect, useMemo } from 'react';

interface OptimizedInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  type?: 'text' | 'email' | 'password' | 'search';
  debounceMs?: number;
  maxLength?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const OptimizedInput = memo(({ 
  value, 
  onChange, 
  placeholder, 
  className, 
  type = 'text',
  debounceMs = 0,
  maxLength,
  disabled,
  autoFocus,
  onKeyDown,
  onFocus,
  onBlur
}: OptimizedInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [localValue, setLocalValue] = React.useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    if (debounceMs > 0) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onChange(newValue);
      }, debounceMs);
    } else {
      onChange(newValue);
    }
  }, [onChange, debounceMs]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <input
      ref={inputRef}
      type={type}
      value={localValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      maxLength={maxLength}
      disabled={disabled}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck="false"
    />
  );
});

OptimizedInput.displayName = 'OptimizedInput';

interface OptimizedTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  maxRows?: number;
  debounceMs?: number;
  maxLength?: number;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export const OptimizedTextarea = memo(({ 
  value, 
  onChange, 
  placeholder, 
  className, 
  rows = 3,
  maxRows = 10,
  debounceMs = 0,
  maxLength,
  disabled,
  onKeyDown
}: OptimizedTextareaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [localValue, setLocalValue] = React.useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, maxRows * 24);
    textarea.style.height = `${newHeight}px`;
  }, [maxRows]);

  useEffect(() => {
    adjustHeight();
  }, [localValue, adjustHeight]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    if (debounceMs > 0) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onChange(newValue);
      }, debounceMs);
    } else {
      onChange(newValue);
    }
  }, [onChange, debounceMs]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <textarea
      ref={textareaRef}
      value={localValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      rows={rows}
      maxLength={maxLength}
      disabled={disabled}
      onKeyDown={onKeyDown}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck="false"
    />
  );
});

OptimizedTextarea.displayName = 'OptimizedTextarea';

interface OptimizedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  throttleMs?: number;
  type?: 'button' | 'submit' | 'reset';
}

export const OptimizedButton = memo(({ 
  children, 
  onClick, 
  className, 
  disabled = false, 
  loading = false,
  variant = 'primary',
  size = 'md',
  throttleMs = 100,
  type = 'button'
}: OptimizedButtonProps) => {
  const lastClickTimeRef = useRef(0);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }

    const now = Date.now();
    if (now - lastClickTimeRef.current < throttleMs) {
      e.preventDefault();
      return;
    }
    lastClickTimeRef.current = now;

    onClick?.();
  }, [disabled, loading, throttleMs, onClick]);

  const variantClasses = useMemo(() => ({
    primary: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700',
    secondary: 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 active:bg-neutral-300',
    ghost: 'bg-transparent text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200',
    danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
  }), []);

  const sizeClasses = useMemo(() => ({
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }), []);

  return (
    <button
      type={type}
      className={`${className} ${variantClasses[variant]} ${sizeClasses[size]} rounded-lg font-medium transition-colors duration-150 ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={handleClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          处理中...
        </span>
      ) : children}
    </button>
  );
});

OptimizedButton.displayName = 'OptimizedButton';