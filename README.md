# PawSync Pro

## 🐾 项目简介

PawSync Pro - AI驱动的宠物情感翻译与健康监测应用，让您与毛孩子心意相通！

**作者**: 带娃的小陈工  
**版本**: 1.0.0  
**日期**: 2026-05-26

---

## ✨ 核心功能

### 🎤 AI 情感翻译
- 动物主题的可爱情感图标（猫咪造型）
- 实时语音分析和翻译
- 支持多种情绪识别（开心、焦虑、生气、需要、平静）

### 💪 健康监测与护理
- 实时健康指标监测
- 分类化护理指导（饮食、运动、美容、健康、行为）
- 宠物专属健康建议

### 📱 用户认证系统
- 完整的注册/登录流程
- 新用户引导界面
- 个人资料管理

### 🔗 分享与推荐
- 一键分享到社交平台
- 邀请好友得会员奖励
- 精美的分享界面

---

## 🛠️ 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 6
- **移动框架**: Capacitor 8
- **状态管理**: Zustand
- **样式方案**: Tailwind CSS
- **图标库**: Lucide React
- **测试框架**: Vitest
- **代码规范**: ESLint

---

## 📂 项目结构

```
/workspace/
├── src/
│   ├── components/        # 组件目录
│   │   ├── animations/    # 动画组件
│   │   ├── camera/        # 相机相关组件
│   │   ├── emotion/       # 情感分析组件
│   │   ├── icons/         # 图标组件
│   │   ├── monitor/       # 监控组件
│   │   └── ui/            # UI基础组件
│   ├── pages/             # 页面组件
│   ├── services/          # 服务层
│   ├── store/             # 状态管理
│   ├── styles/            # 样式文件
│   └── App.tsx            # 应用入口
├── android/               # Android 项目
├── public/                # 静态资源
└── package.json           # 项目配置
```

---

## 🚀 快速开始

### Web 开发预览

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:5175 查看应用。

### 构建 APK

```bash
# 构建 Web 应用
npm run build

# 同步到 Android
npx cap sync android

# 构建 APK
cd android
gradle assembleDebug
```

APK 文件位置: `android/app/build/outputs/apk/debug/app-debug.apk`

详细构建说明请查看: [LOCAL_BUILD_GUIDE.md](LOCAL_BUILD_GUIDE.md)

---

## 📱 主要功能页面

1. **首页** - 宠物概况与健康指数
2. **翻译页** - AI情感翻译功能
3. **健康页** - 健康监测与护理建议
4. **相机页** - 宠物拍照与录像
5. **监控页** - 实时监控功能
6. **个人资料** - 用户信息与推荐系统

---

## 🎨 设计特色

- 温暖的配色方案（橙色主色调）
- 流畅的交互动画
- 可爱的动物主题图标
- 响应式设计，适配各种设备
- 无障碍友好的界面

---

## 🧪 测试

项目包含完整的测试套件：

```bash
# 运行测试
npm run test

# 测试覆盖率
npm run test:coverage
```

---

## 📝 作者信息

**作者**: 带娃的小陈工  
**项目**: PawSync Pro  
**版本**: 1.0.0

---

## 📄 许可证

© 2026 带娃的小陈工. All rights reserved.

---

## 🐾 致谢

感谢所有为这个项目做出贡献的人和可爱的毛孩子们！

---

**Made with ❤️ by 带娃的小陈工**
