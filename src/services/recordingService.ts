// ============================================
// PawSync Pro - 真实录音服务
// 使用 MediaRecorder API 实现录音、音频波形可视化、文件保存
// ============================================

export type RecordingState = 'inactive' | 'recording' | 'paused' | 'stopped';
export type RecordingFormat = 'audio/webm' | 'audio/mp4' | 'audio/ogg' | 'audio/wav';

export interface RecordingOptions {
  mimeType?: RecordingFormat;
  audioBitsPerSecond?: number;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
  sampleRate?: number;
  channelCount?: number;
}

export interface RecordingInfo {
  id: string;
  blob: Blob;
  url: string;
  duration: number;
  timestamp: number;
  mimeType: string;
  size: number;
  name: string;
}

export interface WaveformData {
  frequencyData: Uint8Array;
  timeData: Uint8Array;
  averageFrequency: number;
  peakLevel: number;
}

export interface RecordingSession {
  id: string;
  startTime: number;
  pauseTime: number;
  totalPausedDuration: number;
  state: RecordingState;
  chunks: Blob[];
  mimeType: string;
}

class RecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private animationFrameId: number | null = null;
  
  private session: RecordingSession | null = null;
  private recordings: RecordingInfo[] = [];
  
  // 事件监听器
  private stateChangeListeners: Array<(state: RecordingState) => void> = [];
  private dataAvailableListeners: Array<(data: Blob) => void> = [];
  private waveformListeners: Array<(data: WaveformData) => void> = [];
  private errorListeners: Array<(error: Error) => void> = [];

  // 本地存储键
  private readonly STORAGE_KEY = 'pawsync_recordings';
  private readonly METADATA_KEY = 'pawsync_recordings_metadata';

  constructor() {
    this.loadRecordingsFromStorage();
  }

  // ==================== 权限管理 ====================

  /**
   * 请求麦克风权限
   */
  async requestPermission(): Promise<{ granted: boolean; error?: string }> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return { granted: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      return { granted: false, error: errorMessage };
    }
  }

  /**
   * 检查是否有麦克风权限
   */
  async checkPermission(): Promise<'granted' | 'denied' | 'prompt'> {
    try {
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        return result.state as 'granted' | 'denied' | 'prompt';
      }
      return 'prompt';
    } catch {
      return 'prompt';
    }
  }

  // ==================== 录音控制 ====================

  /**
   * 开始录音
   */
  async startRecording(options: RecordingOptions = {}): Promise<void> {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      throw new Error('录音已在进行中');
    }

    try {
      // 获取音频流
      const streamConstraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: options.echoCancellation ?? true,
          noiseSuppression: options.noiseSuppression ?? true,
          autoGainControl: options.autoGainControl ?? true,
          sampleRate: options.sampleRate ?? 48000,
          channelCount: options.channelCount ?? 2,
        },
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(streamConstraints);

      // 设置音频分析器用于波形可视化
      this.setupAudioAnalyser();

      // 确定支持的 MIME 类型
      const mimeType = this.getSupportedMimeType(options.mimeType);
      
      // 创建 MediaRecorder
      const recorderOptions: MediaRecorderOptions = {
        mimeType,
      };
      
      if (options.audioBitsPerSecond) {
        recorderOptions.audioBitsPerSecond = options.audioBitsPerSecond;
      }

      this.mediaRecorder = new MediaRecorder(this.mediaStream, recorderOptions);

      // 初始化录音会话
      this.session = {
        id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        startTime: Date.now(),
        pauseTime: 0,
        totalPausedDuration: 0,
        state: 'recording',
        chunks: [],
        mimeType,
      };

      // 设置事件处理器
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.session?.chunks.push(event.data);
          this.dataAvailableListeners.forEach(listener => listener(event.data));
        }
      };

      this.mediaRecorder.onerror = (event) => {
        const error = new Error('MediaRecorder error: ' + event);
        this.errorListeners.forEach(listener => listener(error));
      };

      this.mediaRecorder.onstart = () => {
        this.notifyStateChange('recording');
        this.startWaveformAnalysis();
      };

      this.mediaRecorder.onpause = () => {
        this.notifyStateChange('paused');
        this.stopWaveformAnalysis();
      };

      this.mediaRecorder.onresume = () => {
        this.notifyStateChange('recording');
        this.startWaveformAnalysis();
      };

      this.mediaRecorder.onstop = () => {
        this.notifyStateChange('stopped');
        this.stopWaveformAnalysis();
        this.cleanup();
      };

      // 开始录音，每 100ms 收集一次数据
      this.mediaRecorder.start(100);

    } catch (error) {
      this.cleanup();
      throw new Error(`启动录音失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 暂停录音
   */
  pauseRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      if (this.session) {
        this.session.pauseTime = Date.now();
        this.session.state = 'paused';
      }
    }
  }

  /**
   * 恢复录音
   */
  resumeRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      if (this.session) {
        this.session.totalPausedDuration += Date.now() - this.session.pauseTime;
        this.session.pauseTime = 0;
        this.session.state = 'recording';
      }
    }
  }

  /**
   * 停止录音并返回录音数据
   */
  async stopRecording(): Promise<RecordingInfo> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.session) {
        reject(new Error('没有正在进行的录音'));
        return;
      }

      const session = this.session;
      
      this.mediaRecorder.onstop = () => {
        this.stopWaveformAnalysis();
        
        // 计算录音时长
        const endTime = Date.now();
        const duration = endTime - session.startTime - session.totalPausedDuration;
        
        // 合并所有 chunks
        const blob = new Blob(session.chunks, { type: session.mimeType });
        const url = URL.createObjectURL(blob);
        
        const recordingInfo: RecordingInfo = {
          id: session.id,
          blob,
          url,
          duration,
          timestamp: session.startTime,
          mimeType: session.mimeType,
          size: blob.size,
          name: `录音_${new Date(session.startTime).toLocaleString().replace(/[/:]/g, '-')}.webm`,
        };

        this.recordings.push(recordingInfo);
        this.saveRecordingsMetadata();
        
        this.notifyStateChange('inactive');
        this.cleanup();
        
        resolve(recordingInfo);
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * 取消录音
   */
  cancelRecording(): void {
    if (this.mediaRecorder) {
      this.mediaRecorder.onstop = null;
      this.mediaRecorder.stop();
    }
    this.cleanup();
    this.notifyStateChange('inactive');
  }

  // ==================== 音频波形可视化 ====================

  /**
   * 设置音频分析器
   */
  private setupAudioAnalyser(): void {
    if (!this.mediaStream) return;

    this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;

    this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.source.connect(this.analyser);
  }

  /**
   * 开始波形分析
   */
  private startWaveformAnalysis(): void {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const frequencyData = new Uint8Array(bufferLength);
    const timeData = new Uint8Array(bufferLength);

    const analyze = () => {
      if (!this.analyser) return;

      this.analyser.getByteFrequencyData(frequencyData);
      this.analyser.getByteTimeDomainData(timeData);

      // 计算平均频率和峰值
      let sum = 0;
      let peak = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += frequencyData[i];
        if (frequencyData[i] > peak) {
          peak = frequencyData[i];
        }
      }
      const averageFrequency = sum / bufferLength;

      const waveformData: WaveformData = {
        frequencyData: new Uint8Array(frequencyData),
        timeData: new Uint8Array(timeData),
        averageFrequency,
        peakLevel: peak / 255, // 归一化到 0-1
      };

      this.waveformListeners.forEach(listener => listener(waveformData));
      this.animationFrameId = requestAnimationFrame(analyze);
    };

    analyze();
  }

  /**
   * 停止波形分析
   */
  private stopWaveformAnalysis(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * 获取当前音频级别 (0-1)
   */
  getCurrentAudioLevel(): number {
    if (!this.analyser) return 0;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }

    return (sum / dataArray.length) / 255;
  }

  // ==================== 录音管理 ====================

  /**
   * 获取所有录音
   */
  getRecordings(): RecordingInfo[] {
    return [...this.recordings];
  }

  /**
   * 根据 ID 获取录音
   */
  getRecordingById(id: string): RecordingInfo | undefined {
    return this.recordings.find(r => r.id === id);
  }

  /**
   * 删除录音
   */
  deleteRecording(id: string): boolean {
    const index = this.recordings.findIndex(r => r.id === id);
    if (index !== -1) {
      const recording = this.recordings[index];
      URL.revokeObjectURL(recording.url);
      this.recordings.splice(index, 1);
      this.saveRecordingsMetadata();
      return true;
    }
    return false;
  }

  /**
   * 下载录音
   */
  downloadRecording(id: string): void {
    const recording = this.getRecordingById(id);
    if (!recording) return;

    const a = document.createElement('a');
    a.href = recording.url;
    a.download = recording.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /**
   * 导出录音为 WAV 格式
   */
  async exportAsWav(id: string): Promise<Blob> {
    const recording = this.getRecordingById(id);
    if (!recording) {
      throw new Error('录音不存在');
    }

    // 如果已经是 WAV 格式，直接返回
    if (recording.mimeType.includes('wav')) {
      return recording.blob;
    }

    // 使用 AudioContext 解码并重新编码为 WAV
    const arrayBuffer = await recording.blob.arrayBuffer();
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    
    try {
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      return this.audioBufferToWav(audioBuffer);
    } catch (error) {
      throw new Error(`转换 WAV 失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 将 AudioBuffer 转换为 WAV Blob
   */
  private audioBufferToWav(audioBuffer: AudioBuffer): Blob {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;
    
    const dataLength = audioBuffer.length * numberOfChannels * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);
    
    // 写入 WAV 头部
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);
    
    // 写入音频数据
    const offset = 44;
    const channels: Float32Array[] = [];
    for (let i = 0; i < numberOfChannels; i++) {
      channels.push(audioBuffer.getChannelData(i));
    }
    
    let index = 0;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channels[channel][i]));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset + index, intSample, true);
        index += 2;
      }
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  }

  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // ==================== 存储管理 ====================

  /**
   * 从本地存储加载录音元数据
   */
  private loadRecordingsFromStorage(): void {
    try {
      const metadata = localStorage.getItem(this.METADATA_KEY);
      if (metadata) {
        const parsed = JSON.parse(metadata);
        this.recordings = parsed.map((m: RecordingInfo) => ({
          ...m,
          blob: new Blob(), // 元数据中不包含 blob
          url: '',
        }));
      }
    } catch (error) {
      console.error('加载录音元数据失败:', error);
      this.recordings = [];
    }
  }

  /**
   * 保存录音元数据到本地存储
   */
  private saveRecordingsMetadata(): void {
    try {
      const metadata = this.recordings.map(r => ({
        id: r.id,
        duration: r.duration,
        timestamp: r.timestamp,
        mimeType: r.mimeType,
        size: r.size,
        name: r.name,
      }));
      localStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('保存录音元数据失败:', error);
    }
  }

  // ==================== 工具方法 ====================

  /**
   * 获取支持的 MIME 类型
   */
  private getSupportedMimeType(preferred?: RecordingFormat): string {
    const types: RecordingFormat[] = [
      'audio/webm',
      'audio/mp4',
      'audio/ogg',
      'audio/wav',
    ];

    if (preferred && MediaRecorder.isTypeSupported(preferred)) {
      return preferred;
    }

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm'; // 默认类型
  }

  /**
   * 获取支持的 MIME 类型列表
   */
  getSupportedMimeTypes(): string[] {
    const types = [
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/mp4',
      'audio/mp4;codecs=mp4a.40.2',
      'audio/ogg',
      'audio/ogg;codecs=opus',
      'audio/wav',
    ];

    return types.filter(type => MediaRecorder.isTypeSupported(type));
  }

  /**
   * 获取当前录音状态
   */
  getState(): RecordingState {
    if (!this.mediaRecorder) return 'inactive';
    return this.mediaRecorder.state as RecordingState;
  }

  /**
   * 获取当前录音时长（毫秒）
   */
  getCurrentDuration(): number {
    if (!this.session) return 0;
    
    if (this.session.state === 'paused') {
      return this.session.pauseTime - this.session.startTime - this.session.totalPausedDuration;
    }
    
    return Date.now() - this.session.startTime - this.session.totalPausedDuration;
  }

  /**
   * 格式化时长为 mm:ss
   */
  formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // ==================== 事件监听 ====================

  onStateChange(listener: (state: RecordingState) => void): () => void {
    this.stateChangeListeners.push(listener);
    return () => {
      const index = this.stateChangeListeners.indexOf(listener);
      if (index > -1) {
        this.stateChangeListeners.splice(index, 1);
      }
    };
  }

  onDataAvailable(listener: (data: Blob) => void): () => void {
    this.dataAvailableListeners.push(listener);
    return () => {
      const index = this.dataAvailableListeners.indexOf(listener);
      if (index > -1) {
        this.dataAvailableListeners.splice(index, 1);
      }
    };
  }

  onWaveform(listener: (data: WaveformData) => void): () => void {
    this.waveformListeners.push(listener);
    return () => {
      const index = this.waveformListeners.indexOf(listener);
      if (index > -1) {
        this.waveformListeners.splice(index, 1);
      }
    };
  }

  onError(listener: (error: Error) => void): () => void {
    this.errorListeners.push(listener);
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  private notifyStateChange(state: RecordingState): void {
    this.stateChangeListeners.forEach(listener => listener(state));
  }

  // ==================== 清理 ====================

  private cleanup(): void {
    this.stopWaveformAnalysis();

    if (this.mediaRecorder) {
      this.mediaRecorder.ondataavailable = null;
      this.mediaRecorder.onerror = null;
      this.mediaRecorder.onstart = null;
      this.mediaRecorder.onpause = null;
      this.mediaRecorder.onresume = null;
      this.mediaRecorder.onstop = null;
      this.mediaRecorder = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.session = null;
  }

  /**
   * 完全销毁服务
   */
  destroy(): void {
    this.cancelRecording();
    this.stateChangeListeners = [];
    this.dataAvailableListeners = [];
    this.waveformListeners = [];
    this.errorListeners = [];
    
    // 释放所有录音的 URL
    this.recordings.forEach(recording => {
      URL.revokeObjectURL(recording.url);
    });
  }
}

export const recordingService = new RecordingService();
