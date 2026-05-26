# PawSync Pro APK 构建指南

## 项目概述

PawSync Pro 是一款宠物情感翻译应用，使用 React + Vite + Capacitor 构建，支持 Android 和 iOS 平台。

## 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- JDK 17+
- Android SDK (API Level 34+)
- Gradle 8.14.4

## 构建步骤

### 1. 安装依赖

```bash
cd /workspace
npm install
```

### 2. 构建 Web 应用

```bash
npm run build
```

这将在 `dist/` 目录生成生产版本的前端资源。

### 3. 同步到 Android 项目

```bash
npx cap sync android
```

这会将 Web 资源复制到 Android 项目的 `android/app/src/main/assets/public/` 目录。

### 4. 构建 Android APK

#### 方法一：使用 Gradle Wrapper（推荐）

```bash
cd /workspace/android
./gradlew assembleDebug
```

APK 文件将生成在：
```
/workspace/android/app/build/outputs/apk/debug/app-debug.apk
```

#### 方法二：使用系统 Gradle

```bash
cd /workspace/android
gradle assembleDebug
```

### 5. 安装 APK 到设备

#### 通过 USB 安装

```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

#### 通过 WiFi 安装（需要设备与电脑在同一网络）

1. 启动 ADB WiFi：
   ```bash
   adb tcpip 5555
   ```

2. 获取设备 IP 地址（设备上查看）

3. 连接设备：
   ```bash
   adb connect <设备IP地址>:5555
   ```

4. 安装 APK：
   ```bash
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```

## 构建变体

### Debug 版本

```bash
./gradlew assembleDebug
```

特点：
- 可调试
- 包含 sourcemap
- 未签名

### Release 版本

```bash
./gradlew assembleRelease
```

特点：
- 已优化和压缩
- 已签名（需要配置签名密钥）
- 适用于应用商店发布

## 签名配置

Release 版本需要配置签名密钥。在 `android/app/build.gradle` 中添加：

```groovy
android {
    signingConfigs {
        release {
            storeFile file('your-keystore.jks')
            storePassword 'your-password'
            keyAlias 'your-alias'
            keyPassword 'your-key-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

## 常见问题

### 1. Gradle 下载超时

如果遇到 Gradle 下载超时，可以：

- 手动下载 Gradle：https://services.gradle.org/distributions/gradle-8.14.4-all.zip
- 将下载的文件放到 `~/.gradle/wrapper/dists/` 目录
- 或者配置代理：
  ```bash
  export HTTP_PROXY=http://proxy.example.com:8080
  export HTTPS_PROXY=http://proxy.example.com:8080
  ```

### 2. Android SDK 找不到

设置环境变量：

```bash
export ANDROID_HOME=/path/to/android-sdk
export ANDROID_SDK_ROOT=/path/to/android-sdk
```

### 3. 内存不足

Gradle 默认使用 1.5GB 内存。如需调整，修改 `~/.gradle/gradle.properties`：

```properties
org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=512m
```

### 4. 构建速度慢

- 使用 Gradle 守护进程：`./gradlew --daemon`
- 启用并行构建：`./gradlew assembleDebug --parallel`
- 启用缓存：`./gradlew assembleDebug --build-cache`

## 项目结构

```
/workspace/
├── android/                  # Android 项目
│   ├── app/
│   │   ├── src/
│   │   │   └── main/
│   │   │       ├── assets/public/  # Web 资源
│   │   │       └── java/           # Android 源码
│   │   └── build.gradle
│   ├── gradle/              # Gradle 配置
│   └── build.gradle         # 根级构建配置
├── dist/                    # Web 构建输出
├── src/                     # React 源码
│   ├── components/         # React 组件
│   ├── pages/             # 页面组件
│   ├── store/             # 状态管理
│   └── ...
├── capacitor.config.ts     # Capacitor 配置
├── vite.config.ts          # Vite 配置
└── package.json            # Node.js 依赖
```

## 技术栈

- **前端框架**: React 18
- **构建工具**: Vite 6
- **移动框架**: Capacitor 8
- **状态管理**: Zustand
- **UI 组件**: Tailwind CSS
- **图标**: Lucide React
- **动画**: CSS Animations

## 功能特性

1. ✅ 用户注册/登录系统
2. ✅ 宠物档案管理
3. ✅ AI 情感翻译（语音分析）
4. ✅ 健康监测与护理指导
5. ✅ 实时监控（相机集成）
6. ✅ 分享与推荐功能
7. ✅ 完整的测试套件（Vitest）
8. ✅ 动画效果系统

## 版本信息

- **应用名称**: PawSync Pro
- **版本号**: 1.0.0
- **包名**: com.pawsync.pro

## 更新日志

### v1.0.0 (2024-01-15)
- 初始版本发布
- 包含完整的用户认证系统
- AI 情感翻译功能
- 健康监测模块
- 护理指导建议
- 分享与推荐系统

## 技术支持

如遇到构建问题，请检查：
1. Node.js 和 npm 版本
2. JDK 版本（需要 JDK 17+）
3. Android SDK 配置
4. 网络连接状态

## 下一步

1. 构建 Debug APK 进行测试
2. 配置 Release 签名
3. 在应用商店发布

---

**Happy Building! 🐾**
