import React, { useState, useCallback } from 'react';
import { Plus, X, Mic, Image, FileText, Video, File, Heart, Camera } from 'lucide-react';
import { RecordType } from '../types/health-record';

interface HealingFABProps {
  onAction: (type: RecordType) => void;
  primaryAction?: () => void;
}

interface FABAction {
  type: RecordType;
  icon: React.ElementType;
  label: string;
  gradient: string;
  shadowColor: string;
  description: string;
}

const actions: FABAction[] = [
  { 
    type: 'text', 
    icon: FileText, 
    label: '文字记录', 
    gradient: 'from-blue-400 to-cyan-400',
    shadowColor: 'rgba(96, 165, 250, 0.4)',
    description: '记录日常点滴'
  },
  { 
    type: 'voice', 
    icon: Mic, 
    label: '语音记录', 
    gradient: 'from-purple-400 to-pink-400',
    shadowColor: 'rgba(192, 132, 252, 0.4)',
    description: '语音快速记录'
  },
  { 
    type: 'photo', 
    icon: Camera, 
    label: '拍照记录', 
    gradient: 'from-emerald-400 to-teal-400',
    shadowColor: 'rgba(52, 211, 153, 0.4)',
    description: '拍摄可爱瞬间'
  },
  { 
    type: 'pdf', 
    icon: File, 
    label: 'PDF文档', 
    gradient: 'from-amber-400 to-orange-400',
    shadowColor: 'rgba(251, 191, 36, 0.4)',
    description: '上传体检报告'
  },
  { 
    type: 'video', 
    icon: Video, 
    label: '视频记录', 
    gradient: 'from-rose-400 to-red-400',
    shadowColor: 'rgba(251, 113, 133, 0.4)',
    description: '录制精彩视频'
  },
];

export const HealingFAB: React.FC<HealingFABProps> = ({ onAction, primaryAction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const handleAction = useCallback((type: RecordType) => {
    onAction(type);
    setIsOpen(false);
  }, [onAction]);

  const handlePrimaryAction = useCallback(() => {
    if (primaryAction) {
      primaryAction();
    } else {
      handleToggle();
    }
  }, [primaryAction, handleToggle]);

  return (
    <div className="fixed bottom-24 right-5 z-50">
      {/* 展开的菜单项 */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 flex flex-col items-end gap-3">
          {actions.map((action, index) => (
            <button
              key={action.type}
              onClick={() => handleAction(action.type)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="group flex items-center gap-3 pr-1 animate-slide-up"
              style={{ 
                animationDelay: `${index * 50}ms`,
                animationFillMode: 'both'
              }}
            >
              {/* 标签 */}
              <div 
                className={`flex flex-col items-end transition-all duration-300 ${
                  hoveredIndex === index ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
                }`}
              >
                <span className="text-sm font-semibold text-neutral-700 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
                  {action.label}
                </span>
                <span className="text-xs text-neutral-400 mt-1">
                  {action.description}
                </span>
              </div>
              
              {/* 图标按钮 */}
              <div 
                className={`w-12 h-12 rounded-full bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 active:scale-95`}
                style={{ 
                  boxShadow: `0 4px 20px ${action.shadowColor}`,
                }}
              >
                <action.icon className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 主按钮 */}
      <button
        onClick={handlePrimaryAction}
        className={`relative w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 flex items-center justify-center shadow-xl transition-all duration-500 hover:scale-105 active:scale-95 group`}
        style={{
          boxShadow: isOpen 
            ? '0 8px 32px rgba(251, 146, 60, 0.5)' 
            : '0 6px 24px rgba(251, 146, 60, 0.4)',
        }}
      >
        {/* 光晕效果 */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-300 to-rose-400 animate-pulse opacity-50" 
          style={{ animationDuration: '2s' }} 
        />
        
        {/* 内部白色边框 */}
        <div className="absolute inset-1 rounded-full border-2 border-white/30" />
        
        {/* 图标 */}
        <div className={`relative transition-transform duration-500 ${isOpen ? 'rotate-135' : 'rotate-0'}`}>
          {isOpen ? (
            <X className="w-7 h-7 text-white" strokeWidth={2.5} />
          ) : (
            <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
          )}
        </div>

        {/* 未展开时的提示点 */}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center animate-bounce">
            <Heart className="w-2.5 h-2.5 text-white fill-current" />
          </div>
        )}
      </button>

      {/* 提示文字 */}
      {!isOpen && (
        <div className="absolute -top-10 right-0 whitespace-nowrap">
          <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm text-xs font-medium text-neutral-600 animate-fade-in">
            记录美好时刻
          </div>
          <div className="absolute -bottom-1 right-6 w-2 h-2 bg-white/90 rotate-45" />
        </div>
      )}
    </div>
  );
};

export default HealingFAB;
