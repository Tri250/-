import React, { useMemo, useState, useEffect } from 'react';
import { Heart, Activity, Moon, Utensils, Dumbbell, Droplets, TrendingUp, TrendingDown, AlertCircle, Loader2 } from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { CircularProgress } from './ui/CircularProgress';
import { realHealthScoreService, type HealthMetrics, type HealthScoreResult } from '../services/realHealthScoreService';

interface HealthScoreCardProps {
  score?: number;
  metrics?: HealthMetrics;
  lastCheckDate?: string;
  trend?: 'up' | 'down' | 'stable';
  className?: string;
  petId?: string;
}

const metricConfig = {
  activity: { label: '运动', icon: Dumbbell, color: '#22c55e', description: '日常活动量' },
  diet: { label: '饮食', icon: Utensils, color: '#f59e0b', description: '营养摄入均衡' },
  sleep: { label: '睡眠', icon: Moon, color: '#8b5cf6', description: '睡眠质量' },
  mental: { label: '心理', icon: Heart, color: '#ec4899', description: '情绪状态' },
  medical: { label: '医疗', icon: Activity, color: '#3b82f6', description: '健康检查' },
};

const scoreLevels = [
  { min: 90, label: '优秀', color: 'text-green-500', bgColor: 'bg-green-50', message: '毛孩子状态棒极了！' },
  { min: 75, label: '良好', color: 'text-blue-500', bgColor: 'bg-blue-50', message: '整体状态不错，继续保持！' },
  { min: 60, label: '一般', color: 'text-yellow-500', bgColor: 'bg-yellow-50', message: '有些方面需要关注。' },
  { min: 0, label: '需关注', color: 'text-red-500', bgColor: 'bg-red-50', message: '建议咨询兽医。' },
];

export const HealthScoreCard: React.FC<HealthScoreCardProps> = ({
  score: propScore,
  metrics: propMetrics,
  lastCheckDate: propLastCheckDate,
  trend: propTrend,
  className = '',
  petId = '1',
}) => {
  const [healthData, setHealthData] = useState<HealthScoreResult | null>(null);
  const [isLoading, setIsLoading] = useState(!propScore || !propMetrics);
  const [error, setError] = useState<string | null>(null);

  // 加载真实健康评分数据
  useEffect(() => {
    if (propScore !== undefined && propMetrics !== undefined) {
      return;
    }

    const loadHealthScore = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await realHealthScoreService.getHealthScore(petId);
        setHealthData(data);
      } catch (err) {
        setError('加载健康评分失败');
        console.error('Failed to load health score:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadHealthScore();
  }, [petId, propScore, propMetrics]);

  // 使用传入的props或加载的数据
  const score = propScore ?? healthData?.score ?? 70;
  const metrics = propMetrics ?? healthData?.metrics ?? {
    activity: 70,
    diet: 75,
    sleep: 70,
    mental: 70,
    medical: 75
  };
  const lastCheckDate = propLastCheckDate ?? healthData?.lastCheckDate;
  const trend = propTrend ?? healthData?.trend ?? 'stable';
  const suggestions = healthData?.suggestions || [];

  const level = useMemo(() => {
    return scoreLevels.find(l => score >= l.min) || scoreLevels[scoreLevels.length - 1];
  }, [score]);

  const weakMetrics = useMemo(() => {
    return Object.entries(metrics)
      .filter(([_, value]) => value < 70)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 2);
  }, [metrics]);

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : AlertCircle;
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-400';

  if (isLoading) {
    return (
      <Card className={`p-5 ${className}`}>
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <span className="ml-2 text-gray-500">计算健康评分...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-5 ${className}`}>
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold text-gray-800 text-lg">健康评分</h3>
          {lastCheckDate && (
            <p className="text-xs text-gray-500 mt-1">上次检查: {lastCheckDate}</p>
          )}
        </div>
        <div className={`flex items-center gap-1 ${trendColor}`}>
          <TrendIcon className="w-5 h-5" />
        </div>
      </div>

      {/* 主评分 */}
      <div className="flex items-center gap-6 mb-6">
        <div className="relative">
          <CircularProgress 
            value={score} 
            size={100} 
            strokeWidth={8}
            color={level.color.replace('text-', '')}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${level.color}`}>{score}</span>
            <span className="text-xs text-gray-400">分</span>
          </div>
        </div>
        
        <div className="flex-1">
          <Badge className={`${level.bgColor} ${level.color} border-0 mb-2`}>
            {level.label}
          </Badge>
          <p className="text-sm text-gray-600">{level.message}</p>
          {weakMetrics.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {weakMetrics.map(([key, value]) => {
                const config = metricConfig[key as keyof typeof metricConfig];
                return (
                  <span key={key} className="text-xs text-gray-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-orange-400" />
                    {config.label}需关注
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 指标详情 */}
      <div className="grid grid-cols-5 gap-2">
        {Object.entries(metrics).map(([key, value]) => {
          const config = metricConfig[key as keyof typeof metricConfig];
          const Icon = config.icon;
          const isWeak = value < 70;
          
          return (
            <div key={key} className="flex flex-col items-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  isWeak ? 'bg-red-50' : 'bg-gray-50'
                }`}
              >
                <Icon 
                  className="w-5 h-5" 
                  style={{ color: isWeak ? '#ef4444' : config.color }}
                />
              </div>
              <span className="text-xs text-gray-600 font-medium">{config.label}</span>
              <span className={`text-sm font-bold ${isWeak ? 'text-red-500' : 'text-gray-800'}`}>
                {value}
              </span>
            </div>
          );
        })}
      </div>

      {/* 建议 */}
      {(weakMetrics.length > 0 || suggestions.length > 0) && (
        <div className="mt-4 p-3 bg-orange-50 rounded-lg space-y-2">
          {suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <p key={index} className="text-xs text-orange-700">
                <span className="font-medium">💡 建议{index + 1}：</span>
                {suggestion}
              </p>
            ))
          ) : (
            <p className="text-xs text-orange-700">
              <span className="font-medium">💡 建议：</span>
              加强{weakMetrics.map(([key]) => metricConfig[key as keyof typeof metricConfig].label).join('、')}管理
            </p>
          )}
        </div>
      )}
    </Card>
  );
};

export default HealthScoreCard;
