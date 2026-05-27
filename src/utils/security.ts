/**
 * Security Utilities - 企业级安全工具库
 * PawSync Pro - 安全防护核心
 */

// 加密工具
export const cryptoUtils = {
  // Base64编码（用于简单的数据混淆）
  encodeBase64: (str: string): string => {
    try {
      return btoa(unescape(encodeURIComponent(str)));
    } catch {
      return '';
    }
  },

  // Base64解码
  decodeBase64: (encoded: string): string => {
    try {
      return decodeURIComponent(escape(atob(encoded)));
    } catch {
      return '';
    }
  },

  // 简单加密（XOR混淆，不适用于高度敏感数据）
  xorEncrypt: (str: string, key: string): string => {
    return str.split('').map((char, i) => {
      return String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length));
    }).join('');
  },

  // 生成随机字符串
  generateRandomString: (length: number): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // SHA-256哈希（简化实现）
  sha256: async (str: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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

// 安全存储
export const secureStorage = {
  // 安全存储Key前缀
  PREFIX: 'PS_',

  // 设置安全存储
  set: (key: string, value: any, encrypt: boolean = true): void => {
    try {
      const serialized = JSON.stringify(value);
      const finalValue = encrypt ? cryptoUtils.xorEncrypt(serialized, getEncryptionKey()) : serialized;
      localStorage.setItem(this.PREFIX + key, finalValue);
    } catch (error) {
      console.error('Storage set error:', error);
    }
  },

  // 获取安全存储
  get: <T = any>(key: string, decrypt: boolean = true): T | null => {
    try {
      const value = localStorage.getItem(this.PREFIX + key);
      if (!value) return null;
      const finalValue = decrypt ? cryptoUtils.xorEncrypt(value, getEncryptionKey()) : value;
      return JSON.parse(finalValue);
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },

  // 移除安全存储
  remove: (key: string): void => {
    localStorage.removeItem(this.PREFIX + key);
  },

  // 清除所有安全存储
  clear: (): void => {
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.PREFIX))
      .forEach(key => localStorage.removeItem(key));
  },
};

// 获取加密密钥（基于设备指纹）
let cachedKey: string | null = null;
const getEncryptionKey = (): string => {
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

// 防暴力破解
export const bruteForceProtection = {
  // 登录尝试记录
  attempts: new Map<string, { count: number; lastAttempt: number }>(),
  
  // 最大尝试次数
  MAX_ATTEMPTS: 5,
  
  // 锁定时间（毫秒）
  LOCK_DURATION: 15 * 60 * 1000, // 15分钟

  // 检查是否锁定
  isLocked: (identifier: string): boolean => {
    const record = this.attempts.get(identifier);
    if (!record) return false;
    
    const now = Date.now();
    if (now - record.lastAttempt > this.LOCK_DURATION) {
      this.attempts.delete(identifier);
      return false;
    }
    
    return record.count >= this.MAX_ATTEMPTS;
  },

  // 记录失败尝试
  recordFailedAttempt: (identifier: string): void => {
    const record = this.attempts.get(identifier) || { count: 0, lastAttempt: 0 };
    record.count += 1;
    record.lastAttempt = Date.now();
    this.attempts.set(identifier, record);
  },

  // 重置尝试次数
  resetAttempts: (identifier: string): void => {
    this.attempts.delete(identifier);
  },

  // 获取剩余尝试次数
  getRemainingAttempts: (identifier: string): number => {
    const record = this.attempts.get(identifier);
    if (!record) return this.MAX_ATTEMPTS;
    return Math.max(0, this.MAX_ATTEMPTS - record.count);
  },

  // 获取锁定剩余时间
  getLockRemainingTime: (identifier: string): number => {
    const record = this.attempts.get(identifier);
    if (!record || record.count < this.MAX_ATTEMPTS) return 0;
    
    const elapsed = Date.now() - record.lastAttempt;
    return Math.max(0, this.LOCK_DURATION - elapsed);
  },
};

// CSRF防护
export const csrfProtection = {
  // 生成CSRF Token
  generateToken: (): string => {
    return cryptoUtils.generateRandomString(32);
  },

  // 验证CSRF Token
  validateToken: (token: string, storedToken: string): boolean => {
    if (!token || !storedToken) return false;
    return token === storedToken && token.length === 32;
  },

  // 获取当前Token（从secureStorage）
  getToken: (): string | null => {
    return secureStorage.get<string>('csrf_token', false);
  },

  // 设置Token
  setToken: (token: string): void => {
    secureStorage.set('csrf_token', token, false);
  },

  // 初始化Token
  init: (): string => {
    let token = this.getToken();
    if (!token) {
      token = this.generateToken();
      this.setToken(token);
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
  // 会话超时时间
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30分钟
  
  // 最后活动时间
  lastActivity: Date.now(),

  // 更新活动时间
  updateActivity: (): void => {
    this.lastActivity = Date.now();
  },

  // 检查会话是否过期
  isSessionExpired: (): boolean => {
    return Date.now() - this.lastActivity > this.SESSION_TIMEOUT;
  },

  // 安全登出
  logout: (): void => {
    secureStorage.clear();
    bruteForceProtection.resetAttempts('login');
    sessionStorage.clear();
  },

  // 初始化会话
  initSession: (userId: string): void => {
    this.updateActivity();
    secureStorage.set('session', {
      userId,
      startTime: Date.now(),
      lastActivity: this.lastActivity,
    }, true);
  },

  // 获取会话信息
  getSession: (): any | null => {
    return secureStorage.get('session', true);
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
  safeLog: (action: string, data: any): void => {
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
  handleError: (error: any, context: string): void => {
    const safeError = {
      message: error.message,
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
