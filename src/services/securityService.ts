// ============================================
// PawSync Pro - securityService.ts
//
// 作者: 带娃的小陈工
// 日期: 2026-05-27
// 描述: 安全服务，提供XSS防护、输入验证、数据加密等功能
// ============================================

export interface SecurityConfig {
  maxLoginAttempts: number;
  rateLimitWindowMs: number;
  passwordMinLength: number;
  sessionTimeoutMs: number;
}

export const defaultSecurityConfig: SecurityConfig = {
  maxLoginAttempts: 10,
  rateLimitWindowMs: 60000,
  passwordMinLength: 8,
  sessionTimeoutMs: 24 * 60 * 60 * 1000,
};

// XSS防护 - 清理HTML输入
export const sanitizeHtml = (html: string): string => {
  const tempDiv = document.createElement('div');
  tempDiv.textContent = html;
  return tempDiv.innerHTML;
};

// 清理用户输入文本
export const sanitizeText = (text: string): string => {
  if (typeof text !== 'string') {
    return '';
  }
  
  // 移除可能的脚本标签和危险属性
  return text
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
};

// SQL注入防护 - 验证和清理SQL相关输入
export const sanitizeSqlInput = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }
  
  // 移除SQL特殊字符
  return input
    .replace(/'/g, "''")
    .replace(/"/g, '""')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '');
};

// 验证宠物名称（防止XSS和SQL注入）
export const validatePetName = (name: string): { valid: boolean; sanitized: string; message?: string } => {
  const sanitized = sanitizeText(name);
  
  if (!sanitized || sanitized.length === 0) {
    return { valid: false, sanitized: '', message: '宠物名称不能为空' };
  }
  
  if (sanitized.length > 50) {
    return { valid: false, sanitized: '', message: '宠物名称不能超过50个字符' };
  }
  
  return { valid: true, sanitized };
};

// 验证健康记录内容
export const validateHealthRecordContent = (content: string): { valid: boolean; sanitized: string; message?: string } => {
  const sanitized = sanitizeText(content);
  
  if (!sanitized || sanitized.length === 0) {
    return { valid: false, sanitized: '', message: '健康记录内容不能为空' };
  }
  
  if (sanitized.length > 1000) {
    return { valid: false, sanitized: '', message: '健康记录内容不能超过1000个字符' };
  }
  
  return { valid: true, sanitized };
};

// 敏感数据加密（简单模拟）
export const encryptSensitiveData = (data: string): string => {
  const key = 'pawsync_encryption_key';
  let result = '';
  for (let i = 0; i < data.length; i++) {
    const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  return btoa(result);
};

// 敏感数据解密（简单模拟）
export const decryptSensitiveData = (encrypted: string): string => {
  try {
    const decoded = atob(encrypted);
    const key = 'pawsync_encryption_key';
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch {
    return '';
  }
};

// 安全的localStorage存储
export const secureStorage = {
  setItem: (key: string, value: any): void => {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, encryptSensitiveData(serialized));
    } catch {
      console.error('Failed to store data securely');
    }
  },
  
  getItem: (key: string): any => {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      const decrypted = decryptSensitiveData(encrypted);
      return JSON.parse(decrypted);
    } catch {
      return null;
    }
  },
  
  removeItem: (key: string): void => {
    localStorage.removeItem(key);
  },
  
  clear: (): void => {
    localStorage.clear();
  },
};

// 检查localStorage安全
export const checkLocalStorageSecurity = (): { hasSensitiveData: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key) || '';
      if (value.toLowerCase().includes('password')) {
        issues.push(`存储包含疑似密码的敏感数据在key: ${key}`);
      }
      if (value.toLowerCase().includes('token') && !value.startsWith('ey')) {
        issues.push(`存储包含疑似token的敏感数据在key: ${key}`);
      }
    }
  }
  
  return {
    hasSensitiveData: issues.length > 0,
    issues,
  };
};
