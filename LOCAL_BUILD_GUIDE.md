# PawSync Pro - APK 构建说明

## ⚠️ 重要说明

**当前环境的网络被封锁，无法连接到 Maven 仓库下载 Android Gradle Plugin 依赖。**

Web 应用和所有代码已经完成并准备就绪，本文档提供了完整的本地构建方案。

---

## 📱 项目已完成的功能

### ✅ 已实现功能

1. **用户认证系统**
   - 登录/注册页面 (`src/pages/AuthPage.tsx`)
   - 新用户引导流程 (`src/pages/OnboardingPage.tsx`)
   - 用户状态管理 (`src/store/appStore.ts`)

2. **AI 情感翻译**
   - 可爱的动物主题图标替代通用表情 (`src/components/icons/EmotionIcons.tsx`)
   - 语音录制和实时分析 (`src/pages/TranslatorPage.tsx`)
   - 分享功能 (`src/components/ShareModal.tsx`)

3. **健康监测与护理**
   - 健康指标展示 (`src/pages/HealthPage.tsx`)
   - 分类化护理指导（饮食、运动、美容、健康、行为）
   - 宠物专属建议

4. **分享与推荐**
   - 邀请奖励系统 (`src/components/ReferralProgram.tsx`)
   - 一键分享到社交平台

5. **完整的测试套件**
   - 181+ 测试用例
   - 组件测试、页面测试、服务测试

---

## 🔧 本地构建步骤

### 方法一：使用构建脚本（推荐）

```bash
cd /workspace
chmod +x build-apk.sh
./build-apk.sh
```

### 方法二：手动构建

```bash
cd /workspace

# 1. 安装依赖
npm install

# 2. 构建 Web 应用
npm run build

# 3. 同步到 Android
npx cap sync android

# 4. 构建 APK
cd android
export ANDROID_HOME=/workspace/android-sdk
gradle assembleDebug

# 5. APK 位置
ls -lh app/build/outputs/apk/debug/*.apk
```

### 方法三：在 Android Studio 中构建

1. 用 Android Studio 打开 `/workspace/android` 目录
2. 等待 Gradle 同步完成
3. 点击 Run > Run 'app'
4. 选择连接的设备或模拟器

---

## 📋 环境要求

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **JDK**: 17+ (推荐 JDK 25)
- **Android SDK**: API 34+
- **Gradle**: 8.14.4 (项目内置)

### Android SDK 配置

项目已包含必要的 SDK 组件：
- **Build Tools**: 34.0.0
- **Platform**: android-34
- **Platform Tools**: 最新版本

---

## 📦 构建输出

成功构建后，APK 文件位于：

```
/workspace/android/app/build/outputs/apk/debug/app-debug.apk
```

### APK 信息

- **文件名**: `app-debug.apk`
- **大小**: 约 10-30 MB
- **类型**: Debug 版本（可调试）
- **签名**: 未签名（可直接安装）

---

## 📲 安装 APK

### 通过 ADB 安装

```bash
# 连接设备
adb install /workspace/android/app/build/outputs/apk/debug/app-debug.apk
```

### 直接传输

1. 将 APK 文件复制到手机
2. 在手机上点击安装
3. 允许"未知来源"应用安装

### 开启 USB 调试安装

1. 在手机上开启开发者选项和 USB 调试
2. 连接电脑
3. 运行 `adb install app-debug.apk`

---

## 🔍 常见问题

### 1. Gradle 下载超时

**问题**: 依赖下载时间过长

**解决方案**:
- 检查网络连接
- 使用代理: `export HTTP_PROXY=http://proxy:8080`
- 或配置国内镜像

### 2. SDK 未找到

**问题**: `ANDROID_HOME` 未设置

**解决方案**:
```bash
export ANDROID_HOME=/workspace/android-sdk
export ANDROID_SDK_ROOT=/workspace/android-sdk
```

### 3. 内存不足

**问题**: 构建时内存不足

**解决方案**:
在 `~/.gradle/gradle.properties` 中添加:
```properties
org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=512m
```

### 4. Java 版本不兼容

**问题**: JDK 版本过低

**解决方案**: 安装 JDK 17+

---

## 🌐 网络解决方案

由于当前环境网络封锁，建议以下方案之一：

### 方案一：使用代理

```bash
export HTTP_PROXY=http://your-proxy:8080
export HTTPS_PROXY=http://your-proxy:8080
./build-apk.sh
```

### 方案二：手动下载依赖

1. 在有网络的机器上下载依赖
2. 放入 `~/.gradle/caches/` 目录
3. 使用 `--offline` 模式构建

### 方案三：在其他环境构建

1. 将项目代码复制到有网络的电脑
2. 按照本文档步骤构建
3. 将 APK 复制回当前环境

---

## 📊 技术栈

- **前端**: React 18 + Vite 6
- **移动框架**: Capacitor 8
- **状态管理**: Zustand
- **样式**: Tailwind CSS
- **测试**: Vitest
- **构建**: Gradle 8.14.4

---

## 🎯 下一步

1. ✅ 构建 APK（按本文档操作）
2. 📱 在设备上测试功能
3. 🔐 配置 Release 签名（发布前）
4. 🚀 提交到应用商店

---

## 📞 技术支持

如有问题，请检查：
1. 环境变量配置
2. 网络连接状态
3. 磁盘空间（建议 10GB+）
4. 内存（建议 8GB+）

---

**Happy Building! 🐾**

*构建日期: 2026-05-26*
