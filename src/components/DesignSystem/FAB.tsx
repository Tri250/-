import React, { useState } from 'react';
import { Plus, X, Mic, Image, FileText, Video, File } from 'lucide-react';
import { RecordType } from '../../types/health-record';

interface FABProps {
  onAction: (type: RecordType) => void;
}

export const FAB: React.FC<FABProps> = ({ onAction }) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions: { type: RecordType; icon: React.ElementType; label: string; color: string }[] = [
    { type: 'text', icon: FileText, label: '文字记录', color: 'from-blue-500 to-blue-600' },
    { type: 'voice', icon: Mic, label: '语音记录', color: 'from-purple-500 to-purple-600' },
    { type: 'photo', icon: Image, label: '拍照记录', color: 'from-green-500 to-green-600' },
    { type: 'pdf', icon: File, label: 'PDF文档', color: 'from-orange-500 to-orange-600' },
    { type: 'video', icon: Video, label: '视频记录', color: 'from-red-500 to-red-600' },
  ];

  return (
    <div className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 z-50">
      {isOpen && (
        <div className="absolute bottom-14 sm:bottom-16 right-0 flex flex-col items-end gap-2 sm:gap-3 animate-slide-up">
          {actions.map((action, index) => (
            <button
              key={action.type}
              onClick={() => {
                onAction(action.type);
                setIsOpen(false);
              }}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 min-h-[44px]"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="text-xs sm:text-sm font-medium text-gray-700">{action.label}</span>
              <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${action.color} flex items-center justify-center shrink-0`}>
                <action.icon className="w-4 h-4 text-white" />
              </div>
            </button>
          ))}
        </div>
      )}
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 min-h-[56px] min-w-[56px] ${
          isOpen ? 'rotate-45' : ''
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Plus className="w-6 h-6 text-white" />
        )}
      </button>
    </div>
  );
};
