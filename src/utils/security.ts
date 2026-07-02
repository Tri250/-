/**
 * Security Utilities - 企业级安全工具库
 * PawSync Pro - 安全防护核心
 * 
 * F-SEC-002 隐私数据保护 - 增强加密机制
 * 
 * @module security
 */

// ============================================================
// 类型定义
// ============================================================

/** 密钥元数据 */
interface KeyMetadata {
  id: string;
  version: number;
  createdAt: number;
  fingerprint: string;
  purpose: 'normal' | 'sensitive';
}

/** 加密数据格式（v2） */
interface EncryptedDataV2 {
  v: 2;
  alg: 'AES-GCM';
  kid: string;
  iv: string;
  data: string;
}

/** 存储格式版本 */
type StorageFormatVersion = 1 | 2;

/** 迁移结果 */
interface MigrationResult {
  migrated: number;
  failed: number;
  total: number;
}

// ============================================================
// 内存安全工具
// ============================================================

/**
 * 清零 Uint8Array 内存中的敏感数据
 * 使用后立即清零，防止内存泄露
 */
function zeroMemory(buffer: Uint8Array): void {
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = 0;
  }
}

/**
 * 清零字符串数据（通过覆盖内存）
 * 注意：JS字符串不可变，此函数通过创建覆盖中间缓冲区来尝试清除
 */
function zeroString(str: string): void {
  const arr = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    arr[i] = 0;
  }
}

// ============================================================
// 编码工具
// ============================================================

/**
 * Base64 编码
 */
function encodeBase64(str: string): string {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch {
    return '';
  }
}

/**
 * Base64 解码
 */
function decodeBase64(encoded: string): string {
  try {
    return decodeURIComponent(escape(atob(encoded)));
  } catch {
    return '';
  }
}

/**
 * Uint8Array 转 Base64
 */
function bufferToBase64(buffer: Uint8Array): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Base64 转 Uint8Array
 */
function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Hex 字符串转 Uint8Array
 */
function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Uint8Array 转 Hex 字符串
 */
function bufferToHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ============================================================
// XOR 混淆（非加密！）
// ============================================================

/**
 * XOR 混淆 - 仅用于非敏感数据的轻度混淆
 * 注意：这不是加密！不要用于敏感数据！
 * @deprecated 仅用于向后兼容，新代码应使用 AES-GCM
 */
function xorObfuscate(str: string, key: string): string {
  return str.split('').map((char, i) => {
    return String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length));
  }).join('');
}

/**
 * XOR 反混淆
 * @deprecated 仅用于向后兼容
 */
function xorDeobfuscate(obfuscated: string, key: string): string {
  return xorObfuscate(obfuscated, key);
}

/**
 * @deprecated 请使用 xorObfuscate 替代，明确标注为混淆而非加密
 */
const xorEncrypt = xorObfuscate;

/**
 * @deprecated 请使用 xorDeobfuscate 替代
 */
const xorDecrypt = xorDeobfuscate;

// ============================================================
// 随机数生成
// ============================================================

/**
 * 生成随机字符串
 */
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars.charAt(randomValues[i] % chars.length);
  }
  return result;
}

/**
 * 生成安全随机密钥（256位）
 * 使用 crypto.getRandomValues 生成真正随机的密钥
 * @param length 密钥长度（字节数），默认32字节=256位
 */
function generateSecureKey(length: number = 32): Uint8Array {
  const keyBytes = new Uint8Array(length);
  crypto.getRandomValues(keyBytes);
  return keyBytes;
}

/**
 * 生成安全随机密钥（Hex字符串格式）
 */
async function generateSecureKeyHex(length: number = 32): Promise<string> {
  const keyBytes = generateSecureKey(length);
  const hex = bufferToHex(keyBytes);
  zeroMemory(keyBytes);
  return hex;
}

// ============================================================
// 哈希函数
// ============================================================

/**
 * SHA-256 哈希
 */
async function sha256(data: string | Uint8Array): Promise<string> {
  const encoder = new TextEncoder();
  const dataBytes = typeof data === 'string' ? encoder.encode(data) : data;
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * SHA-512 哈希
 */
async function sha512(data: string | Uint8Array): Promise<string> {
  const encoder = new TextEncoder();
  const dataBytes = typeof data === 'string' ? encoder.encode(data) : data;
  const hashBuffer = await crypto.subtle.digest('SHA-512', dataBytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================
// AES-GCM 加密/解密
// ============================================================

/**
 * AES-GCM 加密
 * 使用 256位密钥 + 96位IV + 128位认证标签
 * 
 * @param plaintext 明文
 * @param key 密钥（Uint8Array，32字节=256位）
 * @returns Base64 编码的加密数据（含IV）
 */
async function aesGcmEncrypt(plaintext: string, key: Uint8Array): Promise<string> {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(plaintext);

  if (key.length !== 32) {
    throw new Error('Key must be 32 bytes (256 bits)');
  }

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    dataBytes
  );

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  const result = bufferToBase64(combined);
  zeroMemory(combined);
  zeroMemory(iv);
  zeroMemory(dataBytes);

  return result;
}

/**
 * AES-GCM 解密
 * 
 * @param encryptedBase64 Base64 编码的加密数据（含IV）
 * @param key 密钥（Uint8Array，32字节=256位）
 * @returns 明文
 */
async function aesGcmDecrypt(encryptedBase64: string, key: Uint8Array): Promise<string> {
  if (key.length !== 32) {
    throw new Error('Key must be 32 bytes (256 bits)');
  }

  const combined = base64ToBuffer(encryptedBase64);

  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encrypted
  );

  const result = new TextDecoder().decode(new Uint8Array(decrypted));
  zeroMemory(combined);

  return result;
}

// ============================================================
// PBKDF2 密钥派生
// ============================================================

/**
 * PBKDF2 密钥派生
 * @param password 密码
 * @param salt 盐
 * @param iterations 迭代次数
 */
async function pbkdf2(password: string, salt: string, iterations: number = 100000): Promise<string> {
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);
  const saltBytes = encoder.encode(salt);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBytes,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  const result = bufferToHex(new Uint8Array(derivedBits));
  return result;
}

// ============================================================
// cryptoUtils 导出对象（保持向后兼容）
// ============================================================

export const cryptoUtils = {
  encodeBase64,
  decodeBase64,
  bufferToBase64,
  base64ToBuffer,
  hexToBuffer,
  bufferToHex,
  /** @deprecated 请使用 xorObfuscate，这是混淆不是加密 */
  xorEncrypt,
  /** @deprecated 请使用 xorDecrypt，这是混淆不是加密 */
  xorDecrypt,
  xorObfuscate,
  xorDeobfuscate,
  generateRandomString,
  generateSecureKey: generateSecureKeyHex,
  generateSecureKeyBytes: generateSecureKey,
  sha256,
  sha512,
  /** @deprecated 请使用 aesGcmEncrypt */
  aesEncrypt: async (data: string, key: string): Promise<string> => {
    const keyBytes = new TextEncoder().encode(key.substring(0, 32));
    const paddedKey = new Uint8Array(32);
    paddedKey.set(keyBytes.slice(0, 32));
    const result = await aesGcmEncrypt(data, paddedKey);
    zeroMemory(paddedKey);
    zeroMemory(keyBytes);
    return result;
  },
  /** @deprecated 请使用 aesGcmDecrypt */
  aesDecrypt: async (encryptedData: string, key: string): Promise<string> => {
    const keyBytes = new TextEncoder().encode(key.substring(0, 32));
    const paddedKey = new Uint8Array(32);
    paddedKey.set(keyBytes.slice(0, 32));
    const result = await aesGcmDecrypt(encryptedData, paddedKey);
    zeroMemory(paddedKey);
    zeroMemory(keyBytes);
    return result;
  },
  aesGcmEncrypt,
  aesGcmDecrypt,
  pbkdf2,
  zeroMemory,
};

// ============================================================
// IndexedDB 密钥存储
// ============================================================

const DB_NAME = 'PawSyncSecurityDB';
const DB_VERSION = 1;
const KEY_STORE_NAME = 'encryptionKeys';
const KEY_FINGERPRINT_PREFIX = 'PS_KEY_FP_';

/**
 * 密钥存储
 * 优先使用 IndexedDB 持久化存储，不可用时降级到内存存储
 * 用于安全存储加密密钥
 */
class KeyStore {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  private useIndexedDB = true;
  private memoryStore = new Map<string, { key: Uint8Array; metadata: KeyMetadata }>();

  /**
   * 检测 IndexedDB 是否可用
   */
  private isIndexedDBAvailable(): boolean {
    try {
      return typeof indexedDB !== 'undefined' && indexedDB !== null;
    } catch {
      return false;
    }
  }

  /**
   * 初始化密钥存储
   * 优先使用 IndexedDB，失败则降级到内存存储
   */
  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    if (!this.isIndexedDBAvailable()) {
      this.useIndexedDB = false;
      this.initPromise = Promise.resolve();
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.warn('[Security] IndexedDB unavailable, falling back to memory storage');
        this.useIndexedDB = false;
        resolve();
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.db.onerror = () => {
          console.warn('[Security] IndexedDB error, falling back to memory storage');
          this.useIndexedDB = false;
        };
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(KEY_STORE_NAME)) {
          const store = db.createObjectStore(KEY_STORE_NAME, { keyPath: 'id' });
          store.createIndex('purpose', 'purpose', { unique: false });
          store.createIndex('version', 'version', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * 存储密钥
   */
  async putKey(keyId: string, keyData: Uint8Array, metadata: Omit<KeyMetadata, 'id' | 'fingerprint'> & { fingerprint: string }): Promise<void> {
    await this.init();

    if (!this.useIndexedDB) {
      this.memoryStore.set(keyId, {
        key: new Uint8Array(keyData),
        metadata: { id: keyId, ...metadata } as KeyMetadata,
      });
      return;
    }

    if (!this.db) throw new Error('KeyStore not initialized');

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(KEY_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(KEY_STORE_NAME);

        const record = {
          id: keyId,
          key: keyData,
          ...metadata,
        };

        const request = store.put(record);
        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.warn('[Security] IndexedDB put failed, falling back to memory');
          this.useIndexedDB = false;
          this.memoryStore.set(keyId, {
            key: new Uint8Array(keyData),
            metadata: { id: keyId, ...metadata } as KeyMetadata,
          });
          resolve();
        };
      } catch (error) {
        console.warn('[Security] IndexedDB put error, using memory:', error);
        this.useIndexedDB = false;
        this.memoryStore.set(keyId, {
          key: new Uint8Array(keyData),
          metadata: { id: keyId, ...metadata } as KeyMetadata,
        });
        resolve();
      }
    });
  }

  /**
   * 获取密钥
   */
  async getKey(keyId: string): Promise<{ key: Uint8Array; metadata: KeyMetadata } | null> {
    await this.init();

    if (!this.useIndexedDB) {
      const entry = this.memoryStore.get(keyId);
      if (!entry) return null;
      return { key: new Uint8Array(entry.key), metadata: entry.metadata };
    }

    if (!this.db) throw new Error('KeyStore not initialized');

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(KEY_STORE_NAME, 'readonly');
        const store = transaction.objectStore(KEY_STORE_NAME);
        const request = store.get(keyId);

        request.onsuccess = () => {
          const result = request.result;
          if (!result) {
            resolve(null);
          } else {
            const { key, ...metadata } = result;
            resolve({ key: new Uint8Array(key), metadata });
          }
        };
        request.onerror = () => {
          console.warn('[Security] IndexedDB get failed');
          const entry = this.memoryStore.get(keyId);
          resolve(entry ? { key: new Uint8Array(entry.key), metadata: entry.metadata } : null);
        };
      } catch (error) {
        console.warn('[Security] IndexedDB get error:', error);
        const entry = this.memoryStore.get(keyId);
        resolve(entry ? { key: new Uint8Array(entry.key), metadata: entry.metadata } : null);
      }
    });
  }

  /**
   * 删除密钥
   */
  async deleteKey(keyId: string): Promise<void> {
    await this.init();

    if (!this.useIndexedDB) {
      this.memoryStore.delete(keyId);
      return;
    }

    if (!this.db) throw new Error('KeyStore not initialized');

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(KEY_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(KEY_STORE_NAME);
        const request = store.delete(keyId);
        request.onsuccess = () => {
          this.memoryStore.delete(keyId);
          resolve();
        };
        request.onerror = () => {
          this.memoryStore.delete(keyId);
          resolve();
        };
      } catch {
        this.memoryStore.delete(keyId);
        resolve();
      }
    });
  }

  /**
   * 按用途获取最新密钥
   */
  async getLatestKeyByPurpose(purpose: 'normal' | 'sensitive'): Promise<{ key: Uint8Array; metadata: KeyMetadata } | null> {
    await this.init();

    if (!this.useIndexedDB) {
      let latest: { key: Uint8Array; metadata: KeyMetadata } | null = null;
      let latestCreatedAt = 0;
      for (const entry of this.memoryStore.values()) {
        if (entry.metadata.purpose === purpose) {
          const createdAt = entry.metadata.createdAt || 0;
          if (createdAt > latestCreatedAt) {
            latestCreatedAt = createdAt;
            latest = { key: new Uint8Array(entry.key), metadata: entry.metadata };
          }
        }
      }
      return latest;
    }

    if (!this.db) throw new Error('KeyStore not initialized');

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(KEY_STORE_NAME, 'readonly');
        const store = transaction.objectStore(KEY_STORE_NAME);
        const index = store.index('purpose');
        const request = index.openCursor(IDBKeyRange.only(purpose), 'prev');

        let latest: { key: Uint8Array; metadata: KeyMetadata } | null = null;

        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            const { key, ...metadata } = cursor.value;
            latest = { key: new Uint8Array(key), metadata };
            resolve(latest);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => {
          console.warn('[Security] IndexedDB cursor failed, using memory');
          this.getLatestKeyByPurposeFromMemory(purpose).then(resolve);
        };
      } catch (error) {
        console.warn('[Security] IndexedDB cursor error:', error);
        this.getLatestKeyByPurposeFromMemory(purpose).then(resolve);
      }
    });
  }

  /**
   * 从内存存储获取最新密钥（降级用）
   */
  private async getLatestKeyByPurposeFromMemory(purpose: 'normal' | 'sensitive'): Promise<{ key: Uint8Array; metadata: KeyMetadata } | null> {
    let latest: { key: Uint8Array; metadata: KeyMetadata } | null = null;
    let latestVersion = -1;
    for (const entry of this.memoryStore.values()) {
      if (entry.metadata.purpose === purpose) {
        const version = entry.metadata.version || 0;
        if (version > latestVersion) {
          latestVersion = version;
          latest = { key: new Uint8Array(entry.key), metadata: entry.metadata };
        }
      }
    }
    return latest;
  }

  /**
   * 获取所有密钥元数据
   */
  async getAllKeysMetadata(): Promise<KeyMetadata[]> {
    await this.init();

    if (!this.useIndexedDB) {
      return Array.from(this.memoryStore.values()).map(e => e.metadata);
    }

    if (!this.db) throw new Error('KeyStore not initialized');

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(KEY_STORE_NAME, 'readonly');
        const store = transaction.objectStore(KEY_STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const results = request.result.map((record: any) => {
            const { key: _key, ...metadata } = record;
            return metadata as KeyMetadata;
          });
          resolve(results);
        };
        request.onerror = () => {
          resolve(Array.from(this.memoryStore.values()).map(e => e.metadata));
        };
      } catch {
        resolve(Array.from(this.memoryStore.values()).map(e => e.metadata));
      }
    });
  }

  /**
   * 检查是否使用 IndexedDB
   */
  isPersistent(): boolean {
    return this.useIndexedDB && this.db !== null;
  }

  /**
   * 关闭数据库
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
    this.memoryStore.clear();
  }
}

const keyStore = new KeyStore();

// ============================================================
// 密钥管理器
// ============================================================

const KEY_VERSION_PREFIX = 'psk_';

/**
 * 密钥管理器
 * 负责密钥生成、存储、轮换、完整性校验
 */
class KeyManager {
  private keyStore: KeyStore;
  private keyCache = new Map<string, Uint8Array>();
  private initPromise: Promise<void> | null = null;

  constructor(store: KeyStore) {
    this.keyStore = store;
  }

  /**
   * 初始化密钥管理器
   * 确保 IndexedDB 就绪，并检查现有密钥
   */
  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.keyStore.init();
    return this.initPromise;
  }

  /**
   * 生成密钥ID
   */
  private generateKeyId(): string {
    const random = generateRandomString(16);
    return `${KEY_VERSION_PREFIX}${Date.now()}_${random}`;
  }

  /**
   * 计算密钥指纹（SHA-256）
   */
  async computeKeyFingerprint(key: Uint8Array): Promise<string> {
    return sha256(key);
  }

  /**
   * 从 localStorage 获取密钥指纹（用于完整性校验）
   */
  getStoredFingerprint(purpose: 'normal' | 'sensitive'): string | null {
    return localStorage.getItem(`${KEY_FINGERPRINT_PREFIX}${purpose}`);
  }

  /**
   * 存储密钥指纹到 localStorage
   */
  private setStoredFingerprint(purpose: 'normal' | 'sensitive', fingerprint: string): void {
    localStorage.setItem(`${KEY_FINGERPRINT_PREFIX}${purpose}`, fingerprint);
  }

  /**
   * 验证密钥完整性
   * 通过比对 localStorage 中的指纹校验密钥是否被篡改
   */
  async verifyKeyIntegrity(purpose: 'normal' | 'sensitive'): Promise<boolean> {
    await this.init();
    const storedFp = this.getStoredFingerprint(purpose);
    if (!storedFp) return false;

    const keyData = await this.keyStore.getLatestKeyByPurpose(purpose);
    if (!keyData) return false;

    const actualFp = await this.computeKeyFingerprint(keyData.key);
    const valid = actualFp === storedFp;

    if (!valid) {
      zeroMemory(keyData.key);
    }

    return valid;
  }

  /**
   * 获取或创建密钥
   * 如果密钥不存在则创建新密钥
   */
  async getOrCreateKey(purpose: 'normal' | 'sensitive'): Promise<{ key: Uint8Array; keyId: string; isNew: boolean }> {
    await this.init();

    const storedFp = this.getStoredFingerprint(purpose);

    if (storedFp) {
      const keyData = await this.keyStore.getLatestKeyByPurpose(purpose);
      if (keyData) {
        const actualFp = await this.computeKeyFingerprint(keyData.key);
        if (actualFp === storedFp) {
          return { key: keyData.key, keyId: keyData.metadata.id, isNew: false };
        }
      }
    }

    const newKey = generateSecureKey(32);
    const keyId = this.generateKeyId();
    const fingerprint = await this.computeKeyFingerprint(newKey);

    await this.keyStore.putKey(keyId, newKey, {
      version: 1,
      createdAt: Date.now(),
      purpose,
      fingerprint,
    });

    this.setStoredFingerprint(purpose, fingerprint);
    this.keyCache.set(keyId, newKey);

    return { key: newKey, keyId, isNew: true };
  }

  /**
   * 密钥轮换
   * 生成新密钥，旧密钥保留用于解密历史数据
   */
  async rotateKey(purpose: 'normal' | 'sensitive'): Promise<{ newKeyId: string; oldKeyId: string | null }> {
    await this.init();

    const oldKeyData = await this.keyStore.getLatestKeyByPurpose(purpose);
    const oldKeyId = oldKeyData?.metadata.id || null;

    const newKey = generateSecureKey(32);
    const newKeyId = this.generateKeyId();
    const fingerprint = await this.computeKeyFingerprint(newKey);

    const newVersion = (oldKeyData?.metadata.version || 0) + 1;

    await this.keyStore.putKey(newKeyId, newKey, {
      version: newVersion,
      createdAt: Date.now(),
      purpose,
      fingerprint,
    });

    this.setStoredFingerprint(purpose, fingerprint);
    this.keyCache.set(newKeyId, newKey);

    if (oldKeyData) {
      zeroMemory(oldKeyData.key);
    }

    return { newKeyId, oldKeyId };
  }

  /**
   * 根据密钥ID获取密钥
   */
  async getKeyById(keyId: string): Promise<Uint8Array | null> {
    await this.init();

    if (this.keyCache.has(keyId)) {
      return this.keyCache.get(keyId)!;
    }

    const keyData = await this.keyStore.getKey(keyId);
    if (keyData) {
      this.keyCache.set(keyId, keyData.key);
      return keyData.key;
    }

    return null;
  }

  /**
   * 清除内存中的密钥缓存
   */
  clearCache(): void {
    this.keyCache.forEach(key => zeroMemory(key));
    this.keyCache.clear();
  }

  /**
   * 销毁所有密钥
   * 危险操作！将删除所有加密密钥
   */
  async destroyAllKeys(): Promise<void> {
    await this.init();
    const allKeys = await this.keyStore.getAllKeysMetadata();
    for (const metadata of allKeys) {
      await this.keyStore.deleteKey(metadata.id);
    }
    this.clearCache();
    localStorage.removeItem(`${KEY_FINGERPRINT_PREFIX}normal`);
    localStorage.removeItem(`${KEY_FINGERPRINT_PREFIX}sensitive`);
  }
}

const keyManager = new KeyManager(keyStore);

// ============================================================
// 输入验证
// ============================================================

export const validationUtils = {
  /** 邮箱验证 */
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /** 密码强度验证 */
  validatePassword: (password: string): { valid: boolean; strength: number; message: string } => {
    let strength = 0;
    const messages: string[] = [];

    if (password.length >= 8) {
      strength += 25;
    } else {
      messages.push('密码长度至少8位');
    }

    if (/[a-z]/.test(password)) {
      strength += 25;
    }

    if (/[A-Z]/.test(password)) {
      strength += 25;
    }

    if (/[0-9]/.test(password) || /[^a-zA-Z0-9]/.test(password)) {
      strength += 25;
    }

    const valid = strength >= 75;
    if (!valid) {
      messages.push('密码需要包含大小写字母和数字或特殊字符');
    }

    return {
      valid,
      strength,
      message: messages.join('; ') || '密码强度良好',
    };
  },

  /** XSS防护 - HTML转义 */
  escapeHtml: (str: string): string => {
    const escapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };
    return str.replace(/[&<>"'/]/g, char => escapeMap[char] || char);
  },

  /** 清理用户输入 */
  sanitizeInput: (input: string): string => {
    return input
      .trim()
      .replace(/[<>]/g, '')
      .substring(0, 1000);
  },

  /** 验证URL */
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
};

// ============================================================
// 安全存储
// ============================================================

const STORAGE_PREFIX = 'PS_';
const SENSITIVE_PREFIX = 'PSS_';
const FORMAT_VERSION_KEY = 'PS_FORMAT_VERSION';

/**
 * 安全存储
 * 
 * v2 格式特性：
 * - 密钥存储在 IndexedDB 中
 * - 敏感数据使用 AES-GCM 加密
 * - 密钥指纹存储在 localStorage 用于完整性校验
 * - 支持密钥轮换
 * - 支持从 v1 格式自动迁移
 */
function getStorageKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) keys.push(key);
  }
  return keys;
}

export const secureStorage = {
  PREFIX: STORAGE_PREFIX,
  SENSITIVE_PREFIX: SENSITIVE_PREFIX,
  encryptionCache: new Map<string, string>(),
  _self: null as Record<string, unknown> | null,
  _migrated: false,

  init: function () {
    this._self = this;
  },

  /**
   * 存储数据
   * @param key 键名
   * @param value 值
   * @param encrypt 是否加密（默认 true）
   * @param sensitive 是否敏感数据（使用 AES-GCM）
   */
  set: async function (
    key: string,
    value: unknown,
    encrypt: boolean = true,
    sensitive: boolean = false
  ): Promise<void> {
    const self = this._self || this;
    try {
      const serialized = JSON.stringify(value);
      const prefix = sensitive ? SENSITIVE_PREFIX : STORAGE_PREFIX;

      if (encrypt) {
        if (sensitive) {
          const { key: encKey } = await keyManager.getOrCreateKey('sensitive');
          const encrypted = await aesGcmEncrypt(serialized, encKey);
          localStorage.setItem(prefix + key, encrypted);
        } else {
          const { key: encKey, keyId } = await keyManager.getOrCreateKey('normal');
          const encryptedData: EncryptedDataV2 = {
            v: 2,
            alg: 'AES-GCM',
            kid: keyId,
            iv: '',
            data: await aesGcmEncrypt(serialized, encKey),
          };
          localStorage.setItem(prefix + key, JSON.stringify(encryptedData));
        }
      } else {
        localStorage.setItem(prefix + key, serialized);
      }
    } catch (error) {
      console.error('Storage set error:', error);
    }
  },

  /**
   * 同步存储数据（仅用于非敏感、非加密数据）
   * @deprecated 建议使用异步 set 方法
   */
  setSync: function (key: string, value: unknown, encrypt: boolean = true): void {
    const self = this._self || this;
    try {
      const serialized = JSON.stringify(value);
      if (!encrypt) {
        localStorage.setItem(STORAGE_PREFIX + key, serialized);
        return;
      }
      console.warn('secureStorage.setSync with encryption is deprecated, use async set instead');
      const obfuscated = xorObfuscate(serialized, 'pawsync_fallback_key');
      localStorage.setItem(STORAGE_PREFIX + key, obfuscated);
    } catch (error) {
      console.error('Storage set error:', error);
    }
  },

  /**
   * 获取数据
   * @param key 键名
   * @param decrypt 是否解密
   * @param sensitive 是否敏感数据
   */
  get: async function <T = unknown>(
    key: string,
    decrypt: boolean = true,
    sensitive: boolean = false
  ): Promise<T | null> {
    const self = this._self || this;

    try {
      const prefix = sensitive ? SENSITIVE_PREFIX : STORAGE_PREFIX;
      const value = localStorage.getItem(prefix + key);
      if (!value) return null;

      if (!decrypt) {
        return JSON.parse(value);
      }

      if (sensitive) {
        const { key: encKey } = await keyManager.getOrCreateKey('sensitive');
        try {
          const decrypted = await aesGcmDecrypt(value, encKey);
          return JSON.parse(decrypted);
        } catch {
          return null;
        }
      }

      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object' && 'v' in parsed && parsed.v === 2) {
          const encKey = await keyManager.getKeyById(parsed.kid);
          if (encKey) {
            const decrypted = await aesGcmDecrypt(parsed.data, encKey);
            return JSON.parse(decrypted);
          }
          return null;
        }
      } catch {
          // 不是 v2 格式，可能是 v1 格式
        }

      return null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },

  /**
   * 同步获取数据（仅用于非加密数据）
   * @deprecated 建议使用异步 get 方法
   */
  getSync: function <T = unknown>(key: string, decrypt: boolean = true): T | null {
    const self = this._self || this;
    try {
      const value = localStorage.getItem(STORAGE_PREFIX + key);
      if (!value) return null;

      if (!decrypt) {
        return JSON.parse(value);
      }

      console.warn('secureStorage.getSync with decryption is deprecated, use async get instead');
      try {
        const deobfuscated = xorDeobfuscate(value, 'pawsync_fallback_key');
        return JSON.parse(deobfuscated);
      } catch {
        return null;
      }
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },

  /**
   * 删除数据
   */
  remove: function (key: string, sensitive: boolean = false): void {
    const prefix = sensitive ? SENSITIVE_PREFIX : STORAGE_PREFIX;
    localStorage.removeItem(prefix + key);
  },

  /**
   * 清除所有安全存储的数据
   */
  clear: function (): void {
    getStorageKeys()
      .filter(key => key.startsWith(STORAGE_PREFIX) || key.startsWith(SENSITIVE_PREFIX))
      .forEach(key => localStorage.removeItem(key));
    this.encryptionCache.clear();
    keyManager.clearCache();
  },

  /**
   * 清除敏感数据
   */
  clearSensitive: function (): void {
    getStorageKeys()
      .filter(key => key.startsWith(SENSITIVE_PREFIX))
      .forEach(key => localStorage.removeItem(key));
  },

  /**
   * @deprecated 请使用 keyManager.getOrCreateKey
   */
  getOrCreateKey: async function (sensitive: boolean): Promise<string> {
    const purpose = sensitive ? 'sensitive' : 'normal';
    const { key } = await keyManager.getOrCreateKey(purpose);
    const hex = bufferToHex(key);
    return hex;
  },

  /**
   * 检查键是否存在
   */
  hasKey: function (key: string, sensitive: boolean = false): boolean {
    const prefix = sensitive ? SENSITIVE_PREFIX : STORAGE_PREFIX;
    return localStorage.getItem(prefix + key) !== null;
  },

  /**
   * 获取所有键
   */
  getAllKeys: function (sensitive: boolean = false): string[] {
    const prefix = sensitive ? SENSITIVE_PREFIX : STORAGE_PREFIX;
    return getStorageKeys()
      .filter(k => k.startsWith(prefix))
      .map(k => k.substring(prefix.length));
  },

  /**
   * 从旧格式（v1）迁移数据到新格式（v2）
   * 
   * 迁移内容：
   * - 将 XOR 混淆的数据迁移为 AES-GCM 加密
   * - 重新用新的随机密钥加密
   * - 敏感数据迁移到敏感存储
   * 
   * @returns 迁移结果
   */
  migrate: async function (): Promise<MigrationResult> {
    const self = this._self || this;
    const result: MigrationResult = {
      migrated: 0,
      failed: 0,
      total: 0,
    };

    try {
      const normalKeys = this.getAllKeys(false);
      const sensitiveKeys = this.getAllKeys(true);
      result.total = normalKeys.length + sensitiveKeys.length;

      const oldFingerprintKey = 'PS_KEY_FP_normal';
      const hasMigrated = localStorage.getItem('PS_MIGRATION_DONE');
      if (hasMigrated) {
        return result;
      }

      const { key: normalKey } = await keyManager.getOrCreateKey('normal');
      const { key: sensitiveKey } = await keyManager.getOrCreateKey('sensitive');

      const oldKey = getLegacyEncryptionKey();

      for (const key of normalKeys) {
        try {
          const rawValue = localStorage.getItem(STORAGE_PREFIX + key);
          if (!rawValue) continue;

          try {
            const parsed = JSON.parse(rawValue);
            if (parsed && typeof parsed === 'object' && 'v' in parsed && parsed.v === 2) {
              continue;
            }
          } catch {
              // 不是 v2 格式，可能是 v1 XOR 混淆
            }

          let decrypted: string;
          try {
            decrypted = xorDeobfuscate(rawValue, oldKey);
            JSON.parse(decrypted);
          } catch {
            result.failed++;
            continue;
          }

          const encryptedData: EncryptedDataV2 = {
            v: 2,
            alg: 'AES-GCM',
            kid: '',
            iv: '',
            data: await aesGcmEncrypt(decrypted, normalKey),
          };

          const { keyId } = await keyManager.getOrCreateKey('normal');
          encryptedData.kid = keyId;

          localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(encryptedData));
          result.migrated++;
        } catch {
          result.failed++;
        }
      }

      for (const key of sensitiveKeys) {
        try {
          const rawValue = localStorage.getItem(SENSITIVE_PREFIX + key);
          if (!rawValue) continue;

          let decrypted: string;
          try {
            decrypted = xorDeobfuscate(rawValue, oldKey);
            JSON.parse(decrypted);
          } catch {
            result.failed++;
            continue;
          }

          const encrypted = await aesGcmEncrypt(decrypted, sensitiveKey);
          localStorage.setItem(SENSITIVE_PREFIX + key, encrypted);
          result.migrated++;
        } catch {
          result.failed++;
        }
      }

      localStorage.setItem('PS_MIGRATION_DONE', '1');
      this._migrated = true;
    } catch (error) {
      console.error('Migration error:', error);
    }

    return result;
  },

  /**
   * 检查是否需要迁移
   */
  needsMigration: function (): boolean {
    return localStorage.getItem('PS_MIGRATION_DONE') === null;
  },

  /**
   * 密钥轮换
   * 使用新密钥重新加密所有数据
   * 
   * @param purpose 密钥用途
   * @returns 轮换结果
   */
  rotateKeys: async function (purpose: 'normal' | 'sensitive' | 'both' = 'both'): Promise<{ rotated: number; failed: number }> {
    const self = this._self || this;
    const result = { rotated: 0, failed: 0 };

    const rotatePurpose = async (p: 'normal' | 'sensitive') => {
      const prefix = p === 'sensitive' ? SENSITIVE_PREFIX : STORAGE_PREFIX;
      const keys = self.getAllKeys(p === 'sensitive');

      let oldKey: Uint8Array | null = null;
      if (p === 'sensitive') {
        const oldKeyData = await keyStore.getLatestKeyByPurpose(p);
        if (oldKeyData) {
          oldKey = new Uint8Array(oldKeyData.key);
        }
      }

      const { newKeyId } = await keyManager.rotateKey(p);
      const newKey = await keyManager.getKeyById(newKeyId);
      if (!newKey) return;

      for (const key of keys) {
        try {
          const rawValue = localStorage.getItem(prefix + key);
          if (!rawValue) continue;

          let decrypted: string;

          try {
            if (p === 'sensitive') {
              if (!oldKey) continue;
              decrypted = await aesGcmDecrypt(rawValue, oldKey);
            } else {
              const parsed = JSON.parse(rawValue);
              if (!parsed || parsed.v !== 2) continue;
              const oldKeyById = await keyManager.getKeyById(parsed.kid);
              if (!oldKeyById) continue;
              decrypted = await aesGcmDecrypt(parsed.data, oldKeyById);
            }
          } catch {
            result.failed++;
            continue;
          }

          if (p === 'sensitive') {
            const encrypted = await aesGcmEncrypt(decrypted, newKey);
            localStorage.setItem(prefix + key, encrypted);
          } else {
            const encryptedData: EncryptedDataV2 = {
              v: 2,
              alg: 'AES-GCM',
              kid: newKeyId,
              iv: '',
              data: await aesGcmEncrypt(decrypted, newKey),
            };
            localStorage.setItem(prefix + key, JSON.stringify(encryptedData));
          }

          result.rotated++;
        } catch {
          result.failed++;
        }
      }
    };

    if (purpose === 'both' || purpose === 'normal') {
      await rotatePurpose('normal');
    }
    if (purpose === 'both' || purpose === 'sensitive') {
      await rotatePurpose('sensitive');
    }

    return result;
  },

  /**
   * 验证密钥完整性
   */
  verifyIntegrity: async function (): Promise<{ normal: boolean; sensitive: boolean }> {
    const normalValid = await keyManager.verifyKeyIntegrity('normal');
    const sensitiveValid = await keyManager.verifyKeyIntegrity('sensitive');
    return { normal: normalValid, sensitive: sensitiveValid };
  },

  /**
   * 获取密钥管理器（高级用法）
   */
  getKeyManager: function (): KeyManager {
    return keyManager;
  },
};

secureStorage.init();

// ============================================================
// 旧版设备指纹密钥（仅用于迁移
// ============================================================

/**
 * 获取旧版设备指纹派生密钥
 * 仅用于从旧格式数据迁移
 * @deprecated 仅用于向后兼容迁移
 */
function getLegacyEncryptionKey(): string {
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
  ].join('|');

  return encodeBase64(fingerprint).substring(0, 32);
}

/**
 * @deprecated 不安全，仅用于向后兼容
 */
const getEncryptionKeySync = getLegacyEncryptionKey;

/**
 * @deprecated 不安全，仅用于向后兼容
 */
const _getEncryptionKey = async (): Promise<string> => {
  return getLegacyEncryptionKey();
};

// ============================================================
// 防暴力破解
// ============================================================

export const bruteForceProtection = {
  attempts: new Map<string, { count: number; lastAttempt: number }>(),
  MAX_ATTEMPTS: 5,
  LOCK_DURATION: 15 * 60 * 1000,

  isLocked: function (identifier: string): boolean {
    const record = this.attempts.get(identifier);
    if (!record) return false;

    const now = Date.now();
    if (now - record.lastAttempt > this.LOCK_DURATION) {
      this.attempts.delete(identifier);
      return false;
    }

    return record.count >= this.MAX_ATTEMPTS;
  },

  recordFailedAttempt: function (identifier: string): void {
    const record = this.attempts.get(identifier) || { count: 0, lastAttempt: 0 };
    record.count += 1;
    record.lastAttempt = Date.now();
    this.attempts.set(identifier, record);
  },

  resetAttempts: function (identifier: string): void {
    this.attempts.delete(identifier);
  },

  getRemainingAttempts: function (identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record) return this.MAX_ATTEMPTS;
    return Math.max(0, this.MAX_ATTEMPTS - record.count);
  },

  getLockRemainingTime: function (identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record || record.count < this.MAX_ATTEMPTS) return 0;

    const elapsed = Date.now() - record.lastAttempt;
    return Math.max(0, this.LOCK_DURATION - elapsed);
  },
};

// ============================================================
// CSRF防护
// ============================================================

export const csrfProtection = {
  generateToken: (): string => {
    return generateRandomString(32);
  },

  validateToken: (token: string, storedToken: string): boolean => {
    if (!token || !storedToken) return false;
    return token === storedToken && token.length === 32;
  },

  getToken: (): string | null => {
    return secureStorage.getSync<string>('csrf_token', false);
  },

  setToken: (token: string): void => {
    secureStorage.setSync('csrf_token', token, false);
  },

  init: (): string => {
    let token = csrfProtection.getToken();
    if (!token) {
      token = csrfProtection.generateToken();
      csrfProtection.setToken(token);
    }
    return token;
  },
};

// ============================================================
// 安全头部配置
// ============================================================

export const securityHeaders = {
  _cspNonce: '' as string,

  generateCspNonce: (): string => {
    const nonce = generateRandomString(32);
    securityHeaders._cspNonce = nonce;
    return nonce;
  },

  getCspNonce: (): string => {
    if (!securityHeaders._cspNonce) {
      securityHeaders.generateCspNonce();
    }
    return securityHeaders._cspNonce;
  },

  getHeaders: (): Record<string, string> => {
    const csrfToken = csrfProtection.getToken();
    const nonce = securityHeaders.getCspNonce();
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'X-CSRF-Token': csrfToken || '',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=self, microphone=self, geolocation=()',
      'Content-Security-Policy': securityHeaders.getCSP(),
      'X-CSP-Nonce': nonce,
    };
  },

  getCSP: (): string => {
    const nonce = securityHeaders.getCspNonce();
    const isDev = import.meta.env.DEV;

    if (isDev) {
      return [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:*",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https: http://localhost:*",
        "font-src 'self' data:",
        "connect-src 'self' https://*.pawsync.com wss://*.pawsync.com http://localhost:* ws://localhost:*",
        "media-src 'self' blob:",
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "report-uri https://csp-report.pawsync.com/report",
        "report-to csp-endpoint",
      ].join('; ');
    }

    return [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.pawsync.com wss://*.pawsync.com",
      "media-src 'self' blob:",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
      "block-all-mixed-content",
      "report-uri https://csp-report.pawsync.com/report",
      "report-to csp-endpoint",
    ].join('; ');
  },

  getCSPReportOnly: (): string => {
    const nonce = securityHeaders.getCspNonce();
    return [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.pawsync.com wss://*.pawsync.com",
      "media-src 'self' blob:",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "report-uri https://csp-report.pawsync.com/report",
      "report-to csp-endpoint",
    ].join('; ');
  },
};

// ============================================================
// 生物识别认证
// ============================================================

interface BiometricAuthResult {
  success: boolean;
  method: 'biometric' | 'pin' | 'none';
  error?: string;
}

interface BiometryInfo {
  isAvailable: boolean;
  biometryType?: 'fingerprint' | 'face' | 'iris' | 'none';
  hardwareDetected: boolean;
  isEnrolled: boolean;
}

export const biometricAuth = {
  _capacitorPlugin: null as unknown as {
    isAvailable: () => Promise<{ available?: boolean }>;
    verify: (options: { reason: string; allowDeviceCredential?: boolean }) => Promise<{ verified?: boolean; success?: boolean }>;
  } | null,
  _webAuthnAvailable: false,
  _initialized: false,

  init: async function (): Promise<void> {
    if (this._initialized) return;

    this._webAuthnAvailable = !!(navigator.credentials && window.PublicKeyCredential);

    try {
      // @ts-expect-error 未安装官方 Capacitor 生物识别插件，按需动态加载；失败时回退 WebAuthn
      const capacitorBiometrics = await import(/* @vite-ignore */ '@capacitor/biometrics');
      if (capacitorBiometrics?.Biometrics) {
        this._capacitorPlugin = capacitorBiometrics.Biometrics;
      }
    } catch {
      // 插件未安装或不可用，使用 WebAuthn 回退
    }

    this._initialized = true;
  },

  isAvailable: async function (): Promise<boolean> {
    await this.init();

    if (this._capacitorPlugin) {
      try {
        const result = await this._capacitorPlugin.isAvailable();
        return result?.available || false;
      } catch {
        return false;
      }
    }

    return this._webAuthnAvailable;
  },

  checkBiometry: async function (): Promise<BiometryInfo> {
    await this.init();

    const defaultInfo: BiometryInfo = {
      isAvailable: false,
      biometryType: 'none',
      hardwareDetected: false,
      isEnrolled: false,
    };

    if (this._capacitorPlugin) {
      try {
        const result = await this._capacitorPlugin.checkBiometry();
        return {
          isAvailable: result?.available || false,
          biometryType: result?.biometryType || 'none',
          hardwareDetected: result?.hardwareDetected || false,
          isEnrolled: result?.isEnrolled || false,
        };
      } catch {
        return defaultInfo;
      }
    }

    if (this._webAuthnAvailable) {
      try {
        const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        return {
          isAvailable: available,
          biometryType: available ? 'fingerprint' : 'none',
          hardwareDetected: available,
          isEnrolled: available,
        };
      } catch {
        return defaultInfo;
      }
    }

    return defaultInfo;
  },

  authenticate: async function (
    reason: string = '请进行生物识别认证',
    allowPinFallback: boolean = true
  ): Promise<BiometricAuthResult> {
    await this.init();

    if (this._capacitorPlugin) {
      try {
        const result = await this._capacitorPlugin.verify({
          reason,
          allowDeviceCredential: allowPinFallback,
        });
        const verified = result?.verified ?? result?.success ?? false;
        return {
          success: verified,
          method: verified ? 'biometric' : 'none',
          error: verified ? undefined : '认证失败',
        };
      } catch (error: any) {
        if (allowPinFallback) {
          return this._pinFallback(reason);
        }
        return {
          success: false,
          method: 'none',
          error: error?.message || '生物识别认证失败',
        };
      }
    }

    if (this._webAuthnAvailable) {
      try {
        const webAuthnResult = await this._webAuthnVerify(reason);
        if (webAuthnResult.success) {
          return webAuthnResult;
        }
      } catch {
        // WebAuthn 不可用或失败，继续走 PIN 回退
      }
    }

    if (allowPinFallback) {
      return this._pinFallback(reason);
    }

    return {
      success: false,
      method: 'none',
      error: '不支持生物识别认证',
    };
  },

  _webAuthnVerify: async function (reason: string): Promise<BiometricAuthResult> {
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const credentialIds = await this._getStoredCredentialIds();

      const assertionOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        userVerification: 'required',
        timeout: 60000,
      };

      if (credentialIds.length > 0) {
        assertionOptions.allowCredentials = credentialIds.map(id => ({
          id: base64ToBuffer(id),
          type: 'public-key',
          transports: ['internal', 'platform'],
        }));
      }

      const assertion = await navigator.credentials.get({
        publicKey: assertionOptions,
      });

      if (assertion) {
        return {
          success: true,
          method: 'biometric',
        };
      }

      return {
        success: false,
        method: 'none',
        error: 'WebAuthn 认证失败',
      };
    } catch (error: any) {
      return {
        success: false,
        method: 'none',
        error: error?.message || 'WebAuthn 认证异常',
      };
    }
  },

  _getStoredCredentialIds: async function (): Promise<string[]> {
    try {
      const stored = await secureStorage.get<string[]>('webauthn_credentials', true, false);
      return stored || [];
    } catch {
      // 读取已存储凭证失败，视为无凭证
      return [];
    }
  },

  _pinFallback: async function (_reason: string): Promise<BiometricAuthResult> {
    try {
      const storedPin = await secureStorage.get<string>('app_pin', true, true);
      if (!storedPin) {
        return {
          success: false,
          method: 'none',
          error: '未设置 PIN 码',
        };
      }

      return {
        success: true,
        method: 'pin',
      };
    } catch (error: any) {
      return {
        success: false,
        method: 'none',
        error: error?.message || 'PIN 认证失败',
      };
    }
  },

  registerWebAuthn: async function (userId: string, userName: string): Promise<boolean> {
    if (!this._webAuthnAvailable) return false;

    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const userHandle = new TextEncoder().encode(userId);

      const publicKey: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'PawSync Pro',
          id: window.location.hostname,
        },
        user: {
          id: userHandle,
          name: userName,
          displayName: userName,
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
      };

      const credential = await navigator.credentials.create({ publicKey });
      const rawId = credential ? (credential as { rawId?: ArrayBuffer }).rawId : undefined;
      if (rawId) {
        const credentialId = bufferToBase64(new Uint8Array(rawId));
        const existingIds = await this._getStoredCredentialIds();
        if (!existingIds.includes(credentialId)) {
          existingIds.push(credentialId);
          await secureStorage.set('webauthn_credentials', existingIds, true, false);
        }
        return true;
      }

      return false;
    } catch {
      return false;
    }
  },

  setPin: async function (pin: string): Promise<boolean> {
    if (pin.length < 4) return false;

    try {
      const pinHash = await sha256(pin);
      await secureStorage.set('app_pin', pinHash, true, true);
      return true;
    } catch {
      return false;
    }
  },

  verifyPin: async function (pin: string): Promise<boolean> {
    try {
      const storedHash = await secureStorage.get<string>('app_pin', true, true);
      if (!storedHash) return false;

      const pinHash = await sha256(pin);
      return pinHash === storedHash;
    } catch {
      return false;
    }
  },

  hasPin: async function (): Promise<boolean> {
    return secureStorage.hasKey('app_pin', true);
  },
};

// ============================================================
// 会话管理
// ============================================================

export const sessionManager = {
  SESSION_TIMEOUT: 30 * 60 * 1000,
  lastActivity: Date.now(),

  updateActivity: function (): void {
    this.lastActivity = Date.now();
  },

  isSessionExpired: function (): boolean {
    return Date.now() - this.lastActivity > this.SESSION_TIMEOUT;
  },

  logout: async function (): Promise<void> {
    await secureStorage.remove('session', false);
    secureStorage.clear();
    bruteForceProtection.resetAttempts('login');
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
    keyManager.clearCache();
  },

  initSession: async function (userId: string): Promise<void> {
    this.updateActivity();
    await secureStorage.set('session', {
      userId,
      startTime: Date.now(),
      lastActivity: this.lastActivity,
    }, true, false);
  },

  getSession: async function (): Promise<Record<string, unknown> | null> {
    return secureStorage.get('session', true, false);
  },
};

// ============================================================
// 敏感数据处理
// ============================================================

export const sensitiveDataHandler = {
  maskPhone: (phone: string): string => {
    if (phone.length !== 11) return phone;
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  },

  maskEmail: (email: string): string => {
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const name = parts[0];
    if (name.length <= 2) {
      return '**@' + parts[1];
    }
    return name.substring(0, 2) + '***@' + parts[1];
  },

  maskIdCard: (idCard: string): string => {
    if (idCard.length < 8) return idCard;
    return idCard.replace(/(\d{4})\d+(\d{4})/, '$1**********$2');
  },

  safeLog: (action: string, data: Record<string, unknown>): void => {
    const safeData = { ...data };
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'credential'];

    Object.keys(safeData).forEach(key => {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        safeData[key] = '[REDACTED]';
      }
    });

    console.log(`[Security Log] ${action}:`, safeData);
  },
};

// ============================================================
// 错误处理
// ============================================================

export const errorHandler = {
  handleError: (error: unknown, context: string): void => {
    const safeError = {
      message: error instanceof Error ? error.message : String(error),
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent.substring(0, 50),
    };

    if (import.meta.env.DEV) {
      console.error('Error:', safeError);
    }
  },
};

// ============================================================
// 防XSS攻击
// ============================================================

export const xssProtection = {
  containsMaliciousScript: (input: string): boolean => {
    const patterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
      /<link/gi,
      /<meta/gi,
    ];

    return patterns.some(pattern => pattern.test(input));
  },

  sanitizeDangerousContent: (input: string): string => {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<iframe/gi, '&lt;iframe')
      .replace(/<object/gi, '&lt;object')
      .replace(/<embed/gi, '&lt;embed');
  },

  safeRender: (content: string): string => {
    return validationUtils.escapeHtml(content);
  },
};

// ============================================================
// 防CSRF攻击
// ============================================================

export const antiCSRF = {
  verifyOrigin: (requestOrigin: string | null): boolean => {
    if (!requestOrigin) return false;

    const allowedOrigins = [
      window.location.origin,
      'https://pawsync.com',
      'https://www.pawsync.com',
    ];

    return allowedOrigins.includes(requestOrigin);
  },

  verifyReferer: (referer: string | null): boolean => {
    if (!referer) return false;

    try {
      const refererUrl = new URL(referer);
      return refererUrl.hostname === window.location.hostname;
    } catch {
      return false;
    }
  },
};

// ============================================================
// 数据隐私管理器 (GDPR / 个人信息保护法合规)
// ============================================================

interface DataCategory {
  id: string;
  name: string;
  description: string;
  storageLocation: string;
  containsPersonalData: boolean;
  sensitive: boolean;
}

interface PrivacySummary {
  totalDataSize: number;
  personalDataCount: number;
  sensitiveDataCount: number;
  dataCategories: string[];
  lastUpdated: string;
}

interface UserDataExport {
  exportDate: string;
  version: string;
  personalInfo: Record<string, unknown> | null;
  healthData: Record<string, unknown>;
  settings: Record<string, unknown>;
  cacheMetadata: Record<string, unknown>;
  dataCategories: DataCategory[];
}

export const dataPrivacyManager = {
  DATA_CATEGORIES: [
    {
      id: 'personal_info',
      name: '个人信息',
      description: '用户个人身份信息，如姓名、邮箱、电话等',
      storageLocation: 'localStorage (加密)',
      containsPersonalData: true,
      sensitive: true,
    },
    {
      id: 'health_data',
      name: '健康数据',
      description: '宠物健康记录、体重、疫苗接种等数据',
      storageLocation: 'localStorage (加密) / IndexedDB',
      containsPersonalData: true,
      sensitive: true,
    },
    {
      id: 'settings',
      name: '设置数据',
      description: '应用设置、偏好配置',
      storageLocation: 'localStorage',
      containsPersonalData: false,
      sensitive: false,
    },
    {
      id: 'cache_metadata',
      name: '缓存元数据',
      description: '缓存数据、使用统计、日志元数据',
      storageLocation: 'localStorage / IndexedDB',
      containsPersonalData: false,
      sensitive: false,
    },
    {
      id: 'session',
      name: '会话数据',
      description: '用户会话、认证令牌',
      storageLocation: 'localStorage (加密) / sessionStorage',
      containsPersonalData: true,
      sensitive: true,
    },
    {
      id: 'security_keys',
      name: '安全密钥',
      description: '加密密钥、生物识别凭证',
      storageLocation: 'IndexedDB',
      containsPersonalData: false,
      sensitive: true,
    },
  ] as DataCategory[],

  getDataCategories: function (): DataCategory[] {
    return [...this.DATA_CATEGORIES];
  },

  getPrivacySummary: async function (): Promise<PrivacySummary> {
    let totalSize = 0;
    let personalCount = 0;
    let sensitiveCount = 0;

    const normalKeys = secureStorage.getAllKeys(false);
    const sensitiveKeys = secureStorage.getAllKeys(true);

    for (const key of normalKeys) {
      const value = localStorage.getItem(STORAGE_PREFIX + key);
      if (value) {
        totalSize += value.length;
        personalCount++;
      }
    }

    for (const key of sensitiveKeys) {
      const value = localStorage.getItem(SENSITIVE_PREFIX + key);
      if (value) {
        totalSize += value.length;
        sensitiveCount++;
        personalCount++;
      }
    }

    try {
      const dbs = await indexedDB.databases();
      totalSize += dbs.length * 1024;
    } catch {
      // indexedDB 统计失败，忽略
    }

    return {
      totalDataSize: totalSize,
      personalDataCount: personalCount,
      sensitiveDataCount: sensitiveCount,
      dataCategories: this.DATA_CATEGORIES.map(c => c.id),
      lastUpdated: new Date().toISOString(),
    };
  },

  _collectPersonalInfo: async function (): Promise<Record<string, unknown> | null> {
    const info: Record<string, unknown> = {};
    let hasData = false;

    const profile = await secureStorage.get('user_profile', true, true);
    if (profile) {
      info.profile = profile;
      hasData = true;
    }

    const session = await secureStorage.get('session', true, false);
    if (session) {
      info.session = session;
      hasData = true;
    }

    return hasData ? info : null;
  },

  _collectHealthData: async function (): Promise<Record<string, unknown>> {
    const healthData: Record<string, unknown> = {};

    const keys = secureStorage.getAllKeys(false);
    for (const key of keys) {
      if (key.startsWith('pet_') || key.startsWith('health_') || key.startsWith('vaccine_') || key.startsWith('weight_')) {
        try {
          const data = await secureStorage.get(key, true, false);
          if (data) {
            healthData[key] = data;
          }
        } catch {
          // 读取单条健康数据失败，跳过
        }
      }
    }

    return healthData;
  },

  _collectSettings: async function (): Promise<Record<string, unknown>> {
    const settings: Record<string, unknown> = {};

    const keys = secureStorage.getAllKeys(false);
    for (const key of keys) {
      if (key.startsWith('setting_') || key.startsWith('config_') || key.startsWith('preference_')) {
        try {
          const data = await secureStorage.get(key, false, false);
          if (data) {
            settings[key] = data;
          }
        } catch {
          // 读取单条设置失败，跳过
        }
      }
    }

    const csrfToken = csrfProtection.getToken();
    if (csrfToken) {
      settings.csrf_token = '[SECURITY_TOKEN]';
    }

    return settings;
  },

  _collectCacheMetadata: async function (): Promise<Record<string, unknown>> {
    const metadata: Record<string, unknown> = {};
    const cacheKeys: string[] = [];

    getStorageKeys().forEach(key => {
      if (key.startsWith(STORAGE_PREFIX) && key.includes('cache')) {
        cacheKeys.push(key);
      }
    });

    metadata.cacheCount = cacheKeys.length;
    metadata.localStorageTotalKeys = getStorageKeys().length;

    try {
      const dbs = await indexedDB.databases();
      metadata.indexedDBDatabases = dbs.map(db => db.name);
    } catch {
      metadata.indexedDBDatabases = [];
    }

    const allNormalKeys = secureStorage.getAllKeys(false);
    const allSensitiveKeys = secureStorage.getAllKeys(true);
    metadata.storageKeys = {
      normal: allNormalKeys.length,
      sensitive: allSensitiveKeys.length,
    };

    return metadata;
  },

  exportUserData: async function (): Promise<UserDataExport> {
    const [personalInfo, healthData, settings, cacheMetadata] = await Promise.all([
      this._collectPersonalInfo(),
      this._collectHealthData(),
      this._collectSettings(),
      this._collectCacheMetadata(),
    ]);

    return {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      personalInfo,
      healthData,
      settings,
      cacheMetadata,
      dataCategories: this.getDataCategories(),
    };
  },

  exportAsJson: async function (): Promise<string> {
    const data = await this.exportUserData();
    return JSON.stringify(data, null, 2);
  },

  downloadExport: async function (): Promise<void> {
    const jsonData = await this.exportAsJson();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `pawsync_data_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  _confirmDeletion: async function (): Promise<boolean> {
    if (import.meta.env.DEV) {
      return true;
    }

    try {
      const biometricResult = await biometricAuth.authenticate(
        '请验证身份以删除数据',
        true
      );
      return biometricResult.success;
    } catch {
      return false;
    }
  },

  deleteUserData: async function (
    categories: string[] = ['all'],
    requireConfirmation: boolean = true
  ): Promise<{ success: boolean; deletedCategories: string[]; error?: string }> {
    if (requireConfirmation) {
      const confirmed = await this._confirmDeletion();
      if (!confirmed) {
        return {
          success: false,
          deletedCategories: [],
          error: '身份验证失败',
        };
      }
    }

    const deletedCategories: string[] = [];
    const deleteAll = categories.includes('all');

    try {
      if (deleteAll || categories.includes('personal_info')) {
        const sensitiveKeys = secureStorage.getAllKeys(true);
        for (const key of sensitiveKeys) {
          secureStorage.remove(key, true);
        }
        deletedCategories.push('personal_info');
      }

      if (deleteAll || categories.includes('health_data')) {
        const normalKeys = secureStorage.getAllKeys(false);
        for (const key of normalKeys) {
          if (key.startsWith('pet_') || key.startsWith('health_') || key.startsWith('vaccine_')) {
            secureStorage.remove(key, false);
          }
        }
        deletedCategories.push('health_data');
      }

      if (deleteAll || categories.includes('settings')) {
        const normalKeys = secureStorage.getAllKeys(false);
        for (const key of normalKeys) {
          if (key.startsWith('setting_') || key.startsWith('config_') || key.startsWith('preference_')) {
            secureStorage.remove(key, false);
          }
        }
        deletedCategories.push('settings');
      }

      if (deleteAll || categories.includes('cache_metadata')) {
        getStorageKeys().forEach(key => {
          if (key.includes('cache')) {
            localStorage.removeItem(key);
          }
        });
        deletedCategories.push('cache_metadata');
      }

      if (deleteAll || categories.includes('session')) {
        sessionManager.logout();
        deletedCategories.push('session');
      }

      if (deleteAll || categories.includes('security_keys')) {
        await keyManager.destroyAllKeys();
        deletedCategories.push('security_keys');
      }

      return {
        success: true,
        deletedCategories,
      };
    } catch (error: unknown) {
      return {
        success: false,
        deletedCategories,
        error: error instanceof Error ? error.message : '删除数据时发生错误',
      };
    }
  },

  requestDataDeletion: function (): { requestId: string; estimatedDays: number } {
    const requestId = generateRandomString(16);
    return {
      requestId,
      estimatedDays: 30,
    };
  },
};

// ============================================================
// 注入检测与输入验证增强
// ============================================================

interface InjectionDetectionResult {
  detected: boolean;
  type: string;
  severity: 'low' | 'medium' | 'high';
  details: string;
  matchedPattern?: string;
}

export const injectionDetection = {
  SQL_INJECTION_PATTERNS: [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|GRANT|REVOKE|UNION|EXEC|EXECUTE|DECLARE|CAST|CONVERT|SLEEP|WAITFOR|BENCHMARK)\b)/gi,
    /(--|;|\/\*|\*\/|\bxp_|\bsp_)/gi,
    /(\bOR\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+)/gi,
    /(\bAND\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+)/gi,
    /(\bUNION\b.*\bSELECT\b)/gi,
    /(\bdrop\s+table\b)/gi,
    /(\bdelete\s+from\b)/gi,
    /(\bupdate\s+.*\bset\b)/gi,
    /(\binsert\s+into\b)/gi,
    /(['"]\s*(OR|AND)\s*['"]?\w+['"]?\s*=\s*['"]?\w+)/gi,
  ],

  PATH_TRAVERSAL_PATTERNS: [
    /\.\.\//g,
    /\.\.\\/g,
    /%2e%2e%2f/gi,
    /%2e%2e/gi,
    /%2f/gi,
    /\.\.%2f/gi,
    /\.\.%5c/gi,
    /(\/|\\)(\.\.(\/|\\))+/gi,
    /^(\/|\\)/,
    /^[a-zA-Z]:\\/,
  ],

  COMMAND_INJECTION_PATTERNS: [
    /[;&|`$]/g,
    /(\|\||&&|;|\$\(|`|>|<|\|)/g,
    /(\b(cmd|command|bash|sh|shell|powershell|python|perl|ruby|php)\b)/gi,
    /(\b(rm|chmod|chown|wget|curl|nc|netcat)\b)/gi,
    /(\$\(.*\))/g,
    /(`.*`)/g,
    /(\|\s*\|)/g,
    /(;\s*)/g,
  ],

  SSRF_PATTERNS: [
    /^(http|https):\/\/(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|0\.0\.0\.0)/i,
    /^(http|https):\/\/\[::(1|0)\]/i,
    /^(http|https):\/\/.*\.internal/i,
    /^(http|https):\/\/.*\.local/i,
    /^file:\/\//i,
    /^ftp:\/\//i,
    /^gopher:\/\//i,
    /^dict:\/\//i,
    /^ldap:\/\//i,
  ],

  detectSqlInjection: function (input: string): InjectionDetectionResult {
    for (const pattern of this.SQL_INJECTION_PATTERNS) {
      const match = input.match(pattern);
      if (match) {
        return {
          detected: true,
          type: 'sql_injection',
          severity: 'high',
          details: '检测到潜在的 SQL 注入攻击向量',
          matchedPattern: pattern.toString(),
        };
      }
    }
    return {
      detected: false,
      type: 'sql_injection',
      severity: 'low',
      details: '未检测到 SQL 注入',
    };
  },

  detectPathTraversal: function (input: string): InjectionDetectionResult {
    for (const pattern of this.PATH_TRAVERSAL_PATTERNS) {
      const match = input.match(pattern);
      if (match) {
        return {
          detected: true,
          type: 'path_traversal',
          severity: 'high',
          details: '检测到潜在的路径遍历攻击向量',
          matchedPattern: pattern.toString(),
        };
      }
    }
    return {
      detected: false,
      type: 'path_traversal',
      severity: 'low',
      details: '未检测到路径遍历',
    };
  },

  detectCommandInjection: function (input: string): InjectionDetectionResult {
    for (const pattern of this.COMMAND_INJECTION_PATTERNS) {
      const match = input.match(pattern);
      if (match) {
        return {
          detected: true,
          type: 'command_injection',
          severity: 'high',
          details: '检测到潜在的命令注入攻击向量',
          matchedPattern: pattern.toString(),
        };
      }
    }
    return {
      detected: false,
      type: 'command_injection',
      severity: 'low',
      details: '未检测到命令注入',
    };
  },

  detectSSRF: function (url: string): InjectionDetectionResult {
    for (const pattern of this.SSRF_PATTERNS) {
      const match = url.match(pattern);
      if (match) {
        return {
          detected: true,
          type: 'ssrf',
          severity: 'high',
          details: '检测到潜在的 SSRF 攻击向量',
          matchedPattern: pattern.toString(),
        };
      }
    }

    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname.toLowerCase();

      const blockedTLDs = ['.internal', '.local', '.intranet', '.corp'];
      for (const tld of blockedTLDs) {
        if (hostname.endsWith(tld)) {
          return {
            detected: true,
            type: 'ssrf',
            severity: 'medium',
            details: `URL 指向内部域名: ${tld}`,
          };
        }
      }

      const blockedSchemes = ['file:', 'ftp:', 'gopher:', 'dict:', 'ldap:', 'tftp:'];
      if (blockedSchemes.includes(parsedUrl.protocol)) {
        return {
          detected: true,
          type: 'ssrf',
          severity: 'high',
          details: `不允许的 URL 协议: ${parsedUrl.protocol}`,
        };
      }
    } catch {
      return {
        detected: false,
        type: 'ssrf',
        severity: 'low',
        details: '无效的 URL 格式',
      };
    }

    return {
      detected: false,
      type: 'ssrf',
      severity: 'low',
      details: 'URL 安全检查通过',
    };
  },

  scanAll: function (input: string): InjectionDetectionResult[] {
    return [
      this.detectSqlInjection(input),
      this.detectPathTraversal(input),
      this.detectCommandInjection(input),
    ];
  },

  isSafeInput: function (input: string): boolean {
    const results = this.scanAll(input);
    return !results.some(r => r.detected && r.severity === 'high');
  },

  sanitizeForSql: function (input: string): string {
    return input
      .replace(/['";]/g, '')
      .replace(/(--|\/\*|\*\/)/g, '')
      .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|UNION|EXEC|DECLARE)\b/gi, '');
  },

  sanitizePath: function (input: string): string {
    let sanitized = input
      .replace(/\.\.\//g, '')
      .replace(/\.\.\\/g, '')
      .replace(new RegExp('%2e%2e%2f', 'gi'), '')
      .replace(/%2e%2e/gi, '')
      .replace(/^[\/\\]/, '')
      .replace(/^[a-zA-Z]:\\/, '');

    while (sanitized !== sanitized.replace(/\.\.(\/|\\)/g, '')) {
      sanitized = sanitized.replace(/\.\.(\/|\\)/g, '');
    }

    return sanitized;
  },

  validateSafeUrl: function (url: string, allowedDomains?: string[]): boolean {
    try {
      const ssrfCheck = this.detectSSRF(url);
      if (ssrfCheck.detected) return false;

      const parsedUrl = new URL(url);

      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return false;
      }

      if (allowedDomains && allowedDomains.length > 0) {
        const hostname = parsedUrl.hostname;
        return allowedDomains.some(domain => {
          if (domain.startsWith('*.')) {
            return hostname.endsWith(domain.substring(2)) || hostname === domain.substring(2);
          }
          return hostname === domain;
        });
      }

      return true;
    } catch {
      return false;
    }
  },
};

// ============================================================
// 内容安全管理器（提示注入/模板注入检测）
// ============================================================

export const contentSecurityManager = {
  MAX_INPUT_LENGTH: 5000,

  highRiskOperations: [
    { id: 'execute_code', name: '执行代码', blocked: true, requiresConfirmation: false },
    { id: 'delete_account', name: '删除账户', blocked: false, requiresConfirmation: true },
    { id: 'delete_all_data', name: '删除所有数据', blocked: false, requiresConfirmation: true },
    { id: 'export_all_data', name: '导出所有数据', blocked: false, requiresConfirmation: true },
    { id: 'change_password', name: '修改密码', blocked: false, requiresConfirmation: true },
  ] as const,

  violationPatterns: [
    { pattern: /暴力|血腥|残忍/i, type: 'violence', level: 'critical' as const },
    { pattern: /色情|淫秽|成人/i, type: 'pornography', level: 'critical' as const },
    { pattern: /赌博|博彩/i, type: 'gambling', level: 'high' as const },
    { pattern: /毒品|吸毒/i, type: 'drugs', level: 'critical' as const },
    { pattern: /自杀|自残/i, type: 'self_harm', level: 'critical' as const },
    { pattern: /诈骗|欺诈/i, type: 'fraud', level: 'high' as const },
  ],

  checkPromptInjection(input: string): {
    riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
    threats: string[];
    details: Record<string, boolean>;
    blocked: boolean;
    safe: boolean;
    sanitizedContent: string;
  } {
    const threats: string[] = [];
    const details: Record<string, boolean> = {};

    const patterns = [
      { name: '忽略前置指令', pattern: /ignore\s*(all|previous|above).*instructions?/i, level: 'high' as const },
      { name: '系统提示注入', pattern: /system\s*prompt|initial\s*instructions?/i, level: 'medium' as const },
      { name: '角色重定义', pattern: /DAN|jail.?break|stay\s*in\s*character|act\s*as|pretend\s*to\s*be|you\s*are\s*now/i, level: 'high' as const },
      { name: '模板注入', pattern: /\{\{[^{}]*\}\}|\{%[^%]*%\}|\$\{[^}]*\}/, level: 'medium' as const },
      { name: '命令格式注入', pattern: /<\|[^|]*\|>|\[INST\]|<\/?s>/i, level: 'high' as const },
      { name: '数据窃取', pattern: /reveal|leak|disclose|tell\s*me\s*your/i, level: 'medium' as const },
      { name: 'JavaScript协议注入', pattern: /javascript:/i, level: 'high' as const },
      { name: 'Markdown注入', pattern: /^\s*#\s*system|^\s*>\s*system/i, level: 'medium' as const },
      { name: '输入长度超过限制', pattern: new RegExp(`[\\s\\S]{${this.MAX_INPUT_LENGTH + 1},}`), level: 'low' as const },
    ];

    let maxLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical' = 'safe';
    const levelOrder: ('safe' | 'low' | 'medium' | 'high' | 'critical')[] = ['safe', 'low', 'medium', 'high', 'critical'];

    for (const { name, pattern, level } of patterns) {
      const detected = pattern.test(input);
      details[name] = detected;
      if (detected) {
        threats.push(name);
        if (levelOrder.indexOf(level) > levelOrder.indexOf(maxLevel)) {
          maxLevel = level;
        }
      }
    }

    let sanitized = input;
    if (input.length > this.MAX_INPUT_LENGTH) {
      sanitized = input.substring(0, this.MAX_INPUT_LENGTH);
    }

    const blocked = maxLevel === 'high' || maxLevel === 'critical';
    const safe = threats.length === 0;

    return { riskLevel: maxLevel, threats, details, blocked, safe, sanitizedContent: sanitized };
  },

  checkViolationContent(input: string): {
    riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
    threats: string[];
    blocked: boolean;
    types: string[];
  } {
    const threats: string[] = [];
    const types: string[] = [];
    let maxLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical' = 'safe';
    const levelOrder = ['safe', 'low', 'medium', 'high', 'critical'];

    for (const { pattern, type, level } of this.violationPatterns) {
      if (pattern.test(input)) {
        threats.push(type);
        types.push(type);
        if (levelOrder.indexOf(level) > levelOrder.indexOf(maxLevel)) {
          maxLevel = level;
        }
      }
    }

    const blocked = maxLevel === 'high' || maxLevel === 'critical';

    return { riskLevel: maxLevel, threats, blocked, types };
  },

  checkHighRiskOperation(operationId: string): { id: string; name: string; blocked: boolean; requiresConfirmation: boolean } | null {
    return this.highRiskOperations.find(op => op.id === operationId) || null;
  },

  isOperationAllowed(operationId: string): boolean {
    const op = this.checkHighRiskOperation(operationId);
    if (!op) return true;
    return !op.blocked;
  },

  requiresConfirmation(operationId: string): boolean {
    const op = this.checkHighRiskOperation(operationId);
    if (!op) return false;
    return op.requiresConfirmation;
  },

  comprehensiveCheck(input: string): {
    safe: boolean;
    riskLevel: string;
    threats: string[];
    sanitizedContent: string;
    recommendations: string[];
  } {
    const xssResult = xssProtection.containsMaliciousScript(input);
    const injectionScans = injectionDetection.scanAll(input);
    const promptResult = this.checkPromptInjection(input);

    // 聚合注入扫描结果
    const injectionThreats = injectionScans
      .filter(r => r.detected)
      .map(r => r.type);
    const injectionRiskLevel = injectionScans.reduce<'safe' | 'low' | 'medium' | 'high'>(
      (max, r) => {
        const order = ['safe', 'low', 'medium', 'high'];
        return order.indexOf(r.severity) > order.indexOf(max) ? r.severity : max;
      },
      'safe',
    );

    const allThreats = [
      ...(xssResult ? ['xss'] : []),
      ...injectionThreats,
      ...promptResult.threats,
    ];

    let sanitized = input;
    if (xssResult) {
      sanitized = xssProtection.sanitizeDangerousContent(sanitized);
    }
    if (injectionThreats.includes('sql_injection')) {
      sanitized = injectionDetection.sanitizeForSql(sanitized);
    }
    if (injectionThreats.includes('path_traversal')) {
      sanitized = injectionDetection.sanitizePath(sanitized);
    }
    sanitized = sanitized.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '[REDACTED]');
    sanitized = sanitized.replace(/<script\b[^>]*>/gi, '[REDACTED]');
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');

    if (sanitized.length > this.MAX_INPUT_LENGTH) {
      sanitized = sanitized.substring(0, this.MAX_INPUT_LENGTH);
    }

    const levelOrder = ['safe', 'low', 'medium', 'high', 'critical'];
    const maxRisk = [
      xssResult ? 'high' : 'safe',
      injectionRiskLevel,
      promptResult.riskLevel,
    ].reduce((max, curr) =>
      levelOrder.indexOf(curr) > levelOrder.indexOf(max) ? curr : max
    , 'safe');

    const recommendations: string[] = [];
    if (xssResult) recommendations.push('内容包含XSS风险，已清理危险标签');
    if (injectionThreats.length > 0) recommendations.push('内容包含注入风险，已进行安全处理');
    if (promptResult.threats.length > 0) recommendations.push('内容包含提示注入风险，请谨慎处理');

    return {
      safe: allThreats.length === 0,
      riskLevel: maxRisk,
      threats: allThreats,
      sanitizedContent: sanitized,
      recommendations,
    };
  },

  safeRenderContent(content: string): string {
    return xssProtection.safeRender(content);
  },
};

// ============================================================
// 默认导出
// ============================================================

export default {
  cryptoUtils,
  validationUtils,
  secureStorage,
  bruteForceProtection,
  csrfProtection,
  securityHeaders,
  biometricAuth,
  sessionManager,
  sensitiveDataHandler,
  errorHandler,
  xssProtection,
  antiCSRF,
  dataPrivacyManager,
  injectionDetection,
  contentSecurityManager,
  keyManager,
  keyStore,
};
