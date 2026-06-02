// ============================================
// PawSync Pro - HealthReportPage.tsx
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 详细健康报告页面
// ============================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Shield,
  Activity,
  Utensils,
  Moon,
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Heart,
  Thermometer,
  PawPrint,
  FileText,
  Download,
  Share2
} from 'lucide-react';
import { aiHealthAlertService } from '../services/aiHealthAlertService';
import { useAppStore } from '../store/appStore';
import type { ComprehensiveHealthScore, HealthReport, HealthDashboard, AIBehaviorAlert } from '../types/advanced-health';

interface HealthReportPageProps {
  onNavigate: (page: string) => void;
}

export function HealthReportPage({ onNavigate }: HealthReportPageProps) {
  const { currentPet } = useAppStore();
  const [healthScore, setHealthScore] = useState<ComprehensiveHealthScore | null>(null);
  const [dashboard, setDashboard] = useState<HealthDashboard | null>(null);
  const [alerts, setAlerts] = useState<AIBehaviorAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const petId = currentPet?.id || '1';
  const petName = currentPet?.name || '毛孩子';

  useEffect(() => {
    loadReportData();
  }, [petId, reportPeriod]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const [score, dash, alertList] = await Promise.all([
        aiHealthAlertService.getComprehensiveHealthScore(petId),
        aiHealthAlertService.getHealthDashboard(petId),
        aiHealthAlertService.getAIBehaviorAlerts(petId)
      ]);
      setHealthScore(score);
      setDashboard(dash);
      setAlerts(alertList);
    } catch (error) {
      console.error('Failed to load health report:', error);
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

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-green-500';
      case 'down': return 'text-red-500';
      case 'stable': return 'text-gray-500';
    }
  };

  const dimensionConfigs = {
    activity: { color: '#22C55E', label: '活动健康', icon: Activity, bgColor: 'bg-green-50' },
    nutrition: { color: '#F97316', label: '营养健康', icon: Utensils, bgColor: 'bg-orange-50' },
    sleep: { color: '#8B5CF6', label: '睡眠健康', icon: Moon, bgColor: 'bg-purple-50' },
    mental: { color: '#06B6D4', label: '心理健康', icon: Brain, bgColor: 'bg-cyan-50' }
  };

  const periodLabels = {
    daily: '日报',
    weekly: '周报',
    monthly: '月报'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="flex flex-col items-center gap-4"
        >
          <RefreshCw className="w-10 h-10 text-green-500" />
          <p className="text-sm text-gray-500">正在生成健康报告...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-green-100 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('advanced-health')}
              className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-800">{petName}的健康报告</h1>
              <p className="text-xs text-gray-500">AI智能分析 · 详细健康评估</p>
            </div>
            <button
              onClick={loadReportData}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* 报告周期选择 */}
        <div className="flex gap-2 bg-white rounded-xl p-2 shadow-sm">
          {(['daily', 'weekly', 'monthly'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setReportPeriod(period)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                reportPeriod === period
                  ? 'bg-green-500 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {periodLabels[period]}
            </button>
          ))}
        </div>

        {/* 整体健康评分 */}
        {healthScore && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-3xl p-6 text-white shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-green-100 text-sm">整体健康评分</p>
                <p className="text-5xl font-bold mt-2">{healthScore.overall}</p>
                <div className={`flex items-center gap-2 mt-2 ${getTrendColor(healthScore.trend)}`}>
                  {getTrendIcon(healthScore.trend)}
                  <span className="text-sm">
                    {healthScore.trend === 'up' ? '较上次提升' :
                     healthScore.trend === 'down' ? '较上次下降' : '保持稳定'}
                  </span>
                </div>
              </div>
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                <Shield className="w-10 h-10" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-green-200">
              <Calendar className="w-4 h-4" />
              <span>报告生成时间: {new Date(healthScore.lastUpdated).toLocaleString()}</span>
            </div>
          </motion.div>
        )}

        {/* 四维度详细分析 */}
        {healthScore && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              四维度健康分析
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {healthScore.dimensions.map((dimension, index) => {
                const config = dimensionConfigs[dimension.id as keyof typeof dimensionConfigs];
                const Icon = config?.icon || Shield;
                return (
                  <motion.div
                    key={dimension.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl ${config?.bgColor} flex items-center justify-center`}>
                        <Icon className="w-5 h-5" style={{ color: config?.color }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{config?.label}</p>
                        <p className="text-2xl font-bold" style={{ color: config?.color }}>
                          {dimension.score}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                        dimension.trend === 'up' ? 'bg-green-50 text-green-600' :
                        dimension.trend === 'down' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600'
                      }`}>
                        {getTrendIcon(dimension.trend)}
                        {dimension.change > 0 ? '+' : ''}{dimension.change}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {dimension.metrics.map((metric, idx) => (
                        <p key={idx} className="text-xs text-gray-500">{metric}</p>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* 健康亮点与建议 */}
        {healthScore?.prediction && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              AI健康建议
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">健康状态良好</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {healthScore.prediction.riskLevel === 'low' 
                      ? '当前各项指标正常，继续保持良好的护理习惯'
                      : '建议关注以下潜在问题'}
                  </p>
                </div>
              </div>

              {healthScore.prediction.predictedIssues.length > 0 && (
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">需要关注</p>
                    <ul className="mt-1 space-y-1">
                      {healthScore.prediction.predictedIssues.map((issue, idx) => (
                        <li key={idx} className="text-xs text-gray-500 flex items-center gap-1">
                          <span className="w-1 h-1 bg-orange-400 rounded-full" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 今日数据概览 */}
        {dashboard && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              数据概览
            </h2>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mx-auto mb-2">
                  <Activity className="w-6 h-6 text-green-500" />
                </div>
                <p className="text-xl font-bold text-gray-800">{dashboard.activity.daily}</p>
                <p className="text-xs text-gray-500">活动分钟</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mx-auto mb-2">
                  <Moon className="w-6 h-6 text-purple-500" />
                </div>
                <p className="text-xl font-bold text-gray-800">{dashboard.sleep.duration.toFixed(1)}</p>
                <p className="text-xs text-gray-500">睡眠小时</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mx-auto mb-2">
                  <Utensils className="w-6 h-6 text-orange-500" />
                </div>
                <p className="text-xl font-bold text-gray-800">{dashboard.nutrition.calories}</p>
                <p className="text-xs text-gray-500">摄入热量</p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-gray-600">心率范围</span>
                </div>
                <span className="text-sm font-medium text-gray-800">110-130 bpm</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-gray-600">体温</span>
                </div>
                <span className="text-sm font-medium text-gray-800">38.2°C</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PawPrint className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600">体重</span>
                </div>
                <span className="text-sm font-medium text-gray-800">
                  {dashboard.weight.current}kg (目标: {dashboard.weight.target}kg)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 健康警报列表 */}
        {alerts.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              健康警报记录
            </h2>
            
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-xl ${
                    alert.alertLevel === 'red' ? 'bg-red-50 border border-red-200' :
                    alert.alertLevel === 'orange' ? 'bg-orange-50 border border-orange-200' :
                    alert.alertLevel === 'yellow' ? 'bg-yellow-50 border border-yellow-200' :
                    'bg-green-50 border border-green-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{alert.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{alert.recommendation}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      alert.alertLevel === 'red' ? 'bg-red-100 text-red-700' :
                      alert.alertLevel === 'orange' ? 'bg-orange-100 text-orange-700' :
                      alert.alertLevel === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {alert.alertLevel === 'red' ? '紧急' :
                       alert.alertLevel === 'orange' ? '警告' :
                       alert.alertLevel === 'yellow' ? '注意' : '正常'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <button
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-700 font-medium hover:shadow-md transition-shadow"
          >
            <Download className="w-5 h-5" />
            下载报告
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-700 font-medium hover:shadow-md transition-shadow"
          >
            <Share2 className="w-5 h-5" />
            分享报告
          </button>
        </div>

        {/* 免责声明 */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 border border-red-100">
          <p className="text-xs text-gray-500 text-center">
            ⚠️ <strong>免责声明</strong>：本报告为AI辅助分析，不构成医疗诊断，请以专业兽医意见为准
          </p>
        </div>
      </main>
    </div>
  );
}