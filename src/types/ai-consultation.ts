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
