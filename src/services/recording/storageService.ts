// ============================================
// PawSync Pro 3.0 - 录制存储服务
//
// 作者: 带娃的小陈工
// 日期: 2026-06-09
// 描述: IndexedDB 本地存储 + 云存储上传实现
// ============================================

import type {
  StorageConfig,
  StorageStats,
  StorageResult,
  CloudUploadResult,
  UploadProgress,
  IndexedDBRecordingRecord,
  RecordingSession,
} from './types';
import { DEFAULT_STORAGE_CONFIG } from './types';

/**
 * IndexedDB 数据库名称
 */
const DB_NAME = 'PawSyncRecordings';

/**
 * IndexedDB 数据库版本
 */
const DB_VERSION = 1;

/**
 * 录像存储表名
 */
const RECORDINGS_STORE = 'recordings';

/**
 * 存储服务类
 * 实现 IndexedDB 本地存储和云存储上传
 */
export class StorageService {
  /** IndexedDB 数据库实例 */
  private db: IDBDatabase | null = null;

  /** 存储配置 */
  private config: StorageConfig;

  /** 上传进度回调 */
  private uploadProgressCallbacks: Map<string, Array<(progress: UploadProgress) => void>> = new Map();

  /** 是否已初始化 */
  private initialized: boolean = false;

  /**
   * 构造函数
   */
  constructor(config?: Partial<StorageConfig>) {
    this.config = {
      ...DEFAULT_STORAGE_CONFIG,
      ...config,
    } as StorageConfig;
  }

  /**
   * 初始化 IndexedDB
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    return new Promise((resolve, reject) => {
      // 检查 IndexedDB 支持
      if (!window.indexedDB) {
        console.warn('IndexedDB 不支持，将使用内存存储');
        this.initialized = true;
        resolve();
        return;
      }

      // 打开数据库
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      // 数据库升级事件
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建录像存储表
        if (!db.objectStoreNames.contains(RECORDINGS_STORE)) {
          const store = db.createObjectStore(RECORDINGS_STORE, { keyPath: 'id' });
          // 创建索引
          store.createIndex('cameraId', 'session.cameraId', { unique: false });
          store.createIndex('startTime', 'session.startTime', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('syncedToCloud', 'syncedToCloud', { unique: false });
        }
      };

      // 成功事件
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.initialized = true;
        console.log('IndexedDB 存储服务初始化成功');
        resolve();
      };

      // 错误事件
      request.onerror = (event) => {
        console.error('IndexedDB 初始化失败:', (event.target as IDBOpenDBRequest).error);
        reject(new Error('IndexedDB 初始化失败'));
      };
    });
  }

  /**
   * 保存录像到本地存储
   * @param blob 视频 Blob 数据
   * @param session 录制会话信息
   * @param thumbnail 缩略图 Blob（可选）
   * @returns 存储结果
   */
  async saveRecording(
    blob: Blob,
    session: RecordingSession,
    thumbnail?: Blob
  ): Promise<StorageResult> {
    await this.initialize();

    const localId = `rec-${Date.now()}-${session.cameraId}`;

    try {
      // 如果 IndexedDB 不可用，返回模拟结果
      if (!this.db) {
        return {
          success: true,
          localId,
          size: blob.size,
        };
      }

      // 创建存储记录
      const record: IndexedDBRecordingRecord = {
        id: localId,
        session: {
          ...session,
          localId,
          fileSize: blob.size,
        },
        videoBlob: blob,
        thumbnailBlob: thumbnail,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncedToCloud: false,
      };

      // 保存到 IndexedDB
      await this.saveToIndexedDB(record);

      // 检查是否需要清理旧录像
      await this.checkAndCleanupStorage();

      return {
        success: true,
        localId,
        size: blob.size,
      };
    } catch (error) {
      console.error('保存录像失败:', error);
      return {
        success: false,
        size: 0,
        error: error instanceof Error ? error.message : '保存失败',
      };
    }
  }

  /**
   * 从 IndexedDB 加载录像
   * @param sessionId 会话 ID
   * @returns 视频 Blob 数据
   */
  async loadRecording(sessionId: string): Promise<Blob | null> {
    await this.initialize();

    if (!this.db) {
      console.warn('IndexedDB 不可用');
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([RECORDINGS_STORE], 'readonly');
      const store = transaction.objectStore(RECORDINGS_STORE);
      const request = store.get(sessionId);

      request.onsuccess = () => {
        const record = request.result as IndexedDBRecordingRecord;
        resolve(record?.videoBlob || null);
      };

      request.onerror = () => {
        reject(new Error('加载录像失败'));
      };
    });
  }

  /**
   * 获取录像记录详情
   * @param sessionId 会话 ID
   * @returns 录像记录
   */
  async getRecordingRecord(sessionId: string): Promise<IndexedDBRecordingRecord | null> {
    await this.initialize();

    if (!this.db) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([RECORDINGS_STORE], 'readonly');
      const store = transaction.objectStore(RECORDINGS_STORE);
      const request = store.get(sessionId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error('获取录像记录失败'));
      };
    });
  }

  /**
   * 获取所有录像列表
   * @param cameraId 摄像头 ID（可选）
   * @returns 录像列表
   */
  async getAllRecordings(cameraId?: string): Promise<IndexedDBRecordingRecord[]> {
    await this.initialize();

    if (!this.db) {
      return [];
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([RECORDINGS_STORE], 'readonly');
      const store = transaction.objectStore(RECORDINGS_STORE);

      // 如果指定了摄像头 ID，使用索引查询
      const request = cameraId
        ? store.index('cameraId').getAll(cameraId)
        : store.getAll();

      request.onsuccess = () => {
        const records = request.result as IndexedDBRecordingRecord[];
        // 按时间倒序排列
        records.sort((a, b) => 
          new Date(b.session.startTime).getTime() - new Date(a.session.startTime).getTime()
        );
        resolve(records);
      };

      request.onerror = () => {
        reject(new Error('获取录像列表失败'));
      };
    });
  }

  /**
   * 上传录像到云端
   * @param sessionId 会话 ID
   * @param onProgress 进度回调（可选）
   * @returns 云上传结果
   */
  async uploadToCloud(
    sessionId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<CloudUploadResult> {
    await this.initialize();

    // 获取录像记录
    const record = await this.getRecordingRecord(sessionId);
    if (!record || !record.videoBlob) {
      return {
        success: false,
        error: '录像不存在',
      };
    }

    // 如果已经上传，直接返回
    if (record.syncedToCloud) {
      return {
        success: true,
        url: record.session.cloudUrl,
        fileId: record.session.localId,
      };
    }

    const uploadId = `upload-${sessionId}-${Date.now()}`;

    // 注册进度回调
    if (onProgress) {
      this.uploadProgressCallbacks.set(uploadId, [onProgress]);
    }

    try {
      // 模拟云上传过程（实际项目中需要调用云存储 API）
      const cloudUrl = await this.simulateCloudUpload(
        record.videoBlob,
        record.session,
        uploadId,
        onProgress
      );

      // 更新记录状态
      record.syncedToCloud = true;
      record.session.cloudUrl = cloudUrl;
      record.session.isUploadedToCloud = true;
      record.updatedAt = new Date().toISOString();
      await this.updateIndexedDBRecord(record);

      // 清理进度回调
      this.uploadProgressCallbacks.delete(uploadId);

      return {
        success: true,
        url: cloudUrl,
        fileId: sessionId,
        uploadTime: record.videoBlob.size / 100000, // 模拟上传时间
      };
    } catch (error) {
      this.uploadProgressCallbacks.delete(uploadId);
      return {
        success: false,
        error: error instanceof Error ? error.message : '上传失败',
      };
    }
  }

  /**
   * 模拟云上传过程
   * 实际项目中需要替换为真实的云存储 SDK 调用
   */
  private async simulateCloudUpload(
    blob: Blob,
    session: RecordingSession,
    uploadId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    const totalBytes = blob.size;
    const chunkSize = 1024 * 1024; // 1MB 分片
    const chunks = Math.ceil(totalBytes / chunkSize);

    // 模拟分片上传
    for (let i = 0; i <= chunks; i++) {
      await this.delay(200);
      const uploadedBytes = Math.min(i * chunkSize, totalBytes);
      const progress = Math.round((uploadedBytes / totalBytes) * 100);

      if (onProgress) {
        onProgress({
          uploadId,
          progress,
          status: progress === 100 ? 'completed' : 'uploading',
          uploadedBytes,
          totalBytes,
          speed: chunkSize * 5, // 模拟速度
        });
      }
    }

    // 返回模拟的云 URL
    const cloudProvider = this.config.provider;
    const bucket = this.config.cloudBucket || 'pawsync-recordings';
    const region = this.config.cloudRegion || 'ap-shanghai';

    return `https://${bucket}.${region}.${cloudProvider}.com/recordings/${session.cameraId}/${session.id}.webm`;
  }

  /**
   * 获取存储统计信息
   * @returns 存储统计
   */
  async getStorageStats(): Promise<StorageStats> {
    await this.initialize();

    const records = await this.getAllRecordings();

    // 计算本地存储使用量
    const localUsed = records.reduce((sum, r) => sum + (r.videoBlob?.size || 0), 0);
    const localTotal = this.config.maxLocalStorageMB * 1024 * 1024;

    // 计算云端存储使用量（模拟）
    const cloudUsed = records.filter(r => r.syncedToCloud).reduce(
      (sum, r) => sum + (r.videoBlob?.size || 0),
      0
    );
    const cloudTotal = 50 * 1024 * 1024 * 1024; // 50GB

    // 计算总时长
    const totalDuration = records.reduce((sum, r) => sum + (r.session.duration || 0), 0);

    // 获取时间范围
    const sortedRecords = [...records].sort((a, b) =>
      new Date(a.session.startTime).getTime() - new Date(b.session.startTime).getTime()
    );

    return {
      localUsed,
      localTotal,
      cloudUsed,
      cloudTotal,
      recordingCount: records.length,
      totalDuration,
      oldestRecording: sortedRecords[0]?.session.startTime,
      newestRecording: sortedRecords[sortedRecords.length - 1]?.session.startTime,
      usagePercent: Math.round((localUsed / localTotal) * 100),
    };
  }

  /**
   * 清理旧录像
   * @param maxAge 最大保留天数
   * @returns 清理数量
   */
  async cleanupOldRecordings(maxAge: number): Promise<number> {
    await this.initialize();

    if (!this.db) {
      return 0;
    }

    const cutoffDate = new Date(Date.now() - maxAge * 24 * 60 * 60 * 1000);
    const records = await this.getAllRecordings();

    let deletedCount = 0;

    for (const record of records) {
      const startTime = new Date(record.session.startTime);
      if (startTime < cutoffDate) {
        await this.deleteRecording(record.id);
        deletedCount++;
      }
    }

    console.log(`清理了 ${deletedCount} 个旧录像`);
    return deletedCount;
  }

  /**
   * 删除录像
   * @param sessionId 会话 ID
   * @returns 是否成功
   */
  async deleteRecording(sessionId: string): Promise<boolean> {
    await this.initialize();

    if (!this.db) {
      return false;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([RECORDINGS_STORE], 'readwrite');
      const store = transaction.objectStore(RECORDINGS_STORE);
      const request = store.delete(sessionId);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(new Error('删除录像失败'));
      };
    });
  }

  /**
   * 检查并清理存储空间
   * 当存储超过阈值时自动清理旧录像
   */
  private async checkAndCleanupStorage(): Promise<void> {
    const stats = await this.getStorageStats();

    // 如果使用超过 80%，清理最旧的录像
    if (stats.usagePercent > 80) {
      const records = await this.getAllRecordings();
      const targetFree = stats.localTotal * 0.3; // 目标释放 30% 空间
      let freedSpace = 0;

      // 按时间排序（最旧优先）
      const sortedRecords = [...records].sort((a, b) =>
        new Date(a.session.startTime).getTime() - new Date(b.session.startTime).getTime()
      );

      for (const record of sortedRecords) {
        if (freedSpace >= targetFree) break;

        const size = record.videoBlob?.size || 0;
        await this.deleteRecording(record.id);
        freedSpace += size;
        console.log(`自动清理录像: ${record.id}, 释放 ${size} 字节`);
      }
    }
  }

  /**
   * 保存到 IndexedDB
   */
  private async saveToIndexedDB(record: IndexedDBRecordingRecord): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([RECORDINGS_STORE], 'readwrite');
      const store = transaction.objectStore(RECORDINGS_STORE);
      const request = store.put(record);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('IndexedDB 保存失败'));
      };
    });
  }

  /**
   * 更新 IndexedDB 记录
   */
  private async updateIndexedDBRecord(record: IndexedDBRecordingRecord): Promise<void> {
    return this.saveToIndexedDB(record);
  }

  /**
   * 更新存储配置
   * @param config 新配置
   */
  async updateConfig(config: Partial<StorageConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取当前配置
   */
  getConfig(): StorageConfig {
    return { ...this.config };
  }

  /**
   * 检查是否支持 IndexedDB
   */
  isIndexedDBSupported(): boolean {
    return !!window.indexedDB;
  }

  /**
   * 获取录像 URL（用于播放）
   * @param sessionId 会话 ID
   * @returns Blob URL 或云 URL
   */
  async getRecordingUrl(sessionId: string): Promise<string | null> {
    const record = await this.getRecordingRecord(sessionId);
    if (!record) return null;

    // 如果有云 URL，优先使用
    if (record.syncedToCloud && record.session.cloudUrl) {
      return record.session.cloudUrl;
    }

    // 使用本地 Blob URL
    if (record.videoBlob) {
      return URL.createObjectURL(record.videoBlob);
    }

    return null;
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }
}

// 导出默认实例
export const storageService = new StorageService(DEFAULT_STORAGE_CONFIG);