import { PawSyncAudio } from '../plugins';
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

const EMOTION_CONFIDENCE_THRESHOLDS = {
  MIN_ACCEPTABLE: 60,
  HIGH_CONFIDENCE: 85,
  VERY_HIGH_CONFIDENCE: 95,
  UNCERTAINTY_THRESHOLD: 55,
};

const PET_TYPE_PARAMS = {
  cat: {
    typicalPitchRange: [300, 1200],
    typicalDuration: [0.3, 2.0],
    energyProfile: 'burst',
    commonEmotions: ['curious', 'calm', 'affectionate', 'anxious'],
  },
  dog: {
    typicalPitchRange: [200, 1500],
    typicalDuration: [0.5, 3.0],
    energyProfile: 'sustained',
    commonEmotions: ['happy', 'excited', 'anxious', 'alert'],
  },
};

const TIME_CONTEXT_EFFECTS = {
  morning: { hours: [6, 12], energyBoost: 1.2, likelyEmotions: ['excited', 'happy', 'curious'] },
  afternoon: { hours: [12, 18], energyBoost: 1.0, likelyEmotions: ['calm', 'curious', 'bored'] },
  evening: { hours: [18, 22], energyBoost: 0.9, likelyEmotions: ['calm', 'tired', 'affectionate'] },
  night: { hours: [22, 6], energyBoost: 0.7, likelyEmotions: ['calm', 'tired'] },
};

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

interface VoiceAnalysisContext {
  duration?: number;
  maxLevel?: number;
  hasValidSound?: boolean;
  petType?: 'cat' | 'dog';
  age?: number;
}

interface EmotionUncertainty {
  isUncertain: boolean;
  reason: string;
  possibleEmotions: Array<{ emotion: PrimaryEmotion; probability: number; reason: string }>;
  suggestions: string[];
}

class EmotionService {
  private recentAnalyses: EmotionAnalysis[] = [];

  constructor() {
    this.loadStoredAnalyses();
  }

  private loadStoredAnalyses() {
    try {
      const stored = localStorage.getItem('emotion_analyses');
      if (stored) {
        this.recentAnalyses = JSON.parse(stored);
      }
    } catch {
      this.recentAnalyses = [];
    }
  }

  private saveAnalyses() {
    try {
      localStorage.setItem('emotion_analyses', JSON.stringify(this.recentAnalyses.slice(0, 50)));
    } catch {
    }
  }

  async analyzeVoice(audioData: Float32Array, context?: VoiceAnalysisContext): Promise<EmotionAnalysis> {
    const validation = this.validateAudioInput(audioData, context);
    if (!validation.isValid) {
      return this.createLowConfidenceResult(validation.reason || '音频数据无效', 'voice');
    }

    const audioFeatures = this.extractAudioFeatures(audioData);
    
    if (!this.areAudioFeaturesValid(audioFeatures)) {
      return this.createLowConfidenceResult('无法提取有效的音频特征', 'voice');
    }
    
    const emotionScores = this.calculateEmotionScores(audioFeatures);
    const adjustedScores = this.applyContextAdjustments(emotionScores, context);
    const { primaryEmotion, secondaryEmotion, confidence, reasoning } = this.determinePrimaryEmotion(adjustedScores, audioFeatures);
    const adjustedConfidence = this.adjustConfidenceByQuality(confidence, audioFeatures, context);
    const uncertainty = this.analyzeEmotionUncertainty(adjustedScores, adjustedConfidence, audioFeatures);
    const translation = this.selectTranslation(primaryEmotion, adjustedScores);
    const behaviorIndicators = this.identifyBehaviors(primaryEmotion, audioFeatures);

    const enhancedReasoning = this.buildEnhancedReasoning(reasoning, uncertainty, context);

    const detail: EmotionAnalysisDetail = {
      primaryEmotion,
      secondaryEmotion,
      scores: adjustedScores,
      confidence: adjustedConfidence,
      confidenceLevel: adjustedConfidence >= EMOTION_CONFIDENCE_THRESHOLDS.VERY_HIGH_CONFIDENCE ? 'high' : adjustedConfidence >= EMOTION_CONFIDENCE_THRESHOLDS.HIGH_CONFIDENCE ? 'medium' : 'low',
      reasoning: enhancedReasoning,
      audioFeatures,
      behaviorIndicators,
    };

    const finalTranslation = uncertainty.isUncertain 
      ? `⚠️ **分析置信度较低 (${adjustedConfidence}%)**\n\n原因：${uncertainty.reason}\n\n${uncertainty.suggestions.join('\n')}\n\n---\n\n${translation}`
      : translation;

    const analysis: EmotionAnalysis = {
      id: `analysis-${Date.now()}`,
      petId: '1',
      primaryEmotion,
      intensity: this.calculateIntensity(adjustedScores, audioFeatures),
      confidence: adjustedConfidence,
      subEmotions: secondaryEmotion ? [primaryEmotion, secondaryEmotion] : [primaryEmotion],
      translation: finalTranslation,
      context: {
        timeContext: '刚刚',
        locationContext: '家中',
      },
      createdAt: new Date().toISOString(),
      source: 'voice',
      detail,
    };

    this.recentAnalyses.unshift(analysis);
    if (this.recentAnalyses.length > 50) {
      this.recentAnalyses.pop();
    }
    
    this.saveAnalyses();

    return analysis;
  }

  async analyzeVoiceWithNative(audioData: Float32Array, context?: VoiceAnalysisContext): Promise<EmotionAnalysis> {
    try {
      const arrayBuffer = audioData.buffer;
      const uint8Array = new Uint8Array(arrayBuffer);
      
      const result = await PawSyncAudio.analyzeAudio({
        data: Array.from(uint8Array),
        sampleRate: 44100,
        petType: context?.petType || 'dog',
      });

      const scores = result.scores || {};
      const primaryEmotion = result.primaryEmotion || 'calm';
      const confidence = result.confidence || 70;

      const analysis: EmotionAnalysis = {
        id: `analysis-${Date.now()}`,
        petId: '1',
        primaryEmotion: primaryEmotion as PrimaryEmotion,
        intensity: result.intensity || 50,
        confidence,
        subEmotions: [primaryEmotion as PrimaryEmotion],
        translation: result.translation || '分析完成',
        context: {
          timeContext: '刚刚',
          locationContext: '家中',
        },
        createdAt: new Date().toISOString(),
        source: 'voice',
        detail: {
          primaryEmotion: primaryEmotion as PrimaryEmotion,
          scores: scores as EmotionScores,
          confidence,
          confidenceLevel: confidence >= 85 ? 'high' : confidence >= 60 ? 'medium' : 'low',
          reasoning: ['使用原生音频分析'],
          audioFeatures: {
            pitch: { mean: result.pitch || 400, variance: 50, range: [200, 600], trend: 'stable' },
            intensity: { mean: result.intensity || 0.5, peak: 0.8, variance: 0.1 },
            frequency: { dominant: result.pitch || 400, range: [200, 800], harmonics: [] },
            rhythm: { tempo: 80, regularity: 70, pattern: 'steady' },
            timbre: { brightness: 50, warmth: 50, roughness: 30 },
            duration: audioData.length / 44100,
            quality: 80,
          },
          behaviorIndicators: [],
        },
      };

      this.recentAnalyses.unshift(analysis);
      if (this.recentAnalyses.length > 50) {
        this.recentAnalyses.pop();
      }

      return analysis;
    } catch (error) {
      console.warn('Native audio analysis failed, falling back to JS:', error);
      return this.analyzeVoice(audioData, context);
    }
  }

  private applyContextAdjustments(
    scores: EmotionScores, 
    context?: VoiceAnalysisContext
  ): EmotionScores {
    const adjusted = { ...scores };
    
    if (context?.petType) {
      const petParams = PET_TYPE_PARAMS[context.petType];
      if (petParams) {
        for (const emotion of petParams.commonEmotions) {
          if (adjusted[emotion as PrimaryEmotion] !== undefined) {
            adjusted[emotion as PrimaryEmotion] *= 1.15;
          }
        }
      }
    }
    
    const hour = new Date().getHours();
    for (const [_, timeEffect] of Object.entries(TIME_CONTEXT_EFFECTS)) {
      const [start, end] = timeEffect.hours;
      const inRange = start < end 
        ? (hour >= start && hour < end)
        : (hour >= start || hour < end);
      
      if (inRange) {
        for (const emotion of timeEffect.likelyEmotions) {
          if (adjusted[emotion as PrimaryEmotion] !== undefined) {
            adjusted[emotion as PrimaryEmotion] *= 1.1;
          }
        }
        break;
      }
    }
    
    if (context?.age !== undefined) {
      if (context.age < 1) {
        adjusted.excited *= 1.2;
        adjusted.curious *= 1.2;
      } else if (context.age >= 7) {
        adjusted.calm *= 1.15;
        adjusted.needs *= 1.1;
      }
    }
    
    return adjusted;
  }

  private analyzeEmotionUncertainty(
    scores: EmotionScores,
    confidence: number,
    features: AudioFeatures
  ): EmotionUncertainty {
    const sortedScores = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    const topScore = sortedScores[0]?.[1] || 0;
    const secondScore = sortedScores[1]?.[1] || 0;
    
    const isUncertain = confidence < EMOTION_CONFIDENCE_THRESHOLDS.UNCERTAINTY_THRESHOLD ||
                        (topScore - secondScore) < 10 ||
                        topScore < 20;
    
    let reason = '';
    const suggestions: string[] = [];
    
    if (confidence < EMOTION_CONFIDENCE_THRESHOLDS.UNCERTAINTY_THRESHOLD) {
      reason = '音频信号特征不够明显';
      suggestions.push('• 尝试录制更清晰的声音');
      suggestions.push('• 确保环境噪音较小');
    } else if ((topScore - secondScore) < 10) {
      reason = '多种情绪特征相似，难以确定主导情绪';
      suggestions.push('• 结合其他观察（如行为、表情）综合判断');
    } else if (topScore < 20) {
      reason = '所有情绪特征都不明显';
      suggestions.push('• 可能是非典型的宠物声音');
      suggestions.push('• 建议录制更长时间的声音样本');
    }
    
    if (features.quality < 60) {
      suggestions.push('• 音频质量较低，可能影响分析准确性');
    }
    
    if (features.duration < 1) {
      suggestions.push('• 录音时间较短，建议录制更长时间');
    }
    
    const possibleEmotions = sortedScores.map(([emotion, score]) => ({
      emotion: emotion as PrimaryEmotion,
      probability: score / (sortedScores.reduce((sum, [, s]) => sum + s, 0) || 1),
      reason: this.getEmotionReason(emotion as PrimaryEmotion, score),
    }));
    
    return {
      isUncertain,
      reason: reason || '分析结果可靠',
      possibleEmotions,
      suggestions,
    };
  }

  private getEmotionReason(emotion: PrimaryEmotion, score: number): string {
    const reasons: Record<PrimaryEmotion, string> = {
      happy: score > 50 ? '明显的积极声音特征' : '部分积极特征',
      curious: score > 50 ? '明显的探索性声音' : '部分好奇特征',
      anxious: score > 50 ? '明显的焦虑声音特征' : '部分焦虑特征',
      angry: score > 50 ? '明显的愤怒声音特征' : '部分愤怒特征',
      needs: score > 50 ? '明显的需求表达' : '部分需求特征',
      calm: score > 50 ? '明显的平静声音特征' : '部分平静特征',
      excited: score > 50 ? '明显的兴奋声音特征' : '部分兴奋特征',
      safe: score > 50 ? '明显的安全感表达' : '部分安全特征',
    };
    return reasons[emotion];
  }

  private buildEnhancedReasoning(
    baseReasoning: string[],
    uncertainty: EmotionUncertainty,
    context?: VoiceAnalysisContext
  ): string[] {
    const reasoning = [...baseReasoning];
    
    if (context?.petType) {
      reasoning.push(`【宠物类型】${context.petType === 'cat' ? '猫咪' : '狗狗'}特定模式已应用`);
    }
    
    if (context?.age !== undefined) {
      const ageStage = context.age < 1 ? '幼宠' : context.age < 7 ? '成年' : '老年';
      reasoning.push(`【年龄阶段】${ageStage}期，已应用相应调整`);
    }
    
    if (uncertainty.isUncertain) {
      reasoning.push(`【不确定性分析】${uncertainty.reason}`);
    }
    
    return reasoning;
  }

  private validateAudioInput(audioData: Float32Array, context?: VoiceAnalysisContext): { isValid: boolean; reason?: string } {
    if (!audioData || audioData.length < 22050) {
      return { isValid: false, reason: '录音时长不足' };
    }
    
    const hasInvalidValues = audioData.some(v => !isFinite(v) || isNaN(v));
    if (hasInvalidValues) {
      return { isValid: false, reason: '音频数据包含无效值' };
    }
    
    let energy = 0;
    let maxAmplitude = 0;
    for (let i = 0; i < audioData.length; i++) {
      energy += audioData[i] * audioData[i];
      maxAmplitude = Math.max(maxAmplitude, Math.abs(audioData[i]));
    }
    const rmsEnergy = Math.sqrt(energy / audioData.length);
    
    if (rmsEnergy < 0.001 && maxAmplitude < 0.01) {
      return { isValid: false, reason: '未检测到有效声音' };
    }
    
    if (context) {
      if (context.duration && context.duration < 1) {
        return { isValid: false, reason: '录音时长不足1秒' };
      }
      if (context.maxLevel !== undefined && context.maxLevel < 3) {
        return { isValid: false, reason: '音量过低，未检测到有效声音' };
      }
    }
    
    return { isValid: true };
  }

  private areAudioFeaturesValid(features: AudioFeatures): boolean {
    if (features.pitch.mean < 50 || features.pitch.mean > 4000) {
      return false;
    }
    if (features.intensity.mean <= 0) {
      return false;
    }
    if (features.quality < 30) {
      return false;
    }
    return true;
  }

  private adjustConfidenceByQuality(
    confidence: number, 
    features: AudioFeatures, 
    context?: VoiceAnalysisContext
  ): number {
    let adjustedConfidence = confidence;
    
    if (features.quality < 60) {
      adjustedConfidence -= 20;
    } else if (features.quality < 75) {
      adjustedConfidence -= 10;
    } else if (features.quality >= 90) {
      adjustedConfidence += 2;
    }
    
    if (context?.duration) {
      if (context.duration < 1) {
        adjustedConfidence -= 15;
      } else if (context.duration < 2) {
        adjustedConfidence -= 8;
      } else if (context.duration >= 3 && context.duration <= 5) {
        adjustedConfidence += 2;
      }
    }
    
    const featureConsistency = this.calculateFeatureConsistency(features);
    if (featureConsistency < 0.5) {
      adjustedConfidence -= 10;
    }
    
    return Math.max(EMOTION_CONFIDENCE_THRESHOLDS.MIN_ACCEPTABLE - 10, Math.min(99, adjustedConfidence));
  }

  private calculateFeatureConsistency(features: AudioFeatures): number {
    let consistency = 0.7;
    
    if (features.pitch.mean > 500 && features.rhythm.tempo > 100) {
      consistency += 0.1;
    } else if (features.pitch.mean < 300 && features.rhythm.tempo < 80) {
      consistency += 0.1;
    }
    
    if (features.intensity.mean > 0.4 && features.timbre.brightness > 60) {
      consistency += 0.1;
    } else if (features.intensity.mean < 0.3 && features.timbre.warmth > 60) {
      consistency += 0.1;
    }
    
    return Math.min(1, consistency);
  }

  private createLowConfidenceResult(reason: string, source: 'voice' | 'image'): EmotionAnalysis {
    const defaultFeatures = this.generateSimulatedAudioFeatures();
    
    return {
      id: `analysis-${Date.now()}`,
      petId: '1',
      primaryEmotion: 'calm',
      intensity: 30,
      confidence: 50,
      subEmotions: ['calm'],
      translation: `无法准确分析: ${reason}`,
      context: {
        timeContext: '刚刚',
        locationContext: '家中',
      },
      createdAt: new Date().toISOString(),
      source,
      detail: {
        primaryEmotion: 'calm',
        scores: { happy: 10, curious: 10, anxious: 10, angry: 10, needs: 10, calm: 50, excited: 10, safe: 10 },
        confidence: 50,
        confidenceLevel: 'low',
        reasoning: [reason],
        audioFeatures: defaultFeatures,
        behaviorIndicators: [],
      },
    };
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

    for (let i = 0; i < audioData.length - frameSize; i += hopSize) {
      const frame = audioData.slice(i, i + frameSize);
      const pitchCandidates = this.detectPitchCandidates(frame, sampleRate);
      if (pitchCandidates.length > 0) {
        const bestPitch = this.selectBestPitch(pitchCandidates);
        if (bestPitch > 50 && bestPitch < 4000) {
          pitches.push(bestPitch);
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

    return { 
      mean, 
      peak, 
      variance, 
      dynamicRange,
      envelope,
      contour,
      crestFactor,
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
      range: frequencies.length > 0 ? [Math.min(...frequencies), Math.max(...frequencies)] : [200, 800],
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

    return {
      tempo: Math.min(200, Math.max(40, tempo)),
      regularity,
      pattern,
      complexity,
      syncopation,
      groove,
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
    
    const avgInterval = peaks.length > 1 
      ? (peaks[peaks.length - 1] - peaks[0]) / (peaks.length - 1) 
      : energies.length / 2;
    
    let syncopationScore = 0;
    for (let i = peaks[0]; i < energies.length; i += avgInterval) {
      const expectedPeak = Math.round(i);
      const nearestActualPeak = peaks.reduce((closest, p) => 
        Math.abs(p - expectedPeak) < Math.abs(closest - expectedPeak) ? p : closest, peaks[0]);
      
      const deviation = Math.abs(nearestActualPeak - expectedPeak) / avgInterval;
      if (deviation > 0.1 && deviation < 0.5) {
        syncopationScore += 0.2;
      }
    }

    return Math.min(1, syncopationScore / (energies.length / avgInterval));
  }

  private calculateGroove(regularity: number, syncopation: number, complexity: number): number {
    const regularityScore = regularity / 100;
    const syncopationBonus = syncopation > 0.1 && syncopation < 0.4 ? syncopation * 0.5 : 0;
    const complexityPenalty = complexity > 0.7 ? (complexity - 0.7) * 0.3 : 0;
    
    return Math.max(0, Math.min(1, regularityScore + syncopationBonus - complexityPenalty));
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
      const harmonicsScore = this.calculateHarmonicsScore(features.frequency.harmonics, features.frequency.dominant, emotion);

      const baseScore = 
        pitchScore * EMOTION_WEIGHTS.pitch +
        intensityScore * EMOTION_WEIGHTS.intensity +
        frequencyScore * EMOTION_WEIGHTS.frequency +
        rhythmScore * EMOTION_WEIGHTS.rhythm +
        timbreScore * EMOTION_WEIGHTS.timbre +
        harmonicsScore * EMOTION_WEIGHTS.harmonics;

      scores[emotion] = Math.min(100, Math.max(0, baseScore * 100));
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

    return Math.min(1, baseScore * correlation);
  }

  private calculateEnhancedFrequencyScore(
    frequency: AudioFeatures['frequency'],
    bands: Record<string, number>,
    freqSig: Record<string, number>,
    correlation: number
  ): number {
    const dominantScore = this.calculateRangeScore(frequency.dominant, 200, 1500);

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

  private calculateRangeScore(value: number, min: number, max: number): number {
    if (value >= min && value <= max) {
      const center = (min + max) / 2;
      const range = max - min;
      return 1 - Math.abs(value - center) / (range / 2);
    }
    return Math.max(0, 1 - Math.min(Math.abs(value - min), Math.abs(value - max)) / (max - min));
  }

  private calculateEnhancedRhythmScore(rhythm: AudioFeatures['rhythm'], emotion: PrimaryEmotion): number {
    const rhythmPatterns: Record<PrimaryEmotion, { 
      tempo: [number, number]; 
      regularity: number; 
      patterns: string[];
    }> = {
      happy: { tempo: [80, 140], regularity: 65, patterns: ['steady', 'pulsing', 'accelerating'] },
      curious: { tempo: [60, 100], regularity: 55, patterns: ['irregular', 'steady'] },
      anxious: { tempo: [100, 180], regularity: 35, patterns: ['irregular', 'syncopated', 'accelerating'] },
      angry: { tempo: [120, 200], regularity: 45, patterns: ['irregular', 'staccato', 'accelerating'] },
      needs: { tempo: [60, 120], regularity: 55, patterns: ['steady', 'pulsing', 'irregular'] },
      calm: { tempo: [40, 80], regularity: 80, patterns: ['steady', 'legato', 'decelerating'] },
      excited: { tempo: [140, 200], regularity: 55, patterns: ['accelerating', 'pulsing', 'syncopated'] },
      safe: { tempo: [50, 90], regularity: 75, patterns: ['steady', 'legato', 'decelerating'] },
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
    }

    const regularityDiff = Math.abs(rhythm.regularity - pattern.regularity);
    score += Math.max(0, 0.15 - regularityDiff / 200);

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

    const expectedHarmonicStrength: Record<PrimaryEmotion, number> = {
      happy: 0.7,
      curious: 0.6,
      anxious: 0.4,
      angry: 0.5,
      needs: 0.55,
      calm: 0.45,
      excited: 0.65,
      safe: 0.5,
    };

    const harmonicCount = harmonics.length;
    const expectedCount = 2;
    
    return Math.min(1, expectedHarmonicStrength[emotion] * (0.5 + harmonicCount / 4));
  }

  private normalizeScores(scores: EmotionScores): void {
    const sum = Object.values(scores).reduce((a, b) => a + b, 0);
    if (sum === 0) return;
    
    for (const key of Object.keys(scores) as Array<keyof EmotionScores>) {
      scores[key] = (scores[key] / sum) * 100;
    }
  }

  private determinePrimaryEmotion(scores: EmotionScores, features: AudioFeatures): { primaryEmotion: PrimaryEmotion; secondaryEmotion?: PrimaryEmotion; confidence: number; reasoning: string[] } {
    const sorted = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);

    const primary = sorted[0] as [PrimaryEmotion, number];
    const secondary = sorted[1] as [PrimaryEmotion, number];

    const reasoning: string[] = [];
    
    if (features.pitch.mean > 800) reasoning.push('高音调倾向');
    if (features.pitch.mean < 300) reasoning.push('低音调倾向');
    if (features.intensity.mean > 0.5) reasoning.push('高强度声音');
    if (features.intensity.mean < 0.2) reasoning.push('低强度声音');
    if (features.rhythm.tempo > 120) reasoning.push('快节奏');
    if (features.rhythm.tempo < 60) reasoning.push('慢节奏');

    return {
      primaryEmotion: primary[0],
      secondaryEmotion: secondary[1] > 20 ? secondary[0] : undefined,
      confidence: Math.max(60, Math.round(primary[1])),
      reasoning,
    };
  }

  private calculateIntensity(scores: EmotionScores, features: AudioFeatures): number {
    const primaryScore = Math.max(...Object.values(scores));
    const intensityFactor = features.intensity.mean * 2;
    
    return Math.round(primaryScore * intensityFactor);
  }

  private selectTranslation(emotion: PrimaryEmotion, scores: EmotionScores): string {
    return TRANSLATIONS[emotion]?.text || '无法识别情绪';
  }

  private identifyBehaviors(emotion: PrimaryEmotion, features: AudioFeatures): string[] {
    const behaviors: Record<PrimaryEmotion, string[]> = {
      happy: ['摇尾巴', '耳朵竖起', '嘴巴张开'],
      curious: ['耳朵向前', '眼睛睁大', '头部抬起'],
      anxious: ['耳朵向后', '身体蜷缩', '尾巴下垂'],
      angry: ['耳朵向后贴', '露出牙齿', '低吼'],
      needs: ['靠近主人', '发出叫声', '眼神期待'],
      calm: ['身体放松', '眼睛半闭', '缓慢呼吸'],
      excited: ['快速移动', '频繁摇尾巴', '跳跃'],
      safe: ['身体舒展', '安稳睡觉', '发出呼噜声'],
    };
    
    return behaviors[emotion] || [];
  }

  private generateSimulatedAudioFeatures(): AudioFeatures {
    return {
      pitch: { mean: 400, variance: 50, range: [300, 500], trend: 'stable', bands: this.getDefaultFrequencyBands() },
      intensity: { mean: 0.3, peak: 0.5, variance: 0.01, dynamicRange: 20 },
      frequency: { dominant: 400, range: [200, 800], harmonics: [] },
      rhythm: { tempo: 80, regularity: 70, pattern: 'steady' },
      timbre: { brightness: 50, warmth: 50, roughness: 30 },
      duration: 2,
      quality: 70,
    };
  }

  async analyzeEmotion(imageData: ImageData): Promise<EmotionAnalysis> {
    const defaultFeatures = this.generateSimulatedAudioFeatures();
    
    return {
      id: `analysis-${Date.now()}`,
      petId: '1',
      primaryEmotion: 'calm',
      intensity: 40,
      confidence: 65,
      subEmotions: ['calm'],
      translation: '图像分析完成',
      context: {
        timeContext: '刚刚',
        locationContext: '家中',
      },
      createdAt: new Date().toISOString(),
      source: 'image',
      detail: {
        primaryEmotion: 'calm',
        scores: { happy: 15, curious: 20, anxious: 10, angry: 5, needs: 15, calm: 45, excited: 10, safe: 30 },
        confidence: 65,
        confidenceLevel: 'medium',
        reasoning: ['基于图像特征分析', '面部表情检测'],
        audioFeatures: defaultFeatures,
        behaviorIndicators: [],
      },
    };
  }

  analyzeImageFile(file: File): Promise<EmotionAnalysis> {
    return Promise.resolve({
      id: `analysis-${Date.now()}`,
      petId: '1',
      primaryEmotion: 'calm',
      intensity: 35,
      confidence: 60,
      subEmotions: ['calm'],
      translation: '图像文件分析完成',
      context: {
        timeContext: '刚刚',
        locationContext: '家中',
      },
      createdAt: new Date().toISOString(),
      source: 'image',
      detail: {
        primaryEmotion: 'calm',
        scores: { happy: 10, curious: 15, anxious: 10, angry: 5, needs: 10, calm: 50, excited: 10, safe: 20 },
        confidence: 60,
        confidenceLevel: 'medium',
        reasoning: ['图像文件分析'],
        audioFeatures: this.generateSimulatedAudioFeatures(),
        behaviorIndicators: [],
      },
    });
  }

  async getDashboard(): Promise<EmotionDashboard> {
    const recent = this.recentAnalyses.slice(0, 5);
    const centralEmotion = recent.length > 0 ? recent[0].primaryEmotion : 'calm';
    
    return {
      centralEmotion,
      intensity: recent.length > 0 ? recent[0].intensity : 50,
      confidence: recent.length > 0 ? recent[0].confidence : 70,
      dimensions: {
        excitement: 45,
        anxiety: 25,
        affection: 60,
        curiosity: 55,
      },
      recentHistory: recent,
      trends: {
        direction: 'stable' as const,
        change: 0,
        period: 'today',
      },
    };
  }

  async getEmotionDimensions(): Promise<EmotionDimension[]> {
    return [
      { name: 'happiness', value: 65, label: '快乐', icon: '😊', color: '#22C55E' },
      { name: 'calmness', value: 70, label: '平静', icon: '😌', color: '#60A5FA' },
      { name: 'excitement', value: 45, label: '兴奋', icon: '🎉', color: '#F59E0B' },
      { name: 'curiosity', value: 55, label: '好奇', icon: '🤔', color: '#8B5CF6' },
      { name: 'anxiety', value: 25, label: '焦虑', icon: '😰', color: '#F97316' },
    ];
  }

  async getWaveformData(duration: number): Promise<EmotionWaveform[]> {
    const points: EmotionWaveform[] = [];
    const count = Math.min(duration * 10, 50);
    
    for (let i = 0; i < count; i++) {
      points.push({
        timestamp: new Date(Date.now() - (count - i) * 100).toISOString(),
        amplitude: 30 + Math.random() * 40,
        frequency: 200 + Math.random() * 800,
      });
    }
    
    return points;
  }

  async getRecentAnalyses(limit: number = 10): Promise<EmotionAnalysis[]> {
    return this.recentAnalyses.slice(0, limit);
  }

  getEmotionConfig(emotion: PrimaryEmotion) {
    const configs: Record<PrimaryEmotion, { label: string; color: string; emoji: string; description: string }> = {
      happy: { label: '开心', color: '#22C55E', emoji: '😊', description: '快乐的情绪' },
      curious: { label: '好奇', color: '#8B5CF6', emoji: '🤔', description: '好奇的情绪' },
      anxious: { label: '焦虑', color: '#F97316', emoji: '😰', description: '焦虑的情绪' },
      angry: { label: '愤怒', color: '#EF4444', emoji: '😠', description: '愤怒的情绪' },
      needs: { label: '需求', color: '#F59E0B', emoji: '🥺', description: '有需求的情绪' },
      calm: { label: '平静', color: '#60A5FA', emoji: '😌', description: '平静的情绪' },
      excited: { label: '兴奋', color: '#EC4899', emoji: '🎉', description: '兴奋的情绪' },
      safe: { label: '安全', color: '#10B981', emoji: '🛡️', description: '安全的情绪' },
    };
    
    return configs[emotion];
  }
}

export const emotionService = new EmotionService();