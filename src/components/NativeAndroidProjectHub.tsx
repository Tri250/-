/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { FileCode, Copy, Check, Terminal } from 'lucide-react';
import { NATIVE_CODE_FILES } from './NativeCodeViewer';

interface NativeFileItem {
  id: string;
  name: string;
  path: string;
  language: string;
  description: string;
  code: string;
}

export function NativeAndroidProjectHub() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const HUB_FILE_ORDER = ['receiver', 'state', 'viewmodel', 'device_profile', 'hardware_lab', 'compose', 'manifest', 'gradle'] as const;

  // Hub 视角的文件说明（code 仍取自共享数据源 NATIVE_CODE_FILES，保证与实际工程一致）
  const HUB_FILE_DESCRIPTIONS: Record<string, string> = {
    receiver: '核心广播接收器：监听 ACTION_BATTERY_CHANGED，与轮询通道共享 Reader 配置及特性 12（100% 且电流 0-25 mA）锁定逻辑',
    state: '数据实体模型：完整包含 1 到 12 项充放电指标字段 + 硬件信息汇总',
    viewmodel: 'ViewModel：双通道发布去重、模拟充满保持期倒计时、广播注册容错、指标 12 持久化与硬件实验室模拟覆盖层',
    device_profile: '设备硬件档案：PMIC/快充协议/电芯结构三级回退链（sysfs+device-tree 实测 → 品牌档案推断 → 工程估算），彻底消除"系统未上报"',
    hardware_lab: '硬件实验室 UI：4 一键场景（充满校准/极速闪充/游戏放电/过热警报）+ 6 滑杆 + 状态健康枚举 + 提示音开关',
    compose: 'Jetpack Compose 原生界面（全量源码）：顶部双 Tab 导航（状态总览/硬件实验室）、12 项指标卡片网格与充满校准对话框',
    manifest: 'Android 清单文件：零运行时权限（公开 Battery API 免权限），广播在代码中动态注册',
    gradle: 'Gradle 编译脚本：Android SDK 35、Kotlin 2.0、Jetpack Compose BOM 与 Release 签名注入',
  };

  const nativeFiles: NativeFileItem[] = HUB_FILE_ORDER.map((id) => {
    const file = NATIVE_CODE_FILES.find((f) => f.id === id);
    if (!file) throw new Error(`Shared native source missing: ${id}`);
    return {
      id: file.id,
      name: file.name,
      path: file.path,
      language: file.language,
      description: HUB_FILE_DESCRIPTIONS[id] ?? file.description,
      code: file.code,
    };
  });

  const [activeFileId, setActiveFileId] = useState<string>('receiver');
  const activeFile = nativeFiles.find((f) => f.id === activeFileId) || nativeFiles[0];

  const handleCopy = (code: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Overview Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white border border-emerald-900/40 shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-bold text-emerald-400 tracking-wide uppercase">
                Android 原生 Kotlin / Jetpack Compose 工程
              </span>
            </div>
            <h3 className="text-lg font-bold mt-1 text-white">
              已构建完整 Android Studio 原生工程源码
            </h3>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              基于 Android 原生 <code className="text-emerald-300">BatteryManager</code> 架构与
              Jetpack Compose Material 3 现代化界面，支持直接导入 Android Studio 编译生成 release APK 或 AAB。
            </p>
          </div>
        </div>

        {/* 12 Features Native API Mapping Strip */}
        <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
            <span className="text-slate-400">广播源:</span>
            <div className="font-mono text-emerald-300 font-semibold truncate">ACTION_BATTERY_CHANGED</div>
          </div>
          <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
            <span className="text-slate-400">瞬时电流:</span>
            <div className="font-mono text-emerald-300 font-semibold truncate">CURRENT_NOW (uA)</div>
          </div>
          <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
            <span className="text-slate-400">健康度诊断:</span>
            <div className="font-mono text-emerald-300 font-semibold truncate">EXTRA_HEALTH</div>
          </div>
          <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
            <span className="text-slate-400">特性12判定:</span>
            <div className="font-mono text-emerald-300 font-semibold truncate">100% &amp; 0-25 mA</div>
          </div>
        </div>
      </div>

      {/* File Navigation Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {nativeFiles.map((file) => {
          const isSelected = activeFileId === file.id;
          return (
            <button
              key={file.id}
              onClick={() => setActiveFileId(file.id)}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{file.name}</span>
            </button>
          );
        })}
      </div>

      {/* Code Viewer Card */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-md overflow-hidden text-slate-200">
        {/* Code Header */}
        <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="font-mono text-xs text-emerald-400 font-semibold">
              {activeFile.path}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {activeFile.description}
            </div>
          </div>

          <button
            onClick={() => handleCopy(activeFile.code, activeFile.id)}
            className="min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white font-medium flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            {copiedId === activeFile.id ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>已复制到剪贴板</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>复制代码</span>
              </>
            )}
          </button>
        </div>

        {/* Code Display */}
        <div className="p-4 overflow-x-auto max-h-[460px] overflow-y-auto">
          <pre className="font-mono text-xs leading-relaxed text-slate-300">
            <code>{activeFile.code}</code>
          </pre>
        </div>
      </div>

      {/* How to Build APK Guide */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-500" />
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Android Studio 导入与构建 APK 指南
          </h4>
        </div>

        <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600 dark:text-slate-300 leading-normal">
          <li>在电脑上打开 <strong>Android Studio Ladybug (2024.2+)</strong>。</li>
          <li>选择 <strong>Open Project</strong> 打开仓库中的 <code>/android</code> 目录。</li>
          <li>等待 Gradle 依赖下载与自动同步（SDK 35，Compose BOM 2024.10）。</li>
          <li>连接物理安卓手机（开启 USB 调试）或启动 Android 模拟器。</li>
          <li>点击顶部绿色运行按钮 <strong>Run &apos;app&apos;</strong>，或执行 <code>./gradlew assembleDebug</code> 生成安装包 <code>app-debug.apk</code>。</li>
        </ol>
      </div>
    </div>
  );
}
