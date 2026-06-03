// ============================================
// PawSync Pro 3.0 - Voice Cloning Service
//
// 作者: 带娃的小陈工
// 日期: 2026-05-27
// 描述: 声音克隆引擎（Coqui TTS集成）
// ============================================

import type { ClonedVoice, VoiceCloneRequest, VoiceSynthesisRequest, SynthesisResult, VoiceTemplate } from '../types/voice-cloning';

const MOCK_DELAY = 1000;

// 预设语音模板
const voiceTemplates: VoiceTemplate[] = [
  { id: 't1', name: '呼叫吃饭', template: '{petName}，来吃饭啦！', category: 'feeding' },
  { id: 't2', name: '呼叫回家', template: '{petName}，快回来！', category: 'calling' },
  { id: 't3', name: '安抚安慰', template: '{petName}，别怕，妈妈在这儿。', category: 'comfort' },
  { id: 't4', name: '表扬鼓励', template: '{petName}真棒！真乖！', category: 'praise' },
  { id: 't5', name: '睡前晚安', template: '{petName}，晚安啦，做个好梦。', category: 'night' },
  { id: 't6', name: '日常问候', template: '{petName}，今天过得开心吗？', category: 'greeting' }
];

// 模拟已克隆的声音数据
const mockClonedVoices: ClonedVoice[] = [
  {
    id: 'voice-1',
    petId: '1',
    name: 'Mimi的叫声',
    description: '从15秒录音克隆',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    isActive: true,
    sampleUrl: '/api/audio/sample/voice-1.mp3',
    quality: 0.85
  },
  {
    id: 'voice-2',
    petId: '1',
    name: '小旺财的声音',
    description: '从20秒录音克隆',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    isActive: true,
    sampleUrl: '/api/audio/sample/voice-2.mp3',
    quality: 0.78
  }
];

class VoiceCloningService {
  private clonedVoices: ClonedVoice[] = [...mockClonedVoices];
  private synthesisHistory: SynthesisResult[] = [];

  constructor() {}

  // 克隆声音
  async cloneVoice(request: VoiceCloneRequest): Promise<ClonedVoice> {
    await this.simulateDelay(MOCK_DELAY);

    const newVoice: ClonedVoice = {
      id: `voice-${Date.now()}`,
      petId: request.petId,
      name: request.name || `${request.petName}的声音`,
      description: `从${request.audioDuration || 15}秒录音克隆`,
      createdAt: new Date().toISOString(),
      isActive: true,
      sampleUrl: `/api/audio/sample/voice-${Date.now()}.mp3`,
      quality: 0.75 + Math.random() * 0.2
    };

    this.clonedVoices.push(newVoice);
    return newVoice;
  }

  // 获取宠物的所有克隆声音
  async getPetVoices(petId: string): Promise<ClonedVoice[]> {
    await this.simulateDelay(300);
    return this.clonedVoices.filter(v => v.petId === petId);
  }

  // 获取所有克隆声音
  async getAllVoices(): Promise<ClonedVoice[]> {
    await this.simulateDelay(300);
    return this.clonedVoices;
  }

  // 获取单个声音详情
  async getVoiceById(voiceId: string): Promise<ClonedVoice | null> {
    await this.simulateDelay(200);
    return this.clonedVoices.find(v => v.id === voiceId) || null;
  }

  // 更新声音信息
  async updateVoice(voiceId: string, updates: Partial<Pick<ClonedVoice, 'name' | 'description' | 'isActive'>>): Promise<ClonedVoice | null> {
    await this.simulateDelay(200);
    
    const index = this.clonedVoices.findIndex(v => v.id === voiceId);
    if (index === -1) return null;

    this.clonedVoices[index] = { ...this.clonedVoices[index], ...updates };
    return this.clonedVoices[index];
  }

  // 删除声音
  async deleteVoice(voiceId: string): Promise<boolean> {
    await this.simulateDelay(200);
    
    const initialLength = this.clonedVoices.length;
    this.clonedVoices = this.clonedVoices.filter(v => v.id !== voiceId);
    return this.clonedVoices.length < initialLength;
  }

  // 合成语音
  async synthesize(request: VoiceSynthesisRequest): Promise<SynthesisResult> {
    await this.simulateDelay(MOCK_DELAY);

    // 替换模板变量
    let text = request.text;
    if (request.petName) {
      text = text.replace(/{petName}/g, request.petName);
    }

    const result: SynthesisResult = {
      id: `synth-${Date.now()}`,
      voiceId: request.voiceId,
      text,
      audioUrl: `/api/audio/synth/${Date.now()}.mp3`,
      duration: Math.floor(text.length * 0.15) + Math.floor(Math.random() * 2),
      createdAt: new Date().toISOString(),
      status: 'completed'
    };

    this.synthesisHistory.unshift(result);
    if (this.synthesisHistory.length > 50) {
      this.synthesisHistory.pop();
    }

    return result;
  }

  // 获取合成历史
  async getSynthesisHistory(petId?: string): Promise<SynthesisResult[]> {
    await this.simulateDelay(200);
    
    let history = [...this.synthesisHistory];
    if (petId) {
      history = history.filter(async (item) => {
        const voice = await this.getVoiceById(item.voiceId);
        return voice?.petId === petId;
      });
    }
    
    return history.slice(0, 20);
  }

  // 获取语音模板
  async getVoiceTemplates(category?: string): Promise<VoiceTemplate[]> {
    await this.simulateDelay(200);
    
    if (category) {
      return voiceTemplates.filter(t => t.category === category);
    }
    return voiceTemplates;
  }

  // 添加自定义模板
  async addVoiceTemplate(template: Omit<VoiceTemplate, 'id'>): Promise<VoiceTemplate> {
    await this.simulateDelay(200);

    const newTemplate: VoiceTemplate = {
      ...template,
      id: `template-${Date.now()}`
    };

    voiceTemplates.push(newTemplate);
    return newTemplate;
  }

  // 生成随机语音样本URL
  generateSampleUrl(): string {
    return `/api/audio/sample/${Date.now()}.mp3`;
  }

  // 检查录音质量
  async checkRecordingQuality(_audioData: Float32Array, _sampleRate: number): Promise<{
    quality: number;
    recommendations: string[];
    isAcceptable: boolean;
  }> {
    await this.simulateDelay(300);

    // 模拟质量检测
    const quality = 0.6 + Math.random() * 0.35;
    const recommendations: string[] = [];

    if (quality < 0.7) {
      recommendations.push('录音环境噪音较大，建议在安静环境下重新录制');
    }
    if (quality < 0.8) {
      recommendations.push('建议录制更长时间的音频以提高克隆质量');
    }

    return {
      quality: Math.round(quality * 100) / 100,
      recommendations,
      isAcceptable: quality >= 0.7
    };
  }

  // 获取克隆状态
  async getCloneStatus(voiceId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    error?: string;
  }> {
    await this.simulateDelay(200);

    const voice = this.clonedVoices.find(v => v.id === voiceId);
    if (!voice) {
      return { status: 'failed', error: '声音不存在' };
    }

    // 模拟状态
    const random = Math.random();
    if (random < 0.2) return { status: 'pending' };
    if (random < 0.4) return { status: 'processing', progress: 30 + Math.floor(Math.random() * 40) };
    return { status: 'completed', progress: 100 };
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const voiceCloningService = new VoiceCloningService();