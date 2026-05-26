export type PrimaryEmotion = 'happy' | 'curious' | 'anxious' | 'angry' | 'needs' | 'calm' | 'excited' | 'safe';

export type EmotionCategory = 'positive' | 'negative' | 'neutral' | 'active';

export interface EmotionAnalysis {
  id: string;
  petId: string;
  primaryEmotion: PrimaryEmotion;
  intensity: number;
  confidence: number;
  subEmotions: string[];
  translation: string;
  context: {
    timeContext: string;
    locationContext: string;
  };
  createdAt: string;
  source: 'voice' | 'image' | 'behavior';
}

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
