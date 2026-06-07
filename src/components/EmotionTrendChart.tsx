import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

interface EmotionData {
  date: string;
  happy: number;
  anxious: number;
  angry: number;
  neutral: number;
  needs: number;
  overall: number;
}

interface EmotionTrendChartProps {
  data: EmotionData[];
  period?: 'week' | 'month' | 'year';
  className?: string;
}

const emotionColors = {
  happy: '#22c55e',
  anxious: '#f59e0b',
  angry: '#ef4444',
  neutral: '#6b7280',
  needs: '#8b5cf6',
  overall: '#f97316',
};

const emotionLabels = {
  happy: '开心',
  anxious: '焦虑',
  angry: '生气',
  neutral: '平静',
  needs: '需求',
  overall: '综合',
};

export const EmotionTrendChart: React.FC<EmotionTrendChartProps> = ({
  data,
  period = 'week',
  className = '',
}) => {
  // 计算趋势
  const trend = useMemo(() => {
    if (data.length < 2) return { direction: 'stable', change: 0 };
    
    const recent = data.slice(-3).reduce((sum, d) => sum + d.overall, 0) / 3;
    const previous = data.slice(0, 3).reduce((sum, d) => sum + d.overall, 0) / 3;
    const change = ((recent - previous) / previous) * 100;
    
    return {
      direction: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
      change: Math.abs(change).toFixed(1),
    };
  }, [data]);

  // 计算各情绪占比
  const emotionStats = useMemo(() => {
    const totals = data.reduce((acc, d) => ({
      happy: acc.happy + d.happy,
      anxious: acc.anxious + d.anxious,
      angry: acc.angry + d.angry,
      neutral: acc.neutral + d.neutral,
      needs: acc.needs + d.needs,
    }), { happy: 0, anxious: 0, angry: 0, neutral: 0, needs: 0 });
    
    const total = Object.values(totals).reduce((a, b) => a + b, 0);
    
    return Object.entries(totals).map(([key, value]) => ({
      key,
      label: emotionLabels[key as keyof typeof emotionLabels],
      value: ((value / total) * 100).toFixed(1),
      color: emotionColors[key as keyof typeof emotionColors],
    })).sort((a, b) => parseFloat(b.value) - parseFloat(a.value));
  }, [data]);

  // 获取趋势图标
  const TrendIcon = trend.direction === 'up' ? TrendingUp : 
                   trend.direction === 'down' ? TrendingDown : Minus;
  const trendColor = trend.direction === 'up' ? 'text-green-500' : 
                     trend.direction === 'down' ? 'text-red-500' : 'text-gray-500';

  return (
    <Card className={`p-4 ${className}`}>
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-orange-500" />
          <h3 className="font-bold text-gray-800">情绪趋势分析</h3>
        </div>
        <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
          <TrendIcon className="w-4 h-4" />
          <span>{trend.change}%</span>
        </div>
      </div>

      {/* 趋势图表 */}
      <div className="h-48 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="overallGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={emotionColors.overall} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={emotionColors.overall} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: 8, 
                border: 'none', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                fontSize: 12
              }}
            />
            <Area 
              type="monotone" 
              dataKey="overall" 
              stroke={emotionColors.overall}
              fillOpacity={1} 
              fill="url(#overallGradient)" 
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="happy" 
              stroke={emotionColors.happy}
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="4 4"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 情绪占比 */}
      <div className="space-y-2">
        <p className="text-xs text-gray-500 mb-2">情绪分布</p>
        <div className="flex flex-wrap gap-2">
          {emotionStats.slice(0, 3).map((stat) => (
            <Badge 
              key={stat.key}
              color="orange"
              size="small"
              className="text-xs"
            >
              {stat.label} {stat.value}%
            </Badge>
          ))}
        </div>
      </div>

      {/* 洞察建议 */}
      <div className="mt-4 p-3 bg-orange-50 rounded-lg">
        <p className="text-xs text-orange-700">
          <span className="font-medium">💡 洞察：</span>
          {trend.direction === 'up' 
            ? '毛孩子最近心情不错，继续保持良好的互动哦！'
            : trend.direction === 'down'
            ? '最近情绪有些波动，建议多关注毛孩子的需求。'
            : '情绪状态平稳，是建立良好习惯的好时机。'}
        </p>
      </div>
    </Card>
  );
};

export default EmotionTrendChart;
