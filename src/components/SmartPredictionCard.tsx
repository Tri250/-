import React, { useMemo } from 'react';
import { Brain, AlertTriangle, Calendar, Clock, TrendingUp, Droplets, Sun, Moon, Wind } from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

interface Prediction {
  id: string;
  type: 'health' | 'behavior' | 'care' | 'seasonal';
  title: string;
  description: string;
  confidence: number;
  timeframe: string;
  icon: 'alert' | 'calendar' | 'trend' | 'drop' | 'sun' | 'moon' | 'wind';
  action?: string;
}

interface SmartPredictionCardProps {
  predictions: Prediction[];
  className?: string;
}

const typeConfig = {
  health: { label: '健康预警', color: 'bg-red-100 text-red-700', priority: 1 },
  behavior: { label: '行为预测', color: 'bg-blue-100 text-blue-700', priority: 2 },
  care: { label: '养护建议', color: 'bg-green-100 text-green-700', priority: 3 },
  seasonal: { label: '季节提醒', color: 'bg-orange-100 text-orange-700', priority: 4 },
};

const iconMap = {
  alert: AlertTriangle,
  calendar: Calendar,
  trend: TrendingUp,
  drop: Droplets,
  sun: Sun,
  moon: Moon,
  wind: Wind,
};

// 模拟预测数据生成
const generateMockPredictions = (): Prediction[] => {
  return [
    {
      id: '1',
      type: 'health',
      title: '换毛期即将到来',
      description: '根据历史数据，毛孩子即将进入换毛期，建议增加梳毛频率',
      confidence: 85,
      timeframe: '预计3天内',
      icon: 'alert',
      action: '查看护理指南',
    },
    {
      id: '2',
      type: 'behavior',
      title: '活跃度可能下降',
      description: '最近气温变化较大，毛孩子可能会变得不太活跃',
      confidence: 72,
      timeframe: '本周内',
      icon: 'trend',
      action: '调整运动计划',
    },
    {
      id: '3',
      type: 'care',
      title: '建议增加水分摄入',
      description: '根据活动量分析，今日饮水量可能不足',
      confidence: 68,
      timeframe: '今日',
      icon: 'drop',
      action: '设置提醒',
    },
    {
      id: '4',
      type: 'seasonal',
      title: '夏季防暑提醒',
      description: '未来几天气温升高，注意给毛孩子降温',
      confidence: 90,
      timeframe: '下周开始',
      icon: 'sun',
      action: '查看防暑攻略',
    },
  ];
};

export const SmartPredictionCard: React.FC<SmartPredictionCardProps> = ({
  predictions: propPredictions,
  className = '',
}) => {
  const predictions = propPredictions || generateMockPredictions();

  // 按优先级和置信度排序
  const sortedPredictions = useMemo(() => {
    return [...predictions].sort((a, b) => {
      const priorityDiff = typeConfig[a.type].priority - typeConfig[b.type].priority;
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });
  }, [predictions]);

  // 高优先级预测（健康预警）
  const highPriorityPredictions = sortedPredictions.filter(p => p.type === 'health');
  const normalPredictions = sortedPredictions.filter(p => p.type !== 'health');

  return (
    <Card className={`p-4 ${className}`}>
      {/* 标题 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-500" />
          <h3 className="font-bold text-gray-800">智能预测</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          AI驱动
        </Badge>
      </div>

      {/* 高优先级预警 */}
      {highPriorityPredictions.length > 0 && (
        <div className="mb-4">
          {highPriorityPredictions.map(prediction => {
            const Icon = iconMap[prediction.icon];
            return (
              <div 
                key={prediction.id}
                className="p-4 bg-red-50 border border-red-100 rounded-xl animate-pulse"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-red-100 text-red-700 text-xs">
                        {typeConfig[prediction.type].label}
                      </Badge>
                      <span className="text-xs text-red-500 font-medium">
                        置信度 {prediction.confidence}%
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-800 mb-1">{prediction.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{prediction.description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{prediction.timeframe}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 普通预测列表 */}
      <div className="space-y-3">
        {normalPredictions.slice(0, 3).map(prediction => {
          const Icon = iconMap[prediction.icon];
          const config = typeConfig[prediction.type];
          
          return (
            <div 
              key={prediction.id}
              className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${config.color.split(' ')[0]}`}>
                  <Icon className="w-4 h-4" style={{ color: 'inherit' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`${config.color} text-xs`}>
                      {config.label}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {prediction.confidence}% 置信度
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-800 text-sm mb-1 truncate">
                    {prediction.title}
                  </h4>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {prediction.description}
                  </p>
                  {prediction.action && (
                    <button className="mt-2 text-xs text-orange-500 font-medium hover:underline">
                      {prediction.action} →
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部说明 */}
      <div className="mt-4 p-3 bg-purple-50 rounded-lg">
        <p className="text-xs text-purple-700">
          <span className="font-medium">🤖 AI预测：</span>
          基于历史数据和行为模式，预测准确率会随使用时间提升
        </p>
      </div>
    </Card>
  );
};

export default SmartPredictionCard;
