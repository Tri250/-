// ============================================
// PawSync Pro - LiveStream.tsx
//
// 作者: 带娃的小陈工
// 日期: 2026-06-09
// 描述: 实时视频流组件 - 集成真实 WebRTC/RTSP 流
// ============================================

import { useEffect, useRef, useState, useCallback } from 'react';
import { Maximize2, Volume2, VolumeX, Settings, Camera, AlertTriangle, Wifi, WifiOff, Activity } from 'lucide-react';
import type { CameraDevice, StreamQuality as CameraStreamQuality } from '../../types/camera';
import type { LiveMonitoring, StreamHealth } from '../../types/monitor';
import { StreamManager } from '../../services/streaming/streamManager';
import type { QualityLevel, StreamState, StreamError } from '../../services/streaming/types';

interface LiveStreamProps {
  device: CameraDevice;
  monitoring: LiveMonitoring;
  streamManager?: StreamManager | null;
  quality?: QualityLevel;
  onQualityChange?: (quality: CameraStreamQuality) => void;
  onFullscreen?: () => void;
  onEventClick?: () => void;
  onHealthUpdate?: (health: StreamHealth) => void;
  onStreamError?: (error: StreamError) => void;
  className?: string;
}

// 质量标签映射
const qualityLabels: Partial<Record<CameraStreamQuality, string>> = {
  auto: '自动',
  '1080p': '1080P',
  '720p': '720P',
  '480p': '480P',
  low: '低',
  medium: '中',
  high: '高',
  ultra: '超高清',
};

// 将 CameraStreamQuality 转换为 QualityLevel
const mapToQualityLevel = (quality: CameraStreamQuality): QualityLevel => {
  const mapping: Record<CameraStreamQuality, QualityLevel> = {
    auto: 'auto',
    low: 'low',
    medium: 'medium',
    high: 'high',
    ultra: 'ultra',
    '480p': 'low',
    '720p': 'medium',
    '1080p': 'high',
  };
  return mapping[quality] || 'auto';
};

// 将 QualityLevel 转换为 CameraStreamQuality
const mapToCameraQuality = (quality: QualityLevel): CameraStreamQuality => {
  const mapping: Record<QualityLevel, CameraStreamQuality> = {
    auto: 'auto',
    low: '480p',
    medium: '720p',
    high: '1080p',
    ultra: 'high',
  };
  return mapping[quality] || 'auto';
};

export function LiveStream({
  device,
  monitoring,
  streamManager: externalStreamManager,
  quality: initialQuality = 'auto',
  onQualityChange,
  onFullscreen,
  onEventClick,
  onHealthUpdate,
  onStreamError,
  className = '',
}: LiveStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamManagerRef = useRef<StreamManager | null>(null);
  
  const [isMuted, setIsMuted] = useState(false);
  const [currentQuality, setCurrentQuality] = useState<QualityLevel>(initialQuality);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasEvent, setHasEvent] = useState(false);
  const [streamState, setStreamState] = useState<StreamState>('idle');
  const [streamHealth, setStreamHealth] = useState<StreamHealth | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 初始化流管理器
  useEffect(() => {
    // 使用传入的 streamManager 或创建新的实例
    if (externalStreamManager) {
      streamManagerRef.current = externalStreamManager;
    } else {
      // 创建流管理器实例
      streamManagerRef.current = new StreamManager({
        onStateChange: (event) => {
          if (event.type === 'stateChange' && event.data) {
            const state = (event.data as { state: StreamState }).state;
            setStreamState(state);
            setIsLoading(state === 'connecting');
            if (state === 'error') {
              setError('流连接失败');
            }
          }
        },
        onError: (streamError) => {
          console.error('流错误:', streamError);
          setError(streamError.message);
          onStreamError?.(streamError);
        },
        onHealthUpdate: (deviceId, health) => {
          // 转换为 monitor.ts 的 StreamHealth 格式
          const monitorHealth: StreamHealth = {
            cameraId: deviceId,
            latency: health.network.rtt,
            fps: health.video.frameRate,
            bitrate: health.network.bitrateReceived,
            packetLoss: health.network.packetLoss * 100,
            status: health.quality === 'excellent' ? 'excellent' :
                    health.quality === 'good' ? 'good' :
                    health.quality === 'fair' ? 'poor' : 'critical',
          };
          setStreamHealth(monitorHealth);
          onHealthUpdate?.(monitorHealth);
        },
      });
    }
    
    setCurrentQuality(initialQuality);

    // 清理
    return () => {
      if (streamManagerRef.current && !externalStreamManager) {
        streamManagerRef.current.destroy();
        streamManagerRef.current = null;
      }
    };
  }, [externalStreamManager, initialQuality, onHealthUpdate, onStreamError, onQualityChange]);

  // 连接流
  useEffect(() => {
    if (!device || device.status !== 'online' || !streamManagerRef.current) {
      return;
    }

    const connectStream = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // 根据设备配置选择协议
        const protocol = device.protocol === 'webrtc' ? 'webrtc' :
                        device.protocol === 'rtsp' ? 'rtsp' :
                        device.protocol === 'hls' ? 'hls' : 'webrtc';

        // 构建流配置
        const streamConfig = {
          deviceId: device.id,
          preferredProtocol: protocol as 'webrtc' | 'rtsp' | 'hls',
          fallbackProtocols: ['webrtc', 'rtsp', 'hls'] as ('webrtc' | 'rtsp' | 'hls')[],
          adaptiveBitrate: {
            enabled: true,
            initialQuality: currentQuality,
            minQuality: 'low' as QualityLevel,
            maxQuality: 'ultra' as QualityLevel,
          },
          webrtc: {
            signalingUrl: device.webrtcUrl || '/api/webrtc/signaling',
          },
          rtsp: {
            proxyUrl: '/api/rtsp-proxy',
          },
          enableWeakNetworkOptimization: true,
          enableAudio: true,
          enableVideo: true,
        };

        // 创建流
        const stream = await streamManagerRef.current.createStream(device.id, streamConfig);

        // 将流绑定到视频元素
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setIsLoading(false);
      } catch (err) {
        console.error('连接流失败:', err);
        setError(err instanceof Error ? err.message : '连接失败');
        setIsLoading(false);
        
        // 如果真实流连接失败，使用备用方案（静态图片）
        if (videoRef.current && device.thumbnail) {
          // 创建一个 canvas 来显示静态图片
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
              const img = new Image();
              img.src = device.thumbnail;
              img.onload = () => {
                ctx.drawImage(img, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
              };
            }
          }
        }
      }
    };

    connectStream();

    // 清理流
    return () => {
      if (streamManagerRef.current) {
        streamManagerRef.current.destroyStream(device.id);
      }
    };
  }, [device, currentQuality]);

  // 模拟事件检测（实际应由检测服务触发）
  useEffect(() => {
    if (!monitoring.isActive) return;
    
    const interval = setInterval(() => {
      // 这里应该由真实的检测服务触发
      // 暂时使用随机模拟
      setHasEvent(Math.random() > 0.95);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [monitoring.isActive]);

  // 切换静音
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  // 切换质量
  const handleQualityChange = useCallback((quality: QualityLevel) => {
    setCurrentQuality(quality);
    if (streamManagerRef.current) {
      streamManagerRef.current.switchQuality(device.id, quality).catch(console.error);
    }
    onQualityChange?.(mapToCameraQuality(quality));
    setShowSettings(false);
  }, [device.id, onQualityChange]);

  // 截图功能
  const handleScreenshot = useCallback(() => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      // 下载截图
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `screenshot-${device.name}-${Date.now()}.jpg`;
      link.click();
    }
  }, [device.name]);

  // 设备离线状态
  if (device.status !== 'online') {
    return (
      <div className={`relative bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-400">
          <Camera className="w-16 h-16 mx-auto mb-3 opacity-50" />
          <p className="font-medium">设备离线</p>
          <p className="text-sm mt-1">无法显示视频流</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-gray-900 rounded-xl overflow-hidden ${className}`}>
      {/* 加载状态 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">正在连接流...</p>
          </div>
        </div>
      )}

      {/* 错误状态 */}
      {error && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-20">
          <div className="text-center">
            <WifiOff className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-400 font-medium">连接失败</p>
            <p className="text-gray-500 text-sm mt-1">{error}</p>
            <button 
              onClick={() => {
                setError(null);
                setIsLoading(true);
                // 重新连接
                if (streamManagerRef.current) {
                  streamManagerRef.current.destroyStream(device.id);
                }
              }}
              className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600"
            >
              重试
            </button>
          </div>
        </div>
      )}

      {/* 视频元素 */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted={isMuted}
        autoPlay
      />

      {/* Canvas 备用显示 */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover hidden"
        width={1920}
        height={1080}
      />

      {/* 事件提示 */}
      {hasEvent && onEventClick && (
        <button
          onClick={onEventClick}
          className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg animate-pulse z-10"
        >
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">检测到事件</span>
        </button>
      )}

      {/* 流信息显示 */}
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5 z-10">
        <div className="flex items-center gap-2">
          {/* 流状态指示 */}
          {streamState === 'connected' ? (
            <Wifi className="w-3 h-3 text-green-400" />
          ) : streamState === 'connecting' ? (
            <Activity className="w-3 h-3 text-yellow-400 animate-pulse" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-400" />
          )}
          <span className="text-white text-sm font-medium">
            {streamState === 'connected' ? 'LIVE' : 
             streamState === 'connecting' ? '连接中' : 
             streamState === 'reconnecting' ? '重连中' : '离线'}
          </span>
        </div>
        <p className="text-white/80 text-xs mt-1">{device.name}</p>
        {streamHealth && (
          <div className="flex items-center gap-2 mt-1 text-xs text-white/60">
            <span>{streamHealth.latency}ms</span>
            <span>|</span>
            <span>{streamHealth.fps}fps</span>
          </div>
        )}
      </div>

      {/* 底部控制栏 */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 z-10">
        <div className="flex items-center justify-between">
          {/* 左侧控制 */}
          <div className="flex items-center gap-2">
            {/* 静音控制 */}
            <button
              onClick={toggleMute}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm"
              aria-label={isMuted ? '取消静音' : '静音'}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>

            {/* 设置菜单 */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm"
                aria-label="设置"
              >
                <Settings className="w-5 h-5 text-white" />
              </button>

              {/* 设置菜单面板 */}
              {showSettings && (
                <div className="absolute bottom-full left-0 mb-2 bg-gray-800/95 backdrop-blur-sm rounded-lg overflow-hidden shadow-xl min-w-[160px]">
                  {/* 质量选项 */}
                  <div className="px-3 py-2 border-b border-gray-700">
                    <span className="text-xs text-gray-400">画质</span>
                  </div>
                  {(['auto', 'low', 'medium', 'high', 'ultra'] as QualityLevel[]).map((q) => (
                    <button
                      key={q}
                      onClick={() => handleQualityChange(q)}
                      className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-700 transition-colors flex items-center justify-between ${
                        currentQuality === q ? 'text-orange-500 bg-gray-700/50' : 'text-white'
                      }`}
                    >
                      <span>{qualityLabels[mapToCameraQuality(q)] || q}</span>
                      {currentQuality === q && (
                        <span className="text-orange-500">✓</span>
                      )}
                    </button>
                  ))}
                  
                  {/* 截图按钮 */}
                  <div className="border-t border-gray-700">
                    <button
                      onClick={() => {
                        handleScreenshot();
                        setShowSettings(false);
                      }}
                      className="w-full px-4 py-2 text-sm text-left hover:bg-gray-700 transition-colors text-white flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      <span>截图</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 右侧状态 */}
          <div className="flex items-center gap-2">
            {/* 录制状态 */}
            {monitoring.isRecording && (
              <div className="flex items-center gap-1 bg-red-500/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-white text-xs font-medium">录制中</span>
              </div>
            )}

            {/* 流健康状态 */}
            {streamHealth && (
              <div className={`px-2 py-1 rounded-full text-xs ${
                streamHealth.status === 'excellent' ? 'bg-green-500/20 text-green-400' :
                streamHealth.status === 'good' ? 'bg-blue-500/20 text-blue-400' :
                streamHealth.status === 'poor' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {streamHealth.status === 'excellent' ? '优秀' :
                 streamHealth.status === 'good' ? '良好' :
                 streamHealth.status === 'poor' ? '较差' : '严重'}
              </div>
            )}

            {/* 全屏按钮 */}
            <button
              onClick={onFullscreen}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm"
              aria-label="全屏"
            >
              <Maximize2 className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* 检测状态指示 */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/20">
          <div className="flex items-center gap-2 text-xs text-white/80">
            <span className={monitoring.eventDetection.abnormalBehavior ? 'text-green-400' : 'text-gray-500'}>
              行为检测 {monitoring.eventDetection.abnormalBehavior ? '✓' : '✗'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/80">
            <span className={monitoring.eventDetection.emotionalChange ? 'text-green-400' : 'text-gray-500'}>
              情绪变化 {monitoring.eventDetection.emotionalChange ? '✓' : '✗'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/80">
            <span className={monitoring.eventDetection.dangerApproach ? 'text-green-400' : 'text-gray-500'}>
              危险接近 {monitoring.eventDetection.dangerApproach ? '✓' : '✗'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}