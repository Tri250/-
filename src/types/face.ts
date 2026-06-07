// ============================================
// PawSync Pro 3.0 - Face Expression Types
//
// 作者: 带娃的小陈工
// 日期: 2026-05-27
// 描述: 面部表情分析类型定义
// ============================================

// 面部表情类型
export type FaceExpression = 'relaxed' | 'tense' | 'pain' | 'happy' | 'curious' | 'aggressive';

// 面部关键点
export interface FacialLandmark {
  x: number;
  y: number;
  z: number;
  name: string;
}

// 表情配置
export interface ExpressionConfig {
  label: string;
  emoji: string;
  color: string;
  description: string;
  features: string[];
}

// 面部分析结果
export interface FaceAnalysis {
  id: string;
  petId: string;
  timestamp: string;
  expression: FaceExpression;
  confidence: number;
  petType: 'cat' | 'dog';
  landmarks: FacialLandmark[];
  features: string[];
  description: string;
  imageUrl?: string;
  processingTime?: number;
  imageFeatures?: {
    brightness: number;
    contrast: number;
    colorVariance: number;
    edgeDensity: number;
    symmetry: number;
  };
}

// 面部特征分析
export interface FaceFeatureAnalysis {
  eyeState: {
    leftEyeOpen: number;
    rightEyeOpen: number;
  };
  mouthState: {
    mouthOpen: number;
    smiling: number;
  };
  earState: {
    leftEarPosition: 'forward' | 'neutral' | 'backward';
    rightEarPosition: 'forward' | 'neutral' | 'backward';
  };
}

// 表情统计数据
export interface ExpressionStatistics {
  expression: FaceExpression;
  count: number;
  averageConfidence: number;
  percentage: number;
}