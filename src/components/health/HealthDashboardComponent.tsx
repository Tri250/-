// ============================================
// PawSync Pro 3.0 - Health Dashboard Component
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 沉浸式健康仪表盘 - 0-100分整体健康评分+四维度环形图
// ============================================

import { useState, useEffect, useMemo } from 'react';
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
  Target,
  Syringe,
  Stethoscope,
  BarChart3
} from 'lucide-react';
import { aiHealthAlertService } from '../../services/aiHealthAlertService';
import { medicalRecordOCRService } from '../../services/medicalRecordOCRService';
import type { ComprehensiveHealthScore, HealthDashboard } from '../../types/advanced-health';
import { 
  animationConfig, 
  optimizedDuration, 
  optimizedSpring,
  shouldDisableDecorativeAnimations,
  getHardwareAccelerationStyle 
} from '../../lib/performanceOptimizer';

type StatsTimeFilter = 'year' | 'quarter' | 'month';

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
  const [statsTimeFilter, setStatsTimeFilter] = useState<StatsTimeFilter>('year');
  const [vaccineStats, setVaccineStats] = useState<{ completed: number; total: number; rate: number }>({ completed: 0, total: 0, rate: 0 });
  const [medicalVisitStats, setMedicalVisitStats] = useState<{ count: number; lastVisit: string }>({ count: 0, lastVisit: '' });

  // 性能优化：是否禁用装饰性动画
  const disableDecorative = shouldDisableDecorativeAnimations();
  
  // 优化的动画配置
  const animationVariants = useMemo(() => ({
    container: {
      initial: { scale: 0.95, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      transition: { 
        duration: optimizedDuration.enter / 1000, 
        ease: [0.16, 1, 0.3, 1] as const
      }
    },
    item: {
      initial: { scale: 0.9, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      transition: { 
        duration: optimizedDuration.main / 1000,
        ease: [0.16, 1, 0.3, 1] as const
      }
    },
    fadeSlide: {
      initial: { y: 10, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      transition: { duration: optimizedDuration.secondary / 1000 }
    }
  }), []);

  useEffect(() => {
    loadData();
  }, [petId, statsTimeFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [score, dash, records] = await Promise.all([
        aiHealthAlertService.getComprehensiveHealthScore(petId),
        aiHealthAlertService.getHealthDashboard(petId),
        medicalRecordOCRService.getMedicalRecords(petId)
      ]);
      setHealthScore(score);
      setDashboard(dash);
      
      const vaccineData = dash.vaccination.vaccines;
      const completedVaccines = vaccineData.filter(v => v.status === 'completed').length;
      const totalVaccines = vaccineData.length;
      setVaccineStats({
        completed: completedVaccines,
        total: totalVaccines,
        rate: totalVaccines > 0 ? Math.round((completedVaccines / totalVaccines) * 100) : 0
      });

      const now = new Date();
      const filterStartDate = new Date(now);
      if (statsTimeFilter === 'year') {
        filterStartDate.setFullYear(filterStartDate.getFullYear() - 1);
      } else if (statsTimeFilter === 'quarter') {
        filterStartDate.setMonth(filterStartDate.getMonth() - 3);
      } else {
        filterStartDate.setMonth(filterStartDate.getMonth() - 1);
      }

      const filteredRecords = records.filter(r => new Date(r.date) >= filterStartDate);
      const visitCount = filteredRecords.filter(r => r.type === 'checkup' || r.type === 'lab_report').length;
      const lastVisitRecord = filteredRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      setMedicalVisitStats({
        count: visitCount,
        lastVisit: lastVisitRecord?.date || '无记录'
      });
      
      // 优化：根据性能配置调整动画完成时间
      const animationDelay = animationConfig.complexity === 'full' ? 2000 : 
                            animationConfig.complexity === 'reduced' ? 800 : 300;
      setTimeout(() => setAnimationComplete(true), animationDelay);
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

  const _getDimensionIcon = (icon: string) => {
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
        initial={animationVariants.container.initial}
        animate={animationVariants.container.animate}
        transition={animationVariants.container.transition}
        className="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden"
        style={getHardwareAccelerationStyle()}
      >
        {/* 背景装饰 - 性能优化：低端设备禁用 */}
        {!disableDecorative && (
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
        )}

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <motion.p 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: optimizedDuration.stagger / 1000 }}
                className="text-green-100 text-sm font-medium"
              >
                整体健康指数
              </motion.p>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: animationComplete ? 1 : 0 }}
                transition={{ type: 'spring', ...optimizedSpring.fast, delay: optimizedDuration.stagger * 2 / 1000 }}
                className="text-6xl font-bold mt-2"
              >
                {healthScore.overall}
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: animationComplete ? 1 : 0 }}
                transition={{ delay: optimizedDuration.stagger * 3 / 1000 }}
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
              transition={{ type: 'spring', ...optimizedSpring.gentle, delay: optimizedDuration.stagger * 2 / 1000 }}
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
                  transition={{ duration: optimizedDuration.progress / 1000, delay: optimizedDuration.stagger / 1000, ease: 'easeOut' }}
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
              transition={{ delay: optimizedDuration.stagger * 4 / 1000 }}
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
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * optimizedDuration.stagger / 1000 + optimizedDuration.stagger / 1000 }}
              onClick={() => setSelectedDimension(isSelected ? null : dimension.id)}
              className={`relative bg-white rounded-2xl p-4 shadow-sm border-2 transition-all cursor-pointer ${
                isSelected ? 'border-green-400 shadow-md' : 'border-transparent'
              }`}
              style={getHardwareAccelerationStyle()}
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
                    transition={{ duration: optimizedDuration.progress / 2000, delay: index * optimizedDuration.stagger / 1000 + optimizedDuration.stagger / 1000, ease: 'easeOut' }}
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
              transition={{ duration: optimizedDuration.progress / 2000, delay: optimizedDuration.stagger / 1000 }}
              className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* 多维度统计 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            多维度统计
          </h3>
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[
              { key: 'year', label: '年度' },
              { key: 'quarter', label: '季度' },
              { key: 'month', label: '月度' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStatsTimeFilter(key as StatsTimeFilter)}
                className={`px-2 py-1 rounded text-xs transition-all ${
                  statsTimeFilter === key
                    ? 'bg-white shadow-sm text-gray-800 font-medium'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* 疫苗完成率 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Syringe className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">疫苗完成率</span>
            </div>
            <div className="relative h-16 flex items-center justify-center">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="#e5e7eb"
                  strokeWidth="4"
                  fill="none"
                />
                <motion.circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="#22C55E"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: '0 176' }}
                  animate={{ strokeDasharray: `${(vaccineStats.rate / 100) * 176} 176` }}
                  transition={{ duration: optimizedDuration.progress / 2000, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-green-600">{vaccineStats.rate}%</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              {vaccineStats.completed}/{vaccineStats.total} 已完成
            </p>
          </motion.div>

          {/* 就医频次 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">就医频次</span>
            </div>
            <div className="text-center py-2">
              <p className="text-3xl font-bold text-blue-600">{medicalVisitStats.count}</p>
              <p className="text-xs text-gray-500 mt-1">次就医记录</p>
            </div>
            <div className="mt-2 pt-2 border-t border-blue-200">
              <p className="text-xs text-gray-500">
                最近就医: <span className="font-medium text-gray-700">{medicalVisitStats.lastVisit}</span>
              </p>
            </div>
          </motion.div>
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
