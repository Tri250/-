import React, { memo, useMemo } from 'react';
import { FileText, Mic, Image, Video, File, Star, Play, Pause } from 'lucide-react';

interface TimelineItemProps {
  date: string;
  title: string;
  content: string;
  type: 'text' | 'voice' | 'photo' | 'video' | 'file' | 'pdf';
  isImportant?: boolean;
  tags?: string[];
  tagColors?: Record<string, string>;
  attachments?: string[];
  voiceDuration?: number;
  voiceTranscription?: string;
  pdfFileName?: string;
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
    case 'pdf':
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
    case 'pdf':
      return 'bg-orange-500';
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
  attachments,
  voiceDuration,
  voiceTranscription,
  pdfFileName,
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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className={`flex gap-4 animate-slide-up ${onClick ? 'cursor-pointer hover:bg-neutral-50 rounded-lg p-1 transition-colors' : ''}`}
      onClick={onClick}
    >
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-full ${iconColor} flex items-center justify-center shadow-md ${isImportant ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}>
          <Icon className="w-5 h-5 text-white" />
          {isImportant && (
            <Star className="absolute w-3 h-3 text-amber-400 fill-amber-400 -top-1 -right-1" />
          )}
        </div>
        <div className={`w-0.5 flex-1 ${isImportant ? 'bg-gradient-to-b from-amber-300 to-neutral-200' : 'bg-gradient-to-b from-neutral-200 to-transparent'} mt-2`} />
      </div>
      
      <div className="flex-1 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-neutral-900">{title}</span>
          {isImportant && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-500" />
              重要
            </span>
          )}
        </div>
        
        {type === 'voice' && voiceDuration && (
          <div className="flex items-center gap-2 mb-2 text-sm text-purple-600">
            <Mic className="w-4 h-4" />
            <span>{formatDuration(voiceDuration)}</span>
          </div>
        )}
        
        {voiceTranscription && (
          <p className="text-sm text-neutral-600 mb-2 bg-purple-50 p-2 rounded-lg">
            {voiceTranscription}
          </p>
        )}
        
        {type === 'pdf' && pdfFileName && (
          <div className="flex items-center gap-2 mb-2 text-sm text-orange-600 bg-orange-50 p-2 rounded-lg">
            <File className="w-4 h-4" />
            <span className="truncate">{pdfFileName}</span>
          </div>
        )}
        
        {attachments && attachments.length > 0 && type === 'photo' && (
          <div className="mb-2 rounded-lg overflow-hidden">
            <img 
              src={attachments[0]} 
              alt="记录图片" 
              className="w-full h-32 object-cover"
            />
          </div>
        )}
        
        {attachments && attachments.length > 0 && type === 'pdf' && (
          <div className="mb-2 rounded-lg overflow-hidden bg-orange-50 border border-orange-100">
            <iframe
              src={attachments[0]}
              className="w-full h-32"
              title="PDF预览"
            />
          </div>
        )}
        
        <p className="text-sm text-neutral-600 mb-3">{content}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400">{formatDate(date)}</span>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-xs"
                  style={{ backgroundColor: tagColors[tag] ? `${tagColors[tag]}20` : undefined, color: tagColors[tag] }}
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

interface VirtualTimelineProps {
  records: Array<{
    id: string;
    date: string;
    title: string;
    content: string;
    type: 'text' | 'voice' | 'photo' | 'video' | 'file' | 'pdf';
    isImportant?: boolean;
    tags?: string[];
    attachments?: string[];
    voiceDuration?: number;
    voiceTranscription?: string;
    pdfFileName?: string;
  }>;
  tagColors?: Record<string, string>;
  onItemClick?: (id: string) => void;
  containerHeight?: number;
  itemHeight?: number;
}

const VirtualTimelineItem = memo(({ record, tagColors, onItemClick }: {
  record: VirtualTimelineProps['records'][0];
  tagColors?: Record<string, string>;
  onItemClick?: (id: string) => void;
}) => (
  <TimelineItem
    date={record.date}
    title={record.title}
    content={record.content}
    type={record.type}
    isImportant={record.isImportant}
    tags={record.tags}
    tagColors={tagColors}
    attachments={record.attachments}
    voiceDuration={record.voiceDuration}
    voiceTranscription={record.voiceTranscription}
    pdfFileName={record.pdfFileName}
    onClick={() => onItemClick?.(record.id)}
  />
));

VirtualTimelineItem.displayName = 'VirtualTimelineItem';

export const VirtualTimeline: React.FC<VirtualTimelineProps> = ({
  records,
  tagColors,
  onItemClick,
  containerHeight = 600,
  itemHeight = 120,
}) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const visibleRange = useMemo(() => {
    const startIdx = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 2;
    const endIdx = Math.min(records.length, startIdx + visibleCount);
    
    return {
      start: Math.max(0, startIdx - 1),
      end: endIdx,
    };
  }, [scrollTop, itemHeight, containerHeight, records.length]);

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const totalHeight = records.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  const visibleRecords = useMemo(() => {
    return records.slice(visibleRange.start, visibleRange.end);
  }, [records, visibleRange]);

  return (
    <div
      ref={containerRef}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
      className="scroll-smooth"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)`, position: 'absolute', top: 0, left: 0, right: 0 }}>
          {visibleRecords.map((record) => (
            <VirtualTimelineItem
              key={record.id}
              record={record}
              tagColors={tagColors}
              onItemClick={onItemClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
