# PawSync Pro - 爪印同频 · 守护版

一款专为宠物主人打造的智能宠物管理应用，提供翻译分析、健康监测等功能。

## 作者

**带娃的小陈工**

## 功能特性

- 🐾 **宠物翻译** - AI驱动的宠物叫声/行为翻译分析
- 💓 **健康监测** - 实时追踪宠物健康状态
- 📊 **分析历史** - 查看所有翻译和健康记录
- ⭐ **收藏功能** - 保存精彩时刻
- ⚙️ **个性化设置** - 隐私、通知等自定义配置

## 技术栈

- React 19 + TypeScript
- Vite 6
- TailwindCSS 3
- Lucide React Icons
- Zustand (状态管理)

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

### 预览生产版本

```bash
pnpm preview
```

## 项目结构

```
src/
├── components/          # 通用组件
├── pages/              # 页面组件
│   ├── HomePage.tsx    # 首页
│   ├── TranslatorPage.tsx  # 翻译页
│   ├── HealthPage.tsx  # 健康页
│   ├── ProfilePage.tsx # 个人中心
│   └── SettingsPage.tsx # 设置页
├── store/              # 状态管理
├── App.tsx             # 主应用组件
├── main.tsx            # 入口文件
└── index.css           # 全局样式
```

## 版本

v1.0.0

---

🐾 爪印同频 · 守护版