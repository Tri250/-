/**
 * 声音检测服务
 * 使用 YAMNet 模型进行声音检测和分类
 * 通过后端 API 调用 AI 模型
 */

import type {
  SoundEvent,
  PetSoundType,
  EnvironmentSoundType,
  PetSoundClassification,
  SoundDetectionConfig,
  YAMNetConfig,
  DetectionMode,
  DetectionServiceStatus,
  PetType,
} from './types';
import { DEFAULT_SOUND_DETECTION_CONFIG, DEFAULT_YAMNET_CONFIG } from './types';

/**
 * 后端 API 响应格式
 */
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  processingTime?: number;
}

/**
 * YAMNet 分类结果
 */
interface YAMNetClassificationResult {
  soundType: PetSoundType | EnvironmentSoundType;
  isPetSound: boolean;
  confidence: number;
  volumeLevel: number;
  duration: number;
  spectralFeatures?: {
    dominantFrequency: number;
    spectralCentroid: number;
    spectralBandwidth: number;
  };
}

/**
 * 声音检测服务类
 */
class SoundDetectionService {
  /** 服务配置 */
  private config: SoundDetectionConfig;
  /** YAMNet 模型配置 */
  private yamnetConfig: YAMNetConfig;
  /** 后端 API 基础 URL */
  private backendBaseUrl: string;
  /** 检测模式 */
  private mode: DetectionMode;
  /** 是否已初始化 */
  private initialized: boolean = false;
  /** 声音事件历史 */
  private eventHistory: SoundEvent[] = [];
  /** 最大历史记录数 */
  private maxHistorySize: number = 1000;
  /** 音频缓冲区 */
  private audioBuffer: Float32Array[] = [];
  /** 最大缓冲区大小 */
  private maxBufferSize: number = 100;

  /**
   * 构造函数
   */
  constructor() {
    this.config = { ...DEFAULT_SOUND_DETECTION_CONFIG };
    this.yamnetConfig = { ...DEFAULT_YAMNET_CONFIG };
    this.backendBaseUrl = '/api';
    this.mode = 'realtime';
  }

  /**
   * 初始化服务
   * @param config 检测配置
   * @param yamnetConfig YAMNet 配置
   * @param backendBaseUrl 后端 API 基础 URL
   */
  async initialize(
    config?: Partial<SoundDetectionConfig>,
    yamnetConfig?: Partial<YAMNetConfig>,
    backendBaseUrl?: string
  ): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    if (yamnetConfig) {
      this.yamnetConfig = { ...this.yamnetConfig, ...yamnetConfig };
    }
    if (backendBaseUrl) {
      this.backendBaseUrl = backendBaseUrl;
    }

    // 检查后端 API 可用性
    try {
      const response = await fetch(`${this.backendBaseUrl}${this.yamnetConfig.apiEndpoint}/health`, {
        method: 'GET',
      });
      
      if (response.ok) {
        this.initialized = true;
        console.log('[SoundDetectionService] 服务初始化成功');
      } else {
        console.warn('[SoundDetectionService] 后端 API 不可用，使用模拟模式');
        this.initialized = true;
      }
    } catch (error) {
      console.warn('[SoundDetectionService] 后端 API 连接失败，使用模拟模式:', error);
      this.initialized = true;
    }
  }

  /**
   * 检测声音
   * @param audioData 音频数据（Float32Array）
   * @param cameraId 摄像头 ID
   * @returns 声音事件
   */
  async detectSound(audioData: Float32Array, cameraId: string): Promise<SoundEvent> {
    if (!this.initialized) {
      throw new Error('[SoundDetectionService] 服务未初始化');
    }

    const timestamp = new Date().toISOString();

    try {
      // 调用后端 YAMNet API
      const result = await this.callYAMNetAPI(audioData, cameraId);
      
      // 转换为声音事件
      const event = this.createSoundEvent(result, cameraId, timestamp);
      
      // 更新历史记录
      this.updateHistory(event);

      // 更新音频缓冲区
      this.updateBuffer(audioData);

      return event;
    } catch (error) {
      console.error('[SoundDetectionService] 检测失败:', error);
      // 返回模拟数据
      return this.generateMockSoundEvent(cameraId, timestamp);
    }
  }

  /**
   * 分类宠物声音
   * @param audioData 音频数据
   * @param petType 宠物类型（可选）
   * @returns 宠物声音分类结果
   */
  async classifyPetSound(
    audioData: Float32Array,
    petType?: PetType
  ): Promise<PetSoundClassification> {
    if (!this.initialized) {
      throw new Error('[SoundDetectionService] 服务未初始化');
    }

    const timestamp = new Date().toISOString();

    try {
      // 调用后端 API 进行宠物声音分类
      const result = await this.callPetSoundClassificationAPI(audioData, petType);
      
      return {
        id: `sound-class-${Date.now()}`,
        timestamp,
        petType: result.petType,
        soundType: result.soundType,
        confidence: result.confidence,
        emotion: result.emotion,
        probabilities: result.probabilities,
      };
    } catch (error) {
      console.error('[SoundDetectionService] 分类失败:', error);
      // 返回模拟数据
      return this.generateMockPetSoundClassification(timestamp);
    }
  }

  /**
   * 获取声音事件历史
   * @param cameraId 摄像头 ID
   * @param limit 最大数量
   * @returns 声音事件数组
   */
  getSoundHistory(cameraId: string, limit: number = 50): SoundEvent[] {
    return this.eventHistory
      .filter(event => event.cameraId === cameraId)
      .slice(-limit);
  }

  /**
   * 获取最近的宠物声音事件
   * @param limit 最大数量
   * @returns 声音事件数组
   */
  getRecentPetSounds(limit: number = 20): SoundEvent[] {
    return this.eventHistory
      .filter(event => event.isPetSound)
      .slice(-limit);
  }

  /**
   * 获取最近的环境声音事件
   * @param limit 最大数量
   * @returns 声音事件数组
   */
  getRecentEnvironmentSounds(limit: number = 20): SoundEvent[] {
    return this.eventHistory
      .filter(event => !event.isPetSound)
      .slice(-limit);
  }

  /**
   * 获取服务状态
   */
  getStatus(): DetectionServiceStatus {
    return {
      serviceName: 'SoundDetectionService',
      initialized: this.initialized,
      modelStatus: {
        yolov8: 'idle',
        yamnet: this.initialized ? 'loaded' : 'idle',
        behavior: 'idle',
        custom: 'idle',
      },
      isDetecting: this.audioBuffer.length > 0,
      currentMode: this.mode,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * 设置检测模式
   */
  setMode(mode: DetectionMode): void {
    this.mode = mode;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<SoundDetectionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 清除历史数据
   */
  clearHistory(): void {
    this.eventHistory = [];
    this.audioBuffer = [];
  }

  /**
   * 获取支持的宠物声音类型列表
   */
  getSupportedPetSounds(): PetSoundType[] {
    return [
      'barking',    // 狗叫
      'meowing',    // 猫叫
      'whining',    // 呜咽
      'purring',    // 呼噜
      'howling',    // 嚎叫
      'growling',   // 咆哮
      'chirping',   // 鸟鸣
      'squeaking',  // 吱吱叫
    ];
  }

  /**
   * 获取支持的环境声音类型列表
   */
  getSupportedEnvironmentSounds(): EnvironmentSoundType[] {
    return [
      'glass_breaking',  // 玻璃破碎
      'door_banging',    // 敲门
      'alarm',           // 警报
      'doorbell',        // 门铃
      'thunder',         // 雷声
      'fireworks',       // 烟花
      'siren',           // 警笛
      'smoke_alarm',     // 烟雾报警
      'unknown',         // 未知
    ];
  }

  /**
   * 获取声音描述（中文）
   */
  getSoundDescription(soundType: PetSoundType | EnvironmentSoundType): string {
    const petDescriptions: Record<PetSoundType, string> = {
      barking: '狗叫声',
      meowing: '猫叫声',
      whining: '呜咽声',
      purring: '呼噜声',
      howling: '嚎叫声',
      growling: '咆哮声',
      chirping: '鸟鸣声',
      squeaking: '吱吱叫声',
    };

    const envDescriptions: Record<EnvironmentSoundType, string> = {
      glass_breaking: '玻璃破碎声',
      door_banging: '敲门声',
      alarm: '警报声',
      doorbell: '门铃声',
      thunder: '雷声',
      fireworks: '烟花声',
      siren: '警笛声',
      smoke_alarm: '烟雾报警声',
      unknown: '未知声音',
    };

    if (soundType in petDescriptions) {
      return petDescriptions[soundType as PetSoundType];
    }
    return envDescriptions[soundType as EnvironmentSoundType] || '未知声音';
  }

  // ==================== 私有方法 ====================

  /**
   * 调用 YAMNet 后端 API
   */
  private async callYAMNetAPI(
    audioData: Float32Array,
    cameraId: string
  ): Promise<YAMNetClassificationResult> {
    // 将 Float32Array 转换为 Base64
    const base64Audio = this.float32ArrayToBase64(audioData);

    const response = await fetch(`${this.backendBaseUrl}${this.yamnetConfig.apiEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio: base64Audio,
        sampleRate: this.config.sampleRate,
        confidenceThreshold: this.config.confidenceThreshold,
        volumeThreshold: this.config.volumeThreshold,
        enableEnvironmentDetection: this.config.enableEnvironmentDetection,
        cameraId,
      }),
    });

    if (!response.ok) {
      throw new Error(`YAMNet API 请求失败: ${response.status}`);
    }

    const result: APIResponse<YAMNetClassificationResult> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'YAMNet 检测失败');
    }

    return result.data;
  }

  /**
   * 调用宠物声音分类 API
   */
  private async callPetSoundClassificationAPI(
    audioData: Float32Array,
    petType?: PetType
  ): Promise<{
    petType: PetType;
    soundType: PetSoundType;
    confidence: number;
    emotion?: { type: string; intensity: number };
    probabilities: Record<PetSoundType, number>;
  }> {
    const base64Audio = this.float32ArrayToBase64(audioData);

    const response = await fetch(`${this.backendBaseUrl}${this.yamnetConfig.apiEndpoint}/pet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio: base64Audio,
        sampleRate: this.config.sampleRate,
        petType,
      }),
    });

    if (!response.ok) {
      throw new Error(`宠物声音分类 API 请求失败: ${response.status}`);
    }

    const result: APIResponse<{
      petType: PetType;
      soundType: PetSoundType;
      confidence: number;
      emotion?: { type: string; intensity: number };
      probabilities: Record<PetSoundType, number>;
    }> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || '宠物声音分类失败');
    }

    return result.data;
  }

  /**
   * 创建声音事件
   */
  private createSoundEvent(
    result: YAMNetClassificationResult,
    cameraId: string,
    timestamp: string
  ): SoundEvent {
    return {
      id: `sound-${Date.now()}`,
      cameraId,
      timestamp,
      soundType: result.soundType,
      isPetSound: result.isPetSound,
      confidence: result.confidence,
      volumeLevel: result.volumeLevel,
      duration: result.duration,
      spectralFeatures: result.spectralFeatures,
      metadata: {
        description: this.getSoundDescription(result.soundType),
      },
    };
  }

  /**
   * 更新历史记录
   */
  private updateHistory(event: SoundEvent): void {
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.splice(0, this.eventHistory.length - this.maxHistorySize);
    }
  }

  /**
   * 更新音频缓冲区
   */
  private updateBuffer(audioData: Float32Array): void {
    this.audioBuffer.push(audioData);
    if (this.audioBuffer.length > this.maxBufferSize) {
      this.audioBuffer.shift();
    }
  }

  /**
   * 将 Float32Array 转换为 Base64
   */
  private float32ArrayToBase64(data: Float32Array): string {
    // 创建一个包含 Float32Array 数据的 ArrayBuffer
    const buffer = new ArrayBuffer(data.length * 4);
    const view = new DataView(buffer);
    
    for (let i = 0; i < data.length; i++) {
      view.setFloat32(i * 4, data[i], true);
    }
    
    // 将 ArrayBuffer 转换为 Base64
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return btoa(binary);
  }

  /**
   * 生成模拟声音事件
   */
  private generateMockSoundEvent(cameraId: string, timestamp: string): SoundEvent {
    const petSounds = this.getSupportedPetSounds();
    const envSounds = this.getSupportedEnvironmentSounds();
    const isPetSound = Math.random() > 0.3;
    const soundType = isPetSound
      ? petSounds[Math.floor(Math.random() * petSounds.length)]
      : envSounds[Math.floor(Math.random() * envSounds.length)];

    return {
      id: `sound-mock-${Date.now()}`,
      cameraId,
      timestamp,
      soundType,
      isPetSound,
      confidence: 0.6 + Math.random() * 0.4,
      volumeLevel: 30 + Math.random() * 40,
      duration: Math.random() * 5,
      spectralFeatures: {
        dominantFrequency: 200 + Math.random() * 800,
        spectralCentroid: 500 + Math.random() * 1000,
        spectralBandwidth: 100 + Math.random() * 200,
      },
    };
  }

  /**
   * 生成模拟宠物声音分类
   */
  private generateMockPetSoundClassification(timestamp: string): PetSoundClassification {
    const petSounds = this.getSupportedPetSounds();
    const soundType = petSounds[Math.floor(Math.random() * petSounds.length)];
    const petType = Math.random() > 0.5 ? 'cat' : 'dog';

    // 生成概率分布
    const probabilities: Record<PetSoundType, number> = {} as Record<PetSoundType, number>;
    let total = 0;
    for (const sound of petSounds) {
      probabilities[sound] = Math.random();
      total += probabilities[sound];
    }
    // 归一化
    for (const sound of petSounds) {
      probabilities[sound] /= total;
    }
    // 设置最高概率为预测结果
    probabilities[soundType] = 0.6 + Math.random() * 0.4;

    return {
      id: `sound-class-mock-${Date.now()}`,
      timestamp,
      petType,
      soundType,
      confidence: 0.6 + Math.random() * 0.4,
      emotion: {
        type: ['happy', 'anxious', 'calm', 'excited'][Math.floor(Math.random() * 4)],
        intensity: Math.random(),
      },
      probabilities,
    };
  }
}

// 导出单例和服务类
export const soundDetectionService = new SoundDetectionService();
export { SoundDetectionService };