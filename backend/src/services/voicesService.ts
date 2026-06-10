/**
 * 声音记录存储服务
 * 声音情绪分析接口
 */

import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import prisma from '../lib/prisma';

// 上传目录配置
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const VOICES_DIR = path.join(UPLOAD_DIR, 'voices');

// 确保上传目录存在
if (!fs.existsSync(VOICES_DIR)) {
  fs.mkdirSync(VOICES_DIR, { recursive: true });
}

/**
 * 支持的音频类型
 */
const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
  'audio/aac',
  'audio/m4a',
];

/**
 * 最大文件大小（20MB）
 */
const MAX_FILE_SIZE = 20 * 1024 * 1024;

/**
 * 情绪类型
 */
export type EmotionType = 'HAPPY' | 'SAD' | 'ANGRY' | 'FEARFUL' | 'ANXIOUS' | 'EXCITED' | 'CALM' | 'CONFUSED' | 'PLAYFUL' | 'AFFECTIONATE';

/**
 * 声音记录创建数据
 */
export interface CreateVoiceRecordData {
  petId: string;
  duration: number;
}

/**
 * 声音分析结果
 */
export interface VoiceAnalysisResult {
  emotion: EmotionType;
  confidence: number;
  translation: string;
  suggestion: string;
  details: {
    pitch: number;
    intensity: number;
    duration: number;
    patterns: string[];
  };
}

/**
 * 声音记录数据接口
 */
export interface VoiceRecord {
  id: string;
  petId: string;
  audioUrl: string;
  duration: number;
  emotion?: EmotionType;
  confidence?: number;
  translation?: string;
  suggestion?: string;
  analysisDetails?: any;
  isAnalyzed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 情绪翻译映射
 */
const EMOTION_TRANSLATIONS: Record<EmotionType, string> = {
  HAPPY: '开心/愉悦',
  SAD: '悲伤/低落',
  ANGRY: '生气/愤怒',
  FEARFUL: '恐惧/害怕',
  ANXIOUS: '焦虑/不安',
  EXCITED: '兴奋/激动',
  CALM: '平静/放松',
  CONFUSED: '困惑/迷茫',
  PLAYFUL: '顽皮/想玩',
  AFFECTIONATE: '亲昵/撒娇',
};

/**
 * 情绪建议映射
 */
const EMOTION_SUGGESTIONS: Record<EmotionType, string[]> = {
  HAPPY: [
    '宠物现在心情很好，可以趁机进行一些训练活动',
    '可以给一些零食奖励，强化积极情绪',
    '适合进行户外活动或游戏',
  ],
  SAD: [
    '尝试用玩具或零食转移注意力',
    '增加陪伴时间，多进行互动',
    '检查是否有身体不适或环境变化',
  ],
  ANGRY: [
    '给予空间，不要强行接近',
    '检查是否有疼痛或不适',
    '避免刺激，等待情绪平复',
  ],
  FEARFUL: [
    '找出恐惧源并尽量消除',
    '提供安全的躲藏空间',
    '用温和的声音安抚，不要强迫',
  ],
  ANXIOUS: [
    '保持环境安静稳定',
    '使用舒缓的音乐或费洛蒙',
    '建立规律的作息时间',
  ],
  EXCITED: [
    '引导进行消耗精力的活动',
    '注意避免过度兴奋导致的问题',
    '可以安排一些训练或游戏',
  ],
  CALM: [
    '这是很好的休息状态',
    '可以轻轻抚摸增进感情',
    '适合进行健康检查或护理',
  ],
  CONFUSED: [
    '检查是否有认知问题',
    '保持环境简单一致',
    '耐心引导，不要急躁',
  ],
  PLAYFUL: [
    '这是互动的好时机',
    '可以安排游戏或训练',
    '注意安全，避免过度疲劳',
  ],
  AFFECTIONATE: [
    '回应宠物的亲昵行为',
    '这是增进感情的好机会',
    '可以给予轻柔的抚摸',
  ],
};

/**
 * 声音服务类
 */
export class VoicesService {
  /**
   * 上传音频文件
   * @param file 上传的文件
   * @returns 文件 URL
   */
  async uploadAudioFile(file: Express.Multer.File): Promise<string> {
    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('文件大小超过限制（最大 20MB）');
    }

    // 验证文件类型
    if (!ALLOWED_AUDIO_TYPES.includes(file.mimetype)) {
      throw new Error('不支持的音频格式');
    }

    // 生成唯一文件名
    const ext = path.extname(file.originalname) || '.webm';
    const filename = `${uuidv4()}${ext}`;
    const filepath = path.join(VOICES_DIR, filename);

    // 移动文件到目标目录
    await fs.promises.rename(file.path, filepath);

    // 生成访问 URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    return `${baseUrl}/uploads/voices/${filename}`;
  }

  /**
   * 删除音频文件
   * @param fileUrl 文件 URL
   */
  async deleteAudioFile(fileUrl: string): Promise<void> {
    try {
      const filename = path.basename(fileUrl);
      const filepath = path.join(VOICES_DIR, filename);

      if (fs.existsSync(filepath)) {
        await fs.promises.unlink(filepath);
      }
    } catch (error) {
      console.error('删除音频文件失败:', error);
    }
  }

  /**
   * 解析声音记录数据
   * @param record 数据库声音记录
   * @returns 解析后的声音记录
   */
  private parseVoiceRecord(record: any): VoiceRecord {
    return {
      ...record,
      emotion: record.emotion as EmotionType | undefined,
      analysisDetails: record.analysisDetails ? JSON.parse(record.analysisDetails) : undefined,
    };
  }

  /**
   * 创建声音记录
   * @param data 声音记录数据
   * @param file 上传的文件
   * @returns 创建的声音记录
   */
  async createVoiceRecord(
    data: CreateVoiceRecordData,
    file: Express.Multer.File
  ): Promise<VoiceRecord> {
    // 上传文件
    const audioUrl = await this.uploadAudioFile(file);

    // 创建声音记录
    const voiceRecord = await prisma.voiceRecord.create({
      data: {
        petId: data.petId,
        audioUrl,
        duration: data.duration,
        isAnalyzed: false,
      },
    });

    return this.parseVoiceRecord(voiceRecord);
  }

  /**
   * 获取宠物的声音记录列表
   * @param petId 宠物ID
   * @param options 查询选项
   * @returns 声音记录列表
   */
  async getVoiceRecordsByPetId(
    petId: string,
    options?: {
      isAnalyzed?: boolean;
      emotion?: EmotionType;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ records: VoiceRecord[]; total: number }> {
    const where: any = { petId };

    if (options?.isAnalyzed !== undefined) {
      where.isAnalyzed = options.isAnalyzed;
    }

    if (options?.emotion) {
      where.emotion = options.emotion;
    }

    const [records, total] = await Promise.all([
      prisma.voiceRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 20,
        skip: options?.offset || 0,
      }),
      prisma.voiceRecord.count({ where }),
    ]);

    return {
      records: records.map((r: any) => this.parseVoiceRecord(r)),
      total,
    };
  }

  /**
   * 获取单个声音记录
   * @param id 声音记录ID
   * @returns 声音记录
   */
  async getVoiceRecordById(id: string): Promise<VoiceRecord | null> {
    const record = await prisma.voiceRecord.findUnique({
      where: { id },
    });

    if (!record) {
      return null;
    }

    return this.parseVoiceRecord(record);
  }

  /**
   * 分析声音情绪
   * @param id 声音记录ID
   * @returns 分析结果
   */
  async analyzeVoice(id: string): Promise<VoiceAnalysisResult> {
    const voiceRecord = await prisma.voiceRecord.findUnique({
      where: { id },
    });

    if (!voiceRecord) {
      throw new Error('声音记录不存在');
    }

    // 模拟 AI 分析（生产环境应调用真实的 AI 服务）
    const analysisResult = await this.performVoiceAnalysis(voiceRecord);

    // 更新声音记录
    await prisma.voiceRecord.update({
      where: { id },
      data: {
        emotion: analysisResult.emotion,
        confidence: analysisResult.confidence,
        translation: analysisResult.translation,
        suggestion: analysisResult.suggestion,
        analysisDetails: JSON.stringify(analysisResult.details),
        isAnalyzed: true,
      },
    });

    return analysisResult;
  }

  /**
   * 执行声音分析（模拟实现）
   * 生产环境应调用真实的 AI 分析服务
   * @param voiceRecord 声音记录
   * @returns 分析结果
   */
  protected async performVoiceAnalysis(
    voiceRecord: any
  ): Promise<VoiceAnalysisResult> {
    // 模拟分析延迟
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 随机选择情绪（模拟）
    const emotions: EmotionType[] = [
      'HAPPY',
      'EXCITED',
      'ANXIOUS',
      'CALM',
      'PLAYFUL',
      'AFFECTIONATE',
    ];
    const emotion = emotions[Math.floor(Math.random() * emotions.length)];
    const confidence = 0.7 + Math.random() * 0.25;

    // 生成分析详情
    const details = {
      pitch: 200 + Math.random() * 800,
      intensity: 40 + Math.random() * 40,
      duration: voiceRecord.duration,
      patterns: ['短促', '重复', '升调'],
    };

    // 生成翻译文本
    const translation = this.generateTranslation(emotion);

    // 获取建议
    const suggestion = this.getSuggestion(emotion);

    return {
      emotion,
      confidence: Math.round(confidence * 100) / 100,
      translation,
      suggestion,
      details,
    };
  }

  /**
   * 生成翻译文本
   * @param emotion 情绪类型
   * @returns 翻译文本
   */
  protected generateTranslation(emotion: EmotionType): string {
    const translation = EMOTION_TRANSLATIONS[emotion];
    const templates = [
      `您的宠物现在看起来${translation}`,
      `分析显示您的宠物正处于${translation}的状态`,
      `从声音表现来看，您的宠物似乎${translation}`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * 获取建议
   * @param emotion 情绪类型
   * @returns 建议
   */
  protected getSuggestion(emotion: EmotionType): string {
    const suggestions = EMOTION_SUGGESTIONS[emotion];
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  }

  /**
   * 删除声音记录
   * @param id 声音记录ID
   * @returns 是否成功
   */
  async deleteVoiceRecord(id: string): Promise<boolean> {
    const voiceRecord = await prisma.voiceRecord.findUnique({
      where: { id },
    });

    if (!voiceRecord) {
      return false;
    }

    // 删除文件
    await this.deleteAudioFile(voiceRecord.audioUrl);

    // 删除数据库记录
    await prisma.voiceRecord.delete({
      where: { id },
    });

    return true;
  }

  /**
   * 获取情绪统计
   * @param petId 宠物ID
   * @returns 情绪分布统计
   */
  async getEmotionStats(
    petId: string
  ): Promise<{ emotion: EmotionType; count: number }[]> {
    const records = await prisma.voiceRecord.findMany({
      where: {
        petId,
        isAnalyzed: true,
      },
      select: {
        emotion: true,
      },
    });

    // 统计各情绪数量
    const emotionCounts = new Map<EmotionType, number>();

    for (const record of records) {
      if (record.emotion) {
        const count = emotionCounts.get(record.emotion as EmotionType) || 0;
        emotionCounts.set(record.emotion as EmotionType, count + 1);
      }
    }

    // 转换为数组并排序
    return Array.from(emotionCounts.entries())
      .map(([emotion, count]) => ({ emotion, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * 批量分析未分析的声音记录
   * @param petId 宠物ID
   * @returns 分析数量
   */
  async analyzePendingRecords(petId: string): Promise<number> {
    const pendingRecords = await prisma.voiceRecord.findMany({
      where: {
        petId,
        isAnalyzed: false,
      },
    });

    for (const record of pendingRecords) {
      await this.analyzeVoice(record.id);
    }

    return pendingRecords.length;
  }
}

// 导出单例实例
export const voicesService = new VoicesService();

export default VoicesService;