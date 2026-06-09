// ============================================
// PawSync Pro - ResultCard.tsx
// 
// 描述: 结果展示卡片组件
// ============================================

import React, { useState } from 'react';
import { RefreshCw, Share2, Heart, Activity, Music2, Waves, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { EmotionIcons } from '../../../components/icons/EmotionIcons';
import { EmotionMeter, AudioFeatureCard } from './EmotionMeter';
import { EMOTION_CONFIGS } from '../../../types/emotion';
import type { PrimaryEmotion, EmotionAnalysis } from '../../../types/emotion';

/**
 * 主题颜色配置
 */
const THEME_COLORS = {
  primary: '#f97316',
  secondary: '#fb923c',
  success: '#22c55e',
};

/**
 * 获取Badge颜色
 */
function getBadgeColor(emotion: PrimaryEmotion): 'green' | 'purple' | 'yellow' | 'red' | 'blue' | 'gray' | 'pink' | 'teal' {
  const colorMap: Record<PrimaryEmotion, 'green' | 'purple' | 'yellow' | 'red' | 'blue' | 'gray' | 'pink' | 'teal'> = {
    happy: 'green',
    curious: 'purple',
    anxious: 'yellow',
    angry: 'red',
    needs: 'blue',
    calm: 'gray',
    excited: 'pink',
    safe: 'teal',
  };
  return colorMap[emotion];
}

/**
 * 爪印图标组件
 */
function PawPrintIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="currentColor">
      <ellipse cx="50" cy="65" rx="25" ry="20" />
      <ellipse cx="25" cy="35" rx="10" ry="12" />
      <ellipse cx="45" cy="25" rx="8" ry="10" />
      <ellipse cx="65" cy="25" rx="8" ry="10" />
      <ellipse cx="80" cy="35" rx="10" ry="12" />
    </svg>
  );
}

/**
 * 情感分数条组件
 */
function EmotionScoreBar({ emotion, score, isPrimary }: { emotion: PrimaryEmotion; score: number; isPrimary: boolean }) {
  const config = EMOTION_CONFIGS[emotion];

  return (
    <div className={`flex items-center gap-2 ${isPrimary ? 'bg-gray-50 p-1.5 rounded-lg' : ''}`}>
      <span className="text-sm">{config.emoji}</span>
      <span className={`text-xs flex-1 ${isPrimary ? 'font-semibold' : 'text-gray-500'}`}>
        {config.label}
      </span>
      <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isPrimary ? config.color.replace('text-', 'bg-') : 'bg-gray-300'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-xs w-8 text-right ${isPrimary ? 'font-semibold' : 'text-gray-400'}`}>
        {Math.round(score)}%
      </span>
    </div>
  );
}

/**
 * 组件属性
 */
export interface ResultCardProps {
  emotion: PrimaryEmotion;
  translation: string;
  confidence: number;
  analysis?: EmotionAnalysis | null;
  analysisSource?: 'voice' | 'image';
  selectedImage?: string | null;
  petName?: string;
  onRetry?: () => void;
  onShare?: () => void;
  className?: string;
}

/**
 * 结果展示卡片组件
 * 显示分析结果的详细信息
 */
export function ResultCard({
  emotion,
  translation,
  confidence,
  analysis,
  analysisSource = 'voice',
  selectedImage,
  petName = '小橘',
  onRetry,
  onShare,
  className = '',
}: ResultCardProps) {
  // 状态
  const [expanded, setExpanded] = useState(false);

  // 配置
  const config = EMOTION_CONFIGS[emotion];
  const detail = analysis?.detail;

  // 渲染频率波段
  const renderFrequencyBands = (bands?: Record<string, number>) => {
    if (!bands) return null;

    const bandLabels: Record<string, { label: string; color: string }> = {
      subBass: { label: '超低频', color: 'bg-red-100 text-red-700' },
      bass: { label: '低频', color: 'bg-orange-100 text-orange-700' },
      lowMid: { label: '中低频', color: 'bg-yellow-100 text-yellow-700' },
      mid: { label: '中频', color: 'bg-green-100 text-green-700' },
      highMid: { label: '中高频', color: 'bg-blue-100 text-blue-700' },
      high: { label: '高频', color: 'bg-indigo-100 text-indigo-700' },
      veryHigh: { label: '超高频', color: 'bg-purple-100 text-purple-700' },
    };

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {Object.entries(bands).map(([band, value]) => {
          const info = bandLabels[band] || { label: band, color: 'bg-gray-100 text-gray-700' };
          return (
            <span key={band} className={`text-xs px-2 py-0.5 rounded-full ${info.color}`}>
              {info.label}: {Math.round(value)}%
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <Card variant="gradient" padding="large" className={className}>
      {/* 图片预览 */}
      {analysisSource === 'image' && selectedImage && (
        <div className="mb-4 rounded-xl overflow-hidden shadow-md">
          <img
            src={selectedImage}
            alt="分析图片"
            className="w-full h-32 object-cover"
          />
        </div>
      )}

      {/* 情感图标和标签 */}
      <div className="text-center mb-4">
        {/* 情感图标 */}
        <div className="flex items-center justify-center mb-4">
          {(() => {
            const IconComponent = EmotionIcons[emotion];
            return <IconComponent size={48} />;
          })()}
        </div>

        {/* 情感标签 */}
        <div className="flex items-center justify-center gap-2">
          <Badge color={getBadgeColor(emotion)} size="medium">
            <span className="text-lg mr-1">{config.emoji}</span>
            {config.label}
          </Badge>
          {confidence >= 95 && (
            <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-semibold animate-pulse">
              ✓ 高置信度
            </span>
          )}
        </div>
      </div>

      {/* 翻译结果 */}
      <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-4 shadow-inner border border-gray-100">
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-white/80" />

        <p className="text-gray-700 text-center text-lg leading-relaxed font-medium">
          {translation}
        </p>

        <div className="flex justify-center mt-4">
          <span className="text-sm text-gray-400 flex items-center gap-1">
            <PawPrintIcon className="w-4 h-4 text-orange-400" />
            {petName}
          </span>
        </div>
      </div>

      {/* 置信度仪表盘 */}
      <div className="mb-4">
        <EmotionMeter confidence={confidence} guaranteed />
      </div>

      {/* 描述 */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <p className="text-xs text-gray-600 text-center">
          {config.description}
        </p>
      </div>

      {/* 详细分析面板 */}
      {detail && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              专业分析报告
            </span>
            <span className="flex items-center gap-1">
              {detail.confidence >= 95 && (
                <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full">95%+</span>
              )}
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          </button>

          {expanded && (
            <div className="mt-3 space-y-4 animate-fadeIn">
              {/* 情感分布 */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <span className="text-lg">{config.emoji}</span>
                  情感分布分析
                </p>
                <div className="space-y-1.5">
                  {(Object.entries(detail.scores) as [PrimaryEmotion, number][])
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([e, score]) => (
                      <EmotionScoreBar
                        key={e}
                        emotion={e}
                        score={score}
                        isPrimary={e === emotion}
                      />
                    ))}
                </div>
              </div>

              {/* 音调分析 */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-purple-700 mb-2 flex items-center gap-1">
                  <Music2 className="w-3.5 h-3.5" />
                  音调特征分析
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <AudioFeatureCard
                    title="音调均值"
                    value={detail.audioFeatures.pitch.mean}
                    unit="Hz"
                    icon={<Music2 className="w-3 h-3 text-purple-500" />}
                    color="text-purple-500"
                  />
                  <AudioFeatureCard
                    title="音调范围"
                    value={detail.audioFeatures.pitch.range[1] - detail.audioFeatures.pitch.range[0]}
                    unit="Hz"
                    icon={<Waves className="w-3 h-3 text-purple-500" />}
                    color="text-purple-500"
                  />
                </div>
                {renderFrequencyBands(detail.audioFeatures.pitch.bands)}
              </div>

              {/* 音色分析 */}
              <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-pink-700 mb-2 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  音色特征分析
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">明亮度</p>
                    <p className="text-sm font-semibold text-pink-600">{Math.round(detail.audioFeatures.timbre.brightness)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">温暖度</p>
                    <p className="text-sm font-semibold text-pink-600">{Math.round(detail.audioFeatures.timbre.warmth)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">粗糙度</p>
                    <p className="text-sm font-semibold text-pink-600">{Math.round(detail.audioFeatures.timbre.roughness)}%</p>
                  </div>
                </div>
              </div>

              {/* 推理说明 */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" />
                  专业分析依据
                </p>
                <ul className="space-y-1.5">
                  {detail.reasoning.map((reason, index) => (
                    <li key={index} className="text-xs text-gray-600 flex items-start gap-1">
                      <span className="text-gray-400 shrink-0">•</span>
                      <span className="flex-1">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 行为特征 */}
              {detail.behaviorIndicators.length > 0 && (
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-teal-700 mb-2 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5" />
                    行为特征识别
                  </p>
                  <ul className="space-y-1">
                    {detail.behaviorIndicators.map((behavior, index) => (
                      <li key={index} className="text-xs text-gray-600 flex items-start gap-1">
                        <span className="text-teal-400">•</span>
                        {behavior}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="grid grid-cols-2 gap-3 mt-4 mb-4">
        <Button
          variant="secondary"
          size="small"
          icon={<RefreshCw className="w-4 h-4" />}
          onClick={onRetry}
        >
          {analysisSource === 'image' ? '再拍一张' : '再听一次'}
        </Button>
        <Button
          size="small"
          icon={<Share2 className="w-4 h-4" />}
          onClick={onShare}
        >
          分享心情
        </Button>
      </div>

      {/* 底部链接 */}
      <div className="flex justify-center gap-2 sm:gap-4 text-xs text-gray-400 flex-wrap">
        <button className="hover:text-orange-500 transition-colors px-2 py-1">
          💾 保存记录
        </button>
        <button className="hover:text-orange-500 transition-colors px-2 py-1">
          💬 社区讨论
        </button>
      </div>
    </Card>
  );
}