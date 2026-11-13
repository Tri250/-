/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Cpu, Zap, Activity, ShieldCheck, Layers, Thermometer, Microchip, Factory, Gamepad2 } from 'lucide-react';
import { HardwareInfo } from '../types/battery';

interface HardwareSummaryBarProps {
  hardwareInfo: HardwareInfo;
  deviceName: string;
  /** 实时瞬时功率 (W)：带符号——充电 +W / 放电 −W，与 Android powerWatts 单源口径一致 */
  powerWatts: number;
}

export function HardwareSummaryBar({ hardwareInfo, deviceName, powerWatts }: HardwareSummaryBarProps) {
  const throttleConfig = {
    NORMAL: {
      text: '全频供电 (无节流)',
      color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40',
      dot: 'bg-emerald-400',
    },
    LIGHT_THROTTLE: {
      text: '温控保护 (限流 15%)',
      color: 'text-amber-400 bg-amber-950/60 border-amber-500/40',
      dot: 'bg-amber-400',
    },
    HEAVY_THROTTLE: {
      text: '过热急停 (限制 50%)',
      color: 'text-rose-400 bg-rose-950/60 border-rose-500/40',
      dot: 'bg-rose-400 animate-ping',
    },
  }[hardwareInfo.thermalThrottlingState];

  return (
    <div className="relative overflow-hidden glass-strong glass-hairline rounded-panel p-4 text-slate-100 animate-card-in">
      {/* Subtle futuristic cyber grid background overlay */}
      <div className="absolute -right-10 -top-10 w-44 h-44 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 w-44 h-44 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Row */}
      <div className="relative flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 p-[1px] shadow-sm">
            <div className="w-full h-full rounded-[11px] bg-slate-950 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold tracking-wider text-slate-100 uppercase">
                底层硬件信息与电源子系统
              </h3>
              <span className="font-mono text-2xs px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-500/30 font-semibold">
                HAL v2
              </span>
            </div>
            <div className="text-2xs font-mono text-slate-400 truncate">
              {deviceName} · {hardwareInfo.halVersion}
            </div>
          </div>
        </div>

        {/* Dynamic Thermal Status Pill */}
        <div className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${throttleConfig.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${throttleConfig.dot}`} />
          <span className="font-mono text-2xs">{throttleConfig.text}</span>
        </div>
      </div>

      {/* 6 Hardware Detail Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3">
        {/* 1. SoC Chipset */}
        <div className="p-2.5 rounded-card bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-1.5 text-2xs text-slate-400 mb-1">
            <Microchip className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="font-medium">主控处理器 (SoC)</span>
          </div>
          <div className="text-xs font-bold text-slate-200 truncate font-mono tabular-nums">
            {hardwareInfo.socModel}
          </div>
          <div className="text-2xs text-cyan-400/80 mt-0.5 font-mono truncate">
            {hardwareInfo.socVendor}
          </div>
        </div>

        {/* 2. PMIC Controller */}
        <div className="p-2.5 rounded-card bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-1.5 text-2xs text-slate-400 mb-1">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-medium">电源管理 IC (PMIC)</span>
          </div>
          <div className="text-xs font-bold text-slate-200 truncate font-mono tabular-nums">
            {hardwareInfo.pmicModel}
          </div>
        </div>

        {/* 3. Fast Charge Protocol */}
        <div className="p-2.5 rounded-card bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-1.5 text-2xs text-slate-400 mb-1">
            <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-medium">快充融合协议</span>
          </div>
          <div className="text-xs font-bold text-emerald-400 truncate font-mono tabular-nums">
            {hardwareInfo.fastChargeProtocol}
          </div>
          {/* 实时协商功率：与协议额定档位对照，闭环快充链路 (V×I 推导) */}
          <div className="text-2xs text-slate-400 mt-0.5 font-mono tabular-nums">
            协商功率: <span className="text-emerald-300 font-bold">{powerWatts.toFixed(1)} W</span>
            {powerWatts >= 45 ? ' · 超级快充档' : powerWatts >= 18 ? ' · 快充档' : powerWatts > 0.5 ? ' · 普通档' : ''}
          </div>
        </div>

        {/* 4. Battery Chemistry & Density */}
        <div className="p-2.5 rounded-card bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-1.5 text-2xs text-slate-400 mb-1">
            <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="font-medium">电芯材料与体系</span>
          </div>
          <div className="text-xs font-bold text-slate-200 truncate font-mono tabular-nums">
            {hardwareInfo.batteryChemistry}
          </div>
        </div>

        {/* 5. Internal Resistance */}
        <div className="p-2.5 rounded-card bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-1.5 text-2xs text-slate-400 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="font-medium">电芯动态内阻</span>
          </div>
          <div className="text-xs font-bold text-teal-300 font-mono tabular-nums flex items-baseline gap-1">
            <span>{hardwareInfo.internalResistanceMohm}</span>
            <span className="text-2xs text-slate-500 font-normal">mΩ (健康 &lt; 25)</span>
          </div>
        </div>

        {/* 6. Cell Packaging Architecture */}
        <div className="p-2.5 rounded-card bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-1.5 text-2xs text-slate-400 mb-1">
            <Thermometer className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="font-medium">电芯封装结构</span>
          </div>
          <div className="text-xs font-bold text-slate-200 truncate font-mono tabular-nums">
            {hardwareInfo.cellStructure}
          </div>
        </div>
      </div>

      {/* SoC 主控架构区块：制程 / CPU / GPU 三栏 (与 Android 端 SoCHardwareProfile 字段对齐) */}
      <div className="mt-3 pt-3 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5 text-2xs text-slate-400 mb-2">
          <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="font-medium">SoC 主控架构</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="p-2.5 rounded-card bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-1.5 text-2xs text-slate-400 mb-1">
              <Factory className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="font-medium">制程工艺</span>
            </div>
            <div className="text-xs font-bold text-slate-200 font-mono tabular-nums">
              {hardwareInfo.socProcess}
            </div>
          </div>
          <div className="p-2.5 rounded-card bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-1.5 text-2xs text-slate-400 mb-1">
              <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="font-medium">CPU 架构</span>
            </div>
            <div className="text-2xs font-bold text-slate-200 font-mono tabular-nums leading-relaxed">
              {hardwareInfo.socCpu}
            </div>
          </div>
          <div className="p-2.5 rounded-card bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-1.5 text-2xs text-slate-400 mb-1">
              <Gamepad2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="font-medium">GPU 渲染</span>
            </div>
            <div className="text-xs font-bold text-slate-200 font-mono tabular-nums">
              {hardwareInfo.socGpu}
            </div>
          </div>
        </div>
      </div>

      {/* Linux Kernel Driver Subsystem Path Bar */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-2xs text-slate-400 font-mono tabular-nums gap-1">
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-emerald-500 font-bold">DRV:</span>
          <span className="text-slate-300 truncate">{hardwareInfo.kernelPowerDriver}</span>
        </div>
        <div className="flex items-center gap-1 text-slate-500">
          <span>AIDL BINDER:</span>
          <span className="text-emerald-400 font-semibold">ONLINE</span>
        </div>
      </div>
    </div>
  );
}
