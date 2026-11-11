/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  metricNumber?: number; // e.g., 1 for "1、电池健康度"
  value: string | number;
  unit?: string;
  subValue?: string;
  badge?: {
    text: string;
    variant: 'good' | 'warning' | 'danger' | 'neutral' | 'info';
  };
  icon?: ReactNode;
  hint?: string;
  onClick?: () => void;
  /** 网格阶梯进场延迟索引（与 animate-card-in 配合形成错落入场） */
  staggerIndex?: number;
}

export function MetricCard({
  title,
  metricNumber,
  value,
  unit,
  subValue,
  badge,
  icon,
  hint,
  onClick,
  staggerIndex,
}: MetricCardProps) {
  const badgeStyles: Record<string, string> = {
    good: 'text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 shadow-sm shadow-emerald-900/30',
    warning: 'text-amber-300 bg-amber-950/70 border border-amber-500/40 shadow-sm shadow-amber-900/30',
    danger: 'text-rose-300 bg-rose-950/70 border border-rose-500/40 shadow-sm shadow-rose-900/30',
    neutral: 'text-slate-300 bg-slate-800/80 border border-slate-700/80',
    info: 'text-sky-300 bg-sky-950/70 border border-sky-500/40 shadow-sm shadow-sky-900/30',
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `${title}：${value}${unit ?? ''}` : undefined}
      style={staggerIndex !== undefined ? { animationDelay: `${staggerIndex * 45}ms` } : undefined}
      className={`group glass-panel glass-hairline relative overflow-hidden p-3.5 sm:p-4 rounded-card hover:border-emerald-500/40 animate-card-in transition-[transform,box-shadow,border-color] duration-fast ease-hud ${
        onClick
          ? 'cursor-pointer hover:shadow-emerald-950/20 hover:-translate-y-0.5 active:scale-[0.98]'
          : ''
      }`}
    >
      {/* Subtle top edge glow bar on hover */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-500/20 group-hover:via-emerald-400 to-transparent transition-all" />

      {/* Top row: Label & Icon */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
        <div className="flex items-center gap-1.5 font-medium">
          {metricNumber && (
            <span className="font-mono text-2xs text-emerald-400/80 font-bold px-1 rounded bg-emerald-950/40 border border-emerald-800/40">
              {metricNumber.toString().padStart(2, '0')}
            </span>
          )}
          <span className="text-slate-300 group-hover:text-white transition-colors">{title}</span>
        </div>
        {icon && <div className="text-slate-500 group-hover:text-emerald-400 transition-colors">{icon}</div>}
      </div>

      {/* Primary Value Readout */}
      <div className="flex items-baseline gap-1 mt-1">
        <span className="font-mono text-xl font-black tracking-tight text-white tabular-nums drop-shadow-sm">
          {value}
        </span>
        {unit && (
          <span className="font-mono text-xs font-bold text-emerald-400/90">
            {unit}
          </span>
        )}
      </div>

      {/* Sub-value or Badge */}
      <div className="mt-2 flex items-center justify-between text-xs gap-1">
        {subValue ? (
          <span className="text-slate-400 truncate font-mono text-2xs">
            {subValue}
          </span>
        ) : (
          <span />
        )}

        {badge && (
          <span
            className={`px-2 py-0.5 rounded-chip font-mono font-semibold text-2xs tracking-wide shrink-0 ${
              badgeStyles[badge.variant] || badgeStyles.neutral
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>

      {/* Optional explanatory hint */}
      {hint && (
        <div className="mt-2 pt-2 border-t border-slate-800/60 text-2xs text-slate-500 leading-normal font-mono">
          {hint}
        </div>
      )}
    </div>
  );
}
