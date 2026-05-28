import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, X, Mic, Image, FileText, Video, Bot, Calendar, PawPrint, Search, ChevronRight, Edit3, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickMenuAction {
  id: string;
  icon: React.ElementType;
  label: string;
  color: string;
  gradient: string;
}

interface FABProps {
  onAction: (type: 'text' | 'voice' | 'photo' | 'video' | 'file') => void;
  onAIClick?: () => void;
  onReminderClick?: () => void;
  onPetSwitch?: () => void;
  onSearch?: () => void;
  onPetAdd?: () => void;
}

export const FAB: React.FC<FABProps> = ({ 
  onAction, 
  onAIClick,
  onReminderClick,
  onPetSwitch,
  onSearch,
  onPetAdd
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 24, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const fabPosition = useRef({ x: 0, y: 0 });

  const recordActions: QuickMenuAction[] = [
    { id: 'text', icon: FileText, label: '文字记录', color: 'text-blue-600', gradient: 'from-blue-500 to-blue-600' },
    { id: 'voice', icon: Mic, label: '语音记录', color: 'text-purple-600', gradient: 'from-purple-500 to-purple-600' },
    { id: 'photo', icon: Image, label: '拍照记录', color: 'text-green-600', gradient: 'from-green-500 to-green-600' },
    { id: 'video', icon: Video, label: '视频记录', color: 'text-red-600', gradient: 'from-red-500 to-red-600' },
  ];

  const quickMenuActions: QuickMenuAction[] = [
    { id: 'ai', icon: Bot, label: 'AI健康咨询', color: 'text-indigo-600', gradient: 'from-indigo-500 to-purple-500' },
    { id: 'reminder', icon: Calendar, label: '查看提醒', color: 'text-amber-600', gradient: 'from-amber-500 to-orange-500' },
    { id: 'pet', icon: PawPrint, label: '切换宠物', color: 'text-rose-600', gradient: 'from-rose-500 to-pink-500' },
    { id: 'search', icon: Search, label: '搜索', color: 'text-cyan-600', gradient: 'from-cyan-500 to-blue-500' },
  ];

  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStart.current = { x: clientX, y: clientY };
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaX = clientX - dragStart.current.x;
    const deltaY = clientY - dragStart.current.y;
    
    const newX = Math.max(24, Math.min(window.innerWidth - 56, fabPosition.current.x + deltaX));
    const newY = Math.max(100, Math.min(window.innerHeight - 150, fabPosition.current.y + deltaY));
    
    setPosition({ x: window.innerWidth - newX - 56, y: newY });
    dragStart.current = { x: clientX, y: clientY };
    fabPosition.current = { x: newX, y: newY };
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const screenWidth = window.innerWidth;
    const fabCenterX = position.x + 28;
    
    if (fabCenterX < screenWidth / 2) {
      setPosition(prev => ({ ...prev, x: 24 }));
      fabPosition.current = { x: 24, y: fabPosition.current.y };
    } else {
      setPosition(prev => ({ ...prev, x: 24 }));
      fabPosition.current = { x: screenWidth - 80, y: fabPosition.current.y };
    }
  }, [isDragging, position.x]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleActionClick = (actionId: string) => {
    setIsOpen(false);
    switch (actionId) {
      case 'ai':
        onAIClick?.();
        break;
      case 'reminder':
        onReminderClick?.();
        break;
      case 'pet':
        onPetSwitch?.();
        break;
      case 'search':
        onSearch?.();
        break;
      default:
        onAction(actionId as 'text' | 'voice' | 'photo' | 'video' | 'file');
    }
  };

  return (
    <div 
      ref={fabRef}
      className="fixed z-50 select-none"
      style={{ 
        bottom: position.y > 0 ? `${window.innerHeight - position.y - 56}px` : '96px',
        right: `${position.x}px`,
        touchAction: 'none'
      }}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-20 right-0 flex flex-col items-end gap-3"
          >
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-neutral-100 p-3 space-y-2 min-w-[180px]">
              <div className="text-xs font-medium text-neutral-400 px-2 py-1 mb-1">快捷操作</div>
              {quickMenuActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleActionClick(action.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-50 active:bg-neutral-100 transition-all"
                  >
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-sm`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="flex-1 text-sm font-medium text-neutral-700 text-left">{action.label}</span>
                    <ChevronRight className="w-4 h-4 text-neutral-300" />
                  </motion.button>
                );
              })}
            </div>

            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-neutral-100 p-3 space-y-2 min-w-[180px]">
              <div className="text-xs font-medium text-neutral-400 px-2 py-1 mb-1">添加记录</div>
              {recordActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    onClick={() => handleActionClick(action.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-50 active:bg-neutral-100 transition-all"
                  >
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-sm`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="flex-1 text-sm font-medium text-neutral-700 text-left">{action.label}</span>
                    <ChevronRight className="w-4 h-4 text-neutral-300" />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.button
        ref={fabRef}
        onClick={() => !isDragging && setIsOpen(!isOpen)}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        whileTap={{ scale: 0.95 }}
        className={`w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 ${
          isOpen ? 'rotate-45' : ''
        } ${isDragging ? 'opacity-80' : ''}`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Plus className="w-6 h-6 text-white" />
        )}
      </motion.button>
    </div>
  );
};

interface LongPressMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  actions: {
    id: string;
    label: string;
    icon: React.ElementType;
    variant?: 'default' | 'danger';
  }[];
  onAction: (id: string) => void;
}

export const LongPressMenu: React.FC<LongPressMenuProps> = ({
  isOpen,
  position,
  onClose,
  actions,
  onAction
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: position.y - 10 }}
            animate={{ opacity: 1, scale: 1, y: position.y }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            style={{ 
              position: 'fixed', 
              left: Math.min(position.x, window.innerWidth - 200),
              top: position.y,
              zIndex: 50
            }}
            className="bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-neutral-100 p-2 min-w-[160px]"
          >
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => {
                    onAction(action.id);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-neutral-50 transition-colors ${
                    action.variant === 'danger' ? 'text-red-600' : 'text-neutral-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{action.label}</span>
                </button>
              );
            })}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  placeholder?: string;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  isOpen,
  onClose,
  onSearch,
  placeholder = '搜索宠物、健康记录、提醒...'
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed inset-x-4 top-4 z-50 max-w-2xl mx-auto"
        >
          <form onSubmit={handleSubmit} className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-neutral-400" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full h-14 pl-12 pr-12 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="button"
              onClick={onClose}
              className="absolute inset-y-0 right-4 flex items-center text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-5 h-5" />
            </button>
          </form>
          
          <div className="mt-2 bg-white/95 backdrop-blur-xl rounded-xl shadow-lg border border-neutral-100 p-2">
            <div className="text-xs text-neutral-400 px-3 py-2">
              按 Enter 搜索，ESC 关闭
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  className = ''
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling.current) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    if (diff > 0) {
      e.preventDefault();
      setPullDistance(Math.min(diff * 0.5, 100));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
    isPulling.current = false;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={className}
    >
      <div
        className="flex items-center justify-center transition-all duration-200"
        style={{ 
          height: pullDistance > 0 ? pullDistance : isRefreshing ? 60 : 0,
          overflow: 'hidden'
        }}
      >
        {isRefreshing ? (
          <div className="flex items-center gap-2 text-primary-500">
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">刷新中...</span>
          </div>
        ) : pullDistance > 0 ? (
          <div className="flex items-center gap-2 text-neutral-500">
            <div className="w-5 h-5 border-2 border-neutral-300 border-t-transparent rounded-full" />
            <span className="text-sm">下拉刷新</span>
          </div>
        ) : null}
      </div>
      {children}
    </div>
  );
};

export default FAB;
