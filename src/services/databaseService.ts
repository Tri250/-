/**
 * DatabaseService - 统一 IndexedDB 数据持久化服务
 *
 * 使用原生 IndexedDB API，支持 12 个 Object Store、通用 CRUD、批量操作和事务
 * 当 IndexedDB 不可用时自动降级到内存 Map
 */

// ─── Store 名称常量 ─────────────────────────────────────────

export const STORE_NAMES = {
  HEALTH_RECORDS: 'health_records',
  HEALTH_METRICS: 'health_metrics',
  HEALTH_ALERTS: 'health_alerts',
  HEALTH_GOALS: 'health_goals',
  EMOTION_ANALYSES: 'emotion_analyses',
  AUDIO_EVENTS: 'audio_events',
  NOTIFICATIONS: 'notifications',
  CAMERA_DEVICES: 'camera_devices',
  RECORDING_SESSIONS: 'recording_sessions',
  CLOUD_FILES: 'cloud_files',
  AI_CONVERSATIONS: 'ai_conversations',
  PET_PROFILES: 'pet_profiles',
  APP_SETTINGS: 'app_settings',
  MEDICAL_RECORDS: 'medical_records',
  VOICE_PROFILES: 'voice_profiles',
  PET_FOOD_ANALYSES: 'pet_food_analyses',
  ALERT_RECORDS: 'alert_records',
  FUSION_RESULTS: 'fusion_results',
  OFFLINE_QUEUE: 'offline_queue',
  EVENTS: 'events',
} as const;

export type StoreName = (typeof STORE_NAMES)[keyof typeof STORE_NAMES];

// ─── Store 定义 ─────────────────────────────────────────────

interface StoreDefinition {
  name: StoreName;
  keyPath: string;
  indexes?: Array<{ name: string; keyPath: string; options?: IDBIndexParameters }>;
}

const STORE_DEFINITIONS: StoreDefinition[] = [
  {
    name: STORE_NAMES.HEALTH_RECORDS,
    keyPath: 'id',
    indexes: [
      { name: 'petId', keyPath: 'petId' },
      { name: 'date', keyPath: 'date' },
    ],
  },
  {
    name: STORE_NAMES.HEALTH_METRICS,
    keyPath: 'id',
    indexes: [
      { name: 'petId', keyPath: 'petId' },
      { name: 'type', keyPath: 'type' },
      { name: 'timestamp', keyPath: 'timestamp' },
    ],
  },
  {
    name: STORE_NAMES.HEALTH_ALERTS,
    keyPath: 'id',
    indexes: [
      { name: 'petId', keyPath: 'petId' },
      { name: 'acknowledged', keyPath: 'acknowledged' },
    ],
  },
  {
    name: STORE_NAMES.HEALTH_GOALS,
    keyPath: 'id',
    indexes: [
      { name: 'petId', keyPath: 'petId' },
    ],
  },
  {
    name: STORE_NAMES.EMOTION_ANALYSES,
    keyPath: 'id',
    indexes: [
      { name: 'petId', keyPath: 'petId' },
      { name: 'createdAt', keyPath: 'createdAt' },
      { name: 'source', keyPath: 'source' },
    ],
  },
  {
    name: STORE_NAMES.AUDIO_EVENTS,
    keyPath: 'id',
    indexes: [
      { name: 'petId', keyPath: 'petId' },
      { name: 'timestamp', keyPath: 'timestamp' },
      { name: 'emotion', keyPath: 'emotion' },
    ],
  },
  {
    name: STORE_NAMES.NOTIFICATIONS,
    keyPath: 'id',
    indexes: [
      { name: 'type', keyPath: 'type' },
      { name: 'read', keyPath: 'read' },
      { name: 'timestamp', keyPath: 'timestamp' },
    ],
  },
  {
    name: STORE_NAMES.CAMERA_DEVICES,
    keyPath: 'id',
    indexes: [
      { name: 'brand', keyPath: 'brand' },
      { name: 'status', keyPath: 'status' },
    ],
  },
  {
    name: STORE_NAMES.RECORDING_SESSIONS,
    keyPath: 'id',
    indexes: [
      { name: 'cameraId', keyPath: 'cameraId' },
      { name: 'status', keyPath: 'status' },
    ],
  },
  {
    name: STORE_NAMES.CLOUD_FILES,
    keyPath: 'id',
    indexes: [
      { name: 'petId', keyPath: 'petId' },
      { name: 'type', keyPath: 'type' },
      { name: 'uploadTime', keyPath: 'uploadTime' },
    ],
  },
  {
    name: STORE_NAMES.AI_CONVERSATIONS,
    keyPath: 'id',
    indexes: [
      { name: 'petId', keyPath: 'petId' },
      { name: 'createdAt', keyPath: 'createdAt' },
    ],
  },
  {
    name: STORE_NAMES.PET_PROFILES,
    keyPath: 'id',
  },
  {
    name: STORE_NAMES.APP_SETTINGS,
    keyPath: 'key',
  },
  {
    name: STORE_NAMES.MEDICAL_RECORDS,
    keyPath: 'id',
    indexes: [
      { name: 'petId', keyPath: 'petId' },
      { name: 'source', keyPath: 'source' },
    ],
  },
  {
    name: STORE_NAMES.VOICE_PROFILES,
    keyPath: 'id',
    indexes: [
      { name: 'petId', keyPath: 'petId' },
      { name: 'source', keyPath: 'source' },
    ],
  },
  {
    name: STORE_NAMES.PET_FOOD_ANALYSES,
    keyPath: 'id',
    indexes: [
      { name: 'petId', keyPath: 'petId' },
      { name: 'source', keyPath: 'source' },
    ],
  },
  {
    name: STORE_NAMES.ALERT_RECORDS,
    keyPath: 'id',
    indexes: [
      { name: 'petId', keyPath: 'petId' },
      { name: 'level', keyPath: 'level' },
    ],
  },
  {
    name: STORE_NAMES.FUSION_RESULTS,
    keyPath: 'id',
    indexes: [
      { name: 'petId', keyPath: 'petId' },
      { name: 'source', keyPath: 'source' },
    ],
  },
  {
    name: STORE_NAMES.OFFLINE_QUEUE,
    keyPath: 'id',
    indexes: [
      { name: 'type', keyPath: 'type' },
      { name: 'createdAt', keyPath: 'createdAt' },
    ],
  },
  {
    name: STORE_NAMES.EVENTS,
    keyPath: 'id',
    indexes: [
      { name: 'cameraId', keyPath: 'cameraId' },
      { name: 'type', keyPath: 'type' },
      { name: 'timestamp', keyPath: 'timestamp' },
      { name: 'acknowledged', keyPath: 'acknowledged' },
    ],
  },
];

// ─── 内存降级存储 ───────────────────────────────────────────

class InMemoryStore {
  private data: Map<string, unknown> = new Map();
  private indexes: Map<string, Map<string, Set<string>>> = new Map();

  setIndexNames(names: string[]): void {
    for (const name of names) {
      this.indexes.set(name, new Map());
    }
  }

  put(item: unknown, keyPath: string): void {
    const key = String((item as Record<string, unknown>)[keyPath]);
    this.data.set(key, item);
    // 更新索引
    for (const [indexName, indexMap] of this.indexes) {
      const indexValue = (item as Record<string, unknown>)[indexName];
      if (indexValue !== undefined) {
        const indexKey = String(indexValue);
        if (!indexMap.has(indexKey)) {
          indexMap.set(indexKey, new Set());
        }
        indexMap.get(indexKey)!.add(key);
      }
    }
  }

  get(key: string): unknown | undefined {
    return this.data.get(key);
  }

  getAll(): unknown[] {
    return Array.from(this.data.values());
  }

  getByIndex(indexName: string, value: unknown): unknown[] {
    const indexMap = this.indexes.get(indexName);
    if (!indexMap) return [];
    const indexKey = String(value);
    const keys = indexMap.get(indexKey);
    if (!keys) return [];
    return Array.from(keys)
      .map((k) => this.data.get(k))
      .filter((v) => v !== undefined);
  }

  delete(key: string): void {
    const item = this.data.get(key);
    if (item) {
      // 清理索引
      for (const [indexName, indexMap] of this.indexes) {
        const indexValue = (item as Record<string, unknown>)[indexName];
        if (indexValue !== undefined) {
          const indexKey = String(indexValue);
          indexMap.get(indexKey)?.delete(key);
        }
      }
    }
    this.data.delete(key);
  }

  clear(): void {
    this.data.clear();
    for (const indexMap of this.indexes.values()) {
      indexMap.clear();
    }
  }

  count(): number {
    return this.data.size;
  }
}

// ─── DatabaseService 类 ─────────────────────────────────────

const DB_NAME = 'pawsync-pro-db';
const DB_VERSION = 3;

class DatabaseService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  private useInMemory = false;
  private inMemoryStores: Map<string, InMemoryStore> = new Map();

  /**
   * 初始化数据库连接
   */
  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._init();
    return this.initPromise;
  }

  private async _init(): Promise<void> {
    // 检测 IndexedDB 是否可用
    if (!this.isIndexedDBAvailable()) {
      console.warn('[DatabaseService] IndexedDB not available, falling back to in-memory storage');
      this.useInMemory = true;
      this.initInMemoryStores();
      return;
    }

    try {
      this.db = await this.openDatabase();
    } catch (error) {
      console.error('[DatabaseService] Failed to open IndexedDB, falling back to in-memory storage:', error);
      this.useInMemory = true;
      this.initInMemoryStores();
    }
  }

  private isIndexedDBAvailable(): boolean {
    try {
      if (typeof indexedDB === 'undefined') return false;
      const testDB = indexedDB.open('__pawsync_test__');
      testDB.onerror = () => false;
      return true;
    } catch {
      return false;
    }
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (_event) => {
        const db = request.result;

        for (const storeDef of STORE_DEFINITIONS) {
          if (!db.objectStoreNames.contains(storeDef.name)) {
            const store = db.createObjectStore(storeDef.name, { keyPath: storeDef.keyPath });

            if (storeDef.indexes) {
              for (const index of storeDef.indexes) {
                store.createIndex(index.name, index.keyPath, index.options);
              }
            }
          }
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };

      request.onblocked = () => {
        reject(new Error('Database upgrade blocked by another connection'));
      };
    });
  }

  private initInMemoryStores(): void {
    for (const storeDef of STORE_DEFINITIONS) {
      const store = new InMemoryStore();
      if (storeDef.indexes) {
        store.setIndexNames(storeDef.indexes.map((i) => i.name));
      }
      this.inMemoryStores.set(storeDef.name, store);
    }
  }

  private ensureInit(): void {
    if (!this.db && !this.useInMemory) {
      throw new Error('[DatabaseService] Database not initialized. Call init() first.');
    }
  }

  private getStoreDef(storeName: StoreName): StoreDefinition {
    const def = STORE_DEFINITIONS.find((d) => d.name === storeName);
    if (!def) {
      throw new Error(`[DatabaseService] Unknown store: ${storeName}`);
    }
    return def;
  }

  // ─── 通用 CRUD ────────────────────────────────────────────

  /**
   * 写入或更新一条记录
   */
  async put<T>(storeName: StoreName, item: T): Promise<T> {
    await this.init();
    this.ensureInit();

    if (this.useInMemory) {
      const store = this.inMemoryStores.get(storeName);
      const def = this.getStoreDef(storeName);
      store!.put(item, def.keyPath);
      return item;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve(item);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 根据 ID 获取一条记录
   */
  async get<T>(storeName: StoreName, id: IDBValidKey): Promise<T | null> {
    await this.init();
    this.ensureInit();

    if (this.useInMemory) {
      const store = this.inMemoryStores.get(storeName);
      const result = store!.get(String(id));
      return (result as T) ?? null;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve((request.result as T) ?? null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取指定 Store 的所有记录
   */
  async getAll<T>(storeName: StoreName): Promise<T[]> {
    await this.init();
    this.ensureInit();

    if (this.useInMemory) {
      const store = this.inMemoryStores.get(storeName);
      return store!.getAll() as T[];
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 根据索引查询记录
   */
  async getByIndex<T>(storeName: StoreName, indexName: string, value: IDBValidKey): Promise<T[]> {
    await this.init();
    this.ensureInit();

    if (this.useInMemory) {
      const store = this.inMemoryStores.get(storeName);
      return store!.getByIndex(indexName, value) as T[];
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);

      if (!store.indexNames.contains(indexName)) {
        reject(new Error(`[DatabaseService] Index "${indexName}" not found in store "${storeName}"`));
        return;
      }

      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 根据 ID 删除一条记录
   */
  async delete(storeName: StoreName, id: IDBValidKey): Promise<void> {
    await this.init();
    this.ensureInit();

    if (this.useInMemory) {
      const store = this.inMemoryStores.get(storeName);
      store!.delete(String(id));
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 清空指定 Store 的所有记录
   */
  async clear(storeName: StoreName): Promise<void> {
    await this.init();
    this.ensureInit();

    if (this.useInMemory) {
      const store = this.inMemoryStores.get(storeName);
      store!.clear();
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取指定 Store 的记录数量
   */
  async count(storeName: StoreName): Promise<number> {
    await this.init();
    this.ensureInit();

    if (this.useInMemory) {
      const store = this.inMemoryStores.get(storeName);
      return store!.count();
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ─── 批量操作 ─────────────────────────────────────────────

  /**
   * 批量写入记录（使用单个事务）
   */
  async putMany<T>(storeName: StoreName, items: T[]): Promise<void> {
    if (items.length === 0) return;

    await this.init();
    this.ensureInit();

    if (this.useInMemory) {
      const store = this.inMemoryStores.get(storeName);
      const def = this.getStoreDef(storeName);
      for (const item of items) {
        store!.put(item, def.keyPath);
      }
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);

      for (const item of items) {
        store.put(item);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
    });
  }

  /**
   * 批量删除记录（使用单个事务）
   */
  async deleteMany(storeName: StoreName, ids: IDBValidKey[]): Promise<void> {
    if (ids.length === 0) return;

    await this.init();
    this.ensureInit();

    if (this.useInMemory) {
      const store = this.inMemoryStores.get(storeName);
      for (const id of ids) {
        store!.delete(String(id));
      }
      return;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);

      for (const id of ids) {
        store.delete(id);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
    });
  }

  // ─── 事务支持 ─────────────────────────────────────────────

  /**
   * 创建跨 Store 事务
   *
   * @param storeNames - 参与事务的 Store 名称列表
   * @param mode - 事务模式：'readonly' 或 'readwrite'
   * @returns IDBTransaction 实例（仅 IndexedDB 可用时返回，内存模式返回 null）
   */
  async transaction(
    storeNames: StoreName[],
    mode: IDBTransactionMode = 'readonly',
  ): Promise<IDBTransaction | null> {
    await this.init();
    this.ensureInit();

    if (this.useInMemory) {
      // 内存模式不支持真实事务，返回 null
      return null;
    }

    return this.db!.transaction(storeNames, mode);
  }

  /**
   * 在事务中执行回调，提供指定 Store 的 ObjectStore 实例
   *
   * @param storeName - Store 名称
   * @param mode - 事务模式
   * @param callback - 接收 ObjectStore 的回调
   */
  async withStore<T>(
    storeName: StoreName,
    mode: IDBTransactionMode,
    callback: (store: IDBObjectStore) => T | Promise<T>,
  ): Promise<T> {
    await this.init();
    this.ensureInit();

    if (this.useInMemory) {
      throw new Error('[DatabaseService] withStore is not supported in in-memory mode');
    }

    const tx = this.db!.transaction(storeName, mode);
    const store = tx.objectStore(storeName);

    const result = await callback(store);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
    });
  }

  // ─── 工具方法 ─────────────────────────────────────────────

  /**
   * 检查是否使用内存降级模式
   */
  isInMemoryMode(): boolean {
    return this.useInMemory;
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.initPromise = null;
  }
}

// 导出单例
export const databaseService = new DatabaseService();
