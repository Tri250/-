// ============================================
// PawSync Pro 3.0 - Voice Analysis Types
//
// 作者: 带娃的小陈工
// 日期: 2026-06-10
// 描述: AI 声音情绪分析服务类型定义
// ============================================

/**
 * 宠物意图类型
 * 基于科学研究的宠物行为意图分类
 */
export type PetIntention = 
  | 'happy'      // 开心/愉悦 - 表达满足和快乐
  | 'hungry'     // 饥饿 - 请求食物
  | 'anxious'    // 焦虑 - 表达不安或担忧
  | 'playful'   // 玩耍 - 邀请互动
  | 'angry'     // 生气 - 表达不满或威胁
  | 'tired'     // 疲惫 - 需要休息
  | 'social';    // 社交 - 寻求关注或陪伴

/**
 * 意图配置信息
 */
export interface IntentionConfig {
  /** 意图标识 */
  id: PetIntention;
  /** 中文标签 */
  label: string;
  /** 图标 */
  icon: string;
  /** 颜色类名 */
  color: string;
  /** 背景颜色类名 */
  bgColor: string;
  /** 渐变类名 */
  gradient: string;
  /** 描述 */
  description: string;
  /** 典型行为建议 */
  suggestions: string[];
  /** 音频特征参考范围 */
  audioSignature: {
    pitchRange: [number, number];
    energyRange: [number, number];
    durationRange: [number, number];
  };
}

/**
 * 可解释性音频特征
 */
export interface ExplainableAudioFeatures {
  /** 音高特征 */
  pitch: {
    /** 平均音高 (Hz) */
    mean: number;
    /** 音高标准差 */
    variance: number;
    /** 音高范围 [最小, 最大] */
    range: [number, number];
    /** 音高趋势 */
    trend: 'rising' | 'falling' | 'stable' | 'fluctuating';
    /** 解释说明 */
    explanation: string;
  };
  /** 能量特征 */
  energy: {
    /** 平均能量 */
    mean: number;
    /** 峰值能量 */
    peak: number;
    /** 能量变化 */
    variance: number;
    /** 解释说明 */
    explanation: string;
  };
  /** 持续时间特征 */
  duration: {
    /** 总时长 (秒) */
    total: number;
    /** 有效声音时长 */
    active: number;
    /** 静音时长 */
    silence: number;
    /** 解释说明 */
    explanation: string;
  };
  /** 频率特征 */
  frequency: {
    /** 主频率 (Hz) */
    dominant: number;
    /** 频率范围 */
    range: [number, number];
    /** 谐波成分 */
    harmonics: number[];
    /** 解释说明 */
    explanation: string;
  };
  /** 节奏特征 */
  rhythm: {
    /** 节奏模式 */
    pattern: 'steady' | 'irregular' | 'accelerating' | 'decelerating';
    /** 节奏强度 */
    intensity: number;
    /** 解释说明 */
    explanation: string;
  };
}

/**
 * 声音分析结果
 */
export interface VoiceAnalysisResult {
  /** 分析 ID */
  id: string;
  /** 时间戳 */
  timestamp: string;
  /** 宠物 ID */
  petId?: string;
  /** 主要意图 */
  primaryIntention: PetIntention;
  /** 意图置信度 (0-1) */
  confidence: number;
  /** 置信度等级 */
  confidenceLevel: 'high' | 'medium' | 'low';
  /** 所有意图的概率分布 */
  intentionDistribution: Record<PetIntention, number>;
  /** 可解释性音频特征 */
  features: ExplainableAudioFeatures;
  /** 分析推理过程 */
  reasoning: string[];
  /** 行为指标 */
  behaviorIndicators: string[];
  /** 使用的推理模式 */
  inferenceMode: 'frontend' | 'backend' | 'hybrid';
  /** 处理耗时 (毫秒) */
  processingTime: number;
  /** 是否成功 */
  success: boolean;
  /** 错误信息 */
  error?: string;
}

/**
 * 意图识别结果
 */
export interface IntentionResult {
  /** 识别 ID */
  id: string;
  /** 时间戳 */
  timestamp: string;
  /** 意图类型 */
  intention: PetIntention;
  /** 置信度 */
  confidence: number;
  /** 意图描述 */
  description: string;
  /** 行为建议 */
  suggestions: string[];
  /** 相关行为指标 */
  relatedBehaviors: string[];
  /** 可能的触发因素 */
  possibleTriggers: string[];
  /** 社区统计 (其他宠物在相似情况下的行为) */
  communityStats?: {
    /** 相似案例数量 */
    similarCases: number;
    /** 最常见后续行为 */
    commonFollowUp: string;
    /** 平均持续时间 */
    averageDuration: number;
  };
}

/**
 * 精彩片段
 */
export interface HighlightClip {
  /** 片段 ID */
  id: string;
  /** 视频 URL */
  videoUrl: string;
  /** 缩略图 URL */
  thumbnailUrl: string;
  /** 标题 */
  title: string;
  /** 描述 */
  description: string;
  /** 开始时间 (秒) */
  startTime: number;
  /** 结束时间 (秒) */
  endTime: number;
  /** 时长 (秒) */
  duration: number;
  /** 检测类型 */
  detectionType: HighlightDetectionType;
  /** 置信度 */
  confidence: number;
  /** 标签 */
  tags: string[];
  /** 情绪标签 */
  emotions: string[];
  /** 场景描述 */
  sceneDescription: string;
  /** 宠物 ID */
  petId?: string;
  /** 创建时间 */
  createdAt: string;
  /** 观看次数 */
  viewCount?: number;
  /** 点赞次数 */
  likeCount?: number;
  /** 分享次数 */
  shareCount?: number;
  /** 状态 */
  status: 'generating' | 'ready' | 'shared' | 'deleted';
}

/**
 * 精彩片段检测类型
 */
export type HighlightDetectionType = 
  | 'fast_movement'      // 快速移动
  | 'close_camera'      // 靠近摄像头
  | 'funny_pose'        // 有趣姿势
  | 'multi_pet'         // 多宠物同框
  | 'playful_behavior'  // 玩耍行为
  | 'vocalization'      // 发声时刻
  | 'interaction'       // 互动时刻
  | 'cute_expression';  // 可爱表情

/**
 * 精彩片段检测选项
 */
export interface HighlightDetectionOptions {
  /** 最小置信度阈值 */
  minConfidence?: number;
  /** 最小片段时长 (秒) */
  minDuration?: number;
  /** 最大片段时长 (秒) */
  maxDuration?: number;
  /** 检测类型过滤 */
  detectionTypes?: HighlightDetectionType[];
  /** 是否包含情绪分析 */
  includeEmotionAnalysis?: boolean;
  /** 是否生成缩略图 */
  generateThumbnail?: boolean;
  /** 推理模式 */
  inferenceMode?: 'frontend' | 'backend' | 'hybrid';
  /** 超时时间 (毫秒) */
  timeout?: number;
}

/**
 * 声音分析 API 请求
 */
export interface VoiceAnalysisRequest {
  /** 音频 Blob */
  audioBlob: Blob;
  /** 宠物 ID */
  petId?: string;
  /** 宠物类型 */
  petType?: 'cat' | 'dog' | 'other';
  /** 上下文信息 */
  context?: {
    /** 时间 */
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    /** 位置 */
    location?: string;
    /** 最近活动 */
    recentActivity?: string;
  };
  /** 是否返回详细特征 */
  returnDetailedFeatures?: boolean;
  /** 推理模式 */
  inferenceMode?: 'frontend' | 'backend' | 'hybrid';
}

/**
 * 声音分析 API 响应
 */
export interface VoiceAnalysisResponse {
  /** 是否成功 */
  success: boolean;
  /** 分析结果 */
  result?: VoiceAnalysisResult;
  /** 错误信息 */
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 后端 AI API 配置
 */
export interface BackendAIConfig {
  /** API 基础 URL */
  baseUrl: string;
  /** API 版本 */
  version: string;
  /** 超时时间 (毫秒) */
  timeout: number;
  /** 重试次数 */
  retries: number;
  /** 是否启用缓存 */
  enableCache: boolean;
  /** 缓存过期时间 (毫秒) */
  cacheExpiry: number;
}

/**
 * 意图识别配置映射
 */
export const INTENTION_CONFIGS: Record<PetIntention, IntentionConfig> = {
  happy: {
    id: 'happy',
    label: '开心',
    icon: '😸',
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    gradient: 'from-green-400 to-emerald-500',
    description: '宝贝现在心情很好，充满愉悦感',
    suggestions: [
      '可以陪宝贝玩耍，增进感情',
      '给一些小零食作为奖励',
      '记录下这开心的时刻',
      '保持当前愉快的氛围',
    ],
    audioSignature: {
      pitchRange: [400, 800],
      energyRange: [50, 80],
      durationRange: [0.3, 2.0],
    },
  },
  hungry: {
    id: 'hungry',
    label: '饥饿',
    icon: '🍽️',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    gradient: 'from-orange-400 to-amber-500',
    description: '宝贝可能饿了，想要吃东西',
    suggestions: [
      '检查食物碗是否需要添加',
      '按照喂食时间表喂食',
      '确保水源充足',
      '观察进食情况',
    ],
    audioSignature: {
      pitchRange: [300, 600],
      energyRange: [40, 70],
      durationRange: [0.5, 3.0],
    },
  },
  anxious: {
    id: 'anxious',
    label: '焦虑',
    icon: '😰',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    gradient: 'from-yellow-400 to-amber-500',
    description: '宝贝可能感到不安或紧张',
    suggestions: [
      '轻声安抚宝贝',
      '检查是否有环境变化',
      '提供安全的躲藏空间',
      '避免突然的响动',
    ],
    audioSignature: {
      pitchRange: [500, 900],
      energyRange: [30, 60],
      durationRange: [0.2, 1.5],
    },
  },
  playful: {
    id: 'playful',
    label: '玩耍',
    icon: '🎮',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    gradient: 'from-purple-400 to-violet-500',
    description: '宝贝想和你玩耍互动',
    suggestions: [
      '拿出宝贝喜欢的玩具',
      '进行互动游戏',
      '适当运动有助于健康',
      '注意不要过度兴奋',
    ],
    audioSignature: {
      pitchRange: [450, 750],
      energyRange: [60, 90],
      durationRange: [0.2, 1.0],
    },
  },
  angry: {
    id: 'angry',
    label: '生气',
    icon: '😾',
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    gradient: 'from-red-400 to-rose-500',
    description: '宝贝现在有些不满或生气',
    suggestions: [
      '给宝贝一些空间',
      '检查是否有不适或疼痛',
      '避免刺激宝贝',
      '观察是否有其他异常',
    ],
    audioSignature: {
      pitchRange: [600, 1000],
      energyRange: [70, 100],
      durationRange: [0.3, 2.0],
    },
  },
  tired: {
    id: 'tired',
    label: '疲惫',
    icon: '😴',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    gradient: 'from-blue-400 to-indigo-500',
    description: '宝贝需要休息或已经累了',
    suggestions: [
      '让宝贝安静休息',
      '检查睡眠环境是否舒适',
      '避免打扰宝贝',
      '观察是否有健康问题',
    ],
    audioSignature: {
      pitchRange: [200, 400],
      energyRange: [20, 40],
      durationRange: [0.5, 3.0],
    },
  },
  social: {
    id: 'social',
    label: '社交',
    icon: '💕',
    color: 'text-pink-500',
    bgColor: 'bg-pink-50',
    gradient: 'from-pink-400 to-rose-500',
    description: '宝贝想要关注或陪伴',
    suggestions: [
      '花时间陪伴宝贝',
      '轻柔地抚摸宝贝',
      '和宝贝说话交流',
      '给予足够的关注',
    ],
    audioSignature: {
      pitchRange: [350, 550],
      energyRange: [40, 65],
      durationRange: [0.3, 1.5],
    },
  },
};

/**
 * 默认后端 AI API 配置
 */
export const DEFAULT_BACKEND_AI_CONFIG: BackendAIConfig = {
  baseUrl: '/api/ai',
  version: 'v1',
  timeout: 30000,
  retries: 3,
  enableCache: true,
  cacheExpiry: 3600000, // 1 小时
};