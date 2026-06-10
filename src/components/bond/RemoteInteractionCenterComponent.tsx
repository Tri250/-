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
  Calendar,
  Plus,
  X,
  Trash2,
  Edit3,
  Mic,
  Square,
  Save,
  AlertCircle
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useDevices } from '../../hooks/useDevices';
import type { SmartDevice, InteractionLog } from '../../types/bond';

interface ComingHomeReminder {
  enabled: boolean;
  message: string;
  audioUrl?: string;
  audioBlob?: Blob;
  leadTime: number;
  useCustomAudio: boolean;
}

export function RemoteInteractionCenterComponent() {
  const { currentPet } = useAppStore();
  
  // 使用 useDevices Hook 管理设备数据
  const {
    devices,
    interactionLogs,
    loading,
    error,
    wsStatus,
    loadDevices,
    sendCommand,
    getDeviceStatus,
    addDevice,
    deleteDevice,
    updateDevice,
  } = useDevices();
  
  const [activeDevice, setActiveDevice] = useState<string | null>(null);
  const [showLaserControl, setShowLaserControl] = useState(false);
  const [laserPattern, setLaserPattern] = useState<'auto' | 'manual'>('auto');
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [showDeviceSettings, setShowDeviceSettings] = useState<string | null>(null);
  const [isRecordingReminder, setIsRecordingReminder] = useState(false);
  const [editingDevice, setEditingDevice] = useState<SmartDevice | null>(null);
  
  const [comingHomeReminder, setComingHomeReminder] = useState<ComingHomeReminder>({
    enabled: true,
    message: '主人回来了！',
    leadTime: 10,
    useCustomAudio: false
  });

  const petId = currentPet?.id || '1';
  const petName = currentPet?.name || '毛孩子';

  // 加载设备数据
  useEffect(() => {
    if (petId) {
      loadDevices(petId);
    }
  }, [petId, loadDevices]);

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

  // 发送设备指令（真实 API）
  const handleDeviceAction = async (deviceId: string, action: string) => {
    setActiveDevice(deviceId);
    
    try {
      // 调用真实 API 发送指令
      await sendCommand(deviceId, action);
    } catch (err) {
      console.error('发送指令失败:', err);
      alert('操作失败，请稍后重试');
    } finally {
      setActiveDevice(null);
    }
  };

  // 获取设备实时状态
  const handleRefreshStatus = async (deviceId: string) => {
    try {
      await getDeviceStatus(deviceId);
    } catch (err) {
      console.error('获取设备状态失败:', err);
    }
  };

  const handleLaserControl = async (mode: 'auto' | 'manual') => {
    setLaserPattern(mode);
    // 找到激光设备
    const laserDevice = devices.find(d => d.type === 'laser');
    if (laserDevice) {
      await handleDeviceAction(laserDevice.id, mode === 'auto' ? '启动自动逗宠模式' : '切换手动控制');
    }
    setShowLaserControl(false);
  };

  const handleFeed = async (portion: number) => {
    // 找到喂食器设备
    const feederDevice = devices.find(d => d.type === 'feeder');
    if (feederDevice) {
      await handleDeviceAction(feederDevice.id, `远程投喂 ${portion}g`);
    }
  };

  const handlePlayRecording = async () => {
    // 找到摄像头设备
    const cameraDevice = devices.find(d => d.type === 'camera');
    if (cameraDevice) {
      await handleDeviceAction(cameraDevice.id, '播放主人录音');
    }
  };

  const handleToggleReminder = () => {
    setComingHomeReminder(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  // 添加新设备（真实 API）
  const handleAddDevice = async (type: 'laser' | 'feeder' | 'waterer' | 'camera') => {
    const typeNames = {
      laser: '智能激光逗宠器',
      feeder: '智能喂食器',
      waterer: '宠物饮水机',
      camera: '智能摄像头'
    };
    
    const icons = {
      laser: '🔴',
      feeder: '🍖',
      waterer: '💧',
      camera: '📹'
    };
    
    try {
      await addDevice({
        petId,
        type,
        brand: 'other',
        name: typeNames[type],
        status: 'online',
        lastActive: new Date().toISOString(),
        capabilities: [],
        settings: {},
      });
      setShowAddDevice(false);
    } catch (err) {
      console.error('添加设备失败:', err);
      alert('添加设备失败，请稍后重试');
    }
  };

  // 删除设备（真实 API）
  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm('确定要删除这个设备吗？')) return;
    
    try {
      await deleteDevice(deviceId);
      setShowDeviceSettings(null);
    } catch (err) {
      console.error('删除设备失败:', err);
      alert('删除设备失败，请稍后重试');
    }
  };

  // 更新设备信息（真实 API）
  const handleUpdateDevice = async () => {
    if (!editingDevice) return;
    
    try {
      await updateDevice(editingDevice.id, { name: editingDevice.name });
      setEditingDevice(null);
    } catch (err) {
      console.error('更新设备失败:', err);
      alert('更新设备失败，请稍后重试');
    }
  };

  // 录制提醒音频
  const handleStartRecordReminder = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setComingHomeReminder(prev => ({
          ...prev,
          audioUrl: url,
          audioBlob: blob,
          useCustomAudio: true
        }));
        stream.getTracks().forEach(track => track.stop());
        setIsRecordingReminder(false);
      };
      
      mediaRecorder.start();
      setIsRecordingReminder(true);
      
      // 5秒后自动停止
      setTimeout(() => {
        mediaRecorder.stop();
      }, 5000);
    } catch (error) {
      console.error('Failed to record:', error);
      alert('无法访问麦克风');
    }
  };

  // WebSocket 连接状态指示器
  const ConnectionIndicator = () => {
    const statusConfig = {
      connecting: { color: 'text-yellow-500', label: '连接中...' },
      connected: { color: 'text-green-500', label: '已连接' },
      disconnected: { color: 'text-gray-500', label: '未连接' },
      error: { color: 'text-red-500', label: '连接错误' }
    };
    
    const config = statusConfig[wsStatus];
    
    return (
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 ${config.color}`}>
        {wsStatus === 'connected' ? (
          <Wifi className="w-4 h-4" />
        ) : wsStatus === 'error' ? (
          <WifiOff className="w-4 h-4" />
        ) : (
          <RefreshCw className="w-4 h-4 animate-spin" />
        )}
        <span className="text-xs">{config.label}</span>
      </div>
    );
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
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => handleLaserControl('auto')}
                className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all ${
                  laserPattern === 'auto'
                    ? 'bg-gradient-to-r from-red-50 to-orange-50 shadow-md'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    laserPattern === 'auto'
                      ? 'bg-gradient-to-br from-red-500 to-orange-500'
                      : 'bg-gray-200'
                  }`}>
                    <Zap className={`w-6 h-6 ${laserPattern === 'auto' ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-800">自动逗宠模式</p>
                    <p className="text-xs text-gray-500">AI智能追踪宠物位置</p>
                  </div>
                </div>
                {laserPattern === 'auto' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
              </button>

              <button
                onClick={() => handleLaserControl('manual')}
                className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all ${
                  laserPattern === 'manual'
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    laserPattern === 'manual'
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-500'
                      : 'bg-gray-200'
                  }`}>
                    <Settings className={`w-6 h-6 ${laserPattern === 'manual' ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-800">手动控制模式</p>
                    <p className="text-xs text-gray-500">手动滑动控制激光方向</p>
                  </div>
                </div>
                {laserPattern === 'manual' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // 提醒设置面板
  const ReminderSettingsPanel = () => (
    <AnimatePresence>
      {showReminderSettings && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowReminderSettings(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Home className="w-5 h-5 text-purple-500" />
                "我回来了"提醒设置
              </h3>
              <button
                onClick={() => setShowReminderSettings(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-6">
              {/* 提醒消息 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  提醒消息
                </label>
                <input
                  type="text"
                  value={comingHomeReminder.message}
                  onChange={(e) => setComingHomeReminder(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="输入提醒消息"
                />
              </div>

              {/* 提前时间 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  提前播放时间
                </label>
                <div className="flex gap-2">
                  {[5, 10, 15, 30].map((time) => (
                    <button
                      key={time}
                      onClick={() => setComingHomeReminder(prev => ({ ...prev, leadTime: time }))}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                        comingHomeReminder.leadTime === time
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {time}分钟
                    </button>
                  ))}
                </div>
              </div>

              {/* 自定义音频 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  自定义提醒音频
                </label>
                <div className="bg-gray-50 rounded-xl p-4">
                  {comingHomeReminder.useCustomAudio && comingHomeReminder.audioUrl ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Volume2 className="w-5 h-5 text-purple-500" />
                        <span className="text-sm text-gray-700">已录制音频</span>
                      </div>
                      <audio src={comingHomeReminder.audioUrl} controls className="w-full" />
                      <button
                        onClick={() => setComingHomeReminder(prev => ({
                          ...prev,
                          useCustomAudio: false,
                          audioUrl: undefined,
                          audioBlob: undefined
                        }))}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        删除自定义音频
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      {isRecordingReminder ? (
                        <div className="space-y-3">
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto"
                          >
                            <Mic className="w-8 h-8 text-white" />
                          </motion.div>
                          <p className="text-sm text-gray-600">正在录音...（最长5秒）</p>
                        </div>
                      ) : (
                        <button
                          onClick={handleStartRecordReminder}
                          className="w-full py-3 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center gap-2 hover:bg-purple-200 transition-colors"
                        >
                          <Mic className="w-5 h-5" />
                          <span>录制提醒音频</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 保存按钮 */}
              <button
                onClick={() => setShowReminderSettings(false)}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                <Save className="w-5 h-5 inline mr-2" />
                保存设置
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // 添加设备面板
  const AddDevicePanel = () => (
    <AnimatePresence>
      {showAddDevice && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowAddDevice(false)}
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
                <Plus className="w-5 h-5 text-purple-500" />
                添加智能设备
              </h3>
              <button
                onClick={() => setShowAddDevice(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleAddDevice('laser')}
                className="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl flex flex-col items-center gap-3 hover:shadow-md transition-all"
              >
                <span className="text-4xl">🔴</span>
                <span className="font-medium text-gray-800">激光逗宠器</span>
              </button>
              
              <button
                onClick={() => handleAddDevice('feeder')}
                className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl flex flex-col items-center gap-3 hover:shadow-md transition-all"
              >
                <span className="text-4xl">🍖</span>
                <span className="font-medium text-gray-800">智能喂食器</span>
              </button>
              
              <button
                onClick={() => handleAddDevice('waterer')}
                className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl flex flex-col items-center gap-3 hover:shadow-md transition-all"
              >
                <span className="text-4xl">💧</span>
                <span className="font-medium text-gray-800">宠物饮水机</span>
              </button>
              
              <button
                onClick={() => handleAddDevice('camera')}
                className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl flex flex-col items-center gap-3 hover:shadow-md transition-all"
              >
                <span className="text-4xl">📹</span>
                <span className="font-medium text-gray-800">智能摄像头</span>
              </button>
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              选择设备类型后将自动搜索附近设备
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // 设备设置面板
  const DeviceSettingsPanel = () => {
    const device = devices.find(d => d.id === showDeviceSettings);
    if (!device) return null;
    
    return (
      <AnimatePresence>
        {showDeviceSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeviceSettings(null)}
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
                  <span className="text-2xl">{device.icon || '📹'}</span>
                  {editingDevice ? '编辑设备' : device.name}
                </h3>
                <button
                  onClick={() => setShowDeviceSettings(null)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {editingDevice ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">设备名称</label>
                    <input
                      type="text"
                      value={editingDevice.name}
                      onChange={(e) => setEditingDevice({ ...editingDevice, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleUpdateDevice}
                      className="flex-1 py-3 bg-purple-500 text-white rounded-xl font-medium"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => setEditingDevice(null)}
                      className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 设备信息 */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">设备类型</span>
                      <span className="text-gray-800">{getTypeConfig(device.type).label}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">状态</span>
                      <span className={getStatusConfig(device.status).color}>{getStatusConfig(device.status).label}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">最后活跃</span>
                      <span className="text-gray-800">{formatTime(device.lastActive)}</span>
                    </div>
                  </div>

                  {/* 功能列表 */}
                  {device.capabilities.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">支持功能</p>
                      <div className="flex flex-wrap gap-2">
                        {device.capabilities.map((cap, i) => (
                          <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="space-y-2">
                    <button
                      onClick={() => handleRefreshStatus(device.id)}
                      className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                    >
                      <RefreshCw className="w-5 h-5" />
                      刷新状态
                    </button>
                    <button
                      onClick={() => setEditingDevice(device)}
                      className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                    >
                      <Edit3 className="w-5 h-5" />
                      编辑设备
                    </button>
                    <button
                      onClick={() => handleDeleteDevice(device.id)}
                      className="w-full py-3 bg-red-50 text-red-600 rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                      删除设备
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  // 加载状态
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

  // 错误状态
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-600 mb-2">加载设备数据失败</p>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <button
          onClick={() => loadDevices(petId)}
          className="px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
        >
          重新加载
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            📱 远程互动中心
          </h1>
          <p className="text-sm text-gray-500">
            随时随地陪伴{petName}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* WebSocket 连接状态 */}
          <ConnectionIndicator />
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddDevice(true)}
            className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl shadow-lg"
          >
            <Plus className="w-5 h-5" />
          </motion.button>
        </div>
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
          disabled={activeDevice !== null}
          className="mt-3 w-full py-3 bg-white rounded-xl flex items-center justify-center gap-2 text-purple-600 hover:bg-purple-50 transition-colors shadow-sm disabled:opacity-50"
        >
          {activeDevice ? (
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

        {devices.length > 0 ? (
          <div className="space-y-3">
            {devices.map((device, index) => {
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
                      <div className="text-3xl">{device.icon || '📹'}</div>
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

                    <button 
                      onClick={() => setShowDeviceSettings(device.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
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
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">还没有添加智能设备</p>
            <button
              onClick={() => setShowAddDevice(true)}
              className="px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
            >
              添加第一个设备
            </button>
          </div>
        )}
      </div>

      {/* 互动记录 */}
      {interactionLogs.length > 0 && (
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
                  log.type === 'feed' || log.type === 'treat' ? 'bg-orange-100 text-orange-600' :
                  'bg-purple-100 text-purple-600'
                }`}>
                  {log.type === 'play' ? <Zap className="w-5 h-5" /> :
                   log.type === 'feed' || log.type === 'treat' ? <Cookie className="w-5 h-5" /> :
                   <Volume2 className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{log.action}</p>
                  <p className="text-xs text-gray-500">{formatTime(log.timestamp)}</p>
                </div>
                {log.autoLogged && (
                  <span className="text-xs text-gray-400">自动记录</span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* 各面板 */}
      <LaserControlPanel />
      <ReminderSettingsPanel />
      <AddDevicePanel />
      <DeviceSettingsPanel />
    </div>
  );
}