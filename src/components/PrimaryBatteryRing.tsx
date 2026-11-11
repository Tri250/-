/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Zap, BatteryCharging, Battery as BatteryIcon, Power, Flame, Sparkles } from 'lucide-react';
import { BatteryStatus } from '../types/battery';

interface PrimaryBatteryRingProps {
  percentage: number;
  status: BatteryStatus;
  remainingCapacity: number;
  currentCapacity: number;
  current: number;
  voltage: number;
  onToggleCharging: () => void;
}

export function PrimaryBatteryRing({
  percentage,
  status,
  remainingCapacity,
  currentCapacity,
  current,
  voltage,
  onToggleCharging,
}: PrimaryBatteryRingProps) {
  const isCharging = status === 'charging';
  const isFull = status === 'full';
  const isDischarging = status === 'discharging';
  const isLow = percentage <= 15 && !isCharging;
  const powerWatts = ((Math.abs(voltage * current)) / 1000000).toFixed(1);

  // Status text mapping（语义色板统一：充电 emerald / 放电 sky / 充满 teal / 待机 slate）
  const statusLabels: Record<BatteryStatus, { text: string; color: string; desc: string }> = {
    charging: {
      text: '极速快充注能中',
      color: 'text-emerald-400',
      desc: '电荷泵双相直充 · 恒流阶段持续注入',
    },
    discharging: {
      text: '电池主供电模式',
      color: 'text-sky-400',
      desc: '系统动态负载分配 · 功耗平稳',
    },
    full: {
      text: '已完全饱和充满',
      color: 'text-teal-300',
      desc: '微弱涓流截止 · 达到完全充满判定门限',
    },
    not_charging: {
      text: '待机待命状态',
      color: 'text-slate-400',
      desc: '电源未连接 · 处于硬件休眠',
    },
  };

  // 语义主色（SVG 无法用 tailwind 类，与令牌对齐的硬色值）
  const activeColor = isCharging ? '#10b981' : isFull ? '#14b8a6' : isLow ? '#f43f5e' : '#38bdf8';

  // SVG Gauge Calculations
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Generate 48 precision dial ticks for outer cyber ring
  const tickCount = 48;
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const angle = (i * 360) / tickCount;
    const isPastCurrent = (i / tickCount) <= (percentage / 100);
    return { angle, isPastCurrent };
  });

  return (
    <div className="relative flex flex-col items-center justify-center pt-2 pb-5 px-3 animate-card-in">
      {/* Central Cybernetic Circular HUD */}
      <div className="relative w-72 h-72 flex items-center justify-center">
        {/* Ambient Neon Atmosphere Glow：双层呼吸光晕（充电/低电量），充满为静态辉光 */}
        {(isCharging || isLow) && (
          <>
            <div className="absolute inset-4 rounded-full bg-emerald-500/10 blur-3xl animate-pulse pointer-events-none" />
            <div
              className={`absolute inset-10 rounded-full blur-2xl pointer-events-none ${
                isCharging ? 'bg-emerald-400/15' : 'bg-rose-500/15'
              }`}
              style={{ animation: 'hud-fade-in 2.4s ease-in-out infinite alternate' }}
            />
          </>
        )}
        {isFull && (
          <div className="absolute inset-2 rounded-full bg-teal-500/20 blur-3xl pointer-events-none" />
        )}

        {/* Outer Circular Dial Ticks */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 280 280">
            {ticks.map((tick, idx) => {
              const rad = ((tick.angle - 90) * Math.PI) / 180;
              const x1 = 140 + 124 * Math.cos(rad);
              const y1 = 140 + 124 * Math.sin(rad);
              const x2 = 140 + 130 * Math.cos(rad);
              const y2 = 140 + 130 * Math.sin(rad);
              return (
                <line
                  key={idx}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={tick.isPastCurrent ? activeColor : 'rgba(75, 85, 99, 0.25)'}
                  strokeWidth={idx % 4 === 0 ? '2' : '1'}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              );
            })}
          </svg>
        </div>

        {/* Main Progress Ring Arc */}
        <svg className="w-64 h-64 -rotate-90 transform overflow-visible" viewBox="0 0 240 240">
          <defs>
            <linearGradient id="cyberEnergyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              {isCharging ? (
                <>
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </>
              ) : isFull ? (
                <>
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#14b8a6" />
                </>
              ) : isLow ? (
                <>
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#e11d48" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0ea5e9" />
                </>
              )}
            </linearGradient>

            {/* Glowing Drop Shadow Filter */}
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Track Ring */}
          <circle
            cx="120"
            cy="120"
            r={radius}
            className="stroke-slate-800/80"
            strokeWidth="12"
            fill="transparent"
          />

          {/* Glowing Active Progress Arc */}
          <circle
            cx="120"
            cy="120"
            r={radius}
            stroke="url(#cyberEnergyGrad)"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            filter="url(#neonGlow)"
            className="transition-all duration-hero ease-hud"
          />
        </svg>

        {/* Center Futuristic Telemetry Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none z-10">
          {/* Status Badge with Live Pulsing Icon（玻璃徽章） */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/70 border border-white/10 backdrop-blur-md mb-1 shadow-sm">
            {isCharging && (
              <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400 animate-pulse" />
            )}
            {isFull && <Sparkles className="w-3.5 h-3.5 text-teal-400" />}
            {isDischarging && <BatteryIcon className="w-3.5 h-3.5 text-sky-400" />}
            {status === 'not_charging' && <Power className="w-3.5 h-3.5 text-slate-400" />}
            <span className={`text-xs font-bold tracking-wider font-mono ${statusLabels[status].color}`}>
              {statusLabels[status].text}
            </span>
          </div>

          {/* 5. 电量百分比 (Ultra-Bold Sci-Fi Display) */}
          <div className="flex items-baseline justify-center">
            <span className="font-mono text-6xl font-black tracking-tight text-slate-900 dark:text-white tabular-nums drop-shadow-[0_0_12px_rgba(255,255,255,0.25)]">
              {percentage}
            </span>
            <span className="font-mono text-2xl font-bold text-sky-400 ml-1">
              %
            </span>
          </div>

          {/* 2. 剩余电量 (mAh) */}
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-300 font-mono">
            <span className="text-slate-400">剩余</span>
            <span className="font-bold text-emerald-400 tabular-nums text-sm">
              {remainingCapacity.toLocaleString()}
            </span>
            <span className="text-2xs text-slate-500">/ {currentCapacity.toLocaleString()} mAh</span>
          </div>

          {/* Instantaneous Wattage & Voltage Badge */}
          <div className="mt-2.5 px-2.5 py-0.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs font-mono tabular-nums text-slate-300 flex items-center gap-2 shadow-inner backdrop-blur-sm">
            <span className={current > 0 ? 'text-emerald-400 font-bold' : current < 0 ? 'text-sky-400 font-bold' : 'text-slate-400'}>
              {current > 0 ? `+${current}` : current} mA
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-amber-300 font-semibold">{powerWatts} W</span>
            <span className="text-slate-600">|</span>
            <span className="text-sky-300">{(voltage / 1000).toFixed(2)} V</span>
          </div>
        </div>
      </div>

      {/* Cyberpunk Charging Toggle Action：主 CTA，玻璃渐变 + 按压反馈 */}
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={onToggleCharging}
          className={`min-h-[44px] px-6 py-2.5 rounded-chip text-xs font-bold tracking-wider uppercase flex items-center gap-2 transition-all duration-fast ease-hud shadow-md active:scale-95 ${
            isCharging || isFull
              ? 'bg-gradient-to-r from-rose-950 to-slate-900 text-rose-300 border border-rose-600/50 hover:border-rose-500 shadow-rose-950/30'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20'
          }`}
        >
          {isCharging || isFull ? (
            <>
              <Power className="w-4 h-4 text-rose-400" />
              断开充电供电 (切换放电)
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-white text-white" />
              接入极速闪充注能
            </>
          )}
        </button>
      </div>

      {/* Dynamic Sub-Description */}
      <div className="mt-2 text-xs text-slate-400 text-center font-mono flex items-center justify-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${isCharging || isLow ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
        <span>{statusLabels[status].desc}</span>
      </div>
    </div>
  );
}
