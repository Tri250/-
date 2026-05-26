import { Clock, Share2, RefreshCw } from 'lucide-react';
import type { EmotionAnalysis } from '../../types/emotion';

interface EmotionCardProps {
  analysis: EmotionAnalysis;
  onShare?: () => void;
  onRetry?: () => void;
  showActions?: boolean;
}

const emotionConfig: Record<string, { emoji: string; label: string; color: string; bgColor: string }> = {
  happy: { emoji: '😸', label: '开心', color: 'text-green-500', bgColor: 'bg-green-50' },
  curious: { emoji: '🤔', label: '好奇', color: 'text-purple-500', bgColor: 'bg-purple-50' },
  anxious: { emoji: '😰', label: '焦虑', color: 'text-yellow-500', bgColor: 'bg-yellow-50' },
  angry: { emoji: '😾', label: '生气', color: 'text-red-500', bgColor: 'bg-red-50' },
  needs: { emoji: '🥺', label: '有需求', color: 'text-blue-500', bgColor: 'bg-blue-50' },
  calm: { emoji: '😌', label: '平静', color: 'text-gray-500', bgColor: 'bg-gray-50' },
  excited: { emoji: '🎉', label: '兴奋', color: 'text-pink-500', bgColor: 'bg-pink-50' },
  safe: { emoji: '😊', label: '安心', color: 'text-teal-500', bgColor: 'bg-teal-50' },
};

export function EmotionCard({ analysis, onShare, onRetry, showActions = true }: EmotionCardProps) {
  const config = emotionConfig[analysis.primaryEmotion] || emotionConfig.calm;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${config.bgColor} ${config.color}`}>
            <span className="text-xl">{config.emoji}</span>
            <span>{config.label}</span>
          </span>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{analysis.context.timeContext}</span>
          </div>
        </div>
        
        <div className="text-xs text-gray-400">
          <span>置信度: {analysis.confidence}%</span>
        </div>
      </div>

      <div className="relative bg-gradient-to-br from-orange-50 to-peach-50 rounded-xl p-4 mb-4">
        <div className="absolute -top-2 left-4 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-orange-50" />
        <p className="text-gray-700 text-center leading-relaxed font-medium">
          "{analysis.translation}"
        </p>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>情感强度</span>
          <span>{analysis.intensity}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${config.color.replace('text-', 'bg-')}`}
            style={{ width: `${analysis.intensity}%` }}
          />
        </div>
      </div>

      {analysis.subEmotions.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">次要情感</p>
          <div className="flex flex-wrap gap-2">
            {analysis.subEmotions.map((sub, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-600"
              >
                {sub}
              </span>
            ))}
          </div>
        </div>
      )}

      {showActions && (
        <div className="flex justify-center gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm font-medium">再录一次</span>
            </button>
          )}
          {onShare && (
            <button
              onClick={onShare}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-sm font-medium">分享</span>
            </button>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>来源: {analysis.source === 'voice' ? '🎤 声音' : analysis.source === 'image' ? '📷 图像' : '📹 行为'}</span>
          <span>{new Date(analysis.createdAt).toLocaleString('zh-CN')}</span>
        </div>
      </div>
    </div>
  );
}
