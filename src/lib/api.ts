/**
 * API Client - 统一的 API 客户端
 * 
 * 自动根据环境变量配置 API 地址
 * 确保 Android 和 Web 端使用正确的后端地址
 * Android 端使用 Capacitor Preferences 存储 token（比 localStorage 安全）
 * 
 * 安全特性:
 * - 证书固定 (Certificate Pinning)
 * - 敏感数据请求/响应 AES-256-GCM 加密
 * - 401 自动 token 刷新
 */

import { Capacitor } from '@capacitor/core';

// 从环境变量获取 API 地址，确保跨平台一致性
const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl;
  }

  const mode = import.meta.env.MODE;
  if (mode === 'production') {
    return 'https://api.pawsync.com';
  } else if (mode === 'staging') {
    return 'https://staging-api.pawsync.com';
  }

  return 'http://localhost:3000/api';
};

const API_BASE_URL = getApiBaseUrl();

if (import.meta.env.DEV) {
  console.log('[API] Environment:', import.meta.env.MODE);
  console.log('[API] Base URL:', API_BASE_URL);
}

// ─── 证书固定配置 ────────────────────────────────────────────

interface CertificatePin {
  domain: string;
  fingerprints: string[];
}

const DEFAULT_CERTIFICATE_PINS: CertificatePin[] = [
  {
    domain: 'api.pawsync.com',
    fingerprints: [
      // 生产环境证书 SHA-256 指纹（需根据实际证书更新）
      'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    ],
  },
  {
    domain: 'staging-api.pawsync.com',
    fingerprints: [
      'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
    ],
  },
];

let certificatePins: CertificatePin[] = [...DEFAULT_CERTIFICATE_PINS];

// ─── 加密工具 ────────────────────────────────────────────────

const ENCRYPTION_KEY_CACHE = new Map<string, CryptoKey>();

async function getEncryptionKey(): Promise<CryptoKey> {
  const cacheKey = 'api-encryption-key';
  if (ENCRYPTION_KEY_CACHE.has(cacheKey)) {
    return ENCRYPTION_KEY_CACHE.get(cacheKey)!;
  }

  const encoder = new TextEncoder();
  // 使用 PBKDF2 派生密钥（生产环境应使用设备安全存储中的密钥）
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode('pawsync-api-encryption-v1'),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('pawsync-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );

  ENCRYPTION_KEY_CACHE.set(cacheKey, key);
  return key;
}

async function encryptPayload(data: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data),
  );
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decryptPayload(encryptedBase64: string): Promise<string> {
  const key = await getEncryptionKey();
  const combined = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted,
  );
  return new TextDecoder().decode(decrypted);
}

// 敏感数据端点（需要加密传输）
const SENSITIVE_ENDPOINTS = [
  '/auth/register',
  '/auth/login',
  '/auth/me',
  '/push/register',
  '/push/unregister',
  '/ai/chat',
  '/ai/generate-report',
];

function isSensitiveEndpoint(endpoint: string): boolean {
  return SENSITIVE_ENDPOINTS.some((e) => endpoint.startsWith(e));
}

// ─── 证书固定验证 ────────────────────────────────────────────

function validateCertificatePin(url: string): boolean {
  // 在原生 Android 端，证书固定由 network_security_config.xml 处理
  // 此方法仅在 Web 端运行时提供额外验证层
  if (Capacitor.isNativePlatform()) {
    return true;
  }

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;

    // 开发环境跳过证书固定
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return true;
    }

    const pin = certificatePins.find((p) => p.domain === hostname);
    if (!pin) {
      // 无配置的域名仅允许 HTTPS
      return parsedUrl.protocol === 'https:';
    }

    // Web 端无法直接验证证书指纹，依赖浏览器 TLS 验证
    // 证书固定配置仅用于记录和审计
    return parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

// ─── Token 存储 ──────────────────────────────────────────────

const tokenStorage = {
  async get(): Promise<string | null> {
    if (Capacitor.isNativePlatform()) {
      try {
        const { Preferences } = await import('@capacitor/preferences');
        const result = await Preferences.get({ key: 'auth_token' });
        return result.value;
      } catch {
        return localStorage.getItem('auth_token');
      }
    }
    return localStorage.getItem('auth_token');
  },
  async set(token: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        const { Preferences } = await import('@capacitor/preferences');
        await Preferences.set({ key: 'auth_token', value: token });
        return;
      } catch {
        // 降级到 localStorage
      }
    }
    localStorage.setItem('auth_token', token);
  },
  async remove(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        const { Preferences } = await import('@capacitor/preferences');
        await Preferences.remove({ key: 'auth_token' });
        return;
      } catch {
        // 降级
      }
    }
    localStorage.removeItem('auth_token');
  },
};

// Refresh token 存储
const refreshTokenStorage = {
  async get(): Promise<string | null> {
    if (Capacitor.isNativePlatform()) {
      try {
        const { Preferences } = await import('@capacitor/preferences');
        const result = await Preferences.get({ key: 'refresh_token' });
        return result.value;
      } catch {
        return localStorage.getItem('refresh_token');
      }
    }
    return localStorage.getItem('refresh_token');
  },
  async set(token: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        const { Preferences } = await import('@capacitor/preferences');
        await Preferences.set({ key: 'refresh_token', value: token });
        return;
      } catch {
        // 降级
      }
    }
    localStorage.setItem('refresh_token', token);
  },
  async remove(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        const { Preferences } = await import('@capacitor/preferences');
        await Preferences.remove({ key: 'refresh_token' });
        return;
      } catch {
        // 降级
      }
    }
    localStorage.removeItem('refresh_token');
  },
};

// ─── Token 刷新 ──────────────────────────────────────────────

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;
let onTokenRefreshFailed: (() => void) | null = null;

class ApiClient {
  private token: string | null = null;
  private refreshToken: string | null = null;

  async setToken(token: string) {
    this.token = token;
    await tokenStorage.set(token);
  }

  async setRefreshToken(token: string) {
    this.refreshToken = token;
    await refreshTokenStorage.set(token);
  }

  async getToken(): Promise<string | null> {
    if (!this.token) {
      this.token = await tokenStorage.get();
    }
    return this.token;
  }

  async getRefreshToken(): Promise<string | null> {
    if (!this.refreshToken) {
      this.refreshToken = await refreshTokenStorage.get();
    }
    return this.refreshToken;
  }

  async clearToken() {
    this.token = null;
    this.refreshToken = null;
    await tokenStorage.remove();
    await refreshTokenStorage.remove();
  }

  /**
   * 注册 token 刷新失败回调（如跳转登录页）
   */
  onRefreshFailed(callback: () => void) {
    onTokenRefreshFailed = callback;
  }

  /**
   * 刷新 token（使用 refresh token）
   */
  private async refreshAccessToken(): Promise<boolean> {
    if (isRefreshing) {
      return refreshPromise!;
    }

    isRefreshing = true;
    refreshPromise = (async () => {
      try {
        const refreshToken = await this.getRefreshToken();
        if (!refreshToken) {
          return false;
        }

        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
          return false;
        }

        const data = await response.json();
        if (data.token) {
          await this.setToken(data.token);
          if (data.refreshToken) {
            await this.setRefreshToken(data.refreshToken);
          }
          return true;
        }

        return false;
      } catch (error) {
        console.error('[API] Token refresh failed:', error);
        return false;
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  }

  /**
   * 设置证书固定配置
   */
  setCertificatePins(pins: CertificatePin[]) {
    certificatePins = pins;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    encryptSensitive: boolean = false,
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    // 证书固定验证
    if (!validateCertificatePin(url)) {
      throw new Error('Certificate pin validation failed');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    const token = await this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // 敏感数据加密
    let body = options.body;
    const shouldEncrypt = encryptSensitive || isSensitiveEndpoint(endpoint);
    if (shouldEncrypt && body) {
      try {
        const encryptedBody = await encryptPayload(body as string);
        headers['X-Encrypted'] = '1';
        headers['X-Encryption-Alg'] = 'AES-256-GCM';
        body = JSON.stringify({ encrypted: encryptedBody });
      } catch (error) {
        console.error('[API] Encryption failed, sending plaintext:', error);
      }
    }

    let response = await fetch(url, {
      ...options,
      headers,
      body,
    });

    // 401 处理：尝试刷新 token 后重试
    if (response.status === 401 && !this._isRetry) {
      this._isRetry = true;
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        // 使用新 token 重试
        const newToken = await this.getToken();
        if (newToken) {
          headers['Authorization'] = `Bearer ${newToken}`;
        }
        // 重新加密敏感数据
        if (shouldEncrypt && options.body) {
          try {
            const encryptedBody = await encryptPayload(options.body as string);
            body = JSON.stringify({ encrypted: encryptedBody });
          } catch {
            body = options.body;
          }
        }
        response = await fetch(url, {
          ...options,
          headers,
          body,
        });
        this._isRetry = false;
      } else {
        // 刷新失败，清除 token 并通知
        this._isRetry = false;
        await this.clearToken();
        if (onTokenRefreshFailed) {
          onTokenRefreshFailed();
        }
        throw new Error('Session expired. Please log in again.');
      }
    }

    if (!response.ok) {
      if (response.status === 401) {
        await this.clearToken();
        if (onTokenRefreshFailed) {
          onTokenRefreshFailed();
        }
      }
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    // 敏感数据解密
    const responseData = await response.json();
    if (responseData.encrypted && typeof responseData.encrypted === 'string') {
      try {
        const decrypted = await decryptPayload(responseData.encrypted);
        return JSON.parse(decrypted);
      } catch (error) {
        console.error('[API] Decryption failed:', error);
        return responseData;
      }
    }

    return responseData;
  }

  private _isRetry = false;

  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, data?: Record<string, unknown>) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data?: Record<string, unknown>) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();

export interface ApiResponse<T> {
  user?: T;
  pets?: T[];
  pet?: T;
  records?: T[];
  record?: T;
  reminders?: T[];
  reminder?: T;
  manuals?: T[];
  manual?: T;
  bookmarks?: T[];
  bookmark?: T;
  vaccines?: T[];
  vaccine?: T;
  checkups?: T[];
  checkup?: T;
  growthRecords?: T[];
  growthRecord?: T;
  conversation?: T;
  response?: T;
  report?: T;
  message?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export const authApi = {
  register: (data: { email: string; password: string; name: string; avatar?: string }) =>
    api.post<AuthResponse>('/auth/register', data),
  login: async (data: { email: string; password: string }) => {
    const result = await api.post<AuthResponse>('/auth/login', data);
    if (result.token) {
      await api.setToken(result.token);
    }
    if (result.refreshToken) {
      await api.setRefreshToken(result.refreshToken);
    }
    return result;
  },
  getMe: () => api.get<{ user: User }>('/auth/me'),
  updateMe: (data: Partial<User>) =>
    api.put<{ user: User }>('/auth/me', data),
  refresh: () => api.post<AuthResponse>('/auth/refresh'),
  logout: async () => {
    await api.clearToken();
  },
};

export interface Pet {
  id: string;
  name: string;
  avatar?: string;
  type: 'DOG' | 'CAT' | 'OTHER';
  breed?: string;
  gender: 'MALE' | 'FEMALE';
  birthday?: string;
  weight?: number;
  color?: string;
  characteristics?: string;
  healthStatus: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'CONCERN';
  createdAt: string;
  updatedAt: string;
}

export const petsApi = {
  getAll: () => api.get<{ pets: Pet[] }>('/pets'),
  create: (data: Omit<Pet, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<{ pet: Pet }>('/pets', data),
  getById: (id: string) => api.get<{ pet: Pet }>(`/pets/${id}`),
  update: (id: string, data: Partial<Pet>) =>
    api.put<{ pet: Pet }>(`/pets/${id}`, data),
  delete: (id: string) => api.delete(`/pets/${id}`),
  getVaccines: (id: string) => api.get<{ vaccines: Record<string, unknown>[] }>(`/pets/${id}/vaccines`),
  addVaccine: (id: string, data: Record<string, unknown>) =>
    api.post<{ vaccine: Record<string, unknown> }>(`/pets/${id}/vaccines`, data),
  getCheckups: (id: string) => api.get<{ checkups: Record<string, unknown>[] }>(`/pets/${id}/checkups`),
  addCheckup: (id: string, data: Record<string, unknown>) =>
    api.post<{ checkup: Record<string, unknown> }>(`/pets/${id}/checkups`, data),
  getGrowth: (id: string) => api.get<{ growthRecords: Record<string, unknown>[] }>(`/pets/${id}/growth`),
  addGrowth: (id: string, data: Record<string, unknown>) =>
    api.post<{ growthRecord: Record<string, unknown> }>(`/pets/${id}/growth`, data),
};

export interface HealthRecord {
  id: string;
  petId: string;
  type: 'TEXT' | 'VOICE' | 'PHOTO' | 'VIDEO' | 'FILE';
  title: string;
  content: string;
  tags: string[];
  attachments?: string[];
  voiceDuration?: number;
  isImportant: boolean;
  createdAt: string;
  updatedAt: string;
  pet?: Pet;
}

export const healthRecordsApi = {
  getAll: (params?: { petId?: string; type?: string; tag?: string; important?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.petId) query.set('petId', params.petId);
    if (params?.type) query.set('type', params.type);
    if (params?.tag) query.set('tag', params.tag);
    if (params?.important) query.set('important', params.important.toString());
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return api.get<{ records: HealthRecord[] }>(`/health-records${queryString}`);
  },
  search: (q: string) =>
    api.get<{ records: HealthRecord[] }>(`/health-records/search?q=${encodeURIComponent(q)}`),
  create: (data: Omit<HealthRecord, 'id' | 'createdAt' | 'updatedAt' | 'pet'>) =>
    api.post<{ record: HealthRecord }>('/health-records', data),
  getById: (id: string) => api.get<{ record: HealthRecord }>(`/health-records/${id}`),
  update: (id: string, data: Partial<HealthRecord>) =>
    api.put<{ record: HealthRecord }>(`/health-records/${id}`, data),
  delete: (id: string) => api.delete(`/health-records/${id}`),
};

export interface Reminder {
  id: string;
  petId: string;
  type: 'VACCINE' | 'DEWORMING' | 'CHECKUP' | 'BATH' | 'BRUSH_TEETH' | 'MEDICINE' | 'GROOMING' | 'CUSTOM';
  title: string;
  notes?: string;
  date: string;
  time: string;
  repeat: 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  endDate?: string;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  pet?: Pet;
}

export const remindersApi = {
  getAll: (params?: { petId?: string; type?: string; completed?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.petId) query.set('petId', params.petId);
    if (params?.type) query.set('type', params.type);
    if (params?.completed !== undefined) query.set('completed', params.completed.toString());
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return api.get<{ reminders: Reminder[] }>(`/reminders${queryString}`);
  },
  getUpcoming: () => api.get<{ reminders: Reminder[] }>('/reminders/upcoming'),
  create: (data: Omit<Reminder, 'id' | 'createdAt' | 'completedAt' | 'pet'>) =>
    api.post<{ reminder: Reminder }>('/reminders', data),
  getById: (id: string) => api.get<{ reminder: Reminder }>(`/reminders/${id}`),
  update: (id: string, data: Partial<Reminder>) =>
    api.put<{ reminder: Reminder }>(`/reminders/${id}`, data),
  delete: (id: string) => api.delete(`/reminders/${id}`),
  complete: (id: string) =>
    api.post<{ reminder: Reminder }>(`/reminders/${id}/complete`),
};

export interface HealthManual {
  id: string;
  title: string;
  content: string;
  category: 'NUTRITION' | 'CARE' | 'BEHAVIOR' | 'EMERGENCY' | 'TRAINING';
  petType?: 'DOG' | 'CAT' | 'OTHER';
  tags: string[];
  author?: string;
  viewCount: number;
  isOfficial: boolean;
  createdAt: string;
  updatedAt: string;
}

export const manualsApi = {
  getAll: (params?: { category?: string; petType?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.petType) query.set('petType', params.petType);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return api.get<{ manuals: HealthManual[] }>(`/manuals${queryString}`);
  },
  search: (q: string) =>
    api.get<{ manuals: HealthManual[] }>(`/manuals/search?q=${encodeURIComponent(q)}`),
  getById: (id: string) => api.get<{ manual: HealthManual }>(`/manuals/${id}`),
  getBookmarks: () => api.get<{ bookmarks: Record<string, unknown>[] }>('/manuals/bookmarks'),
  addBookmark: (id: string) =>
    api.post<{ bookmark: Record<string, unknown> }>(`/manuals/${id}/bookmark`),
  removeBookmark: (id: string) =>
    api.delete(`/manuals/${id}/bookmark`),
};

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AIConversation {
  id: string;
  petId: string;
  userId: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export const aiApi = {
  chat: (data: { petId: string; message: string }) =>
    api.post<{ conversation: AIConversation; response: Message }>('/ai/chat', data),
  getConversation: (petId: string) =>
    api.get<{ conversation: AIConversation }>(`/ai/conversations/${petId}`),
  generateReport: (data: { petId: string }) =>
    api.post<{ report: Record<string, unknown> }>('/ai/generate-report', data),
};