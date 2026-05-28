const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  getToken() {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (this.getToken()) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, data?: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data?: any) {
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
}

export const authApi = {
  register: (data: { email: string; password: string; name: string; avatar?: string }) =>
    api.post<AuthResponse>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),
  getMe: () => api.get<{ user: User }>('/auth/me'),
  updateMe: (data: Partial<User>) =>
    api.put<{ user: User }>('/auth/me', data),
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
  getVaccines: (id: string) => api.get<{ vaccines: any[] }>(`/pets/${id}/vaccines`),
  addVaccine: (id: string, data: any) =>
    api.post<{ vaccine: any }>(`/pets/${id}/vaccines`, data),
  getCheckups: (id: string) => api.get<{ checkups: any[] }>(`/pets/${id}/checkups`),
  addCheckup: (id: string, data: any) =>
    api.post<{ checkup: any }>(`/pets/${id}/checkups`, data),
  getGrowth: (id: string) => api.get<{ growthRecords: any[] }>(`/pets/${id}/growth`),
  addGrowth: (id: string, data: any) =>
    api.post<{ growthRecord: any }>(`/pets/${id}/growth`, data),
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
  getBookmarks: () => api.get<{ bookmarks: any[] }>('/manuals/bookmarks'),
  addBookmark: (id: string) =>
    api.post<{ bookmark: any }>(`/manuals/${id}/bookmark`),
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
    api.post<{ report: any }>('/ai/generate-report', data),
};

// 监控模块 API
export interface CameraDevice {
  id: string;
  userId: string;
  petId?: string;
  name: string;
  brand: string;
  model: string;
  serialNumber: string;
  status: 'online' | 'offline' | 'error' | 'updating';
  thumbnailUrl?: string;
  streamUrl?: string;
  webrtcUrl?: string;
  ipAddress?: string;
  location?: string;
  capabilities: string[];
  settings: any;
  bindingSecurityLevel: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  pet?: Pet;
}

export interface MotionAlert {
  id: string;
  userId: string;
  cameraId: string;
  petId?: string;
  type: 'motion' | 'sound' | 'pet_detected' | 'person_detected' | 'intrusion' | 'pet_in_trouble';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  isAcknowledged: boolean;
  acknowledgedAt?: string;
  createdAt: string;
  camera?: CameraDevice;
  pet?: Pet;
}

export interface CameraRecording {
  id: string;
  userId: string;
  cameraId: string;
  petId?: string;
  type: 'motion' | 'manual' | 'scheduled' | 'alert';
  startTime: string;
  endTime?: string;
  duration?: number;
  size: number;
  thumbnailUrl?: string;
  videoUrl?: string;
  cloudUrl?: string;
  isFavorite: boolean;
  hasAIAnalysis: boolean;
  aiTags?: string[];
  isDeleted: boolean;
  createdAt: string;
  camera?: CameraDevice;
  pet?: Pet;
}

export interface CameraStatistics {
  id: string;
  cameraId: string;
  date: string;
  totalRecordingTime: number;
  motionEvents: number;
  petDetections: number;
  averageLatency: number;
  storageUsed: number;
  bandwidthUsed: number;
  createdAt: string;
}

export const cameraApi = {
  // 设备白名单
  seedWhitelist: () => api.post('/camera/seed-whitelist'),

  // 摄像头设备管理
  getCameras: () => api.get<{ data: CameraDevice[] }>('/camera/cameras'),
  bindCamera: (data: {
    name: string;
    brand: string;
    model: string;
    serialNumber: string;
    petId?: string;
    location?: string;
    thumbnailUrl?: string;
  }) => api.post<{ data: CameraDevice }>('/camera/cameras', data),
  getCameraById: (id: string) => api.get<{ data: CameraDevice }>(`/camera/cameras/${id}`),
  updateCamera: (id: string, data: Partial<{
    name?: string;
    petId?: string;
    location?: string;
    status?: 'online' | 'offline' | 'error' | 'updating';
    thumbnailUrl?: string;
    settings?: any;
  }>) => api.put<{ data: CameraDevice }>(`/camera/cameras/${id}`, data),
  deleteCamera: (id: string) => api.delete(`/camera/cameras/${id}`),

  // 告警管理
  getAlerts: () => api.get<{ data: MotionAlert[] }>('/camera/alerts'),
  createAlert: (data: Omit<MotionAlert, 'id' | 'createdAt' | 'user' | 'camera' | 'pet' | 'acknowledgedAt'>) =>
    api.post<{ data: MotionAlert }>('/camera/alerts', data),
  acknowledgeAlert: (id: string) =>
    api.put<{ data: MotionAlert }>(`/camera/alerts/${id}/acknowledge`),

  // 录像管理
  getRecordings: () => api.get<{ data: CameraRecording[] }>('/camera/recordings'),
  deleteRecording: (id: string) => api.delete(`/camera/recordings/${id}`),

  // 统计数据
  getStatistics: (id: string) =>
    api.get<{ data: CameraStatistics }>(`/camera/statistics/cameras/${id}/statistics`),

  // 跨模块联动
  createHealthRecordFromAlert: (alertId: string, data?: { title?: string; content?: string }) =>
    api.post<{ data: HealthRecord }>(`/camera/alerts/${alertId}/create-health-record`, data),
};
