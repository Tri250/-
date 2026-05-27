export type PrimaryEmotion = 'happy' | 'curious' | 'anxious' | 'angry' | 'needs' | 'calm' | 'excited' | 'safe' | 'hungry' | 'tired' | 'affectionate' | 'bored' | 'pain' | 'fearful' | 'neutral';

export type EmotionCategory = 'positive' | 'negative' | 'neutral' | 'active';

export interface EmotionAnalysis {
  id: string;
  petId: string;
  primaryEmotion: PrimaryEmotion;
  secondaryEmotions: PrimaryEmotion[];
  intensity: number;
  confidence: number;
  translation: string;
  context: {
    timeContext: string;
    locationContext: string;
    activityContext?: string;
    relatedTo?: string;
  };
  createdAt: string;
  source: 'voice' | 'image' | 'behavior' | 'text' | 'video' | 'multimodal';
  keyFeatures?: string[];
  breedSpecific?: boolean;
  isEmergency?: boolean;
  healthRecommendations?: string[];
  actionSuggestion?: string;
  multimodalAccuracyBoost?: number;
}

export type EmotionHistoryItem = EmotionAnalysis;

export interface EmotionReport {
  id: string;
  petId: string;
  period: string;
  title: string;
  summary: string;
  emotionDistribution: Record<string, number>;
  emotionTrends: {
    happiness: number;
    anxiety: number;
    activity: number;
  };
  commonNeeds: string[];
  healthScore: number;
  recommendations: string[];
  isEmpty: boolean;
  totalAnalyses: number;
  avgIntensity: number;
  createdAt: string;
}

export type HealthReport = EmotionReport;

export interface EmotionDimension {
  name: string;
  value: number;
  label: string;
  icon: string;
  color: string;
}

export interface EmotionDashboard {
  centralEmotion: PrimaryEmotion;
  intensity: number;
  confidence: number;
  dimensions: {
    excitement: number;
    anxiety: number;
    affection: number;
    curiosity: number;
    playfulness: number;
    contentment: number;
  };
  recentHistory: EmotionAnalysis[];
  trends: {
    direction: 'up' | 'down' | 'stable';
    change: number;
  };
}

export interface EmotionWaveform {
  timestamp: number;
  amplitude: number;
  frequency: number;
}

export interface EmotionThreshold {
  emotion: PrimaryEmotion;
  minIntensity: number;
  maxIntensity: number;
  alertEnabled: boolean;
}

export interface EmotionAlert {
  id: string;
  petId: string;
  emotion: PrimaryEmotion;
  intensity: number;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface VoiceAnalysis {
  pitch: number;
  intensity: number;
  frequency: number;
  duration: number;
  quality: number;
}

export interface EmotionStatistics {
  emotion: PrimaryEmotion;
  count: number;
  averageIntensity: number;
  percentage: number;
}
