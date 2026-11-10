/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  BatteryState,
  BatteryStatus,
  BatteryHealthQuality,
  DevicePreset,
  TelemetryPoint,
  FullChargeRecord,
} from '../types/battery';
import { POPULAR_ANDROID_DEVICES } from '../data/devicePresets';
import { playPlugInSound, playFullChargeChime, playWarningBeep } from '../utils/soundEffects';

export function useBatteryMonitor() {
  // Current selected device preset
  const [selectedDevice, setSelectedDevice] = useState<DevicePreset>(POPULAR_ANDROID_DEVICES[0]);
  const [designCapacity, setDesignCapacity] = useState<number>(POPULAR_ANDROID_DEVICES[0].designCapacity);
  
  // Degraded actual usable capacity (default ~92.4% of design capacity)
  const [currentCapacity, setCurrentCapacity] = useState<number>(() => {
    return Math.round(POPULAR_ANDROID_DEVICES[0].designCapacity * 0.924);
  });

  // Core metrics
  const [percentage, setPercentage] = useState<number>(78);
  const [status, setStatus] = useState<BatteryStatus>('charging');
  const [current, setCurrent] = useState<number>(2350); // mA (positive charging, negative discharging)
  const [voltage, setVoltage] = useState<number>(4180); // mV
  const [temperature, setTemperature] = useState<number>(33.6); // °C
  const [healthQuality, setHealthQuality] = useState<BatteryHealthQuality>('good');
  const [cycleCount, setCycleCount] = useState<number>(0);

  // Requirement 12: Full Charge Capacity (only displayed when 100% and current in 0-25mA)
  const [fullChargeCapacity, setFullChargeCapacity] = useState<number | null>(null);
  const [lastFullChargeRecord, setLastFullChargeRecord] = useState<FullChargeRecord | null>(null);

  // Sound feedback toggle
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Real-time telemetry history for charts (last 30 seconds)
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>([]);

  // Android Native Hardware Driver state
  const [isLiveTelemetryRunning, setIsLiveTelemetryRunning] = useState<boolean>(true);

  // When selected device changes, update design capacity and scale degraded current capacity
  const handleSelectDevice = useCallback((device: DevicePreset) => {
    setSelectedDevice(device);
    setDesignCapacity(device.designCapacity);
    // Keep relative health ratio
    const currentRatio = currentCapacity / (designCapacity || 5000);
    const newCurrentCap = Math.round(device.designCapacity * Math.min(1, Math.max(0.7, currentRatio)));
    setCurrentCapacity(newCurrentCap);
    // 切换机型后旧的充满锁定值不再适用，需重新测量 (指标 12)
    setFullChargeCapacity(null);
  }, [currentCapacity, designCapacity]);

  // Derived Thermal Throttling State based on cell temperature
  const thermalThrottlingState: 'NORMAL' | 'LIGHT_THROTTLE' | 'HEAVY_THROTTLE' =
    temperature >= 44 ? 'HEAVY_THROTTLE' : temperature >= 38.5 ? 'LIGHT_THROTTLE' : 'NORMAL';

  // Dynamic internal resistance (mΩ) derived from base + cycle degradation + temperature
  const currentResistance = Number(
    (
      selectedDevice.internalResistanceMohm +
      (cycleCount / 300) * 1.5 +
      (temperature > 40 ? (temperature - 40) * 0.3 : 0)
    ).toFixed(1)
  );

  // 遥测心跳计数器：驱动充放电进度按节拍推进 (指标 5)
  const tickRef = useRef<number>(0);

  // Check and process requirement 12 condition
  // "仅当电量为 100% 且电流在 0-25 mA 之间时，才视为电池充满并显示完全充满时的容量"
  const prevFullMetRef = useRef<boolean>(false);
  useEffect(() => {
    const isCriteriaMet = percentage === 100 && current >= 0 && current <= 25;

    if (isCriteriaMet) {
      setStatus('full');

      // 仅在条件首次满足的瞬间计算并锁定一次容量，
      // 涓流区间内电流波动 (5-24mA) 不再触发重复随机抖动 (Requirement 12)
      if (!prevFullMetRef.current) {
        const estimatedFullCap = Math.round(currentCapacity * 0.996 + (Math.random() * 8 - 4));
        setFullChargeCapacity(estimatedFullCap);
        if (soundEnabled) playFullChargeChime();
        setLastFullChargeRecord({
          timestamp: Date.now(),
          recordedCapacity: estimatedFullCap,
          voltageAtFull: voltage,
          currentAtCutoff: current,
          cycleCount: cycleCount,
          healthCalculated: Number(((estimatedFullCap / designCapacity) * 100).toFixed(1)),
        });
      }
      prevFullMetRef.current = true;
    } else {
      prevFullMetRef.current = false;
      // If user discharges or current moves away from 0-25mA cutoff, fullChargeCapacity remains stored if recorded, or indicates awaiting cutoff
    }
  }, [percentage, current, currentCapacity, designCapacity, voltage, cycleCount, soundEnabled]);

  // Live telemetry loop (simulating realistic micro-fluctuations in current, voltage, temperature)
  useEffect(() => {
    if (!isLiveTelemetryRunning) return;

    const interval = setInterval(() => {
      tickRef.current += 1;

      // 指标 5 进度推进：充电 +1% / 3 秒，放电 -1% / 4.5 秒 (实时仿真闭环)
      if (status === 'charging' && percentage < 100 && tickRef.current % 2 === 0) {
        setPercentage((prev) => Math.min(100, Math.round(prev) + 1));
      }
      if (status === 'discharging' && percentage > 0 && tickRef.current % 3 === 0) {
        setPercentage((prev) => Math.max(0, Math.round(prev) - 1));
      }
      // 放电至 0% 后自动进入未充电状态 (电量耗尽保护)
      if (status === 'discharging' && percentage <= 1) {
        setPercentage(0);
        setStatus('not_charging');
        setCurrent(0);
      }

      // Current fluctuation
      setCurrent((prevCurrent) => {
        // 电量耗尽保护：0% 或即将耗尽且非充电状态时电流必须为 0，
        // 避免与上方 setCurrent(0) 竞争导致"未充电"状态仍显示负电流
        if (percentage <= 1 && status !== 'charging') return 0;
        if (percentage === 100 && prevCurrent >= 0 && prevCurrent <= 25) {
          // Keep in trickle band (10 - 24 mA)
          return Math.max(5, Math.min(24, Math.round(prevCurrent + (Math.random() * 4 - 2))));
        }
        if (status === 'charging') {
          // As battery approaches 100%, current naturally tapers (CC to CV phase)
          let targetCurrent = 2200;
          if (percentage > 90) targetCurrent = 800;
          if (percentage >= 98) targetCurrent = 200;
          if (percentage >= 100) targetCurrent = 15; // 满电 CV 截止：电流自然衰减进入 0-25mA 涓流区间
          const delta = (Math.random() * 60 - 30);
          return Math.max(0, Math.round(prevCurrent * 0.9 + targetCurrent * 0.1 + delta));
        } else if (status === 'discharging') {
          // Discharge load (-250mA to -850mA)
          const delta = (Math.random() * 40 - 20);
          return Math.min(-120, Math.max(-1400, Math.round(prevCurrent + delta)));
        } else if (status === 'full') {
          return Math.max(0, Math.min(25, Math.round(prevCurrent + (Math.random() * 2 - 1))));
        } else {
          // not_charging
          return 0;
        }
      });

      // Voltage calculation based on state of charge (3.65V to 4.45V)
      setVoltage((prevV) => {
        let baseV = 3650 + (percentage / 100) * 750; // 3650mV at 0% to 4400mV at 100%
        if (status === 'charging') baseV += 50; // IR drop offset during charge
        const jitter = Math.round(Math.random() * 6 - 3);
        const target = Math.round(baseV + jitter);
        return Math.round(prevV * 0.85 + target * 0.15);
      });

      // Temperature drift based on current intensity
      setTemperature((prevT) => {
        let targetTemp = 32.0;
        if (healthQuality === 'overheat') {
          targetTemp = 48.5;
        } else if (status === 'charging' && current > 2000) {
          targetTemp = 37.2;
        } else if (status === 'charging') {
          targetTemp = 34.0;
        } else {
          targetTemp = 30.5;
        }
        const delta = (targetTemp - prevT) * 0.05 + (Math.random() * 0.2 - 0.1);
        return Number((prevT + delta).toFixed(1));
      });

      // Push to telemetry history
      const now = Date.now();
      const timeStr = new Date(now).toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const powerW = Math.abs(voltage * current) / 1000000;

      setTelemetryHistory((prev) => {
        const next = [
          ...prev,
          {
            timestamp: now,
            timeStr,
            percentage,
            voltage,
            current,
            temperature,
            powerWatts: Number(powerW.toFixed(2)),
          },
        ];
        if (next.length > 25) next.shift();
        return next;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isLiveTelemetryRunning, percentage, status, current, voltage, temperature, healthQuality]);

  // Derived metrics
  // 1. 电池健康度
  const healthPercentage = Number(((currentCapacity / designCapacity) * 100).toFixed(1));
  // 2. 剩余电量 (mAh)
  const remainingCapacity = Math.round((percentage / 100) * currentCapacity);

  // Quick Action: Test condition 12 directly (100% and current in 0-25mA)
  const triggerFullChargeTest = useCallback(() => {
    setPercentage(100);
    setStatus('charging');
    const trickleCurrent = 16; // Perfectly within 0-25 mA
    setCurrent(trickleCurrent);
    setVoltage(4410);
    if (soundEnabled) playPlugInSound();
  }, [soundEnabled]);

  // Action: Toggle charge/discharge
  const toggleCharging = useCallback(() => {
    if (status === 'charging' || status === 'full') {
      setStatus('discharging');
      setCurrent(-420);
    } else {
      setStatus('charging');
      setCurrent(2400);
      if (soundEnabled) playPlugInSound();
    }
  }, [status, soundEnabled]);

  // Action: Set custom percentage
  const updatePercentage = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(val)));
    setPercentage(clamped);
    if (clamped < 100 && status === 'full') {
      setStatus('discharging');
      setCurrent(-350);
    }
  }, [status]);

  // Action: Set custom current
  const updateCurrent = useCallback((val: number) => {
    setCurrent(val);
    if (val > 0 && status !== 'charging') setStatus('charging');
    if (val < 0 && status !== 'discharging') setStatus('discharging');
    if (val === 0) setStatus('not_charging');
  }, [status]);

  // Action: Set custom design capacity
  const updateDesignCapacity = useCallback((val: number) => {
    const clamped = Math.max(1000, Math.min(15000, val));
    setDesignCapacity(clamped);
  }, []);

  // Action: Set custom degraded capacity
  const updateCurrentCapacity = useCallback((val: number) => {
    const clamped = Math.max(500, Math.min(designCapacity, val));
    setCurrentCapacity(clamped);
  }, [designCapacity]);

  // Action: Set custom cycle count
  const updateCycleCount = useCallback((val: number) => {
    setCycleCount(Math.max(0, Math.min(5000, val)));
  }, []);

  // Action: Set health quality state
  const updateHealthQuality = useCallback((val: BatteryHealthQuality) => {
    setHealthQuality(val);
    if (val === 'overheat') {
      setTemperature(49.2);
      if (soundEnabled) playWarningBeep();
    } else if (val === 'over_voltage') {
      setVoltage(4580);
      if (soundEnabled) playWarningBeep();
    } else if (val === 'good' && temperature > 42) {
      setTemperature(34.5);
    }
  }, [temperature, soundEnabled]);

  const state: BatteryState = {
    healthPercentage,
    remainingCapacity,
    currentCapacity,
    designCapacity,
    percentage,
    status,
    temperature,
    healthQuality,
    voltage,
    cycleCount,
    current,
    fullChargeCapacity,
    lastFullChargeRecord,
  };

  const hardwareInfo = {
    socModel: selectedDevice.socModel,
    pmicModel: selectedDevice.pmicModel,
    batteryChemistry: selectedDevice.batteryChemistry,
    fastChargeProtocol: selectedDevice.fastChargeProtocol,
    internalResistanceMohm: currentResistance,
    halVersion: 'Android 15 Battery AIDL 2.0',
    cellStructure: selectedDevice.cellStructure,
    thermalThrottlingState,
    kernelPowerDriver: 'Linux 6.6-android15 /sys/class/power_supply/battery',
  };

  return {
    state,
    selectedDevice,
    setSelectedDevice: handleSelectDevice,
    hardwareInfo,
    telemetryHistory,
    soundEnabled,
    setSoundEnabled,
    isLiveTelemetryRunning,
    setIsLiveTelemetryRunning,
    // Actions
    triggerFullChargeTest,
    toggleCharging,
    updatePercentage,
    updateCurrent,
    updateDesignCapacity,
    updateCurrentCapacity,
    updateCycleCount,
    updateHealthQuality,
    setVoltage,
    setTemperature,
    setStatus,
  };
}
