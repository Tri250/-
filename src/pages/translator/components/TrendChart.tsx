// ============================================
// PawSync Pro - TrendChart.tsx
// 
// 描述: 情绪趋势图表组件
// ============================================

import React from 'react';
import { Activity, X, ChevronRight } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { EmotionTrendChart } from '../../../components/EmotionTrendChart';

/**
 * 趋势数据接口
 */
export interface TrendDataPoint {
  date: string;
  happy: number;
  anxious: number;
  angry: number;
  neutral: number;
  needs: number;
  overall: number;
}

/**
 * 组件属性
 */
export interface TrendChartProps {
  data?: TrendDataPoint[];
  period?: 'week' | 'month' | 'year';
  onClose?: () => void;
  className?: string;
}

/**
 * 默认趋势数据（示例）
 */
const DEFAULT_TREND_DATA: TrendDataPoint[] = [
  { date: '周一', happy: 60, anxious: 20, angry: 5, neutral: 10, needs: 5, overall: 75 },
  { date: '周二', happy: 70, anxious: 15, angry: 3, neutral: 8, needs: 4, overall: 82 },
  { date: '周三', happy: 55, anxious: 25, angry: 8, neutral: 7, needs: 5, overall: 68 },
  { date: '周四', happy: 80, anxious: 10, angry: 2, neutral: 5, needs: 3, overall: 88 },
  { date: '周五', happy: 75, anxious: 12, angry: 4, neutral: 6, needs: 3, overall: 85 },
  { date: '周六', happy: 85, anxious: 8, angry: 2, neutral: 3, needs: 2, overall: 92 },
  { date: '周日', happy: 78, anxious: 10, angry: 3, neutral: 5, needs: 4, overall: 87 },
];

/**
 * 情绪趋势图表组件
 * 显示宠物情绪变化的分析
 */
export function TrendChart({
  data = DEFAULT_TREND_DATA,
  period = 'week',
  onClose,
  className = '',
}: TrendChartProps) {
  return (
    <div className={`bg-white rounded-2xl p-6 shadow-2xl animate-fadeIn max-h-[85vh] overflow-hidden flex flex-col ${className}`}>
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Activity className="w-5 h-5 text-orange-500" />
          情绪趋势分析
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* 图表内容 */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {/* 趋势图表 */}
        <EmotionTrendChart data={data} period={period} />

        {/* 本周总结 */}
        <Card className="p-4 bg-gradient-to-br from-orange-50 to-yellow-50">
          <h4 className="font-medium text-gray-800 mb-3">本周情绪总结</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">平均情绪指数</span>
              <span className="font-medium text-orange-600">
                {Math.round(data.reduce((sum, d) => sum + d.overall, 0) / data.length)}分
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">情绪波动</span>
              <span className="font-medium text-blue-600">
                {Math.round(Math.sqrt(data.reduce((sum, d) => sum + Math.pow(d.overall - 80, 2), 0) / data.length)) < 10 ? '稳定' : '中等'}
              </span>
            </div>
          </div>
        </Card>

        {/* 建议 */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3">
          <p className="text-xs text-green-700">
            <span className="font-medium">💡 建议：</span>
            保持规律的互动和关爱，有助于维持宠物稳定的情绪状态。
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * 趋势入口卡片组件
 */
export interface TrendEntryCardProps {
  onClick?: () => void;
  className?: string;
}

export function TrendEntryCard({ onClick, className = '' }: TrendEntryCardProps) {
  return (
    <Card
      variant="default"
      padding="medium"
      className={`cursor-pointer hover:shadow-md transition-shadow ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-gray-800">情绪趋势分析</p>
            <p className="text-xs text-gray-500">查看毛孩子的情绪变化趋势</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge color="orange" size="small">AI分析</Badge>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </Card>
  );
}