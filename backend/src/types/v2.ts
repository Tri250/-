/**
 * v2 API 类型定义
 * 支持高精度 AI 分析的接口类型
 */

// ==================== 基础类型 ====================

/**
 * 宠物情绪类型
 */
export type PetEmotion = 
  | 'happy'      // 开心
  | 'sad'        // 悲伤
  | 'angry'      // 愤怒
  | 'fearful'    // 恐惧
  | 'anxious'    // 焦虑
  | 'excited'    // 兴奋
  | 'calm'       // 平静
  | 'confused'   // 困惑
  | 'playful'    // 顽皮
  | 'affectionate'; // 亲昵

/**
 * 动物类型
 */
export type AnimalType = 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';

/**
 * 分析置信度级别
 */
export type ConfidenceLevel = 'low' | 'medium' | 'high';

/**
 * 时间周期类型
 */
export type TrendPeriod = '7d' | '30d' | '90d';

// ==================== 语音分析相关 ====================

/**
 * 语音分析请求
 */
export interface VoiceAnalyzeRequest {
  petId: string;
  context?: string;
}

/**
 * 语音分析详情
 */
export interface VoiceAnalysisDetails {
  pitch: number;           // 音调 (Hz)
  duration: number;       // 时长 (ms)
  intensity: number;      // 强度 (dB)
  frequency: number[];    // 频率分布
  patterns: string[];     // 识别到的模式
}

/**
 * 语音分析响应
 */
export interface VoiceAnalyzeResponse {
  emotion: PetEmotion;
  confidence: number;      // 0-1
  translation: string;     // 翻译文本
  details: VoiceAnalysisDetails;
  suggestion: string;      // 建议内容
  analysisId: string;      // 分析ID，用于反馈
  processingTime: number;  // 处理时间 (ms)
}

// ==================== 图像分析相关 ====================

/**
 * 图像分析请求
 */
export interface ImageAnalyzeRequest {
  petId: string;
  context?: string;
}

/**
 * 图像分析详情
 */
export interface ImageAnalysisDetails {
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  landmarks: Array<{
    name: string;
    x: number;
    y: number;
  }>;
  pose: string;
  accessories: string[];
}

/**
 * 图像分析响应
 */
export interface ImageAnalyzeResponse {
  animalDetected: boolean;
  breed?: string;
  breedConfidence?: number;
  emotion: PetEmotion;
  confidence: number;
  translation: string;
  details: ImageAnalysisDetails;
  analysisId: string;
  processingTime: number;
}

// ==================== 多模态分析相关 ====================

/**
 * 多模态分析请求
 */
export interface MultimodalAnalyzeRequest {
  petId: string;
  context?: string;
}

/**
 * 单模态结果
 */
export interface SingleModalResult {
  modality: 'voice' | 'image';
  emotion: PetEmotion;
  confidence: number;
  translation: string;
}

/**
 * 冲突分析
 */
export interface ConflictAnalysis {
  hasConflict: boolean;
  conflictType?: 'emotion_mismatch' | 'low_confidence' | 'ambiguous';
  resolution: string;
  weightedEmotion: PetEmotion;
  weightedConfidence: number;
}

/**
 * 融合结果
 */
export interface FusionResult {
  emotion: PetEmotion;
  confidence: number;
  translation: string;
  suggestion: string;
  details: {
    voiceWeight: number;
    imageWeight: number;
    fusionMethod: 'weighted_average' | 'ensemble' | 'rule_based';
  };
}

/**
 * 多模态分析响应
 */
export interface MultimodalAnalyzeResponse {
  fusionResult: FusionResult;
  singleModalResults: {
    voice?: SingleModalResult;
    image?: SingleModalResult;
  };
  conflictAnalysis: ConflictAnalysis;
  analysisId: string;
  processingTime: number;
}

// ==================== 反馈相关 ====================

/**
 * 反馈请求
 */
export interface FeedbackRequest {
  analysisId: string;
  rating: 1 | 2 | 3 | 4 | 5;  // 1-5星评分
  correctedEmotion?: PetEmotion;  // 用户修正的情绪
  comment?: string;
}

/**
 * 反馈响应
 */
export interface FeedbackResponse {
  success: boolean;
  message: string;
  feedbackId: string;
}

// ==================== 趋势分析相关 ====================

/**
 * 趋势时间线数据点
 */
export interface TrendTimelinePoint {
  date: string;           // ISO 日期
  emotion: PetEmotion;
  confidence: number;
  source: 'voice' | 'image' | 'multimodal';
}

/**
 * 情绪稳定性
 */
export interface EmotionStability {
  score: number;          // 0-100，越高越稳定
  volatility: number;     // 波动率
  trend: 'improving' | 'declining' | 'stable';
}

/**
 * 情绪预测
 */
export interface EmotionPrediction {
  nextWeekEmotion: PetEmotion;
  confidence: number;
  factors: string[];       // 影响因素
}

/**
 * 趋势分析响应
 */
export interface TrendAnalyzeResponse {
  petId: string;
  period: TrendPeriod;
  timeline: TrendTimelinePoint[];
  dominantEmotion: PetEmotion;
  emotionDistribution: Record<PetEmotion, number>;
  stability: EmotionStability;
  prediction: EmotionPrediction;
  generatedAt: string;
}

// ==================== AI 服务相关 ====================

/**
 * AI 服务配置
 */
export interface AIServiceConfig {
  endpoint: string;
  timeout: number;
  maxRetries: number;
  apiKey?: string;
}

/**
 * AI 服务请求基础接口
 */
export interface AIServiceRequest {
  petId: string;
  context?: string;
  metadata?: Record<string, unknown>;
}

/**
 * AI 服务响应基础接口
 */
export interface AIServiceResponse {
  success: boolean;
  error?: string;
  processingTime: number;
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
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  TIMEOUT = 'TIMEOUT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}