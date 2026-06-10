// ============================================
// IoT 类型定义
//
// 作者: 带娃的小陈工
// 日期: 2026-06-10
// 描述: IoT 设备控制服务的类型定义
// ============================================

/**
 * 设备类型枚举
 */
export enum DeviceType {
  // 激光逗宠器
  LASER_TOY = 'laser_toy',
  // 自动喂食器
  AUTO_FEEDER = 'auto_feeder',
  // 智能摄像头
  SMART_CAMERA = 'smart_camera',
  // 智能饮水机
  SMART_WATER_DISPENSER = 'smart_water_dispenser',
  // 智能猫砂盆
  SMART_LITTER_BOX = 'smart_litter_box',
  // 温湿度传感器
  ENVIRONMENT_SENSOR = 'environment_sensor',
  // 智能门锁
  SMART_DOOR_LOCK = 'smart_door_lock',
  // 宠物追踪器
  PET_TRACKER = 'pet_tracker',
}

/**
 * 设备连接状态
 */
export enum DeviceConnectionStatus {
  // 在线
  ONLINE = 'online',
  // 离线
  OFFLINE = 'offline',
  // 连接中
  CONNECTING = 'connecting',
  // 错误
  ERROR = 'error',
  // 升级中
  UPDATING = 'updating',
}

/**
 * 设备状态
 */
export interface DeviceStatus {
  // 设备ID
  deviceId: string;
  // 连接状态
  connectionStatus: DeviceConnectionStatus;
  // 是否在线
  isOnline: boolean;
  // 电池电量 (0-100)
  batteryLevel?: number;
  // 信号强度 (0-100)
  signalStrength?: number;
  // 最后在线时间
  lastSeen: Date;
  // 固件版本
  firmwareVersion?: string;
  // 设备特定状态数据
  data?: Record<string, unknown>;
  // 错误信息
  errorMessage?: string;
}

/**
 * 智能设备基础接口
 */
export interface SmartDevice {
  // 设备唯一标识
  id: string;
  // 设备名称
  name: string;
  // 设备类型
  type: DeviceType;
  // 设备型号
  model?: string;
  // 制造商
  manufacturer?: string;
  // 设备序列号
  serialNumber?: string;
  // 设备状态
  status: DeviceStatus;
  // 设备配置
  config: DeviceConfig;
  // 设备能力
  capabilities: DeviceCapability[];
  // 设备图标
  icon?: string;
  // 房间/位置
  room?: string;
  // 是否收藏
  isFavorite?: boolean;
  // 创建时间
  createdAt: Date;
  // 更新时间
  updatedAt: Date;
}

/**
 * 设备配置
 */
export interface DeviceConfig {
  // 设备ID
  deviceId: string;
  // WiFi SSID
  wifiSsid?: string;
  // WiFi 密码 (加密存储)
  wifiPassword?: string;
  // MQTT 主题前缀
  mqttTopic?: string;
  // 服务器地址
  serverUrl?: string;
  // 端口号
  port?: number;
  // 是否启用 SSL
  useSSL?: boolean;
  // 设备密钥
  deviceKey?: string;
  // 自定义配置
  customConfig?: Record<string, unknown>;
  // 自动重连
  autoReconnect?: boolean;
  // 心跳间隔 (秒)
  heartbeatInterval?: number;
}

/**
 * 设备能力
 */
export interface DeviceCapability {
  // 能力名称
  name: string;
  // 能力描述
  description?: string;
  // 参数定义
  parameters?: DeviceParameter[];
  // 是否可用
  available: boolean;
}

/**
 * 设备参数定义
 */
export interface DeviceParameter {
  // 参数名称
  name: string;
  // 参数类型
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  // 是否必填
  required: boolean;
  // 默认值
  defaultValue?: unknown;
  // 最小值 (number 类型)
  min?: number;
  // 最大值 (number 类型)
  max?: number;
  // 可选值 (枚举类型)
  options?: unknown[];
  // 参数描述
  description?: string;
}

/**
 * 设备指令
 */
export interface DeviceCommand {
  // 指令ID
  commandId: string;
  // 设备ID
  deviceId: string;
  // 指令类型
  action: DeviceAction;
  // 指令参数
  params?: Record<string, unknown>;
  // 时间戳
  timestamp: Date;
  // 超时时间 (毫秒)
  timeout?: number;
  // 优先级
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  // 重试次数
  retryCount?: number;
}

/**
 * 设备指令类型
 */
export enum DeviceAction {
  // 激光控制
  LASER_START = 'laser_start',
  LASER_STOP = 'laser_stop',
  LASER_SET_PATTERN = 'laser_set_pattern',
  LASER_SET_SPEED = 'laser_set_speed',
  
  // 喂食控制
  FEEDER_DISPENSE = 'feeder_dispense',
  FEEDER_SET_SCHEDULE = 'feeder_set_schedule',
  FEEDER_SET_PORTION = 'feeder_set_portion',
  FEEDER_GET_STATUS = 'feeder_get_status',
  
  // 摄像头控制
  CAMERA_START_STREAM = 'camera_start_stream',
  CAMERA_STOP_STREAM = 'camera_stop_stream',
  CAMERA_TAKE_PHOTO = 'camera_take_photo',
  CAMERA_PTZ = 'camera_ptz',
  CAMERA_SET_NIGHT_VISION = 'camera_set_night_vision',
  CAMERA_SET_MOTION_DETECT = 'camera_set_motion_detect',
  
  // 通用控制
  DEVICE_REBOOT = 'device_reboot',
  DEVICE_RESET = 'device_reset',
  DEVICE_UPDATE_FIRMWARE = 'device_update_firmware',
  DEVICE_SET_NAME = 'device_set_name',
  DEVICE_GET_STATUS = 'device_get_status',
}

/**
 * 指令执行结果
 */
export interface CommandResult {
  // 指令ID
  commandId: string;
  // 是否成功
  success: boolean;
  // 结果数据
  data?: unknown;
  // 错误信息
  error?: string;
  // 执行时间 (毫秒)
  executionTime?: number;
  // 响应时间戳
  timestamp: Date;
}

/**
 * 激光逗宠器状态
 */
export interface LaserToyStatus extends DeviceStatus {
  data: {
    // 是否运行中
    isRunning: boolean;
    // 当前模式
    pattern: 'random' | 'circle' | 'figure8' | 'custom';
    // 运动速度 (1-10)
    speed: number;
    // 运行时长 (秒)
    duration: number;
    // 剩余时间
    remainingTime: number;
    // 自动模式
    autoMode: boolean;
    // 定时设置
    schedule?: {
      enabled: boolean;
      startTime: string;
      endTime: string;
      interval: number;
    };
  };
}

/**
 * 自动喂食器状态
 */
export interface AutoFeederStatus extends DeviceStatus {
  data: {
    // 剩余食物量 (克)
    remainingFood: number;
    // 食物容量 (克)
    foodCapacity: number;
    // 今日已喂食次数
    todayFeedCount: number;
    // 今日已喂食量 (克)
    todayFeedAmount: number;
    // 喂食计划
    schedules: FeederSchedule[];
    // 是否堵塞
    isBlocked: boolean;
    // 上次喂食时间
    lastFeedTime?: Date;
    // 下次喂食时间
    nextFeedTime?: Date;
  };
}

/**
 * 喂食计划
 */
export interface FeederSchedule {
  // 计划ID
  id: string;
  // 是否启用
  enabled: boolean;
  // 喂食时间 (HH:mm)
  time: string;
  // 喂食份量 (克)
  portion: number;
  // 重复日期 (0-6, 0=周日)
  repeatDays: number[];
  // 备注
  note?: string;
}

/**
 * 智能摄像头状态
 */
export interface SmartCameraStatus extends DeviceStatus {
  data: {
    // 是否正在录制
    isRecording: boolean;
    // 是否正在直播
    isStreaming: boolean;
    // 分辨率
    resolution: '720p' | '1080p' | '2k' | '4k';
    // 夜视模式
    nightVision: boolean;
    // 移动侦测
    motionDetection: boolean;
    // 云台位置
    ptzPosition: {
      pan: number;  // -180 到 180
      tilt: number; // -90 到 90
      zoom: number; // 1 到 10
    };
    // 存储状态
    storage: {
      total: number;  // 总容量 (GB)
      used: number;   // 已用容量 (GB)
      available: number; // 可用容量 (GB)
    };
    // 当前温度
    temperature?: number;
  };
}

/**
 * 地理位置坐标
 */
export interface Location {
  // 纬度
  latitude: number;
  // 经度
  longitude: number;
  // 精度 (米)
  accuracy?: number;
  // 海拔 (米)
  altitude?: number;
  // 速度 (米/秒)
  speed?: number;
  // 方向 (度)
  heading?: number;
  // 时间戳
  timestamp: Date;
}

/**
 * 地理围栏配置
 */
export interface GeofenceConfig {
  // 围栏ID
  id: string;
  // 围栏名称
  name: string;
  // 中心点坐标
  center: Location;
  // 半径 (米)
  radius: number;
  // 围栏类型
  type: 'home' | 'work' | 'vet' | 'park' | 'custom';
  // 是否启用
  enabled: boolean;
  // 进入触发
  onEnter?: GeofenceAction;
  // 离开触发
  onExit?: GeofenceAction;
  // 关联设备
  linkedDevices?: string[];
  // 关联宠物
  linkedPets?: string[];
  // 创建时间
  createdAt: Date;
  // 更新时间
  updatedAt: Date;
}

/**
 * 地理围栏动作
 */
export interface GeofenceAction {
  // 动作类型
  type: 'notification' | 'device_control' | 'reminder' | 'webhook';
  // 动作配置
  config: {
    // 通知内容
    message?: string;
    // 设备指令
    deviceCommand?: DeviceCommand;
    // 提醒ID
    reminderId?: string;
    // Webhook URL
    webhookUrl?: string;
  };
  // 是否启用
  enabled: boolean;
}

/**
 * 地理围栏事件
 */
export interface GeofenceEvent {
  // 事件ID
  id: string;
  // 围栏ID
  geofenceId: string;
  // 围栏名称
  geofenceName: string;
  // 事件类型
  type: 'enter' | 'exit' | 'dwell';
  // 触发位置
  location: Location;
  // 触发时间
  timestamp: Date;
  // 关联宠物
  petId?: string;
  // 关联设备
  deviceId?: string;
  // 执行的动作
  actions?: GeofenceAction[];
}

/**
 * MQTT 连接配置
 */
export interface MQTTConfig {
  // 代理服务器地址
  brokerUrl: string;
  // 端口号
  port: number;
  // 是否使用 SSL
  useSSL: boolean;
  // 客户端ID
  clientId?: string;
  // 用户名
  username?: string;
  // 密码
  password?: string;
  // 清除会话
  cleanSession?: boolean;
  // 保持连接时间 (秒)
  keepalive?: number;
  // 自动重连
  autoReconnect?: boolean;
  // 重连间隔 (毫秒)
  reconnectInterval?: number;
  // 最大重连次数
  maxReconnectAttempts?: number;
}

/**
 * WebSocket 代理消息
 */
export interface WebSocketProxyMessage {
  // 消息类型
  type: 'connect' | 'disconnect' | 'publish' | 'subscribe' | 'unsubscribe' | 'message' | 'error' | 'status';
  // 消息ID
  messageId: string;
  // 设备ID
  deviceId?: string;
  // MQTT 主题
  topic?: string;
  // 消息内容
  payload?: unknown;
  // 时间戳
  timestamp: Date;
  // 错误信息
  error?: string;
}

/**
 * 设备发现结果
 */
export interface DeviceDiscoveryResult {
  // 发现的设备列表
  devices: SmartDevice[];
  // 扫描持续时间 (毫秒)
  scanDuration: number;
  // 是否完成
  isComplete: boolean;
  // 错误信息
  error?: string;
}

/**
 * 设备配网信息
 */
export interface DevicePairingInfo {
  // 设备ID
  deviceId: string;
  // 设备名称
  deviceName: string;
  // 设备类型
  deviceType: DeviceType;
  // 配网模式
  pairingMode: 'wifi' | 'bluetooth' | 'qr_code' | 'nfc';
  // 配网状态
  status: 'searching' | 'found' | 'connecting' | 'connected' | 'failed' | 'timeout';
  // 进度 (0-100)
  progress: number;
  // 错误信息
  errorMessage?: string;
}

/**
 * IoT 服务事件类型
 */
export enum IoTEventType {
  // 设备连接
  DEVICE_CONNECTED = 'device_connected',
  // 设备断开
  DEVICE_DISCONNECTED = 'device_disconnected',
  // 设备状态更新
  DEVICE_STATUS_UPDATE = 'device_status_update',
  // 设备发现
  DEVICE_DISCOVERED = 'device_discovered',
  // 指令发送
  COMMAND_SENT = 'command_sent',
  // 指令完成
  COMMAND_COMPLETED = 'command_completed',
  // 指令失败
  COMMAND_FAILED = 'command_failed',
  // 地理围栏进入
  GEOFENCE_ENTER = 'geofence_enter',
  // 地理围栏离开
  GEOFENCE_EXIT = 'geofence_exit',
  // 位置更新
  LOCATION_UPDATE = 'location_update',
  // 错误
  ERROR = 'error',
}

/**
 * IoT 服务事件
 */
export interface IoTEvent {
  // 事件类型
  type: IoTEventType;
  // 事件数据
  data: unknown;
  // 时间戳
  timestamp: Date;
  // 来源
  source?: string;
}

/**
 * IoT 服务事件监听器
 */
export type IoTEventListener = (event: IoTEvent) => void;