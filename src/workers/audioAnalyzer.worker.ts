export interface AudioAnalysisResult {
  pitch: {
    mean: number;
    variance: number;
    range: [number, number];
    trend: 'rising' | 'falling' | 'stable' | 'fluctuating';
    stability: number;
  };
  amplitude: {
    mean: number;
    peak: number;
    rms: number;
    dynamicRange: number;
  };
  frequencySpectrum: number[];
  rhythmFeatures: {
    tempo: number;
    regularity: number;
    pattern: string;
    complexity: number;
    peakCount: number;
  };
}

interface AnalyzeMessage {
  type: 'analyze';
  audioData: Float32Array;
  sampleRate: number;
}

const FREQUENCY_BANDS = {
  subBass: { min: 20, max: 60 },
  bass: { min: 60, max: 250 },
  lowMid: { min: 250, max: 500 },
  mid: { min: 500, max: 2000 },
  highMid: { min: 2000, max: 4000 },
  high: { min: 4000, max: 6000 },
  veryHigh: { min: 6000, max: 12000 },
};

function computeSpectrum(frame: Float32Array): number[] {
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

function detectPitchCandidates(frame: Float32Array, sampleRate: number): number[] {
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
    const normalizedCorr = normFactor > 0 ? (2 * sum) / normFactor : 0;
    correlations.push(normalizedCorr);
  }

  const threshold = 0.8;
  const peaks: number[] = [];
  for (let i = 1; i < correlations.length - 1; i++) {
    if (
      correlations[i] > threshold &&
      correlations[i] > correlations[i - 1] &&
      correlations[i] > correlations[i + 1]
    ) {
      peaks.push(i);
    }
  }

  for (const peakIndex of peaks.slice(0, 3)) {
    const refinedLag = refinePeakPosition(correlations, peakIndex);
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

function refinePeakPosition(correlations: number[], peakIndex: number): number {
  if (peakIndex < 1 || peakIndex >= correlations.length - 1) return peakIndex;

  const y1 = correlations[peakIndex - 1];
  const y2 = correlations[peakIndex];
  const y3 = correlations[peakIndex + 1];

  const denom = y1 - 2 * y2 + y3;
  if (denom === 0) return peakIndex;

  const offset = (y1 - y3) / (2 * denom);
  return peakIndex + Math.max(-0.5, Math.min(0.5, offset));
}

function selectBestPitch(candidates: number[]): number {
  if (candidates.length === 0) return 0;
  if (candidates.length === 1) return candidates[0];

  const weights = candidates.map((p, i) => {
    const weight = 1 - i * 0.2;
    const petRangeWeight = p >= 200 && p <= 1500 ? 1.5 : 1;
    return weight * petRangeWeight;
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const weightedSum = candidates.reduce((a, p, i) => a + p * weights[i], 0);

  return weightedSum / totalWeight;
}

function analyzePitch(audioData: Float32Array, sampleRate: number) {
  const frameSize = 2048;
  const hopSize = 512;
  const pitches: number[] = [];

  for (let i = 0; i < audioData.length - frameSize; i += hopSize) {
    const frame = audioData.slice(i, i + frameSize);
    const pitchCandidates = detectPitchCandidates(frame, sampleRate);
    if (pitchCandidates.length > 0) {
      const bestPitch = selectBestPitch(pitchCandidates);
      if (bestPitch > 50 && bestPitch < 4000) {
        pitches.push(bestPitch);
      }
    }
  }

  if (pitches.length === 0) {
    return {
      mean: 400,
      variance: 50,
      range: [300, 500] as [number, number],
      trend: 'stable' as const,
      stability: 70,
    };
  }

  const mean = pitches.reduce((a, b) => a + b, 0) / pitches.length;
  const variance = pitches.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / pitches.length;
  const stdDev = Math.sqrt(variance);
  const minPitch = Math.min(...pitches);
  const maxPitch = Math.max(...pitches);

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

  const stability = Math.max(0, 100 - (stdDev / mean) * 100);

  return {
    mean,
    variance,
    range: [minPitch, maxPitch] as [number, number],
    trend,
    stability,
  };
}

function analyzeAmplitude(audioData: Float32Array) {
  const frameSize = 1024;
  const hopSize = 256;
  const intensities: number[] = [];

  for (let i = 0; i < audioData.length; i += hopSize) {
    const frame = audioData.slice(i, Math.min(i + frameSize, audioData.length));
    const rms = Math.sqrt(frame.reduce((sum, val) => sum + val * val, 0) / frame.length);
    intensities.push(rms * 100);
  }

  if (intensities.length === 0) {
    return {
      mean: 30,
      peak: 50,
      rms: 30,
      dynamicRange: 20,
    };
  }

  const mean = intensities.reduce((a, b) => a + b, 0) / intensities.length;
  const peak = Math.max(...intensities);
  const minIntensity = Math.min(...intensities.filter((i) => i > 0.1));
  const dynamicRange = peak - (minIntensity || mean * 0.1);
  const rms = Math.sqrt(audioData.reduce((sum, val) => sum + val * val, 0) / audioData.length) * 100;

  return {
    mean,
    peak,
    rms,
    dynamicRange,
  };
}

function analyzeFrequencySpectrum(audioData: Float32Array, sampleRate: number): number[] {
  const fftSize = Math.min(8192, audioData.length);
  const frame = audioData.slice(0, fftSize);
  return computeSpectrum(frame);
}

function analyzeRhythm(audioData: Float32Array, sampleRate: number) {
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
      peakCount: 0,
    };
  }

  const meanEnergy = energies.reduce((a, b) => a + b, 0) / energies.length;
  const stdEnergy = Math.sqrt(
    energies.reduce((a, b) => a + Math.pow(b - meanEnergy, 2), 0) / energies.length
  );
  const threshold = meanEnergy + stdEnergy * 0.5;

  const peaks: number[] = [];
  for (let i = 1; i < energies.length - 1; i++) {
    if (
      energies[i] > threshold &&
      energies[i] > energies[i - 1] &&
      energies[i] > energies[i + 1]
    ) {
      peaks.push(i);
    }
  }

  const intervals: number[] = [];
  for (let i = 1; i < peaks.length; i++) {
    intervals.push(peaks[i] - peaks[i - 1]);
  }

  const avgInterval =
    intervals.length > 0
      ? intervals.reduce((a, b) => a + b, 0) / intervals.length
      : 10;

  const tempo = Math.round(60 / ((avgInterval * hopSize) / sampleRate));

  const variance =
    intervals.length > 1
      ? intervals.reduce((a, b) => a + Math.pow(b - avgInterval, 2), 0) / intervals.length
      : 0;

  const regularity = Math.max(0, 100 - variance * 10);

  const pattern = detectRhythmPattern(intervals);

  const complexity = calculateRhythmComplexity(intervals, energies);

  return {
    tempo: Math.min(200, Math.max(40, tempo)),
    regularity,
    pattern,
    complexity,
    peakCount: peaks.length,
  };
}

function detectRhythmPattern(intervals: number[]): string {
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

function calculateRhythmComplexity(intervals: number[], energies: number[]): number {
  if (intervals.length < 2) return 0;

  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const uniqueIntervals = new Set(intervals.map((i) => Math.round((i / avgInterval) * 4))).size;
  const intervalComplexity = Math.min(1, uniqueIntervals / 8);

  const avgEnergy = energies.reduce((a, b) => a + b, 0) / energies.length;
  const energyVariation =
    Math.sqrt(
      energies.reduce((a, b) => a + Math.pow(b - avgEnergy, 2), 0) / energies.length
    ) / (avgEnergy || 1);
  const energyComplexity = Math.min(1, energyVariation);

  return intervalComplexity * 0.6 + energyComplexity * 0.4;
}

function analyzeAudio(audioData: Float32Array, sampleRate: number): AudioAnalysisResult {
  try {
    if (!audioData || audioData.length === 0) {
      throw new Error('Invalid audio data');
    }

    const pitch = analyzePitch(audioData, sampleRate);
    const amplitude = analyzeAmplitude(audioData);
    const frequencySpectrum = analyzeFrequencySpectrum(audioData, sampleRate);
    const rhythmFeatures = analyzeRhythm(audioData, sampleRate);

    return {
      pitch,
      amplitude,
      frequencySpectrum,
      rhythmFeatures,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Audio analysis failed: ${message}`);
  }
}

self.onmessage = function (e: MessageEvent<AnalyzeMessage>) {
  const { type, audioData, sampleRate } = e.data;

  if (type === 'analyze') {
    try {
      const result = analyzeAudio(audioData, sampleRate);
      self.postMessage({
        type: 'result',
        result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      self.postMessage({
        type: 'error',
        error: message,
      });
    }
  }
};

export {};
