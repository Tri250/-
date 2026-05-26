// ============================================
// PawSync Pro - emotionService.ts
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 情感分析服务，包含宠物情感识别和翻译
// ============================================

import type { EmotionAnalysis, EmotionDashboard, EmotionDimension, EmotionWaveform, PrimaryEmotion, VoiceAnalysis } from '../types/emotion';

const MOCK_DELAY = 1000;

const emotionConfigs: Record<PrimaryEmotion, { emoji: string; label: string; color: string }> = {
  happy: { emoji: '😸', label: '开心', color: 'text-green-500' },
  curious: { emoji: '🤔', label: '好奇', color: 'text-purple-500' },
  anxious: { emoji: '😰', label: '焦虑', color: 'text-yellow-500' },
  angry: { emoji: '😾', label: '生气', color: 'text-red-500' },
  needs: { emoji: '🥺', label: '有需求', color: 'text-blue-500' },
  calm: { emoji: '😌', label: '平静', color: 'text-gray-500' },
  excited: { emoji: '🎉', label: '兴奋', color: 'text-pink-500' },
  safe: { emoji: '😊', label: '安心', color: 'text-teal-500' },
};

const translations: Record<PrimaryEmotion, string[]> = {
  happy: [
    '主人，我今天超开心的！要不要一起玩呀？',
    '今天心情真好，谢谢主人陪我～',
    '喵～今天阳光真好，我很满足！',
  ],
  curious: [
    '咦，这是什么呀？我想看看！',
    '那边有声音，好奇心被勾起来了～',
    '这个新玩具怎么玩呀？',
  ],
  anxious: [
    '主人，你要去哪里呀？不要离开我太久...',
    '有点紧张，能陪陪我吗？',
    '外面好像有声音，有点害怕...',
  ],
  angry: [
    '哼！你为什么不给我开门！',
    '我生气了！快给我小鱼干！',
    '别碰我！我现在不想理你！',
  ],
  needs: [
    '主人，我饿了，要吃饭饭～',
    '想出去玩玩，放我出去嘛～',
    '好久没梳毛了，帮我梳梳毛吧！',
  ],
  calm: [
    '今天天气不错呢...',
    '我在思考猫生...',
    '嗯...就这样吧。',
  ],
  excited: [
    '太棒了！有新零食吃吗？！',
    '耶耶耶！要出门了吗？！',
    '好开心好开心！转圈圈！',
  ],
  safe: [
    '有主人在身边真好，超级安心～',
    '这里好温暖，我不想动啦～',
    '今天又是平安的一天呢～',
  ],
};

class EmotionService {
  private recentAnalyses: EmotionAnalysis[] = [];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    const emotions: PrimaryEmotion[] = ['happy', 'curious', 'calm', 'needs'];
    for (let i = 0; i < 5; i++) {
      const emotion = emotions[Math.floor(Math.random() * emotions.length)];
      this.recentAnalyses.push({
        id: `analysis-${i}`,
        petId: '1',
        primaryEmotion: emotion,
        intensity: 60 + Math.floor(Math.random() * 40),
        confidence: 80 + Math.floor(Math.random() * 19),
        subEmotions: [emotion],
        translation: translations[emotion][0],
        context: {
          timeContext: i === 0 ? '刚刚' : `${i * 2}小时前`,
          locationContext: '家中',
        },
        createdAt: new Date(Date.now() - i * 7200000).toISOString(),
        source: 'voice',
      });
    }
  }

  async analyzeVoice(audioData: Float32Array): Promise<EmotionAnalysis> {
    await this.simulateDelay(MOCK_DELAY);
    
    const voiceAnalysis = this.analyzeVoiceCharacteristics(audioData);
    const emotion = this.determineEmotion(voiceAnalysis);
    
    const analysis: EmotionAnalysis = {
      id: `analysis-${Date.now()}`,
      petId: '1',
      primaryEmotion: emotion,
      intensity: Math.floor(50 + Math.random() * 50),
      confidence: Math.floor(75 + Math.random() * 24),
      subEmotions: [emotion],
      translation: this.getRandomTranslation(emotion),
      context: {
        timeContext: '刚刚',
        locationContext: '家中',
      },
      createdAt: new Date().toISOString(),
      source: 'voice',
    };

    this.recentAnalyses.unshift(analysis);
    if (this.recentAnalyses.length > 20) {
      this.recentAnalyses.pop();
    }

    return analysis;
  }

  async analyzeEmotion(imageData: ImageData): Promise<EmotionAnalysis> {
    await this.simulateDelay(1500);
    
    const emotions: PrimaryEmotion[] = ['happy', 'curious', 'calm', 'safe', 'excited'];
    const emotion = emotions[Math.floor(Math.random() * emotions.length)];
    
    const analysis: EmotionAnalysis = {
      id: `analysis-${Date.now()}`,
      petId: '1',
      primaryEmotion: emotion,
      intensity: Math.floor(60 + Math.random() * 40),
      confidence: Math.floor(70 + Math.random() * 29),
      subEmotions: [emotion],
      translation: this.getRandomTranslation(emotion),
      context: {
        timeContext: '刚刚',
        locationContext: '家中',
      },
      createdAt: new Date().toISOString(),
      source: 'image',
    };

    this.recentAnalyses.unshift(analysis);
    return analysis;
  }

  async getDashboard(): Promise<EmotionDashboard> {
    await this.simulateDelay(500);
    
    const latest = this.recentAnalyses[0] || {
      primaryEmotion: 'calm' as PrimaryEmotion,
      intensity: 50,
      confidence: 70,
    };

    return {
      centralEmotion: latest.primaryEmotion,
      intensity: latest.intensity,
      confidence: latest.confidence,
      dimensions: {
        excitement: Math.floor(Math.random() * 100),
        anxiety: Math.floor(Math.random() * 50),
        affection: 60 + Math.floor(Math.random() * 40),
        curiosity: Math.floor(Math.random() * 80),
      },
      recentHistory: this.recentAnalyses.slice(0, 5),
      trends: {
        direction: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
        change: Math.floor(Math.random() * 20) - 10,
      },
    };
  }

  async getEmotionDimensions(): Promise<EmotionDimension[]> {
    await this.simulateDelay(300);
    
    return [
      { name: 'excitement', value: 65, label: '兴奋度', icon: '⚡', color: 'text-yellow-500' },
      { name: 'anxiety', value: 25, label: '焦虑度', icon: '😰', color: 'text-orange-500' },
      { name: 'affection', value: 78, label: '亲密度', icon: '💕', color: 'text-pink-500' },
      { name: 'curiosity', value: 45, label: '好奇心', icon: '🔍', color: 'text-purple-500' },
    ];
  }

  async getWaveformData(duration: number = 10): Promise<EmotionWaveform[]> {
    await this.simulateDelay(200);
    
    const samples = duration * 10;
    const waveform: EmotionWaveform[] = [];
    
    for (let i = 0; i < samples; i++) {
      waveform.push({
        timestamp: i / 10,
        amplitude: Math.sin(i * 0.5) * 0.5 + Math.random() * 0.5,
        frequency: 2 + Math.random() * 4,
      });
    }
    
    return waveform;
  }

  async getRecentAnalyses(limit: number = 10): Promise<EmotionAnalysis[]> {
    await this.simulateDelay(300);
    return this.recentAnalyses.slice(0, limit);
  }

  getEmotionConfig(emotion: PrimaryEmotion) {
    return emotionConfigs[emotion];
  }

  private analyzeVoiceCharacteristics(audioData: Float32Array): VoiceAnalysis {
    let sum = 0;
    let max = 0;
    let min = Infinity;

    for (let i = 0; i < audioData.length; i++) {
      const value = Math.abs(audioData[i]);
      sum += value;
      max = Math.max(max, value);
      min = Math.min(min, value);
    }

    return {
      pitch: Math.floor(200 + Math.random() * 400),
      intensity: Math.floor(sum / audioData.length * 100),
      frequency: Math.floor(100 + Math.random() * 200),
      duration: Math.floor(audioData.length / 44100),
      quality: Math.floor(70 + Math.random() * 29),
    };
  }

  private determineEmotion(voiceAnalysis: VoiceAnalysis): PrimaryEmotion {
    const emotions: PrimaryEmotion[] = ['happy', 'curious', 'anxious', 'angry', 'needs', 'calm', 'excited', 'safe'];
    
    if (voiceAnalysis.intensity > 80 && voiceAnalysis.pitch > 500) {
      return 'excited';
    } else if (voiceAnalysis.intensity > 70) {
      return 'happy';
    } else if (voiceAnalysis.frequency < 150) {
      return 'calm';
    } else if (voiceAnalysis.pitch < 300) {
      return 'anxious';
    } else {
      return emotions[Math.floor(Math.random() * emotions.length)];
    }
  }

  private getRandomTranslation(emotion: PrimaryEmotion): string {
    const translationsForEmotion = translations[emotion];
    return translationsForEmotion[Math.floor(Math.random() * translationsForEmotion.length)];
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const emotionService = new EmotionService();
