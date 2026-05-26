// ============================================
// PawSync Pro 3.0 - Dynamic Health Charts Component
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 动态数据可视化图表 - 弹性动画活动量曲线、睡眠报告、成长曲线
// ============================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Moon, 
  TrendingUp, 
  TrendingDown,
  Target,
  Star,
  ChevronDown,
  ChevronUp,
  PawPrint,
  Calendar
} from 'lucide-react';
import { aiHealthAlertService } from '../../services/aiHealthAlertService';
import type { ActivityChartData, SleepChartData, GrowthCurveData } from '../../types/advanced-health';

interface DynamicChartsComponentProps {
  petId: string;
  petName: string;
  petBreed?: string;
}

export function DynamicChartsComponent({ petId, petName, petBreed }: DynamicChartsComponentProps) {
  const [activityData, setActivityData] = useState<ActivityChartData[]>([]);
  const [sleepData, setSleepData] = useState<SleepChartData[]>([]);
  const [growthData, setGrowthData] = useState<GrowthCurveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<ActivityChartData | null>(null);
  const [chartType, setChartType] = useState<'activity' | 'sleep' | 'growth'>('activity');

  useEffect(() => {
    loadChartData();
  }, [petId]);

  const loadChartData = async () => {
    setLoading(true);
    try {
      const [activity, sleep, growth] = await Promise.all([
        aiHealthAlertService.getActivityChartData(petId, 7),
        aiHealthAlertService.getSleepChartData(petId, 7),
        aiHealthAlertService.getGrowthCurveData(petId)
      ]);
      setActivityData(activity);
      setSleepData(sleep);
      setGrowthData(growth);
      setSelectedDay(activity[activity.length - 1]);
    } catch (error) {
      console.error('Failed to load chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diff === 0) return '今天';
    if (diff === 1) return '昨天';
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[date.getDay()];
  };

  // 活动量柱状图
  const renderActivityChart = () => {
    if (!activityData.length) return null;

    const maxActivity = Math.max(...activityData.map(d => d.totalMinutes));

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-500" />
            活动量趋势
          </h3>
          <div className="flex gap-2 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-green-400 rounded-sm" /> 高强度
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-yellow-400 rounded-sm" /> 中强度
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-blue-400 rounded-sm" /> 低强度
            </span>
          </div>
        </div>

        <div className="flex items-end gap-2 h-48">
          {activityData.map((day, index) => {
            const height = (day.totalMinutes / maxActivity) * 100;
            const lowHeight = (day.intensity.low / day.totalMinutes) * height;
            const medHeight = (day.intensity.medium / day.totalMinutes) * height;
            const highHeight = (day.intensity.high / day.totalMinutes) * height;

            return (
              <motion.div
                key={day.date}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.8, delay: index * 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                className="flex-1 flex flex-col items-center gap-1 cursor-pointer group"
                onClick={() => setSelectedDay(day)}
              >
                <div className="w-full flex-1 relative">
                  {/* 低强度 - 蓝色 */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${lowHeight}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 + 0.2 }}
                    className="absolute bottom-0 w-full bg-blue-400 rounded-t-sm hover:bg-blue-500 transition-colors"
                  />
                  {/* 中强度 - 黄色 */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${medHeight}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 + 0.3 }}
                    className="absolute w-full bg-yellow-400 hover:bg-yellow-500 transition-colors"
                    style={{ bottom: `${lowHeight}%` }}
                  />
                  {/* 高强度 - 绿色 */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${highHeight}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 + 0.4 }}
                    className="absolute w-full bg-green-400 hover:bg-green-500 transition-colors"
                    style={{ bottom: `${lowHeight + medHeight}%` }}
                  />

                  {/* 数值标签 */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
                      {day.totalMinutes}分钟
                    </span>
                  </div>
                </div>

                <span className="text-xs text-gray-500 mt-2">{getDayName(day.date)}</span>
              </motion.div>
            );
          })}
        </div>

        {/* 选中日期详情 */}
        <AnimatePresence>
          {selectedDay && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 mt-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-800">
                  {getDayName(selectedDay.date)}活动详情
                </h4>
                <span className="text-xs text-gray-500">{selectedDay.date}</span>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-600">{selectedDay.intensity.low}%</p>
                  <p className="text-xs text-gray-500">低强度</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-yellow-600">{selectedDay.intensity.medium}%</p>
                  <p className="text-xs text-gray-500">中强度</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">{selectedDay.intensity.high}%</p>
                  <p className="text-xs text-gray-500">高强度</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-700">{selectedDay.totalMinutes}</p>
                  <p className="text-xs text-gray-500">总分钟</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-green-200 grid grid-cols-2 gap-2 text-xs text-gray-600">
                <span>🐕 散步: {selectedDay.activities.walking}分钟</span>
                <span>🏃 奔跑: {selectedDay.activities.running}分钟</span>
                <span>🎾 玩耍: {selectedDay.activities.playing}分钟</span>
                <span>😴 休息: {selectedDay.activities.resting}分钟</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // 睡眠环形报告图
  const renderSleepChart = () => {
    if (!sleepData.length) return null;

    const latestSleep = sleepData[sleepData.length - 1];
    const phases = [
      { name: '深睡', value: latestSleep.phases.deep, color: '#8B5CF6' },
      { name: '浅睡', value: latestSleep.phases.light, color: '#A78BFA' },
      { name: 'REM', value: latestSleep.phases.rem, color: '#C4B5FD' },
      { name: '清醒', value: latestSleep.phases.awake, color: '#DDD6FE' }
    ];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Moon className="w-5 h-5 text-purple-500" />
            睡眠分析报告
          </h3>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500">{latestSleep.date}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-8">
          {/* 环形图 */}
          <div className="relative w-40 h-40">
            <svg className="w-full h-full transform -rotate-90">
              {phases.map((phase, index) => {
                const prevTotal = phases.slice(0, index).reduce((sum, p) => sum + p.value, 0);
                const dashArray = `${(phase.value / 100) * 251} 251`;
                const dashOffset = -((prevTotal / 100) * 251);
                
                return (
                  <motion.circle
                    key={phase.name}
                    cx="80"
                    cy="80"
                    r="40"
                    stroke={phase.color}
                    strokeWidth="20"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: '0 251' }}
                    animate={{ 
                      strokeDasharray: dashArray,
                      strokeDashoffset: dashOffset
                    }}
                    transition={{ duration: 1.5, delay: index * 0.2 }}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.8 }}
              >
                <Moon className="w-10 h-10 text-purple-500" />
              </motion.div>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-2xl font-bold text-gray-800"
              >
                {latestSleep.duration.toFixed(1)}h
              </motion.span>
              <span className="text-xs text-gray-500">睡眠时长</span>
            </div>
          </div>

          {/* 图例 */}
          <div className="space-y-3">
            {phases.map((phase, index) => (
              <motion.div
                key={phase.name}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.2 + 0.5 }}
                className="flex items-center gap-2"
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: phase.color }}
                />
                <span className="text-sm text-gray-600">{phase.name}</span>
                <span className="text-sm font-medium text-gray-800">{phase.value}%</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 星星闪烁动画 */}
        <div className="relative h-16 bg-gradient-to-b from-indigo-900 to-purple-900 rounded-xl overflow-hidden mt-4">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            />
          ))}
          
          <div className="absolute inset-0 flex items-center justify-center text-white/80">
            <span className="text-xs">睡眠质量评分: <span className="font-bold">{latestSleep.quality}</span>分</span>
          </div>
        </div>

        {/* 睡眠时间表 */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-purple-50 rounded-xl p-3">
            <p className="text-xs text-purple-600 mb-1">就寝时间</p>
            <p className="text-lg font-bold text-purple-700">{latestSleep.startTime}</p>
          </div>
          <div className="bg-indigo-50 rounded-xl p-3">
            <p className="text-xs text-indigo-600 mb-1">起床时间</p>
            <p className="text-lg font-bold text-indigo-700">{latestSleep.endTime}</p>
          </div>
        </div>
      </div>
    );
  };

  // 成长曲线图
  const renderGrowthChart = () => {
    if (!growthData) return null;

    const { breedStandard, history } = growthData;
    const maxWeight = breedStandard.weightMax + 0.5;
    const minWeight = breedStandard.weightMin - 0.5;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <PawPrint className="w-5 h-5 text-orange-500" />
            成长曲线对比
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>品种: {growthData.petBreed}</span>
          </div>
        </div>

        {/* 百分位显示 */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">当前体重</p>
              <p className="text-2xl font-bold text-orange-600">{growthData.petWeight} kg</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">品种百分位</p>
              <p className="text-2xl font-bold text-amber-600">
                <span className="text-3xl">{growthData.percentile}</span>%
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            {growthData.trajectory === 'above' ? (
              <><TrendingUp className="w-4 h-4 text-green-500" /><span className="text-sm text-green-600">高于平均水平</span></>
            ) : growthData.trajectory === 'below' ? (
              <><TrendingDown className="w-4 h-4 text-red-500" /><span className="text-sm text-red-600">低于平均水平</span></>
            ) : (
              <><Target className="w-4 h-4 text-blue-500" /><span className="text-sm text-blue-600">正常范围</span></>
            )}
          </div>
        </div>

        {/* 成长曲线 */}
        <div className="relative h-48 bg-gray-50 rounded-xl p-4">
          {/* 品种标准范围 */}
          <div className="absolute left-8 right-4 top-1/2 transform -translate-y-1/2 h-24 bg-green-100/50 rounded-lg">
            <div className="absolute top-0 left-0 right-0 h-1/2 border-b border-green-300 border-dashed" />
            <div className="absolute bottom-0 left-0 right-0 border-t border-green-300 border-dashed" />
            <div className="absolute top-1/2 left-0 -translate-y-1/2 -ml-2 text-xs text-green-600">
              {breedStandard.weightAvg}kg
            </div>
            <div className="absolute top-0 left-1 text-xs text-green-600">
              {breedStandard.weightMax}kg
            </div>
            <div className="absolute bottom-0 left-1 text-xs text-green-600">
              {breedStandard.weightMin}kg
            </div>
          </div>

          {/* 实际体重曲线 */}
          <svg className="absolute inset-0 w-full h-full">
            <motion.path
              d={`M ${40} ${140 - (history[0].weight - minWeight) / (maxWeight - minWeight) * 100}
                  ${history.map((h, i) => `L ${40 + i * 40} ${140 - (h.weight - minWeight) / (maxWeight - minWeight) * 100}`).join(' ')}`}
              fill="none"
              stroke="#F97316"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: 'easeInOut' }}
            />
            
            {/* 数据点 */}
            {history.map((h, i) => (
              <motion.circle
                key={h.date}
                cx={40 + i * 40}
                cy={140 - (h.weight - minWeight) / (maxWeight - minWeight) * 100}
                r="4"
                fill="#F97316"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.2 + 1 }}
              />
            ))}
          </svg>

          {/* Y轴标签 */}
          <div className="absolute left-0 top-4 bottom-4 flex flex-col justify-between text-xs text-gray-400 pl-2">
            <span>{maxWeight.toFixed(1)}</span>
            <span>{breedStandard.weightAvg.toFixed(1)}</span>
            <span>{minWeight.toFixed(1)}</span>
          </div>
        </div>

        {/* 历史记录 */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">最近记录</h4>
          {history.slice(0, 3).reverse().map((record, index) => (
            <motion.div
              key={record.date}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between bg-white rounded-lg p-3"
            >
              <div className="flex items-center gap-2">
                <Star className={`w-4 h-4 ${
                  record.trend === 'gaining' ? 'text-green-500' :
                  record.trend === 'losing' ? 'text-red-500' : 'text-gray-400'
                }`} />
                <span className="text-sm text-gray-600">{record.date}</span>
              </div>
              <span className="font-medium text-gray-800">{record.weight} kg</span>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 图表切换标签 */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        {[
          { key: 'activity', icon: Activity, label: '活动' },
          { key: 'sleep', icon: Moon, label: '睡眠' },
          { key: 'growth', icon: PawPrint, label: '成长' }
        ].map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setChartType(key as typeof chartType)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
              chartType === key
                ? 'bg-white shadow-sm text-gray-800 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm">{label}</span>
          </button>
        ))}
      </div>

      {/* 图表内容 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={chartType}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl p-4 shadow-sm"
        >
          {chartType === 'activity' && renderActivityChart()}
          {chartType === 'sleep' && renderSleepChart()}
          {chartType === 'growth' && renderGrowthChart()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
