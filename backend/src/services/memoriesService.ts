/**
 * 回忆数据存储服务
 * 支持图片/视频上传到云存储
 */

import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import prisma from '../lib/prisma';

// 上传目录配置
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const MEMORIES_DIR = path.join(UPLOAD_DIR, 'memories');

// 确保上传目录存在
if (!fs.existsSync(MEMORIES_DIR)) {
  fs.mkdirSync(MEMORIES_DIR, { recursive: true });
}

/**
 * 支持的图片类型
 */
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/**
 * 支持的视频类型
 */
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

/**
 * 最大文件大小（50MB）
 */
const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * 回忆类型
 */
export type MemoryType = 'PHOTO' | 'VIDEO';

/**
 * 回忆创建数据
 */
export interface CreateMemoryData {
  petId: string;
  title: string;
  description?: string;
  type: MemoryType;
  location?: string;
  tags?: string[];
  isFavorite?: boolean;
}

/**
 * 回忆更新数据
 */
export interface UpdateMemoryData {
  title?: string;
  description?: string;
  location?: string;
  tags?: string[];
  isFavorite?: boolean;
}

/**
 * 文件上传结果
 */
export interface FileUploadResult {
  url: string;
  thumbnailUrl?: string;
  type: MemoryType;
}

/**
 * 回忆数据接口
 */
export interface Memory {
  id: string;
  petId: string;
  title: string;
  description?: string;
  type: MemoryType;
  mediaUrl: string;
  thumbnailUrl?: string;
  location?: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 回忆服务类
 */
export class MemoriesService {
  /**
   * 上传文件到本地存储
   * 生产环境应替换为云存储服务（如 AWS S3、阿里云 OSS 等）
   * @param file 上传的文件
   * @returns 文件上传结果
   */
  async uploadFile(file: Express.Multer.File): Promise<FileUploadResult> {
    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('文件大小超过限制（最大 50MB）');
    }

    // 检测文件类型
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.mimetype);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.mimetype);

    if (!isImage && !isVideo) {
      throw new Error('不支持的文件类型，仅支持图片和视频');
    }

    // 生成唯一文件名
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    const filepath = path.join(MEMORIES_DIR, filename);

    // 移动文件到目标目录
    await fs.promises.rename(file.path, filepath);

    // 生成访问 URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const url = `${baseUrl}/uploads/memories/${filename}`;

    let thumbnailUrl: string | undefined;

    // 如果是视频，生成缩略图（简化实现，实际需要使用 ffmpeg 等工具）
    if (isVideo) {
      // 生产环境应使用视频处理服务生成缩略图
      thumbnailUrl = undefined;
    }

    return {
      url,
      thumbnailUrl,
      type: isImage ? 'PHOTO' : 'VIDEO',
    };
  }

  /**
   * 删除文件
   * @param fileUrl 文件 URL
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // 从 URL 提取文件名
      const filename = path.basename(fileUrl);
      const filepath = path.join(MEMORIES_DIR, filename);

      // 检查文件是否存在并删除
      if (fs.existsSync(filepath)) {
        await fs.promises.unlink(filepath);
      }
    } catch (error) {
      console.error('删除文件失败:', error);
      // 不抛出错误，允许继续执行
    }
  }

  /**
   * 创建回忆
   * @param data 回忆数据
   * @param file 上传的文件
   * @returns 创建的回忆
   */
  async createMemory(
    data: CreateMemoryData,
    file: Express.Multer.File
  ): Promise<Memory> {
    // 上传文件
    const uploadResult = await this.uploadFile(file);

    // 创建回忆记录
    const memory = await prisma.memory.create({
      data: {
        petId: data.petId,
        title: data.title,
        description: data.description,
        type: uploadResult.type,
        mediaUrl: uploadResult.url,
        thumbnailUrl: uploadResult.thumbnailUrl,
        location: data.location,
        tags: JSON.stringify(data.tags || []),
        isFavorite: data.isFavorite || false,
      },
    });

    return this.parseMemory(memory);
  }

  /**
   * 解析回忆数据
   * @param memory 数据库回忆记录
   * @returns 解析后的回忆
   */
  private parseMemory(memory: any): Memory {
    return {
      ...memory,
      type: memory.type as MemoryType,
      tags: JSON.parse(memory.tags || '[]'),
    };
  }

  /**
   * 获取宠物的回忆列表
   * @param petId 宠物ID
   * @param options 查询选项
   * @returns 回忆列表
   */
  async getMemoriesByPetId(
    petId: string,
    options?: {
      type?: MemoryType;
      isFavorite?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ memories: Memory[]; total: number }> {
    const where: any = { petId };

    if (options?.type) {
      where.type = options.type;
    }

    if (options?.isFavorite !== undefined) {
      where.isFavorite = options.isFavorite;
    }

    const [memories, total] = await Promise.all([
      prisma.memory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 20,
        skip: options?.offset || 0,
      }),
      prisma.memory.count({ where }),
    ]);

    return {
      memories: memories.map((m: any) => this.parseMemory(m)),
      total,
    };
  }

  /**
   * 获取单个回忆详情
   * @param id 回忆ID
   * @returns 回忆详情
   */
  async getMemoryById(id: string): Promise<Memory | null> {
    const memory = await prisma.memory.findUnique({
      where: { id },
    });

    if (!memory) {
      return null;
    }

    return this.parseMemory(memory);
  }

  /**
   * 更新回忆
   * @param id 回忆ID
   * @param data 更新数据
   * @returns 更新后的回忆
   */
  async updateMemory(id: string, data: UpdateMemoryData): Promise<Memory> {
    const memory = await prisma.memory.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        location: data.location,
        tags: data.tags ? JSON.stringify(data.tags) : undefined,
        isFavorite: data.isFavorite,
      },
    });

    return this.parseMemory(memory);
  }

  /**
   * 删除回忆
   * @param id 回忆ID
   * @returns 是否成功
   */
  async deleteMemory(id: string): Promise<boolean> {
    // 获取回忆信息
    const memory = await prisma.memory.findUnique({
      where: { id },
    });

    if (!memory) {
      return false;
    }

    // 删除文件
    await this.deleteFile(memory.mediaUrl);
    if (memory.thumbnailUrl) {
      await this.deleteFile(memory.thumbnailUrl);
    }

    // 删除数据库记录
    await prisma.memory.delete({
      where: { id },
    });

    return true;
  }

  /**
   * 切换收藏状态
   * @param id 回忆ID
   * @returns 更新后的回忆
   */
  async toggleFavorite(id: string): Promise<Memory> {
    const memory = await prisma.memory.findUnique({
      where: { id },
    });

    if (!memory) {
      throw new Error('回忆不存在');
    }

    const updatedMemory = await prisma.memory.update({
      where: { id },
      data: { isFavorite: !memory.isFavorite },
    });

    return this.parseMemory(updatedMemory);
  }

  /**
   * 搜索回忆
   * @param petId 宠物ID
   * @param keyword 搜索关键词
   * @returns 匹配的回忆列表
   */
  async searchMemories(petId: string, keyword: string): Promise<Memory[]> {
    const memories = await prisma.memory.findMany({
      where: {
        petId,
        OR: [
          { title: { contains: keyword } },
          { description: { contains: keyword } },
          { location: { contains: keyword } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    // 过滤包含关键词的标签
    const allMemories = memories.map((m: any) => this.parseMemory(m));
    const filteredMemories = allMemories.filter((m) => 
      m.tags.some((tag: string) => tag.includes(keyword))
    );

    // 合并结果
    const result = [...memories.map((m: any) => this.parseMemory(m)), ...filteredMemories];
    
    // 去重
    const uniqueResult = result.filter((m, index) => 
      result.findIndex((r) => r.id === m.id) === index
    );

    return uniqueResult;
  }

  /**
   * 获取回忆统计
   * @param petId 宠物ID
   * @returns 统计数据
   */
  async getMemoryStats(petId: string): Promise<{
    total: number;
    photos: number;
    videos: number;
    favorites: number;
  }> {
    const [total, photos, videos, favorites] = await Promise.all([
      prisma.memory.count({ where: { petId } }),
      prisma.memory.count({ where: { petId, type: 'PHOTO' } }),
      prisma.memory.count({ where: { petId, type: 'VIDEO' } }),
      prisma.memory.count({ where: { petId, isFavorite: true } }),
    ]);

    return { total, photos, videos, favorites };
  }
}

// 导出单例实例
export const memoriesService = new MemoriesService();

export default MemoriesService;