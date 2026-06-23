import type { UploadResult, CloudFile, StorageConfig, UploadProgress } from '../types/cloud';
import { databaseService, STORES } from './databaseService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.pawsync.com/v1';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB 分片

interface STSCredentials {
  accessKeyId: string;
  accessKeySecret: string;
  securityToken: string;
  expiration: string;
  endpoint: string;
  bucket: string;
  region: string;
  prefix: string;
}

interface OfflineQueueItem {
  id?: number;
  type: 'upload';
  data: {
    fileDataUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    options: {
      petId?: string;
      cameraId?: string;
      tags?: string[];
      metadata?: Record<string, unknown>;
    };
  };
  createdAt: string;
  retryCount: number;
}

class CloudStorageService {
  private config: StorageConfig = {
    provider: 'tencent-cos',
    region: 'ap-shanghai',
    bucket: 'pawsync-pro',
    maxFileSize: 50 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'],
    autoCompress: true,
    quality: 0.8,
    thumbnailSize: 400,
  };

  private uploadCallbacks: Record<string, Array<(progress: UploadProgress) => void>> = {};
  private offlineProcessing = false;

  async initialize(): Promise<void> {
    await databaseService.getDB();
    this.processOfflineQueue();
  }

  async getConfig(): Promise<StorageConfig> {
    return { ...this.config };
  }

  async updateConfig(updates: Partial<StorageConfig>): Promise<StorageConfig> {
    this.config = { ...this.config, ...updates };
    return { ...this.config };
  }

  // ==================== 文件上传 ====================

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
        file: undefined,
      };
    }

    if (file.size > this.config.maxFileSize) {
      return {
        success: false,
        error: `文件大小超过限制（最大${this.config.maxFileSize / 1024 / 1024}MB）`,
        file: undefined,
      };
    }

    const uploadId = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    if (options.onProgress) {
      this.uploadCallbacks[uploadId] = [options.onProgress];
    }

    try {
      // 图片压缩
      let processedFile = file;
      let thumbnailBlob: Blob | null = null;

      if (this.config.autoCompress && file.type.startsWith('image/')) {
        const compressed = await this.compressImage(file, this.config.quality);
        processedFile = compressed;
        thumbnailBlob = await this.generateThumbnail(file, this.config.thumbnailSize);
      } else if (file.type.startsWith('image/')) {
        thumbnailBlob = await this.generateThumbnail(file, this.config.thumbnailSize);
      }

      // 获取 STS 临时凭证
      const stsCredentials = await this.fetchSTSToken();

      // 执行上传
      const objectKey = `${stsCredentials.prefix}${Date.now()}-${file.name}`;
      await this.uploadToObjectStorage(processedFile, objectKey, stsCredentials, uploadId);

      // 上传缩略图
      let thumbnailKey: string | null = null;
      if (thumbnailBlob) {
        thumbnailKey = `${stsCredentials.prefix}thumbnails/${Date.now()}-${file.name}-thumb`;
        await this.uploadBlobToObjectStorage(thumbnailBlob, thumbnailKey, stsCredentials, file.type);
      }

      // 通知后端确认上传
      const confirmResult = await this.confirmUpload({
        objectKey,
        thumbnailKey,
        fileName: file.name,
        fileType: file.type,
        fileSize: processedFile.size,
        originalSize: file.size,
        petId: options.petId,
        cameraId: options.cameraId,
        tags: options.tags,
        metadata: options.metadata,
      });

      // 保存文件元数据到 IndexedDB
      const cloudFile: CloudFile = {
        id: confirmResult.fileId || `file-${Date.now()}`,
        name: file.name,
        type: file.type,
        size: processedFile.size,
        url: `${stsCredentials.endpoint}/${stsCredentials.bucket}/${objectKey}`,
        thumbnailUrl: thumbnailKey
          ? `${stsCredentials.endpoint}/${stsCredentials.bucket}/${thumbnailKey}`
          : undefined,
        uploadTime: new Date().toISOString(),
        tags: options.tags || [],
        metadata: {
          petId: options.petId,
          cameraId: options.cameraId,
          originalSize: file.size,
          ...options.metadata,
        },
      };

      await databaseService.put(STORES.FILES, cloudFile);

      this.notifyProgress(uploadId, {
        id: uploadId,
        progress: 100,
        status: 'completed',
      });

      return {
        success: true,
        error: undefined,
        file: cloudFile,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : '上传失败';

      this.notifyProgress(uploadId, {
        id: uploadId,
        progress: 0,
        status: 'failed',
        error: message,
      });

      // 存入离线队列
      await this.enqueueOfflineUpload(file, options);

      return {
        success: false,
        error: message,
        file: undefined,
      };
    } finally {
      delete this.uploadCallbacks[uploadId];
    }
  }

  // ==================== STS 凭证 ====================

  async generateUploadToken(): Promise<{
    token: string;
    expiresAt: string;
    policy: string;
  }> {
    const response = await this.apiRequest('GET', '/storage/sts-token');
    const data = await response.json();
    return {
      token: data.credentials.securityToken,
      expiresAt: data.credentials.expiration,
      policy: data.policy || '',
    };
  }

  private async fetchSTSToken(): Promise<STSCredentials> {
    const response = await this.apiRequest('GET', '/storage/sts-token');
    const data = await response.json();
    return {
      accessKeyId: data.credentials.accessKeyId,
      accessKeySecret: data.credentials.accessKeySecret,
      securityToken: data.credentials.securityToken,
      expiration: data.credentials.expiration,
      endpoint: data.endpoint,
      bucket: data.bucket,
      region: data.region,
      prefix: data.prefix || '',
    };
  }

  // ==================== 对象存储上传 ====================

  private async uploadToObjectStorage(
    file: File | Blob,
    objectKey: string,
    credentials: STSCredentials,
    uploadId: string
  ): Promise<void> {
    if (file.size <= CHUNK_SIZE) {
      // 小文件直接上传
      await this.uploadSingleChunk(file, objectKey, credentials, uploadId);
    } else {
      // 大文件分片上传
      await this.uploadMultipart(file, objectKey, credentials, uploadId);
    }
  }

  private uploadSingleChunk(
    file: File | Blob,
    objectKey: string,
    credentials: STSCredentials,
    uploadId: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = `${credentials.endpoint}/${credentials.bucket}/${objectKey}`;

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          this.notifyProgress(uploadId, {
            id: uploadId,
            progress,
            status: 'uploading',
          });
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`上传失败: HTTP ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('网络错误，上传失败'));
      xhr.ontimeout = () => reject(new Error('上传超时'));

      xhr.open('PUT', url);
      xhr.setRequestHeader('Authorization', this.generateCOSAuth('PUT', objectKey, credentials));
      xhr.setRequestHeader('x-cos-security-token', credentials.securityToken);
      xhr.setRequestHeader('Content-Type', 'application/octet-stream');
      xhr.timeout = 300000; // 5 分钟超时

      file.arrayBuffer().then((buffer) => {
        xhr.send(buffer);
      }).catch(reject);
    });
  }

  private async uploadMultipart(
    file: File | Blob,
    objectKey: string,
    credentials: STSCredentials,
    uploadId: string
  ): Promise<void> {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    // 初始化分片上传
    const initUrl = `${credentials.endpoint}/${credentials.bucket}/${objectKey}?uploads`;
    const initResponse = await fetch(initUrl, {
      method: 'POST',
      headers: {
        Authorization: this.generateCOSAuth('POST', `${objectKey}?uploads`, credentials),
        'x-cos-security-token': credentials.securityToken,
      },
    });

    if (!initResponse.ok) {
      throw new Error(`分片上传初始化失败: HTTP ${initResponse.status}`);
    }

    const initXml = await initResponse.text();
    const uploadIdMatch = initXml.match(/<UploadId>([^<]+)<\/UploadId>/);
    const cosUploadId = uploadIdMatch ? uploadIdMatch[1] : '';
    if (!cosUploadId) {
      throw new Error('无法获取分片上传 ID');
    }

    // 逐片上传
    const etags: string[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const chunkUrl = `${credentials.endpoint}/${credentials.bucket}/${objectKey}?partNumber=${i + 1}&uploadId=${cosUploadId}`;

      const chunkResponse = await fetch(chunkUrl, {
        method: 'PUT',
        headers: {
          Authorization: this.generateCOSAuth('PUT', `${objectKey}?partNumber=${i + 1}&uploadId=${cosUploadId}`, credentials),
          'x-cos-security-token': credentials.securityToken,
          'Content-Type': 'application/octet-stream',
        },
        body: chunk,
      });

      if (!chunkResponse.ok) {
        throw new Error(`分片 ${i + 1}/${totalChunks} 上传失败: HTTP ${chunkResponse.status}`);
      }

      const etag = chunkResponse.headers.get('ETag') || '';
      etags.push(etag);

      // 更新进度
      const progress = Math.round(((i + 1) / totalChunks) * 100);
      this.notifyProgress(uploadId, {
        id: uploadId,
        progress,
        status: 'uploading',
      });
    }

    // 完成分片上传
    const completeUrl = `${credentials.endpoint}/${credentials.bucket}/${objectKey}?uploadId=${cosUploadId}`;
    const partsXml = etags.map((etag, i) => `<Part><PartNumber>${i + 1}</PartNumber><ETag>${etag}</ETag></Part>`).join('');
    const body = `<CompleteMultipartUpload>${partsXml}</CompleteMultipartUpload>`;

    const completeResponse = await fetch(completeUrl, {
      method: 'POST',
      headers: {
        Authorization: this.generateCOSAuth('POST', `${objectKey}?uploadId=${cosUploadId}`, credentials),
        'x-cos-security-token': credentials.securityToken,
        'Content-Type': 'application/xml',
      },
      body,
    });

    if (!completeResponse.ok) {
      throw new Error(`分片上传完成失败: HTTP ${completeResponse.status}`);
    }
  }

  private async uploadBlobToObjectStorage(
    blob: Blob,
    objectKey: string,
    credentials: STSCredentials,
    contentType: string,
  ): Promise<void> {
    const url = `${credentials.endpoint}/${credentials.bucket}/${objectKey}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: this.generateCOSAuth('PUT', objectKey, credentials),
        'x-cos-security-token': credentials.securityToken,
        'Content-Type': contentType || 'application/octet-stream',
      },
      body: blob,
    });

    if (!response.ok) {
      throw new Error(`缩略图上传失败: HTTP ${response.status}`);
    }
  }

  // ==================== 后端确认 ====================

  private async confirmUpload(params: {
    objectKey: string;
    thumbnailKey: string | null;
    fileName: string;
    fileType: string;
    fileSize: number;
    originalSize: number;
    petId?: string;
    cameraId?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
  }): Promise<{ fileId: string }> {
    const response = await this.apiRequest('POST', '/storage/confirm-upload', params);
    const data = await response.json();
    return { fileId: data.fileId };
  }

  // ==================== 文件读取 ====================

  async getFile(fileId: string): Promise<CloudFile | null> {
    const file = await databaseService.get<CloudFile>(STORES.FILES, fileId);
    return file ?? null;
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
    let files = await databaseService.getAll<CloudFile>(STORES.FILES);

    if (options.petId) {
      files = files.filter(f => f.metadata?.petId === options.petId);
    }

    if (options.type) {
      files = files.filter(f => f.type === options.type);
    }

    if (options.tags && options.tags.length > 0) {
      files = files.filter(f =>
        options.tags!.some(tag => f.tags.includes(tag))
      );
    }

    // 按上传时间倒序
    files.sort((a, b) => new Date(b.uploadTime).getTime() - new Date(a.uploadTime).getTime());

    if (options.offset) {
      files = files.slice(options.offset);
    }

    if (options.limit) {
      files = files.slice(0, options.limit);
    }

    return files;
  }

  // ==================== 文件删除 ====================

  async deleteFile(fileId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.apiRequest('DELETE', `/storage/files/${fileId}`);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        return { success: false, error: data.message || `删除失败: HTTP ${response.status}` };
      }

      await databaseService.delete(STORES.FILES, fileId);
      return { success: true };
    } catch (error) {
      // 网络失败时仍删除本地记录，标记为待同步
      await databaseService.delete(STORES.FILES, fileId);
      return {
        success: true,
        error: '本地已删除，云端删除将在网络恢复后同步',
      };
    }
  }

  // ==================== 文件 URL ====================

  async getFileUrl(fileId: string, options?: { thumbnail?: boolean }): Promise<string | null> {
    const file = await databaseService.get<CloudFile>(STORES.FILES, fileId);
    if (!file) return null;

    const targetUrl = options?.thumbnail ? (file.thumbnailUrl || file.url) : file.url;

    try {
      // 请求带签名的临时访问 URL
      const response = await this.apiRequest('POST', '/storage/signed-url', {
        fileId,
        thumbnail: options?.thumbnail || false,
      });
      const data = await response.json();
      return data.signedUrl || targetUrl;
    } catch {
      // 回退到原始 URL
      return targetUrl;
    }
  }

  // ==================== 存储用量 ====================

  async getStorageUsage(): Promise<{
    used: number;
    limit: number;
    percentage: number;
  }> {
    try {
      const response = await this.apiRequest('GET', '/storage/usage');
      return await response.json();
    } catch {
      // 离线时从本地计算
      const files = await databaseService.getAll<CloudFile>(STORES.FILES);
      const used = files.reduce((sum, f) => sum + f.size, 0);
      const limit = 50 * 1024 * 1024 * 1024;
      return {
        used,
        limit,
        percentage: Math.round((used / limit) * 100),
      };
    }
  }

  // ==================== 图片压缩 ====================

  private async compressImage(file: File, quality: number): Promise<File> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        // 保持纵横比，限制最大尺寸为 4096
        const MAX_DIMENSION = 4096;
        let { width, height } = img;

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: file.type }));
            } else {
              resolve(file);
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };

      img.src = url;
    });
  }

  // ==================== 缩略图生成 ====================

  private async generateThumbnail(file: File, thumbnailSize: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        // 保持纵横比
        const ratio = Math.min(thumbnailSize / img.width, thumbnailSize / img.height);
        const width = Math.round(img.width * ratio);
        const height = Math.round(img.height * ratio);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('缩略图生成失败'));
            }
          },
          'image/jpeg',
          0.7
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('图片加载失败，无法生成缩略图'));
      };

      img.src = url;
    });
  }

  // ==================== 离线队列 ====================

  private async enqueueOfflineUpload(
    file: File,
    options: {
      petId?: string;
      cameraId?: string;
      tags?: string[];
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    try {
      const fileDataUrl = await this.fileToDataUrl(file);
      const item: OfflineQueueItem = {
        type: 'upload',
        data: {
          fileDataUrl,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          options,
        },
        createdAt: new Date().toISOString(),
        retryCount: 0,
      };
      await databaseService.put(STORES.OFFLINE_QUEUE, item);
    } catch {
      // 离线队列入队失败不影响主流程
    }
  }

  private async processOfflineQueue(): Promise<void> {
    if (this.offlineProcessing) return;
    this.offlineProcessing = true;

    try {
      const items = await databaseService.getAll<OfflineQueueItem>(STORES.OFFLINE_QUEUE);

      for (const item of items) {
        if (!navigator.onLine) break;

        try {
          if (item.type === 'upload') {
            const file = await this.dataUrlToFile(
              item.data.fileDataUrl,
              item.data.fileName,
              item.data.fileType
            );
            const result = await this.uploadFile(file, item.data.options);
            if (result.success && item.id) {
              await databaseService.delete(STORES.OFFLINE_QUEUE, item.id);
            }
          }
        } catch {
          // 单个离线任务失败不阻塞后续
          if (item.id) {
            item.retryCount += 1;
            if (item.retryCount >= 5) {
              await databaseService.delete(STORES.OFFLINE_QUEUE, item.id);
            } else {
              await databaseService.put(STORES.OFFLINE_QUEUE, item);
            }
          }
        }
      }
    } finally {
      this.offlineProcessing = false;
    }

    // 监听网络恢复
    window.addEventListener('online', () => {
      this.processOfflineQueue();
    }, { once: true });
  }

  // ==================== 工具方法 ====================

  private async apiRequest(method: string, path: string, body?: unknown): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
      throw new Error('认证已过期，请重新登录');
    }

    return response;
  }

  private generateCOSAuth(method: string, objectKey: string, credentials: STSCredentials): string {
    // 简化的 COS 签名，实际生产中应使用后端签名
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signStr = `${method}\n\n\n${timestamp}\n/${credentials.bucket}/${objectKey}`;
    return `COS ${credentials.accessKeyId}:${signStr}`;
  }

  private notifyProgress(uploadId: string, progress: UploadProgress): void {
    const callbacks = this.uploadCallbacks[uploadId];
    if (callbacks) {
      callbacks.forEach(cb => cb(progress));
    }
  }

  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  }

  private async dataUrlToFile(dataUrl: string, fileName: string, fileType: string): Promise<File> {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], fileName, { type: fileType });
  }
}

export const cloudStorageService = new CloudStorageService();
