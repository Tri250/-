
# PawSync Pro - 宠物健康技术实施方案清单

**版本**: 3.0  
**目标评分**: 9.5分+  
**实施周期**: 10周  

---

## 一、核心模块清单（去IoT硬件版）

### 1.1 模块优先级与评分目标

| 优先级 | 模块 | 当前评分 | 目标评分 | 提升幅度 | 权重 |
|--------|------|---------|---------|--------|------|
| P0 | AI健康预警 | 8.8 | 9.8 | +1.0 | 20% |
| P0 | 摄像头监控 | 8.5 | 9.6 | +1.1 | 15% |
| P0 | 人宠情感连接 | 8.2 | 9.5 | +1.3 | 12% |
| P0 | 宠物档案管理 | 5.5 | 9.6 | +4.1 | 12% |
| P0 | 健康记录中心 | 4.8 | 9.5 | +4.7 | 12% |
| P0 | AI健康顾问 | 4.0 | 9.4 | +5.4 | 12% |
| P0 | 情绪翻译 | 6.5 | 9.6 | +3.1 | 8% |
| P0 | 首页导航 | 3.0 | 9.5 | +6.5 | 5% |
| P1 | 医疗服务整合 | 0.0 | 9.2 | +9.2 | 5% |
| P1 | 保险服务 | 0.0 | 9.1 | +9.1 | 4% |
| P2 | 社区社交 | 0.0 | 9.3 | +9.3 | 4% |
| P2 | 电商服务 | 0.0 | 8.8 | +8.8 | 3% |
| P2 | 区块链存证 | 0.0 | 8.5 | +8.5 | 3% |
| P2 | 设计系统 | 9.0 | 9.7 | +0.7 | 3% |
| P2 | 性能优化 | 0.0 | 9.8 | +9.8 | 3% |
| **综合评分** | **6.5** | **9.6** | **+3.1** | **100%** |

---

## 二、宠物健康相关功能完整清单

### 2.1 AI健康预警模块（9.8分目标）

| 功能点 | 状态 | 说明 |
|--------|------|------|
| 12种异常行为识别 | ✅ | 已完成 |
| 四级预警机制 | ✅ | 已完成 |
| 健康仪表盘 | ✅ | 已完成 |
| 实时健康评分 | ✅ | 已完成 |
| 历史趋势分析 | ⚠️ | 需优化 |
| 同品种对比分析 | ❌ | 需新增 |
| 预警阈值可调节 | ❌ | 需新增 |
| 异常建议推送 | ❌ | 需新增 |

### 2.2 宠物档案管理模块（9.6分目标）

| 功能点 | 状态 | 说明 |
|--------|------|------|
| 基础信息录入 | ⚠️ | 需完善 |
| 疫苗记录管理 | ❌ | 需新增 |
| 体检记录管理 | ❌ | 需新增 |
| 成长曲线图 | ❌ | 需新增 |
| 宠物相册 | ❌ | 需新增 |
| 体重/身高记录 | ❌ | 需新增 |
| 医疗档案管理 | ❌ | 需新增 |
| 宠物基因档案（可选） | ❌ | 需新增 |

### 2.3 健康记录中心模块（9.5分目标）

| 功能点 | 状态 | 说明 |
|--------|------|------|
| 文字记录 | ❌ | 需新增 |
| 语音记录 | ❌ | 需新增 |
| 图片/视频记录 | ❌ | 需新增 |
| 文件上传 | ❌ | 需新增 |
| 标签系统 | ❌ | 需新增 |
| 搜索筛选 | ❌ | 需新增 |
| 时间线展示 | ❌ | 需新增 |
| 批量操作 | ❌ | 需新增 |
| 离线记录 | ❌ | 需新增 |

### 2.4 AI健康顾问模块（9.4分目标）

| 功能点 | 状态 | 说明 |
|--------|------|------|
| AI对话聊天 | ❌ | 需新增 |
| 化验单解读 | ❌ | 需新增 |
| 快捷问题 | ❌ | 需新增 |
| 历史对话 | ❌ | 需新增 |
| 健康报告生成 | ❌ | 需新增 |
| PDF导出 | ❌ | 需新增 |
| 多模态理解 | ❌ | 需新增 |

### 2.5 医疗服务整合模块（9.2分目标）

| 功能点 | 状态 | 说明 |
|--------|------|------|
| 在线问诊 | ❌ | 需新增 |
| 附近医院导航 | ❌ | 需新增 |
| 预约挂号 | ❌ | 需新增 |
| 医疗档案管理 | ❌ | 需新增 |
| 检查报告管理 | ❌ | 需新增 |
| 用药提醒 | ❌ | 需新增 |

### 2.6 保险服务模块（9.1分目标）

| 功能点 | 状态 | 说明 |
|--------|------|------|
| 保险产品展示 | ❌ | 需新增 |
| 保险购买 | ❌ | 需新增 |
| 保单管理 | ❌ | 需新增 |
| 理赔申请 | ❌ | 需新增 |
| 理赔进度查询 | ❌ | 需新增 |

---

## 三、数据库模型设计

### 3.1 Prisma Schema 宠物健康版

```prisma
// backend/prisma/schema.prisma

// 用户相关
model User {
  id          String   @id @default(uuid())
  email       String   @unique
  password    String
  name        String
  avatar      String?
  pets        Pet[]
  reminders   Reminder[]
  posts       CommunityPost[]
  consultations MedicalConsultation[]
  policies    InsurancePolicy[]
  orders      Order[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// 宠物档案
model Pet {
  id            String      @id @default(uuid())
  userId        String
  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  name          String
  avatar        String?
  type          PetType
  breed         String?
  gender        PetGender?
  birthday      DateTime?
  weight        Float?
  color         String?
  characteristics String?
  healthStatus  HealthStatus @default(GOOD)
  healthRecords HealthRecord[]
  vaccines      PetVaccine[]
  checkups      PetCheckup[]
  growthRecords PetGrowthRecord[]
  reminders     Reminder[]
  consultations MedicalConsultation[]
  policies      InsurancePolicy[]
  geneticProfile PetGeneticProfile?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

enum PetType {
  DOG
  CAT
  OTHER
}

enum PetGender {
  MALE
  FEMALE
  UNKNOWN
}

enum HealthStatus {
  EXCELLENT
  GOOD
  FAIR
  CONCERN
}

// 疫苗记录
model PetVaccine {
  id        String   @id @default(uuid())
  petId     String
  pet       Pet      @relation(fields: [petId], references: [id], onDelete: Cascade)
  name      String
  date      DateTime
  nextDate  DateTime?
  vet       String?
  notes     String?
  createdAt DateTime @default(now())
}

// 体检记录
model PetCheckup {
  id        String   @id @default(uuid())
  petId     String
  pet       Pet      @relation(fields: [petId], references: [id], onDelete: Cascade)
  date      DateTime
  weight    Float?
  vet       String?
  notes     String?
  attachments String[]
  createdAt DateTime @default(now())
}

// 成长记录
model PetGrowthRecord {
  id        String   @id @default(uuid())
  petId     String
  pet       Pet      @relation(fields: [petId], references: [id], onDelete: Cascade)
  date      DateTime
  weight    Float?
  height    Float?
  notes     String?
  createdAt DateTime @default(now())
}

// 健康记录
model HealthRecord {
  id            String         @id @default(uuid())
  petId         String
  pet           Pet            @relation(fields: [petId], references: [id], onDelete: Cascade)
  type          RecordType
  title         String
  content       String
  tags          String[]
  attachments   String[]
  voiceDuration Int?
  isImportant   Boolean        @default(false)
  isOffline     Boolean        @default(false)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

enum RecordType {
  TEXT
  VOICE
  PHOTO
  VIDEO
  FILE
}

// 提醒
model Reminder {
  id          String        @id @default(uuid())
  petId       String?
  pet         Pet?          @relation(fields: [petId], references: [id])
  type        ReminderType
  title       String
  notes       String?
  date        DateTime
  time        String?
  repeat      RepeatType    @default(NONE)
  endDate     DateTime?
  isCompleted Boolean       @default(false)
  createdAt   DateTime      @default(now())
}

enum ReminderType {
  VACCINE
  CHECKUP
  MEDICATION
  FEEDING
  EXERCISE
  GROOMING
  OTHER
}

enum RepeatType {
  NONE
  DAILY
  WEEKLY
  MONTHLY
  YEARLY
}

// 健康手册
model HealthManual {
  id          String        @id @default(uuid())
  title       String
  content     String
  category    ManualCategory
  petType     PetType?
  tags        String[]
  viewCount   Int           @default(0)
  isOfficial  Boolean       @default(true)
  createdAt   DateTime      @default(now())
}

enum ManualCategory {
  NUTRITION
  CARE
  BEHAVIOR
  EMERGENCY
  TRAINING
  FIRST_AID
}

// AI对话
model AIConversation {
  id        String       @id @default(uuid())
  petId     String
  pet       Pet          @relation(fields: [petId], references: [id], onDelete: Cascade)
  messages  AIChatMessage[]
  createdAt DateTime     @default(now())
}

model AIChatMessage {
  id             String          @id @default(uuid())
  conversationId String
  conversation   AIConversation  @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  role           ChatRole
  content        String
  suggestions    String[]
  createdAt      DateTime        @default(now())
}

enum ChatRole {
  USER
  ASSISTANT
  SYSTEM
}

// 医疗咨询
model MedicalConsultation {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  petId     String
  pet       Pet      @relation(fields: [petId], references: [id], onDelete: Cascade)
  symptoms  String
  urgency   String   @default("normal")
  status    String   @default("pending")
  responses MedicalResponse[]
  createdAt DateTime @default(now())
}

model MedicalResponse {
  id             String   @id @default(uuid())
  consultationId String
  consultation   MedicalConsultation @relation(fields: [consultationId], references: [id], onDelete: Cascade)
  vetId          String?
  content        String
  attachments    String[]
  createdAt      DateTime @default(now())
}

// 医院/诊所
model VeterinaryClinic {
  id          String   @id @default(uuid())
  name        String
  address     String?
  phone       String?
  lat         Float?
  lng         Float?
  rating      Float    @default(0)
  services    String[]
  openHours   Json?
  createdAt   DateTime @default(now())
}

// 预约
model VeterinaryAppointment {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  petId           String
  pet             Pet      @relation(fields: [petId], references: [id], onDelete: Cascade)
  hospitalId      String
  hospital        VeterinaryClinic @relation(fields: [hospitalId], references: [id])
  appointmentTime DateTime
  notes           String?
  status          String   @default("pending")
  createdAt       DateTime @default(now())
}

// 保险
model InsurancePlan {
  id              String   @id @default(uuid())
  name            String
  description     String?
  price           Float
  coverage        Json
  isActive        Boolean  @default(true)
  policies        InsurancePolicy[]
  createdAt       DateTime @default(now())
}

model InsurancePolicy {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  petId     String
  pet       Pet      @relation(fields: [petId], references: [id], onDelete: Cascade)
  planId    String
  plan      InsurancePlan @relation(fields: [planId], references: [id])
  startDate DateTime
  endDate   DateTime?
  status    String   @default("active")
  claims    InsuranceClaim[]
  createdAt DateTime @default(now())
}

model InsuranceClaim {
  id             String   @id @default(uuid())
  policyId       String
  policy         InsurancePolicy @relation(fields: [policyId], references: [id], onDelete: Cascade)
  incidentDate   DateTime
  description    String
  requestedAmount Float
  approvedAmount Float?
  status         String   @default("pending")
  attachments    String[]
  createdAt      DateTime @default(now())
}

// 社区
model CommunityPost {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  petId     String?
  pet       Pet?     @relation(fields: [petId], references: [id])
  content   String
  images    String[]
  videos    String[]
  tags      String[]
  likes     PostLike[]
  comments  PostComment[]
  createdAt DateTime @default(now())
}

model PostLike {
  id        String   @id @default(uuid())
  postId    String
  post      CommunityPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  @@unique([postId, userId])
}

model PostComment {
  id        String   @id @default(uuid())
  postId    String
  post      CommunityPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  content   String
  createdAt DateTime @default(now())
}

// 电商
model Product {
  id          String   @id @default(uuid())
  name        String
  description String?
  price       Float
  category    String
  images      String[]
  stock       Int      @default(0)
  ratings     Float    @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
}

model ShoppingCart {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  quantity  Int      @default(1)
  createdAt DateTime @default(now())
  @@unique([userId, productId])
}

model Order {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     OrderItem[]
  status    String   @default("pending")
  totalAmount Float
  createdAt DateTime @default(now())
}

model OrderItem {
  id        String   @id @default(uuid())
  orderId   String
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  quantity  Int
  price     Float
}

// 区块链存证
model BlockchainVerification {
  id              String   @id @default(uuid())
  recordId        String
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactionHash String
  timestamp       DateTime @default(now())
}

// 基因档案
model PetGeneticProfile {
  id        String   @id @default(uuid())
  petId     String
  pet       Pet      @relation(fields: [petId], references: [id], onDelete: Cascade)
  breedConfidence Float?
  geneticMarkers Json?
  healthRisks   Json?
  recommendations String?
  reportFile    String?
  createdAt    DateTime @default(now())
}
```

---

## 四、完整API接口文档

### 4.1 认证与授权

#### POST /api/auth/register
**功能**: 用户注册  
**请求**:
```json
{
  "email": "demo@pawsync.pro",
  "password": "password123",
  "name": "毛孩子家长"
}
```
**响应**:
```json
{
  "user": {
    "id": "uuid",
    "email": "demo@pawsync.pro",
    "name": "毛孩子家长"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST /api/auth/login
**功能**: 用户登录  
**请求**:
```json
{
  "email": "demo@pawsync.pro",
  "password": "password123"
}
```

#### GET /api/auth/me
**功能**: 获取当前用户信息  
**认证**: 需要

---

### 4.2 宠物管理

#### GET /api/pets
**功能**: 获取宠物列表  
**认证**: 需要  
**响应**:
```json
{
  "pets": [
    {
      "id": "pet-uuid",
      "name": "毛球",
      "type": "CAT",
      "breed": "英国短毛猫",
      "healthStatus": "GOOD"
    }
  ]
}
```

#### POST /api/pets
**功能**: 创建宠物  
**认证**: 需要  
**请求**:
```json
{
  "name": "毛球",
  "avatar": "https://...",
  "type": "CAT",
  "breed": "英国短毛猫",
  "gender": "FEMALE",
  "birthday": "2022-05-20",
  "weight": 4.5
}
```

#### GET /api/pets/:id
**功能**: 获取宠物详情  
**认证**: 需要

#### PUT /api/pets/:id
**功能**: 更新宠物信息  
**认证**: 需要

#### DELETE /api/pets/:id
**功能**: 删除宠物  
**认证**: 需要

#### GET /api/pets/:id/vaccines
**功能**: 获取疫苗记录  
**认证**: 需要

#### POST /api/pets/:id/vaccines
**功能**: 添加疫苗记录  
**请求**:
```json
{
  "name": "猫三联",
  "date": "2024-01-15",
  "nextDate": "2025-01-15",
  "vet": "张医生",
  "notes": "一切正常"
}
```

#### GET /api/pets/:id/checkups
**功能**: 获取体检记录  
**认证**: 需要

#### POST /api/pets/:id/checkups
**功能**: 添加体检记录  
**请求**:
```json
{
  "date": "2024-01-15",
  "weight": 4.5,
  "vet": "张医生",
  "notes": "健康状况良好",
  "attachments": ["https://..."]
}
```

#### GET /api/pets/:id/growth
**功能**: 获取成长记录  
**认证**: 需要

#### POST /api/pets/:id/growth
**功能**: 添加成长记录  
**请求**:
```json
{
  "date": "2024-01-15",
  "weight": 4.5,
  "height": 25,
  "notes": "正常增长"
}
```

---

### 4.3 健康记录

#### GET /api/health-records
**功能**: 获取健康记录列表  
**认证**: 需要  
**查询参数**:
- `petId`: 宠物ID
- `type`: 记录类型 (TEXT/VOICE/PHOTO/VIDEO/FILE)
- `tag`: 标签筛选
- `search`: 搜索关键词
- `page`: 页码
- `limit`: 每页数量

**响应**:
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
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

#### POST /api/health-records
**功能**: 创建健康记录  
**认证**: 需要  
**请求**:
```json
{
  "petId": "pet-uuid",
  "type": "TEXT",
  "title": "毛球今天很开心",
  "content": "今天带毛球去了公园...",
  "tags": ["日常", "开心"],
  "attachments": ["https://..."],
  "isImportant": false
}
```

#### GET /api/health-records/:id
**功能**: 获取单条记录  
**认证**: 需要

#### PUT /api/health-records/:id
**功能**: 更新记录  
**认证**: 需要

#### DELETE /api/health-records/:id
**功能**: 删除记录  
**认证**: 需要

#### GET /api/health-records/search
**功能**: 搜索记录  
**认证**: 需要

---

### 4.4 AI健康顾问

#### POST /api/ai/chat
**功能**: AI对话  
**认证**: 需要  
**请求**:
```json
{
  "petId": "pet-uuid",
  "message": "我的猫最近食欲不好怎么办？",
  "conversationId": "conversation-uuid"
}
```
**响应**:
```json
{
  "response": "您好！猫咪食欲不好可能有多种原因...",
  "conversationId": "conversation-uuid",
  "suggestions": ["观察排便情况", "测量体温", "检查口腔"]
}
```

#### GET /api/ai/conversations/:petId
**功能**: 获取对话历史  
**认证**: 需要

#### POST /api/ai/analyze-report
**功能**: 化验单解读  
**认证**: 需要  
**请求** (FormData):
```
file: [化验单图片]
petId: "pet-uuid"
```

#### POST /api/ai/generate-report
**功能**: 生成健康报告  
**认证**: 需要  
**请求**:
```json
{
  "petId": "pet-uuid",
  "period": "7d",
  "format": "json"
}
```

---

### 4.5 情绪翻译

#### POST /api/emotion/analyze-voice
**功能**: 分析语音情绪  
**认证**: 需要  
**请求**:
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

---

### 4.6 医疗服务

#### POST /api/medical/consultations
**功能**: 创建医疗咨询  
**认证**: 需要  
**请求**:
```json
{
  "petId": "pet-uuid",
  "symptoms": "食欲不振，精神萎靡",
  "urgency": "normal"
}
```

#### GET /api/medical/hospitals
**功能**: 获取附近医院  
**认证**: 需要  
**查询参数**:
- `lat`: 纬度
- `lng`: 经度
- `limit`: 数量限制

#### POST /api/medical/appointments
**功能**: 创建预约  
**认证**: 需要  
**请求**:
```json
{
  "petId": "pet-uuid",
  "hospitalId": "hospital-uuid",
  "appointmentTime": "2024-02-20T10:00:00Z",
  "notes": "疫苗接种"
}
```

---

### 4.7 保险服务

#### GET /api/insurance/plans
**功能**: 获取保险产品列表  
**认证**: 需要

#### POST /api/insurance/policies
**功能**: 购买保险  
**认证**: 需要  
**请求**:
```json
{
  "planId": "plan-uuid",
  "petId": "pet-uuid"
}
```

#### POST /api/insurance/claims
**功能**: 提交理赔申请  
**认证**: 需要  
**请求**:
```json
{
  "policyId": "policy-uuid",
  "incidentDate": "2024-01-15",
  "description": "猫咪摔伤就医",
  "requestedAmount": 1500,
  "attachments": ["https://..."]
}
```

---

### 4.8 提醒

#### GET /api/reminders
**功能**: 获取提醒列表  
**认证**: 需要

#### POST /api/reminders
**功能**: 创建提醒  
**认证**: 需要  
**请求**:
```json
{
  "petId": "pet-uuid",
  "type": "VACCINE",
  "title": "猫三联疫苗",
  "notes": "记得带疫苗本",
  "date": "2024-02-15",
  "time": "10:00",
  "repeat": "YEARLY"
}
```

#### POST /api/reminders/:id/complete
**功能**: 标记提醒完成  
**认证**: 需要

---

### 4.9 健康手册

#### GET /api/manuals
**功能**: 获取手册列表  
**认证**: 可选  
**查询参数**:
- `category`: 分类
- `petType`: 宠物类型
- `search`: 搜索关键词

#### GET /api/manuals/:id
**功能**: 获取手册详情  
**认证**: 可选

---

### 4.10 社区

#### GET /api/community/posts
**功能**: 获取动态列表  
**认证**: 需要

#### POST /api/community/posts
**功能**: 发布动态  
**认证**: 需要  
**请求**:
```json
{
  "content": "今天毛球很开心！",
  "petId": "pet-uuid",
  "images": ["https://..."],
  "tags": ["开心", "日常"]
}
```

#### POST /api/community/posts/:id/like
**功能**: 点赞  
**认证**: 需要

#### POST /api/community/posts/:id/comments
**功能**: 评论  
**认证**: 需要

#### GET /api/community/matches
**功能**: 获取宠物匹配  
**认证**: 需要

#### GET /api/community/nearby
**功能**: 附近宠友  
**认证**: 需要

---

### 4.11 首页

#### GET /api/dashboard
**功能**: 获取首页数据  
**认证**: 需要  
**响应**:
```json
{
  "bondScore": 85,
  "healthOverview": {
    "overallScore": 90,
    "activity": 85,
    "sleep": 92
  },
  "upcomingReminders": [],
  "quickStats": {
    "totalRecords": 156,
    "daysWithPet": 365,
    "vetVisits": 5
  }
}
```

---

### 4.12 文件上传

#### POST /api/upload
**功能**: 上传文件  
**认证**: 需要  
**请求** (FormData):
```
file: [文件]
type: avatar/photo/voice/document
petId: pet-uuid (可选)
```

---

## 五、前端服务层代码

### 5.1 API基础服务

```typescript
// src/lib/api.ts
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
    
    const headers: Record<string, string> = {
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

  async get<T>(endpoint: string, params?: Record<string, any>) {
    const url = params
      ? `${endpoint}?${new URLSearchParams(params).toString()}`
      : endpoint;
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async upload<T>(endpoint: string, formData: FormData) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {};
    
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
```

### 5.2 宠物服务

```typescript
// src/services/petService.ts
import { api } from '../lib/api';

export type PetType = 'DOG' | 'CAT' | 'OTHER';
export type PetGender = 'MALE' | 'FEMALE' | 'UNKNOWN';
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
  async getPets(): Promise<{ pets: Pet[] }> {
    return api.get('/pets');
  },

  async createPet(data: Omit<Pet, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<{ pet: Pet }> {
    return api.post('/pets', data);
  },

  async getPet(id: string): Promise<{ pet: Pet & any }> {
    return api.get(`/pets/${id}`);
  },

  async updatePet(
    id: string,
    data: Partial<Omit<Pet, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<{ pet: Pet }> {
    return api.put(`/pets/${id}`, data);
  },

  async deletePet(id: string): Promise<{ message: string }> {
    return api.delete(`/pets/${id}`);
  },

  // 疫苗记录
  async getVaccines(petId: string): Promise<{ vaccines: PetVaccine[] }> {
    return api.get(`/pets/${petId}/vaccines`);
  },

  async addVaccine(petId: string, data: Omit<PetVaccine, 'id'>): Promise<{ vaccine: PetVaccine }> {
    return api.post(`/pets/${petId}/vaccines`, data);
  },

  // 体检记录
  async getCheckups(petId: string): Promise<{ checkups: any[] }> {
    return api.get(`/pets/${petId}/checkups`);
  },

  async addCheckup(petId: string, data: any): Promise<{ checkup: any }> {
    return api.post(`/pets/${petId}/checkups`, data);
  },

  // 成长记录
  async getGrowth(petId: string): Promise<{ growthRecords: any[] }> {
    return api.get(`/pets/${petId}/growth`);
  },

  async addGrowth(petId: string, data: any): Promise<{ growthRecord: any }> {
    return api.post(`/pets/${petId}/growth`, data);
  },
};
```

### 5.3 健康记录服务

```typescript
// src/services/healthRecordService.ts
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
  }): Promise<{ records: HealthRecord[]; total: number; page: number; limit: number }> {
    return api.get('/health-records', params);
  },

  async createRecord(data: Omit<HealthRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ record: HealthRecord }> {
    return api.post('/health-records', data);
  },

  async getRecord(id: string): Promise<{ record: HealthRecord }> {
    return api.get(`/health-records/${id}`);
  },

  async updateRecord(
    id: string,
    data: Partial<Omit<HealthRecord, 'id' | 'petId' | 'createdAt' | 'updatedAt'>>
  ): Promise<{ record: HealthRecord }> {
    return api.put(`/health-records/${id}`, data);
  },

  async deleteRecord(id: string): Promise<{ message: string }> {
    return api.delete(`/health-records/${id}`);
  },

  async searchRecords(q: string, petId?: string): Promise<{ records: HealthRecord[] }> {
    return api.get('/health-records/search', { q, petId });
  },
};
```

### 5.4 AI服务

```typescript
// src/services/aiService.ts
import { api } from '../lib/api';

export interface ChatMessage {
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  timestamp?: string;
}

export const aiService = {
  async chat(data: {
    petId: string;
    message: string;
    conversationId?: string;
  }): Promise<{
    response: string;
    conversationId: string;
    suggestions: string[];
  }> {
    return api.post('/ai/chat', data);
  },

  async getConversations(petId: string): Promise<{
    conversations: Array<{
      id: string;
      petId: string;
      messages: ChatMessage[];
      createdAt: string;
    }>;
  }> {
    return api.get(`/ai/conversations/${petId}`);
  },

  async analyzeReport(file: File, petId: string): Promise<{
    analysis: {
      summary: string;
      abnormalItems: Array<{
        name: string;
        value: string;
        reference: string;
        status: 'NORMAL' | 'HIGH' | 'LOW';
      }>;
      recommendations: string[];
    };
  }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('petId', petId);
    return api.upload('/ai/analyze-report', formData);
  },

  async generateReport(data: {
    petId: string;
    period: '7d' | '30d' | '90d';
    format?: 'json' | 'pdf';
  }): Promise<{
    report: any;
  }> {
    return api.post('/ai/generate-report', data);
  },

  async analyzeVoice(audioData: string, petId: string): Promise<{
    emotion: string;
    confidence: number;
    intensity: number;
    translation: string;
    dimensions: {
      excitement: number;
      anxiety: number;
      affection: number;
    };
  }> {
    return api.post('/emotion/analyze-voice', { audioData, petId });
  },
};
```

### 5.5 医疗服务

```typescript
// src/services/medicalService.ts
import { api } from '../lib/api';

export const medicalService = {
  async createConsultation(data: {
    petId: string;
    symptoms: string;
    urgency?: string;
  }): Promise<any> {
    return api.post('/medical/consultations', data);
  },

  async getHospitals(params?: {
    lat?: number;
    lng?: number;
    limit?: number;
  }): Promise<{ hospitals: any[] }> {
    return api.get('/medical/hospitals', params);
  },

  async createAppointment(data: {
    petId: string;
    hospitalId: string;
    appointmentTime: string;
    notes?: string;
  }): Promise<any> {
    return api.post('/medical/appointments', data);
  }
};
```

### 5.6 保险服务

```typescript
// src/services/insuranceService.ts
import { api } from '../lib/api';

export const insuranceService = {
  async getPlans(): Promise<{ plans: any[] }> {
    return api.get('/insurance/plans');
  },

  async purchasePolicy(planId: string, petId: string): Promise<any> {
    return api.post('/insurance/policies', { planId, petId });
  },

  async submitClaim(data: {
    policyId: string;
    incidentDate: string;
    description: string;
    requestedAmount: number;
    attachments?: string[];
  }): Promise<any> {
    return api.post('/insurance/claims', data);
  }
};
```

### 5.7 首页服务

```typescript
// src/services/dashboardService.ts
import { api } from '../lib/api';

export interface DashboardData {
  bondScore: number;
  healthOverview: {
    overallScore: number;
    activity: number;
    sleep: number;
  };
  upcomingReminders: any[];
  quickStats: {
    totalRecords: number;
    daysWithPet: number;
    vetVisits: number;
  };
}

export const dashboardService = {
  async getDashboard(): Promise<DashboardData> {
    return api.get('/dashboard');
  },
};
```

---

## 六、后端路由实现

### 6.1 医疗路由

```typescript
// backend/src/routes/medical.ts
import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middleware';

const router = Router();
router.use(authenticateToken);

// 创建咨询
router.post('/consultations', [
  body('petId').isUUID(),
  body('symptoms').isLength({ min: 1 }),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const consultation = await prisma.medicalConsultation.create({
      data: {
        userId: req.userId!,
        petId: req.body.petId,
        symptoms: req.body.symptoms,
        urgency: req.body.urgency || 'normal',
      },
      include: { pet: true },
    });

    res.status(201).json({ consultation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '创建咨询失败' });
  }
});

// 获取附近医院
router.get('/hospitals', async (req: Request, res: Response) => {
  try {
    const { lat, lng, limit = 20 } = req.query;
    
    const hospitals = await prisma.veterinaryClinic.findMany({
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    });

    res.json({ hospitals });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '获取医院列表失败' });
  }
});

// 创建预约
router.post('/appointments', [
  body('petId').isUUID(),
  body('hospitalId').isUUID(),
  body('appointmentTime').isISO8601(),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const appointment = await prisma.veterinaryAppointment.create({
      data: {
        userId: req.userId!,
        petId: req.body.petId,
        hospitalId: req.body.hospitalId,
        appointmentTime: new Date(req.body.appointmentTime),
        notes: req.body.notes,
      },
      include: { pet: true, hospital: true },
    });

    res.status(201).json({ appointment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '创建预约失败' });
  }
});

export default router;
```

### 6.2 保险路由

```typescript
// backend/src/routes/insurance.ts
import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { authenticateToken } from '../middleware';

const router = Router();
router.use(authenticateToken);

// 获取保险计划
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const plans = await prisma.insurancePlan.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ plans });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '获取保险计划失败' });
  }
});

// 购买保险
router.post('/policies', [
  body('planId').isUUID(),
  body('petId').isUUID(),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const policy = await prisma.insurancePolicy.create({
      data: {
        userId: req.userId!,
        petId: req.body.petId,
        planId: req.body.planId,
        startDate: new Date(),
        status: 'active',
      },
      include: { plan: true, pet: true },
    });

    res.status(201).json({ policy });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '购买保险失败' });
  }
});

// 提交理赔
router.post('/claims', [
  body('policyId').isUUID(),
  body('incidentDate').isISO8601(),
  body('description').isLength({ min: 1 }),
  body('requestedAmount').isFloat({ min: 0 }),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const claim = await prisma.insuranceClaim.create({
      data: {
        policyId: req.body.policyId,
        incidentDate: new Date(req.body.incidentDate),
        description: req.body.description,
        requestedAmount: req.body.requestedAmount,
        attachments: req.body.attachments || [],
        status: 'pending',
      },
      include: { policy: true },
    });

    res.status(201).json({ claim });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '提交理赔失败' });
  }
});

export default router;
```

---

## 七、实施路线图（10周）

### 阶段一：核心补齐（第1-3周）
- **周1**：首页、宠物档案（基础信息、疫苗、体检）
- **周2**：健康记录中心、AI健康顾问
- **周3**：性能优化、情绪翻译

### 阶段二：医疗与保险（第4-6周）
- **周4**：医疗服务整合（问诊、医院、预约）
- **周5**：保险服务（产品、保单、理赔）
- **周6**：社区社交基础

### 阶段三：功能增强（第7-8周）
- **周7**：电商服务
- **周8**：区块链存证

### 阶段四：测试打磨（第9-10周）
- **周9**：全面测试、Bug修复
- **周10**：体验优化、发布准备

---

## 八、验收标准

| 指标 | 目标值 |
|------|--------|
| 综合评分 | 9.6分 |
| 模块完成度 | 100% |
| API接口数 | 168个 |
| 功能数量 | 132个 |
| 冷启动时间 | <750ms |
| 动画帧率 | 60fps |
| 日活目标 | 10万+ |

