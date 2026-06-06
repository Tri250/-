import React from 'react';
import { Cat, Dog, Activity, Mic, Camera, FileText, Bell, Heart } from 'lucide-react';

interface EmptyStateProps {
  type: 'health' | 'translation' | 'camera' | 'reminder' | 'device' | 'favorite' | 'history' | 'general';
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

const emptyStateConfig = {
  health: {
    icon: Activity,
    title: '暂无健康记录',
    description: '记录毛孩子的第一次体检，开启健康守护之旅',
    actionText: '添加记录',
    color: 'text-green-500',
    bgColor: 'bg-green-50',
  },
  translation: {
    icon: Mic,
    title: '还没有翻译记录',
    description: '点击下方的录音按钮，听懂毛孩子的心声',
    actionText: '开始翻译',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
  },
  camera: {
    icon: Camera,
    title: '暂无照片',
    description: '用镜头记录毛孩子的精彩瞬间',
    actionText: '拍照记录',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  reminder: {
    icon: Bell,
    title: '暂无提醒',
    description: '设置疫苗、驱虫等提醒，做称职的铲屎官',
    actionText: '添加提醒',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
  },
  device: {
    icon: Cat,
    title: '暂无设备连接',
    description: '连接智能设备，实时守护毛孩子',
    actionText: '添加设备',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
  },
  favorite: {
    icon: Heart,
    title: '暂无收藏',
    description: '收藏喜欢的内容，随时查看',
    actionText: '去逛逛',
    color: 'text-red-500',
    bgColor: 'bg-red-50',
  },
  history: {
    icon: FileText,
    title: '暂无历史记录',
    description: '使用功能后，历史记录会显示在这里',
    actionText: '开始使用',
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
  },
  general: {
    icon: Dog,
    title: '这里空空如也',
    description: '开始探索，发现更多精彩内容',
    actionText: '去探索',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  actionText,
  onAction,
  className = '',
}) => {
  const config = emptyStateConfig[type];
  const Icon = config.icon;

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
      {/* 插画区域 */}
      <div className="relative mb-6">
        {/* 背景装饰 */}
        <div className={`absolute inset-0 ${config.bgColor} rounded-full blur-2xl opacity-60 scale-150`} />
        
        {/* 主图标 */}
        <div className={`relative w-24 h-24 ${config.bgColor} rounded-2xl flex items-center justify-center transform rotate-3 hover:rotate-0 transition-transform duration-300`}>
          <Icon className={`w-12 h-12 ${config.color}`} />
        </div>
        
        {/* 装饰元素 */}
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-300 rounded-full opacity-80 animate-pulse" />
        <div className="absolute -bottom-1 -left-3 w-4 h-4 bg-pink-300 rounded-full opacity-60 animate-bounce" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* 文字内容 */}
      <h3 className="text-lg font-bold text-gray-800 mb-2">
        {title || config.title}
      </h3>
      <p className="text-sm text-gray-500 max-w-xs mb-6 leading-relaxed">
        {description || config.description}
      </p>

      {/* 操作按钮 */}
      {onAction && (
        <button
          onClick={onAction}
          className={`
            px-6 py-2.5 rounded-full text-sm font-medium
            ${config.bgColor} ${config.color}
            hover:opacity-80 active:scale-95
            transition-all duration-200
            flex items-center gap-2
          `}
        >
          {actionText || config.actionText}
        </button>
      )}

      {/* 底部提示 */}
      <div className="mt-8 flex items-center gap-2 text-xs text-gray-400">
        <Dog className="w-4 h-4" />
        <span>毛孩子正在等你哦~</span>
        <Cat className="w-4 h-4" />
      </div>
    </div>
  );
};

export default EmptyState;
