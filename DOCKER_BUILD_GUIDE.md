# PawSync Pro - Android APK 构建 Docker 镜像

## 概述

本文档说明如何使用 Docker 构建一个包含所有依赖的 Android 构建环境，然后使用该环境构建 APK。

## 前置要求

- Docker 已安装并运行
- 网络连接到 Docker Hub

## 构建步骤

### 1. 创建 Dockerfile

```dockerfile
FROM ubuntu:22.04

# 设置环境变量
ENV DEBIAN_FRONTEND=noninteractive
ENV ANDROID_HOME=/opt/android-sdk
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV JAVA_HOME=/opt/java
ENV GRADLE_HOME=/opt/gradle
ENV PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$GRADLE_HOME/bin

# 安装基础依赖
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    openjdk-17-jdk \
    git \
    && rm -rf /var/lib/apt/lists/*

# 安装 Gradle 8.14.4
RUN wget -q https://services.gradle.org/distributions/gradle-8.14.4-bin.zip -O /tmp/gradle.zip && \
    unzip -q /tmp/gradle.zip -d /opt && \
    ln -s /opt/gradle-8.14.4 /opt/gradle && \
    rm /tmp/gradle.zip

# 安装 Android SDK Command Line Tools
RUN wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O /tmp/cmdline-tools.zip && \
    mkdir -p $ANDROID_HOME/cmdline-tools && \
    unzip -q /tmp/cmdline-tools.zip -d $ANDROID_HOME/cmdline-tools && \
    mv $ANDROID_HOME/cmdline-tools/cmdline-tools $ANDROID_HOME/cmdline-tools/latest && \
    rm /tmp/cmdline-tools.zip

# 接受许可证并安装 SDK 组件
RUN yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses && \
    $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager "platforms;android-36" "build-tools;36.0.0" "platform-tools"

# 复制项目文件
WORKDIR /app
COPY . /app

# 构建 APK
RUN chmod +x gradlew && ./gradlew assembleDebug

# 复制构建产物
FROM alpine:latest
COPY --from=0 /app/android/app/build/outputs/apk/debug/app-debug.apk /app.apk
CMD ["echo", "APK built successfully"]
```

### 2. 构建 Docker 镜像

```bash
docker build -t pawsync-pro-builder .
```

### 3. 运行容器并获取 APK

```bash
docker run -it --rm -v $(pwd):/output pawsync-pro-builder sh -c "cp android/app/build/outputs/apk/debug/app-debug.apk /output/"
```

## 手动构建脚本

如果无法使用 Docker，可以使用以下脚本在本地构建：

```bash
#!/bin/bash
set -e

# 检查依赖
command -v java >/dev/null 2>&1 || { echo "Java 未安装" >&2; exit 1; }
command -v gradle >/dev/null 2>&1 || { echo "Gradle 未安装" >&2; exit 1; }

# 设置环境变量
export ANDROID_HOME=${ANDROID_HOME:-/opt/android-sdk}
export ANDROID_SDK_ROOT=$ANDROID_HOME

# 检查 SDK
if [ ! -d "$ANDROID_HOME/platforms/android-36" ]; then
    echo "正在安装 Android SDK..."
    mkdir -p $ANDROID_HOME/cmdline-tools
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O /tmp/cmdline-tools.zip
    unzip -q /tmp/cmdline-tools.zip -d $ANDROID_HOME/cmdline-tools
    mv $ANDROID_HOME/cmdline-tools/cmdline-tools $ANDROID_HOME/cmdline-tools/latest
    yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses
    $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager "platforms;android-36" "build-tools;36.0.0" "platform-tools"
fi

# 构建
cd android
gradle assembleDebug
```

## 使用 GitHub Actions (推荐)

已配置的 GitHub Actions 工作流会自动构建 APK：

1. 推送代码到 main 分支
2. 前往 Actions 页面查看构建状态
3. 下载 APK 工件

## APK 位置

构建成功后，APK 文件位于：

- Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

## 验证 APK

使用 `aapt` 验证 APK 信息：

```bash
aapt dump badging app-debug.apk
```

输出应显示：
- `package: name='com.pawsync.pro'`
- `sdkVersion:'24'`
- `targetSdkVersion:'36'`
- `application-label:'PawSync Pro'`
