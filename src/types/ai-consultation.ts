export interface ContentFilter {
  enabled: boolean;
  keywords: string[];
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  maxTokens: number;
}

export interface AIResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ConsultationContext {
  petId: string;
  petType: string;
  petAge?: number;
  recentSymptoms?: string[];
  medicalHistory?: string[];
}

export interface HealthAdvice {
  severity: 'low' | 'medium' | 'high' | 'critical';
  advice: string;
  urgency: 'routine' | 'soon' | 'urgent' | 'emergency';
  disclaimer: string;
}

// Content filter keywords - violence, abuse, self-harm
const FILTER_KEYWORDS = [
  '暴力',
  '虐待',
  '自残',
  '自杀',
  '杀人',
  '伤害',
];

export const contentFilter: ContentFilter = {
  enabled: true,
  keywords: FILTER_KEYWORDS,
};

export const SUPPORTED_MODELS: AIModel[] = [
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    maxTokens: 8192,
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    maxTokens: 4096,
  },
  {
    id: 'claude-3',
    name: 'Claude 3',
    provider: 'Anthropic',
    maxTokens: 100000,
  },
];

export const DEFAULT_MODEL = 'gpt-3.5-turbo';

export function filterContent(text: string): boolean {
  if (!contentFilter.enabled) return true;
  
  const lowerText = text.toLowerCase();
  return !contentFilter.keywords.some(keyword => 
    lowerText.includes(keyword.toLowerCase())
  );
}

export function sanitizeAIResponse(response: string): string {
  if (!filterContent(response)) {
    return '抱歉，我无法回答这个问题。请咨询专业人士。';
  }
  return response;
}

// Additional types for AI consultation service
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  imageAnalysis?: ImageAnalysisResult;
  voiceResult?: VoiceRecognitionResult;
}

export type ConversationContext = ConsultationContext;

export interface ImageAnalysisResult {
  description: string;
  confidence: number;
  detectedObjects?: string[];
  healthIndicators?: Record<string, any>;
}

export interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  language?: string;
  duration?: number;
}

export interface InputValidationResult {
  isValid: boolean;
  sanitizedInput: string;
  detectedIssues: string[];
  severity: 'none' | 'low' | 'medium' | 'high';
  errors?: string[];
}

// Keyword constants for NLP processing
export const SYMPTOM_KEYWORDS = [
  '呕吐', '腹泻', '发烧', '咳嗽', '打喷嚏', '食欲不振', '精神萎靡',
  '流鼻涕', '流泪', '皮肤瘙痒', '掉毛', '跛行', '呼吸困难', '便秘',
  '尿频', '尿血', '消瘦', '肥胖', '口臭', '牙结石', '耳螨',
];

export const INTENT_KEYWORDS = {
  diagnosis: ['诊断', '检查', '看看', '什么病', '怎么回事', '症状'],
  advice: ['建议', '怎么办', '如何', '怎样', '方法', '治疗'],
  prevention: ['预防', '避免', '防止', '注意'],
  emergency: ['紧急', '急', '危险', '严重', '马上', '立刻'],
  nutrition: ['吃', '喂', '饮食', '营养', '食物', '猫粮', '狗粮'],
  behavior: ['行为', '习惯', '训练', '性格', '脾气'],
};

export const AMBIGUOUS_KEYWORDS = [
  '有点', '稍微', '可能', '好像', '似乎', '大概', '不确定',
];

export const MULTI_INTENT_INDICATORS = [
  '还有', '另外', '同时', '以及', '并且', '而且', '也',
];

export const INTERNET_SLANG = {
  'yyds': '永远的神',
  '绝绝子': '非常好',
  '无语子': '很无语',
  'emo': '情绪低落',
  '躺平': '不想动',
  '摆烂': '放弃',
};

export const DIALECT_EXPRESSIONS = {
  '咋': '怎么',
  '咋办': '怎么办',
  '咋回事': '怎么回事',
  '嘛': '吗',
  '嘞': '了',
};

export const INPUT_VALIDATION_CONFIG = {
  maxLength: 2000,
  minLength: 1,
  prohibitedPatterns: [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
  ],
  maxAttachments: 5,
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  allowedAudioTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
  maxAttachmentSize: 10 * 1024 * 1024, // 10MB
};

export const PROHIBITED_CONTENT_PATTERNS = [
  /暴力/i,
  /虐待/i,
  /自残/i,
  /自杀/i,
];

export const MULTILINGUAL_CONFIG = {
  supportedLanguages: ['zh-CN', 'en-US'],
  defaultLanguage: 'zh-CN',
  detectionEnabled: true,
};
