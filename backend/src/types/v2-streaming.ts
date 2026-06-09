/**
 * v2 流媒体和检测 API 类型定义
 * 支持实时视频流、AI 检测和录制功能
 */

// ==================== 流媒体相关类型 ====================

/**
 * 画质级别
 */
export type QualityLevel = 'low' | 'medium' | 'high' | 'auto';

/**
 * 流媒体连接状态
 */
export type StreamStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting';

/**
 * 流媒体协议类型
 */
export type StreamProtocol = 'webrtc' | 'rtsp' | 'hls' | 'flv';

/**
 * WebRTC 连接请求
 */
export interface WebRTCConnectRequest {
  deviceId: string;           // 设备ID
  quality?: QualityLevel;      // 画质级别
  enableAudio?: boolean;       // 是否启用音频
  enableVideo?: boolean;       // 是否启用视频
}

/**
 * WebRTC 连接响应
 */
export interface WebRTCConnectResponse {
  sessionId: string;           // 会话ID
  sdpOffer: string;            // SDP offer
  iceServers: IceServer[];    // ICE 服务器配置
  status: StreamStatus;
  createdAt: string;
}

/**
 * ICE 服务器配置
 */
export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

/**
 * WebRTC Answer 请求
 */
export interface WebRTCAnswerRequest {
  sessionId: string;          // 会话ID
  sdpAnswer: string;          // SDP answer
  iceCandidates?: IceCandidate[]; // ICE 候选
}

/**
 * ICE 候选
 */
export interface IceCandidate {
  candidate: string;
  sdpMid: string;
  sdpMLineIndex: number;
}

/**
 * WebRTC Answer 响应
 */
export interface WebRTCAnswerResponse {
  success: boolean;
  message: string;
  sessionId: string;
}

/**
 * RTSP 代理请求
 */
export interface RTSPProxyRequest {
  deviceId: string;           // 设备ID
  rtspUrl: string;            // RTSP 流地址
  username?: string;           // RTSP 用户名
  password?: string;           // RTSP 密码
  quality?: QualityLevel;      // 画质级别
}

/**
 * RTSP 代理响应
 */
export interface RTSPProxyResponse {
  sessionId: string;           // 会话ID
  websocketUrl: string;        // WebSocket 播放地址
  hlsUrl?: string;             // HLS 播放地址（可选）
  status: StreamStatus;
  createdAt: string;
}

/**
 * 流健康状态
 */
export interface StreamHealth {
  deviceId: string;
  status: StreamStatus;
  uptime: number;              // 运行时间（秒）
  bitrate: number;             // 码率 (kbps)
  fps: number;                 // 帧率
  resolution: string;          // 分辨率
  packetLoss: number;          // 丢包率
  latency: number;             // 延迟 (ms)
  lastFrameTime: string;       // 最后帧时间
  errors: StreamError[];        // 错误列表
}

/**
 * 流错误信息
 */
export interface StreamError {
  code: string;
  message: string;
  timestamp: string;
}

/**
 * 画质切换请求
 */
export interface QualitySwitchRequest {
  deviceId: string;
  quality: QualityLevel;
}

/**
 * 画质切换响应
 */
export interface QualitySwitchResponse {
  success: boolean;
  message: string;
  currentQuality: QualityLevel;
  bitrate: number;
  resolution: string;
}

// ==================== AI 检测相关类型 ====================

/**
 * 宠物检测请求
 */
export interface PetDetectionRequest {
  deviceId: string;           // 设备ID
  timestamp?: string;          // 时间戳
}

/**
 * 宠物检测结果
 */
export interface PetDetection {
  detected: boolean;           // 是否检测到宠物
  confidence: number;          // 置信度 0-1
  boundingBox?: BoundingBox;   // 边界框
  class: PetClass;             // 宠物类别
  breed?: string;              // 品种
  breedConfidence?: number;    // 品种置信度
  trackingId?: string;         // 追踪ID
  attributes?: PetAttributes;  // 宠物属性
  processingTime: number;      // 处理时间 (ms)
  timestamp: string;           // 时间戳
}

/**
 * 边界框
 */
export interface BoundingBox {
  x: number;                   // 左上角 X
  y: number;                   // 左上角 Y
  width: number;               // 宽度
  height: number;              // 高度
}

/**
 * 宠物类别
 */
export type PetClass = 'dog' | 'cat' | 'bird' | 'rabbit' | 'hamster' | 'other';

/**
 * 宠物属性
 */
export interface PetAttributes {
  color?: string;              // 颜色
  size?: 'small' | 'medium' | 'large';  // 大小
  pose?: string;               // 姿态
  accessories?: string[];      // 配件（如项圈）
}

/**
 * 行为分析请求
 */
export interface BehaviorAnalysisRequest {
  deviceId: string;            // 设备ID
  frameCount: number;          // 帧数量
  timeRange?: number;          // 时间范围（秒）
}

/**
 * 行为事件
 */
export interface BehaviorEvent {
  eventId: string;             // 事件ID
  behaviorType: BehaviorType;  // 行为类型
  confidence: number;          // 置信度
  startTime: string;           // 开始时间
  endTime: string;             // 结束时间
  duration: number;            // 持续时间（秒）
  severity: 'low' | 'medium' | 'high';  // 严重程度
  description: string;         // 描述
  suggestions: string[];       // 建议
  relatedFrames: string[];     // 相关帧ID
}

/**
 * 行为类型
 */
export type BehaviorType = 
  | 'eating'           // 进食
  | 'drinking'         // 喝水
  | 'sleeping'         // 睡觉
  | 'playing'          // 玩耍
  | 'running'          // 奔跑
  | 'walking'          // 行走
  | 'sitting'          // 坐着
  | 'standing'         // 站立
  | 'lying'            // 躺着
  | 'grooming'         // 清洁
  | 'scratching'       // 抓挠
  | 'barking'          // 吠叫
  | 'meowing'          // 喵叫
  | 'chewing'          // 咀嚼
  | 'digging'          // 挖掘
  | 'jumping'          // 跳跃
  | 'climbing'         // 攀爬
  | 'hiding'           // 躲藏
  | 'following'       // 跟随
  | 'aggressive'       // 攻击性
  | 'anxious'          // 焦虑
  | 'sick'             // 生病
  | 'unknown';         // 未知

/**
 * 声音检测请求
 */
export interface SoundDetectionRequest {
  deviceId: string;            // 设备ID
  duration?: number;           // 音频时长（秒）
}

/**
 * 声音事件
 */
export interface SoundEvent {
  eventId: string;             // 事件ID
  soundType: SoundType;        // 声音类型
  confidence: number;          // 置信度
  timestamp: string;           // 时间戳
  duration: number;            // 持续时间（秒）
  intensity: number;           // 强度 (dB)
  frequency: number;           // 主频率 (Hz)
  description: string;         // 描述
  alert: boolean;              // 是否需要告警
  suggestions?: string[];      // 建议
}

/**
 * 声音类型
 */
export type SoundType = 
  | 'bark'             // 狗叫
  | 'meow'             // 猫叫
  | 'whine'            // 呜咽
  | 'growl'            // 低吼
  | 'purr'             // 呼噜声
  | 'hiss'             // 嘶嘶声
  | 'sneeze'           // 打喷嚏
  | 'cough'            // 咳嗽
  | 'vomit'            // 呕吐
  | 'scratch'          // 抓挠声
  | 'footsteps'        // 脚步声
  | 'door'             // 门声
  | 'glass_break'      // 玻璃破碎
  | 'fire_alarm'       // 火警
  | 'smoke_alarm'      // 烟雾报警
  | 'unknown';         // 未知

/**
 * 环境监控请求
 */
export interface EnvironmentMonitorRequest {
  deviceId: string;            // 设备ID
  metrics?: EnvironmentMetric[]; // 监控指标
}

/**
 * 环境监控指标
 */
export type EnvironmentMetric = 
  | 'temperature'      // 温度
  | 'humidity'         // 湿度
  | 'light'            // 光照
  | 'noise'            // 噪音
  | 'air_quality';     // 空气质量

/**
 * 环境监控响应
 */
export interface EnvironmentMonitorResponse {
  deviceId: string;
  timestamp: string;
  metrics: EnvironmentMetrics;
  alerts: EnvironmentAlert[];
  recommendations: string[];
}

/**
 * 环境指标数据
 */
export interface EnvironmentMetrics {
  temperature?: number;        // 温度 (°C)
  humidity?: number;           // 湿度 (%)
  light?: number;              // 光照 (lux)
  noise?: number;              // 噪音 (dB)
  airQuality?: number;         // 空气质量指数
}

/**
 * 环境告警
 */
export interface EnvironmentAlert {
  metric: EnvironmentMetric;
  level: 'info' | 'warning' | 'critical';
  message: string;
  currentValue: number;
  threshold: number;
}

/**
 * 事件聚合请求
 */
export interface EventAggregateRequest {
  deviceId: string;            // 设备ID
  timeRange: number;           // 时间范围（秒）
  eventTypes?: (BehaviorType | SoundType)[]; // 事件类型过滤
}

/**
 * 事件聚合响应
 */
export interface EventAggregateResponse {
  deviceId: string;
  timeRange: number;
  summary: EventSummary;
  timeline: AggregatedEvent[];
  llmInterpretation: LLMInterpretation;
  recommendations: string[];
  generatedAt: string;
}

/**
 * 事件摘要
 */
export interface EventSummary {
  totalEvents: number;
  behaviorEvents: number;
  soundEvents: number;
  dominantBehavior: BehaviorType | null;
  dominantSound: SoundType | null;
  averageConfidence: number;
  alertCount: number;
}

/**
 * 聚合事件
 */
export interface AggregatedEvent {
  timestamp: string;
  type: 'behavior' | 'sound';
  eventType: BehaviorType | SoundType;
  confidence: number;
  duration: number;
  description: string;
}

/**
 * LLM 解读结果
 */
export interface LLMInterpretation {
  summary: string;             // 事件总结
  petStatus: string;            // 宠物状态描述
  emotionalState: string;      // 情绪状态
  possibleNeeds: string[];      // 可能的需求
  concerns: string[];           // 关注点
  confidence: number;          // 解读置信度
}

// ==================== 录制相关类型 ====================

/**
 * 录制状态
 */
export type RecordingStatus = 
  | 'pending'          // 等待中
  | 'recording'        // 录制中
  | 'paused'           // 已暂停
  | 'completed'        // 已完成
  | 'failed'           // 失败
  | 'processing';      // 处理中

/**
 * 录制开始请求
 */
export interface RecordingStartRequest {
  cameraId: string;            // 摄像头ID
  deviceId?: string;           // 设备ID
  duration?: number;           // 录制时长（秒），不指定则手动停止
  quality?: QualityLevel;      // 画质
  enableAudio?: boolean;       // 是否录制音频
  tags?: string[];             // 标签
  description?: string;         // 描述
}

/**
 * 录制开始响应
 */
export interface RecordingStartResponse {
  sessionId: string;           // 录制会话ID
  cameraId: string;
  status: RecordingStatus;
  startTime: string;
  estimatedSize?: number;       // 预估文件大小 (bytes)
  message: string;
}

/**
 * 录制停止请求
 */
export interface RecordingStopRequest {
  sessionId: string;            // 录制会话ID
}

/**
 * 录制停止响应
 */
export interface RecordingStopResponse {
  sessionId: string;
  status: RecordingStatus;
  endTime: string;
  duration: number;             // 实际录制时长（秒）
  fileSize: number;            // 文件大小 (bytes)
  fileUrl?: string;            // 文件下载地址
  thumbnailUrl?: string;        // 缩略图地址
  message: string;
}

/**
 * 录制历史项
 */
export interface RecordingHistoryItem {
  sessionId: string;
  cameraId: string;
  deviceId?: string;
  status: RecordingStatus;
  startTime: string;
  endTime?: string;
  duration: number;
  fileSize: number;
  fileUrl?: string;
  thumbnailUrl?: string;
  tags: string[];
  description?: string;
  createdAt: string;
}

/**
 * 录制历史响应
 */
export interface RecordingHistoryResponse {
  cameraId: string;
  total: number;
  page: number;
  pageSize: number;
  items: RecordingHistoryItem[];
}

/**
 * 存储统计
 */
export interface StorageStats {
  totalSpace: number;           // 总空间 (bytes)
  usedSpace: number;            // 已用空间 (bytes)
  freeSpace: number;            // 剩余空间 (bytes)
  usagePercentage: number;      // 使用百分比
  recordingCount: number;       // 录制文件数量
  oldestRecording: string;      // 最早录制时间
  newestRecording: string;      // 最新录制时间
  averageFileSize: number;      // 平均文件大小 (bytes)
  totalDuration: number;        // 总录制时长（秒）
}

// ==================== 服务配置类型 ====================

/**
 * 流媒体服务配置
 */
export interface StreamingServiceConfig {
  mediamtxEndpoint: string;    // MediaMTX 服务地址
  webrtcPort: number;          // WebRTC 端口
  rtspPort: number;            // RTSP 端口
  hlsPort: number;             // HLS 端口
  maxConnections: number;      // 最大连接数
  connectionTimeout: number;   // 连接超时（秒）
  iceServers: IceServer[];     // ICE 服务器
}

/**
 * 检测服务配置
 */
export interface DetectionServiceConfig {
  yoloEndpoint: string;        // YOLOv8 服务地址
  yamnetEndpoint: string;      // YAMNet 服务地址
  llmEndpoint: string;         // LLM 服务地址
  timeout: number;             // 请求超时（毫秒）
  maxRetries: number;          // 最大重试次数
  batchSize: number;           // 批处理大小
}

/**
 * 录制服务配置
 */
export interface RecordingServiceConfig {
  storagePath: string;         // 存储路径
  maxFileSize: number;         // 最大文件大小 (bytes)
  maxDuration: number;         // 最大录制时长（秒）
  defaultQuality: QualityLevel; // 默认画质
  retentionDays: number;       // 保留天数
  enableThumbnail: boolean;    // 是否生成缩略图
}

// ==================== 错误类型 ====================

/**
 * API 错误响应
 */
export interface APIError {
  error: string;
  code: string;
  details?: Record<string, unknown>;
}

/**
 * 错误代码枚举
 */
export enum ErrorCode {
  INVALID_REQUEST = 'INVALID_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  PET_NOT_FOUND = 'PET_NOT_FOUND',
  DEVICE_NOT_FOUND = 'DEVICE_NOT_FOUND',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  CAMERA_NOT_FOUND = 'CAMERA_NOT_FOUND',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  STREAMING_SERVICE_ERROR = 'STREAMING_SERVICE_ERROR',
  DETECTION_SERVICE_ERROR = 'DETECTION_SERVICE_ERROR',
  RECORDING_SERVICE_ERROR = 'RECORDING_SERVICE_ERROR',
  TIMEOUT = 'TIMEOUT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}