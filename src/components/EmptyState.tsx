import React from 'react';
import { Dog, Cat } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
  type?: 'health' | 'translation' | 'camera' | 'reminder' | 'device' | 'favorite' | 'history' | 'general';
}

const defaultIcon = (
  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
  </svg>
);

const typeDefaults: Record<string, { title: string; description: string }> = {
  health: { title: '暂无健康记录', description: '记录毛孩子的第一次体检，开启健康守护之旅' },
  translation: { title: '还没有翻译记录', description: '点击下方的录音按钮，听懂毛孩子的心声' },
  camera: { title: '暂无照片', description: '用镜头记录毛孩子的精彩瞬间' },
  reminder: { title: '暂无提醒', description: '设置疫苗、驱虫等提醒，做称职的铲屎官' },
  device: { title: '暂无设备连接', description: '连接智能设备，实时守护毛孩子' },
  favorite: { title: '暂无收藏', description: '收藏喜欢的内容，随时查看' },
  history: { title: '暂无历史记录', description: '使用功能后，历史记录会显示在这里' },
  general: { title: '这里空空如也', description: '开始探索，发现更多精彩内容' },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  className = '',
  type,
}) => {
  const typeDefault = type ? typeDefaults[type] : null;
  const displayTitle = title || typeDefault?.title || '暂无数据';
  const displayDescription = description || typeDefault?.description || '';

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-neutral-100 rounded-full blur-2xl opacity-60 scale-150" />
        <div className="relative w-24 h-24 bg-neutral-50 rounded-2xl flex items-center justify-center transform rotate-3 hover:rotate-0 transition-transform duration-300 border border-neutral-200">
          {icon || defaultIcon}
        </div>
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-300 rounded-full opacity-80 animate-pulse" />
        <div className="absolute -bottom-1 -left-3 w-4 h-4 bg-pink-300 rounded-full opacity-60 animate-bounce" style={{ animationDelay: '0.5s' }} />
      </div>

      <h3 className="text-lg font-bold text-gray-800 mb-2">
        {displayTitle}
      </h3>
      {displayDescription && (
        <p className="text-sm text-gray-500 max-w-xs mb-6 leading-relaxed">
          {displayDescription}
        </p>
      )}

      {onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2.5 rounded-full text-sm font-medium bg-neutral-100 text-neutral-700 hover:bg-neutral-200 active:scale-95 transition-all duration-200 flex items-center gap-2"
        >
          {actionText || '去探索'}
        </button>
      )}

      <div className="mt-8 flex items-center gap-2 text-xs text-gray-400">
        <Dog className="w-4 h-4" />
        <span>毛孩子正在等你哦~</span>
        <Cat className="w-4 h-4" />
      </div>
    </div>
  );
};

export default EmptyState;