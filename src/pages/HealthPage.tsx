/**
 * HealthPage 2026 - 顶级设计
 *
 * 借鉴：Apple Health、华为运动健康、Garmin Connect
 * 特性：
 * - 渐变Hero（健康绿色系）
 * - 黏性模糊头部
 * - 大数据展示卡（4列渐变图标）
 * - 真实数据趋势图（带渐变填充）
 * - 疫苗/提醒清单（彩色LED状态点）
 * - AI评估紫色渐变按钮
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Scale,
  Thermometer,
  Heart,
  Wind,
  Calendar,
  Edit3,
  Syringe,
  Bug,
  Sparkles,
  Play,
  TrendingUp,
  TrendingDown,
  Settings as SettingsIcon,
  Share2,
} from 'lucide-react';
import { StatusBar } from '../components/StatusBar';
import { shadows, springs } from '../styles/design-system';
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
    { icon: Scale, label: '体重', value: '12.5', unit: 'kg', status: '正常', color: '#f59e0b', bg: 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)', trend: -0.2, trendDir: 'down' },
    { icon: Thermometer, label: '体温', value: '38.6', unit: '°C', status: '正常', color: '#3b82f6', bg: 'linear-gradient(135deg, #DBEAFE 0%, #EFF6FF 100%)', trend: 0.1, trendDir: 'up' },
    { icon: Heart, label: '心率', value: '120', unit: '次/分', status: '正常', color: '#ef4444', bg: 'linear-gradient(135deg, #FEE2E2 0%, #FEF2F2 100%)', trend: 2, trendDir: 'up' },
    { icon: Wind, label: '呼吸', value: '20', unit: '次/分', status: '正常', color: '#a855f7', bg: 'linear-gradient(135deg, #F3E8FF 0%, #FAF5FF 100%)', trend: 0, trendDir: 'flat' },
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
    { icon: Calendar, name: '年度体检', date: '2024.06.20', days: 31, color: '#3b82f6', bg: '#DBEAFE' },
    { icon: Sparkles, name: '洁牙', date: '2024.08.15', days: 87, color: '#06b6d4', bg: '#CFFAFE' },
    { icon: Syringe, name: '疫苗加强', date: '2025.03.20', days: 304, color: '#a855f7', bg: '#F3E8FF' },
  ];

  // 计算路径
  const chartWidth = 350;
  const chartHeight = 120;
  const linePath = trendData
    .map((d, i) => {
      const x = (i / (trendData.length - 1)) * chartWidth;
      const y = chartHeight - ((d.heart - 110) / 15) * chartHeight;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
  const areaPath = `${linePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F5F3FF' }}>
      {/* ===== 渐变Hero (健康紫绿) ===== */}
      <div className="relative" style={{
        background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 50%, #5B21B6 100%)'
      }}>
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at top right, rgba(167, 139, 250, 0.4) 0%, transparent 50%),
              radial-gradient(ellipse at bottom left, rgba(34, 197, 94, 0.2) 0%, transparent 50%)
            `,
          }}
        />
        <div
          className="absolute top-32 right-0 w-40 h-40 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, #A78BFA 0%, transparent 70%)',
            filter: 'blur(24px)',
          }}
        />

        <StatusBar dark={false} />

        <div className="relative px-5 pt-1 pb-2 flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-white tracking-tight">健康</h1>
            <p className="text-[11px] text-white/85 mt-0.5 font-medium">科学管理健康，守护萌宠成长</p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                border: '0.5px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              <Share2 className="w-[16px] h-[16px] text-white" strokeWidth={2} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                border: '0.5px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              <SettingsIcon className="w-[16px] h-[16px] text-white" strokeWidth={2} />
            </motion.button>
          </div>
        </div>

        {/* 顶部宠物档案 */}
        <div className="relative px-5 pt-3 pb-6 flex items-center gap-3">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative"
          >
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, transparent 70%)',
                filter: 'blur(8px)',
                transform: 'scale(1.2)',
              }}
            />
            <div
              className="relative w-[60px] h-[60px] rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #F3E8FF 100%)',
                border: '2.5px solid rgba(255, 255, 255, 0.6)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
              }}
            >
              <span className="text-3xl">🐕</span>
            </div>
          </motion.div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <h2 className="text-[20px] font-bold text-white tracking-tight">{petName}</h2>
              <span className="text-white/90 text-[14px]">♂</span>
            </div>
            <p className="text-[12px] text-white/85 mt-0.5 font-medium">
              {petBreed} · {petAge}
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              color: '#7C3AED',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Edit3 className="w-3 h-3" />
            健康档案
          </motion.button>
        </div>
      </div>

      {/* ===== 主内容区 ===== */}
      <main className="relative px-4 -mt-3 space-y-3.5">
        {/* 健康状态卡 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px) saturate(180%)',
            borderRadius: '20px',
            boxShadow: shadows.DEFAULT,
            border: '0.5px solid rgba(255, 255, 255, 0.8)',
          }}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[16px] font-bold text-gray-900 tracking-tight">健康状态</h3>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10.5px] font-bold"
                    style={{ background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)', color: '#047857' }}
                  >
                    ✨ 优秀
                  </span>
                </div>
                <p className="text-[10.5px] text-gray-400 mt-1 font-medium">最近更新：2024.05.20</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: '#F3F4F6' }}
              >
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </motion.button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {healthMetrics.map((metric, i) => {
                const Icon = metric.icon;
                const TrendIcon = metric.trendDir === 'up' ? TrendingUp : metric.trendDir === 'down' ? TrendingDown : null;
                return (
                  <motion.div
                    key={i}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center py-1.5 px-1 rounded-2xl"
                    style={{ background: '#FAFAFA' }}
                  >
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center mb-1.5"
                      style={{
                        background: metric.bg,
                        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                      }}
                    >
                      <Icon className="w-[18px] h-[18px]" style={{ color: metric.color }} strokeWidth={2.5} />
                    </div>
                    <span className="text-[10.5px] text-gray-500 font-medium">{metric.label}</span>
                    <div className="flex items-baseline gap-0.5 mt-0.5">
                      <span
                        className="text-[16px] font-bold text-gray-900 tabular-nums tracking-tight"
                        style={{ fontFeatureSettings: '"tnum"' }}
                      >
                        {metric.value}
                      </span>
                      <span className="text-[9.5px] text-gray-500 font-semibold">{metric.unit}</span>
                    </div>
                    {metric.trendDir !== 'flat' && TrendIcon && (
                      <div
                        className="mt-1 flex items-center gap-0.5 px-1 py-0 rounded"
                        style={{
                          background: metric.trendDir === 'up' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        }}
                      >
                        <TrendIcon
                          className="w-2 h-2"
                          style={{ color: metric.trendDir === 'up' ? '#DC2626' : '#059669' }}
                          strokeWidth={3}
                        />
                        <span
                          className="text-[9px] font-bold"
                          style={{ color: metric.trendDir === 'up' ? '#DC2626' : '#059669' }}
                        >
                          {Math.abs(metric.trend)}
                        </span>
                      </div>
                    )}
                    {metric.trendDir === 'flat' && <div className="h-3.5 mt-1" />}
                    <span
                      className="mt-1 px-1.5 py-0 rounded text-[9.5px] font-bold"
                      style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#047857' }}
                    >
                      {metric.status}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* 健康趋势图 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="relative"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px) saturate(180%)',
            borderRadius: '20px',
            boxShadow: shadows.DEFAULT,
            border: '0.5px solid rgba(255, 255, 255, 0.8)',
          }}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[16px] font-bold text-gray-900 tracking-tight">健康趋势</h3>
              <div
                className="flex items-center gap-0.5 p-0.5 rounded-full"
                style={{ background: '#F3F4F6' }}
              >
                {(['7d', '30d', '90d'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                      activeTab === tab ? 'text-gray-900' : 'text-gray-500'
                    }`}
                    style={
                      activeTab === tab
                        ? { background: '#FFFFFF', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }
                        : {}
                    }
                  >
                    {tab === '7d' ? '7天' : tab === '30d' ? '30天' : '90天'}
                  </button>
                ))}
              </div>
            </div>

            {/* 图例 */}
            <div className="flex items-center gap-3 mb-3 text-[10.5px]">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: '#F97316' }} />
                <span className="text-gray-600 font-medium">体重</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: '#3B82F6' }} />
                <span className="text-gray-600 font-medium">体温</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: '#EF4444' }} />
                <span className="text-gray-600 font-medium">心率</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: '#A855F7' }} />
                <span className="text-gray-600 font-medium">呼吸</span>
              </div>
            </div>

            {/* 图表 */}
            <div className="h-44 relative px-1">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight + 20}`}
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="heartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* 网格 */}
                {[0, 1, 2, 3].map((i) => (
                  <line
                    key={i}
                    x1="0"
                    y1={i * (chartHeight / 3)}
                    x2={chartWidth}
                    y2={i * (chartHeight / 3)}
                    stroke="#F3F4F6"
                    strokeWidth="1"
                  />
                ))}
                {/* 面积 */}
                <path d={areaPath} fill="url(#heartGradient)" />
                {/* 主线 */}
                <path
                  d={linePath}
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* 数据点 */}
                {trendData.map((d, i) => {
                  const x = (i / (trendData.length - 1)) * chartWidth;
                  const y = chartHeight - ((d.heart - 110) / 15) * chartHeight;
                  return (
                    <g key={i}>
                      <circle cx={x} cy={y} r="3.5" fill="#fff" stroke="#EF4444" strokeWidth="2" />
                    </g>
                  );
                })}
              </svg>
              <div className="absolute -bottom-1 left-0 right-0 flex justify-between text-[10px] text-gray-400 font-medium">
                {trendData.map((d) => (
                  <span key={d.date}>{d.date}</span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* 疫苗与驱虫 + 健康提醒 */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="relative"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px) saturate(180%)',
              borderRadius: '18px',
              boxShadow: shadows.DEFAULT,
              border: '0.5px solid rgba(255, 255, 255, 0.8)',
            }}
          >
            <div className="p-3.5">
              <h3 className="text-[14px] font-bold text-gray-900 tracking-tight mb-3">疫苗与驱虫</h3>
              <div className="space-y-2.5">
                {vaccines.map((item, i) => {
                  const Icon = item.icon;
                  const isCompleted = item.status === 'completed';
                  return (
                    <div key={i} className="flex items-start gap-2">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: isCompleted ? '#D1FAE5' : '#FEF3C7' }}
                      >
                        <Icon
                          className="w-3.5 h-3.5"
                          style={{ color: isCompleted ? '#10B981' : '#F59E0B' }}
                          strokeWidth={2.5}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[12px] font-semibold text-gray-900 truncate">
                            {item.name}
                          </span>
                        </div>
                        <p className="text-[9.5px] text-gray-400 mt-0.5">
                          接种 {item.date}
                        </p>
                        <p className="text-[9.5px] text-gray-400">
                          下次 {item.nextDate}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="relative"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px) saturate(180%)',
              borderRadius: '18px',
              boxShadow: shadows.DEFAULT,
              border: '0.5px solid rgba(255, 255, 255, 0.8)',
            }}
          >
            <div className="p-3.5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[14px] font-bold text-gray-900 tracking-tight">健康提醒</h3>
                <button
                  className="text-[10px] font-bold flex items-center gap-0.5"
                  style={{ color: '#F59E0B' }}
                >
                  <span>+</span> 添加
                </button>
              </div>
              <div className="space-y-2.5">
                {healthReminders.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-start gap-2">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: item.bg }}
                      >
                        <Icon
                          className="w-3.5 h-3.5"
                          style={{ color: item.color }}
                          strokeWidth={2.5}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[12px] font-semibold text-gray-900 block truncate">
                          {item.name}
                        </span>
                        <p className="text-[9.5px] text-gray-400 mt-0.5">{item.date}</p>
                        <p className="text-[9.5px] font-bold" style={{ color: '#F59E0B' }}>
                          还有 {item.days} 天
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>

        {/* AI健康评估 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
            borderRadius: '20px',
            boxShadow: '0 12px 32px rgba(124, 58, 237, 0.2)',
          }}
        >
          {/* 装饰光斑 */}
          <div
            className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-30"
            style={{
              background: 'radial-gradient(circle, #A78BFA 0%, transparent 70%)',
              filter: 'blur(20px)',
            }}
          />

          <div className="relative p-4 flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-[16px] font-bold text-white tracking-tight">AI 健康评估</h3>
                <span
                  className="px-1.5 py-0.5 rounded text-[9.5px] font-bold"
                  style={{ background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)', color: '#1F2937' }}
                >
                  Beta
                </span>
              </div>
              <p className="text-[12px] text-white/70 font-medium">
                基于大数据分析，智能评估爱宠健康状况
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="flex items-center gap-1 px-3.5 py-2 rounded-full text-[12px] font-bold flex-shrink-0 ml-3"
              style={{
                background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
                color: '#1F2937',
                boxShadow: '0 4px 12px rgba(251, 191, 36, 0.4)',
              }}
            >
              开始评估
              <Play className="w-3 h-3 fill-current" />
            </motion.button>
          </div>
        </motion.div>

        <div className="h-2" />
      </main>
    </div>
  );
}
