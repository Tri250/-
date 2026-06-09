// ============================================
// PawSync Pro - DimensionCards.tsx
// 
// 描述: 五维度分析卡片组件
// ============================================

import React from 'react';
import { Activity, Music2, Volume2, Radio, Drum, Palette } from 'lucide-react';

/**
 * 维度配置接口
 */
export interface DimensionConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
  textColor: string;
  description: string;
}

/**
 * 五维度配置列表
 */
export const DIMENSION_CONFIGS: DimensionConfig[] = [
  {
    id: 'pitch',
    name: '音调分析',
    icon: <Music2 className="w-5 h-5" />,
    gradient: 'from-purple-500 to-violet-600',
    iconBg: 'bg-purple-500',
    textColor: 'text-purple-600',
    description: '分析声音频率高低变化',
  },
  {
    id: 'intensity',
    name: '强度检测',
    icon: <Volume2 className="w-5 h-5" />,
    gradient: 'from-orange-500 to-amber-600',
    iconBg: 'bg-orange-500',
    textColor: 'text-orange-600',
    description: '检测声音强度与能量',
  },
  {
    id: 'frequency',
    name: '频率识别',
    icon: <Radio className="w-5 h-5" />,
    gradient: 'from-blue-500 to-cyan-600',
    iconBg: 'bg-blue-500',
    textColor: 'text-blue-600',
    description: '识别声波频率特征',
  },
  {
    id: 'rhythm',
    name: '节奏分析',
    icon: <Drum className="w-5 h-5" />,
    gradient: 'from-green-500 to-emerald-600',
    iconBg: 'bg-green-500',
    textColor: 'text-green-600',
    description: '分析声音节奏规律',
  },
  {
    id: 'timbre',
    name: '音色特征',
    icon: <Palette className="w-5 h-5" />,
    gradient: 'from-pink-500 to-rose-600',
    iconBg: 'bg-pink-500',
    textColor: 'text-pink-600',
    description: '识别声音独特品质',
  },
];

/**
 * 单个维度卡片属性
 */
export interface AnalysisDimensionCardProps {
  dimension: DimensionConfig;
  isActive?: boolean;
  showAnimation?: boolean;
  className?: string;
}

/**
 * 单个维度卡片组件
 */
export function AnalysisDimensionCard({
  dimension,
  isActive = false,
  showAnimation = false,
  className = '',
}: AnalysisDimensionCardProps) {
  return (
    <div
      className={`
        relative overflow-hidden rounded-xl p-3
        bg-gradient-to-br ${dimension.gradient} bg-opacity-10
        border border-white/50 shadow-sm
        transition-all duration-300 ease-out
        hover:shadow-md hover:scale-[1.02]
        ${isActive ? 'ring-2 ring-offset-2 ring-offset-white' : ''}
        ${className}
      `}
    >
      {/* 背景渐变 */}
      <div className={`absolute inset-0 bg-gradient-to-br ${dimension.gradient} opacity-10`} />

      {/* 动画脉冲效果 */}
      {showAnimation && (
        <div className={`absolute inset-0 bg-gradient-to-br ${dimension.gradient} opacity-20 animate-pulse`} />
      )}

      {/* 内容 */}
      <div className="relative z-10">
        {/* 图标和名称 */}
        <div className="flex items-center gap-2 mb-2">
          <div className={`
            p-1.5 rounded-lg ${dimension.iconBg} text-white
            shadow-sm transition-transform duration-300
            ${showAnimation ? 'animate-bounce' : ''}
          `}>
            {dimension.icon}
          </div>
          <span className={`text-sm font-semibold ${dimension.textColor}`}>
            {dimension.name}
          </span>
        </div>

        {/* 进度条 */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">分析中...</span>
            <span className={`text-xs font-medium ${dimension.textColor}`}>
              {showAnimation ? '活跃' : '就绪'}
            </span>
          </div>
          <div className="h-1.5 bg-white/50 rounded-full overflow-hidden">
            <div
              className={`
                h-full rounded-full bg-gradient-to-r ${dimension.gradient}
                transition-all duration-500 ease-out
                ${showAnimation ? 'animate-pulse' : ''}
              `}
              style={{ width: showAnimation ? '100%' : '30%' }}
            />
          </div>
        </div>
      </div>

      {/* 活跃指示器 */}
      {isActive && (
        <div className="absolute top-2 right-2">
          <div className={`w-2 h-2 rounded-full ${dimension.iconBg} animate-ping`} />
        </div>
      )}
    </div>
  );
}

/**
 * 维度网格属性
 */
export interface AnalysisDimensionsGridProps {
  isActive?: boolean;
  className?: string;
}

/**
 * 维度网格组件
 * 显示所有五个分析维度
 */
export function AnalysisDimensionsGrid({ isActive = false, className = '' }: AnalysisDimensionsGridProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* 标题 */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 text-white">
          <Activity className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-semibold text-gray-700">分析维度</h3>
        {isActive && (
          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full animate-pulse">
            分析中
          </span>
        )}
      </div>

      {/* 响应式网格: 2列(移动端) -> 3列(sm) -> 5列(lg) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {DIMENSION_CONFIGS.map((dimension) => (
          <AnalysisDimensionCard
            key={dimension.id}
            dimension={dimension}
            isActive={isActive}
            showAnimation={isActive}
          />
        ))}
      </div>

      {/* 说明文字 */}
      <p className="text-xs text-gray-400 text-center mt-2">
        AI将综合分析以上维度，确保95%+准确率
      </p>
    </div>
  );
}