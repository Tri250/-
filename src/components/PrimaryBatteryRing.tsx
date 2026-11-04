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
  const powerWatts = ((Math.abs(voltage * current)) / 1000000).toFixed(1);

  // Status text mapping
  const statusLabels: Record<BatteryStatus, { text: string; color: string; desc: string; glow: string }> = {
    charging: {
      text: '极速快充注能中',
      color: 'text-emerald-400',
      desc: '电荷泵双相直充 · 恒流阶段持续注入',
      glow: 'shadow-emerald-500/20 shadow-lg',
    },
    discharging: {
      text: '电池主供电模式',
      color: 'text-cyan-400',
      desc: '系统动态负载分配 · 功耗平稳',
      glow: 'shadow-cyan-500/10 shadow-md',
    },
    full: {
      text: '已完全饱和充满',
      color: 'text-teal-300',
      desc: '微弱涓流截止 · 达到完全充满判定门限',
      glow: 'shadow-teal-400/20 shadow-lg',
    },
    not_charging: {
      text: '待机待命状态',
      color: 'text-slate-400',
      desc: '电源未连接 · 处于硬件休眠',
      glow: 'shadow-none',
    },
  };

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
    <div className="relative flex flex-col items-center justify-center pt-2 pb-5 px-3">
      {/* Central Cybernetic Circular HUD */}
      <div className="relative w-72 h-72 flex items-center justify-center">
        {/* Ambient Neon Atmosphere Glow */}
        {isCharging && (
          <div className="absolute inset-2 rounded-full bg-emerald-500/15 blur-3xl animate-pulse pointer-events-none" />
        )}
        {isFull && (
          <div className="absolute inset-2 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
        )}
        {percentage <= 15 && !isCharging && (
          <div className="absolute inset-2 rounded-full bg-rose-500/20 blur-3xl animate-pulse pointer-events-none" />
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
                  stroke={
                    tick.isPastCurrent
                      ? isCharging
                        ? '#10b981'
                        : isFull
                        ? '#14b8a6'
                        : percentage <= 15
                        ? '#f43f5e'
                        : '#06b6d4'
                      : 'rgba(75, 85, 99, 0.25)'
                  }
                  strokeWidth={idx % 4 === 0 ? '2' : '1'}
                  strokeLinecap="round"
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
                  <stop offset="100%" stopColor="#06b6d4" />
                </>
              ) : isFull ? (
                <>
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#10b981" />
                </>
              ) : percentage <= 15 ? (
                <>
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#e11d48" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#3b82f6" />
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
            className="stroke-slate-800/80 dark:stroke-slate-800/80"
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
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Futuristic Telemetry Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none z-10">
          {/* Status Badge with Live Pulsing Icon */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 backdrop-blur-md mb-1 shadow-sm">
            {isCharging && (
              <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400 animate-pulse" />
            )}
            {isFull && <Sparkles className="w-3.5 h-3.5 text-teal-400" />}
            {isDischarging && <BatteryIcon className="w-3.5 h-3.5 text-cyan-400" />}
            {status === 'not_charging' && <Power className="w-3.5 h-3.5 text-slate-400" />}
            <span className={`text-[11px] font-bold tracking-wider font-mono ${statusLabels[status].color}`}>
              {statusLabels[status].text}
            </span>
          </div>

          {/* 5. 电量百分比 (Ultra-Bold Sci-Fi Display) */}
          <div className="flex items-baseline justify-center">
            <span className="font-mono text-6xl font-black tracking-tight text-white tabular-nums drop-shadow-[0_0_12px_rgba(255,255,255,0.25)]">
              {percentage}
            </span>
            <span className="font-mono text-2xl font-bold text-cyan-400 ml-1">
              %
            </span>
          </div>

          {/* 2. 剩余电量 (mAh) */}
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-300 font-mono">
            <span className="text-slate-400 text-[11px]">剩余</span>
            <span className="font-bold text-emerald-400 tabular-nums text-sm">
              {remainingCapacity.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500">/ {currentCapacity.toLocaleString()} mAh</span>
          </div>

          {/* Instantaneous Wattage & Voltage Badge */}
          <div className="mt-2.5 px-2.5 py-0.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] font-mono tabular-nums text-slate-300 flex items-center gap-2 shadow-inner">
            <span className={current > 0 ? 'text-emerald-400 font-bold' : current < 0 ? 'text-cyan-400 font-bold' : 'text-slate-400'}>
              {current > 0 ? `+${current}` : current} mA
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-amber-300 font-semibold">{powerWatts} W</span>
            <span className="text-slate-600">|</span>
            <span className="text-sky-300">{(voltage / 1000).toFixed(2)} V</span>
          </div>
        </div>
      </div>

      {/* Cyberpunk Charging Toggle Action */}
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={onToggleCharging}
          className={`min-h-[44px] px-6 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase flex items-center gap-2 transition-all shadow-md active:scale-95 ${
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
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>{statusLabels[status].desc}</span>
      </div>
    </div>
  );
}
