// ============================================
// PawSync Pro - IndexedDB 数据库层
// 真实数据持久化，替代所有 mock 数据
// ============================================

const DB_NAME = 'pawsync-db';
const DB_VERSION = 1;

// 数据库表定义
export enum StoreNames {
  USERS = 'users',
  PETS = 'pets',
  ANALYSES = 'analyses',
  HEALTH_ALERTS = 'healthAlerts',
  HEALTH_RECORDS = 'healthRecords',
  BOND_ACTIVITIES = 'bondActivities',
  BADGES = 'badges',
  ACHIEVEMENTS = 'achievements',
  MEMORIES = 'memories',
  VOICE_MEMORIES = 'voiceMemories',
  SETTINGS = 'settings',
  CARE_TIPS = 'careTips',
}

// 数据库接口
interface PawSyncDB extends IDBDatabase {
  // 类型标记
}

// 数据库连接单例
let dbInstance: PawSyncDB | null = null;

// 初始化数据库
export async function initDB(): Promise<PawSyncDB> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result as PawSyncDB;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 用户表
      if (!db.objectStoreNames.contains(StoreNames.USERS)) {
        const userStore = db.createObjectStore(StoreNames.USERS, { keyPath: 'id' });
        userStore.createIndex('email', 'email', { unique: true });
      }

      // 宠物表
      if (!db.objectStoreNames.contains(StoreNames.PETS)) {
        const petStore = db.createObjectStore(StoreNames.PETS, { keyPath: 'id' });
        petStore.createIndex('userId', 'userId', { unique: false });
      }

      // 分析记录表
      if (!db.objectStoreNames.contains(StoreNames.ANALYSES)) {
        const analysisStore = db.createObjectStore(StoreNames.ANALYSES, { keyPath: 'id' });
        analysisStore.createIndex('petId', 'petId', { unique: false });
        analysisStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 健康告警表
      if (!db.objectStoreNames.contains(StoreNames.HEALTH_ALERTS)) {
        const alertStore = db.createObjectStore(StoreNames.HEALTH_ALERTS, { keyPath: 'id' });
        alertStore.createIndex('petId', 'petId', { unique: false });
        alertStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // 健康记录表
      if (!db.objectStoreNames.contains(StoreNames.HEALTH_RECORDS)) {
        const recordStore = db.createObjectStore(StoreNames.HEALTH_RECORDS, { keyPath: 'id' });
        recordStore.createIndex('petId', 'petId', { unique: false });
        recordStore.createIndex('createdAt', 'createdAt', { unique: false });
        recordStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
      }

      // 情感活动表
      if (!db.objectStoreNames.contains(StoreNames.BOND_ACTIVITIES)) {
        const activityStore = db.createObjectStore(StoreNames.BOND_ACTIVITIES, { keyPath: 'id' });
        activityStore.createIndex('petId', 'petId', { unique: false });
        activityStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // 徽章表
      if (!db.objectStoreNames.contains(StoreNames.BADGES)) {
        db.createObjectStore(StoreNames.BADGES, { keyPath: 'id' });
      }

      // 成就表
      if (!db.objectStoreNames.contains(StoreNames.ACHIEVEMENTS)) {
        db.createObjectStore(StoreNames.ACHIEVEMENTS, { keyPath: 'id' });
      }

      // 记忆表
      if (!db.objectStoreNames.contains(StoreNames.MEMORIES)) {
        const memoryStore = db.createObjectStore(StoreNames.MEMORIES, { keyPath: 'id' });
        memoryStore.createIndex('petId', 'petId', { unique: false });
        memoryStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // 语音记忆表
      if (!db.objectStoreNames.contains(StoreNames.VOICE_MEMORIES)) {
        const voiceStore = db.createObjectStore(StoreNames.VOICE_MEMORIES, { keyPath: 'id' });
        voiceStore.createIndex('petId', 'petId', { unique: false });
      }

      // 设置表
      if (!db.objectStoreNames.contains(StoreNames.SETTINGS)) {
        db.createObjectStore(StoreNames.SETTINGS, { keyPath: 'key' });
      }

      // 养宠贴士表
      if (!db.objectStoreNames.contains(StoreNames.CARE_TIPS)) {
        const tipStore = db.createObjectStore(StoreNames.CARE_TIPS, { keyPath: 'id' });
        tipStore.createIndex('category', 'category', { unique: false });
        tipStore.createIndex('petType', 'petType', { unique: false });
      }
    };
  });
}

// 通用 CRUD 操作
export class DBService<T extends { id: string }> {
  private storeName: StoreNames;

  constructor(storeName: StoreNames) {
    this.storeName = storeName;
  }

  private async getStore(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    const db = await initDB();
    const transaction = db.transaction(this.storeName, mode);
    return transaction.objectStore(this.storeName);
  }

  // 创建
  async create(item: Omit<T, 'id'> & { id?: string }): Promise<T> {
    const store = await this.getStore('readwrite');
    const newItem = { ...item, id: item.id || Date.now().toString() } as T;
    
    return new Promise((resolve, reject) => {
      const request = store.add(newItem);
      request.onsuccess = () => resolve(newItem);
      request.onerror = () => reject(request.error);
    });
  }

  // 读取单个
  async get(id: string): Promise<T | null> {
    const store = await this.getStore();
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // 读取全部
  async getAll(): Promise<T[]> {
    const store = await this.getStore();
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // 按索引查询
  async getByIndex(indexName: string, value: IDBValidKey): Promise<T[]> {
    const store = await this.getStore();
    const index = store.index(indexName);
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // 更新
  async update(id: string, updates: Partial<T>): Promise<T> {
    const store = await this.getStore('readwrite');
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        if (!existing) {
          reject(new Error(`Item with id ${id} not found`));
          return;
        }
        const updated = { ...existing, ...updates, id };
        const putRequest = store.put(updated);
        putRequest.onsuccess = () => resolve(updated);
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // 删除
  async delete(id: string): Promise<void> {
    const store = await this.getStore('readwrite');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 清空
  async clear(): Promise<void> {
    const store = await this.getStore('readwrite');
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// 初始化默认数据
export async function initDefaultData(): Promise<void> {
  const db = await initDB();
  
  // 检查是否已经初始化
  const settingsStore = db.transaction(StoreNames.SETTINGS, 'readonly').objectStore(StoreNames.SETTINGS);
  const initCheck = await new Promise<boolean>((resolve) => {
    const request = settingsStore.get('initialized');
    request.onsuccess = () => resolve(!!request.result?.value);
  });

  if (initCheck) return;

  // 初始化默认徽章
  const badgeService = new DBService(StoreNames.BADGES);
  const defaultBadges = [
    {
      id: 'first-translation',
      name: '初次翻译',
      description: '完成第一次宠物情绪翻译',
      icon: '🎤',
      category: 'translation',
      isUnlocked: false,
      requirement: '完成1次翻译'
    },
    {
      id: 'translation-master',
      name: '翻译达人',
      description: '完成30次情绪翻译',
      icon: '🌟',
      category: 'translation',
      isUnlocked: false,
      requirement: '完成30次翻译'
    },
    {
      id: 'training-starter',
      name: '训练新手',
      description: '开始第一个训练课程',
      icon: '🏆',
      category: 'training',
      isUnlocked: false,
      requirement: '开始1门课程'
    },
    {
      id: 'health-guardian',
      name: '健康守护者',
      description: '连续7天进行健康检查',
      icon: '❤️',
      category: 'health',
      isUnlocked: false,
      requirement: '连续7天健康打卡'
    },
    {
      id: 'seven-day-streak',
      name: '七天连续',
      description: '连续使用应用7天',
      icon: '🔥',
      category: 'social',
      isUnlocked: false,
      requirement: '连续使用7天'
    }
  ];

  for (const badge of defaultBadges) {
    await badgeService.create(badge);
  }

  // 初始化默认成就
  const achievementService = new DBService(StoreNames.ACHIEVEMENTS);
  const defaultAchievements = [
    {
      id: 'translation-100',
      name: '翻译百次',
      description: '累计完成100次情绪翻译',
      type: 'milestone',
      progress: 0,
      target: 100,
      isCompleted: false,
      rewardPoints: 500
    },
    {
      id: 'training-10h',
      name: '训练达人',
      description: '累计训练时长达到10小时',
      type: 'milestone',
      progress: 0,
      target: 10,
      isCompleted: false,
      rewardPoints: 300
    },
    {
      id: 'streak-30',
      name: '三十天连续',
      description: '连续使用应用30天',
      type: 'streak',
      progress: 0,
      target: 30,
      isCompleted: false,
      rewardPoints: 1000
    }
  ];

  for (const achievement of defaultAchievements) {
    await achievementService.create(achievement);
  }

  // 初始化默认养宠贴士
  const tipService = new DBService(StoreNames.CARE_TIPS);
  const defaultTips = [
    {
      id: '1',
      category: 'feeding',
      title: '定时定量喂食',
      content: '成年猫每天需要2-3次定时喂食，保持规律的饮食习惯有助于消化系统健康。',
      petType: 'cat',
      priority: 'high'
    },
    {
      id: '2',
      category: 'health',
      title: '定期体检',
      content: '建议每年带宠物进行一次全面体检，及时发现潜在健康问题。',
      petType: 'all',
      priority: 'high'
    },
    {
      id: '3',
      category: 'grooming',
      title: '毛发护理',
      content: '定期梳理毛发可以促进血液循环，减少掉毛和毛球问题。',
      petType: 'cat',
      priority: 'medium'
    },
    {
      id: '4',
      category: 'exercise',
      title: '每日互动玩耍',
      content: '每天花15-30分钟与宠物互动玩耍，保持身心健康和良好的关系。',
      petType: 'all',
      priority: 'high'
    },
    {
      id: '5',
      category: 'behavior',
      title: '观察异常行为',
      content: '注意宠物的行为变化，如食欲不振、过度舔毛等可能是健康问题的信号。',
      petType: 'all',
      priority: 'medium'
    }
  ];

  for (const tip of defaultTips) {
    await tipService.create(tip);
  }

  // 标记已初始化
  const settingsTx = db.transaction(StoreNames.SETTINGS, 'readwrite');
  const settingsStoreWrite = settingsTx.objectStore(StoreNames.SETTINGS);
  await new Promise<void>((resolve, reject) => {
    const request = settingsStoreWrite.put({ key: 'initialized', value: true });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// 导出服务实例
export const userDB = new DBService(StoreNames.USERS);
export const petDB = new DBService(StoreNames.PETS);
export const analysisDB = new DBService(StoreNames.ANALYSES);
export const healthAlertDB = new DBService(StoreNames.HEALTH_ALERTS);
export const healthRecordDB = new DBService(StoreNames.HEALTH_RECORDS);
export const bondActivityDB = new DBService(StoreNames.BOND_ACTIVITIES);
export const badgeDB = new DBService(StoreNames.BADGES);
export const achievementDB = new DBService(StoreNames.ACHIEVEMENTS);
export const memoryDB = new DBService(StoreNames.MEMORIES);
export const voiceMemoryDB = new DBService(StoreNames.VOICE_MEMORIES);
export const careTipDB = new DBService(StoreNames.CARE_TIPS);
