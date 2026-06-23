export type CachePriority = 'critical' | 'important' | 'normal' | 'cache';

export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  namespace: string;
  priority: CachePriority;
  createdAt: number;
  accessedAt: number;
  ttl?: number;
  size: number;
}

export interface CacheStats {
  hitCount: number;
  missCount: number;
  hitRate: number;
  totalEntries: number;
  totalSize: number;
  memoryEntries: number;
  memorySize: number;
  idbEntries: number;
  idbSize: number;
  byPriority: Record<CachePriority, { count: number; size: number }>;
  byNamespace: Record<string, { count: number; size: number }>;
}

export interface CacheOptions {
  namespace?: string;
  priority?: CachePriority;
  ttl?: number;
}

export interface MemoryPressureConfig {
  warningThresholdMB: number;
  criticalThresholdMB: number;
  checkIntervalMs: number;
}

const DEFAULT_NAMESPACE = 'default';
const DEFAULT_PRIORITY: CachePriority = 'normal';

const PRIORITY_WEIGHT: Record<CachePriority, number> = {
  critical: 4,
  important: 3,
  normal: 2,
  cache: 1,
};

const IDB_NAME = 'PawSyncCache';
const IDB_STORE = 'cache';
const IDB_VERSION = 1;

class LRUMap<K, V> {
  private map: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.map = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.map.get(key);
    if (value !== undefined) {
      this.map.delete(key);
      this.map.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxSize) {
      const firstKey = this.map.keys().next().value;
      if (firstKey !== undefined) {
        this.map.delete(firstKey);
      }
    }
    this.map.set(key, value);
  }

  delete(key: K): boolean {
    return this.map.delete(key);
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }

  keys(): IterableIterator<K> {
    return this.map.keys();
  }

  values(): IterableIterator<V> {
    return this.map.values();
  }

  entries(): IterableIterator<[K, V]> {
    return this.map.entries();
  }

  forEach(callback: (value: V, key: K) => void): void {
    this.map.forEach(callback);
  }

  evictLRU(count: number): K[] {
    const evicted: K[] = [];
    const iterator = this.map.keys();
    
    for (let i = 0; i < count; i++) {
      const result = iterator.next();
      if (result.done) break;
      const key = result.value;
      this.map.delete(key);
      evicted.push(key);
    }
    
    return evicted;
  }

  setMaxSize(maxSize: number): void {
    this.maxSize = maxSize;
    while (this.map.size > this.maxSize) {
      const firstKey = this.map.keys().next().value;
      if (firstKey !== undefined) {
        this.map.delete(firstKey);
      }
    }
  }
}

class IndexedDBCache {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(IDB_NAME, IDB_VERSION);

        request.onerror = () => {
          this.initPromise = null;
          reject(request.error);
        };

        request.onsuccess = () => {
          this.db = request.result;
          resolve();
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(IDB_STORE)) {
            const store = db.createObjectStore(IDB_STORE, { keyPath: 'key' });
            store.createIndex('namespace', 'namespace', { unique: false });
            store.createIndex('priority', 'priority', { unique: false });
            store.createIndex('accessedAt', 'accessedAt', { unique: false });
            store.createIndex('createdAt', 'createdAt', { unique: false });
          }
        };
      } catch (error) {
        this.initPromise = null;
        reject(error);
      }
    });

    return this.initPromise;
  }

  private async getStore(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    await this.init();
    if (!this.db) throw new Error('IndexedDB not initialized');
    const transaction = this.db.transaction(IDB_STORE, mode);
    return transaction.objectStore(IDB_STORE);
  }

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const store = await this.getStore();
      return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return null;
    }
  }

  async put<T>(entry: CacheEntry<T>): Promise<void> {
    try {
      const store = await this.getStore('readwrite');
      return new Promise((resolve, reject) => {
        const request = store.put(entry);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch {
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const store = await this.getStore('readwrite');
      return new Promise((resolve, reject) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch {
    }
  }

  async clear(): Promise<void> {
    try {
      const store = await this.getStore('readwrite');
      return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch {
    }
  }

  async clearByNamespace(namespace: string): Promise<void> {
    try {
      const store = await this.getStore('readwrite');
      const index = store.index('namespace');
      return new Promise((resolve, reject) => {
        const request = index.openCursor(IDBKeyRange.only(namespace));
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch {
    }
  }

  async clearByPriority(priority: CachePriority): Promise<void> {
    try {
      const store = await this.getStore('readwrite');
      const index = store.index('priority');
      return new Promise((resolve, reject) => {
        const request = index.openCursor(IDBKeyRange.only(priority));
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch {
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const store = await this.getStore();
      return new Promise((resolve, reject) => {
        const request = store.getAllKeys();
        request.onsuccess = () => resolve(request.result as string[]);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return [];
    }
  }

  async count(): Promise<number> {
    try {
      const store = await this.getStore();
      return new Promise((resolve, reject) => {
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return 0;
    }
  }

  async evictLRU(count: number, excludePriority?: CachePriority): Promise<string[]> {
    try {
      const store = await this.getStore('readwrite');
      const index = store.index('accessedAt');
      const evicted: string[] = [];
      
      return new Promise((resolve, reject) => {
        const request = index.openCursor();
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor && evicted.length < count) {
            const entry = cursor.value as CacheEntry;
            if (!excludePriority || entry.priority !== excludePriority) {
              evicted.push(entry.key);
              cursor.delete();
            }
            cursor.continue();
          } else {
            resolve(evicted);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch {
      return [];
    }
  }
}

export class CacheManager {
  private static instance: CacheManager;
  private memoryCache: LRUMap<string, CacheEntry>;
  private idbCache: IndexedDBCache;
  
  private hitCount = 0;
  private missCount = 0;
  
  private maxMemorySize = 50 * 1024 * 1024;
  private currentMemorySize = 0;
  private pressureConfig: MemoryPressureConfig;
  private monitorInterval: ReturnType<typeof setInterval> | null = null;
  
  private memoryPressureLevel: 'normal' | 'warning' | 'critical' = 'normal';

  private constructor() {
    this.memoryCache = new LRUMap<string, CacheEntry>(5000);
    this.idbCache = new IndexedDBCache();
    this.pressureConfig = {
      warningThresholdMB: 200,
      criticalThresholdMB: 350,
      checkIntervalMs: 10000,
    };
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  async init(): Promise<void> {
    try {
      await this.idbCache.init();
      this.startMemoryMonitoring();
    } catch (error) {
      console.warn('[CacheManager] IndexedDB initialization failed:', error);
    }
  }

  private startMemoryMonitoring(): void {
    if (this.monitorInterval) return;
    
    this.monitorInterval = setInterval(() => {
      this.checkMemoryPressure();
    }, this.pressureConfig.checkIntervalMs);
  }

  stopMemoryMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }

  private checkMemoryPressure(): void {
    const memory = (performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
    if (!memory) return;

    const usedMB = memory.usedJSHeapSize / (1024 * 1024);
    const previousLevel = this.memoryPressureLevel;

    if (usedMB >= this.pressureConfig.criticalThresholdMB) {
      this.memoryPressureLevel = 'critical';
    } else if (usedMB >= this.pressureConfig.warningThresholdMB) {
      this.memoryPressureLevel = 'warning';
    } else {
      this.memoryPressureLevel = 'normal';
    }

    if (this.memoryPressureLevel !== previousLevel) {
      this.handlePressureLevelChange(this.memoryPressureLevel);
    }
  }

  private handlePressureLevelChange(level: 'normal' | 'warning' | 'critical'): void {
    if (level === 'critical') {
      this.clearByPriority('cache');
      this.evictFromMemory(this.memoryCache.size * 0.5, 'important');
    } else if (level === 'warning') {
      this.clearExpired();
      this.evictFromMemory(this.memoryCache.size * 0.2, 'normal');
    }
  }

  private evictFromMemory(count: number, minPriority?: CachePriority): void {
    const minWeight = minPriority ? PRIORITY_WEIGHT[minPriority] : 0;
    const keysToEvict: string[] = [];
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (keysToEvict.length >= count) break;
      if (PRIORITY_WEIGHT[entry.priority] < minWeight) {
        keysToEvict.push(key);
      }
    }
    
    for (const key of keysToEvict) {
      const entry = this.memoryCache.get(key);
      if (entry) {
        this.currentMemorySize -= entry.size;
        this.memoryCache.delete(key);
      }
    }
  }

  private getFullKey(key: string, namespace: string): string {
    return `${namespace}:${key}`;
  }

  private estimateSize(value: unknown): number {
    if (value === null || value === undefined) return 0;
    
    try {
      const json = JSON.stringify(value);
      return new Blob([json]).size;
    } catch {
      return 1024;
    }
  }

  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<void> {
    const {
      namespace = DEFAULT_NAMESPACE,
      priority = DEFAULT_PRIORITY,
      ttl,
    } = options;

    const fullKey = this.getFullKey(key, namespace);
    const size = this.estimateSize(value);
    const now = Date.now();

    const entry: CacheEntry<T> = {
      key: fullKey,
      value,
      namespace,
      priority,
      createdAt: now,
      accessedAt: now,
      ttl,
      size,
    };

    if (this.currentMemorySize + size > this.maxMemorySize) {
      this.evictFromMemory(Math.ceil(this.memoryCache.size * 0.3));
    }

    const existing = this.memoryCache.get(fullKey);
    if (existing) {
      this.currentMemorySize -= existing.size;
    }
    
    this.memoryCache.set(fullKey, entry as CacheEntry);
    this.currentMemorySize += size;

    if (priority !== 'cache') {
      try {
        await this.idbCache.put(entry as CacheEntry);
      } catch {
      }
    }
  }

  async get<T>(
    key: string,
    options: CacheOptions = {}
  ): Promise<T | null> {
    const { namespace = DEFAULT_NAMESPACE } = options;
    const fullKey = this.getFullKey(key, namespace);

    const memoryEntry = this.memoryCache.get(fullKey);
    if (memoryEntry) {
      if (this.isExpired(memoryEntry)) {
        this.memoryCache.delete(fullKey);
        this.currentMemorySize -= memoryEntry.size;
      } else {
        memoryEntry.accessedAt = Date.now();
        this.hitCount++;
        return memoryEntry.value as T;
      }
    }

    const idbEntry = await this.idbCache.get<T>(fullKey);
    if (idbEntry) {
      if (this.isExpired(idbEntry)) {
        await this.idbCache.delete(fullKey);
      } else {
        idbEntry.accessedAt = Date.now();
        this.hitCount++;
        
        if (this.currentMemorySize + idbEntry.size <= this.maxMemorySize) {
          this.memoryCache.set(fullKey, idbEntry as CacheEntry);
          this.currentMemorySize += idbEntry.size;
        }
        
        await this.idbCache.put(idbEntry as CacheEntry);
        return idbEntry.value;
      }
    }

    this.missCount++;
    return null;
  }

  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions & { forceRefresh?: boolean } = {}
  ): Promise<T> {
    const { forceRefresh = false, ...cacheOptions } = options;
    
    if (!forceRefresh) {
      const cached = await this.get<T>(key, cacheOptions);
      if (cached !== null) {
        return cached;
      }
    }

    const value = await fetcher();
    await this.set(key, value, cacheOptions);
    return value;
  }

  async has(key: string, options: CacheOptions = {}): Promise<boolean> {
    const value = await this.get(key, options);
    return value !== null;
  }

  async delete(key: string, options: CacheOptions = {}): Promise<void> {
    const { namespace = DEFAULT_NAMESPACE } = options;
    const fullKey = this.getFullKey(key, namespace);

    const entry = this.memoryCache.get(fullKey);
    if (entry) {
      this.currentMemorySize -= entry.size;
      this.memoryCache.delete(fullKey);
    }

    await this.idbCache.delete(fullKey);
  }

  async clearByNamespace(namespace: string): Promise<void> {
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.namespace === namespace) {
        keysToDelete.push(key);
      }
    }
    
    for (const key of keysToDelete) {
      const entry = this.memoryCache.get(key);
      if (entry) {
        this.currentMemorySize -= entry.size;
        this.memoryCache.delete(key);
      }
    }

    await this.idbCache.clearByNamespace(namespace);
  }

  async clearByPriority(priority: CachePriority): Promise<void> {
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.priority === priority) {
        keysToDelete.push(key);
      }
    }
    
    for (const key of keysToDelete) {
      const entry = this.memoryCache.get(key);
      if (entry) {
        this.currentMemorySize -= entry.size;
        this.memoryCache.delete(key);
      }
    }

    await this.idbCache.clearByPriority(priority);
  }

  async clearAll(): Promise<void> {
    this.memoryCache.clear();
    this.currentMemorySize = 0;
    await this.idbCache.clear();
  }

  clearExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.ttl && now - entry.createdAt > entry.ttl) {
        keysToDelete.push(key);
      }
    }
    
    for (const key of keysToDelete) {
      const entry = this.memoryCache.get(key);
      if (entry) {
        this.currentMemorySize -= entry.size;
        this.memoryCache.delete(key);
      }
    }
  }

  private isExpired(entry: CacheEntry): boolean {
    if (!entry.ttl) return false;
    return Date.now() - entry.createdAt > entry.ttl;
  }

  async getStats(): Promise<CacheStats> {
    const totalRequests = this.hitCount + this.missCount;
    const hitRate = totalRequests > 0 ? this.hitCount / totalRequests : 0;

    const byPriority: Record<CachePriority, { count: number; size: number }> = {
      critical: { count: 0, size: 0 },
      important: { count: 0, size: 0 },
      normal: { count: 0, size: 0 },
      cache: { count: 0, size: 0 },
    };

    const byNamespace: Record<string, { count: number; size: number }> = {};

    let memorySize = 0;
    let memoryEntries = 0;

    for (const entry of this.memoryCache.values()) {
      memorySize += entry.size;
      memoryEntries++;
      byPriority[entry.priority].count++;
      byPriority[entry.priority].size += entry.size;
      
      if (!byNamespace[entry.namespace]) {
        byNamespace[entry.namespace] = { count: 0, size: 0 };
      }
      byNamespace[entry.namespace].count++;
      byNamespace[entry.namespace].size += entry.size;
    }

    const idbEntries = await this.idbCache.count();

    return {
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate,
      totalEntries: memoryEntries + idbEntries,
      totalSize: memorySize,
      memoryEntries,
      memorySize,
      idbEntries,
      idbSize: 0,
      byPriority,
      byNamespace,
    };
  }

  resetStats(): void {
    this.hitCount = 0;
    this.missCount = 0;
  }

  setMaxMemorySize(size: number): void {
    this.maxMemorySize = size;
  }

  setPressureConfig(config: Partial<MemoryPressureConfig>): void {
    this.pressureConfig = { ...this.pressureConfig, ...config };
  }

  getMemoryPressureLevel(): 'normal' | 'warning' | 'critical' {
    return this.memoryPressureLevel;
  }
}

export const cacheManager = CacheManager.getInstance();

export const createNamespacedCache = (namespace: string, defaultPriority: CachePriority = 'normal') => {
  return {
    set: <T>(key: string, value: T, options: Omit<CacheOptions, 'namespace'> = {}) =>
      cacheManager.set(key, value, { ...options, namespace }),
    
    get: <T>(key: string, options: Omit<CacheOptions, 'namespace'> = {}) =>
      cacheManager.get<T>(key, { ...options, namespace }),
    
    getOrFetch: <T>(
      key: string,
      fetcher: () => Promise<T>,
      options: Omit<CacheOptions & { forceRefresh?: boolean }, 'namespace'> = {}
    ) => cacheManager.getOrFetch(key, fetcher, { ...options, namespace }),
    
    has: (key: string, options: Omit<CacheOptions, 'namespace'> = {}) =>
      cacheManager.has(key, { ...options, namespace }),
    
    delete: (key: string, options: Omit<CacheOptions, 'namespace'> = {}) =>
      cacheManager.delete(key, { ...options, namespace }),
    
    clear: () => cacheManager.clearByNamespace(namespace),
    
    namespace,
    defaultPriority,
  };
};
