/**
 * Security Utilities - 企业级安全工具库
 * PawSync Pro - 安全防护核心
 * 
 * F-SEC-002 隐私数据保护 - 增强加密机制
 */

export const cryptoUtils = {
  encodeBase64: (str: string): string => {
    try {
      return btoa(unescape(encodeURIComponent(str)));
    } catch {
      return '';
    }
  },

  decodeBase64: (encoded: string): string => {
    try {
      return decodeURIComponent(escape(atob(encoded)));
    } catch {
      return '';
    }
  },

  xorEncrypt: (str: string, key: string): string => {
    return str.split('').map((char, i) => {
      return String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length));
    }).join('');
  },

  xorDecrypt: (encrypted: string, key: string): string => {
    return cryptoUtils.xorEncrypt(encrypted, key);
  },

  generateRandomString: (length: number): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
      result += chars.charAt(randomValues[i] % chars.length);
    }
    return result;
  },

  generateSecureKey: async (length: number = 32): Promise<string> => {
    const keyBytes = new Uint8Array(length);
    crypto.getRandomValues(keyBytes);
    return Array.from(keyBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  },

  sha256: async (str: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  sha512: async (str: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-512', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  aesEncrypt: async (data: string, key: string): Promise<string> => {
    try {
      const encoder = new TextEncoder();
      const dataBytes = encoder.encode(data);
      
      const keyBytes = encoder.encode(key.substring(0, 32));
      const paddedKey = new Uint8Array(32);
      paddedKey.set(keyBytes.slice(0, 32));
      
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        paddedKey,
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
      
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('AES encryption failed:', error);
      return cryptoUtils.xorEncrypt(data, key);
    }
  },

  aesDecrypt: async (encryptedData: string, key: string): Promise<string> => {
    try {
      const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
      
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);
      
      const encoder = new TextEncoder();
      const keyBytes = encoder.encode(key.substring(0, 32));
      const paddedKey = new Uint8Array(32);
      paddedKey.set(keyBytes.slice(0, 32));
      
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        paddedKey,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        encrypted
      );
      
      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error('AES decryption failed:', error);
      return cryptoUtils.xorDecrypt(encryptedData, key);
    }
  },

  pbkdf2: async (password: string, salt: string, iterations: number = 100000): Promise<string> => {
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
    
    return Array.from(new Uint8Array(derivedBits))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  },
};

// 输入验证
export const validationUtils = {
  // 邮箱验证
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // 密码强度验证
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

  // XSS防护 - HTML转义
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

  // 清理用户输入
  sanitizeInput: (input: string): string => {
    return input
      .trim()
      .replace(/[<>]/g, '')
      .substring(0, 1000);
  },

  // 验证URL
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
};

// 安全存储 - F-SEC-002 增强版
export const secureStorage = {
  PREFIX: 'PS_',
  SENSITIVE_PREFIX: 'PSS_',
  encryptionCache: new Map<string, string>(),
  _self: null as Record<string, unknown> | null,

  init: function() {
    this._self = this;
  },

  set: async function(key: string, value: unknown, encrypt: boolean = true, sensitive: boolean = false): Promise<void> {
    const self = this._self || this;
    try {
      const serialized = JSON.stringify(value);
      const prefix = sensitive ? self.SENSITIVE_PREFIX : self.PREFIX;
      
      if (encrypt) {
        const encryptionKey = await self.getOrCreateKey(sensitive);
        if (sensitive) {
          const encrypted = await cryptoUtils.aesEncrypt(serialized, encryptionKey);
          localStorage.setItem(prefix + key, encrypted);
        } else {
          const encrypted = cryptoUtils.xorEncrypt(serialized, encryptionKey);
          localStorage.setItem(prefix + key, encrypted);
        }
      } else {
        localStorage.setItem(prefix + key, serialized);
      }
    } catch (error) {
      console.error('Storage set error:', error);
    }
  },

  setSync: function(key: string, value: unknown, encrypt: boolean = true): void {
    const self = this._self || this;
    try {
      const serialized = JSON.stringify(value);
      if (encrypt) {
        const encryptionKey = getEncryptionKeySync();
        const encrypted = cryptoUtils.xorEncrypt(serialized, encryptionKey);
        localStorage.setItem(self.PREFIX + key, encrypted);
      } else {
        localStorage.setItem(self.PREFIX + key, serialized);
      }
    } catch (error) {
      console.error('Storage set error:', error);
    }
  },

  get: async function<T = unknown>(key: string, decrypt: boolean = true, sensitive: boolean = false): Promise<T | null> {
    const self = this._self || this;
    try {
      const prefix = sensitive ? self.SENSITIVE_PREFIX : self.PREFIX;
      const value = localStorage.getItem(prefix + key);
      if (!value) return null;
      
      if (decrypt) {
        const encryptionKey = await self.getOrCreateKey(sensitive);
        if (sensitive) {
          const decrypted = await cryptoUtils.aesDecrypt(value, encryptionKey);
          return JSON.parse(decrypted);
        } else {
          const decrypted = cryptoUtils.xorDecrypt(value, encryptionKey);
          return JSON.parse(decrypted);
        }
      }
      return JSON.parse(value);
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },

  getSync: function<T = unknown>(key: string, decrypt: boolean = true): T | null {
    const self = this._self || this;
    try {
      const value = localStorage.getItem(self.PREFIX + key);
      if (!value) return null;
      
      if (decrypt) {
        const encryptionKey = getEncryptionKeySync();
        const decrypted = cryptoUtils.xorDecrypt(value, encryptionKey);
        return JSON.parse(decrypted);
      }
      return JSON.parse(value);
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },

  remove: function(key: string, sensitive: boolean = false): void {
    const self = this._self || this;
    const prefix = sensitive ? self.SENSITIVE_PREFIX : self.PREFIX;
    localStorage.removeItem(prefix + key);
  },

  clear: function(): void {
    const self = this._self || this;
    Object.keys(localStorage)
      .filter(key => key.startsWith(self.PREFIX) || key.startsWith(self.SENSITIVE_PREFIX))
      .forEach(key => localStorage.removeItem(key));
    self.encryptionCache.clear();
  },

  clearSensitive: function(): void {
    const self = this._self || this;
    Object.keys(localStorage)
      .filter(key => key.startsWith(self.SENSITIVE_PREFIX))
      .forEach(key => localStorage.removeItem(key));
  },

  getOrCreateKey: async function(sensitive: boolean): Promise<string> {
    const self = this._self || this;
    const keyType = sensitive ? 'sensitive' : 'normal';
    if (self.encryptionCache.has(keyType)) {
      return self.encryptionCache.get(keyType)!;
    }
    
    let key: string;
    if (sensitive) {
      key = await cryptoUtils.generateSecureKey(32);
    } else {
      key = getEncryptionKeySync();
    }
    
    self.encryptionCache.set(keyType, key);
    return key;
  },

  hasKey: function(key: string, sensitive: boolean = false): boolean {
    const self = this._self || this;
    const prefix = sensitive ? self.SENSITIVE_PREFIX : self.PREFIX;
    return localStorage.getItem(prefix + key) !== null;
  },

  getAllKeys: function(sensitive: boolean = false): string[] {
    const self = this._self || this;
    const prefix = sensitive ? self.SENSITIVE_PREFIX : self.PREFIX;
    return Object.keys(localStorage)
      .filter(k => k.startsWith(prefix))
      .map(k => k.substring(prefix.length));
  },
};

secureStorage.init();

let cachedKey: string | null = null;

const getEncryptionKeySync = (): string => {
  if (cachedKey) return cachedKey;
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
  ].join('|');
  
  cachedKey = cryptoUtils.encodeBase64(fingerprint).substring(0, 32);
  return cachedKey;
};

const _getEncryptionKey = async (): Promise<string> => {
  return getEncryptionKeySync();
};

// 防暴力破解
export const bruteForceProtection = {
  attempts: new Map<string, { count: number; lastAttempt: number }>(),
  MAX_ATTEMPTS: 5,
  LOCK_DURATION: 15 * 60 * 1000,

  isLocked: function(identifier: string): boolean {
    const record = this.attempts.get(identifier);
    if (!record) return false;
    
    const now = Date.now();
    if (now - record.lastAttempt > this.LOCK_DURATION) {
      this.attempts.delete(identifier);
      return false;
    }
    
    return record.count >= this.MAX_ATTEMPTS;
  },

  recordFailedAttempt: function(identifier: string): void {
    const record = this.attempts.get(identifier) || { count: 0, lastAttempt: 0 };
    record.count += 1;
    record.lastAttempt = Date.now();
    this.attempts.set(identifier, record);
  },

  resetAttempts: function(identifier: string): void {
    this.attempts.delete(identifier);
  },

  getRemainingAttempts: function(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record) return this.MAX_ATTEMPTS;
    return Math.max(0, this.MAX_ATTEMPTS - record.count);
  },

  getLockRemainingTime: function(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record || record.count < this.MAX_ATTEMPTS) return 0;
    
    const elapsed = Date.now() - record.lastAttempt;
    return Math.max(0, this.LOCK_DURATION - elapsed);
  },
};

// CSRF防护
export const csrfProtection = {
  generateToken: (): string => {
    return cryptoUtils.generateRandomString(32);
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

// 安全头部配置
export const securityHeaders = {
  // 获取安全头部
  getHeaders: (): Record<string, string> => {
    const csrfToken = csrfProtection.getToken();
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'X-CSRF-Token': csrfToken || '',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=self, microphone=self, geolocation=()',
    };
  },

  // CSP策略
  getCSP: (): string => {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.pawsync.com wss://*.pawsync.com",
      "media-src 'self' blob:",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');
  },
};

// 会话管理
export const sessionManager = {
  SESSION_TIMEOUT: 30 * 60 * 1000,
  lastActivity: Date.now(),

  updateActivity: function(): void {
    this.lastActivity = Date.now();
  },

  isSessionExpired: function(): boolean {
    return Date.now() - this.lastActivity > this.SESSION_TIMEOUT;
  },

  logout: function(): void {
    secureStorage.clear();
    bruteForceProtection.resetAttempts('login');
    sessionStorage.clear();
  },

  initSession: function(userId: string): void {
    this.updateActivity();
    secureStorage.setSync('session', {
      userId,
      startTime: Date.now(),
      lastActivity: this.lastActivity,
    }, true);
  },

  getSession: function(): Record<string, unknown> | null {
    return secureStorage.getSync('session', true);
  },
};

// 敏感数据处理
export const sensitiveDataHandler = {
  // 脱敏手机号
  maskPhone: (phone: string): string => {
    if (phone.length !== 11) return phone;
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  },

  // 脱敏邮箱
  maskEmail: (email: string): string => {
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const name = parts[0];
    if (name.length <= 2) {
      return '**@' + parts[1];
    }
    return name.substring(0, 2) + '***@' + parts[1];
  },

  // 脱敏身份证
  maskIdCard: (idCard: string): string => {
    if (idCard.length < 8) return idCard;
    return idCard.replace(/(\d{4})\d+(\d{4})/, '$1**********$2');
  },

  // 安全日志（不记录敏感信息）
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

// 错误处理
export const errorHandler = {
  // 安全错误处理
  handleError: (error: unknown, context: string): void => {
    const safeError = {
      message: error instanceof Error ? error.message : String(error),
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent.substring(0, 50),
    };
    
    // 不在生产环境记录详细错误
    if (import.meta.env.DEV) {
      console.error('Error:', safeError);
    }
    
    // 可以发送到错误追踪服务
    // sendToErrorTracking(safeError);
  },
};

// 防XSS攻击
export const xssProtection = {
  // 检查是否包含恶意脚本
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

  // 清理危险内容
  sanitizeDangerousContent: (input: string): string => {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<iframe/gi, '&lt;iframe')
      .replace(/<object/gi, '&lt;object')
      .replace(/<embed/gi, '&lt;embed');
  },

  // 安全的HTML渲染
  safeRender: (content: string): string => {
    return validationUtils.escapeHtml(content);
  },
};

// 防CSRF攻击
export const antiCSRF = {
  // 验证请求来源
  verifyOrigin: (requestOrigin: string | null): boolean => {
    if (!requestOrigin) return false;
    
    const allowedOrigins = [
      window.location.origin,
      'https://pawsync.com',
      'https://www.pawsync.com',
    ];
    
    return allowedOrigins.includes(requestOrigin);
  },

  // 验证Referer
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

export default {
  cryptoUtils,
  validationUtils,
  secureStorage,
  bruteForceProtection,
  csrfProtection,
  securityHeaders,
  sessionManager,
  sensitiveDataHandler,
  errorHandler,
  xssProtection,
  antiCSRF,
};
