// ============================================
// PawSync Pro - Device Control Panel
//
// 作者: 带娃的小陈工
// 日期: 2026-06-10
// 描述: IoT 设备控制面板组件 - 支持激光逗宠器、
//       自动喂食器、智能摄像头的控制和实时状态显示
// ============================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Cookie,
  Video,
  Wifi,
  WifiOff,
  Battery,
  Signal,
  Settings,
  Power,
  Clock,
  Play,
  Pause,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Timer,
  Target,
  Camera,
  Volume2,
  Moon,
  Sun,
  Move,
  Plus,
  Minus,
  Edit3,
  Trash2,
  MapPin,
  Home,
  X,
  Sliders,
  Info,
} from 'lucide-react';
import {
  SmartDevice,
  DeviceType,
  DeviceConnectionStatus,
  DeviceAction,
  LaserToyStatus,
  AutoFeederStatus,
  SmartCameraStatus,
  FeederSchedule,
  GeofenceConfig,
  Location,
} from '../../services/iot/types';
import {
  getDeviceManager,
  DeviceManager,
} from '../../services/iot/deviceManager';
import {
  getGeofenceService,
  GeofenceService,
} from '../../services/iot/geofenceService';
import { useAppStore } from '../../store/appStore';

/**
 * 设备控制面板属性
 */
interface DeviceControlPanelProps {
  // 初始选中的设备ID
  selectedDeviceId?: string;
  // 是否显示地理围栏控制
  showGeofence?: boolean;
  // 设备操作回调
  onDeviceAction?: (deviceId: string, action: string, params?: unknown) => void;
}

/**
 * 设备控制面板组件
 */
export function DeviceControlPanel({
  selectedDeviceId,
  showGeofence = true,
  onDeviceAction,
}: DeviceControlPanelProps) {
  // 状态管理
  const { currentPet } = useAppStore();
  const [devices, setDevices] = useState<SmartDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<SmartDevice | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDevice, setExpandedDevice] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);
  const [showGeofenceSettings, setShowGeofenceSettings] = useState(false);
  const [geofences, setGeofences] = useState<GeofenceConfig[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 服务实例
  const deviceManager = useMemo(() => getDeviceManager({
    brokerUrl: 'mqtt.pawsync.com',
    port: 8083,
    useSSL: true,
  }), []);

  const geofenceService = useMemo(() => getGeofenceService({
    updateInterval: 5000,
    highAccuracy: true,
  }), []);

  // 初始化
  useEffect(() => {
    initializeServices();
    return () => {
      // 清理
      deviceManager.destroy();
      geofenceService.destroy();
    };
  }, []);

  // 加载设备
  useEffect(() => {
    loadDevices();
  }, [deviceManager]);

  // 监听设备状态更新
  useEffect(() => {
    const unsubscribe = deviceManager.addEventListener((event) => {
      if (event.type === 'device_status_update') {
        loadDevices();
      }
    });
    return unsubscribe;
  }, [deviceManager]);

  // 监听位置更新
  useEffect(() => {
    if (!showGeofence) return;

    geofenceService.startMonitoring();
    const unsubscribe = geofenceService.addLocationListener((location) => {
      setCurrentLocation(location);
    });
    
    return () => {
      unsubscribe();
      geofenceService.stopMonitoring();
    };
  }, [geofenceService, showGeofence]);

  // 加载地理围栏
  useEffect(() => {
    if (!showGeofence) return;
    loadGeofences();
  }, [geofenceService, showGeofence]);

  /**
   * 初始化服务
   */
  const initializeServices = async () => {
    try {
      setLoading(true);
      // 发现设备
      await deviceManager.discoverDevices();
      loadDevices();
      
      // 启动位置监控
      if (showGeofence) {
        await geofenceService.startMonitoring();
        loadGeofences();
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '初始化失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 加载设备列表
   */
  const loadDevices = async () => {
    try {
      const deviceList = deviceManager.getAllDevices();
      setDevices(deviceList);
      
      // 设置选中的设备
      if (selectedDeviceId && !selectedDevice) {
        const device = deviceList.find(d => d.id === selectedDeviceId);
        if (device) {
          setSelectedDevice(device);
        }
      } else if (!selectedDevice && deviceList.length > 0) {
        setSelectedDevice(deviceList[0]);
      }
    } catch (err) {
      console.error('加载设备失败:', err);
    }
  };

  /**
   * 加载地理围栏列表
   */
  const loadGeofences = () => {
    const geofenceList = geofenceService.getAllGeofences();
    setGeofences(geofenceList);
  };

  /**
   * 执行设备操作
   */
  const executeDeviceAction = useCallback(async (
    deviceId: string,
    action: string,
    params?: Record<string, unknown>
  ) => {
    setActiveAction(`${deviceId}-${action}`);
    setError(null);
    
    try {
      await deviceManager.sendCommand(deviceId, action as DeviceAction, params);
      
      // 回调通知
      onDeviceAction?.(deviceId, action, params);
      
      // 更新设备列表
      loadDevices();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setActiveAction(null);
    }
  }, [deviceManager, onDeviceAction]);

  /**
   * 获取设备类型配置
   */
  const getDeviceTypeConfig = (type: DeviceType) => {
    const configs = {
      [DeviceType.LASER_TOY]: {
        icon: Zap,
        label: '激光逗宠器',
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        gradient: 'from-red-500 to-orange-500',
      },
      [DeviceType.AUTO_FEEDER]: {
        icon: Cookie,
        label: '自动喂食器',
        color: 'text-orange-500',
        bgColor: 'bg-orange-50',
        gradient: 'from-orange-500 to-amber-500',
      },
      [DeviceType.SMART_CAMERA]: {
        icon: Video,
        label: '智能摄像头',
        color: 'text-purple-500',
        bgColor: 'bg-purple-50',
        gradient: 'from-purple-500 to-pink-500',
      },
      [DeviceType.SMART_WATER_DISPENSER]: {
        icon: Signal,
        label: '智能饮水机',
        color: 'text-blue-500',
        bgColor: 'bg-blue-50',
        gradient: 'from-blue-500 to-cyan-500',
      },
      [DeviceType.SMART_LITTER_BOX]: {
        icon: Home,
        label: '智能猫砂盆',
        color: 'text-green-500',
        bgColor: 'bg-green-50',
        gradient: 'from-green-500 to-emerald-500',
      },
      [DeviceType.ENVIRONMENT_SENSOR]: {
        icon: Signal,
        label: '环境传感器',
        color: 'text-teal-500',
        bgColor: 'bg-teal-50',
        gradient: 'from-teal-500 to-cyan-500',
      },
      [DeviceType.PET_TRACKER]: {
        icon: MapPin,
        label: '宠物追踪器',
        color: 'text-indigo-500',
        bgColor: 'bg-indigo-50',
        gradient: 'from-indigo-500 to-violet-500',
      },
      [DeviceType.SMART_DOOR_LOCK]: {
        icon: Home,
        label: '智能门锁',
        color: 'text-gray-500',
        bgColor: 'bg-gray-50',
        gradient: 'from-gray-500 to-slate-500',
      },
    };
    return configs[type] || configs[DeviceType.ENVIRONMENT_SENSOR];
  };

  /**
   * 获取连接状态配置
   */
  const getStatusConfig = (status: DeviceConnectionStatus) => {
    const configs = {
      [DeviceConnectionStatus.ONLINE]: {
        icon: Wifi,
        label: '在线',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        animate: false,
      },
      [DeviceConnectionStatus.OFFLINE]: {
        icon: WifiOff,
        label: '离线',
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        animate: false,
      },
      [DeviceConnectionStatus.CONNECTING]: {
        icon: RefreshCw,
        label: '连接中',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        animate: true,
      },
      [DeviceConnectionStatus.ERROR]: {
        icon: AlertCircle,
        label: '错误',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        animate: false,
      },
      [DeviceConnectionStatus.UPDATING]: {
        icon: RefreshCw,
        label: '升级中',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        animate: true,
      },
    };
    return configs[status] || configs[DeviceConnectionStatus.OFFLINE];
  };

  /**
   * 格式化时间
   */
  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    return d.toLocaleDateString('zh-CN');
  };

  // ============== 激光逗宠器控制 ==============

  const LaserToyControl = ({ device }: { device: SmartDevice }) => {
    const status = device.status as LaserToyStatus;
    const [pattern, setPattern] = useState<'random' | 'circle' | 'figure8' | 'custom'>(status.data?.pattern || 'random');
    const [speed, setSpeed] = useState(status.data?.speed || 5);
    const [duration, setDuration] = useState(15);

    const handleStart = () => {
      executeDeviceAction(device.id, DeviceAction.LASER_START, {
        pattern,
        speed,
        duration,
      });
    };

    const handleStop = () => {
      executeDeviceAction(device.id, DeviceAction.LASER_STOP);
    };

    const handleSetPattern = (newPattern: 'random' | 'circle' | 'figure8') => {
      setPattern(newPattern);
      executeDeviceAction(device.id, DeviceAction.LASER_SET_PATTERN, { pattern: newPattern });
    };

    const handleSetSpeed = (newSpeed: number) => {
      setSpeed(newSpeed);
      executeDeviceAction(device.id, DeviceAction.LASER_SET_SPEED, { speed: newSpeed });
    };

    return (
      <div className="space-y-4">
        {/* 运行状态 */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl">
          <div className="flex items-center gap-3">
            <motion.div
              animate={status.data?.isRunning ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.5, repeat: Infinity }}
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                status.data?.isRunning
                  ? 'bg-gradient-to-br from-red-500 to-orange-500'
                  : 'bg-gray-200'
              }`}
            >
              <Target className={`w-6 h-6 ${status.data?.isRunning ? 'text-white' : 'text-gray-500'}`} />
            </motion.div>
            <div>
              <p className="font-medium text-gray-800">
                {status.data?.isRunning ? '正在运行' : '已停止'}
              </p>
              {status.data?.isRunning && (
                <p className="text-sm text-gray-500">
                  剩余 {status.data?.remainingTime || duration} 秒
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {!status.data?.isRunning ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStart}
                disabled={activeAction === `${device.id}-laser_start`}
                className="px-6 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-medium shadow-md disabled:opacity-50"
              >
                {activeAction === `${device.id}-laser_start` ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStop}
                disabled={activeAction === `${device.id}-laser_stop`}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl font-medium disabled:opacity-50"
              >
                <Pause className="w-5 h-5" />
              </motion.button>
            )}
          </div>
        </div>

        {/* 模式选择 */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">运动模式</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'random', label: '随机', icon: Target },
              { value: 'circle', label: '圆形', icon: RefreshCw },
              { value: 'figure8', label: '8字形', icon: Move },
            ].map((mode) => (
              <motion.button
                key={mode.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSetPattern(mode.value as 'random' | 'circle' | 'figure8')}
                className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${
                  pattern === mode.value
                    ? 'bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-md'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <mode.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{mode.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* 速度控制 */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">运动速度</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleSetSpeed(Math.max(1, speed - 1))}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <Minus className="w-4 h-4 text-gray-600" />
            </button>
            <div className="flex-1 relative">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all"
                  style={{ width: `${(speed / 10) * 100}%` }}
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">{speed}</span>
              </div>
            </div>
            <button
              onClick={() => handleSetSpeed(Math.min(10, speed + 1))}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <Plus className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* 运行时长 */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">运行时长</p>
          <div className="flex gap-2">
            {[5, 10, 15, 30].map((time) => (
              <motion.button
                key={time}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setDuration(time)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  duration === time
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-md'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {time}分钟
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ============== 自动喂食器控制 ==============

  const AutoFeederControl = ({ device }: { device: SmartDevice }) => {
    const status = device.status as AutoFeederStatus;
    const [portion, setPortion] = useState(50);
    const [showScheduleModal, setShowScheduleModal] = useState(false);

    const handleDispense = (amount: number) => {
      executeDeviceAction(device.id, DeviceAction.FEEDER_DISPENSE, { portion: amount });
    };

    const handleQuickFeed = () => {
      handleDispense(portion);
    };

    // 食物余量进度
    const foodPercentage = status.data?.remainingFood && status.data?.foodCapacity
      ? (status.data.remainingFood / status.data.foodCapacity) * 100
      : 100;

    return (
      <div className="space-y-4">
        {/* 食物余量 */}
        <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                <Cookie className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-800">食物余量</p>
                <p className="text-sm text-gray-500">
                  {status.data?.remainingFood || 0}g / {status.data?.foodCapacity || 500}g
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-orange-600">{Math.round(foodPercentage)}%</p>
              {foodPercentage < 20 && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  需要补充
                </p>
              )}
            </div>
          </div>

          <div className="h-3 bg-orange-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${foodPercentage}%` }}
              transition={{ duration: 0.5 }}
              className={`h-full rounded-full ${
                foodPercentage < 20
                  ? 'bg-red-500'
                  : foodPercentage < 50
                  ? 'bg-yellow-500'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500'
              }`}
            />
          </div>
        </div>

        {/* 今日喂食统计 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-500">今日喂食次数</p>
            <p className="text-xl font-bold text-gray-800">
              {status.data?.todayFeedCount || 0} 次
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-500">今日喂食量</p>
            <p className="text-xl font-bold text-gray-800">
              {status.data?.todayFeedAmount || 0}g
            </p>
          </div>
        </div>

        {/* 快速喂食 */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">快速喂食</p>
          <div className="grid grid-cols-4 gap-2">
            {[20, 30, 50, 100].map((amount) => (
              <motion.button
                key={amount}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDispense(amount)}
                disabled={activeAction === `${device.id}-feeder_dispense`}
                className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                  portion === amount
                    ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                } disabled:opacity-50`}
              >
                <Cookie className="w-5 h-5" />
                <span className="text-sm font-medium">{amount}g</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* 自定义份量 */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700 mb-2">自定义份量</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPortion(Math.max(10, portion - 10))}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <Minus className="w-4 h-4 text-gray-600" />
              </button>
              <input
                type="number"
                value={portion}
                onChange={(e) => setPortion(Math.max(10, Math.min(200, parseInt(e.target.value) || 10)))}
                className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-center font-medium"
              />
              <button
                onClick={() => setPortion(Math.min(200, portion + 10))}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
              <span className="text-sm text-gray-500">克</span>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleQuickFeed}
            disabled={activeAction === `${device.id}-feeder_dispense`}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-medium shadow-md disabled:opacity-50"
          >
            {activeAction === `${device.id}-feeder_dispense` ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              '喂食'
            )}
          </motion.button>
        </div>

        {/* 喂食计划 */}
        {status.data?.schedules && status.data.schedules.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">喂食计划</p>
            <div className="space-y-2">
              {status.data.schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="p-3 bg-gray-50 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      schedule.enabled
                        ? 'bg-gradient-to-br from-orange-500 to-amber-500'
                        : 'bg-gray-200'
                    }`}>
                      <Clock className={`w-4 h-4 ${schedule.enabled ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{schedule.time}</p>
                      <p className="text-xs text-gray-500">{schedule.portion}g</p>
                    </div>
                  </div>
                  <CheckCircle2 className={`w-5 h-5 ${schedule.enabled ? 'text-green-500' : 'text-gray-300'}`} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 添加计划按钮 */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowScheduleModal(true)}
          className="w-full py-3 bg-gray-50 text-gray-600 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">添加喂食计划</span>
        </motion.button>
      </div>
    );
  };

  // ============== 智能摄像头控制 ==============

  const SmartCameraControl = ({ device }: { device: SmartDevice }) => {
    const status = device.status as SmartCameraStatus;
    const [nightVision, setNightVision] = useState(status.data?.nightVision || false);
    const [motionDetection, setMotionDetection] = useState(status.data?.motionDetection || false);
    const [resolution, setResolution] = useState<'720p' | '1080p' | '2k' | '4k'>(status.data?.resolution || '1080p');
    const [ptzPosition, setPtzPosition] = useState(status.data?.ptzPosition || { pan: 0, tilt: 0, zoom: 1 });

    const handleStartStream = () => {
      executeDeviceAction(device.id, DeviceAction.CAMERA_START_STREAM);
    };

    const handleStopStream = () => {
      executeDeviceAction(device.id, DeviceAction.CAMERA_STOP_STREAM);
    };

    const handleTakePhoto = () => {
      executeDeviceAction(device.id, DeviceAction.CAMERA_TAKE_PHOTO);
    };

    const handlePTZ = (pan: number, tilt: number) => {
      setPtzPosition({ ...ptzPosition, pan, tilt });
      executeDeviceAction(device.id, DeviceAction.CAMERA_PTZ, { pan, tilt });
    };

    const handleSetNightVision = (enabled: boolean) => {
      setNightVision(enabled);
      executeDeviceAction(device.id, DeviceAction.CAMERA_SET_NIGHT_VISION, { enabled });
    };

    const handleSetMotionDetect = (enabled: boolean) => {
      setMotionDetection(enabled);
      executeDeviceAction(device.id, DeviceAction.CAMERA_SET_MOTION_DETECT, { enabled });
    };

    return (
      <div className="space-y-4">
        {/* 直播状态 */}
        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={status.data?.isStreaming ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  status.data?.isStreaming
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                    : 'bg-gray-200'
                }`}
              >
                <Video className={`w-6 h-6 ${status.data?.isStreaming ? 'text-white' : 'text-gray-500'}`} />
              </motion.div>
              <div>
                <p className="font-medium text-gray-800">
                  {status.data?.isStreaming ? '正在直播' : '直播已停止'}
                </p>
                <p className="text-sm text-gray-500">
                  {resolution} · {status.data?.isRecording ? '录制中' : '未录制'}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {!status.data?.isStreaming ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStartStream}
                  disabled={activeAction === `${device.id}-camera_start_stream`}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium shadow-md disabled:opacity-50"
                >
                  {activeAction === `${device.id}-camera_start_stream` ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStopStream}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl font-medium"
                >
                  <Pause className="w-5 h-5" />
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleTakePhoto}
                disabled={activeAction === `${device.id}-camera_take_photo`}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium disabled:opacity-50"
              >
                <Camera className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* 云台控制 */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">云台控制</p>
          <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
            <div />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePTZ(ptzPosition.pan, ptzPosition.tilt + 10)}
              className="p-3 bg-gray-50 rounded-xl flex items-center justify-center hover:bg-gray-100"
            >
              <ChevronDown className="w-5 h-5 text-gray-600 rotate-180" />
            </motion.button>
            <div />
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePTZ(ptzPosition.pan - 10, ptzPosition.tilt)}
              className="p-3 bg-gray-50 rounded-xl flex items-center justify-center hover:bg-gray-100"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 rotate-180" />
            </motion.button>
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePTZ(ptzPosition.pan + 10, ptzPosition.tilt)}
              className="p-3 bg-gray-50 rounded-xl flex items-center justify-center hover:bg-gray-100"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </motion.button>
            
            <div />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePTZ(ptzPosition.pan, ptzPosition.tilt - 10)}
              className="p-3 bg-gray-50 rounded-xl flex items-center justify-center hover:bg-gray-100"
            >
              <ChevronDown className="w-5 h-5 text-gray-600" />
            </motion.button>
            <div />
          </div>
          
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="text-sm text-gray-500">缩放:</span>
            <button
              onClick={() => setPtzPosition({ ...ptzPosition, zoom: Math.max(1, ptzPosition.zoom - 1) })}
              className="p-1 bg-gray-100 rounded hover:bg-gray-200"
            >
              <Minus className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-sm font-medium text-gray-700">{ptzPosition.zoom}x</span>
            <button
              onClick={() => setPtzPosition({ ...ptzPosition, zoom: Math.min(10, ptzPosition.zoom + 1) })}
              className="p-1 bg-gray-100 rounded hover:bg-gray-200"
            >
              <Plus className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* 分辨率选择 */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">视频分辨率</p>
          <div className="flex gap-2">
            {['720p', '1080p', '2k', '4k'].map((res) => (
              <motion.button
                key={res}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setResolution(res as '720p' | '1080p' | '2k' | '4k')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  resolution === res
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {res}
              </motion.button>
            ))}
          </div>
        </div>

        {/* 功能开关 */}
        <div className="space-y-3">
          {/* 夜视模式 */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              {nightVision ? (
                <Moon className="w-5 h-5 text-purple-500" />
              ) : (
                <Sun className="w-5 h-5 text-gray-500" />
              )}
              <span className="font-medium text-gray-800">夜视模式</span>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSetNightVision(!nightVision)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                nightVision ? 'bg-purple-500' : 'bg-gray-300'
              }`}
            >
              <motion.span
                animate={{ x: nightVision ? 24 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
              />
            </motion.button>
          </div>

          {/* 移动侦测 */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Move className={`w-5 h-5 ${motionDetection ? 'text-purple-500' : 'text-gray-500'}`} />
              <span className="font-medium text-gray-800">移动侦测</span>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSetMotionDetect(!motionDetection)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                motionDetection ? 'bg-purple-500' : 'bg-gray-300'
              }`}
            >
              <motion.span
                animate={{ x: motionDetection ? 24 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
              />
            </motion.button>
          </div>
        </div>

        {/* 存储状态 */}
        {status.data?.storage && (
          <div className="p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">存储空间</span>
              <span className="text-sm text-gray-500">
                {status.data.storage.used}GB / {status.data.storage.total}GB
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                style={{
                  width: `${(status.data.storage.used / status.data.storage.total) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============== 地理围栏控制 ==============

  const GeofenceControl = () => {
    const [showAddGeofence, setShowAddGeofence] = useState(false);
    const [newGeofenceName, setNewGeofenceName] = useState('');
    const [newGeofenceRadius, setNewGeofenceRadius] = useState(100);

    const handleAddGeofence = async () => {
      if (!currentLocation || !newGeofenceName) return;

      await geofenceService.setupGeofence({
        id: `geofence-${Date.now()}`,
        name: newGeofenceName,
        center: currentLocation,
        radius: newGeofenceRadius,
        type: 'custom',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      loadGeofences();
      setShowAddGeofence(false);
      setNewGeofenceName('');
    };

    const handleRemoveGeofence = async (geofenceId: string) => {
      await geofenceService.removeGeofence(geofenceId);
      loadGeofences();
    };

    return (
      <div className="space-y-4">
        {/* 当前位置 */}
        {currentLocation && (
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-800">当前位置</p>
                <p className="text-sm text-gray-500">
                  {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
                </p>
              </div>
            </div>
            {currentLocation.accuracy && (
              <p className="text-xs text-gray-500">
                精度: ±{currentLocation.accuracy.toFixed(0)}米
              </p>
            )}
          </div>
        )}

        {/* 围栏列表 */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">已设置的围栏</p>
          {geofences.length > 0 ? (
            <div className="space-y-2">
              {geofences.map((geofence) => (
                <motion.div
                  key={geofence.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-gray-50 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      geofence.enabled
                        ? 'bg-gradient-to-br from-indigo-500 to-violet-500'
                        : 'bg-gray-200'
                    }`}>
                      <Home className={`w-4 h-4 ${geofence.enabled ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{geofence.name}</p>
                      <p className="text-xs text-gray-500">半径 {geofence.radius}米</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveGeofence(geofence.id)}
                    className="p-2 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">暂无地理围栏</p>
            </div>
          )}
        </div>

        {/* 添加围栏 */}
        <AnimatePresence>
          {showAddGeofence ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 bg-gray-50 rounded-xl space-y-3"
            >
              <input
                type="text"
                value={newGeofenceName}
                onChange={(e) => setNewGeofenceName(e.target.value)}
                placeholder="围栏名称"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">半径:</span>
                <input
                  type="number"
                  value={newGeofenceRadius}
                  onChange={(e) => setNewGeofenceRadius(parseInt(e.target.value) || 100)}
                  className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-center"
                />
                <span className="text-sm text-gray-500">米</span>
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddGeofence}
                  disabled={!currentLocation || !newGeofenceName}
                  className="flex-1 py-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  创建
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAddGeofence(false)}
                  className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium"
                >
                  取消
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddGeofence(true)}
              disabled={!currentLocation}
              className="w-full py-3 bg-gray-50 text-gray-600 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">添加地理围栏</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // ============== 设备卡片 ==============

  const DeviceCard = ({ device }: { device: SmartDevice }) => {
    const typeConfig = getDeviceTypeConfig(device.type);
    const statusConfig = getStatusConfig(device.status.connectionStatus);
    const TypeIcon = typeConfig.icon;
    const StatusIcon = statusConfig.icon;
    const isExpanded = expandedDevice === device.id;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
      >
        {/* 设备头部 */}
        <div
          className="p-4 cursor-pointer"
          onClick={() => setExpandedDevice(isExpanded ? null : device.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-14 h-14 bg-gradient-to-br ${typeConfig.gradient} rounded-xl flex items-center justify-center shadow-md`}>
                <TypeIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">{device.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${statusConfig.bgColor} ${statusConfig.color}`}>
                    <StatusIcon className={`w-3 h-3 ${statusConfig.animate ? 'animate-spin' : ''}`} />
                    {statusConfig.label}
                  </span>
                  {device.room && (
                    <span className="text-xs text-gray-500">{device.room}</span>
                  )}
                </div>
              </div>
            </div>

            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </motion.div>
          </div>

          {/* 设备状态指标 */}
          <div className="flex items-center gap-4 mt-3">
            {device.status.batteryLevel !== undefined && (
              <div className="flex items-center gap-1">
                <Battery className={`w-4 h-4 ${
                  device.status.batteryLevel < 20 ? 'text-red-500' :
                  device.status.batteryLevel < 50 ? 'text-yellow-500' :
                  'text-green-500'
                }`} />
                <span className="text-xs text-gray-500">{device.status.batteryLevel}%</span>
              </div>
            )}
            {device.status.signalStrength !== undefined && (
              <div className="flex items-center gap-1">
                <Signal className={`w-4 h-4 ${
                  device.status.signalStrength < 30 ? 'text-red-500' :
                  device.status.signalStrength < 60 ? 'text-yellow-500' :
                  'text-green-500'
                }`} />
                <span className="text-xs text-gray-500">{device.status.signalStrength}%</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">
                {formatTime(device.status.lastSeen)}
              </span>
            </div>
          </div>
        </div>

        {/* 设备控制面板 */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="px-4 pb-4 border-t border-gray-100"
            >
              <div className="pt-4">
                {device.type === DeviceType.LASER_TOY && <LaserToyControl device={device} />}
                {device.type === DeviceType.AUTO_FEEDER && <AutoFeederControl device={device} />}
                {device.type === DeviceType.SMART_CAMERA && <SmartCameraControl device={device} />}
                
                {/* 其他设备类型显示基本信息 */}
                {![
                  DeviceType.LASER_TOY,
                  DeviceType.AUTO_FEEDER,
                  DeviceType.SMART_CAMERA,
                ].includes(device.type) && (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Info className="w-5 h-5 text-gray-500" />
                        <p className="text-sm text-gray-600">
                          此设备类型暂不支持详细控制面板
                        </p>
                      </div>
                    </div>
                    
                    {/* 基础控制 */}
                    <div className="grid grid-cols-2 gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => executeDeviceAction(device.id, DeviceAction.DEVICE_GET_STATUS)}
                        className="py-3 bg-gray-50 text-gray-600 rounded-xl flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-5 h-5" />
                        <span className="font-medium">刷新状态</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => executeDeviceAction(device.id, DeviceAction.DEVICE_REBOOT)}
                        className="py-3 bg-gray-50 text-gray-600 rounded-xl flex items-center justify-center gap-2"
                      >
                        <Power className="w-5 h-5" />
                        <span className="font-medium">重启设备</span>
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  // ============== 加载状态 ==============

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-purple-200 border-t-purple-500 rounded-full"
        />
        <p className="mt-4 text-gray-500">正在加载设备...</p>
      </div>
    );
  }

  // ============== 错误状态 ==============

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <p className="font-medium text-red-700">加载失败</p>
        </div>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={initializeServices}
          className="px-6 py-2 bg-red-500 text-white rounded-xl font-medium"
        >
          重新加载
        </motion.button>
      </div>
    );
  }

  // ============== 主界面 ==============

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            📱 设备控制中心
          </h1>
          <p className="text-sm text-gray-500">
            管理 {currentPet?.name || '毛孩子'} 的智能设备
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowDeviceSettings(true)}
            className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200"
          >
            <Settings className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* 设备统计 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
          <div className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-green-500" />
            <span className="text-lg font-bold text-green-600">
              {devices.filter(d => d.status.isOnline).length}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">在线设备</p>
        </div>
        <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl">
          <div className="flex items-center gap-2">
            <WifiOff className="w-5 h-5 text-gray-500" />
            <span className="text-lg font-bold text-gray-600">
              {devices.filter(d => !d.status.isOnline).length}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">离线设备</p>
        </div>
        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-500" />
            <span className="text-lg font-bold text-purple-600">
              {devices.length}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">总设备数</p>
        </div>
      </div>

      {/* 设备列表 */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-500" />
          我的设备
        </h2>

        {devices.length > 0 ? (
          <div className="space-y-3">
            {devices.map((device) => (
              <DeviceCard key={device.id} device={device} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">还没有添加智能设备</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowDeviceSettings(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium"
            >
              添加设备
            </motion.button>
          </div>
        )}
      </div>

      {/* 地理围栏控制 */}
      {showGeofence && (
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-500" />
            地理围栏
          </h2>
          <GeofenceControl />
        </div>
      )}

      {/* 设备设置模态框 */}
      <AnimatePresence>
        {showDeviceSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeviceSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800">设备设置</h3>
                <button
                  onClick={() => setShowDeviceSettings(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                {/* 发现设备 */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    await deviceManager.discoverDevices();
                    loadDevices();
                  }}
                  className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl flex items-center justify-center gap-2 font-medium"
                >
                  <RefreshCw className="w-5 h-5" />
                  扫描新设备
                </motion.button>

                {/* 设备管理 */}
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className="p-3 bg-gray-50 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${getDeviceTypeConfig(device.type).gradient} rounded-lg flex items-center justify-center`}>
                        {(() => {
                          const Icon = getDeviceTypeConfig(device.type).icon;
                          return <Icon className="w-5 h-5 text-white" />;
                        })()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{device.name}</p>
                        <p className="text-xs text-gray-500">{getDeviceTypeConfig(device.type).label}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedDevice(device);
                          setExpandedDevice(device.id);
                          setShowDeviceSettings(false);
                        }}
                        className="p-2 hover:bg-gray-200 rounded-lg"
                      >
                        <Edit3 className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => deviceManager.removeDevice(device.id)}
                        className="p-2 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DeviceControlPanel;