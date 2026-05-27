import React from 'react';
import { FileText, BookOpen, Calendar, Search } from 'lucide-react';

interface EmptyStateProps {
  type?: 'records' | 'manuals' | 'reminders' | 'search';
  title: string;
  description: string;
  action?: React.ReactNode;
}

const getIcon = (type: string) => {
  switch (type) {
    case 'records':
      return FileText;
    case 'manuals':
      return BookOpen;
    case 'reminders':
      return Calendar;
    case 'search':
      return Search;
    default:
      return FileText;
  }
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'records',
  title,
  description,
  action,
}) => {
  const Icon = getIcon(type);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-scale-in">
      <div className="w-24 h-24 rounded-full bg-neutral-100 flex items-center justify-center mb-6">
        <Icon className="w-12 h-12 text-neutral-400" />
      </div>
      <h3 className="text-xl font-semibold text-neutral-800 mb-3">{title}</h3>
      <p className="text-base text-neutral-500 mb-8 max-w-sm leading-relaxed">{description}</p>
      {action}
    </div>
  );
};
