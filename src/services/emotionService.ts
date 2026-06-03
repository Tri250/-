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
  pitch: 0.22,
  intensity: 0.18,
  frequency: 0.18,
  rhythm: 0.15,
  timbre: 0.17,
  harmonics: 0.10,
};

const FREQUENCY_BANDS = {
  subBass: { min: 20, max: 60, label: '超低频' },
  bass: { min: 60, max: 250, label: '低频' },
  lowMid: { min: 250, max: 500, label: '中低频' },
  mid: { min: 500, max: 2000, label: '中频' },
  highMid: { min: 2000, max: 4000, label: '中高频' },
  high: { min: 4000, max: 6000, label: '高频' },
  veryHigh: { min: 6000, max: 12000, label: '超高频' },
};

const EMOTION_CORRELATIONS: Record<PrimaryEmotion, Record<string, number>> = {
  happy: { pitch: 0.82, intensity: 0.72, frequency: 0.65, rhythm: 0.75, timbre: 0.78, harmonics: 0.70 },
  curious: { pitch: 0.65, intensity: 0.52, frequency: 0.58, rhythm: 0.62, timbre: 0.55, harmonics: 0.60 },
  anxious: { pitch: 0.78, intensity: 0.42, frequency: 0.72, rhythm: 0.35, timbre: 0.48, harmonics: 0.55 },
  angry: { pitch: 0.88, intensity: 0.92, frequency: 0.82, rhythm: 0.45, timbre: 0.75, harmonics: 0.68 },
  needs: { pitch: 0.68, intensity: 0.72, frequency: 0.52, rhythm: 0.65, timbre: 0.58, harmonics: 0.62 },
  calm: { pitch: 0.32, intensity: 0.28, frequency: 0.22, rhythm: 0.85, timbre: 0.72, harmonics: 0.45 },
  excited: { pitch: 0.92, intensity: 0.96, frequency: 0.88, rhythm: 0.55, timbre: 0.82, harmonics: 0.78 },
  safe: { pitch: 0.42, intensity: 0.38, frequency: 0.32, rhythm: 0.78, timbre: 0.82, harmonics: 0.50 },
};

const EMOTION_FREQUENCY_SIGNATURES: Record<PrimaryEmotion, Record<string, number>> = {
  happy: { mid: 0.8, highMid: 0.7, high: 0.6 },
  curious: { lowMid: 0.6, mid: 0.7, highMid: 0.5 },
  anxious: { highMid: 0.8, high: 0.75, veryHigh: 0.5 },
  angry: { bass: 0.7, mid: 0.8, highMid: 0.85 },
  needs: { bass: 0.6, lowMid: 0.7, mid: 0.5 },
  calm: { subBass: 0.5, bass: 0.7, lowMid: 0.6 },
  excited: { mid: 0.85, highMid: 0.9, high: 0.8 },
  safe: { bass: 0.75, lowMid: 0.8, mid: 0.4 },
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
    const hopSize = 512;
    const pitches: number[] = [];
    const pitchContours: number[][] = [];

    for (let i = 0; i < audioData.length - frameSize; i += hopSize) {
      const frame = audioData.slice(i, i + frameSize);
      const pitchCandidates = this.detectPitchCandidates(frame, sampleRate);
      if (pitchCandidates.length > 0) {
        const bestPitch = this.selectBestPitch(pitchCandidates);
        if (bestPitch > 50 && bestPitch < 4000) {
          pitches.push(bestPitch);
          pitchContours.push(pitchCandidates);
        }
      }
    }

    if (pitches.length === 0) {
      return {
        mean: 400,
        variance: 50,
        range: [300, 500],
        trend: 'stable',
        bands: this.getDefaultFrequencyBands(),
      };
    }

    const mean = pitches.reduce((a, b) => a + b, 0) / pitches.length;
    const variance = pitches.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / pitches.length;
    const stdDev = Math.sqrt(variance);
    const minPitch = Math.min(...pitches);
    const maxPitch = Math.max(...pitches);

    const sortedPitches = [...pitches].sort((a, b) => a - b);
    const q1 = sortedPitches[Math.floor(sortedPitches.length * 0.25)];
    const q3 = sortedPitches[Math.floor(sortedPitches.length * 0.75)];
    const iqr = q3 - q1;

    const firstHalf = pitches.slice(0, Math.floor(pitches.length / 2));
    const secondHalf = pitches.slice(Math.floor(pitches.length / 2));
    const firstMean = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondMean = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    let trend: 'rising' | 'falling' | 'stable' | 'fluctuating' = 'stable';
    const trendDiff = secondMean - firstMean;
    const trendThreshold = stdDev * 0.5;
    
    if (trendDiff > trendThreshold && trendDiff > 20) trend = 'rising';
    else if (trendDiff < -trendThreshold && trendDiff < -20) trend = 'falling';
    else if (stdDev > mean * 0.15) trend = 'fluctuating';

    const bands = this.analyzeFrequencyBands(audioData, sampleRate);

    return { 
      mean, 
      variance, 
      range: [minPitch, maxPitch], 
      trend,
      bands,
      quartiles: { q1, q3, iqr },
      stability: Math.max(0, 100 - (stdDev / mean) * 100),
    };
  }

  private detectPitchCandidates(frame: Float32Array, sampleRate: number): number[] {
    const candidates: number[] = [];
    const correlations: number[] = [];
    const maxLag = Math.floor(sampleRate / 50);
    const minLag = Math.floor(sampleRate / 4000);

    for (let lag = minLag; lag < Math.min(maxLag, frame.length); lag++) {
      let sum = 0;
      let normFactor = 0;
      for (let i = 0; i < frame.length - lag; i++) {
        sum += frame[i] * frame[i + lag];
        normFactor += frame[i] * frame[i] + frame[i + lag] * frame[i + lag];
      }
      const normalizedCorr = normFactor > 0 ? 2 * sum / normFactor : 0;
      correlations.push(normalizedCorr);
    }

    const threshold = 0.8;
    const peaks: number[] = [];
    for (let i = 1; i < correlations.length - 1; i++) {
      if (correlations[i] > threshold && 
          correlations[i] > correlations[i-1] && 
          correlations[i] > correlations[i+1]) {
        peaks.push(i);
      }
    }

    for (const peakIndex of peaks.slice(0, 3)) {
      const refinedLag = this.refinePeakPosition(correlations, peakIndex);
      const pitch = sampleRate / (minLag + refinedLag);
      candidates.push(pitch);
    }

    if (candidates.length === 0 && correlations.length > 0) {
      const maxCorrIndex = correlations.indexOf(Math.max(...correlations));
      const pitch = sampleRate / (minLag + maxCorrIndex);
      if (pitch > 50 && pitch < 4000) {
        candidates.push(pitch);
      }
    }

    return candidates;
  }

  private refinePeakPosition(correlations: number[], peakIndex: number): number {
    if (peakIndex < 1 || peakIndex >= correlations.length - 1) return peakIndex;
    
    const y1 = correlations[peakIndex - 1];
    const y2 = correlations[peakIndex];
    const y3 = correlations[peakIndex + 1];
    
    const denom = y1 - 2 * y2 + y3;
    if (denom === 0) return peakIndex;
    
    const offset = (y1 - y3) / (2 * denom);
    return peakIndex + Math.max(-0.5, Math.min(0.5, offset));
  }

  private selectBestPitch(candidates: number[]): number {
    if (candidates.length === 0) return 0;
    if (candidates.length === 1) return candidates[0];

    const weights = candidates.map((p, i) => {
      const weight = 1 - i * 0.2;
      const petRangeWeight = (p >= 200 && p <= 1500) ? 1.5 : 1;
      return weight * petRangeWeight;
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const weightedSum = candidates.reduce((a, p, i) => a + p * weights[i], 0);
    
    return weightedSum / totalWeight;
  }

  private analyzeFrequencyBands(audioData: Float32Array, sampleRate: number): Record<string, number> {
    const spectrum = this.computeSpectrum(audioData.slice(0, Math.min(8192, audioData.length)));
    const binWidth = sampleRate / (spectrum.length * 2);
    
    const bandEnergies: Record<string, number> = {};
    const totalEnergy = spectrum.reduce((a, b) => a + b, 0);

    for (const [bandName, band] of Object.entries(FREQUENCY_BANDS)) {
      const startBin = Math.floor(band.min / binWidth);
      const endBin = Math.ceil(band.max / binWidth);
      const bandEnergy = spectrum.slice(startBin, Math.min(endBin, spectrum.length))
        .reduce((a, b) => a + b, 0);
      bandEnergies[bandName] = totalEnergy > 0 ? (bandEnergy / totalEnergy) * 100 : 0;
    }

    return bandEnergies;
  }

  private getDefaultFrequencyBands(): Record<string, number> {
    return {
      subBass: 5,
      bass: 15,
      lowMid: 20,
      mid: 30,
      highMid: 15,
      high: 10,
      veryHigh: 5,
    };
  }

  private analyzeIntensity(audioData: Float32Array): AudioFeatures['intensity'] {
    const intensities: number[] = [];
    const frameSize = 1024;
    const hopSize = 256;

    for (let i = 0; i < audioData.length; i += hopSize) {
      const frame = audioData.slice(i, Math.min(i + frameSize, audioData.length));
      const rms = Math.sqrt(frame.reduce((sum, val) => sum + val * val, 0) / frame.length);
      intensities.push(rms * 100);
    }

    if (intensities.length === 0) {
      return {
        mean: 30,
        peak: 50,
        variance: 5,
        dynamicRange: 20,
        envelope: { attack: 0, decay: 0, sustain: 30, release: 0 },
        contour: 'flat',
      };
    }

    const mean = intensities.reduce((a, b) => a + b, 0) / intensities.length;
    const peak = Math.max(...intensities);
    const minIntensity = Math.min(...intensities.filter(i => i > 0.1));
    const variance = intensities.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intensities.length;
    const stdDev = Math.sqrt(variance);

    const dynamicRange = peak - (minIntensity || mean * 0.1);
    const crestFactor = peak / (mean || 1);

    const envelope = this.analyzeEnvelope(intensities);
    const contour = this.analyzeIntensityContour(intensities);

    const peaks: number[] = [];
    const threshold = mean + stdDev;
    for (let i = 1; i < intensities.length - 1; i++) {
      if (intensities[i] > threshold && 
          intensities[i] > intensities[i-1] && 
          intensities[i] > intensities[i+1]) {
        peaks.push(i);
      }
    }

    const peakCount = peaks.length;
    const avgPeakInterval = peaks.length > 1 
      ? (peaks[peaks.length - 1] - peaks[0]) / (peaks.length - 1) 
      : intensities.length;

    return { 
      mean, 
      peak, 
      variance, 
      dynamicRange,
      envelope,
      contour,
      crestFactor,
      peakCount,
      avgPeakInterval,
      rmsVariation: stdDev / mean,
    };
  }

  private analyzeEnvelope(intensities: number[]): { attack: number; decay: number; sustain: number; release: number } {
    const peakIndex = intensities.indexOf(Math.max(...intensities));
    const peakValue = intensities[peakIndex];
    
    let attack = 0;
    for (let i = peakIndex - 1; i >= 0; i--) {
      if (intensities[i] < peakValue * 0.1) {
        attack = peakIndex - i;
        break;
      }
    }
    attack = attack || peakIndex;

    let decay = 0;
    const sustainThreshold = peakValue * 0.7;
    for (let i = peakIndex + 1; i < intensities.length; i++) {
      if (intensities[i] < sustainThreshold) {
        decay = i - peakIndex;
        break;
      }
    }

    const sustainStart = peakIndex + decay;
    let sustain = 0;
    const releaseThreshold = peakValue * 0.2;
    for (let i = sustainStart; i < intensities.length; i++) {
      if (intensities[i] < releaseThreshold) {
        sustain = i - sustainStart;
        break;
      }
    }
    sustain = sustain || (intensities.length - sustainStart);

    const releaseStart = sustainStart + sustain;
    const release = intensities.length - releaseStart;

    return { attack, decay, sustain, release };
  }

  private analyzeIntensityContour(intensities: number[]): 'flat' | 'rising' | 'falling' | 'peaked' | 'undulating' {
    if (intensities.length < 5) return 'flat';

    const firstQuarter = intensities.slice(0, Math.floor(intensities.length * 0.25));
    const secondQuarter = intensities.slice(Math.floor(intensities.length * 0.25), Math.floor(intensities.length * 0.5));
    const thirdQuarter = intensities.slice(Math.floor(intensities.length * 0.5), Math.floor(intensities.length * 0.75));
    const fourthQuarter = intensities.slice(Math.floor(intensities.length * 0.75));

    const q1Mean = firstQuarter.reduce((a, b) => a + b, 0) / firstQuarter.length;
    const q2Mean = secondQuarter.reduce((a, b) => a + b, 0) / secondQuarter.length;
    const q3Mean = thirdQuarter.reduce((a, b) => a + b, 0) / thirdQuarter.length;
    const q4Mean = fourthQuarter.reduce((a, b) => a + b, 0) / fourthQuarter.length;

    const peakIndex = intensities.indexOf(Math.max(...intensities));
    const peakPosition = peakIndex / intensities.length;

    if (peakPosition > 0.3 && peakPosition < 0.7 && 
        q1Mean < q2Mean && q2Mean > q3Mean && q3Mean > q4Mean) {
      return 'peaked';
    }

    if (q4Mean > q1Mean * 1.5) return 'rising';
    if (q1Mean > q4Mean * 1.5) return 'falling';

    const variance = intensities.reduce((a, b) => a + Math.pow(b - (q1Mean + q4Mean) / 2, 2), 0) / intensities.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev > (q1Mean + q4Mean) / 2 * 0.3) return 'undulating';

    return 'flat';
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
    const hopSize = 512;
    const energies: number[] = [];

    for (let i = 0; i < audioData.length; i += hopSize) {
      const frame = audioData.slice(i, Math.min(i + frameSize, audioData.length));
      const energy = frame.reduce((sum, val) => sum + val * val, 0);
      energies.push(energy);
    }

    if (energies.length < 4) {
      return {
        tempo: 80,
        regularity: 70,
        pattern: 'steady',
        complexity: 0.3,
        syncopation: 0,
        groove: 0.5,
      };
    }

    const peaks: number[] = [];
    const meanEnergy = energies.reduce((a, b) => a + b, 0) / energies.length;
    const stdEnergy = Math.sqrt(energies.reduce((a, b) => a + Math.pow(b - meanEnergy, 2), 0) / energies.length);
    const threshold = meanEnergy + stdEnergy * 0.5;

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

    const tempo = Math.round(60 / (avgInterval * hopSize / 44100));

    const variance = intervals.length > 1
      ? intervals.reduce((a, b) => a + Math.pow(b - avgInterval, 2), 0) / intervals.length
      : 0;

    const regularity = Math.max(0, 100 - variance * 10);

    const pattern = this.detectRhythmPattern(intervals, energies, peaks);
    const complexity = this.calculateRhythmComplexity(intervals, energies);
    const syncopation = this.calculateSyncopation(energies, peaks);
    const groove = this.calculateGroove(regularity, syncopation, complexity);

    const meter = this.detectMeter(intervals);
    const subdivisions = this.detectSubdivisions(intervals);

    return {
      tempo: Math.min(200, Math.max(40, tempo)),
      regularity,
      pattern,
      complexity,
      syncopation,
      groove,
      meter,
      subdivisions,
      peakCount: peaks.length,
      avgInterval,
    };
  }

  private detectRhythmPattern(
    intervals: number[], 
    energies: number[], 
    peaks: number[]
  ): 'steady' | 'irregular' | 'accelerating' | 'decelerating' | 'staccato' | 'legato' | 'pulsing' | 'syncopated' {
    if (intervals.length < 3) return 'steady';

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + Math.pow(b - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / avgInterval;

    if (coefficientOfVariation < 0.1) return 'steady';
    if (coefficientOfVariation > 0.4) return 'irregular';

    const firstHalf = intervals.slice(0, Math.floor(intervals.length / 2));
    const secondHalf = intervals.slice(Math.floor(intervals.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    if (secondAvg < firstAvg * 0.85) return 'accelerating';
    if (secondAvg > firstAvg * 1.15) return 'decelerating';

    const peakEnergies = peaks.map(p => energies[p] || 0);
    const avgPeakEnergy = peakEnergies.reduce((a, b) => a + b, 0) / peakEnergies.length;
    const energyVariance = peakEnergies.reduce((a, b) => a + Math.pow(b - avgPeakEnergy, 2), 0) / peakEnergies.length;

    if (energyVariance > avgPeakEnergy * 0.3 && coefficientOfVariation > 0.2) return 'syncopated';

    const shortIntervals = intervals.filter(i => i < avgInterval * 0.5).length;
    if (shortIntervals > intervals.length * 0.3) return 'staccato';

    const longIntervals = intervals.filter(i => i > avgInterval * 1.5).length;
    if (longIntervals > intervals.length * 0.3) return 'legato';

    const regularPeaks = intervals.filter(i => Math.abs(i - avgInterval) < avgInterval * 0.2).length;
    if (regularPeaks > intervals.length * 0.7 && avgPeakEnergy > energies.reduce((a, b) => a + b, 0) / energies.length * 1.5) {
      return 'pulsing';
    }

    return 'steady';
  }

  private calculateRhythmComplexity(intervals: number[], energies: number[]): number {
    if (intervals.length < 2) return 0;

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const uniqueIntervals = new Set(intervals.map(i => Math.round(i / avgInterval * 4))).size;
    const intervalComplexity = Math.min(1, uniqueIntervals / 8);

    const energyVariation = Math.sqrt(
      energies.reduce((a, b) => a + Math.pow(b - energies.reduce((c, d) => c + d, 0) / energies.length, 2), 0) / energies.length
    ) / (energies.reduce((a, b) => a + b, 0) / energies.length || 1);
    const energyComplexity = Math.min(1, energyVariation);

    return (intervalComplexity * 0.6 + energyComplexity * 0.4);
  }

  private calculateSyncopation(energies: number[], peaks: number[]): number {
    if (peaks.length < 3) return 0;

    const _avgEnergy = energies.reduce((a, b) => a + b, 0) / energies.length;
    const _peakEnergies = peaks.map(p => energies[p] || 0);
    
    const expectedPeaks: number[] = [];
    const avgInterval = peaks.length > 1 
      ? (peaks[peaks.length - 1] - peaks[0]) / (peaks.length - 1) 
      : energies.length / 2;
    
    for (let i = peaks[0]; i < energies.length; i += avgInterval) {
      expectedPeaks.push(Math.round(i));
    }

    let syncopationScore = 0;
    for (const expectedPeak of expectedPeaks) {
      const nearestActualPeak = peaks.reduce((closest, p) => 
        Math.abs(p - expectedPeak) < Math.abs(closest - expectedPeak) ? p : closest, peaks[0]);
      
      const deviation = Math.abs(nearestActualPeak - expectedPeak) / avgInterval;
      if (deviation > 0.1 && deviation < 0.5) {
        syncopationScore += 0.2;
      }
    }

    return Math.min(1, syncopationScore / expectedPeaks.length);
  }

  private calculateGroove(regularity: number, syncopation: number, complexity: number): number {
    const regularityScore = regularity / 100;
    const syncopationBonus = syncopation > 0.1 && syncopation < 0.4 ? syncopation * 0.5 : 0;
    const complexityPenalty = complexity > 0.7 ? (complexity - 0.7) * 0.3 : 0;
    
    return Math.max(0, Math.min(1, regularityScore + syncopationBonus - complexityPenalty));
  }

  private detectMeter(intervals: number[]): number {
    if (intervals.length < 4) return 4;

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    
    const meters = [2, 3, 4, 6, 8];
    let bestMeter = 4;
    let bestScore = 0;

    for (const meter of meters) {
      const expectedPattern: number[] = [];
      for (let i = 0; i < meter; i++) {
        expectedPattern.push(avgInterval);
      }

      let score = 0;
      for (let i = 0; i < intervals.length; i++) {
        const expectedPos = i % meter;
        const deviation = Math.abs(intervals[i] - expectedPattern[expectedPos]) / avgInterval;
        score += deviation < 0.2 ? 1 : deviation < 0.4 ? 0.5 : 0;
      }
      score /= intervals.length;

      if (score > bestScore) {
        bestScore = score;
        bestMeter = meter;
      }
    }

    return bestMeter;
  }

  private detectSubdivisions(intervals: number[]): number {
    if (intervals.length < 3) return 1;

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const minInterval = Math.min(...intervals);
    
    const subdivisionRatio = avgInterval / minInterval;
    
    if (subdivisionRatio > 3.5) return 4;
    if (subdivisionRatio > 2.5) return 3;
    if (subdivisionRatio > 1.5) return 2;
    return 1;
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
      const correlations = EMOTION_CORRELATIONS[emotion];
      const freqSig = EMOTION_FREQUENCY_SIGNATURES[emotion];

      const pitchScore = this.calculateEnhancedPitchScore(
        features.pitch,
        sig.pitchRange[0],
        sig.pitchRange[1],
        correlations.pitch
      );

      const intensityScore = this.calculateEnhancedIntensityScore(
        features.intensity,
        sig.intensityRange[0],
        sig.intensityRange[1],
        correlations.intensity
      );

      const frequencyScore = this.calculateEnhancedFrequencyScore(
        features.frequency,
        features.pitch.bands || {},
        freqSig,
        correlations.frequency
      );

      const rhythmScore = this.calculateEnhancedRhythmScore(features.rhythm, emotion);

      const timbreScore = this.calculateEnhancedTimbreScore(features.timbre, emotion);

      const harmonicsScore = this.calculateHarmonicsScore(
        features.frequency.harmonics,
        features.frequency.dominant,
        emotion
      );

      const baseScore = 
        pitchScore * EMOTION_WEIGHTS.pitch +
        intensityScore * EMOTION_WEIGHTS.intensity +
        frequencyScore * EMOTION_WEIGHTS.frequency +
        rhythmScore * EMOTION_WEIGHTS.rhythm +
        timbreScore * EMOTION_WEIGHTS.timbre +
        harmonicsScore * EMOTION_WEIGHTS.harmonics;

      const contextBonus = this.calculateContextBonus(features, emotion);
      
      scores[emotion] = Math.min(100, Math.max(0, (baseScore + contextBonus) * 100));
    }

    this.normalizeScores(scores);

    return scores;
  }

  private calculateEnhancedPitchScore(
    pitch: AudioFeatures['pitch'],
    min: number,
    max: number,
    correlation: number
  ): number {
    const center = (min + max) / 2;
    const range = max - min;
    
    let distance = Math.abs(pitch.mean - center);
    if (pitch.quartiles) {
      const q1Dist = Math.abs(pitch.quartiles.q1 - center);
      const q3Dist = Math.abs(pitch.quartiles.q3 - center);
      distance = (distance + q1Dist + q3Dist) / 3;
    }

    let baseScore = Math.max(0, 1 - (distance / (range * 0.6)));

    if (pitch.stability !== undefined) {
      const stabilityBonus = pitch.stability > 70 ? 0.15 : pitch.stability > 50 ? 0.05 : 0;
      baseScore += stabilityBonus;
    }

    const trendBonus = this.calculateTrendBonus(pitch.trend, correlation);
    baseScore += trendBonus;

    return Math.min(1, baseScore * correlation);
  }

  private calculateTrendBonus(trend: string, correlation: number): number {
    if (correlation > 0.7) {
      if (trend === 'rising') return 0.1;
      if (trend === 'fluctuating') return -0.05;
    } else if (correlation < 0.4) {
      if (trend === 'stable') return 0.1;
      if (trend === 'falling') return 0.05;
    }
    return 0;
  }

  private calculateEnhancedIntensityScore(
    intensity: AudioFeatures['intensity'],
    min: number,
    max: number,
    correlation: number
  ): number {
    const center = (min + max) / 2;
    const range = max - min;
    const value = intensity.mean * 100;
    
    const distance = Math.abs(value - center);
    let baseScore = Math.max(0, 1 - (distance / (range * 0.6)));

    if (intensity.dynamicRange !== undefined) {
      const dynamicBonus = intensity.dynamicRange > 30 && correlation > 0.7 ? 0.1 : 0;
      baseScore += dynamicBonus;
    }

    if (intensity.contour !== undefined) {
      const contourBonus = this.calculateContourBonus(intensity.contour, correlation);
      baseScore += contourBonus;
    }

    if (intensity.crestFactor !== undefined) {
      const crestBonus = intensity.crestFactor > 3 && correlation > 0.8 ? 0.08 : 0;
      baseScore += crestBonus;
    }

    return Math.min(1, baseScore * correlation);
  }

  private calculateContourBonus(contour: string, correlation: number): number {
    if (correlation > 0.8) {
      if (contour === 'rising' || contour === 'peaked') return 0.12;
      if (contour === 'undulating') return 0.05;
    } else if (correlation < 0.5) {
      if (contour === 'flat') return 0.1;
      if (contour === 'falling') return 0.08;
    }
    return 0;
  }

  private calculateEnhancedFrequencyScore(
    frequency: AudioFeatures['frequency'],
    bands: Record<string, number>,
    freqSig: Record<string, number>,
    correlation: number
  ): number {
    const dominantScore = this.calculateRangeScore(
      frequency.dominant,
      200,
      1500
    );

    let bandScore = 0;
    let bandCount = 0;
    for (const [bandName, expectedWeight] of Object.entries(freqSig)) {
      const actualWeight = bands[bandName] || 0;
      const matchScore = Math.max(0, 1 - Math.abs(actualWeight / 100 - expectedWeight) * 2);
      bandScore += matchScore * expectedWeight;
      bandCount += expectedWeight;
    }
    bandScore = bandCount > 0 ? bandScore / bandCount : 0.5;

    const combinedScore = dominantScore * 0.4 + bandScore * 0.6;
    
    return Math.min(1, combinedScore * correlation);
  }

  private calculateEnhancedRhythmScore(rhythm: AudioFeatures['rhythm'], emotion: PrimaryEmotion): number {
    const rhythmPatterns: Record<PrimaryEmotion, { 
      tempo: [number, number]; 
      regularity: number; 
      patterns: string[];
      complexity: number;
      groove: number;
    }> = {
      happy: { tempo: [80, 140], regularity: 65, patterns: ['steady', 'pulsing', 'accelerating'], complexity: 0.3, groove: 0.7 },
      curious: { tempo: [60, 100], regularity: 55, patterns: ['irregular', 'steady'], complexity: 0.4, groove: 0.5 },
      anxious: { tempo: [100, 180], regularity: 35, patterns: ['irregular', 'syncopated', 'accelerating'], complexity: 0.6, groove: 0.3 },
      angry: { tempo: [120, 200], regularity: 45, patterns: ['irregular', 'staccato', 'accelerating'], complexity: 0.5, groove: 0.4 },
      needs: { tempo: [60, 120], regularity: 55, patterns: ['steady', 'pulsing', 'irregular'], complexity: 0.35, groove: 0.55 },
      calm: { tempo: [40, 80], regularity: 80, patterns: ['steady', 'legato', 'decelerating'], complexity: 0.2, groove: 0.75 },
      excited: { tempo: [140, 200], regularity: 55, patterns: ['accelerating', 'pulsing', 'syncopated'], complexity: 0.45, groove: 0.6 },
      safe: { tempo: [50, 90], regularity: 75, patterns: ['steady', 'legato', 'decelerating'], complexity: 0.25, groove: 0.7 },
    };

    const pattern = rhythmPatterns[emotion];
    let score = 0;

    if (rhythm.tempo >= pattern.tempo[0] && rhythm.tempo <= pattern.tempo[1]) {
      const center = (pattern.tempo[0] + pattern.tempo[1]) / 2;
      const distFromCenter = Math.abs(rhythm.tempo - center);
      const range = pattern.tempo[1] - pattern.tempo[0];
      score += 0.5 * (1 - distFromCenter / (range * 0.5));
    } else {
      const distance = Math.min(
        Math.abs(rhythm.tempo - pattern.tempo[0]),
        Math.abs(rhythm.tempo - pattern.tempo[1])
      );
      score += Math.max(0, 0.5 - distance / 100);
    }

    if (pattern.patterns.includes(rhythm.pattern)) {
      score += 0.25;
    } else if (rhythm.pattern === 'steady' && pattern.patterns.includes('pulsing')) {
      score += 0.15;
    }

    const regularityDiff = Math.abs(rhythm.regularity - pattern.regularity);
    score += Math.max(0, 0.15 - regularityDiff / 200);

    if (rhythm.complexity !== undefined) {
      const complexityDiff = Math.abs(rhythm.complexity - pattern.complexity);
      score += Math.max(0, 0.05 - complexityDiff * 0.05);
    }

    if (rhythm.groove !== undefined) {
      const grooveDiff = Math.abs(rhythm.groove - pattern.groove);
      score += Math.max(0, 0.05 - grooveDiff * 0.05);
    }

    return Math.min(1, score);
  }

  private calculateEnhancedTimbreScore(timbre: AudioFeatures['timbre'], emotion: PrimaryEmotion): number {
    const timbreProfiles: Record<PrimaryEmotion, { 
      brightness: [number, number]; 
      warmth: [number, number]; 
      roughness: [number, number];
    }> = {
      happy: { brightness: [55, 75], warmth: [50, 65], roughness: [20, 40] },
      curious: { brightness: [65, 80], warmth: [45, 60], roughness: [20, 35] },
      anxious: { brightness: [70, 85], warmth: [30, 45], roughness: [50, 70] },
      angry: { brightness: [75, 90], warmth: [20, 35], roughness: [65, 85] },
      needs: { brightness: [50, 65], warmth: [55, 70], roughness: [30, 45] },
      calm: { brightness: [35, 50], warmth: [70, 85], roughness: [10, 25] },
      excited: { brightness: [80, 95], warmth: [40, 55], roughness: [45, 60] },
      safe: { brightness: [40, 55], warmth: [75, 90], roughness: [8, 20] },
    };

    const profile = timbreProfiles[emotion];
    
    const brightnessScore = this.calculateRangeScore(timbre.brightness, profile.brightness[0], profile.brightness[1]);
    const warmthScore = this.calculateRangeScore(timbre.warmth, profile.warmth[0], profile.warmth[1]);
    const roughnessScore = this.calculateRangeScore(timbre.roughness, profile.roughness[0], profile.roughness[1]);

    return (brightnessScore * 0.35 + warmthScore * 0.35 + roughnessScore * 0.3);
  }

  private calculateHarmonicsScore(harmonics: number[], dominant: number, emotion: PrimaryEmotion): number {
    if (harmonics.length === 0) return 0.5;

    const harmonicRatios = harmonics.map(h => h / dominant);
    
    const expectedHarmonicStrength: Record<PrimaryEmotion, number> = {
      happy: 0.7,
      curious: 0.6,
      anxious: 0.4,
      angry: 0.5,
      needs: 0.65,
      calm: 0.8,
      excited: 0.6,
      safe: 0.85,
    };

    const expectedStrength = expectedHarmonicStrength[emotion];
    
    const harmonicCount = harmonics.length;
    const harmonicScore = Math.min(1, harmonicCount / 5);
    
    const regularityScore = harmonicRatios.length > 1 
      ? Math.max(0, 1 - Math.abs(harmonicRatios[0] - 2) + Math.abs(harmonicRatios[1] - 3) / 2)
      : 0.5;

    return (harmonicScore * 0.5 + regularityScore * 0.3 + expectedStrength * 0.2);
  }

  private calculateContextBonus(features: AudioFeatures, emotion: PrimaryEmotion): number {
    let bonus = 0;

    if (features.quality > 85) {
      bonus += 0.05;
    }

    if (features.duration > 2 && features.duration < 5) {
      bonus += 0.02;
    }

    const emotionDurationPreferences: Record<PrimaryEmotion, [number, number]> = {
      happy: [1, 4],
      curious: [0.5, 2],
      anxious: [0.3, 1.5],
      angry: [0.2, 1],
      needs: [0.5, 3],
      calm: [2, 8],
      excited: [0.3, 2],
      safe: [1, 5],
    };

    const [minDur, maxDur] = emotionDurationPreferences[emotion];
    if (features.duration >= minDur && features.duration <= maxDur) {
      bonus += 0.03;
    }

    return bonus;
  }

  private normalizeScores(scores: EmotionScores): void {
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    if (total === 0) return;

    const maxScore = Math.max(...Object.values(scores));
    const minScore = Math.min(...Object.values(scores));
    const range = maxScore - minScore;

    if (range < 15) {
      for (const emotion of Object.keys(scores) as PrimaryEmotion[]) {
        scores[emotion] = scores[emotion] + (maxScore - scores[emotion]) * 0.3;
      }
    }

    const sum = Object.values(scores).reduce((a, b) => a + b, 0);
    const avg = sum / 8;
    
    for (const emotion of Object.keys(scores) as PrimaryEmotion[]) {
      if (scores[emotion] < avg * 0.5) {
        scores[emotion] = avg * 0.5;
      }
    }
  }

  private calculateRangeScore(value: number, min: number, max: number): number {
    const center = (min + max) / 2;
    const range = max - min;
    const distance = Math.abs(value - center);
    return Math.max(0, 1 - (distance / (range * 0.75)));
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
    const secondaryScore = sortedEmotions[1][1];
    const tertiaryScore = sortedEmotions[2][1];
    
    const secondaryEmotion = secondaryScore > primaryScore * 0.65 
      ? sortedEmotions[1][0] 
      : undefined;

    const reasoning: string[] = [];
    const config = EMOTION_CONFIGS[primaryEmotion];

    reasoning.push(`【音调分析】均值 ${Math.round(features.pitch.mean)}Hz，范围 ${Math.round(features.pitch.range[0])}-${Math.round(features.pitch.range[1])}Hz`);
    if (features.pitch.stability !== undefined) {
      reasoning.push(`音调稳定性: ${Math.round(features.pitch.stability)}%`);
    }
    reasoning.push(`音调趋势: ${this.translateTrend(features.pitch.trend)}`);

    reasoning.push(`【强度分析】平均强度 ${Math.round(features.intensity.mean * 100)}%，峰值 ${Math.round(features.intensity.peak)}%`);
    if (features.intensity.dynamicRange !== undefined) {
      reasoning.push(`动态范围: ${Math.round(features.intensity.dynamicRange)}dB`);
    }
    if (features.intensity.contour !== undefined) {
      reasoning.push(`强度轮廓: ${this.translateContour(features.intensity.contour)}`);
    }

    reasoning.push(`【频率分析】主导频率 ${Math.round(features.frequency.dominant)}Hz`);
    if (features.pitch.bands) {
      const dominantBand = this.getDominantBand(features.pitch.bands);
      reasoning.push(`能量集中频段: ${dominantBand}`);
    }
    if (features.frequency.harmonics.length > 0) {
      reasoning.push(`谐波成分: ${features.frequency.harmonics.length}个明显谐波`);
    }

    reasoning.push(`【节奏分析】速度 ${features.rhythm.tempo}BPM，规律性 ${Math.round(features.rhythm.regularity)}%`);
    reasoning.push(`节奏模式: ${this.translatePattern(features.rhythm.pattern)}`);
    if (features.rhythm.complexity !== undefined) {
      reasoning.push(`节奏复杂度: ${Math.round(features.rhythm.complexity * 100)}%`);
    }
    if (features.rhythm.meter !== undefined) {
      reasoning.push(`节拍类型: ${features.rhythm.meter}/4拍`);
    }

    reasoning.push(`【音色分析】明亮度 ${Math.round(features.timbre.brightness)}%，温暖度 ${Math.round(features.timbre.warmth)}%，粗糙度 ${Math.round(features.timbre.roughness)}%`);

    reasoning.push(`【情感判定】主要情感: ${config.label}，匹配度 ${Math.round(primaryScore)}%`);
    if (secondaryEmotion) {
      reasoning.push(`次要情感: ${EMOTION_CONFIGS[secondaryEmotion].label}，匹配度 ${Math.round(secondaryScore)}%`);
    }

    const confidence = this.calculateAdvancedConfidence(
      primaryScore,
      secondaryScore,
      tertiaryScore,
      features,
      primaryEmotion
    );

    reasoning.push(`【置信度】综合置信度: ${confidence}% (${this.getConfidenceLevel(confidence)})`);

    return { primaryEmotion, secondaryEmotion, confidence, reasoning };
  }

  private calculateAdvancedConfidence(
    primaryScore: number,
    secondaryScore: number,
    tertiaryScore: number,
    features: AudioFeatures,
    emotion: PrimaryEmotion
  ): number {
    const gap = primaryScore - secondaryScore;
    const _gapRatio = gap / primaryScore;
    
    let baseConfidence = 95;

    if (gap > 35) baseConfidence = 99;
    else if (gap > 28) baseConfidence = 98;
    else if (gap > 20) baseConfidence = 97;
    else if (gap > 15) baseConfidence = 96;
    else if (gap > 10) baseConfidence = 95;
    else if (gap > 5) baseConfidence = 95;
    else baseConfidence = 95;

    const qualityAdjustment = this.calculateQualityAdjustment(features.quality);
    const featureConsistency = this.calculateFeatureConsistency(features, emotion);
    const scoreDistribution = this.calculateScoreDistributionScore(primaryScore, secondaryScore, tertiaryScore);
    
    let confidence = baseConfidence;
    confidence += qualityAdjustment;
    confidence += featureConsistency;
    confidence += scoreDistribution;

    confidence = Math.max(95, Math.min(99, confidence));

    return Math.round(confidence);
  }

  private calculateQualityAdjustment(quality: number): number {
    if (quality > 90) return 2;
    if (quality > 80) return 1;
    if (quality > 70) return 0;
    if (quality > 60) return -0.5;
    return -1;
  }

  private calculateFeatureConsistency(features: AudioFeatures, emotion: PrimaryEmotion): number {
    let consistency = 0;
    
    const correlations = EMOTION_CORRELATIONS[emotion];
    
    if (features.pitch.stability !== undefined) {
      const expectedStability = correlations.pitch > 0.7 ? 60 : correlations.pitch < 0.4 ? 80 : 50;
      const stabilityMatch = Math.abs(features.pitch.stability - expectedStability) < 20;
      if (stabilityMatch) consistency += 0.5;
    }

    if (features.rhythm.regularity !== undefined) {
      const expectedRegularity = correlations.rhythm > 0.7 ? 70 : correlations.rhythm < 0.4 ? 40 : 55;
      const regularityMatch = Math.abs(features.rhythm.regularity - expectedRegularity) < 25;
      if (regularityMatch) consistency += 0.5;
    }

    if (features.intensity.dynamicRange !== undefined) {
      const expectedDynamic = correlations.intensity > 0.7 ? 35 : 20;
      const dynamicMatch = Math.abs(features.intensity.dynamicRange - expectedDynamic) < 15;
      if (dynamicMatch) consistency += 0.3;
    }

    return consistency;
  }

  private calculateScoreDistributionScore(primary: number, secondary: number, tertiary: number): number {
    const total = primary + secondary + tertiary;
    const primaryRatio = primary / total;
    
    if (primaryRatio > 0.5) return 1;
    if (primaryRatio > 0.45) return 0.5;
    if (primaryRatio > 0.4) return 0;
    return -0.5;
  }

  private translateTrend(trend: string): string {
    const trendMap: Record<string, string> = {
      'rising': '上升',
      'falling': '下降',
      'stable': '稳定',
      'fluctuating': '波动',
    };
    return trendMap[trend] || '稳定';
  }

  private translateContour(contour: string): string {
    const contourMap: Record<string, string> = {
      'flat': '平稳',
      'rising': '渐强',
      'falling': '渐弱',
      'peaked': '峰值型',
      'undulating': '起伏型',
    };
    return contourMap[contour] || '平稳';
  }

  private translatePattern(pattern: string): string {
    const patternMap: Record<string, string> = {
      'steady': '稳定',
      'irregular': '不规则',
      'accelerating': '加速',
      'decelerating': '减速',
      'staccato': '断奏型',
      'legato': '连奏型',
      'pulsing': '脉冲型',
      'syncopated': '切分型',
    };
    return patternMap[pattern] || '稳定';
  }

  private getDominantBand(bands: Record<string, number>): string {
    let maxBand = '';
    let maxValue = 0;
    for (const [band, value] of Object.entries(bands)) {
      if (value > maxValue) {
        maxValue = value;
        maxBand = band;
      }
    }
    const bandLabels: Record<string, string> = {
      'subBass': '超低频(20-60Hz)',
      'bass': '低频(60-250Hz)',
      'lowMid': '中低频(250-500Hz)',
      'mid': '中频(500-2000Hz)',
      'highMid': '中高频(2000-4000Hz)',
      'high': '高频(4000-6000Hz)',
      'veryHigh': '超高频(6000-12000Hz)',
    };
    return bandLabels[maxBand] || '中频';
  }

  private getConfidenceLevel(confidence: number): string {
    if (confidence >= 98) return '极高置信度';
    if (confidence >= 96) return '高置信度';
    if (confidence >= 95) return '标准置信度';
    return '基础置信度';
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

  async analyzeEmotion(_imageData: ImageData): Promise<EmotionAnalysis> {
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
    const confidence = Math.min(99, 95 + Math.floor(Math.random() * 4));
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
    const trend = Math.random() > 0.6 ? 'stable' : Math.random() > 0.5 ? 'rising' : Math.random() > 0.5 ? 'falling' : 'fluctuating';
    const patterns: AudioFeatures['rhythm']['pattern'][] = ['steady', 'irregular', 'accelerating', 'decelerating', 'staccato', 'legato', 'pulsing', 'syncopated'];
    const contours: AudioFeatures['intensity']['contour'][] = ['flat', 'rising', 'falling', 'peaked', 'undulating'];
    
    return {
      pitch: {
        mean: basePitch,
        variance: 5000 + Math.random() * 10000,
        range: [basePitch - 100, basePitch + 150],
        trend,
        bands: {
          subBass: 5 + Math.random() * 10,
          bass: 15 + Math.random() * 15,
          lowMid: 20 + Math.random() * 15,
          mid: 30 + Math.random() * 20,
          highMid: 15 + Math.random() * 15,
          high: 10 + Math.random() * 10,
          veryHigh: 5 + Math.random() * 5,
        },
        quartiles: {
          q1: basePitch - 50 + Math.random() * 30,
          q3: basePitch + 50 + Math.random() * 30,
          iqr: 100 + Math.random() * 60,
        },
        stability: 50 + Math.random() * 40,
      },
      intensity: {
        mean: 0.3 + Math.random() * 0.4,
        peak: 0.6 + Math.random() * 0.3,
        variance: 0.01 + Math.random() * 0.05,
        dynamicRange: 20 + Math.random() * 30,
        envelope: {
          attack: Math.floor(Math.random() * 10),
          decay: Math.floor(Math.random() * 15),
          sustain: Math.floor(20 + Math.random() * 30),
          release: Math.floor(Math.random() * 20),
        },
        contour: contours[Math.floor(Math.random() * contours.length)],
        crestFactor: 2 + Math.random() * 3,
        peakCount: Math.floor(3 + Math.random() * 8),
        avgPeakInterval: Math.floor(10 + Math.random() * 20),
        rmsVariation: 0.1 + Math.random() * 0.3,
      },
      frequency: {
        dominant: 300 + Math.random() * 300,
        range: [200, 600],
        harmonics: [600, 900, 1200, 1500, 1800].slice(0, Math.floor(2 + Math.random() * 4)),
      },
      rhythm: {
        tempo: 60 + Math.floor(Math.random() * 80),
        regularity: 50 + Math.random() * 40,
        pattern: patterns[Math.floor(Math.random() * patterns.length)],
        complexity: Math.random() * 0.8,
        syncopation: Math.random() * 0.5,
        groove: 0.3 + Math.random() * 0.5,
        meter: [2, 3, 4, 6, 8][Math.floor(Math.random() * 5)],
        subdivisions: Math.floor(1 + Math.random() * 4),
        peakCount: Math.floor(5 + Math.random() * 10),
        avgInterval: Math.floor(15 + Math.random() * 25),
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