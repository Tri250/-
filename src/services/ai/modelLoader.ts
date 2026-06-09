/**
 * AI 模型加载器
 * 支持模型懒加载、IndexedDB 缓存、版本管理和加载进度追踪
 */

import type {
  ModelConfig,
  ModelLoadStatus,
  ModelLoadProgress,
  ModelLoadResult,
  CacheEntry,
  CacheStats,
  InferenceMode,
} from './types';

// ==================== 类型定义 ====================

/**
 * 已加载的模型实例
 */
interface LoadedModel {
  config: ModelConfig;
  instance: unknown;
  loadTime: number;
  lastUsed: number;
  fromCache: boolean;
}

/**
 * 进度回调函数类型
 */
type ProgressCallback = (progress: ModelLoadProgress) => void;

/**
 * 模型加载器事件类型
 */
type ModelLoaderEvent = 'loadStart' | 'loadProgress' | 'loadComplete' | 'loadError' | 'cacheHit' | 'cacheMiss';

/**
 * 事件监听器类型
 */
type EventListener = (data: unknown) => void;

// ==================== IndexedDB 缓存管理器 ====================

/**
 * IndexedDB 缓存管理器
 * 用于缓存模型文件和权重
 */
class ModelCacheManager {
  private dbName = 'ai-model-cache';
  private storeName = 'models';
  private version = 1;
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  // 缓存统计
  private stats: CacheStats = {
    totalEntries: 0,
    totalSize: 0,
    hits: 0,
    misses: 0,
    hitRate: 0,
  };

  /**
   * 初始化 IndexedDB
   */
  private async initDB(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('[ModelCache] IndexedDB 初始化失败:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[ModelCache] IndexedDB 初始化成功');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('version', 'version', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * 获取缓存
   */
  async get<T>(key: string, version?: string): Promise<CacheEntry<T> | null> {
    await this.initDB();
    if (!this.db) return null;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        const entry = request.result as CacheEntry<T> | undefined;
        
        if (!entry) {
          this.stats.misses++;
          this.updateHitRate();
          resolve(null);
          return;
        }

        // 检查版本
        if (version && entry.version !== version) {
          this.stats.misses++;
          this.updateHitRate();
          resolve(null);
          return;
        }

        // 检查过期
        if (entry.expiresAt && entry.expiresAt < Date.now()) {
          this.delete(key);
          this.stats.misses++;
          this.updateHitRate();
          resolve(null);
          return;
        }

        this.stats.hits++;
        this.updateHitRate();
        resolve(entry);
      };

      request.onerror = () => {
        this.stats.misses++;
        this.updateHitRate();
        resolve(null);
      };
    });
  }

  /**
   * 设置缓存
   */
  async set<T>(entry: CacheEntry<T>): Promise<boolean> {
    await this.initDB();
    if (!this.db) return false;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(entry);

      request.onsuccess = () => {
        this.stats.totalEntries++;
        this.stats.totalSize += entry.size;
        resolve(true);
      };

      request.onerror = () => {
        console.error('[ModelCache] 缓存写入失败:', request.error);
        resolve(false);
      };
    });
  }

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<boolean> {
    await this.initDB();
    if (!this.db) return false;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      // 先获取大小
      const getRequest = store.get(key);
      getRequest.onsuccess = () => {
        const entry = getRequest.result as CacheEntry | undefined;
        const deleteRequest = store.delete(key);
        
        deleteRequest.onsuccess = () => {
          if (entry) {
            this.stats.totalEntries--;
            this.stats.totalSize -= entry.size;
          }
          resolve(true);
        };
        
        deleteRequest.onerror = () => resolve(false);
      };
      
      getRequest.onerror = () => resolve(false);
    });
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<boolean> {
    await this.initDB();
    if (!this.db) return false;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        this.stats.totalEntries = 0;
        this.stats.totalSize = 0;
        resolve(true);
      };

      request.onerror = () => resolve(false);
    });
  }

  /**
   * 获取缓存统计
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * 更新命中率
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }
}

// ==================== 模型加载器 ====================

/**
 * AI 模型加载器
 * 支持懒加载、缓存、版本管理和进度追踪
 */
export class ModelLoader {
  // 单例实例
  private static instance: ModelLoader | null = null;

  // 已加载的模型
  private loadedModels: Map<string, LoadedModel> = new Map();

  // 模型配置注册表
  private modelConfigs: Map<string, ModelConfig> = new Map();

  // 模型加载状态
  private loadStatus: Map<string, ModelLoadStatus> = new Map();

  // 加载进度
  private loadProgress: Map<string, ModelLoadProgress> = new Map();

  // 缓存管理器
  private cacheManager: ModelCacheManager;

  // 事件监听器
  private eventListeners: Map<ModelLoaderEvent, Set<EventListener>> = new Map();

  // 加载中的 Promise（防止重复加载）
  private loadingPromises: Map<string, Promise<LoadedModel>> = new Map();

  // 默认模型配置
  private static readonly DEFAULT_MODEL_CONFIGS: Record<string, ModelConfig> = {
    yamnet: {
      id: 'yamnet',
      type: 'yamnet',
      name: 'YAMNet Audio Classifier',
      version: '1.0.0',
      modelUrl: '/models/yamnet/model.json',
      size: 15 * 1024 * 1024, // ~15MB
      inputShape: [1, 1024, 1],
      outputShape: [1, 521],
      supportsWorker: true,
      cacheStrategy: 'indexeddb',
      cacheExpiry: 7 * 24 * 60 * 60 * 1000, // 7 天
      preferredMode: 'frontend',
      metadata: {
        description: '音频事件分类模型，支持 521 个音频类别',
        sampleRate: 16000,
      },
    },
    mobilenetv3: {
      id: 'mobilenetv3',
      type: 'mobilenetv3',
      name: 'MobileNetV3 Image Classifier',
      version: '1.0.0',
      modelUrl: '/models/mobilenetv3/model.json',
      size: 20 * 1024 * 1024, // ~20MB
      inputShape: [1, 224, 224, 3],
      outputShape: [1, 1001],
      supportsWorker: true,
      cacheStrategy: 'indexeddb',
      cacheExpiry: 7 * 24 * 60 * 60 * 1000, // 7 天
      preferredMode: 'frontend',
      metadata: {
        description: '轻量级图像分类模型，支持 1001 个类别',
      },
    },
  };

  private constructor() {
    this.cacheManager = new ModelCacheManager();
    this.registerDefaultModels();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): ModelLoader {
    if (!ModelLoader.instance) {
      ModelLoader.instance = new ModelLoader();
    }
    return ModelLoader.instance;
  }

  /**
   * 注册默认模型配置
   */
  private registerDefaultModels(): void {
    Object.values(ModelLoader.DEFAULT_MODEL_CONFIGS).forEach((config) => {
      this.modelConfigs.set(config.id, config);
      this.loadStatus.set(config.id, 'idle');
    });
  }

  /**
   * 注册自定义模型
   */
  registerModel(config: ModelConfig): void {
    this.modelConfigs.set(config.id, config);
    this.loadStatus.set(config.id, 'idle');
    console.log(`[ModelLoader] 注册模型: ${config.id} (${config.name})`);
  }

  /**
   * 注销模型
   */
  unregisterModel(modelId: string): void {
    this.modelConfigs.delete(modelId);
    this.loadStatus.delete(modelId);
    this.loadProgress.delete(modelId);
    this.loadedModels.delete(modelId);
    console.log(`[ModelLoader] 注销模型: ${modelId}`);
  }

  /**
   * 获取模型配置
   */
  getModelConfig(modelId: string): ModelConfig | undefined {
    return this.modelConfigs.get(modelId);
  }

  /**
   * 获取所有已注册的模型配置
   */
  getAllModelConfigs(): ModelConfig[] {
    return Array.from(this.modelConfigs.values());
  }

  /**
   * 获取模型加载状态
   */
  getLoadStatus(modelId: string): ModelLoadStatus {
    return this.loadStatus.get(modelId) || 'idle';
  }

  /**
   * 获取加载进度
   */
  getLoadProgress(modelId: string): ModelLoadProgress | undefined {
    return this.loadProgress.get(modelId);
  }

  /**
   * 检查模型是否已加载
   */
  isModelLoaded(modelId: string): boolean {
    return this.loadedModels.has(modelId);
  }

  /**
   * 加载模型（懒加载）
   */
  async loadModel(
    modelId: string,
    onProgress?: ProgressCallback
  ): Promise<ModelLoadResult> {
    const startTime = Date.now();
    const config = this.modelConfigs.get(modelId);

    if (!config) {
      return {
        success: false,
        modelId,
        loadTime: 0,
        fromCache: false,
        error: `模型配置未找到: ${modelId}`,
      };
    }

    // 检查是否已加载
    if (this.loadedModels.has(modelId)) {
      const loaded = this.loadedModels.get(modelId)!;
      loaded.lastUsed = Date.now();
      return {
        success: true,
        modelId,
        loadTime: 0,
        fromCache: true,
      };
    }

    // 检查是否正在加载
    if (this.loadingPromises.has(modelId)) {
      try {
        await this.loadingPromises.get(modelId)!;
        return {
          success: true,
          modelId,
          loadTime: Date.now() - startTime,
          fromCache: true,
        };
      } catch (error) {
        return {
          success: false,
          modelId,
          loadTime: Date.now() - startTime,
          fromCache: false,
          error: error instanceof Error ? error.message : '加载失败',
        };
      }
    }

    // 开始加载
    this.loadStatus.set(modelId, 'loading');
    this.emit('loadStart', { modelId, config });

    const loadPromise = this.doLoadModel(config, onProgress);
    this.loadingPromises.set(modelId, loadPromise);

    try {
      const loaded = await loadPromise;
      this.loadedModels.set(modelId, loaded);
      this.loadStatus.set(modelId, 'loaded');
      this.loadingPromises.delete(modelId);

      const result: ModelLoadResult = {
        success: true,
        modelId,
        loadTime: loaded.loadTime,
        fromCache: loaded.fromCache,
      };

      this.emit('loadComplete', { modelId, result });
      return result;
    } catch (error) {
      this.loadStatus.set(modelId, 'error');
      this.loadingPromises.delete(modelId);

      const result: ModelLoadResult = {
        success: false,
        modelId,
        loadTime: Date.now() - startTime,
        fromCache: false,
        error: error instanceof Error ? error.message : '加载失败',
      };

      this.emit('loadError', { modelId, error });
      return result;
    }
  }

  /**
   * 执行模型加载
   */
  private async doLoadModel(
    config: ModelConfig,
    onProgress?: ProgressCallback
  ): Promise<LoadedModel> {
    const startTime = Date.now();
    let fromCache = false;

    // 更新进度
    const updateProgress = (stage: ModelLoadProgress['stage'], progress: number, loadedBytes = 0, totalBytes = 0) => {
      const progressData: ModelLoadProgress = {
        modelId: config.id,
        stage,
        progress,
        loadedBytes,
        totalBytes: totalBytes || config.size,
        timestamp: Date.now(),
      };
      this.loadProgress.set(config.id, progressData);
      onProgress?.(progressData);
      this.emit('loadProgress', progressData);
    };

    // 尝试从缓存加载
    if (config.cacheStrategy === 'indexeddb') {
      updateProgress('parsing', 10);
      
      const cached = await this.cacheManager.get<ArrayBuffer>(
        `model_${config.id}`,
        config.version
      );

      if (cached) {
        fromCache = true;
        this.emit('cacheHit', { modelId: config.id });
        updateProgress('parsing', 50);
        
        // 从缓存数据初始化模型
        const modelInstance = await this.initializeModelFromCache(config, cached.value);
        updateProgress('ready', 100);

        return {
          config,
          instance: modelInstance,
          loadTime: Date.now() - startTime,
          lastUsed: Date.now(),
          fromCache,
        };
      }

      this.emit('cacheMiss', { modelId: config.id });
    }

    // 下载模型
    updateProgress('downloading', 0);
    const modelData = await this.downloadModel(config, (loaded, total) => {
      const progress = Math.round((loaded / total) * 80);
      updateProgress('downloading', progress, loaded, total);
    });

    updateProgress('parsing', 85);

    // 初始化模型
    const modelInstance = await this.initializeModel(config, modelData);
    updateProgress('initializing', 95);

    // 缓存模型
    if (config.cacheStrategy === 'indexeddb') {
      await this.cacheManager.set({
        key: `model_${config.id}`,
        value: modelData,
        createdAt: Date.now(),
        expiresAt: config.cacheExpiry ? Date.now() + config.cacheExpiry : undefined,
        version: config.version,
        size: config.size,
      });
    }

    updateProgress('ready', 100);

    return {
      config,
      instance: modelInstance,
      loadTime: Date.now() - startTime,
      lastUsed: Date.now(),
      fromCache,
    };
  }

  /**
   * 下载模型文件
   */
  private async downloadModel(
    config: ModelConfig,
    onProgress?: (loaded: number, total: number) => void
  ): Promise<ArrayBuffer> {
    if (!config.modelUrl) {
      throw new Error(`模型 URL 未配置: ${config.id}`);
    }

    // 模拟下载（实际项目中使用 fetch）
    // 这里返回模拟数据，实际使用时需要替换为真实下载逻辑
    console.log(`[ModelLoader] 下载模型: ${config.id} from ${config.modelUrl}`);

    // 模拟进度更新
    let loaded = 0;
    const total = config.size;
    const chunkSize = 1024 * 1024; // 1MB chunks

    while (loaded < total) {
      await new Promise((resolve) => setTimeout(resolve, 50)); // 模拟网络延迟
      loaded = Math.min(loaded + chunkSize, total);
      onProgress?.(loaded, total);
    }

    // 返回空的 ArrayBuffer（实际项目中返回真实数据）
    return new ArrayBuffer(config.size);
  }

  /**
   * 从缓存数据初始化模型
   */
  private async initializeModelFromCache(
    config: ModelConfig,
    _data: ArrayBuffer
  ): Promise<unknown> {
    console.log(`[ModelLoader] 从缓存初始化模型: ${config.id}`);
    
    // 根据模型类型初始化
    switch (config.type) {
      case 'yamnet':
        // 实际项目中使用 TensorFlow.js 加载
        return { type: 'yamnet', loaded: true, fromCache: true };
      case 'mobilenetv3':
        // 实际项目中使用 TensorFlow.js 加载
        return { type: 'mobilenetv3', loaded: true, fromCache: true };
      default:
        return { type: config.type, loaded: true, fromCache: true };
    }
  }

  /**
   * 初始化模型
   */
  private async initializeModel(
    config: ModelConfig,
    _data: ArrayBuffer
  ): Promise<unknown> {
    console.log(`[ModelLoader] 初始化模型: ${config.id}`);
    
    // 根据模型类型初始化
    switch (config.type) {
      case 'yamnet':
        // 实际项目中使用 TensorFlow.js 加载
        return { type: 'yamnet', loaded: true };
      case 'mobilenetv3':
        // 实际项目中使用 TensorFlow.js 加载
        return { type: 'mobilenetv3', loaded: true };
      default:
        return { type: config.type, loaded: true };
    }
  }

  /**
   * 卸载模型
   */
  async unloadModel(modelId: string): Promise<boolean> {
    const loaded = this.loadedModels.get(modelId);
    if (!loaded) return false;

    // 清理模型实例
    this.loadedModels.delete(modelId);
    this.loadStatus.set(modelId, 'idle');
    this.loadProgress.delete(modelId);

    console.log(`[ModelLoader] 卸载模型: ${modelId}`);
    return true;
  }

  /**
   * 获取已加载的模型实例
   */
  getModelInstance<T = unknown>(modelId: string): T | undefined {
    const loaded = this.loadedModels.get(modelId);
    return loaded?.instance as T | undefined;
  }

  /**
   * 清理所有模型
   */
  async clearAll(): Promise<void> {
    // 卸载所有模型
    for (const modelId of this.loadedModels.keys()) {
      await this.unloadModel(modelId);
    }

    // 清空缓存
    await this.cacheManager.clear();
    console.log('[ModelLoader] 清理所有模型和缓存');
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): CacheStats {
    return this.cacheManager.getStats();
  }

  /**
   * 添加事件监听器
   */
  addEventListener(event: ModelLoaderEvent, listener: EventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(event: ModelLoaderEvent, listener: EventListener): void {
    this.eventListeners.get(event)?.delete(listener);
  }

  /**
   * 触发事件
   */
  private emit(event: ModelLoaderEvent, data: unknown): void {
    this.eventListeners.get(event)?.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error(`[ModelLoader] 事件监听器错误:`, error);
      }
    });
  }

  /**
   * 获取推荐的推理模式
   */
  getRecommendedMode(modelId: string): InferenceMode {
    const config = this.modelConfigs.get(modelId);
    return config?.preferredMode || 'frontend';
  }

  /**
   * 检查模型是否支持 Web Worker
   */
  supportsWorker(modelId: string): boolean {
    const config = this.modelConfigs.get(modelId);
    return config?.supportsWorker ?? false;
  }
}

// 导出单例
export const modelLoader = ModelLoader.getInstance();