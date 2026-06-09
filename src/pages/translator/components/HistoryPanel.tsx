// ============================================
// PawSync Pro - HistoryPanel.tsx
// 
// 描述: 历史记录面板组件
// ============================================

import React, { useState } from 'react';
import { History, Clock, X, ChevronRight } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { EmotionMeter } from './EmotionMeter';
import { EMOTION_CONFIGS } from '../../../types/emotion';
import type { PrimaryEmotion } from '../../../types/emotion';
import type { Analysis } from '../../../store/appStore';

/**
 * 组件属性
 */
export interface HistoryPanelProps {
  analyses: Analysis[];
  currentPetId: string;
  onSelectItem?: (analysis: Analysis) => void;
  onClose?: () => void;
  className?: string;
}

/**
 * 获取Badge颜色
 */
function getBadgeColor(emotion: string): 'green' | 'purple' | 'yellow' | 'red' | 'blue' | 'gray' | 'pink' | 'teal' {
  const colorMap: Record<string, 'green' | 'purple' | 'yellow' | 'red' | 'blue' | 'gray' | 'pink' | 'teal'> = {
    happy: 'green',
    curious: 'purple',
    anxious: 'yellow',
    angry: 'red',
    needs: 'blue',
    calm: 'gray',
    excited: 'pink',
    safe: 'teal',
    neutral: 'gray',
  };
  return colorMap[emotion] || 'gray';
}

/**
 * 历史记录面板组件
 * 显示分析历史记录列表和详情
 */
export function HistoryPanel({
  analyses,
  currentPetId,
  onSelectItem,
  onClose,
  className = '',
}: HistoryPanelProps) {
  // 状态
  const [selectedItem, setSelectedItem] = useState<Analysis | null>(null);

  // 过滤当前宠物的分析记录
  const filteredAnalyses = analyses
    .filter((a) => a.petId === currentPetId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);

  // 处理选择
  const handleSelect = (analysis: Analysis) => {
    setSelectedItem(analysis);
    onSelectItem?.(analysis);
  };

  // 返回列表
  const handleBack = () => {
    setSelectedItem(null);
  };

  return (
    <div className={`bg-white rounded-2xl p-6 shadow-2xl animate-fadeIn max-h-[80vh] overflow-hidden flex flex-col ${className}`}>
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <History className="w-5 h-5 text-orange-500" />
          分析历史
        </h3>
        <button
          onClick={() => {
            onClose?.();
            setSelectedItem(null);
          }}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* 详情视图 */}
      {selectedItem ? (
        <div className="space-y-4 overflow-y-auto flex-1">
          {/* 情感卡片 */}
          <div className="bg-gradient-to-r from-orange-50 to-peach-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Badge color={getBadgeColor(selectedItem.result.emotion)} size="medium">
                {EMOTION_CONFIGS[selectedItem.result.emotion as PrimaryEmotion]?.emoji || '😊'}
                {EMOTION_CONFIGS[selectedItem.result.emotion as PrimaryEmotion]?.label || '平静'}
              </Badge>
              {selectedItem.result.confidence >= 95 && (
                <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                  95%+
                </span>
              )}
            </div>
            <p className="text-gray-700 text-center text-base leading-relaxed font-medium mt-3">
              "{selectedItem.result.translation}"
            </p>
          </div>

          {/* 时间和类型 */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(selectedItem.createdAt).toLocaleString('zh-CN')}
              </span>
              <span className="flex items-center gap-1">
                {selectedItem.type === 'voice' ? '🎤 语音' : '📷 图片'}
              </span>
            </div>
          </div>

          {/* 置信度 */}
          <div className="flex items-center justify-between">
            <EmotionMeter confidence={selectedItem.result.confidence} />
          </div>

          {/* 返回按钮 */}
          <Button
            variant="secondary"
            size="small"
            onClick={handleBack}
            className="w-full"
          >
            返回列表
          </Button>
        </div>
      ) : (
        /* 列表视图 */
        <div className="space-y-2 overflow-y-auto flex-1">
          {filteredAnalyses.length === 0 ? (
            <div className="text-center py-8">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">暂无分析记录</p>
              <p className="text-gray-400 text-xs mt-1">开始录音或拍照分析吧</p>
            </div>
          ) : (
            filteredAnalyses.map((analysis) => (
              <button
                key={analysis.id}
                onClick={() => handleSelect(analysis)}
                className="w-full p-3 bg-gray-50 hover:bg-orange-50 rounded-xl transition-colors flex items-center gap-3"
              >
                {/* 情感图标 */}
                <div className="text-2xl">
                  {EMOTION_CONFIGS[analysis.result.emotion as PrimaryEmotion]?.emoji || '😊'}
                </div>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    "{analysis.result.translation}"
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(analysis.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                    <span className="text-xs text-gray-400">
                      {analysis.type === 'voice' ? '🎤' : '📷'}
                    </span>
                  </div>
                </div>

                {/* 置信度和箭头 */}
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${
                    analysis.result.confidence >= 95 ? 'text-green-500' : 'text-gray-500'
                  }`}>
                    {analysis.result.confidence}%
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}