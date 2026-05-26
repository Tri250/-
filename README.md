# PawSync Pro

AI驱动的宠物情感翻译与健康管理平台

## 📋 项目简介

PawSync Pro 是一个专业的宠物健康管理应用，提供宠物档案管理、健康记录、AI健康顾问、智能提醒等功能。

## 🚀 快速开始

### 前置要求

- Node.js 18+
- npm 或 yarn

### 安装与运行

#### 1. 后端设置

```bash
cd backend

# 安装依赖
npm install

# 复制环境变量
cp .env.example .env

# 生成 Prisma 客户端
npm run db:generate

# 推送数据库架构
npm run db:push

# 播种演示数据（可选）
npm run db:seed

# 启动开发服务器
npm run dev
```

后端将运行在 http://localhost:3000

#### 2. 前端设置

在项目根目录下：

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端将运行在 http://localhost:5173

## 📁 项目结构

```
.
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma    # 数据库模型
│   │   └── seed.ts          # 数据库种子
│   ├── src/
│   │   ├── config/
│   │   ├── lib/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── src/
│   ├── components/
│   ├── lib/
│   ├── pages/
│   ├── store/
│   └── types/
└── package.json
```

## 🔌 API 接口文档

### 认证接口

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户
- `PUT /api/auth/me` - 更新用户信息

### 宠物管理

- `GET /api/pets` - 获取宠物列表
- `POST /api/pets` - 创建宠物
- `GET /api/pets/:id` - 获取宠物详情
- `PUT /api/pets/:id` - 更新宠物
- `DELETE /api/pets/:id` - 删除宠物
- `GET /api/pets/:id/vaccines` - 疫苗记录
- `POST /api/pets/:id/vaccines` - 添加疫苗
- `GET /api/pets/:id/checkups` - 体检记录
- `POST /api/pets/:id/checkups` - 添加体检
- `GET /api/pets/:id/growth` - 成长记录
- `POST /api/pets/:id/growth` - 添加成长记录

### 健康记录

- `GET /api/health-records` - 获取记录列表
- `POST /api/health-records` - 创建记录
- `GET /api/health-records/search` - 搜索记录
- `GET /api/health-records/:id` - 获取记录详情
- `PUT /api/health-records/:id` - 更新记录
- `DELETE /api/health-records/:id` - 删除记录

### 智能提醒

- `GET /api/reminders` - 获取提醒列表
- `GET /api/reminders/upcoming` - 即将到期提醒
- `POST /api/reminders` - 创建提醒
- `GET /api/reminders/:id` - 获取提醒详情
- `PUT /api/reminders/:id` - 更新提醒
- `DELETE /api/reminders/:id` - 删除提醒
- `POST /api/reminders/:id/complete` - 标记完成

### 健康手册

- `GET /api/manuals` - 获取手册列表
- `GET /api/manuals/search` - 搜索手册
- `GET /api/manuals/:id` - 获取手册详情
- `GET /api/manuals/bookmarks` - 我的书签
- `POST /api/manuals/:id/bookmark` - 添加书签
- `DELETE /api/manuals/:id/bookmark` - 取消书签

### AI功能

- `POST /api/ai/chat` - AI对话
- `GET /api/ai/conversations/:petId` - 获取对话历史
- `POST /api/ai/generate-report` - 生成健康报告

## 👤 演示账号

- **邮箱**: demo@pawsync.pro
- **密码**: password123

## 🛠️ 开发命令

### 后端

```bash
cd backend

# 开发模式
npm run dev

# 构建
npm run build

# 数据库管理
npm run db:generate  # 生成 Prisma 客户端
npm run db:push      # 推送架构
npm run db:seed      # 播种数据
npm run db:studio    # 打开 Prisma Studio
```

### 前端

```bash
# 开发模式
npm run dev

# 构建
npm run build

# 预览
npm run preview
```

## 🎯 核心功能

1. **宠物档案管理** - 多宠物支持，详细信息记录
2. **健康记录** - 多种格式记录，标签分类，时间线展示
3. **AI健康顾问** - 智能对话，健康分析，报告生成
4. **智能提醒** - 多类型提醒，自定义周期，及时通知
5. **健康手册** - 专业知识库，分类检索，书签收藏
6. **数据可视化** - 健康趋势，成长曲线，统计分析

## 📊 技术栈

### 前端
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Zustand (状态管理)

### 后端
- Node.js
- Express
- TypeScript
- Prisma (ORM)
- SQLite (开发) / PostgreSQL (生产)
- JWT (认证)

## 🐛 问题反馈

如有问题，请提交 Issue。

## 📄 许可证

MIT License
