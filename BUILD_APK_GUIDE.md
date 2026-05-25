# PawSync Pro - APK 构建指南

## 项目状态

✅ Web 应用已成功构建到 `dist/` 目录
✅ Capacitor Android 项目已配置在 `android/` 目录

## 方法一：使用在线 PWA Builder（最简单，推荐）

这是最简单的方法，不需要任何本地开发环境。

### 步骤：

1. **准备项目：**
   我们已经将应用构建在 `dist/` 目录中

2. **使用 PWA Builder：**
   - 访问: https://www.pwabuilder.com/
   - 如果您有部署好的网站，直接输入网址
   - 或者点击 "Start with a Package"，选择 "Upload Folder"
   - 上传整个 `dist/` 文件夹
   - 选择 "Android" 平台
   - 下载生成的 APK 文件

3. **或者使用 Web2App：**
   - 访问: https://web2app.com/
   - 上传您的 `dist/` 文件夹内容
   - 配置应用名称和设置
   - 下载 APK

## 方法二：使用 Capacitor 在本地构建（需要 Android Studio）

### 前置要求：
- Android Studio
- JDK 17+
- Android SDK (API 34)

### 步骤：

1. **确保 Web 应用已构建：**
   ```bash
   npm run build
   ```

2. **打开 Android 项目：**
   ```bash
   npx cap open android
   ```
   这会在 Android Studio 中打开项目

3. **在 Android Studio 中构建：**
   - 等待 Gradle 同步完成
   - 点击 "Build" -> "Build Bundle(s) / APK(s)" -> "Build APK(s)"
   - APK 会生成在：`android/app/build/outputs/apk/debug/`

## 方法三：使用命令行构建（如果网络问题解决）

### 步骤：

1. **同步 Web 资源：**
   ```bash
   npx cap sync
   ```

2. **构建 Debug APK：**
   ```bash
   cd android
   ./gradlew assembleDebug
   ```

3. **构建 Release APK（用于发布）：**
   ```bash
   ./gradlew assembleRelease
   ```

## APK 位置

成功构建后，APK 文件位于：
- Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release: `android/app/build/outputs/apk/release/app-release.apk`

## 安装到手机

1. **启用开发者选项和 USB 调试：**
   - 进入手机 "设置" -> "关于手机"
   - 连续点击 "版本号" 7 次
   - 返回设置，找到 "开发者选项"
   - 开启 "USB 调试"

2. **使用 ADB 安装：**
   ```bash
   adb install app-debug.apk
   ```

3. **或者直接传输 APK 文件到手机安装**

## 应用信息

- **应用名称：** PawSync Pro
- **包名：** com.pawsync.pro
- **版本：** 1.0
- **描述：** 基于 AI 的宠物共情、健康守护与互动陪伴应用

## 已完成的工作

✅ 项目代码无错误
✅ 依赖安装完成
✅ Web 应用构建成功
✅ Capacitor 配置完成
✅ Android 平台添加完成
✅ 国内镜像源配置完成
