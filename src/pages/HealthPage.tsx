// ============================================
// PawSync Pro - HealthPage.tsx
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 宠物健康监测和护理指导页面
// ============================================

import { useState } from 'react';
import { Activity, AlertTriangle, Bell, Heart, Moon, Sun, Thermometer, ChevronRight, Shield, Utensils, Scissors, Zap, BookOpen, Star } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { Card } from '../components/ui/Card';

const alertTypeConfig = {
  cough: { icon: Activity, label: '咳嗽', color: 'text-yellow-500', bgColor: 'bg-yellow-50' },
  vomit: { icon: AlertTriangle, label: '呕吐', color: 'text-red-500', bgColor: 'bg-red-50' },
  pain: { icon: Heart, label: '疼痛', color: 'text-purple-500', bgColor: 'bg-purple-50' },
  abnormal: { icon: Bell, label: '异常', color: 'text-orange-500', bgColor: 'bg-orange-50' },
};

const severityConfig = {
  low: { label: '轻微', color: 'text-green-500', bgColor: 'bg-green-100' },
  medium: { label: '中等', color: 'text-yellow-500', bgColor: 'bg-yellow-100' },
  high: { label: '严重', color: 'text-red-500', bgColor: 'bg-red-100' },
};

const careCategoryConfig = {
  feeding: { icon: Utensils, label: '饮食喂养', color: 'text-orange-500', bgColor: 'bg-orange-50' },
  exercise: { icon: Zap, label: '运动玩耍', color: 'text-blue-500', bgColor: 'bg-blue-50' },
  grooming: { icon: Scissors, label: '美容护理', color: 'text-pink-500', bgColor: 'bg-pink-50' },
  health: { icon: Heart, label: '健康医疗', color: 'text-red-500', bgColor: 'bg-red-50' },
  behavior: { icon: BookOpen, label: '行为训练', color: 'text-purple-500', bgColor: 'bg-purple-50' },
};

export default function HealthPage() {
  const { healthAlerts, healthScore, currentPet, careTips } = useAppStore();
  const [nightMode, setNightMode] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const healthMetrics = [
    { label: '心率', value: '120', unit: 'bpm', icon: Heart, color: 'text-red-500', bgColor: 'bg-red-50' },
    { label: '体温', value: '38.2', unit: '°C', icon: Thermometer, color: 'text-orange-500', bgColor: 'bg-orange-50' },
    { label: '活动量', value: '85', unit: '%', icon: Activity, color: 'text-green-500', bgColor: 'bg-green-50' },
  ];

  const dailyData = [
    { time: '00:00', heartRate: 110, activity: 20 },
    { time: '04:00', heartRate: 105, activity: 15 },
    { time: '08:00', heartRate: 125, activity: 70 },
    { time: '12:00', heartRate: 120, activity: 85 },
    { time: '16:00', heartRate: 115, activity: 60 },
    { time: '20:00', heartRate: 118, activity: 45 },
  ];

  const maxHeartRate = Math.max(...dailyData.map(d => d.heartRate));
  const maxActivity = Math.max(...dailyData.map(d => d.activity));

  const filteredTips = activeCategory 
    ? careTips.filter(tip => tip.category === activeCategory)
    : careTips;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50/50 via-white to-emerald-50/30 pb-20">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-green-100">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-800 text-center">全天候健康哨兵</h1>
          <p className="text-xs text-gray-400 text-center">守护 {currentPet?.name} 的健康</p>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-5">
        {/* 健康分数卡片 */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-green-100 text-sm">当前健康指数</p>
              <p className="text-4xl font-bold mt-1">{healthScore}%</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <Shield className="w-8 h-8" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
            <span className="text-green-100">监测中 · 数据更新于 2分钟前</span>
          </div>
        </div>

        {/* 健康指标 */}
        <div className="grid grid-cols-3 gap-3">
          {healthMetrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className={`w-10 h-10 rounded-full ${metric.bgColor} flex items-center justify-center mb-2`}>
                  <Icon className={`w-5 h-5 ${metric.color}`} />
                </div>
                <p className="text-xs text-gray-400 mb-1">{metric.label}</p>
                <p className="text-xl font-bold text-gray-800">{metric.value}<span className="text-xs font-normal text-gray-500 ml-1">{metric.unit}</span></p>
              </div>
            );
          })}
        </div>

        {/* 今日监测曲线 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">今日监测曲线</h2>
            <div className="flex gap-1">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <span className="w-2 h-2 bg-red-400 rounded-full" /> 心率
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <span className="w-2 h-2 bg-green-400 rounded-full" /> 活动
              </span>
            </div>
          </div>
          <div className="flex items-end gap-1 h-24">
            {dailyData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center gap-0.5">
                  <div
                    className="w-2 bg-red-400 rounded-t-sm transition-all duration-300"
                    style={{ height: `${(data.heartRate / maxHeartRate) * 80}px` }}
                  />
                  <div
                    className="w-2 bg-green-400 rounded-t-sm transition-all duration-300"
                    style={{ height: `${(data.activity / maxActivity) * 60}px` }}
                  />
                </div>
                <span className="text-xs text-gray-400">{data.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 夜间监护模式 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Moon className="w-5 h-5 text-purple-500" />
              <h2 className="text-sm font-semibold text-gray-700">夜间监护模式</h2>
            </div>
            <button
              onClick={() => setNightMode(!nightMode)}
              className={`relative w-12 h-6 rounded-full transition-colors ${nightMode ? 'bg-purple-500' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full shadow transition-transform ${nightMode ? 'left-7 bg-white' : 'left-1 bg-gray-400'}`} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs ${nightMode ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
              {nightMode ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
              {nightMode ? '已开启' : '已关闭'}
            </div>
            <p className="text-xs text-gray-400 flex-1">
              {nightMode ? '夜间异常行为将被实时监测' : '夜间监测已关闭'}
            </p>
          </div>
        </div>

        {/* 护理指导分类 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              护理指导
            </h2>
            {activeCategory && (
              <button 
                onClick={() => setActiveCategory(null)}
                className="text-xs text-green-500 font-medium"
              >
                全部
              </button>
            )}
          </div>
          
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {Object.entries(careCategoryConfig).map(([category, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(activeCategory === category ? null : category)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
                    activeCategory === category 
                      ? `${config.bgColor} ${config.color} shadow-sm` 
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-medium">{config.label}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            {filteredTips.map((tip) => {
              const config = careCategoryConfig[tip.category];
              const Icon = config.icon;
              return (
                <Card key={tip.id} variant="default" padding="medium" className="hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-800">{tip.title}</h3>
                        {tip.priority === 'high' && (
                          <span className="flex items-center gap-0.5 text-yellow-500">
                            <Star className="w-3 h-3 fill-current" />
                            <span className="text-xs">重要</span>
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{tip.content}</p>
                      {(tip.petType === 'cat' || tip.petType === 'dog') && (
                        <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${
                          tip.petType === 'cat' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {tip.petType === 'cat' ? '🐱 猫咪专用' : '🐶 狗狗专用'}
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* 健康警报记录 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">健康警报记录</h2>
            <button className="text-xs text-green-500 font-medium flex items-center gap-1 hover:text-green-600">
              全部 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          {healthAlerts.length > 0 ? (
            <div className="space-y-3">
              {healthAlerts.slice(0, 3).map((alert) => {
                const typeConfig = alertTypeConfig[alert.type];
                const severityConfigItem = severityConfig[alert.severity];
                const Icon = typeConfig.icon;
                return (
                  <div key={alert.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${typeConfig.bgColor} flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${typeConfig.color}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">{typeConfig.label}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${severityConfigItem.bgColor} ${severityConfigItem.color}`}>
                              {severityConfigItem.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{alert.message}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">{alert.timestamp}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
              <Shield className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600">暂无健康警报</p>
              <p className="text-xs text-gray-400 mt-1">{currentPet?.name} 状态良好</p>
            </div>
          )}
        </section>

        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 border border-red-100">
          <p className="text-xs text-gray-500 text-center">
            ⚠️ <strong>免责声明</strong>：本结果为AI辅助分析，不构成医疗诊断，请以专业兽医意见为准
          </p>
        </div>
      </main>
    </div>
  );
}