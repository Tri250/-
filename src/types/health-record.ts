// 健康记录相关类型

export type RecordType = 'text' | 'voice' | 'photo' | 'video' | 'file';

export interface HealthTag {
  id: string;
  name: string;
  color: string;
}

export interface HealthRecord {
  id: string;
  petId: string;
  type: RecordType;
  title: string;
  content: string;
  tags: string[];
  attachments?: string[];
  voiceDuration?: number;
  voiceTranscription?: string;
  pdfFileName?: string;
  createdAt: string;
  updatedAt: string;
  isImportant: boolean;
}

export const DEFAULT_TAGS: HealthTag[] = [
  { id: 'vomit', name: '呕吐', color: '#FF6B6B' },
  { id: 'diarrhea', name: '腹泻', color: '#FFA94D' },
  { id: 'medicine', name: '用药', color: '#4DABF7' },
  { id: 'abnormal', name: '异常', color: '#F59E0B' },
  { id: 'vaccine', name: '疫苗', color: '#10B981' },
  { id: 'checkup', name: '体检', color: '#8B5CF6' },
  { id: 'grooming', name: '美容', color: '#EC4899' },
  { id: 'food', name: '饮食', color: '#0E9CE5' },
];
