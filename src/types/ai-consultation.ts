// AI健康顾问相关类型

export type ConsultationType = 'chat' | 'photo_analysis' | 'report';

export interface AIConsultation {
  id: string;
  petId: string;
  type: ConsultationType;
  title: string;
  messages: AIMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: string[];
  createdAt: string;
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

export const QUICK_QUESTIONS = [
  '我的猫最近食欲不振，怎么办？',
  '狗狗呕吐了需要去医院吗？',
  '如何判断宠物是否发烧？',
  '宠物驱虫多久一次？',
  '猫咪应激反应有哪些表现？',
  '狗狗换牙期需要注意什么？',
];
