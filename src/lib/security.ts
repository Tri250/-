// ==================== PawSync Pro 3.0 - 隐私与安全工具 ====================
// 作者: 带娃的小陈工

/**
 * 安全工具类 - 处理敏感数据
 */

// 敏感数据掩码处理
export function maskSensitiveData(data: string, type: 'phone' | 'email' | 'id' | 'name' = 'phone'): string {
  if (!data) return '';
  
  let result = data;
  switch (type) {
    case 'phone':
      // 手机号：138****1234
      result = data.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
      break;
    
    case 'email':
      // 邮箱：te***@example.com
      const [name, domain] = data.split('@');
      if (name && domain) {
        const visibleLength = Math.min(2, name.length);
        result = `${name.slice(0, visibleLength)}***@${domain}`;
      }
      break;
    
    case 'id':
      // 身份证：110***********1234
      result = data.replace(/(\d{3})\d{11}(\d{4})/, '$1***********$2');
      break;
    
    case 'name':
      // 姓名：张*
      if (data.length > 1) {
        result = data.slice(0, 1) + '*'.repeat(data.length - 1);
      }
      break;
  }
  return result;
}

// 安全存储工具
export const secureStorage = {
  setItem(key: string, value: unknown, sensitive: boolean = false): void {
    try {
      const data = sensitive 
        ? JSON.stringify({ type: 'sensitive', data: value, timestamp: Date.now() })
        : JSON.stringify(value);
      localStorage.setItem(key, data);
    } catch (error) {
      console.error('安全存储失败:', error);
    }
  },
  
  getItem(key: string): unknown {
    try {
      const data = localStorage.getItem(key);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      console.error('安全读取失败:', error);
      return null;
    }
  },
  
  removeItem(key: string): void {
    localStorage.removeItem(key);
  },
  
  clear(): void {
    localStorage.clear();
  }
};

// 敏感数据清理
export function clearSensitiveData(): void {
  const sensitiveKeys = [
    'user_password',
    'auth_token',
    'private_key',
    'health_records',
    'camera_credentials'
  ];
  
  sensitiveKeys.forEach(key => {
    secureStorage.removeItem(key);
  });
}

// XSS防护 - 清理输入
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

// 防止SQL注入 - 基础清理
export function sanitizeForDatabase(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/;/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '');
}

// 验证输入格式
export const validators = {
  // 手机号验证（中国）
  phone: (value: string): boolean => {
    return /^1[3-9]\d{9}$/.test(value);
  },
  
  // 邮箱验证
  email: (value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  },
  
  // 密码强度验证（至少8位，包含字母和数字）
  password: (value: string): { valid: boolean; message: string } => {
    if (value.length < 8) {
      return { valid: false, message: '密码长度至少8位' };
    }
    if (!/[a-zA-Z]/.test(value)) {
      return { valid: false, message: '密码需要包含字母' };
    }
    if (!/[0-9]/.test(value)) {
      return { valid: false, message: '密码需要包含数字' };
    }
    return { valid: true, message: '密码强度良好' };
  },
  
  // 用户名验证（3-20位，字母数字下划线）
  username: (value: string): boolean => {
    return /^[a-zA-Z0-9_]{3,20}$/.test(value);
  }
};

// 日志脱敏
export function redactLog(message: string): string {
  return message
    .replace(/1[3-9]\d{9}/g, '***PHONE***')
    .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '***EMAIL***')
    .replace(/\d{17}[\dXx]/g, '***ID***')
    .replace(/password['"]?\s*[:=]\s*['"]?[^\s'"}]+/gi, 'password="***"');
}

export default {
  maskSensitiveData,
  secureStorage,
  clearSensitiveData,
  sanitizeInput,
  sanitizeForDatabase,
  validators,
  redactLog
};
