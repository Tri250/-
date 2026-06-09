/**
 * 音频分析模型服务
 * 支持 FFT 基础分析（当前）和 TF.js YAMNet embedding（未来）
 * 支持 Web Worker 非阻塞推理
 */

import type {
  AudioAnalysisOptions,
  AudioAnalysisResult,
  FFTAnalysisResult,
  AudioFeatures,
  AudioClassificationResult,
  AudioEmotionResult,
  InferenceMode,
  DEFAULT_AUDIO_OPTIONS,
} from './types';
import { modelLoader } from './modelLoader';

// ==================== 类型定义 ====================

/**
 * Web Worker 消息类型
 */
interface WorkerMessage {
  id: string;
  type: 'init' | 'analyze' | 'terminate';
  data: unknown;
}

/**
 * Worker 分析请求
 */
interface WorkerAnalyzeRequest {
  audioData: Float32Array;
  sampleRate: number;
  options: AudioAnalysisOptions;
}

/**
 * Worker 分析响应
 */
interface WorkerAnalyzeResponse {
  fftResult?: FFTAnalysisResult;
  features?: AudioFeatures;
  classification?: AudioClassificationResult;
  emotion?: AudioEmotionResult;
  processingTime: number;
}

// ==================== FFT 分析器 ====================

/**
 * FFT 分析器类
 * 使用 Web Audio API 的 AnalyserNode 进行频谱分析
 */
class FFTAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private initialized = false;

  /**
   * 初始化 FFT 分析器
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      this.initialized = true;
      console.log('[FFTAnalyzer] 初始化成功');
    } catch (error) {
      console.error('[FFTAnalyzer] 初始化失败:', error);
      throw error;
    }
  }

  /**
   * 执行 FFT 分析
   */
  analyze(audioData: Float32Array, sampleRate: number): FFTAnalysisResult {
    if (!this.initialized || !this.analyser) {
      throw new Error('FFT 分析器未初始化');
    }

    const fftSize = this.analyser.fftSize;
    const frequencyResolution = sampleRate / fftSize;

    // 计算频谱数据
    const spectrum = new Float32Array(fftSize / 2);
    
    // 使用简化的 FFT 计算（实际项目中应使用专业库如 dsp.js）
    for (let i = 0; i < spectrum.length; i++) {
      let real = 0;
      let imag = 0;
      
      for (let j = 0; j < audioData.length; j++) {
        const angle = (2 * Math.PI * i * j) / audioData.length;
        real += audioData[j] * Math.cos(angle);
        imag -= audioData[j] * Math.sin(angle);
      }
      
      spectrum[i] = Math.sqrt(real * real + imag * imag) / audioData.length;
    }

    // 计算主频率
    let maxMagnitude = 0;
    let dominantFrequency = 0;
    for (let i = 0; i < spectrum.length; i++) {
      if (spectrum[i] > maxMagnitude) {
        maxMagnitude = spectrum[i];
        dominantFrequency = i * frequencyResolution;
      }
    }

    // 计算频谱质心
    let centroidNumerator = 0;
    let centroidDenominator = 0;
    for (let i = 0; i < spectrum.length; i++) {
      const frequency = i * frequencyResolution;
      centroidNumerator += frequency * spectrum[i];
      centroidDenominator += spectrum[i];
    }
    const spectralCentroid = centroidDenominator > 0 ? centroidNumerator / centroidDenominator : 0;

    // 计算频谱滚降点（85% 能量点）
    let totalEnergy = spectrum.reduce((sum, val) => sum + val, 0);
    let accumulatedEnergy = 0;
    let spectralRolloff = 0;
    const rolloffThreshold = 0.85 * totalEnergy;
    
    for (let i = 0; i < spectrum.length; i++) {
      accumulatedEnergy += spectrum[i];
      if (accumulatedEnergy >= rolloffThreshold) {
        spectralRolloff = i * frequencyResolution;
        break;
      }
    }

    // 计算频谱通量
    let spectralFlux = 0;
    for (let i = 1; i < spectrum.length; i++) {
      const diff = spectrum[i] - spectrum[i - 1];
      spectralFlux += diff > 0 ? diff * diff : 0;
    }
    spectralFlux = Math.sqrt(spectralFlux);

    // 计算 RMS 能量
    let rmsSum = 0;
    for (let i = 0; i < audioData.length; i++) {
      rmsSum += audioData[i] * audioData[i];
    }
    const rmsEnergy = Math.sqrt(rmsSum / audioData.length);

    // 计算过零率
    let zeroCrossings = 0;
    for (let i = 1; i < audioData.length; i++) {
      if ((audioData[i] >= 0 && audioData[i - 1] < 0) || 
          (audioData[i] < 0 && audioData[i - 1] >= 0)) {
        zeroCrossings++;
      }
    }
    const zeroCrossingRate = zeroCrossings / audioData.length;

    return {
      spectrum,
      frequencyResolution,
      dominantFrequency,
      spectralCentroid,
      spectralRolloff,
      spectralFlux,
      rmsEnergy,
      zeroCrossingRate,
    };
  }

  /**
   * 销毁分析器
   */
  destroy(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.analyser = null;
      this.initialized = false;
    }
  }
}

// ==================== 音频特征提取器 ====================

/**
 * 音频特征提取器
 * 提取 MFCC、梅尔频谱等特征
 */
class AudioFeatureExtractor {
  /**
   * 计算 MFCC 特征
   * 简化版本，实际项目中应使用专业库
   */
  computeMFCC(spectrum: Float32Array, sampleRate: number, numCoeffs = 13): Float32Array {
    const numFilters = 26;
    const melFilters = this.createMelFilterBank(spectrum.length, sampleRate, numFilters);
    
    // 应用梅尔滤波器组
    const melSpectrum = new Float32Array(numFilters);
    for (let i = 0; i < numFilters; i++) {
      let sum = 0;
      for (let j = 0; j < spectrum.length; j++) {
        sum += spectrum[j] * melFilters[i][j];
      }
      melSpectrum[i] = Math.log(sum + 1e-10);
    }

    // 应用 DCT 获取 MFCC
    const mfcc = new Float32Array(numCoeffs);
    for (let i = 0; i < numCoeffs; i++) {
      let sum = 0;
      for (let j = 0; j < numFilters; j++) {
        sum += melSpectrum[j] * Math.cos((Math.PI * i * (j + 0.5)) / numFilters);
      }
      mfcc[i] = sum;
    }

    return mfcc;
  }

  /**
   * 创建梅尔滤波器组
   */
  private createMelFilterBank(
    fftSize: number,
    sampleRate: number,
    numFilters: number
  ): Float32Array[] {
    const lowFreq = 0;
    const highFreq = sampleRate / 2;
    
    const lowMel = this.hzToMel(lowFreq);
    const highMel = this.hzToMel(highFreq);
    
    const melPoints = new Float32Array(numFilters + 2);
    for (let i = 0; i < numFilters + 2; i++) {
      melPoints[i] = lowMel + (i * (highMel - lowMel)) / (numFilters + 1);
    }

    const hzPoints = melPoints.map((mel) => this.melToHz(mel));
    const binPoints = hzPoints.map((hz) => Math.floor((fftSize + 1) * hz / sampleRate));

    const filters: Float32Array[] = [];
    for (let i = 0; i < numFilters; i++) {
      const filter = new Float32Array(fftSize);
      for (let j = binPoints[i]; j < binPoints[i + 1]; j++) {
        filter[j] = (j - binPoints[i]) / (binPoints[i + 1] - binPoints[i]);
      }
      for (let j = binPoints[i + 1]; j < binPoints[i + 2]; j++) {
        filter[j] = (binPoints[i + 2] - j) / (binPoints[i + 2] - binPoints[i + 1]);
      }
      filters.push(filter);
    }

    return filters;
  }

  /**
   * Hz 转 Mel
   */
  private hzToMel(hz: number): number {
    return 2595 * Math.log10(1 + hz / 700);
  }

  /**
   * Mel 转 Hz
   */
  private melToHz(mel: number): number {
    return 700 * (Math.pow(10, mel / 2595) - 1);
  }

  /**
   * 计算梅尔频谱
   */
  computeMelSpectrogram(spectrum: Float32Array, sampleRate: number, numFilters = 128): Float32Array {
    const melFilters = this.createMelFilterBank(spectrum.length, sampleRate, numFilters);
    const melSpectrum = new Float32Array(numFilters);
    
    for (let i = 0; i < numFilters; i++) {
      let sum = 0;
      for (let j = 0; j < spectrum.length; j++) {
        sum += spectrum[j] * melFilters[i][j];
      }
      melSpectrum[i] = sum;
    }

    return melSpectrum;
  }

  /**
   * 计算色度特征
   */
  computeChroma(spectrum: Float32Array, sampleRate: number): Float32Array {
    const numChroma = 12;
    const chroma = new Float32Array(numChroma);
    
    const binToChroma = (bin: number): number => {
      const freq = bin * sampleRate / (2 * spectrum.length);
      const note = 12 * Math.log2(freq / 440) + 69;
      return Math.round(note) % 12;
    };

    for (let i = 0; i < spectrum.length; i++) {
      const chromaIndex = binToChroma(i);
      if (chromaIndex >= 0 && chromaIndex < numChroma) {
        chroma[chromaIndex] += spectrum[i];
      }
    }

    // 归一化
    const maxChroma = Math.max(...chroma);
    if (maxChroma > 0) {
      for (let i = 0; i < numChroma; i++) {
        chroma[i] /= maxChroma;
      }
    }

    return chroma;
  }
}

// ==================== 音频模型服务 ====================

/**
 * 音频模型服务
 * 提供音频分析功能，支持 FFT 和 YAMNet
 */
export class AudioModelService {
  // 单例实例
  private static instance: AudioModelService | null = null;

  // FFT 分析器
  private fftAnalyzer: FFTAnalyzer;

  // 特征提取器
  private featureExtractor: AudioFeatureExtractor;

  // Web Worker
  private worker: Worker | null = null;
  private workerReady = false;
  private pendingRequests: Map<string, {
    resolve: (value: WorkerAnalyzeResponse) => void;
    reject: (error: Error) => void;
  }> = new Map();

  // 配置
  private defaultSampleRate = 16000;
  private initialized = false;

  private constructor() {
    this.fftAnalyzer = new FFTAnalyzer();
    this.featureExtractor = new AudioFeatureExtractor();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): AudioModelService {
    if (!AudioModelService.instance) {
      AudioModelService.instance = new AudioModelService();
    }
    return AudioModelService.instance;
  }

  /**
   * 初始化服务
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // 初始化 FFT 分析器
      await this.fftAnalyzer.init();

      // 尝试初始化 Web Worker
      await this.initWorker();

      this.initialized = true;
      console.log('[AudioModelService] 初始化成功');
    } catch (error) {
      console.error('[AudioModelService] 初始化失败:', error);
      throw error;
    }
  }

  /**
   * 初始化 Web Worker
   */
  private async initWorker(): Promise<void> {
    try {
      // 创建 Worker（实际项目中使用单独的 worker 文件）
      // 这里使用 Blob URL 模拟
      const workerCode = `
        self.onmessage = function(e) {
          const { id, type, data } = e.data;
          if (type === 'init') {
            self.postMessage({ id, success: true });
          } else if (type === 'analyze') {
            // 模拟分析处理
            const result = { processingTime: 100 };
            self.postMessage({ id, success: true, data: result });
          }
        };
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      this.worker = new Worker(workerUrl);

      this.worker.onmessage = (e) => {
        const { id, success, data, error } = e.data;
        const pending = this.pendingRequests.get(id);
        if (pending) {
          if (success) {
            pending.resolve(data);
          } else {
            pending.reject(new Error(error));
          }
          this.pendingRequests.delete(id);
        }
      };

      this.worker.onerror = (e) => {
        console.error('[AudioModelService] Worker 错误:', e);
      };

      // 发送初始化消息
      await this.sendWorkerMessage('init', {});
      this.workerReady = true;
      console.log('[AudioModelService] Worker 初始化成功');
    } catch (error) {
      console.warn('[AudioModelService] Worker 初始化失败，将使用主线程:', error);
      this.workerReady = false;
    }
  }

  /**
   * 发送消息到 Worker
   */
  private sendWorkerMessage(type: string, data: unknown): Promise<WorkerAnalyzeResponse> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker 未初始化'));
        return;
      }

      const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.pendingRequests.set(id, { resolve, reject });
      
      this.worker.postMessage({ id, type, data } as WorkerMessage);

      // 超时处理
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Worker 请求超时'));
        }
      }, 30000);
    });
  }

  /**
   * 分析音频
   * 主入口方法
   */
  async analyzeAudio(
    audioData: Float32Array,
    options: AudioAnalysisOptions = {}
  ): Promise<AudioAnalysisResult> {
    const startTime = Date.now();
    const id = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 合并默认选项
    const opts: AudioAnalysisOptions = {
      sampleRate: this.defaultSampleRate,
      useFFT: true,
      useYAMNet: false,
      inferenceMode: 'frontend',
      returnIntermediate: false,
      timeout: 30000,
      ...options,
    };

    try {
      // 确保已初始化
      if (!this.initialized) {
        await this.init();
      }

      let fftResult: FFTAnalysisResult | undefined;
      let features: AudioFeatures | undefined;
      let classification: AudioClassificationResult | undefined;
      let emotion: AudioEmotionResult | undefined;

      // FFT 分析
      if (opts.useFFT) {
        fftResult = this.fftAnalyzer.analyze(audioData, opts.sampleRate || this.defaultSampleRate);

        // 提取音频特征
        features = {
          mfcc: this.featureExtractor.computeMFCC(
            fftResult.spectrum,
            opts.sampleRate || this.defaultSampleRate
          ),
          melSpectrogram: this.featureExtractor.computeMelSpectrogram(
            fftResult.spectrum,
            opts.sampleRate || this.defaultSampleRate
          ),
          chroma: this.featureExtractor.computeChroma(
            fftResult.spectrum,
            opts.sampleRate || this.defaultSampleRate
          ),
        };
      }

      // YAMNet 分析（未来实现）
      if (opts.useYAMNet) {
        const yamnetResult = await this.runYAMNet(audioData, opts);
        features = { ...features, yamnetEmbedding: yamnetResult.embedding };
        classification = yamnetResult.classification;
      }

      // 基于特征的情感分析（简化版本）
      if (fftResult && features) {
        emotion = this.analyzeEmotionFromFeatures(fftResult, features);
      }

      const processingTime = Date.now() - startTime;

      return {
        id,
        timestamp: Date.now(),
        processingTime,
        inferenceMode: opts.inferenceMode || 'frontend',
        fftResult: opts.returnIntermediate ? fftResult : undefined,
        features: opts.returnIntermediate ? features : undefined,
        classification,
        emotion,
        confidence: classification ? Math.max(...Object.values(classification.probabilities)) : 0.5,
        success: true,
      };
    } catch (error) {
      return {
        id,
        timestamp: Date.now(),
        processingTime: Date.now() - startTime,
        inferenceMode: opts.inferenceMode || 'frontend',
        confidence: 0,
        success: false,
        error: error instanceof Error ? error.message : '音频分析失败',
      };
    }
  }

  /**
   * 运行 YAMNet 模型
   * 未来实现，当前返回模拟数据
   */
  private async runYAMNet(
    _audioData: Float32Array,
    _options: AudioAnalysisOptions
  ): Promise<{
    embedding: Float32Array;
    classification: AudioClassificationResult;
  }> {
    // 检查模型是否已加载
    const modelLoaded = modelLoader.isModelLoaded('yamnet');
    
    if (!modelLoaded) {
      // 尝试加载模型
      const result = await modelLoader.loadModel('yamnet');
      if (!result.success) {
        console.warn('[AudioModelService] YAMNet 模型加载失败，使用模拟数据');
      }
    }

    // 返回模拟数据（实际项目中使用真实推理）
    const embedding = new Float32Array(1024).fill(0).map(() => Math.random() * 0.1);
    
    const classification: AudioClassificationResult = {
      predictedClass: 'speech',
      probabilities: {
        speech: 0.7,
        music: 0.15,
        animal: 0.1,
        silence: 0.05,
      },
      topPredictions: [
        { label: 'speech', probability: 0.7 },
        { label: 'music', probability: 0.15 },
        { label: 'animal', probability: 0.1 },
      ],
    };

    return { embedding, classification };
  }

  /**
   * 基于特征的情感分析
   * 简化版本，基于音频特征推断情感
   */
  private analyzeEmotionFromFeatures(
    fftResult: FFTAnalysisResult,
    _features: AudioFeatures
  ): AudioEmotionResult {
    // 基于频谱特征推断情感
    let primaryEmotion = 'neutral';
    let intensity = 0.5;
    let arousal = 0.5;
    let valence = 0.5;

    // 使用频谱质心和能量推断情感
    const { spectralCentroid, rmsEnergy, zeroCrossingRate } = fftResult;

    // 高频谱质心 + 高能量 = 兴奋/快乐
    // 低频谱质心 + 高能量 = 愤怒/激动
    // 低频谱质心 + 低能量 = 悲伤/平静
    // 高频谱质心 + 低能量 = 焦虑/紧张

    const normalizedCentroid = Math.min(spectralCentroid / 5000, 1);
    const normalizedEnergy = Math.min(rmsEnergy * 10, 1);
    const normalizedZCR = Math.min(zeroCrossingRate * 100, 1);

    arousal = (normalizedEnergy + normalizedZCR) / 2;

    if (normalizedCentroid > 0.6 && normalizedEnergy > 0.5) {
      primaryEmotion = 'happy';
      valence = 0.7;
      intensity = normalizedEnergy;
    } else if (normalizedCentroid < 0.4 && normalizedEnergy > 0.5) {
      primaryEmotion = 'angry';
      valence = 0.3;
      intensity = normalizedEnergy;
    } else if (normalizedCentroid < 0.4 && normalizedEnergy < 0.3) {
      primaryEmotion = 'sad';
      valence = 0.2;
      intensity = 1 - normalizedEnergy;
    } else if (normalizedCentroid > 0.6 && normalizedEnergy < 0.3) {
      primaryEmotion = 'anxious';
      valence = 0.4;
      intensity = normalizedZCR;
    } else {
      primaryEmotion = 'neutral';
      valence = 0.5;
      intensity = 0.3;
    }

    // 构建情感分布
    const emotionDistribution: Record<string, number> = {
      happy: primaryEmotion === 'happy' ? 0.6 : 0.1,
      sad: primaryEmotion === 'sad' ? 0.6 : 0.1,
      angry: primaryEmotion === 'angry' ? 0.6 : 0.1,
      anxious: primaryEmotion === 'anxious' ? 0.6 : 0.1,
      neutral: primaryEmotion === 'neutral' ? 0.6 : 0.1,
    };

    return {
      primaryEmotion,
      intensity,
      emotionDistribution,
      arousal,
      valence,
    };
  }

  /**
   * 使用 Web Worker 分析音频
   */
  async analyzeAudioWithWorker(
    audioData: Float32Array,
    options: AudioAnalysisOptions = {}
  ): Promise<AudioAnalysisResult> {
    if (!this.workerReady || !this.worker) {
      // 回退到主线程分析
      return this.analyzeAudio(audioData, options);
    }

    const startTime = Date.now();
    const id = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const response = await this.sendWorkerMessage('analyze', {
        audioData,
        sampleRate: options.sampleRate || this.defaultSampleRate,
        options,
      } as WorkerAnalyzeRequest);

      return {
        id,
        timestamp: Date.now(),
        processingTime: Date.now() - startTime,
        inferenceMode: options.inferenceMode || 'frontend',
        fftResult: response.fftResult,
        features: response.features,
        classification: response.classification,
        emotion: response.emotion,
        confidence: response.classification 
          ? Math.max(...Object.values(response.classification.probabilities)) 
          : 0.5,
        success: true,
      };
    } catch (error) {
      // 回退到主线程分析
      console.warn('[AudioModelService] Worker 分析失败，回退到主线程:', error);
      return this.analyzeAudio(audioData, options);
    }
  }

  /**
   * 检查服务状态
   */
  getStatus(): {
    initialized: boolean;
    workerReady: boolean;
    modelLoaded: boolean;
  } {
    return {
      initialized: this.initialized,
      workerReady: this.workerReady,
      modelLoaded: modelLoader.isModelLoaded('yamnet'),
    };
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.fftAnalyzer.destroy();
    
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.workerReady = false;
    }

    this.pendingRequests.clear();
    this.initialized = false;
    console.log('[AudioModelService] 服务已销毁');
  }
}

// 导出单例
export const audioModelService = AudioModelService.getInstance();