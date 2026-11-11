/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Smartphone, Check, Sliders, AlertTriangle } from 'lucide-react';
import { DevicePreset } from '../types/battery';
import { POPULAR_ANDROID_DEVICES } from '../data/devicePresets';

interface DevicePresetSelectorProps {
  selectedDevice: DevicePreset;
  designCapacity: number;
  onSelectDevice: (device: DevicePreset) => void;
  onUpdateDesignCapacity: (capacity: number) => void;
}

export function DevicePresetSelector({
  selectedDevice,
  designCapacity,
  onSelectDevice,
  onUpdateDesignCapacity,
}: DevicePresetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customInput, setCustomInput] = useState(designCapacity.toString());
  const [capacityError, setCapacityError] = useState<string | null>(null);

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim() === '') {
      setCapacityError('请输入自定义出厂设计容量 (mAh)');
      return;
    }
    const val = parseInt(customInput, 10);
    if (isNaN(val) || val <= 0) {
      setCapacityError('容量必须为大于 0 的整数');
      return;
    }
    if (val < 1000 || val > 15000) {
      setCapacityError(`容量需在 1000 ~ 15000 mAh 之间 (当前输入 ${val})`);
      return;
    }
    setCapacityError(null);
    onUpdateDesignCapacity(val);
    onSelectDevice({
      id: 'custom-' + Date.now(),
      name: `自定义机型 (${val} mAh)`,
      brand: '自定义',
      designCapacity: val,
      fastChargeWattage: 65,
      batteryChemistry: '定制高密度锂聚合物电芯',
      socModel: '自定义 ARM64 SoC',
      pmicModel: '智能可编程 PMIC 控制器',
      fastChargeProtocol: 'UFCS 融合快充 / USB PD 3.0',
      internalResistanceMohm: 14.5,
      cellStructure: '标准动力电芯单电芯封装',
    });
    setIsOpen(false);
  };

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              4. 电池设计容量出厂配置
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{selectedDevice.name}</span>
              <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                ({designCapacity} mAh)
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="min-h-[44px] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
        >
          <Sliders className="w-3.5 h-3.5" />
          切换机型预设
        </button>
      </div>

      {/* Expandable Selector Drawer */}
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            选择主流安卓手机型号预设 (自动适配出厂设计容量)
          </div>

          {/* Brand-grouped preset grid (15 presets across 7 brands) */}
          {Array.from(new Set(POPULAR_ANDROID_DEVICES.map((d) => d.brand))).map((brand) => (
            <div key={brand}>
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono uppercase tracking-wider mb-1.5 mt-1 first:mt-0">
                {brand}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {POPULAR_ANDROID_DEVICES.filter((d) => d.brand === brand).map((device) => {
                  const isSelected = selectedDevice.id === device.id;
                  return (
                    <button
                      key={device.id}
                      onClick={() => {
                        onSelectDevice(device);
                        setCustomInput(device.designCapacity.toString());
                        setCapacityError(null);
                        setIsOpen(false);
                      }}
                      className={`min-h-[44px] p-2.5 rounded-xl text-left border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 dark:border-emerald-700'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">
                          {device.name}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          设计容量: {device.designCapacity} mAh · {device.fastChargeWattage}W
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Custom Capacity Input Form */}
          <form
            onSubmit={handleApplyCustom}
            className="pt-2 flex flex-col sm:flex-row items-center gap-2"
          >
            <div className="relative flex-1 w-full">
              <input
                type="number"
                min="1000"
                max="15000"
                value={customInput}
                onChange={(e) => {
                  setCustomInput(e.target.value);
                  if (capacityError) setCapacityError(null);
                }}
                placeholder="输入自定义出厂设计容量 (mAh)"
                className={`w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 ${
                  capacityError
                    ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-500'
                }`}
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">
                mAh
              </span>
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              保存自定义容量
            </button>
          </form>

          {/* 自定义容量校验反馈 */}
          {capacityError && (
            <p className="text-[11px] text-rose-500 dark:text-rose-400 font-medium flex items-center gap-1.5 -mt-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {capacityError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
