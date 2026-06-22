import { PawSyncFileStorage } from '../plugins';
import type { UploadResult, CloudFile, StorageConfig, UploadProgress } from '../types/cloud';

class CloudStorageService {
  private files: CloudFile[] = [];
  private config: StorageConfig = {
    provider: 'local',
    region: 'local',
    bucket: 'pawsync-pro',
    maxFileSize: 50 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'],
    autoCompress: true,
    quality: 0.8,
    thumbnailSize: 400
  };

  async initialize(): Promise<void> {
    console.log('Cloud storage service initialized');
  }

  async getConfig(): Promise<StorageConfig> {
    return { ...this.config };
  }

  async updateConfig(updates: Partial<StorageConfig>): Promise<StorageConfig> {
    this.config = { ...this.config, ...updates };
    return { ...this.config };
  }

  async uploadFile(
    file: File,
    options: {
      petId?: string;
      cameraId?: string;
      tags?: string[];
      metadata?: Record<string, unknown>;
      onProgress?: (progress: UploadProgress) => void;
    } = {}
  ): Promise<UploadResult> {
    if (!this.config.allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: `不支持的文件类型: ${file.type}`,
        file: null
      };
    }

    if (file.size > this.config.maxFileSize) {
      return {
        success: false,
        error: `文件大小超过限制（最大${this.config.maxFileSize / 1024 / 1024}MB）`,
        file: null
      };
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileName = `${Date.now()}-${file.name}`;

    try {
      const result = await PawSyncFileStorage.saveFile({
        data: Array.from(new Uint8Array(arrayBuffer)),
        fileName,
        folder: options.petId || 'documents',
      });

      if (!result.success) {
        return {
          success: false,
          error: '保存文件失败',
          file: null
        };
      }

      const newFile: CloudFile = {
        id: `file-${Date.now()}`,
        name: file.name,
        type: file.type,
        size: file.size,
        url: result.filePath ?? '',
        thumbnailUrl: file.type.startsWith('image/') ? result.filePath ?? null : null,
        uploadTime: new Date().toISOString(),
        tags: options.tags || [],
        metadata: {
          petId: options.petId,
          cameraId: options.cameraId,
          ...options.metadata
        }
      };

      this.files.unshift(newFile);

      return {
        success: true,
        error: null,
        file: newFile
      };
    } catch (error) {
      return {
        success: false,
        error: `上传失败: ${error}`,
        file: null
      };
    }
  }

  async saveImage(imageData: Uint8Array, options: { petId?: string; cameraId?: string; tags?: string[] } = {}): Promise<UploadResult> {
    try {
      const result = await PawSyncFileStorage.saveImage({
        data: Array.from(imageData),
        fileName: `image-${Date.now()}.jpg`,
      });

      if (!result.success) {
        return {
          success: false,
          error: '保存图片失败',
          file: null
        };
      }

      const newFile: CloudFile = {
        id: `file-${Date.now()}`,
        name: `image-${Date.now()}.jpg`,
        type: 'image/jpeg',
        size: imageData.length,
        url: result.filePath ?? '',
        thumbnailUrl: result.filePath ?? null,
        uploadTime: new Date().toISOString(),
        tags: options.tags || ['photo'],
        metadata: {
          petId: options.petId,
          cameraId: options.cameraId,
        }
      };

      this.files.unshift(newFile);

      return {
        success: true,
        error: null,
        file: newFile
      };
    } catch (error) {
      return {
        success: false,
        error: `保存图片失败: ${error}`,
        file: null
      };
    }
  }

  async getFile(fileId: string): Promise<CloudFile | null> {
    return this.files.find(f => f.id === fileId) || null;
  }

  async getFiles(
    options: {
      petId?: string;
      type?: string;
      tags?: string[];
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<CloudFile[]> {
    let filtered = [...this.files];

    if (options.petId) {
      filtered = filtered.filter(f => f.metadata?.petId === options.petId);
    }

    if (options.type) {
      filtered = filtered.filter(f => f.type === options.type);
    }

    if (options.tags && options.tags.length > 0) {
      filtered = filtered.filter(f => 
        options.tags!.some(tag => f.tags.includes(tag))
      );
    }

    if (options.offset) {
      filtered = filtered.slice(options.offset);
    }

    if (options.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  async deleteFile(fileId: string): Promise<{ success: boolean; error?: string }> {
    const file = this.files.find(f => f.id === fileId);
    if (!file) {
      return { success: false, error: '文件不存在' };
    }

    try {
      const result = await PawSyncFileStorage.deleteFile({ filePath: file.url });
      if (result.success) {
        const index = this.files.findIndex(f => f.id === fileId);
        if (index !== -1) {
          this.files.splice(index, 1);
        }
        return { success: true };
      }
    } catch (error) {
      console.warn('Failed to delete file from storage:', error);
    }

    const index = this.files.findIndex(f => f.id === fileId);
    if (index !== -1) {
      this.files.splice(index, 1);
    }

    return { success: true };
  }

  async getFileUrl(fileId: string, options?: { thumbnail?: boolean }): Promise<string | null> {
    const file = this.files.find(f => f.id === fileId);
    if (!file) return null;

    return options?.thumbnail ? file.thumbnailUrl || file.url : file.url;
  }

  async getStorageUsage(): Promise<{
    used: number;
    limit: number;
    percentage: number;
  }> {
    try {
      const result = await PawSyncFileStorage.getStorageUsage();
      const limit = 50 * 1024 * 1024 * 1024;
      return {
        used: result.used ?? 0,
        limit,
        percentage: Math.round(((result.used ?? 0) / limit) * 100)
      };
    } catch {
      const used = this.files.reduce((sum, f) => sum + f.size, 0);
      const limit = 50 * 1024 * 1024 * 1024;
      return {
        used,
        limit,
        percentage: Math.round((used / limit) * 100)
      };
    }
  }

  async checkStoragePermission(): Promise<boolean> {
    try {
      const result = await PawSyncFileStorage.checkStoragePermission();
      return result.granted ?? false;
    } catch {
      return false;
    }
  }
}

export const cloudStorageService = new CloudStorageService();