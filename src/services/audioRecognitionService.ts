import { PawSyncAudio } from '../plugins';
import type { AudioEvent, SoundEmotion, AudioAnalysis, YAMNetCategory } from '../types/audio';

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

const EMOTION_BY_CATEGORY: Record<string, { high: SoundEmotion; medium: SoundEmotion; low: SoundEmotion }> = {
  Bark: { high: 'happy', medium: 'anxious', low: 'neutral' },
  Meow: { high: 'happy', medium: 'anxious', low: 'neutral' },
  Purr: { high: 'happy', medium: 'neutral', low: 'anxious' },
  Growl: { high: 'fear', medium: 'anxious', low: 'neutral' },
  Whimper: { high: 'pain', medium: 'fear', low: 'anxious' },
  Howl: { high: 'anxious', medium: 'happy', low: 'fear' },
  Hiss: { high: 'fear', medium: 'anxious', low: 'neutral' },
  Screech: { high: 'pain', medium: 'fear', low: 'anxious' },
};

class AudioRecognitionService {
  private audioEvents: AudioEvent[] = [];
  private eventCallbacks: Array<(event: AudioEvent) => void> = [];
  private isListening = false;
  private analysisHistory: AudioAnalysis[] = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphoneStream: MediaStream | null = null;
  private dataArray: Uint8Array | null = null;
  private listenInterval: number | null = null;

  async initialize(): Promise<void> {
    console.log('Audio recognition service initialized');
  }

  async startListening(petId: string): Promise<void> {
    if (this.isListening) return;
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const source = this.audioContext.createMediaStreamSource(this.microphoneStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.8;
      
      source.connect(this.analyser);
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      this.isListening = true;
      console.log(`Started listening for pet ${petId}`);
      
      this.startAudioAnalysisLoop(petId);
    } catch (error) {
      console.warn('Failed to access microphone, using native fallback:', error);
      this.startNativeAudioListening(petId);
    }
  }

  private async startNativeAudioListening(petId: string) {
    this.isListening = true;
    
    try {
      await PawSyncAudio.startRecording();
    } catch (error) {
      console.warn('Failed to start native recording:', error);
    }

    this.listenInterval = window.setInterval(async () => {
      if (!this.isListening) return;

      try {
        const result = await PawSyncAudio.getAudioLevel();
        const level = result.level ?? 0;
        
        if (level > 30) {
          await this.performNativeAudioAnalysis(petId);
        }
      } catch (error) {
        console.warn('Native audio analysis failed:', error);
      }
    }, 2000);
  }

  private startAudioAnalysisLoop(petId: string) {
    const analyze = async () => {
      if (!this.isListening || !this.analyser || !this.dataArray) return;

      this.analyser.getByteFrequencyData(this.dataArray);
      
      const avgVolume = this.calculateAverageVolume();
      if (avgVolume > 15) {
        await this.performRealTimeAnalysis(petId);
      }
      
      requestAnimationFrame(analyze);
    };
    
    analyze();
  }

  private calculateAverageVolume(): number {
    if (!this.dataArray) return 0;
    
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    return sum / this.dataArray.length;
  }

  private async performRealTimeAnalysis(petId: string): Promise<void> {
    if (!this.dataArray) return;

    const float32Data = new Float32Array(this.dataArray.length);
    for (let i = 0; i < this.dataArray.length; i++) {
      float32Data[i] = (this.dataArray[i] - 128) / 128;
    }

    const analysis = await this.analyzeAudio(float32Data, 44100);
    
    if (analysis.confidence > 0.55) {
      const emotionResult = await this.classifyEmotion(analysis);
      const event = await this.createAudioEvent(petId, emotionResult.emotion, analysis);
      this.notifyEvent(event);
    }
  }

  private async performNativeAudioAnalysis(petId: string): Promise<void> {
    try {
      const result = await PawSyncAudio.analyzeAudio({
        data: [],
        sampleRate: 44100,
        petType: 'dog',
      });

      const categoryIndex = result.categoryIndex ?? 3;
      const category = ANIMAL_SOUND_CATEGORIES[categoryIndex] || ANIMAL_SOUND_CATEGORIES[3];
      
      const analysis: AudioAnalysis = {
        id: `analysis-${Date.now()}`,
        petId,
        timestamp: new Date().toISOString(),
        category: category.name,
        categoryIndex: category.index,
        confidence: result.confidence ?? 0.7,
        rawScores: { [category.index]: result.confidence ?? 0.7 },
        duration: 1,
      };

      this.analysisHistory.unshift(analysis);
      if (this.analysisHistory.length > 100) {
        this.analysisHistory.pop();
      }

      if (analysis.confidence > 0.55) {
        const emotionResult = await this.classifyEmotion(analysis);
        const event = await this.createAudioEvent(petId, emotionResult.emotion, analysis);
        this.notifyEvent(event);
      }
    } catch (error) {
      console.warn('Native audio analysis failed:', error);
    }
  }

  async stopListening(): Promise<void> {
    this.isListening = false;

    if (this.listenInterval) {
      clearInterval(this.listenInterval);
      this.listenInterval = null;
    }

    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach(track => track.stop());
      this.microphoneStream = null;
    }

    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    try {
      await PawSyncAudio.stopRecording();
    } catch (error) {
      console.warn('Failed to stop native recording:', error);
    }

    console.log('Stopped listening');
  }

  async analyzeAudio(audioData: Float32Array, sampleRate: number = 16000): Promise<AudioAnalysis> {
    const duration = audioData.length / sampleRate;
    
    const features = this.extractAudioFeatures(audioData, sampleRate);
    const category = this.detectSoundCategory(features);
    
    const analysis: AudioAnalysis = {
      id: `analysis-${Date.now()}`,
      petId: '1',
      timestamp: new Date().toISOString(),
      category: category.name,
      categoryIndex: category.index,
      confidence: category.confidence,
      rawScores: this.generateRawScores(category.index, category.confidence),
      duration,
    };

    this.analysisHistory.unshift(analysis);
    if (this.analysisHistory.length > 100) {
      this.analysisHistory.pop();
    }

    return analysis;
  }

  private extractAudioFeatures(audioData: Float32Array, sampleRate: number): {
    rms: number;
    spectralCentroid: number;
    zeroCrossingRate: number;
    spectralFlux: number;
    dominantFrequency: number;
  } {
    let sumSquares = 0;
    let zeroCrossings = 0;
    
    for (let i = 0; i < audioData.length; i++) {
      sumSquares += audioData[i] * audioData[i];
      if (i > 0 && audioData[i] * audioData[i - 1] < 0) {
        zeroCrossings++;
      }
    }
    
    const rms = Math.sqrt(sumSquares / audioData.length);
    const zeroCrossingRate = zeroCrossings / audioData.length;
    
    const spectrum = this.computeSpectrum(audioData);
    const spectralCentroid = this.calculateSpectralCentroid(spectrum, sampleRate);
    const spectralFlux = this.calculateSpectralFlux(spectrum);
    const dominantFrequency = this.findDominantFrequency(spectrum, sampleRate);

    return { rms, spectralCentroid, zeroCrossingRate, spectralFlux, dominantFrequency };
  }

  private computeSpectrum(audioData: Float32Array): number[] {
    const n = Math.pow(2, Math.ceil(Math.log2(audioData.length)));
    const padded = new Float32Array(n);
    padded.set(audioData);
    
    const spectrum: number[] = [];
    
    for (let k = 0; k < n / 2; k++) {
      let real = 0;
      let imag = 0;
      for (let t = 0; t < n; t++) {
        const angle = (2 * Math.PI * k * t) / n;
        real += padded[t] * Math.cos(angle);
        imag -= padded[t] * Math.sin(angle);
      }
      spectrum.push(Math.sqrt(real * real + imag * imag));
    }
    
    return spectrum;
  }

  private calculateSpectralCentroid(spectrum: number[], sampleRate: number): number {
    let weightedSum = 0;
    let totalEnergy = 0;
    const binWidth = sampleRate / (spectrum.length * 2);
    
    for (let i = 0; i < spectrum.length; i++) {
      weightedSum += i * binWidth * spectrum[i];
      totalEnergy += spectrum[i];
    }
    
    return totalEnergy > 0 ? weightedSum / totalEnergy : 0;
  }

  private calculateSpectralFlux(spectrum: number[]): number {
    let flux = 0;
    for (let i = 1; i < spectrum.length; i++) {
      flux += Math.abs(spectrum[i] - spectrum[i - 1]);
    }
    return flux / spectrum.length;
  }

  private findDominantFrequency(spectrum: number[], sampleRate: number): number {
    const maxIndex = spectrum.indexOf(Math.max(...spectrum));
    return (maxIndex * sampleRate) / (spectrum.length * 2);
  }

  private detectSoundCategory(features: {
    rms: number;
    spectralCentroid: number;
    zeroCrossingRate: number;
    spectralFlux: number;
    dominantFrequency: number;
  }): { name: string; index: number; confidence: number } {
    const animalCategories = Object.values(ANIMAL_SOUND_CATEGORIES).filter(c => c.isAnimal);
    
    let bestCategory = animalCategories[0];
    let bestScore = 0;
    
    for (const category of animalCategories) {
      let score = 0;
      
      switch (category.name) {
        case 'Bark':
          score = features.rms > 0.1 ? 0.3 : 0;
          score += features.dominantFrequency > 300 && features.dominantFrequency < 1500 ? 0.3 : 0;
          score += features.spectralFlux > 0.1 ? 0.2 : 0;
          score += features.zeroCrossingRate > 0.05 ? 0.2 : 0;
          break;
        case 'Meow':
          score = features.dominantFrequency > 500 && features.dominantFrequency < 2000 ? 0.4 : 0;
          score += features.spectralCentroid > 800 ? 0.3 : 0;
          score += features.rms > 0.05 ? 0.2 : 0;
          score += features.zeroCrossingRate > 0.1 ? 0.1 : 0;
          break;
        case 'Purr':
          score = features.rms < 0.08 ? 0.4 : 0;
          score += features.dominantFrequency > 20 && features.dominantFrequency < 150 ? 0.3 : 0;
          score += features.spectralFlux < 0.05 ? 0.3 : 0;
          break;
        case 'Growl':
          score = features.rms > 0.08 ? 0.3 : 0;
          score += features.dominantFrequency < 400 ? 0.4 : 0;
          score += features.spectralFlux < 0.08 ? 0.3 : 0;
          break;
        case 'Whimper':
          score = features.rms < 0.05 ? 0.3 : 0;
          score += features.dominantFrequency > 800 && features.dominantFrequency < 2500 ? 0.4 : 0;
          score += features.zeroCrossingRate > 0.15 ? 0.3 : 0;
          break;
        case 'Howl':
          score = features.rms > 0.06 ? 0.3 : 0;
          score += features.dominantFrequency > 400 && features.dominantFrequency < 1200 ? 0.3 : 0;
          score += features.spectralCentroid > 600 ? 0.4 : 0;
          break;
        case 'Hiss':
          score = features.dominantFrequency > 3000 ? 0.4 : 0;
          score += features.spectralFlux > 0.15 ? 0.3 : 0;
          score += features.zeroCrossingRate > 0.2 ? 0.3 : 0;
          break;
        case 'Screech':
          score = features.dominantFrequency > 2000 ? 0.4 : 0;
          score += features.rms > 0.08 ? 0.3 : 0;
          score += features.spectralFlux > 0.2 ? 0.3 : 0;
          break;
        default:
          score = 0.2 + Math.random() * 0.3;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }
    
    return {
      name: bestCategory.name,
      index: bestCategory.index,
      confidence: Math.min(0.95, 0.5 + bestScore * 0.5),
    };
  }

  private generateRawScores(categoryIndex: number, confidence: number): Record<number, number> {
    const scores: Record<number, number> = {};
    const animalIndices = Object.keys(ANIMAL_SOUND_CATEGORIES).map(Number);
    
    animalIndices.forEach(index => {
      scores[index] = index === categoryIndex ? confidence : Math.random() * 0.4;
    });
    
    return scores;
  }

  async classifyEmotion(analysis: AudioAnalysis): Promise<{ emotion: SoundEmotion; confidence: number }> {
    const config = EMOTION_BY_CATEGORY[analysis.category] || EMOTION_BY_CATEGORY.Bark;
    
    const rmsLevel = analysis.confidence;
    
    let emotion: SoundEmotion;
    let confidence: number;
    
    if (rmsLevel > 0.8) {
      emotion = config.high;
      confidence = 0.85 + Math.random() * 0.14;
    } else if (rmsLevel > 0.6) {
      emotion = config.medium;
      confidence = 0.7 + Math.random() * 0.24;
    } else {
      emotion = config.low;
      confidence = 0.6 + Math.random() * 0.34;
    }
    
    return { emotion, confidence };
  }

  async createAudioEvent(
    petId: string,
    emotion: SoundEmotion,
    analysis: AudioAnalysis
  ): Promise<AudioEvent> {
    const category = ANIMAL_SOUND_CATEGORIES[analysis.categoryIndex];
    
    const event: AudioEvent = {
      id: `audio-event-${Date.now()}`,
      petId,
      timestamp: new Date().toISOString(),
      category: category.name,
      categoryIndex: category.index,
      confidence: analysis.confidence,
      emotion,
      emotionConfidence: 0.7 + Math.random() * 0.25,
      duration: `${Math.floor(analysis.duration * 10) / 10}秒`,
      description: this.generateDescription(category, emotion),
      audioClipUrl: '',
    };

    this.audioEvents.unshift(event);
    if (this.audioEvents.length > 100) {
      this.audioEvents.pop();
    }

    return event;
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

  async getAudioEvents(petId: string, limit: number = 20): Promise<AudioEvent[]> {
    return this.audioEvents.filter(e => e.petId === petId).slice(0, limit);
  }

  async getAnalysisHistory(petId: string, limit: number = 50): Promise<AudioAnalysis[]> {
    return this.analysisHistory.filter(a => a.petId === petId).slice(0, limit);
  }

  async getEmotionStatistics(petId: string, hours: number = 24): Promise<Record<SoundEmotion, number>> {
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

  async detectAbnormalFrequency(petId: string, hours: number = 1): Promise<{
    hasAbnormality: boolean;
    severity: 'low' | 'medium' | 'high';
    message: string;
    baseline: number;
    current: number;
  }> {
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

  getEmotionConfig(emotion: SoundEmotion) {
    return emotionConfig[emotion];
  }

  getAnimalCategories(): YAMNetCategory[] {
    return Object.values(ANIMAL_SOUND_CATEGORIES).filter(c => c.isAnimal);
  }

  onAudioEvent(callback: (event: AudioEvent) => void) {
    this.eventCallbacks.push(callback);
  }

  private notifyEvent(event: AudioEvent) {
    this.eventCallbacks.forEach(cb => cb(event));
  }
}

export const audioRecognitionService = new AudioRecognitionService();