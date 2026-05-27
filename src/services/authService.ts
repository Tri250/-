// ============================================
// PawSync Pro - authService.ts
//
// 作者: 带娃的小陈工
// 日期: 2026-05-27
// 描述: 认证服务，提供登录、注册、密码验证等功能
// ============================================

// 模拟用户数据库
interface UserRecord {
  id: string;
  email: string;
  username: string;
  hashedPassword: string;
  createdAt: string;
}

const userDatabase: Map<string, UserRecord> = new Map();

// 简单的密码哈希模拟（生产环境应使用bcrypt等）
const hashPassword = (password: string): string => {
  return btoa(password + '_pawsync_salt');
};

const verifyPassword = (password: string, hashedPassword: string): boolean => {
  return hashPassword(password) === hashedPassword;
};

// 输入验证工具
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: '密码长度至少8位' };
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: '密码必须包含至少一个数字' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: '密码必须包含至少一个字母' };
  }
  return { valid: true };
};

// XSS防护 - 清理输入
export const sanitizeInput = (input: string): string => {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
};

// 模拟API接口
export class AuthService {
  private static rateLimitStore: Map<string, number[]> = new Map();
  
  // 速率限制检查
  private static checkRateLimit(key: string, maxAttempts: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const attempts = AuthService.rateLimitStore.get(key) || [];
    const recentAttempts = attempts.filter(time => now - time < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      return false;
    }
    
    recentAttempts.push(now);
    AuthService.rateLimitStore.set(key, recentAttempts);
    return true;
  }

  // 注册新用户
  static async register(email: string, password: string, username: string): Promise<{ success: boolean; message?: string }> {
    await new Promise(resolve => setTimeout(resolve, 800));

    // 输入验证
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedUsername = sanitizeInput(username.trim());

    if (!validateEmail(sanitizedEmail)) {
      return { success: false, message: '请输入有效的邮箱地址' };
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return { success: false, message: passwordCheck.message };
    }

    // 检查邮箱是否已注册
    if (userDatabase.has(sanitizedEmail)) {
      return { success: false, message: '该邮箱已被注册' };
    }

    // 创建用户
    const newUser: UserRecord = {
      id: Date.now().toString(),
      email: sanitizedEmail,
      username: sanitizedUsername,
      hashedPassword: hashPassword(password),
      createdAt: new Date().toISOString(),
    };

    userDatabase.set(sanitizedEmail, newUser);

    return { success: true };
  }

  // 登录
  static async login(email: string, password: string): Promise<{ 
    success: boolean; 
    message?: string;
    user?: { id: string; email: string; username: string; isPremium: boolean; createdAt: string }
  }> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const sanitizedEmail = email.trim().toLowerCase();

    // 速率限制
    if (!AuthService.checkRateLimit(`login_${sanitizedEmail}`)) {
      return { success: false, message: '登录尝试次数过多，请稍后再试' };
    }

    // 查找用户
    const user = userDatabase.get(sanitizedEmail);
    
    // 演示账号
    if (sanitizedEmail === 'demo@pawsync.pro' && password === 'password123') {
      return {
        success: true,
        user: {
          id: 'demo-user',
          email: sanitizedEmail,
          username: 'Demo User',
          isPremium: true,
          createdAt: new Date().toISOString(),
        },
      };
    }

    if (!user) {
      return { success: false, message: '邮箱或密码错误' };
    }

    if (!verifyPassword(password, user.hashedPassword)) {
      return { success: false, message: '邮箱或密码错误' };
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isPremium: false,
        createdAt: user.createdAt,
      },
    };
  }

  // 退出登录
  static async logout(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // 删除账户
  static async deleteAccount(email: string, password: string): Promise<{ success: boolean; message?: string }> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const sanitizedEmail = email.trim().toLowerCase();
    const user = userDatabase.get(sanitizedEmail);

    if (!user) {
      return { success: false, message: '用户不存在' };
    }

    if (!verifyPassword(password, user.hashedPassword)) {
      return { success: false, message: '密码错误' };
    }

    userDatabase.delete(sanitizedEmail);
    return { success: true, message: '账户删除成功' };
  }

  // 检查用户是否存在
  static userExists(email: string): boolean {
    return userDatabase.has(email.trim().toLowerCase());
  }
}
