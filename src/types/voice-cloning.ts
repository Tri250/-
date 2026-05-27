// ============================================
// PawSync Pro 3.0 - Voice Cloning Types
//
// 作者: 带娃的小陈工
// 日期: 2026-05-27
// 描述: 声音克隆引擎类型定义
// ============================================

// 克隆声音信息
export interface ClonedVoice {
  id: string;
  petId: string;
  name: string;
  description: string;
  createdAt: string;
  isActive: boolean;
  sampleUrl: string;
  quality: number;
}

// 声音克隆请求
export interface VoiceCloneRequest {
  petId: string;
  petName: string;
  audioData: Float32Array;
  audioDuration: number;
  sampleRate: number;
  name?: string;
}

// 语音合成请求
export interface VoiceSynthesisRequest {
  voiceId: string;
  text: string;
  petName?: string;
}

// 合成结果
export interface SynthesisResult {
  id: string;
  voiceId: string;
  text: string;
  audioUrl: string;
  duration: number;
  createdAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

// 语音模板
export interface VoiceTemplate {
  id: string;
  name: string;
  template: string;
  category: VoiceTemplateCategory;
}

// 语音模板分类
export type VoiceTemplateCategory = 
  | 'feeding'    // 喂食相关
  | 'calling'    // 呼叫
  | 'comfort'    // 安抚
  | 'praise'     // 表扬
  | 'night'      // 睡前
  | 'greeting'   // 问候
  | 'custom';    // 自定义

// 录音质量检测结果
export interface RecordingQualityResult {
  quality: number;
  recommendations: string[];
  isAcceptable: boolean;
}

// 克隆状态
export interface CloneStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}