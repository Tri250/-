# PawSync Pro - Android APK 构建指南

## 概述

本文档说明如何构建兼容 **Android 16** 系统的 PawSync Pro APK 文件。

## 系统要求

- **操作系统**: macOS, Linux, 或 Windows
- **Node.js**: v18.0.0 或更高版本
- **npm**: v9.0.0 或更高版本
- **Java Development Kit (JDK)**: JDK 17 或更高版本
- **Android SDK**: 包含 Android SDK 35+ (用于 Android 16)
- **Gradle**: 8.0 或更高版本 (或使用 Gradle Wrapper)

## Android 16 兼容性配置

### SDK 版本配置

项目已配置为支持 Android 16：

- **最低 SDK 版本 (minSdkVersion)**: 24 (Android 7.0)
- **目标 SDK 版本 (targetSdkVersion)**: 36 (Android 16)
- **编译 SDK 版本 (compileSdkVersion)**: 36

### 已添加的权限

```xml
<!-- 网络权限 -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- 相机权限 -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
<uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />

<!-- 音频权限 -->
<uses-permission android:name="android.permission.RECORD_AUDIO" />

<!-- 存储权限 -->
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
<uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
```

## 快速构建步骤

### 方法 1: 使用构建脚本 (推荐)

```bash
# 1. 克隆项目
git clone <repository-url>
cd PawSyncPro

# 2. 给脚本添加执行权限
chmod +x build-apk.sh

# 3. 运行构建脚本
./build-apk.sh
```

### 方法 2: 手动构建

```bash
# 1. 安装依赖
npm install

# 2. 构建 Web 应用
npm run build

# 3. 添加 Android 平台 (如果是首次)
npx cap add android

# 4. 同步到 Android 项目
npx cap sync android

# 5. 进入 Android 目录
cd android

# 6. 构建 Debug APK
./gradlew assembleDebug

# 或者构建 Release APK
./gradlew assembleRelease
```

## APK 文件位置

构建完成后，APK 文件将位于：

- **Debug APK**: `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release APK**: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

## 在 Android 设备上安装

### 方式 1: 使用 ADB

```bash
adb install app-debug.apk
```

### 方式 2: 直接传输

1. 将 APK 文件复制到 Android 设备
2. 在设备上打开文件管理器
3. 点击 APK 文件进行安装
4. 如果提示"未知来源"，请在设置中允许

## 构建配置详情

### Gradle 配置

**变量配置** (`android/variables.gradle`):

```groovy
ext {
    minSdkVersion = 24
    compileSdkVersion = 36
    targetSdkVersion = 36
    androidxActivityVersion = '1.11.0'
    androidxAppCompatVersion = '1.7.1'
    androidxCoreVersion = '1.17.0'
    // ...
}
```

**编译选项** (`android/app/build.gradle`):

```groovy
android {
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
        coreLibraryDesugaringEnabled true
    }
    
    buildTypes {
        debug {
            debuggable true
            minifyEnabled false
        }
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 性能优化配置

**Gradle 属性** (`android/gradle.properties`):

```properties
org.gradle.jvmargs=-Xmx2048m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8
org.gradle.parallel=true
org.gradle.caching=true
android.useAndroidX=true
android.nonTransitiveRClass=true
```

## 常见问题

### Q: 构建失败，提示网络错误

**A**: 如果在中国大陆，建议使用阿里云镜像。在 `android/build.gradle` 中添加：

```groovy
repositories {
    maven { url 'https://maven.aliyun.com/repository/google' }
    maven { url 'https://maven.aliyun.com/repository/central' }
    google()
    mavenCentral()
}
```

### Q: 如何生成签名 APK?

**A**: 创建签名配置并构建 Release APK：

```bash
cd android
./gradlew assembleRelease
```

然后使用 `apksigner` 工具签名：

```bash
apksigner sign --ks your-keystore.jks --out app-signed.apk app-release-unsigned.apk
```

### Q: 如何在 Android 16 上测试?

**A**: 
1. 确保设备运行 Android 16
2. 安装 Debug APK
3. 启用开发者选项和 USB 调试
4. 使用 Android Studio 的 Logcat 查看日志

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 6
- **移动框架**: Capacitor 8
- **状态管理**: Zustand
- **动画**: Framer Motion
- **样式**: Tailwind CSS

## 许可证

本项目仅供学习和开发使用。
