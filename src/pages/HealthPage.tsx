/**
 * HealthPage - 健康页面（温情科技风格）
 *
 * 设计参考：
 * - 顶部米色背景，宠物头像+健康档案
 * - 4列健康指标（体重/体温/心率/呼吸频率）
 * - 健康趋势图表（7天/30天/90天）
 * - 疫苗与驱虫 + 健康提醒
 * - AI健康评估
 */

import React, { useState } from 'react';
import {
  ChevronRight,
  Calendar,
  Edit3,
  Scale,
  Thermometer,
  Heart,
  Wind,
  CheckCircle2,
  AlertCircle,
  Syringe,
  Bug,
  Sparkles,
  Play,
  Dog,
} from 'lucide-react';
import { WarmContainer, WarmCard, SectionTitle } from '../components/WarmContainer';
import { useAppStore } from '../store/appStore';

export default function HealthPage() {
  const { currentPet } = useAppStore();
  const [activeTab, setActiveTab] = useState<'7d' | '30d' | '90d'>('7d');

  const petName = currentPet?.name || 'JOJO';
  const petBreed = currentPet?.breed || '柯基犬';
  const petAge = currentPet?.birthday
    ? `${new Date().getFullYear() - new Date(currentPet.birthday).getFullYear()}岁`
    : '2岁';

  const healthMetrics = [
    { icon: Scale, label: '体重', value: '12.5', unit: 'kg', status: '正常', color: '#f59e0b', bg: '#fef3c7' },
    { icon: Thermometer, label: '体温', value: '38.6', unit: '°C', status: '正常', color: '#3b82f6', bg: '#dbeafe' },
    { icon: Heart, label: '心率', value: '120', unit: '次/分', status: '正常', color: '#10b981', bg: '#d1fae5' },
    { icon: Wind, label: '呼吸频率', value: '20', unit: '次/分', status: '正常', color: '#a78bfa', bg: '#ede9fe' },
  ];

  const trendData = [
    { date: '05/14', weight: 12.3, temp: 38.5, heart: 118, breath: 19 },
    { date: '05/15', weight: 12.4, temp: 38.6, heart: 120, breath: 20 },
    { date: '05/16', weight: 12.5, temp: 38.5, heart: 119, breath: 19 },
    { date: '05/17', weight: 12.5, temp: 38.7, heart: 121, breath: 20 },
    { date: '05/18', weight: 12.6, temp: 38.6, heart: 120, breath: 19 },
    { date: '05/19', weight: 12.5, temp: 38.6, heart: 120, breath: 20 },
    { date: '05/20', weight: 12.5, temp: 38.6, heart: 120, breath: 20 },
  ];

  const vaccines = [
    { icon: Syringe, name: '狂犬疫苗', status: 'completed', date: '2024.03.20', nextDate: '2026.03.20' },
    { icon: Bug, name: '体内驱虫', status: 'warning', date: '2024.04.20', nextDate: '2024.06.20' },
    { icon: Bug, name: '体外驱虫', status: 'completed', date: '2024.05.10', nextDate: '2024.06.10' },
  ];

  const healthReminders = [
    { icon: Calendar, name: '年度体检', date: '2024.06.20', days: 31 },
    { icon: Sparkles, name: '洁牙', date: '2024.08.15', days: 87 },
    { icon: Syringe, name: '疫苗加强', date: '2025.03.20', days: 304 },
  ];

  return (
    <WarmContainer>
      {/* 顶部宠物档案卡 */}
      <div className="px-4 pt-6 pb-2 flex items-center gap-3">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #fde68a 0%, #fbbf24 100%)',
            border: '2px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 4px 12px rgba(251, 191, 36, 0.25)',
          }}
        >
          <Dog className="w-8 h-8 text-amber-900" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <h2 className="text-lg font-bold text-gray-900">{petName}</h2>
            <span className="text-blue-500 text-sm">♂</span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{petBreed} · {petAge}</p>
        </div>
        <button
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{
            background: 'rgba(249, 115, 22, 0.1)',
            color: '#ea580c',
          }}
        >
          <Edit3 className="w-3 h-3" />
          健康档案
        </button>
      </div>

      <main className="max-w-md mx-auto px-4 mt-4 space-y-5">
        {/* 健康状态卡 */}
        <WarmCard padding="md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900">健康状态</h3>
                <span
                  className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                  style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#047857' }}
                >
                  优秀
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">最近更新：2024.05.20</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {healthMetrics.map((metric, i) => {
              const Icon = metric.icon;
              return (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-1.5"
                    style={{ background: metric.bg }}
                  >
                    <Icon className="w-5 h-5" style={{ color: metric.color }} strokeWidth={2} />
                  </div>
                  <span className="text-[11px] text-gray-500">{metric.label}</span>
                  <div className="flex items-baseline gap-0.5 mt-0.5">
                    <span className="text-lg font-bold text-gray-900 tabular-nums">{metric.value}</span>
                    <span className="text-[10px] text-gray-500">{metric.unit}</span>
                  </div>
                  <span
                    className="mt-1 px-1.5 py-0.5 rounded text-[10px]"
                    style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#047857' }}
                  >
                    {metric.status}
                  </span>
                </div>
              );
            })}
          </div>
        </WarmCard>

        {/* 健康趋势 */}
        <WarmCard padding="md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">健康趋势</h3>
            <div className="flex items-center gap-1 bg-gray-100 rounded-full p-0.5">
              {(['7d', '30d', '90d'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    activeTab === tab
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  {tab === '7d' ? '7天' : tab === '30d' ? '30天' : '90天'}
                </button>
              ))}
            </div>
          </div>

          {/* 图表图例 */}
          <div className="flex items-center justify-center gap-3 mb-3 text-[11px]">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: '#f97316' }} />
              <span className="text-gray-600">体重(kg)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: '#3b82f6' }} />
              <span className="text-gray-600">体温(°C)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: '#10b981' }} />
              <span className="text-gray-600">心率(次/分)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: '#a78bfa' }} />
              <span className="text-gray-600">呼吸(次/分)</span>
            </div>
          </div>

          {/* 简化版折线图（SVG） */}
          <div className="h-40 relative">
            <svg viewBox="0 0 350 160" className="w-full h-full" preserveAspectRatio="none">
              {/* 网格线 */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={i}
                  x1="0"
                  y1={i * 40}
                  x2="350"
                  y2={i * 40}
                  stroke="#f3f4f6"
                  strokeWidth="1"
                />
              ))}

              {/* 体重线（橙色）- 数据归一化到 0-40 */}
              <polyline
                points={trendData.map((d, i) => {
                  const x = (i * 350) / (trendData.length - 1);
                  const y = 160 - ((d.weight - 12) / 1) * 80 - 40;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#f97316"
                strokeWidth="2"
              />

              {/* 体温线（蓝色）- 归一化 */}
              <polyline
                points={trendData.map((d, i) => {
                  const x = (i * 350) / (trendData.length - 1);
                  const y = 160 - ((d.temp - 38) / 1) * 100 - 30;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
              />

              {/* 心率线（绿色）- 归一化 */}
              <polyline
                points={trendData.map((d, i) => {
                  const x = (i * 350) / (trendData.length - 1);
                  const y = 160 - ((d.heart - 110) / 15) * 100 - 30;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
              />

              {/* 呼吸线（紫色）- 归一化 */}
              <polyline
                points={trendData.map((d, i) => {
                  const x = (i * 350) / (trendData.length - 1);
                  const y = 160 - ((d.breath - 18) / 4) * 100 - 30;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#a78bfa"
                strokeWidth="2"
              />

              {/* 体重数据点 */}
              {trendData.map((d, i) => {
                const x = (i * 350) / (trendData.length - 1);
                const y = 160 - ((d.weight - 12) / 1) * 80 - 40;
                return <circle key={i} cx={x} cy={y} r="3" fill="#f97316" />;
              })}
            </svg>

            {/* X轴日期 */}
            <div className="absolute -bottom-1 left-0 right-0 flex justify-between text-[10px] text-gray-400">
              {trendData.map((d) => (
                <span key={d.date}>{d.date}</span>
              ))}
            </div>
          </div>
        </WarmCard>

        {/* 疫苗与驱虫 + 健康提醒 */}
        <div className="grid grid-cols-2 gap-3">
          <WarmCard padding="md">
            <SectionTitle
              title="疫苗与驱虫"
              className="px-0 mb-3"
            />
            <div className="space-y-3">
              {vaccines.map((item, i) => {
                const Icon = item.icon;
                const isCompleted = item.status === 'completed';
                return (
                  <div key={i} className="flex items-start gap-2.5">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(16, 185, 129, 0.12)' }}
                    >
                      <Icon className="w-4 h-4" style={{ color: '#10b981' }} strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[13px] font-semibold text-gray-900 truncate">
                          {item.name}
                        </span>
                        {isCompleted ? (
                          <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#10b981' }} />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        接种日期 {item.date}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        下次 {item.nextDate}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <button className="w-full mt-3 text-[11px] text-gray-500 flex items-center justify-center gap-1">
              查看全部 <ChevronRight className="w-3 h-3" />
            </button>
          </WarmCard>

          <WarmCard padding="md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">健康提醒</h3>
              <button
                className="text-[10px] font-semibold flex items-center gap-0.5"
                style={{ color: '#f59e0b' }}
              >
                <span>+</span> 添加提醒
              </button>
            </div>
            <div className="space-y-3">
              {healthReminders.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-start gap-2.5">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(245, 158, 11, 0.12)' }}
                    >
                      <Icon className="w-4 h-4" style={{ color: '#f59e0b' }} strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] font-semibold text-gray-900 block truncate">
                        {item.name}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-0.5">建议日期 {item.date}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: '#f59e0b' }}>
                        还有 {item.days} 天
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <button className="w-full mt-3 text-[11px] text-gray-500 flex items-center justify-center gap-1">
              查看全部 <ChevronRight className="w-3 h-3" />
            </button>
          </WarmCard>
        </div>

        {/* AI健康评估 */}
        <WarmCard padding="md" className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-bold text-gray-900">AI健康评估</h3>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-semibold"
                  style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#ea580c' }}
                >
                  Beta
                </span>
              </div>
              <p className="text-[12px] text-gray-500">基于大数据分析，智能评估爱宠健康状况</p>
            </div>
            <button
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                color: '#ffffff',
              }}
            >
              开始评估
              <Play className="w-3 h-3 fill-current" />
            </button>
          </div>
        </WarmCard>

        <div className="h-4" />
      </main>
    </WarmContainer>
  );
}
