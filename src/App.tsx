/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import {
  Zap,
  Sparkles,
  Moon,
  Sun,
  Smartphone,
  Code2,
  Pause,
  Play,
} from 'lucide-react';
import { useBatteryMonitor } from './hooks/useBatteryMonitor';
import { AndroidStatusBar } from './components/AndroidStatusBar';
import { PrimaryBatteryRing } from './components/PrimaryBatteryRing';
import { MetricCard } from './components/MetricCard';
import { FullChargeCalibrationCard } from './components/FullChargeCalibrationCard';
import { LiveTelemetryChart } from './components/LiveTelemetryChart';
import { DevicePresetSelector } from './components/DevicePresetSelector';
import { HardwareSimulationLab } from './components/HardwareSimulationLab';
import { BatteryHealthAdvice } from './components/BatteryHealthAdvice';
import { AndroidNavBar, NavTabId } from './components/AndroidNavBar';
import { NativeCodeViewer } from './components/NativeCodeViewer';
import { NativeAndroidProjectHub } from './components/NativeAndroidProjectHub';
import { HardwareSummaryBar } from './components/HardwareSummaryBar';

export default function App() {
  const {
    state,
    selectedDevice,
    setSelectedDevice,
    hardwareInfo,
    telemetryHistory,
    soundEnabled,
    setSoundEnabled,
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
    isLiveTelemetryRunning,
    setIsLiveTelemetryRunning,
  } = useBatteryMonitor();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<NavTabId>('overview');

  // Tab 视图滚动容器：切换 Tab 时复位到顶部，避免残留上一视图滚动位置
  const tabBodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    tabBodyRef.current?.scrollTo({ top: 0 });
  }, [activeTab]);

  // Theme mode: light or dark (defaults to dark for authentic Android AMOLED style)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Desktop view toggle: phone frame or expanded wide layout
  const [isPhoneFrameMode, setIsPhoneFrameMode] = useState<boolean>(true);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Health quality label & color mapping (Requirement 8)
  const healthQualityMap: Record<
    string,
    { label: string; variant: 'good' | 'warning' | 'danger' | 'neutral' }
  > = {
    good: { label: '良好 (Good)', variant: 'good' },
    overheat: { label: '过热 (Overheat)', variant: 'warning' },
    dead: { label: '损坏 (Dead/Failed)', variant: 'danger' },
    over_voltage: { label: '超压 (Over Voltage)', variant: 'danger' },
    unknown: { label: '未知 (Unknown)', variant: 'neutral' },
  };

  // Status mapping (Requirement 6)
  const statusMap: Record<string, { label: string; variant: 'good' | 'info' | 'neutral' }> = {
    charging: { label: '充电中', variant: 'good' },
    discharging: { label: '放电中', variant: 'info' },
    full: { label: '已充满', variant: 'good' },
    not_charging: { label: '未充电', variant: 'neutral' },
  };

  // Temperature band assessment (Requirement 7)
  const getTempAssessment = (temp: number) => {
    if (temp > 45) return { text: '严重发热 (>45 °C)', variant: 'danger' as const };
    if (temp >= 38) return { text: '偏热预警 (38-45 °C)', variant: 'warning' as const };
    if (temp <= 0) return { text: '过冷保护 (≤0 °C)', variant: 'danger' as const };
    return { text: '温度正常', variant: 'good' as const };
  };

  const tempAssessment = getTempAssessment(state.temperature);

  // 续航预估：放电时按实时电流折算，其余场景按 450mA 平均负载估算 (Requirement 5)
  const runtimeHours = (
    state.remainingCapacity /
    (state.status === 'discharging' && state.current < 0 ? Math.abs(state.current) : 450)
  ).toFixed(1);

  // 重置实验室：恢复当前选中机型的出厂默认 12 项指标
  const resetLab = () => {
    updateDesignCapacity(selectedDevice.designCapacity);
    updateCurrentCapacity(Math.round(selectedDevice.designCapacity * 0.92));
    updateCycleCount(0);
    updatePercentage(78);
    updateCurrent(-420);
    setVoltage(4150);
    setTemperature(32.5);
    setStatus('discharging');
    updateHealthQuality('good');
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#07090e] text-slate-900 dark:text-slate-100 transition-colors flex flex-col items-center">
      {/* Top Desktop Navigation & Controls Bar */}
      <header className="w-full max-w-5xl px-4 py-3 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-card bg-emerald-600 text-white flex items-center justify-center shadow-sm">
            <Zap className="w-4 h-4 fill-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              <span>Android Battery Master</span>
              <span className="text-xs font-normal text-slate-400">
                安卓电池充放电管家
              </span>
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Android Native HAL Subsystem Status Tag */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-950/40">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Android 仿真 HAL · 演示数据</span>
          </div>

          {/* Native Code Quick Button */}
          <button
            onClick={() => setActiveTab('hub')}
            className={`min-h-[38px] px-3 py-1.5 rounded-card border text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'hub'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Android 原生工程</span>
            <span className="sm:hidden">原生</span>
          </button>

          {/* Phone Frame Toggle (Desktop) */}
          <button
            onClick={() => setIsPhoneFrameMode(!isPhoneFrameMode)}
            className="hidden md:flex min-h-[38px] px-3 py-1.5 rounded-card border border-slate-700/80 hover:bg-slate-800/60 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors items-center gap-1.5"
            title="切换真机形态与宽屏仪表板"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{isPhoneFrameMode ? '宽屏模式' : '真机模拟'}</span>
          </button>

          {/* Dark/Light mode toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="min-h-[38px] w-9 h-9 rounded-card border border-slate-700/80 hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center"
            title="切换深色/浅色主题"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-5xl flex-1 p-2 sm:p-4 md:py-6 flex justify-center">
        {/* Device Frame or Wide Container */}
        <div
          className={`w-full transition-all duration-300 ${
            isPhoneFrameMode
              ? 'max-w-[430px] rounded-[42px] border-[6px] border-slate-800/80 dark:border-slate-700/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] bg-slate-50 dark:bg-slate-950 overflow-hidden relative flex flex-col h-[92vh] max-h-[900px]'
              : 'max-w-5xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 relative flex flex-col h-[calc(100vh-32px)]'
          }`}
        >
          {/* Android Status Bar (Always present in mobile/phone frame mode) */}
          <AndroidStatusBar
            percentage={state.percentage}
            status={state.status}
            healthQuality={state.healthQuality}
            temperature={state.temperature}
          />

          {/* App Header inside frame */}
          <div className="px-5 pt-1 pb-3 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60">
            <div>
              <div className="text-xs font-medium text-slate-400">
                {selectedDevice.name}
              </div>
              <div className="text-base font-bold text-white">
                充放电核心指标监控
              </div>
            </div>

            {/* Feature 12 Quick Status Chip */}
            <div
              onClick={() => setActiveTab('health')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveTab('health');
                }
              }}
              role="button"
              tabIndex={0}
              className={`cursor-pointer px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all flex items-center gap-1 ${
                state.percentage === 100 && state.current >= 0 && state.current <= 25
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
              }`}
            >
              <Sparkles className="w-3 h-3 text-emerald-500" />
              <span>{state.fullChargeCapacity ? `${state.fullChargeCapacity} mAh` : '充满校准'}</span>
            </div>
          </div>

          {/* Scrollable Tab Views Body (with bottom padding for Android gesture nav bar) */}
          <div ref={tabBodyRef} className="flex-1 min-h-0 p-4 pb-28 space-y-4 overflow-y-auto">
            {/* TAB 1: 状态总览 (OVERVIEW) */}
            {activeTab === 'overview' && (
              <div className="space-y-4 animate-tab-in">
                {/* Hero Battery Gauge Ring */}
                <PrimaryBatteryRing
                  percentage={state.percentage}
                  status={state.status}
                  remainingCapacity={state.remainingCapacity}
                  currentCapacity={state.currentCapacity}
                  current={state.current}
                  voltage={state.voltage}
                  onToggleCharging={toggleCharging}
                />

                {/* 硬件信息汇总栏 (Hardware Information Summary Bar) */}
                <HardwareSummaryBar
                  hardwareInfo={hardwareInfo}
                  deviceName={selectedDevice.name}
                  powerWatts={Math.abs(state.voltage * state.current) / 1000000}
                />

                {/* Device Preset Switcher */}
                <DevicePresetSelector
                  selectedDevice={selectedDevice}
                  designCapacity={state.designCapacity}
                  onSelectDevice={setSelectedDevice}
                  onUpdateDesignCapacity={updateDesignCapacity}
                />

                {/* Section Header: 12 Core Battery Metrics Breakdown */}
                <div className="flex items-center justify-between pt-1">
                  <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase">
                    12 项电池充放电指标详情
                  </h2>
                  <span className="text-[10px] text-slate-400 font-mono">
                    实时库仑计遥测
                  </span>
                </div>

                {/* Grid for all 12 target features */}
                <div className="grid grid-cols-2 gap-3">
                  {/* 1. 电池健康度 */}
                  <MetricCard
                    metricNumber={1}
                    title="电池健康度"
                    value={state.healthPercentage}
                    unit="%"
                    subValue={`衰减率: ${(100 - state.healthPercentage).toFixed(1)}%`}
                    badge={{
                      text: state.healthPercentage >= 90 ? '优异' : state.healthPercentage >= 80 ? '正常' : '建议维护',
                      variant: state.healthPercentage >= 90 ? 'good' : state.healthPercentage >= 80 ? 'info' : 'warning',
                    }}
                    hint="由当前容量 / 出厂设计容量得出"
                    onClick={() => setActiveTab('health')}
                  />

                  {/* 2. 剩余电量 (mAh) */}
                  <MetricCard
                    metricNumber={2}
                    title="剩余电量"
                    value={state.remainingCapacity.toLocaleString()}
                    unit="mAh"
                    subValue={`占当前可用容量的 ${state.percentage}%`}
                    badge={{
                      text: state.percentage <= 20 ? '低电量' : '电量充沛',
                      variant: state.percentage <= 20 ? 'danger' : 'good',
                    }}
                    hint="当前电量百分比 × 实际可用容量"
                    onClick={() => setActiveTab('telemetry')}
                  />

                  {/* 3. 电池当前容量 (衰减后的容量) */}
                  <MetricCard
                    metricNumber={3}
                    title="电池当前容量"
                    value={state.currentCapacity.toLocaleString()}
                    unit="mAh"
                    subValue="化学衰减后最大可用"
                    badge={{
                      text: `损耗 -${state.designCapacity - state.currentCapacity} mAh`,
                      variant: 'neutral',
                    }}
                    hint="随充放电循环逐步衰减的物理容量"
                    onClick={() => setActiveTab('lab')}
                  />

                  {/* 4. 电池设计容量 (出厂容量) */}
                  <MetricCard
                    metricNumber={4}
                    title="电池设计容量"
                    value={state.designCapacity.toLocaleString()}
                    unit="mAh"
                    subValue={selectedDevice.brand}
                    badge={{
                      text: '出厂标称',
                      variant: 'neutral',
                    }}
                    hint="制造商出厂铭牌额定容量"
                    onClick={() => setActiveTab('lab')}
                  />

                  {/* 5. 电量：当前电池电量的百分比 */}
                  <MetricCard
                    metricNumber={5}
                    title="电量百分比"
                    value={state.percentage}
                    unit="%"
                    subValue={`续航预估: ~${runtimeHours} 小时`}
                    badge={{
                      text: `${state.percentage}%`,
                      variant: state.percentage > 20 ? 'good' : 'danger',
                    }}
                    hint="Android BatteryManager.EXTRA_LEVEL"
                    onClick={() => setActiveTab('lab')}
                  />

                  {/* 6. 电池状态 */}
                  <MetricCard
                    metricNumber={6}
                    title="电池状态"
                    value={statusMap[state.status].label}
                    subValue={
                      state.status === 'charging'
                        ? `+${state.current} mA 恒流注入`
                        : state.status === 'discharging'
                        ? `${state.current} mA 负载放电`
                        : state.status === 'full'
                        ? '涓流截止 · 浮充保持'
                        : '设备独立运行'
                    }
                    badge={{
                      text: statusMap[state.status].label,
                      variant: statusMap[state.status].variant,
                    }}
                    hint="充电中 / 放电中 / 已充满 / 未充电"
                    onClick={() => setActiveTab('lab')}
                  />

                  {/* 7. 电池温度 */}
                  <MetricCard
                    metricNumber={7}
                    title="电池温度"
                    value={state.temperature}
                    unit="°C"
                    subValue={tempAssessment.text}
                    badge={{
                      text: tempAssessment.text.split(' ')[0],
                      variant: tempAssessment.variant,
                    }}
                    hint="内嵌 NTC 热敏电阻传感器测温"
                    onClick={() => setActiveTab('lab')}
                  />

                  {/* 8. 电池健康状况 */}
                  <MetricCard
                    metricNumber={8}
                    title="电池健康状况"
                    value={healthQualityMap[state.healthQuality]?.label.split(' ')[0] || '良好'}
                    subValue={state.healthQuality === 'good' ? '硬件指标无异常' : '需重点关注状态'}
                    badge={{
                      text: healthQualityMap[state.healthQuality]?.label || '良好',
                      variant: healthQualityMap[state.healthQuality]?.variant || 'good',
                    }}
                    hint="良好 / 过热 / 损坏 / 超压 / 未知"
                    onClick={() => setActiveTab('lab')}
                  />

                  {/* 9. 电压 */}
                  <MetricCard
                    metricNumber={9}
                    title="电池电压"
                    value={state.voltage.toLocaleString()}
                    unit="mV"
                    subValue={`约 ${(state.voltage / 1000).toFixed(3)} V`}
                    badge={{
                      text: state.voltage >= 4400 ? '高压区' : state.voltage <= 3700 ? '低压区' : '标称平稳',
                      variant: state.voltage >= 4500 ? 'danger' : 'info',
                    }}
                    hint="电芯两极实时电势差"
                    onClick={() => setActiveTab('lab')}
                  />

                  {/* 10. 循环计数 */}
                  <MetricCard
                    metricNumber={10}
                    title="循环计数"
                    value={state.cycleCount}
                    unit="次"
                    subValue={state.cycleCount < 300 ? '寿命极新' : state.cycleCount < 500 ? '中度损耗' : '重度使用'}
                    badge={{
                      text: `${state.cycleCount} Cycles`,
                      variant: state.cycleCount < 500 ? 'good' : 'warning',
                    }}
                    hint="累积充入 100% 额定电量折算 1 次"
                    onClick={() => setActiveTab('lab')}
                  />

                  {/* 11. 瞬时电流 */}
                  <MetricCard
                    metricNumber={11}
                    title="瞬时电流"
                    value={state.current > 0 ? `+${state.current}` : state.current}
                    unit="mA"
                    subValue={`功率: ${((Math.abs(state.voltage * state.current)) / 1000000).toFixed(2)} W`}
                    badge={{
                      text: state.current > 0 ? '流入注能' : state.current < 0 ? '流出消耗' : '静置',
                      variant: state.current > 0 ? 'good' : 'info',
                    }}
                    hint="实时流经采样电阻的充放电流"
                    onClick={() => setActiveTab('lab')}
                  />

                  {/* 12. 完全充满时的容量 (Card Preview) */}
                  <MetricCard
                    metricNumber={12}
                    title="完全充满时的容量"
                    value={state.fullChargeCapacity ? `${state.fullChargeCapacity}` : '待充满判定'}
                    unit={state.fullChargeCapacity ? 'mAh' : ''}
                    subValue={
                      state.percentage === 100 && state.current >= 0 && state.current <= 25
                        ? '已满足 100% & 0-25 mA 锁定'
                        : '充至 100% 且电流 0-25 mA 时记录'
                    }
                    badge={{
                      text:
                        state.percentage === 100 && state.current >= 0 && state.current <= 25
                          ? '已充满显示'
                          : '校准就绪',
                      variant:
                        state.percentage === 100 && state.current >= 0 && state.current <= 25
                          ? 'good'
                          : 'warning',
                    }}
                    hint="特性 12：仅当 100% 且电流 0-25 mA 时视为充满"
                    onClick={() => setActiveTab('health')}
                  />
                </div>

                {/* Requirement 12 Dedicated Calibration Component */}
                <FullChargeCalibrationCard
                  percentage={state.percentage}
                  current={state.current}
                  fullChargeCapacity={state.fullChargeCapacity}
                  lastFullChargeRecord={state.lastFullChargeRecord}
                  currentCapacity={state.currentCapacity}
                  designCapacity={state.designCapacity}
                  onTriggerTest={triggerFullChargeTest}
                />
              </div>
            )}

            {/* TAB 2: 充放电图表 (TELEMETRY) */}
            {activeTab === 'telemetry' && (
              <div className="space-y-4 animate-tab-in">
                <div className="p-4 rounded-panel glass-panel glass-hairline flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      高频硬件遥测分析
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      实时捕获充放电电流（mA）、电芯端电压（mV）及热敏传感器温度曲线
                    </p>
                  </div>
                  {/* 遥测暂停/恢复入口 (复用 isLiveTelemetryRunning 全局开关) */}
                  <button
                    onClick={() => setIsLiveTelemetryRunning(!isLiveTelemetryRunning)}
                    className="min-h-[44px] shrink-0 px-3 py-1.5 rounded-card border border-slate-700/80 hover:bg-slate-800/60 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-colors"
                    title={isLiveTelemetryRunning ? '暂停实时遥测采集，便于固定波形观察' : '恢复实时遥测采集'}
                  >
                    {isLiveTelemetryRunning ? (
                      <>
                        <Pause className="w-4 h-4 text-amber-500" />
                        <span>暂停遥测</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 text-emerald-400" />
                        <span>恢复遥测</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Real-time Graph */}
                <LiveTelemetryChart
                  history={telemetryHistory}
                  currentVoltage={state.voltage}
                  currentCurrent={state.current}
                  currentTemp={state.temperature}
                />

                {/* Telemetry Summary Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-card glass-panel glass-hairline">
                    <div className="text-xs text-slate-500">充放电功率</div>
                    <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                      {((Math.abs(state.voltage * state.current)) / 1000000).toFixed(2)} W
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      P = {state.voltage}mV × {Math.abs(state.current)}mA
                    </div>
                  </div>

                  <div className="p-4 rounded-card glass-panel glass-hairline">
                    <div className="text-xs text-slate-500">电池温度评估</div>
                    <div className="text-xl font-bold font-mono text-white mt-1">
                      {state.temperature} °C
                    </div>
                    <div className={`text-xs mt-1 font-medium ${
                      tempAssessment.variant === 'good'
                        ? 'text-emerald-600'
                        : tempAssessment.variant === 'warning'
                        ? 'text-amber-600'
                        : 'text-rose-600'
                    }`}>
                      {tempAssessment.text}
                    </div>
                  </div>
                </div>

                {/* Quick Shortcut to Lab */}
                <div className="p-4 rounded-card glass-panel flex items-center justify-between">
                  <div className="text-xs text-slate-300">
                    想要模拟更强充电功率或极端温升？
                  </div>
                  <button
                    onClick={() => setActiveTab('lab')}
                    className="min-h-[40px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white transition-colors duration-fast text-xs font-semibold"
                  >
                    前往实验室调节
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: 健康与充满 (HEALTH & REQUIREMENT 12) */}
            {activeTab === 'health' && (
              <div className="space-y-4 animate-tab-in">
                {/* Dedicated Requirement 12 Showcase Card */}
                <FullChargeCalibrationCard
                  percentage={state.percentage}
                  current={state.current}
                  fullChargeCapacity={state.fullChargeCapacity}
                  lastFullChargeRecord={state.lastFullChargeRecord}
                  currentCapacity={state.currentCapacity}
                  designCapacity={state.designCapacity}
                  onTriggerTest={triggerFullChargeTest}
                />

                {/* Battery Health Diagnosis and Advice */}
                <BatteryHealthAdvice
                  healthPercentage={state.healthPercentage}
                  cycleCount={state.cycleCount}
                  temperature={state.temperature}
                  healthQuality={state.healthQuality}
                />

                {/* Quick Shortcut to Lab (极端健康状态模拟入口) */}
                <div className="p-4 rounded-card glass-panel flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-300">
                    想模拟过热、超压、损坏等极端健康状态？
                  </div>
                  <button
                    onClick={() => setActiveTab('lab')}
                    className="min-h-[40px] shrink-0 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white transition-colors duration-fast text-xs font-semibold transition-colors"
                  >
                    前往实验室模拟
                  </button>
                </div>

                {/* Calibration Details Table */}
                <div className="p-4 rounded-panel glass-panel glass-hairline">
                  <h4 className="text-xs font-bold text-white mb-2">
                    完全充满校准规范详细说明
                  </h4>
                  <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                    <p>
                      <strong>为什么电量到 100% 还不算完全充满？</strong>
                      <br />
                      Android 电源管理为了用户体验，通常在恒压充电（CV）阶段初期就提前将 UI 进度显示为 100%。此时电池虽然已接近满电，但仍有数百毫安的电流在持续注入（饱和浮充）。
                    </p>
                    <p>
                      <strong>0-25 mA 截止电流门限：</strong>
                      <br />
                      根据锂离子电池充电终止标准，当充电电流自然衰减至出厂设计容量的 0.005C（即 0~25 mA 区间）时，才正式达到完全饱和截止。此时测得的容量值最为准确，被库仑计芯片固化为「完全充满时的容量」。
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: 硬件实验室 (LAB & SIMULATION) */}
            {activeTab === 'lab' && (
              <div className="space-y-4 animate-tab-in">
                <HardwareSimulationLab
                  percentage={state.percentage}
                  current={state.current}
                  voltage={state.voltage}
                  temperature={state.temperature}
                  status={state.status}
                  healthQuality={state.healthQuality}
                  currentCapacity={state.currentCapacity}
                  designCapacity={state.designCapacity}
                  cycleCount={state.cycleCount}
                  soundEnabled={soundEnabled}
                  isLiveTelemetryRunning={isLiveTelemetryRunning}
                  onUpdatePercentage={updatePercentage}
                  onUpdateCurrent={updateCurrent}
                  onSetVoltage={setVoltage}
                  onSetTemperature={setTemperature}
                  onSetStatus={setStatus}
                  onUpdateHealthQuality={updateHealthQuality}
                  onUpdateCurrentCapacity={updateCurrentCapacity}
                  onUpdateDesignCapacity={updateDesignCapacity}
                  onUpdateCycleCount={updateCycleCount}
                  onToggleSound={() => setSoundEnabled(!soundEnabled)}
                  onToggleLiveTelemetry={() => setIsLiveTelemetryRunning(!isLiveTelemetryRunning)}
                  onResetLab={resetLab}
                  onTriggerFullChargeTest={triggerFullChargeTest}
                />
              </div>
            )}

            {/* TAB 5: 原生源码与架构 (KOTLIN & JETPACK COMPOSE) */}
            {activeTab === 'native' && (
              <div className="space-y-4 animate-tab-in">
                <NativeCodeViewer />
              </div>
            )}

            {/* TAB 6: Android 原生工程总览 (PROJECT HUB) */}
            {activeTab === 'hub' && (
              <div className="space-y-4 animate-tab-in">
                <NativeAndroidProjectHub />
              </div>
            )}
          </div>

          {/* Android Bottom Navigation Bar */}
          <AndroidNavBar activeTab={activeTab} onChangeTab={setActiveTab} />
        </div>
      </main>
    </div>
  );
}
