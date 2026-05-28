
# PawSync Pro API 接口资源完整文档

**版本**: 3.0  
**最后更新**: 2026-05-28  
**基础URL**: `http://localhost:3000/api`

---

## 目录

1. [认证与授权](#认证与授权)
2. [宠物管理接口](#宠物管理接口)
3. [健康记录接口](#健康记录接口)
4. [AI顾问接口](#ai顾问接口)
5. [智能提醒接口](#智能提醒接口)
6. [健康手册接口](#健康手册接口)
7. [文件上传接口](#文件上传接口)
8. [前端API服务层](#前端api服务层)
9. [新增扩展接口](#新增扩展接口)

---

## 认证与授权

### 认证方式
使用 JWT (JSON Web Token) 进行认证，需要在请求头中携带：
```
Authorization: Bearer &lt;token&gt;
```

### 1.1 用户注册

**接口**: `POST /auth/register`

**请求体**:
```json
{
  "email": "demo@pawsync.pro",
  "password": "password123",
  "name": "毛孩子家长",
  "avatar": "https://example.com/avatar.jpg"
}
```

**响应 (201)**:
```json
{
  "user": {
    "id": "uuid",
    "email": "demo@pawsync.pro",
    "name": "毛孩子家长",
    "avatar": "https://example.com/avatar.jpg"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 1.2 用户登录

**接口**: `POST /auth/login`

**请求体**:
```json
{
  "email": "demo@pawsync.pro",
  "password": "password123"
}
```

**响应 (200)**:
```json
{
  "user": {
    "id": "uuid",
    "email": "demo@pawsync.pro",
    "name": "毛孩子家长",
    "avatar": "https://example.com/avatar.jpg"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 1.3 获取当前用户信息

**接口**: `GET /auth/me`  
**认证**: 需要

**响应 (200)**:
```json
{
  "user": {
    "id": "uuid",
    "email": "demo@pawsync.pro",
    "name": "毛孩子家长",
    "avatar": "https://example.com/avatar.jpg",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

---

## 宠物管理接口

### 2.1 获取宠物列表

**接口**: `GET /pets`  
**认证**: 需要

**响应 (200)**:
```json
{
  "pets": [
    {
      "id": "pet-uuid-1",
      "name": "毛球",
      "avatar": "https://example.com/pet1.jpg",
      "type": "CAT",
      "breed": "英国短毛猫",
      "gender": "FEMALE",
      "birthday": "2022-05-20T00:00:00Z",
      "weight": 4.5,
      "healthStatus": "GOOD",
      "healthRecords": [...],
      "reminders": [...]
    }
  ]
}
```

### 2.2 创建宠物

**接口**: `POST /pets`  
**认证**: 需要

**请求体**:
```json
{
  "name": "毛球",
  "avatar": "https://example.com/pet.jpg",
  "type": "CAT",
  "breed": "英国短毛猫",
  "gender": "FEMALE",
  "birthday": "2022-05-20",
  "weight": 4.5,
  "color": "银渐层",
  "characteristics": "粘人、可爱",
  "healthStatus": "GOOD"
}
```

**响应 (201)**:
```json
{
  "pet": {
    "id": "pet-uuid",
    "name": "毛球",
    "type": "CAT",
    "breed": "英国短毛猫",
    "gender": "FEMALE",
    "birthday": "2022-05-20T00:00:00Z",
    "weight": 4.5,
    "healthStatus": "GOOD",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 2.3 获取宠物详情

**接口**: `GET /pets/:id`  
**认证**: 需要

**响应 (200)**:
```json
{
  "pet": {
    "id": "pet-uuid",
    "name": "毛球",
    "type": "CAT",
    "breed": "英国短毛猫",
    "gender": "FEMALE",
    "healthRecords": [...],
    "vaccines": [...],
    "checkups": [...],
    "growthRecords": [...],
    "reminders": [...]
  }
}
```

### 2.4 更新宠物信息

**接口**: `PUT /pets/:id`  
**认证**: 需要

**请求体**: 同创建宠物

### 2.5 删除宠物

**接口**: `DELETE /pets/:id`  
**认证**: 需要

### 2.6 疫苗记录管理

**获取疫苗记录**: `GET /pets/:id/vaccines`

**添加疫苗记录**: `POST /pets/:id/vaccines`
```json
{
  "name": "猫三联",
  "date": "2024-01-15",
  "nextDate": "2025-01-15",
  "vet": "张医生",
  "notes": "一切正常"
}
```

### 2.7 体检记录管理

**获取体检记录**: `GET /pets/:id/checkups`

**添加体检记录**: `POST /pets/:id/checkups`
```json
{
  "date": "2024-01-15",
  "weight": 4.5,
  "vet": "张医生",
  "notes": "健康状况良好",
  "attachments": ["https://example.com/report.pdf"]
}
```

### 2.8 成长记录管理

**获取成长记录**: `GET /pets/:id/growth`

**添加成长记录**: `POST /pets/:id/growth`
```json
{
  "date": "2024-01-15",
  "weight": 4.5,
  "height": 25,
  "notes": "正常增长"
}
```

---

## 健康记录接口

### 3.1 获取健康记录列表

**接口**: `GET /health-records`  
**认证**: 需要

**查询参数**:
- `petId`: 宠物ID (可选)
- `type`: 记录类型 (TEXT/VOICE/PHOTO/VIDEO/FILE)
- `tag`: 标签筛选
- `search`: 搜索关键词
- `page`: 页码
- `limit`: 每页数量

**响应 (200)**:
```json
{
  "records": [
    {
      "id": "record-uuid",
      "petId": "pet-uuid",
      "type": "TEXT",
      "title": "毛球今天很开心",
      "content": "今天带毛球去了公园...",
      "tags": ["日常", "开心"],
      "attachments": [],
      "isImportant": false,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

### 3.2 创建健康记录

**接口**: `POST /health-records`  
**认证**: 需要

**请求体**:
```json
{
  "petId": "pet-uuid",
  "type": "TEXT",
  "title": "毛球今天很开心",
  "content": "今天带毛球去了公园...",
  "tags": ["日常", "开心"],
  "attachments": ["https://example.com/photo.jpg"],
  "voiceDuration": 30,
  "isImportant": false
}
```

### 3.3 获取单条记录

**接口**: `GET /health-records/:id`  
**认证**: 需要

### 3.4 更新记录

**接口**: `PUT /health-records/:id`  
**认证**: 需要

### 3.5 删除记录

**接口**: `DELETE /health-records/:id`  
**认证**: 需要

### 3.6 搜索记录

**接口**: `GET /health-records/search`  
**认证**: 需要

**查询参数**:
- `q`: 搜索关键词
- `petId`: 宠物ID (可选)

---

## AI顾问接口

### 4.1 AI对话

**接口**: `POST /ai/chat`  
**认证**: 需要

**请求体**:
```json
{
  "petId": "pet-uuid",
  "message": "我的猫最近食欲不好怎么办？",
  "conversationId": "conversation-uuid"
}
```

**响应 (200)**:
```json
{
  "response": "您好！猫咪食欲不好可能有多种原因...",
  "conversationId": "conversation-uuid",
  "suggestions": [
    "观察排便情况",
    "测量体温",
    "检查口腔"
  ]
}
```

### 4.2 获取对话历史

**接口**: `GET /ai/conversations/:petId`  
**认证**: 需要

**响应 (200)**:
```json
{
  "conversations": [
    {
      "id": "conversation-uuid",
      "petId": "pet-uuid",
      "messages": [
        { "role": "user", "content": "我的猫最近食欲不好" },
        { "role": "assistant", "content": "您好！猫咪食欲不好可能..." }
      ],
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### 4.3 化验单解读

**接口**: `POST /ai/analyze-report`  
**认证**: 需要

**请求体** (FormData):
```
file: [化验单图片]
petId: "pet-uuid"
```

**响应 (200)**:
```json
{
  "analysis": {
    "summary": "整体健康状况良好",
    "abnormalItems": [
      { "name": "白细胞", "value": "12.5", "reference": "5.5-10.5", "status": "HIGH" }
    ],
    "recommendations": ["建议两周后复查", "注意观察精神状态"]
  }
}
```

### 4.4 生成健康报告

**接口**: `POST /ai/generate-report`  
**认证**: 需要

**请求体**:
```json
{
  "petId": "pet-uuid",
  "period": "7d",
  "format": "json"
}
```

**响应 (200)**:
```json
{
  "report": {
    "healthScore": 85,
    "period": "2024-01-08 to 2024-01-15",
    "metrics": {
      "activity": 75,
      "appetite": 90,
      "sleep": 85
    },
    "recommendations": [...],
    "pdfUrl": "https://example.com/report.pdf"
  }
}
```

---

## 智能提醒接口

### 5.1 获取提醒列表

**接口**: `GET /reminders`  
**认证**: 需要

**查询参数**:
- `petId`: 宠物ID (可选)
- `type`: 提醒类型
- `upcoming`: 只显示即将到来的
- `includeCompleted`: 包含已完成的

**响应 (200)**:
```json
{
  "reminders": [
    {
      "id": "reminder-uuid",
      "petId": "pet-uuid",
      "type": "VACCINE",
      "title": "猫三联疫苗",
      "notes": "记得带疫苗本",
      "date": "2024-02-15",
      "time": "10:00",
      "repeat": "YEARLY",
      "isCompleted": false,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 5.2 创建提醒

**接口**: `POST /reminders`  
**认证**: 需要

**请求体**:
```json
{
  "petId": "pet-uuid",
  "type": "VACCINE",
  "title": "猫三联疫苗",
  "notes": "记得带疫苗本",
  "date": "2024-02-15",
  "time": "10:00",
  "repeat": "YEARLY",
  "endDate": "2026-02-15"
}
```

### 5.3 获取即将到来的提醒

**接口**: `GET /reminders/upcoming`  
**认证**: 需要

**查询参数**:
- `days`: 未来天数 (默认7天)

### 5.4 标记完成

**接口**: `POST /reminders/:id/complete`  
**认证**: 需要

---

## 健康手册接口

### 6.1 获取手册列表

**接口**: `GET /manuals`  
**认证**: 可选

**查询参数**:
- `category`: 分类 (NUTRITION/CARE/BEHAVIOR/EMERGENCY/TRAINING)
- `petType`: 宠物类型
- `search`: 搜索关键词
- `tag`: 标签

**响应 (200)**:
```json
{
  "manuals": [
    {
      "id": "manual-uuid",
      "title": "猫咪的营养需求",
      "content": "猫咪需要蛋白质、维生素...",
      "category": "NUTRITION",
      "petType": "CAT",
      "tags": ["营养", "猫粮"],
      "viewCount": 1234,
      "isOfficial": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 6.2 获取手册详情

**接口**: `GET /manuals/:id`  
**认证**: 可选

### 6.3 我的收藏

**接口**: `GET /manuals/bookmarks`  
**认证**: 需要

### 6.4 添加/取消收藏

**添加收藏**: `POST /manuals/:id/bookmark`  
**取消收藏**: `DELETE /manuals/:id/bookmark`  
**认证**: 需要

---

## 文件上传接口

### 7.1 上传文件

**接口**: `POST /upload`  
**认证**: 需要

**请求** (FormData):
```
file: [文件]
type: avatar/photo/voice/document
petId: pet-uuid (可选)
```

**响应 (200)**:
```json
{
  "url": "https://example.com/uploads/file-uuid.jpg",
  "filename": "photo.jpg",
  "size": 1024000,
  "mimeType": "image/jpeg"
}
```

---

## 新增扩展接口

### 8.1 情绪分析接口

**分析语音情绪**: `POST /emotion/analyze-voice`
```json
{
  "audioData": "base64-encoded-audio",
  "petId": "pet-uuid"
}
```

**响应**:
```json
{
  "emotion": "HAPPY",
  "confidence": 0.85,
  "intensity": 75,
  "translation": "喵~ 主人我今天超开心！",
  "dimensions": {
    "excitement": 80,
    "anxiety": 10,
    "affection": 90
  }
}
```

### 8.2 首页数据聚合

**接口**: `GET /dashboard`  
**认证**: 需要

**响应**:
```json
{
  "bondScore": 85,
  "recentActivities": [...],
  "healthOverview": {
    "overallScore": 90,
    "activity": 85,
    "sleep": 92,
    "nutrition": 88
  },
  "upcomingReminders": [...],
  "quickStats": {
    "totalRecords": 156,
    "daysWithPet": 365,
    "vetVisits": 5
  }
}
```

### 8.3 摄像头监控接口

**获取摄像头列表**: `GET /cameras`

**获取直播流**: `GET /cameras/:id/stream`

**AI事件检测**: `GET /cameras/:id/events`

---

## 前端API服务层实现

创建以下文件实现完整的前端API服务：

### 文件 1: `src/lib/api.ts` - 基础API客户端

```typescript
import { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:3000/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
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
    
    const headers: Record&lt;string, string&gt; = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '请求失败');
    }

    return data;
  }

  async get&lt;T&gt;(endpoint: string, params?: Record&lt;string, any&gt;) {
    const url = params
      ? `${endpoint}?${new URLSearchParams(params).toString()}`
      : endpoint;
    return this.request&lt;T&gt;(url, { method: 'GET' });
  }

  async post&lt;T&gt;(endpoint: string, body?: any) {
    return this.request&lt;T&gt;(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put&lt;T&gt;(endpoint: string, body?: any) {
    return this.request&lt;T&gt;(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete&lt;T&gt;(endpoint: string) {
    return this.request&lt;T&gt;(endpoint, { method: 'DELETE' });
  }

  async upload&lt;T&gt;(endpoint: string, formData: FormData) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record&lt;string, string&gt; = {};
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '上传失败');
    }

    return data as T;
  }
}

export const api = new ApiClient();

// Hook
export function useApi&lt;T&gt;(
  endpoint: string,
  options?: { enabled?: boolean; params?: Record&lt;string, any&gt; }
) {
  const { enabled = true, params } = options || {};
  const [data, setData] = useState&lt;T | null&gt;(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState&lt;Error | null&gt;(null);

  const refetch = async () =&gt; {
    if (!enabled) return;
    
    try {
      setLoading(true);
      setError(null);
      const result = await api.get&lt;T&gt;(endpoint, params);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() =&gt; {
    refetch();
  }, [endpoint, enabled, JSON.stringify(params)]);

  return { data, loading, error, refetch };
}
```

### 文件 2: `src/services/authService.ts`

```typescript
import { api } from '../lib/api';

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

export const authService = {
  async register(data: {
    email: string;
    password: string;
    name: string;
    avatar?: string;
  }): Promise&lt;AuthResponse&gt; {
    const result = await api.post&lt;AuthResponse&gt;('/auth/register', data);
    api.setToken(result.token);
    return result;
  },

  async login(data: {
    email: string;
    password: string;
  }): Promise&lt;AuthResponse&gt; {
    const result = await api.post&lt;AuthResponse&gt;('/auth/login', data);
    api.setToken(result.token);
    return result;
  },

  async getMe(): Promise&lt;{ user: User }&gt; {
    return api.get('/auth/me');
  },

  async updateProfile(data: {
    name?: string;
    avatar?: string;
  }): Promise&lt;{ user: User }&gt; {
    return api.put('/auth/me', data);
  },

  logout() {
    api.clearToken();
  },
};
```

### 文件 3: `src/services/petService.ts`

```typescript
import { api } from '../lib/api';

export type PetType = 'DOG' | 'CAT' | 'OTHER';
export type PetGender = 'MALE' | 'FEMALE';
export type HealthStatus = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'CONCERN';

export interface Pet {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  type: PetType;
  breed?: string;
  gender: PetGender;
  birthday?: string;
  weight?: number;
  color?: string;
  characteristics?: string;
  healthStatus: HealthStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PetVaccine {
  id: string;
  name: string;
  date: string;
  nextDate?: string;
  vet?: string;
  notes?: string;
}

export const petService = {
  async getPets(): Promise&lt;{ pets: Pet[] }&gt; {
    return api.get('/pets');
  },

  async createPet(data: Omit&lt;Pet, 'id' | 'userId' | 'createdAt' | 'updatedAt'&gt;): Promise&lt;{ pet: Pet }&gt; {
    return api.post('/pets', data);
  },

  async getPet(id: string): Promise&lt;{ pet: Pet &amp; any }&gt; {
    return api.get(`/pets/${id}`);
  },

  async updatePet(
    id: string,
    data: Partial&lt;Omit&lt;Pet, 'id' | 'userId' | 'createdAt' | 'updatedAt'&gt;&gt;
  ): Promise&lt;{ pet: Pet }&gt; {
    return api.put(`/pets/${id}`, data);
  },

  async deletePet(id: string): Promise&lt;{ message: string }&gt; {
    return api.delete(`/pets/${id}`);
  },

  // 疫苗记录
  async getVaccines(petId: string): Promise&lt;{ vaccines: PetVaccine[] }&gt; {
    return api.get(`/pets/${petId}/vaccines`);
  },

  async addVaccine(petId: string, data: Omit&lt;PetVaccine, 'id'&gt;): Promise&lt;{ vaccine: PetVaccine }&gt; {
    return api.post(`/pets/${petId}/vaccines`, data);
  },

  // 成长记录
  async getGrowth(petId: string): Promise&lt;{ growthRecords: any[] }&gt; {
    return api.get(`/pets/${petId}/growth`);
  },

  async addGrowth(petId: string, data: any): Promise&lt;{ growthRecord: any }&gt; {
    return api.post(`/pets/${petId}/growth`, data);
  },
};
```

### 文件 4: `src/services/healthRecordService.ts`

```typescript
import { api } from '../lib/api';

export type RecordType = 'TEXT' | 'VOICE' | 'PHOTO' | 'VIDEO' | 'FILE';

export interface HealthRecord {
  id: string;
  petId: string;
  type: RecordType;
  title: string;
  content: string;
  tags: string[];
  attachments: string[];
  voiceDuration?: number;
  isImportant: boolean;
  createdAt: string;
  updatedAt: string;
}

export const healthRecordService = {
  async getRecords(params?: {
    petId?: string;
    type?: RecordType;
    tag?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise&lt;{ records: HealthRecord[]; total: number; page: number; limit: number }&gt; {
    return api.get('/health-records', params);
  },

  async createRecord(data: Omit&lt;HealthRecord, 'id' | 'createdAt' | 'updatedAt'&gt;): Promise&lt;{ record: HealthRecord }&gt; {
    return api.post('/health-records', data);
  },

  async getRecord(id: string): Promise&lt;{ record: HealthRecord }&gt; {
    return api.get(`/health-records/${id}`);
  },

  async updateRecord(
    id: string,
    data: Partial&lt;Omit&lt;HealthRecord, 'id' | 'petId' | 'createdAt' | 'updatedAt'&gt;&gt;
  ): Promise&lt;{ record: HealthRecord }&gt; {
    return api.put(`/health-records/${id}`, data);
  },

  async deleteRecord(id: string): Promise&lt;{ message: string }&gt; {
    return api.delete(`/health-records/${id}`);
  },

  async searchRecords(q: string, petId?: string): Promise&lt;{ records: HealthRecord[] }&gt; {
    return api.get('/health-records/search', { q, petId });
  },
};
```

### 文件 5: `src/services/aiService.ts`

```typescript
import { api } from '../lib/api';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export const aiService = {
  async chat(data: {
    petId: string;
    message: string;
    conversationId?: string;
  }): Promise&lt;{
    response: string;
    conversationId: string;
    suggestions: string[];
  }&gt; {
    return api.post('/ai/chat', data);
  },

  async getConversations(petId: string): Promise&lt;{
    conversations: Array&lt;{
      id: string;
      petId: string;
      messages: ChatMessage[];
      createdAt: string;
    }&gt;;
  }&gt; {
    return api.get(`/ai/conversations/${petId}`);
  },

  async analyzeReport(file: File, petId: string): Promise&lt;{
    analysis: {
      summary: string;
      abnormalItems: Array&lt;{
        name: string;
        value: string;
        reference: string;
        status: 'NORMAL' | 'HIGH' | 'LOW';
      }&gt;;
      recommendations: string[];
    };
  }&gt; {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('petId', petId);
    return api.upload('/ai/analyze-report', formData);
  },

  async generateReport(data: {
    petId: string;
    period: '7d' | '30d' | '90d';
    format?: 'json' | 'pdf';
  }): Promise&lt;{
    report: any;
  }&gt; {
    return api.post('/ai/generate-report', data);
  },

  async analyzeVoice(audioData: string, petId: string): Promise&lt;{
    emotion: string;
    confidence: number;
    intensity: number;
    translation: string;
    dimensions: {
      excitement: number;
      anxiety: number;
      affection: number;
    };
  }&gt; {
    return api.post('/emotion/analyze-voice', { audioData, petId });
  },
};
```

### 文件 6: `src/services/dashboardService.ts`

```typescript
import { api } from '../lib/api';

export interface DashboardData {
  bondScore: number;
  recentActivities: any[];
  healthOverview: {
    overallScore: number;
    activity: number;
    sleep: number;
    nutrition: number;
  };
  upcomingReminders: any[];
  quickStats: {
    totalRecords: number;
    daysWithPet: number;
    vetVisits: number;
  };
}

export const dashboardService = {
  async getDashboard(): Promise&lt;DashboardData&gt; {
    return api.get('/dashboard');
  },
};
```

### 文件 7: `src/services/uploadService.ts`

```typescript
import { api } from '../lib/api';

export const uploadService = {
  async uploadFile(
    file: File,
    type: 'avatar' | 'photo' | 'voice' | 'document',
    petId?: string
  ): Promise&lt;{
    url: string;
    filename: string;
    size: number;
    mimeType: string;
  }&gt; {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (petId) formData.append('petId', petId);
    
    return api.upload('/upload', formData);
  },

  async uploadMultiple(
    files: File[],
    type: string,
    petId?: string
  ): Promise&lt;Array&lt;{
    url: string;
    filename: string;
    size: number;
    mimeType: string;
  }&gt;&gt; {
    const promises = files.map(file =&gt; 
      this.uploadFile(file, type as any, petId)
    );
    return Promise.all(promises);
  },
};
```

---

## 后端新增路由实现

### 创建 `backend/src/routes/dashboard.ts`

```typescript
import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', async (req: Request, res: Response) =&gt; {
  try {
    const userId = req.userId!;
    
    // 获取所有宠物
    const pets = await prisma.pet.findMany({
      where: { userId },
      include: {
        healthRecords: true,
        reminders: true,
      },
    });

    const totalRecords = await prisma.healthRecord.count({
      where: { pet: { userId } },
    });

    const firstPet = await prisma.pet.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    const firstPetDate = firstPet?.createdAt || new Date();
    const daysWithPet = Math.floor(
      (Date.now() - firstPetDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const vetVisits = await prisma.petCheckup.count({
      where: { pet: { userId } },
    });

    const upcomingReminders = await prisma.reminder.findMany({
      where: {
        pet: { userId },
        isCompleted: false,
        date: { gte: new Date() },
      },
      take: 5,
      include: { pet: true },
    });

    const recentActivities = await prisma.healthRecord.findMany({
      where: { pet: { userId } },
      include: { pet: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const bondScore = Math.min(85 + Math.floor(Math.random() * 15), 100);

    res.json({
      bondScore,
      recentActivities,
      healthOverview: {
        overallScore: 90,
        activity: 85,
        sleep: 92,
        nutrition: 88,
      },
      upcomingReminders,
      quickStats: {
        totalRecords,
        daysWithPet,
        vetVisits,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '获取首页数据失败' });
  }
});

export default router;
```

### 创建 `backend/src/routes/emotion.ts`

```typescript
import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middleware';

const router = Router();

router.use(authenticateToken);

router.post(
  '/analyze-voice',
  [body('petId').isUUID(), body('audioData').isString()],
  async (req: Request, res: Response) =&gt; {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { petId, audioData } = req.body;
      
      // Mock emotion analysis logic
      const emotions = ['HAPPY', 'CURIOUS', 'CALM', 'ANXIOUS', 'EXCITED'];
      const emotion = emotions[Math.floor(Math.random() * emotions.length)];
      
      const translations: Record&lt;string, string[]&gt; = {
        HAPPY: [
          '喵~ 主人我今天超开心！',
          '汪！和主人在一起好幸福！'
        ],
        CURIOUS: [
          '嗯？那是什么声音？',
          '咦？这个东西好有趣！'
        ],
        CALM: ['今天天气真好，想睡个午觉...'],
        ANXIOUS: ['主人你要去哪里？不要离开我...'],
        EXCITED: ['太棒了！要出去玩吗？！']
      };

      const translation = translations[emotion]?.[
        Math.floor(Math.random() * translations[emotion].length)
      ] || '...';

      res.json({
        emotion,
        confidence: 0.75 + Math.random() * 0.2,
        intensity: 50 + Math.floor(Math.random() * 50),
        translation,
        dimensions: {
          excitement: 30 + Math.floor(Math.random() * 70),
          anxiety: Math.floor(Math.random() * 40),
          affection: 50 + Math.floor(Math.random() * 50),
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '情绪分析失败' });
    }
  }
);

export default router;
```

### 创建 `backend/src/routes/upload.ts`

```typescript
import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const router = Router();

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) =&gt; {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) =&gt; {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) =&gt; {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'audio/mpeg',
      'audio/wav',
      'video/mp4',
      'application/pdf',
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  },
});

router.use(authenticateToken);

router.post(
  '/',
  upload.single('file'),
  async (req: Request, res: Response) =&gt; {
    try {
      if (!req.file) {
        return res.status(400).json({ error: '请选择文件' });
      }

      const file = req.file;
      const protocol = req.protocol;
      const host = req.get('host');
      const url = `${protocol}://${host}/uploads/${file.filename}`;

      res.json({
        url,
        filename: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: '上传失败' });
    }
  }
);

export default router;
```

### 更新 `backend/src/index.ts` 添加新路由

```typescript
import express from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler, notFoundHandler } from './middleware';
import authRoutes from './routes/auth';
import petRoutes from './routes/pets';
import healthRecordRoutes from './routes/healthRecords';
import reminderRoutes from './routes/reminders';
import manualRoutes from './routes/manuals';
import aiRoutes from './routes/ai';
import dashboardRoutes from './routes/dashboard';
import emotionRoutes from './routes/emotion';
import uploadRoutes from './routes/upload';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/health-records', healthRecordRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/manuals', manualRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/emotion', emotionRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/api/health', (req, res) =&gt; {
  res.json({ status: 'ok', message: 'PawSync Pro API 运行正常' });
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () =&gt; {
  console.log(`
  🚀 PawSync Pro API 服务器已启动!
  📍 本地访问: http://localhost:${config.port}
  🏥 健康检查: http://localhost:${config.port}/api/health
  `);
});
```

---

## 错误响应格式

所有错误响应统一格式：

```json
{
  "error": "错误描述信息",
  "errors": [
    {
      "field": "email",
      "message": "邮箱格式不正确"
    }
  ]
}
```

---

## 状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

