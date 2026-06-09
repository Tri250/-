// ============================================
// PawSync Pro 3.0 - Stream Health Indicator
//
// 作者: 带娃的小陈工
// 日期: 2026-06-09
// 描述: 流健康状态指示器组件
// ============================================

import { memo } from 'react';
import { Activity, Wifi, WifiOff, AlertTriangle, Zap } from 'lucide-react';
import type { StreamHealth } from '../../types/monitor';

interface StreamHealthIndicatorProps {
  health: StreamHealth;
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

// 状态颜色映射
const statusColors = {
  excellent: {
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    border: 'border-green-500/30',
    dot: 'bg-green-500',
  },
  good: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    dot: 'bg-blue-500',
  },
  poor: {
    bg: 'bg-yellow-500/20',
    text: 'text-yellow-400',
    border: 'border-yellow-500/30',
    dot: 'bg-yellow-500',
  },
  critical: {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    border: 'border-red-500/30',
    dot: 'bg-red-500',
  },
};

// 状态标签映射
const statusLabels = {
  excellent: '优秀',
  good: '良好',
  poor: '较差',
  critical: '严重',
};

// 获取延迟等级
const getLatencyLevel = (latency: number): 'good' | 'medium' | 'poor' => {
  if (latency < 100) return 'good';
  if (latency < 300) return 'medium';
  return 'poor';
};

// 获取帧率等级
const getFpsLevel = (fps: number): 'good' | 'medium' | 'poor' => {
  if (fps >= 25) return 'good';
  if (fps >= 15) return 'medium';
  return 'poor';
};

// 获取码率显示值
const formatBitrate = (bitrate: number): string => {
  if (bitrate >= 1000) {
    return `${(bitrate / 1000).toFixed(1)} Mbps`;
  }
  return `${bitrate} Kbps`;
};

export const StreamHealthIndicator = memo(function StreamHealthIndicator({
  health,
  showDetails = false,
  compact = false,
  className = '',
}: StreamHealthIndicatorProps) {
  const colors = statusColors[health.status];
  const latencyLevel = getLatencyLevel(health.latency);
  const fpsLevel = getFpsLevel(health.fps);

  // 紧凑模式 - 只显示状态点
  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${colors.bg} ${colors.border} border ${className}`}
        title={`${statusLabels[health.status]} - 延迟: ${health.latency}ms, 帧率: ${health.fps}fps`}
      >
        <span className={`w-2 h-2 rounded-full ${colors.dot} animate-pulse`} />
        <span className={`text-xs font-medium ${colors.text}`}>
          {statusLabels[health.status]}
        </span>
      </div>
    );
  }

  // 详细模式
  if (showDetails) {
    return (
      <div className={`bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 ${className}`}>
        {/* 状态头部 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${colors.dot} animate-pulse`} />
            <span className={`text-sm font-medium ${colors.text}`}>
              流状态: {statusLabels[health.status]}
            </span>
          </div>
          {health.packetLoss > 0 && (
            <div className="flex items-center gap-1 text-yellow-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="text-xs">丢包: {health.packetLoss.toFixed(1)}%</span>
            </div>
          )}
        </div>

        {/* 详细指标 */}
        <div className="grid grid-cols-3 gap-3">
          {/* 延迟 */}
          <div className="bg-gray-700/50 rounded-lg p-2">
            <div className="flex items-center gap-1.5 mb-1">
              <Activity className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-400">延迟</span>
            </div>
            <div className={`text-lg font-semibold ${
              latencyLevel === 'good' ? 'text-green-400' :
              latencyLevel === 'medium' ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {health.latency}
              <span className="text-xs ml-0.5">ms</span>
            </div>
          </div>

          {/* 帧率 */}
          <div className="bg-gray-700/50 rounded-lg p-2">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-400">帧率</span>
            </div>
            <div className={`text-lg font-semibold ${
              fpsLevel === 'good' ? 'text-green-400' :
              fpsLevel === 'medium' ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {health.fps}
              <span className="text-xs ml-0.5">fps</span>
            </div>
          </div>

          {/* 码率 */}
          <div className="bg-gray-700/50 rounded-lg p-2">
            <div className="flex items-center gap-1.5 mb-1">
              <Wifi className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-400">码率</span>
            </div>
            <div className="text-lg font-semibold text-blue-400">
              {formatBitrate(health.bitrate)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 标准模式
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* 状态指示 */}
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${colors.bg} ${colors.border} border`}>
        {health.status === 'critical' ? (
          <WifiOff className={`w-4 h-4 ${colors.text}`} />
        ) : (
          <Wifi className={`w-4 h-4 ${colors.text}`} />
        )}
        <span className={`text-sm font-medium ${colors.text}`}>
          {statusLabels[health.status]}
        </span>
      </div>

      {/* 快速指标 */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span className={latencyLevel === 'good' ? 'text-green-400' : latencyLevel === 'medium' ? 'text-yellow-400' : 'text-red-400'}>
          {health.latency}ms
        </span>
        <span className="text-gray-600">|</span>
        <span className={fpsLevel === 'good' ? 'text-green-400' : fpsLevel === 'medium' ? 'text-yellow-400' : 'text-red-400'}>
          {health.fps}fps
        </span>
      </div>
    </div>
  );
});