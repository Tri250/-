# PawSync Pro 后端架构设计文档

## 🎯 产品愿景
打造专业级宠物健康管理平台，为养宠用户提供AI驱动的健康咨询、数据记录、智能提醒等服务。

---

## 🏗️ 技术架构

### 技术选型
- **后端框架**: Express.js + TypeScript
- **ORM**: Prisma
- **数据库**: SQLite (开发) / PostgreSQL (生产)
- **认证**: JWT + bcrypt
- **API风格**: RESTful
- **文件存储**: 本地存储 / 云存储 (AWS S3/阿里云OSS)
- **AI服务**: OpenAI API / 本地LLM

### 核心模块

1. **用户认证模块**
   - 用户注册/登录
   - JWT Token管理
   - 用户信息管理

2. **宠物管理模块**
   - 宠物CRUD
   - 多宠物支持
   - 宠物健康档案

3. **健康记录模块**
   - 多格式记录（文字/语音/图片/视频/文件）
   - 标签分类系统
   - 时间线展示
   - 搜索筛选

4. **AI健康顾问模块**
   - 对话接口
   - 图片分析
   - 健康报告生成
   - 症状自查

5. **健康手册模块**
   - 知识库管理
   - 分类浏览
   - 搜索功能
   - 书签收藏

6. **智能提醒模块**
   - 提醒CRUD
   - 重复周期
   - 通知推送（Webhook/邮件/推送）

7. **数据可视化模块**
   - 统计分析
   - 趋势图表
   - 健康报告

---

## 📊 数据库设计

### 用户表 (users)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| email | String | 邮箱（唯一） |
| password | String | 密码（加密） |
| name | String | 用户名 |
| avatar | String? | 头像 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

### 宠物表 (pets)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| userId | String | 用户ID（外键） |
| name | String | 宠物名 |
| avatar | String? | 头像 |
| type | Enum | 类型（dog/cat/other） |
| breed | String? | 品种 |
| gender | Enum | 性别 |
| birthday | DateTime? | 生日 |
| weight | Float? | 体重 |
| color | String? | 毛色 |
| characteristics | String? | 特征 |
| healthStatus | Enum | 健康状态 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

### 健康记录表 (health_records)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| petId | String | 宠物ID（外键） |
| type | Enum | 记录类型 |
| title | String | 标题 |
| content | String | 内容 |
| tags | String[] | 标签 |
| attachments | String[]? | 附件 |
| voiceDuration | Int? | 语音时长（秒） |
| isImportant | Boolean | 是否重要 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

### 疫苗记录表 (pet_vaccines)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| petId | String | 宠物ID（外键） |
| name | String | 疫苗名称 |
| date | DateTime | 日期 |
| nextDate | DateTime? | 下次日期 |
| vet | String? | 兽医 |
| notes | String? | 备注 |
| createdAt | DateTime | 创建时间 |

### 体检记录表 (pet_checkups)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| petId | String | 宠物ID（外键） |
| date | DateTime | 日期 |
| weight | Float? | 体重 |
| vet | String? | 兽医 |
| notes | String? | 备注 |
| attachments | String[]? | 附件 |
| createdAt | DateTime | 创建时间 |

### 成长记录表 (pet_growth)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| petId | String | 宠物ID（外键） |
| date | DateTime | 日期 |
| weight | Float? | 体重 |
| height | Float? | 身高 |
| notes | String? | 备注 |
| createdAt | DateTime | 创建时间 |

### 提醒表 (reminders)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| petId | String | 宠物ID（外键） |
| type | Enum | 提醒类型 |
| title | String | 标题 |
| notes | String? | 备注 |
| date | DateTime | 日期 |
| time | String | 时间 |
| repeat | Enum | 重复周期 |
| endDate | DateTime? | 结束日期 |
| isCompleted | Boolean | 是否已完成 |
| completedAt | DateTime? | 完成时间 |
| createdAt | DateTime | 创建时间 |

### AI对话表 (ai_conversations)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| petId | String | 宠物ID（外键） |
| userId | String | 用户ID（外键） |
| messages | Json[] | 消息历史 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

### 健康手册表 (health_manuals)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| title | String | 标题 |
| content | String | 内容 |
| category | Enum | 分类 |
| petType | Enum? | 适用宠物类型 |
| tags | String[]? | 标签 |
| author | String? | 作者 |
| viewCount | Int | 浏览次数 |
| isOfficial | Boolean | 是否官方 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

### 手册书签表 (manual_bookmarks)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| userId | String | 用户ID（外键） |
| manualId | String | 手册ID（外键） |
| createdAt | DateTime | 创建时间 |

---

## 🔌 API 接口设计

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息
- `PUT /api/auth/me` - 更新用户信息

### 宠物相关
- `GET /api/pets` - 获取用户所有宠物
- `POST /api/pets` - 创建宠物
- `GET /api/pets/:id` - 获取单个宠物
- `PUT /api/pets/:id` - 更新宠物
- `DELETE /api/pets/:id` - 删除宠物
- `GET /api/pets/:id/vaccines` - 获取疫苗记录
- `POST /api/pets/:id/vaccines` - 添加疫苗记录
- `GET /api/pets/:id/checkups` - 获取体检记录
- `POST /api/pets/:id/checkups` - 添加体检记录
- `GET /api/pets/:id/growth` - 获取成长记录
- `POST /api/pets/:id/growth` - 添加成长记录

### 健康记录相关
- `GET /api/health-records` - 获取健康记录（支持筛选）
- `POST /api/health-records` - 创建健康记录
- `GET /api/health-records/:id` - 获取单个记录
- `PUT /api/health-records/:id` - 更新记录
- `DELETE /api/health-records/:id` - 删除记录
- `GET /api/health-records/search?q=...` - 搜索记录
- `POST /api/health-records/upload` - 上传附件

### AI健康顾问相关
- `POST /api/ai/chat` - 发送对话消息
- `GET /api/ai/conversations/:petId` - 获取对话历史
- `POST /api/ai/analyze-image` - 分析图片
- `POST /api/ai/generate-report` - 生成健康报告
- `POST /api/ai/symptom-check` - 症状自查

### 健康手册相关
- `GET /api/manuals` - 获取手册列表
- `GET /api/manuals/:id` - 获取手册详情
- `GET /api/manuals/search?q=...` - 搜索手册
- `GET /api/manuals/bookmarks` - 获取我的书签
- `POST /api/manuals/:id/bookmark` - 添加书签
- `DELETE /api/manuals/:id/bookmark` - 取消书签

### 智能提醒相关
- `GET /api/reminders` - 获取提醒列表
- `POST /api/reminders` - 创建提醒
- `GET /api/reminders/:id` - 获取单个提醒
- `PUT /api/reminders/:id` - 更新提醒
- `DELETE /api/reminders/:id` - 删除提醒
- `POST /api/reminders/:id/complete` - 标记完成
- `GET /api/reminders/upcoming` - 获取即将到期提醒

### 数据统计相关
- `GET /api/stats/overview/:petId` - 概览统计
- `GET /api/stats/weight-trend/:petId` - 体重趋势
- `GET /api/stats/health-timeline/:petId` - 健康时间线

---

## 🎨 业务流程设计

### 用户注册流程
1. 用户提交邮箱密码
2. 后端验证邮箱唯一性
3. bcrypt加密密码
4. 创建用户记录
5. 生成JWT Token
6. 返回用户信息和Token

### 健康记录创建流程
1. 用户上传附件（如需要）
2. 创建健康记录（包含附件URL）
3. 存储到数据库
4. 触发相关AI分析（可选）
5. 返回记录详情

### 智能提醒推送流程
1. 定时任务扫描即将到期提醒
2. 根据用户偏好选择推送方式
3. 发送通知
4. 更新提醒状态
5. 记录推送日志

---

## 🔒 安全设计

1. **认证授权**
   - JWT Token认证
   - Token刷新机制
   - 资源级权限控制（用户只能访问自己的数据）

2. **数据安全**
   - 密码bcrypt加密
   - HTTPS传输
   - 敏感数据脱敏

3. **接口安全**
   - 请求频率限制
   - SQL注入防护
   - XSS防护
   - 文件上传验证

---

## 📈 性能优化

1. **数据库优化**
   - 索引设计
   - 查询优化
   - 分页查询

2. **缓存策略**
   - Redis缓存热点数据
   - 静态资源CDN

3. **异步处理**
   - 图片上传异步处理
   - AI分析后台任务
   - 通知推送异步

---

## 🚀 部署方案

1. **开发环境**
   - SQLite数据库
   - 本地文件存储
   - 本地AI服务/API

2. **生产环境**
   - PostgreSQL数据库
   - 云存储（AWS S3/阿里云OSS）
   - 容器化部署（Docker）
   - CI/CD自动化

---

## 📋 开发优先级

### Phase 1: 基础功能（MVP）
- ✅ 用户认证
- ✅ 宠物管理
- ✅ 健康记录CRUD
- ✅ 智能提醒

### Phase 2: AI功能
- AI对话
- 健康报告生成
- 图片分析

### Phase 3: 高级功能
- 数据可视化
- 社区分享
- 第三方兽医咨询

### Phase 4: 运营功能
- 用户行为分析
- 内容运营
- 营销工具
