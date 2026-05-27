// ============================================
// PawSync Pro 3.0 - Audio Types
//
// 作者: 带娃的小陈工
// 日期: 2026-05-27
// 描述: 声音识别引擎类型定义
// ============================================

// 声音情绪类型
export type SoundEmotion = 'happy' | 'anxious' | 'fear' | 'pain' | 'neutral';

// YAMNet类别定义
export interface YAMNetCategory {
  index: number;
  name: string;
  displayName: string;
  isAnimal: boolean;
}

// 音频分析结果
export interface AudioAnalysis {
  id: string;
  petId: string;
  timestamp: string;
  category: string;
  categoryIndex: number;
  confidence: number;
  rawScores: Record<number, number>;
  duration: number;
}

// 音频事件
export interface AudioEvent {
  id: string;
  petId: string;
  timestamp: string;
  category: string;
  categoryIndex: number;
  confidence: number;
  emotion: SoundEmotion;
  emotionConfidence: number;
  duration: string;
  description: string;
  audioClipUrl?: string;
}

// 音频统计数据
export interface AudioStatistics {
  totalEvents: number;
  emotionDistribution: Record<SoundEmotion, number>;
  mostCommonSound: string;
  averageConfidence: number;
  peakActivityTime: string;
}

// 音频检测配置
export interface AudioDetectionConfig {
  enabled: boolean;
  sensitivity: 'low' | 'medium' | 'high';
  minConfidence: number;
  eventTypes: string[];
  notificationEnabled: boolean;
}

// 情绪分析结果
export interface EmotionAnalysisResult {
  emotion: SoundEmotion;
  confidence: number;
  timestamp: string;
  duration: number;
  context?: {
    timeOfDay: string;
    location?: string;
  };
}