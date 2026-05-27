// ============================================
// PawSync Pro 3.0 - Health Dashboard Component
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 沉浸式健康仪表盘 - 0-100分整体健康评分+四维度环形图
// ============================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Activity, 
  Utensils, 
  Moon, 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ChevronRight,
  RefreshCw,
  Calendar,
  Target
} from 'lucide-react';
import { aiHealthAlertService } from '../../services/aiHealthAlertService';
import type { ComprehensiveHealthScore, HealthDashboard } from '../../types/advanced-health';

interface HealthDashboardComponentProps {
  petId: string;
  onNavigateToDetails?: () => void;
}

export function HealthDashboardComponent({ petId, onNavigateToDetails }: HealthDashboardComponentProps) {
  const [healthScore, setHealthScore] = useState<ComprehensiveHealthScore | null>(null);
  const [dashboard, setDashboard] = useState<HealthDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    loadData();
  }, [petId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [score, dash] = await Promise.all([
        aiHealthAlertService.getComprehensiveHealthScore(petId),
        aiHealthAlertService.getHealthDashboard(petId)
      ]);
      setHealthScore(score);
      setDashboard(dash);
      
      // 延迟触发完成动画
      setTimeout(() => setAnimationComplete(true), 2000);
    } catch (error) {
      console.error('Failed to load health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4" />;
      case 'down': return <TrendingDown className="w-4 h-4" />;
      case 'stable': return <Minus className="w-4 h-4" />;
    }
  };

  const getDimensionIcon = (icon: string) => {
    switch (icon) {
      case 'activity': return <Activity className="w-5 h-5" />;
      case 'nutrition': return <Utensils className="w-5 h-5" />;
      case 'sleep': return <Moon className="w-5 h-5" />;
      case 'mental': return <Brain className="w-5 h-5" />;
      default: return <Shield className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCw className="w-8 h-8 text-green-500" />
        </motion.div>
      </div>
    );
  }

  if (!healthScore || !dashboard) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>暂无健康数据</p>
      </div>
    );
  }

  const dimensionConfigs = {
    activity: { color: '#22C55E', label: '活动', icon: Activity },
    nutrition: { color: '#F97316', label: '营养', icon: Utensils },
    sleep: { color: '#8B5CF6', label: '睡眠', icon: Moon },
    mental: { color: '#06B6D4', label: '心理', icon: Brain }
  };

  return (
    <div className="space-y-6">
      {/* 整体健康评分卡片 */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden"
      >
        {/* 背景装饰 */}
        <div className="absolute inset-0 opacity-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-20 -right-20 w-60 h-60 border-8 border-white rounded-full"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            className="absolute -bottom-30 -left-30 w-80 h-80 border-8 border-white rounded-full"
          />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <motion.p 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-green-100 text-sm font-medium"
              >
                整体健康指数
              </motion.p>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: animationComplete ? 1 : 0 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.5 }}
                className="text-6xl font-bold mt-2"
              >
                {healthScore.overall}
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: animationComplete ? 1 : 0 }}
                transition={{ delay: 0.8 }}
                className="flex items-center gap-2 mt-2"
              >
                <span className={`flex items-center gap-1 text-sm px-2 py-1 rounded-full ${
                  healthScore.trend === 'up' ? 'bg-green-400/30' :
                  healthScore.trend === 'down' ? 'bg-red-400/30' : 'bg-gray-400/30'
                }`}>
                  {getTrendIcon(healthScore.trend)}
                  <span className="text-xs">
                    {healthScore.trend === 'up' ? '上升趋势' :
                     healthScore.trend === 'down' ? '下降趋势' : '保持稳定'}
                  </span>
                </span>
              </motion.div>
            </div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: animationComplete ? 1 : 0 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.6 }}
              className="relative w-24 h-24"
            >
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="8"
                  fill="none"
                />
                <motion.circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="white"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: '0 251' }}
                  animate={{ strokeDasharray: `${(healthScore.overall / 100) * 251} 251` }}
                  transition={{ duration: 2, delay: 0.5, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Shield className="w-10 h-10" />
              </div>
            </motion.div>
          </div>

          {/* 预测风险提示 */}
          {healthScore.prediction && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-3"
            >
              <p className="text-sm text-green-100">
                <span className="font-medium">AI预测：</span>
                {healthScore.prediction.riskLevel === 'low' ? '风险等级低' : '建议关注'}
              </p>
              {healthScore.prediction.predictedIssues.length > 0 && (
                <ul className="mt-1 text-xs text-green-200 list-disc list-inside">
                  {healthScore.prediction.predictedIssues.map((issue, idx) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}

          <div className="flex items-center gap-2 mt-4 text-xs text-green-200">
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 bg-green-300 rounded-full"
            />
            <span>实时监测中 · 数据更新于 {new Date(healthScore.lastUpdated).toLocaleTimeString()}</span>
          </div>
        </div>
      </motion.div>

      {/* 四维度环形健康图 */}
      <div className="grid grid-cols-2 gap-4">
        {healthScore.dimensions.map((dimension, index) => {
          const config = dimensionConfigs[dimension.id as keyof typeof dimensionConfigs];
          const Icon = config?.icon || Shield;
          const isSelected = selectedDimension === dimension.id;
          
          return (
            <motion.div
              key={dimension.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 + 0.5 }}
              onClick={() => setSelectedDimension(isSelected ? null : dimension.id)}
              className={`relative bg-white rounded-2xl p-4 shadow-sm border-2 transition-all cursor-pointer ${
                isSelected ? 'border-green-400 shadow-md' : 'border-transparent'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center`} style={{ backgroundColor: `${config?.color}15` }}>
                  <Icon className="w-5 h-5" style={{ color: config?.color }} />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                  dimension.trend === 'up' ? 'bg-green-50 text-green-600' :
                  dimension.trend === 'down' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600'
                }`}>
                  {getTrendIcon(dimension.trend)}
                  <span className="text-xs font-medium">
                    {dimension.trend === 'up' ? '+' : dimension.trend === 'down' ? '-' : ''}{dimension.change}
                  </span>
                </div>
              </div>

              <div className="relative w-full h-20 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="35"
                    stroke="#f3f4f6"
                    strokeWidth="6"
                    fill="none"
                  />
                  <motion.circle
                    cx="50%"
                    cy="50%"
                    r="35"
                    stroke={config?.color}
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: '0 220' }}
                    animate={{ strokeDasharray: `${(dimension.score / 100) * 220} 220` }}
                    transition={{ duration: 1.5, delay: index * 0.1 + 1, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-2xl font-bold" style={{ color: config?.color }}>
                    {dimension.score}
                  </span>
                  <span className="text-xs text-gray-500">分</span>
                </div>
              </div>

              <p className="text-sm font-medium text-gray-700 text-center mt-2">{config?.label}</p>

              {/* 展开详情 */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-3 pt-3 border-t border-gray-100 overflow-hidden"
                  >
                    <div className="space-y-1">
                      {dimension.metrics.map((metric, idx) => (
                        <p key={idx} className="text-xs text-gray-600">{metric}</p>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* 快速数据概览 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            今日数据概览
          </h3>
          <button 
            onClick={loadData}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{dashboard.activity.daily}</p>
            <p className="text-xs text-gray-500 mt-1">活动分钟</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{dashboard.sleep.duration.toFixed(1)}</p>
            <p className="text-xs text-gray-500 mt-1">睡眠小时</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{dashboard.nutrition.calories}</p>
            <p className="text-xs text-gray-500 mt-1">摄入热量</p>
          </div>
        </div>

        {/* 体重趋势 */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">体重趋势</span>
            <span className="text-sm font-medium text-gray-800">
              {dashboard.weight.current}kg
              <span className="text-xs text-gray-500 ml-1">
                (目标 {dashboard.weight.target}kg)
              </span>
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(dashboard.weight.current / dashboard.weight.target) * 100}%` }}
              transition={{ duration: 1.5, delay: 2 }}
              className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* 导航按钮 */}
      <button
        onClick={onNavigateToDetails}
        className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow"
      >
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5 text-green-500" />
          <span className="font-medium text-gray-700">查看详细健康报告</span>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </button>
    </div>
  );
}
