export type RecordType =
  | 'checkup'
  | 'vaccination'
  | 'medication'
  | 'surgery'
  | 'lab'
  | 'weight'
  | 'dental'
  | 'grooming'
  | 'emergency'
  | 'pdf'
  | 'text'
  | 'photo'
  | 'voice'
  | 'video'
  | 'file';

export type ReminderType =
  | 'vaccination'
  | 'medication'
  | 'checkup'
  | 'grooming'
  | 'feeding'
  | 'other';

export type ManualCategory = {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  articleCount?: number;
};

export interface HealthRecord {
  id: string;
  petId: string;
  type: RecordType;
  title: string;
  description?: string;
  date: string;
  notes?: string;
  attachedFile?: string;
  voiceTranscription?: string;
  pdfUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  // Extended properties for health record store
  content?: string;
  tags?: string[];
  pdfFileName?: string;
  isImportant?: boolean;
  attachments?: string[];
  voiceDuration?: number;
}

export interface HealthTag {
  id: string;
  name: string;
  color?: string;
  icon?: string;
}

export interface Reminder {
  id: string;
  petId?: string;
  title: string;
  description?: string;
  type: ReminderType;
  date: string;
  completed: boolean;
  createdAt: string;
}

export interface HealthArticle {
  id: string;
  categoryId: string;
  title: string;
  summary: string;
  content?: string;
  tags?: string[];
  updatedAt: string;
  author?: string;
}

export const RECORD_TYPE_LABELS: Record<RecordType, string> = {
  checkup: '体检',
  vaccination: '疫苗接种',
  medication: '用药',
  surgery: '手术',
  lab: '化验检查',
  weight: '体重记录',
  dental: '牙齿护理',
  grooming: '美容',
  emergency: '紧急情况',
  pdf: 'PDF文档',
  text: '文字记录',
  photo: '照片记录',
  voice: '语音记录',
  video: '视频记录',
  file: '文件记录',
};

export const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  vaccination: '疫苗接种',
  medication: '用药',
  checkup: '体检',
  grooming: '美容',
  feeding: '喂食',
  other: '其他',
};

export const DEFAULT_TAGS: HealthTag[] = [
  { id: 'abnormal', name: '异常', color: '#ef4444' },
  { id: 'food', name: '饮食', color: '#f97316' },
  { id: 'checkup', name: '体检', color: '#22c55e' },
  { id: 'medicine', name: '用药', color: '#3b82f6' },
  { id: 'vaccine', name: '疫苗', color: '#8b5cf6' },
];
