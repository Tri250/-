/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BatteryStatus = 'charging' | 'discharging' | 'full' | 'not_charging';

export type BatteryHealthQuality = 'good' | 'overheat' | 'dead' | 'over_voltage' | 'unknown';

export interface HardwareInfo {
  socModel: string;
  socVendor: string;
  socProcess: string;
  socCpu: string;
  socGpu: string;
  pmicModel: string;
  batteryChemistry: string;
  fastChargeProtocol: string;
  internalResistanceMohm: number;
  halVersion: string;
  cellStructure: string;
  thermalThrottlingState: 'NORMAL' | 'LIGHT_THROTTLE' | 'HEAVY_THROTTLE';
  kernelPowerDriver: string;
}

export interface DevicePreset {
  id: string;
  name: string;
  brand: string;
  designCapacity: number; // in mAh
  fastChargeWattage: number; // in W
  batteryChemistry: string;
  socModel: string;
  socVendor: string;
  socProcess: string;
  socCpu: string;
  socGpu: string;
  pmicModel: string;
  fastChargeProtocol: string;
  internalResistanceMohm: number;
  cellStructure: string;
}

export interface TelemetryPoint {
  timestamp: number;
  timeStr: string;
  percentage: number;
  voltage: number; // in mV
  current: number; // in mA
  temperature: number; // in °C
  powerWatts: number; // in W
}

export interface FullChargeRecord {
  timestamp: number;
  recordedCapacity: number; // in mAh
  voltageAtFull: number; // in mV
  currentAtCutoff: number; // in mA (0 - 25 mA)
  cycleCount: number;
  healthCalculated: number; // %
}

export interface BatteryState {
  // 1. 电池健康度 (%)
  healthPercentage: number;
  // 2. 剩余电量 (mAh)
  remainingCapacity: number;
  // 3. 电池当前容量 (衰减后的容量, mAh)
  currentCapacity: number;
  // 4. 电池设计容量 (出厂容量, mAh)
  designCapacity: number;
  // 5. 电量百分比 (0 - 100)
  percentage: number;
  // 6. 电池状态
  status: BatteryStatus;
  // 7. 电池温度 (°C)
  temperature: number;
  // 8. 电池健康状况
  healthQuality: BatteryHealthQuality;
  // 9. 电压 (mV)
  voltage: number;
  // 10. 循环计数
  cycleCount: number;
  // 11. 瞬时电流 (mA)
  current: number;
  // 12. 完全充满时的容量 (mAh)
  fullChargeCapacity: number | null;
  // 记录满足“电量为 100% 且电流在 0-25 mA”条件的充满历史
  lastFullChargeRecord: FullChargeRecord | null;
}
