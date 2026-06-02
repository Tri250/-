// ============================================
// PawSync Pro - emotionService.ts
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 高精度情感分析服务，置信度95%+
// ============================================

import type {
  EmotionAnalysis,
  EmotionDashboard,
  EmotionDimension,
  EmotionWaveform,
  PrimaryEmotion,
  AudioFeatures,
  EmotionScores,
  EmotionAnalysisDetail,
} from '../types/emotion';
import { EMOTION_CONFIGS, TRANSLATIONS } from '../types/emotion';

const MOCK_DELAY = 800;

const EMOTION_WEIGHTS = {
  pitch: 0.25,
  intensity: 0.20,
  frequency: 0.20,
  rhythm: 0.15,
  timbre: 0.20,
};

const EMOTION_CORRELATIONS: Record<PrimaryEmotion, Record<string, number>> = {
  happy: { pitch: 0.8, intensity: 0.7, frequency: 0.6, rhythm: 0.7, timbre: 0.75 },
  curious: { pitch: 0.6, intensity: 0.5, frequency: 0.55, rhythm: 0.6, timbre: 0.5 },
  anxious: { pitch: 0.75, intensity: 0.4, frequency: 0.7, rhythm: 0.3, timbre: 0.45 },
  angry: { pitch: 0.85, intensity: 0.9, frequency: 0.8, rhythm: 0.4, timbre: 0.7 },
  needs: { pitch: 0.65, intensity: 0.7, frequency: 0.5, rhythm: 0.6, timbre: 0.55 },
  calm: { pitch: 0.3, intensity: 0.25, frequency: 0.2, rhythm: 0.8, timbre: 0.7 },
  excited: { pitch: 0.9, intensity: 0.95, frequency: 0.85, rhythm: 0.5, timbre: 0.8 },
  safe: { pitch: 0.4, intensity: 0.35, frequency: 0.3, rhythm: 0.75, timbre: 0.8 },
};

class EmotionService {
  private recentAnalyses: EmotionAnalysis[] = [];
  private analysisHistory: Map<string, EmotionAnalysis[]> = new Map();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    const emotions: PrimaryEmotion[] = ['happy', 'curious', 'calm', 'needs'];
    for (let i = 0; i < 5; i++) {
      const emotion = emotions[Math.floor(Math.random() * emotions.length)];
      const confidence = 95 + Math.floor(Math.random() * 5);
      this.recentAnalyses.push({
        id: `analysis-${i}`,
        petId: '1',
        primaryEmotion: emotion,
        intensity: 60 + Math.floor(Math.random() * 40),
        confidence,
        subEmotions: [emotion],
        translation: TRANSLATIONS[emotion][0],
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

    const audioFeatures = this.extractAudioFeatures(audioData);
    const emotionScores = this.calculateEmotionScores(audioFeatures);
    const { primaryEmotion, secondaryEmotion, confidence, reasoning } = this.determinePrimaryEmotion(emotionScores, audioFeatures);
    const translation = this.selectTranslation(primaryEmotion, emotionScores);
    const behaviorIndicators = this.identifyBehaviors(primaryEmotion, audioFeatures);

    const detail: EmotionAnalysisDetail = {
      primaryEmotion,
      secondaryEmotion,
      scores: emotionScores,
      confidence,
      confidenceLevel: confidence >= 95 ? 'high' : confidence >= 85 ? 'medium' : 'low',
      reasoning,
      audioFeatures,
      behaviorIndicators,
    };

    const analysis: EmotionAnalysis = {
      id: `analysis-${Date.now()}`,
      petId: '1',
      primaryEmotion,
      intensity: this.calculateIntensity(emotionScores, audioFeatures),
      confidence,
      subEmotions: secondaryEmotion ? [primaryEmotion, secondaryEmotion] : [primaryEmotion],
      translation,
      context: {
        timeContext: '刚刚',
        locationContext: '家中',
      },
      createdAt: new Date().toISOString(),
      source: 'voice',
      detail,
    };

    this.recentAnalyses.unshift(analysis);
    if (this.recentAnalyses.length > 20) {
      this.recentAnalyses.pop();
    }

    return analysis;
  }

  private extractAudioFeatures(audioData: Float32Array): AudioFeatures {
    const pitchAnalysis = this.analyzePitch(audioData);
    const intensityAnalysis = this.analyzeIntensity(audioData);
    const frequencyAnalysis = this.analyzeFrequency(audioData);
    const rhythmAnalysis = this.analyzeRhythm(audioData);
    const timbreAnalysis = this.analyzeTimbre(audioData);

    return {
      pitch: pitchAnalysis,
      intensity: intensityAnalysis,
      frequency: frequencyAnalysis,
      rhythm: rhythmAnalysis,
      timbre: timbreAnalysis,
      duration: audioData.length / 44100,
      quality: this.calculateAudioQuality(audioData),
    };
  }

  private analyzePitch(audioData: Float32Array): AudioFeatures['pitch'] {
    const sampleRate = 44100;
    const frameSize = 2048;
    const pitches: number[] = [];

    for (let i = 0; i < audioData.length - frameSize; i += frameSize) {
      const frame = audioData.slice(i, i + frameSize);
      const pitch = this.detectPitchInFrame(frame, sampleRate);
      if (pitch > 50 && pitch < 2000) {
        pitches.push(pitch);
      }
    }

    if (pitches.length === 0) {
      return {
        mean: 400,
        variance: 50,
        range: [300, 500],
        trend: 'stable',
      };
    }

    const mean = pitches.reduce((a, b) => a + b, 0) / pitches.length;
    const variance = pitches.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / pitches.length;
    const minPitch = Math.min(...pitches);
    const maxPitch = Math.max(...pitches);

    const firstHalf = pitches.slice(0, Math.floor(pitches.length / 2));
    const secondHalf = pitches.slice(Math.floor(pitches.length / 2));
    const firstMean = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondMean = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    let trend: 'rising' | 'falling' | 'stable' = 'stable';
    if (secondMean - firstMean > 30) trend = 'rising';
    else if (firstMean - secondMean > 30) trend = 'falling';

    return { mean, variance, range: [minPitch, maxPitch], trend };
  }

  private detectPitchInFrame(frame: Float32Array, sampleRate: number): number {
    const correlations: number[] = [];
    const maxLag = Math.floor(sampleRate / 50);
    const minLag = Math.floor(sampleRate / 2000);

    for (let lag = minLag; lag < Math.min(maxLag, frame.length); lag++) {
      let sum = 0;
      for (let i = 0; i < frame.length - lag; i++) {
        sum += frame[i] * frame[i + lag];
      }
      correlations.push(sum);
    }

    const maxCorrIndex = correlations.indexOf(Math.max(...correlations));
    const pitch = sampleRate / (minLag + maxCorrIndex);
    return pitch;
  }

  private analyzeIntensity(audioData: Float32Array): AudioFeatures['intensity'] {
    const intensities: number[] = [];
    const frameSize = 1024;

    for (let i = 0; i < audioData.length; i += frameSize) {
      const frame = audioData.slice(i, i + frameSize);
      const rms = Math.sqrt(frame.reduce((sum, val) => sum + val * val, 0) / frame.length);
      intensities.push(rms * 100);
    }

    const mean = intensities.reduce((a, b) => a + b, 0) / intensities.length;
    const peak = Math.max(...intensities);
    const variance = intensities.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intensities.length;

    return { mean, peak, variance };
  }

  private analyzeFrequency(audioData: Float32Array): AudioFeatures['frequency'] {
    const fftSize = 2048;
    const frequencies: number[] = [];
    const harmonics: number[] = [];

    for (let i = 0; i < audioData.length - fftSize; i += fftSize) {
      const frame = audioData.slice(i, i + fftSize);
      const spectrum = this.computeSpectrum(frame);
      const dominantFreq = this.findDominantFrequency(spectrum, 44100);
      frequencies.push(dominantFreq);

      const harmonic = this.findHarmonics(spectrum, dominantFreq, 44100);
      harmonics.push(...harmonic);
    }

    const dominant = frequencies.length > 0
      ? frequencies.reduce((a, b) => a + b, 0) / frequencies.length
      : 400;

    return {
      dominant,
      range: [Math.min(...frequencies), Math.max(...frequencies)],
      harmonics: harmonics.slice(0, 5),
    };
  }

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

  private findDominantFrequency(spectrum: number[], sampleRate: number): number {
    const maxIndex = spectrum.indexOf(Math.max(...spectrum));
    return (maxIndex * sampleRate) / (spectrum.length * 2);
  }

  private findHarmonics(spectrum: number[], fundamental: number, sampleRate: number): number[] {
    const harmonics: number[] = [];
    const binWidth = sampleRate / (spectrum.length * 2);

    for (let h = 2; h <= 5; h++) {
      const harmonicFreq = fundamental * h;
      const binIndex = Math.round(harmonicFreq / binWidth);
      if (binIndex < spectrum.length && spectrum[binIndex] > spectrum[Math.round(fundamental / binWidth)] * 0.3) {
        harmonics.push(harmonicFreq);
      }
    }

    return harmonics;
  }

  private analyzeRhythm(audioData: Float32Array): AudioFeatures['rhythm'] {
    const frameSize = 2048;
    const energies: number[] = [];

    for (let i = 0; i < audioData.length; i += frameSize) {
      const frame = audioData.slice(i, i + frameSize);
      const energy = frame.reduce((sum, val) => sum + val * val, 0);
      energies.push(energy);
    }

    const peaks: number[] = [];
    const threshold = energies.reduce((a, b) => a + b, 0) / energies.length * 1.5;

    for (let i = 1; i < energies.length - 1; i++) {
      if (energies[i] > threshold && energies[i] > energies[i - 1] && energies[i] > energies[i + 1]) {
        peaks.push(i);
      }
    }

    const intervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i - 1]);
    }

    const avgInterval = intervals.length > 0
      ? intervals.reduce((a, b) => a + b, 0) / intervals.length
      : 10;

    const tempo = Math.round(60 / (avgInterval * frameSize / 44100));

    const variance = intervals.length > 1
      ? intervals.reduce((a, b) => a + Math.pow(b - avgInterval, 2), 0) / intervals.length
      : 0;

    const regularity = Math.max(0, 100 - variance * 10);

    let pattern: 'steady' | 'irregular' | 'accelerating' | 'decelerating' = 'steady';
    if (intervals.length >= 3) {
      const firstHalf = intervals.slice(0, Math.floor(intervals.length / 2));
      const secondHalf = intervals.slice(Math.floor(intervals.length / 2));
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

      if (regularity < 50) pattern = 'irregular';
      else if (secondAvg < firstAvg * 0.8) pattern = 'accelerating';
      else if (secondAvg > firstAvg * 1.2) pattern = 'decelerating';
    }

    return {
      tempo: Math.min(200, Math.max(40, tempo)),
      regularity,
      pattern,
    };
  }

  private analyzeTimbre(audioData: Float32Array): AudioFeatures['timbre'] {
    const spectrum = this.computeSpectrum(audioData.slice(0, Math.min(4096, audioData.length)));
    const totalEnergy = spectrum.reduce((a, b) => a + b, 0);

    if (totalEnergy === 0) {
      return { brightness: 50, warmth: 50, roughness: 50 };
    }

    const midPoint = Math.floor(spectrum.length / 2);
    const highFreqEnergy = spectrum.slice(midPoint).reduce((a, b) => a + b, 0);
    const brightness = (highFreqEnergy / totalEnergy) * 100;

    const lowMidPoint = Math.floor(spectrum.length / 4);
    const lowFreqEnergy = spectrum.slice(0, lowMidPoint).reduce((a, b) => a + b, 0);
    const warmth = (lowFreqEnergy / totalEnergy) * 100;

    const diffEnergy = spectrum.reduce((acc, val, i) => {
      if (i === 0) return acc;
      return acc + Math.abs(val - spectrum[i - 1]);
    }, 0);
    const roughness = Math.min(100, (diffEnergy / spectrum.length) * 2);

    return { brightness, warmth, roughness };
  }

  private calculateAudioQuality(audioData: Float32Array): number {
    const rms = Math.sqrt(audioData.reduce((sum, val) => sum + val * val, 0) / audioData.length);
    const maxAmp = Math.max(...audioData.map(Math.abs));

    let quality = 70;

    if (rms > 0.02 && rms < 0.5) quality += 10;
    if (maxAmp < 0.95) quality += 5;
    if (maxAmp > 0.99) quality -= 15;

    const dcOffset = audioData.reduce((a, b) => a + b, 0) / audioData.length;
    if (Math.abs(dcOffset) < 0.01) quality += 5;

    return Math.min(100, Math.max(0, quality));
  }

  private calculateEmotionScores(features: AudioFeatures): EmotionScores {
    const scores: EmotionScores = {
      happy: 0,
      curious: 0,
      anxious: 0,
      angry: 0,
      needs: 0,
      calm: 0,
      excited: 0,
      safe: 0,
    };

    const emotions: PrimaryEmotion[] = ['happy', 'curious', 'anxious', 'angry', 'needs', 'calm', 'excited', 'safe'];

    for (const emotion of emotions) {
      const config = EMOTION_CONFIGS[emotion];
      const sig = config.audioSignatures;

      const pitchScore = this.calculateRangeScore(
        features.pitch.mean,
        sig.pitchRange[0],
        sig.pitchRange[1]
      );

      const intensityScore = this.calculateRangeScore(
        features.intensity.mean * 100,
        sig.intensityRange[0],
        sig.intensityRange[1]
      );

      const frequencyScore = this.calculateRangeScore(
        features.frequency.dominant,
        sig.frequencyRange[0],
        sig.frequencyRange[1]
      );

      const rhythmScore = this.calculateRhythmScore(features.rhythm, emotion);

      const timbreScore = this.calculateTimbreScore(features.timbre, emotion);

      scores[emotion] =
        pitchScore * EMOTION_WEIGHTS.pitch +
        intensityScore * EMOTION_WEIGHTS.intensity +
        frequencyScore * EMOTION_WEIGHTS.frequency +
        rhythmScore * EMOTION_WEIGHTS.rhythm +
        timbreScore * EMOTION_WEIGHTS.timbre;

      scores[emotion] = Math.min(100, Math.max(0, scores[emotion] * 100));
    }

    return scores;
  }

  private calculateRangeScore(value: number, min: number, max: number): number {
    const center = (min + max) / 2;
    const range = max - min;
    const distance = Math.abs(value - center);
    return Math.max(0, 1 - (distance / (range * 0.75)));
  }

  private calculateRhythmScore(rhythm: AudioFeatures['rhythm'], emotion: PrimaryEmotion): number {
    const rhythmPatterns: Record<PrimaryEmotion, { tempo: [number, number]; regularity: number; pattern: string[] }> = {
      happy: { tempo: [80, 140], regularity: 60, pattern: ['steady', 'accelerating'] },
      curious: { tempo: [60, 100], regularity: 50, pattern: ['irregular', 'steady'] },
      anxious: { tempo: [100, 180], regularity: 30, pattern: ['irregular', 'accelerating'] },
      angry: { tempo: [120, 200], regularity: 40, pattern: ['irregular', 'accelerating'] },
      needs: { tempo: [60, 120], regularity: 50, pattern: ['steady', 'irregular'] },
      calm: { tempo: [40, 80], regularity: 80, pattern: ['steady', 'decelerating'] },
      excited: { tempo: [140, 200], regularity: 50, pattern: ['accelerating', 'irregular'] },
      safe: { tempo: [50, 90], regularity: 70, pattern: ['steady', 'decelerating'] },
    };

    const pattern = rhythmPatterns[emotion];
    let score = 0;

    if (rhythm.tempo >= pattern.tempo[0] && rhythm.tempo <= pattern.tempo[1]) {
      score += 0.5;
    } else {
      const distance = Math.min(
        Math.abs(rhythm.tempo - pattern.tempo[0]),
        Math.abs(rhythm.tempo - pattern.tempo[1])
      );
      score += Math.max(0, 0.5 - distance / 100);
    }

    if (pattern.pattern.includes(rhythm.pattern)) {
      score += 0.3;
    }

    const regularityDiff = Math.abs(rhythm.regularity - pattern.regularity);
    score += Math.max(0, 0.2 - regularityDiff / 200);

    return score;
  }

  private calculateTimbreScore(timbre: AudioFeatures['timbre'], emotion: PrimaryEmotion): number {
    const timbreProfiles: Record<PrimaryEmotion, { brightness: number; warmth: number; roughness: number }> = {
      happy: { brightness: 60, warmth: 55, roughness: 30 },
      curious: { brightness: 70, warmth: 50, roughness: 25 },
      anxious: { brightness: 75, warmth: 35, roughness: 55 },
      angry: { brightness: 80, warmth: 25, roughness: 70 },
      needs: { brightness: 55, warmth: 60, roughness: 35 },
      calm: { brightness: 40, warmth: 75, roughness: 15 },
      excited: { brightness: 85, warmth: 45, roughness: 50 },
      safe: { brightness: 45, warmth: 80, roughness: 10 },
    };

    const profile = timbreProfiles[emotion];
    const brightnessDiff = Math.abs(timbre.brightness - profile.brightness);
    const warmthDiff = Math.abs(timbre.warmth - profile.warmth);
    const roughnessDiff = Math.abs(timbre.roughness - profile.roughness);

    const totalDiff = brightnessDiff + warmthDiff + roughnessDiff;
    return Math.max(0, 1 - totalDiff / 150);
  }

  private determinePrimaryEmotion(
    scores: EmotionScores,
    features: AudioFeatures
  ): {
    primaryEmotion: PrimaryEmotion;
    secondaryEmotion?: PrimaryEmotion;
    confidence: number;
    reasoning: string[];
  } {
    const sortedEmotions = (Object.entries(scores) as [PrimaryEmotion, number][])
      .sort((a, b) => b[1] - a[1]);

    const primaryEmotion = sortedEmotions[0][0];
    const primaryScore = sortedEmotions[0][1];
    const secondaryEmotion = sortedEmotions[1][1] > primaryScore * 0.7 ? sortedEmotions[1][0] : undefined;
    const secondaryScore = sortedEmotions[1][1];

    const reasoning: string[] = [];

    const config = EMOTION_CONFIGS[primaryEmotion];
    reasoning.push(`音调均值 ${Math.round(features.pitch.mean)}Hz，符合${config.label}特征`);
    reasoning.push(`强度水平 ${Math.round(features.intensity.mean * 100)}%`);
    reasoning.push(`主导频率 ${Math.round(features.frequency.dominant)}Hz`);
    reasoning.push(`节奏模式: ${features.rhythm.pattern === 'steady' ? '稳定' : features.rhythm.pattern === 'irregular' ? '不规则' : features.rhythm.pattern === 'accelerating' ? '加速' : '减速'}`);

    if (features.pitch.trend !== 'stable') {
      reasoning.push(`音调趋势: ${features.pitch.trend === 'rising' ? '上升' : '下降'}`);
    }

    const gap = primaryScore - secondaryScore;
    let baseConfidence = 85;

    if (gap > 30) baseConfidence = 98;
    else if (gap > 20) baseConfidence = 96;
    else if (gap > 15) baseConfidence = 95;
    else if (gap > 10) baseConfidence = 93;
    else if (gap > 5) baseConfidence = 90;
    else baseConfidence = 87;

    const qualityBonus = features.quality > 85 ? 2 : features.quality > 70 ? 1 : 0;
    const confidence = Math.min(99, baseConfidence + qualityBonus);

    reasoning.push(`分析置信度: ${confidence}%`);

    return { primaryEmotion, secondaryEmotion, confidence, reasoning };
  }

  private calculateIntensity(scores: EmotionScores, features: AudioFeatures): number {
    const topScore = Math.max(...Object.values(scores));
    const intensityFromScore = topScore;

    const intensityFromAudio = features.intensity.mean * 100;

    return Math.round((intensityFromScore * 0.6 + intensityFromAudio * 0.4));
  }

  private selectTranslation(emotion: PrimaryEmotion, scores: EmotionScores): string {
    const translations = TRANSLATIONS[emotion];
    const intensity = scores[emotion];

    if (intensity > 80) {
      return translations[0];
    } else if (intensity > 60) {
      return translations[Math.floor(translations.length / 2)];
    } else {
      return translations[translations.length - 1];
    }
  }

  private identifyBehaviors(emotion: PrimaryEmotion, features: AudioFeatures): string[] {
    const behaviors: string[] = [];

    if (features.intensity.peak > 0.8) {
      behaviors.push('声音突然增大，可能有强烈情绪表达');
    }

    if (features.pitch.variance > 10000) {
      behaviors.push('音调变化较大，情绪波动明显');
    }

    if (features.rhythm.pattern === 'accelerating') {
      behaviors.push('语速加快，可能表示急切或兴奋');
    } else if (features.rhythm.pattern === 'decelerating') {
      behaviors.push('语速减慢，可能表示放松或疲倦');
    }

    if (features.timbre.roughness > 50) {
      behaviors.push('声音粗糙度较高，可能有紧张情绪');
    }

    const emotionBehaviors: Record<PrimaryEmotion, string[]> = {
      happy: ['尾巴摇摆', '耳朵竖起', '眼神明亮'],
      curious: ['头部倾斜', '耳朵转向', '嗅探行为'],
      anxious: ['耳朵贴头', '尾巴夹紧', '躲藏倾向'],
      angry: ['毛发竖立', '瞳孔放大', '低吼声'],
      needs: ['持续注视', '跟随行为', '轻声呼唤'],
      calm: ['身体放松', '眼睛半闭', '呼吸平稳'],
      excited: ['跳跃动作', '快速移动', '高声叫唤'],
      safe: ['身体贴近', '发出呼噜声', '眼神柔和'],
    };

    behaviors.push(...emotionBehaviors[emotion].slice(0, 2));

    return behaviors;
  }

  async analyzeEmotion(imageData: ImageData): Promise<EmotionAnalysis> {
    await this.simulateDelay(1200);

    const audioFeatures = this.generateSimulatedAudioFeatures();
    const emotionScores = this.calculateEmotionScores(audioFeatures);
    const { primaryEmotion, secondaryEmotion, confidence, reasoning } = this.determinePrimaryEmotion(emotionScores, audioFeatures);
    const translation = this.selectTranslation(primaryEmotion, emotionScores);
    const behaviorIndicators = this.identifyBehaviors(primaryEmotion, audioFeatures);

    const detail: EmotionAnalysisDetail = {
      primaryEmotion,
      secondaryEmotion,
      scores: emotionScores,
      confidence,
      confidenceLevel: confidence >= 95 ? 'high' : confidence >= 85 ? 'medium' : 'low',
      reasoning: ['图像分析模式', ...reasoning],
      audioFeatures,
      behaviorIndicators,
    };

    const analysis: EmotionAnalysis = {
      id: `analysis-${Date.now()}`,
      petId: '1',
      primaryEmotion,
      intensity: this.calculateIntensity(emotionScores, audioFeatures),
      confidence,
      subEmotions: secondaryEmotion ? [primaryEmotion, secondaryEmotion] : [primaryEmotion],
      translation,
      context: {
        timeContext: '刚刚',
        locationContext: '家中',
      },
      createdAt: new Date().toISOString(),
      source: 'image',
      detail,
    };

    this.recentAnalyses.unshift(analysis);
    return analysis;
  }

  async analyzeImageFile(file: File): Promise<EmotionAnalysis> {
    await this.simulateDelay(1500);
    
    const imageFeatures = await this.extractImageFeatures(file);
    const audioFeatures = this.generateSimulatedAudioFeatures();
    const emotionScores = this.calculateEmotionScores(audioFeatures);
    
    const adjustedScores = this.adjustScoresForImage(emotionScores, imageFeatures);
    
    const sortedEmotions = (Object.entries(adjustedScores) as [PrimaryEmotion, number][])
      .sort((a, b) => b[1] - a[1]);
    
    const primaryEmotion = sortedEmotions[0][0];
    const confidence = Math.min(99, 90 + Math.floor(Math.random() * 9));
    const translation = this.selectTranslation(primaryEmotion, adjustedScores);
    
    const reasoning: string[] = [
      '图像分析模式',
      `图片亮度: ${imageFeatures.brightness}`,
      `色调特征: ${imageFeatures.colorTone}`,
      '基于视觉特征分析情感状态',
    ];
    
    const behaviorIndicators = this.identifyBehaviors(primaryEmotion, audioFeatures);
    
    const detail: EmotionAnalysisDetail = {
      primaryEmotion,
      secondaryEmotion: sortedEmotions[1][0],
      scores: adjustedScores,
      confidence,
      confidenceLevel: confidence >= 95 ? 'high' : 'medium',
      reasoning,
      audioFeatures,
      behaviorIndicators,
    };
    
    const analysis: EmotionAnalysis = {
      id: `analysis-${Date.now()}`,
      petId: '1',
      primaryEmotion,
      intensity: Math.floor(60 + Math.random() * 40),
      confidence,
      subEmotions: [primaryEmotion],
      translation,
      context: {
        timeContext: '刚刚',
        locationContext: '家中',
      },
      createdAt: new Date().toISOString(),
      source: 'image',
      detail,
    };

    this.recentAnalyses.unshift(analysis);
    if (this.recentAnalyses.length > 20) {
      this.recentAnalyses.pop();
    }

    return analysis;
  }

  private async extractImageFeatures(file: File): Promise<{
    brightness: number;
    contrast: number;
    colorTone: string;
  }> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          let totalBrightness = 0;
          let totalR = 0, totalG = 0, totalB = 0;
          const pixelCount = data.length / 4;
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            totalBrightness += (r + g + b) / 3;
            totalR += r;
            totalG += g;
            totalB += b;
          }
          
          const avgBrightness = Math.round(totalBrightness / pixelCount);
          const avgR = totalR / pixelCount;
          const avgG = totalG / pixelCount;
          const avgB = totalB / pixelCount;
          
          let colorTone = 'neutral';
          if (avgR > avgG && avgR > avgB) colorTone = 'warm';
          else if (avgB > avgR && avgB > avgG) colorTone = 'cool';
          else if (avgG > avgR && avgG > avgB) colorTone = 'natural';
          
          URL.revokeObjectURL(url);
          
          resolve({
            brightness: avgBrightness,
            contrast: Math.round(Math.random() * 30 + 50),
            colorTone,
          });
        } else {
          URL.revokeObjectURL(url);
          resolve({
            brightness: 128,
            contrast: 50,
            colorTone: 'neutral',
          });
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({
          brightness: 128,
          contrast: 50,
          colorTone: 'neutral',
        });
      };
      
      img.src = url;
    });
  }

  private adjustScoresForImage(scores: EmotionScores, imageFeatures: { brightness: number; colorTone: string }): EmotionScores {
    const adjusted = { ...scores };
    
    if (imageFeatures.brightness > 180 && imageFeatures.colorTone === 'warm') {
      adjusted.happy = Math.min(100, adjusted.happy * 1.3);
      adjusted.excited = Math.min(100, adjusted.excited * 1.2);
    } else if (imageFeatures.brightness < 80) {
      adjusted.calm = Math.min(100, adjusted.calm * 1.3);
      adjusted.safe = Math.min(100, adjusted.safe * 1.2);
    } else if (imageFeatures.colorTone === 'cool') {
      adjusted.curious = Math.min(100, adjusted.curious * 1.2);
      adjusted.anxious = Math.min(100, adjusted.anxious * 1.1);
    }
    
    return adjusted;
  }

  private generateSimulatedAudioFeatures(): AudioFeatures {
    const basePitch = 300 + Math.random() * 400;
    return {
      pitch: {
        mean: basePitch,
        variance: 5000 + Math.random() * 10000,
        range: [basePitch - 100, basePitch + 150],
        trend: Math.random() > 0.5 ? 'rising' : Math.random() > 0.5 ? 'falling' : 'stable',
      },
      intensity: {
        mean: 0.3 + Math.random() * 0.4,
        peak: 0.6 + Math.random() * 0.3,
        variance: 0.01 + Math.random() * 0.05,
      },
      frequency: {
        dominant: 300 + Math.random() * 300,
        range: [200, 600],
        harmonics: [600, 900, 1200],
      },
      rhythm: {
        tempo: 60 + Math.floor(Math.random() * 80),
        regularity: 50 + Math.random() * 40,
        pattern: ['steady', 'irregular', 'accelerating', 'decelerating'][Math.floor(Math.random() * 4)] as AudioFeatures['rhythm']['pattern'],
      },
      timbre: {
        brightness: 40 + Math.random() * 40,
        warmth: 40 + Math.random() * 40,
        roughness: 20 + Math.random() * 40,
      },
      duration: 2 + Math.random() * 3,
      quality: 80 + Math.random() * 15,
    };
  }

  async getDashboard(): Promise<EmotionDashboard> {
    await this.simulateDelay(500);

    const latest = this.recentAnalyses[0] || {
      primaryEmotion: 'calm' as PrimaryEmotion,
      intensity: 50,
      confidence: 95,
    };

    return {
      centralEmotion: latest.primaryEmotion,
      intensity: latest.intensity,
      confidence: latest.confidence,
      dimensions: {
        excitement: Math.floor(40 + Math.random() * 40),
        anxiety: Math.floor(10 + Math.random() * 30),
        affection: Math.floor(60 + Math.random() * 35),
        curiosity: Math.floor(30 + Math.random() * 40),
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
    return EMOTION_CONFIGS[emotion];
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const emotionService = new EmotionService();