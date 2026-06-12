/**
 * StatusBar - 仿iOS状态栏
 * 透明状态栏融入Hero渐变
 */
import React from 'react';
import { Signal, Wifi, BatteryFull } from 'lucide-react';

export const StatusBar: React.FC<{ time?: string; dark?: boolean }> = ({
  time = '9:41',
  dark = false,
}) => {
  return (
    <div
      className="flex items-center justify-between px-6 pt-3 pb-1.5 text-[15px] font-semibold tabular-nums"
      style={{
        color: dark ? '#1f1f1f' : '#ffffff',
        fontFeatureSettings: '"tnum"',
      }}
    >
      <span>{time}</span>
      <div className="flex items-center gap-1.5">
        <Signal className="w-3.5 h-3.5" strokeWidth={2.5} />
        <Wifi className="w-3.5 h-3.5" strokeWidth={2.5} />
        <BatteryFull className="w-5 h-5" strokeWidth={2} />
      </div>
    </div>
  );
};

export default StatusBar;
