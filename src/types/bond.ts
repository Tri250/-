// ============================================
// PawSync Pro 3.0 - Bond & Emotion Types
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 人宠情感连接系统完整类型定义
// ============================================

// 时光档案类型
export interface MemoryItem {
  id: string;
  petId: string;
  type: 'photo' | 'video' | 'voice' | 'milestone';
  title?: string;
  description?: string;
  url: string;
  thumbnail?: string;
  timestamp: string;
  location?: string;
  tags: string[];
  isFavorite: boolean;
  isHighlight: boolean;
  sharedTo?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  petId: string;
  type: 'birthday' | 'adoption' | 'vaccination' | 'training' | 'first_time' | 'achievement' | 'custom';
  title: string;
  description?: string;
  date: string;
  photos?: string[];
  celebrationCount: number;
  reminder?: {
    enabled: boolean;
    daysBefore: number;
  };
}

export interface MemoryAlbum {
  id: string;
  petId: string;
  name: string;
  description?: string;
  coverImage?: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

// 声音记忆类型
export interface VoiceMemory {
  id: string;
  petId: string;
  type: 'meow' | 'bark' | 'purr' | 'chirp' | 'growl' | 'whine' | 'other';
  label?: string;
  url: string;
  duration: number;
  waveformData: number[];
  transcription?: string;
  translation?: string;
  emotion?: 'happy' | 'angry' | 'anxious' | 'hungry' | 'affectionate' | 'curious';
  timestamp: string;
  isUsedAsNotification: boolean;
}

// 远程互动类型
export interface SmartDevice {
  id: string;
  petId: string;
  type: 'laser' | 'feeder' | 'waterer' | 'camera' | 'toy';
  brand: 'xiaopet' | 'huoman' | 'eufy' | 'other';
  name: string;
  status: 'online' | 'offline' | 'busy';
  lastActive: string;
  capabilities: string[];
  settings: Record<string, any>;
}

export interface InteractionLog {
  id: string;
  petId: string;
  deviceId: string;
  type: 'play' | 'feed' | 'treat' | 'call';
  action: string;
  duration?: number;
  timestamp: string;
  autoLogged: boolean;
}

// AI内容生成类型
export interface HighlightClip {
  id: string;
  petId: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  tags: string[];
  emotions: string[];
  scenes: string[];
  timestamp: string;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  status: 'generating' | 'ready' | 'shared' | 'deleted';
}

export interface SharePost {
  id: string;
  petId: string;
  platform: 'xiaohongshu' | 'douyin' | 'weibo' | 'instagram' | 'twitter';
  content: {
    text: string;
    hashtags: string[];
    mentions?: string[];
    mentionsEnabled: boolean;
  };
  mediaUrls: string[];
  generatedCaption?: string;
  scheduledAt?: string;
  publishedAt?: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  metrics?: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
}

export interface AIPostTemplate {
  id: string;
  category: string;
  title: string;
  content: string;
  hashtags: string[];
  tone: 'playful' | 'heartwarming' | 'educational' | 'funny';
}

// 博主工具包类型
export interface ExportSettings {
  resolution: '1080p' | '1440p' | '4k';
  format: 'mp4' | 'mov' | 'avi';
  watermark: {
    enabled: boolean;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    opacity: number;
    customText?: string;
    imageUrl?: string;
  };
  trim: {
    startTime: number;
    endTime: number;
  };
  effects: {
    filter?: string;
    speed?: number;
    transitions?: string;
  };
}

export interface ContentLibrary {
  id: string;
  petId: string;
  name: string;
  type: 'videos' | 'photos' | 'highlights';
  items: MemoryItem[];
  totalSize: number;
  lastUpdated: string;
}

// 互动提醒类型
export interface ComingHomeReminder {
  id: string;
  petId: string;
  enabled: boolean;
  message: string;
  audioUrl?: string;
  playDuration: number;
  leadTime: number;
  deviceIds: string[];
}

// 情感分析类型
export interface EmotionSnapshot {
  id: string;
  petId: string;
  timestamp: string;
  dominantEmotion: 'happy' | 'sad' | 'anxious' | 'excited' | 'calm' | 'playful';
  confidence: number;
  secondaryEmotions: Array<{
    emotion: string;
    intensity: number;
  }>;
  triggers?: string[];
  recommendations?: string[];
}

export interface EmotionTrend {
  date: string;
  emotions: Record<string, number>;
  highlights: string[];
}
