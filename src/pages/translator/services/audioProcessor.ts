// ============================================
// PawSync Pro - audioProcessor.ts
// 
// 描述: 音频预处理服务
// ============================================

/**
 * 音频验证结果
 */
export interface AudioValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * 音频处理上下文
 */
export interface AudioProcessingContext {
  duration?: number;
  maxLevel?: number;
  hasValidSound?: boolean;
}

/**
 * 验证音频数据有效性
 * @param audioData 音频数据数组
 * @returns 验证结果
 */
export function validateAudioData(audioData: Float32Array): AudioValidationResult {
  // 检查数据长度 - 至少需要0.5秒的音频（22050采样点）
  if (!audioData || audioData.length < 22050) {
    return { isValid: false, error: '录音时长不足，请至少录音0.5秒。' };
  }

  // 检查是否包含有效数值
  const hasInvalidValues = audioData.some(v => !isFinite(v) || isNaN(v));
  if (hasInvalidValues) {
    return { isValid: false, error: '音频数据包含无效值。' };
  }

  // 计算音频能量
  let energy = 0;
  let maxAmplitude = 0;
  for (let i = 0; i < audioData.length; i++) {
    energy += audioData[i] * audioData[i];
    maxAmplitude = Math.max(maxAmplitude, Math.abs(audioData[i]));
  }
  energy = Math.sqrt(energy / audioData.length);

  // 检查是否为静音
  if (energy < 0.001 && maxAmplitude < 0.01) {
    return { isValid: false, error: '录音为静音，请确保有声音输入。' };
  }

  // 检查是否削波（失真）
  const clippingCount = audioData.filter(v => Math.abs(v) > 0.99).length;
  if (clippingCount > audioData.length * 0.1) {
    return { isValid: false, error: '录音音量过大导致失真，请降低音量后重试。' };
  }

  return { isValid: true };
}

/**
 * 合并音频数据块
 * @param audioChunks 音频数据块数组
 * @returns 合并后的音频数据
 */
export function mergeAudioChunks(audioChunks: Float32Array[]): Float32Array {
  if (audioChunks.length === 0) {
    return new Float32Array(0);
  }

  const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const mergedData = new Float32Array(totalLength);
  
  let offset = 0;
  for (const chunk of audioChunks) {
    mergedData.set(chunk, offset);
    offset += chunk.length;
  }

  return mergedData;
}

/**
 * 计算音频时长（秒）
 * @param audioData 音频数据
 * @param sampleRate 采样率（默认44100）
 * @returns 音频时长（秒）
 */
export function calculateAudioDuration(audioData: Float32Array, sampleRate: number = 44100): number {
  return audioData.length / sampleRate;
}

/**
 * 计算音频RMS音量级别
 * @param audioData 音频数据
 * @returns RMS音量级别（0-100）
 */
export function calculateAudioLevel(audioData: Float32Array): number {
  if (audioData.length === 0) return 0;
  
  const rms = Math.sqrt(
    audioData.reduce((sum, val) => sum + val * val, 0) / audioData.length
  );
  
  return rms * 100;
}

/**
 * 创建AudioContext实例
 * @returns AudioContext实例
 */
export function createAudioContext(): AudioContext {
  const AudioContextClass = window.AudioContext || 
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  return new AudioContextClass();
}

/**
 * 初始化音频分析器
 * @param audioContext AudioContext实例
 * @param stream 媒体流
 * @returns 分析器节点
 */
export function initializeAnalyzer(
  audioContext: AudioContext, 
  stream: MediaStream
): AnalyserNode {
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.8;
  source.connect(analyser);
  
  return analyser;
}

/**
 * 创建MediaRecorder实例
 * @param stream 媒体流
 * @returns MediaRecorder实例和MIME类型
 */
export function createMediaRecorder(stream: MediaStream): {
  recorder: MediaRecorder;
  mimeType: string;
} {
  const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
    ? 'audio/webm' 
    : 'audio/mp4';
  
  const recorder = new MediaRecorder(stream, { mimeType });
  
  return { recorder, mimeType };
}

/**
 * 格式化录音时间显示
 * @param seconds 秒数
 * @returns 格式化的时间字符串（MM:SS）
 */
export function formatRecordingTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}