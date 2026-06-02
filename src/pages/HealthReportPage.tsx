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

  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadReportData();
  }, [petId, reportPeriod]);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const reportContent = generatePDFContent();
      const blob = new Blob([reportContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${petName}_健康报告_${new Date().toLocaleDateString('zh-CN')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出失败:', error);
    } finally {
      setExporting(false);
    }
  };

  const generatePDFContent = (): string => {
    const periodLabel = periodLabels[reportPeriod];
    const exportTime = new Date().toLocaleString('zh-CN');
    
    let content = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${petName}健康报告</title>
  <style>
    body { font-family: 'Microsoft YaHei', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 2px solid #22C55E; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #22C55E; font-size: 28px; margin: 0; }
    .header p { color: #666; margin-top: 10px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 18px; color: #333; border-left: 4px solid #22C55E; padding-left: 10px; margin-bottom: 15px; }
    .score-box { background: linear-gradient(135deg, #22C55E, #10B981); color: white; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px; }
    .score-box .score { font-size: 48px; font-weight: bold; }
    .dimension-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
    .dimension-card { background: #f8f9fa; padding: 15px; border-radius: 8px; }
    .dimension-card h3 { margin: 0 0 10px 0; color: #333; }
    .dimension-card .score { font-size: 24px; font-weight: bold; }
    .alert-item { padding: 10px; margin-bottom: 10px; border-radius: 5px; }
    .alert-red { background: #fee2e2; border: 1px solid #ef4444; }
    .alert-orange { background: #ffedd5; border: 1px solid #f97316; }
    .alert-yellow { background: #fef3c7; border: 1px solid #eab308; }
    .alert-green { background: #dcfce7; border: 1px solid #22c55e; }
    .recommendation { background: #f0fdf4; padding: 15px; border-radius: 8px; margin-top: 20px; }
    .recommendation li { margin-bottom: 8px; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; }
    .disclaimer { background: #fff7ed; padding: 15px; border-radius: 8px; border: 1px solid #fed7aa; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🐾 ${petName}的健康报告</h1>
    <p>报告类型: ${periodLabel} | 生成时间: ${exportTime}</p>
  </div>
`;

    if (healthScore) {
      content += `
  <div class="section">
    <div class="section-title">整体健康评分</div>
    <div class="score-box">
      <div class="score">${healthScore.overall}</div>
      <p>健康趋势: ${healthScore.trend === 'up' ? '上升' : healthScore.trend === 'down' ? '下降' : '稳定'}</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">四维度健康分析</div>
    <div class="dimension-grid">
      ${healthScore.dimensions.map(dim => {
        const config = dimensionConfigs[dim.id as keyof typeof dimensionConfigs];
        return `
        <div class="dimension-card">
          <h3>${config?.label || dim.name}</h3>
          <div class="score" style="color: ${config?.color || '#333'}">${dim.score}</div>
          <p>趋势: ${dim.trend === 'up' ? '上升 +' + dim.change : dim.trend === 'down' ? '下降 ' + dim.change : '稳定'}</p>
          <ul>
            ${dim.metrics.map(m => `<li>${m}</li>`).join('')}
          </ul>
        </div>
        `;
      }).join('')}
    </div>
  </div>
`;
    }

    if (healthScore?.prediction) {
      content += `
  <div class="section">
    <div class="section-title">AI健康建议</div>
    <div class="recommendation">
      <p><strong>风险评估:</strong> ${healthScore.prediction.riskLevel === 'low' ? '低风险' : '需关注'}</p>
      ${healthScore.prediction.predictedIssues.length > 0 ? `
      <p><strong>需要关注的问题:</strong></p>
      <ul>
        ${healthScore.prediction.predictedIssues.map(issue => `<li>${issue}</li>`).join('')}
      </ul>
      ` : '<p>当前各项指标正常，继续保持良好的护理习惯</p>'}
    </div>
  </div>
`;
    }

    if (dashboard) {
      content += `
  <div class="section">
    <div class="section-title">数据概览</div>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 10px; border: 1px solid #eee;"><strong>活动时间</strong></td>
        <td style="padding: 10px; border: 1px solid #eee;">${dashboard.activity.daily} 分钟/天</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #eee;"><strong>睡眠时长</strong></td>
        <td style="padding: 10px; border: 1px solid #eee;">${dashboard.sleep.duration.toFixed(1)} 小时</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #eee;"><strong>摄入热量</strong></td>
        <td style="padding: 10px; border: 1px solid #eee;">${dashboard.nutrition.calories} kcal</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #eee;"><strong>当前体重</strong></td>
        <td style="padding: 10px; border: 1px solid #eee;">${dashboard.weight.current} kg (目标: ${dashboard.weight.target} kg)</td>
      </tr>
    </table>
  </div>
`;
    }

    if (alerts.length > 0) {
      content += `
  <div class="section">
    <div class="section-title">健康警报记录</div>
    ${alerts.slice(0, 5).map(alert => `
    <div class="alert-item alert-${alert.alertLevel}">
      <p><strong>${alert.description}</strong></p>
      <p>${alert.recommendation}</p>
      <p style="font-size: 12px; color: #666;">${new Date(alert.timestamp).toLocaleString('zh-CN')}</p>
    </div>
    `).join('')}
  </div>
`;
    }

    content += `
  <div class="disclaimer">
    <p><strong>⚠️ 免责声明</strong></p>
    <p>本报告为AI辅助分析，不构成医疗诊断。如有健康问题，请以专业兽医意见为准。</p>
  </div>

  <div class="footer">
    <p>PawSync Pro - 智能宠物健康管理平台</p>
    <p>报告生成时间: ${exportTime}</p>
  </div>
</body>
</html>
`;

    return content;
  };

  const handleShareReport = async () => {
    try {
      const shareData = {
        title: `${petName}的健康报告`,
        text: `${petName}的健康评分: ${healthScore?.overall || 'N/A'}分，查看详细报告请点击链接`,
        url: window.location.href
      };
      
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        const textToCopy = `${petName}的健康报告\n健康评分: ${healthScore?.overall || 'N/A'}分\n生成时间: ${new Date().toLocaleString('zh-CN')}\n查看详情: ${window.location.href}`;
        await navigator.clipboard.writeText(textToCopy);
        alert('报告信息已复制到剪贴板，可分享给他人');
      }
    } catch (error) {
      console.error('分享失败:', error);
    }
  };

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
            onClick={handleExportPDF}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-700 font-medium hover:shadow-md transition-shadow"
          >
            <Download className="w-5 h-5" />
            下载报告
          </button>
          <button
            onClick={handleShareReport}
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