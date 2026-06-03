// ============================================
// PawSync Pro 3.0 - Camera List Component
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 摄像头列表页面 - 设备管理、状态监控、快速访问
// ============================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Camera, 
  Wifi, 
  WifiOff,
  RefreshCw,
  Settings,
  Trash2,
  Eye,
  Volume2,
  Zap,
  Moon,
  ChevronRight,
  X,
  Battery,
  Clock,
  Shield,
  AlertCircle
} from 'lucide-react';
import { CameraMonitorComponent } from './CameraMonitorComponent';
import { useAppStore } from '../../store/appStore';

interface CameraDevice {
  id: string;
  name: string;
  brand: string;
  status: 'online' | 'offline' | 'error';
  thumbnail?: string;
  location?: string;
  lastActive: string;
  battery?: number;
  hasPTZ: boolean;
  hasNightVision: boolean;
  hasTwoWayAudio: boolean;
  hasMotionDetection: boolean;
}

export function CameraListComponent() {
  const { currentPet } = useAppStore();
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCamera, setSelectedCamera] = useState<CameraDevice | null>(null);
  const [showMonitor, setShowMonitor] = useState(false);
  const [_showAddDialog, setShowAddDialog] = useState(false);

  const petName = currentPet?.name || '毛孩子';

  useEffect(() => {
    loadCameras();
  }, []);

  const loadCameras = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockCameras: CameraDevice[] = [
        {
          id: 'cam-1',
          name: '客厅摄像头',
          brand: '小米',
          status: 'online',
          thumbnail: 'https://picsum.photos/seed/living/400/300',
          location: '客厅',
          lastActive: new Date(Date.now() - 60000).toISOString(),
          hasPTZ: true,
          hasNightVision: true,
          hasTwoWayAudio: true,
          hasMotionDetection: true
        },
        {
          id: 'cam-2',
          name: '卧室摄像头',
          brand: '360',
          status: 'online',
          thumbnail: 'https://picsum.photos/seed/bedroom/400/300',
          location: '卧室',
          lastActive: new Date(Date.now() - 300000).toISOString(),
          hasPTZ: false,
          hasNightVision: true,
          hasTwoWayAudio: true,
          hasMotionDetection: true
        },
        {
          id: 'cam-3',
          name: '阳台摄像头',
          brand: '萤石',
          status: 'offline',
          location: '阳台',
          lastActive: new Date(Date.now() - 3600000 * 5).toISOString(),
          hasPTZ: true,
          hasNightVision: true,
          hasTwoWayAudio: false,
          hasMotionDetection: true
        },
        {
          id: 'cam-4',
          name: '厨房摄像头',
          brand: '小米',
          status: 'error',
          location: '厨房',
          lastActive: new Date(Date.now() - 3600000 * 24).toISOString(),
          hasPTZ: false,
          hasNightVision: false,
          hasTwoWayAudio: false,
          hasMotionDetection: false
        }
      ];

      setCameras(mockCameras);
    } catch (error) {
      console.error('Failed to load cameras:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      online: { color: 'bg-green-500', text: 'text-green-600', label: '在线', icon: Wifi },
      offline: { color: 'bg-gray-400', text: 'text-gray-500', label: '离线', icon: WifiOff },
      error: { color: 'bg-red-500', text: 'text-red-600', label: '异常', icon: AlertCircle }
    };
    return configs[status as keyof typeof configs] || configs.offline;
  };

  const getBrandLogo = (brand: string) => {
    const logos: Record<string, string> = {
      '小米': '🇨🇳 Xiaomi',
      '360': '🔒 360',
      '萤石': '💎 萤石',
      'eufy': '🔋 eufy'
    };
    return logos[brand] || brand;
  };

  const formatLastActive = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    return date.toLocaleDateString();
  };

  const handleViewCamera = (camera: CameraDevice) => {
    setSelectedCamera(camera);
    setShowMonitor(true);
  };

  const handleDeleteCamera = (cameraId: string) => {
    if (!confirm('确定要删除这个摄像头吗？')) return;
    setCameras(prev => prev.filter(c => c.id !== cameraId));
  };

  // 摄像头详情模态框
  const CameraDetailModal = () => (
    <AnimatePresence>
      {selectedCamera && !showMonitor && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
          onClick={() => setSelectedCamera(null)}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto"
          >
            {/* 摄像头预览 - 响应式高度 */}
            <div className="relative h-48 sm:h-64 bg-black">
              <img
                src={selectedCamera.thumbnail}
                alt={selectedCamera.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => handleViewCamera(selectedCamera)}
                className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
              >
                <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-white rounded-xl flex items-center gap-2 shadow-lg min-h-[44px]">
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-medium text-sm sm:text-base">进入监控</span>
                </div>
              </button>
              
              <button
                onClick={() => setSelectedCamera(null)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 sm:p-2.5 bg-black/50 rounded-full text-white hover:bg-black/70 active:bg-black/80 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* 摄像头信息 */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-1.5 sm:mb-2">{selectedCamera.name}</h2>
                <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
                  <span>{getBrandLogo(selectedCamera.brand)}</span>
                  {selectedCamera.location && <span>· {selectedCamera.location}</span>}
                </div>
              </div>

              {/* 状态信息 - 响应式网格 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                    {(() => {
                      const config = getStatusConfig(selectedCamera.status);
                      const Icon = config.icon;
                      return (
                        <>
                          <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${config.color} rounded-full`} />
                          <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${config.text}`} />
                          <span className="text-xs sm:text-sm font-medium">{config.label}</span>
                        </>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-gray-500">
                    最后活跃: {formatLastActive(selectedCamera.lastActive)}
                  </p>
                </div>

                {selectedCamera.battery !== undefined && (
                  <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                      <Battery className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
                      <span className="text-xs sm:text-sm font-medium">{selectedCamera.battery}%</span>
                    </div>
                    <p className="text-xs text-gray-500">电池电量</p>
                  </div>
                )}
              </div>

              {/* 功能列表 - 响应式网格 */}
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">功能支持</h3>
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                  {selectedCamera.hasPTZ && (
                    <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-3 bg-blue-50 rounded-xl">
                      <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                      <span className="text-xs sm:text-sm text-gray-700">云台控制</span>
                    </div>
                  )}
                  {selectedCamera.hasNightVision && (
                    <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-3 bg-purple-50 rounded-xl">
                      <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />
                      <span className="text-xs sm:text-sm text-gray-700">夜视功能</span>
                    </div>
                  )}
                  {selectedCamera.hasTwoWayAudio && (
                    <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-3 bg-green-50 rounded-xl">
                      <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                      <span className="text-xs sm:text-sm text-gray-700">双向语音</span>
                    </div>
                  )}
                  {selectedCamera.hasMotionDetection && (
                    <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-3 bg-orange-50 rounded-xl">
                      <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600" />
                      <span className="text-xs sm:text-sm text-gray-700">移动侦测</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 操作按钮 - 响应式 */}
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => handleViewCamera(selectedCamera)}
                  className="flex-1 py-3 sm:py-3.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl flex items-center justify-center gap-2 font-medium text-sm sm:text-base min-h-[44px]"
                >
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  进入监控
                </button>
                <button
                  onClick={() => {}}
                  className="p-2.5 sm:p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 active:bg-gray-300 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => handleDeleteCamera(selectedCamera.id)}
                  className="p-2.5 sm:p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 active:bg-red-200 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // 监控页面
  const MonitorPage = () => (
    <AnimatePresence>
      {showMonitor && selectedCamera && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black z-50"
        >
          <CameraMonitorComponent cameras={[selectedCamera]} />
          
          <button
            onClick={() => {
              setShowMonitor(false);
              setSelectedCamera(null);
            }}
            className="absolute top-3 left-3 sm:top-4 sm:left-4 p-2.5 sm:p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 active:bg-white/40 transition-colors z-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const onlineCount = cameras.filter(c => c.status === 'online').length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 头部 - 响应式布局 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-0.5 sm:mb-1">
            📹 {petName}的摄像头
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            {onlineCount}/{cameras.length} 个摄像头在线
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadCameras}
            className="p-2.5 sm:p-3 bg-gray-100 rounded-xl hover:bg-gray-200 active:bg-gray-300 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddDialog(true)}
            className="px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl flex items-center gap-1.5 sm:gap-2 shadow-lg min-h-[44px]"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-medium text-sm sm:text-base">添加摄像头</span>
          </motion.button>
        </div>
      </div>

      {/* 快速进入监控 - 响应式 */}
      {onlineCount > 0 && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleViewCamera(cameras.find(c => c.status === 'online')!)}
          className="w-full py-4 sm:py-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl shadow-lg flex items-center justify-center gap-2 sm:gap-3 min-h-[44px]"
        >
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full animate-pulse" />
          <span className="text-base sm:text-lg font-medium">一键进入监控</span>
        </motion.button>
      )}

      {/* 摄像头列表 - 响应式网格布局 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {cameras.map((camera, index) => {
          const statusConfig = getStatusConfig(camera.status);
          const StatusIcon = statusConfig.icon;

          return (
            <motion.div
              key={camera.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedCamera(camera)}
              className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
            >
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                {/* 缩略图 - 响应式 */}
                <div className="relative w-full sm:w-20 md:w-24 h-24 sm:h-20 md:h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                  {camera.thumbnail ? (
                    <img
                      src={camera.thumbnail}
                      alt={camera.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                    </div>
                  )}

                  {/* 状态指示 */}
                  <div className={`absolute top-1.5 right-1.5 sm:top-1 sm:right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 ${statusConfig.color} rounded-full border-2 border-white`} />
                </div>

                {/* 信息 */}
                <div className="flex-1 min-w-0 w-full sm:w-auto">
                  <div className="flex items-start justify-between mb-1">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-sm sm:text-base text-gray-800 truncate">{camera.name}</h3>
                      <p className="text-xs text-gray-500 truncate">
                        {getBrandLogo(camera.brand)}
                        {camera.location && ` · ${camera.location}`}
                      </p>
                    </div>
                    <div className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusConfig.color} text-white flex-shrink-0 ml-2`}>
                      <StatusIcon className="w-3 h-3" />
                      <span>{statusConfig.label}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">最后活跃: {formatLastActive(camera.lastActive)}</span>
                  </div>

                  {/* 功能标签 */}
                  <div className="flex flex-wrap gap-1 mt-1.5 sm:mt-2">
                    {camera.hasPTZ && (
                      <span className="px-1.5 sm:px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">云台</span>
                    )}
                    {camera.hasNightVision && (
                      <span className="px-1.5 sm:px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-xs">夜视</span>
                    )}
                    {camera.hasTwoWayAudio && (
                      <span className="px-1.5 sm:px-2 py-0.5 bg-green-50 text-green-600 rounded text-xs">双向语音</span>
                    )}
                  </div>
                  
                  {/* 移动端状态显示 */}
                  <div className={`sm:hidden flex items-center gap-1 mt-2 px-2 py-1 rounded-full text-xs ${statusConfig.color} text-white w-fit`}>
                    <StatusIcon className="w-3 h-3" />
                    <span>{statusConfig.label}</span>
                  </div>
                </div>

                <ChevronRight className="hidden sm:block w-5 h-5 text-gray-400 flex-shrink-0 mt-2" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 空状态 - 响应式 */}
      {cameras.length === 0 && (
        <div className="text-center py-8 sm:py-12">
          <Camera className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-gray-500 mb-3 sm:mb-4">还没有添加摄像头</p>
          <button
            onClick={() => setShowAddDialog(true)}
            className="px-5 sm:px-6 py-2.5 sm:py-3 bg-blue-500 text-white rounded-xl hover:shadow-lg active:shadow-md transition-all text-sm sm:text-base min-h-[44px]"
          >
            添加第一个摄像头
          </button>
        </div>
      )}

      {/* 模态框 */}
      <CameraDetailModal />
      <MonitorPage />
    </div>
  );
}
