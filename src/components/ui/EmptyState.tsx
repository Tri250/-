import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="w-24 h-24 mb-6 flex items-center justify-center bg-gradient-to-br from-orange-50 to-peach-50 rounded-full">
        {icon ? (
          <div className="text-gray-400">{icon}</div>
        ) : (
          <svg
            className="w-12 h-12 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        )}
      </div>
      
      <h3 className="text-lg font-semibold text-gray-800 mb-2 text-center">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-gray-500 text-center mb-6 max-w-sm">
          {description}
        </p>
      )}
      
      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-br from-orange-400 to-peach-500 text-white hover:from-orange-500 hover:to-peach-600 shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
        >
          {action.icon && <span className="flex-shrink-0">{action.icon}</span>}
          {action.label}
        </button>
      )}
    </div>
  );
}
