import React from 'react';
import { FileText, Mic, Image, Video, File } from 'lucide-react';

interface TimelineItemProps {
  date: string;
  title: string;
  content: string;
  type: 'text' | 'voice' | 'photo' | 'video' | 'file';
  isImportant?: boolean;
  tags?: string[];
  tagColors?: Record<string, string>;
  onClick?: () => void;
}

const getIcon = (type: string) => {
  switch (type) {
    case 'voice':
      return Mic;
    case 'photo':
      return Image;
    case 'video':
      return Video;
    case 'file':
      return File;
    default:
      return FileText;
  }
};

const getIconColor = (type: string) => {
  switch (type) {
    case 'voice':
      return 'bg-purple-500';
    case 'photo':
      return 'bg-green-500';
    case 'video':
      return 'bg-red-500';
    case 'file':
      return 'bg-blue-500';
    default:
      return 'bg-primary-500';
  }
};

export const TimelineItem: React.FC<TimelineItemProps> = ({
  date,
  title,
  content,
  type,
  isImportant = false,
  tags = [],
  tagColors = {},
  onClick,
}) => {
  const Icon = getIcon(type);
  const iconColor = getIconColor(type);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        return '刚刚';
      }
      return `${hours}小时前`;
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    }
    
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <div 
      className={`flex gap-4 animate-slide-up ${onClick ? 'cursor-pointer hover:bg-neutral-50 rounded-lg p-1 transition-colors' : ''}`}
      onClick={onClick}
    >
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-full ${iconColor} flex items-center justify-center shadow-md`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="w-0.5 flex-1 bg-gradient-to-b from-neutral-200 to-transparent mt-2" />
      </div>
      
      <div className="flex-1 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-neutral-900">{title}</span>
          {isImportant && (
            <span className="px-2 py-0.5 bg-warning-100 text-warning-700 rounded-full text-xs font-medium">
              重要
            </span>
          )}
        </div>
        <p className="text-sm text-neutral-600 mb-3">{content}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">{formatDate(date)}</span>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full text-xs"
                  style={{ backgroundColor: tagColors[tag] }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface TimelineProps {
  children: React.ReactNode;
}

export const Timeline: React.FC<TimelineProps> = ({ children }) => {
  return <div className="space-y-1">{children}</div>;
};
