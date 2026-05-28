# PawSync Pro AI 能力升级指南

## 🚀 快速开始

### 1. 获取 API 密钥

#### DeepSeek（推荐 - 主引擎）
- **官网**: https://platform.deepseek.com/
- **注册**: 免费注册账号
- **免费额度**: 每月 100 万 tokens
- **优势**: 中文理解强、性能接近 GPT-4、价格低

#### Google Gemini（备选引擎）
- **官网**: https://aistudio.google.com/
- **注册**: 使用 Google 账号
- **免费额度**: 60 RPM
- **优势**: 多模态能力强、免费额度充足

### 2. 配置环境变量

复制 `.env.example` 到 `.env`:

```bash
cd backend
cp .env.example .env
```

编辑 `.env` 文件：

```env
# DeepSeek AI 配置（主引擎）
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# Google Gemini AI 配置（备选引擎）
GOOGLE_AI_API_KEY=your_google_api_key_here
```

### 3. 安装依赖

```bash
cd backend
npm install
```

### 4. 启动服务

```bash
npm run dev
```

## 📚 核心功能

### 1. AI 健康对话

**API 端点**: `POST /api/ai/chat`

**请求示例**:
```json
{
  "petId": "pet_123",
  "message": "我的猫咪最近拉稀怎么办？"
}
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "reply": "根据您描述的症状，建议...",
    "messageId": "1234567890",
    "timestamp": "2025-01-01T00:00:00.000Z",
    "source": "deepseek"
  }
}
```

### 2. 健康报告生成

**API 端点**: `POST /api/ai/generate-report`

**请求示例**:
```json
{
  "petId": "pet_123",
  "period": "30d"
}
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "reportId": "report_456",
    "content": "# 健康报告\n\n## 基础信息...",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### 3. 对话历史查询

**API 端点**: `GET /api/ai/conversations/:petId`

**查询参数**:
- `page`: 页码（默认 1）
- `pageSize`: 每页数量（默认 20）

### 4. 报告历史查询

**API 端点**: `GET /api/ai/reports/:petId`

**查询参数**:
- `page`: 页码（默认 1）
- `pageSize`: 每页数量（默认 10）

## 🔧 技术特性

### 1. 多引擎支持
- **主引擎**: DeepSeek (免费高性能)
- **备选引擎**: Google Gemini
- **兜底机制**: 本地规则引擎

### 2. 智能降级
- AI 服务不可用时自动切换到规则引擎
- 常见症状（腹泻、呕吐）提供专业建议
- 紧急情况标注"🚨请立即就医"

### 3. 医学规则引擎
- 腹泻处理指南
- 呕吐处理指南
- 食欲不振指导
- 紧急情况判断

### 4. 安全机制
- 输入内容审核
- 输出内容安全检查
- 医学免责声明自动注入
- 禁止确诊和处方药推荐

### 5. 上下文管理
- Token 计数和限制（3500 tokens）
- 自动截断超长对话
- 保留最新对话历史
- 多轮对话上下文关联

## 📖 Prompt 库

### 系统 Prompt
位置: `src/lib/prompts/system.prompt.ts`

包含：
- 专业兽医角色设定
- 安全约束规则
- 免责声明

### 健康对话 Prompt
位置: `src/lib/prompts/health-chat.prompt.ts`

包含：
- 宠物信息注入
- 对话历史管理
- 专业建议生成

### 健康报告 Prompt
位置: `src/lib/prompts/health-report.prompt.ts`

包含：
- 7 个报告模块结构
- 数据格式要求
- 专业分析规则

## 🗂️ 知识库

### 本地知识库
位置: `src/lib/knowledge-base.ts`

包含：
- 腹泻诊治指南
- 呕吐处理指南
- 紧急情况判断标准
- 疫苗接种指南
- 营养饮食指南
- 皮肤问题识别

### 搜索功能
```typescript
import { knowledgeBase } from './lib/knowledge-base';

// 搜索相关知识
const results = knowledgeBase.search('猫咪拉稀怎么办', 3);
const context = knowledgeBase.formatAsContext(results);
```

## 🔍 测试建议

### 1. 基础功能测试

```bash
# 测试 AI 对话
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"petId":"pet_123","message":"猫咪拉稀怎么办？"}'

# 测试健康报告生成
curl -X POST http://localhost:3000/api/ai/generate-report \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"petId":"pet_123"}'
```

### 2. 降级机制测试

- 不配置 API 密钥，测试规则引擎
- 测试腹泻、呕吐等常见症状的规则响应

### 3. 安全机制测试

- 测试 Prompt 注入攻击
- 测试超长输入
- 测试违规内容

## 🚨 注意事项

### 1. API 成本
- DeepSeek: ¥1 / 10 万 tokens（免费额度内 ¥0）
- Google Gemini: 免费（有限额）
- 预计月度成本: ¥0-200

### 2. 使用限制
- 单条消息最大 2000 字符
- 对话最大 3500 tokens
- 建议配合 Pinecone 等向量数据库扩展

### 3. 合规要求
- 所有回复自动添加免责声明
- 禁止确诊和处方药推荐
- 紧急情况必须提示就医

## 📈 未来升级

### 1. RAG 增强（推荐）
集成 Pinecone 向量数据库：
```bash
npm install @pinecone-database/pinecone
```

### 2. 多模态能力
集成 Google Vision API：
```bash
npm install @google-cloud/vision
```

### 3. 专业宠物 API
可选接入：
- 宠智灵 AI 平台
- 百目魔君 API

## 📞 支持

如有问题，请检查：
1. API 密钥是否正确配置
2. 网络连接是否正常
3. 服务是否正常启动
4. 控制台错误日志

---

**版本**: v1.0.0
**更新日期**: 2025-01-01
**维护团队**: PawSync Pro
