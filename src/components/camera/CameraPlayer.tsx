import { useRef, useEffect, useState } from 'react';
import { Maximize2, Volume2, VolumeX, Settings } from 'lucide-react';
import type { CameraDevice, StreamQuality } from '../../types/camera';

interface CameraPlayerProps {
  device: CameraDevice;
  streamUrl?: string;
  quality?: StreamQuality;
  autoPlay?: boolean;
  showControls?: boolean;
  onQualityChange?: (quality: StreamQuality) => void;
  onFullscreen?: () => void;
  className?: string;
}

const qualityLabels: Record<StreamQuality, string> = {
  auto: '自动',
  '1080p': '1080P',
  '720p': '720P',
  '480p': '480P',
};

export function CameraPlayer({
  device,
  streamUrl,
  quality = 'auto',
  autoPlay = true,
  showControls = true,
  onQualityChange,
  onFullscreen,
  className = '',
}: CameraPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentQuality, setCurrentQuality] = useState<StreamQuality>(quality);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (device.status === 'online' && streamUrl) {
      initializeStream();
    } else {
      setError('设备离线或无法获取视频流');
    }
  }, [device, streamUrl]);

  const initializeStream = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (videoRef.current) {
        videoRef.current.src = device.thumbnailUrl || '';
        if (autoPlay) {
          await videoRef.current.play();
          setIsPlaying(true);
        }
      }
    } catch (err) {
      setError('无法加载视频流');
      console.error('Stream error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleQualityChange = (newQuality: StreamQuality) => {
    setCurrentQuality(newQuality);
    onQualityChange?.(newQuality);
    setShowSettings(false);
  };

  if (device.status !== 'online') {
    return (
      <div className={`relative bg-gray-900 rounded-xl overflow-hidden ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-800 flex items-center justify-center">
              <span className="text-3xl">📷</span>
            </div>
            <p className="font-medium">设备离线</p>
            <p className="text-sm mt-1">无法显示视频流</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-gray-900 rounded-xl overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <div className="text-center text-red-400">
            <p className="font-medium">{error}</p>
            <button
              onClick={initializeStream}
              className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm"
            >
              重试
            </button>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted={isMuted}
        onClick={togglePlay}
      />

      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
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
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <Settings className="w-5 h-5 text-white" />
                </button>
                
                {showSettings && (
                  <div className="absolute bottom-full left-0 mb-2 bg-gray-800 rounded-lg overflow-hidden shadow-xl min-w-[120px]">
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

            <button
              onClick={onFullscreen}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <Maximize2 className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      )}

      <div className="absolute top-4 left-4 bg-black/50 rounded-lg px-3 py-1.5">
        <span className="text-white text-sm font-medium">{device.name}</span>
        <span className="text-white/70 text-xs ml-2">{qualityLabels[currentQuality]}</span>
      </div>
    </div>
  );
}
