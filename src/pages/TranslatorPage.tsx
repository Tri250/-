// ============================================
// PawSync Pro - TranslatorPage.tsx
// 
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: AI情感翻译页面 - 高精度分析版
// ============================================

import { useState, useEffect, useRef } from 'react';
import { Mic, Share2, RefreshCw, Sparkles, Heart, ChevronDown, ChevronUp, ChevronLeft, Activity, Waves, Music2, Camera, Upload, X, History, Clock, Volume2, Radio, Drum, Palette } from 'lucide-react';
import { useAppStore, type Analysis } from '../store/appStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmotionIcons } from '../components/icons/EmotionIcons';
import { emotionService } from '../services/emotionService';
import { EMOTION_CONFIGS } from '../types/emotion';
import type { PrimaryEmotion, EmotionAnalysis } from '../types/emotion';
// 新动画组件
import { 
  RecordingAnimation, 
  AnalysisAnimation,
  EmotionIconAnimation,
  ConfidenceMeterAnimation,
  TypewriterText,
  ResultCardAnimation,
  BadgeAnimation,
} from '../components/animations';

type AppStoreEmotion = 'happy' | 'anxious' | 'angry' | 'needs' | 'neutral';

function mapToAppStoreEmotion(emotion: PrimaryEmotion): AppStoreEmotion {
  const emotionMap: Record<PrimaryEmotion, AppStoreEmotion> = {
    happy: 'happy',
    anxious: 'anxious',
    angry: 'angry',
    needs: 'needs',
    calm: 'neutral',
    curious: 'neutral',
    excited: 'happy',
    safe: 'neutral',
  };
  return emotionMap[emotion] || 'neutral';
}

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

// 主题颜色
const THEME_COLORS = {
  primary: '#f97316',      // orange-500
  secondary: '#fb923c',    // orange-400
  tertiary: '#fdba74',     // orange-300
  success: '#22c55e',      // green-500
  background: '#f8fafc',   // light gray
};

function EmotionMeter({ confidence, guaranteed }: { confidence: number; guaranteed?: boolean }) {
  const [animatedConfidence, setAnimatedConfidence] = useState(0);
  const isHighConfidence = confidence >= 95;
  
  useEffect(() => {
    const duration = 1000;
    const startTime = Date.now();
    const startValue = 0;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // 弹性缓动
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedConfidence(startValue + (confidence - startValue) * eased);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [confidence]);
  
  return (
    <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
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
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-xs font-bold drop-shadow-sm ${isHighConfidence ? 'text-white' : 'text-gray-700'}`}>
          置信度 {Math.round(animatedConfidence)}%
        </span>
      </div>
      {guaranteed && isHighConfidence && animatedConfidence >= 95 && (
        <div className="absolute -right-1 top-1/2 -translate-y-1/2 animate-pulse">
          <span className="text-xs bg-green-500 text-white px-1 rounded-full">✓</span>
        </div>
      )}
    </div>
  );
}

function AudioFeatureCard({ title, value, unit, icon, color }: { title: string; value: number; unit: string; icon: React.ReactNode; color: string }) {
  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg ${color} bg-opacity-10`}>
      <div className={`p-1.5 rounded-full ${color} bg-opacity-20`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-xs text-gray-500">{title}</p>
        <p className="text-sm font-semibold text-gray-700">
          {Math.round(value)} {unit}
        </p>
      </div>
    </div>
  );
}

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

// 分析维度卡片组件
interface DimensionConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
  textColor: string;
  description: string;
}

const DIMENSION_CONFIGS: DimensionConfig[] = [
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

function AnalysisDimensionCard({ 
  dimension, 
  isActive = false,
  showAnimation = false,
}: { 
  dimension: DimensionConfig;
  isActive?: boolean;
  showAnimation?: boolean;
}) {
  return (
    <div 
      className={`
        relative overflow-hidden rounded-xl p-3 
        bg-gradient-to-br ${dimension.gradient} bg-opacity-10
        border border-white/50 shadow-sm
        transition-all duration-300 ease-out
        hover:shadow-md hover:scale-[1.02]
        ${isActive ? 'ring-2 ring-offset-2 ring-offset-white' : ''}
      `}
      style={{
        background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
      }}
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

function AnalysisDimensionsGrid({ isActive = false }: { isActive?: boolean }) {
  return (
    <div className="space-y-3">
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

function AnalysisDetailPanel({ analysis }: { analysis: EmotionAnalysis }) {
  const [expanded, setExpanded] = useState(false);
  const detail = analysis.detail;
  
  if (!detail) return null;
  
  const config = EMOTION_CONFIGS[analysis.primaryEmotion];
  
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
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3">
            <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <span className="text-lg">{config.emoji}</span>
              情感分布分析
            </p>
            <div className="space-y-1.5">
              {(Object.entries(detail.scores) as [PrimaryEmotion, number][])
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([emotion, score]) => (
                  <EmotionScoreBar
                    key={emotion}
                    emotion={emotion}
                    score={score}
                    isPrimary={emotion === analysis.primaryEmotion}
                  />
                ))}
            </div>
          </div>
          
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
              {detail.audioFeatures.pitch.stability !== undefined && (
                <AudioFeatureCard
                  title="稳定性"
                  value={detail.audioFeatures.pitch.stability}
                  unit="%"
                  icon={<Activity className="w-3 h-3 text-purple-500" />}
                  color="text-purple-500"
                />
              )}
              <AudioFeatureCard
                title="趋势"
                value={0}
                unit={detail.audioFeatures.pitch.trend === 'rising' ? '上升' : detail.audioFeatures.pitch.trend === 'falling' ? '下降' : detail.audioFeatures.pitch.trend === 'fluctuating' ? '波动' : '稳定'}
                icon={<Activity className="w-3 h-3 text-purple-500" />}
                color="text-purple-500"
              />
            </div>
            {renderFrequencyBands(detail.audioFeatures.pitch.bands)}
          </div>
          
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-orange-700 mb-2 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" />
              强度特征分析
            </p>
            <div className="grid grid-cols-2 gap-2">
              <AudioFeatureCard
                title="平均强度"
                value={detail.audioFeatures.intensity.mean * 100}
                unit="%"
                icon={<Activity className="w-3 h-3 text-orange-500" />}
                color="text-orange-500"
              />
              <AudioFeatureCard
                title="峰值强度"
                value={detail.audioFeatures.intensity.peak}
                unit="%"
                icon={<Activity className="w-3 h-3 text-orange-500" />}
                color="text-orange-500"
              />
              {detail.audioFeatures.intensity.dynamicRange !== undefined && (
                <AudioFeatureCard
                  title="动态范围"
                  value={detail.audioFeatures.intensity.dynamicRange}
                  unit="dB"
                  icon={<Waves className="w-3 h-3 text-orange-500" />}
                  color="text-orange-500"
                />
              )}
              {detail.audioFeatures.intensity.contour !== undefined && (
                <AudioFeatureCard
                  title="强度轮廓"
                  value={0}
                  unit={detail.audioFeatures.intensity.contour === 'flat' ? '平稳' : detail.audioFeatures.intensity.contour === 'rising' ? '渐强' : detail.audioFeatures.intensity.contour === 'falling' ? '渐弱' : detail.audioFeatures.intensity.contour === 'peaked' ? '峰值型' : '起伏型'}
                  icon={<Activity className="w-3 h-3 text-orange-500" />}
                  color="text-orange-500"
                />
              )}
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1">
              <Waves className="w-3.5 h-3.5" />
              频率特征分析
            </p>
            <div className="grid grid-cols-2 gap-2">
              <AudioFeatureCard
                title="主导频率"
                value={detail.audioFeatures.frequency.dominant}
                unit="Hz"
                icon={<Waves className="w-3 h-3 text-blue-500" />}
                color="text-blue-500"
              />
              <AudioFeatureCard
                title="谐波数量"
                value={detail.audioFeatures.frequency.harmonics.length}
                unit="个"
                icon={<Music2 className="w-3 h-3 text-blue-500" />}
                color="text-blue-500"
              />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
              <Music2 className="w-3.5 h-3.5" />
              节奏特征分析
            </p>
            <div className="grid grid-cols-2 gap-2">
              <AudioFeatureCard
                title="节奏速度"
                value={detail.audioFeatures.rhythm.tempo}
                unit="BPM"
                icon={<Music2 className="w-3 h-3 text-green-500" />}
                color="text-green-500"
              />
              <AudioFeatureCard
                title="规律性"
                value={detail.audioFeatures.rhythm.regularity}
                unit="%"
                icon={<Activity className="w-3 h-3 text-green-500" />}
                color="text-green-500"
              />
              {detail.audioFeatures.rhythm.complexity !== undefined && (
                <AudioFeatureCard
                  title="复杂度"
                  value={detail.audioFeatures.rhythm.complexity * 100}
                  unit="%"
                  icon={<Activity className="w-3 h-3 text-green-500" />}
                  color="text-green-500"
                />
              )}
              {detail.audioFeatures.rhythm.meter !== undefined && (
                <AudioFeatureCard
                  title="节拍类型"
                  value={0}
                  unit={`${detail.audioFeatures.rhythm.meter}/4拍`}
                  icon={<Music2 className="w-3 h-3 text-green-500" />}
                  color="text-green-500"
                />
              )}
            </div>
            <div className="mt-2">
              <span className={`text-xs px-2 py-1 rounded-full ${
                detail.audioFeatures.rhythm.pattern === 'steady' ? 'bg-green-100 text-green-700' :
                detail.audioFeatures.rhythm.pattern === 'irregular' ? 'bg-yellow-100 text-yellow-700' :
                detail.audioFeatures.rhythm.pattern === 'accelerating' ? 'bg-orange-100 text-orange-700' :
                detail.audioFeatures.rhythm.pattern === 'staccato' ? 'bg-red-100 text-red-700' :
                detail.audioFeatures.rhythm.pattern === 'legato' ? 'bg-blue-100 text-blue-700' :
                detail.audioFeatures.rhythm.pattern === 'pulsing' ? 'bg-pink-100 text-pink-700' :
                'bg-purple-100 text-purple-700'
              }`}>
                节奏模式: {detail.audioFeatures.rhythm.pattern === 'steady' ? '稳定' : 
                  detail.audioFeatures.rhythm.pattern === 'irregular' ? '不规则' :
                  detail.audioFeatures.rhythm.pattern === 'accelerating' ? '加速' :
                  detail.audioFeatures.rhythm.pattern === 'decelerating' ? '减速' :
                  detail.audioFeatures.rhythm.pattern === 'staccato' ? '断奏型' :
                  detail.audioFeatures.rhythm.pattern === 'legato' ? '连奏型' :
                  detail.audioFeatures.rhythm.pattern === 'pulsing' ? '脉冲型' : '切分型'}
              </span>
            </div>
          </div>
          
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
          
          <div className="flex items-center justify-between text-xs bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">置信度等级:</span>
              <span className={`font-semibold ${
                detail.confidenceLevel === 'high' ? 'text-green-600' : 
                detail.confidenceLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {detail.confidenceLevel === 'high' ? '高 (95%+)' : 
                 detail.confidenceLevel === 'medium' ? '中 (85-95%)' : '低 (<85%)'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">音频质量:</span>
              <span className={`font-semibold ${
                detail.audioFeatures.quality > 85 ? 'text-green-600' :
                detail.audioFeatures.quality > 70 ? 'text-blue-600' : 'text-yellow-600'
              }`}>
                {Math.round(detail.audioFeatures.quality)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function TranslatorPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { currentPet, addAnalysis, setCurrentEmotion, analyses } = useAppStore();
  const [isRecording, setIsRecording] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [emotion, setEmotion] = useState<PrimaryEmotion>('calm');
  const [translation, setTranslation] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentAnalysis, setCurrentAnalysis] = useState<EmotionAnalysis | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisSource, setAnalysisSource] = useState<'voice' | 'image'>('voice');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<Analysis | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasValidAudio, setHasValidAudio] = useState(false);
  const [maxAudioLevelReached, setMaxAudioLevelReached] = useState(0);
  const timerRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioChunksRef = useRef<Float32Array[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedBlobRef = useRef<Blob | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(track => track.stop());
    };
  }, []);

  const startRecording = async () => {
    setErrorMessage(null);
    setHasValidAudio(false);
    setMaxAudioLevelReached(0);
    
    try {
      // 请求麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      mediaStreamRef.current = stream;
      
      // 正确初始化 AudioContext
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContextClass();
      
      // 确保 AudioContext 处于运行状态
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;
      
      // 设置 MediaRecorder 用于实际录音
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
        recordedBlobRef.current = audioBlob;
      };
      
      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;
      
      setIsRecording(true);
      setRecordingTime(0);
      audioChunksRef.current = [];

      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      const captureAudio = () => {
        if (!analyserRef.current || !isRecording) return;
        
        const dataArray = new Float32Array(analyser.fftSize);
        analyserRef.current.getFloatTimeDomainData(dataArray);
        audioChunksRef.current.push(dataArray.slice(0));
        
        // 计算RMS音量级别
        const rms = Math.sqrt(dataArray.reduce((sum, val) => sum + val * val, 0) / dataArray.length);
        const level = rms * 100;
        setAudioLevel(level);
        
        // 跟踪最大音量级别
        setMaxAudioLevelReached((prev) => Math.max(prev, level));
        
        // 检测是否有有效音频（音量超过阈值）
        if (level > 5) {
          setHasValidAudio(true);
        }
        
        animationRef.current = requestAnimationFrame(captureAudio);
      };
      captureAudio();
    } catch (error) {
      console.error('无法访问麦克风:', error);
      
      // 提供详细的错误信息
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setErrorMessage('麦克风权限被拒绝。请在浏览器设置中允许访问麦克风，然后重试。');
        } else if (error.name === 'NotFoundError') {
          setErrorMessage('未检测到麦克风设备。请连接麦克风后重试。');
        } else if (error.name === 'NotReadableError') {
          setErrorMessage('麦克风被其他应用程序占用。请关闭其他使用麦克风的应用后重试。');
        } else {
          setErrorMessage(`麦克风访问失败: ${error.message}`);
        }
      } else {
        setErrorMessage('麦克风访问失败，请检查设备设置。');
      }
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    setAudioLevel(0);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    // 停止 MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // 验证录音有效性
    if (recordingTime < 1) {
      setErrorMessage('录音时间太短，请至少录音1秒钟。');
      return;
    }
    
    if (!hasValidAudio && maxAudioLevelReached < 3) {
      setErrorMessage('未检测到有效声音，请确保麦克风正常工作并对准宠物发声。');
      return;
    }
    
    analyzeVoice();
  };

  const analyzeVoice = async () => {
    setIsAnalyzing(true);
    setShowResult(false);
    setAnalysisSource('voice');
    setErrorMessage(null);
    
    try {
      let audioData: Float32Array;
      let actualRecordingDuration = recordingTime;
      
      if (audioChunksRef.current.length > 0) {
        const totalLength = audioChunksRef.current.reduce((sum, chunk) => sum + chunk.length, 0);
        audioData = new Float32Array(totalLength);
        let offset = 0;
        for (const chunk of audioChunksRef.current) {
          audioData.set(chunk, offset);
          offset += chunk.length;
        }
        
        // 计算实际录音时长
        actualRecordingDuration = audioData.length / 44100;
      } else {
        // 如果没有实际录音数据，显示错误
        setErrorMessage('未捕获到音频数据，请检查麦克风设置后重试。');
        setIsAnalyzing(false);
        return;
      }
      
      // 验证音频数据有效性
      const audioValidation = validateAudioData(audioData);
      if (!audioValidation.isValid) {
        setErrorMessage(audioValidation.error || '音频数据无效');
        setIsAnalyzing(false);
        return;
      }
      
      const analysis = await emotionService.analyzeVoice(audioData, {
        duration: actualRecordingDuration,
        maxLevel: maxAudioLevelReached,
        hasValidSound: hasValidAudio,
      });
      
      // 检查分析结果的置信度
      if (analysis.confidence < 60) {
        setErrorMessage('分析置信度过低，请尝试在更安静的环境中重新录音。');
        setIsAnalyzing(false);
        return;
      }
      
      setEmotion(analysis.primaryEmotion);
      setTranslation(analysis.translation);
      setConfidence(analysis.confidence);
      setCurrentAnalysis(analysis);
      setIsAnalyzing(false);
      setShowResult(true);
      setCurrentEmotion(mapToAppStoreEmotion(analysis.primaryEmotion));
      
      addAnalysis({
        petId: currentPet?.id || '',
        type: 'voice',
        result: {
          emotion: mapToAppStoreEmotion(analysis.primaryEmotion),
          translation: analysis.translation,
          confidence: analysis.confidence,
        },
      });
    } catch (error) {
      console.error('分析失败:', error);
      setErrorMessage('语音分析失败，请重试。');
      setIsAnalyzing(false);
    }
  };
  
  // 验证音频数据有效性
  const validateAudioData = (audioData: Float32Array): { isValid: boolean; error?: string } => {
    if (audioData.length < 44100 * 0.5) {
      return { isValid: false, error: '录音时长不足，请至少录音0.5秒。' };
    }
    
    // 计算音频能量
    let energy = 0;
    let maxAmplitude = 0;
    for (let i = 0; i < audioData.length; i++) {
      energy += audioData[i] * audioData[i];
      maxAmplitude = Math.max(maxAmplitude, Math.abs(audioData[i]));
    }
    energy = Math.sqrt(energy / audioData.length);
    
    // 检查是否为静音
    if (energy < 0.001 && maxAmplitude < 0.01) {
      return { isValid: false, error: '录音为静音，请确保有声音输入。' };
    }
    
    // 检查是否为削波（失真）
    const clippingCount = audioData.filter(v => Math.abs(v) > 0.99).length;
    if (clippingCount > audioData.length * 0.1) {
      return { isValid: false, error: '录音音量过大导致失真，请降低音量后重试。' };
    }
    
    return { isValid: true };
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setShowImageModal(true);
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  };

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setShowImageModal(true);
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  };

  const handleImageAnalysis = async () => {
    if (!selectedFile) return;
    
    setShowImageModal(false);
    setIsAnalyzing(true);
    setShowResult(false);
    setAnalysisSource('image');
    setErrorMessage(null);
    
    try {
      // 先进行动物检测
      const animalDetection = await emotionService.detectAnimal(selectedFile);
      
      if (!animalDetection.isAnimal) {
        setErrorMessage(animalDetection.message || '未检测到宠物，请上传包含宠物的图片。');
        setIsAnalyzing(false);
        return;
      }
      
      if (animalDetection.confidence < 60) {
        setErrorMessage('宠物检测置信度过低，请上传更清晰的宠物照片。');
        setIsAnalyzing(false);
        return;
      }
      
      const analysis = await emotionService.analyzeImageFile(selectedFile);
      
      // 检查分析结果的置信度
      if (analysis.confidence < 60) {
        setErrorMessage('无法准确识别情感，请上传宠物表情更清晰的照片。');
        setIsAnalyzing(false);
        return;
      }
      
      setEmotion(analysis.primaryEmotion);
      setTranslation(analysis.translation);
      setConfidence(analysis.confidence);
      setCurrentAnalysis(analysis);
      setIsAnalyzing(false);
      setShowResult(true);
      setCurrentEmotion(mapToAppStoreEmotion(analysis.primaryEmotion));
      
      addAnalysis({
        petId: currentPet?.id || '',
        type: 'image',
        result: {
          emotion: mapToAppStoreEmotion(analysis.primaryEmotion),
          translation: analysis.translation,
          confidence: analysis.confidence,
        },
      });
    } catch (error) {
      console.error('图片分析失败:', error);
      setErrorMessage('图片分析失败，请重试。');
      setIsAnalyzing(false);
    }
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
    setSelectedFile(null);
  };

  const handleShare = async () => {
    const shareText = `${currentPet?.name}的心情\n\n${translation}\n\n——来自 爪爪连心❤️`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: '爪爪连心❤️ - 宠物心声',
          text: shareText,
        });
      } catch {
        console.log('分享取消或失败');
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        alert('已复制到剪贴板');
      } catch (error) {
        console.error('复制失败', error);
      }
    }
  };

  const handleRetry = () => {
    setShowResult(false);
    setEmotion('calm');
    setTranslation('');
    setConfidence(0);
    setCurrentAnalysis(null);
    setSelectedImage(null);
    setSelectedFile(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const config = EMOTION_CONFIGS[emotion];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-white to-peach-50/30 pb-20">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-orange-100">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onNavigate?.('home')}
              className="p-2 hover:bg-orange-50 rounded-full transition-colors"
              aria-label="返回首页"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            
            <div className="flex flex-col items-center">
              <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Heart className="w-5 h-5 text-orange-500" />
                AI 情感翻译机
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${
                  isRecording ? 'bg-red-500 animate-pulse' : 
                  isAnalyzing ? 'bg-orange-500 animate-pulse' : 
                  'bg-green-500'
                }`} />
                <span className="text-xs text-gray-400">
                  {isRecording ? '录音中' : isAnalyzing ? '分析中' : '就绪'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowHistoryModal(true)}
                className="p-2 hover:bg-orange-50 rounded-full transition-colors"
                aria-label="查看历史"
                disabled={analyses.length === 0}
              >
                <History className={`w-5 h-5 ${analyses.length > 0 ? 'text-gray-600' : 'text-gray-300'}`} />
              </button>
              <button
                onClick={handleShare}
                disabled={!showResult}
                className="p-2 hover:bg-orange-50 rounded-full transition-colors disabled:opacity-50"
                aria-label="分享"
              >
                <Share2 className={`w-5 h-5 ${showResult ? 'text-orange-500' : 'text-gray-300'}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="flex justify-center gap-4">
          <Button
            onClick={startRecording}
            disabled={isRecording || isAnalyzing}
            icon={<Mic className="w-5 h-5" />}
            className={isRecording || isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}
          >
            录音翻译
          </Button>
          <Button
            variant="secondary"
            icon={<Camera className="w-5 h-5" />}
            onClick={() => {
              setSelectedImage(null);
              setSelectedFile(null);
              setShowImageModal(true);
            }}
            disabled={isRecording || isAnalyzing}
            className={isRecording || isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}
          >
            拍照分析
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCameraCapture}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-6">
          {/* 使用新的录音动画组件 */}
          {!isAnalyzing && (
            <RecordingAnimation
              isActive={isRecording}
              audioLevel={audioLevel}
              size="large"
              onClick={isRecording ? stopRecording : startRecording}
            />
          )}

          {/* 分析动画 */}
          {isAnalyzing && (
            <AnalysisAnimation
              isActive={isAnalyzing}
              source={analysisSource}
            />
          )}

          {!isRecording && !isAnalyzing && !showResult && (
            <div className="text-center space-y-2">
              <p className="text-gray-500 text-sm">
                点击爪印按钮开始录音
              </p>
              <p className="text-gray-400 text-xs">
                或使用拍照分析功能
              </p>
            </div>
          )}
          
          {errorMessage && !isRecording && !isAnalyzing && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 max-w-sm mx-auto animate-fadeIn">
              <div className="flex items-start gap-3">
                <div className="text-red-500 text-xl">⚠️</div>
                <div className="flex-1">
                  <p className="text-red-700 text-sm font-medium mb-1">分析失败</p>
                  <p className="text-red-600 text-xs">{errorMessage}</p>
                </div>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {isRecording && (
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-3">
                <Heart className="w-5 h-5 text-red-500 animate-pulse" />
                <p className="text-gray-600 font-medium text-lg">
                  宝贝正在说话呢...
                </p>
                <Heart className="w-5 h-5 text-red-500 animate-pulse" />
              </div>
              
              <div className="inline-flex items-center justify-center px-4 py-2 bg-red-50 rounded-full">
                <Clock className="w-4 h-4 text-red-500 mr-2" />
                <p className="text-2xl font-bold text-red-600 tabular-nums">
                  {formatTime(recordingTime)}
                </p>
              </div>
              
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-gray-400">音量:</span>
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-100"
                    style={{ 
                      width: `${Math.min(100, audioLevel)}%`,
                      background: `linear-gradient(90deg, ${THEME_COLORS.success}, ${THEME_COLORS.primary})`,
                    }}
                  />
                </div>
                <span className="text-xs text-gray-500">{Math.round(audioLevel)}%</span>
              </div>

              <p className="text-xs text-gray-400">
                点击按钮结束录音
              </p>
            </div>
          )}

          {isAnalyzing && (
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-3">
                <Sparkles className="w-6 h-6 text-orange-500 animate-pulse" />
                <p className="text-gray-600 font-medium text-lg">
                  {analysisSource === 'image' ? 'AI正在分析图片...' : 'AI正在深度分析...'}
                </p>
                <Sparkles className="w-6 h-6 text-orange-500 animate-pulse" />
              </div>
              <p className="text-sm text-gray-400">
                {analysisSource === 'image' ? '正在识别宝贝的表情特征' : '正在分析音频特征、情感维度'}
              </p>
            </div>
          )}
        </div>

        {showResult && (
          <ResultCardAnimation delay={100}>
            <Card variant="gradient" padding="large">
              {analysisSource === 'image' && selectedImage && (
                <div className="mb-4 rounded-xl overflow-hidden shadow-md">
                  <img
                    src={selectedImage}
                    alt="分析图片"
                    className="w-full h-32 object-cover"
                  />
                </div>
              )}
              
              <div className="text-center mb-4">
                <EmotionIconAnimation
                  icon={(() => {
                    const IconComponent = EmotionIcons[emotion];
                    return <IconComponent size={48} />;
                  })()}
                  emotion={emotion}
                  delay={200}
                />
                
                <div className="flex items-center justify-center gap-2 mt-4">
                  <BadgeAnimation delay={400}>
                    <Badge 
                      color={getBadgeColor(emotion)} 
                      size="medium"
                    >
                      <span className="text-lg mr-1">{config.emoji}</span>
                      {config.label}
                    </Badge>
                  </BadgeAnimation>
                  {confidence >= 95 && (
                    <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-semibold animate-pulse">
                      ✓ 高置信度
                    </span>
                  )}
                </div>
              </div>

              <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-4 shadow-inner border border-gray-100">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-white/80" />
                
                <p className="text-gray-700 text-center text-lg leading-relaxed font-medium">
                  <TypewriterText 
                    text={translation} 
                    speed={30} 
                    delay={500}
                  />
                </p>
                
                <div className="flex justify-center mt-4">
                  <span className="text-sm text-gray-400 flex items-center gap-1">
                    <PawPrintIcon className="w-4 h-4 text-orange-400" />
                    {currentPet?.name}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <ConfidenceMeterAnimation confidence={confidence} delay={600} />
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-600 text-center">
                  {config.description}
                </p>
              </div>

              {currentAnalysis && (
                <AnalysisDetailPanel analysis={currentAnalysis} />
              )}

              <div className="grid grid-cols-2 gap-3 mt-4 mb-4">
                <Button
                  variant="secondary"
                  size="small"
                  icon={<RefreshCw className="w-4 h-4" />}
                  onClick={handleRetry}
                >
                  {analysisSource === 'image' ? '再拍一张' : '再听一次'}
                </Button>
                <Button
                  size="small"
                  icon={<Share2 className="w-4 h-4" />}
                  onClick={handleShare}
                >
                  分享心情
                </Button>
              </div>

              <div className="flex justify-center gap-4 text-xs text-gray-400">
                <button className="hover:text-orange-500 transition-colors">
                  💾 保存记录
                </button>
                <button className="hover:text-orange-500 transition-colors">
                  💬 社区讨论
                </button>
              </div>
            </Card>
          </ResultCardAnimation>
        )}

        <Card variant="default" padding="medium">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <p className="text-sm text-gray-600 mb-1">
                <strong>小贴士</strong>
              </p>
              <p className="text-xs text-gray-500">
                请将麦克风靠近宝贝，保持环境安静。AI会分析音调、频率、节奏等多个维度，确保95%以上的分析准确率。
              </p>
            </div>
          </div>
        </Card>

        <Card variant="default" padding="medium">
          <AnalysisDimensionsGrid isActive={isAnalyzing} />
        </Card>
      </main>
      
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-2xl animate-fadeIn max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <History className="w-5 h-5 text-orange-500" />
                分析历史
              </h3>
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedHistoryItem(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {selectedHistoryItem ? (
              <div className="space-y-4 overflow-y-auto flex-1">
                <div className="bg-gradient-to-r from-orange-50 to-peach-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge color={getBadgeColor(selectedHistoryItem.result.emotion as PrimaryEmotion)} size="medium">
                      {EMOTION_CONFIGS[selectedHistoryItem.result.emotion as PrimaryEmotion]?.emoji || '😊'}
                      {EMOTION_CONFIGS[selectedHistoryItem.result.emotion as PrimaryEmotion]?.label || '平静'}
                    </Badge>
                    {selectedHistoryItem.result.confidence >= 95 && (
                      <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                        95%+
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 text-center text-base leading-relaxed font-medium mt-3">
                    "{selectedHistoryItem.result.translation}"
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(selectedHistoryItem.createdAt).toLocaleString('zh-CN')}
                    </span>
                    <span className="flex items-center gap-1">
                      {selectedHistoryItem.type === 'voice' ? '🎤 语音' : '📷 图片'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <EmotionMeter confidence={selectedHistoryItem.result.confidence} />
                </div>
                
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => setSelectedHistoryItem(null)}
                  className="w-full"
                >
                  返回列表
                </Button>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto flex-1">
                {analyses.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">暂无分析记录</p>
                    <p className="text-gray-400 text-xs mt-1">开始录音或拍照分析吧</p>
                  </div>
                ) : (
                  analyses
                    .filter(a => a.petId === currentPet?.id)
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 20)
                    .map((analysis) => (
                      <button
                        key={analysis.id}
                        onClick={() => setSelectedHistoryItem(analysis)}
                        className="w-full p-3 bg-gray-50 hover:bg-orange-50 rounded-xl transition-colors flex items-center gap-3"
                      >
                        <div className="text-2xl">
                          {EMOTION_CONFIGS[analysis.result.emotion as PrimaryEmotion]?.emoji || '😊'}
                        </div>
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
                        <div className="text-right">
                          <span className={`text-xs font-semibold ${
                            analysis.result.confidence >= 95 ? 'text-green-500' : 'text-gray-500'
                          }`}>
                            {analysis.result.confidence}%
                          </span>
                        </div>
                      </button>
                    ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">选择图片</h3>
              <button
                onClick={closeImageModal}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {selectedImage ? (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src={selectedImage}
                    alt="Selected"
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => {
                      setSelectedImage(null);
                      setSelectedFile(null);
                    }}
                    className="flex-1"
                  >
                    重新选择
                  </Button>
                  <Button
                    size="small"
                    onClick={handleImageAnalysis}
                    className="flex-1"
                    icon={<Sparkles className="w-4 h-4" />}
                  >
                    开始分析
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-peach-50 rounded-xl hover:from-orange-100 hover:to-peach-100 transition-colors"
                >
                  <Camera className="w-6 h-6 text-orange-500" />
                  <span className="font-medium text-gray-700">拍照</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-colors"
                >
                  <Upload className="w-6 h-6 text-blue-500" />
                  <span className="font-medium text-gray-700">从相册选择</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}