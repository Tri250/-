import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { EmotionDashboard as EmotionDashboardType, PrimaryEmotion } from '../../types/emotion';

interface EmotionDashboardProps {
  dashboard: EmotionDashboardType;
  onDimensionClick?: (dimension: string) => void;
}

const emotionConfig: Record<PrimaryEmotion, { emoji: string; label: string; color: string; gradient: string }> = {
  happy: { emoji: '😸', label: '开心', color: 'text-green-500', gradient: 'from-green-400 to-emerald-500' },
  curious: { emoji: '🤔', label: '好奇', color: 'text-purple-500', gradient: 'from-purple-400 to-violet-500' },
  anxious: { emoji: '😰', label: '焦虑', color: 'text-yellow-500', gradient: 'from-yellow-400 to-amber-500' },
  angry: { emoji: '😾', label: '生气', color: 'text-red-500', gradient: 'from-red-400 to-rose-500' },
  needs: { emoji: '🥺', label: '有需求', color: 'text-blue-500', gradient: 'from-blue-400 to-indigo-500' },
  calm: { emoji: '😌', label: '平静', color: 'text-gray-500', gradient: 'from-gray-400 to-slate-500' },
  excited: { emoji: '🎉', label: '兴奋', color: 'text-pink-500', gradient: 'from-pink-400 to-rose-500' },
  safe: { emoji: '😊', label: '安心', color: 'text-teal-500', gradient: 'from-teal-400 to-cyan-500' },
};

const dimensions = [
  { key: 'excitement', icon: '⚡', label: '兴奋度', color: 'text-yellow-500', bgColor: 'bg-yellow-50' },
  { key: 'anxiety', icon: '😰', label: '焦虑度', color: 'text-orange-500', bgColor: 'bg-orange-50' },
  { key: 'affection', icon: '💕', label: '亲密度', color: 'text-pink-500', bgColor: 'bg-pink-50' },
  { key: 'curiosity', icon: '🔍', label: '好奇心', color: 'text-purple-500', bgColor: 'bg-purple-50' },
];

export function EmotionDashboard({ dashboard, onDimensionClick }: EmotionDashboardProps) {
  const [animatedIntensity, setAnimatedIntensity] = useState(0);
  const config = emotionConfig[dashboard.centralEmotion];

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedIntensity(dashboard.intensity);
    }, 100);
    return () => clearTimeout(timer);
  }, [dashboard.intensity]);

  const TrendIcon = dashboard.trends.direction === 'up' 
    ? TrendingUp 
    : dashboard.trends.direction === 'down' 
    ? TrendingDown 
    : Minus;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">情感状态</h3>
          <div className={`flex items-center gap-1 text-sm ${dashboard.trends.change > 0 ? 'text-green-500' : dashboard.trends.change < 0 ? 'text-red-500' : 'text-gray-500'}`}>
            <TrendIcon className="w-4 h-4" />
            <span>{Math.abs(dashboard.trends.change)}%</span>
          </div>
        </div>

        <div className="flex items-center justify-center mb-8">
          <div className="relative">
            <svg className="w-40 h-40 transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="#f3f4f6"
                strokeWidth="12"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke={`currentColor`}
                className={`${config.color}`}
                strokeWidth="12"
                strokeDasharray={`${2 * Math.PI * 70}`}
                strokeDashoffset={`${2 * Math.PI * 70 * (1 - animatedIntensity / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl mb-2">{config.emoji}</span>
              <span className={`text-2xl font-bold ${config.color}`}>{config.label}</span>
              <span className="text-sm text-gray-500 mt-1">{dashboard.intensity}%</span>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500 mb-2">置信度</p>
          <p className={`text-2xl font-bold ${config.color}`}>{dashboard.confidence}%</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">情感维度</h3>
        
        <div className="space-y-4">
          {dimensions.map((dim) => {
            const value = dashboard.dimensions[dim.key as keyof typeof dashboard.dimensions];
            return (
              <div
                key={dim.key}
                onClick={() => onDimensionClick?.(dim.key)}
                className="cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{dim.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{dim.label}</span>
                  </div>
                  <span className={`text-sm font-semibold ${dim.color}`}>{value}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${dim.color.replace('text-', 'from-').replace('-500', '-400')} to-current transition-all duration-500`}
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {dashboard.recentHistory.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">最近记录</h3>
          
          <div className="space-y-3">
            {dashboard.recentHistory.slice(0, 5).map((analysis) => {
              const ac = emotionConfig[analysis.primaryEmotion];
              return (
                <div key={analysis.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="text-2xl">{ac.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{analysis.translation}</p>
                    <p className="text-xs text-gray-500">{analysis.context.timeContext}</p>
                  </div>
                  <span className={`text-xs font-medium ${ac.color}`}>{ac.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
