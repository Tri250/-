import { useEffect, useRef, useState } from 'react';
import { Maximize2, Volume2, VolumeX, Settings, Camera, AlertTriangle } from 'lucide-react';
import type { CameraDevice, StreamQuality } from '../../types/camera';
import type { LiveMonitoring } from '../../types/monitor';

interface LiveStreamProps {
  device: CameraDevice;
  monitoring: LiveMonitoring;
  onQualityChange?: (quality: StreamQuality) => void;
  onFullscreen?: () => void;
  onEventClick?: () => void;
  className?: string;
}

const qualityLabels: Partial<Record<StreamQuality, string>> = {
  auto: '自动',
  '1080p': '1080P',
  '720p': '720P',
  '480p': '480P',
  low: '低',
  medium: '中',
  high: '高',
  ultra: '超高清',
};

export function LiveStream({
  device,
  monitoring,
  onQualityChange,
  onFullscreen,
  onEventClick,
  className = '',
}: LiveStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [currentQuality, setCurrentQuality] = useState<StreamQuality>('auto');
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasEvent, setHasEvent] = useState(false);

  useEffect(() => {
    initializeStream();
  }, [device]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHasEvent(Math.random() > 0.8);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const initializeStream = async () => {
    setIsLoading(true);
    try {
      if (videoRef.current) {
        videoRef.current.src = device.thumbnail || '';
        await videoRef.current.play();
      }
    } catch (error) {
      console.error('Stream error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleQualityChange = (quality: StreamQuality) => {
    setCurrentQuality(quality);
    onQualityChange?.(quality);
    setShowSettings(false);
  };

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
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-20">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted={isMuted}
        autoPlay
      />

      {hasEvent && onEventClick && (
        <button
          onClick={onEventClick}
          className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg animate-pulse z-10"
        >
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">检测到事件</span>
        </button>
      )}

      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5 z-10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-white text-sm font-medium">LIVE</span>
        </div>
        <p className="text-white/80 text-xs mt-1">{device.name}</p>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm"
              >
                <Settings className="w-5 h-5 text-white" />
              </button>

              {showSettings && (
                <div className="absolute bottom-full left-0 mb-2 bg-gray-800/95 backdrop-blur-sm rounded-lg overflow-hidden shadow-xl min-w-[120px]">
                  {(['auto', '1080p', '720p', '480p'] as StreamQuality[]).map((q) => (
                    <button
                      key={q}
                      onClick={() => handleQualityChange(q)}
                      className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-700 transition-colors ${
                        currentQuality === q ? 'text-orange-500 bg-gray-700/50' : 'text-white'
                      }`}
                    >
                      {qualityLabels[q]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {monitoring.isRecording && (
              <div className="flex items-center gap-1 bg-red-500/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-white text-xs font-medium">录制中</span>
              </div>
            )}

            <button
              onClick={onFullscreen}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm"
            >
              <Maximize2 className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

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
