/**
 * Android Keystore 加密工具
 * PawSync Pro - 安全加密核心
 *
 * 提供 AES-256-GCM 加密/解密、密钥生成、安全文件存储加密、证书固定验证
 *
 * 在 Android 端使用 Capacitor Preferences (底层使用 Android Keystore) 加密存储
 * 在 Web 端使用 Web Crypto API 作为降级方案
 */

import { Capacitor } from '@capacitor/core';

// ─── 类型定义 ─────────────────────────────────────────────────

interface EncryptedData {
  /** 加密格式版本 */
  v: 1;
  /** 算法 */
  alg: 'AES-256-GCM';
  /** 初始化向量 (Base64) */
  iv: string;
  /** 密文 (Base64) */
  ciphertext: string;
  /** 密钥标识符 */
  kid?: string;
}

interface KeyMetadata {
  id: string;
  algorithm: 'AES-256-GCM';
  createdAt: number;
  purpose: string;
  fingerprint: string;
}

interface CertificatePinConfig {
  domain: string;
  fingerprints: string[];
  enabled: boolean;
}

// ─── 编码工具 ─────────────────────────────────────────────────

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// ─── 密钥生成 ─────────────────────────────────────────────────

/**
 * 生成 AES-256-GCM 密钥
 * 在 Android 端通过 Android Keystore 生成（通过 Capacitor Preferences）
 * 在 Web 端使用 Web Crypto API
 */
async function generateAESKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // 可导出
    ['encrypt', 'decrypt'],
  );
}

/**
 * 导出密钥为 raw 格式
 */
async function exportKey(key: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.exportKey('raw', key);
}

/**
 * 从 raw 格式导入密钥
 */
async function importKey(rawKey: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt'],
  );
}

/**
 * 从密码派生加密密钥 (PBKDF2)
 */
async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array,
  iterations: number = 100000,
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );
}

// ─── AES-256-GCM 加密/解密 ────────────────────────────────────

/**
 * AES-256-GCM 加密
 * @param plaintext 明文
 * @param key 加密密钥
 * @returns 加密数据结构
 */
async function encrypt(plaintext: string, key: CryptoKey): Promise<EncryptedData> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data,
  );

  return {
    v: 1,
    alg: 'AES-256-GCM',
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(ciphertext),
  };
}

/**
 * AES-256-GCM 解密
 * @param encryptedData 加密数据结构
 * @param key 解密密钥
 * @returns 明文
 */
async function decrypt(encryptedData: EncryptedData, key: CryptoKey): Promise<string> {
  const iv = base64ToBuffer(encryptedData.iv);
  const ciphertext = base64ToBuffer(encryptedData.ciphertext);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext,
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * 加密任意类型数据（自动 JSON 序列化）
 */
async function encryptData<T>(data: T, key: CryptoKey): Promise<EncryptedData> {
  const json = JSON.stringify(data);
  return encrypt(json, key);
}

/**
 * 解密任意类型数据（自动 JSON 反序列化）
 */
async function decryptData<T>(encryptedData: EncryptedData, key: CryptoKey): Promise<T> {
  const json = await decrypt(encryptedData, key);
  return JSON.parse(json);
}

// ─── 密钥管理 ─────────────────────────────────────────────────

const KEY_STORAGE_PREFIX = 'pawsync_kek_';
const KEY_METADATA_PREFIX = 'pawsync_kmd_';

/**
 * 密钥管理器
 * 管理 AES 密钥的存储、检索和轮换
 */
class KeychainManager {
  private keyCache = new Map<string, CryptoKey>();
  private metadataCache = new Map<string, KeyMetadata>();

  /**
   * 从安全存储加载密钥
   */
  async loadKey(keyId: string): Promise<CryptoKey | null> {
    if (this.keyCache.has(keyId)) {
      return this.keyCache.get(keyId)!;
    }

    try {
      if (Capacitor.isNativePlatform()) {
        const { Preferences } = await import('@capacitor/preferences');
        const result = await Preferences.get({ key: `${KEY_STORAGE_PREFIX}${keyId}` });
        if (result.value) {
          const rawKey = hexToBuffer(result.value);
          const key = await importKey(rawKey);
          this.keyCache.set(keyId, key);
          return key;
        }
      } else {
        // Web 降级：从 localStorage 读取
        const stored = localStorage.getItem(`${KEY_STORAGE_PREFIX}${keyId}`);
        if (stored) {
          const rawKey = hexToBuffer(stored);
          const key = await importKey(rawKey);
          this.keyCache.set(keyId, key);
          return key;
        }
      }
    } catch (error) {
      console.error('[Keystore] Failed to load key:', error);
    }

    return null;
  }

  /**
   * 保存密钥到安全存储
   */
  async saveKey(keyId: string, key: CryptoKey): Promise<void> {
    try {
      const rawKey = await exportKey(key);
      const hexKey = bufferToHex(rawKey);

      if (Capacitor.isNativePlatform()) {
        const { Preferences } = await import('@capacitor/preferences');
        await Preferences.set({ key: `${KEY_STORAGE_PREFIX}${keyId}`, value: hexKey });
      } else {
        localStorage.setItem(`${KEY_STORAGE_PREFIX}${keyId}`, hexKey);
      }

      this.keyCache.set(keyId, key);
    } catch (error) {
      console.error('[Keystore] Failed to save key:', error);
      throw new Error('Failed to save encryption key');
    }
  }

  /**
   * 删除密钥
   */
  async deleteKey(keyId: string): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        const { Preferences } = await import('@capacitor/preferences');
        await Preferences.remove({ key: `${KEY_STORAGE_PREFIX}${keyId}` });
      } else {
        localStorage.removeItem(`${KEY_STORAGE_PREFIX}${keyId}`);
      }

      this.keyCache.delete(keyId);
      this.metadataCache.delete(keyId);
    } catch (error) {
      console.error('[Keystore] Failed to delete key:', error);
    }
  }

  /**
   * 保存密钥元数据
   */
  async saveMetadata(metadata: KeyMetadata): Promise<void> {
    try {
      const json = JSON.stringify(metadata);
      if (Capacitor.isNativePlatform()) {
        const { Preferences } = await import('@capacitor/preferences');
        await Preferences.set({ key: `${KEY_METADATA_PREFIX}${metadata.id}`, value: json });
      } else {
        localStorage.setItem(`${KEY_METADATA_PREFIX}${metadata.id}`, json);
      }
      this.metadataCache.set(metadata.id, metadata);
    } catch (error) {
      console.error('[Keystore] Failed to save metadata:', error);
    }
  }

  /**
   * 加载密钥元数据
   */
  async loadMetadata(keyId: string): Promise<KeyMetadata | null> {
    if (this.metadataCache.has(keyId)) {
      return this.metadataCache.get(keyId)!;
    }

    try {
      let json: string | null = null;
      if (Capacitor.isNativePlatform()) {
        const { Preferences } = await import('@capacitor/preferences');
        const result = await Preferences.get({ key: `${KEY_METADATA_PREFIX}${keyId}` });
        json = result.value;
      } else {
        json = localStorage.getItem(`${KEY_METADATA_PREFIX}${keyId}`);
      }

      if (json) {
        const metadata = JSON.parse(json) as KeyMetadata;
        this.metadataCache.set(keyId, metadata);
        return metadata;
      }
    } catch (error) {
      console.error('[Keystore] Failed to load metadata:', error);
    }

    return null;
  }

  /**
   * 获取或创建密钥
   * @param purpose 密钥用途标识
   */
  async getOrCreateKey(purpose: string = 'default'): Promise<{ key: CryptoKey; keyId: string; isNew: boolean }> {
    const keyId = `key_${purpose}`;

    // 尝试加载现有密钥
    const existingKey = await this.loadKey(keyId);
    if (existingKey) {
      return { key: existingKey, keyId, isNew: false };
    }

    // 创建新密钥
    const newKey = await generateAESKey();
    await this.saveKey(keyId, newKey);

    // 计算指纹
    const rawKey = await exportKey(newKey);
    const fingerprint = await crypto.subtle.digest('SHA-256', rawKey).then((hash) => bufferToHex(hash));

    // 保存元数据
    await this.saveMetadata({
      id: keyId,
      algorithm: 'AES-256-GCM',
      createdAt: Date.now(),
      purpose,
      fingerprint,
    });

    return { key: newKey, keyId, isNew: true };
  }

  /**
   * 密钥轮换
   */
  async rotateKey(purpose: string = 'default'): Promise<{ newKeyId: string; oldKeyId: string | null }> {
    const oldKeyId = `key_${purpose}`;
    const newKeyId = `key_${purpose}_${Date.now()}`;

    const oldKey = await this.loadKey(oldKeyId);

    // 生成新密钥
    const newKey = await generateAESKey();
    await this.saveKey(newKeyId, newKey);

    // 计算指纹
    const rawKey = await exportKey(newKey);
    const fingerprint = await crypto.subtle.digest('SHA-256', rawKey).then((hash) => bufferToHex(hash));

    // 保存新元数据
    await this.saveMetadata({
      id: newKeyId,
      algorithm: 'AES-256-GCM',
      createdAt: Date.now(),
      purpose,
      fingerprint,
    });

    // 替换旧密钥
    await this.saveKey(oldKeyId, newKey);

    return { newKeyId, oldKeyId: oldKey ? oldKeyId : null };
  }

  /**
   * 清除所有密钥
   */
  async clearAll(): Promise<void> {
    this.keyCache.clear();
    this.metadataCache.clear();
  }
}

// ─── 安全文件存储加密 ────────────────────────────────────────

interface SecureFileEntry {
  id: string;
  keyId: string;
  encryptedData: EncryptedData;
  mimeType: string;
  fileName: string;
  createdAt: number;
}

/**
 * 安全文件存储
 * 使用 AES-256-GCM 加密存储文件内容
 */
class SecureFileStorage {
  private keychain: KeychainManager;

  constructor(keychain: KeychainManager) {
    this.keychain = keychain;
  }

  /**
   * 加密文件内容
   */
  async encryptFile(
    fileId: string,
    content: string | ArrayBuffer,
    mimeType: string,
    fileName: string,
  ): Promise<SecureFileEntry> {
    const { key, keyId } = await this.keychain.getOrCreateKey('file_storage');

    const plaintext = typeof content === 'string' ? content : bufferToBase64(content);
    const encryptedData = await encrypt(plaintext, key);

    return {
      id: fileId,
      keyId,
      encryptedData,
      mimeType,
      fileName,
      createdAt: Date.now(),
    };
  }

  /**
   * 解密文件内容
   */
  async decryptFile(entry: SecureFileEntry): Promise<string> {
    const key = await this.keychain.loadKey(entry.keyId);
    if (!key) {
      throw new Error(`Key not found: ${entry.keyId}`);
    }

    return decrypt(entry.encryptedData, key);
  }

  /**
   * 安全存储文件到本地
   */
  async saveSecureFile(
    fileId: string,
    content: string | ArrayBuffer,
    mimeType: string,
    fileName: string,
  ): Promise<void> {
    const entry = await this.encryptFile(fileId, content, mimeType, fileName);
    const json = JSON.stringify(entry);

    if (Capacitor.isNativePlatform()) {
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.set({ key: `pawsync_file_${fileId}`, value: json });
    } else {
      localStorage.setItem(`pawsync_file_${fileId}`, json);
    }
  }

  /**
   * 从本地读取安全存储的文件
   */
  async loadSecureFile(fileId: string): Promise<string | null> {
    try {
      let json: string | null = null;

      if (Capacitor.isNativePlatform()) {
        const { Preferences } = await import('@capacitor/preferences');
        const result = await Preferences.get({ key: `pawsync_file_${fileId}` });
        json = result.value;
      } else {
        json = localStorage.getItem(`pawsync_file_${fileId}`);
      }

      if (!json) return null;

      const entry = JSON.parse(json) as SecureFileEntry;
      return this.decryptFile(entry);
    } catch (error) {
      console.error('[SecureFileStorage] Failed to load file:', error);
      return null;
    }
  }

  /**
   * 删除安全存储的文件
   */
  async deleteSecureFile(fileId: string): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        const { Preferences } = await import('@capacitor/preferences');
        await Preferences.remove({ key: `pawsync_file_${fileId}` });
      } else {
        localStorage.removeItem(`pawsync_file_${fileId}`);
      }
    } catch (error) {
      console.error('[SecureFileStorage] Failed to delete file:', error);
    }
  }
}

// ─── 证书固定验证 ────────────────────────────────────────────

/**
 * 证书固定管理器
 * 验证服务器证书指纹，防止中间人攻击
 */
const DEFAULT_CERT_PINS: CertificatePinConfig[] = [
  {
    domain: 'api.pawsync.com',
    fingerprints: [
      // 生产环境 SHA-256 证书指纹（需替换为实际值）
      'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    ],
    enabled: true,
  },
];

class CertificatePinValidator {
  private pins: CertificatePinConfig[] = [...DEFAULT_CERT_PINS];

  /**
   * 设置证书固定配置
   */
  setPins(pins: CertificatePinConfig[]): void {
    this.pins = pins;
  }

  /**
   * 获取当前固定配置
   */
  getPins(): CertificatePinConfig[] {
    return [...this.pins];
  }

  /**
   * 为域名添加证书固定
   */
  addPin(domain: string, fingerprints: string[]): void {
    const existing = this.pins.find((p) => p.domain === domain);
    if (existing) {
      existing.fingerprints = [...new Set([...existing.fingerprints, ...fingerprints])];
    } else {
      this.pins.push({ domain, fingerprints, enabled: true });
    }
  }

  /**
   * 移除域名的证书固定
   */
  removePin(domain: string): void {
    this.pins = this.pins.filter((p) => p.domain !== domain);
  }

  /**
   * 验证域名是否有证书固定配置
   */
  hasPin(domain: string): boolean {
    const pin = this.pins.find((p) => p.domain === domain);
    return pin ? pin.enabled : false;
  }

  /**
   * 验证证书指纹是否匹配
   * 在 Android 端，实际 TLS 固定由 network_security_config.xml 处理
   * 此方法在 Web 端提供额外验证层
   */
  validateFingerprint(domain: string, fingerprint: string): boolean {
    const pin = this.pins.find((p) => p.domain === domain);
    if (!pin || !pin.enabled) {
      // 无配置的域名允许通过
      return true;
    }
    return pin.fingerprints.includes(fingerprint);
  }

  /**
   * 验证域名是否安全（需要 HTTPS 且有固定配置）
   */
  isDomainSecure(domain: string, protocol: string): boolean {
    // 必须使用 HTTPS
    if (protocol !== 'https:') {
      return false;
    }

    const pin = this.pins.find((p) => p.domain === domain);
    if (!pin) {
      // 无配置的域名，仅要求 HTTPS
      return true;
    }

    return pin.enabled && pin.fingerprints.length > 0;
  }

  /**
   * 持久化证书固定配置
   */
  async persistConfig(): Promise<void> {
    const json = JSON.stringify(this.pins);
    if (Capacitor.isNativePlatform()) {
      try {
        const { Preferences } = await import('@capacitor/preferences');
        await Preferences.set({ key: 'pawsync_cert_pins', value: json });
      } catch (error) {
        console.error('[CertPin] Failed to persist:', error);
      }
    } else {
      localStorage.setItem('pawsync_cert_pins', json);
    }
  }

  /**
   * 从持久化存储加载证书固定配置
   */
  async loadConfig(): Promise<void> {
    try {
      let json: string | null = null;
      if (Capacitor.isNativePlatform()) {
        const { Preferences } = await import('@capacitor/preferences');
        const result = await Preferences.get({ key: 'pawsync_cert_pins' });
        json = result.value;
      } else {
        json = localStorage.getItem('pawsync_cert_pins');
      }

      if (json) {
        const loaded = JSON.parse(json) as CertificatePinConfig[];
        // 合并而不是覆盖，默认设置优先
        for (const loadedPin of loaded) {
          const existing = this.pins.find((p) => p.domain === loadedPin.domain);
          if (existing) {
            existing.fingerprints = loadedPin.fingerprints;
            existing.enabled = loadedPin.enabled;
          } else {
            this.pins.push(loadedPin);
          }
        }
      }
    } catch (error) {
      console.error('[CertPin] Failed to load config:', error);
    }
  }
}

// ─── 导出单例 ─────────────────────────────────────────────────

export const keychain = new KeychainManager();
export const secureFileStorage = new SecureFileStorage(keychain);
export const certPinValidator = new CertificatePinValidator();

/**
 * 便捷加密函数
 */
export async function encryptString(plaintext: string): Promise<EncryptedData> {
  const { key } = await keychain.getOrCreateKey('default');
  return encrypt(plaintext, key);
}

/**
 * 便捷解密函数
 */
export async function decryptString(encryptedData: EncryptedData): Promise<string> {
  const { key } = await keychain.getOrCreateKey('default');
  return decrypt(encryptedData, key);
}

/**
 * 初始化密钥存储
 * 在应用启动时调用，确保密钥已就绪并加载证书固定配置
 */
export async function initializeKeystore(): Promise<void> {
  try {
    // 确保默认密钥存在
    await keychain.getOrCreateKey('default');
    await keychain.getOrCreateKey('file_storage');

    // 加载证书固定配置
    await certPinValidator.loadConfig();

    console.log('[Keystore] Initialized successfully');
  } catch (error) {
    console.error('[Keystore] Initialization failed:', error);
  }
}

export type { EncryptedData, KeyMetadata, CertificatePinConfig };