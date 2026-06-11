// ============================================
// PawSync Pro - HealthPage.tsx
//
// 描述: 健康监测页面 - 奶油色/米色温暖设计风格
// 4列指标 + 趋势图表 + 双列信息卡 + AI健康评估
// ============================================

import { useState, useMemo } from 'react';
import {
  Heart,
  Thermometer,
  Activity,
  Wind,
  ChevronRight,
  Shield,
  FileText,
  Bell,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { cn } from '../lib/utils';

type TimeRange = '7d' | '30d' | '90d';

const metricConfig = [
  {
    key: 'weight',
    label: '体重',
    value: '5.2',
    unit: 'kg',
    icon: Activity,
    bgColor: 'bg-orange-50',
    iconColor: 'text-primary-500',
    status: '正常',
    statusColor: 'text-success-500',
  },
  {
    key: 'temperature',
    label: '体温',
    value: '38.5',
    unit: '°C',
    icon: Thermometer,
    bgColor: 'bg-rose-50',
    iconColor: 'text-danger-500',
    status: '正常',
    statusColor: 'text-success-500',
  },
  {
    key: 'heartRate',
    label: '心率',
    value: '120',
    unit: 'bpm',
    icon: Heart,
    bgColor: 'bg-pink-50',
    iconColor: 'text-rose-500',
    status: '正常',
    statusColor: 'text-success-500',
  },
  {
    key: 'respiratory',
    label: '呼吸',
    value: '28',
    unit: '次/分',
    icon: Wind,
    bgColor: 'bg-blue-50',
    iconColor: 'text-info-500',
    status: '正常',
    statusColor: 'text-success-500',
  },
];

const trendData: Record<TimeRange, number[]> = {
  '7d': [110, 115, 118, 120, 122, 119, 120],
  '30d': [115, 118, 120, 119, 122, 120, 121, 118, 120, 119, 122, 120, 119, 121, 120, 118, 120, 122, 119, 120, 121, 119, 120, 118, 120, 121, 119, 120, 122, 120],
  '90d': [112, 115, 118, 120, 121, 122, 120, 119, 120, 121, 122, 120, 119, 120],
};

export default function HealthPage() {
  const { currentPet } = useAppStore();
  const [range, setRange] = useState<TimeRange>('7d');

  const data = trendData[range];
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = Math.max(max - min, 1);

  // 构建折线图点
  const points = useMemo(() => {
    const w = 300;
    const h = 100;
    const padding = 8;
    return data
      .map((v, i) => {
        const x = padding + (i * (w - padding * 2)) / (data.length - 1);
        const y = padding + ((max - v) / span) * (h - padding * 2);
        return `${x},${y}`;
      })
      .join(' ');
  }, [data, max, span]);

  const lastPoint = data[data.length - 1];
  const prevPoint = data[data.length - 2];
  const trendUp = lastPoint >= prevPoint;

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-100 to-cream-200 pb-28">
      {/* 状态栏 + 顶部标题 */}
      <div className="px-4 pt-2.5 pb-1 flex items-center justify-between text-[13px] font-semibold text-neutral-800">
        <span className="tabular-nums">9:41</span>
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary-500" />
          <span>Health</span>
        </div>
      </div>

      {/* 顶部标题 */}
      <header className="relative px-4 pt-3 pb-5">
        <div className="flex items-start gap-3">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-200 to-amber-300 flex items-center justify-center shadow-soft">
            <span className="text-4xl">🐱</span>
          </div>
          <div className="flex-1 pt-1">
            <h1 className="text-[26px] font-bold text-neutral-900 leading-none">健康</h1>
            <p className="text-[12px] text-neutral-500 mt-2 leading-relaxed">
              科学管理健康，守护萌宠成长
            </p>
          </div>
          <button className="w-9 h-9 rounded-full bg-white shadow-soft flex items-center justify-center active-scale">
            <Bell className="w-4.5 h-4.5 text-neutral-600" strokeWidth={2.2} />
          </button>
        </div>
      </header>

      <main className="px-4 space-y-4">
        {/* 宠物信息卡 */}
        <div className="bg-white rounded-3xl p-4 shadow-soft flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-200 to-amber-300 flex items-center justify-center text-2xl">
            🐱
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[16px] font-bold text-neutral-900">
                {currentPet?.name || '毛球'}
              </h3>
              <span className="text-xs text-neutral-400">♂</span>
            </div>
            <p className="text-[12px] text-neutral-500 mt-0.5">英国短毛猫 · 4岁2个月</p>
          </div>
          <button className="px-3 py-1.5 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-semibold flex items-center gap-1 shadow-glow-cream">
            <FileText className="w-3 h-3" strokeWidth={2.5} />
            健康档案
          </button>
        </div>

        {/* 健康状态4列指标 */}
        <div className="bg-white rounded-3xl p-4 shadow-soft">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-[15px] font-bold text-neutral-800">健康状态</h2>
            <div className="flex items-center gap-1 text-[11px] text-neutral-400">
              <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
              实时同步
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {metricConfig.map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.key} className="flex flex-col items-center py-2.5 px-1 rounded-2xl hover:bg-cream-100/50 transition-colors">
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center mb-2', m.bgColor)}>
                    <Icon className={cn('w-5 h-5', m.iconColor)} strokeWidth={2.2} />
                  </div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-[20px] font-bold text-neutral-900 tabular-nums leading-none">
                      {m.value}
                    </span>
                    <span className="text-[10px] text-neutral-400">{m.unit}</span>
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-1">{m.label}</div>
                  <div className={cn('text-[10px] mt-0.5 font-medium', m.statusColor)}>{m.status}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 健康趋势图 */}
        <div className="bg-white rounded-3xl p-4 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[15px] font-bold text-neutral-800">健康趋势</h2>
              <p className="text-[11px] text-neutral-400 mt-0.5">心率 · bpm</p>
            </div>
            <div className="flex items-center gap-1 bg-cream-100 rounded-full p-0.5">
              {(['7d', '30d', '90d'] as TimeRange[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={cn(
                    'px-3 py-1 text-[11px] font-medium rounded-full transition-all',
                    range === r
                      ? 'bg-white text-primary-600 shadow-soft'
                      : 'text-neutral-500'
                  )}
                >
                  {r === '7d' ? '7天' : r === '30d' ? '30天' : '90天'}
                </button>
              ))}
            </div>
          </div>

          {/* 折线图 */}
          <div className="relative h-32 mt-2">
            <svg viewBox="0 0 300 110" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF8A3D" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#FF8A3D" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#FFB778" />
                  <stop offset="50%" stopColor="#FF8A3D" />
                  <stop offset="100%" stopColor="#F5722A" />
                </linearGradient>
              </defs>
              {/* 网格线 */}
              {[0, 1, 2, 3].map((i) => (
                <line
                  key={i}
                  x1="0"
                  x2="300"
                  y1={i * 30 + 5}
                  y2={i * 30 + 5}
                  stroke="#FAF3E7"
                  strokeWidth="1"
                />
              ))}
              {/* 面积 */}
              <polygon
                points={`0,110 ${points} 300,110`}
                fill="url(#trendGradient)"
              />
              {/* 折线 */}
              <polyline
                points={points}
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {/* 最后点 */}
              {(() => {
                const lastX = 8 + ((data.length - 1) * (300 - 16)) / (data.length - 1);
                const lastY = 8 + ((max - lastPoint) / span) * (110 - 16);
                return (
                  <>
                    <circle cx={lastX} cy={lastY} r="4" fill="white" stroke="#FF8A3D" strokeWidth="2.5" />
                    <circle cx={lastX} cy={lastY} r="8" fill="#FF8A3D" opacity="0.2">
                      <animate attributeName="r" values="6;12;6" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
                    </circle>
                  </>
                );
              })()}
            </svg>
            <div className="absolute top-0 right-0 flex items-center gap-1 bg-success-50 text-success-600 px-2 py-0.5 rounded-full text-[10px] font-semibold">
              {trendUp ? '↑' : '↓'} {Math.abs(lastPoint - prevPoint)} bpm
            </div>
          </div>

          {/* 范围值 */}
          <div className="flex items-center justify-between mt-2 text-[10px] text-neutral-400 tabular-nums">
            <span>最低 {min}</span>
            <span>最高 {max}</span>
            <span>平均 {Math.round(data.reduce((a, b) => a + b, 0) / data.length)}</span>
          </div>
        </div>

        {/* 双列信息卡 */}
        <div className="grid grid-cols-2 gap-3">
          {/* 疫苗与驱虫 */}
          <div
            onClick={() => null}
            className="bg-white rounded-3xl p-4 shadow-soft active-scale cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-success-500 flex items-center justify-center mb-3">
              <Shield className="w-5 h-5 text-white" strokeWidth={2.2} />
            </div>
            <h3 className="text-[14px] font-bold text-neutral-900">疫苗与驱虫</h3>
            <p className="text-[11px] text-neutral-500 mt-1">下次提醒 6月20日</p>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-[11px] text-success-600 font-medium">已完成 3/4</div>
              <div className="w-6 h-6 rounded-full bg-cream-100 flex items-center justify-center">
                <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
              </div>
            </div>
          </div>

          {/* 健康提醒 */}
          <div
            onClick={() => null}
            className="bg-white rounded-3xl p-4 shadow-soft active-scale cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-warning-500 flex items-center justify-center mb-3">
              <Bell className="w-5 h-5 text-white" strokeWidth={2.2} />
            </div>
            <h3 className="text-[14px] font-bold text-neutral-900">健康提醒</h3>
            <p className="text-[11px] text-neutral-500 mt-1">2条待处理</p>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-[11px] text-warning-600 font-medium">查看全部</div>
              <div className="w-6 h-6 rounded-full bg-cream-100 flex items-center justify-center">
                <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
              </div>
            </div>
          </div>
        </div>

        {/* AI健康评估入口 */}
        <div
          className="relative overflow-hidden rounded-3xl p-4 active-scale cursor-pointer"
          style={{
            background:
              'linear-gradient(135deg, #6C5CE7 0%, #8B5CF6 50%, #A78BFA 100%)',
          }}
        >
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/15 blur-2xl" />
          <div className="absolute -bottom-8 -left-4 w-28 h-28 rounded-full bg-pink-200/30 blur-2xl" />

          <div className="relative flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <Shield className="w-6 h-6 text-white" strokeWidth={2.2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-[15px] font-bold text-white">AI 健康评估</h3>
                <span className="px-1.5 py-0.5 rounded-full bg-white/25 text-white text-[9px] font-semibold">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-white/80 mt-0.5">
                基于多维度数据，给出专业健康建议
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-white/95 flex items-center justify-center">
              <ChevronRight className="w-4.5 h-4.5 text-secondary-500" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* 免责说明 */}
        <div className="bg-cream-100/70 rounded-2xl p-3 border border-cream-300">
          <p className="text-[10px] text-neutral-500 leading-relaxed text-center">
            ⚠️ <strong className="text-neutral-700">免责声明</strong>：本结果为AI辅助分析，不构成医疗诊断，请以专业兽医意见为准
          </p>
        </div>
      </main>
    </div>
  );
}
