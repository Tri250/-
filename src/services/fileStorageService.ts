// ============================================
// PawSync Pro - 文件存储服务
// 使用 IndexedDB 存储图片/音频/视频文件
// ============================================

export type FileType = 'image' | 'audio' | 'video' | 'document' | 'other';

export interface StoredFile {
  id: string;
  name: string;
  type: FileType;
  mimeType: string;
  size: number;
  data: ArrayBuffer;
  thumbnail?: ArrayBuffer; // 缩略图（用于图片/视频）
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, unknown>;
  tags?: string[];
  category?: string;
}

export interface FileMetadata {
  id: string;
  name: string;
  type: FileType;
  mimeType: string;
  size: number;
  hasThumbnail: boolean;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
  category?: string;
}

export interface FileFilter {
  type?: FileType;
  category?: string;
  tags?: string[];
  startDate?: number;
  endDate?: number;
  searchQuery?: string;
}

export interface StorageStats {
  totalFiles: number;
  totalSize: number;
  byType: Record<FileType, { count: number; size: number }>;
}

export interface FileUploadOptions {
  category?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  generateThumbnail?: boolean;
}

const DB_NAME = 'pawsync-file-storage';
const DB_VERSION = 1;
const STORE_NAME = 'files';

class FileStorageService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  // ==================== 初始化 ====================

  /**
   * 初始化 IndexedDB 数据库
   */
  async initialize(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.doInitialize();
    return this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error(`Failed to open database: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          
          // 创建索引
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('tags', 'tags', { unique: false, multiEntry: true });
          store.createIndex('name', 'name', { unique: false });
        }
      };
    });
  }

  /**
   * 确保数据库已初始化
   */
  private async ensureInitialized(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initialize();
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  // ==================== 文件存储 ====================

  /**
   * 保存文件
   */
  async saveFile(
    file: File | Blob,
    name: string,
    options: FileUploadOptions = {}
  ): Promise<FileMetadata> {
    const db = await this.ensureInitialized();

    // 读取文件数据
    const arrayBuffer = await file.arrayBuffer();

    // 确定文件类型
    const fileType = this.detectFileType(file.type, name);

    // 生成缩略图（图片/视频）
    let thumbnail: ArrayBuffer | undefined;
    if (options.generateThumbnail !== false && (fileType === 'image' || fileType === 'video')) {
      thumbnail = await this.generateThumbnail(file, fileType);
    }

    const storedFile: StoredFile = {
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      type: fileType,
      mimeType: file.type || 'application/octet-stream',
      size: arrayBuffer.byteLength,
      data: arrayBuffer,
      thumbnail,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: options.metadata,
      tags: options.tags,
      category: options.category,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(storedFile);

      request.onsuccess = () => {
        resolve(this.toMetadata(storedFile));
      };

      request.onerror = () => {
        reject(new Error(`Failed to save file: ${request.error?.message}`));
      };
    });
  }

  /**
   * 从 URL 保存文件
   */
  async saveFileFromUrl(
    url: string,
    name: string,
    options: FileUploadOptions = {}
  ): Promise<FileMetadata> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const blob = await response.blob();
    return this.saveFile(blob, name, options);
  }

  /**
   * 保存 Base64 编码的文件
   */
  async saveBase64File(
    base64Data: string,
    name: string,
    mimeType: string,
    options: FileUploadOptions = {}
  ): Promise<FileMetadata> {
    // 移除 data URL 前缀
    const base64Content = base64Data.replace(/^data:[^;]+;base64,/, '');
    
    // 解码 base64
    const byteCharacters = atob(base64Content);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    
    return this.saveFile(blob, name, options);
  }

  /**
   * 保存图片（专门用于图片处理）
   */
  async saveImage(
    imageSource: File | Blob | HTMLCanvasElement | HTMLImageElement,
    name: string,
    options: FileUploadOptions & { quality?: number; maxWidth?: number; maxHeight?: number } = {}
  ): Promise<FileMetadata> {
    let blob: Blob;

    if (imageSource instanceof HTMLCanvasElement) {
      // 从 Canvas 获取 Blob
      blob = await new Promise((resolve, reject) => {
        imageSource.toBlob(
          (b) => b ? resolve(b) : reject(new Error('Canvas to Blob failed')),
          'image/jpeg',
          options.quality || 0.9
        );
      });
    } else if (imageSource instanceof HTMLImageElement) {
      // 从 Image 元素创建 Canvas 然后获取 Blob
      const canvas = document.createElement('canvas');
      canvas.width = imageSource.naturalWidth;
      canvas.height = imageSource.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');
      ctx.drawImage(imageSource, 0, 0);
      
      blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => b ? resolve(b) : reject(new Error('Canvas to Blob failed')),
          'image/jpeg',
          options.quality || 0.9
        );
      });
    } else {
      blob = imageSource;
    }

    // 如果需要调整大小
    if (options.maxWidth || options.maxHeight) {
      blob = await this.resizeImage(blob, options.maxWidth, options.maxHeight, options.quality);
    }

    return this.saveFile(blob, name, { ...options, category: options.category || 'images' });
  }

  /**
   * 保存音频文件
   */
  async saveAudio(
    audioSource: File | Blob | ArrayBuffer,
    name: string,
    options: FileUploadOptions & { duration?: number; waveform?: number[] } = {}
  ): Promise<FileMetadata> {
    let blob: Blob;

    if (audioSource instanceof ArrayBuffer) {
      blob = new Blob([audioSource], { type: 'audio/webm' });
    } else {
      blob = audioSource;
    }

    const metadata = {
      ...options.metadata,
      duration: options.duration,
      waveform: options.waveform,
    };

    return this.saveFile(blob, name, {
      ...options,
      category: options.category || 'audio',
      metadata,
    });
  }

  /**
   * 保存视频文件
   */
  async saveVideo(
    videoSource: File | Blob,
    name: string,
    options: FileUploadOptions & { duration?: number; thumbnailTime?: number } = {}
  ): Promise<FileMetadata> {
    const metadata = {
      ...options.metadata,
      duration: options.duration,
    };

    return this.saveFile(videoSource, name, {
      ...options,
      category: options.category || 'videos',
      metadata,
      generateThumbnail: true,
    });
  }

  // ==================== 文件读取 ====================

  /**
   * 获取完整文件数据
   */
  async getFile(id: string): Promise<StoredFile | null> {
    const db = await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get file: ${request.error?.message}`));
      };
    });
  }

  /**
   * 获取文件元数据（不包含二进制数据）
   */
  async getFileMetadata(id: string): Promise<FileMetadata | null> {
    const file = await this.getFile(id);
    return file ? this.toMetadata(file) : null;
  }

  /**
   * 获取文件为 Blob URL
   */
  async getFileAsUrl(id: string): Promise<string | null> {
    const file = await this.getFile(id);
    if (!file) return null;

    const blob = new Blob([file.data], { type: file.mimeType });
    return URL.createObjectURL(blob);
  }

  /**
   * 获取文件为 Base64
   */
  async getFileAsBase64(id: string): Promise<{ base64: string; mimeType: string } | null> {
    const file = await this.getFile(id);
    if (!file) return null;

    const base64 = this.arrayBufferToBase64(file.data);
    return {
      base64: `data:${file.mimeType};base64,${base64}`,
      mimeType: file.mimeType,
    };
  }

  /**
   * 获取缩略图 URL
   */
  async getThumbnailUrl(id: string): Promise<string | null> {
    const file = await this.getFile(id);
    if (!file?.thumbnail) return null;

    const blob = new Blob([file.thumbnail], { type: 'image/jpeg' });
    return URL.createObjectURL(blob);
  }

  // ==================== 文件查询 ====================

  /**
   * 获取所有文件元数据
   */
  async getAllFiles(filter?: FileFilter): Promise<FileMetadata[]> {
    const db = await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        let files: StoredFile[] = request.result;

        // 应用过滤器
        if (filter) {
          files = files.filter(file => this.matchesFilter(file, filter));
        }

        // 按创建时间排序（最新的在前）
        files.sort((a, b) => b.createdAt - a.createdAt);

        resolve(files.map(f => this.toMetadata(f)));
      };

      request.onerror = () => {
        reject(new Error(`Failed to get files: ${request.error?.message}`));
      };
    });
  }

  /**
   * 按类型获取文件
   */
  async getFilesByType(type: FileType): Promise<FileMetadata[]> {
    return this.getAllFiles({ type });
  }

  /**
   * 按分类获取文件
   */
  async getFilesByCategory(category: string): Promise<FileMetadata[]> {
    return this.getAllFiles({ category });
  }

  /**
   * 按标签获取文件
   */
  async getFilesByTags(tags: string[]): Promise<FileMetadata[]> {
    return this.getAllFiles({ tags });
  }

  /**
   * 搜索文件
   */
  async searchFiles(query: string): Promise<FileMetadata[]> {
    return this.getAllFiles({ searchQuery: query });
  }

  /**
   * 获取最近的文件
   */
  async getRecentFiles(limit: number = 10): Promise<FileMetadata[]> {
    const files = await this.getAllFiles();
    return files.slice(0, limit);
  }

  // ==================== 文件更新 ====================

  /**
   * 更新文件元数据
   */
  async updateFileMetadata(
    id: string,
    updates: Partial<Pick<StoredFile, 'name' | 'category' | 'tags' | 'metadata'>>
  ): Promise<FileMetadata | null> {
    const db = await this.ensureInitialized();

    const file = await this.getFile(id);
    if (!file) return null;

    const updatedFile: StoredFile = {
      ...file,
      ...updates,
      updatedAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(updatedFile);

      request.onsuccess = () => {
        resolve(this.toMetadata(updatedFile));
      };

      request.onerror = () => {
        reject(new Error(`Failed to update file: ${request.error?.message}`));
      };
    });
  }

  /**
   * 重命名文件
   */
  async renameFile(id: string, newName: string): Promise<FileMetadata | null> {
    return this.updateFileMetadata(id, { name: newName });
  }

  /**
   * 添加标签
   */
  async addTags(id: string, tags: string[]): Promise<FileMetadata | null> {
    const file = await this.getFile(id);
    if (!file) return null;

    const existingTags = new Set(file.tags || []);
    tags.forEach(tag => existingTags.add(tag));

    return this.updateFileMetadata(id, { tags: Array.from(existingTags) });
  }

  /**
   * 移除标签
   */
  async removeTags(id: string, tags: string[]): Promise<FileMetadata | null> {
    const file = await this.getFile(id);
    if (!file) return null;

    const existingTags = new Set(file.tags || []);
    tags.forEach(tag => existingTags.delete(tag));

    return this.updateFileMetadata(id, { tags: Array.from(existingTags) });
  }

  // ==================== 文件删除 ====================

  /**
   * 删除文件
   */
  async deleteFile(id: string): Promise<boolean> {
    const db = await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(new Error(`Failed to delete file: ${request.error?.message}`));
      };
    });
  }

  /**
   * 批量删除文件
   */
  async deleteFiles(ids: string[]): Promise<void> {
    await Promise.all(ids.map(id => this.deleteFile(id)));
  }

  /**
   * 清空所有文件
   */
  async clearAllFiles(): Promise<void> {
    const db = await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to clear files: ${request.error?.message}`));
      };
    });
  }

  // ==================== 存储统计 ====================

  /**
   * 获取存储统计
   */
  async getStorageStats(): Promise<StorageStats> {
    const files = await this.getAllFiles();

    const stats: StorageStats = {
      totalFiles: files.length,
      totalSize: 0,
      byType: {
        image: { count: 0, size: 0 },
        audio: { count: 0, size: 0 },
        video: { count: 0, size: 0 },
        document: { count: 0, size: 0 },
        other: { count: 0, size: 0 },
      },
    };

    for (const file of files) {
      stats.totalSize += file.size;
      stats.byType[file.type].count++;
      stats.byType[file.type].size += file.size;
    }

    return stats;
  }

  /**
   * 获取存储使用情况（近似值）
   */
  async getStorageUsage(): Promise<{ used: number; total: number; percentage: number }> {
    const stats = await this.getStorageStats();
    
    // IndexedDB 没有直接的存储限制 API，这里返回估算值
    // 大多数浏览器限制为可用磁盘空间的 50% 或 2GB
    const estimatedTotal = 2 * 1024 * 1024 * 1024; // 2GB
    
    return {
      used: stats.totalSize,
      total: estimatedTotal,
      percentage: (stats.totalSize / estimatedTotal) * 100,
    };
  }

  // ==================== 导出/导入 ====================

  /**
   * 导出文件为下载
   */
  async downloadFile(id: string, customName?: string): Promise<void> {
    const file = await this.getFile(id);
    if (!file) throw new Error('File not found');

    const blob = new Blob([file.data], { type: file.mimeType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = customName || file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }

  /**
   * 导出多个文件为 ZIP（需要 JSZip 库）
   */
  async exportFilesAsZip(_fileIds: string[], _zipName: string): Promise<Blob> {
    // 注意：这需要 JSZip 库
    // 这里提供一个基本的实现框架
    throw new Error('ZIP export requires JSZip library. Please install jszip.');
  }

  // ==================== 工具方法 ====================

  /**
   * 检测文件类型
   */
  private detectFileType(mimeType: string, fileName: string): FileType {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('video/')) return 'video';
    
    const docExtensions = ['.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx', '.ppt', '.pptx'];
    const ext = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
    if (docExtensions.includes(ext)) return 'document';

    return 'other';
  }

  /**
   * 生成缩略图
   */
  private async generateThumbnail(file: Blob, type: FileType): Promise<ArrayBuffer | undefined> {
    if (type === 'image') {
      return this.generateImageThumbnail(file);
    } else if (type === 'video') {
      return this.generateVideoThumbnail(file);
    }
    return undefined;
  }

  /**
   * 生成图片缩略图
   */
  private async generateImageThumbnail(file: Blob): Promise<ArrayBuffer | undefined> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          resolve(undefined);
          return;
        }

        // 缩略图尺寸
        const maxSize = 200;
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          async (blob) => {
            URL.revokeObjectURL(url);
            if (blob) {
              const arrayBuffer = await blob.arrayBuffer();
              resolve(arrayBuffer);
            } else {
              resolve(undefined);
            }
          },
          'image/jpeg',
          0.7
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(undefined);
      };

      img.src = url;
    });
  }

  /**
   * 生成视频缩略图
   */
  private async generateVideoThumbnail(file: Blob): Promise<ArrayBuffer | undefined> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);

      video.onloadeddata = () => {
        video.currentTime = 1; // 1 秒处的帧
      };

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          resolve(undefined);
          return;
        }

        canvas.width = 200;
        canvas.height = (video.videoHeight / video.videoWidth) * 200;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          async (blob) => {
            URL.revokeObjectURL(url);
            if (blob) {
              const arrayBuffer = await blob.arrayBuffer();
              resolve(arrayBuffer);
            } else {
              resolve(undefined);
            }
          },
          'image/jpeg',
          0.7
        );
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(undefined);
      };

      video.src = url;
      video.load();
    });
  }

  /**
   * 调整图片大小
   */
  private async resizeImage(
    blob: Blob,
    maxWidth?: number,
    maxHeight?: number,
    quality?: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        let { width, height } = img;

        if (maxWidth && width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }

        if (maxHeight && height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (b) => {
            URL.revokeObjectURL(url);
            if (b) {
              resolve(b);
            } else {
              reject(new Error('Canvas to Blob failed'));
            }
          },
          'image/jpeg',
          quality || 0.9
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }

  /**
   * 将 StoredFile 转换为 FileMetadata
   */
  private toMetadata(file: StoredFile): FileMetadata {
    return {
      id: file.id,
      name: file.name,
      type: file.type,
      mimeType: file.mimeType,
      size: file.size,
      hasThumbnail: !!file.thumbnail,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      tags: file.tags,
      category: file.category,
    };
  }

  /**
   * 检查文件是否匹配过滤器
   */
  private matchesFilter(file: StoredFile, filter: FileFilter): boolean {
    if (filter.type && file.type !== filter.type) return false;
    if (filter.category && file.category !== filter.category) return false;
    if (filter.tags && filter.tags.length > 0) {
      const fileTags = new Set(file.tags || []);
      if (!filter.tags.some(tag => fileTags.has(tag))) return false;
    }
    if (filter.startDate && file.createdAt < filter.startDate) return false;
    if (filter.endDate && file.createdAt > filter.endDate) return false;
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      const searchable = `${file.name} ${file.category || ''} ${(file.tags || []).join(' ')}`.toLowerCase();
      if (!searchable.includes(query)) return false;
    }
    return true;
  }

  /**
   * ArrayBuffer 转 Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // ==================== 清理 ====================

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.close();
  }
}

export const fileStorageService = new FileStorageService();
