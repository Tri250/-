# PawSync Pro APK 构建完整指南

## 📋 概述

本文档提供在**任何环境**下构建 **PawSync Pro APK (Android 16 兼容)** 的完整解决方案。

**目标系统**: Android 7.0+ (API 24) 至 Android 16 (API 36)  
**应用标识**: `com.pawsync.pro`  
**应用名称**: `PawSync Pro`

---

## 🚀 构建方法总览

| 方法 | 难度 | 推荐度 | 说明 |
|------|------|--------|------|
| **GitHub Actions** | ⭐ | ⭐⭐⭐⭐⭐ | **推荐** - 自动构建，无需本地环境 |
| **Docker** | ⭐⭐ | ⭐⭐⭐⭐ | 隔离环境，一次配置 |
| **本地构建** | ⭐⭐⭐ | ⭐⭐⭐ | 需要完整开发环境 |
| **构建脚本** | ⭐⭐ | ⭐⭐⭐ | 一键自动安装依赖 |

---

## ✅ 方法一：GitHub Actions 自动构建 (强烈推荐)

### 优势
- ✅ 无需本地配置
- ✅ 自动下载所有依赖
- ✅ 自动构建 Debug 和 Release APK
- ✅ 提供 APK 下载链接
- ✅ 每次推送自动构建

### 使用步骤

#### 1. 确保 GitHub Actions 已配置

项目已包含配置文件：`.github/workflows/build-android.yml`

#### 2. 推送代码触发构建

```bash
git add .
git commit -m "Update code"
git push origin main
```

#### 3. 查看构建状态

1. 访问 GitHub 仓库页面
2. 点击 **Actions** 标签
3. 查看构建任务状态
4. 等待构建完成（通常 10-15 分钟）

#### 4. 下载 APK

1. 点击构建任务
2. 点击 **Summary** 或 **Artifacts**
3. 下载以下文件：
   - `pawsyc-pro-debug-apk` - Debug 版本（用于测试）
   - `pawsyc-pro-release-apk` - Release 版本（用于发布）

### 验证构建成功

在 Actions 页面，检查：
- ✅ 所有步骤显示绿色勾选
- ✅ APK 文件已生成
- ✅ 无错误信息

---

## 🐳 方法二：Docker 构建

### 优势
- ✅ 隔离环境，无依赖冲突
- ✅ 可在任何支持 Docker 的系统运行
- ✅ 构建环境可复用

### 前置要求
- Docker Desktop 已安装
- 4GB+ 可用内存
- 10GB+ 可用磁盘空间

### 构建步骤

#### 1. 创建 Dockerfile

项目已包含：`Dockerfile`

#### 2. 构建 Docker 镜像

```bash
cd /path/to/PawSyncPro
docker build -t pawsync-pro-builder .
```

#### 3. 运行容器并提取 APK

```bash
docker run -it --rm -v $(pwd):/output pawsync-pro-builder \
  sh -c "cp android/app/build/outputs/apk/debug/app-debug.apk /output/"
```

#### 4. APK 位置

```bash
./android/app/build/outputs/apk/debug/app-debug.apk
```

### 验证 APK

```bash
docker run --rm -v $(pwd):/app pawsync-pro-builder \
  aapt dump badging android/app/build/outputs/apk/debug/app-debug.apk
```

应看到：
```
package: name='com.pawsync.pro' versionCode='1' versionName='1.0'
sdkVersion:'24'
targetSdkVersion:'36'
application-label:'PawSync Pro'
```

---

## 💻 方法三：本地一键构建

### 优势
- ✅ 自动化安装所有依赖
- ✅ 适合没有 Docker 的环境
- ✅ 可自定义构建参数

### 前置要求
- Linux/macOS/Windows + Git Bash 或 WSL
- 2GB+ 可用内存

### 构建步骤

#### 1. 克隆项目（如果还没有）

```bash
git clone <your-repo-url>
cd PawSyncPro
```

#### 2. 给脚本添加执行权限

```bash
chmod +x build-apk-v2.sh
```

#### 3. 运行构建脚本

```bash
./build-apk-v2.sh
```

#### 4. 等待构建完成

脚本会自动：
- ✅ 检查 Java 环境
- ✅ 下载并安装 Android SDK
- ✅ 安装 SDK 组件（Android 36）
- ✅ 构建 APK

### 预期输出

```
==========================================
PawSync Pro APK 构建脚本
版本: 1.0.0
目标: Android 16 (API 36)
==========================================

检查环境...
✓ 环境检查完成

检查 Android SDK...
正在安装 Android SDK...
安装 Android SDK 组件...
✓ Android SDK 安装完成

开始构建 APK
使用 Gradle Wrapper 构建...
...
BUILD SUCCESSFUL

==========================================
✓ 构建完成!
==========================================

APK 文件位置:
  android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🔧 方法四：手动完整构建

适合需要完全控制构建过程的开发者。

### 1. 安装依赖

#### Java JDK 17+

**macOS:**
```bash
brew install openjdk@17
```

**Ubuntu/Debian:**
```bash
sudo apt install openjdk-17-jdk
```

**Windows:**
下载安装: https://adoptium.net/

#### Gradle 8.14 (可选)

```bash
# macOS
brew install gradle

# Ubuntu
sudo apt install gradle

# 或下载: https://gradle.org/releases/
```

#### Android SDK

```bash
export ANDROID_HOME=/opt/android-sdk
export ANDROID_SDK_ROOT=$ANDROID_HOME

# 下载命令行工具
wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
unzip commandlinetools-linux-11076708_latest.zip
mkdir -p $ANDROID_HOME/cmdline-tools
mv cmdline-tools $ANDROID_HOME/cmdline-tools/latest

# 接受许可证
yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses

# 安装 SDK 组件
$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager \
  "platforms;android-36" \
  "build-tools;36.0.0" \
  "platform-tools"
```

### 2. 构建项目

```bash
# 进入项目目录
cd PawSyncPro

# 安装 npm 依赖
npm install

# 构建 Web 应用
npm run build

# 添加 Android 平台（首次）
npx cap add android

# 同步到 Android
npx cap sync android

# 构建 APK
cd android

# 使用 Gradle Wrapper
./gradlew assembleDebug

# 或使用系统 Gradle
gradle assembleDebug
```

### 3. APK 位置

```bash
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📱 APK 安装指南

### 安装前准备

1. **启用开发者模式**: 设置 → 关于手机 → 点击版本号 7 次
2. **启用 USB 调试**: 设置 → 开发者选项 → USB 调试
3. **允许安装未知来源**: 设置 → 安全 → 允许未知来源应用

### 安装方式

#### 方式 1: 直接安装

1. 将 APK 文件传输到手机
2. 点击 APK 文件
3. 如果提示 "禁止安装"，点击设置 → 允许
4. 点击安装

#### 方式 2: ADB 安装

```bash
# 连接手机并启用 USB 调试后
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

#### 方式 3: 使用文件管理器

1. 打开文件管理器
2. 找到 APK 文件
3. 点击安装
4. 如果遇到安全提示，点击设置 → 允许

### 验证安装

1. 打开应用
2. 应该看到 PawSync Pro 启动画面
3. 检查应用信息：
   - 包名: `com.pawsync.pro`
   - 版本: `1.0`
   - 目标 SDK: `36`

---

## 🔍 APK 验证工具

### 使用 aapt (Android Asset Packaging Tool)

```bash
# 查看 APK 信息
aapt dump badging app-debug.apk

# 查看权限
aapt dump permissions app-debug.apk

# 查看包内容
aapt list app-debug.apk
```

### 预期输出示例

```
package: name='com.pawsync.pro' versionCode='1' versionName='1.0'
sdkVersion:'24'
targetSdkVersion:'36'
application-label:'PawSync Pro'
application-icon:'res/mipmap-xxxhdpi/ic_launcher.png'
uses-permission:'android.permission.INTERNET'
uses-permission:'android.permission.CAMERA'
uses-permission:'android.permission.RECORD_AUDIO'
...
```

---

## ⚙️ Android 16 兼容性配置

### SDK 版本

| 配置项 | 值 | 说明 |
|--------|-----|------|
| minSdkVersion | 24 | Android 7.0 (最低支持) |
| targetSdkVersion | 36 | Android 16 (目标版本) |
| compileSdkVersion | 36 | 编译 SDK 版本 |

### 权限配置

```xml
<!-- 网络 -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- 相机 -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" android:required="false" />

<!-- 音频 -->
<uses-permission android:name="android.permission.RECORD_AUDIO" />

<!-- 存储 -->
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
<uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
```

---

## 🐛 常见问题与解决方案

### Q1: 构建失败，提示网络错误

**原因**: 无法下载 Gradle 或 SDK 依赖

**解决方案**:
- 使用 **GitHub Actions** (推荐)
- 或使用 **Docker** 方式构建
- 或在网络良好的环境下重试

### Q2: Java 版本不兼容

**错误**: `UnsupportedClassVersionError`

**解决方案**:
```bash
# 检查 Java 版本
java -version

# 应该显示 Java 17 或更高
# 如果是 Java 8/11，升级 JDK
```

### Q3: Android SDK 未找到

**错误**: `ANDROID_HOME is not set`

**解决方案**:
```bash
export ANDROID_HOME=/path/to/android-sdk
export ANDROID_SDK_ROOT=$ANDROID_HOME
```

### Q4: Gradle 版本不匹配

**错误**: `Gradle version mismatch`

**解决方案**:
```bash
# 使用 Gradle Wrapper (推荐)
./gradlew assembleDebug

# 或升级系统 Gradle
gradle wrapper --gradle-version=8.14
```

### Q5: 权限被拒绝

**错误**: `Permission denied: gradlew`

**解决方案**:
```bash
chmod +x gradlew
chmod +x gradlew.bat
```

### Q6: APK 安装失败

**错误**: `INSTALL_FAILED_INSUFFICIENT_STORAGE`

**解决方案**:
- 清理手机存储空间
- 卸载不需要的应用

**错误**: `INSTALL_FAILED_ILLEGAL_PARTITION`

**解决方案**:
- 这是旧版 Android 的问题，确保 minSdkVersion >= 24

**错误**: `INSTALL_PARSE_FAILED_NO_CERTIFICATES`

**解决方案**:
- APK 文件可能损坏，重新构建

---

## 📊 性能与优化

### 构建速度优化

1. **启用 Gradle 缓存**
   ```properties
   # android/gradle.properties
   org.gradle.caching=true
   org.gradle.parallel=true
   ```

2. **分配更多内存**
   ```properties
   org.gradle.jvmargs=-Xmx2048m
   ```

3. **使用 Gradle Daemon**
   ```bash
   ./gradlew assembleDebug --daemon
   ```

### APK 大小优化

1. **代码混淆** (Release 构建)
   ```gradle
   minifyEnabled true
   proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
   ```

2. **资源压缩**
   ```gradle
   shrinkResources true
   ```

3. **移除未使用的资源**
   ```gradle
   resConfigs "en"
   ```

---

## 🎯 测试清单

### 安装前检查
- [ ] APK 文件已下载
- [ ] APK 文件大小 > 10MB (合理大小)
- [ ] 文件扩展名为 `.apk`
- [ ] 文件名包含 `pawsync` 或 `debug`

### 安装测试
- [ ] 开发者模式已启用
- [ ] USB 调试已启用 (如果使用 ADB)
- [ ] 存储空间充足
- [ ] 未知来源已允许 (如果直接安装)

### 功能测试
- [ ] 应用可以启动
- [ ] 启动画面正常显示
- [ ] 首页可以加载
- [ ] 底部导航可以点击
- [ ] 相机功能可以访问 (如果设备支持)
- [ ] 网络功能正常

### 兼容性测试
- [ ] Android 7.0 (API 24)
- [ ] Android 10 (API 29)
- [ ] Android 13 (API 33)
- [ ] Android 16 (API 36)

---

## 📞 获取帮助

如果遇到问题：

1. **查看构建日志**: GitHub Actions 页面或本地终端
2. **检查错误信息**: 搜索错误代码或错误文本
3. **查看文档**: 
   - [Capacitor 文档](https://capacitorjs.com/docs)
   - [Android 开发者文档](https://developer.android.com/docs)
   - [Gradle 文档](https://docs.gradle.org/)

---

## ✅ 快速参考

### 最快构建命令

```bash
# GitHub Actions (推送后自动构建)
git push origin main

# 本地构建
./build-apk-v2.sh

# Docker 构建
docker build -t pawsync-pro-builder . && \
docker run -v $(pwd):/output pawsync-pro-builder \
  sh -c "cp android/app/build/outputs/apk/debug/app-debug.apk /output/"
```

### APK 位置
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### 验证 APK
```bash
aapt dump badging android/app/build/outputs/apk/debug/app-debug.apk
```

### 安装 APK
```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

---

**文档版本**: 1.0.0  
**最后更新**: 2026-05-27  
**适用版本**: PawSync Pro 1.0+  
**目标平台**: Android 7.0 - Android 16
