// ============================================
// PawSync Pro 3.0 - Immersive Camera Monitor Component
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 沉浸式全屏监控页面 - 无UI默认模式、AI智能构图、AI彩色夜视
// ============================================

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Maximize2, 
  Minimize2,
  Mic,
  MicOff,
  Camera,
  Play,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  Moon,
  Sun,
  Eye,
  Circle,
  ZoomIn
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';

interface CameraDevice {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'error';
  thumbnail?: string;
  location?: string;
  hasPTZ: boolean;
  hasNightVision: boolean;
  hasTwoWayAudio: boolean;
}

interface CameraMonitorComponentProps {
  cameras?: CameraDevice[];
  autoConnect?: boolean;
}

export function CameraMonitorComponent({ cameras, autoConnect: _autoConnect = true }: CameraMonitorComponentProps) {
  const { currentPet } = useAppStore();
  const [selectedCamera, setSelectedCamera] = useState<CameraDevice | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isNightVision, setIsNightVision] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const _isAIEnabled = true;
  const [showPIP, setShowPIP] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const _petName = currentPet?.name || '毛孩子';

  const mockCameras: CameraDevice[] = cameras || [
    {
      id: 'cam-1',
      name: '客厅摄像头',
      status: 'online',
      thumbnail: 'https://picsum.photos/seed/living/400/300',
      location: '客厅',
      hasPTZ: true,
      hasNightVision: true,
      hasTwoWayAudio: true
    },
    {
      id: 'cam-2',
      name: '卧室摄像头',
      status: 'online',
      thumbnail: 'https://picsum.photos/seed/bedroom/400/300',
      location: '卧室',
      hasPTZ: false,
      hasNightVision: true,
      hasTwoWayAudio: true
    },
    {
      id: 'cam-3',
      name: '阳台摄像头',
      status: 'online',
      thumbnail: 'https://picsum.photos/seed/balcony/400/300',
      location: '阳台',
      hasPTZ: true,
      hasNightVision: true,
      hasTwoWayAudio: false
    },
    {
      id: 'cam-4',
      name: '厨房摄像头',
      status: 'offline',
      location: '厨房',
      hasPTZ: false,
      hasNightVision: false,
      hasTwoWayAudio: false
    }
  ];

  useEffect(() => {
    if (mockCameras.length > 0) {
      setSelectedCamera(mockCameras[currentCameraIndex]);
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const handleStartStream = () => {
    setIsStreaming(true);
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    // 模拟开始录制
    setTimeout(() => {
      setIsRecording(false);
    }, 3000);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      setCurrentCameraIndex((prev) => (prev + 1) % mockCameras.length);
    } else {
      setCurrentCameraIndex((prev) => (prev - 1 + mockCameras.length) % mockCameras.length);
    }
    setSelectedCamera(mockCameras[currentCameraIndex]);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setZoom((prev) => {
      if (direction === 'in') return Math.min(prev + 0.5, 3);
      return Math.max(prev - 0.5, 1);
    });
  };

  const _mockAlerts = [
    {
      id: 'alert-1',
      type: 'pet_detected',
      camera: '客厅摄像头',
      time: new Date(Date.now() - 3600000).toISOString(),
      severity: 'medium',
      description: '检测到猫咪活动'
    },
    {
      id: 'alert-2',
      type: 'motion',
      camera: '阳台摄像头',
      time: new Date(Date.now() - 7200000).toISOString(),
      severity: 'low',
      description: '检测到移动物体'
    }
  ];

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden">
      {/* 主视频区域 */}
      <div 
        className="relative w-full h-full"
        onClick={() => setShowControls(!showControls)}
        onDoubleClick={handleToggleFullscreen}
      >
        {/* 模拟摄像头画面 */}
        {selectedCamera ? (
          <div className="relative w-full h-full">
            <img
              src={isStreaming ? selectedCamera.thumbnail : undefined}
              alt={selectedCamera.name}
              className={`w-full h-full object-cover transition-all duration-500 ${
                isNightVision ? 'sepia-[.5] brightness-[1.2] hue-rotate-[180deg]' : ''
              }`}
              style={{ transform: `scale(${zoom})` }}
            />

            {/* AI追踪框 - 响应式大小 */}
            {isStreaming && _isAIEnabled && (
              <motion.div
                animate={{
                  x: [0, 20, -10, 0],
                  y: [0, 10, -5, 0]
                }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 border-green-500 rounded-lg w-32 sm:w-48 h-20 sm:h-32 opacity-70"
              >
                <div className="absolute -top-5 sm:-top-6 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-1.5 sm:px-2 py-0.5 rounded text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse" />
                  AI追踪中
                </div>
              </motion.div>
            )}

            {/* 未连接时的占位符 */}
            {!isStreaming && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="text-center px-4">
                  <Camera className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-3 sm:mb-4" />
                  <p className="text-gray-400 text-base sm:text-lg mb-1.5 sm:mb-2">{selectedCamera.name}</p>
                  <p className="text-gray-500 text-xs sm:text-sm">
                    {selectedCamera.status === 'offline' ? '摄像头离线' : '点击开始直播'}
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartStream();
                    }}
                    className="mt-4 sm:mt-6 px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl flex items-center gap-2 mx-auto min-h-[44px]"
                  >
                    <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="font-medium text-sm sm:text-base">开始直播</span>
                  </motion.button>
                </div>
              </div>
            )}

            {/* 状态指示器 */}
            <AnimatePresence>
              {showControls && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-1.5 sm:gap-2 flex-wrap"
                >
                  <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium ${
                    isStreaming 
                      ? 'bg-green-500/80 text-white' 
                      : 'bg-gray-500/80 text-white'
                  }`}>
                    {isStreaming ? (
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse" />
                        直播中
                      </span>
                    ) : '未连接'}
                  </span>
                  
                  {isNightVision && (
                    <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-purple-500/80 text-white rounded-full text-xs flex items-center gap-1">
                      <Moon className="w-3 h-3" />
                      夜视模式
                    </span>
                  )}

                  {isRecording && (
                    <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-500/80 text-white rounded-full text-xs flex items-center gap-1">
                      <Circle className="w-3 h-3 fill-current" />
                      录制中
                    </span>
                  )}

                  {_isAIEnabled && (
                    <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-500/80 text-white rounded-full text-xs flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      AI追踪
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* 摄像头信息 */}
            <AnimatePresence>
              {showControls && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white/80 text-right"
                >
                  <p className="text-base sm:text-lg font-medium">{selectedCamera.name}</p>
                  {selectedCamera.location && (
                    <p className="text-xs sm:text-sm">{selectedCamera.location}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* 控制栏 */}
            <AnimatePresence>
              {showControls && isStreaming && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 sm:p-6 pt-12 sm:pt-20"
                >
                  <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4 flex-wrap">
                    {/* 切换摄像头 */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSwipe('left');
                      }}
                      className="p-2.5 sm:p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 active:bg-white/40 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                    </motion.button>

                    {/* 录音 */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isRecording) { setIsRecording(false); } else { handleStartRecording(); }
                      }}
                      className={`p-3 sm:p-4 backdrop-blur-sm rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                        isRecording 
                          ? 'bg-red-500 text-white' 
                          : 'bg-white/20 text-white hover:bg-white/30 active:bg-white/40'
                      }`}
                    >
                      <Circle className={`w-5 h-5 sm:w-6 sm:h-6 fill-current ${isRecording ? 'animate-pulse' : ''}`} />
                    </motion.button>

                    {/* 双向语音 */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMuted(!isMuted);
                      }}
                      className={`p-3 sm:p-4 backdrop-blur-sm rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                        isMuted 
                          ? 'bg-red-500 text-white' 
                          : 'bg-white/20 text-white hover:bg-white/30 active:bg-white/40'
                      }`}
                    >
                      {isMuted ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
                    </motion.button>

                    {/* 夜视 */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsNightVision(!isNightVision);
                      }}
                      className={`p-3 sm:p-4 backdrop-blur-sm rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                        isNightVision 
                          ? 'bg-purple-500 text-white' 
                          : 'bg-white/20 text-white hover:bg-white/30 active:bg-white/40'
                      }`}
                    >
                      {isNightVision ? <Sun className="w-5 h-5 sm:w-6 sm:h-6" /> : <Moon className="w-5 h-5 sm:w-6 sm:h-6" />}
                    </motion.button>

                    {/* 全屏 */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFullscreen();
                      }}
                      className="p-3 sm:p-4 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 active:bg-white/40 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      {isFullscreen ? <Minimize2 className="w-5 h-5 sm:w-6 sm:h-6" /> : <Maximize2 className="w-5 h-5 sm:w-6 sm:h-6" />}
                    </motion.button>

                    {/* 画中画 */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPIP(!showPIP);
                      }}
                      className={`p-3 sm:p-4 backdrop-blur-sm rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                        showPIP 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white/20 text-white hover:bg-white/30 active:bg-white/40'
                      }`}
                    >
                      <Grid3X3 className="w-5 h-5 sm:w-6 sm:h-6" />
                    </motion.button>

                    {/* 缩放 */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleZoom('in');
                      }}
                      className="p-3 sm:p-4 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 active:bg-white/40 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <ZoomIn className="w-5 h-5 sm:w-6 sm:h-6" />
                    </motion.button>

                    {/* 更多 */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSwipe('right');
                      }}
                      className="p-2.5 sm:p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 active:bg-white/40 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 画中画预览 - 响应式大小 */}
            <AnimatePresence>
              {showPIP && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute bottom-20 sm:bottom-24 right-3 sm:right-4 w-36 sm:w-48 h-24 sm:h-36 bg-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20"
                >
                  <img
                    src={mockCameras[(currentCameraIndex + 1) % mockCameras.length].thumbnail}
                    alt="画中画"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <p className="text-white text-xs sm:text-sm text-center px-2">
                      {mockCameras[(currentCameraIndex + 1) % mockCameras.length].name}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white/60">
              <Camera className="w-16 h-16 mx-auto mb-4" />
              <p>没有可用的摄像头</p>
            </div>
          </div>
        )}
      </div>

      {/* 手势提示 - 响应式 */}
      <AnimatePresence>
        {showControls && isStreaming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 text-white/50 text-xs pointer-events-none text-center px-4"
          >
            左右滑动切换摄像头 · 双击全屏 · 捏合缩放
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
