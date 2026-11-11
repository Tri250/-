/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LayoutGrid, Activity, HeartPulse, Wrench, Code2 } from 'lucide-react';

// 底部 5 Tab 导航（预期效果：状态总览/充放电图表/健康与充满/硬件实验/原生源码 + 手势条）；
// "原生工程" (hub) 视图保留在 NavTabId 中，由顶栏"Android 原生工程"按钮进入
export type NavTabId = 'overview' | 'telemetry' | 'health' | 'lab' | 'native' | 'hub';

interface AndroidNavBarProps {
  activeTab: NavTabId;
  onChangeTab: (tab: NavTabId) => void;
}

export function AndroidNavBar({ activeTab, onChangeTab }: AndroidNavBarProps) {
  const tabs = [
    { id: 'overview' as const, label: '状态总览', icon: LayoutGrid },
    { id: 'telemetry' as const, label: '充放电图表', icon: Activity },
    { id: 'health' as const, label: '健康与充满', icon: HeartPulse },
    { id: 'lab' as const, label: '硬件实验', icon: Wrench },
    { id: 'native' as const, label: '原生源码', icon: Code2 },
  ];

  return (
    <div className="shrink-0 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80">
      <div className="max-w-md mx-auto grid grid-cols-5 items-center h-16 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`min-h-[44px] flex flex-col items-center justify-center transition-all select-none ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive ? 'bg-emerald-50 dark:bg-emerald-950/60' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
              </div>
              <span className="text-[10px] font-medium tracking-tight mt-0.5 whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Android Native Home Gesture Pill */}
      <div className="pb-1.5 flex justify-center">
        <div className="w-32 h-1 rounded-full bg-slate-300 dark:bg-slate-700/80" />
      </div>
    </div>
  );
}
