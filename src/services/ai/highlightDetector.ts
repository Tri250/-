// ============================================
// PawSync Pro 3.0 - Highlight Detector
//
// 作者: 带娃的小陈工
// 日期: 2026-06-10
// 描述: AI 精彩片段检测服务
// 从视频中检测有趣时刻
// ============================================

import type {
  HighlightClip,
  HighlightDetectionType,
  HighlightDetectionOptions,
} from '../../types/voice-analysis';

// ==================== 类型定义 ====================

/**
 * 视频帧分析结果
 */
interface FrameAnalysis {
  /** 帧索引 */
  frameIndex: number;
  /** 时间戳 (秒) */
  timestamp: number;
  /** 运动强度 */
  motionIntensity: number;
  /** 宠物位置 */
  petPosition: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** 宠物数量 */
  petCount: number;
  /** 姿势类型 */
  poseType: 'normal' | 'stretching' | 'playing' | 'sleeping' | 'eating' | 'other';
  /** 情绪估计 */
  emotionEstimate: 'happy' | 'calm' | 'excited' | 'anxious' | 'neutral';
  /** 检测到的类型 */
  detectedTypes: HighlightDetectionType[];
  /** 置信度 */
  confidence: number;
}

/**
 * 视频片段候选
 */
interface ClipCandidate {
  /** 开始帧 */
  startFrame: number;
  /** 结束帧 */
  endFrame: number;
  /** 开始时间 */
  startTime: number;
  /** 结束时间 */
  endTime: number;
  /** 检测类型 */
  detectionType: HighlightDetectionType;
  /** 平均置信度 */
  averageConfidence: number;
  /** 峰值置信度 */
  peakConfidence: number;
  /** 关键帧 */
  keyFrames: number[];
}

/**
 * 后端 API 响应
 */
interface BackendHighlightResponse {
  success: boolean;
  highlights?: Array<{
    startTime: number;
    endTime: number;
    type: HighlightDetectionType;
    confidence: number;
    description: string;
    thumbnailUrl?: string;
  }>;
  error?: { code: string; message: string };
}

// ==================== 检测规则 ====================

/**
 * 精彩片段检测规则
 */
const DETECTION_RULES: Record<HighlightDetectionType, {
  /** 最小运动强度 */
  minMotionIntensity?: number;
  /** 最小宠物大小占比 */
  minPetSizeRatio?: number;
  /** 最小宠物数量 */
  minPetCount?: number;
  /** 允许的姿势类型 */
  allowedPoseTypes?: string[];
  /** 允许的情绪 */
  allowedEmotions?: string[];
  /** 最小持续时间 */
  minDuration?: number;
  /** 最大持续时间 */
  maxDuration?: number;
  /** 描述模板 */
  descriptionTemplate: string;
}> = {
  fast_movement: {
    minMotionIntensity: 0.7,
    minDuration: 0.5,
    maxDuration: 5,
    descriptionTemplate: '宝贝快速移动，活力十足！',
  },
  close_camera: {
    minPetSizeRatio: 0.3,
    minDuration: 1,
    maxDuration: 10,
    descriptionTemplate: '宝贝靠近摄像头，近距离互动！',
  },
  funny_pose: {
    allowedPoseTypes: ['stretching', 'playing', 'other'],
    minDuration: 0.5,
    maxDuration: 3,
    descriptionTemplate: '宝贝摆出了有趣的姿势！',
  },
  multi_pet: {
    minPetCount: 2,
    minDuration: 1,
    maxDuration: 15,
    descriptionTemplate: '多个宠物同框，温馨时刻！',
  },
  playful_behavior: {
    allowedPoseTypes: ['playing'],
    allowedEmotions: ['happy', 'excited'],
    minMotionIntensity: 0.5,
    minDuration: 1,
    maxDuration: 10,
    descriptionTemplate: '宝贝正在开心玩耍！',
  },
  vocalization: {
    minDuration: 0.3,
    maxDuration: 5,
    descriptionTemplate: '宝贝发出了有趣的声音！',
  },
  interaction: {
    minPetCount: 2,
    minMotionIntensity: 0.4,
    minDuration: 1,
    maxDuration: 10,
    descriptionTemplate: '宝贝们正在互动！',
  },
  cute_expression: {
    allowedEmotions: ['happy', 'calm'],
    minPetSizeRatio: 0.2,
    minDuration: 0.5,
    maxDuration: 5,
    descriptionTemplate: '宝贝表情可爱动人！',
  },
};

// ==================== 精彩片段检测服务 ====================

/**
 * AI 精彩片段检测服务
 * 从视频中检测有趣时刻
 */
export class HighlightDetector {
  // 单例实例
  private static instance: HighlightDetector | null = null;

  // 后端 API 配置
  private backendConfig = {
    baseUrl: '/api/ai',
    version: 'v1',
    timeout: 60000,
    retries: 3,
  };

  // 缓存
  private cache: Map<string, { highlights: HighlightClip[]; expiresAt: number }> = new Map();

  // 初始化状态
  private initialized = false;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): HighlightDetector {
    if (!HighlightDetector.instance) {
      HighlightDetector.instance = new HighlightDetector();
    }
    return HighlightDetector.instance;
  }

  /**
   * 初始化服务
   */
  async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
    console.log('[HighlightDetector] 初始化成功');
  }

  /**
   * 检测精彩片段
   * 主入口方法
   */
  async detectHighlights(
    videoUrl: string,
    options: HighlightDetectionOptions = {}
  ): Promise<HighlightClip[]> {
    const startTime = Date.now();

    try {
      // 确保已初始化
      if (!this.initialized) {
        await this.init();
      }

      // 合并默认选项
      const opts: HighlightDetectionOptions = {
        minConfidence: 0.6,
        minDuration: 1,
        maxDuration: 10,
        detectionTypes: [
          'fast_movement',
          'close_camera',
          'funny_pose',
          'multi_pet',
          'playful_behavior',
          'interaction',
          'cute_expression',
        ],
        includeEmotionAnalysis: true,
        generateThumbnail: true,
        inferenceMode: 'backend',
        timeout: 60000,
        ...options,
      };

      // 检查缓存
      const cacheKey = this.generateCacheKey(videoUrl, opts);
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        console.log('[HighlightDetector] 使用缓存结果');
        return cached.highlights;
      }

      // 根据推理模式选择检测方式
      let highlights: HighlightClip[];

      if (opts.inferenceMode === 'backend') {
        // 后端高精度检测
        highlights = await this.performBackendDetection(videoUrl, opts);
      } else {
        // 前端轻量检测（模拟）
        highlights = await this.performFrontendDetection(videoUrl, opts);
      }

      // 过滤结果
      highlights = this.filterHighlights(highlights, opts);

      // 缓存结果
      this.cache.set(cacheKey, {
        highlights,
        expiresAt: Date.now() + 3600000, // 1 小时
      });

      console.log(`[HighlightDetector] 检测完成，找到 ${highlights.length} 个精彩片段，耗时 ${Date.now() - startTime}ms`);

      return highlights;
    } catch (error) {
      console.error('[HighlightDetector] 检测失败:', error);
      return [];
    }
  }

  /**
   * 执行后端检测
   */
  private async performBackendDetection(
    videoUrl: string,
    options: HighlightDetectionOptions
  ): Promise<HighlightClip[]> {
    let retries = 0;
    let lastError: Error | null = null;

    while (retries < this.backendConfig.retries) {
      try {
        // 调用后端 API
        const response = await this.callBackendAPI(videoUrl, options);

        if (response.success && response.highlights) {
          // 转换为 HighlightClip 格式
          return response.highlights.map((h, index) => this.createHighlightClip(
            h,
            videoUrl,
            index,
            options
          ));
        }

        lastError = new Error(response.error?.message || '后端检测失败');
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('后端 API 调用失败');
      }

      retries++;
      if (retries < this.backendConfig.retries) {
        await new Promise(resolve => setTimeout(resolve, 2000 * retries));
      }
    }

    // 后端失败，回退到前端检测
    console.warn('[HighlightDetector] 后端检测失败，回退到前端检测:', lastError);
    return this.performFrontendDetection(videoUrl, options);
  }

  /**
   * 调用后端 AI API
   */
  private async callBackendAPI(
    videoUrl: string,
    options: HighlightDetectionOptions
  ): Promise<BackendHighlightResponse> {
    const response = await fetch(
      `${this.backendConfig.baseUrl}/${this.backendConfig.version}/video/highlights`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoUrl,
          detectionTypes: options.detectionTypes,
          minConfidence: options.minConfidence,
          minDuration: options.minDuration,
          maxDuration: options.maxDuration,
          generateThumbnail: options.generateThumbnail,
        }),
        signal: AbortSignal.timeout(options.timeout || this.backendConfig.timeout),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 执行前端检测
   * 模拟实现，实际项目中需要使用视频处理库
   */
  private async performFrontendDetection(
    videoUrl: string,
    options: HighlightDetectionOptions
  ): Promise<HighlightClip[]> {
    // 模拟帧分析
    const frameAnalyses = await this.simulateFrameAnalysis(videoUrl, options);

    // 检测候选片段
    const candidates = this.detectClipCandidates(frameAnalyses, options);

    // 创建精彩片段
    return candidates.map((candidate, index) => this.createHighlightClipFromCandidate(
      candidate,
      videoUrl,
      index,
      options
    ));
  }

  /**
   * 模拟帧分析
   */
  private async simulateFrameAnalysis(
    videoUrl: string,
    options: HighlightDetectionOptions
  ): Promise<FrameAnalysis[]> {
    // 模拟视频分析（假设视频长度为 60 秒）
    const videoDuration = 60;
    const frameRate = 30;
    const totalFrames = videoDuration * frameRate;

    const analyses: FrameAnalysis[] = [];

    // 模拟几个精彩时刻
    const simulatedHighlights = [
      { start: 5, end: 8, type: 'fast_movement' as HighlightDetectionType },
      { start: 15, end: 18, type: 'close_camera' as HighlightDetectionType },
      { start: 25, end: 28, type: 'funny_pose' as HighlightDetectionType },
      { start: 35, end: 40, type: 'multi_pet' as HighlightDetectionType },
      { start: 45, end: 50, type: 'playful_behavior' as HighlightDetectionType },
    ];

    for (let frame = 0; frame < totalFrames; frame++) {
      const timestamp = frame / frameRate;

      // 检查是否在模拟的精彩时刻范围内
      const isInHighlight = simulatedHighlights.some(
        h => timestamp >= h.start && timestamp <= h.end
      );

      const currentHighlight = simulatedHighlights.find(
        h => timestamp >= h.start && timestamp <= h.end
      );

      const detectedTypes: HighlightDetectionType[] = [];
      if (currentHighlight) {
        detectedTypes.push(currentHighlight.type);
      }

      analyses.push({
        frameIndex: frame,
        timestamp,
        motionIntensity: isInHighlight ? 0.7 + Math.random() * 0.2 : 0.2 + Math.random() * 0.3,
        petPosition: {
          x: Math.random() * 0.8 + 0.1,
          y: Math.random() * 0.6 + 0.2,
          width: currentHighlight?.type === 'close_camera' ? 0.4 : 0.2,
          height: currentHighlight?.type === 'close_camera' ? 0.3 : 0.15,
        },
        petCount: currentHighlight?.type === 'multi_pet' ? 2 + Math.floor(Math.random() * 2) : 1,
        poseType: currentHighlight?.type === 'funny_pose' ? 'stretching' : 'normal',
        emotionEstimate: currentHighlight?.type === 'playful_behavior' ? 'happy' : 'calm',
        detectedTypes,
        confidence: isInHighlight ? 0.75 + Math.random() * 0.2 : 0.3 + Math.random() * 0.2,
      });
    }

    return analyses;
  }

  /**
   * 检测候选片段
   */
  private detectClipCandidates(
    frameAnalyses: FrameAnalysis[],
    options: HighlightDetectionOptions
  ): ClipCandidate[] {
    const candidates: ClipCandidate[] = [];

    // 按检测类型分组
    for (const detectionType of options.detectionTypes || []) {
      const rule = DETECTION_RULES[detectionType];
      if (!rule) continue;

      // 找出符合规则的帧
      const matchingFrames = frameAnalyses.filter(frame => {
        // 检查运动强度
        if (rule.minMotionIntensity && frame.motionIntensity < rule.minMotionIntensity) {
          return false;
        }

        // 检查宠物大小
        if (rule.minPetSizeRatio) {
          const sizeRatio = frame.petPosition.width * frame.petPosition.height;
          if (sizeRatio < rule.minPetSizeRatio) return false;
        }

        // 检查宠物数量
        if (rule.minPetCount && frame.petCount < rule.minPetCount) {
          return false;
        }

        // 检查姿势类型
        if (rule.allowedPoseTypes && !rule.allowedPoseTypes.includes(frame.poseType)) {
          return false;
        }

        // 检查情绪
        if (rule.allowedEmotions && !rule.allowedEmotions.includes(frame.emotionEstimate)) {
          return false;
        }

        return frame.confidence >= (options.minConfidence || 0.6);
      });

      // 合并连续帧为片段
      const segments = this.mergeFramesToSegments(matchingFrames, detectionType, rule);

      candidates.push(...segments);
    }

    // 按置信度排序
    candidates.sort((a, b) => b.averageConfidence - a.averageConfidence);

    return candidates;
  }

  /**
   * 合并连续帧为片段
   */
  private mergeFramesToSegments(
    frames: FrameAnalysis[],
    detectionType: HighlightDetectionType,
    rule: typeof DETECTION_RULES[HighlightDetectionType]
  ): ClipCandidate[] {
    if (frames.length === 0) return [];

    const candidates: ClipCandidate[] = [];
    let currentSegment: FrameAnalysis[] = [];

    for (const frame of frames) {
      if (currentSegment.length === 0) {
        currentSegment.push(frame);
      } else {
        const lastFrame = currentSegment[currentSegment.length - 1];
        const gap = frame.timestamp - lastFrame.timestamp;

        // 如果帧间隔小于 0.5 秒，认为是连续的
        if (gap < 0.5) {
          currentSegment.push(frame);
        } else {
          // 结束当前片段，开始新片段
          const candidate = this.createCandidateFromFrames(
            currentSegment,
            detectionType,
            rule
          );
          if (candidate) candidates.push(candidate);
          currentSegment = [frame];
        }
      }
    }

    // 处理最后一个片段
    if (currentSegment.length > 0) {
      const candidate = this.createCandidateFromFrames(
        currentSegment,
        detectionType,
        rule
      );
      if (candidate) candidates.push(candidate);
    }

    return candidates;
  }

  /**
   * 从帧创建候选片段
   */
  private createCandidateFromFrames(
    frames: FrameAnalysis[],
    detectionType: HighlightDetectionType,
    rule: typeof DETECTION_RULES[HighlightDetectionType]
  ): ClipCandidate | null {
    const startTime = frames[0].timestamp;
    const endTime = frames[frames.length - 1].timestamp;
    const duration = endTime - startTime;

    // 检查持续时间是否符合规则
    if (rule.minDuration && duration < rule.minDuration) return null;
    if (rule.maxDuration && duration > rule.maxDuration) return null;

    const confidences = frames.map(f => f.confidence);
    const averageConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    const peakConfidence = Math.max(...confidences);

    // 找出关键帧（置信度最高的帧）
    const peakIndex = confidences.indexOf(peakConfidence);
    const keyFrames = [
      frames[0].frameIndex,
      frames[peakIndex].frameIndex,
      frames[frames.length - 1].frameIndex,
    ];

    return {
      startFrame: frames[0].frameIndex,
      endFrame: frames[frames.length - 1].frameIndex,
      startTime,
      endTime,
      detectionType,
      averageConfidence,
      peakConfidence,
      keyFrames,
    };
  }

  /**
   * 从后端响应创建精彩片段
   */
  private createHighlightClip(
    highlight: NonNullable<BackendHighlightResponse['highlights']>[0],
    videoUrl: string,
    index: number,
    options: HighlightDetectionOptions
  ): HighlightClip {
    const rule = DETECTION_RULES[highlight.type];
    const id = `highlight_${Date.now()}_${index}`;

    return {
      id,
      videoUrl,
      thumbnailUrl: highlight.thumbnailUrl || this.generateThumbnailUrl(videoUrl, highlight.startTime),
      title: this.generateTitle(highlight.type),
      description: highlight.description || rule?.descriptionTemplate || '精彩片段',
      startTime: highlight.startTime,
      endTime: highlight.endTime,
      duration: highlight.endTime - highlight.startTime,
      detectionType: highlight.type,
      confidence: highlight.confidence,
      tags: this.generateTags(highlight.type),
      emotions: options.includeEmotionAnalysis ? ['happy', 'excited'] : [],
      sceneDescription: this.generateSceneDescription(highlight.type),
      createdAt: new Date().toISOString(),
      status: 'ready',
    };
  }

  /**
   * 从候选创建精彩片段
   */
  private createHighlightClipFromCandidate(
    candidate: ClipCandidate,
    videoUrl: string,
    index: number,
    options: HighlightDetectionOptions
  ): HighlightClip {
    const rule = DETECTION_RULES[candidate.detectionType];
    const id = `highlight_${Date.now()}_${index}`;

    return {
      id,
      videoUrl,
      thumbnailUrl: this.generateThumbnailUrl(videoUrl, candidate.startTime),
      title: this.generateTitle(candidate.detectionType),
      description: rule?.descriptionTemplate || '精彩片段',
      startTime: candidate.startTime,
      endTime: candidate.endTime,
      duration: candidate.endTime - candidate.startTime,
      detectionType: candidate.detectionType,
      confidence: candidate.averageConfidence,
      tags: this.generateTags(candidate.detectionType),
      emotions: options.includeEmotionAnalysis ? this.inferEmotions(candidate) : [],
      sceneDescription: this.generateSceneDescription(candidate.detectionType),
      createdAt: new Date().toISOString(),
      status: 'ready',
    };
  }

  /**
   * 过滤精彩片段
   */
  private filterHighlights(
    highlights: HighlightClip[],
    options: HighlightDetectionOptions
  ): HighlightClip[] {
    return highlights.filter(h => {
      // 置信度过滤
      if (h.confidence < (options.minConfidence || 0.6)) return false;

      // 持续时间过滤
      if (h.duration < (options.minDuration || 1)) return false;
      if (h.duration > (options.maxDuration || 10)) return false;

      // 检测类型过滤
      if (options.detectionTypes && !options.detectionTypes.includes(h.detectionType)) {
        return false;
      }

      return true;
    });
  }

  /**
   * 生成标题
   */
  private generateTitle(type: HighlightDetectionType): string {
    const titles: Record<HighlightDetectionType, string> = {
      fast_movement: '活力时刻',
      close_camera: '近距离互动',
      funny_pose: '有趣姿势',
      multi_pet: '温馨同框',
      playful_behavior: '开心玩耍',
      vocalization: '发声时刻',
      interaction: '互动瞬间',
      cute_expression: '可爱表情',
    };
    return titles[type] || '精彩片段';
  }

  /**
   * 生成标签
   */
  private generateTags(type: HighlightDetectionType): string[] {
    const tags: Record<HighlightDetectionType, string[]> = {
      fast_movement: ['运动', '活力', '快速'],
      close_camera: ['近距离', '互动', '可爱'],
      funny_pose: ['有趣', '姿势', '搞笑'],
      multi_pet: ['多宠物', '同框', '温馨'],
      playful_behavior: ['玩耍', '开心', '互动'],
      vocalization: ['发声', '声音', '表达'],
      interaction: ['互动', '社交', '友谊'],
      cute_expression: ['可爱', '表情', '萌'],
    };
    return tags[type] || ['精彩'];
  }

  /**
   * 生成场景描述
   */
  private generateSceneDescription(type: HighlightDetectionType): string {
    const descriptions: Record<HighlightDetectionType, string> = {
      fast_movement: '宝贝快速移动，展现出充沛的活力',
      close_camera: '宝贝靠近摄像头，近距离与主人互动',
      funny_pose: '宝贝摆出了有趣的姿势，让人忍俊不禁',
      multi_pet: '多个宠物同时出现在画面中，温馨可爱',
      playful_behavior: '宝贝正在开心玩耍，充满活力',
      vocalization: '宝贝发出了有趣的声音，表达情感',
      interaction: '宝贝们正在互动，展现出友谊',
      cute_expression: '宝贝的表情非常可爱，让人心动',
    };
    return descriptions[type] || '精彩瞬间';
  }

  /**
   * 推断情绪
   */
  private inferEmotions(candidate: ClipCandidate): string[] {
    const emotions: string[] = [];

    switch (candidate.detectionType) {
      case 'fast_movement':
        emotions.push('excited', 'happy');
        break;
      case 'playful_behavior':
        emotions.push('happy', 'playful');
        break;
      case 'multi_pet':
        emotions.push('happy', 'social');
        break;
      case 'cute_expression':
        emotions.push('calm', 'happy');
        break;
      default:
        emotions.push('neutral');
    }

    return emotions;
  }

  /**
   * 生成缩略图 URL
   */
  private generateThumbnailUrl(videoUrl: string, startTime: number): string {
    // 实际项目中应从视频提取缩略图
    // 这里返回模拟 URL
    return `${videoUrl}?thumbnail&t=${startTime}`;
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(videoUrl: string, options: HighlightDetectionOptions): string {
    return `highlight_${videoUrl}_${JSON.stringify(options)}`;
  }

  /**
   * 获取服务状态
   */
  getStatus(): {
    initialized: boolean;
    cacheSize: number;
  } {
    return {
      initialized: this.initialized,
      cacheSize: this.cache.size,
    };
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[HighlightDetector] 缓存已清除');
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.clearCache();
    this.initialized = false;
    console.log('[HighlightDetector] 服务已销毁');
  }
}

// 导出单例
export const highlightDetector = HighlightDetector.getInstance();