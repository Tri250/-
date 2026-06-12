import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Calendar,
  ChevronDown,
  Utensils,
  Droplets,
  Flame,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  PieChart,
  BarChart3
} from 'lucide-react';
import { useDietStore, type TimeRange } from '../store/dietStore';

interface DietDataPageProps {
  onNavigate: (page: string) => void;
}

export const DietDataPage: React.FC<DietDataPageProps> = ({ onNavigate }) => {
  const {
    timeRange,
    setTimeRange,
    selectedDate,
    setSelectedDate,
    getStats,
    getNutritionIntake,
    initialize,
    isLoading,
  } = useDietStore();
  
  const [localTimeRange, setLocalTimeRange] = useState<TimeRange>('day');

  useEffect(() => {
    initialize();
  }, [initialize]);

  // 获取统计数据
  const stats = getStats('pet-1', localTimeRange);
  const nutrition = getNutritionIntake('pet-1');

  // 今日数据
  const todayData: DietDataItem[] = [
    {
      type: 'feeding',
      label: '进食次数',
      value: '8',
      unit: '次',
      change: 1,
      changeLabel: '较昨日',
      icon: Utensils,
      color: '#3B82F6',
      bgColor: '#EFF6FF',
    },
    {
      type: 'drinking',
      label: '进食总量',
      value: '320',
      unit: 'g',
      change: -5,
      changeLabel: '较昨日',
      icon: Droplets,
      color: '#10B981',
      bgColor: '#ECFDF5',
    },
    {
      type: 'calories',
      label: '消耗卡路里',
      value: '280',
      unit: 'kcal',
      change: 12,
      changeLabel: '较昨日',
      icon: Flame,
      color: '#F59E0B',
      bgColor: '#FFFBEB',
    },
    {
      type: 'duration',
      label: '进食时长',
      value: '12',
      unit: '分钟',
      change: 0,
      changeLabel: '较昨日',
      icon: Clock,
      color: '#8B5CF6',
      bgColor: '#F5F3FF',
    },
  ];

  // 周数据
  const weekData: TimeRangeData[] = [
    { date: '周一', feeding: 7, drinking: 310, calories: 260, duration: 11 },
    { date: '周二', feeding: 8, drinking: 320, calories: 280, duration: 12 },
    { date: '周三', feeding: 6, drinking: 290, calories: 240, duration: 10 },
    { date: '周四', feeding: 8, drinking: 330, calories: 290, duration: 13 },
    { date: '周五', feeding: 7, drinking: 300, calories: 270, duration: 11 },
    { date: '周六', feeding: 9, drinking: 340, calories: 300, duration: 14 },
    { date: '周日', feeding: 8, drinking: 320, calories: 280, duration: 12 },
  ];

  // 营养摄入分布
  const nutritionData = [
    { name: '蛋白质', value: 35, color: '#3B82F6' },
    { name: '脂肪', value: 25, color: '#F59E0B' },
    { name: '碳水化合物', value: 30, color: '#10B981' },
    { name: '纤维', value: 10, color: '#8B5CF6' },
  ];

  // 获取变化趋势图标
  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-3 h-3" />;
    if (change < 0) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  // 获取变化颜色
  const getTrendColor = (change: number, type: DietDataType) => {
    // 对于进食量和卡路里，增加是正面的
    const positiveIncrease = ['feeding', 'calories', 'duration'];
    const isPositive = positiveIncrease.includes(type);
    
    if (change === 0) return 'text-gray-400';
    if (isPositive) {
      return change > 0 ? 'text-green-500' : 'text-red-500';
    } else {
      return change < 0 ? 'text-green-500' : 'text-red-500';
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* 顶部导航 */}
      <div className="bg-white px-4 pt-12 pb-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate('home')}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-800">饮食数据</h1>
          <button className="p-2 -mr-2 rounded-full hover:bg-gray-100 transition-colors">
            <PieChart className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* 日期选择器 */}
      <div className="px-4 py-3 bg-white">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setTimeRange('day')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              timeRange === 'day'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            日
          </button>
          <button
            onClick={() => setTimeRange('week')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              timeRange === 'week'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            周
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              timeRange === 'month'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            月
          </button>
        </div>
        <button className="flex items-center gap-2 mt-3 text-gray-600">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">{selectedDate}</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* 今日数据概览 */}
      <div className="px-4 py-4">
        <h2 className="text-base font-bold text-gray-800 mb-3">今日概览</h2>
        <div className="grid grid-cols-2 gap-3">
          {todayData.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: item.bgColor }}
                >
                  <item.icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <span className="text-sm text-gray-600">{item.label}</span>
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-2xl font-bold text-gray-800">{item.value}</span>
                <span className="text-sm text-gray-500">{item.unit}</span>
              </div>
              <div className={`flex items-center gap-1 text-xs ${getTrendColor(item.change, item.type)}`}>
                {getTrendIcon(item.change)}
                <span>{Math.abs(item.change)}%</span>
                <span className="text-gray-400">{item.changeLabel}</span>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <span className="text-xs text-gray-400">正常</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 周趋势图表 */}
      {timeRange === 'week' && (
        <div className="px-4 pb-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">本周趋势</h3>
              <button className="flex items-center gap-1 text-sm text-orange-500">
                <BarChart3 className="w-4 h-4" />
                详细分析
              </button>
            </div>
            <div className="space-y-4">
              {/* 进食次数趋势 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">进食次数</span>
                  <span className="text-sm font-medium text-gray-800">平均 7.6 次/天</span>
                </div>
                <div className="flex items-end gap-2 h-20">
                  {weekData.map((day, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-blue-100 rounded-t-lg transition-all"
                        style={{ height: `${(day.feeding / 10) * 100}%` }}
                      >
                        <div
                          className="w-full bg-blue-500 rounded-t-lg"
                          style={{ height: '100%' }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-400">{day.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 卡路里趋势 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">消耗卡路里</span>
                  <span className="text-sm font-medium text-gray-800">平均 274 kcal/天</span>
                </div>
                <div className="flex items-end gap-2 h-20">
                  {weekData.map((day, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-orange-100 rounded-t-lg transition-all"
                        style={{ height: `${(day.calories / 350) * 100}%` }}
                      >
                        <div
                          className="w-full bg-orange-500 rounded-t-lg"
                          style={{ height: '100%' }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-400">{day.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 营养摄入分布 */}
      <div className="px-4 pb-24">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4">营养摄入分布</h3>
          <div className="flex items-center gap-6">
            {/* 饼图示意 */}
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {nutritionData.reduce((acc, item, index) => {
                  const prevOffset = acc.offset;
                  const dashArray = `${item.value} ${100 - item.value}`;
                  acc.elements.push(
                    <circle
                      key={index}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={item.color}
                      strokeWidth="20"
                      strokeDasharray={dashArray}
                      strokeDashoffset={-prevOffset}
                    />
                  );
                  acc.offset += item.value;
                  return acc;
                }, { elements: [] as React.ReactNode[], offset: 0 }).elements}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-lg font-bold text-gray-800">100%</span>
                  <p className="text-xs text-gray-400">营养均衡</p>
                </div>
              </div>
            </div>

            {/* 图例 */}
            <div className="flex-1 space-y-2">
              {nutritionData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm text-gray-600">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-800">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 饮食建议 */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl p-4 mt-4 text-white">
          <h3 className="font-bold mb-2">饮食建议</h3>
          <p className="text-sm text-orange-100 mb-3">
            根据JOJO的体重和活动量，建议每日摄入350g狗粮，分3-4次喂食。
          </p>
          <button
            onClick={() => onNavigate('diet-advice')}
            className="px-4 py-2 bg-white/20 rounded-lg text-sm font-medium"
          >
            查看详细建议
          </button>
        </div>
      </div>
    </div>
  );
};
