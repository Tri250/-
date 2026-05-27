// ============================================
// PawSync Pro 3.0 - Audio Recognition Service
//
// 作者: 带娃的小陈工
// 日期: 2026-05-27
// 描述: 声音识别引擎 - YAMNet TFLite集成 + 情绪分类器
// ============================================

import type { AudioEvent, SoundEmotion, AudioAnalysis, YAMNetCategory } from '../types/audio';

const MOCK_DELAY = 500;

// YAMNet 521类中与动物相关的类别索引
const ANIMAL_SOUND_CATEGORIES: Record<number, YAMNetCategory> = {
  0: { index: 0, name: 'Speech', displayName: '语音', isAnimal: false },
  3: { index: 3, name: 'Bark', displayName: '狗吠', isAnimal: true },
  5: { index: 5, name: 'Meow', displayName: '猫叫', isAnimal: true },
  8: { index: 8, name: 'Growl', displayName: '低吼', isAnimal: true },
  12: { index: 12, name: 'Howl', displayName: '嚎叫', isAnimal: true },
  15: { index: 15, name: 'Whimper', displayName: '呜咽', isAnimal: true },
  20: { index: 20, name: 'Purr', displayName: '呼噜', isAnimal: true },
  25: { index: 25, name: 'Hiss', displayName: '嘶嘶', isAnimal: true },
  30: { index: 30, name: 'Screech', displayName: '尖叫', isAnimal: true },
  35: { index: 35, name: 'Chirp', displayName: '啁啾', isAnimal: true },
};

// 声音情绪配置
const emotionConfig: Record<SoundEmotion, {
  label: string;
  emoji: string;
  color: string;
  description: string;
}> = {
  happy: {
    label: '愉悦',
    emoji: '🟢',
    color: '#22C55E',
    description: '开心的叫声、呼噜声，表示宠物心情愉悦'
  },
  anxious: {
    label: '焦躁',
    emoji: '🟡',
    color: '#EAB308',
    description: '呜咽、频繁叫声，表示宠物感到不安'
  },
  fear: {
    label: '焦虑/恐惧',
    emoji: '🟠',
    color: '#F97316',
    description: '高音叫声、颤抖，表示宠物感到害怕'
  },
  pain: {
    label: '痛苦/不适',
    emoji: '🔴',
    color: '#EF4444',
    description: '痛苦的叫声、呻吟，表示宠物可能受伤'
  },
  neutral: {
    label: '中性',
    emoji: '⚪',
    color: '#6B7280',
    description: '正常的叫声，没有明显情绪表达'
  }
};

class AudioRecognitionService {
  private audioEvents: AudioEvent[] = [];
  private eventCallbacks: Array<(event: AudioEvent) => void> = [];
  private isListening = false;
  private analysisHistory: AudioAnalysis[] = [];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    const emotions: SoundEmotion[] = ['happy', 'neutral', 'anxious', 'happy', 'neutral'];
    const categories = Object.values(ANIMAL_SOUND_CATEGORIES).filter(c => c.isAnimal);

    for (let i = 0; i < 10; i++) {
      const emotion = emotions[i % emotions.length];
      const category = categories[Math.floor(Math.random() * categories.length)];
      
      this.audioEvents.push({
        id: `audio-event-${i}`,
        petId: '1',
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        category: category.name,
        categoryIndex: category.index,
        confidence: 0.6 + Math.random() * 0.35,
        emotion,
        emotionConfidence: 0.7 + Math.random() * 0.25,
        duration: `${Math.floor(1 + Math.random() * 5)}秒`,
        description: this.generateDescription(category, emotion),
        audioClipUrl: `/audio/clips/${Date.now() - i * 3600000}.wav`
      });
    }
  }

  private generateDescription(category: YAMNetCategory, emotion: SoundEmotion): string {
    const descriptions: Record<string, Record<string, string[]>> = {
      Bark: {
        happy: ['狗狗开心地叫着，可能看到了主人', '兴奋的吠叫声'],
        anxious: ['狗狗焦躁地吠叫，可能想出去玩', '有点紧张的叫声'],
        fear: ['狗狗害怕地吠叫，可能看到了陌生人', '紧张的吠叫声'],
        pain: ['狗狗痛苦地叫着，可能受伤了', '痛苦的吠叫声'],
        neutral: ['狗狗正常地叫了一声', '普通的吠叫声']
      },
      Meow: {
        happy: ['猫咪开心地叫着，可能想要玩耍', '愉悦的喵喵声'],
        anxious: ['猫咪焦躁地叫着，可能饿了', '有点不耐烦的叫声'],
        fear: ['猫咪害怕地叫着，可能受到惊吓', '害怕的叫声'],
        pain: ['猫咪痛苦地叫着，可能不舒服', '痛苦的叫声'],
        neutral: ['猫咪正常地叫了一声', '普通的喵喵声']
      },
      Purr: {
        happy: ['猫咪开心地呼噜着，表示很满足', '满足的呼噜声'],
        anxious: ['猫咪有点紧张地呼噜着', '轻微紧张的呼噜'],
        fear: ['猫咪害怕时发出的呼噜', '害怕的呼噜声'],
        pain: ['猫咪可能有点不舒服', '不太对劲的呼噜'],
        neutral: ['猫咪放松地呼噜着', '放松的呼噜声']
      },
      Growl: {
        happy: ['狗狗玩耍时的低吼，表示兴奋', '玩耍时的低吼'],
        anxious: ['狗狗有点紧张地低吼', '紧张的低吼'],
        fear: ['狗狗害怕地低吼着', '害怕的低吼'],
        pain: ['狗狗痛苦地低吼', '痛苦的低吼'],
        neutral: ['狗狗发出低吼警告', '警告性低吼']
      }
    };

    const catDescriptions = descriptions[category.name] || descriptions.Meow;
    const emotionDescriptions = catDescriptions[emotion] || catDescriptions.neutral;
    return emotionDescriptions[Math.floor(Math.random() * emotionDescriptions.length)];
  }

  // 初始化音频识别
  async initialize(): Promise<void> {
    await this.simulateDelay(MOCK_DELAY);
    console.log('Audio recognition service initialized');
  }

  // 开始监听
  async startListening(petId: string): Promise<void> {
    await this.simulateDelay(MOCK_DELAY);
    this.isListening = true;
    console.log(`Started listening for pet ${petId}`);
    
    // 模拟定期分析
    this.simulateAudioAnalysis(petId);
  }

  // 停止监听
  async stopListening(): Promise<void> {
    await this.simulateDelay(200);
    this.isListening = false;
    console.log('Stopped listening');
  }

  // 模拟音频分析流程
  private async simulateAudioAnalysis(petId: string) {
    while (this.isListening) {
      await this.simulateDelay(2000 + Math.random() * 3000);
      
      if (!this.isListening) break;

      const categories = Object.values(ANIMAL_SOUND_CATEGORIES).filter(c => c.isAnimal);
      const category = categories[Math.floor(Math.random() * categories.length)];
      const emotions: SoundEmotion[] = ['happy', 'neutral', 'anxious', 'fear', 'pain'];
      const emotion = emotions[Math.floor(Math.random() * emotions.length)];

      const analysis: AudioAnalysis = {
        id: `analysis-${Date.now()}`,
        petId,
        timestamp: new Date().toISOString(),
        category: category.name,
        categoryIndex: category.index,
        confidence: 0.5 + Math.random() * 0.45,
        rawScores: this.generateMockScores(),
        duration: Math.random() * 2
      };

      this.analysisHistory.unshift(analysis);
      if (this.analysisHistory.length > 100) {
        this.analysisHistory.pop();
      }

      // 只有置信度足够高时才生成事件
      if (analysis.confidence > 0.6) {
        const event = await this.createAudioEvent(petId, category, emotion, analysis.confidence);
        this.notifyEvent(event);
      }
    }
  }

  // 生成模拟的YAMNet分数
  private generateMockScores(): Record<number, number> {
    const scores: Record<number, number> = {};
    const animalIndices = Object.keys(ANIMAL_SOUND_CATEGORIES).map(Number);
    
    animalIndices.forEach(index => {
      scores[index] = Math.random() * 0.5;
    });

    const targetIndex = animalIndices[Math.floor(Math.random() * animalIndices.length)];
    scores[targetIndex] = 0.7 + Math.random() * 0.3;

    return scores;
  }

  // 分析音频数据
  async analyzeAudio(audioData: Float32Array, sampleRate: number = 16000): Promise<AudioAnalysis> {
    await this.simulateDelay(MOCK_DELAY);

    const duration = audioData.length / sampleRate;
    
    const categories = Object.values(ANIMAL_SOUND_CATEGORIES).filter(c => c.isAnimal);
    const category = categories[Math.floor(Math.random() * categories.length)];
    const confidence = 0.5 + Math.random() * 0.45;

    const analysis: AudioAnalysis = {
      id: `analysis-${Date.now()}`,
      petId: '1',
      timestamp: new Date().toISOString(),
      category: category.name,
      categoryIndex: category.index,
      confidence,
      rawScores: this.generateMockScores(),
      duration
    };

    this.analysisHistory.unshift(analysis);
    if (this.analysisHistory.length > 100) {
      this.analysisHistory.pop();
    }

    return analysis;
  }

  // 情绪分类
  async classifyEmotion(analysis: AudioAnalysis): Promise<{ emotion: SoundEmotion; confidence: number }> {
    await this.simulateDelay(300);

    const emotionMap: Record<string, SoundEmotion[]> = {
      Bark: ['happy', 'anxious', 'fear', 'neutral'],
      Meow: ['happy', 'anxious', 'fear', 'pain', 'neutral'],
      Purr: ['happy', 'neutral', 'anxious'],
      Growl: ['fear', 'anxious', 'neutral', 'happy'],
      Whimper: ['pain', 'fear', 'anxious'],
      Howl: ['anxious', 'happy', 'fear'],
      Hiss: ['fear', 'anxious', 'neutral'],
      Screech: ['pain', 'fear', 'anxious']
    };

    const possibleEmotions = emotionMap[analysis.category] || ['neutral', 'happy', 'anxious'];
    const emotion = possibleEmotions[Math.floor(Math.random() * possibleEmotions.length)];
    const confidence = 0.65 + Math.random() * 0.3;

    return { emotion, confidence };
  }

  // 创建音频事件
  async createAudioEvent(
    petId: string,
    category: YAMNetCategory,
    emotion: SoundEmotion,
    confidence: number
  ): Promise<AudioEvent> {
    await this.simulateDelay(200);

    const event: AudioEvent = {
      id: `audio-event-${Date.now()}`,
      petId,
      timestamp: new Date().toISOString(),
      category: category.name,
      categoryIndex: category.index,
      confidence,
      emotion,
      emotionConfidence: 0.7 + Math.random() * 0.25,
      duration: `${Math.floor(1 + Math.random() * 5)}秒`,
      description: this.generateDescription(category, emotion),
      audioClipUrl: `/audio/clips/${Date.now()}.wav`
    };

    this.audioEvents.unshift(event);
    if (this.audioEvents.length > 100) {
      this.audioEvents.pop();
    }

    return event;
  }

  // 获取音频事件列表
  async getAudioEvents(petId: string, limit: number = 20): Promise<AudioEvent[]> {
    await this.simulateDelay(300);
    return this.audioEvents.filter(e => e.petId === petId).slice(0, limit);
  }

  // 获取分析历史
  async getAnalysisHistory(petId: string, limit: number = 50): Promise<AudioAnalysis[]> {
    await this.simulateDelay(200);
    return this.analysisHistory.filter(a => a.petId === petId).slice(0, limit);
  }

  // 获取情绪统计
  async getEmotionStatistics(petId: string, hours: number = 24): Promise<Record<SoundEmotion, number>> {
    await this.simulateDelay(300);

    const result: Record<SoundEmotion, number> = {
      happy: 0,
      anxious: 0,
      fear: 0,
      pain: 0,
      neutral: 0
    };

    const cutoffTime = Date.now() - hours * 3600000;
    const recentEvents = this.audioEvents.filter(
      e => e.petId === petId && new Date(e.timestamp).getTime() > cutoffTime
    );

    recentEvents.forEach(event => {
      result[event.emotion]++;
    });

    return result;
  }

  // 检测异常声音频率
  async detectAbnormalFrequency(petId: string, hours: number = 1): Promise<{
    hasAbnormality: boolean;
    severity: 'low' | 'medium' | 'high';
    message: string;
    baseline: number;
    current: number;
  }> {
    await this.simulateDelay(MOCK_DELAY);

    const cutoffTime = Date.now() - hours * 3600000;
    const recentEvents = this.audioEvents.filter(
      e => e.petId === petId && new Date(e.timestamp).getTime() > cutoffTime
    );

    const baseline = 3;
    const current = recentEvents.length;
    const ratio = current / baseline;

    let hasAbnormality = false;
    let severity: 'low' | 'medium' | 'high' = 'low';
    let message = '';

    if (ratio > 3) {
      hasAbnormality = true;
      severity = 'high';
      message = `异常！声音频率是正常基线的${ratio.toFixed(1)}倍，宠物可能处于不安状态`;
    } else if (ratio > 2) {
      hasAbnormality = true;
      severity = 'medium';
      message = `注意！声音频率高于正常基线${ratio.toFixed(1)}倍，建议观察`;
    } else if (current === 0) {
      hasAbnormality = true;
      severity = 'low';
      message = '过去1小时内未检测到宠物声音，请注意观察';
    } else {
      message = '声音频率正常';
    }

    return { hasAbnormality, severity, message, baseline, current };
  }

  // 获取情绪配置
  getEmotionConfig(emotion: SoundEmotion) {
    return emotionConfig[emotion];
  }

  // 获取所有动物声音类别
  getAnimalCategories(): YAMNetCategory[] {
    return Object.values(ANIMAL_SOUND_CATEGORIES).filter(c => c.isAnimal);
  }

  // 事件订阅
  onAudioEvent(callback: (event: AudioEvent) => void) {
    this.eventCallbacks.push(callback);
  }

  private notifyEvent(event: AudioEvent) {
    this.eventCallbacks.forEach(cb => cb(event));
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const audioRecognitionService = new AudioRecognitionService();