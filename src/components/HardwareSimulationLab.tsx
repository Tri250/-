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
  onUpdateDesignCapacity: (val: number) => void;
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
  onUpdateDesignCapacity,
  onUpdateCycleCount,
  onToggleSound,
  onToggleLiveTelemetry,
  onResetLab,
  onTriggerFullChargeTest,
}: HardwareSimulationLabProps) {
  // 当前电池状态标签 (激活 status props)
  const statusLabels: Record<BatteryStatus, { text: string; className: string }> = {
    charging: { text: '充电中', className: 'text-emerald-300 bg-emerald-950/60 border-emerald-500/50' },
    discharging: { text: '放电中', className: 'text-sky-300 bg-sky-950/60 border-sky-500/50' },
    full: { text: '已充满', className: 'text-teal-300 bg-teal-950/60 border-teal-500/50' },
    not_charging: { text: '未充电', className: 'text-slate-300 bg-slate-800/80 border-slate-600' },
  };

  return (
    <div className="p-5 rounded-panel glass-panel glass-hairline space-y-5 animate-card-in">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-chip bg-emerald-950/70 border border-emerald-800/60 text-emerald-400 flex items-center justify-center">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Android 硬件实验室与模拟调试
            </h3>
            <div className="text-2xs text-slate-400">
              便捷调整 12 项充放电指标，验证极值、过热报警与 100% 满电截断
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
        {/* Live telemetry pause/resume toggle (激活 isLiveTelemetryRunning 遥测开关) */}
        <button
          onClick={onToggleLiveTelemetry}
          aria-pressed={isLiveTelemetryRunning}
          className="min-h-[44px] px-3 py-1.5 rounded-chip border border-slate-700/80 hover:bg-slate-800/60 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-colors duration-fast"
          title={isLiveTelemetryRunning ? '暂停实时遥测循环，便于固定参数实验' : '恢复实时遥测循环'}
        >
          {isLiveTelemetryRunning ? (
            <>
              <Pause className="w-4 h-4 text-amber-400" />
              <span>遥测 运行中</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 text-slate-500" />
              <span>遥测 已暂停</span>
            </>
          )}
        </button>

        {/* Sound toggle */}
        <button
          onClick={onToggleSound}
          aria-pressed={soundEnabled}
          className="min-h-[44px] px-3 py-1.5 rounded-chip border border-slate-700/80 hover:bg-slate-800/60 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-colors duration-fast"
          title={soundEnabled ? '关闭音效' : '开启安卓插拔/充满提示音'}
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>提示音 开</span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4 text-slate-500" />
              <span>静音</span>
            </>
          )}
        </button>
        </div>
      </div>

      {/* Quick Scenario Buttons */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-slate-300">
            一键工作场景模拟
          </div>
          {/* 当前电池状态芯片 (消费 status props) */}
          <span
            className={`px-2.5 py-1 rounded-full text-2xs font-semibold border flex items-center gap-1.5 ${statusLabels[status].className}`}
            title="当前电源子系统状态"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
            当前状态: {statusLabels[status].text}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* 1. Feature 12 Full Charge Trigger */}
          <button
            onClick={onTriggerFullChargeTest}
            className="min-h-[44px] p-2.5 rounded-card text-left bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-700/60 hover:border-emerald-500/70 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-fast ease-hud"
          >
            <div className="text-xs font-bold text-emerald-300 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              特性12: 充满校准
            </div>
            <div className="text-2xs text-emerald-400/80 mt-0.5 font-mono tabular-nums">
              100% 且电流 16 mA
            </div>
          </button>

          {/* 2. Super Fast Charge (预期效果：极速闪充 +4800mA 一键场景) */}
          <button
            onClick={() => {
              onSetStatus('charging');
              onUpdatePercentage(45);
              onUpdateCurrent(4800);
              onSetVoltage(4250);
              onSetTemperature(38.5);
              onUpdateHealthQuality('good');
            }}
            className="min-h-[44px] p-2.5 rounded-card text-left bg-sky-950/40 hover:bg-sky-950/70 border border-sky-700/60 hover:border-sky-500/70 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-fast ease-hud"
          >
            <div className="text-xs font-bold text-sky-300 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              极速闪充
            </div>
            <div className="text-2xs text-sky-400/80 mt-0.5 font-mono tabular-nums">
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
            className="min-h-[44px] p-2.5 rounded-card text-left bg-purple-950/40 hover:bg-purple-950/70 border border-purple-700/60 hover:border-purple-500/70 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-fast ease-hud"
          >
            <div className="text-xs font-bold text-purple-300 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-purple-400" />
              高负载游戏放电
            </div>
            <div className="text-2xs text-purple-400/80 mt-0.5 font-mono tabular-nums">
              -1150 mA / 发热升高
            </div>
          </button>

          {/* 4. Overheat Warning */}
          <button
            onClick={() => {
              onUpdateHealthQuality('overheat');
            }}
            className="min-h-[44px] p-2.5 rounded-card text-left bg-rose-950/40 hover:bg-rose-950/70 border border-rose-700/60 hover:border-rose-500/70 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-fast ease-hud"
          >
            <div className="text-xs font-bold text-rose-300 flex items-center gap-1">
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
              电池过热警报
            </div>
            <div className="text-2xs text-rose-400/80 mt-0.5 font-mono tabular-nums">
              49.2°C / 异常中断
            </div>
          </button>
        </div>
      </div>

      {/* Detailed Interactive Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
        {/* Percentage Slider (5. 电量百分比) */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-300">
              5. 当前电量百分比
            </span>
            <span className="font-mono font-bold text-white tabular-nums">
              {percentage}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={percentage}
            onChange={(e) => onUpdatePercentage(parseInt(e.target.value, 10))}
            className="hud-slider w-full"
            aria-label="当前电量百分比"
          />
          <div className="flex justify-between text-2xs text-slate-500 mt-0.5 font-mono tabular-nums">
            <span>0% (濒临关机)</span>
            <span>50%</span>
            <span>100% (满电)</span>
          </div>
        </div>

        {/* Current Slider (11. 瞬时电流) */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-300">
              11. 瞬时电流 (mA)
            </span>
            <span className={`font-mono font-bold tabular-nums ${current > 0 ? 'text-emerald-400' : 'text-sky-400'}`}>
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
            className="hud-slider w-full"
            aria-label="瞬时电流 (mA)"
          />
          <div className="flex justify-between text-2xs text-slate-500 mt-0.5 font-mono tabular-nums">
            <span>-2000 mA (大放电)</span>
            <span>0-25 mA (满电截止)</span>
            <span>+6000 mA (超级闪充)</span>
          </div>
        </div>

        {/* Degraded Capacity (3. 电池当前容量) */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-300">
              3. 电池当前容量 (衰减后容量)
            </span>
            <span className="font-mono font-bold text-white tabular-nums">
              {currentCapacity} / {designCapacity} mAh
            </span>
          </div>
          <input
            type="range"
            min={Math.round(designCapacity * 0.5)}
            max={designCapacity}
            value={currentCapacity}
            onChange={(e) => onUpdateCurrentCapacity(parseInt(e.target.value, 10))}
            className="hud-slider w-full"
            aria-label="电池当前容量 (衰减后)"
          />
          <div className="flex justify-between text-2xs text-slate-500 mt-0.5 font-mono tabular-nums">
            <span>严重衰减 (50%)</span>
            <span>80% 临界线</span>
            <span>健康 ({((currentCapacity / designCapacity) * 100).toFixed(1)}%)</span>
          </div>
        </div>

        {/* Design Capacity (4. 电池出厂设计容量) */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-300">
              4. 电池出厂设计容量 (mAh)
            </span>
            <span className="font-mono font-bold text-white tabular-nums">
              {designCapacity} mAh
            </span>
          </div>
          <input
            type="range"
            min="1000"
            max="15000"
            step="100"
            value={designCapacity}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              onUpdateDesignCapacity(val);
              // 同步钳制当前容量，避免衰减容量超出新设计容量导致健康度 > 100%
              if (currentCapacity > val) onUpdateCurrentCapacity(val);
            }}
            className="hud-slider w-full"
            aria-label="出厂设计容量 (mAh)"
          />
          <div className="flex justify-between text-2xs text-slate-500 mt-0.5 font-mono tabular-nums">
            <span>1000 mAh (小容量)</span>
            <span>5000 mAh (主流)</span>
            <span>15000 mAh (平板级)</span>
          </div>
        </div>

        {/* Cycle Count (10. 循环计数) */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-300">
              10. 充放电循环计数
            </span>
            <span className="font-mono font-bold text-white tabular-nums">
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
            className="hud-slider w-full"
            aria-label="充放电循环计数"
          />
          <div className="flex justify-between text-2xs text-slate-500 mt-0.5 font-mono tabular-nums">
            <span>0 次 (新机)</span>
            <span>500 次 (标准衰减期)</span>
            <span>1000+ 次 (需换电芯)</span>
          </div>
        </div>

        {/* Voltage (9. 电压 mV) */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-300">
              9. 电池电芯电压 (mV)
            </span>
            <span className="font-mono font-bold text-white tabular-nums">
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
            className="hud-slider w-full"
            aria-label="电池电芯电压 (mV)"
          />
          <div className="flex justify-between text-2xs text-slate-500 mt-0.5 font-mono tabular-nums">
            <span>3500 mV (放电截止)</span>
            <span>3850 mV (标称电压)</span>
            <span>4450 mV (满电高压)</span>
          </div>
        </div>

        {/* Temperature (7. 电池温度) */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-slate-300">
              7. 电池传感器温度 (°C)
            </span>
            <span className="font-mono font-bold text-white tabular-nums">
              {temperature} °C
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="55"
            step="0.5"
            value={temperature}
            onChange={(e) => onSetTemperature(parseFloat(e.target.value))}
            className="hud-slider w-full"
            aria-label="电池传感器温度 (°C)"
          />
          <div className="flex justify-between text-2xs text-slate-500 mt-0.5 font-mono tabular-nums">
            <span>0°C (过冷保护)</span>
            <span>32°C (正常)</span>
            <span>45°C+ (过热预警)</span>
          </div>
        </div>
      </div>

      {/* 6. 电池状态强制切换 (激活 onSetStatus 全量枚举入口) */}
      <div className="pt-2 border-t border-slate-800/80">
        <div className="text-xs font-semibold text-slate-300 mb-2">
          6. 电池状态强制切换 (Android BatteryManager Status)
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'charging', label: '充电中', color: 'text-emerald-300 border-emerald-500 bg-emerald-950/50', ring: 'ring-emerald-500' },
              { id: 'discharging', label: '放电中', color: 'text-sky-300 border-sky-500 bg-sky-950/50', ring: 'ring-sky-500' },
              { id: 'full', label: '已充满', color: 'text-teal-300 border-teal-500 bg-teal-950/50', ring: 'ring-teal-500' },
              { id: 'not_charging', label: '未充电', color: 'text-slate-300 border-slate-500 bg-slate-800/60', ring: 'ring-slate-400' },
            ] as const
          ).map((item) => {
            const isSelected = status === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSetStatus(item.id)}
                className={`min-h-[44px] px-3.5 py-1.5 rounded-chip border text-xs font-semibold transition-all duration-fast ease-hud active:scale-95 ${
                  isSelected
                    ? `${item.color} ring-2 ${item.ring} shadow-sm`
                    : 'border-slate-700/80 text-slate-400 hover:bg-slate-800/60'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 8. 电池健康状况枚举选择器 */}
      <div className="pt-2 border-t border-slate-800/80">
        <div className="text-xs font-semibold text-slate-300 mb-2">
          8. 电池硬件健康状态选择 (Android BatteryManager Health)
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'good', label: '良好 (Good)', color: 'text-emerald-300 border-emerald-500 bg-emerald-950/50', ring: 'ring-emerald-500' },
              { id: 'overheat', label: '过热 (Overheat)', color: 'text-amber-300 border-amber-500 bg-amber-950/50', ring: 'ring-amber-500' },
              { id: 'dead', label: '损坏 (Dead/Failed)', color: 'text-rose-300 border-rose-500 bg-rose-950/50', ring: 'ring-rose-500' },
              { id: 'over_voltage', label: '超压 (Over Voltage)', color: 'text-purple-300 border-purple-500 bg-purple-950/50', ring: 'ring-purple-500' },
              { id: 'unknown', label: '未知 (Unknown)', color: 'text-slate-300 border-slate-500 bg-slate-800/60', ring: 'ring-slate-400' },
            ] as const
          ).map((item) => {
            const isSelected = healthQuality === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onUpdateHealthQuality(item.id)}
                className={`min-h-[44px] px-3.5 py-1.5 rounded-chip border text-xs font-semibold transition-all duration-fast ease-hud active:scale-95 ${
                  isSelected
                    ? `${item.color} ring-2 ${item.ring} shadow-sm`
                    : 'border-slate-700/80 text-slate-400 hover:bg-slate-800/60'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 重置实验室参数 (激活 RotateCcw：恢复当前机型默认 12 项指标) */}
      <div className="pt-2 border-t border-slate-800/80">
        <button
          onClick={onResetLab}
          className="min-h-[44px] w-full px-3.5 py-2 rounded-chip border border-slate-700/80 text-xs font-semibold text-slate-400 hover:bg-slate-800/60 hover:text-white flex items-center justify-center gap-1.5 transition-colors duration-fast"
          title="恢复当前机型的出厂默认 12 项指标参数"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          重置实验室参数
        </button>
      </div>
    </div>
  );
}
