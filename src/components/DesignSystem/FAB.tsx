import React, { useState } from 'react';
import { Plus, X, Mic, Image, FileText, Video } from 'lucide-react';

interface FABProps {
  onAction: (type: 'text' | 'voice' | 'photo' | 'video' | 'file') => void;
}

export const FAB: React.FC<FABProps> = ({ onAction }) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { type: 'text', icon: FileText, label: '文字记录', color: 'from-blue-500 to-blue-600' },
    { type: 'voice', icon: Mic, label: '语音记录', color: 'from-purple-500 to-purple-600' },
    { type: 'photo', icon: Image, label: '拍照记录', color: 'from-green-500 to-green-600' },
    { type: 'video', icon: Video, label: '视频记录', color: 'from-red-500 to-red-600' },
  ];

  const handleAction = (type: 'text' | 'voice' | 'photo' | 'video') => {
    console.log('FAB action clicked:', type);
    onAction(type);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-24 right-4 md:right-6 z-50">
      {isOpen && (
        <div className="absolute bottom-16 right-0 flex flex-col items-end gap-2 md:gap-3 animate-slide-up">
          {actions.map((action, index) => (
            <button
              key={action.type}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAction(action.type);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="text-sm font-medium text-gray-700">{action.label}</span>
              <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${action.color} flex items-center justify-center shadow-md`}>
                <action.icon className="w-4 h-4 text-white" />
              </div>
            </button>
          ))}
        </div>
      )}
      
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('FAB toggle clicked');
          setIsOpen(!isOpen);
        }}
        className={`w-14 h-14 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 ${
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
