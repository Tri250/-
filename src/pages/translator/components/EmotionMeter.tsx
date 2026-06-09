// ============================================
// PawSync Pro - EmotionMeter.tsx
// 
// 描述: 置信度仪表盘组件
// ============================================

import React, { useState, useEffect } from 'react';

/**
 * 主题颜色配置
 */
const THEME_COLORS = {
  primary: '#f97316',      // orange-500
  secondary: '#fb923c',    // orange-400
  tertiary: '#fdba74',     // orange-300
  success: '#22c55e',      // green-500
  background: '#f8fafc',   // light gray
};

/**
 * 组件属性
 */
export interface EmotionMeterProps {
  confidence: number;
  guaranteed?: boolean;
  className?: string;
}

/**
 * 置信度仪表盘组件
 * 显示分析结果的置信度，带有动画效果
 */
export function EmotionMeter({ confidence, guaranteed, className = '' }: EmotionMeterProps) {
  // 动画状态
  const [animatedConfidence, setAnimatedConfidence] = useState(0);
  
  // 高置信度判断（95%以上）
  const isHighConfidence = confidence >= 95;

  // 置信度动画效果
  useEffect(() => {
    const duration = 1000; // 动画持续时间
    const startTime = Date.now();
    const startValue = animatedConfidence;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 弹性缓动函数
      const eased = 1 - Math.pow(1 - progress, 3);
      
      setAnimatedConfidence(startValue + (confidence - startValue) * eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [confidence]);

  return (
    <div className={`relative h-3 bg-gray-100 rounded-full overflow-hidden ${className}`}>
      {/* 进度条 */}
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{
          width: `${animatedConfidence}%`,
          background: isHighConfidence
            ? `linear-gradient(90deg, ${THEME_COLORS.success}, #4ade80)`
            : `linear-gradient(90deg, ${THEME_COLORS.primary}, ${THEME_COLORS.secondary})`,
          boxShadow: `0 0 10px ${isHighConfidence ? THEME_COLORS.success : THEME_COLORS.primary}40`,
        }}
      />

      {/* 置信度文字 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-xs font-bold drop-shadow-sm ${isHighConfidence ? 'text-white' : 'text-gray-700'}`}>
          置信度 {Math.round(animatedConfidence)}%
        </span>
      </div>

      {/* 高置信度标记 */}
      {guaranteed && isHighConfidence && animatedConfidence >= 95 && (
        <div className="absolute -right-1 top-1/2 -translate-y-1/2 animate-pulse">
          <span className="text-xs bg-green-500 text-white px-1 rounded-full">✓</span>
        </div>
      )}
    </div>
  );
}

/**
 * 音频特征卡片组件
 */
export interface AudioFeatureCardProps {
  title: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  color: string;
  className?: string;
}

export function AudioFeatureCard({
  title,
  value,
  unit,
  icon,
  color,
  className = '',
}: AudioFeatureCardProps) {
  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg ${color} bg-opacity-10 ${className}`}>
      {/* 图标 */}
      <div className={`p-1.5 rounded-full ${color} bg-opacity-20`}>
        {icon}
      </div>

      {/* 内容 */}
      <div className="flex-1">
        <p className="text-xs text-gray-500">{title}</p>
        <p className="text-sm font-semibold text-gray-700">
          {Math.round(value)} {unit}
        </p>
      </div>
    </div>
  );
}