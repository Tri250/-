/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CheckCircle2, Clock, Zap, ShieldCheck, HelpCircle, Sparkles } from 'lucide-react';
import { FullChargeRecord } from '../types/battery';

interface FullChargeCalibrationCardProps {
  percentage: number;
  current: number;
  fullChargeCapacity: number | null;
  lastFullChargeRecord: FullChargeRecord | null;
  currentCapacity: number;
  designCapacity: number;
  onTriggerTest: () => void;
}

export function FullChargeCalibrationCard({
  percentage,
  current,
  fullChargeCapacity,
  lastFullChargeRecord,
  currentCapacity,
  designCapacity,
  onTriggerTest,
}: FullChargeCalibrationCardProps) {
  // Requirement 12 conditions:
  // "仅当电量为 100% 且电流在 0-25 mA 之间时，才视为电池充满"
  const isPercentMet = percentage === 100;
  const isCurrentMet = current >= 0 && current <= 25;
  const isFullyChargedMet = isPercentMet && isCurrentMet;

  // Active display value: if criteria currently met, use fullChargeCapacity; if previous record exists, show it with note
  const displayCapacity = isFullyChargedMet
    ? fullChargeCapacity
    : lastFullChargeRecord?.recordedCapacity ?? null;

  return (
    <div className="relative overflow-hidden glass-strong glass-hairline rounded-panel p-4 sm:p-5 animate-card-in">
      {/* Background ambient neon glow */}
      {isFullyChargedMet && (
        <>
          <div className="absolute -right-8 -top-8 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          {/* 满足条件时玻璃流光扫过，强化"已锁定"仪式感 */}
          <div className="hud-sheen-track" />
        </>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-2xs font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-500/40 px-2 py-0.5 rounded shadow-sm shadow-cyan-950/40">
              FEATURE 12
            </span>
            <h3 className="text-sm font-bold text-white tracking-wide">
              完全充满时的容量 (Full Charge Capacity)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            仅当电量为 100% 且瞬时电流在 0 ~ 25 mA 之间时，系统才判定为完全充满并锁定显示容量。
          </p>
        </div>

        {/* Status Indicator */}
        <div className="shrink-0">
          {isFullyChargedMet ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 shadow-sm shadow-emerald-900/40 animate-scale-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              已锁定充满容量
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-amber-950/60 text-amber-300 border border-amber-500/40">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              等待满足充满条件
            </span>
          )}
        </div>
      </div>

      {/* Hero Value Display */}
      <div className="mt-4 p-4 rounded-card bg-slate-950/70 border border-slate-800/90 shadow-inner backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-2xs font-mono text-slate-400 font-medium">
              {isFullyChargedMet
                ? '当前完全充满实时锁定容量'
                : lastFullChargeRecord
                ? '上次满足条件记录的完全充满容量'
                : '完全充满容量状态'}
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              {displayCapacity !== null ? (
                <>
                  <span className="font-mono text-2xl font-black tracking-tight text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.3)] tabular-nums">
                    {displayCapacity.toLocaleString()}
                  </span>
                  <span className="font-mono text-sm font-bold text-slate-400">
                    mAh
                  </span>
                  <span className="font-mono text-xs text-cyan-400 font-semibold ml-2">
                    (出厂设计的 {((displayCapacity / designCapacity) * 100).toFixed(1)}%)
                  </span>
                </>
              ) : (
                <span className="text-sm font-mono font-medium text-slate-500 py-1">
                  [ 待触发：未达 100% 或电流不在 0-25 mA，暂不显示 ]
                </span>
              )}
            </div>
          </div>

          {/* Live Capacity Readout (激活 currentCapacity) */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-2xs font-mono">
            <span className="text-slate-500">当前实时容量 (电量计采样)</span>
            <span className="text-cyan-300 font-bold tabular-nums">
              {currentCapacity.toLocaleString()} mAh
              <span className="text-slate-500 font-normal ml-1.5">
                / 出厂设计 {designCapacity.toLocaleString()} mAh
              </span>
            </span>
          </div>

          {/* Quick Simulation Trigger Button */}
          <button
            onClick={onTriggerTest}
            className="min-h-[44px] px-4 py-2 rounded-card bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white text-xs font-bold tracking-wider uppercase transition-all duration-fast ease-hud flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40 whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 fill-white text-white" />
            一键进入充满状态 (100% + 16 mA)
          </button>
        </div>

        {/* Last Full Charge Record Detail (完整回显 timestamp/currentAtCutoff/voltageAtFull/cycleCount/healthCalculated) */}
        {lastFullChargeRecord && (
          <div className="mt-3 pt-3 border-t border-slate-800/60 animate-fade-in">
            <div className="flex items-center gap-1.5 text-2xs font-mono text-slate-500 mb-1.5">
              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
              <span>
                上次满足判定记录 ·{' '}
                {new Date(lastFullChargeRecord.timestamp).toLocaleString('zh-CN', {
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2 rounded-chip bg-slate-900/60 border border-slate-800/80">
                <div className="text-2xs text-slate-500">截止电流</div>
                <div className="text-xs font-mono font-bold text-emerald-300 mt-0.5 tabular-nums">
                  {lastFullChargeRecord.currentAtCutoff} mA
                </div>
              </div>
              <div className="p-2 rounded-chip bg-slate-900/60 border border-slate-800/80">
                <div className="text-2xs text-slate-500">记录时电压</div>
                <div className="text-xs font-mono font-bold text-sky-300 mt-0.5 tabular-nums">
                  {lastFullChargeRecord.voltageAtFull} mV
                </div>
              </div>
              <div className="p-2 rounded-chip bg-slate-900/60 border border-slate-800/80">
                <div className="text-2xs text-slate-500">循环计数</div>
                <div className="text-xs font-mono font-bold text-slate-200 mt-0.5 tabular-nums">
                  {lastFullChargeRecord.cycleCount} 次
                </div>
              </div>
              <div className="p-2 rounded-chip bg-slate-900/60 border border-slate-800/80">
                <div className="text-2xs text-slate-500">记录健康比</div>
                <div className="text-xs font-mono font-bold text-cyan-300 mt-0.5 tabular-nums">
                  {lastFullChargeRecord.healthCalculated}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Real-time Condition Verification Checklist */}
      <div className="mt-3.5 grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Condition 1: Percentage == 100 */}
        <div
          className={`p-3 rounded-card border transition-all duration-smooth ${
            isPercentMet
              ? 'bg-emerald-950/30 border-emerald-500/40 shadow-sm shadow-emerald-950/20'
              : 'bg-slate-950/40 border-slate-800/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              判定条件 1：电量达到 100%
            </span>
            <span
              className={`font-mono text-xs font-bold tabular-nums ${
                isPercentMet ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              当前: {percentage}%
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-2xs font-mono">
            {isPercentMet ? (
              <span className="text-emerald-300 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 已达成 (处于 100% 满电位)
              </span>
            ) : (
              <span className="text-slate-400">
                尚未充满 (还需充入 {100 - percentage}%)
              </span>
            )}
          </div>
        </div>

        {/* Condition 2: Current in 0 - 25 mA */}
        <div
          className={`p-3 rounded-card border transition-all duration-smooth ${
            isCurrentMet
              ? 'bg-emerald-950/30 border-emerald-500/40 shadow-sm shadow-emerald-950/20'
              : 'bg-slate-950/40 border-slate-800/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              判定条件 2：电流在 0 ~ 25 mA 之间
            </span>
            <span
              className={`font-mono text-xs font-bold tabular-nums ${
                isCurrentMet ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              当前: {current > 0 ? `+${current}` : current} mA
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-2xs font-mono">
            {isCurrentMet ? (
              <span className="text-emerald-300 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 已进入 0-25 mA 浮充截止区间
              </span>
            ) : current > 25 ? (
              <span className="text-amber-400">
                主快充饱和中 (需等电流回落至 25 mA 以内)
              </span>
            ) : (
              <span className="text-slate-400">
                当前放电中，需连接充电器
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Android HAL Architecture Note */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-start gap-2 text-2xs text-slate-400 font-mono leading-relaxed">
        <HelpCircle className="w-3.5 h-3.5 mt-0.5 text-cyan-400 shrink-0" />
        <p>
          <strong className="text-slate-300">Android HAL 原生规范：</strong>
          在恒压（CV）阶段充电电流降至 25 mA 截止门限时，PMIC 电量计校准并写回满电寄存器。
        </p>
      </div>
    </div>
  );
}
