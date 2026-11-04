/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Wifi, Signal, Zap, AlertTriangle } from 'lucide-react';
import { BatteryStatus, BatteryHealthQuality } from '../types/battery';

interface AndroidStatusBarProps {
  percentage: number;
  status: BatteryStatus;
  healthQuality: BatteryHealthQuality;
  temperature: number;
}

export function AndroidStatusBar({
  percentage,
  status,
  healthQuality,
  temperature,
}: AndroidStatusBarProps) {
  const [timeStr, setTimeStr] = useState('09:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  const isCharging = status === 'charging' || status === 'full';
  const isOverheat = healthQuality === 'overheat' || temperature > 45;
  const isLow = percentage <= 15 && !isCharging;

  return (
    <div className="w-full flex items-center justify-between px-5 pt-3 pb-2 text-xs font-medium tracking-tight text-slate-800 dark:text-slate-200 select-none transition-colors">
      {/* Left: Clock & Android notification indicator */}
      <div className="flex items-center gap-2">
        <span className="font-mono font-semibold text-[13px]">{timeStr}</span>
        {isOverheat && (
          <span className="flex items-center text-rose-500 font-semibold text-[10px]">
            <AlertTriangle className="w-3.5 h-3.5 mr-0.5 animate-pulse" />
            高温警告
          </span>
        )}
      </div>

      {/* Center: Camera Punch-Hole Simulation */}
      <div className="w-3.5 h-3.5 rounded-full bg-black/80 dark:bg-black border border-slate-700/40 shadow-inner flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-900/90 dark:bg-slate-800/80" />
      </div>

      {/* Right: Network, Wi-Fi & Dynamic Battery Icon */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">5G</span>
        <Signal className="w-3.5 h-3.5" />
        <Wifi className="w-3.5 h-3.5" />

        {/* Realistic Android Battery Icon */}
        <div className="flex items-center gap-1 pl-1">
          <span className="font-mono text-[11px] tabular-nums font-semibold">
            {percentage}%
          </span>
          <div
            className={`relative w-5 h-3 rounded-[3px] border p-[1px] flex items-center ${
              isLow
                ? 'border-rose-500 text-rose-500'
                : isOverheat
                ? 'border-amber-500 text-amber-500'
                : 'border-slate-700 dark:border-slate-300'
            }`}
          >
            {/* Battery Level Fill */}
            <div
              className={`h-full rounded-[1.5px] transition-all duration-300 ${
                isCharging
                  ? 'bg-emerald-500'
                  : isLow
                  ? 'bg-rose-500'
                  : isOverheat
                  ? 'bg-amber-500'
                  : 'bg-slate-800 dark:bg-slate-100'
              }`}
              style={{ width: `${Math.min(100, Math.max(8, percentage))}%` }}
            />
            {/* Charging Bolt Overlay */}
            {isCharging && (
              <Zap className="absolute inset-0 m-auto w-2.5 h-2.5 text-white drop-shadow-sm fill-emerald-400 stroke-emerald-950" />
            )}
            {/* Battery Terminal Pin */}
            <div
              className={`absolute -right-[2.5px] top-[2.5px] w-[1.5px] h-[5px] rounded-r-[1px] ${
                isLow
                  ? 'bg-rose-500'
                  : isOverheat
                  ? 'bg-amber-500'
                  : 'bg-slate-700 dark:bg-slate-300'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
