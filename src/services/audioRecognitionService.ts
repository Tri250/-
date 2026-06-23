// ============================================
// PawSync Pro 3.0 - Audio Recognition Service
//
// 描述: 声音识别引擎 - 基于 Web Audio API 的真实频谱分析 + 情绪分类器
// ============================================

import type { AudioEvent, SoundEmotion, AudioAnalysis, YAMNetCategory } from '../types/audio';
import { databaseService, STORE_NAMES } from './databaseService';

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

// 频谱特征接口
interface AudioFeatures {
  spectralCentroid: number;
  spectralFlatness: number;
  zeroCrossingRate: number;
  rmsEnergy: number;
  spectralRolloff: number;
  dominantFrequency: number;
  bandwidth: number;
}

// 声音事件检测阈值
const SOUND_DETECTION_THRESHOLD = 0.015; // RMS 能量阈值
const ANALYSIS_INTERVAL_MS = 500; // 分析间隔
const FFT_SIZE = 2048;

class AudioRecognitionService {
  private audioEvents: AudioEvent[] = [];
  private eventCallbacks: Array<(event: AudioEvent) => void> = [];
  private isListening = false;
  private analysisHistory: AudioAnalysis[] = [];

  // Web Audio API 相关
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private analysisIntervalId: ReturnType<typeof setInterval> | null = null;
  private currentPetId: string = '';

  constructor() {
    this.loadFromDatabase();
  }

  // 从 IndexedDB 加载历史数据
  private async loadFromDatabase(): Promise<void> {
    try {
      await databaseService.init();
      // 加载所有宠物的音频事件和分析（按时间降序）
      const allEvents = await databaseService.getAll<AudioEvent>(STORE_NAMES.AUDIO_EVENTS);
      this.audioEvents = allEvents.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 100);

      const allAnalyses = await databaseService.getByIndex<AudioAnalysis>(STORE_NAMES.EMOTION_ANALYSES, 'source', 'audio');
      this.analysisHistory = allAnalyses.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 100);
    } catch (error) {
      console.warn('[AudioRecognitionService] 加载历史数据失败:', error);
      this.audioEvents = [];
      this.analysisHistory = [];
    }
  }

  // 初始化音频识别
  async initialize(): Promise<void> {
    await databaseService.init();
    await this.loadFromDatabase();
    console.log('Audio recognition service initialized');
  }

  // ============================================
  // 真实音频特征提取
  // ============================================

  /**
   * 从音频采样数据中提取频谱特征
   * 使用 FFT 计算频谱，然后计算各项声学指标
   */
  extractRealAudioFeatures(audioData: Float32Array, sampleRate: number): AudioFeatures {
    const fftSize = audioData.length;

    // 计算 FFT 频谱（幅度谱）
    const spectrum = this.computeFFTSpectrum(audioData);

    // 频谱质心（Spectral Centroid）：频谱能量的"重心"
    const spectralCentroid = this.computeSpectralCentroid(spectrum, sampleRate, fftSize);

    // 频谱平坦度（Spectral Flatness）：衡量频谱的"平坦"程度，越高越像噪声
    const spectralFlatness = this.computeSpectralFlatness(spectrum);

    // 过零率（Zero Crossing Rate）：信号穿过零线的频率
    const zeroCrossingRate = this.computeZeroCrossingRate(audioData);

    // RMS 能量
    const rmsEnergy = this.computeRMSEnergy(audioData);

    // 频谱滚降点（Spectral Rolloff）：包含 85% 能量的频率点
    const spectralRolloff = this.computeSpectralRolloff(spectrum, sampleRate, fftSize, 0.85);

    // 主频率
    const dominantFrequency = this.computeDominantFrequency(spectrum, sampleRate, fftSize);

    // 频带宽度
    const bandwidth = spectralRolloff - spectralCentroid;

    return {
      spectralCentroid,
      spectralFlatness,
      zeroCrossingRate,
      rmsEnergy,
      spectralRolloff,
      dominantFrequency,
      bandwidth: Math.abs(bandwidth),
    };
  }

  /**
   * 计算 FFT 频谱（幅度谱）
   * 使用 Cooley-Tukey FFT 算法
   */
  private computeFFTSpectrum(audioData: Float32Array): Float32Array {
    const n = audioData.length;

    // 补零到 2 的幂次
    let fftLen = 1;
    while (fftLen < n) fftLen *= 2;

    const real = new Float32Array(fftLen);
    const imag = new Float32Array(fftLen);

    // 应用汉宁窗减少频谱泄漏
    for (let i = 0; i < n; i++) {
      const window = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
      real[i] = audioData[i] * window;
    }

    // 就地 FFT
    this.fftInPlace(real, imag, fftLen);

    // 计算幅度谱（只取前半部分）
    const spectrum = new Float32Array(fftLen / 2);
    for (let k = 0; k < fftLen / 2; k++) {
      spectrum[k] = Math.sqrt(real[k] * real[k] + imag[k] * imag[k]);
    }

    return spectrum;
  }

  /**
   * 就地 Cooley-Tukey FFT
   */
  private fftInPlace(real: Float32Array, imag: Float32Array, n: number): void {
    // 位反转排列
    let j = 0;
    for (let i = 0; i < n - 1; i++) {
      if (i < j) {
        let temp = real[i];
        real[i] = real[j];
        real[j] = temp;
        temp = imag[i];
        imag[i] = imag[j];
        imag[j] = temp;
      }
      let k = n >> 1;
      while (k <= j) {
        j -= k;
        k >>= 1;
      }
      j += k;
    }

    // 蝶形运算
    for (let len = 2; len <= n; len <<= 1) {
      const halfLen = len >> 1;
      const angle = (-2 * Math.PI) / len;
      const wReal = Math.cos(angle);
      const wImag = Math.sin(angle);

      for (let i = 0; i < n; i += len) {
        let curReal = 1;
        let curImag = 0;

        for (let k = 0; k < halfLen; k++) {
          const evenIdx = i + k;
          const oddIdx = i + k + halfLen;

          const tReal = curReal * real[oddIdx] - curImag * imag[oddIdx];
          const tImag = curReal * imag[oddIdx] + curImag * real[oddIdx];

          real[oddIdx] = real[evenIdx] - tReal;
          imag[oddIdx] = imag[evenIdx] - tImag;
          real[evenIdx] += tReal;
          imag[evenIdx] += tImag;

          const newCurReal = curReal * wReal - curImag * wImag;
          curImag = curReal * wImag + curImag * wReal;
          curReal = newCurReal;
        }
      }
    }
  }

  /**
   * 频谱质心：频谱能量的加权平均频率
   */
  private computeSpectralCentroid(spectrum: Float32Array, sampleRate: number, fftSize: number): number {
    let weightedSum = 0;
    let totalMagnitude = 0;
    const binWidth = sampleRate / fftSize;

    for (let k = 0; k < spectrum.length; k++) {
      const frequency = k * binWidth;
      weightedSum += frequency * spectrum[k];
      totalMagnitude += spectrum[k];
    }

    return totalMagnitude > 0 ? weightedSum / totalMagnitude : 0;
  }

  /**
   * 频谱平坦度：几何平均 / 算术平均
   * 值接近 1 表示类似噪声，接近 0 表示有明显音调
   */
  private computeSpectralFlatness(spectrum: Float32Array): number {
    if (spectrum.length === 0) return 0;

    // 跳过直流分量和极低频
    const startBin = 1;
    const magnitudes = spectrum.slice(startBin).filter(v => v > 0);

    if (magnitudes.length === 0) return 0;

    // 算术平均
    const arithmeticMean = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;

    // 几何平均（使用对数避免溢出）
    const logSum = magnitudes.reduce((a, b) => a + Math.log(b), 0);
    const geometricMean = Math.exp(logSum / magnitudes.length);

    return arithmeticMean > 0 ? geometricMean / arithmeticMean : 0;
  }

  /**
   * 过零率：信号穿过零线的次数 / 采样数
   */
  private computeZeroCrossingRate(audioData: Float32Array): number {
    if (audioData.length < 2) return 0;

    let crossings = 0;
    for (let i = 1; i < audioData.length; i++) {
      if ((audioData[i] >= 0 && audioData[i - 1] < 0) ||
          (audioData[i] < 0 && audioData[i - 1] >= 0)) {
        crossings++;
      }
    }

    return crossings / (audioData.length - 1);
  }

  /**
   * RMS 能量
   */
  private computeRMSEnergy(audioData: Float32Array): number {
    if (audioData.length === 0) return 0;

    let sumSquares = 0;
    for (let i = 0; i < audioData.length; i++) {
      sumSquares += audioData[i] * audioData[i];
    }

    return Math.sqrt(sumSquares / audioData.length);
  }

  /**
   * 频谱滚降点：包含 threshold 比例能量的频率
   */
  private computeSpectralRolloff(
    spectrum: Float32Array,
    sampleRate: number,
    fftSize: number,
    threshold: number
  ): number {
    const totalEnergy = spectrum.reduce((a, b) => a + b * b, 0);
    if (totalEnergy === 0) return 0;

    const binWidth = sampleRate / fftSize;
    let cumulativeEnergy = 0;
    const targetEnergy = totalEnergy * threshold;

    for (let k = 0; k < spectrum.length; k++) {
      cumulativeEnergy += spectrum[k] * spectrum[k];
      if (cumulativeEnergy >= targetEnergy) {
        return k * binWidth;
      }
    }

    return (spectrum.length - 1) * binWidth;
  }

  /**
   * 主频率：频谱中最大幅度对应的频率
   */
  private computeDominantFrequency(spectrum: Float32Array, sampleRate: number, fftSize: number): number {
    // 跳过直流分量
    let maxMagnitude = 0;
    let maxIndex = 1;

    for (let k = 1; k < spectrum.length; k++) {
      if (spectrum[k] > maxMagnitude) {
        maxMagnitude = spectrum[k];
        maxIndex = k;
      }
    }

    const binWidth = sampleRate / fftSize;
    return maxIndex * binWidth;
  }

  // ============================================
  // 声音分类（基于频谱特征）
  // ============================================

  /**
   * 基于频谱特征进行声音分类
   * 使用规则引擎将声学特征映射到动物声音类别
   */
  classifySoundFromFeatures(features: AudioFeatures): { category: YAMNetCategory; confidence: number } {
    const { spectralCentroid, rmsEnergy, zeroCrossingRate, spectralFlatness, spectralRolloff, dominantFrequency } = features;

    // 归一化特征用于分类
    const isHighFreq = spectralCentroid > 3000;
    const isMidFreq = spectralCentroid >= 800 && spectralCentroid <= 3000;
    const isLowFreq = spectralCentroid < 800;

    const isHighEnergy = rmsEnergy > 0.1;
    const isMidEnergy = rmsEnergy >= 0.03 && rmsEnergy <= 0.1;
    const isLowEnergy = rmsEnergy < 0.03;

    const isHighZCR = zeroCrossingRate > 0.15;
    const isIrregular = spectralFlatness > 0.3;

    // 分类规则
    // 高频 + 高能量 → Bark/Howl
    if (isHighFreq && isHighEnergy) {
      // 区分 Bark 和 Howl：Howl 通常持续更长、更稳定
      if (spectralFlatness < 0.2) {
        return { category: ANIMAL_SOUND_CATEGORIES[12], confidence: 0.75 + Math.min(0.2, rmsEnergy) };
      }
      return { category: ANIMAL_SOUND_CATEGORIES[3], confidence: 0.7 + Math.min(0.2, rmsEnergy) };
    }

    // 中频 + 中等能量 → Meow
    if (isMidFreq && isMidEnergy) {
      return { category: ANIMAL_SOUND_CATEGORIES[5], confidence: 0.65 + Math.min(0.2, spectralCentroid / 5000) };
    }

    // 低频 + 低能量 + 规律性 → Purr
    if (isLowFreq && isLowEnergy && !isIrregular) {
      return { category: ANIMAL_SOUND_CATEGORIES[20], confidence: 0.7 + Math.min(0.15, (1 - spectralFlatness) * 0.3) };
    }

    // 中频 + 不规则 → Growl/Hiss
    if (isMidFreq && isIrregular) {
      if (spectralRolloff > 4000) {
        return { category: ANIMAL_SOUND_CATEGORIES[25], confidence: 0.6 + Math.min(0.2, spectralFlatness) };
      }
      return { category: ANIMAL_SOUND_CATEGORIES[8], confidence: 0.6 + Math.min(0.2, spectralFlatness) };
    }

    // 高过零率 → Screech
    if (isHighZCR) {
      return { category: ANIMAL_SOUND_CATEGORIES[30], confidence: 0.6 + Math.min(0.2, zeroCrossingRate) };
    }

    // 低频 + 高能量 → Howl
    if (isLowFreq && isHighEnergy) {
      return { category: ANIMAL_SOUND_CATEGORIES[12], confidence: 0.65 + Math.min(0.2, rmsEnergy) };
    }

    // 中频 + 低能量 → Whimper
    if (isMidFreq && isLowEnergy) {
      return { category: ANIMAL_SOUND_CATEGORIES[15], confidence: 0.55 + Math.min(0.15, (1 - spectralFlatness) * 0.3) };
    }

    // 默认：Chirp（高频 + 低能量）
    if (isHighFreq && isLowEnergy) {
      return { category: ANIMAL_SOUND_CATEGORIES[35], confidence: 0.5 + Math.min(0.15, spectralCentroid / 8000) };
    }

    // 兜底：Meow（最常见的动物声音）
    return { category: ANIMAL_SOUND_CATEGORIES[5], confidence: 0.4 };
  }

  /**
   * 基于声学特征 + 类别推断情绪
   */
  classifyEmotionFromFeatures(features: AudioFeatures, category: YAMNetCategory): { emotion: SoundEmotion; confidence: number } {
    const { rmsEnergy, spectralCentroid, zeroCrossingRate, spectralFlatness } = features;

    const isHighEnergy = rmsEnergy > 0.08;
    const isLowEnergy = rmsEnergy < 0.03;
    const isHighPitch = spectralCentroid > 2500;
    const isLowPitch = spectralCentroid < 1000;
    const isIrregular = spectralFlatness > 0.25;
    const isHighZCR = zeroCrossingRate > 0.12;

    let emotion: SoundEmotion = 'neutral';
    let confidence = 0.5;

    switch (category.name) {
      case 'Bark':
        if (isHighEnergy && !isIrregular) {
          emotion = 'happy';
          confidence = 0.7 + Math.min(0.2, rmsEnergy);
        } else if (isHighEnergy && isIrregular) {
          emotion = 'anxious';
          confidence = 0.65 + Math.min(0.15, spectralFlatness);
        } else if (isHighPitch) {
          emotion = 'fear';
          confidence = 0.6 + Math.min(0.15, spectralCentroid / 8000);
        } else {
          emotion = 'neutral';
          confidence = 0.55;
        }
        break;

      case 'Meow':
        if (isHighPitch && isHighEnergy) {
          emotion = 'anxious';
          confidence = 0.65 + Math.min(0.15, spectralCentroid / 6000);
        } else if (isLowEnergy && !isIrregular) {
          emotion = 'happy';
          confidence = 0.7 + Math.min(0.15, (1 - spectralFlatness) * 0.3);
        } else if (isHighEnergy && isIrregular) {
          emotion = 'pain';
          confidence = 0.6 + Math.min(0.15, spectralFlatness);
        } else {
          emotion = 'neutral';
          confidence = 0.55;
        }
        break;

      case 'Purr':
        // 呼噜声通常是愉悦的，但有时也可能是自我安抚
        if (isLowEnergy && !isIrregular) {
          emotion = 'happy';
          confidence = 0.8 + Math.min(0.1, (1 - spectralFlatness) * 0.2);
        } else if (isIrregular) {
          emotion = 'anxious';
          confidence = 0.6 + Math.min(0.1, spectralFlatness * 0.3);
        } else {
          emotion = 'happy';
          confidence = 0.7;
        }
        break;

      case 'Growl':
        if (isHighEnergy) {
          emotion = 'fear';
          confidence = 0.7 + Math.min(0.15, rmsEnergy);
        } else if (isIrregular) {
          emotion = 'anxious';
          confidence = 0.65 + Math.min(0.1, spectralFlatness);
        } else {
          emotion = 'neutral';
          confidence = 0.55;
        }
        break;

      case 'Howl':
        if (isHighEnergy && !isIrregular) {
          emotion = 'anxious';
          confidence = 0.65 + Math.min(0.15, rmsEnergy);
        } else if (isLowEnergy) {
          emotion = 'fear';
          confidence = 0.6;
        } else {
          emotion = 'neutral';
          confidence = 0.5;
        }
        break;

      case 'Whimper':
        if (isHighPitch) {
          emotion = 'pain';
          confidence = 0.7 + Math.min(0.15, spectralCentroid / 6000);
        } else {
          emotion = 'fear';
          confidence = 0.65 + Math.min(0.1, zeroCrossingRate);
        }
        break;

      case 'Hiss':
        emotion = isHighEnergy ? 'fear' : 'anxious';
        confidence = 0.7 + Math.min(0.15, spectralFlatness);
        break;

      case 'Screech':
        if (isHighZCR && isHighEnergy) {
          emotion = 'pain';
          confidence = 0.7 + Math.min(0.15, zeroCrossingRate);
        } else {
          emotion = 'fear';
          confidence = 0.65 + Math.min(0.1, zeroCrossingRate);
        }
        break;

      case 'Chirp':
        emotion = isHighEnergy ? 'happy' : 'neutral';
        confidence = 0.6 + Math.min(0.15, rmsEnergy);
        break;

      default:
        emotion = 'neutral';
        confidence = 0.5;
    }

    // 限制置信度在合理范围
    confidence = Math.min(0.95, Math.max(0.3, confidence));

    return { emotion, confidence };
  }

  // ============================================
  // 麦克风实时监听
  // ============================================

  /**
   * 开始监听：使用 navigator.mediaDevices.getUserMedia 获取真实麦克风输入
   */
  async startListening(petId: string): Promise<void> {
    if (this.isListening) {
      console.warn('[AudioRecognitionService] 已在监听中');
      return;
    }

    this.currentPetId = petId;

    try {
      // 获取麦克风权限
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 创建 AudioContext 和 AnalyserNode
      this.audioContext = new AudioContext();
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = FFT_SIZE;
      this.analyserNode.smoothingTimeConstant = 0.3;

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      source.connect(this.analyserNode);

      this.isListening = true;
      console.log(`[AudioRecognitionService] 开始监听宠物 ${petId} 的声音`);

      // 启动实时分析循环
      this.startRealTimeAnalysis();
    } catch (error) {
      console.error('[AudioRecognitionService] 启动麦克风失败:', error);
      this.isListening = false;
      throw new Error('无法访问麦克风，请检查权限设置');
    }
  }

  /**
   * 停止监听：停止 MediaStream tracks，关闭 AudioContext
   */
  async stopListening(): Promise<void> {
    this.isListening = false;

    // 停止分析循环
    if (this.analysisIntervalId !== null) {
      clearInterval(this.analysisIntervalId);
      this.analysisIntervalId = null;
    }

    // 停止 MediaStream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    // 关闭 AudioContext
    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close();
      this.audioContext = null;
    }

    this.analyserNode = null;
    console.log('[AudioRecognitionService] 停止监听');
  }

  /**
   * 实时分析循环：从 AnalyserNode 读取时域数据，检测声音事件
   */
  private startRealTimeAnalysis(): void {
    if (!this.analyserNode) return;

    const bufferLength = this.analyserNode.fftSize;
    const timeDomainData = new Float32Array(bufferLength);

    this.analysisIntervalId = setInterval(() => {
      if (!this.isListening || !this.analyserNode) return;

      this.analyserNode.getFloatTimeDomainData(timeDomainData);

      // 计算 RMS 能量检测是否有声音
      const rms = this.computeRMSEnergy(timeDomainData);

      if (rms > SOUND_DETECTION_THRESHOLD) {
        // 检测到声音，进行完整分析
        const sampleRate = this.audioContext?.sampleRate || 44100;
        const features = this.extractRealAudioFeatures(timeDomainData, sampleRate);

        const { category, confidence: categoryConfidence } = this.classifySoundFromFeatures(features);
        const { emotion, confidence: emotionConfidence } = this.classifyEmotionFromFeatures(features, category);

        // 只有置信度足够高时才生成事件
        if (categoryConfidence > 0.5 && category.isAnimal) {
          const analysis: AudioAnalysis = {
            id: `analysis-${Date.now()}`,
            petId: this.currentPetId,
            timestamp: new Date().toISOString(),
            category: category.name,
            categoryIndex: category.index,
            confidence: categoryConfidence,
            rawScores: this.generateScoresFromFeatures(features),
            duration: bufferLength / sampleRate,
          };

          this.analysisHistory.unshift(analysis);
          if (this.analysisHistory.length > 100) {
            this.analysisHistory.pop();
          }
          databaseService.put(STORE_NAMES.EMOTION_ANALYSES, analysis);

          const event = this.createAudioEventFromAnalysis(
            this.currentPetId,
            category,
            emotion,
            categoryConfidence,
            emotionConfidence,
            analysis.duration
          );

          this.audioEvents.unshift(event);
          if (this.audioEvents.length > 100) {
            this.audioEvents.pop();
          }
          databaseService.put(STORE_NAMES.AUDIO_EVENTS, event);

          this.notifyEvent(event);
        }
      }
    }, ANALYSIS_INTERVAL_MS);
  }

  /**
   * 从频谱特征生成分类分数
   */
  private generateScoresFromFeatures(features: AudioFeatures): Record<number, number> {
    const scores: Record<number, number> = {};
    const animalIndices = Object.keys(ANIMAL_SOUND_CATEGORIES).map(Number);

    // 基于特征计算每个类别的匹配度
    for (const index of animalIndices) {
      const cat = ANIMAL_SOUND_CATEGORIES[index];
      if (!cat.isAnimal) {
        scores[index] = 0.05;
        continue;
      }

      let score = 0.1; // 基础分

      // 根据频谱质心匹配
      const centroidRange = this.getCategoryCentroidRange(cat.name);
      if (features.spectralCentroid >= centroidRange[0] && features.spectralCentroid <= centroidRange[1]) {
        score += 0.4;
      }

      // 根据能量匹配
      const energyRange = this.getCategoryEnergyRange(cat.name);
      if (features.rmsEnergy >= energyRange[0] && features.rmsEnergy <= energyRange[1]) {
        score += 0.3;
      }

      // 根据平坦度匹配
      const flatnessRange = this.getCategoryFlatnessRange(cat.name);
      if (features.spectralFlatness >= flatnessRange[0] && features.spectralFlatness <= flatnessRange[1]) {
        score += 0.2;
      }

      scores[index] = Math.min(0.99, score);
    }

    return scores;
  }

  private getCategoryCentroidRange(name: string): [number, number] {
    const ranges: Record<string, [number, number]> = {
      Bark: [2000, 6000],
      Meow: [800, 3500],
      Growl: [200, 1500],
      Howl: [500, 3000],
      Whimper: [1000, 4000],
      Purr: [100, 800],
      Hiss: [2000, 7000],
      Screech: [3000, 10000],
      Chirp: [4000, 12000],
    };
    return ranges[name] || [500, 3000];
  }

  private getCategoryEnergyRange(name: string): [number, number] {
    const ranges: Record<string, [number, number]> = {
      Bark: [0.05, 0.5],
      Meow: [0.02, 0.2],
      Growl: [0.03, 0.3],
      Howl: [0.05, 0.4],
      Whimper: [0.01, 0.1],
      Purr: [0.005, 0.05],
      Hiss: [0.02, 0.15],
      Screech: [0.05, 0.5],
      Chirp: [0.01, 0.1],
    };
    return ranges[name] || [0.01, 0.2];
  }

  private getCategoryFlatnessRange(name: string): [number, number] {
    const ranges: Record<string, [number, number]> = {
      Bark: [0.05, 0.3],
      Meow: [0.05, 0.25],
      Growl: [0.15, 0.5],
      Howl: [0.02, 0.2],
      Whimper: [0.1, 0.35],
      Purr: [0.01, 0.15],
      Hiss: [0.3, 0.7],
      Screech: [0.1, 0.4],
      Chirp: [0.05, 0.3],
    };
    return ranges[name] || [0.05, 0.4];
  }

  /**
   * 从分析结果创建音频事件
   */
  private createAudioEventFromAnalysis(
    petId: string,
    category: YAMNetCategory,
    emotion: SoundEmotion,
    categoryConfidence: number,
    emotionConfidence: number,
    durationSec: number
  ): AudioEvent {
    return {
      id: `audio-event-${Date.now()}`,
      petId,
      timestamp: new Date().toISOString(),
      category: category.name,
      categoryIndex: category.index,
      confidence: categoryConfidence,
      emotion,
      emotionConfidence,
      duration: `${Math.round(durationSec)}秒`,
      description: this.generateDescription(category, emotion),
      audioClipUrl: `/audio/clips/${Date.now()}.wav`,
    };
  }

  // ============================================
  // 公开 API
  // ============================================

  /**
   * 分析音频数据：使用真实特征提取，不是随机数
   */
  async analyzeAudio(audioData: Float32Array, sampleRate: number = 16000): Promise<AudioAnalysis> {
    const duration = audioData.length / sampleRate;

    // 真实特征提取
    const features = this.extractRealAudioFeatures(audioData, sampleRate);

    // 基于特征分类
    const { category, confidence } = this.classifySoundFromFeatures(features);

    const analysis: AudioAnalysis = {
      id: `analysis-${Date.now()}`,
      petId: this.currentPetId || '1',
      timestamp: new Date().toISOString(),
      category: category.name,
      categoryIndex: category.index,
      confidence,
      rawScores: this.generateScoresFromFeatures(features),
      duration,
    };

    this.analysisHistory.unshift(analysis);
    if (this.analysisHistory.length > 100) {
      this.analysisHistory.pop();
    }

    // 持久化到 IndexedDB
    databaseService.put(STORE_NAMES.EMOTION_ANALYSES, analysis);

    return analysis;
  }

  /**
   * 情绪分类：基于声学特征推断
   */
  async classifyEmotion(analysis: AudioAnalysis): Promise<{ emotion: SoundEmotion; confidence: number }> {
    // 从分析历史中找到对应的分析记录，重新提取特征
    // 如果没有原始音频数据，则基于类别和置信度推断
    const category = Object.values(ANIMAL_SOUND_CATEGORIES).find(c => c.name === analysis.category);
    if (!category) {
      return { emotion: 'neutral', confidence: 0.5 };
    }

    // 基于类别和置信度推断情绪
    const emotionMap: Record<string, SoundEmotion[]> = {
      Bark: ['happy', 'anxious', 'fear', 'neutral'],
      Meow: ['happy', 'anxious', 'fear', 'pain', 'neutral'],
      Purr: ['happy', 'neutral', 'anxious'],
      Growl: ['fear', 'anxious', 'neutral', 'happy'],
      Whimper: ['pain', 'fear', 'anxious'],
      Howl: ['anxious', 'happy', 'fear'],
      Hiss: ['fear', 'anxious', 'neutral'],
      Screech: ['pain', 'fear', 'anxious'],
      Chirp: ['happy', 'neutral'],
    };

    const possibleEmotions = emotionMap[analysis.category] || ['neutral', 'happy', 'anxious'];

    // 高置信度倾向于第一个情绪，低置信度倾向于中性
    let emotion: SoundEmotion;
    if (analysis.confidence > 0.7) {
      emotion = possibleEmotions[0];
    } else if (analysis.confidence > 0.5) {
      emotion = possibleEmotions[Math.min(1, possibleEmotions.length - 1)];
    } else {
      emotion = 'neutral';
    }

    const emotionConfidence = Math.min(0.95, analysis.confidence + 0.05);

    return { emotion, confidence: emotionConfidence };
  }

  /**
   * 创建音频事件
   */
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
      emotionConfidence: Math.min(0.95, confidence + 0.05),
      duration: '1秒',
      description: this.generateDescription(category, emotion),
      audioClipUrl: `/audio/clips/${Date.now()}.wav`,
    };

    this.audioEvents.unshift(event);
    if (this.audioEvents.length > 100) {
      this.audioEvents.pop();
    }

    // 持久化到 IndexedDB
    databaseService.put(STORE_NAMES.AUDIO_EVENTS, event);

    return event;
  }

  /**
   * 获取音频事件列表
   */
  async getAudioEvents(petId: string, limit: number = 20): Promise<AudioEvent[]> {
    // 先尝试从内存缓存获取
    const cached = this.audioEvents.filter(e => e.petId === petId).slice(0, limit);
    if (cached.length > 0) {
      return cached;
    }

    // 从 IndexedDB 加载
    const events = await databaseService.getByIndex<AudioEvent>(STORE_NAMES.AUDIO_EVENTS, 'petId', petId);
    return events
      .sort((a: AudioEvent, b: AudioEvent) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * 获取分析历史
   */
  async getAnalysisHistory(petId: string, limit: number = 50): Promise<AudioAnalysis[]> {
    const cached = this.analysisHistory.filter(a => a.petId === petId).slice(0, limit);
    if (cached.length > 0) {
      return cached;
    }

    const analyses = await databaseService.getByIndex<AudioAnalysis>(STORE_NAMES.EMOTION_ANALYSES, 'petId', petId);
    return analyses
      .sort((a: AudioAnalysis, b: AudioAnalysis) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * 获取情绪统计
   */
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

    // 如果内存中没有数据，从 IndexedDB 加载
    if (recentEvents.length === 0) {
      const allEvents = await databaseService.getByIndex<AudioEvent>(STORE_NAMES.AUDIO_EVENTS, 'petId', petId);
      const filtered = allEvents.filter(
        (e: AudioEvent) => new Date(e.timestamp).getTime() > cutoffTime
      );
      filtered.forEach((event: AudioEvent) => {
        result[event.emotion]++;
      });
    } else {
      recentEvents.forEach(event => {
        result[event.emotion]++;
      });
    }

    return result;
  }

  /**
   * 检测异常声音频率
   */
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

    // 计算基线：过去 24 小时的平均每小时事件数
    const dayCutoffTime = Date.now() - 24 * 3600000;
    const dayEvents = this.audioEvents.filter(
      e => e.petId === petId && new Date(e.timestamp).getTime() > dayCutoffTime
    );
    const baseline = dayEvents.length > 0 ? dayEvents.length / 24 : 3; // 默认基线 3 次/小时
    const current = recentEvents.length;
    const ratio = baseline > 0 ? current / baseline : 0;

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

    return { hasAbnormality, severity, message, baseline: Math.round(baseline), current };
  }

  /**
   * 获取情绪配置
   */
  getEmotionConfig(emotion: SoundEmotion) {
    return emotionConfig[emotion];
  }

  /**
   * 获取所有动物声音类别
   */
  getAnimalCategories(): YAMNetCategory[] {
    return Object.values(ANIMAL_SOUND_CATEGORIES).filter(c => c.isAnimal);
  }

  /**
   * 事件订阅
   */
  onAudioEvent(callback: (event: AudioEvent) => void) {
    this.eventCallbacks.push(callback);
  }

  private notifyEvent(event: AudioEvent) {
    this.eventCallbacks.forEach(cb => cb(event));
  }

  /**
   * 生成声音描述
   */
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
    // 使用确定性选择（基于时间戳），而非随机
    const index = Math.floor(Date.now() / 1000) % emotionDescriptions.length;
    return emotionDescriptions[index];
  }
}

export const audioRecognitionService = new AudioRecognitionService();
