import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  RotateCcw,
  ZoomIn,
  ZoomOut,
  ChevronUp,
  ChevronDown,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight,
  CameraOff,
  RefreshCw,
  Play,
  Pause,
  Square,
  Settings,
  AlertCircle,
  Eye
} from 'lucide-react';
import { GlassCard, GlassButton, GlassModal } from '../components/DesignSystem';
import { cameraAdapterService } from '../services/cameraAdapterService';
import type { CameraDevice } from '../types/camera';

interface CameraMonitorPageProps {
  onNavigate: (page: string) => void;
}

export const CameraMonitorPage: React.FC<CameraMonitorPageProps> = ({ onNavigate }) => {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<CameraDevice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isMicOn, setIsMicOn] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [showSettings, setShowSettings] = useState(false);
  const [showCameraList, setShowCameraList] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'streaming' | 'error'>('connecting');

  useEffect(() => {
    cameraAdapterService.getDevices().then((devices) => {
      setCameras(devices);
      if (devices.length > 0) {
        setSelectedCamera(devices[0]);
      }
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedCamera) {
      setConnectionStatus('connecting');
      const timer = setTimeout(() => {
        setConnectionStatus(Math.random() > 0.1 ? 'streaming' : 'error');
        setIsStreaming(Math.random() > 0.1);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [selectedCamera]);

  const handlePTZControl = (direction: 'up' | 'down' | 'left' | 'right') => {
    console.log(`PTZ ${direction}`);
  };

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.min(200, Math.max(50, prev + delta)));
  };

  const handleRefresh = () => {
    setConnectionStatus('connecting');
    setTimeout(() => {
      setConnectionStatus('streaming');
      setIsStreaming(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-neutral-900/90 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => onNavigate('home')}
            className="p-2 rounded-lg hover:bg-neutral-800 transition-colors"
            aria-label="返回"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <span className="font-semibold">{selectedCamera?.name || '选择设备'}</span>
            {connectionStatus === 'streaming' && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
                <span className="text-xs text-success-400">直播中</span>
              </div>
            )}
            {connectionStatus === 'connecting' && (
              <span className="text-xs text-warning-400">连接中...</span>
            )}
            {connectionStatus === 'error' && (
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-danger-400" />
                <span className="text-xs text-danger-400">连接失败</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowCameraList(true)}
              className="p-2 rounded-lg hover:bg-neutral-800 transition-colors"
              aria-label="切换摄像头"
            >
              <Eye className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg hover:bg-neutral-800 transition-colors"
              aria-label="设置"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="pt-14 pb-32">
        <div className="relative aspect-video bg-neutral-950">
          {connectionStatus === 'connecting' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <RefreshCw className="w-12 h-12 text-primary-500 animate-spin" />
              <p className="mt-4 text-neutral-400">正在连接...</p>
              <p className="text-xs text-neutral-500 mt-1">{selectedCamera?.name}</p>
            </div>
          )}

          {connectionStatus === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <CameraOff className="w-16 h-16 text-danger-500" />
              <p className="mt-4 text-neutral-300">连接失败</p>
              <p className="text-xs text-neutral-500 mt-1">请检查网络或设备状态</p>
              <button
                onClick={handleRefresh}
                className="mt-4 px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg text-sm font-medium transition-colors"
              >
                重新连接
              </button>
            </div>
          )}

          {connectionStatus === 'streaming' && (
            <div className="absolute inset-0">
              <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto rounded-full bg-neutral-700/50 flex items-center justify-center mb-4">
                    <CameraOff className="w-12 h-12 text-neutral-500" />
                  </div>
                  <p className="text-neutral-400">实时画面</p>
                  <p className="text-xs text-neutral-600 mt-1">{selectedCamera?.name}</p>
                </div>
              </div>
              
              {isStreaming && (
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-full bg-danger-500/80 backdrop-blur-sm">
                    <span className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      <span className="text-xs font-medium">LIVE</span>
                    </span>
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-neutral-800/80 backdrop-blur-sm text-xs">
                    {zoom}%
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedCamera?.capabilities.find(c => c.type === 'ptz' && c.enabled) && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
              <GlassCard className="bg-neutral-900/80 backdrop-blur-xl border-neutral-700">
                <div className="p-2">
                  <div className="grid grid-cols-3 gap-1">
                    <div></div>
                    <button
                      onClick={() => handlePTZControl('up')}
                      className="p-2 rounded-lg hover:bg-neutral-700/50 transition-colors"
                      aria-label="向上"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                    <div></div>
                    <button
                      onClick={() => handlePTZControl('left')}
                      className="p-2 rounded-lg hover:bg-neutral-700/50 transition-colors"
                      aria-label="向左"
                    >
                      <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleZoom(10)}
                      className="p-2 rounded-lg hover:bg-neutral-700/50 transition-colors"
                      aria-label="放大"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handlePTZControl('right')}
                      className="p-2 rounded-lg hover:bg-neutral-700/50 transition-colors"
                      aria-label="向右"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div></div>
                    <button
                      onClick={() => handlePTZControl('down')}
                      className="p-2 rounded-lg hover:bg-neutral-700/50 transition-colors"
                      aria-label="向下"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleZoom(-10)}
                      className="p-2 rounded-lg hover:bg-neutral-700/50 transition-colors"
                      aria-label="缩小"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}
        </div>

        <div className="px-4 py-4 space-y-4">
          <GlassCard className="bg-neutral-900/50 border-neutral-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{selectedCamera?.name}</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {selectedCamera?.location} · {selectedCamera?.model}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                selectedCamera?.status === 'online' 
                  ? 'bg-success-500/20 text-success-400' 
                  : 'bg-danger-500/20 text-danger-400'
              }`}>
                {selectedCamera?.status === 'online' ? '在线' : '离线'}
              </div>
            </div>
          </GlassCard>

          <div className="grid grid-cols-3 gap-3">
            <GlassCard className="bg-neutral-900/50 border-neutral-800 text-center">
              <div className="text-2xl font-bold text-primary-400">0</div>
              <div className="text-xs text-neutral-500 mt-1">今日事件</div>
            </GlassCard>
            <GlassCard className="bg-neutral-900/50 border-neutral-800 text-center">
              <div className="text-2xl font-bold text-success-400">0</div>
              <div className="text-xs text-neutral-500 mt-1">宠物检测</div>
            </GlassCard>
            <GlassCard className="bg-neutral-900/50 border-neutral-800 text-center">
              <div className="text-2xl font-bold text-warning-400">0</div>
              <div className="text-xs text-neutral-500 mt-1">异常行为</div>
            </GlassCard>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-neutral-900/95 backdrop-blur-xl border-t border-neutral-800 safe-area-bottom">
        <div className="flex items-center justify-center gap-4 px-4 py-3">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-colors ${
              isMuted ? 'bg-neutral-800 hover:bg-neutral-700' : 'bg-primary-500/20 text-primary-400'
            }`}
            aria-label={isMuted ? '取消静音' : '静音'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            <span className="text-xs">{isMuted ? '静音' : '声音'}</span>
          </button>
          
          <button
            onClick={() => setIsMicOn(!isMicOn)}
            className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-colors ${
              isMicOn ? 'bg-danger-500 text-white' : 'bg-neutral-800 hover:bg-neutral-700'
            }`}
            aria-label={isMicOn ? '关闭麦克风' : '开启麦克风'}
          >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            <span className="text-xs">{isMicOn ? '对讲中' : '对讲'}</span>
          </button>

          <button
            onClick={handleRefresh}
            className="flex flex-col items-center gap-1 px-6 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 transition-colors"
            aria-label="刷新"
          >
            <RefreshCw className="w-5 h-5" />
            <span className="text-xs">刷新</span>
          </button>

          <button
            className="flex flex-col items-center gap-1 px-6 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 transition-colors"
            aria-label="全屏"
          >
            <Maximize2 className="w-5 h-5" />
            <span className="text-xs">全屏</span>
          </button>
        </div>
      </div>

      <GlassModal isOpen={showCameraList} onClose={() => setShowCameraList(false)} title="选择摄像头">
        <div className="space-y-2">
          {cameras.map((camera) => (
            <button
              key={camera.id}
              onClick={() => {
                setSelectedCamera(camera);
                setShowCameraList(false);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                selectedCamera?.id === camera.id 
                  ? 'bg-primary-500/20 border border-primary-500/50' 
                  : 'bg-neutral-800/50 hover:bg-neutral-800'
              }`}
            >
              <div className={`w-3 h-3 rounded-full ${
                camera.status === 'online' ? 'bg-success-500' : 'bg-neutral-600'
              }`} />
              <div className="flex-1 text-left">
                <h4 className="font-medium">{camera.name}</h4>
                <p className="text-xs text-neutral-500">{camera.location}</p>
              </div>
              {selectedCamera?.id === camera.id && (
                <div className="w-2 h-2 rounded-full bg-primary-500" />
              )}
            </button>
          ))}
        </div>
      </GlassModal>

      <GlassModal isOpen={showSettings} onClose={() => setShowSettings(false)} title="摄像头设置">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">夜视模式</span>
            <select className="bg-neutral-800 rounded-lg px-3 py-2 text-sm">
              <option>自动</option>
              <option>开启</option>
              <option>关闭</option>
              <option>彩色夜视</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">分辨率</span>
            <select className="bg-neutral-800 rounded-lg px-3 py-2 text-sm">
              <option>1080p</option>
              <option>720p</option>
              <option>480p</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">录制模式</span>
            <select className="bg-neutral-800 rounded-lg px-3 py-2 text-sm">
              <option>仅移动检测</option>
              <option>持续录制</option>
              <option>定时录制</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">移动检测灵敏度</span>
            <input type="range" min="1" max="100" defaultValue="60" className="w-32" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">声音检测</span>
            <button className="w-12 h-6 rounded-full bg-primary-500" />
          </div>
        </div>
      </GlassModal>
    </div>
  );
};
