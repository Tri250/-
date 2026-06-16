# 爪爪连心❤️ - 项目工作树记录

> 更新时间: 2026-06-03

## 📁 项目结构

```
/workspace
├── src/                          # 前端源代码
│   ├── components/               # UI组件
│   │   ├── DesignSystem/         # 设计系统组件 (Button, Card, Modal等)
│   │   ├── animations/           # 动画组件
│   │   ├── emotion/              # 情感分析组件
│   │   ├── health/               # 健康相关组件
│   │   ├── monitor/              # 监控组件
│   │   └── ...
│   ├── pages/                    # 页面组件
│   │   ├── HomePage.tsx          # 首页
│   │   ├── TranslatorPage.tsx    # AI情感翻译
│   │   ├── AIConsultantPage.tsx  # AI健康顾问
│   │   ├── HealthRecordsPage.tsx # 健康记录
│   │   ├── RemindersPage.tsx     # 智能提醒
│   │   └── ...
│   ├── services/                 # 服务层
│   │   ├── emotionService.ts     # 情感分析服务
│   │   ├── aiConsultationService.ts # AI咨询服务
│   │   ├── advancedAIEngine.ts   # 高级AI引擎
│   │   └── ...
│   ├── store/                    # 状态管理 (Zustand)
│   │   ├── appStore.ts           # 应用主状态
│   │   ├── emotionStore.ts       # 情感状态
│   │   └── ...
│   ├── types/                    # TypeScript类型定义
│   ├── utils/                    # 工具函数
│   ├── styles/                   # 样式文件
│   │   └── design-system/        # 设计系统样式
│   └── __tests__/                # 单元测试
│
├── android/                      # Android原生项目
│   └── app/
│       ├── src/main/
│       │   ├── java/com/pawsync/pro/  # Java源码
│       │   ├── res/               # 资源文件
│       │   └── AndroidManifest.xml # 清单文件
│       └── build.gradle          # 构建配置
│
├── backend/                      # 后端服务 (Node.js)
├── docs/                         # 文档
│   └── PET_AI_APIs_2026.md       # 2026宠物AI API文档
│
├── capacitor.config.ts           # Capacitor配置
├── package.json                  # 项目依赖
├── vite.config.ts               # Vite构建配置
├── tailwind.config.js           # Tailwind CSS配置
└── tsconfig.json                # TypeScript配置
```

## 🔑 关键文件说明

### 配置文件
| 文件 | 说明 |
|------|------|
| `package.json` | 项目依赖和脚本 |
| `capacitor.config.ts` | Capacitor配置 (应用名: 爪爪连心❤️) |
| `android/app/build.gradle` | Android构建配置 |
| `android/app/src/main/AndroidManifest.xml` | Android清单和权限 |

### 核心页面
| 文件 | 功能 |
|------|------|
| `src/pages/HomePage.tsx` | 首页 - 液态玻璃UI |
| `src/pages/TranslatorPage.tsx` | AI情感翻译机 |
| `src/pages/AIConsultantPage.tsx` | AI健康顾问 |
| `src/pages/HealthRecordsPage.tsx` | 健康记录管理 |
| `src/pages/RemindersPage.tsx` | 智能提醒 |

### AI服务
| 文件 | 功能 |
|------|------|
| `src/services/emotionService.ts` | 情感分析 (95%+准确率) |
| `src/services/aiConsultationService.ts` | 健康咨询AI |
| `src/services/advancedAIEngine.ts` | 多模态AI引擎 |

### 设计系统
| 目录 | 组件 |
|------|------|
| `src/components/DesignSystem/` | Button, Card, Modal, Input, FAB, Timeline, GlassCard等 |
| `src/components/animations/` | RecordingAnimation, AnalysisAnimation, ResultAnimation等 |

## 📱 Capacitor插件

| 插件 | 版本 | 功能 |
|------|------|------|
| @capacitor/core | 8.3.4 | 核心库 |
| @capacitor/android | 8.3.4 | Android平台 |
| @capacitor/local-notifications | 8.2.0 | 本地通知 |
| @capacitor/push-notifications | 8.1.1 | 推送通知 |
| @capacitor/keyboard | 8.0.3 | 键盘处理 |
| @capacitor/haptics | 8.0.2 | 触觉反馈 |
| @capacitor/share | 8.0.1 | 分享功能 |

## 🧪 测试覆盖

- **测试文件**: 20个
- **测试用例**: 411个
- **通过率**: 100%

## 🔒 安全配置

- HTTPS强制启用
- ProGuard代码混淆
- 备份禁用
- 无硬编码密钥
- 权限最小化原则

## 📝 开发命令

```bash
# 开发
npm run dev

# 构建
npm run build

# 测试
npm run test

# Android同步
npx cap sync android

# 类型检查
npx tsc -b --noEmit

# 代码检查
npx eslint .
```
