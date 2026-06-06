import React, { useState, useRef, useEffect } from 'react';
import { Mic, Camera, Plus, Bell, Stethoscope, X } from 'lucide-react';
import { HapticsService } from '@/lib/platformService';

interface FloatingActionButtonProps {
  className?: string;
  onNavigate?: (page: string) => void;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ className, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // 初始化位置（右下角）
  useEffect(() => {
    const updatePosition = () => {
      const margin = 20;
      setPosition({
        x: window.innerWidth - 72 - margin,
        y: window.innerHeight - 160 - margin
      });
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, []);

  // 拖拽处理
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    dragStartRef.current = {
      x: clientX - position.x,
      y: clientY - position.y
    };
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const deltaX = Math.abs(clientX - dragStartRef.current.x - position.x);
    const deltaY = Math.abs(clientY - dragStartRef.current.y - position.y);
    
    if (deltaX > 5 || deltaY > 5) {
      setIsDragging(true);
    }

    const newX = Math.max(0, Math.min(window.innerWidth - 72, clientX - dragStartRef.current.x));
    const newY = Math.max(80, Math.min(window.innerHeight - 160, clientY - dragStartRef.current.y));
    
    setPosition({ x: newX, y: newY });
  };

  const handleTouchEnd = () => {
    // 吸附到边缘
    const centerX = position.x + 36;
    const targetX = centerX < window.innerWidth / 2 ? 20 : window.innerWidth - 72 - 20;
    
    setPosition(prev => ({ ...prev, x: targetX }));
  };

  const handleMainClick = () => {
    if (isDragging) return;
    
    HapticsService.light();
    setIsOpen(!isOpen);
  };

  const handleAction = (action: string) => {
    HapticsService.medium();
    setIsOpen(false);
    
    if (onNavigate) {
      switch (action) {
        case 'translate':
          onNavigate('translator');
          break;
        case 'camera':
          onNavigate('camera');
          break;
        case 'health':
          onNavigate('health');
          break;
        case 'reminder':
          onNavigate('reminders');
          break;
      }
    }
  };

  const actions = [
    { id: 'translate', icon: Mic, label: '翻译', color: 'bg-orange-500' },
    { id: 'camera', icon: Camera, label: '拍照', color: 'bg-blue-500' },
    { id: 'health', icon: Stethoscope, label: '健康', color: 'bg-green-500' },
    { id: 'reminder', icon: Bell, label: '提醒', color: 'bg-purple-500' },
  ];

  return (
    <div
      ref={containerRef}
      className={`fixed z-50 ${className}`}
      style={{
        left: position.x,
        top: position.y,
        touchAction: 'none'
      }}
    >
      {/* 展开的菜单 */}
      {isOpen && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col gap-3 items-center animate-in fade-in slide-in-from-bottom-4 duration-200">
          {actions.map((action, index) => (
            <button
              key={action.id}
              onClick={() => handleAction(action.id)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-full shadow-lg
                ${action.color} text-white
                active:scale-95 transition-all duration-200
                animate-in fade-in slide-in-from-bottom-2
              `}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <action.icon className="w-4 h-4" />
              <span className="text-sm font-medium whitespace-nowrap">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* 主按钮 */}
      <div
        ref={buttonRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onClick={handleMainClick}
        className={`
          w-14 h-14 rounded-full shadow-2xl cursor-pointer
          flex items-center justify-center
          transition-all duration-300 ease-out
          ${isOpen ? 'bg-red-500 rotate-45' : 'bg-gradient-to-br from-orange-400 to-orange-500'}
          active:scale-90 hover:scale-105
        `}
        style={{
          boxShadow: isOpen 
            ? '0 4px 20px rgba(239, 68, 68, 0.4)' 
            : '0 4px 20px rgba(249, 115, 22, 0.4)'
        }}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Plus className="w-6 h-6 text-white" />
        )}
      </div>

      {/* 提示文字 */}
      {!isOpen && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="text-xs text-gray-500 bg-white/80 px-2 py-1 rounded-full shadow-sm">
            快捷操作
          </span>
        </div>
      )}
    </div>
  );
};

export default FloatingActionButton;
