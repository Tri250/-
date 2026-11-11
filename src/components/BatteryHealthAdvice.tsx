/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShieldCheck, AlertTriangle, Lightbulb, BatteryCharging, HeartPulse, Thermometer, RefreshCw } from 'lucide-react';

interface BatteryHealthAdviceProps {
  healthPercentage: number;
  cycleCount: number;
  temperature: number;
  healthQuality: string;
}

export function BatteryHealthAdvice({
  healthPercentage,
  cycleCount,
  temperature,
  healthQuality,
}: BatteryHealthAdviceProps) {
  let grade = '极佳';
  let gradeColor = 'text-emerald-400';
  let advice = '电池健康状况优异，电芯化学活性充沛。建议日常开启 80% 保护上限以延缓衰减。';

  if (healthPercentage < 75 || healthQuality === 'dead') {
    grade = '严重衰减 (建议检修)';
    gradeColor = 'text-rose-400';
    advice = '电池容量已衰减至出厂设计的 75% 以下，可能出现高负荷意外关机或续航骤降，建议更换原厂电芯。';
  } else if (healthPercentage < 80) {
    grade = '一般 (已触发衰减门限)';
    gradeColor = 'text-amber-400';
    advice = '容量已低于 80% 行业标准维护线。避免长时间低电量（<15%）放置，日常注意温控。';
  } else if (healthPercentage < 90) {
    grade = '良好';
    gradeColor = 'text-sky-400';
    advice = '电池状态良好，处于正常生命周期内。保持在 20%~80% 浅充浅放有利于长期耐用度。';
  }

  return (
    <div className="p-5 rounded-panel glass-panel glass-hairline space-y-4 animate-card-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HeartPulse className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-bold text-white">
            1. 电池健康度与维护诊断
          </h3>
        </div>
        <span className={`text-xs font-bold font-mono ${gradeColor}`}>
          评级: {grade}
        </span>
      </div>

      {/* Health Progress Indicator */}
      <div>
        <div className="flex justify-between text-xs mb-1.5 font-medium">
          <span className="text-slate-400">电芯活性保持率</span>
          <span className="font-mono font-bold text-white tabular-nums">
            {healthPercentage}%
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`relative h-full rounded-full transition-all duration-hero ease-hud ${
              healthPercentage >= 90
                ? 'bg-emerald-500'
                : healthPercentage >= 80
                ? 'bg-sky-500'
                : healthPercentage >= 75
                ? 'bg-amber-500'
                : 'bg-rose-500'
            }`}
            style={{ width: `${Math.min(100, healthPercentage)}%` }}
          >
            {/* 进度条流光：数据"活"的呼吸感 */}
            <div className="absolute inset-0 hud-stripe opacity-70" />
          </div>
        </div>
      </div>

      {/* Live Cycle Count & Temperature Readout (激活 cycleCount / temperature props) */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-2.5 rounded-card bg-slate-950/50 border border-slate-100/5 dark:border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-2xs font-medium text-slate-400">
            <RefreshCw className="w-3.5 h-3.5 text-sky-500" />
            循环计数
          </div>
          <span className="font-mono text-xs font-bold text-white tabular-nums">
            {cycleCount} 次
          </span>
        </div>
        <div className="p-2.5 rounded-card bg-slate-950/50 border border-slate-100/5 dark:border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-2xs font-medium text-slate-400">
            <Thermometer className="w-3.5 h-3.5 text-amber-500" />
            当前温度
          </div>
          <span
            className={`font-mono text-xs font-bold tabular-nums ${
              temperature > 45
                ? 'text-rose-400'
                : temperature >= 38
                ? 'text-amber-400'
                : temperature <= 0
                ? 'text-sky-400'
                : 'text-emerald-400'
            }`}
          >
            {temperature} °C
          </span>
        </div>
      </div>

      {/* Main Advice Message */}
      <div className="p-3.5 rounded-card bg-slate-950/50 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div>{advice}</div>
      </div>

      {/* Real Android Battery Longevity Recommendations */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
        <div className="p-3 rounded-card border border-slate-800/60 bg-slate-950/30">
          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-500" />
            浅充浅放法则
          </div>
          <div className="text-2xs text-slate-400 mt-1 leading-relaxed">
            锂电池在 20%~80% 区间应力最小，可将电芯寿命提升至 2 倍以上。
          </div>
        </div>

        <div className="p-3 rounded-card border border-slate-800/60 bg-slate-950/30">
          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            避免高温边充边玩
          </div>
          <div className="text-2xs text-slate-400 mt-1 leading-relaxed">
            温度大于 40°C 时充电会加速正极电解液副反应，导致永久性不可逆衰减。
          </div>
        </div>

        <div className="p-3 rounded-card border border-slate-800/60 bg-slate-950/30">
          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
            满电校准机制
          </div>
          <div className="text-2xs text-slate-400 mt-1 leading-relaxed">
            定期充至 100% 并在 0~25 mA 保持 15 分钟，帮助芯片重置库仑计基准。
          </div>
        </div>
      </div>
    </div>
  );
}
