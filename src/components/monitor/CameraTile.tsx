// ============================================
// PawSync Pro 3.0 - Camera Tile Component
//
// 作者: 带娃的小陈工
// 日期: 2026-06-09
// 描述: 单个摄像头画面组件
// ============================================

import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Maximize2,
  Video,
  Circle,
  Camera,
  Wifi,
  WifiOff,
  Expand,
  Download,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { CameraDevice } from '../../types/camera';
import type { StreamHealth } from '../../types/monitor';
import { StreamHealthIndicator } from './StreamHealthIndicator';

interface CameraTileProps {
  camera: CameraDevice;
  stream?: MediaStream;
  isMain?: boolean;
  isSelected?: boolean;
  health?: StreamHealth;
  onFullscreen?: () => void;
  onRecord?: () => void;
  onScreenshot?: () => void;
  onSelect?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  draggable?: boolean;
  className?: string;
}

// 模拟流健康数据
const mockHealth: StreamHealth = {
  cameraId: '',
  latency: 45,
  fps: 30,
  bitrate: 2500,
  packetLoss: 0,
  status: 'excellent',
};

export const CameraTile = memo(function CameraTile({
  camera,
  stream,
  isMain = false,
  isSelected = false,
  health,
  onFullscreen,
  onRecord,
  onScreenshot,
  onSelect,
  onDragStart,
  onDragOver,
  onDrop,
  draggable = false,
  className = '',
}: CameraTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const streamHealth = health || { ...mockHealth, cameraId: camera.id };
  const isOnline = camera.status === 'online';

  // 处理视频流
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      setIsStreaming(true);
    }
  }, [stream]);

  // 模拟连接流
  const connectStream = useCallback(() => {
    if (!isOnline) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsStreaming(true);
      setIsLoading(false);
    }, 1000);
  }, [isOnline]);

  // 鼠标悬停显示控制
  const handleMouseEnter = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  };

  const handleMouseLeave = () => {
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 1500);
  };

  // 处理录制
  const handleRecord = () => {
    setIsRecording(!isRecording);
    onRecord?.();
  };

  // 处理截图
  const handleScreenshot = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const link = document.createElement('a');
        link.download = `${camera.name}_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    }
    onScreenshot?.();
  };

  // 离线状态
  if (!isOnline) {
    return (
      <div
        className={`
          relative bg-gray-900 rounded-lg overflow-hidden
          ${isSelected ? 'ring-2 ring-orange-500' : ''}
          ${className}
        `}
        onClick={onSelect}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <WifiOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">{camera.name}</p>
            <p className="text-xs mt-1">设备离线</p>
          </div>
        </div>

        {/* 离线标签 */}
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-red-500/80 text-white text-xs rounded-full">
          离线
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        relative bg-gray-900 rounded-lg overflow-hidden group
        ${isMain ? 'aspect-video' : 'aspect-video'}
        ${isSelected ? 'ring-2 ring-orange-500' : 'hover:ring-1 hover:ring-white/30'}
        transition-all duration-200
        ${className}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onSelect}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* 加载状态 */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-gray-900 z-20"
          >
            <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 视频流 */}
      {isStreaming && stream ? (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted={isMuted}
        />
      ) : isStreaming ? (
        // 模拟视频流（使用缩略图）
        <img
          src={camera.thumbnailUrl || camera.thumbnail}
          alt={camera.name}
          className="w-full h-full object-cover"
        />
      ) : (
        // 未连接状态
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          <div className="text-center">
            <Camera className="w-10 h-10 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400 text-sm mb-3">{camera.name}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                connectStream();
              }}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg transition-colors"
            >
              <Video className="w-4 h-4 inline mr-1" />
              连接
            </motion.button>
          </div>
        </div>
      )}

      {/* LIVE 标签 */}
      <AnimatePresence>
        {isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-red-500/90 backdrop-blur-sm rounded-md"
          >
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            <span className="text-white text-xs font-bold">LIVE</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 录制指示器 */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-red-500/90 backdrop-blur-sm rounded-md"
          >
            <Circle className="w-3 h-3 text-white fill-current animate-pulse" />
            <span className="text-white text-xs font-medium">REC</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 设备名称 */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2 pointer-events-none">
        <p className="text-white text-sm font-medium truncate">{camera.name}</p>
        {camera.location && (
          <p className="text-white/70 text-xs truncate">{camera.location}</p>
        )}
      </div>

      {/* 连接状态指示 */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        {isOnline && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-500/80 backdrop-blur-sm rounded text-xs text-white">
            <Wifi className="w-3 h-3" />
          </div>
        )}
      </div>

      {/* 控制按钮 */}
      <AnimatePresence>
        {showControls && isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-12 left-2 right-2 flex items-center justify-between"
          >
            {/* 左侧按钮 */}
            <div className="flex items-center gap-1">
              {/* 静音 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                className="p-1.5 bg-black/50 backdrop-blur-sm rounded-md hover:bg-black/70 transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-white" />
                ) : (
                  <Volume2 className="w-4 h-4 text-white" />
                )}
              </button>

              {/* 录制 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRecord();
                }}
                className={`p-1.5 backdrop-blur-sm rounded-md transition-colors ${
                  isRecording ? 'bg-red-500' : 'bg-black/50 hover:bg-black/70'
                }`}
              >
                <Circle className={`w-4 h-4 text-white ${isRecording ? 'fill-current' : ''}`} />
              </button>

              {/* 截图 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleScreenshot();
                }}
                className="p-1.5 bg-black/50 backdrop-blur-sm rounded-md hover:bg-black/70 transition-colors"
              >
                <Download className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* 右侧按钮 */}
            <div className="flex items-center gap-1">
              {/* 全屏 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFullscreen?.();
                }}
                className="p-1.5 bg-black/50 backdrop-blur-sm rounded-md hover:bg-black/70 transition-colors"
              >
                <Maximize2 className="w-4 h-4 text-white" />
              </button>

              {/* 扩展 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect?.();
                }}
                className="p-1.5 bg-black/50 backdrop-blur-sm rounded-md hover:bg-black/70 transition-colors"
              >
                <Expand className="w-4 h-4 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 流健康状态 - 仅主画面显示 */}
      {isMain && isStreaming && (
        <div className="absolute top-8 left-2">
          <StreamHealthIndicator health={streamHealth} compact />
        </div>
      )}

      {/* 拖拽指示器 */}
      {draggable && showControls && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="p-2 bg-black/50 rounded-lg backdrop-blur-sm">
            <span className="text-white text-xs">拖拽以移动</span>
          </div>
        </div>
      )}
    </div>
  );
});