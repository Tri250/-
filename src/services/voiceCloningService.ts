import type { VoiceProfile, VoiceSynthesisResult, VoiceRecording } from '../types/voice-cloning';
import { databaseService, STORE_NAMES } from './databaseService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.pawsync.com/v1';

// Web Audio API 录音器
class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;

  async startRecording(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioChunks = [];

    this.audioContext = new AudioContext();
    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm',
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(100); // 每100ms收集一次数据
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.cleanup();
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  getAudioLevel(): number {
    if (!this.stream) return 0;
    const audioContext = this.audioContext;
    if (!audioContext) return 0;

    try {
      const source = audioContext.createMediaStreamSource(this.stream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);
      analyser.fftSize = 256;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);

      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      return Math.min(average / 128, 1);
    } catch {
      return 0;
    }
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  cancelRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
    this.cleanup();
  }
}

// 声纹特征提取（本地基础分析）
interface VoiceFeatures {
  duration: number;
  averageAmplitude: number;
  peakAmplitude: number;
  silenceRatio: number;
  estimatedPitch: number;
  energyDistribution: number[];
}

function extractLocalVoiceFeatures(audioBlob: Blob): Promise<VoiceFeatures> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const audioContext = new AudioContext();
        const arrayBuffer = reader.result as ArrayBuffer;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const channelData = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        const duration = audioBuffer.duration;

        // 计算振幅特征
        let sumAmplitude = 0;
        let peakAmplitude = 0;
        let silenceFrames = 0;
        const silenceThreshold = 0.01;

        for (let i = 0; i < channelData.length; i++) {
          const abs = Math.abs(channelData[i]);
          sumAmplitude += abs;
          if (abs > peakAmplitude) peakAmplitude = abs;
          if (abs < silenceThreshold) silenceFrames++;
        }

        const averageAmplitude = sumAmplitude / channelData.length;
        const silenceRatio = silenceFrames / channelData.length;

        // 简单基频估计（自相关法）
        let estimatedPitch = 0;
        const minPeriod = Math.floor(sampleRate / 500); // 最高500Hz
        const maxPeriod = Math.floor(sampleRate / 50);  // 最低50Hz
        let maxCorrelation = 0;

        for (let period = minPeriod; period < maxPeriod && period < channelData.length / 2; period++) {
          let correlation = 0;
          const frameSize = Math.min(4096, Math.floor(channelData.length / 2));
          for (let i = 0; i < frameSize; i++) {
            correlation += channelData[i] * channelData[i + period];
          }
          if (correlation > maxCorrelation) {
            maxCorrelation = correlation;
            estimatedPitch = sampleRate / period;
          }
        }

        // 能量分布（8个频段）
        const energyDistribution: number[] = [];
        const fftSize = 2048;
        const numBands = 8;
        const bandSize = Math.floor(fftSize / (2 * numBands));

        // 简化能量分布计算
        const segmentLength = Math.floor(channelData.length / numBands);
        for (let band = 0; band < numBands; band++) {
          let energy = 0;
          const start = band * segmentLength;
          const end = Math.min(start + segmentLength, channelData.length);
          for (let i = start; i < end; i++) {
            energy += channelData[i] * channelData[i];
          }
          energyDistribution.push(energy / (end - start));
        }

        audioContext.close();
        resolve({
          duration,
          averageAmplitude,
          peakAmplitude,
          silenceRatio,
          estimatedPitch,
          energyDistribution,
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read audio blob'));
    reader.readAsArrayBuffer(audioBlob);
  });
}

export class VoiceCloningService {
  private recorder: AudioRecorder = new AudioRecorder();
  private profiles: Map<string, VoiceProfile> = new Map();

  // ─── 录音控制（Web Audio API） ─────────────────────────────

  async startRecording(): Promise<void> {
    await this.recorder.startRecording();
  }

  async stopRecording(): Promise<Blob> {
    return this.recorder.stopRecording();
  }

  isRecording(): boolean {
    return this.recorder.isRecording();
  }

  getAudioLevel(): number {
    return this.recorder.getAudioLevel();
  }

  cancelRecording(): void {
    this.recorder.cancelRecording();
  }

  // ─── 声纹创建 API ─────────────────────────────────────────

  async createVoiceProfile(
    audioBlob: Blob,
    petId: string,
    name: string,
    description?: string,
  ): Promise<VoiceProfile> {
    // 本地声纹特征提取
    const localFeatures = await extractLocalVoiceFeatures(audioBlob);

    // 上传音频到后端创建声纹
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice_sample.webm');
    formData.append('petId', petId);
    formData.append('name', name);
    if (description) formData.append('description', description);

    const response = await fetch(`${API_BASE_URL}/voice/clone`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Voice clone API error: ${response.status} ${response.statusText}`);
    }

    const apiResult = await response.json() as {
      profileId: string;
      features: Record<string, number>;
      quality: number;
    };

    const profile: VoiceProfile = {
      id: apiResult.profileId || `voice-${Date.now()}`,
      petId,
      name,
      description: description || '',
      sampleCount: 1,
      quality: apiResult.quality || 0.8,
      localFeatures: {
        averagePitch: localFeatures.estimatedPitch,
        averageAmplitude: localFeatures.averageAmplitude,
        duration: localFeatures.duration,
        silenceRatio: localFeatures.silenceRatio,
        energyDistribution: localFeatures.energyDistribution,
      },
      serverFeatures: apiResult.features,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 持久化到 databaseService
    await databaseService.put(STORE_NAMES.VOICE_PROFILES, {
      ...profile,
      source: 'voice_cloning',
    });

    this.profiles.set(profile.id, profile);
    return profile;
  }

  // ─── 语音合成 API ─────────────────────────────────────────

  async synthesizeVoice(
    text: string,
    profileId: string,
    options?: {
      speed?: number;
      pitch?: number;
      volume?: number;
      emotion?: 'neutral' | 'happy' | 'sad' | 'urgent';
    },
  ): Promise<VoiceSynthesisResult> {
    const profile = this.profiles.get(profileId) || await this.getVoiceProfile(profileId);
    if (!profile) {
      throw new Error(`Voice profile not found: ${profileId}`);
    }

    const response = await fetch(`${API_BASE_URL}/voice/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        profileId,
        speed: options?.speed || 1.0,
        pitch: options?.pitch || 1.0,
        volume: options?.volume || 1.0,
        emotion: options?.emotion || 'neutral',
      }),
    });

    if (!response.ok) {
      throw new Error(`Voice synthesis API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json() as VoiceSynthesisResult;

    // 持久化合成结果
    await databaseService.put(STORE_NAMES.VOICE_PROFILES, {
      id: `synthesis-${Date.now()}`,
      profileId,
      text,
      result,
      createdAt: new Date().toISOString(),
    });

    return result;
  }

  // ─── 声纹管理 ─────────────────────────────────────────────

  async getVoiceProfile(profileId: string): Promise<VoiceProfile | null> {
    // 先从内存缓存取
    if (this.profiles.has(profileId)) {
      return this.profiles.get(profileId)!;
    }

    // 从 databaseService 取
    try {
      const record = await databaseService.get<VoiceProfile & { source: string }>(STORE_NAMES.VOICE_PROFILES, profileId);
      if (record) {
        this.profiles.set(profileId, record);
        return record;
      }
    } catch {
      // ignore
    }
    return null;
  }

  async listVoiceProfiles(petId: string): Promise<VoiceProfile[]> {
    try {
      const records = await databaseService.getByIndex<VoiceProfile & { petId: string; source: string }>(
        STORE_NAMES.VOICE_PROFILES,
        'petId',
        petId,
      );
      return records.filter(r => r.source === 'voice_cloning');
    } catch {
      return [];
    }
  }

  async deleteVoiceProfile(profileId: string): Promise<void> {
    this.profiles.delete(profileId);
    try {
      await databaseService.delete(STORE_NAMES.VOICE_PROFILES, profileId);
    } catch {
      // ignore
    }
  }

  // ─── 添加更多声纹样本 ─────────────────────────────────────

  async addVoiceSample(
    profileId: string,
    audioBlob: Blob,
  ): Promise<VoiceProfile> {
    const profile = await this.getVoiceProfile(profileId);
    if (!profile) {
      throw new Error(`Voice profile not found: ${profileId}`);
    }

    // 本地特征提取
    const localFeatures = await extractLocalVoiceFeatures(audioBlob);

    // 上传到后端更新声纹
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice_sample.webm');
    formData.append('profileId', profileId);

    const response = await fetch(`${API_BASE_URL}/voice/clone`, {
      method: 'PUT',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Voice clone update API error: ${response.status} ${response.statusText}`);
    }

    const apiResult = await response.json() as {
      quality: number;
      features: Record<string, number>;
    };

    // 更新声纹
    profile.sampleCount += 1;
    profile.quality = apiResult.quality || profile.quality;
    profile.serverFeatures = apiResult.features || profile.serverFeatures;
    profile.updatedAt = new Date().toISOString();

    // 更新本地特征（加权平均）
    if (profile.localFeatures) {
      const weight = 1 / profile.sampleCount;
      profile.localFeatures.averagePitch = profile.localFeatures.averagePitch * (1 - weight) + localFeatures.estimatedPitch * weight;
      profile.localFeatures.averageAmplitude = profile.localFeatures.averageAmplitude * (1 - weight) + localFeatures.averageAmplitude * weight;
    }

    // 持久化
    await databaseService.put(STORE_NAMES.VOICE_PROFILES, {
      ...profile,
      source: 'voice_cloning',
    });

    this.profiles.set(profileId, profile);
    return profile;
  }

  // ─── 录音辅助 ──────────────────────────────────────────────

  async recordVoiceSample(durationMs: number = 5000): Promise<VoiceRecording> {
    await this.startRecording();

    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          const blob = await this.stopRecording();
          const localFeatures = await extractLocalVoiceFeatures(blob);

          const recording: VoiceRecording = {
            id: `rec-${Date.now()}`,
            blob,
            duration: localFeatures.duration,
            averageAmplitude: localFeatures.averageAmplitude,
            recordedAt: new Date().toISOString(),
          };

          resolve(recording);
        } catch (err) {
          reject(err);
        }
      }, durationMs);
    });
  }

  // ─── 音频质量评估 ──────────────────────────────────────────

  async assessRecordingQuality(audioBlob: Blob): Promise<{
    quality: number;
    issues: string[];
    suggestions: string[];
  }> {
    const features = await extractLocalVoiceFeatures(audioBlob);
    const issues: string[] = [];
    const suggestions: string[] = [];
    let quality = 1.0;

    if (features.duration < 3) {
      issues.push('录音时长过短');
      suggestions.push('建议至少录制3秒以上的语音样本');
      quality -= 0.3;
    }

    if (features.silenceRatio > 0.5) {
      issues.push('录音中静音比例过高');
      suggestions.push('请在安静环境中录制，确保持续说话');
      quality -= 0.3;
    }

    if (features.averageAmplitude < 0.01) {
      issues.push('录音音量过低');
      suggestions.push('请靠近麦克风或增大音量');
      quality -= 0.2;
    }

    if (features.peakAmplitude > 0.95) {
      issues.push('录音可能存在削波失真');
      suggestions.push('请适当降低音量或远离麦克风');
      quality -= 0.2;
    }

    if (features.duration < 5) {
      suggestions.push('建议录制5秒以上以获得更好的声纹质量');
    }

    return {
      quality: Math.max(0, Math.min(1, quality)),
      issues,
      suggestions,
    };
  }
}

export const voiceCloningService = new VoiceCloningService();
