/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Wrench,
  Zap,
  Flame,
  AlertOctagon,
  CheckCircle,
  BatteryMedium,
  RotateCcw,
  Volume2,
  VolumeX,
  Pause,
  Play,
} from 'lucide-react';
import { BatteryHealthQuality, BatteryStatus } from '../types/battery';

interface HardwareSimulationLabProps {
  percentage: number;
  current: number;
  voltage: number;
  temperature: number;
  status: BatteryStatus;
  healthQuality: BatteryHealthQuality;
  currentCapacity: number;
  designCapacity: number;
  cycleCount: number;
  soundEnabled: boolean;
  isLiveTelemetryRunning: boolean;
  onUpdatePercentage: (val: number) => void;
  onUpdateCurrent: (val: number) => void;
  onSetVoltage: (val: number) => void;
  onSetTemperature: (val: number) => void;
  onSetStatus: (val: BatteryStatus) => void;
  onUpdateHealthQuality: (val: BatteryHealthQuality) => void;
  onUpdateCurrentCapacity: (val: number) => void;
  onUpdateCycleCount: (val: number) => void;
  onToggleSound: () => void;
  onToggleLiveTelemetry: () => void;
  onResetLab: () => void;
  onTriggerFullChargeTest: () => void;
}

export function HardwareSimulationLab({
  percentage,
  current,
  voltage,
  temperature,
  status,
  healthQuality,
  currentCapacity,
  designCapacity,
  cycleCount,
  soundEnabled,
  isLiveTelemetryRunning,
  onUpdatePercentage,
  onUpdateCurrent,
  onSetVoltage,
  onSetTemperature,
  onSetStatus,
  onUpdateHealthQuality,
  onUpdateCurrentCapacity,
  onUpdateCycleCount,
  onToggleSound,
  onToggleLiveTelemetry,
  onResetLab,
  onTriggerFullChargeTest,
}: HardwareSimulationLabProps) {
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-sm space-y-5">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Android 硬件实验室与模拟调试
            </h3>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              便捷调整 12 项充放电指标，验证极值、过热报警与 100% 满电截断
            </div>
          </div>
        </div>

        {/* Live telemetry pause/resume toggle (激活 isLiveTelemetryRunning 遥测开关) */}
        <button
          onClick={onToggleLiveTelemetry}
          className="min-h-[44px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5"
          title={isLiveTelemetryRunning ? '暂停实时遥测循环，便于固定参数实验' : '恢复实时遥测循环'}
        >
          {isLiveTelemetryRunning ? (
            <>
              <Pause className="w-4 h-4 text-amber-500" />
              <span>遥测 运行中</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 text-slate-400" />
              <span>遥测 已暂停</span>
            </>
          )}
        </button>

        {/* Sound toggle */}
        <button
          onClick={onToggleSound}
          className="min-h-[44px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5"
          title={soundEnabled ? '关闭音效' : '开启安卓插拔/充满提示音'}
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>提示音 开</span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4 text-slate-400" />
              <span>静音</span>
            </>
          )}
        </button>
      </div>

      {/* Quick Scenario Buttons */}
      <div>
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
          一键工作场景模拟
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* 1. Feature 12 Full Charge Trigger */}
          <button
            onClick={onTriggerFullChargeTest}
            className="min-h-[44px] p-2.5 rounded-xl text-left bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 transition-colors"
          >
            <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              特性12: 充满校准
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
              100% 且电流 16 mA
            </div>
          </button>

          {/* 2. Super Fast Charge (100W) */}
          <button
            onClick={() => {
              onSetStatus('charging');
              onUpdatePercentage(45);
              onUpdateCurrent(4800);
              onSetVoltage(4250);
              onSetTemperature(38.5);
              onUpdateHealthQuality('good');
            }}
            className="min-h-[44px] p-2.5 rounded-xl text-left bg-sky-50 hover:bg-sky-100 border border-sky-200 dark:bg-sky-950/30 dark:border-sky-800 transition-colors"
          >
            <div className="text-xs font-bold text-sky-800 dark:text-sky-300 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-sky-600" />
              极速闪充 (20W+)
            </div>
            <div className="text-[10px] text-sky-600 dark:text-sky-400 mt-0.5">
              +4800 mA / 45%
            </div>
          </button>

          {/* 3. Heavy Gaming Discharge */}
          <button
            onClick={() => {
              onSetStatus('discharging');
              onUpdateCurrent(-1150);
              onSetVoltage(3820);
              onSetTemperature(39.8);
              onUpdateHealthQuality('good');
            }}
            className="min-h-[44px] p-2.5 rounded-xl text-left bg-purple-50 hover:bg-purple-100 border border-purple-200 dark:bg-purple-950/30 dark:border-purple-800 transition-colors"
          >
            <div className="text-xs font-bold text-purple-800 dark:text-purple-300 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-purple-600" />
              高负载游戏放电
            </div>
            <div className="text-[10px] text-purple-600 dark:text-purple-400 mt-0.5">
              -1150 mA / 发热升高
            </div>
          </button>

          {/* 4. Overheat Warning */}
          <button
            onClick={() => {
              onUpdateHealthQuality('overheat');
            }}
            className="min-h-[44px] p-2.5 rounded-xl text-left bg-rose-50 hover:bg-rose-100 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-800 transition-colors"
          >
            <div className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1">
              <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
              电池过热警报
            </div>
            <div className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5">
              49.2°C / 异常中断
            </div>
          </button>
        </div>
      </div>

      {/* Detailed Interactive Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
        {/* Percentage Slider (5. 电量百分比) */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              5. 当前电量百分比
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
              {percentage}%
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            value={percentage}
            onChange={(e) => onUpdatePercentage(parseInt(e.target.value, 10))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5 font-mono">
            <span>1% (濒临关机)</span>
            <span>50%</span>
            <span>100% (满电)</span>
          </div>
        </div>

        {/* Current Slider (11. 瞬时电流) */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              11. 瞬时电流 (mA)
            </span>
            <span className={`font-mono font-bold tabular-nums ${current > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-sky-600 dark:text-sky-400'}`}>
              {current > 0 ? `+${current}` : current} mA
            </span>
          </div>
          <input
            type="range"
            min="-2000"
            max="6000"
            step="10"
            value={current}
            onChange={(e) => onUpdateCurrent(parseInt(e.target.value, 10))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5 font-mono">
            <span>-2000mA (大放电)</span>
            <span>0-25mA (满电截止)</span>
            <span>+6000mA (超级闪充)</span>
          </div>
        </div>

        {/* Degraded Capacity (3. 电池当前容量) */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              3. 电池当前容量 (衰减后容量)
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
              {currentCapacity} / {designCapacity} mAh
            </span>
          </div>
          <input
            type="range"
            min={Math.round(designCapacity * 0.5)}
            max={designCapacity}
            value={currentCapacity}
            onChange={(e) => onUpdateCurrentCapacity(parseInt(e.target.value, 10))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5 font-mono">
            <span>严重衰减 (50%)</span>
            <span>80% 临界线</span>
            <span>健康 ({((currentCapacity / designCapacity) * 100).toFixed(1)}%)</span>
          </div>
        </div>

        {/* Cycle Count (10. 循环计数) */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              10. 充放电循环计数
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
              {cycleCount} 次
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1200"
            step="5"
            value={cycleCount}
            onChange={(e) => onUpdateCycleCount(parseInt(e.target.value, 10))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5 font-mono">
            <span>0 次 (新机)</span>
            <span>500 次 (标准衰减期)</span>
            <span>1000+ 次 (需换电芯)</span>
          </div>
        </div>

        {/* Voltage (9. 电压 mV) */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              9. 电池电芯电压 (mV)
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
              {voltage} mV ({(voltage / 1000).toFixed(3)} V)
            </span>
          </div>
          <input
            type="range"
            min="3500"
            max="4600"
            step="10"
            value={voltage}
            onChange={(e) => onSetVoltage(parseInt(e.target.value, 10))}
            className="w-full accent-sky-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5 font-mono">
            <span>3500mV (放电截止)</span>
            <span>3850mV (标称电压)</span>
            <span>4450mV (满电高压)</span>
          </div>
        </div>

        {/* Temperature (7. 电池温度) */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              7. 电池传感器温度 (°C)
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
              {temperature} °C
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="55"
            step="0.5"
            value={temperature}
            onChange={(e) => onSetTemperature(parseFloat(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5 font-mono">
            <span>10°C (低温)</span>
            <span>32°C (正常)</span>
            <span>45°C+ (过热预警)</span>
          </div>
        </div>
      </div>

      {/* 8. 电池健康状况枚举选择器 */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
          8. 电池硬件健康状态选择 (Android BatteryManager Health)
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'good', label: '良好 (Good)', color: 'text-emerald-700 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300' },
              { id: 'overheat', label: '过热 (Overheat)', color: 'text-amber-700 border-amber-300 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300' },
              { id: 'dead', label: '损坏 (Dead/Failed)', color: 'text-rose-700 border-rose-300 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300' },
              { id: 'over_voltage', label: '超压 (Over Voltage)', color: 'text-purple-700 border-purple-300 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-300' },
              { id: 'unknown', label: '未知 (Unknown)', color: 'text-slate-700 border-slate-300 bg-slate-50 dark:bg-slate-800 dark:text-slate-300' },
            ] as const
          ).map((item) => {
            const isSelected = healthQuality === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onUpdateHealthQuality(item.id)}
                className={`min-h-[44px] px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  isSelected
                    ? `${item.color} ring-2 ring-emerald-500 shadow-sm`
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 重置实验室参数 (激活 RotateCcw：恢复当前机型默认 12 项指标) */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={onResetLab}
          className="min-h-[44px] w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5"
          title="恢复当前机型的出厂默认 12 项指标参数"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          重置实验室参数
        </button>
      </div>
    </div>
  );
}
