export type ConsultationType = 'chat' | 'photo_analysis' | 'report';

export type MessageType = 'text' | 'image' | 'voice' | 'system';

export type MessageStatus = 'sending' | 'sent' | 'error';

export interface MessageAttachment {
  id: string;
  type: 'image' | 'voice';
  url: string;
  name?: string;
  size?: number;
  duration?: number;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  messageType: MessageType;
  attachments?: MessageAttachment[];
  status?: MessageStatus;
  createdAt: string;
}

export interface ConversationContext {
  petInfo?: {
    type?: string;
    breed?: string;
    age?: number;
    gender?: string;
    weight?: number;
  };
  discussedTopics: string[];
  mentionedSymptoms: string[];
  lastIntent?: string;
}

export interface AIConsultation {
  id: string;
  petId: string;
  type: ConsultationType;
  title: string;
  messages: AIMessage[];
  context: ConversationContext;
  createdAt: string;
  updatedAt: string;
}

export interface TrendReport {
  id: string;
  petId: string;
  period: '7d' | '30d' | '90d';
  title: string;
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  healthScore: number;
  chartsData: any;
  createdAt: string;
}

export interface ConversationHistory {
  id: string;
  petId: string;
  title: string;
  lastMessage: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export const QUICK_QUESTIONS = [
  '我的猫最近食欲不振，怎么办？',
  '狗狗呕吐了需要去医院吗？',
  '如何判断宠物是否发烧？',
  '宠物驱虫多久一次？',
  '猫咪应激反应有哪些表现？',
  '狗狗换牙期需要注意什么？',
];

export const SYMPTOM_KEYWORDS = [
  '食欲不振', '呕吐', '腹泻', '咳嗽', '发烧', '脱毛',
  '嗜睡', '攻击性', '焦虑', '口臭', '眼屎', '耳垢',
  '跛行', '瘙痒', '打喷嚏', '流鼻涕', '便秘', '尿频',
];

export const INTENT_KEYWORDS = {
  diagnosis: ['是什么原因', '为什么', '怎么回事', '是什么病', '诊断'],
  treatment: ['怎么治', '吃什么药', '怎么处理', '治疗方法', '怎么办'],
  prevention: ['如何预防', '怎么预防', '注意事项', '怎么避免'],
  nutrition: ['吃什么', '饮食', '营养', '喂食', '狗粮', '猫粮'],
  behavior: ['行为', '训练', '习惯', '性格', '脾气'],
  emergency: ['紧急', '急救', '马上', '立即', '危险', '严重'],
};