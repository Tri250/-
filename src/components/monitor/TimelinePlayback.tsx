// ============================================
// PawSync Pro 3.0 - Timeline Playback Component
//
// 作者: 带娃的小陈工
// 日期: 2026-06-09
// 描述: 时间轴回放组件
// ============================================

import { memo, useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ZoomIn,
  ZoomOut,
  Flag,
  AlertTriangle,
  Heart,
  Activity,
  Clock,
} from 'lucide-react';
import type { RecordingSession, SmartEvent } from '../../types/monitor';

interface TimelinePlaybackProps {
  recording: RecordingSession;
  events: SmartEvent[];
  currentTime: number;
  onSeek: (time: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  className?: string;
}

// 事件类型图标映射
const eventIcons = {
  behavior: Activity,
  emotion: Heart,
  environment: AlertTriangle,
};

// 事件严重程度颜色映射
const severityColors = {
  info: 'bg-blue-500',
  warning: 'bg-yellow-500',
  critical: 'bg-red-500',
};

// 格式化时间显示
const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// 格式化日期时间
const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const TimelinePlayback = memo(function TimelinePlayback({
  recording,
  events,
  currentTime,
  onSeek,
  onPlay,
  onPause,
  className = '',
}: TimelinePlaybackProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredEvent, setHoveredEvent] = useState<SmartEvent | null>(null);
  const [showEventList, setShowEventList] = useState(false);

  // 计算录制时长
  const duration = useMemo(() => {
    if (recording.endTime && recording.startTime) {
      const start = new Date(recording.startTime).getTime();
      const end = new Date(recording.endTime).getTime();
      return Math.floor((end - start) / 1000);
    }
    return recording.duration || 0;
  }, [recording]);

  // 计算进度百分比
  const progress = useMemo(() => {
    return (currentTime / duration) * 100;
  }, [currentTime, duration]);

  // 处理播放/暂停
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      onPause?.();
    } else {
      setIsPlaying(true);
      onPlay?.();
    }
  }, [isPlaying, onPlay, onPause]);

  // 处理快进/快退
  const handleSkip = useCallback((direction: 'back' | 'forward') => {
    const skipAmount = 10;
    const newTime = direction === 'forward'
      ? Math.min(currentTime + skipAmount, duration)
      : Math.max(currentTime - skipAmount, 0);
    onSeek(newTime);
  }, [currentTime, duration, onSeek]);

  // 处理时间轴点击
  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = Math.floor(percentage * duration);
    onSeek(Math.max(0, Math.min(newTime, duration)));
  }, [duration, onSeek]);

  // 处理缩放
  const handleZoom = useCallback((direction: 'in' | 'out') => {
    setZoomLevel((prev) => {
      if (direction === 'in') return Math.min(prev + 0.5, 4);
      return Math.max(prev - 0.5, 1);
    });
  }, []);

  // 计算事件在时间轴上的位置
  const getEventPosition = useCallback((event: SmartEvent): number => {
    const eventTime = new Date(event.timestamp).getTime();
    const startTime = new Date(recording.startTime).getTime();
    const relativeTime = (eventTime - startTime) / 1000;
    return (relativeTime / duration) * 100;
  }, [recording.startTime, duration]);

  // 按时间排序的事件
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
  }, [events]);

  // 自动播放进度更新
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      if (currentTime < duration) {
        onSeek(currentTime + 1);
      } else {
        setIsPlaying(false);
        onPause?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, currentTime, duration, onSeek, onPause]);

  return (
    <div className={`bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 ${className}`}>
      {/* 录制信息 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">
            {formatDateTime(recording.startTime)}
          </span>
          <span className="text-gray-600">-</span>
          <span className="text-sm text-gray-400">
            {recording.endTime ? formatDateTime(recording.endTime) : '进行中'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-white font-medium">
            {formatTime(currentTime)}
          </span>
          <span className="text-gray-600">/</span>
          <span className="text-sm text-gray-400">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* 时间轴 */}
      <div className="relative mb-4">
        {/* 时间轴背景 */}
        <div
          ref={timelineRef}
          className="relative h-8 bg-gray-700 rounded-lg cursor-pointer overflow-hidden"
          onClick={handleTimelineClick}
          style={{ transform: `scaleX(${zoomLevel})`, transformOrigin: 'left' }}
        >
          {/* 进度条 */}
          <motion.div
            className="absolute top-0 left-0 h-full bg-orange-500/30 rounded-lg"
            style={{ width: `${progress}%` }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />

          {/* 事件标记 */}
          {sortedEvents.map((event) => {
            const position = getEventPosition(event);
            const Icon = eventIcons[event.type] || Flag;
            return (
              <div
                key={event.id}
                className={`absolute top-1/2 transform -translate-y-1/2 ${severityColors[event.severity]} rounded-full p-1 cursor-pointer hover:scale-125 transition-transform`}
                style={{ left: `${position}%` }}
                onMouseEnter={() => setHoveredEvent(event)}
                onMouseLeave={() => setHoveredEvent(null)}
              >
                <Icon className="w-3 h-3 text-white" />
              </div>
            );
          })}

          {/* 播放指示器 */}
          <motion.div
            className="absolute top-0 h-full w-1 bg-orange-500 rounded"
            style={{ left: `${progress}%` }}
            animate={{ left: `${progress}%` }}
            transition={{ duration: 0.1 }}
          >
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-orange-500 rounded-full shadow-lg" />
          </motion.div>
        </div>

        {/* 时间刻度 */}
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i}>{formatTime((duration / 4) * i)}</span>
          ))}
        </div>

        {/* 事件悬停提示 */}
        <AnimatePresence>
          {hoveredEvent && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-900 rounded-lg px-3 py-2 shadow-xl border border-gray-700 z-10"
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${severityColors[hoveredEvent.severity]}`} />
                <span className="text-sm text-white font-medium">{hoveredEvent.description}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {formatDateTime(hoveredEvent.timestamp)}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 控制按钮 */}
      <div className="flex items-center justify-between">
        {/* 左侧控制 */}
        <div className="flex items-center gap-2">
          {/* 快退 */}
          <button
            onClick={() => handleSkip('back')}
            className="p-2 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <SkipBack className="w-5 h-5 text-white" />
          </button>

          {/* 播放/暂停 */}
          <button
            onClick={handlePlayPause}
            className="p-3 bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 text-white" />
            )}
          </button>

          {/* 快进 */}
          <button
            onClick={() => handleSkip('forward')}
            className="p-2 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <SkipForward className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* 右侧控制 */}
        <div className="flex items-center gap-2">
          {/* 缩放 */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleZoom('out')}
              disabled={zoomLevel <= 1}
              className="p-1.5 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <ZoomOut className="w-4 h-4 text-white" />
            </button>
            <span className="text-xs text-gray-400 px-1">{zoomLevel}x</span>
            <button
              onClick={() => handleZoom('in')}
              disabled={zoomLevel >= 4}
              className="p-1.5 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <ZoomIn className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* 事件列表 */}
          <button
            onClick={() => setShowEventList(!showEventList)}
            className={`p-2 rounded-lg transition-colors ${
              showEventList ? 'bg-orange-500' : 'bg-gray-700/50 hover:bg-gray-700'
            }`}
          >
            <Flag className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* 事件列表 */}
      <AnimatePresence>
        {showEventList && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-700"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-white">事件列表</h4>
              <span className="text-xs text-gray-400">{events.length} 个事件</span>
            </div>

            {events.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">暂无事件记录</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {sortedEvents.map((event) => {
                  const Icon = eventIcons[event.type] || Flag;
                  const eventTime = new Date(event.timestamp).getTime();
                  const startTime = new Date(recording.startTime).getTime();
                  const relativeTime = Math.floor((eventTime - startTime) / 1000);
                  return (
                    <button
                      key={event.id}
                      onClick={() => onSeek(relativeTime)}
                      className="w-full flex items-center gap-3 px-3 py-2 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
                    >
                      <div className={`p-1.5 rounded-lg ${severityColors[event.severity]}`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm text-white">{event.description}</p>
                        <p className="text-xs text-gray-400">{formatDateTime(event.timestamp)}</p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTime(relativeTime)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 录制状态 */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded ${
              recording.status === 'recording' ? 'bg-red-500/20 text-red-400' :
              recording.status === 'completed' ? 'bg-green-500/20 text-green-400' :
              recording.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {recording.status === 'recording' ? '录制中' :
               recording.status === 'completed' ? '已完成' :
               recording.status === 'paused' ? '已暂停' : '失败'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-gray-400">
            {recording.fileSize && (
              <span>文件大小: {(recording.fileSize / 1024 / 1024).toFixed(2)} MB</span>
            )}
            {recording.duration && (
              <span>时长: {formatTime(recording.duration)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});