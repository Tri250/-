// ============================================
// PawSync Pro 3.0 - Remote Interaction Center Component
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 远程互动中心 - 激光逗宠、智能喂食器、"我回来了"提醒
// ============================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Cookie, 
  Droplet, 
  Radio,
  Home,
  Clock,
  Play,
  Settings,
  Power,
  RefreshCw,
  CheckCircle2,
  Wifi,
  WifiOff,
  ChevronRight,
  Volume2,
  Bell,
  Calendar
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';

interface SmartDevice {
  id: string;
  type: 'laser' | 'feeder' | 'waterer' | 'camera';
  brand: 'xiaopet' | 'huoman' | 'eufy' | 'other';
  name: string;
  status: 'online' | 'offline' | 'busy';
  lastActive: string;
  capabilities: string[];
  icon: string;
  settings: Record<string, unknown>;
}

interface InteractionLog {
  id: string;
  deviceId: string;
  deviceName: string;
  type: 'play' | 'feed' | 'call';
  action: string;
  timestamp: string;
}

interface ComingHomeReminder {
  enabled: boolean;
  message: string;
  audioUrl?: string;
  leadTime: number;
}

export function RemoteInteractionCenterComponent() {
  const { currentPet } = useAppStore();
  const [devices, setDevices] = useState<SmartDevice[]>([]);
  const [interactionLogs, setInteractionLogs] = useState<InteractionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDevice, setActiveDevice] = useState<string | null>(null);
  const [showLaserControl, setShowLaserControl] = useState(false);
  const [_laserPattern, setLaserPattern] = useState<'auto' | 'manual'>('auto');
  const [_showReminderSettings, setShowReminderSettings] = useState(false);
  const [comingHomeReminder, setComingHomeReminder] = useState<ComingHomeReminder>({
    enabled: true,
    message: '主人回来了！',
    leadTime: 10
  });

  const petId = currentPet?.id || '1';
  const petName = currentPet?.name || '毛孩子';

  useEffect(() => {
    loadData();
  }, [petId]);

  const loadData = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const mockDevices: SmartDevice[] = [
        {
          id: 'device-1',
          type: 'laser',
          brand: 'xiaopet',
          name: '智能激光逗宠器',
          status: 'online',
          lastActive: new Date(Date.now() - 1800000).toISOString(),
          capabilities: ['自动模式', '手动控制', '定时逗宠'],
          icon: '🔴',
          settings: { pattern: 'auto', speed: 5, duration: 15 }
        },
        {
          id: 'device-2',
          type: 'feeder',
          brand: 'huoman',
          name: '智能喂食器 Pro',
          status: 'online',
          lastActive: new Date(Date.now() - 3600000).toISOString(),
          capabilities: ['远程投喂', '定时喂食', '份量控制'],
          icon: '🍖',
          settings: { portionSize: 50, dailyMeals: 3 }
        },
        {
          id: 'device-3',
          type: 'waterer',
          brand: 'eufy',
          name: '宠物饮水机',
          status: 'online',
          lastActive: new Date(Date.now() - 7200000).toISOString(),
          capabilities: ['水质监测', '换水提醒', '饮水量统计'],
          icon: '💧',
          settings: { filterType: '活性炭', lastChange: '2026-05-01' }
        },
        {
          id: 'device-4',
          type: 'camera',
          brand: 'xiaopet',
          name: '智能摄像头',
          status: 'busy',
          lastActive: new Date().toISOString(),
          capabilities: ['实时画面', '双向语音', '录像回放'],
          icon: '📹',
          settings: { resolution: '1080p', nightVision: true }
        }
      ];

      const mockLogs: InteractionLog[] = [
        {
          id: 'log-1',
          deviceId: 'device-1',
          deviceName: '智能激光逗宠器',
          type: 'play',
          action: '自动逗宠模式运行15分钟',
          timestamp: new Date(Date.now() - 1800000).toISOString()
        },
        {
          id: 'log-2',
          deviceId: 'device-2',
          deviceName: '智能喂食器 Pro',
          type: 'feed',
          action: '远程投喂 50g',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'log-3',
          deviceId: 'device-4',
          deviceName: '智能摄像头',
          type: 'call',
          action: '播放主人录音',
          timestamp: new Date(Date.now() - 7200000).toISOString()
        }
      ];

      setDevices(mockDevices);
      setInteractionLogs(mockLogs);
    } catch (error) {
      console.error('Failed to load devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeConfig = (type: string) => {
    const configs: Record<string, { icon: React.ElementType; label: string; color: string }> = {
      laser: { icon: Zap, label: '激光逗宠', color: 'text-red-500' },
      feeder: { icon: Cookie, label: '智能喂食', color: 'text-orange-500' },
      waterer: { icon: Droplet, label: '饮水机', color: 'text-blue-500' },
      camera: { icon: Radio, label: '摄像头', color: 'text-purple-500' }
    };
    return configs[type] || configs.camera;
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      online: { color: 'bg-green-100 text-green-700', icon: Wifi, label: '在线' },
      offline: { color: 'bg-gray-100 text-gray-700', icon: WifiOff, label: '离线' },
      busy: { color: 'bg-yellow-100 text-yellow-700', icon: RefreshCw, label: '忙碌中' }
    };
    return configs[status as keyof typeof configs] || configs.offline;
  };

  const formatTime = (timestamp: string) => {
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

  const handleDeviceAction = async (deviceId: string, action: string) => {
    setActiveDevice(deviceId);
    
    const device = devices.find(d => d.id === deviceId);
    if (!device) return;

    // 模拟操作
    await new Promise(resolve => setTimeout(resolve, 2000));

    const newLog: InteractionLog = {
      id: `log-${Date.now()}`,
      deviceId: device.id,
      deviceName: device.name,
      type: device.type === 'laser' ? 'play' : device.type === 'feeder' ? 'feed' : 'call',
      action: action,
      timestamp: new Date().toISOString()
    };

    setInteractionLogs(prev => [newLog, ...prev]);
    setActiveDevice(null);
  };

  const handleLaserControl = (mode: 'auto' | 'manual') => {
    setLaserPattern(mode);
    handleDeviceAction('device-1', mode === 'auto' ? '启动自动逗宠模式' : '切换手动控制');
    setShowLaserControl(false);
  };

  const handleFeed = (portion: number) => {
    handleDeviceAction('device-2', `远程投喂 ${portion}g`);
  };

  const handlePlayRecording = () => {
    handleDeviceAction('device-4', '播放主人录音');
  };

  const handleToggleReminder = () => {
    setComingHomeReminder(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  // 激光控制面板
  const LaserControlPanel = () => (
    <AnimatePresence>
      {showLaserControl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowLaserControl(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="text-2xl">🔴</span>
                激光逗宠控制
              </h3>
              <button
                onClick={() => setShowLaserControl(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <span className="text-xl">×</span>
              </button>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => handleLaserControl('auto')}
                className="w-full p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl flex items-center justify-between hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-800">自动逗宠模式</p>
                    <p className="text-xs text-gray-500">AI智能追踪宠物位置</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={() => handleLaserControl('manual')}
                className="w-full p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-between hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-800">手动控制模式</p>
                    <p className="text-xs text-gray-500">手动滑动控制激光方向</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </motion.div>
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
          className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          📱 远程互动中心
        </h1>
        <p className="text-sm text-gray-500">
          随时随地陪伴{petName}
        </p>
      </div>

      {/* "我回来了"提醒 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">"我回来了"提醒</h3>
              <p className="text-xs text-gray-600">提前{comingHomeReminder.leadTime}分钟播放</p>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleReminder}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              comingHomeReminder.enabled ? 'bg-purple-500' : 'bg-gray-300'
            }`}
          >
            <motion.span
              animate={{ x: comingHomeReminder.enabled ? 28 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
            />
          </motion.button>
        </div>

        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-purple-600" />
          <p className="text-sm text-gray-700">
            "{comingHomeReminder.message}"
          </p>
        </div>

        <button
          onClick={() => setShowReminderSettings(true)}
          className="mt-3 text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
        >
          <Settings className="w-4 h-4" />
          设置提醒内容
        </button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handlePlayRecording}
          disabled={activeDevice === 'device-4'}
          className="mt-3 w-full py-3 bg-white rounded-xl flex items-center justify-center gap-2 text-purple-600 hover:bg-purple-50 transition-colors shadow-sm"
        >
          {activeDevice === 'device-4' ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
          <span className="font-medium">立即播放</span>
        </motion.button>
      </motion.div>

      {/* 智能设备列表 */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-orange-500" />
          智能设备 ({devices.length})
        </h2>

        <div className="space-y-3">
          {devices.map((device, index) => {
            const _config = getTypeConfig(device.type);
            const statusConfig = getStatusConfig(device.status);
            const StatusIcon = statusConfig.icon;
            const isActive = activeDevice === device.id;

            return (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{device.icon}</div>
                    <div>
                      <h3 className="font-medium text-gray-800">{device.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${statusConfig.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          最后活跃: {formatTime(device.lastActive)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Settings className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                {/* 设备功能按钮 */}
                <div className="grid grid-cols-3 gap-2">
                  {device.type === 'laser' && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowLaserControl(true)}
                        className="py-3 bg-gradient-to-r from-red-50 to-orange-50 text-red-600 rounded-xl flex flex-col items-center gap-1 hover:shadow-md transition-all"
                      >
                        <Zap className="w-5 h-5" />
                        <span className="text-xs font-medium">逗宠</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeviceAction(device.id, '启动定时逗宠')}
                        disabled={isActive}
                        className="py-3 bg-gray-50 text-gray-600 rounded-xl flex flex-col items-center gap-1 hover:bg-gray-100 transition-colors disabled:opacity-50"
                      >
                        <Clock className="w-5 h-5" />
                        <span className="text-xs font-medium">定时</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeviceAction(device.id, '停止逗宠')}
                        disabled={isActive}
                        className="py-3 bg-gray-50 text-gray-600 rounded-xl flex flex-col items-center gap-1 hover:bg-gray-100 transition-colors disabled:opacity-50"
                      >
                        <Power className="w-5 h-5" />
                        <span className="text-xs font-medium">关闭</span>
                      </motion.button>
                    </>
                  )}

                  {device.type === 'feeder' && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleFeed(30)}
                        disabled={isActive}
                        className="py-3 bg-gradient-to-r from-orange-50 to-amber-50 text-orange-600 rounded-xl flex flex-col items-center gap-1 hover:shadow-md transition-all disabled:opacity-50"
                      >
                        <Cookie className="w-5 h-5" />
                        <span className="text-xs font-medium">30g</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleFeed(50)}
                        disabled={isActive}
                        className="py-3 bg-gradient-to-r from-orange-50 to-amber-50 text-orange-600 rounded-xl flex flex-col items-center gap-1 hover:shadow-md transition-all disabled:opacity-50"
                      >
                        <Cookie className="w-5 h-5" />
                        <span className="text-xs font-medium">50g</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleFeed(100)}
                        disabled={isActive}
                        className="py-3 bg-gradient-to-r from-orange-50 to-amber-50 text-orange-600 rounded-xl flex flex-col items-center gap-1 hover:shadow-md transition-all disabled:opacity-50"
                      >
                        <Cookie className="w-5 h-5" />
                        <span className="text-xs font-medium">100g</span>
                      </motion.button>
                    </>
                  )}

                  {device.type === 'waterer' && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeviceAction(device.id, '查看饮水统计')}
                        className="py-3 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-600 rounded-xl flex flex-col items-center gap-1 hover:shadow-md transition-all"
                      >
                        <Droplet className="w-5 h-5" />
                        <span className="text-xs font-medium">统计</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeviceAction(device.id, '更换滤芯')}
                        className="py-3 bg-gray-50 text-gray-600 rounded-xl flex flex-col items-center gap-1 hover:bg-gray-100 transition-colors"
                      >
                        <RefreshCw className="w-5 h-5" />
                        <span className="text-xs font-medium">换滤芯</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeviceAction(device.id, '清洁水箱')}
                        className="py-3 bg-gray-50 text-gray-600 rounded-xl flex flex-col items-center gap-1 hover:bg-gray-100 transition-colors"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-xs font-medium">清洁</span>
                      </motion.button>
                    </>
                  )}

                  {device.type === 'camera' && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeviceAction(device.id, '查看实时画面')}
                        className="py-3 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-600 rounded-xl flex flex-col items-center gap-1 hover:shadow-md transition-all"
                      >
                        <Radio className="w-5 h-5" />
                        <span className="text-xs font-medium">直播</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePlayRecording}
                        disabled={isActive}
                        className="py-3 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-600 rounded-xl flex flex-col items-center gap-1 hover:shadow-md transition-all disabled:opacity-50"
                      >
                        <Volume2 className="w-5 h-5" />
                        <span className="text-xs font-medium">呼叫</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeviceAction(device.id, '录像回放')}
                        className="py-3 bg-gray-50 text-gray-600 rounded-xl flex flex-col items-center gap-1 hover:bg-gray-100 transition-colors"
                      >
                        <Play className="w-5 h-5" />
                        <span className="text-xs font-medium">回放</span>
                      </motion.button>
                    </>
                  )}
                </div>

                {/* 活动指示器 */}
                {isActive && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-sm text-orange-600">
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </motion.div>
                    <span>正在执行操作...</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 互动记录 */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-500" />
          互动记录
        </h2>

        <div className="space-y-2">
          {interactionLogs.slice(0, 5).map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl p-3 flex items-center gap-3"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                log.type === 'play' ? 'bg-red-100 text-red-600' :
                log.type === 'feed' ? 'bg-orange-100 text-orange-600' :
                'bg-purple-100 text-purple-600'
              }`}>
                {log.type === 'play' ? <Zap className="w-5 h-5" /> :
                 log.type === 'feed' ? <Cookie className="w-5 h-5" /> :
                 <Volume2 className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{log.deviceName}</p>
                <p className="text-xs text-gray-500">{log.action}</p>
              </div>
              <span className="text-xs text-gray-400">{formatTime(log.timestamp)}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 激光控制面板 */}
      <LaserControlPanel />
    </div>
  );
}
