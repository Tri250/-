export type PrimaryEmotion = 'happy' | 'curious' | 'anxious' | 'angry' | 'needs' | 'calm' | 'excited' | 'safe';

export type EmotionCategory = 'positive' | 'negative' | 'neutral' | 'active';

export interface AudioFeatures {
  pitch: {
    mean: number;
    variance: number;
    range: [number, number];
    trend: 'rising' | 'falling' | 'stable';
  };
  intensity: {
    mean: number;
    peak: number;
    variance: number;
  };
  frequency: {
    dominant: number;
    range: [number, number];
    harmonics: number[];
  };
  rhythm: {
    tempo: number;
    regularity: number;
    pattern: 'steady' | 'irregular' | 'accelerating' | 'decelerating';
  };
  timbre: {
    brightness: number;
    warmth: number;
    roughness: number;
  };
  duration: number;
  quality: number;
}

export interface EmotionScores {
  happy: number;
  curious: number;
  anxious: number;
  angry: number;
  needs: number;
  calm: number;
  excited: number;
  safe: number;
}

export interface EmotionAnalysisDetail {
  primaryEmotion: PrimaryEmotion;
  secondaryEmotion?: PrimaryEmotion;
  scores: EmotionScores;
  confidence: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  reasoning: string[];
  audioFeatures: AudioFeatures;
  behaviorIndicators: string[];
}

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
  detail?: EmotionAnalysisDetail;
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

export interface EmotionPattern {
  emotion: PrimaryEmotion;
  triggers: string[];
  typicalTime: string[];
  relatedBehaviors: string[];
}

export const EMOTION_CONFIGS: Record<PrimaryEmotion, {
  emoji: string;
  label: string;
  color: string;
  bgColor: string;
  gradient: string;
  description: string;
  audioSignatures: {
    pitchRange: [number, number];
    intensityRange: [number, number];
    frequencyRange: [number, number];
  };
}> = {
  happy: {
    emoji: '😸',
    label: '开心',
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    gradient: 'from-green-400 to-emerald-500',
    description: '宝贝现在心情很好，充满愉悦感',
    audioSignatures: {
      pitchRange: [400, 800],
      intensityRange: [50, 80],
      frequencyRange: [300, 600],
    },
  },
  curious: {
    emoji: '🤔',
    label: '好奇',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    gradient: 'from-purple-400 to-violet-500',
    description: '宝贝对周围的事物充满好奇心',
    audioSignatures: {
      pitchRange: [350, 600],
      intensityRange: [40, 70],
      frequencyRange: [200, 450],
    },
  },
  anxious: {
    emoji: '😰',
    label: '焦虑',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    gradient: 'from-yellow-400 to-amber-500',
    description: '宝贝可能感到不安或紧张',
    audioSignatures: {
      pitchRange: [500, 900],
      intensityRange: [30, 60],
      frequencyRange: [400, 700],
    },
  },
  angry: {
    emoji: '😾',
    label: '生气',
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    gradient: 'from-red-400 to-rose-500',
    description: '宝贝现在有些不满或生气',
    audioSignatures: {
      pitchRange: [600, 1000],
      intensityRange: [70, 100],
      frequencyRange: [500, 800],
    },
  },
  needs: {
    emoji: '🥺',
    label: '有需求',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    gradient: 'from-blue-400 to-indigo-500',
    description: '宝贝想要表达某种需求',
    audioSignatures: {
      pitchRange: [450, 750],
      intensityRange: [50, 85],
      frequencyRange: [350, 550],
    },
  },
  calm: {
    emoji: '😌',
    label: '平静',
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    gradient: 'from-gray-400 to-slate-500',
    description: '宝贝现在很放松平静',
    audioSignatures: {
      pitchRange: [200, 400],
      intensityRange: [20, 50],
      frequencyRange: [100, 300],
    },
  },
  excited: {
    emoji: '🎉',
    label: '兴奋',
    color: 'text-pink-500',
    bgColor: 'bg-pink-50',
    gradient: 'from-pink-400 to-rose-500',
    description: '宝贝现在非常兴奋激动',
    audioSignatures: {
      pitchRange: [600, 1000],
      intensityRange: [75, 100],
      frequencyRange: [450, 750],
    },
  },
  safe: {
    emoji: '😊',
    label: '安心',
    color: 'text-teal-500',
    bgColor: 'bg-teal-50',
    gradient: 'from-teal-400 to-cyan-500',
    description: '宝贝感到安全和满足',
    audioSignatures: {
      pitchRange: [250, 450],
      intensityRange: [30, 55],
      frequencyRange: [150, 350],
    },
  },
};

export const TRANSLATIONS: Record<PrimaryEmotion, string[]> = {
  happy: [
    '主人，我今天超开心的！要不要一起玩呀？',
    '今天心情真好，谢谢主人陪我～',
    '喵～今天阳光真好，我很满足！',
    '好开心呀！尾巴都摇起来了～',
    '今天是最棒的一天！爱你哦～',
  ],
  curious: [
    '咦，这是什么呀？我想看看！',
    '那边有声音，好奇心被勾起来了～',
    '这个新玩具怎么玩呀？',
    '让我闻闻，这是什么味道？',
    '有新东西！快让我探索一下～',
  ],
  anxious: [
    '主人，你要去哪里呀？不要离开我太久...',
    '有点紧张，能陪陪我吗？',
    '外面好像有声音，有点害怕...',
    '我不太确定现在安全吗...',
    '能抱抱我吗？需要一点安慰～',
  ],
  angry: [
    '哼！你为什么不给我开门！',
    '我生气了！快给我小鱼干！',
    '别碰我！我现在不想理你！',
    '这是我的地盘！不要乱动！',
    '气死我了！快道歉！',
  ],
  needs: [
    '主人，我饿了，要吃饭饭～',
    '想出去玩玩，放我出去嘛～',
    '好久没梳毛了，帮我梳梳毛吧！',
    '厕所脏了，帮我清理一下嘛～',
    '渴了，想喝水水～',
  ],
  calm: [
    '今天天气不错呢...',
    '我在思考猫生...',
    '嗯...就这样吧。',
    '阳光暖暖的，好舒服～',
    '什么都不想做，就这样躺着～',
  ],
  excited: [
    '太棒了！有新零食吃吗？！',
    '耶耶耶！要出门了吗？！',
    '好开心好开心！转圈圈！',
    '快看快看！有好玩的事情！',
    '超级期待！会发生什么呢？！',
  ],
  safe: [
    '有主人在身边真好，超级安心～',
    '这里好温暖，我不想动啦～',
    '今天又是平安的一天呢～',
    '被爱的感觉真好～',
    '最喜欢待在你身边了～',
  ],
};