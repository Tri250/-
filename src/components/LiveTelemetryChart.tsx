/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { TelemetryPoint } from '../types/battery';
import { Activity, Zap, Thermometer, Gauge } from 'lucide-react';

interface LiveTelemetryChartProps {
  history: TelemetryPoint[];
  currentVoltage: number;
  currentCurrent: number;
  currentTemp: number;
}

export function LiveTelemetryChart({
  history,
  currentVoltage,
  currentCurrent,
  currentTemp,
}: LiveTelemetryChartProps) {
  const [activeMetric, setActiveMetric] = useState<'current' | 'voltage' | 'temperature'>('current');

  if (history.length < 2) {
    return (
      <div className="p-6 rounded-panel glass-panel glass-hairline text-center text-xs text-slate-400 animate-fade-in">
        <Activity className="w-6 h-6 mx-auto mb-2 text-emerald-400 animate-pulse" />
        正在采集实时充放电波形数据...
      </div>
    );
  }

  // Determine bounds based on active metric
  let values: number[] = [];
  let unit = '';
  let color = '';
  let title = '';

  if (activeMetric === 'current') {
    values = history.map((h) => h.current);
    unit = 'mA';
    color = '#34d399'; // emerald-400
    title = '实时瞬时电流波形';
  } else if (activeMetric === 'voltage') {
    values = history.map((h) => h.voltage);
    unit = 'mV';
    color = '#38bdf8'; // sky-400
    title = '电池电芯端电压';
  } else {
    values = history.map((h) => h.temperature);
    unit = '°C';
    color = '#fbbf24'; // amber-400
    title = '电池传感器温度';
  }

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal === minVal ? 1 : maxVal - minVal;

  // 实时读数：直接采用当前传感器值 (激活 currentVoltage / currentCurrent / currentTemp)
  const latestValue =
    activeMetric === 'current'
      ? currentCurrent
      : activeMetric === 'voltage'
      ? currentVoltage
      : currentTemp;

  const width = 600;
  const height = 180;
  const paddingX = 20;
  const paddingY = 24;

  const points = values.map((val, idx) => {
    const x = paddingX + (idx / (values.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - ((val - minVal) / range) * (height - paddingY * 2);
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `M ${paddingX},${height - paddingY} L ${points.join(' L ')} L ${width - paddingX},${height - paddingY} Z`;

  return (
    <div className="p-5 rounded-panel glass-panel glass-hairline animate-card-in">
      {/* Title & Metric Switcher Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              {title}
            </h3>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            采样周期 1.5 秒 · 实时动态波形记录
          </div>
        </div>

        {/* Metric Segmented Control Buttons */}
        <div className="flex items-center p-1 bg-slate-950/60 border border-slate-800/80 rounded-chip gap-1">
          <button
            onClick={() => setActiveMetric('current')}
            aria-pressed={activeMetric === 'current'}
            className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-fast ease-hud flex items-center gap-1.5 whitespace-nowrap ${
              activeMetric === 'current'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            电流 (mA)
          </button>
          <button
            onClick={() => setActiveMetric('voltage')}
            aria-pressed={activeMetric === 'voltage'}
            className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-fast ease-hud flex items-center gap-1.5 whitespace-nowrap ${
              activeMetric === 'voltage'
                ? 'bg-slate-800 text-sky-400 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            电压 (mV)
          </button>
          <button
            onClick={() => setActiveMetric('temperature')}
            aria-pressed={activeMetric === 'temperature'}
            className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-fast ease-hud flex items-center gap-1.5 whitespace-nowrap ${
              activeMetric === 'temperature'
                ? 'bg-slate-800 text-amber-400 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            温度 (°C)
          </button>
        </div>
      </div>

      {/* Real-time stats strip */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 rounded-card bg-slate-950/50 text-xs text-slate-300 mb-3 font-mono tabular-nums">
        <div>
          <span className="text-slate-500">最新:</span>{' '}
          <strong className="text-white font-bold">
            {latestValue} {unit}
          </strong>
        </div>
        <div>
          <span className="text-slate-500">区间最小:</span> {minVal} {unit}
        </div>
        <div>
          <span className="text-slate-500">区间最大:</span> {maxVal} {unit}
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
          <defs>
            <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
            {/* 曲线霓虹辉光 */}
            <filter id="curveGlow" x="-10%" y="-40%" width="120%" height="180%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Horizontal Reference Gridlines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={width - paddingX}
            y2={paddingY}
            stroke="currentColor"
            strokeDasharray="4 4"
            className="text-slate-800"
          />
          <line
            x1={paddingX}
            y1={height / 2}
            x2={width - paddingX}
            y2={height / 2}
            stroke="currentColor"
            strokeDasharray="4 4"
            className="text-slate-800"
          />
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="currentColor"
            className="text-slate-800"
          />

          {/* Area Fill */}
          <path d={areaD} fill="url(#curveGradient)" className="transition-opacity duration-smooth" />

          {/* Main Stroke (霓虹辉光) */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#curveGlow)"
          />

          {/* Latest Data Point Dot：外圈呼吸脉冲 + 实心点 */}
          {points.length > 0 && (
            <>
              <circle
                cx={points[points.length - 1].split(',')[0]}
                cy={points[points.length - 1].split(',')[1]}
                r="4.5"
                fill={color}
                stroke="#0f172a"
                strokeWidth="2"
              />
              <circle
                cx={points[points.length - 1].split(',')[0]}
                cy={points[points.length - 1].split(',')[1]}
                r="4.5"
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                opacity="0.8"
                style={{
                  animation: 'hud-fade-in 1.6s ease-out infinite',
                  transformOrigin: `${points[points.length - 1].split(',')[0]}px ${points[points.length - 1].split(',')[1]}px`,
                }}
              />
            </>
          )}
        </svg>
      </div>

      {/* Time axis footer */}
      <div className="flex items-center justify-between text-2xs text-slate-500 font-mono mt-1 px-2">
        <span>30 秒前</span>
        <span>15 秒前</span>
        <span>当前 (实时)</span>
      </div>
    </div>
  );
}
