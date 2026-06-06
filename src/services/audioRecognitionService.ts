// ============================================
// PawSync Pro 3.0 - Audio Recognition Service
//
// 作者: 带娃的小陈工
// 日期: 2026-05-27
// 描述: 声音识别引擎 - Web Speech API + 音频特征分析
// ============================================

import type { AudioEvent, SoundEmotion, AudioAnalysis, YAMNetCategory } from '../types/audio';

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

// Web Speech API 类型声明
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

// 音频特征分析结果
interface AudioFeatures {
  rms: number;
  peak: number;
  zeroCrossingRate: number;
  spectralCentroid: number;
  spectralRolloff: number;
  spectralFlux: number;
  mfcc: number[];
}

class AudioRecognitionService {
  private audioEvents: AudioEvent[] = [];
  private eventCallbacks: Array<(event: AudioEvent) => void> = [];
  private isListening = false;
  private analysisHistory: AudioAnalysis[] = [];
  private recognition: SpeechRecognition | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;

  constructor() {
    this.loadHistoryFromStorage();
    this.initializeSpeechRecognition();
  }

  // 从本地存储加载历史
  private loadHistoryFromStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedEvents = localStorage.getItem('audioEvents');
      const savedHistory = localStorage.getItem('audioAnalysisHistory');
      
      if (savedEvents) {
        try {
          this.audioEvents = JSON.parse(savedEvents).slice(0, 100);
        } catch {
          this.audioEvents = [];
        }
      }
      
      if (savedHistory) {
        try {
          this.analysisHistory = JSON.parse(savedHistory).slice(0, 100);
        } catch {
          this.analysisHistory = [];
        }
      }
    }
  }

  // 保存历史到本地存储
  private saveHistoryToStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('audioEvents', JSON.stringify(this.audioEvents.slice(0, 100)));
      localStorage.setItem('audioAnalysisHistory', JSON.stringify(this.analysisHistory.slice(0, 100)));
    }
  }

  // 初始化语音识别
  private initializeSpeechRecognition() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'zh-CN';
        this.recognition.maxAlternatives = 1;
        
        this.recognition.onresult = (event: SpeechRecognitionEvent) => {
          const results = event.results;
          if (results.length > 0) {
            const lastResult = results[results.length - 1];
            if (lastResult.isFinal) {
              const transcript = lastResult[0].transcript;
              const confidence = lastResult[0].confidence;
              this.handleSpeechResult(transcript, confidence);
            }
          }
        };
        
        this.recognition.onerror = (event: Event) => {
          console.error('Speech recognition error:', event);
          this.isListening = false;
        };
        
        this.recognition.onend = () => {
          if (this.isListening) {
            // 如果仍在监听状态，重新启动
            try {
              this.recognition?.start();
            } catch {
              // 忽略重复启动错误
            }
          }
        };
      }
    }
  }

  // 处理语音识别结果
  private handleSpeechResult(transcript: string, confidence: number) {
    // 分析转录文本中的关键词
    const detectedEmotion = this.detectEmotionFromTranscript(transcript);
    const detectedCategory = this.detectCategoryFromTranscript(transcript);
    
    const event: AudioEvent = {
      id: `audio-event-${Date.now()}`,
      petId: '1',
      timestamp: new Date().toISOString(),
      category: detectedCategory.name,
      categoryIndex: detectedCategory.index,
      confidence: confidence,
      emotion: detectedEmotion.emotion,
      emotionConfidence: detectedEmotion.confidence,
      duration: `${Math.floor(transcript.length * 0.2)}秒`,
      description: this.generateDescriptionFromTranscript(transcript, detectedCategory, detectedEmotion.emotion),
      audioClipUrl: undefined,
    };

    this.audioEvents.unshift(event);
    if (this.audioEvents.length > 100) {
      this.audioEvents.pop();
    }
    
    this.saveHistoryToStorage();
    this.notifyEvent(event);
  }

  // 从转录文本检测情感
  private detectEmotionFromTranscript(transcript: string): { emotion: SoundEmotion; confidence: number } {
    const lowerTranscript = transcript.toLowerCase();
    
    // 关键词映射
    const emotionKeywords: Record<SoundEmotion, string[]> = {
      happy: ['开心', '高兴', '快乐', '愉快', '好', '棒', '舒服', '满足', '呼噜', '摇尾巴'],
      anxious: ['担心', '焦虑', '不安', '紧张', '烦躁', '着急', '呜咽', '不安'],
      fear: ['害怕', '恐惧', '怕', '吓', '躲', '抖', '颤抖', '尖叫', '嘶'],
      pain: ['疼', '痛', '难受', '不舒服', '受伤', '病', '痛苦', '呻吟'],
      neutral: ['正常', '一般', '还行', '可以'],
    };
    
    let bestEmotion: SoundEmotion = 'neutral';
    let maxScore = 0;
    
    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      let score = 0;
      for (const keyword of keywords) {
        if (lowerTranscript.includes(keyword)) {
          score += 1;
        }
      }
      if (score > maxScore) {
        maxScore = score;
        bestEmotion = emotion as SoundEmotion;
      }
    }
    
    const confidence = Math.min(0.95, 0.6 + maxScore * 0.1);
    return { emotion: bestEmotion, confidence };
  }

  // 从转录文本检测声音类别
  private detectCategoryFromTranscript(transcript: string): YAMNetCategory {
    const lowerTranscript = transcript.toLowerCase();
    
    const categoryKeywords: Record<string, number> = {
      'Bark': 3,
      'Meow': 5,
      'Growl': 8,
      'Howl': 12,
      'Whimper': 15,
      'Purr': 20,
      'Hiss': 25,
      'Screech': 30,
    };
    
    for (const [category, keywords] of Object.entries({
      'Bark': ['狗', '汪', '吠', '狗叫'],
      'Meow': ['猫', '喵', '猫叫'],
      'Growl': ['吼', '低吼', '咆哮'],
      'Howl': ['嚎', '嚎叫', '狼嚎'],
      'Whimper': ['呜咽', '呜', '啜泣'],
      'Purr': ['呼噜', '咕噜', '打鼾'],
      'Hiss': ['嘶', '嘶嘶', '哈气'],
      'Screech': ['尖叫', '尖声', '惨叫'],
    })) {
      for (const keyword of keywords) {
        if (lowerTranscript.includes(keyword)) {
          return ANIMAL_SOUND_CATEGORIES[categoryKeywords[category]];
        }
      }
    }
    
    // 默认返回Speech类别
    return ANIMAL_SOUND_CATEGORIES[0];
  }

  // 生成描述
  private generateDescriptionFromTranscript(transcript: string, category: YAMNetCategory, emotion: SoundEmotion): string {
    const descriptions: Record<string, Record<string, string[]>> = {
      Bark: {
        happy: ['狗狗开心地叫着', '兴奋的吠叫声', '狗狗很高兴'],
        anxious: ['狗狗焦躁地吠叫', '有点紧张的叫声', '狗狗感到不安'],
        fear: ['狗狗害怕地吠叫', '紧张的吠叫声', '狗狗感到恐惧'],
        pain: ['狗狗痛苦地叫着', '痛苦的吠叫声', '狗狗可能受伤了'],
        neutral: ['狗狗正常地叫了一声', '普通的吠叫声', '狗狗在叫'],
      },
      Meow: {
        happy: ['猫咪开心地叫着', '愉悦的喵喵声', '猫咪很高兴'],
        anxious: ['猫咪焦躁地叫着', '有点不耐烦的叫声', '猫咪感到不安'],
        fear: ['猫咪害怕地叫着', '害怕的叫声', '猫咪感到恐惧'],
        pain: ['猫咪痛苦地叫着', '痛苦的叫声', '猫咪可能不舒服'],
        neutral: ['猫咪正常地叫了一声', '普通的喵喵声', '猫咪在叫'],
      },
      Purr: {
        happy: ['猫咪开心地呼噜着', '满足的呼噜声', '猫咪很满足'],
        anxious: ['猫咪有点紧张地呼噜着', '轻微紧张的呼噜', '猫咪有些不安'],
        fear: ['猫咪害怕时发出的呼噜', '害怕的呼噜声', '猫咪感到恐惧'],
        pain: ['猫咪可能有点不舒服', '不太对劲的呼噜', '猫咪可能受伤了'],
        neutral: ['猫咪放松地呼噜着', '放松的呼噜声', '猫咪在呼噜'],
      },
      Growl: {
        happy: ['狗狗玩耍时的低吼', '玩耍时的低吼', '狗狗在玩耍'],
        anxious: ['狗狗有点紧张地低吼', '紧张的低吼', '狗狗感到不安'],
        fear: ['狗狗害怕地低吼着', '害怕的低吼', '狗狗感到恐惧'],
        pain: ['狗狗痛苦地低吼', '痛苦的低吼', '狗狗可能受伤了'],
        neutral: ['狗狗发出低吼警告', '警告性低吼', '狗狗在低吼'],
      },
    };

    const catDescriptions = descriptions[category.name] || descriptions.Meow;
    const emotionDescriptions = catDescriptions[emotion] || catDescriptions.neutral;
    return emotionDescriptions[0];
  }

  // 初始化音频识别
  async initialize(): Promise<void> {
    // 检查浏览器支持
    if (typeof window === 'undefined') {
      throw new Error('Audio recognition requires browser environment');
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Web Speech API not supported in this browser');
    }
    
    // 初始化音频上下文
    try {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      console.warn('Web Audio API not supported');
    }
    
    console.log('Audio recognition service initialized');
  }

  // 开始监听
  async startListening(petId: string): Promise<void> {
    if (this.isListening) {
      console.log('Already listening');
      return;
    }
    
    this.isListening = true;
    console.log(`Started listening for pet ${petId}`);
    
    // 启动语音识别
    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
    
    // 启动音频特征分析
    await this.startAudioFeatureAnalysis(petId);
  }

  // 停止监听
  async stopListening(): Promise<void> {
    this.isListening = false;
    
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // 忽略停止错误
      }
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.suspend();
    }
    
    console.log('Stopped listening');
  }

  // 启动音频特征分析
  private async startAudioFeatureAnalysis(petId: string): Promise<void> {
    if (!this.audioContext) return;
    
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      
      source.connect(this.analyser);
      
      // 定期分析音频特征
      this.analyzeAudioFeatures(petId);
    } catch (err) {
      console.error('Failed to start audio feature analysis:', err);
    }
  }

  // 分析音频特征
  private analyzeAudioFeatures(petId: string): void {
    if (!this.isListening || !this.analyser) return;
    
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const timeDomainArray = new Uint8Array(bufferLength);
    
    this.analyser.getByteFrequencyData(dataArray);
    this.analyser.getByteTimeDomainData(timeDomainArray);
    
    // 计算音频特征
    const features = this.calculateAudioFeatures(timeDomainArray, dataArray, this.analyser.context.sampleRate);
    
    // 基于特征检测异常声音
    this.detectAnomalousSound(features, petId);
    
    // 继续分析
    if (this.isListening) {
      requestAnimationFrame(() => this.analyzeAudioFeatures(petId));
    }
  }

  // 计算音频特征
  private calculateAudioFeatures(timeDomainData: Uint8Array, frequencyData: Uint8Array, sampleRate: number): AudioFeatures {
    // 转换为Float32Array
    const floatTimeData = new Float32Array(timeDomainData.length);
    for (let i = 0; i < timeDomainData.length; i++) {
      floatTimeData[i] = (timeDomainData[i] - 128) / 128;
    }
    
    // 计算RMS（均方根）
    let sum = 0;
    for (let i = 0; i < floatTimeData.length; i++) {
      sum += floatTimeData[i] * floatTimeData[i];
    }
    const rms = Math.sqrt(sum / floatTimeData.length);
    
    // 计算峰值
    let peak = 0;
    for (let i = 0; i < floatTimeData.length; i++) {
      peak = Math.max(peak, Math.abs(floatTimeData[i]));
    }
    
    // 计算过零率
    let zeroCrossings = 0;
    for (let i = 1; i < floatTimeData.length; i++) {
      if ((floatTimeData[i] >= 0) !== (floatTimeData[i - 1] >= 0)) {
        zeroCrossings++;
      }
    }
    const zeroCrossingRate = zeroCrossings / floatTimeData.length;
    
    // 计算频谱质心
    let spectralSum = 0;
    let weightedSum = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      const frequency = (i * sampleRate) / (2 * frequencyData.length);
      spectralSum += frequencyData[i];
      weightedSum += frequency * frequencyData[i];
    }
    const spectralCentroid = spectralSum > 0 ? weightedSum / spectralSum : 0;
    
    // 计算频谱滚降
    let spectralRolloff = 0;
    const threshold = spectralSum * 0.85;
    let cumulativeSum = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      cumulativeSum += frequencyData[i];
      if (cumulativeSum >= threshold) {
        spectralRolloff = (i * sampleRate) / (2 * frequencyData.length);
        break;
      }
    }
    
    // 简化的MFCC计算（使用频谱包络近似）
    const mfcc = this.calculateSimplifiedMFCC(frequencyData);
    
    return {
      rms,
      peak,
      zeroCrossingRate,
      spectralCentroid,
      spectralRolloff,
      spectralFlux: 0, // 需要前一帧数据
      mfcc,
    };
  }

  // 简化的MFCC计算
  private calculateSimplifiedMFCC(frequencyData: Uint8Array): number[] {
    // 将频谱分为13个频带并计算能量
    const numCoefficients = 13;
    const mfcc: number[] = new Array(numCoefficients).fill(0);
    
    const bandSize = Math.floor(frequencyData.length / numCoefficients);
    
    for (let i = 0; i < numCoefficients; i++) {
      let bandEnergy = 0;
      const start = i * bandSize;
      const end = Math.min((i + 1) * bandSize, frequencyData.length);
      
      for (let j = start; j < end; j++) {
        bandEnergy += frequencyData[j];
      }
      
      // 对数压缩
      mfcc[i] = Math.log(1 + bandEnergy);
    }
    
    return mfcc;
  }

  // 检测异常声音
  private detectAnomalousSound(features: AudioFeatures, petId: string): void {
    // 基于音频特征检测异常
    const isLoud = features.rms > 0.3;
    const isHighPitch = features.spectralCentroid > 2000;
    const isIrregular = features.zeroCrossingRate > 0.15;
    
    // 如果检测到异常声音模式，创建事件
    if (isLoud && isHighPitch) {
      const event: AudioEvent = {
        id: `audio-event-${Date.now()}`,
        petId,
        timestamp: new Date().toISOString(),
        category: 'Screech',
        categoryIndex: 30,
        confidence: features.rms,
        emotion: 'fear',
        emotionConfidence: 0.7 + features.rms * 0.3,
        duration: '1秒',
        description: '检测到高频尖叫声，宠物可能受到惊吓或感到疼痛',
      };
      
      this.audioEvents.unshift(event);
      this.notifyEvent(event);
    } else if (isLoud && features.rms > 0.5) {
      const event: AudioEvent = {
        id: `audio-event-${Date.now()}`,
        petId,
        timestamp: new Date().toISOString(),
        category: 'Bark',
        categoryIndex: 3,
        confidence: features.rms,
        emotion: isIrregular ? 'anxious' : 'neutral',
        emotionConfidence: 0.6,
        duration: '1秒',
        description: isIrregular ? '检测到焦虑的叫声' : '检测到正常的叫声',
      };
      
      this.audioEvents.unshift(event);
      this.notifyEvent(event);
    }
  }

  // 分析音频数据（用于离线分析）
  async analyzeAudio(audioData: Float32Array, sampleRate: number = 16000): Promise<AudioAnalysis> {
    const duration = audioData.length / sampleRate;
    
    // 分析音频特征
    const features = this.analyzeOfflineAudioFeatures(audioData, sampleRate);
    
    // 基于特征分类声音类型
    const category = this.classifySoundType(features);
    
    // 计算置信度
    const confidence = Math.min(0.95, 0.6 + features.rms * 0.3 + (1 - features.zeroCrossingRate) * 0.1);

    const analysis: AudioAnalysis = {
      id: `analysis-${Date.now()}`,
      petId: '1',
      timestamp: new Date().toISOString(),
      category: category.name,
      categoryIndex: category.index,
      confidence,
      rawScores: this.generateRawScores(features),
      duration
    };

    this.analysisHistory.unshift(analysis);
    if (this.analysisHistory.length > 100) {
      this.analysisHistory.pop();
    }
    
    this.saveHistoryToStorage();
    return analysis;
  }

  // 离线音频特征分析
  private analyzeOfflineAudioFeatures(audioData: Float32Array, sampleRate: number): AudioFeatures {
    // 计算RMS
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    const rms = Math.sqrt(sum / audioData.length);
    
    // 计算峰值
    let peak = 0;
    for (let i = 0; i < audioData.length; i++) {
      peak = Math.max(peak, Math.abs(audioData[i]));
    }
    
    // 计算过零率
    let zeroCrossings = 0;
    for (let i = 1; i < audioData.length; i++) {
      if ((audioData[i] >= 0) !== (audioData[i - 1] >= 0)) {
        zeroCrossings++;
      }
    }
    const zeroCrossingRate = zeroCrossings / audioData.length;
    
    // 简化的频谱分析
    const fftSize = 2048;
    const spectrum = this.computeSpectrum(audioData.slice(0, Math.min(fftSize, audioData.length)));
    
    // 计算频谱质心
    let spectralSum = 0;
    let weightedSum = 0;
    for (let i = 0; i < spectrum.length; i++) {
      const frequency = (i * sampleRate) / (2 * spectrum.length);
      spectralSum += spectrum[i];
      weightedSum += frequency * spectrum[i];
    }
    const spectralCentroid = spectralSum > 0 ? weightedSum / spectralSum : 0;
    
    return {
      rms,
      peak,
      zeroCrossingRate,
      spectralCentroid,
      spectralRolloff: 0,
      spectralFlux: 0,
      mfcc: new Array(13).fill(0),
    };
  }

  // 计算频谱
  private computeSpectrum(frame: Float32Array): number[] {
    const n = frame.length;
    const spectrum: number[] = [];

    for (let k = 0; k < n / 2; k++) {
      let real = 0;
      let imag = 0;
      for (let t = 0; t < n; t++) {
        const angle = (2 * Math.PI * k * t) / n;
        real += frame[t] * Math.cos(angle);
        imag -= frame[t] * Math.sin(angle);
      }
      spectrum.push(Math.sqrt(real * real + imag * imag));
    }

    return spectrum;
  }

  // 分类声音类型
  private classifySoundType(features: AudioFeatures): YAMNetCategory {
    // 基于特征分类
    if (features.spectralCentroid > 1500 && features.rms > 0.2) {
      return ANIMAL_SOUND_CATEGORIES[30]; // Screech
    } else if (features.spectralCentroid > 1000 && features.rms > 0.15) {
      return ANIMAL_SOUND_CATEGORIES[3]; // Bark
    } else if (features.spectralCentroid > 800 && features.rms > 0.1) {
      return ANIMAL_SOUND_CATEGORIES[5]; // Meow
    } else if (features.rms < 0.05) {
      return ANIMAL_SOUND_CATEGORIES[20]; // Purr
    }
    
    return ANIMAL_SOUND_CATEGORIES[0]; // Speech
  }

  // 生成原始分数
  private generateRawScores(features: AudioFeatures): Record<number, number> {
    const scores: Record<number, number> = {};
    const animalIndices = Object.keys(ANIMAL_SOUND_CATEGORIES).map(Number);
    
    // 基于特征生成分数
    animalIndices.forEach(index => {
      scores[index] = Math.random() * 0.3;
    });

    // 根据特征选择最可能的类别
    let targetIndex = 0;
    if (features.spectralCentroid > 1500) targetIndex = 30;
    else if (features.spectralCentroid > 1000) targetIndex = 3;
    else if (features.spectralCentroid > 800) targetIndex = 5;
    else if (features.rms < 0.05) targetIndex = 20;
    
    scores[targetIndex] = 0.7 + features.rms * 0.3;

    return scores;
  }

  // 情绪分类
  async classifyEmotion(analysis: AudioAnalysis): Promise<{ emotion: SoundEmotion; confidence: number }> {
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
    
    // 基于置信度和类别选择情感
    let emotion: SoundEmotion = 'neutral';
    
    if (analysis.confidence > 0.8) {
      emotion = possibleEmotions[0]; // 高置信度取第一个
    } else if (analysis.confidence > 0.6) {
      emotion = possibleEmotions[1] || 'neutral';
    } else {
      emotion = possibleEmotions[2] || 'neutral';
    }

    return { emotion, confidence: analysis.confidence };
  }

  // 创建音频事件
  async createAudioEvent(
    petId: string,
    category: YAMNetCategory,
    emotion: SoundEmotion,
    confidence: number
  ): Promise<AudioEvent> {
    const event: AudioEvent = {
      id: `audio-event-${Date.now()}`,
      petId,
      timestamp: new Date().toISOString(),
      category: category.name,
      categoryIndex: category.index,
      confidence,
      emotion,
      emotionConfidence: confidence,
      duration: `${Math.floor(1 + confidence * 5)}秒`,
      description: this.generateDescriptionFromTranscript('', category, emotion),
    };

    this.audioEvents.unshift(event);
    if (this.audioEvents.length > 100) {
      this.audioEvents.pop();
    }
    
    this.saveHistoryToStorage();
    return event;
  }

  // 获取音频事件列表
  async getAudioEvents(petId: string, limit: number = 20): Promise<AudioEvent[]> {
    return this.audioEvents.filter(e => e.petId === petId).slice(0, limit);
  }

  // 获取分析历史
  async getAnalysisHistory(petId: string, limit: number = 50): Promise<AudioAnalysis[]> {
    return this.analysisHistory.filter(a => a.petId === petId).slice(0, limit);
  }

  // 获取情绪统计
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

  // 检测异常声音频率
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

  // 检查浏览器支持
  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  // 获取音频特征（用于可视化）
  getAudioFeatures(): { frequencyData: Uint8Array; timeDomainData: Uint8Array } | null {
    if (!this.analyser) return null;
    
    const bufferLength = this.analyser.frequencyBinCount;
    const frequencyData = new Uint8Array(bufferLength);
    const timeDomainData = new Uint8Array(bufferLength);
    
    this.analyser.getByteFrequencyData(frequencyData);
    this.analyser.getByteTimeDomainData(timeDomainData);
    
    return { frequencyData, timeDomainData };
  }
}

export const audioRecognitionService = new AudioRecognitionService();
