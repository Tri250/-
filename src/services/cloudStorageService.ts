import type { UploadResult, CloudFile, StorageConfig, UploadProgress } from '../types/cloud';

const MOCK_DELAY = 800;

class CloudStorageService {
  private files: CloudFile[] = [];
  private config: StorageConfig = {
    provider: 'tencent-cos',
    region: 'ap-shanghai',
    bucket: 'pawsync-pro',
    maxFileSize: 50 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'],
    autoCompress: true,
    quality: 0.8,
    thumbnailSize: 400
  };
  private uploadCallbacks: Record<string, Array<(progress: UploadProgress) => void>> = {};

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    const mockFiles: CloudFile[] = [
      {
        id: 'file-1',
        name: '2026-05-26_14-30-00.jpg',
        type: 'image/jpeg',
        size: 245678,
        url: 'https://picsum.photos/seed/1/800/600',
        thumbnailUrl: 'https://picsum.photos/seed/1/200/150',
        uploadTime: new Date(Date.now() - 3600000).toISOString(),
        tags: ['daily', 'cat'],
        metadata: {
          petId: '1',
          cameraId: 'cam-1',
          location: '客厅',
          aiTags: ['cat', 'sitting', 'happy']
        }
      },
      {
        id: 'file-2',
        name: '2026-05-26_10-15-00.mp4',
        type: 'video/mp4',
        size: 15678900,
        url: 'https://example.com/video/2026-05-26_10-15-00.mp4',
        thumbnailUrl: 'https://picsum.photos/seed/2/200/150',
        uploadTime: new Date(Date.now() - 7200000).toISOString(),
        tags: ['video', 'play'],
        metadata: {
          petId: '1',
          cameraId: 'cam-1',
          duration: 30,
          aiTags: ['cat', 'playing', 'ball']
        }
      },
      {
        id: 'file-3',
        name: 'medical-record-2026-05-15.pdf',
        type: 'application/pdf',
        size: 1234567,
        url: 'https://example.com/documents/medical-record-2026-05-15.pdf',
        thumbnailUrl: null,
        uploadTime: new Date(Date.now() - 86400000).toISOString(),
        tags: ['document', 'medical'],
        metadata: {
          petId: '1',
          recordType: 'checkup',
          hospital: '宠物王国医院'
        }
      }
    ];
    this.files = mockFiles;
  }

  async initialize(): Promise<void> {
    await this.simulateDelay(MOCK_DELAY);
    console.log('Cloud storage service initialized');
  }

  async getConfig(): Promise<StorageConfig> {
    await this.simulateDelay(100);
    return { ...this.config };
  }

  async updateConfig(updates: Partial<StorageConfig>): Promise<StorageConfig> {
    await this.simulateDelay(200);
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
    await this.simulateDelay(MOCK_DELAY);

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

    const uploadId = `upload-${Date.now()}`;
    if (options.onProgress) {
      this.uploadCallbacks[uploadId] = [options.onProgress];
    }

    for (let i = 0; i <= 100; i += 10) {
      await this.simulateDelay(200);
      if (this.uploadCallbacks[uploadId]) {
        this.uploadCallbacks[uploadId].forEach(cb => cb({
          id: uploadId,
          progress: i,
          status: i === 100 ? 'completed' : 'uploading'
        }));
      }
    }

    const newFile: CloudFile = {
      id: `file-${Date.now()}`,
      name: file.name,
      type: file.type,
      size: file.size,
      url: `https://pawsync-cos.ap-shanghai.myqcloud.com/${Date.now()}-${file.name}`,
      thumbnailUrl: file.type.startsWith('image/') 
        ? `https://pawsync-cos.ap-shanghai.myqcloud.com/${Date.now()}-${file.name}-thumb` 
        : null,
      uploadTime: new Date().toISOString(),
      tags: options.tags || [],
      metadata: {
        petId: options.petId,
        cameraId: options.cameraId,
        ...options.metadata
      }
    };

    this.files.unshift(newFile);
    delete this.uploadCallbacks[uploadId];

    return {
      success: true,
      error: null,
      file: newFile
    };
  }

  async getFile(fileId: string): Promise<CloudFile | null> {
    await this.simulateDelay(200);
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
    await this.simulateDelay(300);

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
    await this.simulateDelay(300);
    const index = this.files.findIndex(f => f.id === fileId);
    if (index === -1) {
      return { success: false, error: '文件不存在' };
    }

    this.files.splice(index, 1);
    return { success: true };
  }

  async getFileUrl(fileId: string, options?: { thumbnail?: boolean }): Promise<string | null> {
    await this.simulateDelay(100);
    const file = this.files.find(f => f.id === fileId);
    if (!file) return null;

    return options?.thumbnail ? file.thumbnailUrl || file.url : file.url;
  }

  async generateUploadToken(): Promise<{
    token: string;
    expiresAt: string;
    policy: string;
  }> {
    await this.simulateDelay(MOCK_DELAY);
    return {
      token: `STS_TOKEN_${Date.now()}`,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      policy: 'eyJleHBpcmF0aW9uIjogMTcyMDAwMDAwMH0='
    };
  }

  async getStorageUsage(): Promise<{
    used: number;
    limit: number;
    percentage: number;
  }> {
    await this.simulateDelay(200);
    const used = this.files.reduce((sum, f) => sum + f.size, 0);
    const limit = 50 * 1024 * 1024 * 1024;
    return {
      used,
      limit,
      percentage: Math.round((used / limit) * 100)
    };
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const cloudStorageService = new CloudStorageService();