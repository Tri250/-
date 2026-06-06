import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Maximize2,
  ZoomIn,
  ZoomOut,
  ChevronUp,
  ChevronDown,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight,
  CameraOff,
  RefreshCw,
  Settings,
  AlertCircle,
  Eye,
  Plus
} from 'lucide-react';
import { GlassCard, GlassModal } from '../components/DesignSystem';
import { cameraAdapterService } from '../services/cameraAdapterService';
import { DevicePairing } from '../components/camera/DevicePairing';
import { useCameraStore } from '../store/cameraStore';
import type { CameraDevice } from '../types/camera';

interface CameraMonitorPageProps {
  onNavigate: (page: string) => void;
}

export default function CameraMonitorPage({ onNavigate }: CameraMonitorPageProps) {
  const { devices, addDevice, loadDevices } = useCameraStore();
  const [selectedCamera, setSelectedCamera] = useState<CameraDevice | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isMicOn, setIsMicOn] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [showSettings, setShowSettings] = useState(false);
  const [showCameraList, setShowCameraList] = useState(false);
  const [showPairingModal, setShowPairingModal] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'streaming' | 'error'>('connecting');

  useEffect(() => {
    const initializeDevices = async () => {
      await loadDevices();
      const adapterDevices = await cameraAdapterService.getDevices();
      if (adapterDevices.length > 0 && devices.length === 0) {
        adapterDevices.forEach(device => addDevice(device));
      }
      if (devices.length > 0 || adapterDevices.length > 0) {
        const allDevices = devices.length > 0 ? devices : adapterDevices;
        setSelectedCamera(allDevices[0]);
      }
    };
    initializeDevices();
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

  const handleDevicePaired = async (device: CameraDevice) => {
    addDevice(device);
    setSelectedCamera(device);
    setShowPairingModal(false);
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
              onClick={() => setShowPairingModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 transition-all text-sm font-semibold shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 active:scale-95"
              aria-label="添加设备"
            >
              <Plus className="w-5 h-5" />
              <span>添加设备</span>
            </button>
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

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <GlassCard className="bg-neutral-900/50 border-neutral-800 text-center p-2 sm:p-3">
              <div className="text-lg sm:text-2xl font-bold text-primary-400">0</div>
              <div className="text-xs text-neutral-500 mt-1">今日事件</div>
            </GlassCard>
            <GlassCard className="bg-neutral-900/50 border-neutral-800 text-center p-2 sm:p-3">
              <div className="text-lg sm:text-2xl font-bold text-success-400">0</div>
              <div className="text-xs text-neutral-500 mt-1">宠物检测</div>
            </GlassCard>
            <GlassCard className="bg-neutral-900/50 border-neutral-800 text-center p-2 sm:p-3">
              <div className="text-lg sm:text-2xl font-bold text-warning-400">0</div>
              <div className="text-xs text-neutral-500 mt-1">异常行为</div>
            </GlassCard>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-neutral-900/95 backdrop-blur-xl border-t border-neutral-800 safe-area-bottom">
        <div className="flex items-center justify-center gap-2 sm:gap-3 px-2 sm:px-4 py-4">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`flex flex-col items-center gap-1 px-3 sm:px-5 py-2 sm:py-3 rounded-xl transition-all active:scale-95 ${
              isMuted ? 'bg-neutral-800/80 hover:bg-neutral-700/80' : 'bg-primary-500/20 border border-primary-500/30 text-primary-400'
            }`}
            aria-label={isMuted ? '取消静音' : '静音'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            <span className="text-xs font-medium">{isMuted ? '静音' : '声音'}</span>
          </button>

          <button
            onClick={() => setIsMicOn(!isMicOn)}
            className={`flex flex-col items-center gap-1 px-3 sm:px-5 py-2 sm:py-3 rounded-xl transition-all active:scale-95 ${
              isMicOn ? 'bg-danger-500 text-white shadow-lg shadow-danger-500/30' : 'bg-neutral-800/80 hover:bg-neutral-700/80'
            }`}
            aria-label={isMicOn ? '关闭麦克风' : '开启麦克风'}
          >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            <span className="text-xs font-medium">{isMicOn ? '对讲中' : '对讲'}</span>
          </button>

          <button
            onClick={handleRefresh}
            className="flex flex-col items-center gap-1 px-3 sm:px-5 py-2 sm:py-3 rounded-xl bg-neutral-800/80 hover:bg-neutral-700/80 transition-all active:scale-95"
            aria-label="刷新"
          >
            <RefreshCw className="w-5 h-5" />
            <span className="text-xs font-medium">刷新</span>
          </button>

          <button
            className="flex flex-col items-center gap-1.5 px-5 py-3 rounded-xl bg-neutral-800/80 hover:bg-neutral-700/80 transition-all active:scale-95"
            aria-label="全屏"
          >
            <Maximize2 className="w-5 h-5" />
            <span className="text-xs font-medium">全屏</span>
          </button>
        </div>
      </div>

      <GlassModal isOpen={showCameraList} onClose={() => setShowCameraList(false)} title="选择摄像头">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-neutral-400 mb-2">
            <span>共 {devices.length} 台设备</span>
            <span className="text-success-400">{devices.filter(d => d.status === 'online').length} 在线</span>
          </div>
          
          {devices.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-800 flex items-center justify-center">
                <CameraOff className="w-8 h-8 text-neutral-600" />
              </div>
              <p className="text-neutral-400 mb-4">暂无摄像头设备</p>
              <button
                onClick={() => {
                  setShowCameraList(false);
                  setShowPairingModal(true);
                }}
                className="px-6 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors"
              >
                添加第一台设备
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {devices.map((camera) => (
                  <button
                    key={camera.id}
                    onClick={() => {
                      setSelectedCamera(camera);
                      setShowCameraList(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      selectedCamera?.id === camera.id 
                        ? 'bg-primary-500/20 border-2 border-primary-500/50' 
                        : 'bg-neutral-800/50 border-2 border-transparent hover:bg-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="relative">
                      <div className={`w-3 h-3 rounded-full ${
                        camera.status === 'online' ? 'bg-success-500' : 'bg-neutral-600'
                      }`} />
                      {camera.status === 'online' && (
                        <div className="absolute inset-0 w-3 h-3 rounded-full bg-success-500 animate-ping opacity-50" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-medium">{camera.name}</h4>
                      <p className="text-xs text-neutral-500">{camera.location || '未设置位置'} · {camera.model || '未知型号'}</p>
                    </div>
                    {selectedCamera?.id === camera.id && (
                      <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => {
                  setShowCameraList(false);
                  setShowPairingModal(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary-500/10 to-primary-600/10 border-2 border-dashed border-primary-500/40 hover:border-primary-500/70 hover:bg-primary-500/15 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-primary-400" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-semibold text-primary-400">添加新设备</h4>
                  <p className="text-xs text-primary-400/70">支持15+主流品牌摄像头</p>
                </div>
              </button>
            </>
          )}
        </div>
      </GlassModal>

      <GlassModal isOpen={showPairingModal} onClose={() => setShowPairingModal(false)} title="">
        <DevicePairing 
          onPaired={handleDevicePaired} 
          onCancel={() => setShowPairingModal(false)} 
        />
      </GlassModal>

      <GlassModal isOpen={showSettings} onClose={() => setShowSettings(false)} title="摄像头设置">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-neutral-200">夜视模式</span>
              <p className="text-xs text-neutral-500">自动调节红外夜视</p>
            </div>
            <select className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-neutral-200 focus:border-primary-500 focus:outline-none">
              <option>自动</option>
              <option>开启</option>
              <option>关闭</option>
              <option>彩色夜视</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-neutral-200">分辨率</span>
              <p className="text-xs text-neutral-500">视频画质设置</p>
            </div>
            <select className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-neutral-200 focus:border-primary-500 focus:outline-none">
              <option>1080p</option>
              <option>720p</option>
              <option>480p</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-neutral-200">录制模式</span>
              <p className="text-xs text-neutral-500">视频存储方式</p>
            </div>
            <select className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-neutral-200 focus:border-primary-500 focus:outline-none">
              <option>仅移动检测</option>
              <option>持续录制</option>
              <option>定时录制</option>
            </select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-200">移动检测灵敏度</span>
              <span className="text-sm text-primary-400 font-medium">60%</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="100" 
              defaultValue="60" 
              className="w-full h-2 bg-neutral-700 rounded-full appearance-none cursor-pointer accent-primary-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-neutral-200">声音检测</span>
              <p className="text-xs text-neutral-500">检测异常声音</p>
            </div>
            <button className="relative w-14 h-7 rounded-full bg-primary-500 transition-colors">
              <div className="absolute right-1 top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform" />
            </button>
          </div>
          <div className="pt-4 border-t border-neutral-700">
            <button className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/20">
              保存设置
            </button>
          </div>
        </div>
      </GlassModal>
    </div>
  );
};
