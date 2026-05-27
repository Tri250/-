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
      throw new Error(error.message || error.error || `HTTP ${response.status}`);
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
  code: number;
  message: string;
  data?: T;
  timestamp: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isPremium?: boolean;
  premiumExpires?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authApi = {
  register: (data: { email: string; password: string; name: string; avatar?: string }) =>
    api.post<ApiResponse<{ user: User; token: string }>>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', data),
  getMe: () => api.get<ApiResponse<{ user: User }>>('/auth/me'),
  updateMe: (data: Partial<User>) =>
    api.put<ApiResponse<{ user: User }>>('/auth/me', data),
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
  healthScore?: number;
  behaviorBaseline?: string;
  createdAt: string;
  updatedAt: string;
}

export const petsApi = {
  getAll: () => api.get<ApiResponse<{ pets: Pet[] }>>('/pets'),
  create: (data: Omit<Pet, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<ApiResponse<{ pet: Pet }>>('/pets', data),
  getById: (id: string) => api.get<ApiResponse<{ pet: Pet }>>(`/pets/${id}`),
  update: (id: string, data: Partial<Pet>) =>
    api.put<ApiResponse<{ pet: Pet }>>(`/pets/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/pets/${id}`),
  getVaccines: (id: string) => api.get<ApiResponse<{ vaccines: any[] }>>(`/pets/${id}/vaccines`),
  addVaccine: (id: string, data: any) =>
    api.post<ApiResponse<{ vaccine: any }>>(`/pets/${id}/vaccines`, data),
  getCheckups: (id: string) => api.get<ApiResponse<{ checkups: any[] }>>(`/pets/${id}/checkups`),
  addCheckup: (id: string, data: any) =>
    api.post<ApiResponse<{ checkup: any }>>(`/pets/${id}/checkups`, data),
  getGrowth: (id: string) => api.get<ApiResponse<{ growthRecords: any[] }>>(`/pets/${id}/growth`),
  addGrowth: (id: string, data: any) =>
    api.post<ApiResponse<{ growthRecord: any }>>(`/pets/${id}/growth`, data),
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
    return api.get<ApiResponse<{ records: HealthRecord[] }>>(`/health-records${queryString}`);
  },
  search: (q: string) =>
    api.get<ApiResponse<{ records: HealthRecord[] }>>(`/health-records/search?q=${encodeURIComponent(q)}`),
  create: (data: Omit<HealthRecord, 'id' | 'createdAt' | 'updatedAt' | 'pet'>) =>
    api.post<ApiResponse<{ record: HealthRecord }>>('/health-records', data),
  getById: (id: string) => api.get<ApiResponse<{ record: HealthRecord }>>(`/health-records/${id}`),
  update: (id: string, data: Partial<HealthRecord>) =>
    api.put<ApiResponse<{ record: HealthRecord }>>(`/health-records/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/health-records/${id}`),
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
    return api.get<ApiResponse<{ reminders: Reminder[] }>>(`/reminders${queryString}`);
  },
  getUpcoming: () => api.get<ApiResponse<{ reminders: Reminder[] }>>('/reminders/upcoming'),
  create: (data: Omit<Reminder, 'id' | 'createdAt' | 'completedAt' | 'pet'>) =>
    api.post<ApiResponse<{ reminder: Reminder }>>('/reminders', data),
  getById: (id: string) => api.get<ApiResponse<{ reminder: Reminder }>>(`/reminders/${id}`),
  update: (id: string, data: Partial<Reminder>) =>
    api.put<ApiResponse<{ reminder: Reminder }>>(`/reminders/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/reminders/${id}`),
  complete: (id: string) =>
    api.post<ApiResponse<{ reminder: Reminder }>>(`/reminders/${id}/complete`),
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
    return api.get<ApiResponse<{ manuals: HealthManual[] }>>(`/manuals${queryString}`);
  },
  search: (q: string) =>
    api.get<ApiResponse<{ manuals: HealthManual[] }>>(`/manuals/search?q=${encodeURIComponent(q)}`),
  getById: (id: string) => api.get<ApiResponse<{ manual: HealthManual }>>(`/manuals/${id}`),
  getBookmarks: () => api.get<ApiResponse<{ bookmarks: any[] }>>('/manuals/bookmarks'),
  addBookmark: (id: string) =>
    api.post<ApiResponse<{ bookmark: any }>>(`/manuals/${id}/bookmark`),
  removeBookmark: (id: string) =>
    api.delete<ApiResponse<null>>(`/manuals/${id}/bookmark`),
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
    api.post<ApiResponse<{ conversation: AIConversation; response: Message }>>('/ai/chat', data),
  getConversation: (petId: string) =>
    api.get<ApiResponse<{ conversations: AIConversation[] }>>(`/ai/conversations/${petId}`),
  generateReport: (data: { petId: string }) =>
    api.post<ApiResponse<{ report: any }>>('/ai/generate-report', data),
};

export interface VoiceAnalysisResult {
  emotion: string;
  confidence: number;
  transcription: string;
  intent: string;
}

export interface VoiceMemory {
  id: string;
  userId: string;
  petId?: string;
  audioUrl: string;
  emotion: string;
  confidence: number;
  transcription?: string;
  intent?: string;
  isCloned: boolean;
  createdAt: string;
}

export const voiceApi = {
  analyze: (data: { petId: string; audioBase64: string }) =>
    api.post<ApiResponse<{ result: VoiceAnalysisResult; voiceMemory: VoiceMemory }>>('/voice/analyze', data),
  translate: (data: { petId: string; audioBase64: string }) =>
    api.post<ApiResponse<{ translation: string; emotion: string; confidence: number }>>('/voice/translate', data),
  clone: (data: { petId: string; audioSamples: string[] }) =>
    api.post<ApiResponse<{ voiceMemory: VoiceMemory }>>('/voice/clone', data),
  getMemories: () => api.get<ApiResponse<{ memories: VoiceMemory[] }>>('/voice/memories'),
  getPetMemories: (petId: string) => api.get<ApiResponse<{ memories: VoiceMemory[] }>>(`/voice/memories/${petId}`),
  deleteMemory: (id: string) => api.delete<ApiResponse<null>>(`/voice/memories/${id}`),
};

export interface BehaviorEvent {
  id: string;
  petId: string;
  behaviorType: string;
  confidence: number;
  timestamp: string;
  duration?: number;
  metadata: string;
  createdAt: string;
}

export interface EmotionRecord {
  id: string;
  petId: string;
  emotionType: string;
  source: string;
  confidence: number;
  timestamp: string;
  imageUrl?: string;
  voiceUrl?: string;
  behaviorEventId?: string;
  createdAt: string;
}

export interface MultimodalResult {
  overallEmotion: string;
  confidence: number;
  shouldAlert: boolean;
  alertType?: string;
  severity?: string;
  message: string;
  recommendation?: string;
}

export const behaviorApi = {
  record: (data: { petId: string; behaviorType: string; confidence: number; duration?: number; metadata?: any }) =>
    api.post<ApiResponse<{ behaviorEvent: BehaviorEvent }>>('/behavior/record', data),
  analyzeEmotion: (data: { petId: string; source: string; emotionType: string; confidence: number; imageUrl?: string; voiceUrl?: string; behaviorEventId?: string }) =>
    api.post<ApiResponse<{ emotionRecord: EmotionRecord }>>('/behavior/analyze-emotion', data),
  multimodalAnalyze: (data: { petId: string; behaviorData?: any; voiceData?: any; imageData?: any }) =>
    api.post<ApiResponse<MultimodalResult>>('/behavior/multimodal-analyze', data),
  getEvents: (petId: string) => api.get<ApiResponse<{ events: BehaviorEvent[] }>>(`/behavior/events/${petId}`),
  getEmotions: (petId: string) => api.get<ApiResponse<{ emotions: EmotionRecord[] }>>(`/behavior/emotions/${petId}`),
};

export interface HealthAlert {
  id: string;
  petId: string;
  type: string;
  severity: string;
  message: string;
  recommendation: string;
  isResolved: boolean;
  resolvedAt?: string;
  timestamp: string;
}

export interface DiagnosisResult {
  symptoms: string[];
  breed?: string;
  possibleConditions: string[];
  recommendations: string[];
  confidence: number;
  shouldSeeVet: boolean;
  urgency: string;
}

export interface DailyJournal {
  id: string;
  petId: string;
  date: string;
  summary: string;
  highlights: string[];
  healthScore: number;
  activityScore: number;
  emotionScore: number;
  events: string;
  createdAt: string;
}

export const healthApi = {
  getAlerts: (petId: string) => api.get<ApiResponse<{ alerts: HealthAlert[] }>>(`/health/alerts/${petId}`),
  resolveAlert: (id: string) => api.post<ApiResponse<{ alert: HealthAlert }>>(`/health/alerts/${id}/resolve`),
  diagnose: (data: { petId: string; symptoms: string[]; age?: number; weight?: number; breed?: string }) =>
    api.post<ApiResponse<DiagnosisResult>>('/health/diagnose', data),
  getJournal: (petId: string) => api.get<ApiResponse<{ journals: DailyJournal[] }>>(`/health/journal/${petId}`),
  generateJournal: (petId: string) => api.post<ApiResponse<{ journal: DailyJournal }>>(`/health/journal/generate/${petId}`),
};

export interface FoodAnalysisResult {
  foodName?: string;
  nutritionScore: number;
  warnings: string[];
  recommendations: string[];
  ingredientCount: number;
}

export interface FoodAnalysis {
  id: string;
  userId: string;
  petId?: string;
  foodName?: string;
  ingredients: string;
  nutritionScore: number;
  warnings: string;
  recommendations: string;
  createdAt: string;
}

export interface NutritionRecommendation {
  petType: string;
  breed?: string;
  age?: number;
  weight?: number;
  activityLevel: string;
  dailyCalories?: number;
  keyNutrients: string[];
  feedingTips: string[];
  ingredientPreferences: string[];
  warnings: string[];
}

export const foodApi = {
  analyze: (data: { ingredients: string; foodName?: string; petId?: string }) =>
    api.post<ApiResponse<{ analysis: FoodAnalysisResult; foodAnalysis: FoodAnalysis }>>('/food/analyze', data),
  ocrAnalyze: (data: { imageBase64: string; petId?: string }) =>
    api.post<ApiResponse<{ ocrResult: string; analysis: FoodAnalysisResult; foodAnalysis: FoodAnalysis }>>('/food/ocr-analyze', data),
  getHistory: () => api.get<ApiResponse<{ analyses: FoodAnalysis[] }>>('/food/history'),
  deleteAnalysis: (id: string) => api.delete<ApiResponse<null>>(`/food/history/${id}`),
  recommend: (data: { petId: string; age?: number; weight?: number; activityLevel?: string; healthConditions?: string[] }) =>
    api.post<ApiResponse<NutritionRecommendation>>('/food/recommend', data),
};

export const systemApi = {
  healthCheck: () => api.get<{ status: string; message: string }>('/health-check'),
  getFeatures: () => api.get<ApiResponse<{ features: { id: string; name: string; description: string; status: string }[] }>>('/features'),
};
