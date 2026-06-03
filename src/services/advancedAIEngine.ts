// Advanced AI Engine Service
// Provides emotion analysis and trend detection functionality

export type EmotionType = 
  | 'happy' 
  | 'excited' 
  | 'affectionate' 
  | 'calm' 
  | 'sad' 
  | 'anxious' 
  | 'fearful' 
  | 'angry';

export interface EmotionResult {
  primaryEmotion: EmotionType;
  intensity: 'low' | 'medium' | 'high';
  confidence: number;
  secondaryEmotions: Array<{ emotion: EmotionType; confidence: number }>;
  analysisDetails: {
    features: Record<string, number>;
    model: string;
    timestamp: number;
    processingTime: number;
  };
  recommendation: string;
}

export interface EmotionTrend {
  dominantEmotion: EmotionType;
  averageConfidence: number;
  stability: number;
  trend: 'improving' | 'stable' | 'declining';
  anomalyScore: number;
  prediction: string;
  engagement: 'high' | 'medium' | 'low';
  emotionalBalance: number;
}

// Emotion weights for calculating emotional balance
const EMOTION_WEIGHTS: Record<EmotionType, number> = {
  happy: 1,
  excited: 0.9,
  affectionate: 0.8,
  calm: 0.5,
  sad: -0.6,
  anxious: -0.7,
  fearful: -0.8,
  angry: -0.9,
};

export function analyzeEmotionTrend(history: EmotionResult[]): EmotionTrend {
  if (history.length === 0) {
    return {
      dominantEmotion: 'calm',
      averageConfidence: 0,
      stability: 0,
      trend: 'stable',
      anomalyScore: 0,
      prediction: '暂无足够数据进行预测',
      engagement: 'low',
      emotionalBalance: 0,
    };
  }

  // Calculate dominant emotion
  const emotionCounts: Record<string, number> = {};
  history.forEach(result => {
    emotionCounts[result.primaryEmotion] = (emotionCounts[result.primaryEmotion] || 0) + 1;
  });
  
  const dominantEmotion = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])[0][0] as EmotionType;

  // Calculate average confidence
  const averageConfidence = history.reduce((sum, r) => sum + r.confidence, 0) / history.length;

  // Calculate stability (inverse of variance)
  const confidences = history.map(r => r.confidence);
  const mean = averageConfidence;
  const variance = confidences.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / confidences.length;
  const stability = Math.max(0, 1 - variance);

  // Calculate trend
  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (history.length >= 2) {
    const firstHalf = history.slice(0, Math.floor(history.length / 2));
    const secondHalf = history.slice(Math.floor(history.length / 2));
    
    const firstBalance = firstHalf.reduce((sum, r) => sum + EMOTION_WEIGHTS[r.primaryEmotion], 0) / firstHalf.length;
    const secondBalance = secondHalf.reduce((sum, r) => sum + EMOTION_WEIGHTS[r.primaryEmotion], 0) / secondHalf.length;
    
    // Use a smaller threshold for more stable results
    const threshold = 0.05;
    if (secondBalance > firstBalance + threshold) {
      trend = 'improving';
    } else if (secondBalance < firstBalance - threshold) {
      trend = 'declining';
    }
    
    // For predominantly positive emotions, bias towards 'improving' or 'stable'
    const allPositive = history.every(r => EMOTION_WEIGHTS[r.primaryEmotion] > 0);
    if (allPositive && trend === 'declining') {
      trend = 'stable';
    }
  }

  // Calculate anomaly score
  const recentConfidences = history.slice(-5).map(r => r.confidence);
  const avgRecent = recentConfidences.reduce((a, b) => a + b, 0) / recentConfidences.length;
  const anomalyScore = Math.abs(avgRecent - averageConfidence);

  // Calculate emotional balance
  const emotionalBalance = history.reduce((sum, r) => sum + EMOTION_WEIGHTS[r.primaryEmotion], 0) / history.length;

  // Determine engagement
  let engagement: 'high' | 'medium' | 'low' = 'medium';
  if (averageConfidence > 0.8 && history.length > 5) {
    engagement = 'high';
  } else if (averageConfidence < 0.5 || history.length < 3) {
    engagement = 'low';
  }

  // Generate prediction
  let prediction = '';
  if (trend === 'improving') {
    prediction = '情感状态正在改善，继续保持';
  } else if (trend === 'declining') {
    prediction = '情感状态有所下降，建议关注';
  } else {
    prediction = '情感状态保持稳定';
  }

  return {
    dominantEmotion,
    averageConfidence,
    stability,
    trend,
    anomalyScore,
    prediction,
    engagement,
    emotionalBalance,
  };
}

// Re-export from aiEngine.ts for compatibility
export { AdvancedAIEngine, SymptomAnalysis } from './aiEngine';
